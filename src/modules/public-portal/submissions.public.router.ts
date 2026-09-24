import { Router } from 'express';
import type { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import {
  authenticatePublic,
  type PublicAuthRequest,
} from './middleware.public.js';
import { sendSubmissionConfirmationEmail } from '../../lib/mailer.service.js';

const router = Router();

// ── STORAGE CONFIG ──────────────────────────────────────────────────────────
const uploadSubmissionsDir = path.join(process.cwd(), 'uploads', 'public-submissions');
if (!fs.existsSync(uploadSubmissionsDir)) {
  fs.mkdirSync(uploadSubmissionsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadSubmissionsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `pub-doc-${uniqueSuffix}-${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit per user requirement
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file ${ext} tidak diizinkan. Gunakan format PDF, DOCX, XLSX, atau Gambar (JPG/PNG).`));
    }
  },
});

// ── GENERIC SINGLE FILE UPLOAD ──────────────────────────────────────────────
router.post('/upload-file', authenticatePublic, upload.single('file'), async (req: PublicAuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Berkas wajib diunggah.',
      });
    }

    const relativeUrl = `/uploads/public-submissions/${file.filename}`;
    return res.json({
      status: 'success',
      message: 'Berkas berhasil diunggah.',
      data: {
        fileName: file.originalname,
        fileUrl: relativeUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunggah berkas.',
      error: error.message,
    });
  }
});

// Helper to generate unique submission number
async function generateSubmissionNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);

  const count = await prisma.publicSubmission.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
  });

  const nextSeq = (count + 1).toString().padStart(6, '0');
  return `AMN-${currentYear}-${nextSeq}`;
}

