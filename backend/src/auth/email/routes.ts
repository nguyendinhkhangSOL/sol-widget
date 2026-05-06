// backend/src/auth/email/routes.ts
// Email magic link auth endpoints (Phase B pivot 2026-05-06).
//
// Flow:
//   1. POST /auth/email/request { email }
//      → tạo token 32-char hex, expire 1h, gửi mail magic link
//      → response 200 dù email đã có hay chưa (anti-enumeration)
//   2. GET /auth/email/verify?token=XXX
//      → match token → consume → tìm User với email
//        - Có → MERGE anon (caller's auth) vào user gốc → cấp JWT
//        - Chưa → bind email vào anon → cấp JWT
//      → response { token: JWT, userId, mergedFrom }

import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import { authMiddleware, type AuthedRequest } from '../middleware';
import { mergeOrUpgrade } from '../userMerge';
import { sendEmail } from './smtpClient';
import { renderMagicLinkEmail } from './template';

export const emailAuthRouter = Router();

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 giờ
const TOKEN_LENGTH = 32; // hex chars

function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH / 2).toString('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  // Basic regex — không cần perfect, server validate qua sendEmail thật
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── POST /auth/email/request ─────────────────────────────────────────────
// Yêu cầu authMiddleware vì caller PHẢI có anon JWT trước (đã /auth/anonymous).
// Nếu không có anon, caller cần signup deviceUid trước rồi gọi endpoint này.
const requestSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(254),
});

emailAuthRouter.post('/request', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'invalid_payload',
        message: parsed.error.issues[0]?.message ?? 'Email không hợp lệ',
      });
    }

    const email = normalizeEmail(parsed.data.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    const fromUserId = req.userId!;

    // Rate limit: max 3 token / email / 10 phút (anti-spam)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await prisma.emailVerificationToken.count({
      where: { email, createdAt: { gte: tenMinAgo } },
    });
    if (recentCount >= 3) {
      return res.status(429).json({
        error: 'rate_limit',
        message: 'Đã gửi quá nhiều link gần đây. Hãy đợi 10 phút trước khi yêu cầu lại.',
      });
    }

    // Tạo token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await prisma.emailVerificationToken.create({
      data: {
        token,
        email,
        fromUserId,
        expiresAt,
      },
    });

    // Lấy pronouns user để cá nhân hoá email
    const user = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { pronouns: true },
    });
    const pronouns = user?.pronouns ?? 'bạn';

    // Build magic link
    const appUrl = process.env.APP_URL || 'https://bothuocla.sol.vn';
    const link = `${appUrl}/auth/email?token=${token}`;

    // Render + send
    const { subject, html, text } = renderMagicLinkEmail({
      link,
      pronouns,
      expiryMinutes: 60,
    });

    const result = await sendEmail({ to: email, subject, html, text });

    if (!result.ok) {
      logger.error({ email, error: result.error }, 'magic link email send failed');
      // KHÔNG expose error đến client — bảo mật + UX
      return res.status(500).json({
        error: 'send_failed',
        message: 'Không gửi được email. Vui lòng thử lại sau hoặc liên hệ khang@sol.vn.',
      });
    }

    logger.info({ email, fromUserId, tokenPrefix: token.slice(0, 8) }, 'magic link email sent');

    return res.json({
      ok: true,
      message: `Đã gửi link đăng nhập tới ${email}. Kiểm tra hộp thư trong vòng 5 phút (kể cả thư mục spam).`,
    });
  } catch (e: any) {
    logger.error({ err: e }, 'email/request error');
    return res.status(500).json({ error: 'internal', message: e?.message });
  }
});

// ─── GET /auth/email/verify?token=XXX ─────────────────────────────────────
// KHÔNG cần authMiddleware — verify token là cách user prove identity.
// User click link từ email → browser GET → verify → trả JWT.
emailAuthRouter.get('/verify', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token || token.length !== TOKEN_LENGTH) {
      return res.status(400).json({ error: 'invalid_token' });
    }

    const tokenRow = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!tokenRow) {
      return res.status(404).json({ error: 'token_not_found', message: 'Link không hợp lệ.' });
    }
    if (tokenRow.consumedAt) {
      return res.status(400).json({ error: 'token_used', message: 'Link đã được sử dụng. Yêu cầu link mới.' });
    }
    if (tokenRow.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'token_expired', message: 'Link đã hết hạn (sau 1 giờ). Yêu cầu link mới.' });
    }

    const email = tokenRow.email;
    const fromUserId = tokenRow.fromUserId;

    // Tìm User existing với email này
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    let targetUserId: string;
    let mergedFromUserId: string | null = null;

    if (fromUserId) {
      // Có anon hiện tại — MERGE hoặc upgrade
      const merge = await mergeOrUpgrade({
        anonUserId: fromUserId,
        existingUserId: existing?.id ?? null,
        email,
      });
      targetUserId = merge.targetUserId;
      mergedFromUserId = merge.mergedFromUserId;
    } else {
      // Không có anon (request từ user logout state)
      if (existing) {
        targetUserId = existing.id;
      } else {
        // Create new user với email
        const newUser = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0],
            isAnonymous: false,
          },
        });
        targetUserId = newUser.id;
      }
    }

    // Consume token
    await prisma.emailVerificationToken.update({
      where: { token },
      data: { consumedAt: new Date() },
    });

    // Cấp JWT mới cho target user
    const jwtToken = jwt.sign(
      { sub: targetUserId },
      config.auth.jwtSecret as string,
      { expiresIn: (config.auth.jwtExpiresIn || '30d') as any },
    );

    logger.info(
      { email, targetUserId, mergedFromUserId },
      'email magic link verified',
    );

    return res.json({
      ok: true,
      token: jwtToken,
      userId: targetUserId,
      mergedFromUserId,
      message: 'Đã đồng bộ tài khoản thành công.',
    });
  } catch (e: any) {
    logger.error({ err: e }, 'email/verify error');
    return res.status(500).json({ error: 'internal', message: e?.message });
  }
});
