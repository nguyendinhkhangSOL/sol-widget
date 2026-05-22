// backend/src/payments/routes.ts
//
// Sol v3 (12-05-2026) — Pricing:
//   KIỂM SOÁT (KHOI_DONG): 99.000đ × 14 ngày
//   LÀM CHỦ   (DONG_HANH): 199.000đ × 30 ngày  ← UPDATED từ 99k
//   Total: 99 + 199 = 298k = đúng 1 tháng tiền thuốc (10k/ngày × 30)
//   Day 52+ → ALUMNI tự động miễn phí mãi (không còn maintenance window).
//
// Mock-mode hôm nay: tạo PaymentLog → "PAID" ngay → cập nhật User.tier.
// Khi tích hợp MoMo/VietQR thật:
//   1. POST /payments/checkout vẫn tạo PaymentLog status=PENDING
//   2. Trả về URL redirect / QR để user thanh toán
//   3. Webhook /payments/webhook/:provider nhận callback → set PAID + upgrade
//   4. Endpoint /payments/:id/status để widget poll trong lúc chờ
//
// Hiện tại endpoint POST /payments/checkout tự "PAID" luôn để dev/demo.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import {
  TIER_PRICE_VND,
  TIER_DURATION_DAYS,
  // MAINTENANCE_DAYS deprecated trong Sol v3 — không import nữa
} from '../tiers/featureGates';
import { assertChecklistComplete } from '../tiers/qDayChecklist';

export const paymentsRouter = Router();
paymentsRouter.use(authMiddleware);

// ─── Day 5 (2026-05-21): VietQR intent endpoint ────────────────────────────
// Business model mới (chốt 21/5 sáng):
//   5.000đ/ngày × 28/45/58 paid days theo cohort LIGHT/MODERATE/HEAVY
//   = 140k / 225k / 290k trọn gói
//   Alternative: 35.000đ/tuần (góp phí theo tuần sau 7 ngày free)
//
// Flow:
//   1. User chọn gói + paymentMode (full | weekly) ở /pricing
//   2. POST /payments/vietqr/intent tạo PaymentLog status=PENDING
//   3. Return VietQR URL + bank info + nội dung CK "SOL <userId-short>"
//   4. User quét QR → chuyển khoản tay
//   5. Admin (Khang) confirm bằng tay qua admin panel → status=PAID + extend tier

const VIETQR_BANK_BIN = process.env.VIETQR_BANK_BIN || '970422'; // MB Bank default
const VIETQR_ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || '00000000';
const VIETQR_ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || 'HKD SOL VIETNAM';
const VIETQR_TEMPLATE = process.env.VIETQR_TEMPLATE || 'compact2';

const BANK_NAMES: Record<string, string> = {
  '970422': 'MB Bank',
  '970436': 'Vietcombank',
  '970418': 'BIDV',
  '970423': 'TPBank',
  '970407': 'Techcombank',
  '970432': 'VPBank',
  '970415': 'VietinBank',
  '970405': 'Agribank',
};

const COHORT_PRICING: Record<'LIGHT' | 'MODERATE' | 'HEAVY', {
  totalDays: number; paidDays: number; totalPrice: number; weeklyRate: number;
}> = {
  LIGHT:    { totalDays: 35, paidDays: 28, totalPrice: 140000, weeklyRate: 35000 },
  MODERATE: { totalDays: 52, paidDays: 45, totalPrice: 225000, weeklyRate: 35000 },
  HEAVY:    { totalDays: 65, paidDays: 58, totalPrice: 290000, weeklyRate: 35000 },
};

const vietqrIntentSchema = z.object({
  cohort: z.enum(['LIGHT', 'MODERATE', 'HEAVY']),
  paymentMode: z.enum(['full', 'weekly']).default('full'),
});

