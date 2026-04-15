import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── GET DASHBOARD STATISTICS ──
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;

    const [
      totalDocs,
      pendingApprovals,
      signedDocs,
      rejectedDocs,
      totalUsers,
    ] = await Promise.all([
      prisma.document.count({ where: { organizationId: orgId } }),
      prisma.document.count({ where: { organizationId: orgId, status: 'PENDING_APPROVAL' } }),
      prisma.document.count({ where: { organizationId: orgId, status: 'SIGNED' } }),
      prisma.document.count({ where: { organizationId: orgId, status: 'REJECTED' } }),
      prisma.user.count({ where: { organizationId: orgId } }),
    ]);

    res.json({
      status: 'success',
      data: {
        totalDocs,
        pendingApprovals,
        signedDocs,
        rejectedDocs,
        totalUsers,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET RECENT ACTIVITIES ──
router.get('/recent-activities', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const activities = await prisma.auditLog.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ status: 'success', data: activities });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
