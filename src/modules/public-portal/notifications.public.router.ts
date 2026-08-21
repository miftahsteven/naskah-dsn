import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import {
  authenticatePublic,
  type PublicAuthRequest,
} from './middleware.public.js';

const router = Router();

// ── GET NOTIFICATIONS ───────────────────────────────────────────────────────
router.get('/', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;

    const notifications = await prisma.publicNotification.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.publicNotification.count({
      where: { companyId, isRead: false },
    });

    return res.json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat notifikasi.',
      error: error.message,
    });
  }
});

// ── MARK AS READ ────────────────────────────────────────────────────────────
router.patch('/:id/read', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.publicUser!.companyId;

    await prisma.publicNotification.updateMany({
      where: { id: String(id), companyId },
      data: { isRead: true },
    });

    return res.json({
      status: 'success',
      message: 'Notifikasi ditandai telah dibaca.',
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── MARK ALL AS READ ────────────────────────────────────────────────────────
router.patch('/read-all', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;

    await prisma.publicNotification.updateMany({
      where: { companyId, isRead: false },
      data: { isRead: true },
    });

    return res.json({
      status: 'success',
      message: 'Semua notifikasi ditandai telah dibaca.',
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
