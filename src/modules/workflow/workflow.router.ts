import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── SUBMIT DOCUMENT FOR APPROVAL ──
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, stepConfig } = req.body; // stepConfig: [{ userId, stepNumber }]

    if (!documentId || !stepConfig || !Array.isArray(stepConfig)) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Check if document exists and is in DRAFT
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.status !== 'DRAFT') {
      return res.status(400).json({ status: 'error', message: 'Document invalid or not in draft status' });
    }

    // Create workflow instance and steps
    const workflow = await prisma.workflowInstance.create({
      data: {
        documentId,
        status: 'PENDING',
        currentStep: 1,
        totalSteps: stepConfig.length,
        steps: {
          create: stepConfig.map((s: any) => ({
            stepNumber: s.stepNumber,
            approverId: s.userId,
            status: s.stepNumber === 1 ? 'PENDING' : 'WAITING',
          })),
        },
      },
    });

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PENDING_APPROVAL' },
    });

    res.status(201).json({ status: 'success', data: workflow });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET APPROVAL QUEUE ──
router.get('/queue', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const queue = await prisma.workflowStep.findMany({
      where: {
        approverId: req.user!.id,
        status: 'PENDING',
      },
      include: {
        instance: {
          include: {
            document: {
              include: {
                category: true,
                classification: true,
                creator: { select: { fullName: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ status: 'success', data: queue });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── WORKFLOW ACTION (APPROVE/REJECT) ──
router.post('/action', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { stepId, action, comment } = req.body; // action: 'APPROVE' or 'REJECT'

    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: { instance: true },
    });

    if (!step || step.approverId !== req.user!.id || step.status !== 'PENDING') {
      return res.status(400).json({ status: 'error', message: 'Invalid step or unauthorized' });
    }

    if (action === 'REJECT') {
      await prisma.$transaction([
        prisma.workflowStep.update({
          where: { id: stepId },
          data: { status: 'REJECTED', comment, actionDate: new Date() },
        }),
        prisma.workflowInstance.update({
          where: { id: step.instanceId },
          data: { status: 'REJECTED' },
        }),
        prisma.document.update({
          where: { id: step.instance.documentId },
          data: { status: 'REJECTED' },
        }),
      ]);
      return res.json({ status: 'success', message: 'Document rejected' });
    }

    if (action === 'APPROVE') {
      const isLastStep = step.stepNumber === step.instance.totalSteps;

      if (isLastStep) {
        await prisma.$transaction([
          prisma.workflowStep.update({
            where: { id: stepId },
            data: { status: 'APPROVED', comment, actionDate: new Date() },
          }),
          prisma.workflowInstance.update({
            where: { id: step.instanceId },
            data: { status: 'COMPLETED' },
          }),
          prisma.document.update({
            where: { id: step.instance.documentId },
            data: { status: 'SIGNED' }, // Simplified: moving directly to signed for now
          }),
          // Create digital signature record
          prisma.digitalSignature.create({
            data: {
              documentId: step.instance.documentId,
              userId: req.user!.id,
              signatureType: 'E_SIGN',
              status: 'COMPLETED',
              signedAt: new Date(),
            }
          })
        ]);
        return res.json({ status: 'success', message: 'Document fully approved and signed' });
      } else {
        // Move to next step
        const nextStepNumber = step.stepNumber + 1;
        await prisma.$transaction([
          prisma.workflowStep.update({
            where: { id: stepId },
            data: { status: 'APPROVED', comment, actionDate: new Date() },
          }),
          prisma.workflowStep.updateMany({
            where: { instanceId: step.instanceId, stepNumber: nextStepNumber },
            data: { status: 'PENDING' },
          }),
          prisma.workflowInstance.update({
            where: { id: step.instanceId },
            data: { currentStep: nextStepNumber },
          }),
        ]);
        return res.json({ status: 'success', message: 'Step approved and moved to next approver' });
      }
    }

    res.status(400).json({ status: 'error', message: 'Invalid action' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
