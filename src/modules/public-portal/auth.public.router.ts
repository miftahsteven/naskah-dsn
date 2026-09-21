import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import {
  authenticatePublic,
  generatePublicToken,
  type PublicAuthRequest,
} from './middleware.public.js';
import {
  sendOtpEmail,
  sendRegistrationSuccessEmail,
} from '../../lib/mailer.service.js';
import { AuthService } from '../auth/auth.service.js';

const router = Router();

// ── CHECK EMAIL AVAILABILITY ────────────────────────────────────────────────
router.get('/check-email', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        status: 'error',
        message: 'Alamat email tidak valid.',
      });
    }

    const existingUser = await prisma.companyUser.findFirst({
      where: { email, isActive: true },
      include: { company: { select: { id: true, name: true } } },
    });

    return res.json({
      status: 'success',
      exists: !!existingUser,
      companyName: existingUser?.company?.name || null,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengecek ketersediaan email.',
      error: error.message,
    });
  }
});

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

    // Check if user exists
    const existingUser = await prisma.companyUser.findFirst({
      where: { email: normalizedEmail, isActive: true },
      include: { company: true },
    });

    // ── VALIDASI KEBERADAAN EMAIL UNTUK LOGIN & REGISTER ───────────────
    if (type === 'LOGIN' && !existingUser) {
      return res.status(404).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: `Alamat email "${normalizedEmail}" belum terdaftar sebagai akun perusahaan pemohon. Silakan lakukan pendaftaran terlebih dahulu.`,
      });
    }

    if (type === 'REGISTER' && existingUser) {
      return res.status(400).json({
        status: 'error',
        code: 'EMAIL_ALREADY_REGISTERED',
        message: `Alamat email "${normalizedEmail}" sudah terdaftar untuk perusahaan "${existingUser.company?.name || 'terkait'}". Silakan langsung masuk (login).`,
      });
    }

    // ── RATE LIMIT & LOCKOUT RULES ──────────────────────────────────────
    // 1. Setiap 1 kode OTP berlaku 45 detik (dengan toleransi transit 15 detik).
    // 2. Cooldown antar pengiriman: 45 detik.
    // 3. Maksimal 3x pengiriman OTP berturut-turut dalam 1 siklus.
    // 4. Jika sudah mencapai 3x kirim, sistem mengunci (lockout) selama 5 menit (300 detik).
    //    Setelah 5 menit selesai, counter reset kembali ke posisi 1.

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOtps = await prisma.publicOtp.findMany({
      where: {
        email: normalizedEmail,
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Jika sudah ada 3 kali (atau lebih) permintaan OTP dalam rentang 5 menit
    if (recentOtps.length >= 3 && recentOtps[0]) {
      const latestOtp = recentOtps[0];
      const lockoutEnd = new Date(latestOtp.createdAt.getTime() + 5 * 60 * 1000);
      const remainingMs = lockoutEnd.getTime() - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      if (remainingSeconds > 0) {
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        const formattedWait = mins > 0 ? `${mins} menit ${secs} detik` : `${secs} detik`;
        return res.status(429).json({
          status: 'error',
          code: 'OTP_LIMIT_REACHED',
          lockoutSeconds: remainingSeconds,
          message: `Batas pengiriman OTP (3x) telah tercapai. Demi keamanan, silakan tunggu ${formattedWait} sebelum meminta kode OTP kembali.`,
        });
      }
    }

    // Cooldown 45 detik antar pengiriman jika baru saja mengirim OTP (< 45 detik)
    if (recentOtps.length > 0 && recentOtps[0]) {
      const latestOtp = recentOtps[0];
      const timeSinceLast = Date.now() - latestOtp.createdAt.getTime();
      const cooldownMs = 45 * 1000;
      if (timeSinceLast < cooldownMs) {
        const remainingCooldown = Math.ceil((cooldownMs - timeSinceLast) / 1000);
        return res.status(429).json({
          status: 'error',
          code: 'OTP_COOLDOWN',
          cooldownSeconds: remainingCooldown,
          message: `Kode OTP sebelumnya masih berlaku. Mohon tunggu ${remainingCooldown} detik sebelum meminta kode baru.`,
        });
      }
    }

    // Hitung nomor urut pengiriman saat ini (1, 2, atau 3)
    const currentAttempt = (recentOtps.length % 3) + 1;

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

    // Generate secure 6-digit OTP dengan TTL 60 detik (buffer toleransi transit email)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 60 * 1000);

    const createdOtp = await prisma.publicOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        type,
        expiresAt,
      },
    });

    // Send Real OTP Email via Mailer Service
    const mailResult = await sendOtpEmail({
      toEmail: normalizedEmail,
      otpCode,
      type: type as any,
      recipientName: existingUser?.fullName,
    });

    // JIKA PENGIRIMAN EMAIL GAGAL, ROLLBACK OTP AGAR TIDAK MEMAKAN JATAH ATTEMPT USER
    if (!mailResult.success) {
      await prisma.publicOtp.delete({
        where: { id: createdOtp.id },
      });

      console.error(`[Public OTP] Mail delivery failed for ${normalizedEmail}:`, mailResult.error);

      return res.status(500).json({
        status: 'error',
        code: 'EMAIL_SEND_FAILED',
        message: `Gagal mengirimkan kode verifikasi ke email ${normalizedEmail}. ${mailResult.error || 'Server email sedang mengalami kendala jaringan.'} Silakan coba beberapa saat lagi.`,
      });
    }

    // Public audit log
    await prisma.publicAuditLog.create({
      data: {
        action: 'OTP_REQUESTED',
        resource: 'PublicOtp',
        companyId: existingUser?.companyId || null,
        userId: existingUser?.id || null,
        ipAddress: (req.ip || req.socket.remoteAddress) ?? null,
        userAgent: req.get('user-agent') ?? null,
        metadata: {
          email: normalizedEmail,
          type,
          emailSent: mailResult.success,
          attempt: currentAttempt,
          messageId: mailResult.messageId,
        },
      },
    });

    console.log(`[Public OTP] Code generated for ${normalizedEmail} (Attempt ${currentAttempt}/3, MessageId: ${mailResult.messageId})`);

    return res.json({
      status: 'success',
      message: `Kode verifikasi OTP telah dikirimkan ke alamat email ${normalizedEmail}. Kode berlaku selama 45 detik.`,
      exists: !!existingUser,
      emailSent: true,
      attempt: currentAttempt,
      maxAttempts: 3,
      validitySeconds: 45,
    });
  } catch (error: any) {
    console.error('[Public Auth] Error requesting OTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memproses permintaan OTP. Silakan coba beberapa saat lagi.',
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

    // Universal OTP bypass for authorized test accounts (e.g. Google Play Review)
    const isUniversal = AuthService.isUniversalOtpValid(cleanOtp, normalizedEmail);

    if (!isUniversal) {
      // Find the latest valid OTP record (dengan toleransi transit 15 detik)
      const graceThreshold = new Date(Date.now() - 15 * 1000);
      const otpRecord = await prisma.publicOtp.findFirst({
        where: {
          email: normalizedEmail,
          isUsed: false,
          expiresAt: { gt: graceThreshold },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        // Check if there was an OTP that expired
        const expiredOtp = await prisma.publicOtp.findFirst({
          where: {
            email: normalizedEmail,
            isUsed: false,
            expiresAt: { lte: graceThreshold },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (expiredOtp) {
          return res.status(400).json({
            status: 'error',
            code: 'OTP_EXPIRED',
            message: 'Kode OTP telah kedaluwarsa (masa berlaku 45 detik). Silakan klik "Kirim Ulang Kode OTP".',
          });
        }

        return res.status(400).json({
          status: 'error',
          code: 'OTP_INVALID',
          message: 'Kode OTP tidak valid atau belum diminta. Silakan minta kode baru.',
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
    } else {
      console.log(`[Public OTP] Universal OTP accepted for ${normalizedEmail}`);
    }

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
          district: user.company.district,
          subdistrict: user.company.subdistrict,
          postalCode: user.company.postalCode,
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
      district,
      subdistrict,
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
          district: district?.trim() || null,
          subdistrict: subdistrict?.trim() || null,
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

    // Send email notification that company account is ready to login
    let welcomeMailResult: any = null;
    try {
      const portalUrl = process.env.PUBLIC_PORTAL_URL || 'http://localhost:5174';
      welcomeMailResult = await sendRegistrationSuccessEmail({
        toEmail: normalizedEmail,
        companyName: result.company.name,
        picName: result.user.fullName,
        picPosition: result.user.position || undefined,
        loginUrl: `${portalUrl}/login?email=${encodeURIComponent(normalizedEmail)}`,
      });
    } catch (mailError: any) {
      console.error('[Public Auth] Error sending welcome/ready-to-login email:', mailError);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Pendaftaran perusahaan berhasil! Email konfirmasi dan instruksi login telah dikirimkan ke email Anda.',
      emailSent: welcomeMailResult?.success ?? false,
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
          district: result.company.district,
          subdistrict: result.company.subdistrict,
          postalCode: result.company.postalCode,
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
          district: user.company.district,
          subdistrict: user.company.subdistrict,
          postalCode: user.company.postalCode,
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
