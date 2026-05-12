// backend/src/refunds/routes.ts
//
// PIVOT 2026-05-08 — refund "không hỏi gì":
//   Sol Start (KHOI_DONG, 99k one-time): refund trong 14 ngày → trả 99k
//   Sol Control (DONG_HANH, 99k/tháng): refund tháng đầu → trả 99k
//   Reason: optional (anh có thể không cần kể lý do)
//
// Endpoints:
//   POST /refunds/request          — submit refund (auto eligibility check)
//   GET  /refunds/eligibility      — check user có đủ điều kiện refund không
//   GET  /refunds/me               — list refund history
//   POST /refunds/:id/cancel       — user huỷ pending refund
//
// Admin xử lý qua /admin/refunds (xem admin/routes.ts).

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import type { UserTier } from '@prisma/client';

export const refundsRouter = Router();
refundsRouter.use(authMiddleware);

// ─── Refund window theo tier (Sol v3 — 12-05-2026) ────────────────────
// Sol v3 pricing:
//   KHOI_DONG (Kiểm Soát) — 99.000đ cho 14 ngày
//   DONG_HANH (Làm Chủ)   — 199.000đ cho 30 ngày (Day 22-51, Q-Day Day 22)
// Refund conditional theo lộ trình ≥80% metric — xem checkRefundEligibility()
const REFUND_WINDOW_DAYS: Partial<Record<UserTier, number>> = {
  KHOI_DONG: 14, // Kiểm Soát — full refund window Day 21 không hỏi
  DONG_HANH: 14, // Làm Chủ — refund window 14 days (Day 22-35);
                 // sau đó pro-rated: (30 - daysUsed) / 30 × 199k
};

const REFUND_AMOUNT_VND: Partial<Record<UserTier, number>> = {
  KHOI_DONG: 99000,   // 99k cho 14 ngày Kiểm Soát
  DONG_HANH: 199000,  // 199k cho 30 ngày Làm Chủ (UPDATED Sol v3)
};

function checkEligibility(payment: {
  targetTier: UserTier;
  paidAt: Date | null;
  createdAt: Date;
}): { eligible: boolean; reason?: string; windowEndsAt?: Date; amountVnd?: number } {
  const window = REFUND_WINDOW_DAYS[payment.targetTier];
  if (!window) {
    return { eligible: false, reason: 'tier_not_refundable' };
  }

  const paidAt = payment.paidAt ?? payment.createdAt;
  const windowEndsAt = new Date(paidAt.getTime() + window * 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now > windowEndsAt) {
    return {
      eligible: false,
      reason: 'window_expired',
      windowEndsAt,
    };
  }

  return {
    eligible: true,
    windowEndsAt,
    amountVnd: REFUND_AMOUNT_VND[payment.targetTier],
  };
}

// ─── Check eligibility (frontend hiển thị nút Hoàn tiền có active không) ─
refundsRouter.get('/eligibility', async (req: AuthedRequest, res) => {
  const payment = await prisma.paymentLog.findFirst({
    where: {
      userId: req.userId!,
      targetTier: { in: ['KHOI_DONG', 'DONG_HANH'] },
      status: 'PAID',
      refund: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!payment) {
    return res.json({ eligible: false, reason: 'no_eligible_payment' });
  }

  const elig = checkEligibility(payment);
  res.json({
    ...elig,
    paymentId: payment.id,
    targetTier: payment.targetTier,
    paidAt: payment.paidAt ?? payment.createdAt,
  });
});

// ─── Request refund (no-questions, reason optional) ─────────────────────
const requestSchema = z.object({
  reason: z.string().max(2000).optional(),
});

refundsRouter.post('/request', async (req: AuthedRequest, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const payment = await prisma.paymentLog.findFirst({
    where: {
      userId: req.userId!,
      targetTier: { in: ['KHOI_DONG', 'DONG_HANH'] },
      status: 'PAID',
      refund: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!payment) {
    return res.status(404).json({ error: 'no_eligible_payment' });
  }

  const elig = checkEligibility(payment);
  if (!elig.eligible) {
    return res.status(400).json({
      error: 'not_eligible',
      reason: elig.reason,
      windowEndsAt: elig.windowEndsAt,
    });
  }

  const paidAt = payment.paidAt ?? payment.createdAt;
  const daysUsed = Math.floor((Date.now() - paidAt.getTime()) / (24 * 60 * 60 * 1000));

  const created = await prisma.refundRequest.create({
    data: {
      userId: req.userId!,
      paymentId: payment.id,
      daysUsed,
      amountVnd: elig.amountVnd!,
      reason: parsed.data.reason ?? '(không hỏi)',
      status: 'REQUESTED',
    },
  });

  res.json({
    ok: true,
    refund: created,
    message:
      'Sol đã nhận yêu cầu. Trong 7 ngày, ' +
      elig.amountVnd!.toLocaleString('vi-VN') +
      'đ sẽ về tài khoản anh. Không hỏi gì thêm.',
  });
});

// ─── User xem refund history ────────────────────────────────────────────
refundsRouter.get('/me', async (req: AuthedRequest, res) => {
  const items = await prisma.refundRequest.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ items });
});

/** User huỷ refund khi đang REQUESTED (đổi ý). */
refundsRouter.post('/:id/cancel', async (req: AuthedRequest, res) => {
  const refund = await prisma.refundRequest.findUnique({
    where: { id: req.params.id },
  });
  if (!refund || refund.userId !== req.userId) {
    return res.status(404).json({ error: 'not_found' });
  }
  if (refund.status !== 'REQUESTED') {
    return res.status(400).json({ error: 'cannot_cancel', status: refund.status });
  }
  await prisma.refundRequest.update({
    where: { id: refund.id },
    data: { status: 'DENIED', adminNote: 'User cancelled' },
  });
  res.json({ ok: true });
});
