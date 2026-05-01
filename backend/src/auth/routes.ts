// backend/src/auth/routes.ts
//
// Anonymous-first auth + Zalo OAuth + Phone OTP fallback.
//
// 3 đường vào:
//   1. POST /auth/anonymous       — tạo user ẩn danh từ deviceUid (không cần PII)
//   2. GET  /auth/zalo/init       — redirect user sang Zalo OAuth
//      GET  /auth/zalo/callback   — Zalo redirect về đây sau khi user authorize
//   3. POST /auth/request-otp     — fallback SMS OTP (cho user không dùng Zalo)
//      POST /auth/verify-otp      — verify SMS code, bind phone
//
// Anon-first cho launch beta — tránh SMS cost + brand trust issues. Zalo là
// upgrade path chính (95% user 45+ Việt có Zalo). Phone là backup.

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { logger } from '../utils/logger';
import { authMiddleware, signToken, type AuthedRequest } from './middleware';
import {
  buildZaloAuthUrl,
  exchangeCodeForToken,
  fetchZaloUser,
  generatePkce,
  generateState,
} from './zaloClient';
import { saveState, consumeState } from './oauthState';
import { mergeOrUpgrade } from './userMerge';
import {
  findUserByRecoveryCode,
  invalidateRecoveryCode,
  issueRecoveryCode,
} from './recoveryCode';

export const authRouter = Router();

const requestOtpSchema = z.object({
  phone: z.string().min(9).max(15),
});

authRouter.post('/request-otp', async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_phone' });

  const { phone } = parsed.data;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + config.auth.otpTtlMinutes * 60 * 1000);

  await prisma.otpCode.create({ data: { phone, code: hash, expiresAt } });

  if (config.auth.otpDevMode) {
    logger.info({ phone, code }, '[DEV] OTP generated');
  } else {
    // TODO integrate SMS provider (Viettel, VNPT, Twilio…)
  }

  return res.json({ ok: true, expiresInSec: config.auth.otpTtlMinutes * 60 });
});

const verifyOtpSchema = z.object({
  phone: z.string().min(9).max(15),
  code: z.string().length(6),
  name: z.string().min(1).max(80).optional(),
  // Pronouns: tự do tới 8 ký tự ("anh", "chị", "em", "Ngài", "Đại ca"…).
  pronouns: z.string().min(1).max(8).optional(),
  // Tên trợ lý: tới 24 ký tự ("Sol Trợ lý", "Sol Vợ yêu"…).
  assistantName: z.string().min(1).max(24).optional(),
});

authRouter.post('/verify-otp', async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const { phone, code, name, pronouns, assistantName } = parsed.data;

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return res.status(401).json({ error: 'otp_expired_or_missing' });

  const matches = await bcrypt.compare(code, otp.code);
  if (!matches) return res.status(401).json({ error: 'otp_mismatch' });

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    // Tự generate tên mặc định nếu user không nhập:
    // "Soler XXXX" — dùng 4 chữ số cuối phone để dễ nhận biết.
    // User có thể đổi sau trong Settings → Tài khoản.
    const fallbackName = (name && name.trim()) || `Soler ${phone.slice(-4)}`;

    user = await prisma.user.create({
      data: {
        phone,
        name: fallbackName,
        pronouns: pronouns ?? 'bạn',
        assistantName: assistantName ?? 'Sol Đồng hành',
        // KHÔNG set quitDate ở đây. User mới = chưa đặt Q-Day.
        // Phải đi qua /q-day-checklist → tick 2-3 mục bắt buộc →
        // bấm "Kích hoạt Q-Day" → frontend gọi PATCH /users/me { quitDate }.
        // Logic này = Q-Day gate, đảm bảo user chuẩn bị thật trước khi đồng hồ chạy.
        quitDate: null,
        settings: {
          quietStart: '22:30',
          quietEnd: '06:30',
          mode: 'normal',
          // Mặc định hợp lý cho user VN — user sẽ tinh chỉnh ở Settings
          cigsPerDay: 15,
          pricePerCig: 1500,
        },
        state: { create: { state: 'IDLE', stateData: {} } },
      },
    });
  }

  return res.json({ token: signToken(user.id), userId: user.id });
});

/* ─────────────────────────────────────────────────────────────────────
 * ANONYMOUS-FIRST AUTH
 *
 * User mở widget lần đầu → FE generate UUID v4 → POST /auth/anonymous
 * với deviceUid + originDomain → backend tạo User ẩn danh → return JWT.
 *
 * Idempotent: nếu deviceUid đã tồn tại → trả về user hiện có (không tạo
 * mới). Có ích khi user clear cookies nhưng deviceUid vẫn lưu trong
 * localStorage, hoặc khi FE retry.
 * ─────────────────────────────────────────────────────────────────── */

const anonymousSchema = z.object({
  deviceUid: z.string().min(8).max(64),
  originDomain: z.string().min(1).max(120).optional(),
});

