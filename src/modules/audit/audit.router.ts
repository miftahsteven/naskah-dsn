import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';

const router = Router();

// ── GET AUDIT LOGS ──
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ORG_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, resource, startDate, endDate } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(userId && { userId: String(userId) }),
        ...(action && { action: String(action) }),
        ...(resource && { module: String(resource) }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        }),
      },
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100
    });

    res.json({ status: 'success', data: logs });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UTILITY: RECORD AUDIT LOG ──
export const recordAuditLog = async (data: {
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        action: data.action,
        module: data.resource,
        entityId: data.resourceId ?? null,
        newValue: data.details,
        ipAddress: data.ip ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
};

export default router;
