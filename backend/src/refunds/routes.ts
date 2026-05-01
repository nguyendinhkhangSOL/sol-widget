// backend/src/refunds/routes.ts
//
// User flow:
//   POST /refunds/request { reason } → tạo RefundRequest cho payment
//                                       DONG_HANH gần nhất, status REQUESTED.
//
// Admin xử lý qua /admin/refunds (xem admin/routes.ts).

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import { computeTierState } from '../tiers/featureGates';

export const refundsRouter = Router();
refundsRouter.use(authMiddleware);

const requestSchema = z.object({
  reason: z.string().max(2000).optional(),
});

refundsRouter.post('/request', async (req: AuthedRequest, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      tier: true,
      tierStartedAt: true,
      tierExpiresAt: true,
      maintenanceUntil: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const state = computeTierState(user);
  if (!state.canRequestRefund) {
    return res.status(400).json({
      error: 'not_eligible',
      reason:
        user.tier !== 'DONG_HANH'
          ? 'only_dong_hanh_refundable'
          : state.daysIntoTier !== null && state.daysIntoTier < 15
            ? 'too_early'
            : 'too_late',
      tierState: state,
    });
  }

  // Tìm payment DONG_HANH gần nhất chưa hoàn
  const payment = await prisma.paymentLog.findFirst({
    where: {
      userId: req.userId!,
      targetTier: 'DONG_HANH',
      status: 'PAID',
      refund: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!payment) {
    return res.status(404).json({ error: 'no_eligible_payment' });
  }

  const created = await prisma.refundRequest.create({
    data: {
      userId: req.userId!,
      paymentId: payment.id,
      daysUsed: state.daysIntoTier ?? 0,
      amountVnd: state.refundAmountVnd,
      reason: parsed.data.reason,
      status: 'REQUESTED',
    },
  });

  res.json({ ok: true, refund: created });
});

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
