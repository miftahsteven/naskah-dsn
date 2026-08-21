import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import {
  authenticatePublic,
  type PublicAuthRequest,
} from './middleware.public.js';

const router = Router();

// ── GET COMPANY PROFILE ─────────────────────────────────────────────────────
router.get('/profile', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            position: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            submissions: true,
            certificates: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Data perusahaan tidak ditemukan.',
      });
    }

    return res.json({
      status: 'success',
      data: company,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat profil perusahaan.',
      error: error.message,
    });
  }
});

// ── UPDATE COMPANY PROFILE ──────────────────────────────────────────────────
router.put('/profile', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;
    const userId = req.publicUser!.id;
    const {
      name,
      legalType,
      legalityNumber,
      npwp,
      address,
      province,
      city,
      postalCode,
      phone,
      website,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama perusahaan tidak boleh kosong.',
      });
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: name.trim(),
        legalType: legalType || null,
        legalityNumber: legalityNumber?.trim() || null,
        npwp: npwp?.trim() || null,
        address: address?.trim() || null,
        province: province?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
      },
    });

    // Audit Log
    await prisma.publicAuditLog.create({
      data: {
        action: 'COMPANY_UPDATED',
        resource: 'Company',
        resourceId: companyId,
        companyId,
        userId,
        ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
        userAgent: req.get('user-agent') ?? null,
        metadata: { updatedFields: Object.keys(req.body) },
      },
    });

    return res.json({
      status: 'success',
      message: 'Profil perusahaan berhasil diperbarui.',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui profil perusahaan.',
      error: error.message,
    });
  }
});

// ── GET COMPANY USERS / PICS ────────────────────────────────────────────────
router.get('/users', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;

    const users = await prisma.companyUser.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        fullName: true,
        position: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      status: 'success',
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── INVITE / ADD PIC ────────────────────────────────────────────────────────
router.post('/users/invite', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const companyId = req.publicUser!.companyId;
    const { email, fullName, position = 'PIC Pengajuan', phone, role = 'PIC' } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan Nama Lengkap PIC wajib diisi.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.companyUser.findFirst({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Pengguna dengan email ini sudah terdaftar.',
      });
    }

    const newUser = await prisma.companyUser.create({
      data: {
        companyId,
        email: normalizedEmail,
        fullName: fullName.trim(),
        position: position.trim(),
        phone: phone?.trim() || null,
        role: role === 'ADMIN' ? 'ADMIN' : 'PIC',
        isActive: true,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: `PIC ${newUser.fullName} berhasil ditambahkan.`,
      data: newUser,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
