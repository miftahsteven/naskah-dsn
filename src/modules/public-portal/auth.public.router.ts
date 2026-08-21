import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import {
  authenticatePublic,
  generatePublicToken,
  type PublicAuthRequest,
} from './middleware.public.js';

const router = Router();

// ── REQUEST OTP ─────────────────────────────────────────────────────────────
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { email, type = 'LOGIN' } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        status: 'error',
        message: 'Alamat email tidak valid.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if cooldown is active (last OTP generated < 45 seconds ago)
    const recentOtp = await prisma.publicOtp.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gte: new Date(Date.now() - 45 * 1000) },
      },
    });

    if (recentOtp) {
      return res.status(429).json({
        status: 'error',
        message: 'Mohon tunggu 45 detik sebelum meminta kode OTP baru.',
      });
    }

    // Invalidate previous active OTPs for this email
    await prisma.publicOtp.updateMany({
      where: {
        email: normalizedEmail,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await prisma.publicOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        type,
        expiresAt,
      },
    });

    // Check if user exists
    const existingUser = await prisma.companyUser.findFirst({
      where: { email: normalizedEmail, isActive: true },
      include: { company: true },
    });

    // Public audit log
    await prisma.publicAuditLog.create({
      data: {
        action: 'OTP_REQUESTED',
        resource: 'PublicOtp',
        companyId: existingUser?.companyId || null,
        userId: existingUser?.id || null,
        ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
        userAgent: req.get('user-agent') ?? null,
        metadata: { email: normalizedEmail, type },
      },
    });

    console.log(`[Public OTP] Code for ${normalizedEmail}: ${otpCode}`);

    return res.json({
      status: 'success',
      message: `Kode OTP 6-digit telah dikirim ke ${normalizedEmail}. Berlaku selama 5 menit.`,
      exists: !!existingUser,
      demoOtp: otpCode, // Provided for smooth demonstration/testing
    });
  } catch (error: any) {
    console.error('[Public Auth] Error requesting OTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengirim kode OTP. Silakan coba beberapa saat lagi.',
      error: error.message,
    });
  }
});

// ── VERIFY OTP ─────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan 6 digit kode OTP wajib diisi.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Find the latest valid OTP record
    const otpRecord = await prisma.publicOtp.findFirst({
      where: {
        email: normalizedEmail,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'Kode OTP tidak valid atau telah kedaluwarsa. Silakan minta kode baru.',
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await prisma.publicOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      return res.status(429).json({
        status: 'error',
        message: 'Batas percobaan OTP telah terlampaui. Silakan minta kode OTP baru.',
      });
    }

    // Verify OTP hash
    const isValid = await bcrypt.compare(cleanOtp, otpRecord.otpHash);

    if (!isValid) {
      await prisma.publicOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({
        status: 'error',
        message: 'Kode OTP yang Anda masukkan salah. Silakan periksa kembali.',
      });
    }

    // Mark OTP as used
    await prisma.publicOtp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Check if user and company already exist
    const user = await prisma.companyUser.findFirst({
      where: { email: normalizedEmail, isActive: true },
      include: { company: true },
    });

    if (!user) {
      // OTP is valid, but company registration is required
      return res.json({
        status: 'success',
        registered: false,
        email: normalizedEmail,
        message: 'Verifikasi email berhasil. Silakan lengkapi data profil perusahaan Anda.',
      });
    }

    // Update last login
    await prisma.companyUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
    };

    const token = generatePublicToken(tokenPayload);

    // Audit Log
    await prisma.publicAuditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        resource: 'CompanyUser',
        resourceId: user.id,
        companyId: user.companyId,
        userId: user.id,
        ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
        userAgent: req.get('user-agent') ?? null,
      },
    });

    return res.json({
      status: 'success',
      registered: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          position: user.position,
          phone: user.phone,
          role: user.role,
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          legalType: user.company.legalType,
          legalityNumber: user.company.legalityNumber,
          npwp: user.company.npwp,
          address: user.company.address,
          province: user.company.province,
          city: user.company.city,
          phone: user.company.phone,
          website: user.company.website,
        },
      },
    });
  } catch (error: any) {
    console.error('[Public Auth] Error verifying OTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memverifikasi OTP.',
      error: error.message,
    });
  }
});

