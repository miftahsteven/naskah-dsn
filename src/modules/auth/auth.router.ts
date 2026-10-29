import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthService } from './auth.service.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
// Trigger reload after prisma client generation
import type { AuthRequest } from '../../middleware/auth.js';
import { sendOtpEmail } from '../../lib/mailer.service.js';

const router = Router();

// ── GLOBAL / MOBILE 2FA CONFIGURATION PERSISTENCE ──
export interface Mobile2FAConfig {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'GOOGLE_AUTH' | 'EMAIL';
  updatedAt: string;
  updatedBy?: string | undefined;
}

const MOBILE_2FA_CONFIG_PATH = path.resolve(process.cwd(), 'data', 'mobile-2fa-config.json');

export function getMobile2FAConfig(): Mobile2FAConfig {
  try {
    if (fs.existsSync(MOBILE_2FA_CONFIG_PATH)) {
      const raw = fs.readFileSync(MOBILE_2FA_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        twoFactorEnabled: Boolean(parsed.twoFactorEnabled),
        twoFactorMethod: parsed.twoFactorMethod === 'EMAIL' ? 'EMAIL' : 'GOOGLE_AUTH',
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        updatedBy: parsed.updatedBy,
      };
    }
  } catch (err) {
    console.warn('[2FA Config] Failed to read mobile-2fa-config.json, using default (disabled):', err);
  }
  const defaultConfig: Mobile2FAConfig = {
    twoFactorEnabled: false,
    twoFactorMethod: 'GOOGLE_AUTH',
    updatedAt: new Date().toISOString(),
  };
  try {
    const dir = path.dirname(MOBILE_2FA_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOBILE_2FA_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[2FA Config] Failed to write default mobile-2fa-config.json:', err);
  }
  return defaultConfig;
}

export function saveMobile2FAConfig(update: Partial<Mobile2FAConfig>): Mobile2FAConfig {
  const current = getMobile2FAConfig();
  const next: Mobile2FAConfig = {
    twoFactorEnabled: update.twoFactorEnabled !== undefined ? Boolean(update.twoFactorEnabled) : current.twoFactorEnabled,
    twoFactorMethod: update.twoFactorMethod === 'EMAIL' ? 'EMAIL' : update.twoFactorMethod === 'GOOGLE_AUTH' ? 'GOOGLE_AUTH' : current.twoFactorMethod,
    updatedAt: new Date().toISOString(),
    updatedBy: update.updatedBy || current.updatedBy,
  };
  const dir = path.dirname(MOBILE_2FA_CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(MOBILE_2FA_CONFIG_PATH, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

async function generateAndSendEmail2FAOtp(user: { id: string; email: string; fullName: string }) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await AuthService.hashPassword(otpCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Invalidate previous unused LOGIN_2FA OTPs for this email
  await prisma.publicOtp.updateMany({
    where: { email: user.email, type: 'LOGIN_2FA', isUsed: false },
    data: { isUsed: true },
  });

  await prisma.publicOtp.create({
    data: {
      email: user.email,
      otpHash,
      type: 'LOGIN_2FA',
      expiresAt,
    },
  });

  // Send OTP email asynchronously / safely so SMTP latency doesn't block or fail the endpoint
  sendOtpEmail({
    toEmail: user.email,
    otpCode,
    type: 'LOGIN',
    recipientName: user.fullName,
  }).catch((err) => {
    console.error(`[2FA Email] Failed to send OTP email to ${user.email}:`, err);
  });

  return otpCode;
}

// ── GET & UPDATE MOBILE 2FA CONFIG ──
router.get('/mobile-2fa-config', async (_req: Request, res: Response) => {
  try {
    const config = getMobile2FAConfig();
    res.json({ status: 'success', data: config });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.put('/mobile-2fa-config', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { twoFactorEnabled, twoFactorMethod } = req.body;
    const updated = saveMobile2FAConfig({
      twoFactorEnabled: Boolean(twoFactorEnabled),
      twoFactorMethod: twoFactorMethod === 'EMAIL' ? 'EMAIL' : 'GOOGLE_AUTH',
      updatedBy: req.user?.email || req.user?.id,
    });
    res.json({
      status: 'success',
      message: updated.twoFactorEnabled
        ? `Autentikasi 2FA berhasil diaktifkan (${updated.twoFactorMethod === 'EMAIL' ? '2FA Email' : 'Google Authenticator'}) untuk semua user.`
        : 'Autentikasi 2FA berhasil dinonaktifkan untuk semua user.',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── RESEND 2FA EMAIL OTP ──
router.post('/resend-2fa-email', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID wajib diisi' });
    }
    const user = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (!user || !user.isActive || !user.email) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }
    await generateAndSendEmail2FAOtp({ id: user.id, email: user.email, fullName: user.fullName });
    res.json({
      status: 'success',
      message: `Kode OTP baru telah dikirim ke email ${user.email}`,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── LOGIN ──
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { email: { contains: email } },
        ],
      },
      include: { 
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }, 
        jabatan: true 
      },
    });

    if (!user || !(await AuthService.comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    }

    if (!user.isActive) {
      return res.status(403).json({ status: 'error', message: 'Akun Anda telah dinonaktifkan' });
    }

    const mobile2faConfig = getMobile2FAConfig();

    // Jika konfigurasi 2FA aktif, semua user akan melalui mode 2FA terlebih dahulu
    if (mobile2faConfig.twoFactorEnabled) {
      // ── MODE A: 2FA EMAIL ──
      if (mobile2faConfig.twoFactorMethod === 'EMAIL') {
        if (!AuthService.isUniversalOtpEnabledForUser(user.email || '')) {
          await generateAndSendEmail2FAOtp({
            id: user.id,
            email: user.email || '',
            fullName: user.fullName,
          });
        }
        return res.json({
          status: 'success',
          message: 'Kode OTP telah dikirim ke email Anda',
          requires2FA: true,
          twoFactorMethod: 'EMAIL',
          userId: user.id,
          email: user.email,
        });
      }

      // ── MODE B: GOOGLE AUTHENTICATOR ──
      // CASE 0: Universal OTP enabled for this user (Google Play Review / Test Account)
      if (AuthService.isUniversalOtpEnabledForUser(user.email || '')) {
        return res.json({
          status: 'success',
          message: '2FA required',
          requires2FA: true,
          twoFactorMethod: 'GOOGLE_AUTH',
          userId: user.id,
        });
      }

      // CASE 1: User belum pernah setup 2FA sama sekali
      if (!user.twoFactorSecret) {
        return res.json({
          status: 'success',
          message: '2FA setup required',
          requires_2fa_setup: true,
          twoFactorMethod: 'GOOGLE_AUTH',
          userId: user.id,
        });
      }

      // CASE 2: User sudah setup 2FA, minta OTP
      if (user.twoFactorEnabled) {
        return res.json({
          status: 'success',
          message: '2FA required',
          requires2FA: true,
          twoFactorMethod: 'GOOGLE_AUTH',
          userId: user.id,
        });
      }

      // CASE 3: Secret ada tapi belum enable (setup tapi belum verify) — treat as needs setup
      if (user.twoFactorSecret && !user.twoFactorEnabled) {
        return res.json({
          status: 'success',
          message: '2FA setup not completed',
          requires_2fa_setup: true,
          twoFactorMethod: 'GOOGLE_AUTH',
          userId: user.id,
        });
      }
    }

    // Jika 2FA dinonaktifkan (default untuk kenyamanan pimpinan/pejabat DSN-MUI), langsung login
    const accessToken = AuthService.generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = AuthService.generateRefreshToken({ id: user.id, email: user.email });

    res.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role.name,
          roleId: user.role.id,
          jabatan: user.jabatan?.name,
          permissions: user.role.rolePermissions.map(rp => rp.permission.code),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


// ── VERIFY 2FA ──
router.post('/verify-2fa', async (req: Request, res: Response) => {
  try {
    const { userId, token, method } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ status: 'error', message: 'User ID and token are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }, 
        jabatan: true 
      },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    const cleanToken = String(token).replace(/\s/g, '');
    const isUniversal = AuthService.isUniversalOtpValid(cleanToken, user.email || '');
    const mobile2faConfig = getMobile2FAConfig();
    const activeMethod = method || mobile2faConfig.twoFactorMethod;

    if (activeMethod === 'EMAIL') {
      if (!isUniversal) {
        const otpRecord = await prisma.publicOtp.findFirst({
          where: {
            email: user.email || '',
            type: 'LOGIN_2FA',
            isUsed: false,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
          return res.status(401).json({ status: 'error', message: 'Kode OTP tidak ditemukan atau sudah digunakan. Silakan kirim ulang kode OTP.' });
        }

        if (new Date() > otpRecord.expiresAt) {
          return res.status(401).json({ status: 'error', message: 'Kode OTP telah kedaluwarsa. Silakan kirim ulang kode OTP.' });
        }

        const isMatch = await AuthService.comparePassword(cleanToken, otpRecord.otpHash);
        if (!isMatch) {
          return res.status(401).json({ status: 'error', message: 'Kode OTP email tidak sesuai.' });
        }

        await prisma.publicOtp.update({
          where: { id: otpRecord.id },
          data: { isUsed: true },
        });
      }
    } else {
      if (!user.twoFactorSecret && !isUniversal) {
        return res.status(400).json({ status: 'error', message: '2FA not set up for this user' });
      }

      const isValid = isUniversal || (user.twoFactorSecret ? AuthService.verify2FAToken(cleanToken, user.twoFactorSecret, user.email || '') : false);

      if (!isValid) {
        console.warn(`[2FA] Invalid token attempted for user ${userId}. Potential time drift or incorrect code.`);
        return res.status(401).json({ status: 'error', message: 'Kode 2FA tidak valid' });
      }
    }

    const accessToken = AuthService.generateAccessToken({ id: user.id, email: user.email || '' });
    const refreshToken = AuthService.generateRefreshToken({ id: user.id, email: user.email || '' });

    res.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role.name,
          roleId: user.role.id,
          jabatan: user.jabatan?.name,
          permissions: user.role.rolePermissions.map(rp => rp.permission.code),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SETUP 2FA (authenticated — for settings page) ──
router.post('/setup-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const { otpauth_url, base32 } = AuthService.generate2FASecret(user.email || '');
    const qrCode = await AuthService.generateQRCode(otpauth_url!);
    await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: base32 } });

    res.json({ status: 'success', data: { qrCode, secret: base32 } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SETUP 2FA PUBLIC — for first-time login (no token required) ──
router.post('/setup-2fa-public', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ status: 'error', message: 'userId wajib diisi' });

    const user = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (!user || !user.isActive) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    // Only allow this if 2FA is not yet enabled
    if (user.twoFactorEnabled) {
      return res.status(400).json({ status: 'error', message: '2FA sudah aktif untuk user ini' });
    }

    const { otpauth_url, base32 } = AuthService.generate2FASecret(user.email || '');
    const qrCode = await AuthService.generateQRCode(otpauth_url!);
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: base32 } });

    res.json({ status: 'success', data: { qrCode, secret: base32 } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── ENABLE 2FA (authenticated — for settings page) ──
router.post('/enable-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ status: 'error', message: '2FA secret tidak ditemukan' });
    }

    const isValid = AuthService.verify2FAToken(token, user.twoFactorSecret, user.email || '');
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Kode verifikasi tidak valid' });
    }

    await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    res.json({ status: 'success', message: '2FA berhasil diaktifkan' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── ENABLE 2FA PUBLIC — first-time activation returns access token ──
router.post('/enable-2fa-public', async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ status: 'error', message: 'userId dan token wajib diisi' });
    }

    const user = await prisma.user.findUnique({ 
      where: { id: String(userId) }, 
      include: { 
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }, 
        jabatan: true 
      } 
    });
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ status: 'error', message: '2FA belum dikonfigurasi untuk user ini' });
    }

    const isValid = AuthService.verify2FAToken(token, user.twoFactorSecret, user.email || '');
    if (!isValid) {
      console.warn(`[2FA] Setup verification failed for user ${userId}. Secret: ${user.twoFactorSecret}`);
      return res.status(401).json({ status: 'error', message: 'Kode OTP tidak valid. Pastikan waktu di perangkat Anda sudah sinkron.' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });

    const accessToken = AuthService.generateAccessToken({ id: user.id, email: user.email || '' });
    const refreshToken = AuthService.generateRefreshToken({ id: user.id, email: user.email || '' });

    res.json({
      status: 'success',
      message: '2FA berhasil diaktifkan',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role.name,
          jabatan: user.jabatan?.name,
          permissions: user.role.rolePermissions.map(rp => rp.permission.code),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


// ── REFRESH TOKEN ──
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ status: 'error', message: 'Refresh token is required' });
    }

    const decoded = AuthService.verifyToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ status: 'error', message: 'User not found or inactive' });
    }

    const newAccessToken = AuthService.generateAccessToken({ id: user.id, email: user.email });
    const newRefreshToken = AuthService.generateRefreshToken({ id: user.id, email: user.email });

    res.json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── BIOMETRIC LOGIN ──
router.post('/biometric/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { deviceId, token } = req.body;

    if (!deviceId || !token) {
      return res.status(400).json({ status: 'error', message: 'deviceId dan token wajib diisi' });
    }

    const tokenHash = await AuthService.hashPassword(token);

    await prisma.userBiometric.upsert({
      where: {
        userId_deviceId: { userId, deviceId }
      },
      update: { tokenHash },
      create: { userId, deviceId, tokenHash }
    });

    res.json({ status: 'success', message: 'Biometrik berhasil didaftarkan' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/biometric/login', async (req: Request, res: Response) => {
  try {
    const { deviceId, token } = req.body;

    if (!deviceId || !token) {
      return res.status(400).json({ status: 'error', message: 'deviceId dan token wajib diisi' });
    }

    const biometric = await prisma.userBiometric.findFirst({
      where: { deviceId },
      include: {
        user: {
          include: { 
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }, 
            jabatan: true 
          }
        }
      }
    });

    if (!biometric || !(await AuthService.comparePassword(token, biometric.tokenHash))) {
      return res.status(401).json({ status: 'error', message: 'Kredensial biometrik tidak valid atau belum didaftarkan' });
    }

    const user = biometric.user;

    if (!user.isActive) {
      return res.status(403).json({ status: 'error', message: 'Akun Anda telah dinonaktifkan' });
    }

    const accessToken = AuthService.generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = AuthService.generateRefreshToken({ id: user.id, email: user.email });

    res.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role.name,
          jabatan: user.jabatan?.name,
          permissions: user.role.rolePermissions.map(rp => rp.permission.code),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CHECK PIN ──
router.get('/check-pin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }
    res.json({
      status: 'success',
      data: {
        hasPin: !!user.pinHash
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SETUP PIN ──
router.post('/setup-pin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== 'string' || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ status: 'error', message: 'PIN harus berupa 6 digit angka' });
    }

    const pinHash = await AuthService.hashPassword(pin);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { pinHash }
    });

    res.json({ status: 'success', message: 'PIN berhasil dikonfigurasi' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── VERIFY PIN ──
router.post('/verify-pin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ status: 'error', message: 'PIN wajib diisi' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user || !user.pinHash) {
      return res.status(400).json({ status: 'error', message: 'PIN belum dikonfigurasi' });
    }

    const isValid = await AuthService.comparePassword(pin, user.pinHash);

    res.json({
      status: 'success',
      data: {
        valid: isValid
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
