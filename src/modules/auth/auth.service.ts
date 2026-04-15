import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  static generateRefreshToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // ── TWO FACTOR AUTHENTICATION ─────────────────────────────────────────────

  static generate2FASecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `MUI Naskah Digital (${email})`,
    });
    return {
      otpauth_url: secret.otpauth_url,
      base32: secret.base32,
    };
  }

  static async generateQRCode(otpauthUrl: string): Promise<string> {
    return qrcode.toDataURL(otpauthUrl);
  }

  static verify2FAToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 30s window
    });
  }
}
