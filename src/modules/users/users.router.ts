import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { AuthService } from '../auth/auth.service.js';

const router = Router();

// ── GET ALL USERS ──
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ORG_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        role: true,
        unit: true,
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
    
    // Non-admins can only see themselves
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'ORG_ADMIN' && req.user!.id !== id) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        unit: true,
      },
    });

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    res.json({ status: 'success', data: user });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE USER ──
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'ORG_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName, roleId, unitId, jobTitle } = req.body;

    if (!email || !password || !fullName || !roleId) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already in use' });
    }

    const passwordHash = await AuthService.hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        jobTitle,
        organizationId: req.user!.organizationId,
        roleId,
        unitId,
      },
      include: { role: true },
    });

    res.status(201).json({ status: 'success', data: newUser });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE USER ──
router.patch('/:id', authenticate, authorize(['SUPER_ADMIN', 'ORG_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, roleId, unitId, jobTitle, isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        roleId,
        unitId,
        jobTitle,
        isActive,
      },
      include: { role: true },
    });

    res.json({ status: 'success', data: updatedUser });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── RESET 2FA ──
router.post('/:id/reset-2fa', authenticate, authorize(['SUPER_ADMIN', 'ORG_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    res.json({ status: 'success', message: '2FA has been reset for this user' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
