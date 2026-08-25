
import { calculateAttendees } from '../meeting/meeting.router.js';

import { Router } from 'express';
import type { Response, Request } from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { prisma } from '../../lib/prisma.js';
import { authenticate, checkPermission } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { PushService } from '../../lib/push.js';
import { sendNotification } from '../notifications/notifications.router.js';
import { triggerQueueUpdate } from '../../lib/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
import qrcode from 'qrcode';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

function getApiBaseUrl(req: Request) {
  const rawProtoHeader = req.get('x-forwarded-proto') || req.get('x-forwarded-protocol');
  const headerValue: string = typeof rawProtoHeader === 'string' ? rawProtoHeader : '';
  const protocol = (headerValue.split(',')[0] ?? '').trim();
  let resolvedProtocol = protocol || (req.secure ? 'https' : req.protocol);

  if (process.env.NODE_ENV === 'production' && resolvedProtocol === 'http') {
    resolvedProtocol = 'https';
  }

  return `${resolvedProtocol}://${req.get('host')}/api`;
}

function escapeHtml(text: string) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const HTML_PDF_PRIMARY_COLOR = '#2563eb';

let cachedKopSuratBase64: string | null = null;
let cachedBismillahBase64: string | null = null;
let cachedLogoDsnBase64: string | null = null;
let cachedWqaUkasBase64: string | null = null;

export function getStaticImageBase64(filename: string, mimeType: string): string {
  try {
    const candidates = [
      path.join(process.cwd(), 'public/images', filename),
      path.join(process.cwd(), 'public', filename),
      path.join(process.cwd(), '../frontend/public/images', filename),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p);
        return `data:${mimeType};base64,${data.toString('base64')}`;
      }
    }
  } catch (e) {
    console.warn(`[getStaticImageBase64] Failed to load ${filename}:`, e);
  }
  return `/images/${filename}`;
}

export function getKopSuratBase64(): string {
  if (!cachedKopSuratBase64) {
    cachedKopSuratBase64 = getStaticImageBase64('kop-surat.png', 'image/png');
  }
  return cachedKopSuratBase64;
}

export function getBismillahBase64(): string {
  if (!cachedBismillahBase64) {
    cachedBismillahBase64 = getStaticImageBase64('bismillah.svg', 'image/svg+xml');
  }
  return cachedBismillahBase64;
}

export function getLogoDsnBase64(): string {
  if (!cachedLogoDsnBase64) {
    cachedLogoDsnBase64 = getStaticImageBase64('logo-dsn.png', 'image/png');
  }
  return cachedLogoDsnBase64;
}

export function getWqaUkasBase64(): string {
  if (!cachedWqaUkasBase64) {
    cachedWqaUkasBase64 = getStaticImageBase64('wqa-ukas.png', 'image/png');
  }
  return cachedWqaUkasBase64;
}

