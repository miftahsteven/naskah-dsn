
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
    const baseUrl = getApiBaseUrl(req);
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

function injectSignatureQrIntoHtml(htmlContent: string, row: any, baseUrl: string): { html: string; injected: boolean } {
  const candidates = row.candidates || [];
  let match: RegExpExecArray | null = null;
  let matchedCandidate = "";

  let bestMatch: { m: RegExpExecArray, cand: string, score: number, index: number } | null = null;

  for (const cand of candidates) {
    const tokens = cand
      .split(/[\s,.]+/)
      .filter((t: string) => t.length >= 3 && !/^(dr|kh|prof|drs|h|lc|phd|ma|sh|mag|msi|ir|se|ag)$/i.test(t));
    
    if (tokens.length > 0) {
      // Allow up to 80 chars of any tags/text between tokens (e.g. middle names, titles, HTML tags)
      const patternStr = tokens.map((t: string) => escapeRegExp(t)).join('[\\s\\S]{0,80}?');
      const nameRegex = new RegExp(patternStr, 'gi'); 
      let m: RegExpExecArray | null;
      
      while ((m = nameRegex.exec(htmlContent)) !== null) {
        const prefix = htmlContent.substring(0, m.index);
        const lastSlice = prefix.slice(Math.max(0, prefix.length - 350));
        
        let score = 0;
        
        // 1. Proximity to end of document (huge boost for the last 20% of the document)
        const documentPositionRatio = m.index / htmlContent.length;
        if (documentPositionRatio > 0.8) score += 20;
        else if (documentPositionRatio > 0.5) score += 5;
        else score -= 10; // Penalize matches in the top half
        
        // 2. Visually distinct signature block markers in the immediate vicinity
        const closeSlice = prefix.slice(Math.max(0, prefix.length - 150));
        if (/(Ketua|Sekretaris|Direktur|Pimpinan|Kepala|Mengetahui|Menyetujui|Ketum|Sekjen)/i.test(closeSlice)) score += 10;
        
        if (/(?:<br\s*\/?>\s*){2,}/i.test(closeSlice)) score += 10;
        if (/margin-bottom:\s*\d{2,}px/i.test(closeSlice)) score += 10;
        if (/<div[^>]*style="[^"]*height:\s*\d{2,}px/i.test(closeSlice)) score += 10;
        
        // 3. Negative indicators
        // If it's a list item (like in Lampiran: "Sekretaris : Dr..."), penalize heavily!
        if (/:\s*(<[^>]+>\s*)*$/.test(closeSlice) || /:\s*$/.test(prefix.trim())) score -= 30; // "Name:" or "Name : "
        if (/:\s*[a-zA-Z.\s<>]*$/.test(closeSlice)) score -= 50; // "Role : Dr. H. "
        if (/Lampiran/i.test(lastSlice)) score -= 30; // If it's physically near the word Lampiran
        if (/<li/i.test(closeSlice) && !/<\/li>/i.test(closeSlice)) score -= 20; // Inside a list item
        
        if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && m.index > bestMatch.index)) {
          bestMatch = { m, cand, score, index: m.index };
        }
      }
    }
  }

  if (bestMatch && bestMatch.score > -10) {
    match = bestMatch.m;
    matchedCandidate = bestMatch.cand;
  }

  const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
  const qrImageHtml = `<div style="text-align:center; margin:4px auto; line-height:1; display:block; position:relative; width:70px; height:70px;"><img src="${row.qrDataUrl}" alt="QR Signature" class="qr-signature-img" style="width:70px !important; height:70px !important; min-width:70px !important; min-height:70px !important; object-fit:contain !important; display:block !important; position:absolute; top:0; left:0; z-index:1;" /><img src="${cleanBaseUrl}/images/logo-dsn.png" alt="Logo" style="width:20px !important; height:20px !important; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2; background:#fff; border-radius:50%; padding:2px; object-fit:contain; border:1px solid #1F3F23;" /></div>`;

  if (match) {
    const matchIndex = match.index;
    const prefix = htmlContent.substring(0, matchIndex);

    const lastOpenTagIndex = prefix.lastIndexOf('<');
    let targetIndex = matchIndex;
    if (lastOpenTagIndex !== -1) {
      const tagSub = prefix.substring(lastOpenTagIndex);
      if (/^<(div|p|u|b|strong|span)[^>]*>/i.test(tagSub)) {
        targetIndex = lastOpenTagIndex;
      }
    }

    const realPrefix = htmlContent.substring(0, targetIndex);
    let suffix = htmlContent.substring(targetIndex);
    suffix = suffix.replace(/^([^>]+style="[^"]*)(?:margin-top|padding-top):\s*\d+px;?/i, "$1margin-top: 2px;");

    const sliceLen = Math.min(1000, realPrefix.length);
    const prefixBase = realPrefix.slice(0, realPrefix.length - sliceLen);
    const lastSlice = realPrefix.slice(realPrefix.length - sliceLen);

    if (/margin-bottom:\s*\d+px/i.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/margin-bottom:\s*\d+px/gi, 'margin-bottom: 4px');
      return { html: prefixBase + updatedSlice + qrImageHtml + suffix, injected: true };
    } else if (/(<div[^>]*style="[^"]*height:[^"]*"[^>]*>\s*<\/div>)/gi.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/(<div[^>]*style="[^"]*height:[^"]*"[^>]*>\s*<\/div>)/gi, qrImageHtml);
      return { html: prefixBase + updatedSlice + suffix, injected: true };
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

  // ── SAFE FALLBACK: Target specific role titles in signature block ("Ketua" or "Sekretaris") ──
  const roleStr = (row.roleName || '').toLowerCase();
  const isKetua = /ketua|ketum/i.test(roleStr) || 
                  (/cholil|nafis|hasan/i.test(row.candidates.join(' '))) ||
                  (row.signerIndex === 0 && !/sekretaris/i.test(roleStr) && !/amirsyah|tambunan/i.test(row.candidates.join(' ')));
  const targetRole = isKetua ? '(?:Ketua|Menyetujui|Ketum)' : '(?:Sekretaris|Mengetahui|Sekjen)';
  
  // Search for role (optional comma) followed by line breaks
  const roleRegex = new RegExp(`(${targetRole}\\s*,?\\s*(?:<[^>]+>|\\s)*?)(?:<br\\s*\\/?>\\s*){2,}`, 'gi');
  const roleMatches = [...htmlContent.matchAll(roleRegex)];
  
  if (roleMatches.length > 0) {
    // Pick the LAST match to avoid hitting random headers at the top of the document
    const lastMatch = roleMatches[roleMatches.length - 1];
    if (lastMatch && typeof lastMatch.index === 'number') {
      const p = htmlContent.substring(0, lastMatch.index);
      const s = htmlContent.substring(lastMatch.index + lastMatch[0].length);
      const updated = p + lastMatch[1] + qrImageHtml + s;
      return { html: updated, injected: true };
    }
  }

  // Fallback 2: Any role header followed by <p> or <div> spaces (pick the last one)
  const genericRoleRegex = new RegExp(`(${targetRole})\\s*,?\\s*(?:<[^>]+>|\\s)*?`, 'gi');
  const genericRoleMatches = [...htmlContent.matchAll(genericRoleRegex)];
  if (genericRoleMatches.length > 0) {
    // We only consider it if it's in the bottom half of the document, and NOT inside a Lampiran
    const validMatches = genericRoleMatches.filter(m => {
      if (typeof m.index !== 'number' || m.index <= htmlContent.length * 0.4) return false;
      const surrounding = htmlContent.substring(Math.max(0, m.index - 500), m.index + 100);
      if (/Lampiran/i.test(surrounding)) return false; // Ignore roles inside attachments
      return true;
    });
    const lastMatch = validMatches.length > 0 ? validMatches[validMatches.length - 1] : genericRoleMatches[genericRoleMatches.length - 1];
    
    if (lastMatch && typeof lastMatch.index === 'number') {
      const idx = lastMatch.index + lastMatch[0].length;
      const p = htmlContent.substring(0, idx);
      const s = htmlContent.substring(idx);
      return { html: p + qrImageHtml + s, injected: true };
    }
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

  let documentNumber = '';
  if (signedSigs.length > 0 && signedSigs[0].documentId) {
    try {
      // Lazy load prisma or it might be in scope (documents.router.ts has prisma imported at the top)
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

  const signatureRows = await Promise.all(signedSigs.map(async (s: any) => {
    // Build frontend base URL from ALLOWED_ORIGINS env
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    let frontendUrl = 'https://amanah.dsnmui.or.id';
    if (allowedOriginsEnv) {
      const origins = allowedOriginsEnv.split(',');
      const firstOrigin = origins[0];
      if (firstOrigin) {
        frontendUrl = firstOrigin.trim();
      }
    }
    const payload = `${frontendUrl}/verify/document/${s.documentId}`;
    
    const qrDataUrl = await qrcode.toDataURL(payload, {
      margin: 1,
      width: 240,
      color: { dark: '#1F3F23', light: '#FFFFFF' },
      errorCorrectionLevel: 'H' // High error correction to allow logo overlay
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
    }
    
    // Fallbacks for known signers if they use weird accounts
    if (isUserKetua || /ketua/i.test(s.user?.jobTitle || '')) {
      candidates.push("CHOLIL NAFIS");
      candidates.push("HASANUDDIN");
    } else if (isUserSekretaris || /sekretaris/i.test(s.user?.jobTitle || '')) {
      candidates.push("AMIRSYAH TAMBUNAN");
      candidates.push("ANWAR ABBAS");
    } else {
      // If we really don't know, we can push template variables just in case
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

  let htmlContent = rawHtml;
  if (!/<!doctype html>/i.test(htmlContent)) htmlContent = `<!doctype html>\n${htmlContent}`;
  if (!/<base[^>]*href=[\"'][^\"']+[\"'][^>]*>/i.test(htmlContent)) {
    htmlContent = htmlContent.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
  }

  // Inject CSS rules to scale down large logo images in the letterhead and guarantee QR code display
  const imageStyle = `
    <style id="amanah-kop-styles">
      .kop-surat img, td img:not(.qr-signature-img) {
        max-width: 75px !important;
        max-height: 90px !important;
        height: auto !important;
        width: auto !important;
        display: inline-block !important;
        vertical-align: middle !important;
      }
      img.qr-signature-img {
        width: 70px !important;
        height: 70px !important;
        max-width: 70px !important;
        max-height: 70px !important;
        min-width: 70px !important;
        min-height: 70px !important;
        display: inline-block !important;
        object-fit: contain !important;
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

    const filePath = resolveExistingFilePath(version.fileUrl);
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

    const filePath = resolveExistingFilePath(version.fileUrl);
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

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
        await browser.close();

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

    const filePath = resolveExistingFilePath(version.fileUrl);
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

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
        await browser.close();

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
