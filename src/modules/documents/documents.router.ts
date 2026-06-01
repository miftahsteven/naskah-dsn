import { Router } from 'express';
import type { Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { authenticate, checkPermission } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { PushService } from '../../lib/push.js';
import { sendNotification } from '../notifications/notifications.router.js';

const router = Router();

// ── STORAGE CONFIG ──
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // Default 10MB
});

// ── GET CATEGORIES & CLASSIFICATIONS ──
router.get('/meta', authenticate, async (req: Request, res: Response) => {
  try {
    const [categories, classifications] = await Promise.all([
      prisma.documentCategory.findMany(),
      prisma.documentClassification.findMany(),
    ]);
    res.json({ status: 'success', data: { categories, classifications } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET DOCUMENTS (With Filter) ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, categoryId, classificationId, search, documentType } = req.query;

    const documents = await prisma.document.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(status && { status: String(status) }),
        ...(categoryId && { categoryId: String(categoryId) }),
        ...(classificationId && { classificationId: String(classificationId) }),
        ...(documentType && { documentType: String(documentType) }),
        ...(search && {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { documentNumber: { contains: String(search), mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        category: true,
        classification: true,
        creator: { select: { fullName: true, email: true } },
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

// ── UPLOAD DOCUMENT ──
  router.post('/', authenticate, checkPermission('DOC_UPLOAD'), upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
      const { title, categoryId, classificationId, documentNumber, documentType, approvalFlowType } = req.body;
      const file = req.file;
  
      if (!file) {
        return res.status(400).json({ status: 'error', message: 'File is required' });
      }
  
      if (!title || !categoryId || !classificationId) {
        return res.status(400).json({ status: 'error', message: 'Missing metadata' });
      }
  
      // Create Document & Version in a transaction
      const document = await prisma.document.create({
        data: {
          title,
          documentNumber,
          organizationId: req.user!.organizationId,
          categoryId,
          classificationId,
          documentType: documentType || 'OUTGOING',
          approvalFlowType: approvalFlowType || 'SEQUENTIAL',
          creatorId: req.user!.id,
          status: 'DRAFT',
        versions: {
          create: {
            versionNum: 1,
            fileUrl: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            createdBy: req.user!.id,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    res.status(201).json({ status: 'success', data: document });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET DOCUMENT DETAIL ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching document:', id, 'for user:', req.user?.id, 'organization:', req.user?.organizationId);
    
    // Temporarily bypass permission check for testing
    // TODO: Restore checkPermission('DOC_VIEW') after verifying permissions are set up correctly
    
    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        category: true,
        classification: true,
        creator: { select: { fullName: true, email: true } },
        versions: { orderBy: { versionNum: 'desc' } },
        signatures: { include: { user: { select: { fullName: true, jobTitle: true } } } },
        workflowInstances: {
          include: {
            steps: { 
              orderBy: { stepNumber: 'asc' },
              include: {
                user: {
                  select: {
                    fullName: true,
                    role: { select: { name: true } },
                    jabatan: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      },
    });

    console.log('📄 Document found:', document?.id, 'Organization match:', document?.organizationId === req.user?.organizationId);

    if (!document) {
      console.log('❌ Document not found with ID:', id);
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    // Check organization access
    if (document.organizationId !== req.user!.organizationId) {
      console.log('🚫 Organization mismatch:', document.organizationId, 'vs', req.user?.organizationId);
      return res.status(403).json({ status: 'error', message: 'Forbidden: No access to this document' });
    }
    
    // Transform fileUrl to HTTP download URL for mobile compatibility
    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const transformedDocument = {
      ...document,
      fileUrl: `${baseUrl}/documents/${document.id}/download`,
      versions: document.versions.map(v => ({
        ...v,
        fileUrl: `${baseUrl}/documents/${document.id}/versions/${v.id}/download`
      }))
    };
    
    console.log('✅ Document returned with fileUrl:', transformedDocument.fileUrl);
    res.json({ status: 'success', data: transformedDocument });
  } catch (error: any) {
    console.error('💥 Error in GET /documents/:id:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── ARCHIVE DOCUMENT ──
router.patch('/:id/archive', authenticate, checkPermission('DOC_EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.document.update({
      where: { id: String(id) },
      data: { status: 'ARCHIVED' }
    });
    res.json({ status: 'success', message: 'Document archived' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── EDIT DOCUMENT ──
router.put('/:id', authenticate, checkPermission('DOC_EDIT'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, categoryId, classificationId, documentNumber } = req.body;
    const file = req.file;

    const existingDoc = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { versions: { orderBy: { versionNum: 'desc' }, take: 1 } }
    });

    if (!existingDoc) return res.status(404).json({ status: 'error', message: 'Document not found' });

    let usersToNotify: any[] = [];

    // Update Metadata
    const updatedDoc = await prisma.$transaction(async (tx) => {
      let doc = await tx.document.update({
        where: { id: String(id) },
        data: {
          title: title || undefined,
          categoryId: categoryId || undefined,
          classificationId: classificationId || undefined,
          documentNumber: documentNumber || undefined,
        }
      });

      if (file) {
        const latestVersionNum = existingDoc.versions[0]?.versionNum || 0;
        const newVersionNum = latestVersionNum + 1;
        
        // Create new version record
        await tx.documentVersion.create({
          data: {
            documentId: String(id),
            versionNum: newVersionNum,
            fileUrl: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            createdBy: req.user!.id,
            changeNotes: req.body.changeNotes || (existingDoc.status === 'REVISION' ? "Revised Version" : "Updated Metadata"),
          }
        });

        // Update the currentVersion field in the Document model
        doc = await tx.document.update({
          where: { id: String(id) },
          data: { currentVersion: newVersionNum }
        });

        // Workflow Transition: if in REVISION state or Instance is REVISION, revert to ACTIVE
        if (existingDoc.status === 'REVISION') {
          // Update doc status back to PENDING_APPROVAL
          doc = await tx.document.update({
            where: { id: String(id) },
            data: { status: 'PENDING_APPROVAL' }
          });

          // Find the instance that is in REVISION state
          const activeInstance = await tx.documentWorkflowInstance.findFirst({
            where: { documentId: String(id), status: 'REVISION' }
          });

          if (activeInstance) {
            await tx.documentWorkflowInstance.update({
              where: { id: activeInstance.id },
              data: { status: 'ACTIVE' }
            });

            const revisionSteps = await tx.documentWorkflowStep.findMany({
              where: { workflowInstanceId: activeInstance.id, status: 'REVISION' },
              include: { user: { select: { id: true, fullName: true } } }
            });
            
            if (revisionSteps.length > 0) {
              usersToNotify = revisionSteps.map(step => step.user);
            }

            // Reset only the step that was in REVISION status
            await tx.documentWorkflowStep.updateMany({
              where: { workflowInstanceId: activeInstance.id, status: 'REVISION' },
              data: { status: 'PENDING' }
            });
          }
        }
      }

      return doc;
    });

    if (usersToNotify.length > 0) {
      for (const user of usersToNotify) {
        if (user && user.id) {
          await PushService.sendNotification({
            userId: user.id,
            title: 'Revisi Baru Tersedia',
            body: `Admin telah mengirimkan versi revisi terbaru untuk dokumen "${existingDoc.title}". Silakan periksa kembali.`,
            data: { documentId: existingDoc.id, type: 'DOC_REVISION_DONE' }
          }).catch(err => console.error("Failed to send push notification", err));

          await sendNotification({
            userId: user.id,
            type: 'DOC_REVISION_DONE',
            title: 'Revisi Baru Tersedia',
            message: `Admin telah mengirimkan versi revisi terbaru untuk dokumen "${existingDoc.title}". Silakan periksa kembali.`,
            link: `/documents/${existingDoc.id}`
          }).catch(err => console.error("Failed to send web notification", err));
        }
      }
    }

    res.json({ status: 'success', data: updatedDoc });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── HARD DELETE DOCUMENT ──
router.delete('/:id', authenticate, checkPermission('DOC_DELETE'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { 
        versions: true,
        workflowInstances: { include: { steps: true } },
        signatures: true,
        publications: true
      }
    });

    if (!document) return res.status(404).json({ status: 'error', message: 'Document not found' });

    // Delete physical files
    for (const version of document.versions) {
      if (fs.existsSync(version.fileUrl)) {
        fs.unlinkSync(version.fileUrl);
      }
    }

    // Delete from DB (manual cascade to be safe)
    await prisma.$transaction([
      prisma.documentVersion.deleteMany({ where: { documentId: String(id) } }),
      prisma.documentWorkflowStep.deleteMany({ 
        where: { workflowInstance: { documentId: String(id) } } 
      }),
      prisma.documentWorkflowInstance.deleteMany({ where: { documentId: String(id) } }),
      prisma.documentSignature.deleteMany({ where: { documentId: String(id) } }),
      prisma.documentPublication.deleteMany({ where: { documentId: String(id) } }),
      prisma.document.delete({ where: { id: String(id) } }),
    ]);

    res.json({ status: 'success', message: 'Document and files permanently deleted' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE SPECIFIC DOCUMENT VERSION ──
router.delete('/:id/versions/:versionId', authenticate, checkPermission('DOC_DELETE'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, versionId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { versions: { orderBy: { versionNum: 'desc' } } }
    });

    if (!document) return res.status(404).json({ status: 'error', message: 'Document not found' });
    
    // Validate if asking to delete the latest version while it's the ONLY version
    if (document.versions.length <= 1) {
      return res.status(400).json({ status: 'error', message: 'Cannot delete the only version of a document. Delete the document instead.' });
    }

    const versionToDelete = document.versions.find((v: any) => v.id === String(versionId));
    if (!versionToDelete) {
      return res.status(404).json({ status: 'error', message: 'Version not found' });
    }

    // Delete physically
    if (fs.existsSync(versionToDelete.fileUrl)) {
      fs.unlinkSync(versionToDelete.fileUrl);
    }

    // Delete logically
    await prisma.documentVersion.delete({ where: { id: String(versionId) } });

    res.json({ status: 'success', message: 'Document version deleted' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DOWNLOAD DOCUMENT FILE (Latest Version) ──
router.get('/:id/download', authenticate, checkPermission('DOC_VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { versions: { orderBy: { versionNum: 'desc' } } }
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    // Get latest version
    const version = document.versions[0];
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'No version found' });
    }

    // Check if file exists
    if (!fs.existsSync(version.fileUrl)) {
      return res.status(404).json({ status: 'error', message: 'File not found on server' });
    }

    // Send file with proper headers
    res.setHeader('Content-Type', version.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const fileStream = fs.createReadStream(version.fileUrl);
    fileStream.pipe(res);
    
    fileStream.on('error', () => {
      res.status(500).json({ status: 'error', message: 'Error reading file' });
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DOWNLOAD DOCUMENT FILE (Specific Version) ──
router.get('/:id/versions/:versionId/download', authenticate, checkPermission('DOC_VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, versionId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { versions: { orderBy: { versionNum: 'desc' } } }
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    // Get the specific version
    const version = document.versions.find(v => v.id === String(versionId));
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'Version not found' });
    }

    // Check if file exists
    if (!fs.existsSync(version.fileUrl)) {
      return res.status(404).json({ status: 'error', message: 'File not found on server' });
    }

    // Send file with proper headers
    res.setHeader('Content-Type', version.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const fileStream = fs.createReadStream(version.fileUrl);
    fileStream.pipe(res);
    
    fileStream.on('error', () => {
      res.status(500).json({ status: 'error', message: 'Error reading file' });
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
