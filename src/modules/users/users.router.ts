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

// ── GET USER DIRECTORY (Active users for selection/invitations) ──
router.get('/directory', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(req.user?.organizationId ? { organizationId: req.user.organizationId } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        department: { select: { id: true, name: true } },
        jabatan: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    res.json({ status: 'success', data: users });
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

    if (!password || !fullName || !roleId) {
      return res.status(400).json({ status: 'error', message: 'Password, nama lengkap, dan role wajib diisi' });
    }

    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
      }
    }

    const passwordHash = await AuthService.hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email || null,
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
    const { email, fullName, roleId, unitId, jobTitle, phone, departmentId, jabatanId, isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: {
        ...(email !== undefined && { email: email || null }),
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

// ── DELETE USER (Smart Delete: hard delete if clean, soft delete if historical documents exist) ──
router.delete('/:id', authenticate, checkPermission('USER_DELETE'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);

    // Prevent self-deletion
    if (req.user!.id === id) {
      return res.status(400).json({ status: 'error', message: 'Tidak dapat menghapus akun sendiri' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    // Check critical document dependencies (creator, signer, approver)
    const [docCount, sigCount, stepCount] = await Promise.all([
      prisma.document.count({ where: { creatorId: id } }),
      prisma.documentSignature.count({ where: { userId: id } }),
      prisma.documentWorkflowStep.count({ where: { userId: id } }),
    ]);

    if (docCount > 0 || sigCount > 0 || stepCount > 0) {
      // Historical references exist: soft-delete to preserve legal audit trail
      await prisma.user.update({
        where: { id: String(id) },
        data: {
          isActive: false,
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      return res.json({
        status: 'success',
        message: `Akun "${user.fullName}" berhasil dinonaktifkan. Karena pengguna memiliki ${docCount + sigCount + stepCount} riwayat dokumen/persetujuan resmi, data akun dialihkan ke status nonaktif demi menjaga integritas data arsip.`,
        data: { action: 'DEACTIVATED' },
      });
    }

    // No critical document dependencies: clean up ancillary records and permanently delete
    await prisma.$transaction([
      (prisma as any).userRole.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      (prisma as any).userBiometric.deleteMany({ where: { userId: id } }),
      prisma.auditLog.deleteMany({ where: { userId: id } }),
      prisma.disposisiLog.updateMany({ where: { userId: id }, data: { userId: null } }),
      prisma.user.delete({ where: { id: String(id) } }),
    ]);

    return res.json({
      status: 'success',
      message: `Akun "${user.fullName}" berhasil dihapus secara permanen dari sistem.`,
      data: { action: 'DELETED' },
    });
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
