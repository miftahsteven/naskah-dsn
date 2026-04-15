import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { prisma } from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── LOGIN ──
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !(await AuthService.comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ status: 'error', message: 'Account is deactivated' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.json({
        status: 'success',
        message: '2FA required',
        requires2FA: true,
        userId: user.id,
      });
    }

    // Standard login (if 2FA optional or not set up yet)
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
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ status: 'error', message: 'User ID and token are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ status: 'error', message: '2FA not set up for this user' });
    }

    const isValid = AuthService.verify2FAToken(token, user.twoFactorSecret);

    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid 2FA token' });
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
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SETUP 2FA ──
router.post('/setup-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const { otpauth_url, base32 } = AuthService.generate2FASecret(user.email);
    const qrCode = await AuthService.generateQRCode(otpauth_url!);

    // Save secret temporarily or just return and wait for verification to enable
    // For simplicity in this demo, we return it. In production, we'd store marked as 'pending'
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: base32 },
    });

    res.json({
      status: 'success',
      data: {
        qrCode,
        secret: base32,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── ENABLE 2FA ──
router.post('/enable-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ status: 'error', message: '2FA secret not found' });
    }

    const isValid = AuthService.verify2FAToken(token, user.twoFactorSecret);

    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid verification token' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    res.json({ status: 'success', message: '2FA enabled successfully' });
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

export default router;
