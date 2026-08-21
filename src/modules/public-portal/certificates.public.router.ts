import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma.js';
import {
  authenticatePublic,
  type PublicAuthRequest,
} from './middleware.public.js';

const router = Router();

// ── GET CERTIFICATES LIST ───────────────────────────────────────────────────
router.get('/', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;

    const certificates = await prisma.shariaCertificate.findMany({
      where: { companyId },
      include: {
        submission: {
          select: {
            id: true,
            submissionNumber: true,
            title: true,
            productOrServiceName: true,
            submissionTypeName: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    return res.json({
      status: 'success',
      data: certificates,
    });
  } catch (error: any) {
    console.error('[Public Certificates] Error fetching certificates:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat daftar sertifikat.',
      error: error.message,
    });
  }
});

// ── GET CERTIFICATE DETAIL ──────────────────────────────────────────────────
router.get('/:id', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.publicUser!.companyId;

    const cert = await prisma.shariaCertificate.findFirst({
      where: { id: String(id), companyId },
      include: {
        company: true,
        submission: {
          include: {
            applicantUser: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!cert) {
      return res.status(404).json({
        status: 'error',
        message: 'Sertifikat tidak ditemukan atau Anda tidak memiliki akses.',
      });
    }

    // Generate QR verification data URL if not present
    let qrCode = cert.qrCode;
    if (!qrCode) {
      const publicBaseUrl = process.env.FRONTEND_URL || 'https://amanah.dsnmui.or.id';
      const verifyUrl = `${publicBaseUrl}/verify/certificate/${encodeURIComponent(cert.certificateNumber)}`;
      qrCode = await QRCode.toDataURL(verifyUrl, {
        color: { dark: '#006633', light: '#ffffff' },
        margin: 1,
        width: 150,
      });
    }

    return res.json({
      status: 'success',
      data: {
        ...cert,
        qrCode,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat detail sertifikat.',
      error: error.message,
    });
  }
});

// ── DOWNLOAD CERTIFICATE (Authorized) ───────────────────────────────────────
router.get('/:id/download', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.publicUser!.companyId;
    const userId = req.publicUser!.id;

    const cert = await prisma.shariaCertificate.findFirst({
      where: { id: String(id), companyId },
      include: { company: true },
    });

    if (!cert) {
      return res.status(404).json({
        status: 'error',
        message: 'Sertifikat tidak ditemukan.',
      });
    }

    // Increment download count
    await prisma.shariaCertificate.update({
      where: { id: cert.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Audit Log
    await prisma.publicAuditLog.create({
      data: {
        action: 'CERTIFICATE_DOWNLOADED',
        resource: 'ShariaCertificate',
        resourceId: cert.id,
        companyId,
        userId,
        ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
        userAgent: req.get('user-agent') ?? null,
        metadata: {
          certificateNumber: cert.certificateNumber,
          downloadCount: cert.downloadCount + 1,
        },
      },
    });

    // Check if physical file exists
    const localPath = path.join(process.cwd(), cert.fileUrl.startsWith('/') ? cert.fileUrl.slice(1) : cert.fileUrl);

    if (fs.existsSync(localPath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${cert.fileName || 'Sertifikat_Kesesuaian_Syariah_DSN_MUI.pdf'}"`);
      return res.sendFile(localPath);
    }

    // Fallback: send certificate metadata redirect or download URL
    return res.json({
      status: 'success',
      message: 'Sertifikat terverifikasi.',
      data: {
        certificateNumber: cert.certificateNumber,
        title: cert.title,
        issueDate: cert.issueDate,
        validUntil: cert.validUntil,
        companyName: cert.company.name,
      },
    });
  } catch (error: any) {
    console.error('[Public Certificates] Error downloading certificate:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunduh sertifikat.',
      error: error.message,
    });
  }
});

// ── PUBLIC VERIFY CERTIFICATE (By QR or Number) ─────────────────────────────
router.get('/verify/public/:certNumber', async (req: Request, res: Response) => {
  try {
    const { certNumber } = req.params;

    const cert = await prisma.shariaCertificate.findFirst({
      where: {
        certificateNumber: { equals: String(certNumber).trim(), mode: 'insensitive' },
      },
      include: {
        company: { select: { name: true, legalType: true, city: true, province: true } },
        submission: {
          select: {
            submissionNumber: true,
            title: true,
            productOrServiceName: true,
            submissionTypeName: true,
          },
        },
      },
    });

    if (!cert) {
      return res.status(404).json({
        status: 'error',
        message: 'Nomor sertifikat tidak ditemukan dalam pangkalan data resmi DSN-MUI.',
        valid: false,
      });
    }

    const isExpired = new Date(cert.validUntil) < new Date();

    return res.json({
      status: 'success',
      valid: true,
      data: {
        certificateNumber: cert.certificateNumber,
        title: cert.title,
        companyName: `${cert.company.legalType || ''} ${cert.company.name}`.trim(),
        productName: cert.submission.productOrServiceName || cert.submission.title,
        category: cert.submission.submissionTypeName,
        issueDate: cert.issueDate,
        validUntil: cert.validUntil,
        isExpired,
        status: isExpired ? 'KEDALUWARSA' : 'BERLAKU SAH',
        issuer: 'Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI)',
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memverifikasi sertifikat.',
      error: error.message,
    });
  }
});

export default router;
