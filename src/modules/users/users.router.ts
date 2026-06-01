import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, authorize, checkPermission } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { AuthService } from '../auth/auth.service.js';

const router = Router();

// ── GET REFERENCE DATA (departments + jabatan + roles) ──
router.get('/meta', authenticate, checkPermission('USER_ADD'), async (req: AuthRequest, res: Response) => {
  try {
    const [departments, jabatanList, roles] = await Promise.all([
      (prisma as any).department.findMany({ orderBy: { name: 'asc' } }),
      (prisma as any).jabatan.findMany({ orderBy: { name: 'asc' } }),
      prisma.role.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.json({ status: 'success', data: { departments, jabatanList, roles } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET ALL USERS ──
router.get('/', authenticate, checkPermission('USER_EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        role: true,
        unit: true,
        department: true,
        jabatan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: users });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET USER BY ID ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'ORG_ADMIN' && req.user!.id !== id) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      include: { role: true, unit: true, department: true, jabatan: true },
    });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.json({ status: 'success', data: user });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE USER ──
router.post('/', authenticate, checkPermission('USER_ADD'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName, roleId, unitId, jobTitle, phone, departmentId, jabatanId } = req.body;

    if (!email || !password || !fullName || !roleId) {
      return res.status(400).json({ status: 'error', message: 'Email, password, nama lengkap, dan role wajib diisi' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
    }

    const passwordHash = await AuthService.hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        jobTitle: jobTitle || null,
        phone: phone || null,
        organizationId: req.user!.organizationId,
        roleId,
        unitId: unitId || null,
        departmentId: departmentId || null,
        jabatanId: jabatanId || null,
      },
      include: { role: true, department: true, jabatan: true },
    });

    res.status(201).json({ status: 'success', data: newUser });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE USER ──
router.patch('/:id', authenticate, checkPermission('USER_EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, roleId, unitId, jobTitle, phone, departmentId, jabatanId, isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: {
        ...(fullName && { fullName }),
        ...(roleId && { roleId }),
        ...(unitId !== undefined && { unitId: unitId || null }),
        ...(jobTitle !== undefined && { jobTitle: jobTitle || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(jabatanId !== undefined && { jabatanId: jabatanId || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { role: true, department: true, jabatan: true },
    });

    res.json({ status: 'success', data: updatedUser });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE USER (soft delete — set isActive = false) ──
router.delete('/:id', authenticate, checkPermission('USER_DELETE'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user!.id === id) {
      return res.status(400).json({ status: 'error', message: 'Tidak dapat menghapus akun sendiri' });
    }

    await prisma.user.update({
      where: { id: String(id) },
      data: {
        isActive: false,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    res.json({ status: 'success', message: 'User berhasil dinonaktifkan' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CHANGE PASSWORD (admin reset) ──
router.patch('/:id/change-password', authenticate, checkPermission('USER_EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Password baru wajib diisi' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password minimal 8 karakter' });
    }

    // Ensure the target user belongs to the same organization
    const targetUser = await prisma.user.findFirst({
      where: { id: String(id), organizationId: req.user!.organizationId },
    });
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    const passwordHash = await AuthService.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: String(id) },
      data: { passwordHash },
    });

    res.json({ status: 'success', message: 'Password berhasil diubah' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── RESET 2FA ──
router.post('/:id/reset-2fa', authenticate, checkPermission('USER_EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id: String(id) },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    res.json({ status: 'success', message: '2FA berhasil direset untuk user ini' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE PUSH TOKEN (Authenticated) ──
router.post('/push-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ status: 'error', message: 'pushToken is required' });
    }

    // Validate that it looks like an Expo Push Token
    const isExpoToken = pushToken.startsWith('ExponentPushToken[') || pushToken.startsWith('ExpoPushToken[');
    if (!isExpoToken) {
      console.warn(`[Users] Rejected invalid push token for user ${req.user!.id}: ${pushToken}`);
      return res.status(400).json({ status: 'error', message: 'Invalid Expo Push Token format' });
    }
    
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { pushToken },
    });
    
    res.json({ status: 'success', message: 'Push token updated' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