// ── REGISTER COMPANY & ADMIN ────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      email,
      companyName,
      legalType = 'PT',
      legalityNumber,
      npwp,
      address,
      province,
      city,
      postalCode,
      phone,
      website,
      picFullName,
      picPosition = 'Penanggung Jawab',
      picPhone,
    } = req.body;

    if (!email || !companyName || !picFullName || !picPhone) {
      return res.status(400).json({
        status: 'error',
        message: 'Mohon lengkapi data wajib: Email, Nama Perusahaan, Nama PIC, dan No. HP PIC.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingUser = await prisma.companyUser.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email ini telah terdaftar sebagai pengguna portal. Silakan login langsung.',
      });
    }

    // Create Company and User in transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName.trim(),
          legalType,
          legalityNumber: legalityNumber?.trim() || null,
          npwp: npwp?.trim() || null,
          address: address?.trim() || null,
          province: province?.trim() || null,
          city: city?.trim() || null,
          postalCode: postalCode?.trim() || null,
          phone: phone?.trim() || null,
          email: normalizedEmail,
          website: website?.trim() || null,
        },
      });

      const user = await tx.companyUser.create({
        data: {
          companyId: company.id,
          email: normalizedEmail,
          fullName: picFullName.trim(),
          phone: picPhone.trim(),
          position: picPosition.trim(),
          role: 'ADMIN',
          lastLoginAt: new Date(),
        },
      });

      // Welcome Notification
      await tx.publicNotification.create({
        data: {
          companyId: company.id,
          userId: user.id,
          title: 'Selamat Datang di Portal Amanah DSN-MUI',
          message: `Akun perusahaan ${company.name} telah aktif. Anda kini dapat membuat permohonan kesesuaian syariah secara online.`,
          type: 'SUCCESS',
          link: '/submissions/new',
        },
      });

      // Audit Log
      await tx.publicAuditLog.create({
        data: {
          action: 'COMPANY_REGISTERED',
          resource: 'Company',
          resourceId: company.id,
          companyId: company.id,
          userId: user.id,
          ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
          userAgent: req.get('user-agent') ?? null,
          metadata: { companyName: company.name, email: normalizedEmail },
        },
      });

      return { company, user };
    });

    const tokenPayload = {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      companyId: result.company.id,
      companyName: result.company.name,
    };

    const token = generatePublicToken(tokenPayload);

    return res.status(201).json({
      status: 'success',
      message: 'Pendaftaran perusahaan berhasil! Selamat datang di Amanah Public Portal.',
      data: {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          position: result.user.position,
          phone: result.user.phone,
          role: result.user.role,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          legalType: result.company.legalType,
          legalityNumber: result.company.legalityNumber,
          npwp: result.company.npwp,
          address: result.company.address,
          province: result.company.province,
          city: result.company.city,
          phone: result.company.phone,
          website: result.company.website,
        },
      },
    });
  } catch (error: any) {
    console.error('[Public Auth] Error registering company:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mendaftarkan perusahaan. Silakan periksa kembali data Anda.',
      error: error.message,
    });
  }
});

// ── GET SESSION / PROFILE ───────────────────────────────────────────────────
router.get('/session', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    const userId = req.publicUser!.id;

    const user = await prisma.companyUser.findUnique({
      where: { id: userId },
      include: {
        company: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan.',
      });
    }

    const unreadNotifications = await prisma.publicNotification.count({
      where: {
        companyId: user.companyId,
        isRead: false,
      },
    });

    return res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          position: user.position,
          phone: user.phone,
          role: user.role,
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          legalType: user.company.legalType,
          legalityNumber: user.company.legalityNumber,
          npwp: user.company.npwp,
          address: user.company.address,
          province: user.company.province,
          city: user.company.city,
          phone: user.company.phone,
          website: user.company.website,
          logoUrl: user.company.logoUrl,
        },
        unreadNotifications,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data sesi.',
      error: error.message,
    });
  }
});

// ── LOGOUT ──────────────────────────────────────────────────────────────────
router.post('/logout', authenticatePublic, async (req: PublicAuthRequest, res: Response) => {
  try {
    await prisma.publicAuditLog.create({
      data: {
        action: 'LOGOUT',
        resource: 'CompanyUser',
        resourceId: req.publicUser!.id,
        companyId: req.publicUser!.companyId,
        userId: req.publicUser!.id,
        ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
        userAgent: req.get('user-agent') ?? null,
      },
    });

    return res.json({
      status: 'success',
      message: 'Sesi logout berhasil.',
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