paymentsRouter.post('/vietqr/intent', async (req: AuthedRequest, res) => {
  try {
    const parsed = vietqrIntentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
    }
    const { cohort, paymentMode } = parsed.data;
    const pricing = COHORT_PRICING[cohort];
    const amountVnd = paymentMode === 'full' ? pricing.totalPrice : pricing.weeklyRate;

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, name: true, pronouns: true, settings: true },
    });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    // Mã CK: SOL + 8 ký tự cuối userId (không space để bank parse dễ)
    const userIdShort = user.id.slice(-8).toUpperCase();
    const addInfo = `SOL${userIdShort}`;

    // Tạo PaymentLog status PENDING — admin confirm sau qua admin panel
    // Reuse field cũ: targetTier=DONG_HANH placeholder (tier-cohort migration sau);
    // metadata lưu cohort+paymentMode để admin biết.
    const payment = await prisma.paymentLog.create({
      data: {
        userId: user.id,
        targetTier: 'DONG_HANH',
        amountVnd,
        provider: 'VIETQR',
        status: 'PENDING',
        metadata: {
          cohort,
          paymentMode,
          totalDays: paymentMode === 'full' ? pricing.totalDays : 7,
          paidDays: paymentMode === 'full' ? pricing.paidDays : 7,
          ip: req.ip,
          userAgent: req.headers['user-agent'] ?? null,
          addInfo,
        },
      },
    });

    // VietQR URL — img.vietqr.io public endpoint, không cần API key
    const qrUrl = `https://img.vietqr.io/image/${VIETQR_BANK_BIN}-${VIETQR_ACCOUNT_NO}-${VIETQR_TEMPLATE}.png?amount=${amountVnd}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(VIETQR_ACCOUNT_NAME)}`;

    return res.json({
      ok: true,
      paymentId: payment.id,
      qrUrl,
      amount: amountVnd,
      content: addInfo,
      bank: {
        name: BANK_NAMES[VIETQR_BANK_BIN] || 'Bank',
        bin: VIETQR_BANK_BIN,
        accountNumber: VIETQR_ACCOUNT_NO,
        accountName: VIETQR_ACCOUNT_NAME,
      },
      pricing: {
        cohort,
        paymentMode,
        totalDays: paymentMode === 'full' ? pricing.totalDays : 7,
        paidDays: paymentMode === 'full' ? pricing.paidDays : 7,
        dailyRate: 5000,
      },
      instructions: [
        `Mở app ngân hàng → Quét QR.`,
        `Kiểm tra: ${VIETQR_ACCOUNT_NAME} · STK ${VIETQR_ACCOUNT_NO}.`,
        `Số tiền: ${amountVnd.toLocaleString('vi-VN')}đ. Nội dung: ${addInfo}.`,
        `Sau khi CK xong, Khang sẽ confirm trong vòng 24h và mở tier cho ${user.pronouns ?? 'anh'}.`,
      ],
    });
  } catch (e: any) {
    console.error('[payments/vietqr/intent] error:', e);
    return res.status(500).json({ error: 'vietqr_intent_error', message: e?.message });
  }
});

const checkoutSchema = z.object({
  targetTier: z.enum(['KHOI_DONG', 'DONG_HANH']),
  // 'mock' (default), 'momo', 'vietqr', 'bank_transfer'
  provider: z.enum(['mock', 'momo', 'vietqr', 'bank_transfer']).optional(),
});

paymentsRouter.post('/checkout', async (req: AuthedRequest, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.format() });
  }
  const { targetTier } = parsed.data;
  const provider = (parsed.data.provider ?? 'mock').toUpperCase() as
    | 'MOCK' | 'MOMO' | 'VIETQR' | 'BANK_TRANSFER';

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  // Không cho downgrade qua endpoint này
  if (user.tier === 'DONG_HANH' && targetTier === 'KHOI_DONG') {
    return res.status(400).json({ error: 'cannot_downgrade' });
  }

  // Gate Q-Day checklist — chỉ áp dụng khi user lần đầu mua (chưa có quitDate).
  // User upgrade từ KHOI_DONG → DONG_HANH coi như đã đi qua checklist rồi.
  if (!user.quitDate) {
    try {
      await assertChecklistComplete(req.userId!, targetTier);
    } catch (err: any) {
      if (err?.statusCode === 412 && err?.payload) {
        return res.status(412).json(err.payload);
      }
      throw err;
    }
  }

  const amountVnd = TIER_PRICE_VND[targetTier];

  // Tạo log
  const payment = await prisma.paymentLog.create({
    data: {
      userId: user.id,
      targetTier,
      amountVnd,
      provider,
      status: provider === 'MOCK' ? 'PAID' : 'PENDING',
      paidAt: provider === 'MOCK' ? new Date() : null,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
    },
  });

  if (provider === 'MOCK') {
    // Upgrade user ngay
    await applyTierUpgrade(user.id, targetTier);
    return res.json({
      ok: true,
      payment,
      mock: true,
      message: 'Thanh toán mock — gói đã kích hoạt ngay.',
    });
  }

  // Provider thật: trả về thông tin để FE redirect / show QR
  return res.json({
    ok: true,
    payment,
    nextStep: 'pending_external_provider',
    // Khi tích hợp: thêm payUrl / qrCodeUrl ở đây
  });
});