export async function mergePdfWithEvidence(
  mainPdfBuffer: Buffer,
  evidenceFiles: { id: string; name: string; fileUrl: string; mimeType: string }[]
): Promise<Buffer> {
  if (!evidenceFiles || evidenceFiles.length === 0) {
    return mainPdfBuffer;
  }

  try {
    const mergedPdf = await PDFDocument.load(mainPdfBuffer, { ignoreEncryption: true });

    for (const file of evidenceFiles) {
      let actualPath = file.fileUrl;
      if (!path.isAbsolute(actualPath)) {
        actualPath = path.resolve(process.cwd(), actualPath);
      }
      if (!fs.existsSync(actualPath)) {
        const altPath = path.resolve(process.cwd(), 'uploads', path.basename(file.fileUrl));
        if (fs.existsSync(altPath)) {
          actualPath = altPath;
        } else {
          console.warn(`[mergePdfWithEvidence] Evidence file not found on disk: ${file.fileUrl}`);
          continue;
        }
      }

      const fileBytes = await fs.promises.readFile(actualPath);
      const ext = path.extname(file.name || actualPath).toLowerCase();
      const mime = (file.mimeType || '').toLowerCase();

      if (mime === 'application/pdf' || ext === '.pdf') {
        try {
          const donorPdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
          const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (donorErr) {
          console.error(`[mergePdfWithEvidence] Failed to copy pages from ${file.name}:`, donorErr);
        }
      } else if (
        mime.startsWith('image/') ||
        ['.png', '.jpg', '.jpeg'].includes(ext)
      ) {
        try {
          let embeddedImage;
          if (mime === 'image/png' || ext === '.png') {
            embeddedImage = await mergedPdf.embedPng(fileBytes);
          } else {
            embeddedImage = await mergedPdf.embedJpg(fileBytes);
          }

          const { width, height } = embeddedImage.scale(1);
          const pageWidth = 595.28;
          const pageHeight = 841.89;
          const margin = 30;
          const maxW = pageWidth - margin * 2;
          const maxH = pageHeight - margin * 2;
          const scaleFactor = Math.min(maxW / width, maxH / height, 1);
          const drawW = width * scaleFactor;
          const drawH = height * scaleFactor;

          const page = mergedPdf.addPage([pageWidth, pageHeight]);
          page.drawImage(embeddedImage, {
            x: (pageWidth - drawW) / 2,
            y: (pageHeight - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        } catch (imgErr) {
          console.error(`[mergePdfWithEvidence] Failed to embed image ${file.name}:`, imgErr);
        }
      }
    }

    const mergedBytes = await mergedPdf.save();
    return Buffer.from(mergedBytes);
  } catch (err) {
    console.error('[mergePdfWithEvidence] Merging failed, returning main PDF buffer:', err);
    return mainPdfBuffer;
  }
}

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

    // Roman numeral month for standard Indonesian government format
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const monthRoman = romanMonths[currentMonth - 1];

    const nextNumber = (docCount + 1).toString().padStart(4, '0');
    const documentNumber = `U-${nextNumber}/DSN-MUI/${monthRoman}/${currentYear}`;
    const code = 'U';

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

// ── PUBLIC DOCUMENT VERIFICATION ENDPOINT ──
router.get('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        category: true,
        classification: true,
        organization: true,
        creator: { select: { fullName: true, email: true } },
        signatures: {
          include: {
            user: { select: { fullName: true, email: true, jobTitle: true } }
          },
          orderBy: { signedAt: 'asc' }
        },
        workflowInstances: {
          include: {
            steps: {
              include: {
                user: { select: { fullName: true, email: true, jobTitle: true } }
              }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan' });
    }

    res.json({
      status: 'success',
      data: {
        id: document.id,
        title: document.title,
        documentNumber: document.documentNumber,
        category: document.category.name,
        classification: document.classification.name,
        organization: document.organization.name,
        status: document.status,
        createdAt: document.createdAt,
        creator: document.creator.fullName,
        signatures: document.signatures.map(s => ({
          userId: s.userId,
          fullName: s.user.fullName,
          email: s.user.email,
          jobTitle: s.user.jobTitle || 'Pejabat',
          signedAt: s.signedAt
        })),
        workflowSteps: document.workflowInstances[0]?.steps.map(s => ({
          fullName: s.user?.fullName || 'Pejabat',
          jobTitle: s.user?.jobTitle || s.roleId || 'Pejabat',
          status: s.status,
          actionedAt: s.actionedAt
        })) || []
      }
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
    const baseUrl = getApiBaseUrl(req);

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
router.post('/', authenticate, checkPermission('DOC_UPLOAD'), upload.any(), async (req: AuthRequest, res: Response) => {
  try {
    const { title, categoryId, subCategory, classificationId, documentNumber, documentType, approvalFlowType, status, documentDate, receivedDate } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];
    const mainFile = req.file || files.find((f) => f.fieldname === 'file') || files[0];

    if (!mainFile) {
      return res.status(400).json({ status: 'error', message: 'File is required' });
    }

    if (!title || !categoryId || !classificationId) {
      return res.status(400).json({ status: 'error', message: 'Missing metadata' });
    }

    // Check if document number is already taken to prevent database constraints crashes
    if (documentNumber && String(documentNumber).trim()) {
      const existingDocNum = await prisma.document.findUnique({
        where: { documentNumber: String(documentNumber).trim() }
      });
      if (existingDocNum) {
        return res.status(400).json({
          status: 'error',
          message: 'Nomor surat sudah terdaftar di sistem. Harap gunakan nomor surat yang berbeda.'
        });
      }
    }

    const supportingFiles = files.filter(
      (f) =>
        f !== mainFile &&
        (f.fieldname === 'dokumenPendukung' ||
          f.fieldname === 'evidenceFile' ||
          f.fieldname === 'supportingDocument' ||
          f.fieldname.startsWith('dokumenPendukung'))
    );

    const createData: any = {
      title,
      documentNumber: documentNumber ? String(documentNumber).trim() || null : null,
      organizationId: req.user!.organizationId,
      categoryId,
      subCategory: subCategory || null,
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
          fileUrl: mainFile.path,
          fileName: mainFile.originalname,
          fileSize: mainFile.size,
          mimeType: mainFile.mimetype,
          createdBy: req.user!.id,
        },
      },
    };

    if (supportingFiles.length > 0) {
      createData.evidenceFiles = {
        create: supportingFiles.map((sf) => ({
          name: sf.originalname,
          fileUrl: sf.path,
          fileSize: sf.size,
          mimeType: sf.mimetype,
          uploaderId: req.user!.id,
        })),
      };
    }

    // Create Document & Version in a transaction
    const document = await prisma.document.create({
      data: createData,
      include: {
        versions: true,
        evidenceFiles: true,
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
        evidenceFiles: { orderBy: { createdAt: 'asc' } },
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
    const baseUrl = getApiBaseUrl(req);
    const transformedDocument = {
      ...document,
      fileUrl: `${baseUrl}/documents/${document.id}/download`,
      versions: document.versions.map(v => ({
        ...v,
        fileUrl: `${baseUrl}/documents/${document.id}/versions/${v.id}/download`
      })),
      evidenceFiles: (document.evidenceFiles || []).map(ef => ({
        ...ef,
        fileUrl: `${baseUrl}/documents/${document.id}/evidence/files/${ef.id}/download`
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
    const { title, categoryId, subCategory, classificationId, documentNumber, status, documentDate, receivedDate } = req.body;
    const file = req.file;

    const existingDoc = await prisma.document.findUnique({
      where: { id: String(id) },
      include: { versions: { orderBy: { versionNum: 'desc' }, take: 1 } }
    });

    if (!existingDoc) return res.status(404).json({ status: 'error', message: 'Document not found' });

    // Check if document number is being changed to an already existing one
    if (documentNumber && String(documentNumber).trim() && String(documentNumber).trim() !== existingDoc.documentNumber) {
      const duplicateDoc = await prisma.document.findUnique({
        where: { documentNumber: String(documentNumber).trim() }
      });
      if (duplicateDoc) {
        return res.status(400).json({
          status: 'error',
          message: 'Nomor surat sudah terdaftar di sistem. Harap gunakan nomor surat yang berbeda.'
        });
      }
    }

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
      if (subCategory !== undefined) updateData.subCategory = subCategory || null;
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

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function launchPuppeteerBrowser() {
  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else {
    const commonPaths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/headless-shell'
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        launchOptions.executablePath = p;
        break;
      }
    }
  }

  return await puppeteer.launch(launchOptions);
}

function resolveExistingFilePath(fileUrl: string): string | null {
  if (!fileUrl) return null;

  const filename = path.basename(fileUrl);
  const candidates = [
    path.isAbsolute(fileUrl) ? fileUrl : null,
    path.resolve(process.cwd(), fileUrl),
    path.resolve(process.cwd(), 'backend', fileUrl),
    path.resolve(process.cwd(), uploadDir, filename),
    path.resolve(process.cwd(), 'backend', uploadDir, filename),
    path.resolve(process.cwd(), 'uploads', filename),
    path.resolve(process.cwd(), 'backend/uploads', filename),
    path.resolve(__dirname, '../../uploads', filename),
    path.resolve(__dirname, '../../../uploads', filename),
    path.resolve(__dirname, '../../../../uploads', filename),
  ].filter(Boolean) as string[];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }
  return null;
}

async function ensureExistingFilePath(fileUrl: string, docId?: string, authHeader?: string): Promise<string | null> {
  const local = resolveExistingFilePath(fileUrl);
  if (local) return local;

  const filename = path.basename(fileUrl);
  const targetPath = path.resolve(process.cwd(), 'uploads', filename);
  try {
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Try 1: If docId is provided, fetch rendered HTML from production
    if (docId) {
      const prodRenderUrl = `https://amanah.dsnmui.or.id/api/documents/${encodeURIComponent(docId)}/render`;
      const res = await fetch(prodRenderUrl, { headers });
      if (res.ok) {
        const text = await res.text();
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.promises.writeFile(targetPath, text, 'utf8');
        return targetPath;
      }

      // Try download endpoint as fallback
      const prodDownloadUrl = `https://amanah.dsnmui.or.id/api/documents/${encodeURIComponent(docId)}/download`;
      const dlRes = await fetch(prodDownloadUrl, { headers });
      if (dlRes.ok) {
        const buffer = Buffer.from(await dlRes.arrayBuffer());
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.promises.writeFile(targetPath, buffer);
        return targetPath;
      }
    }

    // Try 2: Direct upload URL
    const prodUploadUrl = `https://amanah.dsnmui.or.id/uploads/${filename}`;
    const directRes = await fetch(prodUploadUrl, { headers });
    if (directRes.ok) {
      const buffer = Buffer.from(await directRes.arrayBuffer());
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, buffer);
      return targetPath;
    }
  } catch (err) {
    console.warn(`[Sync] Failed to fetch missing file ${filename} from production:`, err);
  }
  return null;
}

function injectSignatureQrIntoHtml(htmlContent: string, row: any, baseUrl: string): { html: string; injected: boolean } {
  const candidates = row.candidates || [];
  let bestMatch: { m: RegExpExecArray, cand: string, score: number, index: number } | null = null;

  for (const cand of candidates) {
    const tokens = cand
      .split(/[\s,.]+/)
      .filter((t: string) => t.length >= 3 && !/^(dr|kh|prof|drs|h|lc|phd|ma|sh|mag|msi|ir|se|ag)$/i.test(t));
    
    if (tokens.length > 0) {
      const patternStr = tokens.map((t: string) => escapeRegExp(t)).join('[\\s\\S]{0,80}?');
      const nameRegex = new RegExp(patternStr, 'gi'); 
      let m: RegExpExecArray | null;
      
      while ((m = nameRegex.exec(htmlContent)) !== null) {
        const prefix = htmlContent.substring(0, m.index);
        
        // Skip if inside <script> or <style>
        if (prefix.lastIndexOf('<script') > prefix.lastIndexOf('</script>') ||
            prefix.lastIndexOf('<style') > prefix.lastIndexOf('</style>')) {
          continue;
        }

        const wideSlice = prefix.slice(Math.max(0, prefix.length - 600));
        const closeSlice = prefix.slice(Math.max(0, prefix.length - 200));

        let score = 0;

        // Negative indicators: Attachment headers (Lampiran 1/Lampiran I), lists, colons like "Wakil Ketua :"
        if (/Lampiran\s+[0-9I|IVX]+/i.test(prefix)) score -= 100;
        if (/Wakil\s*(?:Ketua|Sekretaris)\s*:/i.test(wideSlice)) score -= 100;
        if (/:\s*(<[^>]+>\s*)*$/.test(closeSlice) || /:\s*$/.test(prefix.trim())) score -= 100;
        if (/<li[^>]*>/i.test(closeSlice) && !/<\/li>/i.test(closeSlice)) score -= 50;
        if (/<blockquote/i.test(closeSlice) && !/<\/blockquote>/i.test(closeSlice)) score -= 50;

        // Positive indicators: Signature table, role headers, height spacers, placeholder
        if (/(?:Ketua|Sekretaris|Direktur|Pimpinan|Kepala|Menyetujui|Mengetahui|Ketum|Sekjen)/i.test(wideSlice)) score += 30;
        if (/(?:<br\s*\/?>\s*){2,}/i.test(wideSlice)) score += 15;
        if (/margin-bottom:\s*\d{2,}px/i.test(wideSlice)) score += 25;
        if (/<div[^>]*style="[^"]*height:\s*\d{2,}px/i.test(wideSlice)) score += 25;
        if (/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->/i.test(wideSlice)) score += 30;

        // Matching specific role
        if (row.roleName) {
          const rRegex = new RegExp(escapeRegExp(row.roleName), 'i');
          if (rRegex.test(wideSlice)) score += 20;
        }

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { m, cand, score, index: m.index };
        }
      }
    }
  }

  const logoBase64 = getLogoDsnBase64();
  const logoImg = logoBase64 
    ? `<img src="${logoBase64}" alt="Logo" style="width:16px !important; height:16px !important; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2; background:#fff; border-radius:50%; padding:2px; object-fit:contain; border:1px solid #1F3F23;" />`
    : `<img src="${baseUrl}/images/logo-dsn.png" alt="Logo" style="width:16px !important; height:16px !important; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2; background:#fff; border-radius:50%; padding:2px; object-fit:contain; border:1px solid #1F3F23;" />`;

  const qrImageHtml = `<div style="text-align:left; margin:-12px 0 4px 0; line-height:1; display:block; position:relative; width:60px; height:60px;"><img src="${row.qrDataUrl}" alt="QR Signature" class="qr-signature-img" style="width:60px !important; height:60px !important; min-width:60px !important; min-height:60px !important; object-fit:contain !important; display:block !important; position:absolute; top:0; left:0; z-index:1;" />${logoImg}</div>`;

  if (bestMatch && bestMatch.score > 0) {
    const matchIndex = bestMatch.m.index;
    const prefix = htmlContent.substring(0, matchIndex);

    const lastOpenTagIndex = prefix.lastIndexOf('<');
    let targetIndex = matchIndex;
    if (lastOpenTagIndex !== -1) {
      const tagSub = prefix.substring(lastOpenTagIndex);
      if (/^<(span|u|b|strong|div|p)[^>]*>/i.test(tagSub)) {
        targetIndex = lastOpenTagIndex;
      }
    }

    const realPrefix = htmlContent.substring(0, targetIndex);
    let suffix = htmlContent.substring(targetIndex);
    suffix = suffix.replace(/^([^>]+style="[^"]*)(?:margin-top|padding-top):\s*\d+px;?/i, "$1margin-top: 2px;");

    const sliceLen = Math.min(600, realPrefix.length);
    const prefixBase = realPrefix.slice(0, realPrefix.length - sliceLen);
    const lastSlice = realPrefix.slice(realPrefix.length - sliceLen);

    // If QR placeholder or existing qr-signature-img is already here, skip duplicate injection
    if (lastSlice.includes('qr-signature-img')) {
      return { html: htmlContent, injected: true };
    }

    if (/(<div[^>]*style="[^"]*height:\s*\d+px[^"]*"[^>]*>\s*<\/div>)/gi.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/(<div[^>]*style="[^"]*height:\s*\d+px[^"]*"[^>]*>\s*<\/div>)/gi, qrImageHtml);
      return { html: prefixBase + updatedSlice + suffix, injected: true };
    } else if (/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->/gi.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->/gi, qrImageHtml);
      return { html: prefixBase + updatedSlice + suffix, injected: true };
    } else if (/margin-bottom:\s*\d+px/i.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/margin-bottom:\s*\d+px/gi, 'margin-bottom: 4px');
      return { html: prefixBase + updatedSlice + qrImageHtml + suffix, injected: true };
    } else {
      const lastBrMatches = [...lastSlice.matchAll(/(?:<br\s*\/?>\s*){2,}/gi)];
      if (lastBrMatches.length > 0) {
        const lastBrMatch = lastBrMatches[lastBrMatches.length - 1];
        if (lastBrMatch && typeof lastBrMatch.index === 'number') {
          const bPrefix = lastSlice.substring(0, lastBrMatch.index);
          const bSuffix = lastSlice.substring(lastBrMatch.index + lastBrMatch[0].length);
          const updatedSlice = bPrefix + qrImageHtml + bSuffix;
          return { html: prefixBase + updatedSlice + suffix, injected: true };
        }
      }
      return { html: realPrefix + qrImageHtml + suffix, injected: true };
    }
  }

  // ── SAFE FALLBACK: Target specific role titles in main signature block (before Lampiran) ──
  const isKetua = row.signerIndex === 0 || /ketua|ketum/i.test(row.roleName || '') || /cholil|nafis/i.test((row.candidates || []).join(' '));
  const targetRole = isKetua ? '(?:Ketua|Menyetujui|Ketum)' : '(?:Sekretaris|Mengetahui|Sekjen)';

  // Find targetRole before any Lampiran
  const lampiranMatch = htmlContent.match(/Lampiran\s+[0-9I|IVX]+/i);
  const lampiranIndex = lampiranMatch ? lampiranMatch.index : -1;
  const searchContent = lampiranIndex !== -1 ? htmlContent.substring(0, lampiranIndex) : htmlContent;

  const roleRegex = new RegExp(`(${targetRole}\\s*,?\\s*(?:<[^>]+>|\\s)*?)(?:<div[^>]*style="[^"]*height:[^"]*"[^>]*>\\s*<\\/div>|(?:<br\\s*\\/?>\\s*){2,})`, 'i');
  const roleMatch = roleRegex.exec(searchContent);
  if (roleMatch) {
    const idx = roleMatch.index;
    const matchLen = roleMatch[0].length;
    const p = htmlContent.substring(0, idx);
    const s = htmlContent.substring(idx + matchLen);
    return { html: p + roleMatch[1] + qrImageHtml + s, injected: true };
  }

  return { html: htmlContent, injected: false };
}

async function injectSignaturesToHtml(rawHtml: string, signatures: any[], baseUrl: string): Promise<string> {
  const signedSigs = (signatures || []).filter((s: any) => s.signedAt);

  // Parse metadata from HTML
  let templateVariables: any = {};
  let penandatanganSteps: any[] = [];
  const metaMatch = rawHtml.match(/<script id="template-metadata" type="application\/json">\s*([\s\S]*?)\s*<\/script>/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1] || '{}');
      templateVariables = meta.templateVariables || {};
      penandatanganSteps = (meta.steps || []).filter((st: any) => st.role === 'PENANDATANGAN');
    } catch (e) {
      console.warn("Failed to parse template metadata in injectSignaturesToHtml:", e);
    }
  }

  // Only inject QR codes for PENANDATANGAN (final signers), never for PEMPARAF or APPROVER.
  const penandatanganUserIds = penandatanganSteps.map((st: any) => st.userId).filter(Boolean);
  const signerSigs = penandatanganUserIds.length > 0
    ? signedSigs.filter((s: any) => penandatanganUserIds.includes(s.userId))
    : signedSigs;

  let documentNumber = '';
  if (signedSigs.length > 0 && signedSigs[0].documentId) {
    try {
      const { prisma } = await import('../../lib/prisma.js');
      const docInfo = await prisma.document.findUnique({
        where: { id: signedSigs[0].documentId },
        select: { documentNumber: true }
      });
      documentNumber = docInfo?.documentNumber || '';
    } catch(e) {
      console.warn("Failed to fetch documentNumber for QR:", e);
    }
  }

  const signatureRows = await Promise.all(signerSigs.map(async (s: any) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://amanah.dsnmui.or.id';
    const payload = `${frontendUrl}/verify/document/${s.documentId}`;
    
    const qrDataUrl = await qrcode.toDataURL(payload, {
      margin: 0,
      width: 240,
      color: { dark: '#1F3F23', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    });

    const signerIndex = penandatanganSteps.findIndex((st: any) => st.userId === s.userId);

    // Build comprehensive candidates list for name matching
    const candidates: string[] = [];
    if (s.user?.fullName) {
      candidates.push(s.user.fullName);
      const cleanName = s.user.fullName
        .replace(/\b(Dr|K\.?H|Prof|Drs|H|Lc|Ph\.?D|M\.?A|S\.?H|M\.?Si|Ir|M\.?Ag|S\.?Ag|S\.?E)\b\.?/gi, '')
        .replace(/[\s,.]+/g, ' ')
        .trim();
      if (cleanName && cleanName.length >= 3) {
        candidates.push(cleanName);
      }
    }
    
    const userLower = (s.user?.fullName || '').toLowerCase();
    const isUserKetua = userLower.includes('cholil') || userLower.includes('nafis') || userLower.includes('hasanuddin');
    const isUserSekretaris = userLower.includes('amirsyah') || userLower.includes('tambunan') || userLower.includes('anwar');

    if (templateVariables) {
      if (isUserKetua && templateVariables.namaKetua) candidates.push(templateVariables.namaKetua);
      if (isUserSekretaris && templateVariables.namaSekretaris) candidates.push(templateVariables.namaSekretaris);
      if (templateVariables.namaPenandatangan) candidates.push(templateVariables.namaPenandatangan);
      if (signerIndex === 0 && templateVariables.namaKetua) candidates.push(templateVariables.namaKetua);
      if (signerIndex === 1 && templateVariables.namaSekretaris) candidates.push(templateVariables.namaSekretaris);
    }
    
    // Fallbacks for known signers if they use weird accounts
    if (isUserKetua || /ketua/i.test(s.user?.jobTitle || '')) {
      candidates.push("CHOLIL NAFIS");
      candidates.push("HASANUDDIN");
    } else if (isUserSekretaris || /sekretaris/i.test(s.user?.jobTitle || '')) {
      candidates.push("AMIRSYAH TAMBUNAN");
      candidates.push("ANWAR ABBAS");
    } else {
      if (templateVariables.namaKetua && signerIndex === 0) candidates.push(templateVariables.namaKetua);
      if (templateVariables.namaSekretaris && signerIndex === 1) candidates.push(templateVariables.namaSekretaris);
    }

    let resolvedRole = s.user?.jobTitle;
    if (!resolvedRole) {
      if (isUserKetua) resolvedRole = 'Ketua';
      else if (isUserSekretaris) resolvedRole = 'Sekretaris';
      else resolvedRole = signerIndex === 0 ? 'Ketua' : 'Sekretaris';
    }

    return {
      signerIndex,
      fullName: escapeHtml(s.user?.fullName || 'Penandatangan'),
      jobTitle: escapeHtml(s.user?.jobTitle || 'Pejabat'),
      roleName: resolvedRole,
      signedAt: escapeHtml(new Date(s.signedAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'long',
        timeStyle: 'short'
      })),
      candidates,
      qrDataUrl,
    };
  }));

  // Clean up any previously misplaced QR codes in Lampiran before injecting fresh QR codes
  let htmlContent = rawHtml;
  htmlContent = htmlContent.replace(/<div style="text-align:left;[^>]*><img[^>]*class="qr-signature-img"[^>]*><img[^>]*alt="Logo"[^>]*><\/div>/g, '');
  htmlContent = htmlContent.replace(/<div style="text-align:center;[^>]*><img[^>]*class="qr-signature-img"[^>]*><img[^>]*alt="Logo"[^>]*><\/div>/g, '');

  const kopBase64 = getKopSuratBase64();
  const bismillahBase64 = getBismillahBase64();
  const logoBase64 = getLogoDsnBase64();
  const wqaBase64 = getWqaUkasBase64();

  // Retroactively resolve un-interpolated HEADER_HTML strings in static document HTML files
  const kopPlaceholderRegex = /(\\?\${HEADER_HTML}|\${HEADER_HTML})/g;
  if (kopPlaceholderRegex.test(htmlContent)) {
    const headerReplacement = `<div style="text-align: center; margin-bottom: 4px; margin-left: -30px; margin-right: -30px; padding-top: 10px;">
    <img src="${kopBase64}" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 750px; height: auto; display: block; margin: 0 auto;" />
  </div>

  <!-- Bismillah Calligraphy -->
  <div style="text-align: center; margin-top: 2px; margin-bottom: 6px;">
    <img src="${bismillahBase64}" alt="Bismillah" style="height: 35px; object-fit: contain; filter: brightness(0); display: block; margin: 0 auto;" />
  </div>`;
    htmlContent = htmlContent.replace(kopPlaceholderRegex, headerReplacement);
  }

  // Replace any relative or absolute image references with self-contained Base64 Data URLs
  htmlContent = htmlContent.replace(/src=["'][^"']*kop-surat\.png["']/gi, `src="${kopBase64}" class="kop-surat-img"`);
  htmlContent = htmlContent.replace(/src=["'][^"']*bismillah\.svg["']/gi, `src="${bismillahBase64}"`);
  htmlContent = htmlContent.replace(/src=["'][^"']*logo-dsn\.png["']/gi, `src="${logoBase64}"`);
  htmlContent = htmlContent.replace(/src=["'][^"']*wqa-ukas\.png["']/gi, `src="${wqaBase64}"`);

  if (!/<!doctype html>/i.test(htmlContent)) htmlContent = `<!doctype html>\n${htmlContent}`;
  if (!/<base[^>]*href=[\"'][^\"']+[\"'][^>]*>/i.test(htmlContent)) {
    htmlContent = htmlContent.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
  }

  // Inject CSS rules to scale down large logo images in the letterhead and guarantee QR code display
  const imageStyle = `
    <style id="amanah-kop-styles">
      @page {
        size: A4;
        margin: 15mm 15mm 8mm 15mm !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.35 !important;
      }
      /* Outer container padding top override */
      div[style*="padding: 25px 40px 10px 40px"], 
      div[style*="padding: 25px 40px 10px 40px;"] {
        padding-top: 0px !important;
        line-height: 1.35 !important;
      }
      /* General line height override */
      div, p, span, td {
        line-height: 1.35 !important;
      }
      /* Space-saving overrides for paragraphs and margins */
      p {
        margin-top: 0px !important;
        margin-bottom: 4px !important;
      }
      /* Margins of meta/date blocks */
      div[style*="margin-bottom: 10px"] {
        margin-bottom: 4px !important;
      }
      table[style*="margin-bottom: 12px"], 
      div[style*="margin-bottom: 12px"] {
        margin-bottom: 4px !important;
      }
      /* Jadwal table spacing and padding override */
      table[style*="margin: 8px auto"] {
        margin: 2px auto !important;
      }
      table[style*="margin: 8px auto"] td {
        padding: 2px 0 !important;
      }
      /* Bismillah size and margins override */
      img[src*="bismillah"], img[alt*="Bismillah"] {
        height: 35px !important;
        max-height: 40px !important;
        display: block !important;
        margin: 0 auto !important;
      }
      div[style*="margin-top: 6px"][style*="margin-bottom: 12px"] {
        margin-top: 2px !important;
        margin-bottom: 4px !important;
      }
      /* Signature table spacing override */
      table[style*="margin-top: 15px"], 
      table[style*="margin-top: 30px"] {
        margin-top: 6px !important;
      }
      /* Signature container width & headerTtd font size override */
      div[style*="width: 280px"] {
        width: 310px !important;
      }
      div[style*="font-size: 10pt"][style*="margin-bottom: 10px"],
      div[style*="font-size: 10pt"][style*="margin-bottom: 6px"] {
        font-size: 9pt !important;
        margin-bottom: 4px !important;
        line-height: 1.2 !important;
      }
      /* Signature spacer height override */
      div[style*="height: 70px"] {
        height: 55px !important;
      }
      /* Logo inside signature */
      div[style*="width: 60px"] img[src*="logo-dsn"],
      div[style*="width: 70px"] img[src*="logo-dsn"] {
        width: 16px !important;
        height: 16px !important;
      }
      .kop-surat img:not(.kop-surat-img):not([alt*="Kop Surat"]), 
      td img:not(.qr-signature-img):not(.kop-surat-img):not([alt*="Kop Surat"]) {
        max-width: 75px !important;
        max-height: 90px !important;
        height: auto !important;
        width: auto !important;
        display: inline-block !important;
        vertical-align: middle !important;
      }
      .kop-surat-img, img[alt*="Kop Surat"] {
        width: 100% !important;
        max-width: 750px !important;
        height: auto !important;
        display: block !important;
        margin: 0 auto !important;
      }
      img.qr-signature-img {
        width: 60px !important;
        height: 60px !important;
        max-width: 60px !important;
        max-height: 60px !important;
        min-width: 60px !important;
        min-height: 60px !important;
        display: inline-block !important;
        object-fit: contain !important;
      }
      /* Force negative margin to pull QR Code up into jabatan */
      div[style*="width: 60px"][style*="height: 60px"],
      div[style*="width: 70px"][style*="height: 70px"] {
        margin: -12px 0 4px 0 !important;
        width: 60px !important;
        height: 60px !important;
      }
    </style>
  `;
  htmlContent = htmlContent.replace('</head>', `${imageStyle}\n</head>`);

  if (signatureRows.length > 0) {
    signatureRows.forEach(row => {
      // Pass baseUrl to injectSignatureQrIntoHtml
      const res = injectSignatureQrIntoHtml(htmlContent, row, baseUrl);
      if (res.injected) {
        htmlContent = res.html;
      }
    });
  }

  // Merge the line break for any existing documents' headerTtd to keep it exactly 2 lines
  htmlContent = htmlContent.replace(/DEWAN SYARIAH NASIONAL-MAJELIS\s*<br\s*\/?>\s*ULAMA INDONESIA/gi, 'DEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA');
  htmlContent = htmlContent.replace(/DEWAN SYARIAH NASIONAL-MAJELIS\s*\n\s*ULAMA INDONESIA/gi, 'DEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA');

  return htmlContent;
}

// ── RENDER DOCUMENT HTML (with QR codes, for client-side PDF conversion) ──
// This endpoint always returns the processed HTML (with signatures injected).
// The frontend uses html2pdf.js to convert to PDF client-side so we never depend on Puppeteer.
router.get('/:id/render', authenticate, checkPermission('DOC_VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        versions: { orderBy: { versionNum: 'desc' } },
        signatures: {
          include: {
            user: { select: { fullName: true, email: true, jobTitle: true } }
          }
        },
        workflowInstances: {
          include: {
            steps: {
              where: { status: 'APPROVED' },
              include: {
                user: { select: { fullName: true, email: true, jobTitle: true } }
              }
            }
          }
        }
      }
    });

    if (!document) {
      const cleanId = String(id).replace(/^.*[/\\]/, '').replace(/\.(html?|pdf)$/i, '');
      document = await prisma.document.findFirst({
        where: {
          OR: [
            { id: String(id) },
            { documentNumber: String(id) },
            { documentNumber: cleanId },
            { versions: { some: { fileUrl: { contains: cleanId } } } }
          ]
        },
        include: {
          versions: { orderBy: { versionNum: 'desc' } },
          signatures: {
            include: {
              user: { select: { fullName: true, email: true, jobTitle: true } }
            }
          },
          workflowInstances: {
            include: {
              steps: {
                where: { status: 'APPROVED' },
                include: {
                  user: { select: { fullName: true, email: true, jobTitle: true } }
                }
              }
            }
          }
        }
      });
    }

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    const version = document.versions[0];
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'No version found' });
    }

    const filePath = await ensureExistingFilePath(version.fileUrl, document.id, req.headers.authorization);
    if (!filePath) {
      return res.status(404).json({ status: 'error', message: 'Berkas tidak ditemukan di server.' });
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    const isHtml = version.mimeType === 'text/html' || fileExtension === '.html' || fileExtension === '.htm';

    if (!isHtml) {
      return res.status(400).json({ status: 'error', message: 'Document is not an HTML template.' });
    }

    // Combine document.signatures with approved workflow steps as fallback for older documents
    const allSignatures: any[] = [...(document.signatures || [])];
    if (document.workflowInstances) {
      document.workflowInstances.forEach((wf: any) => {
        (wf.steps || []).forEach((st: any) => {
          if (st.status === 'APPROVED' && st.userId && (!st.roleId || st.roleId === 'PENANDATANGAN')) {
            const exists = allSignatures.some((sig: any) => sig.userId === st.userId);
            if (!exists) {
              allSignatures.push({
                id: st.id,
                documentId: document.id,
                userId: st.userId,
                signedAt: st.actionedAt || st.updatedAt || new Date(),
                user: st.user
              });
            }
          }
        });
      });
    }

    const rawHtml = await fs.promises.readFile(filePath, 'utf8');
    // Use HTTP base URL so all images (like logos) load correctly in html2pdf
    const httpUrlBase = getApiBaseUrl(req) + '/';
    const htmlContent = await injectSignaturesToHtml(rawHtml, allSignatures, httpUrlBase);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.end(htmlContent);
  } catch (error: any) {
    console.error('[Document Render] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DOWNLOAD DOCUMENT FILE (Latest Version) ──
router.get('/:id/download', authenticate, checkPermission('DOC_VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        versions: { orderBy: { versionNum: 'desc' } },
        signatures: {
          include: {
            user: { select: { fullName: true, email: true, jobTitle: true } }
          }
        },
        evidenceFiles: { orderBy: { createdAt: 'asc' } },
        workflowInstances: {
          include: {
            steps: {
              where: { status: 'APPROVED' },
              include: {
                user: { select: { fullName: true, email: true, jobTitle: true } }
              }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    // Get latest version
    const version = document.versions[0];
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'No version found' });
    }

    const filePath = await ensureExistingFilePath(version.fileUrl, document.id, req.headers.authorization);
    if (!filePath) {
      console.error(`❌ Download failed: file missing for fileUrl ${version.fileUrl}`);
      res.status(404).setHeader('Content-Type', 'application/json');
      return res.json({ status: 'error', message: 'Berkas tidak ditemukan di server. Silakan unggah ulang dokumen.' });
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    const isHtml = version.mimeType === 'text/html' || fileExtension === '.html' || fileExtension === '.htm';
    const previewMode = String(req.query.preview) === 'html';

    if (isHtml) {
      // Convert HTML to PDF with embedded QR codes for signed signatures, or return HTML preview if requested.
      try {
        const rawHtml = await fs.promises.readFile(filePath, 'utf8');
        const baseDir = path.dirname(filePath);
        const fileUrlBase = new URL(`file://${path.resolve(baseDir)}/`).href;
        const httpUrlBase = getApiBaseUrl(req) + '/';
        const baseUrl = httpUrlBase;

        // Combine document.signatures with approved workflow steps as fallback
        const allSignatures: any[] = [...(document.signatures || [])];
        if (document.workflowInstances) {
          document.workflowInstances.forEach((wf: any) => {
            (wf.steps || []).forEach((st: any) => {
              if (st.status === 'APPROVED' && st.userId) {
                const exists = allSignatures.some((sig: any) => sig.userId === st.userId);
                if (!exists) {
                  allSignatures.push({
                    id: st.id,
                    documentId: document.id,
                    userId: st.userId,
                    signedAt: st.actionedAt || st.updatedAt || new Date(),
                    user: st.user
                  });
                }
              }
            });
          });
        }

        const htmlContent = await injectSignaturesToHtml(rawHtml, allSignatures, baseUrl);

        if (previewMode) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.end(htmlContent);
        }

        const browser = await launchPuppeteerBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
        await page.emulateMediaType('screen');

        await page.setContent(htmlContent, { waitUntil: ['load', 'domcontentloaded'], timeout: 60000 });

        const rawPdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
        await browser.close();

        // Merge supporting documents / evidence files if any
        const pdfBuffer = await mergePdfWithEvidence(Buffer.from(rawPdfBuffer), document.evidenceFiles || []);

        const pdfFileName = version.fileName.replace(/\.(html?|htm)$/i, '.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', String(pdfBuffer.length));
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.end(Buffer.from(pdfBuffer));
      } catch (convErr: any) {
        console.error('[HTML->PDF] conversion failed:', convErr);
        // Fallback: If Puppeteer HTML->PDF conversion fails on server, serve HTML directly
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const rawHtml = await fs.promises.readFile(filePath, 'utf8');
        const baseDir = path.dirname(filePath);
        const fileUrlBase = new URL(`file://${path.resolve(baseDir)}/`).href;
        const httpUrlBase = getApiBaseUrl(req) + '/';
        const baseUrl = httpUrlBase;
        const htmlContent = await injectSignaturesToHtml(rawHtml, document.signatures || [], baseUrl);
        return res.end(htmlContent);
      }
    }

    // If PDF file, check if there are supporting documents to merge
    if (fileExtension === '.pdf' || version.mimeType === 'application/pdf') {
      if (document.evidenceFiles && document.evidenceFiles.length > 0) {
        const rawFileBytes = await fs.promises.readFile(filePath);
        const mergedBuffer = await mergePdfWithEvidence(rawFileBytes, document.evidenceFiles);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', String(mergedBuffer.length));
        res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.end(mergedBuffer);
      }
    }

    // Send file with proper headers
    res.setHeader('Content-Type', version.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const fileStream = fs.createReadStream(filePath);
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
      include: {
        versions: { orderBy: { versionNum: 'desc' } },
        signatures: {
          include: {
            user: { select: { fullName: true, email: true, jobTitle: true } }
          }
        },
        evidenceFiles: { orderBy: { createdAt: 'asc' } },
      }
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    // Get the specific version
    const version = document.versions.find(v => v.id === String(versionId));
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'Version not found' });
    }

    const filePath = await ensureExistingFilePath(version.fileUrl, document.id, req.headers.authorization);
    if (!filePath) {
      console.error(`❌ Download version failed: file missing for fileUrl ${version.fileUrl}`);
      res.status(404).setHeader('Content-Type', 'application/json');
      return res.json({ status: 'error', message: 'Berkas tidak ditemukan di server. Silakan unggah ulang dokumen.' });
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    const isHtml = version.mimeType === 'text/html' || fileExtension === '.html' || fileExtension === '.htm';
    const previewMode = String(req.query.preview) === 'html';

    if (isHtml) {
      // Convert HTML to PDF with embedded QR codes for signed signatures, or return HTML preview if requested.
      try {
        const rawHtml = await fs.promises.readFile(filePath, 'utf8');
        const baseDir = path.dirname(filePath);
        const fileUrlBase = new URL(`file://${path.resolve(baseDir)}/`).href;
        const httpUrlBase = getApiBaseUrl(req) + '/';
        const baseUrl = httpUrlBase;

        const htmlContent = await injectSignaturesToHtml(rawHtml, document.signatures || [], baseUrl);

        if (previewMode) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.end(htmlContent);
        }

        const browser = await launchPuppeteerBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
        await page.emulateMediaType('screen');

        await page.setContent(htmlContent, { waitUntil: ['load', 'domcontentloaded'], timeout: 60000 });

        const rawPdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
        await browser.close();

        // Merge supporting documents / evidence files if any
        const pdfBuffer = await mergePdfWithEvidence(Buffer.from(rawPdfBuffer), document.evidenceFiles || []);

        const pdfFileName = version.fileName.replace(/\.(html?|htm)$/i, '.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', String(pdfBuffer.length));
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.end(Buffer.from(pdfBuffer));
      } catch (convErr: any) {
        console.error('[HTML->PDF] conversion failed (version):', convErr);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const rawHtml = await fs.promises.readFile(filePath, 'utf8');
        const baseDir = path.dirname(filePath);
        const fileUrlBase = new URL(`file://${path.resolve(baseDir)}/`).href;
        const httpUrlBase = getApiBaseUrl(req) + '/';
        const baseUrl = httpUrlBase;
        const htmlContent = await injectSignaturesToHtml(rawHtml, document.signatures || [], baseUrl);
        return res.end(htmlContent);
      }
    }

    // If PDF file, check if there are supporting documents to merge
    if (fileExtension === '.pdf' || version.mimeType === 'application/pdf') {
      if (document.evidenceFiles && document.evidenceFiles.length > 0) {
        const rawFileBytes = await fs.promises.readFile(filePath);
        const mergedBuffer = await mergePdfWithEvidence(rawFileBytes, document.evidenceFiles);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', String(mergedBuffer.length));
        res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.end(mergedBuffer);
      }
    }

    // Send file with proper headers
    res.setHeader('Content-Type', version.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const fileStream = fs.createReadStream(filePath);
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

    const baseUrl = getApiBaseUrl(req);

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

    const baseUrl = getApiBaseUrl(req);

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
