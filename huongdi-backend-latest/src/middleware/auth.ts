import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  type: 'access' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing token', 'UNAUTHORIZED'));
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token', 'TOKEN_INVALID'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
  const adminRoles: UserRole[] = ['SUPER_ADMIN', 'RESEARCH_EDITOR', 'CONTENT_EDITOR', 'ANALYST'];
  if (!adminRoles.includes(req.user.role)) {
    return next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
  }
  return next();
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError(403, 'Super admin only', 'FORBIDDEN'));
  }
  return next();
}

// Optional auth — attaches user if token present, continues either way
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch {
      // ignore
    }
  }
  return next();
}
