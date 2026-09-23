
import { calculateAttendees } from '../meeting/meeting.router.js';
import { FOOTER_HTML } from '../letter-template/default-templates.js';

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
import { calculateSlaStatus } from '../../lib/business-days.js';
import { sendDocumentInvitationEmail } from '../../lib/mailer.service.js';

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

export function getStaticImageBase64(filename: string, mimeType: string): string {
  try {
    const candidates = [
      path.join(process.cwd(), 'public/images', filename),
      path.join(process.cwd(), 'src/assets', filename),
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
  return getStaticImageBase64('kop-surat.png', 'image/png');
}

export function getBismillahBase64(): string {
  return getStaticImageBase64('bismillah.svg', 'image/svg+xml');
}

export function getLogoDsnBase64(): string {
  return getStaticImageBase64('logo-dsn.png', 'image/png');
}

export function getWqaUkasBase64(): string {
  return getStaticImageBase64('wqa-ukas.png', 'image/png');
}

export function getCertKsRsBgBase64(): string {
  return getStaticImageBase64('cert-ks-rs-bg.jpg', 'image/jpeg');
}

export function getStempelDsnBase64(): string {
  return getStaticImageBase64('stempel-dsn.png', 'image/png');
}

export function getBismillahCertBase64(): string {
  return getStaticImageBase64('bismillah-cert.png', 'image/png');
}

export function getLogoDsnCertBase64(): string {
  return getStaticImageBase64('logo-dsn-cert.png', 'image/png');
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

// ── HOSPITAL SUBMISSIONS ENDPOINT (for Surat Keluar auto-fill) ──
router.get('/hospital-submissions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.publicSubmission.findMany({
      where: {
        OR: [
          { submissionTypeName: { contains: 'Rumah Sakit', mode: 'insensitive' } },
          { title: { contains: 'Rumah Sakit', mode: 'insensitive' } },
          { title: { contains: 'RS', mode: 'insensitive' } },
          { erpDocument: { subCategory: { contains: 'Rumah Sakit', mode: 'insensitive' } } },
        ],
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            province: true,
            npwp: true,
            phone: true,
            email: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      status: 'success',
      data: submissions,
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
        },
        publicSubmissions: {
          select: {
            id: true,
            submissionNumber: true,
            company: { select: { id: true, name: true } },
          }
        }
      },
      orderBy: req.query.documentType === 'INCOMING'
        ? [
            { receivedDate: 'desc' },
            { createdAt: 'desc' },
          ]
        : { updatedAt: 'desc' },
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
        evidenceFolders: {
          include: {
            files: true,
          },
          orderBy: { createdAt: 'asc' },
        },
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
          orderBy: { dateTime: 'desc' }
        },
        publicSubmissions: {
          include: {
            company: true,
            applicantUser: { select: { fullName: true, email: true, phone: true, position: true } },
            documents: true,
            timeline: { orderBy: { createdAt: 'desc' } },
            certificate: true,
          },
        },
        disposisiLogs: {
          include: {
            user: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
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
    const dateForDays = document.receivedDate || document.documentDate || document.createdAt;
    const daysElapsed = Math.max(0, Math.floor((Date.now() - new Date(dateForDays).getTime()) / (1000 * 60 * 60 * 24)));

    const transformedDocument = {
      ...document,
      daysElapsed,
      fileUrl: `${baseUrl}/documents/${document.id}/download`,
      versions: document.versions.map(v => ({
        ...v,
        fileUrl: `${baseUrl}/documents/${document.id}/versions/${v.id}/download`
      })),
      evidenceFiles: (document.evidenceFiles || []).map(ef => ({
        ...ef,
        fileUrl: ef.fileUrl
          ? (ef.fileUrl.startsWith('http') ? ef.fileUrl : (ef.fileUrl.startsWith('/') ? ef.fileUrl : `/${ef.fileUrl}`))
          : `${baseUrl}/documents/${document.id}/evidence/files/${ef.id}/download`
      })),
      evidenceFolders: (document.evidenceFolders || []).map(ef => ({
        ...ef,
        files: (ef.files || []).map((f: any) => ({
          ...f,
          fileUrl: f.fileUrl
            ? (f.fileUrl.startsWith('http') ? f.fileUrl : (f.fileUrl.startsWith('/') ? f.fileUrl : `/${f.fileUrl}`))
            : `${baseUrl}/documents/${document.id}/evidence/files/${f.id}/download`
        }))
      })),
      publicSubmissions: document.publicSubmissions || [],
      shariaCertificate: document.publicSubmissions?.[0]?.certificate || null,
    };
    
    console.log('✅ Document returned with fileUrl:', transformedDocument.fileUrl);
    res.json({ status: 'success', data: transformedDocument });
  } catch (error: any) {
    console.error('💥 Error in GET /documents/:id:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE DPS SUBMISSION STAGE & STATUS FROM BACKOFFICE ──
router.patch('/:id/dps-stage', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;
    // stage: 'PROSES_PENGAJUAN' | 'VALIDASI_DOKUMEN' | 'WAWANCARA' | 'PROSES_INTERNAL' | 'LULUS' | 'TIDAK_LULUS'

    if (!stage) {
      return res.status(400).json({ status: 'error', message: 'Tahapan status wajib dipilih.' });
    }

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        publicSubmissions: {
          include: { company: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Dokumen Surat Masuk tidak ditemukan.' });
    }

    const pubSub = document.publicSubmissions?.[0];
    if (!pubSub) {
      return res.status(404).json({ status: 'error', message: 'Pengajuan publik terkait tidak ditemukan.' });
    }

    const stageLabels: Record<string, string> = {
      PROSES_PENGAJUAN: 'Proses Pengajuan',
      VALIDASI_DOKUMEN: 'Validasi Dokumen',
      WAWANCARA: 'Wawancara',
      PROSES_INTERNAL: 'Proses Internal',
      LULUS: 'Lulus (Rekomendasi Disetujui)',
      TIDAK_LULUS: 'Tidak Lulus',
    };

    const label = stageLabels[stage] || stage;

    // Update status in public submission
    const statusVal = stage === 'LULUS' ? 'DISETUJUI' : stage === 'TIDAK_LULUS' ? 'DITOLAK' : stage;
    const updatedSub = await prisma.publicSubmission.update({
      where: { id: pubSub.id },
      data: {
        dpsStage: stage,
        status: statusVal,
      },
    });

    // Add activity log
    await prisma.publicSubmissionActivity.create({
      data: {
        submissionId: pubSub.id,
        title: `Tahapan DPS Diperbarui: ${label}`,
        description: notes || `Tahapan permohonan rekomendasi DPS dialihkan ke "${label}" oleh Sekretariat DSN-MUI.`,
        publicStatus: label,
        visibility: 'PUBLIC',
        performedByName: req.user?.fullName || 'Sekretariat DSN-MUI',
      },
    });

    // Send notification to applicant company
    await prisma.publicNotification.create({
      data: {
        companyId: pubSub.companyId,
        userId: pubSub.applicantUserId,
        title: `Status Permohonan DPS: ${label}`,
        message: notes || `Permohonan Rekomendasi DPS (${pubSub.submissionNumber}) saat ini berada pada tahap: ${label}.`,
        type: stage === 'LULUS' ? 'SUCCESS' : stage === 'TIDAK_LULUS' ? 'WARNING' : 'INFO',
        link: `/submissions/${pubSub.id}`,
      },
    });

    return res.json({
      status: 'success',
      message: `Tahapan permohonan DPS berhasil diubah menjadi ${label}.`,
      data: updatedSub,
    });
  } catch (error: any) {
    console.error('Error updating DPS stage:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── VALIDASI PERMOHONAN DENGAN 3 KATEGORI (BARU / PAW / KEBERLANJUTAN) ──
router.post('/:id/validate-submission', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { validationType, notes } = req.body;
    // validationType: 'BARU' | 'PAW' | 'PENETAPAN_KEBERLANJUTAN'

    if (!validationType) {
      return res.status(400).json({
        status: 'error',
        message: 'Pilihan kategori rekomendasi (Baru / PAW / Penetapan Keberlanjutan Rekomendasi) wajib dipilih.',
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        publicSubmissions: {
          include: { company: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Dokumen Surat Masuk tidak ditemukan.' });
    }

    const pubSub = document.publicSubmissions?.[0];
    if (!pubSub) {
      return res.status(404).json({ status: 'error', message: 'Pengajuan publik terkait tidak ditemukan.' });
    }

    const typeLabels: Record<string, string> = {
      BARU: 'Pengajuan Rekomendasi Baru',
      PAW: 'Pergantian Antar Waktu (PAW)',
      PENETAPAN_KEBERLANJUTAN: 'Penetapan Keberlanjutan Rekomendasi',
    };

    const typeLabel = typeLabels[validationType] || validationType;

    // Keep stage at VALIDASI_DOKUMEN as requested (only advance to WAWANCARA when interview invitation is created)
    const updatedSub = await prisma.publicSubmission.update({
      where: { id: pubSub.id },
      data: {
        dpsStage: 'VALIDASI_DOKUMEN',
        status: 'VERIFIKASI_ADMINISTRASI',
        validationType: validationType,
      },
    });

    // Create public activity log
    await prisma.publicSubmissionActivity.create({
      data: {
        submissionId: pubSub.id,
        title: `Dokumen Tervalidasi: ${typeLabel}`,
        description: notes || `Berkas permohonan telah diverifikasi dan dinyatakan VALID dengan kualifikasi: ${typeLabel}. Tahap saat ini: Validasi Dokumen Aktif (menunggu penerbitan jadwal & Surat Undangan Wawancara).`,
        publicStatus: 'Validasi Dokumen',
        visibility: 'PUBLIC',
        performedByName: req.user?.fullName || 'Sekretariat DSN-MUI',
      },
    });

    // Create notification for applicant
    await prisma.publicNotification.create({
      data: {
        companyId: pubSub.companyId,
        userId: pubSub.applicantUserId,
        title: `Berkas Tervalidasi (${typeLabel})`,
        message: `Berkas pengajuan rekomendasi DPS Anda telah divalidasi sebagai "${typeLabel}". Tahapan berkas berstatus Validasi Dokumen Aktif, menunggu penerbitan Surat Undangan Wawancara oleh Sekretariat DSN-MUI.`,
        type: 'SUCCESS',
        link: `/submissions/${pubSub.id}`,
      },
    });

    // Create internal Disposisi / Audit Log
    await prisma.disposisiLog.create({
      data: {
        documentId: document.id,
        userId: req.user!.id,
        action: 'VALIDASI_BERKAS',
        description: `Dinyatakan Valid (${typeLabel}). ${notes ? 'Catatan: ' + notes : ''}. Status: Validasi Dokumen Aktif.`,
        metadata: { validationType },
      },
    });

    return res.json({
      status: 'success',
      message: `Validasi berkas berhasil disimpan (${typeLabel}). Status tetap pada tahapan Validasi Dokumen aktif.`,
      data: {
        submission: updatedSub,
        validationType,
        validationLabel: typeLabel,
      },
    });
  } catch (error: any) {
    console.error('Error in validate-submission:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── REJECT VALIDASI / PERMINTAAN PERBAIKAN BERKAS DENGAN ALASAN DESKRIPTIF ──
router.post('/:id/reject-submission', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, requestedDocuments, deadline } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Alasan penolakan / permintaan perbaikan berkas wajib diisi secara deskriptif.',
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        publicSubmissions: {
          include: { company: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Dokumen Surat Masuk tidak ditemukan.' });
    }

    const pubSub = document.publicSubmissions?.[0];
    if (!pubSub) {
      return res.status(404).json({ status: 'error', message: 'Pengajuan publik terkait tidak ditemukan.' });
    }

    // Set status to PERLU_PERBAIKAN (Perlu Tindakan di web public) dan tetap pada tahap VALIDASI_DOKUMEN
    const updatedSub = await prisma.publicSubmission.update({
      where: { id: pubSub.id },
      data: {
        status: 'PERLU_PERBAIKAN',
        dpsStage: 'VALIDASI_DOKUMEN',
      },
    });

    // Buat record PublicSubmissionRevision
    const revisionData: any = {
      submissionId: pubSub.id,
      requestNotes: reason.trim(),
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    };
    if (Array.isArray(requestedDocuments) && requestedDocuments.length > 0) {
      revisionData.requestedDocuments = requestedDocuments;
    }
    const revision = await prisma.publicSubmissionRevision.create({
      data: revisionData,
    });

    // Public activity log
    await prisma.publicSubmissionActivity.create({
      data: {
        submissionId: pubSub.id,
        title: 'Permintaan Perbaikan Berkas (Perlu Tindakan)',
        description: reason.trim(),
        publicStatus: 'Perlu Perbaikan',
        visibility: 'PUBLIC',
        performedByName: req.user?.fullName || 'Sekretariat DSN-MUI',
      },
    });

    // Notification to applicant company
    await prisma.publicNotification.create({
      data: {
        companyId: pubSub.companyId,
        userId: pubSub.applicantUserId,
        title: 'Perlu Tindakan: Berkas Pengajuan Memerlukan Perbaikan',
        message: `Verifikator DSN-MUI meminta perbaikan berkas: "${reason.trim()}". Silakan periksa dan perbarui lampiran dokumen.`,
        type: 'WARNING',
        link: `/submissions/${pubSub.id}`,
      },
    });

    // Internal Disposisi / Audit Log
    await prisma.disposisiLog.create({
      data: {
        documentId: document.id,
        userId: req.user!.id,
        action: 'REJECT_VALIDASI_BERKAS',
        description: `Pengajuan ditolak sementara / diminta perbaikan berkas. Alasan: ${reason.trim()}`,
        metadata: { reason: reason.trim(), requestedDocuments },
      },
    });

    return res.json({
      status: 'success',
      message: 'Permintaan perbaikan berkas berhasil dikirim ke pemohon. Status pengajuan dialihkan ke "Perlu Tindakan".',
      data: {
        submission: updatedSub,
        revision,
      },
    });
  } catch (error: any) {
    console.error('Error in reject-submission:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── BUAT UNDANGAN WAWANCARA (MULTI-PUTARAN, RS & DPS, TERINTEGRASI AGENDA RAPAT) ──
router.post('/:id/interview-invitation', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      round,
      invitationNumber,
      invitationDate,
      interviewDayDate,
      interviewTime,
      format,
      venue,
      zoomUrl,
      zoomMeetingId,
      zoomPasscode,
      subject,
      candidates,
      dresscode,
      requirements,
      contactPerson,
      notes,
      signatoryName,
      signatoryRole,
      syncMeetingAgenda = true,
    } = req.body;

    if (!invitationNumber || !interviewDayDate || !interviewTime || !venue) {
      return res.status(400).json({
        status: 'error',
        message: 'Nomor surat undangan, hari/tanggal, waktu, dan tempat pelaksanaan wajib diisi.',
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        publicSubmissions: {
          include: { company: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Dokumen Surat Masuk tidak ditemukan.' });
    }

    const pubSub = document.publicSubmissions?.[0];
    if (!pubSub) {
      return res.status(404).json({ status: 'error', message: 'Pengajuan publik terkait tidak ditemukan.' });
    }

    const isHospital =
      pubSub.submissionTypeName?.toLowerCase().includes('rumah sakit') ||
      pubSub.title?.toLowerCase().includes('rumah sakit') ||
      document.title?.toLowerCase().includes('rumah sakit');

    // Parse existing interview history
    let existingHistory: any[] = [];
    if (pubSub.interviewHistory) {
      if (Array.isArray(pubSub.interviewHistory)) {
        existingHistory = pubSub.interviewHistory;
      } else {
        try {
          existingHistory = JSON.parse(pubSub.interviewHistory as any);
        } catch {
          existingHistory = [];
        }
      }
    }

    // Determine round number
    const activeRound = Number(round) || (existingHistory.length > 0 ? existingHistory.length + 1 : 1);

    const defaultSubject = isHospital
      ? `Undangan Wawancara & Asesmen Sertifikasi Syariah Rumah Sakit (Putaran Ke-${activeRound}) Terkait Surat No. ${pubSub.companyLetterNumber || document.documentNumber}`
      : `Undangan Wawancara Uji Kepatutan dan Kelayakan Calon Anggota DPS (Putaran Ke-${activeRound}) Terkait Surat No. ${pubSub.companyLetterNumber || document.documentNumber}`;

    const invitationData = {
      round: activeRound,
      invitationNumber,
      invitationDate: invitationDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      interviewDayDate,
      interviewTime,
      format: format || 'OFFLINE',
      venue,
      zoomUrl: zoomUrl || null,
      zoomMeetingId: zoomMeetingId || null,
      zoomPasscode: zoomPasscode || null,
      subject: subject || defaultSubject,
      candidates: Array.isArray(candidates) && candidates.length > 0
        ? candidates
        : isHospital
        ? ['Direksi & Manajemen Rumah Sakit', 'Calon Dewan Pengawas Syariah Rumah Sakit']
        : ['Calon Anggota Dewan Pengawas Syariah'],
      dresscode: dresscode || 'Pakaian Sipil Lengkap / Batik Lengan Panjang / Jas Resmi',
      requirements: requirements || (isHospital
        ? 'Membawa berkas fisik legalitas RS, sertifikat MUKISI, kesiapan pelayanan syariah, serta dokumen calon DPS.'
        : 'Membawa berkas fisik asli, portofolio riwayat hidup, serta bahan pemaparan kesiapan kepengawasan syariah.'),
      contactPerson: contactPerson || 'Sekretariat DSN-MUI (021-3904141 / wa.me/6281234567890)',
      notes: notes || null,
      signatoryName: signatoryName || 'Prof. Dr. KH. Hasanuddin, M.Ag',
      signatoryRole: signatoryRole || 'Ketua Bidang Pengawasan Syariah DSN-MUI',
      status: 'SCHEDULED', // SCHEDULED, PASSED, FAILED
      assessment: null,
      createdAt: new Date().toISOString(),
    };

    // Update or append to history
    const existingIndex = existingHistory.findIndex((h: any) => h.round === activeRound);
    if (existingIndex >= 0) {
      existingHistory[existingIndex] = invitationData;
    } else {
      existingHistory.push(invitationData);
    }

    // Optional: Synchronize into internal Amanah Meeting agenda
    if (syncMeetingAgenda) {
      try {
        const meetingTitle = `[Wawancara Putaran ${activeRound}] ${isHospital ? 'Asesmen Syariah RS' : 'Wawancara DPS'} - ${pubSub.company?.name || document.title}`;
        await prisma.meeting.create({
          data: {
            title: meetingTitle,
            agendaNumber: `${invitationNumber}-R${activeRound}`,
            dateTime: new Date(),
            location: venue,
            description: `${invitationData.subject}. Format: ${format}. Pelaksanaan: ${interviewDayDate} ${interviewTime}. Peserta: ${(invitationData.candidates || []).join(', ')}.`,
            targetType: 'ALL_BOARD',
            status: 'DRAFT',
            invitationSent: true,
            documentId: document.id,
            attendees: [
              {
                name: signatoryName || 'Prof. Dr. KH. Hasanuddin, M.Ag',
                jabatan: signatoryRole || 'Ketua Bidang Pengawasan Syariah DSN-MUI',
                status: 'INVITED',
              },
              ...invitationData.candidates.map((cName: string) => ({
                name: cName,
                jabatan: 'Peserta Wawancara / Pemohon',
                isExternal: true,
                status: 'INVITED',
              })),
            ],
          },
        });
      } catch (mErr) {
        console.warn('[Interview Invitation] Could not create linked Meeting agenda:', mErr);
      }
    }

    // Saat mulai membuat agenda wawancara, tahapan beralih ke WAWANCARA
    const updatedSub = await prisma.publicSubmission.update({
      where: { id: pubSub.id },
      data: {
        dpsStage: 'WAWANCARA',
        status: 'DALAM_PEMBAHASAN',
        interviewInvitation: invitationData,
        interviewHistory: existingHistory,
      },
    });

    // Public activity log
    await prisma.publicSubmissionActivity.create({
      data: {
        submissionId: pubSub.id,
        title: `Surat Undangan Wawancara Putaran ${activeRound} Diterbitkan (${invitationNumber})`,
        description: `DSN-MUI telah menerbitkan Surat Undangan Wawancara No. ${invitationNumber} (Putaran Ke-${activeRound}). Jadwal: ${interviewDayDate} pukul ${interviewTime} WIB berlokasi di ${venue}.`,
        publicStatus: 'Wawancara',
        visibility: 'PUBLIC',
        performedByName: req.user?.fullName || 'Sekretariat DSN-MUI',
      },
    });

    // Notification to applicant company
    await prisma.publicNotification.create({
      data: {
        companyId: pubSub.companyId,
        userId: pubSub.applicantUserId,
        title: `Undangan Wawancara (Putaran Ke-${activeRound}) Diterbitkan`,
        message: `Surat Undangan Wawancara No. ${invitationNumber} telah diterbitkan untuk ${invitationData.candidates.join(', ')}. Pelaksanaan: ${interviewDayDate} pukul ${interviewTime}. Silakan tinjau jadwal di dashboard pengajuan.`,
        type: 'INFO',
        link: `/submissions/${pubSub.id}`,
      },
    });

    // Internal Disposisi / Audit Log
    await prisma.disposisiLog.create({
      data: {
        documentId: document.id,
        userId: req.user!.id,
        action: 'TERBIT_UNDANGAN_WAWANCARA',
        description: `Surat Undangan Wawancara Putaran Ke-${activeRound} No. ${invitationNumber} diterbitkan untuk pelaksanaan ${interviewDayDate} pukul ${interviewTime}.`,
        metadata: invitationData,
      },
    });

    return res.json({
      status: 'success',
      message: `Surat Undangan Wawancara Putaran Ke-${activeRound} (${invitationNumber}) berhasil diterbitkan.`,
      data: {
        submission: updatedSub,
        invitation: invitationData,
        history: existingHistory,
      },
    });
  } catch (error: any) {
    console.error('Error in interview-invitation:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── INPUT PENILAIAN WAWANCARA (ASESMEN, DITERIMA / PERLU ULANG TANPA BATAS) ──
router.post('/:id/interview-assessment', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      round,
      assessedByName,
      score,
      decision, // 'DITERIMA' | 'DITOLAK'
      notes,
      improvementNotes,
    } = req.body;

    if (!decision || !['DITERIMA', 'DITOLAK'].includes(decision)) {
      return res.status(400).json({
        status: 'error',
        message: 'Keputusan hasil wawancara wajib dipilih (DITERIMA atau DITOLAK).',
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        publicSubmissions: {
          include: { company: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Dokumen Surat Masuk tidak ditemukan.' });
    }

    const pubSub = document.publicSubmissions?.[0];
    if (!pubSub) {
      return res.status(404).json({ status: 'error', message: 'Pengajuan publik terkait tidak ditemukan.' });
    }

    // Parse existing interview history
    let existingHistory: any[] = [];
    if (pubSub.interviewHistory) {
      if (Array.isArray(pubSub.interviewHistory)) {
        existingHistory = pubSub.interviewHistory;
      } else {
        try {
          existingHistory = JSON.parse(pubSub.interviewHistory as any);
        } catch {
          existingHistory = [];
        }
      }
    }

    const targetRound = Number(round) || (existingHistory.length > 0 ? existingHistory[existingHistory.length - 1].round : 1);
    const roundIdx = existingHistory.findIndex((h: any) => h.round === targetRound);

    const assessmentPayload = {
      assessedByName: assessedByName || req.user?.fullName || 'Tim Penguji & Asesor DSN-MUI',
      assessedAt: new Date().toISOString(),
      score: score ? Number(score) : (decision === 'DITERIMA' ? 85 : 55),
      decision,
      notes: notes || (decision === 'DITERIMA' ? 'Memenuhi kualifikasi dan standar syariah yang ditetapkan.' : 'Belum memenuhi kriteria kelulusan minimal.'),
      improvementNotes: improvementNotes || null,
    };

    const isPassed = decision === 'DITERIMA';

    if (roundIdx >= 0) {
      existingHistory[roundIdx].status = isPassed ? 'PASSED' : 'FAILED';
      existingHistory[roundIdx].assessment = assessmentPayload;
    } else {
      existingHistory.push({
        round: targetRound,
        status: isPassed ? 'PASSED' : 'FAILED',
        assessment: assessmentPayload,
      });
    }

    const updatedInvitation = pubSub.interviewInvitation
      ? {
          ...(pubSub.interviewInvitation as any),
          status: isPassed ? 'PASSED' : 'FAILED',
          assessment: assessmentPayload,
        }
      : null;

    // Determine next stage
    // If DITERIMA -> stage beralih ke PROSES_INTERNAL (siap upload sertifikat / rekomendasi)
    // If DITOLAK -> stage tetap di WAWANCARA, status DALAM_PEMBAHASAN (menunggu DSN jadwalkan putaran berikutnya)
    const nextStage = isPassed ? 'PROSES_INTERNAL' : 'WAWANCARA';
    const nextStatus = isPassed ? 'PROSES_KEPUTUSAN' : 'DALAM_PEMBAHASAN';

    const updatedSub = await prisma.publicSubmission.update({
      where: { id: pubSub.id },
      data: {
        dpsStage: nextStage,
        status: nextStatus,
        interviewInvitation: updatedInvitation,
        interviewHistory: existingHistory,
      },
    });

    // Public activity log
    await prisma.publicSubmissionActivity.create({
      data: {
        submissionId: pubSub.id,
        title: isPassed
          ? `Wawancara Putaran Ke-${targetRound} Dinyatakan LULUS / DITERIMA`
          : `Wawancara Putaran Ke-${targetRound} Belum Memenuhi Standar (Perlu Wawancara Ulang)`,
        description: isPassed
          ? `Hasil evaluasi wawancara putaran ke-${targetRound} oleh ${assessmentPayload.assessedByName} dinyatakan DITERIMA dengan nilai ${assessmentPayload.score}. Pengajuan melangkah ke tahap Proses Internal & Persiapan Penerbitan Sertifikat.`
          : `Hasil evaluasi wawancara putaran ke-${targetRound} belum memenuhi kriteria kelulusan (Nilai: ${assessmentPayload.score}). DSN-MUI akan mengagendakan jadwal wawancara ulang. Catatan: ${assessmentPayload.notes}`,
        publicStatus: isPassed ? 'Proses Internal' : 'Wawancara',
        visibility: 'PUBLIC',
        performedByName: assessmentPayload.assessedByName,
      },
    });

    // Notification to user
    await prisma.publicNotification.create({
      data: {
        companyId: pubSub.companyId,
        userId: pubSub.applicantUserId,
        title: isPassed
          ? `Hasil Wawancara Dinyatakan LULUS / DITERIMA`
          : `Hasil Wawancara Putaran Ke-${targetRound} Perlu Diulang`,
        message: isPassed
          ? `Selamat! Hasil wawancara putaran ke-${targetRound} telah disetujui (Nilai: ${assessmentPayload.score}). Permohonan Anda saat ini dalam proses akhir penerbitan sertifikat/rekomendasi.`
          : `Hasil wawancara putaran ke-${targetRound} belum memenuhi kriteria. Tim DSN-MUI akan mengagendakan jadwal wawancara ulang. Silakan periksa catatan evaluasi pada dashboard.`,
        type: isPassed ? 'SUCCESS' : 'WARNING',
        link: `/submissions/${pubSub.id}`,
      },
    });

    // Internal disposisi log
    await prisma.disposisiLog.create({
      data: {
        documentId: document.id,
        userId: req.user!.id,
        action: isPassed ? 'WAWANCARA_LULUS' : 'WAWANCARA_PERLU_ULANG',
        description: `Penilaian wawancara putaran ke-${targetRound} diinput oleh ${assessmentPayload.assessedByName}: Keputusan ${decision} (Skor: ${assessmentPayload.score}).`,
        metadata: assessmentPayload,
      },
    });

    return res.json({
      status: 'success',
      message: `Penilaian wawancara putaran ke-${targetRound} berhasil disimpan (${decision}).`,
      data: {
        submission: updatedSub,
        assessment: assessmentPayload,
        history: existingHistory,
      },
    });
  } catch (error: any) {
    console.error('Error in interview-assessment:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPLOAD SERTIFIKAT YANG SUDAH SIAP (PENYELESAIAN PROSES PENGAJUAN & HITUNG SLA) ──
router.post('/:id/upload-certificate', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      certificateNumber,
      title,
      issueDate,
      validUntil,
      notes,
    } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Berkas PDF sertifikat resmi yang sudah ditandatangani wajib diunggah.',
      });
    }

    if (!certificateNumber || !title || !issueDate || !validUntil) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        status: 'error',
        message: 'Nomor sertifikat, judul sertifikat, tanggal terbit, dan masa berlaku wajib diisi.',
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        publicSubmissions: {
          include: { company: true },
        },
      },
    });

    if (!document) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ status: 'error', message: 'Dokumen Surat Masuk tidak ditemukan.' });
    }

    const pubSub = document.publicSubmissions?.[0];
    if (!pubSub) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ status: 'error', message: 'Pengajuan publik terkait tidak ditemukan.' });
    }

    const relativeUrl = `/uploads/${file.filename}`;
    const parsedIssueDate = new Date(issueDate);
    const parsedValidUntil = new Date(validUntil);
    const completedAt = new Date();

    // Hitung SLA Realisasi Hari Kerja
    const slaStatus = calculateSlaStatus(pubSub.submittedAt, completedAt, 14);

    // Upsert ShariaCertificate record
    const certificate = await prisma.shariaCertificate.upsert({
      where: { submissionId: pubSub.id },
      create: {
        submissionId: pubSub.id,
        companyId: pubSub.companyId,
        certificateNumber: certificateNumber.trim(),
        title: title.trim(),
        issueDate: parsedIssueDate,
        validUntil: parsedValidUntil,
        fileUrl: relativeUrl,
        fileName: file.originalname,
        fileSize: file.size,
        digitalSignatureInfo: {
          uploadedBy: req.user?.fullName || 'Sekretariat DSN-MUI',
          uploadedAt: completedAt.toISOString(),
          signedOutOfBand: true,
          notes: notes || null,
        },
      },
      update: {
        certificateNumber: certificateNumber.trim(),
        title: title.trim(),
        issueDate: parsedIssueDate,
        validUntil: parsedValidUntil,
        fileUrl: relativeUrl,
        fileName: file.originalname,
        fileSize: file.size,
        digitalSignatureInfo: {
          uploadedBy: req.user?.fullName || 'Sekretariat DSN-MUI',
          uploadedAt: completedAt.toISOString(),
          signedOutOfBand: true,
          notes: notes || null,
        },
      },
    });

    // Update PublicSubmission -> SELESAI & LULUS & completedAt
    const updatedSub = await prisma.publicSubmission.update({
      where: { id: pubSub.id },
      data: {
        status: 'SELESAI',
        dpsStage: 'LULUS',
        stepCompleted: 5,
        completedAt,
      },
      include: {
        certificate: true,
        company: true,
      },
    });

    // Update internal Document
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'SELESAI',
        disposisiStatus: 'SELESAI',
        certificateUrl: relativeUrl,
      },
    });

    // Public activity log
    await prisma.publicSubmissionActivity.create({
      data: {
        submissionId: pubSub.id,
        title: 'Sertifikat Kesesuaian Syariah Resmi Diterbitkan',
        description: `Sertifikat Resmi No. ${certificateNumber} telah diterbitkan dan diunggah oleh DSN-MUI. Seluruh rangkaian proses permohonan selesai dalam ${slaStatus.workingDaysElapsed} hari kerja (${slaStatus.isOverdue ? `melebihi target SLA (${slaStatus.overdueDays} hari)` : 'memenuhi target SLA 14 hari kerja'}). Berkas sertifikat sah dapat diunduh langsung.`,
        publicStatus: 'Selesai',
        visibility: 'PUBLIC',
        performedByName: req.user?.fullName || 'Sekretariat DSN-MUI',
      },
    });

    // Notification to applicant company
    await prisma.publicNotification.create({
      data: {
        companyId: pubSub.companyId,
        userId: pubSub.applicantUserId,
        title: 'Sertifikat Kesesuaian Syariah Resmi Telah Terbit',
        message: `Alhamdulillah! Sertifikat Resmi No. ${certificateNumber} telah diterbitkan oleh DSN-MUI. Anda dapat melihat dan mengunduh berkas sertifikat asli melalui dashboard portal permohonan.`,
        type: 'SUCCESS',
        link: `/submissions/${pubSub.id}`,
      },
    });

    // Internal disposisi log
    await prisma.disposisiLog.create({
      data: {
        documentId: document.id,
        userId: req.user!.id,
        action: 'TERBIT_SERTIFIKAT_RESMI',
        description: `Sertifikat Resmi No. ${certificateNumber} diunggah. Pengajuan SELESAI dengan capaian SLA: ${slaStatus.workingDaysElapsed} hari kerja.`,
        metadata: {
          certificateNumber,
          title,
          fileUrl: relativeUrl,
          workingDaysElapsed: slaStatus.workingDaysElapsed,
          isWithinSla: !slaStatus.isOverdue,
        },
      },
    });

    return res.json({
      status: 'success',
      message: `Sertifikat Resmi (${certificateNumber}) berhasil diunggah dan pengajuan resmi dinyatakan SELESAI.`,
      data: {
        submission: updatedSub,
        certificate,
        sla: slaStatus,
      },
    });
  } catch (error: any) {
    console.error('Error in upload-certificate:', error);
    return res.status(500).json({ status: 'error', message: error.message });
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
      include: {
        versions: { orderBy: { versionNum: 'desc' }, take: 1 },
        signatures: true,
        workflowInstances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            steps: { orderBy: { stepNumber: 'asc' } }
          }
        }
      }
    });

    if (!existingDoc) return res.status(404).json({ status: 'error', message: 'Document not found' });

    // Validate whether document has already been signed by the final signatory
    const isSignedByFinalSignatory = (() => {
      if (existingDoc.status === 'SIGNED' || existingDoc.status === 'COMPLETED') return true;
      const wf = existingDoc.workflowInstances?.[0];
      if (!wf || !wf.steps || wf.steps.length === 0) return false;
      const steps = [...wf.steps].sort((a: any, b: any) => a.stepNumber - b.stepNumber);
      const signatorySteps = steps.filter((s: any) => s.roleId === 'PENANDATANGAN');
      const finalSignatoryStep = signatorySteps.length > 0
        ? signatorySteps[signatorySteps.length - 1]
        : steps.filter((s: any) => s.roleId !== 'PEMPARAF' && s.roleId !== 'APPROVER').pop() || steps[steps.length - 1];

      if (!finalSignatoryStep) return false;
      if (finalSignatoryStep.status === 'APPROVED') return true;
      if (finalSignatoryStep.userId && existingDoc.signatures && existingDoc.signatures.length > 0) {
        return existingDoc.signatures.some((sig: any) => sig.userId === finalSignatoryStep.userId && sig.signedAt);
      }
      return false;
    })();

    if (isSignedByFinalSignatory) {
      return res.status(400).json({
        status: 'error',
        message: 'Surat keluar ini sudah ditandatangani oleh penandatangan akhir dan tidak dapat diedit.'
      });
    }

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

let isPuppeteerAvailable: boolean | null = null;

async function launchPuppeteerBrowser() {
  if (isPuppeteerAvailable === false) {
    throw new Error('Puppeteer is disabled or browser libraries missing');
  }

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

  try {
    const browser = await puppeteer.launch(launchOptions);
    isPuppeteerAvailable = true;
    return browser;
  } catch (err: any) {
    console.warn('[Puppeteer] Chrome failed to launch on this server, disabling server-side PDF conversion fallback to HTML:', err.message);
    isPuppeteerAvailable = false;
    throw err;
  }
}

function resolveExistingFilePath(fileUrl: string): string | null {
  if (!fileUrl) return null;

  const cleanPath = fileUrl.replace(/^\/+/, '');
  const relPathWithoutUploads = cleanPath.replace(/^uploads\/+/, '');
  const filename = path.basename(fileUrl);

  const candidates = [
    fs.existsSync(fileUrl) ? fileUrl : null,
    path.resolve(process.cwd(), cleanPath),
    path.resolve(process.cwd(), 'backend', cleanPath),
    path.resolve(process.cwd(), '../', cleanPath),
    path.resolve('/var/www/mui-dsn-naskah/backend', cleanPath),
    path.resolve('/var/www/mui-dsn-naskah', cleanPath),
    path.resolve(process.cwd(), uploadDir, relPathWithoutUploads),
    path.resolve(process.cwd(), 'backend', uploadDir, relPathWithoutUploads),
    path.resolve(process.cwd(), 'uploads', relPathWithoutUploads),
    path.resolve(process.cwd(), 'backend/uploads', relPathWithoutUploads),
    path.resolve('/var/www/mui-dsn-naskah/backend/uploads', relPathWithoutUploads),
    path.resolve('/var/www/mui-dsn-naskah/uploads', relPathWithoutUploads),
    path.resolve(process.cwd(), uploadDir, filename),
    path.resolve(process.cwd(), 'backend', uploadDir, filename),
    path.resolve(process.cwd(), 'uploads', filename),
    path.resolve(process.cwd(), 'backend/uploads', filename),
    path.resolve('/var/www/mui-dsn-naskah/backend/uploads', filename),
    path.resolve('/var/www/mui-dsn-naskah/uploads', filename),
    path.resolve(__dirname, '../../uploads', relPathWithoutUploads),
    path.resolve(__dirname, '../../uploads', filename),
    path.resolve(__dirname, '../../../uploads', relPathWithoutUploads),
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

async function ensureExistingFilePath(fileUrl: string, _docId?: string, _authHeader?: string): Promise<string | null> {
  const local = resolveExistingFilePath(fileUrl);
  if (local) return local;

  if (!fileUrl) return null;

  try {
    const cleanPath = fileUrl.replace(/^\/+/, '');
    const filename = path.basename(cleanPath);
    const targetDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, filename);

    const remoteBases = [
      process.env.REMOTE_UPLOADS_BASE_URL,
      'https://amanah.dsnmui.or.id',
      'https://mui.mscode.id'
    ].filter(Boolean) as string[];

    for (const base of remoteBases) {
      const url = `${base.replace(/\/+$/, '')}/${cleanPath}`;
      try {
        const response = await fetch(url);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          await fs.promises.writeFile(targetPath, buffer);
          console.log(`[ensureExistingFilePath] Downloaded remote file ${url} -> ${targetPath}`);
          return targetPath;
        }
      } catch {
        // continue
      }
    }
  } catch (err: any) {
    console.error('[ensureExistingFilePath] Error syncing remote file:', err.message);
  }

  return null;
}

function injectSignatureQrIntoHtml(htmlContent: string, row: any, baseUrl: string): { html: string; injected: boolean } {
  // Strip any legacy/baked-in TTE VERIFIED badge to prevent duplicate badges
  htmlContent = htmlContent.replace(/<div style="text-align: center; display: inline-flex;[\s\S]*?TTE VERIFIED[\s\S]*?<\/div>\s*<\/div>/gi, '<!-- QR_CODE_TTE_PLACEHOLDER -->');

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

        // Numbered lists (e.g. 1. ... 2. ... 3. ... in delegasi / peserta penugasan list) are NOT signature blocks
        if (/(?:^|>|\n)\s*\d+\.\s*$/i.test(closeSlice.trim()) || /(?:^|>|\n)\s*\d+\.\s*[^<]*$/i.test(closeSlice)) score -= 200;

        // Signatures are ALWAYS located AFTER the letter closing (Demikian ... or Wassalamu'alaikum ...)
        const closingIndex = Math.min(
          htmlContent.toLowerCase().indexOf('wassalamu') !== -1 ? htmlContent.toLowerCase().indexOf('wassalamu') : Infinity,
          htmlContent.toLowerCase().indexOf('demikian') !== -1 ? htmlContent.toLowerCase().indexOf('demikian') : Infinity
        );
        if (closingIndex !== Infinity && m.index < closingIndex) {
          score -= 200;
        }

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

  const qrImageHtml = `<div style="text-align:left; margin:4px 0 4px 0; line-height:1; display:block; position:relative; width:60px; height:60px;"><img src="${row.qrDataUrl}" alt="QR Signature" class="qr-signature-img" style="width:60px !important; height:60px !important; min-width:60px !important; min-height:60px !important; object-fit:contain !important; display:block !important; position:absolute; top:0; left:0; z-index:1;" />${logoImg}</div>`;

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

    if (/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->\s*<div[^>]*style="[^"]*height:\s*[\d\.]+(?:px|mm)[^"]*"[^>]*>\s*<\/div>/gi.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->\s*<div[^>]*style="[^"]*height:\s*[\d\.]+(?:px|mm)[^"]*"[^>]*>\s*<\/div>/gi, qrImageHtml);
      return { html: prefixBase + updatedSlice + suffix, injected: true };
    } else if (/(<div[^>]*style="[^"]*height:\s*[\d\.]+(?:px|mm)[^"]*"[^>]*>\s*<\/div>)/gi.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/(<div[^>]*style="[^"]*height:\s*[\d\.]+(?:px|mm)[^"]*"[^>]*>\s*<\/div>)/gi, qrImageHtml);
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

const qrCodeCache = new Map<string, string>();

async function getCachedQrCode(payload: string): Promise<string> {
  if (qrCodeCache.has(payload)) {
    return qrCodeCache.get(payload)!;
  }
  const qrDataUrl = await qrcode.toDataURL(payload, {
    margin: 0,
    width: 240,
    color: { dark: '#1F3F23', light: '#FFFFFF' },
    errorCorrectionLevel: 'H'
  });
  if (qrCodeCache.size > 500) {
    const firstKey = qrCodeCache.keys().next().value;
    if (firstKey) qrCodeCache.delete(firstKey);
  }
  qrCodeCache.set(payload, qrDataUrl);
  return qrDataUrl;
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

  // Helper to match user name against target signatory name
  const isNameMatch = (userName: string, targetName: string) => {
    if (!userName || !targetName) return false;
    const cleanTokens = (str: string) => str
      .toLowerCase()
      .replace(/\b(dr|kh|prof|drs|h|lc|phd|ma|sh|mag|msi|ir|se|ag|mb|mba)\b\.?/gi, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(t => t.length >= 3);
    const uTokens = cleanTokens(userName);
    const tTokens = cleanTokens(targetName);
    if (uTokens.length === 0 || tTokens.length === 0) return false;
    return uTokens.some(ut => tTokens.includes(ut));
  };

  const targetKiri = templateVariables.namaKetua || templateVariables.namaKiri;
  const targetKanan = templateVariables.namaSekretaris || templateVariables.namaKanan;
  const targetSingle = templateVariables.namaPenandatangan;

  // Filter signedSigs: ONLY include signers who actually belong to the letter's designated signature slots!
  const validSigners: Array<{ sig: any; slot: 'kiri' | 'kanan' | 'single'; targetName: string; roleName: string; signerIndex: number }> = [];

  const userLowerKetua = ['cholil', 'nafis', 'adiwarman', 'hasanuddin'];
  const userLowerSekretaris = ['amirsyah', 'tambunan', 'asrori', 'anwar'];

  for (const s of signedSigs) {
    const fullName = s.user?.fullName || '';
    const lowerName = fullName.toLowerCase();
    const isUserKetua = userLowerKetua.some(k => lowerName.includes(k));
    const isUserSekretaris = userLowerSekretaris.some(k => lowerName.includes(k));

    let matchedSlot: 'kiri' | 'kanan' | 'single' | null = null;
    let targetName = '';
    let roleName = '';

    if (targetKiri && (isNameMatch(fullName, targetKiri) || isUserKetua)) {
      matchedSlot = 'kiri';
      targetName = targetKiri;
      roleName = templateVariables.jabatanKiri || 'Ketua';
    } else if (targetKanan && (isNameMatch(fullName, targetKanan) || isUserSekretaris)) {
      matchedSlot = 'kanan';
      targetName = targetKanan;
      roleName = templateVariables.jabatanKanan || 'Sekretaris';
    } else if (targetSingle && isNameMatch(fullName, targetSingle)) {
      matchedSlot = 'single';
      targetName = targetSingle;
      roleName = templateVariables.jabatanPenandatangan || 'Ketua';
    } else if (!targetKiri && !targetKanan && !targetSingle) {
      // Fallback for letters without templateVariables metadata
      if (isUserKetua) {
        matchedSlot = 'kiri';
        targetName = '';
        roleName = 'Ketua';
      } else if (isUserSekretaris) {
        matchedSlot = 'kanan';
        targetName = '';
        roleName = 'Sekretaris';
      } else if (signedSigs.length === 1) {
        matchedSlot = 'single';
        targetName = '';
        roleName = s.user?.jobTitle || 'Ketua';
      }
    }

    if (matchedSlot) {
      const alreadyHasSlot = validSigners.some(v => v.slot === matchedSlot);
      if (!alreadyHasSlot) {
        validSigners.push({
          sig: s,
          slot: matchedSlot,
          targetName,
          roleName,
          signerIndex: matchedSlot === 'kiri' ? 0 : (matchedSlot === 'kanan' ? 1 : 0)
        });
      }
    } else {
      console.log(`[injectSignaturesToHtml] Skipping signer ${fullName} because not matching any signature slot in template`);
    }
  }

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

  const signatureRows = await Promise.all(validSigners.map(async (v) => {
    const s = v.sig;
    const rawFrontendUrl = (process.env.FRONTEND_URL || 'https://amanah.dsnmui.or.id').trim().replace(/\/+$/, '');
    const officePath = process.env.FRONTEND_OFFICE_PATH !== undefined
      ? process.env.FRONTEND_OFFICE_PATH
      : (rawFrontendUrl.endsWith('/office') ? '' : '/office');
    const payload = `${rawFrontendUrl}${officePath}/verify/document/${s.documentId}`;
    
    const qrDataUrl = await getCachedQrCode(payload);

    // Build comprehensive candidates list for name matching
    const candidates: string[] = [];
    if (v.targetName) candidates.push(v.targetName);
    if (s.user?.fullName) {
      candidates.push(s.user.fullName);
      const cleanName = s.user.fullName
        .replace(/\b(Dr|K\.?H|Prof|Drs|H|Lc|Ph\.?D|M\.?A|S\.?H|M\.?Si|Ir|M\.?Ag|S\.?Ag|S\.?E|M\.?B\.?A)\b\.?/gi, '')
        .replace(/[\s,.]+/g, ' ')
        .trim();
      if (cleanName && cleanName.length >= 3) {
        candidates.push(cleanName);
      }
    }
    
    if (v.slot === 'kiri') {
      candidates.push("CHOLIL NAFIS");
      candidates.push("ADIWARMAN");
      candidates.push("HASANUDDIN");
    } else if (v.slot === 'kanan') {
      candidates.push("AMIRSYAH TAMBUNAN");
      candidates.push("ASRORI KARNI");
      candidates.push("ANWAR ABBAS");
    }

    return {
      signerIndex: v.signerIndex,
      fullName: escapeHtml(s.user?.fullName || 'Penandatangan'),
      jobTitle: escapeHtml(s.user?.jobTitle || 'Pejabat'),
      roleName: v.roleName,
      signedAt: escapeHtml(new Date(s.signedAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'long',
        timeStyle: 'short'
      })),
      candidates,
      qrDataUrl,
    };
  }));

  // Clean up any previously injected styles or misplaced QR codes before injecting fresh styles and QR codes
  let htmlContent = rawHtml;
  const kopBase64 = getKopSuratBase64();
  const bismillahBase64 = getBismillahBase64();
  const logoBase64 = getLogoDsnBase64();
  const wqaBase64 = getWqaUkasBase64();

  // Retroactively resolve un-interpolated HEADER_HTML strings in static document HTML files
  const kopPlaceholderRegex = /(\\?\${HEADER_HTML}|\${HEADER_HTML})/g;
  if (kopPlaceholderRegex.test(htmlContent)) {
    const headerReplacement = `<div style="text-align: center; margin-bottom: 4px; margin-left: 0; margin-right: 0; padding-top: 0;">
    <img src="${kopBase64}" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
  </div>

  <!-- Bismillah Calligraphy -->
  <div style="text-align: center; margin-top: 8px; margin-bottom: 14px;">
    <img src="${bismillahBase64}" alt="Bismillah" style="width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;" />
  </div>`;
    htmlContent = htmlContent.replace(kopPlaceholderRegex, headerReplacement);
  }

  // Clean up legacy footers and un-interpolated placeholders
  htmlContent = htmlContent.replace(/<table class="amanah-letter-footer"[\s\S]*?<\/table>/gi, '');
  htmlContent = htmlContent.replace(/\\?\${FOOTER_HTML}/g, '');

  // Clean up unwanted borders and negative margins from raw HTML
  htmlContent = htmlContent.replace(/border-top:\s*1px\s*solid\s*#000000;?/gi, 'border-top: none;');
  htmlContent = htmlContent.replace(/border-top:\s*1px\s*solid\s*black;?/gi, 'border-top: none;');
  htmlContent = htmlContent.replace(/margin-left:\s*-30px;\s*margin-right:\s*-30px;/gi, 'margin-left: 0; margin-right: 0;');
  htmlContent = htmlContent.replace(/margin-left:\s*-40px;\s*margin-right:\s*-40px;/gi, 'margin-left: 0; margin-right: 0;');

  // Remove any stray <br> tags directly inside <table>, <thead>, <tbody>, <tfoot>, <tr> which trigger browser foster-parenting gaps
  htmlContent = htmlContent.replace(/(<table\b[^>]*>[\s\S]*?<\/table>)/gi, (tbl) => {
    return tbl.replace(/<br\s*\/?>/gi, '');
  });

  // Replace any relative or absolute image references with self-contained Base64 Data URLs
  htmlContent = htmlContent.replace(/src=["'][^"']*kop-surat\.png["']/gi, `src="${kopBase64}" class="kop-surat-img"`);
  htmlContent = htmlContent.replace(/src=["'][^"']*bismillah\.svg["']/gi, `src="${bismillahBase64}"`);
  htmlContent = htmlContent.replace(/src=["'][^"']*logo-dsn\.png["']/gi, `src="${logoBase64}"`);
  htmlContent = htmlContent.replace(/src=["'][^"']*wqa-ukas\.png["']/gi, `src="${wqaBase64}"`);

  // Ensure Bismillah image inline styles are consistently scaled across all letters
  htmlContent = htmlContent.replace(/(<img[^>]*(?:bismillah|Bismillah)[^>]*style=["'])([^"']*)(["'])/gi, (match, p1, p2, p3) => {
    let cleanStyle = p2.replace(/height:\s*[^;]+;?/gi, '').replace(/max-height:\s*[^;]+;?/gi, '').replace(/width:\s*[^;]+;?/gi, '').replace(/max-width:\s*[^;]+;?/gi, '').trim();
    return `${p1}${cleanStyle ? cleanStyle + '; ' : ''}width: 260px; max-width: 45%; height: auto; max-height: 48px; margin: 8px auto 14px auto;${p3}`;
  });

  // Normalize closing greeting (salam penutup) to Wassalamu’alaikum
  htmlContent = htmlContent.replace(
    /(<!--\s*SALAM\s*PENUTUP\s*-->[\s\S]*?<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh[\.,]?)\s*(<\/p>)/gi,
    '$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3'
  );
  htmlContent = htmlContent.replace(
    /(<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh)\.\s*(<\/p>)/gi,
    '$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3'
  );

  // Check if document is a landscape certificate
  const isLandscape = /landscape|\.certificate-sheet|\.cert-page|size:\s*A4\s*landscape/i.test(htmlContent);
  if (isLandscape) {
    const certBgBase64 = getCertKsRsBgBase64();
    const stempelBase64 = getStempelDsnBase64();
    const bismillahCertBase64 = getBismillahCertBase64();
    const logoCertBase64 = getLogoDsnCertBase64();

    htmlContent = htmlContent
      .replace(/(\\?\${CERT_KS_RS_BG}|\${CERT_KS_RS_BG})/g, certBgBase64)
      .replace(/(\\?\${STEMPEL_DSN}|\${STEMPEL_DSN})/g, stempelBase64)
      .replace(/url\(['"]?[^'"]*cert-ks-rs-bg\.jpg['"]?\)/gi, `url('${certBgBase64}')`)
      .replace(/src=["'][^"']*cert-ks-rs-bg\.jpg["']/gi, `src="${certBgBase64}"`)
      .replace(/src=["'][^"']*stempel-dsn\.png["']/gi, `src="${stempelBase64}"`)
      .replace(/src=["'][^"']*bismillah-cert\.png["']/gi, `src="${bismillahCertBase64}"`)
      .replace(/src=["'][^"']*logo-dsn-cert\.png["']/gi, `src="${logoCertBase64}"`);

    if (!/<base[^>]*href=[\"'][^\"']+[\"'][^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
    }
    return htmlContent;
  }

  // Extract body content and wrap in master-page-table with tfoot spacer
  let headPart = '';
  let bodyInner = htmlContent;
  if (htmlContent.includes('<body')) {
    const headEnd = htmlContent.indexOf('<body');
    headPart = htmlContent.substring(0, headEnd);
    const bodyStart = htmlContent.indexOf('>', headEnd) + 1;
    const bodyEnd = htmlContent.lastIndexOf('</body>');
    bodyInner = htmlContent.substring(bodyStart, bodyEnd !== -1 ? bodyEnd : undefined);
  }

  if (bodyInner.includes('master-page-table')) {
    bodyInner = bodyInner
      .replace(/<table class="master-page-table"[\s\S]*?<tbody>\s*<tr>\s*<td>/gi, '')
      .replace(/<\/td>\s*<\/tr>\s*<\/tbody>\s*<tfoot>[\s\S]*?<\/tfoot>\s*<\/table>/gi, '');
  }

  // Auto-wrap body in letter-body-wrapper if not already present
  if (!bodyInner.includes('letter-body-wrapper')) {
    const bismillahEndRegex = /(<img[^>]*(?:bismillah|Bismillah)[^>]*>[\s\S]*?<\/div>)/i;
    const bismillahMatch = bismillahEndRegex.exec(bodyInner);
    if (bismillahMatch) {
      const cutIndex = bismillahMatch.index + bismillahMatch[0].length;
      const headerPart = bodyInner.substring(0, cutIndex);
      const restPart = bodyInner.substring(cutIndex);
      bodyInner = `${headerPart}\n<div class="letter-body-wrapper" style="margin-left: 15mm; margin-right: 10mm;">\n${restPart}\n</div>`;
    }
  }

  const wrappedBody = `
  ${FOOTER_HTML}
  <table class="master-page-table">
    <tbody>
      <tr>
        <td>
          ${bodyInner}
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>
          <div style="height: 20mm;"></div>
        </td>
      </tr>
    </tfoot>
  </table>
  `;

  if (headPart) {
    htmlContent = `${headPart}<body>\n${wrappedBody}\n</body>\n</html>`;
  } else {
    htmlContent = `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n</head>\n<body>\n${wrappedBody}\n</body>\n</html>`;
  }

  if (!/<base[^>]*href=[\"'][^\"']+[\"'][^>]*>/i.test(htmlContent)) {
    htmlContent = htmlContent.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
  }

  // Inject CSS rules to scale down large logo images in the letterhead and guarantee QR code display
  const imageStyle = `
    <style id="amanah-kop-styles">
      @page {
        size: A4;
        margin-top: 10mm !important;
        margin-bottom: 12mm !important;
        margin-left: 10mm !important;
        margin-right: 10mm !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 10.5pt !important;
        line-height: 1.25 !important;
        color: #111827 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Wrapper to keep 25mm left & 20mm right body margins while Kop Surat uses full 190mm */
      .letter-body-wrapper {
        margin-left: 15mm !important;
        margin-right: 10mm !important;
      }

      /* Master Print Layout Table */
      table.master-page-table {
        width: 100% !important;
        border-collapse: collapse !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      table.master-page-table > tbody > tr > td {
        padding: 0 !important;
        border: none !important;
        vertical-align: top !important;
      }
      table.master-page-table > tfoot > tr > td {
        height: 20mm !important; /* Reserves space so body never overlaps footer */
        padding: 0 !important;
        border: none !important;
      }

      /* Screen presentation: Clean centered A4 preview container with footer at the BOTTOM */
      @media screen {
        body {
          background-color: #f8fafc;
          padding: 20px 10px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .master-page-table {
          max-width: 794px !important;
          width: 100% !important;
          margin: 0 auto !important;
          padding: 10mm 10mm 12mm 10mm !important;
          background: #ffffff !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05) !important;
          border-radius: 4px !important;
          box-sizing: border-box !important;
          order: 1 !important;
        }
        .amanah-letter-footer {
          display: table !important;
          order: 2 !important;
          width: 100% !important;
          max-width: 794px !important;
          margin: 16px auto 24px auto !important;
          padding: 0 10mm !important;
          box-sizing: border-box !important;
        }
        /* Clear Visual Page Break Divider on Screen Preview */
        div[style*="page-break-before: always"],
        div[style*="page-break-before:always"],
        div[style*="break-before: page"],
        .page-break {
          margin-top: 48px !important;
          margin-bottom: 32px !important;
          padding-top: 32px !important;
          border-top: 2px dashed #94a3b8 !important;
          position: relative !important;
        }
        div[style*="page-break-before: always"]::before,
        div[style*="page-break-before:always"]::before,
        div[style*="break-before: page"]::before,
        .page-break::before {
          content: "📄 HALAMAN BERIKUTNYA (LAMPIRAN)" !important;
          display: block !important;
          text-align: center !important;
          font-size: 8.5pt !important;
          font-weight: 700 !important;
          letter-spacing: 1.5px !important;
          color: #475569 !important;
          background: #e2e8f0 !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 9999px !important;
          padding: 4px 18px !important;
          width: fit-content !important;
          margin: -45px auto 24px auto !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
        }
      }

      /* Print / PDF presentation */
      @media print {
        body {
          background: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .master-page-table {
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        tfoot {
          display: table-footer-group !important;
        }
        /* Repeating running footer fixed at bottom: 4mm on EVERY page */
        .amanah-letter-footer {
          display: table !important;
          position: fixed !important;
          bottom: 4mm !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          background: #ffffff !important;
          z-index: 99999 !important;
        }
        div[style*="page-break-before: always"]::before,
        div[style*="page-break-before:always"]::before,
        div[style*="break-before: page"]::before,
        .page-break::before {
          display: none !important;
          content: "" !important;
        }
        div[style*="page-break-before: always"],
        div[style*="page-break-before:always"],
        div[style*="break-before: page"],
        .page-break {
          border-top: none !important;
          padding-top: 0 !important;
          margin-top: 0 !important;
          page-break-before: always !important;
          break-before: page !important;
        }
      }

      /* Eliminate unwanted horizontal lines / borders on page break sections */
      hr { display: none !important; }
      div[style*="border-top: 1px solid #000000"],
      div[style*="border-top:1px solid #000000"],
      div[style*="border-top: 1px solid black"],
      div[style*="border-top:1px solid black"],
      div[style*="border-top: 1px solid #000"],
      div[style*="border-top:1px solid #000"] {
        border-top: none !important;
        padding-top: 0 !important;
      }

      /* Eliminate negative margins on kop surat header */
      div[style*="margin-left: -30px"],
      div[style*="margin-left:-30px"],
      div[style*="margin-left: -40px"],
      div[style*="margin-left:-40px"] {
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-top: 0 !important;
      }

      /* Standardize font size and line height across all letter elements */
      div, p, span, td, th, li, a, ol, ul, b, strong {
        font-family: Arial, Helvetica, sans-serif !important;
      }
      p, td, th, li, ol, ul {
        font-size: 10.5pt !important;
      }
      ol, ul {
        margin-top: 4px !important;
        margin-bottom: 8px !important;
        padding-left: 20px !important;
      }
      li {
        margin-bottom: 3px !important;
        font-size: 10.5pt !important;
        line-height: 1.3 !important;
      }
      p {
        margin-top: 0px !important;
        margin-bottom: 8px !important;
        font-size: 10.5pt !important;
        line-height: 1.35 !important;
      }

      /* Kop Surat Header */
      .kop-surat-img, img[alt*="Kop Surat"] {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
        margin: 0 auto 6px auto !important;
      }

      /* Bismillah - proper, elegant calligraphy */
      img[src*="bismillah"], img[alt*="Bismillah"], .bismillah-img {
        width: 260px !important;
        max-width: 45% !important;
        height: auto !important;
        max-height: 48px !important;
        display: block !important;
        margin: 8px auto 14px auto !important;
        object-fit: contain !important;
        filter: brightness(0) !important;
      }

      /* Spacing of meta table & date block */
      table[style*="calc(100% - 15px)"] td,
      table.meta-table td {
        padding: 2.5px 0 !important;
        line-height: 1.25 !important;
      }

      /* Jadwal table spacing and padding */
      table[style*="margin: 8px auto"],
      table[style*="margin: 15px auto"],
      table[style*="margin-left: 30px"] {
        margin-top: 6px !important;
        margin-bottom: 10px !important;
        font-size: 10.5pt !important;
      }
      table[style*="margin: 8px auto"] td,
      table[style*="margin: 15px auto"] td,
      table[style*="margin-left: 30px"] td {
        padding: 2.5px 0 !important;
        line-height: 1.25 !important;
      }

      /* Signature table spacing */
      table[style*="margin-top: 14px"],
      table[style*="margin-top: 15px"],
      table[style*="margin-top: 30px"] {
        margin-top: 8px !important;
        page-break-inside: avoid !important;
      }
      div[style*="width: 280px"] {
        width: 310px !important;
      }
      div[style*="font-size: 9.5pt"],
      div[style*="font-size: 10pt"][style*="margin-bottom: 6px"] {
        font-size: 9.5pt !important;
        line-height: 1.2 !important;
      }
      div[style*="height: 60px"],
      div[style*="height: 70px"] {
        height: 50px !important;
      }
      div[style*="width: 60px"] img[src*="logo-dsn"],
      div[style*="width: 70px"] img[src*="logo-dsn"] {
        width: 16px !important;
        height: 16px !important;
      }
      .kop-surat img:not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]):not(.bismillah-img), 
      td img:not(.qr-signature-img):not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]):not(.bismillah-img) {
        max-width: 75px !important;
        max-height: 90px !important;
        height: auto !important;
        width: auto !important;
        display: inline-block !important;
        vertical-align: middle !important;
      }
      img.qr-signature-img {
        width: 55px !important;
        height: 55px !important;
        max-width: 55px !important;
        max-height: 55px !important;
        min-width: 55px !important;
        min-height: 55px !important;
        display: inline-block !important;
        object-fit: contain !important;
      }
      div[style*="width: 60px"][style*="height: 60px"],
      div[style*="width: 70px"][style*="height: 70px"] {
        margin: 2px 0 2px 0 !important;
        width: 55px !important;
        height: 55px !important;
      }
      .amanah-letter-footer td {
        font-size: 7.5pt !important;
        line-height: 1.25 !important;
      }
    </style>
  `;
  if (htmlContent.includes('certificate-sheet')) {
    // Certificate document has its own self-contained layout & styles, do not inject standard letter styles
  } else if (htmlContent.includes('id="amanah-kop-styles"')) {
    htmlContent = htmlContent.replace(/<style id="amanah-kop-styles">[\s\S]*?<\/style>/i, imageStyle);
  } else {
    htmlContent = htmlContent.replace('</head>', `${imageStyle}\n</head>`);
  }

  // Convert any 11pt or 12pt font sizes in existing HTML letters to standard 10.5pt (skip for certificates)
  if (!htmlContent.includes('certificate-sheet')) {
    htmlContent = htmlContent.replace(/font-size:\s*11pt/gi, 'font-size: 10.5pt');
  }

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
router.get('/:id/render', authenticate, async (req: AuthRequest, res: Response) => {
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

        const isLandscape = /landscape|\.certificate-sheet|\.cert-page|size:\s*A4\s*landscape/i.test(htmlContent);
        const browser = await launchPuppeteerBrowser();
        const page = await browser.newPage();
        await page.setViewport(isLandscape ? { width: 1400, height: 990, deviceScaleFactor: 2 } : { width: 794, height: 1123, deviceScaleFactor: 2 });
        await page.emulateMediaType('print');

        await page.setContent(htmlContent, { waitUntil: ['load', 'domcontentloaded'], timeout: 60000 });

        const pdfOptions: any = {
          format: 'A4',
          landscape: isLandscape,
          printBackground: true,
        };
        if (isLandscape) {
          pdfOptions.margin = { top: 0, bottom: 0, left: 0, right: 0 };
        }
        const rawPdfBuffer = await page.pdf(pdfOptions);
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

        const isLandscape = /landscape|\.certificate-sheet|\.cert-page|size:\s*A4\s*landscape/i.test(htmlContent);
        const browser = await launchPuppeteerBrowser();
        const page = await browser.newPage();
        await page.setViewport(isLandscape ? { width: 1400, height: 990, deviceScaleFactor: 2 } : { width: 1200, height: 1600, deviceScaleFactor: 2 });
        await page.emulateMediaType('screen');

        await page.setContent(htmlContent, { waitUntil: ['load', 'domcontentloaded'], timeout: 60000 });

        const rawPdfBuffer = await page.pdf({
          format: 'A4',
          landscape: isLandscape,
          printBackground: true,
          margin: isLandscape ? { top: 0, bottom: 0, left: 0, right: 0 } : { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
        });
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
      fileUrl: file.fileUrl
        ? (file.fileUrl.startsWith('http') ? file.fileUrl : (file.fileUrl.startsWith('/') ? file.fileUrl : `/${file.fileUrl}`))
        : `${baseUrl}/documents/${id}/evidence/files/${file.id}/download`,
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
router.get('/:id/evidence/files/:fileId/download', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    const evidenceFile = await prisma.evidenceFile.findUnique({ where: { id: String(fileId) } });
    if (!evidenceFile) return res.status(404).json({ status: 'error', message: 'File not found' });

    const rawPath = evidenceFile.fileUrl || '';
    const cleanPath = rawPath.replace(/^\/+/, '');
    const filename = path.basename(cleanPath);

    const candidates = [
      rawPath,
      path.resolve(process.cwd(), cleanPath),
      path.resolve(process.cwd(), 'uploads', cleanPath.replace(/^uploads\//, '')),
      path.resolve(process.cwd(), 'uploads', filename),
      path.resolve(process.cwd(), 'uploads/public-submissions', filename),
      path.resolve(process.cwd(), '../uploads', cleanPath.replace(/^uploads\//, '')),
      path.resolve('/var/www/mui-dsn-naskah/backend/uploads', filename),
      path.resolve('/var/www/mui-dsn-naskah/uploads', filename),
    ];

    let resolvedPath: string | null = null;
    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        resolvedPath = cand;
        break;
      }
    }

    if (!resolvedPath) {
      return res.status(404).json({ status: 'error', message: 'Physical file not found on disk' });
    }

    res.setHeader('Content-Type', evidenceFile.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(evidenceFile.name)}"`);

    const fileStream = fs.createReadStream(resolvedPath);
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

// ── HELPER: GET DOCUMENT PDF BUFFER & METADATA ──
export async function getDocumentPdfBuffer(
  documentId: string,
  req?: Request | AuthRequest
): Promise<{ buffer: Buffer; fileName: string; title: string; documentNumber: string }> {
  const document = await prisma.document.findUnique({
    where: { id: String(documentId) },
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
    throw new Error('Dokumen tidak ditemukan');
  }

  const version = document.versions[0];
  if (!version) {
    throw new Error('Versi berkas dokumen tidak ditemukan');
  }

  const authHeader = req?.headers?.authorization;
  const filePath = await ensureExistingFilePath(version.fileUrl, document.id, authHeader);
  if (!filePath) {
    throw new Error('Berkas fisik dokumen tidak ditemukan di server.');
  }

  const fileExtension = path.extname(filePath).toLowerCase();
  const isHtml = version.mimeType === 'text/html' || fileExtension === '.html' || fileExtension === '.htm';

  const cleanDocNum = (document.documentNumber || version.fileName || 'dokumen')
    .replace(/[\/\\?%*:|"<>]/g, '_');
  const safePdfFileName = `${cleanDocNum}.pdf`;

  if (isHtml) {
    const rawHtml = await fs.promises.readFile(filePath, 'utf8');
    const httpUrlBase = req ? (getApiBaseUrl(req) + '/') : 'http://localhost:4002/api/';
    const baseUrl = httpUrlBase;

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
    const isLandscape = /landscape|\.certificate-sheet|\.cert-page|size:\s*A4\s*landscape/i.test(htmlContent);

    const browser = await launchPuppeteerBrowser();
    const page = await browser.newPage();
    await page.setViewport(isLandscape ? { width: 1400, height: 990, deviceScaleFactor: 2 } : { width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.emulateMediaType('print');

    await page.setContent(htmlContent, { waitUntil: ['load', 'domcontentloaded'], timeout: 60000 });

    const pdfOptions: any = {
      format: 'A4',
      landscape: isLandscape,
      printBackground: true,
    };
    if (isLandscape) {
      pdfOptions.margin = { top: 0, bottom: 0, left: 0, right: 0 };
    }
    const rawPdfBuffer = await page.pdf(pdfOptions);
    await browser.close();

    const pdfBuffer = await mergePdfWithEvidence(Buffer.from(rawPdfBuffer), document.evidenceFiles || []);
    return {
      buffer: Buffer.from(pdfBuffer),
      fileName: safePdfFileName,
      title: document.title,
      documentNumber: document.documentNumber || '',
    };
  }

  // If already PDF
  const rawFileBytes = await fs.promises.readFile(filePath);
  let finalPdfBuffer: Buffer = Buffer.from(rawFileBytes);
  if (document.evidenceFiles && document.evidenceFiles.length > 0) {
    const merged = await mergePdfWithEvidence(rawFileBytes, document.evidenceFiles);
    finalPdfBuffer = Buffer.from(merged);
  }

  return {
    buffer: finalPdfBuffer,
    fileName: safePdfFileName,
    title: document.title,
    documentNumber: document.documentNumber || '',
  };
}

// ── GET INVITATIONS & LINKED MEETINGS FOR A DOCUMENT ──
router.get('/:id/invitations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const meetings = await prisma.meeting.findMany({
      where: { documentId: String(id) },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: meetings });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SEND OUTGOING DOCUMENT INVITATION VIA SMTP (WITH AUTO PDF ATTACHMENT & AGENDA SYNC) ──
router.post('/:id/send-invitations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      invitationTitle,
      meetingDate,
      location,
      syncAgenda = true,
      recipients = [],
      customNote,
    } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Daftar penerima undangan (recipients) wajib dipilih minimal 1 orang.',
      });
    }

    // 1. Fetch document and generate official PDF buffer
    let pdfData: { buffer: Buffer; fileName: string; title: string; documentNumber: string };
    try {
      pdfData = await getDocumentPdfBuffer(String(id), req);
    } catch (pdfErr: any) {
      console.error(`[SendInvitation] Error generating PDF for doc ${id}:`, pdfErr);
      return res.status(400).json({
        status: 'error',
        message: `Gagal memproses berkas PDF surat: ${pdfErr.message}`,
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: String(id) },
      include: {
        category: true,
      },
    });

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan' });
    }

    const effectiveTitle = invitationTitle || document.title;
    const documentNumber = document.documentNumber || pdfData.documentNumber;

    // 2. Manage Meeting / Agenda record
    let linkedMeeting: any = null;
    let meetingAttendees: any[] = [];

    if (syncAgenda) {
      // Check if a meeting is already linked to this document
      linkedMeeting = await prisma.meeting.findFirst({
        where: { documentId: String(id) },
      });

      // Prepare attendee objects
      meetingAttendees = recipients.map((r: any) => ({
        userId: r.userId || null,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        department: r.department || (r.userId ? 'Internal' : 'Eksternal'),
        jabatan: r.jabatan || '',
        isExternal: !r.userId,
        status: 'UNDANGAN',
        invitationSent: false,
      }));

      const meetingDateTime = meetingDate ? new Date(meetingDate) : new Date();
      const meetingLocation = location || 'Ruang Rapat Pleno DSN-MUI Lt. 3 / Zoom Cloud Meeting';

      if (!linkedMeeting) {
        // Auto-generate agendaNumber
        const year = meetingDateTime.getFullYear();
        const month = meetingDateTime.getMonth() + 1;
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const monthRoman = romanMonths[month - 1];

        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year + 1, 0, 1);
        const meetingCount = await prisma.meeting.count({
          where: { createdAt: { gte: startOfYear, lt: endOfYear } },
        });
        const seqMeeting = (meetingCount + 1).toString().padStart(3, '0');

        let docNumPart = '000';
        if (documentNumber) {
          const parts = documentNumber.split('/');
          if (parts.length > 0) docNumPart = parts[0] || '000';
        }

        let agendaNumber = `${seqMeeting}/${monthRoman}/${year}/${docNumPart}`;
        const existingAgenda = await prisma.meeting.findUnique({ where: { agendaNumber } });
        if (existingAgenda) {
          agendaNumber = `${seqMeeting}-${Date.now()}/${monthRoman}/${year}/${docNumPart}`;
        }

        linkedMeeting = await prisma.meeting.create({
          data: {
            title: effectiveTitle,
            agendaNumber,
            dateTime: meetingDateTime,
            location: meetingLocation,
            description: customNote || `Undangan resmi untuk surat keluar: ${document.title} (${documentNumber || '-'})`,
            targetType: 'CROSS_INTERNAL',
            status: 'AKTIF',
            attendees: meetingAttendees,
            documentId: String(id),
            invitationSent: false,
          },
        });
      } else {
        // Merge attendees so existing attendees are preserved
        const existingAttendees = (linkedMeeting.attendees as any[]) || [];
        const mergedAttendees = [...existingAttendees];
        for (const newAtt of meetingAttendees) {
          const idx = mergedAttendees.findIndex(
            (a: any) => a.email?.toLowerCase() === newAtt.email?.toLowerCase()
          );
          if (idx >= 0) {
            mergedAttendees[idx] = { ...mergedAttendees[idx], ...newAtt };
          } else {
            mergedAttendees.push(newAtt);
          }
        }

        linkedMeeting = await prisma.meeting.update({
          where: { id: linkedMeeting.id },
          data: {
            title: effectiveTitle,
            dateTime: meetingDateTime,
            location: meetingLocation,
            status: 'AKTIF',
            attendees: mergedAttendees,
          },
        });
      }
    }

    // 3. Send individualized emails to each recipient via SMTP
    const results: Array<{
      email: string;
      name: string;
      status: 'SUCCESS' | 'FAILED';
      messageId?: string | undefined;
      error?: string | undefined;
      sentAt: string;
    }> = [];

    for (const recipient of recipients) {
      const email = recipient.email?.trim();
      const name = recipient.name?.trim() || email;

      if (!email) {
        results.push({
          email: '',
          name,
          status: 'FAILED',
          error: 'Email penerima tidak valid atau kosong',
          sentAt: new Date().toISOString(),
        });
        continue;
      }

      const sendRes = await sendDocumentInvitationEmail({
        toEmail: email,
        recipientName: name,
        invitationTitle: effectiveTitle,
        documentTitle: document.title,
        documentNumber,
        pdfBuffer: pdfData.buffer,
        pdfFileName: pdfData.fileName,
        meetingDetails:
          meetingDate || location
            ? {
                dateTime: meetingDate,
                location,
              }
            : undefined,
      });

      if (sendRes.success) {
        results.push({
          email,
          name,
          status: 'SUCCESS',
          messageId: sendRes.messageId,
          sentAt: new Date().toISOString(),
        });
      } else {
        results.push({
          email,
          name,
          status: 'FAILED',
          error: sendRes.error,
          sentAt: new Date().toISOString(),
        });
      }
    }

    // 4. Update Meeting attendees status with sent info
    if (linkedMeeting) {
      const currentList = (linkedMeeting.attendees as any[]) || [];
      const updatedList = currentList.map((att: any) => {
        const matchingResult = results.find(
          (r) => r.email.toLowerCase() === att.email?.toLowerCase()
        );
        if (matchingResult) {
          return {
            ...att,
            invitationSent: matchingResult.status === 'SUCCESS',
            lastSentAt: matchingResult.sentAt,
            sendError: matchingResult.error || null,
          };
        }
        return att;
      });

      await prisma.meeting.update({
        where: { id: linkedMeeting.id },
        data: {
          invitationSent: results.some((r) => r.status === 'SUCCESS'),
          attendees: updatedList,
        },
      });

      // Internal notifications
      for (const resItem of results) {
        if (resItem.status === 'SUCCESS') {
          const rec = recipients.find(
            (r: any) => r.email.toLowerCase() === resItem.email.toLowerCase()
          );
          if (rec?.userId) {
            triggerQueueUpdate(rec.userId).catch(() => {});
            PushService.sendNotification({
              userId: rec.userId,
              title: 'Undangan Resmi DSN-MUI',
              body: `Anda menerima undangan: "${effectiveTitle}". Berkas surat keluar telah dikirimkan ke email Anda.`,
              data: {
                documentId: String(id),
                meetingId: linkedMeeting.id,
                type: 'DOCUMENT_INVITATION',
              },
            }).catch(() => {});
            sendNotification({
              userId: rec.userId,
              type: 'DOCUMENT_INVITATION',
              title: 'Undangan Resmi DSN-MUI',
              message: `Anda menerima undangan: "${effectiveTitle}". Berkas surat keluar telah dikirimkan ke email Anda.`,
              link: `/agenda`,
            }).catch(() => {});
          }
        }
      }
    }

    const sentCount = results.filter((r) => r.status === 'SUCCESS').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;

    res.json({
      status: 'success',
      message: `Proses pengiriman selesai. ${sentCount} email berhasil terkirim, ${failedCount} gagal.`,
      data: {
        total: results.length,
        sent: sentCount,
        failed: failedCount,
        results,
        meetingId: linkedMeeting?.id || null,
        agendaNumber: linkedMeeting?.agendaNumber || null,
      },
    });
  } catch (error: any) {
    console.error('[SendInvitation] Fatal error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