// ── GET SUBMISSIONS LIST & STATS ────────────────────────────────────────────
router.get('/', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;
    const { search, status, typeId, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSize = Math.max(1, Math.min(50, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * pageSize;

    const whereClause: any = {
      companyId,
    };

    if (status && String(status) !== 'ALL') {
      if (String(status) === 'IN_PROGRESS') {
        whereClause.status = {
          in: ['SUBMITTED', 'VERIFIKASI_ADMINISTRASI', 'SEDANG_DIPROSES', 'DALAM_PEMBAHASAN', 'PROSES_KEPUTUSAN', 'DISETUJUI'],
        };
      } else if (String(status) === 'ACTION_NEEDED') {
        whereClause.status = 'PERLU_PERBAIKAN';
      } else if (String(status) === 'COMPLETED') {
        whereClause.status = {
          in: ['SERTIFIKAT_DITERBITKAN', 'SELESAI'],
        };
      } else {
        whereClause.status = String(status);
      }
    }

    if (typeId) {
      whereClause.submissionTypeId = String(typeId);
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      whereClause.OR = [
        { submissionNumber: { contains: q, mode: 'insensitive' } },
        { companyLetterNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { productOrServiceName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [submissions, totalCount, statsCounts] = await Promise.all([
      prisma.publicSubmission.findMany({
        where: whereClause,
        include: {
          submissionType: { select: { name: true, code: true, icon: true } },
          applicantUser: { select: { fullName: true, email: true, phone: true } },
          certificate: { select: { id: true, certificateNumber: true, issueDate: true, validUntil: true } },
          _count: { select: { documents: true, revisions: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.publicSubmission.count({ where: whereClause }),
      prisma.publicSubmission.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),
    ]);

    // Calculate aggregated dashboard stats
    let total = 0;
    let draft = 0;
    let inProgress = 0;
    let actionNeeded = 0;
    let completed = 0;

    for (const s of statsCounts) {
      const count = s._count.id;
      total += count;
      if (s.status === 'DRAFT') draft += count;
      else if (s.status === 'PERLU_PERBAIKAN') actionNeeded += count;
      else if (['SERTIFIKAT_DITERBITKAN', 'SELESAI'].includes(s.status)) completed += count;
      else inProgress += count;
    }

    return res.json({
      status: 'success',
      data: {
        submissions,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
        stats: {
          total,
          draft,
          inProgress,
          actionNeeded,
          completed,
        },
      },
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error fetching list:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat daftar pengajuan.',
      error: error.message,
    });
  }
});

// ── CREATE OR UPDATE DRAFT ──────────────────────────────────────────────────
router.post('/draft', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;
    const userId = req.publicUser!.id;
    const {
      id,
      submissionTypeId,
      title,
      productOrServiceName,
      description,
      companyLetterNumber,
      companyLetterDate,
      stepCompleted = 1,
    } = req.body;

    if (!submissionTypeId && !title && !id) {
      return res.status(400).json({
        status: 'error',
        message: 'Mohon pilih jenis pengajuan atau isi judul pengajuan.',
      });
    }

    // Resolve submission type name
    let typeName = 'Pengajuan Kesesuaian Syariah';
    if (submissionTypeId) {
      const subType = await prisma.submissionTypeMaster.findUnique({
        where: { id: String(submissionTypeId) },
      });
      if (subType) typeName = subType.name;
    }

    let submission;

    if (id) {
      // Update existing draft
      const existing = await prisma.publicSubmission.findFirst({
        where: { id: String(id), companyId },
      });

      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: 'Draf pengajuan tidak ditemukan.',
        });
      }

      if (existing.status !== 'DRAFT' && existing.status !== 'PERLU_PERBAIKAN') {
        return res.status(400).json({
          status: 'error',
          message: 'Pengajuan yang sudah dikirim tidak dapat diubah drafnya.',
        });
      }

      submission = await prisma.publicSubmission.update({
        where: { id: existing.id },
        data: {
          submissionTypeId: submissionTypeId || existing.submissionTypeId,
          submissionTypeName: typeName || existing.submissionTypeName,
          title: title || existing.title,
          productOrServiceName: productOrServiceName !== undefined ? productOrServiceName : existing.productOrServiceName,
          description: description !== undefined ? description : existing.description,
          companyLetterNumber: companyLetterNumber !== undefined ? companyLetterNumber : existing.companyLetterNumber,
          companyLetterDate: companyLetterDate ? new Date(companyLetterDate) : existing.companyLetterDate,
          stepCompleted: Math.max(existing.stepCompleted, Number(stepCompleted) || 1),
        },
        include: {
          submissionType: { include: { requirements: true } },
          documents: true,
        },
      });
    } else {
      // Create new draft
      const submissionNumber = await generateSubmissionNumber();

      submission = await prisma.publicSubmission.create({
        data: {
          submissionNumber,
          companyId,
          applicantUserId: userId,
          submissionTypeId: submissionTypeId || null,
          submissionTypeName: typeName,
          title: title || `Permohonan Kesesuaian Syariah - ${req.publicUser!.companyName}`,
          productOrServiceName: productOrServiceName || null,
          description: description || null,
          companyLetterNumber: companyLetterNumber || null,
          companyLetterDate: companyLetterDate ? new Date(companyLetterDate) : null,
          status: 'DRAFT',
          stepCompleted: Number(stepCompleted) || 1,
        },
        include: {
          submissionType: { include: { requirements: true } },
          documents: true,
        },
      });

      // Audit Log
      await prisma.publicAuditLog.create({
        data: {
          action: 'SUBMISSION_DRAFT_CREATED',
          resource: 'PublicSubmission',
          resourceId: submission.id,
          companyId,
          userId,
          ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
          userAgent: req.get('user-agent') ?? null,
          metadata: { submissionNumber: submission.submissionNumber },
        },
      });
    }

    return res.json({
      status: 'success',
      message: 'Draf pengajuan berhasil disimpan.',
      data: submission,
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error saving draft:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menyimpan draf pengajuan.',
      error: error.message,
    });
  }
});

// ── GET SUBMISSION DETAIL ───────────────────────────────────────────────────
router.get('/:id', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.publicUser!.companyId;

    const submission = await prisma.publicSubmission.findFirst({
      where: {
        id: String(id),
        companyId, // Strict tenant isolation
      },
      include: {
        company: true,
        applicantUser: {
          select: { id: true, fullName: true, email: true, phone: true, position: true },
        },
        submissionType: {
          include: {
            requirements: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        timeline: {
          where: { visibility: 'PUBLIC' },
          orderBy: { createdAt: 'asc' },
        },
        revisions: {
          orderBy: { requestedAt: 'desc' },
        },
        certificate: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengajuan tidak ditemukan atau Anda tidak memiliki akses.',
      });
    }

    return res.json({
      status: 'success',
      data: submission,
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error getting detail:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat detail pengajuan.',
      error: error.message,
    });
  }
});

// ── DOWNLOAD ATTACHED INTERVIEW INVITATION LETTER (Surat Keluar DSN-MUI) ──
router.get('/:id/invitation-letter/download', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.publicUser!.companyId;

    const submission = await prisma.publicSubmission.findFirst({
      where: { id: String(id), companyId },
    });

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengajuan tidak ditemukan atau Anda tidak memiliki akses.',
      });
    }

    const invitation = (submission.interviewInvitation as any) || null;
    if (!invitation || (!invitation.outgoingLetterId && !invitation.outgoingLetterFileUrl)) {
      return res.status(404).json({
        status: 'error',
        message: 'Surat undangan resmi belum dilampirkan pada wawancara ini.',
      });
    }

    let filePath: string | null = null;
    let fileName =
      invitation.outgoingLetterFileName ||
      `Surat_Undangan_${(invitation.invitationNumber || 'DSN_MUI').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    if (invitation.outgoingLetterId) {
      const doc = await prisma.document.findUnique({
        where: { id: String(invitation.outgoingLetterId) },
        include: { versions: { orderBy: { versionNum: 'desc' }, take: 1 } },
      });
      if (doc?.versions?.[0]) {
        const v = doc.versions[0];
        fileName = v.fileName || fileName;
        filePath = path.resolve(process.cwd(), v.fileUrl.startsWith('/') ? v.fileUrl.slice(1) : v.fileUrl);
        if (!fs.existsSync(filePath)) {
          const uploadsCandidate = path.resolve(process.cwd(), 'uploads', path.basename(v.fileUrl));
          if (fs.existsSync(uploadsCandidate)) {
            filePath = uploadsCandidate;
          }
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      if (invitation.outgoingLetterFileUrl) {
        const raw = invitation.outgoingLetterFileUrl;
        const candidate = path.resolve(process.cwd(), raw.startsWith('/') ? raw.slice(1) : raw);
        if (fs.existsSync(candidate)) {
          filePath = candidate;
        } else {
          const uploadsCandidate = path.resolve(process.cwd(), 'uploads', path.basename(raw));
          if (fs.existsSync(uploadsCandidate)) {
            filePath = uploadsCandidate;
          }
        }
      }
    }

    if (filePath && fs.existsSync(filePath)) {
      const ext = path.extname(fileName).toLowerCase();
      if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
      } else if (ext === '.html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.sendFile(filePath);
    }

    return res.status(404).json({
      status: 'error',
      message: 'Berkas fisik surat undangan tidak ditemukan di server.',
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error downloading invitation letter:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunduh surat undangan.',
      error: error.message,
    });
  }
});

// ── UPLOAD OFFICIAL LETTER (Step 2) ─────────────────────────────────────────
router.post('/:id/upload-letter', authenticatePublic, upload.single('file'), async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.publicUser!.companyId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Berkas surat permohonan wajib diunggah.',
      });
    }

    const submission = await prisma.publicSubmission.findFirst({
      where: { id: String(id), companyId },
    });

    if (!submission) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({
        status: 'error',
        message: 'Pengajuan tidak ditemukan.',
      });
    }

    // Relative public URL
    const relativeUrl = `/uploads/public-submissions/${file.filename}`;

    const updated = await prisma.publicSubmission.update({
      where: { id: submission.id },
      data: {
        officialLetterUrl: relativeUrl,
        officialLetterName: file.originalname,
        officialLetterSize: file.size,
        stepCompleted: Math.max(submission.stepCompleted, 2),
      },
    });

    return res.json({
      status: 'success',
      message: 'Surat permohonan berhasil diunggah.',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunggah surat permohonan.',
      error: error.message,
    });
  }
});

// ── UPLOAD REQUIREMENT DOCUMENT (Step 3) ────────────────────────────────────
router.post('/:id/upload-document', authenticatePublic, upload.single('file'), async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { requirementMasterId, requirementName, isMandatory = 'true', notes } = req.body;
    const companyId = req.publicUser!.companyId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Berkas dokumen wajib diunggah.',
      });
    }

    if (!requirementName) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        status: 'error',
        message: 'Nama dokumen persyaratan wajib dicantumkan.',
      });
    }

    const submission = await prisma.publicSubmission.findFirst({
      where: { id: String(id), companyId },
    });

    if (!submission) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({
        status: 'error',
        message: 'Pengajuan tidak ditemukan.',
      });
    }

    const relativeUrl = `/uploads/public-submissions/${file.filename}`;

    // If document for same requirement already exists, update/replace it
    let doc;
    if (requirementMasterId) {
      const existingDoc = await prisma.publicSubmissionDocument.findFirst({
        where: {
          submissionId: submission.id,
          requirementMasterId: String(requirementMasterId),
        },
      });

      if (existingDoc) {
        // Delete old physical file if exists
        const oldPath = path.join(process.cwd(), existingDoc.fileUrl.startsWith('/') ? existingDoc.fileUrl.slice(1) : existingDoc.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        doc = await prisma.publicSubmissionDocument.update({
          where: { id: existingDoc.id },
          data: {
            fileName: file.originalname,
            fileUrl: relativeUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: 'VALID',
            notes: notes || null,
          },
        });
      }
    }

    if (!doc) {
      doc = await prisma.publicSubmissionDocument.create({
        data: {
          submissionId: submission.id,
          requirementMasterId: requirementMasterId || null,
          requirementName: requirementName.trim(),
          fileName: file.originalname,
          fileUrl: relativeUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          isMandatory: String(isMandatory) === 'true',
          status: 'VALID',
          notes: notes || null,
        },
      });
    }

    await prisma.publicSubmission.update({
      where: { id: submission.id },
      data: {
        stepCompleted: Math.max(submission.stepCompleted, 3),
      },
    });

    return res.status(201).json({
      status: 'success',
      message: `Dokumen ${doc.requirementName} berhasil diunggah.`,
      data: doc,
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error uploading requirement doc:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunggah dokumen persyaratan.',
      error: error.message,
    });
  }
});

// ── DELETE REQUIREMENT DOCUMENT ─────────────────────────────────────────────
router.delete('/:id/documents/:docId', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id, docId } = req.params;
    const companyId = req.publicUser!.companyId;

    const submission = await prisma.publicSubmission.findFirst({
      where: { id: String(id), companyId },
    });

    if (!submission) {
      return res.status(404).json({ status: 'error', message: 'Pengajuan tidak ditemukan.' });
    }

    const doc = await prisma.publicSubmissionDocument.findFirst({
      where: { id: String(docId), submissionId: submission.id },
    });

    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });
    }

    // Remove file from disk
    const filePath = path.join(process.cwd(), doc.fileUrl.startsWith('/') ? doc.fileUrl.slice(1) : doc.fileUrl);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    await prisma.publicSubmissionDocument.delete({
      where: { id: doc.id },
    });

    return res.json({
      status: 'success',
      message: 'Dokumen berhasil dihapus.',
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SUBMIT SUBMISSION (Step 4 -> Atomic ERP Sync) ───────────────────────────
router.post('/:id/submit', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.publicUser!.companyId;
    const userId = req.publicUser!.id;

    const submission = await prisma.publicSubmission.findFirst({
      where: { id: String(id), companyId },
      include: {
        company: true,
        submissionType: { include: { requirements: true } },
        documents: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengajuan tidak ditemukan.',
      });
    }

    if (submission.status !== 'DRAFT' && submission.status !== 'PERLU_PERBAIKAN') {
      return res.status(400).json({
        status: 'error',
        message: `Pengajuan ini sudah berstatus "${submission.status}" dan tidak dapat dikirim ulang.`,
      });
    }

    if (!submission.officialLetterUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Surat permohonan resmi perusahaan wajib diunggah pada Langkah 2.',
      });
    }

    // Validate mandatory requirements
    if (submission.submissionType?.requirements) {
      const mandatoryReqs = submission.submissionType.requirements.filter((r) => r.isMandatory);
      for (const reqItem of mandatoryReqs) {
        const uploaded = submission.documents.find(
          (d) => d.requirementMasterId === reqItem.id || d.requirementName.toLowerCase().includes(reqItem.name.toLowerCase())
        );
        if (!uploaded) {
          return res.status(400).json({
            status: 'error',
            message: `Dokumen wajib belum lengkap: ${reqItem.name}.`,
          });
        }
      }
    }

    // ATOMIC TRANSACTION: Update Submission + Create ERP Document (Surat Masuk)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get primary organization in ERP (DSN-MUI)
      let org = await tx.organization.findFirst({
        where: { id: 'org-mui-001' },
      });
      if (!org) {
        org = await tx.organization.findFirst();
      }
      const organizationId = org ? org.id : 'org-mui-001';

      // 2. Get category & classification for Surat Masuk
      let category = await tx.documentCategory.findFirst({
        where: { name: { contains: 'Masuk', mode: 'insensitive' } },
      });
      if (!category) {
        category = await tx.documentCategory.create({
          data: { name: 'Surat Masuk Permohonan Syariah' },
        });
      }

      let classification = await tx.documentClassification.findFirst({
        where: { level: 'BIASA' },
      });
      if (!classification) {
        classification = await tx.documentClassification.findFirst();
      }
      if (!classification) {
        classification = await tx.documentClassification.create({
          data: { level: 'BIASA', name: 'Biasa' },
        });
      }

      // 3. Get an internal creator user (Admin/Staff in ERP)
      let internalUser = await tx.user.findFirst({
        where: { isActive: true },
      });
      const creatorId = internalUser ? internalUser.id : userId;

      // 4. Create ERP Document (Surat Masuk)
      const erpDoc = await tx.document.create({
        data: {
          title: `[Permohonan Syariah] ${submission.company.name} - ${submission.title}`,
          documentNumber: submission.companyLetterNumber || submission.submissionNumber,
          organizationId,
          categoryId: category.id,
          subCategory: submission.submissionTypeName,
          classificationId: classification.id,
          creatorId,
          documentType: 'INCOMING',
          approvalFlowType: 'SEQUENTIAL',
          status: 'BARU',
          disposisiStatus: 'BARU',
          documentDate: submission.companyLetterDate || new Date(),
          receivedDate: new Date(),
          versions: {
            create: {
              versionNum: 1,
              fileUrl: submission.officialLetterUrl || '/images/kop-surat.png',
              fileName: submission.officialLetterName || 'Surat_Permohonan.pdf',
              fileSize: submission.officialLetterSize || 1024,
              mimeType: 'application/pdf',
              createdBy: creatorId,
              changeNotes: `Permohonan publik dari ${submission.company.name} (Tiket: ${submission.submissionNumber})`,
            },
          },
        },
      });

      // 5. Create Evidence Folder & Evidence Files in ERP for all attached requirement docs
      const folder = await tx.evidenceFolder.create({
        data: {
          name: `Lampiran Pengajuan ${submission.submissionNumber}`,
          documentId: erpDoc.id,
        },
      });

      for (const d of submission.documents) {
        await tx.evidenceFile.create({
          data: {
            name: `${d.requirementName} - ${d.fileName}`,
            fileUrl: d.fileUrl,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            folderId: folder.id,
            documentId: erpDoc.id,
          },
        });
      }

      // 6. Update Public Submission
      const updatedSubmission = await tx.publicSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          stepCompleted: 5,
          erpDocumentId: erpDoc.id,
        },
      });

      // 7. Create Public Activity Timeline
      await tx.publicSubmissionActivity.create({
        data: {
          submissionId: submission.id,
          title: 'Pengajuan Berhasil Dikirim',
          description: 'Permohonan kesesuaian syariah telah diterima oleh DSN-MUI dan terdaftar dalam sistem Surat Masuk.',
          publicStatus: 'Pengajuan Terkirim',
          visibility: 'PUBLIC',
          performedByName: 'Sistem Amanah DSN-MUI',
        },
      });

      // 8. Notification to Company
      await tx.publicNotification.create({
        data: {
          companyId,
          userId,
          title: `Pengajuan ${submission.submissionNumber} Telah Dikirim`,
          message: `Permohonan "${submission.title}" berhasil dikirim ke DSN-MUI. Anda dapat memantau status secara berkala.`,
          type: 'SUCCESS',
          link: `/submissions/${submission.id}`,
        },
      });

      // 9. Public Audit Log
      await tx.publicAuditLog.create({
        data: {
          action: 'SUBMISSION_SUBMITTED',
          resource: 'PublicSubmission',
          resourceId: submission.id,
          companyId,
          userId,
          ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
          userAgent: req.get('user-agent') ?? null,
          metadata: {
            submissionNumber: submission.submissionNumber,
            erpDocumentId: erpDoc.id,
            docCount: submission.documents.length,
          },
        },
      });

      return { updatedSubmission, erpDoc };
    });

    // Send confirmation email asynchronously
    const applicantEmail = req.publicUser?.email;
    const applicantName = req.publicUser?.fullName || 'Narahubung Perusahaan';
    const compName = submission.company.name;
    const candidateNames = Array.isArray(submission.candidates)
      ? (submission.candidates as any[]).map((c) => c.name).filter(Boolean)
      : [];

    if (applicantEmail) {
      sendSubmissionConfirmationEmail({
        toEmail: applicantEmail,
        recipientName: applicantName,
        companyName: compName,
        submissionNumber: result.updatedSubmission.submissionNumber,
        submissionTitle: result.updatedSubmission.title,
        serviceName: result.updatedSubmission.submissionTypeName,
        candidateNames,
        submissionId: result.updatedSubmission.id,
      }).catch((err) => console.error('[Public Submissions] Failed to send async confirmation email:', err));
    }

    return res.json({
      status: 'success',
      message: 'Permohonan kesesuaian syariah berhasil dikirim ke DSN-MUI!',
      data: {
        submissionNumber: result.updatedSubmission.submissionNumber,
        status: result.updatedSubmission.status,
        submittedAt: result.updatedSubmission.submittedAt,
        id: result.updatedSubmission.id,
      },
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error submitting application:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengirim pengajuan.',
      error: error.message,
    });
  }
});

// ── RESPOND TO REVISION REQUEST ─────────────────────────────────────────────
router.post('/:id/revision', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responseNotes, candidates, officialLetter, additionalDoc } = req.body;
    const companyId = req.publicUser!.companyId;
    const userId = req.publicUser!.id;

    const submission = await prisma.publicSubmission.findFirst({
      where: { id: String(id), companyId },
      include: { revisions: { orderBy: { requestedAt: 'desc' }, take: 1 } },
    });

    if (!submission) {
      return res.status(404).json({ status: 'error', message: 'Pengajuan tidak ditemukan.' });
    }

    if (submission.status !== 'PERLU_PERBAIKAN') {
      return res.status(400).json({
        status: 'error',
        message: 'Pengajuan ini tidak sedang dalam status permintaan perbaikan.',
      });
    }

    // Update revision status, submission documents, and submission status back to processing
    await prisma.$transaction(async (tx) => {
      // Mark latest revision as responded
      if (submission.revisions[0]) {
        await tx.publicSubmissionRevision.update({
          where: { id: submission.revisions[0].id },
          data: {
            status: 'RESPONDED',
            responseNotes: responseNotes || 'Dokumen perbaikan telah diperbarui oleh pemohon.',
            respondedAt: new Date(),
          },
        });
      }

      const updateData: any = {
        status: 'SEDANG_DIPROSES',
        dpsStage: 'VALIDASI_DOKUMEN',
      };

      if (candidates && Array.isArray(candidates)) {
        updateData.candidates = candidates;
      }

      if (officialLetter && officialLetter.fileUrl) {
        updateData.officialLetterUrl = officialLetter.fileUrl;
        updateData.officialLetterName = officialLetter.fileName;
        updateData.officialLetterSize = officialLetter.fileSize;
      }

      // Update submission
      await tx.publicSubmission.update({
        where: { id: submission.id },
        data: updateData,
      });

      if (additionalDoc && additionalDoc.fileUrl) {
        const existingAddDoc = await tx.publicSubmissionDocument.findFirst({
          where: {
            submissionId: submission.id,
            OR: [
              { requirementName: { contains: 'Dokumen Lain', mode: 'insensitive' } },
              { requirementName: { contains: 'Pendukung', mode: 'insensitive' } },
            ],
          },
        });

        if (existingAddDoc) {
          await tx.publicSubmissionDocument.update({
            where: { id: existingAddDoc.id },
            data: {
              fileName: additionalDoc.fileName,
              fileUrl: additionalDoc.fileUrl,
              fileSize: additionalDoc.fileSize || 0,
              mimeType: additionalDoc.mimeType || 'application/pdf',
            },
          });
        } else {
          await tx.publicSubmissionDocument.create({
            data: {
              submissionId: submission.id,
              requirementName: additionalDoc.requirementName || 'Dokumen Pendukung Tambahan (Revisi)',
              fileName: additionalDoc.fileName,
              fileUrl: additionalDoc.fileUrl,
              fileSize: additionalDoc.fileSize || 0,
              mimeType: additionalDoc.mimeType || 'application/pdf',
              isMandatory: false,
              status: 'VALID',
            },
          });
        }
      }

      // Add timeline activity
      await tx.publicSubmissionActivity.create({
        data: {
          submissionId: submission.id,
          title: 'Dokumen Perbaikan Disampaikan',
          description: responseNotes || 'Pemohon telah mengunggah dokumen perbaikan yang diminta.',
          publicStatus: 'Sedang Diproses',
          visibility: 'PUBLIC',
          performedByName: 'PIC Perusahaan',
        },
      });

      // If tied to ERP document, create DisposisiLog
      if (submission.erpDocumentId) {
        await tx.disposisiLog.create({
          data: {
            documentId: submission.erpDocumentId,
            action: 'REVISION_SUBMITTED',
            description: `Pemohon telah menyampaikan perbaikan berkas lampiran. Catatan: "${responseNotes || 'Perbaikan berkas telah diunggah.'}"`,
            metadata: {
              responseNotes,
              hasOfficialLetter: Boolean(officialLetter?.fileUrl),
              hasAdditionalDoc: Boolean(additionalDoc?.fileUrl),
            },
          },
        });
      }

      // Notification
      await tx.publicNotification.create({
        data: {
          companyId,
          userId,
          title: `Tanggapan Revisi Terkirim`,
          message: `Perbaikan untuk pengajuan ${submission.submissionNumber} telah disampaikan kepada tim DSN-MUI.`,
          type: 'INFO',
          link: `/submissions/${submission.id}`,
        },
      });

      // Audit Log
      await tx.publicAuditLog.create({
        data: {
          action: 'REVISION_SUBMITTED',
          resource: 'PublicSubmission',
          resourceId: submission.id,
          companyId,
          userId,
          ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
          userAgent: req.get('user-agent') ?? null,
          metadata: { responseNotes },
        },
      });
    });

    return res.json({
      status: 'success',
      message: 'Perbaikan berhasil dikirim. Pengajuan Anda kini sedang diproses kembali oleh DSN-MUI.',
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error responding to revision:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengirimkan perbaikan.',
      error: error.message,
    });
  }
});

// ── SUBMIT PERMOHONAN REKOMENDASI DPS (MULTI-KANDIDAT & BRIDGING SURAT MASUK) ──
router.post('/dps', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;
    const userId = req.publicUser!.id;
    const {
      submissionId,
      title = 'Permohonan Rekomendasi Dewan Pengawas Syariah',
      companyLetterNumber,
      companyLetterDate,
      officialLetter, // { fileName, fileUrl, fileSize, mimeType }
      candidates, // Array of Candidate objects
      additionalDoc, // optional supporting document
      agreedToTerms,
    } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({
        status: 'error',
        message: 'Anda wajib menyetujui pernyataan integritas dan kebenaran dokumen persyaratan DSN-MUI.',
      });
    }

    if (!officialLetter || !officialLetter.fileUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Surat Permohonan / Pengantar dari Perusahaan wajib diunggah.',
      });
    }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimal satu (1) nama calon DPS wajib diusulkan dalam permohonan.',
      });
    }

    // Validasi setiap kandidat harus memiliki nama dan ke-5 berkas wajib
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (!c.name || !c.name.trim()) {
        return res.status(400).json({
          status: 'error',
          message: `Nama lengkap calon DPS #${i + 1} wajib diisi.`,
        });
      }

      const docs = c.documents || {};
      const requiredKeys = [
        { key: 'suratMui', label: 'Surat Pengantar dari MUI Setempat' },
        { key: 'sertifikatPelatihan', label: 'Sertifikat Pelatihan Dasar Pengawas Syariah dari DSN-MUI' },
        { key: 'sertifikatKompetensi', label: 'Sertifikat Kompetensi Pengawas Syariah dari LSP MUI' },
        { key: 'profilCv', label: 'Profil Calon DPS (Daftar Riwayat Hidup dan KTP terbaru)' },
        { key: 'suratPernyataanNonPegawai', label: 'Surat Keterangan Tidak Sedang Menjadi Pengurus/Pegawai Aktif LKS/LBS/LPS' },
      ];

      for (const reqDoc of requiredKeys) {
        if (!docs[reqDoc.key] || !docs[reqDoc.key].fileUrl) {
          return res.status(400).json({
            status: 'error',
            message: `Dokumen "${reqDoc.label}" untuk calon ${c.name} wajib diunggah.`,
          });
        }
      }
    }

    // Ambil master jenis pengajuan REKOMENDASI_DPS
    let dpsType = await prisma.submissionTypeMaster.findFirst({
      where: { code: 'REKOMENDASI_DPS' },
      include: { requirements: true },
    });

    if (!dpsType) {
      dpsType = await prisma.submissionTypeMaster.findFirst({
        where: { name: { contains: 'DPS', mode: 'insensitive' } },
        include: { requirements: true },
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      return res.status(404).json({ status: 'error', message: 'Data profil perusahaan tidak ditemukan.' });
    }

    const applicantUser = await prisma.companyUser.findUnique({
      where: { id: userId },
    });

    const parsedLetterDate = companyLetterDate ? new Date(companyLetterDate) : new Date();

    // Jalankan Transaction: Buat Public Submission + Buat Dokumen Surat Masuk Internal
    const result = await prisma.$transaction(async (tx) => {
      let sub;

      if (submissionId) {
        sub = await tx.publicSubmission.findFirst({
          where: { id: String(submissionId), companyId },
        });
      }

      const subNumber = sub?.submissionNumber || (await generateSubmissionNumber());

      const submissionPayload: any = {
        companyId,
        applicantUserId: userId,
        submissionTypeId: dpsType?.id || null,
        submissionTypeName: dpsType?.name || 'Permohonan Rekomendasi DPS',
        title: title || `Permohonan Rekomendasi DPS - ${candidates.length} Calon`,
        productOrServiceName: `Rekomendasi Penempatan DPS (${candidates.length} Calon)`,
        description: `Pengajuan ${candidates.length} calon Dewan Pengawas Syariah: ${candidates.map((c: any) => c.name).join(', ')}`,
        companyLetterNumber: companyLetterNumber || null,
        companyLetterDate: parsedLetterDate,
        officialLetterUrl: officialLetter.fileUrl,
        officialLetterName: officialLetter.fileName,
        officialLetterSize: officialLetter.fileSize,
        status: 'PROSES_PENGAJUAN',
        dpsStage: 'PROSES_PENGAJUAN',
        stepCompleted: 5,
        submittedAt: new Date(),
        candidates,
      };

      if (sub) {
        sub = await tx.publicSubmission.update({
          where: { id: sub.id },
          data: submissionPayload,
        });
      } else {
        sub = await tx.publicSubmission.create({
          data: {
            ...submissionPayload,
            submissionNumber: subNumber,
          },
        });
      }

      // Bersihkan dokumen lama jika sebelumnya draf
      await tx.publicSubmissionDocument.deleteMany({
        where: { submissionId: sub.id },
      });

      // Simpan surat pengantar perusahaan sebagai dokumen publik utama
      await tx.publicSubmissionDocument.create({
        data: {
          submissionId: sub.id,
          requirementName: 'Surat Permohonan / Pengantar Resmi dari Perusahaan',
          fileName: officialLetter.fileName,
          fileUrl: officialLetter.fileUrl,
          fileSize: officialLetter.fileSize,
          mimeType: officialLetter.mimeType || 'application/pdf',
          isMandatory: true,
          status: 'VALID',
        },
      });

      // Simpan Dokumen Lain jika diunggah oleh pemohon
      if (additionalDoc && additionalDoc.fileUrl) {
        await tx.publicSubmissionDocument.create({
          data: {
            submissionId: sub.id,
            requirementName: 'Dokumen Lain (Pendukung Tambahan)',
            fileName: additionalDoc.fileName,
            fileUrl: additionalDoc.fileUrl,
            fileSize: additionalDoc.fileSize || 1024,
            mimeType: additionalDoc.mimeType || 'application/pdf',
            isMandatory: false,
            status: 'VALID',
          },
        });
      }

      // Simpan 5 dokumen dari masing-masing calon ke PublicSubmissionDocument
      for (const c of candidates) {
        const docs = c.documents || {};
        const candidateDocs = [
          { name: `[Calon: ${c.name}] Surat Pengantar dari MUI Setempat`, doc: docs.suratMui },
          { name: `[Calon: ${c.name}] Sertifikat Pelatihan Dasar Pengawas Syariah dari DSN-MUI`, doc: docs.sertifikatPelatihan },
          { name: `[Calon: ${c.name}] Sertifikat Kompetensi Pengawas Syariah dari LSP MUI`, doc: docs.sertifikatKompetensi },
          { name: `[Calon: ${c.name}] Profil Calon DPS (Daftar Riwayat Hidup dan KTP terbaru)`, doc: docs.profilCv },
          { name: `[Calon: ${c.name}] Surat Keterangan Tidak Sedang Menjadi Pengurus/Pegawai Aktif LKS/LBS/LPS`, doc: docs.suratPernyataanNonPegawai },
          { name: `[Calon: ${c.name}] Dokumen Lain Calon`, doc: docs.dokumenLain },
        ];

        for (const cd of candidateDocs) {
          if (cd.doc && cd.doc.fileUrl) {
            await tx.publicSubmissionDocument.create({
              data: {
                submissionId: sub.id,
                requirementName: cd.name,
                fileName: cd.doc.fileName,
                fileUrl: cd.doc.fileUrl,
                fileSize: cd.doc.fileSize || 1024,
                mimeType: cd.doc.mimeType || 'application/pdf',
                isMandatory: true,
                status: 'VALID',
              },
            });
          }
        }
      }

      // ── BRIDGING KE SISTEM SURAT MASUK INTERNAL AMANAH ────────────
      let org = await tx.organization.findFirst({
        where: { name: { contains: 'Dewan Syariah', mode: 'insensitive' } },
      });
      if (!org) {
        org = await tx.organization.findFirst();
      }
      const organizationId = org ? org.id : 'org-mui-001';

      let category = await tx.documentCategory.findFirst({
        where: { name: { contains: 'Masuk', mode: 'insensitive' } },
      });
      if (!category) {
        category = await tx.documentCategory.create({
          data: { name: 'Surat Masuk Permohonan Syariah' },
        });
      }

      let classification = await tx.documentClassification.findFirst({
        where: { level: 'BIASA' },
      });
      if (!classification) {
        classification = await tx.documentClassification.findFirst();
      }
      if (!classification) {
        classification = await tx.documentClassification.create({
          data: { level: 'BIASA', name: 'Biasa' },
        });
      }

      let internalUser = await tx.user.findFirst({
        where: { isActive: true },
      });
      const creatorId = internalUser ? internalUser.id : userId;

      // Buat dokumen Surat Masuk
      const erpDoc = await tx.document.create({
        data: {
          title: `[Permohonan Rekomendasi DPS] ${company.name} - ${candidates.length} Calon DPS`,
          documentNumber: companyLetterNumber || sub.submissionNumber,
          organizationId,
          categoryId: category.id,
          subCategory: 'Permohonan Rekomendasi DPS',
          classificationId: classification.id,
          creatorId,
          documentType: 'INCOMING',
          approvalFlowType: 'SEQUENTIAL',
          status: 'BARU',
          disposisiStatus: 'BARU',
          documentDate: parsedLetterDate,
          receivedDate: new Date(),
          versions: {
            create: {
              versionNum: 1,
              fileUrl: officialLetter.fileUrl,
              fileName: officialLetter.fileName,
              fileSize: officialLetter.fileSize,
              mimeType: officialLetter.mimeType || 'application/pdf',
              createdBy: creatorId,
              changeNotes: `Permohonan Rekomendasi DPS dari ${company.name} (${candidates.length} calon diusulkan, Tiket: ${sub.submissionNumber})`,
            },
          },
        },
      });

      // Tautkan erpDocumentId ke publicSubmission
      await tx.publicSubmission.update({
        where: { id: sub.id },
        data: { erpDocumentId: erpDoc.id },
      });

      // Buat Evidence Folder untuk masing-masing calon dan lampirkan ke dokumen
      const mainFolder = await tx.evidenceFolder.create({
        data: {
          name: `Berkas Usulan DPS ${company.name} (${candidates.length} Calon)`,
          documentId: erpDoc.id,
        },
      });

      // Tambahkan surat pengantar perusahaan ke folder lampiran
      await tx.evidenceFile.create({
        data: {
          name: `Surat Pengantar Perusahaan - ${officialLetter.fileName}`,
          fileUrl: officialLetter.fileUrl,
          fileSize: officialLetter.fileSize,
          mimeType: officialLetter.mimeType || 'application/pdf',
          folderId: mainFolder.id,
          documentId: erpDoc.id,
        },
      });

      // Tambahkan Dokumen Lain ke evidence folder jika ada
      if (additionalDoc && additionalDoc.fileUrl) {
        await tx.evidenceFile.create({
          data: {
            name: `Dokumen Pendukung Lainnya - ${additionalDoc.fileName}`,
            fileUrl: additionalDoc.fileUrl,
            fileSize: additionalDoc.fileSize || 1024,
            mimeType: additionalDoc.mimeType || 'application/pdf',
            folderId: mainFolder.id,
            documentId: erpDoc.id,
          },
        });
      }

      for (const c of candidates) {
        const docs = c.documents || {};
        const candidateFiles = [
          { title: 'Surat Pengantar MUI Setempat', doc: docs.suratMui },
          { title: 'Sertifikat Pelatihan Dasar DPS', doc: docs.sertifikatPelatihan },
          { title: 'Sertifikat Kompetensi LSP MUI', doc: docs.sertifikatKompetensi },
          { title: 'Profil Calon DPS dan KTP', doc: docs.profilCv },
          { title: 'Surat Keterangan Non Pegawai Aktif', doc: docs.suratPernyataanNonPegawai },
          { title: 'Dokumen Lain Calon', doc: docs.dokumenLain },
        ];

        for (const cf of candidateFiles) {
          if (cf.doc && cf.doc.fileUrl) {
            await tx.evidenceFile.create({
              data: {
                name: `[${c.name}] ${cf.title} - ${cf.doc.fileName}`,
                fileUrl: cf.doc.fileUrl,
                fileSize: cf.doc.fileSize || 1024,
                mimeType: cf.doc.mimeType || 'application/pdf',
                folderId: mainFolder.id,
                documentId: erpDoc.id,
              },
            });
          }
        }
      }

      // Catat Aktivitas Timeline
      await tx.publicSubmissionActivity.create({
        data: {
          submissionId: sub.id,
          title: 'Permohonan Rekomendasi DPS Berhasil Diajukan',
          description: `Permohonan rekomendasi penempatan DPS untuk ${candidates.length} calon dari ${company.name} telah diterima dan masuk ke menu Surat Masuk DSN-MUI.`,
          publicStatus: 'Proses Pengajuan',
          visibility: 'PUBLIC',
          performedByName: applicantUser?.fullName || 'PIC Perusahaan',
        },
      });

      // Notifikasi di portal
      await tx.publicNotification.create({
        data: {
          companyId,
          userId,
          title: `Pengajuan Rekomendasi DPS: ${sub.submissionNumber}`,
          message: `Permohonan rekomendasi ${candidates.length} calon DPS telah berhasil dikirim ke DSN-MUI. Pantau tahapan status secara berkala.`,
          type: 'SUCCESS',
          link: `/submissions/${sub.id}`,
        },
      });

      // Audit Log
      await tx.publicAuditLog.create({
        data: {
          action: 'DPS_SUBMISSION_SUBMITTED',
          resource: 'PublicSubmission',
          resourceId: sub.id,
          companyId,
          userId,
          ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
          userAgent: req.get('user-agent') ?? null,
          metadata: {
            submissionNumber: sub.submissionNumber,
            erpDocumentId: erpDoc.id,
            candidateCount: candidates.length,
          },
        },
      });

      return { sub, erpDoc };
    });

    // Kirim Email Konfirmasi secara Asinkron
    const candidateNames = candidates.map((c: any) => c.name).filter(Boolean);
    const picEmail = applicantUser?.email || req.publicUser?.email;

    if (picEmail) {
      sendSubmissionConfirmationEmail({
        toEmail: picEmail,
        recipientName: applicantUser?.fullName || 'Narahubung Perusahaan',
        companyName: company.name,
        submissionNumber: result.sub.submissionNumber,
        submissionTitle: result.sub.title,
        serviceName: 'Permohonan Rekomendasi DPS',
        candidateNames,
        submissionId: result.sub.id,
      }).catch((err) => console.error('[DPS Submission] Gagal mengirim email konfirmasi:', err));
    }

    return res.json({
      status: 'success',
      message: 'Permohonan Rekomendasi DPS berhasil diajukan dan terdaftar dalam Surat Masuk DSN-MUI!',
      data: {
        id: result.sub.id,
        submissionNumber: result.sub.submissionNumber,
        status: result.sub.status,
        dpsStage: result.sub.dpsStage,
        submittedAt: result.sub.submittedAt,
        candidateCount: candidates.length,
        erpDocumentId: result.erpDoc.id,
      },
    });
  } catch (error: any) {
    console.error('[Public Submissions] Error submitting DPS application:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengajukan Permohonan Rekomendasi DPS.',
      error: error.message,
    });
  }
});