paymentsRouter.get('/me', async (req: AuthedRequest, res) => {
  const items = await prisma.paymentLog.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ items });
});

paymentsRouter.get('/:id', async (req: AuthedRequest, res) => {
  const item = await prisma.paymentLog.findUnique({
    where: { id: req.params.id },
  });
  if (!item || item.userId !== req.userId) {
    return res.status(404).json({ error: 'not_found' });
  }
  res.json(item);
});

/* ─────────── Helpers (export để admin cũng dùng) ─────────── */

/**
 * Áp dụng upgrade tier vào user record. Cập nhật tierStartedAt, tierExpiresAt.
 * Sol v3: KHÔNG còn set maintenanceUntil — hết DONG_HANH thì scheduler tự
 * promote thành ALUMNI miễn phí mãi (Day 52+).
 *
 * Cũng set quitDate nếu lần đầu KHOI_DONG (Q-Day Day 22 trong Sol v3 = ngày
 * bắt đầu LÀM CHỦ; ở đây quitDate là ngày bắt đầu Sol journey, không phải
 * Q-Day Ceremony).
 */
export async function applyTierUpgrade(
  userId: string,
  targetTier: 'KHOI_DONG' | 'DONG_HANH',
) {
  const now = new Date();
  const durationDays = TIER_DURATION_DAYS[targetTier];
  const expiresAt = new Date(now.getTime() + durationDays * 86_400_000);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { quitDate: true, tier: true, tierStartedAt: true, cohortKey: true },
  });
  if (!user) return;

  const updateData: any = {
    tier: targetTier,
    tierExpiresAt: expiresAt,
    // Sol v3: maintenanceUntil không còn dùng — set null để stop logic check sai.
    maintenanceUntil: null,
  };

  // KHOI_DONG (Kiểm Soát 14 ngày): set tierStartedAt = now, quitDate = now nếu chưa có
  if (targetTier === 'KHOI_DONG') {
    updateData.tierStartedAt = now;
    if (!user.quitDate) {
      updateData.quitDate = now;
      updateData.cohortKey = cohortKeyOf(now);
    }
  }

  // DONG_HANH (Làm Chủ 30 ngày): giữ tierStartedAt cũ nếu là upgrade từ KHOI_DONG
  if (targetTier === 'DONG_HANH') {
    if (user.tier === 'FREE') {
      // Trường hợp hiếm: mua thẳng DONG_HANH không qua KHOI_DONG
      updateData.tierStartedAt = now;
      if (!user.quitDate) {
        updateData.quitDate = now;
        updateData.cohortKey = cohortKeyOf(now);
      }
    }
    // Sol v3: KHÔNG còn maintenance window — Day 52+ → ALUMNI tự động.
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Đảm bảo cohort tồn tại
  const ck = updateData.cohortKey ?? user.cohortKey;
  if (ck) {
    await ensureCohort(ck);
  }
}

export function cohortKeyOf(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function ensureCohort(key: string) {
  const existing = await prisma.cohort.findUnique({ where: { key } });
  if (existing) return existing;
  const [yStr, mStr] = key.split('-');
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  const startDate = new Date(Date.UTC(y, m, 1));
  const endDate = new Date(Date.UTC(y, m + 1, 0));
  return prisma.cohort.create({
    data: {
      key,
      label: `Tháng ${m + 1}/${y}`,
      startDate,
      endDate,
    },
  });
}