authRouter.post('/anonymous', async (req, res) => {
  const parsed = anonymousSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const { deviceUid, originDomain } = parsed.data;

  // Idempotent + atomic: dùng upsert thay vì findUnique+create để tránh
  // race condition khi React StrictMode hoặc 2 tab/device cùng gọi cùng lúc.
  // Postgres tự handle UNIQUE constraint — nếu deviceUid đã tồn tại, update
  // (no-op) thay vì throw P2002.
  const placeholderName = `Khách ${deviceUid.slice(-4).toUpperCase()}`;

  const existed = await prisma.user.findUnique({
    where: { deviceUid },
    select: { id: true },
  });

  const user = await prisma.user.upsert({
    where: { deviceUid },
    update: {}, // không update gì nếu đã tồn tại — chỉ trả về user
    create: {
      deviceUid,
      isAnonymous: true,
      originDomain: originDomain ?? null,
      name: placeholderName,
      pronouns: 'bạn',
      assistantName: 'Sol Đồng hành',
      quitDate: null, // anon chưa đặt Q-Day
      settings: {
        quietStart: '22:30',
        quietEnd: '06:30',
        mode: 'normal',
        cigsPerDay: 15,
        pricePerCig: 1500,
      },
      state: { create: { state: 'IDLE', stateData: {} } },
    },
  });

  if (!existed) {
    logger.info({ userId: user.id, originDomain }, 'Anonymous user created');
  }

  return res.json({
    token: signToken(user.id),
    userId: user.id,
    isAnonymous: user.isAnonymous,
  });
});

/* ─────────────────────────────────────────────────────────────────────
 * ZALO OAUTH
 *
 * Flow:
 *   1. FE gọi GET /auth/zalo/init (kèm Authorization header của anon JWT)
 *      → backend gen state + PKCE → redirect 302 sang Zalo authorize URL
 *   2. User accept trên Zalo → Zalo redirect về /auth/zalo/callback?code=...&state=...
 *   3. Backend exchange code → access_token → fetch user info → bind/merge
 *      → redirect FE với JWT mới trong query string
 * ─────────────────────────────────────────────────────────────────── */

// /init: middleware require anon JWT (user đã login ẩn danh trước đó)
authRouter.get('/zalo/init', authMiddleware, async (req: AuthedRequest, res) => {
  if (!config.auth.zaloAppId || !config.auth.zaloAppSecret) {
    return res.status(503).json({ error: 'zalo_not_configured' });
  }

  const state = generateState();
  const { verifier, challenge } = generatePkce();

  saveState(state, { userId: req.userId!, codeVerifier: verifier });

  const url = buildZaloAuthUrl(state, challenge);
  // Trả URL cho FE để FE tự redirect (window.location.href = url).
  // Hoặc res.redirect(url) nếu gọi trực tiếp từ link.
  return res.json({ url });
});

/* ─────────────────────────────────────────────────────────────────────
 * BIND PHONE (Phone OTP fallback cho user ẩn danh)
 *
 * User ẩn danh muốn liên kết SĐT (vd Zalo bị sập, hoặc không có Zalo):
 *   1. POST /auth/bind-phone/request { phone }  → backend gửi OTP (DEV: log)
 *   2. POST /auth/bind-phone/verify  { phone, code }
 *      → backend match anon user hiện tại với phone existing (nếu có)
 *      → MERGE data, return JWT mới
 *
 * Khác /auth/request-otp + /auth/verify-otp cũ ở chỗ:
 *   - bind-phone require Authorization (đã anon login)
 *   - bind-phone gọi mergeOrUpgrade (chuyển data anon → existing phone user)
 *   - request-otp/verify-otp cũ giữ lại để backwards-compat (public)
 * ─────────────────────────────────────────────────────────────────── */

const bindPhoneRequestSchema = z.object({
  phone: z.string().min(9).max(15),
});

authRouter.post('/bind-phone/request', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = bindPhoneRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_phone' });

  const { phone } = parsed.data;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + config.auth.otpTtlMinutes * 60 * 1000);

  await prisma.otpCode.create({ data: { phone, code: hash, expiresAt } });

  if (config.auth.otpDevMode) {
    logger.info({ phone, code }, '[DEV] Bind-phone OTP generated');
  } else {
    // TODO integrate SMS provider
  }

  return res.json({ ok: true, expiresInSec: config.auth.otpTtlMinutes * 60 });
});

const bindPhoneVerifySchema = z.object({
  phone: z.string().min(9).max(15),
  code: z.string().length(6),
});

