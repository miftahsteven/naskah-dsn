import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    unitId?: string | null;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token format' });
  }
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token' });
  }

  // Check if user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: User not found or inactive' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role.name,
    organizationId: user.organizationId,
    unitId: user.unitId,
  };

  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
