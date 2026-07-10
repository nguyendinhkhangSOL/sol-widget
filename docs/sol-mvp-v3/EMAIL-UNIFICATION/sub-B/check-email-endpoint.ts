/**
 * Bonus endpoint — /api/auth/check-email
 *
 * Dùng bởi frontend /thanh-toan/ để check email tồn tại (debounce onBlur).
 * Nếu tồn tại → force login modal.
 *
 * Integration:
 *   Add vào backend/src/auth/routes.ts:
 *     router.get('/check-email', handleCheckEmail);
 */

import { Request, Response } from 'express';
import { prisma } from '../db';

export async function handleCheckEmail(req: Request, res: Response) {
  const email = (req.query.email as string || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: 'MISSING_EMAIL' });
  }

  // Rate limit khuyến nghị: 20 req/min per IP để tránh enumeration attack
  // (Add express-rate-limit middleware)

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true, // Chỉ check có hay không, không return
      tier: true,
      status: true,
    },
  });

  if (!user) {
    return res.json({
      exists: false,
    });
  }

  return res.json({
    exists: true,
    // Discriminate cho frontend biết flow
    hasPassword: !!user.passwordHash,
    tier: user.tier,
    status: user.status,
    // Suggest action
    suggestedAction: user.passwordHash
      ? 'login' // Đã đăng ký đầy đủ → login
      : 'reset_password', // Shell user (đã pay chưa activate) → gợi ý password reset
  });
}
