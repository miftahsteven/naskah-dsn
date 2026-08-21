import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';

export interface PublicAuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  companyId: string;
  companyName: string;
}

export interface PublicAuthRequest extends Request {
  publicUser?: PublicAuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-edocs-system-2026';

export const generatePublicToken = (payload: PublicAuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyPublicToken = (token: string): PublicAuthUser | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as PublicAuthUser;
  } catch {
    return null;
  }
};

export const authenticatePublic = async (
  req: PublicAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Akses ditolak: Token otentikasi tidak ditemukan. Silakan login kembali.',
      });
    }

    const token = authHeader.split(' ')[1] || '';
    const decoded = verifyPublicToken(token);

    if (!decoded || !decoded.id || !decoded.companyId) {
      return res.status(401).json({
        status: 'error',
        message: 'Sesi Anda telah kedaluwarsa atau tidak valid. Silakan login kembali.',
      });
    }

    // Verify user & company still active in database
    const companyUser = await prisma.companyUser.findUnique({
      where: { id: decoded.id },
      include: { company: true },
    });

    if (!companyUser || !companyUser.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Akun Anda tidak aktif atau tidak ditemukan.',
      });
    }

    req.publicUser = {
      id: companyUser.id,
      email: companyUser.email,
      fullName: companyUser.fullName,
      role: companyUser.role,
      companyId: companyUser.companyId,
      companyName: companyUser.company.name,
    };

    next();
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memverifikasi otentikasi portal publik.',
      error: error.message,
    });
  }
};
