import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { PushService } from '../../lib/push.js';
import { sendNotification } from '../notifications/notifications.router.js';
import { triggerQueueUpdate } from '../../lib/firebase.js';

const router = Router();

// ── GET ALL DISPOSISI DOCUMENTS ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        organizationId: req.user!.organizationId,
        disposisiStatus: { not: null }
      },
      include: {
        category: true,
        classification: true,
        creator: { select: { fullName: true, email: true } },
        versions: { orderBy: { versionNum: 'desc' }, take: 1 },
        workflowInstances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            steps: {
              include: { user: { select: { fullName: true } } }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ status: 'success', data: documents });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET DISPOSISI LOGS ──
router.get('/:id/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await prisma.disposisiLog.findMany({
      where: { documentId: String(id) },
      include: { user: { select: { fullName: true, jobTitle: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ status: 'success', data: logs });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE DISPOSISI STATUS (DRAG AND DROP) ──
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'BARU', 'DIPROSES', 'SELESAI'

    const doc = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        workflowInstances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { steps: { orderBy: { stepNumber: 'asc' } } }
        }
      }
    });

    if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found' });

    const currentStatus = doc.disposisiStatus;
    const workflow = (doc as any).workflowInstances?.[0];

    // Log Helper
    const logAction = async (action: string, description: string) => {
      await prisma.disposisiLog.create({
        data: {
          documentId: String(id),
          userId: req.user!.id,
          action,
          description
        }
      });
    };

    // 1. Moving to PROSES
    if (status === 'DIPROSES' && currentStatus !== 'DIPROSES') {
      if (!workflow) {
        return res.status(400).json({ status: 'error', message: 'Dokumen belum memiliki workflow TTE yang di-assign.' });
      }

      await prisma.$transaction([
        prisma.document.update({ 
          where: { id: String(id) }, 
          data: { disposisiStatus: 'DIPROSES', status: 'PENDING_APPROVAL' } 
        }),
        prisma.documentWorkflowInstance.update({
          where: { id: workflow.id },
          data: { status: 'ACTIVE' }
        })
      ]);
      await logAction('MOVED_TO_PROSES', 'Dokumen mulai diproses dan dikirim ke alur TTE.');

      // Notify treasurers when an Invoice document starts its workflow
      const docWithCategory = await prisma.document.findUnique({
        where: { id: String(id) },
        include: { category: true }
      });

      if (docWithCategory?.category?.name?.toLowerCase() === 'invoice') {
        try {
          const treasurers = await prisma.user.findMany({
            where: {
              organizationId: req.user!.organizationId,
              jabatan: {
                name: {
                  contains: 'bendahara',
                  mode: 'insensitive'
                }
              }
            }
          });

          for (const treasurer of treasurers) {
            // Trigger RTDB sync so mobile count updates instantly
            triggerQueueUpdate(treasurer.id).catch(err => console.error("Failed to trigger RTDB update for treasurer", err));

            PushService.sendNotification({
              userId: treasurer.id,
              title: 'Invoice Baru Siap Diperiksa',
              body: `Invoice "${doc.title}" telah didisposisikan dan siap diperiksa.`,
              data: { documentId: doc.id, type: 'INCOMING_INVOICE' }
            }).catch(err => console.error("Failed to send push notification to treasurer", err));

            sendNotification({
              userId: treasurer.id,
              type: 'INCOMING_INVOICE',
              title: 'Invoice Baru Siap Diperiksa',
              message: `Invoice "${doc.title}" telah didisposisikan dan siap diperiksa.`,
              link: `/documents/${doc.id}`
            }).catch(err => console.error("Failed to send web notification to treasurer", err));
          }
        } catch (err) {
          console.error("Error notifying treasurers for new Invoice disposisi:", err);
        }
      }

      // Send notifications to the first step approvers if they haven't approved yet
      const pendingSteps = (workflow.steps as any[]).filter((s: any) => s.status === 'PENDING');
      for (const step of pendingSteps) {
        if (step.userId) {
          // Trigger real-time database sync immediately (do not await)
          triggerQueueUpdate(step.userId).catch(() => {});

          // Trigger push and in-app notifications asynchronously in parallel
          Promise.all([
            PushService.sendNotification({
              userId: step.userId,
              title: 'Dokumen Baru untuk Diperiksa',
              body: `Dokumen "${doc.title}" telah masuk proses TTE and menunggu tindakan Anda.`,
              data: { documentId: doc.id, type: 'WORKFLOW_PENDING' }
            }).catch(() => {}),
            sendNotification({
              userId: step.userId,
              type: 'WORKFLOW_PENDING',
              title: 'Dokumen Baru untuk Diperiksa',
              message: `Dokumen "${doc.title}" telah masuk proses TTE dan menunggu tindakan Anda.`,
              link: `/documents/${doc.id}`
            }).catch(() => {})
          ]).catch(() => {});
        }
      }
    }

    // 2. Moving to SELESAI
    else if (status === 'SELESAI' && currentStatus !== 'SELESAI') {
      if (workflow) {
        // Validate if all steps are completed
        const unapproved = (workflow.steps as any[]).filter((s: any) => s.status !== 'APPROVED');
        if (unapproved.length > 0) {
          return res.status(400).json({ status: 'error', message: 'Tidak dapat dipindah ke SELESAI. Masih ada user yang belum menyelesaikan TTE.' });
        }
      }
      
      await prisma.document.update({ where: { id: String(id) }, data: { disposisiStatus: 'SELESAI' } });
      await logAction('MOVED_TO_SELESAI', 'Proses TTE selesai. Dokumen siap disebarkan.');
    }

    // 3. Moving back to BARU (Urgent Revision)
    else if (status === 'BARU' && currentStatus === 'DIPROSES') {
      await prisma.$transaction(async (tx) => {
        // Update document status
        await tx.document.update({ where: { id: String(id) }, data: { disposisiStatus: 'BARU', status: 'DRAFT' } });
        
        if (workflow) {
          // Reset all steps to PENDING but keep the comments/history
          await tx.documentWorkflowStep.updateMany({
            where: { workflowInstanceId: workflow.id },
            data: { status: 'PENDING' }
          });
          
          // Reset workflow instance step count
          await tx.documentWorkflowInstance.update({
            where: { id: workflow.id },
            data: { currentStep: 1, status: 'PENDING' }
          });
        }
      });
      await logAction('MOVED_TO_BARU', 'Dikembalikan ke BARU karena revisi mendesak. Semua catatan TTE dihapus dan flow diulang.');

      // Trigger real-time Firestore sync for all step users to clean their apps
      if (workflow && workflow.steps) {
        for (const step of workflow.steps as any[]) {
          if (step.userId) {
            await triggerQueueUpdate(step.userId).catch(() => {});
          }
        }
      }
    }

    // 4. Initial Adding to BARU (from document list)
    else if (status === 'BARU' && !currentStatus) {
      await prisma.document.update({ where: { id: String(id) }, data: { disposisiStatus: 'BARU' } });
      await logAction('ADDED_TO_DISPOSISI', 'Dimasukkan ke antrean Kanban Disposisi.');
    }

    res.json({ status: 'success', message: `Status dipindah ke ${status}` });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
