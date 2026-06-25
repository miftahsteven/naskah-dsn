import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';

const router = Router();

// ── GET DASHBOARD STATISTICS ──
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;

    const [
      totalDocs,
      inProgress,
      needsActionSteps,
      signedDocs,
    ] = await Promise.all([
      // 1. Total semua dokumen
      prisma.document.count({ where: { organizationId: orgId } }),
      // 2. Yang sedang dalam proses flow (In Progress)
      prisma.document.count({ 
        where: { 
          organizationId: orgId, 
          status: { in: ['PENDING_APPROVAL', 'REVISION'] } 
        } 
      }),
      // 3. Perlu tindakan (Hanya yang Menunggu TTE/Approval pada step yang aktif)
      prisma.documentWorkflowStep.findMany({
        where: {
          OR: [
            { userId: req.user!.id },
            { AND: [{ userId: null }, { roleId: req.user!.roleId }] }
          ],
          status: 'PENDING',
          workflowInstance: {
            status: 'ACTIVE'
          }
        },
        include: {
          workflowInstance: {
            include: {
              document: {
                select: {
                  approvalFlowType: true
                }
              }
            }
          }
        }
      }),
      // 4. Selesai diproses (SIGNED)
      prisma.document.count({ where: { organizationId: orgId, status: 'SIGNED' } }),
    ]);

    const needsAction = needsActionSteps.filter((step: any) => {
      const wi = step.workflowInstance;
      if (!wi) return false;
      const doc = wi.document;
      if (!doc) return false;
      if (doc.approvalFlowType === 'SEQUENTIAL') {
        return step.stepNumber === wi.currentStep;
      }
      return true;
    }).length;

    res.json({
      status: 'success',
      data: {
        totalDocs,
        inProgress,
        needsAction,
        signedDocs,
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
