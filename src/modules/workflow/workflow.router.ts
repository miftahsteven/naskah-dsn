import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { AuthService } from '../auth/auth.service.js';
import { PushService } from '../../lib/push.js';
import { sendNotification } from '../notifications/notifications.router.js';
import { triggerQueueUpdate } from '../../lib/firebase.js';

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
    const workflow = await prisma.documentWorkflowInstance.create({
      data: {
        documentId,
        status: 'ACTIVE',
        currentStep: 1,
        steps: {
          create: stepConfig.map((s: any) => ({
            stepNumber: s.stepNumber,
            userId: s.userId,
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

    // Notify the first approvers
    const firstApprovers = stepConfig.filter((s: any) => s.stepNumber === 1);
    for (const approver of firstApprovers) {
      if (approver.userId) {
        // Trigger real-time database update immediately (do not await)
        triggerQueueUpdate(approver.userId).catch(() => {});

        // Send notifications asynchronously in parallel
        Promise.all([
          PushService.sendNotification({
            userId: approver.userId,
            title: 'Dokumen Baru untuk Diperiksa',
            body: `Anda memiliki dokumen baru "${doc.title}" yang menunggu tindakan Anda.`,
            data: { documentId: doc.id, type: 'WORKFLOW_PENDING' }
          }).catch(() => {}),
          sendNotification({
            userId: approver.userId,
            type: 'WORKFLOW_PENDING',
            title: 'Dokumen Baru untuk Diperiksa',
            message: `Anda memiliki dokumen baru "${doc.title}" yang menunggu tindakan Anda.`,
            link: `/documents/${doc.id}`
          }).catch(() => {})
        ]).catch(() => {});
      }
    }

    res.status(201).json({ status: 'success', data: workflow });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET APPROVAL QUEUE ──
router.get('/queue', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // 1. Ambil langkah workflow yang ditugasakan ke user atau role-nya
    const queueSteps = await prisma.documentWorkflowStep.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { AND: [{ userId: null }, { roleId: req.user!.roleId }] }
        ],
        status: 'PENDING',
      },
      include: {
        workflowInstance: {
          include: {
            document: {
              include: {
                category: true,
                classification: true,
                creator: { select: { fullName: true } },
                _count: { select: { versions: true } }
              }
            },
            steps: { select: { id: true, status: true, stepNumber: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // 1.5. Ambil riwayat tindakan user ini untuk mendeteksi dokumen yang pernah direvisi olehnya
    const myRevisionHistory = await prisma.documentWorkflowStep.findMany({
      where: {
        userId: req.user!.id,
        status: 'REVISION',
      },
      select: { workflowInstance: { select: { documentId: true } } }
    });
    const revisedDocIds = new Set(myRevisionHistory.map(h => h.workflowInstance.documentId));

    const finalQueueSteps = queueSteps.map((step: any) => ({
      ...step,
      isWasRevisedByMe: revisedDocIds.has(step.workflowInstance.documentId),
      // Overwrite currentVersion in response if _count is higher
      workflowInstance: {
        ...step.workflowInstance,
        document: {
          ...step.workflowInstance.document,
          currentVersion: Math.max(step.workflowInstance.document.currentVersion || 1, step.workflowInstance.document._count.versions)
        }
      }
    }));

    // 2. Ambil dokumen yang memerlukan revisi oleh pembuat (user login)
    const revisionDocs = await prisma.document.findMany({
      where: {
        creatorId: req.user!.id,
        status: 'REVISION'
      },
      include: {
        category: true,
        classification: true,
        creator: { select: { fullName: true } },
        versions: { take: 1, orderBy: { versionNum: 'desc' } },
        workflowInstances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { steps: { select: { id: true, status: true, stepNumber: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // 3. Ambil dokumen yang saat ini dalam status REVISION dan direvisi atas permintaan user ini
    const myRequestedRevisions = await prisma.document.findMany({
      where: {
        status: 'REVISION',
        workflowInstances: {
          some: {
            steps: {
              some: {
                userId: req.user!.id,
                status: 'REVISION'
              }
            }
          }
        }
      },
      include: {
        category: true,
        classification: true,
        creator: { select: { fullName: true } },
        versions: { take: 1, orderBy: { versionNum: 'desc' } },
        workflowInstances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { steps: { select: { id: true, status: true, stepNumber: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Combine revision items: creator revisions + requested revisions
    const allRevisionDocs = [
      ...revisionDocs,
      ...myRequestedRevisions.filter(r => !revisionDocs.some(c => c.id === r.id))
    ];

    // Map all revision documents to match the queue structure
    const revisionItems = allRevisionDocs.map(doc => ({
      id: doc.id, // Use doc ID as unique item ID
      stepNumber: 0, // Special marker for revision
      status: 'REVISION',
      isWasRevisedByMe: doc.creatorId !== req.user!.id,
      workflowInstance: {
        document: doc,
        steps: doc.workflowInstances[0]?.steps || []
      }
    }));

    // Filter queueSteps to only show steps whose turn it is currently (sequential step matching)
    const activeQueueSteps = finalQueueSteps.filter((step: any) => {
      const wi = step.workflowInstance;
      if (!wi) return false;
      if (wi.status !== 'ACTIVE') return false;

      const doc = wi.document;
      if (!doc) return false;

      if (doc.approvalFlowType === 'SEQUENTIAL') {
        return step.stepNumber === wi.currentStep;
      }
      return true;
    });

    // Combine both
    const finalQueue = [...activeQueueSteps, ...revisionItems];

    res.json({ status: 'success', data: finalQueue });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET ACTION HISTORY ──
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN'].includes(req.user!.role);

    const history = await prisma.documentWorkflowStep.findMany({
      where: {
        ...(isAdmin ? {} : { userId: req.user!.id }),
        status: { in: ['APPROVED', 'REJECTED', 'REVISION'] },
      },
      include: {
        workflowInstance: {
          include: {
            document: {
              include: {
                category: true,
                creator: { select: { fullName: true } },
                versions: { take: 1, orderBy: { versionNum: 'desc' } }
              }
            }
          }
        }
      },
      orderBy: { actionedAt: 'desc' },
    });

    res.json({ status: 'success', data: history });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── WORKFLOW ACTION (APPROVE/REJECT/REVISION) ──
router.post('/action', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { stepId, action, comment, pin } = req.body; // action: 'APPROVE', 'REJECT', 'REVISION'


    const step = await prisma.documentWorkflowStep.findUnique({
      where: { id: stepId },
      include: { 
        workflowInstance: {
          include: {
            _count: { select: { steps: true } },
            document: {
              include: {
                creator: { select: { id: true, fullName: true } }
              }
            }
          }
        } 
      },
    });

    const doc = await prisma.document.findUnique({ where: { id: step?.workflowInstance?.documentId || '' } });
    const approvalFlowType = doc?.approvalFlowType || 'SEQUENTIAL';

    if (!step || step.userId !== req.user!.id || step.status !== 'PENDING') {
      return res.status(400).json({ status: 'error', message: 'Langkah tidak valid atau Anda tidak memiliki akses' });
    }

    // ── RBAC Permission Check ──
    if (['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user!.role)) {
      // Admin bypass
    } else {
      if (action === 'APPROVE' && !req.user!.permissions.includes('DOC_APPROVE')) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: Missing DOC_APPROVE permission' });
      }
      if (action === 'REJECT' && !req.user!.permissions.includes('DOC_REJECT')) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: Missing DOC_REJECT permission' });
      }
      if (action === 'REVISION' && !req.user!.permissions.includes('DOC_REVISE')) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: Missing DOC_REVISE permission' });
      }
    }

    // ── PIN VERIFICATION (ONLY FOR APPROVE) ──
    if (action === 'APPROVE') {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        return res.status(400).json({ status: 'error', message: 'User tidak ditemukan' });
      }
      if (!user.pinHash) {
        return res.status(400).json({ status: 'error', message: 'Anda belum mengatur PIN' });
      }

      const isValid = await AuthService.comparePassword(pin, user.pinHash);
      if (!isValid) {
        return res.status(401).json({ status: 'error', message: 'PIN yang Anda masukkan salah' });
      }
    }

    if (action === 'REJECT') {
      await prisma.$transaction([
        prisma.documentWorkflowStep.update({
          where: { id: stepId },
          data: { status: 'REJECTED', comment, actionedAt: new Date() },
        }),
        prisma.documentWorkflowInstance.update({
          where: { id: step.workflowInstanceId },
          data: { status: 'REJECTED' },
        }),
        prisma.document.update({
          where: { id: step.workflowInstance.documentId },
          data: { status: 'REJECTED' },
        }),
      ]);
      res.json({ status: 'success', message: 'Document rejected' });

      // Notify creator
      const docTitle = step.workflowInstance.document.title;
      const creatorId = step.workflowInstance.document.creatorId;

      // Trigger real-time updates immediately (do not await)
      triggerQueueUpdate(creatorId).catch(() => {});
      triggerQueueUpdate(req.user!.id).catch(() => {});

      // Send notifications asynchronously
      Promise.all([
        PushService.sendNotification({
          userId: creatorId,
          title: 'Dokumen Ditolak',
          body: `Dokumen Anda "${docTitle}" telah ditolak oleh ${req.user!.fullName}.`,
          data: { documentId: step.workflowInstance.documentId, type: 'DOC_REJECTED' }
        }).catch(() => {}),
        sendNotification({
          userId: creatorId,
          type: 'DOC_REJECTED',
          title: 'Dokumen Ditolak',
          message: `Dokumen Anda "${docTitle}" telah ditolak oleh ${req.user!.fullName}.`,
          link: `/documents/${step.workflowInstance.documentId}`
        }).catch(() => {})
      ]).catch(() => {});

      return;
    }

    if (action === 'REVISION') {
      await prisma.$transaction([
        prisma.documentWorkflowStep.update({
          where: { id: stepId },
          data: { status: 'REVISION', comment, actionedAt: new Date() },
        }),
        prisma.documentWorkflowInstance.update({
          where: { id: step.workflowInstanceId },
          data: { status: 'REVISION' },
        }),
        prisma.document.update({
          where: { id: step.workflowInstance.documentId },
          data: { status: 'REVISION' },
        }),
      ]);
      res.json({ status: 'success', message: 'Permintaan revisi berhasil dikirim' });

      // Notify creator
      const docTitle = step.workflowInstance.document.title;
      const creatorId = step.workflowInstance.document.creatorId;

      // Trigger real-time updates immediately (do not await)
      triggerQueueUpdate(creatorId).catch(() => {});
      triggerQueueUpdate(req.user!.id).catch(() => {});

      // Send notifications asynchronously
      Promise.all([
        PushService.sendNotification({
          userId: creatorId,
          title: 'Permintaan Revisi',
          body: `Dokumen Anda "${docTitle}" memerlukan revisi dari ${req.user!.fullName}.`,
          data: { documentId: step.workflowInstance.documentId, type: 'DOC_REVISION' }
        }).catch(() => {}),
        sendNotification({
          userId: creatorId,
          type: 'DOC_REVISION',
          title: 'Permintaan Revisi',
          message: `Dokumen Anda "${docTitle}" memerlukan revisi dari ${req.user!.fullName}.`,
          link: `/documents/${step.workflowInstance.documentId}`
        }).catch(() => {})
      ]).catch(() => {});

      return;
    }


    if (action === 'APPROVE') {
      let isAllApproved = false;
      if (approvalFlowType === 'PARALLEL' || approvalFlowType === 'NOTIF_ONLY') {
        const remainingSteps = await prisma.documentWorkflowStep.count({
          where: {
            workflowInstanceId: step.workflowInstanceId,
            status: { not: 'APPROVED' },
            id: { not: stepId }
          }
        });
        isAllApproved = remainingSteps === 0;
      } else {
        isAllApproved = step.stepNumber === step.workflowInstance._count.steps;
      }

      if (isAllApproved) {
        await prisma.$transaction([
          prisma.documentWorkflowStep.update({
            where: { id: stepId },
            data: { status: 'APPROVED', comment, actionedAt: new Date() },
          }),
          prisma.documentWorkflowInstance.update({
            where: { id: step.workflowInstanceId },
            data: { status: 'COMPLETED' },
          }),
          prisma.document.update({
            where: { id: step.workflowInstance.documentId },
            data: { status: 'SIGNED' },
          }),
          prisma.documentSignature.create({
            data: {
              documentId: step.workflowInstance.documentId,
              userId: req.user!.id,
              signedAt: new Date(),
            }
          })
        ]);
        res.json({ status: 'success', message: 'Document fully approved and signed' });

        const docTitle = step.workflowInstance.document.title;
        const creatorId = step.workflowInstance.document.creatorId;

        // Trigger real-time updates immediately (do not await)
        triggerQueueUpdate(creatorId).catch(() => {});
        triggerQueueUpdate(req.user!.id).catch(() => {});

        // Send notifications asynchronously
        Promise.all([
          PushService.sendNotification({
            userId: creatorId,
            title: 'Dokumen Selesai Ditandatangani',
            body: `Dokumen Anda "${docTitle}" telah selesai disetujui oleh semua pihak.`,
            data: { documentId: step.workflowInstance.documentId, type: 'DOC_SIGNED' }
          }).catch(() => {}),
          sendNotification({
            userId: creatorId,
            type: 'DOC_SIGNED',
            title: 'Dokumen Selesai Ditandatangani',
            message: `Dokumen Anda "${docTitle}" telah selesai disetujui oleh semua pihak.`,
            link: `/documents/${step.workflowInstance.documentId}`
          }).catch(() => {})
        ]).catch(() => {});

        return;
      } else {
        if (approvalFlowType === 'SEQUENTIAL') {
          const nextStepNumber = step.stepNumber + 1;
          await prisma.$transaction([
            prisma.documentWorkflowStep.update({
              where: { id: stepId },
              data: { status: 'APPROVED', comment, actionedAt: new Date() },
            }),
            prisma.documentWorkflowStep.updateMany({
              where: { workflowInstanceId: step.workflowInstanceId, stepNumber: nextStepNumber },
              data: { status: 'PENDING' },
            }),
            prisma.documentWorkflowInstance.update({
              where: { id: step.workflowInstanceId },
              data: { currentStep: nextStepNumber },
            }),
            prisma.documentSignature.create({
              data: {
                documentId: step.workflowInstance.documentId,
                userId: req.user!.id,
                signedAt: new Date(),
              }
            })
          ]);

          const nextSteps = await prisma.documentWorkflowStep.findMany({
            where: { workflowInstanceId: step.workflowInstanceId, stepNumber: nextStepNumber, status: 'PENDING' }
          });

          for (const nextStep of nextSteps) {
            if (nextStep.userId) {
              const docTitle = step.workflowInstance.document.title;

              // Trigger real-time database update immediately (do not await)
              triggerQueueUpdate(nextStep.userId).catch(() => {});

              // Send notifications asynchronously
              Promise.all([
                PushService.sendNotification({
                  userId: nextStep.userId,
                  title: 'Giliran Anda Memeriksa Dokumen',
                  body: `Dokumen "${docTitle}" telah disetujui sebelumnya, sekarang giliran Anda.`,
                  data: { documentId: step.workflowInstance.documentId, type: 'WORKFLOW_PENDING' }
                }).catch(() => {}),
                sendNotification({
                  userId: nextStep.userId,
                  type: 'WORKFLOW_PENDING',
                  title: 'Giliran Anda Memeriksa Dokumen',
                  message: `Dokumen "${docTitle}" telah disetujui sebelumnya, sekarang giliran Anda.`,
                  link: `/documents/${step.workflowInstance.documentId}`
                }).catch(() => {})
              ]).catch(() => {});
            }
          }
        } else {
          await prisma.$transaction([
            prisma.documentWorkflowStep.update({
              where: { id: stepId },
              data: { status: 'APPROVED', comment, actionedAt: new Date() },
            }),
            prisma.documentSignature.create({
              data: {
                documentId: step.workflowInstance.documentId,
                userId: req.user!.id,
                signedAt: new Date(),
              }
            })
          ]);
        }

        res.json({ status: 'success', message: 'Step approved' });

        const docTitle = step.workflowInstance.document.title;
        const creatorId = step.workflowInstance.document.creatorId;

        // Trigger real-time updates immediately (do not await)
        triggerQueueUpdate(creatorId).catch(() => {});
        triggerQueueUpdate(req.user!.id).catch(() => {});

        // Send notifications asynchronously
        Promise.all([
          PushService.sendNotification({
            userId: creatorId,
            title: 'Dokumen Disetujui Sebagian',
            body: `Dokumen Anda "${docTitle}" telah disetujui oleh ${req.user!.fullName} dan masih berproses.`,
            data: { documentId: step.workflowInstance.documentId, type: 'DOC_PARTIAL_APPROVE' }
          }).catch(() => {}),
          sendNotification({
            userId: creatorId,
            type: 'DOC_PARTIAL_APPROVE',
            title: 'Dokumen Disetujui Sebagian',
            message: `Dokumen Anda "${docTitle}" telah disetujui oleh ${req.user!.fullName} dan masih berproses.`,
            link: `/documents/${step.workflowInstance.documentId}`
          }).catch(() => {})
        ]).catch(() => {});

        return;
      }
    }

    res.status(400).json({ status: 'error', message: 'Invalid action' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET WORKFLOW STEPS FOR DOCUMENT ──
router.get('/document/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    console.log('📋 Fetching workflow steps for document:', id);

    // Get the latest workflow instance for this document
    const workflowInstance = await prisma.documentWorkflowInstance.findFirst({
      where: { documentId: id },
      include: {
        steps: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                jabatan: { select: { name: true } }
              }
            }
          },
          orderBy: { stepNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!workflowInstance) {
      console.log('⚠️  No workflow instance found for document:', id);
      return res.json({ 
        status: 'success', 
        data: [] // Return empty array if no workflow
      });
    }

    console.log('✅ Found workflow with', workflowInstance.steps.length, 'steps');

    // Transform steps to match frontend expectations
    const steps = workflowInstance.steps.map((step: any) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      status: step.status, // 'PENDING', 'WAITING', 'COMPLETED', 'REVISION'
      label: `Step ${step.stepNumber}${step.user ? ` - ${step.user.fullName}` : ''}`,
      approver: step.user?.fullName || null,
      userId: step.userId,
      comment: step.comment,
      actionedAt: step.actionedAt
    }));

    res.json({ status: 'success', data: steps });
  } catch (error: any) {
    console.error('💥 Error in GET /workflow/document/:id:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE WORKFLOW STEPS FOR DOCUMENT ──
router.put('/document/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stepConfig } = req.body; // stepConfig: [{ stepNumber, userId }]

    if (!id || !stepConfig || !Array.isArray(stepConfig)) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Get the latest workflow instance for this document
    const workflowInstance = await prisma.documentWorkflowInstance.findFirst({
      where: { documentId: String(id) },
      orderBy: { createdAt: 'desc' }
    });

    if (!workflowInstance) {
      return res.status(404).json({ status: 'error', message: 'Workflow tidak ditemukan untuk dokumen ini.' });
    }

    if (workflowInstance.status === 'COMPLETED' || workflowInstance.status === 'REJECTED') {
      return res.status(400).json({ status: 'error', message: 'Workflow sudah selesai atau ditolak, tidak dapat diubah.' });
    }

    // Check if user is creator or admin
    const doc = await prisma.document.findUnique({ where: { id: String(id) } });
    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });
    }

    const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN'].includes(req.user!.role);
    if (doc.creatorId !== req.user!.id && !isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Anda tidak memiliki hak akses untuk mengubah workflow dokumen ini.' });
    }

    // Fetch current workflow steps
    const currentSteps = await prisma.documentWorkflowStep.findMany({
      where: { workflowInstanceId: workflowInstance.id },
      orderBy: { stepNumber: 'asc' }
    });

    // Validate already approved steps are not modified
    const approvedSteps = currentSteps.filter(s => s.status === 'APPROVED');
    for (let i = 0; i < approvedSteps.length; i++) {
      const currentStep = approvedSteps[i];
      if (!currentStep) continue;
      const newStep = stepConfig[i];
      if (!newStep || newStep.userId !== currentStep.userId) {
        return res.status(400).json({
          status: 'error',
          message: `Langkah ke-${currentStep.stepNumber} yang sudah disetujui tidak boleh diubah.`
        });
      }
    }

    // Determine the status of the first unapproved step
    const isRevisionState = doc.status === 'REVISION';
    const activeStepStatus = isRevisionState ? 'REVISION' : 'PENDING';

    const updatedWorkflow = await prisma.$transaction(async (tx) => {
      // 1. Delete all unapproved steps
      await tx.documentWorkflowStep.deleteMany({
        where: {
          workflowInstanceId: workflowInstance.id,
          status: { not: 'APPROVED' }
        }
      });

      // 2. Re-create unapproved steps
      const newStepsData = stepConfig.slice(approvedSteps.length).map((s: any, idx: number) => {
        const stepNum = approvedSteps.length + idx + 1;
        return {
          workflowInstanceId: workflowInstance.id,
          stepNumber: stepNum,
          userId: s.userId,
          status: idx === 0 ? activeStepStatus : 'WAITING',
        };
      });

      if (newStepsData.length > 0) {
        await tx.documentWorkflowStep.createMany({
          data: newStepsData
        });
      }

      // 3. Update currentStep in workflow instance
      const updatedInstance = await tx.documentWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          currentStep: approvedSteps.length + 1
        },
        include: {
          steps: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  jabatan: { select: { name: true } }
                }
              }
            },
            orderBy: { stepNumber: 'asc' }
          }
        }
      });

      return updatedInstance;
    });

    // Notify the first unapproved user if it changed and it is active (PENDING)
    if (activeStepStatus === 'PENDING') {
      const firstUnapprovedNew = stepConfig[approvedSteps.length];
      const firstUnapprovedOld = currentSteps[approvedSteps.length];

      if (firstUnapprovedNew && (!firstUnapprovedOld || firstUnapprovedOld.userId !== firstUnapprovedNew.userId)) {
        await PushService.sendNotification({
          userId: firstUnapprovedNew.userId,
          title: 'Giliran Anda Memeriksa Dokumen',
          body: `Anda ditunjuk untuk memeriksa dokumen "${doc.title}".`,
          data: { documentId: doc.id, type: 'WORKFLOW_PENDING' }
        }).catch(err => console.error("Error sending push:", err));

        await sendNotification({
          userId: firstUnapprovedNew.userId,
          type: 'WORKFLOW_PENDING',
          title: 'Giliran Anda Memeriksa Dokumen',
          message: `Anda ditunjuk untuk memeriksa dokumen "${doc.title}".`,
          link: `/documents/${doc.id}`
        }).catch(err => console.error("Error sending web notification:", err));
      }
    }

    res.json({ status: 'success', data: updatedWorkflow });
  } catch (error: any) {
    console.error('💥 Error in PUT /workflow/document/:id:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;

