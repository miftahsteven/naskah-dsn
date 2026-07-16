
import { calculateAttendees } from '../meeting/meeting.router.js';

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
import { triggerQueueUpdate } from '../../lib/firebase.js';

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
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 }, // Default 100MB
});

// ── GENERATE DOCUMENT NUMBER ──
// Returns the next sequential document number for the current year
// Format: XXX/KODE/DSN-MUI/MM/YYYY
// Resets to 001 every new year
router.get('/generate-number', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { templateCode } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Count documents created in the current year for this organization
    const startOfYear = new Date(currentYear, 0, 1); // Jan 1
    const endOfYear = new Date(currentYear + 1, 0, 1); // Jan 1 next year

    const docCount = await prisma.document.count({
      where: {
        organizationId: req.user!.organizationId,
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
    });

    // Next number is count + 1, formatted as 3-digit zero-padded
    const nextNumber = (docCount + 1).toString().padStart(3, '0');

    // Roman numeral month for standard Indonesian government format
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const monthRoman = romanMonths[currentMonth - 1];

    // Template code mapping for standard letter types
    const codeMap: Record<string, string> = {
      rutin: 'SR',
      pengantar: 'SP',
      keputusan: 'SK',
      mandat: 'SM',
      tugas: 'ST',
      informasi: 'SI',
    };

    const code = codeMap[String(templateCode || '')] || String(templateCode || 'SR').toUpperCase();

    // Standard format: 001/SK/DSN-MUI/VI/2026
    const documentNumber = `${nextNumber}/${code}/DSN-MUI/${monthRoman}/${currentYear}`;

    res.json({
      status: 'success',
      data: {
        documentNumber,
        sequenceNumber: nextNumber,
        templateCode: code,
        month: monthRoman,
        monthNumeric: currentMonth.toString().padStart(2, '0'),
        year: currentYear,
        totalThisYear: docCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
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
        status: status ? String(status) : { not: 'ARCHIVED' },
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
        versions: { orderBy: { versionNum: 'desc' } },
        workflowInstances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            steps: {
              include: { user: { select: { fullName: true } } }
            }
          }
        },
        meetings: {
          orderBy: { dateTime: 'asc' }
        },
        evidenceFiles: {
          select: { id: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform fileUrl to HTTP/HTTPS download URL for consistency & mobile compatibility
    const protoHeader = req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}/api`;

    const transformedDocs = documents.map(doc => ({
      ...doc,
      fileUrl: `${baseUrl}/documents/${doc.id}/download`,
      versions: doc.versions.map(v => ({
        ...v,
        fileUrl: `${baseUrl}/documents/${doc.id}/versions/${v.id}/download`
      }))
    }));

    res.json({ status: 'success', data: transformedDocs });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPLOAD DOCUMENT ──
  router.post('/', authenticate, checkPermission('DOC_UPLOAD'), upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
      const { title, categoryId, classificationId, documentNumber, documentType, approvalFlowType, status, documentDate, receivedDate } = req.body;
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
          documentNumber: documentNumber ? String(documentNumber).trim() || null : null,
          organizationId: req.user!.organizationId,
          categoryId,
          classificationId,
          documentType: documentType || 'OUTGOING',
          approvalFlowType: approvalFlowType || 'SEQUENTIAL',
          creatorId: req.user!.id,
          status: status || 'DRAFT',
          documentDate: documentDate ? new Date(documentDate) : null,
          receivedDate: receivedDate ? new Date(receivedDate) : null,
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
        },
        meetings: {
          orderBy: { dateTime: 'asc' }
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
    
    // Transform fileUrl to HTTP/HTTPS download URL for mobile compatibility
    const protoHeader = req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}/api`;
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

// ── RESTORE DOCUMENT ──
router.patch('/:id/restore', authenticate, checkPermission('DOC_EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { workflowInstances: true }
    });

    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    const hasCompletedWorkflow = doc.workflowInstances.some(w => w.status === 'COMPLETED');
    const restoredStatus = hasCompletedWorkflow ? 'SIGNED' : 'DRAFT';

    await prisma.document.update({
      where: { id: String(id) },
      data: { status: restoredStatus }
    });
    res.json({ status: 'success', message: 'Document restored', restoredStatus });
  } catch (error: any) {
    res.status(550).json({ status: 'error', message: error.message });
  }
});

// ── EDIT DOCUMENT ──
router.put('/:id', authenticate, checkPermission('DOC_EDIT'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, categoryId, classificationId, documentNumber, status, documentDate, receivedDate } = req.body;
    const file = req.file;

    const existingDoc = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { versions: { orderBy: { versionNum: 'desc' }, take: 1 } }
    });

    if (!existingDoc) return res.status(404).json({ status: 'error', message: 'Document not found' });

    let usersToNotify: any[] = [];

    // Update Metadata
    const updatedDoc = await prisma.$transaction(async (tx) => {
      if (status === 'DRAFT') {
        const instances = await tx.documentWorkflowInstance.findMany({
          where: { documentId: String(id) },
          select: { id: true }
        });
        const instanceIds = instances.map(inst => inst.id);
        
        if (instanceIds.length > 0) {
          await tx.documentWorkflowStep.deleteMany({
            where: { workflowInstanceId: { in: instanceIds } }
          });
          await tx.documentWorkflowInstance.deleteMany({
            where: { id: { in: instanceIds } }
          });
        }
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (categoryId) updateData.categoryId = categoryId;
      if (classificationId) updateData.classificationId = classificationId;
      if (documentNumber !== undefined) updateData.documentNumber = documentNumber || null;
      if (status) updateData.status = status;
      if (documentDate !== undefined) {
        updateData.documentDate = documentDate ? new Date(documentDate) : null;
      }
      if (receivedDate !== undefined) {
        updateData.receivedDate = receivedDate ? new Date(receivedDate) : null;
      }

      let doc = await tx.document.update({
        where: { id: String(id) },
        data: updateData
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


// ── GET EVIDENCE FOLDERS AND FILES ──
router.get('/:id/evidence', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parentId = req.query.parentId && req.query.parentId !== 'null' ? String(req.query.parentId) : null;

    // Verify document belongs to user's organization
    const doc = await prisma.document.findUnique({ where: { id: String(id) } });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found' });
    if (doc.organizationId !== req.user!.organizationId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const folders = await prisma.evidenceFolder.findMany({
      where: { documentId: String(id), parentId: parentId },
      orderBy: { name: 'asc' }
    });

    const files = await prisma.evidenceFile.findMany({
      where: { documentId: String(id), folderId: parentId },
      include: { uploader: { select: { fullName: true } } },
      orderBy: { name: 'asc' }
    });

    const breadcrumbs = [];
    if (parentId) {
      let currentFolder = await prisma.evidenceFolder.findUnique({ where: { id: parentId } });
      while (currentFolder) {
        breadcrumbs.unshift({ id: currentFolder.id, name: currentFolder.name });
        if (currentFolder.parentId) {
          currentFolder = await prisma.evidenceFolder.findUnique({ where: { id: currentFolder.parentId } });
        } else {
          break;
        }
      }
    }

    const protoHeader = req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}/api`;

    const transformedFiles = files.map(file => ({
      ...file,
      fileUrl: `${baseUrl}/documents/${id}/evidence/files/${file.id}/download`,
    }));

    res.json({
      status: 'success',
      data: { folders, files: transformedFiles, breadcrumbs }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE EVIDENCE FOLDER ──
router.post('/:id/evidence/folders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;

    if (!name) return res.status(400).json({ status: 'error', message: 'Folder name is required' });

    const doc = await prisma.document.findUnique({ where: { id: String(id) } });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found' });
    if (doc.organizationId !== req.user!.organizationId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const folder = await prisma.evidenceFolder.create({
      data: {
        name,
        documentId: String(id),
        parentId: parentId && parentId !== 'null' ? String(parentId) : null
      }
    });

    res.status(201).json({ status: 'success', data: folder });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPLOAD EVIDENCE FILE ──
router.post('/:id/evidence/files', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ status: 'error', message: 'File is required' });

    const doc = await prisma.document.findUnique({ where: { id: String(id) } });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found' });
    if (doc.organizationId !== req.user!.organizationId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const evidenceFile = await prisma.evidenceFile.create({
      data: {
        name: file.originalname,
        fileUrl: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentId: String(id),
        folderId: folderId && folderId !== 'null' ? String(folderId) : null,
        uploaderId: req.user!.id
      },
      include: { uploader: { select: { fullName: true } } }
    });

    const protoHeader = req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}/api`;

    const transformedFile = {
      ...evidenceFile,
      fileUrl: `${baseUrl}/documents/${id}/evidence/files/${evidenceFile.id}/download`,
    };

    res.status(201).json({ status: 'success', data: transformedFile });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DOWNLOAD EVIDENCE FILE ──
router.get('/:id/evidence/files/:fileId/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;

    const evidenceFile = await prisma.evidenceFile.findUnique({ where: { id: String(fileId) } });
    if (!evidenceFile) return res.status(404).json({ status: 'error', message: 'File not found' });
    if (!fs.existsSync(evidenceFile.fileUrl)) {
      return res.status(404).json({ status: 'error', message: 'Physical file not found' });
    }

    res.setHeader('Content-Type', evidenceFile.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${evidenceFile.name}"`);

    const fileStream = fs.createReadStream(evidenceFile.fileUrl);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE EVIDENCE FILE ──
router.delete('/:id/evidence/files/:fileId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.evidenceFile.findUnique({ where: { id: String(fileId) } });
    if (!file) return res.status(404).json({ status: 'error', message: 'File not found' });

    if (fs.existsSync(file.fileUrl)) {
      fs.unlinkSync(file.fileUrl);
    }

    await prisma.evidenceFile.delete({ where: { id: String(fileId) } });
    res.json({ status: 'success', message: 'File deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE EVIDENCE FOLDER ──
router.delete('/:id/evidence/folders/:folderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { folderId } = req.params;
    const folder = await prisma.evidenceFolder.findUnique({ where: { id: String(folderId) } });
    if (!folder) return res.status(404).json({ status: 'error', message: 'Folder not found' });

    const deleteFolderFilesPhysically = async (fid: string) => {
      const files = await prisma.evidenceFile.findMany({ where: { folderId: fid } });
      for (const file of files) {
        if (fs.existsSync(file.fileUrl)) {
          fs.unlinkSync(file.fileUrl);
        }
      }
      const subfolders = await prisma.evidenceFolder.findMany({ where: { parentId: fid } });
      for (const sub of subfolders) {
        await deleteFolderFilesPhysically(sub.id);
      }
    };

    await deleteFolderFilesPhysically(String(folderId));
    await prisma.evidenceFolder.delete({ where: { id: String(folderId) } });
    res.json({ status: 'success', message: 'Folder and contents deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET MEETINGS LINKED TO DOCUMENT ──
router.get('/:id/meetings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const meetings = await prisma.meeting.findMany({
      where: { documentId: String(id) },
      orderBy: { dateTime: 'desc' }
    });
    res.json({ status: 'success', data: meetings });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE MEETING & LINK TO DOCUMENT ──
router.post('/:id/meetings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, dateTime, endDateTime, location, description, targetType, departmentId, customAttendeeIds, externalEmails } = req.body;
    let { agendaNumber } = req.body;

    if (!title || !dateTime || !location || !targetType) {
      return res.status(400).json({ status: 'error', message: 'Missing fields' });
    }

    const doc = await prisma.document.findUnique({ where: { id: String(id) } });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found' });

    // Auto-generate agendaNumber if not provided
    if (!agendaNumber) {
      const meetingDate = new Date(dateTime);
      const year = meetingDate.getFullYear();
      const month = meetingDate.getMonth() + 1;

      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);

      const meetingCount = await prisma.meeting.count({
        where: {
          createdAt: {
            gte: startOfYear,
            lt: endOfYear
          }
        }
      });
      const seqMeeting = (meetingCount + 1).toString().padStart(3, '0');

      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const monthRoman = romanMonths[month - 1];

      let docNumPart = '000';
      if (doc.documentNumber) {
        const parts = doc.documentNumber.split('/');
        if (parts.length > 0) {
          docNumPart = parts[0] || '000';
        }
      }

      agendaNumber = `${seqMeeting}/${monthRoman}/${year}/${docNumPart}`;

      // Check unique constraint
      const existing = await prisma.meeting.findUnique({ where: { agendaNumber } });
      if (existing) {
        agendaNumber = `${seqMeeting}-${Date.now()}/${monthRoman}/${year}/${docNumPart}`;
      }
    } else {
      const existing = await prisma.meeting.findUnique({ where: { agendaNumber } });
      if (existing) return res.status(400).json({ status: 'error', message: 'Agenda number already in use' });
    }

    const resolvedAttendees = await calculateAttendees(String(targetType), departmentId ? String(departmentId) : undefined, customAttendeeIds, externalEmails);

    const newMeeting = await prisma.meeting.create({
      data: {
        title,
        agendaNumber: agendaNumber || null,
        dateTime: new Date(dateTime),
        endDateTime: endDateTime ? new Date(endDateTime) : null,
        location,
        description: description || null,
        targetType: targetType.toUpperCase(),
        departmentId: departmentId || null,
        status: 'DRAFT',
        attendees: resolvedAttendees,
        documentId: String(id)
      }
    });

    res.status(201).json({ status: 'success', data: newMeeting });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── LINK EXISTING MEETING TO DOCUMENT ──
router.post('/:id/meetings/:meetingId/link', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, meetingId } = req.params;

    const updated = await prisma.meeting.update({
      where: { id: String(meetingId) },
      data: { documentId: String(id) }
    });

    res.json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});



// ── UNLINK MEETING FROM DOCUMENT ──
router.delete('/:id/meetings/:meetingId/link', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.params;

    const updated = await prisma.meeting.update({
      where: { id: String(meetingId) },
      data: { documentId: null }
    });

    res.json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


export default router;
