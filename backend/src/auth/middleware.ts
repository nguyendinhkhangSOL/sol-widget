// backend/src/auth/middleware.ts
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserTier } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../db';
import {
  computeTierState,
  effectiveTier,
  hasFeature,
  quotaForUser,
  type FeatureKey,
  type TierState,
} from '../tiers/featureGates';

export interface AuthedRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  /** Tier "thật" trong DB (chưa tính expire). */
  userTier?: UserTier;
  /** Tier hiệu lực sau khi tính expire (KHOI_DONG hết hạn → FREE). */
  effectiveTier?: UserTier;
  /** Trạng thái tier (ngày, refund, maintenance…). */
  tierState?: TierState;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn as any,
  });
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { sub: string };
    return decoded.sub;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing_or_invalid_authorization_header' });
  }
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'invalid_token' });
  }
  req.userId = userId;
  next();
}

/**
 * Yêu cầu user đã đăng nhập VÀ có isAdmin=true trong DB.
 * Dùng cho toàn bộ /admin/*.
 */
export async function adminMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  const u = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isAdmin: true },
  });
  if (!u?.isAdmin) {
    return res.status(403).json({ error: 'not_admin' });
  }
  req.isAdmin = true;
  next();
}

/**
 * Load tier vào req. Phải chạy SAU authMiddleware. Không reject — chỉ gắn
 * thông tin để route handler tự quyết định.
 */
export async function tierMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.userId) return res.status(401).json({ error: 'unauthenticated' });

  const u = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      tier: true,
      tierStartedAt: true,
      tierExpiresAt: true,
      maintenanceUntil: true,
    },
  });
  if (!u) return res.status(404).json({ error: 'user_not_found' });

  req.userTier = u.tier;
  req.tierState = computeTierState(u);
  req.effectiveTier = effectiveTier(u);
  next();
}

/**
 * Cần feature X mới cho qua. Gắn vào route cần gate.
 * Trả 402 (Payment Required) nếu thiếu — frontend bắt code này hiển thị paywall.
 */
export function requireFeature(key: FeatureKey) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.effectiveTier) {
      // Cho phép gọi mà không cần tierMiddleware đứng trước — load lazily
      const u = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: {
          tier: true,
          tierStartedAt: true,
          tierExpiresAt: true,
          maintenanceUntil: true,
        },
      });
      if (!u) return res.status(404).json({ error: 'user_not_found' });
      req.userTier = u.tier;
      req.effectiveTier = effectiveTier(u);
      req.tierState = computeTierState(u);
    }
    if (!hasFeature(req.effectiveTier!, key)) {
      return res.status(402).json({
        error: 'paywall_required',
        feature: key,
        currentTier: req.effectiveTier,
      });
    }
    next();
  };
}

/**
 * Daily message quota cho FREE + ALUMNI + DONG_HANH-maintenance. Gắn vào
 * /messages POST. Tăng count sau khi route handler chạy thành công thì gọi
 * incrementDailyMessage(userId) bên route — middleware này chỉ check.
 */
export async function messageQuotaMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.userId) return res.status(401).json({ error: 'unauthenticated' });

  const u = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      tier: true,
      tierStartedAt: true,
      tierExpiresAt: true,
      maintenanceUntil: true,
      dailyMessageCount: true,
      dailyMessageDate: true,
      quitDate: true, // ← cần để tính first-week boost cho FREE
    },
  });
  if (!u) return res.status(404).json({ error: 'user_not_found' });

  const eff = effectiveTier(u);
  const state = computeTierState(u);
  req.userTier = u.tier;
  req.effectiveTier = eff;
  req.tierState = state;

  // FREE user trong tuần đầu sau Q-Day được boost quota 5→15 để
  // trải nghiệm AI đủ nhiều khi cám dỗ cao + ra quyết định mua.
  const limit = quotaForUser(eff, state.inMaintenance, u.quitDate);
  if (limit === null) return next(); // unlimited

  // Reset count nếu sang ngày mới
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyDate = u.dailyMessageDate ? new Date(u.dailyMessageDate) : null;
  const sameDay =
    dailyDate &&
    dailyDate.getFullYear() === today.getFullYear() &&
    dailyDate.getMonth() === today.getMonth() &&
    dailyDate.getDate() === today.getDate();

  const used = sameDay ? u.dailyMessageCount : 0;

  if (used >= limit) {
    return res.status(402).json({
      error: 'quota_exceeded',
      currentTier: eff,
      dailyLimit: limit,
      used,
    });
  }

  // Pass through; route sẽ gọi incrementDailyMessage(userId) sau khi tạo msg.
  next();
}

/**
 * Tăng count tin nhắn của user trong ngày (idempotent reset cross-day).
 * Gọi từ route handler sau khi tạo message thành công.
 */
export async function incrementDailyMessage(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyMessageCount: true, dailyMessageDate: true },
  });
  if (!u) return;
  const dailyDate = u.dailyMessageDate ? new Date(u.dailyMessageDate) : null;
  const sameDay =
    dailyDate &&
    dailyDate.getFullYear() === today.getFullYear() &&
    dailyDate.getMonth() === today.getMonth() &&
    dailyDate.getDate() === today.getDate();

  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyMessageCount: sameDay ? { increment: 1 } : 1,
      dailyMessageDate: today,
    },
  });
}
