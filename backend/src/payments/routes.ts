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