authRouter.post('/bind-phone/verify', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = bindPhoneVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const { phone, code } = parsed.data;

  // Verify OTP
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return res.status(401).json({ error: 'otp_expired_or_missing' });

  const matches = await bcrypt.compare(code, otp.code);
  if (!matches) return res.status(401).json({ error: 'otp_mismatch' });

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  // Lookup existing user with this phone
  const existing = await prisma.user.findUnique({ where: { phone } });

  // Merge or upgrade — giống Zalo callback
  const { targetUserId } = await mergeOrUpgrade({
    anonUserId: req.userId!,
    existingUserId: existing?.id ?? null,
    phone,
  });

  // Layer 3: nếu user chưa có recovery code → sinh ngay
  // (chỉ lần đầu bind, hoặc sau khi user vừa recover bằng mã cũ)
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { recoveryCodeHash: true },
  });
  let recoveryCode: string | null = null;
  if (!target?.recoveryCodeHash) {
    recoveryCode = await issueRecoveryCode(targetUserId);
    logger.info(
      { targetUserId, codePrefix: recoveryCode.slice(0, 8) },
      'Layer 3: recovery code issued',
    );
  } else {
    logger.info(
      { targetUserId },
      'Layer 3: user already has recovery code, skip',
    );
  }

  return res.json({
    token: signToken(targetUserId),
    userId: targetUserId,
    // recoveryCode chỉ trả khi vừa sinh — FE phải hiện modal force user save.
    // Plaintext này KHÔNG bao giờ trả lại lần 2.
    recoveryCode,
  });
});

/* ─────────────────────────────────────────────────────────────────────
 * RECOVER (Layer 3) — user mất Zalo + SĐT, dùng mã offline
 *
 * POST /auth/recover { code: "SOL-XXXX-XXXX-XXXX" }
 *   → bcrypt scan tất cả user có recoveryCodeHash != null
 *   → match → cấp JWT, invalidate code, sinh code mới (trả về để user save lại)
 *   → fail → 401
 *
 * Public route (không cần auth) — đây là "lost everything" path. Nếu cần
 * chống brute force, thêm rate limit per IP (5 attempts / 10 phút).
 * ─────────────────────────────────────────────────────────────────── */

const recoverSchema = z.object({
  code: z.string().min(8).max(40),
});

authRouter.post('/recover', async (req, res) => {
  const parsed = recoverSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const codePrefix = parsed.data.code.slice(0, 8);
  const userId = await findUserByRecoveryCode(parsed.data.code);
  if (!userId) {
    logger.warn({ codePrefix }, 'Layer 3: recovery code mismatch');
    return res.status(401).json({ error: 'invalid_recovery_code' });
  }

  // 1-shot use: invalidate mã cũ
  await invalidateRecoveryCode(userId);

  // Sinh mã mới ngay → user save tiếp (vì lần này họ đã được nhắc rồi)
  const newCode = await issueRecoveryCode(userId);

  logger.info(
    { userId, oldCodePrefix: codePrefix, newCodePrefix: newCode.slice(0, 8) },
    'Layer 3: recovery success — old code invalidated, new code issued',
  );

  return res.json({
    token: signToken(userId),
    userId,
    recoveryCode: newCode,
  });
});

authRouter.get('/zalo/callback', async (req, res) => {
  const code = String(req.query.code ?? '');
  const state = String(req.query.state ?? '');
  const error = String(req.query.error ?? '');

  // Helper redirect FE với status
  const redirectFe = (status: 'success' | 'error', extra: Record<string, string> = {}) => {
    const url = new URL(config.auth.zaloFrontendUrl);
    url.searchParams.set('zalo', status);
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
    res.redirect(url.toString());
  };

  if (error) {
    logger.warn({ error }, 'Zalo callback returned error');
    return redirectFe('error', { reason: error });
  }
  if (!code || !state) {
    return redirectFe('error', { reason: 'missing_code_or_state' });
  }

  const pending = consumeState(state);
  if (!pending) {
    return redirectFe('error', { reason: 'invalid_or_expired_state' });
  }

  try {
    // 1. Exchange code → access_token
    const { accessToken } = await exchangeCodeForToken(code, pending.codeVerifier);

    // 2. Fetch user info từ Zalo
    const zaloUser = await fetchZaloUser(accessToken);

    // 3. Bind/merge logic
    const existing = await prisma.user.findUnique({
      where: { zaloUserId: zaloUser.id },
    });

    const { targetUserId } = await mergeOrUpgrade({
      anonUserId: pending.userId!,
      existingUserId: existing?.id ?? null,
      zaloUserId: zaloUser.id,
      name: zaloUser.name,
      pictureUrl: zaloUser.pictureUrl,
    });

    // 4. Cấp JWT mới cho user "khoẻ" (existing nếu có, hoặc anon đã upgrade)
    const newToken = signToken(targetUserId);

    // 5. Layer 3: nếu user chưa có recovery code → sinh ngay
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { recoveryCodeHash: true },
    });
    let recoveryCode: string | null = null;
    if (!target?.recoveryCodeHash) {
      recoveryCode = await issueRecoveryCode(targetUserId);
    }

    // Truyền recoveryCode qua URL query — FE parse → hiện modal force save → clear URL
    const extra: Record<string, string> = { token: newToken };
    if (recoveryCode) extra.recovery = recoveryCode;
    return redirectFe('success', extra);
  } catch (e: any) {
    logger.error({ err: e?.message }, 'Zalo callback failed');
    return redirectFe('error', { reason: e?.message ?? 'unknown' });
  }
});