// ── SUBMIT PERMOHONAN SERTIFIKASI KESESUAIAN SYARIAH RUMAH SAKIT ──
router.post('/kesesuaian-syariah-rs', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;
    const userId = req.publicUser!.id;
    const {
      submissionId,
      hospitalName,
      companyLetterNumber,
      companyLetterDate,
      directorName,
      picName,
      picPhone,
      picEmail,
      legalDocs, // { aktaPendirian, izinPendirian, izinOperasional, tdpNib, domisili, skRups, profilPerusahaan }
      applicationDocs, // { suratPermohonan, komitmenDireksi, buktiTransfer, rekeningLks }
      hospitalDocs, // { sertifikatMukisi, sertifikatHalal, akreditasiRs }
      candidates, // Array of Candidate objects
      agreedToTerms,
    } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({
        status: 'error',
        message: 'Anda wajib menyetujui pernyataan integritas dan kebenaran dokumen persyaratan DSN-MUI.',
      });
    }

    if (!companyLetterNumber || !companyLetterNumber.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Nomor Surat Permohonan Resmi Rumah Sakit wajib diisi.',
      });
    }

    if (!applicationDocs?.suratPermohonan?.fileUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Surat Permohonan Sertifikasi Syariah Resmi wajib diunggah.',
      });
    }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimal satu (1) nama calon DPS wajib diusulkan dalam permohonan sertifikasi syariah rumah sakit.',
      });
    }

    // Validasi calon DPS
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (!c.name || !c.name.trim()) {
        return res.status(400).json({
          status: 'error',
          message: `Nama lengkap calon DPS #${i + 1} wajib diisi.`,
        });
      }
    }

    // Cari submissionType KESESUAIAN_SYARIAH atau KESESUAIAN_SYARIAH_RS
    let subType = await prisma.submissionTypeMaster.findFirst({
      where: {
        OR: [
          { code: 'KESESUAIAN_SYARIAH_RS' },
          { code: 'KESESUAIAN_SYARIAH' },
          { code: 'SERTIFIKASI_KESESUAIAN_SYARIAH' },
          { code: 'BISNIS_DAN_WISATA_HALAL' },
        ],
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      return res.status(404).json({ status: 'error', message: 'Data profil instansi/perusahaan tidak ditemukan.' });
    }

    const applicantUser = await prisma.companyUser.findUnique({
      where: { id: userId },
    });

    const parsedLetterDate = companyLetterDate ? new Date(companyLetterDate) : new Date();
    const resolvedHospitalName = hospitalName?.trim() || company.name;

    // Transaksi database: PublicSubmission + PublicSubmissionDocument + Dokumen Internal Surat Masuk + Evidence
    const result = await prisma.$transaction(async (tx) => {
      let sub;

      if (submissionId) {
        sub = await tx.publicSubmission.findFirst({
          where: { id: String(submissionId), companyId },
        });
      }

      const subNumber = sub?.submissionNumber || (await generateSubmissionNumber());

      const submissionPayload: any = {
        companyId,
        applicantUserId: userId,
        submissionTypeId: subType?.id || null,
        submissionTypeName: 'Permohonan Sertifikasi Kesesuaian Syariah Rumah Sakit',
        title: `[Kesesuaian Syariah RS] ${resolvedHospitalName}`,
        productOrServiceName: 'Sertifikasi Syariah Rumah Sakit',
        description: `Pengajuan sertifikasi kesesuaian syariah rumah sakit (${resolvedHospitalName}) bersama MUKISI dan DSN-MUI, dengan ${candidates.length} calon DPS. Direktur: ${directorName || '-'}, Narahubung: ${picName || '-'} (${picPhone || '-'}).`,
        companyLetterNumber: companyLetterNumber.trim(),
        companyLetterDate: parsedLetterDate,
        officialLetterUrl: applicationDocs.suratPermohonan.fileUrl,
        officialLetterName: applicationDocs.suratPermohonan.fileName,
        officialLetterSize: applicationDocs.suratPermohonan.fileSize,
        status: 'PROSES_PENGAJUAN',
        dpsStage: 'PROSES_PENGAJUAN',
        stepCompleted: 5,
        submittedAt: new Date(),
        candidates,
      };

      if (sub) {
        sub = await tx.publicSubmission.update({
          where: { id: sub.id },
          data: submissionPayload,
        });
      } else {
        sub = await tx.publicSubmission.create({
          data: {
            ...submissionPayload,
            submissionNumber: subNumber,
          },
        });
      }

      // Bersihkan dokumen lama jika draf
      await tx.publicSubmissionDocument.deleteMany({
        where: { submissionId: sub.id },
      });

      // Kumpulkan seluruh berkas untuk disimpan ke PublicSubmissionDocument & EvidenceFile
      const allSubmissionDocs: Array<{
        name: string;
        doc: { fileName: string; fileUrl: string; fileSize?: number; mimeType?: string };
        isMandatory: boolean;
      }> = [];

      // 1. Dokumen Permohonan
      if (applicationDocs?.suratPermohonan?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Surat Permohonan Sertifikasi Syariah Resmi',
          doc: applicationDocs.suratPermohonan,
          isMandatory: true,
        });
      }
      if (applicationDocs?.komitmenDireksi?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Surat Pernyataan Komitmen Direksi Sesuai Syariah',
          doc: applicationDocs.komitmenDireksi,
          isMandatory: true,
        });
      }
      if (applicationDocs?.buktiTransfer?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Bukti Transfer Biaya Pendaftaran Sertifikasi Syariah',
          doc: applicationDocs.buktiTransfer,
          isMandatory: true,
        });
      }
      if (applicationDocs?.rekeningLks?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Bukti Kepemilikan Rekening di Lembaga Keuangan Syariah (LKS)',
          doc: applicationDocs.rekeningLks,
          isMandatory: true,
        });
      }

      // 2. Dokumen Legalitas Hukum RS
      if (legalDocs?.aktaPendirian?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Akta Pendirian Perusahaan & Pengesahan Kemenkumham Beserta Perubahannya',
          doc: legalDocs.aktaPendirian,
          isMandatory: true,
        });
      }
      if (legalDocs?.izinPendirian?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Surat Izin Pendirian Rumah Sakit dari Berwenang',
          doc: legalDocs.izinPendirian,
          isMandatory: true,
        });
      }
      if (legalDocs?.izinOperasional?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Surat Izin Operasional Rumah Sakit dari Berwenang',
          doc: legalDocs.izinOperasional,
          isMandatory: true,
        });
      }
      if (legalDocs?.tdpNib?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Tanda Daftar Perusahaan (TDP) / NIB Berbasis Risiko',
          doc: legalDocs.tdpNib,
          isMandatory: true,
        });
      }
      if (legalDocs?.domisili?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Surat Keterangan Domisili Perusahaan / Rumah Sakit',
          doc: legalDocs.domisili,
          isMandatory: true,
        });
      }
      if (legalDocs?.skRups?.fileUrl) {
        allSubmissionDocs.push({
          name: 'SK RUPS / Notulensi Rapat Keputusan Berusaha Berdasarkan Prinsip Syariah',
          doc: legalDocs.skRups,
          isMandatory: true,
        });
      }
      if (legalDocs?.profilPerusahaan?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Profil Perusahaan / Rumah Sakit & Laporan Keuangan',
          doc: legalDocs.profilPerusahaan,
          isMandatory: true,
        });
      }

      // 3. Dokumen Khusus Rumah Sakit
      if (hospitalDocs?.sertifikatMukisi?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Sertifikat Keanggotaan / Rekomendasi MUKISI',
          doc: hospitalDocs.sertifikatMukisi,
          isMandatory: true,
        });
      }
      if (hospitalDocs?.sertifikatHalal?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Sertifikat Halal BPJPH / LPPOM-MUI',
          doc: hospitalDocs.sertifikatHalal,
          isMandatory: true,
        });
      }
      if (hospitalDocs?.akreditasiRs?.fileUrl) {
        allSubmissionDocs.push({
          name: 'Sertifikat Kelulusan Akreditasi Rumah Sakit (Pemerintah/KARS)',
          doc: hospitalDocs.akreditasiRs,
          isMandatory: true,
        });
      }

      // 4. Dokumen Calon DPS
      for (const c of candidates) {
        const docs = c.documents || {};
        if (docs.suratMui?.fileUrl) {
          allSubmissionDocs.push({
            name: `[Calon DPS: ${c.name}] Surat Pengantar dari MUI Setempat`,
            doc: docs.suratMui,
            isMandatory: true,
          });
        }
        if (docs.sertifikatPelatihan?.fileUrl) {
          allSubmissionDocs.push({
            name: `[Calon DPS: ${c.name}] Sertifikat Pelatihan Dasar Pengawas Syariah DSN-MUI`,
            doc: docs.sertifikatPelatihan,
            isMandatory: true,
          });
        }
        if (docs.sertifikatKompetensi?.fileUrl) {
          allSubmissionDocs.push({
            name: `[Calon DPS: ${c.name}] Sertifikat Kompetensi Pengawas Syariah LSP MUI`,
            doc: docs.sertifikatKompetensi,
            isMandatory: true,
          });
        }
        if (docs.profilCv?.fileUrl) {
          allSubmissionDocs.push({
            name: `[Calon DPS: ${c.name}] Profil Calon DPS (CV & KTP Terbaru)`,
            doc: docs.profilCv,
            isMandatory: true,
          });
        }
      }

      // Simpan seluruh dokumen ke PublicSubmissionDocument
      for (const item of allSubmissionDocs) {
        await tx.publicSubmissionDocument.create({
          data: {
            submissionId: sub.id,
            requirementName: item.name,
            fileName: item.doc.fileName,
            fileUrl: item.doc.fileUrl,
            fileSize: item.doc.fileSize || 1024,
            mimeType: item.doc.mimeType || 'application/pdf',
            isMandatory: item.isMandatory,
            status: 'VALID',
          },
        });
      }

      // ── BRIDGING KE SURAT MASUK INTERNAL AMANAH ────────────
      let org = await tx.organization.findFirst({
        where: { name: { contains: 'Dewan Syariah', mode: 'insensitive' } },
      });
      if (!org) {
        org = await tx.organization.findFirst();
      }
      const organizationId = org ? org.id : 'org-mui-001';

      let category = await tx.documentCategory.findFirst({
        where: { name: { contains: 'Masuk', mode: 'insensitive' } },
      });
      if (!category) {
        category = await tx.documentCategory.create({
          data: { name: 'Surat Masuk Permohonan Syariah' },
        });
      }

      let classification = await tx.documentClassification.findFirst({
        where: { level: 'BIASA' },
      });
      if (!classification) {
        classification = await tx.documentClassification.findFirst();
      }
      if (!classification) {
        classification = await tx.documentClassification.create({
          data: { level: 'BIASA', name: 'Biasa' },
        });
      }

      let internalUser = await tx.user.findFirst({
        where: { isActive: true },
      });
      const creatorId = internalUser ? internalUser.id : userId;

      // Buat Dokumen Surat Masuk
      const erpDoc = await tx.document.create({
        data: {
          title: `[Kesesuaian Syariah RS] ${resolvedHospitalName} - Permohonan Sertifikasi Syariah Rumah Sakit`,
          documentNumber: companyLetterNumber.trim() || sub.submissionNumber,
          organizationId,
          categoryId: category.id,
          subCategory: 'Kesesuaian Syariah Rumah Sakit',
          classificationId: classification.id,
          creatorId,
          documentType: 'INCOMING',
          approvalFlowType: 'SEQUENTIAL',
          status: 'BARU',
          disposisiStatus: 'BARU',
          documentDate: parsedLetterDate,
          receivedDate: new Date(),
          versions: {
            create: {
              versionNum: 1,
              fileUrl: applicationDocs.suratPermohonan.fileUrl,
              fileName: applicationDocs.suratPermohonan.fileName,
              fileSize: applicationDocs.suratPermohonan.fileSize,
              mimeType: applicationDocs.suratPermohonan.mimeType || 'application/pdf',
              createdBy: creatorId,
              changeNotes: `Permohonan Sertifikasi Kesesuaian Syariah RS dari ${resolvedHospitalName} (${candidates.length} calon DPS, Tiket: ${sub.submissionNumber})`,
            },
          },
        },
      });

      // Tautkan erpDocumentId ke publicSubmission
      await tx.publicSubmission.update({
        where: { id: sub.id },
        data: { erpDocumentId: erpDoc.id },
      });

      // Buat Evidence Folder untuk seluruh berkas pengajuan RS
      const mainFolder = await tx.evidenceFolder.create({
        data: {
          name: `Berkas Pengajuan Kesesuaian Syariah RS - ${resolvedHospitalName}`,
          documentId: erpDoc.id,
        },
      });

      // Simpan semua dokumen ke evidence files
      for (const item of allSubmissionDocs) {
        await tx.evidenceFile.create({
          data: {
            name: `${item.name} - ${item.doc.fileName}`,
            fileUrl: item.doc.fileUrl,
            fileSize: item.doc.fileSize || 1024,
            mimeType: item.doc.mimeType || 'application/pdf',
            folderId: mainFolder.id,
            documentId: erpDoc.id,
          },
        });
      }

      // Catat Aktivitas Timeline
      await tx.publicSubmissionActivity.create({
        data: {
          submissionId: sub.id,
          title: 'Permohonan Sertifikasi Syariah Rumah Sakit Berhasil Diajukan',
          description: `Permohonan Sertifikasi Kesesuaian Syariah Rumah Sakit (${resolvedHospitalName}) beserta seluruh dokumen legalitas hukum, dokumen khusus RS (MUKISI, Halal BPJPH, Akreditasi), dan ${candidates.length} calon DPS telah diterima dalam antrean Surat Masuk DSN-MUI.`,
          publicStatus: 'Proses Pengajuan',
          visibility: 'PUBLIC',
          performedByName: applicantUser?.fullName || req.publicUser?.fullName || 'PIC Rumah Sakit',
        },
      });

      return { sub, erpDoc };
    });

    return res.json({
      status: 'success',
      message: 'Permohonan Sertifikasi Kesesuaian Syariah Rumah Sakit berhasil diajukan dan terdaftar dalam Surat Masuk DSN-MUI!',
      data: {
        id: result.sub.id,
        submissionNumber: result.sub.submissionNumber,
        status: result.sub.status,
        dpsStage: result.sub.dpsStage,
        submittedAt: result.sub.submittedAt,
        candidateCount: candidates.length,
        erpDocumentId: result.erpDoc.id,
      },
    });
  } catch (error: any) {
    console.error('[Kesesuaian Syariah RS] Error submitting hospital compliance:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengajukan Permohonan Sertifikasi Kesesuaian Syariah Rumah Sakit.',
      error: error.message,
    });
  }
});

export default router;

