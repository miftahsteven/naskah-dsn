import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../../lib/prisma.js';

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
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY as any });
  }

  static generateRefreshToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY as any });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // ── TWO FACTOR AUTHENTICATION ─────────────────────────────────────────────

  /**
   * Checks if universal OTP feature is active, within expiration date, and applies to the given user email.
   */
  static isUniversalOtpEnabledForUser(userEmail?: string): boolean {
    const universalCode = process.env.UNIVERSAL_OTP_CODE?.trim();
    if (!universalCode) return false;

    // Check expiration date
    const expiryStr = process.env.UNIVERSAL_OTP_EXPIRES_AT?.trim();
    if (expiryStr) {
      const expiryDate = new Date(expiryStr);
      if (!isNaN(expiryDate.getTime())) {
        // Set expiry to end of day 23:59:59.999
        expiryDate.setHours(23, 59, 59, 999);
        if (new Date() > expiryDate) {
          console.warn(`[2FA] Universal OTP has expired on ${expiryStr}`);
          return false;
        }
      }
    }

    // Check allowed users list (comma-separated). If set to '*' or empty, all users apply
    const allowedUsersStr = process.env.UNIVERSAL_OTP_USERS?.trim();
    if (allowedUsersStr && allowedUsersStr !== '*' && userEmail) {
      const allowedUsers = allowedUsersStr.split(',').map(u => u.trim().toLowerCase());
      if (!allowedUsers.includes(userEmail.trim().toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates if the supplied token matches the configured Universal OTP
   */
  static isUniversalOtpValid(token: string, userEmail?: string): boolean {
    if (!this.isUniversalOtpEnabledForUser(userEmail)) return false;
    const universalCode = process.env.UNIVERSAL_OTP_CODE?.trim();
    const cleanToken = String(token).trim();
    return cleanToken === universalCode;
  }

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

  static verify2FAToken(token: string, secret?: string | null, userEmail?: string): boolean {
    // 1. Check Universal OTP (Google Play Review / authorized test accounts)
    if (this.isUniversalOtpValid(token, userEmail)) {
      console.log(`[2FA] Universal OTP verified successfully for ${userEmail || 'authorized account'}`);
      return true;
    }

    // 2. Standard TOTP verification (Google Authenticator)
    if (!secret) return false;
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(token).trim(),
      window: 3, // Allow 90s window (3 steps of 30s) for better reliability against time drift
    });
  }
}

