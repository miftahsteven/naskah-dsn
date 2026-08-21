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
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
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
    const { responseNotes } = req.body;
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

    // Update revision status and submission status back to processing
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

      // Update submission status back to SEDANG_DIPROSES
      await tx.publicSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'SEDANG_DIPROSES',
        },
      });

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

export default router;
