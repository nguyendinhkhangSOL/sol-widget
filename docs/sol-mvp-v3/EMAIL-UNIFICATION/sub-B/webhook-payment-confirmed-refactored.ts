/**
 * Sub-B / File 3 of 4 — Webhook /api/payment/webhook (REFACTORED)
 *
 * Trigger khi ngân hàng confirm payment (Sepay/VietQR webhook).
 *
 * Vấn đề cũ:
 *   - Chỉ UPDATE leads.payment_status = PAID
 *   - Không auto-upgrade user tier
 *   - Không gửi activation email cho shell user
 *
 * Fix:
 *   - Transaction: UPDATE lead + UPDATE user tier + UPDATE active_lead_id
 *   - Nếu user có magic_token → gửi activation email
 *   - Nếu user đã có password → gửi welcome/upgrade email
 *
 * Integration:
 *   Đè lên file backend/src/payments/routes.ts function handleWebhook
 */

import { Request, Response } from 'express';
import { addMonths } from 'date-fns';
import { prisma } from '../db';
import { sendEmail } from '../email/sender';
import { logger } from '../utils/logger';

interface WebhookPayload {
  // Structure phụ thuộc Sepay/bank
  transaction: {
    id: string;
    amount: number;
    description: string; // "SOL123" format
    timestamp: string;
  };
}

export async function handlePaymentWebhook(req: Request, res: Response) {
  const payload = req.body as WebhookPayload;

  // ─── Parse leadId từ description ────────
  const match = payload.transaction?.description?.match(/SOL(\d+)/i);
  if (!match) {
    logger.warn('[webhook] Không parse được leadId từ description', payload);
    return res.status(200).json({ ok: false, reason: 'no_lead_id' });
  }
  const leadId = parseInt(match[1], 10);

  // ─── Find lead ────────
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  if (!lead) {
    logger.warn(`[webhook] Lead ${leadId} not found`);
    return res.status(200).json({ ok: false, reason: 'lead_not_found' });
  }

  if (lead.paymentStatus !== 'PENDING') {
    logger.info(`[webhook] Lead ${leadId} already ${lead.paymentStatus} — skip`);
    return res.status(200).json({ ok: true, reason: 'already_processed' });
  }

  // ─── Validate amount ────────
  if (payload.transaction.amount < lead.amount) {
    logger.warn(
      `[webhook] Amount mismatch lead ${leadId}: expected ${lead.amount}, got ${payload.transaction.amount}`
    );
    return res.status(200).json({ ok: false, reason: 'amount_mismatch' });
  }

  const now = new Date();
  const tier12MonthsFromNow = addMonths(now, 12);

  // ─── ⭐ Transaction: update lead + upgrade user tier ────────
  await prisma.$transaction(async (tx) => {
    // Update lead
    await tx.lead.update({
      where: { id: leadId },
      data: {
        paymentStatus: 'ACTIVATED',
        activatedAt: now,
        expiresAt:
          lead.goi === 'FOUNDER'
            ? null // FOUNDER lifetime, không expire
            : tier12MonthsFromNow,
      },
    });

    // Upgrade user tier
    await tx.user.update({
      where: { id: lead.userId! },
      data: {
        tier: lead.goi as any,
        tierStartedAt: now,
        tierExpiresAt: lead.goi === 'FOUNDER' ? null : tier12MonthsFromNow,
        activeLeadId: leadId,
        // Nếu user chưa có source (shell user cũ) → set thanhtoan
        source: lead.user!.source === 'unknown' ? 'thanhtoan' : lead.user!.source,
        // Nếu status = pending_activation → giữ nguyên (chờ set password qua magic link)
      },
    });

    logger.info(
      `[webhook] Lead ${leadId} ACTIVATED. User ${lead.userId} tier upgraded to ${lead.goi}`
    );
  });

  // ─── ⭐ Gửi email tương ứng ────────
  const user = lead.user!;

  if (lead.magicToken && !user.passwordHash) {
    // Pay-first flow — gửi activation link
    const activationUrl = `https://huongdi.sol.vn/kich-hoat?token=${lead.magicToken}`;
    await sendEmail({
      to: user.email!,
      subject: `🎉 Chúc mừng! Kích hoạt Sol La Bàn ${lead.goi} — Đặt mật khẩu`,
      template: 'ACTIVATION_MAGIC_LINK',
      data: {
        name: user.displayName || 'Bạn',
        goi: lead.goi,
        amount: lead.amount,
        activationUrl,
        expiresIn: '7 ngày',
      },
    });
    logger.info(`[webhook] Sent activation email to ${user.email}`);
  } else {
    // Existing user upgrade — gửi confirm email
    await sendEmail({
      to: user.email!,
      subject: `✅ Sol La Bàn ${lead.goi} đã kích hoạt`,
      template: 'UPGRADE_SUCCESS',
      data: {
        name: user.displayName || 'Bạn',
        goi: lead.goi,
        amount: lead.amount,
        tierExpiresAt: tier12MonthsFromNow,
        dashboardUrl: 'https://huongdi.sol.vn/toi/',
      },
    });
    logger.info(`[webhook] Sent upgrade success email to ${user.email}`);
  }

  // ─── ⭐ Notification cho admin (optional) ────────
  await prisma.leadNotification.create({
    data: {
      leadId: leadId,
      type: 'PAYMENT_CONFIRMED',
      recipient: 'admin',
      status: 'SENT',
      metadata: {
        amount: lead.amount,
        goi: lead.goi,
        userId: lead.userId,
      },
    },
  }).catch(() => {}); // Silent fail — không critical

  return res.status(200).json({ ok: true, leadId, action: 'activated' });
}
