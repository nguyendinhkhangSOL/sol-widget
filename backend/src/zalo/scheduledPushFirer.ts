// backend/src/zalo/scheduledPushFirer.ts
//
// Cron fire ScheduledPush — chạy mỗi 5 phút trong worker.ts.
//
// Logic:
//   1. Query ScheduledPush WHERE scheduledAt <= now() AND status='pending' LIMIT 50
//   2. Lock từng record (status='sending') trước khi gửi
//   3. Load user phone (Zalo OA flow dùng phone E.164)
//   4. Load ZaloTemplate theo templateCode → lấy zaloTemplateId
//   5. Gửi qua znsSendTemplate()
//   6. Update status='sent'/'failed' + ghi ZNSLog
//   7. Retry với exponential backoff nếu fail (max 3 lần)

import { prisma } from '../db';
import { logger } from '../utils/logger';
import { znsSendTemplate } from './oaClient';

const BATCH_SIZE = 50;
const MAX_RETRY = 3;

interface FireResult {
  scanned: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{ pushId: string; reason: string }>;
}

/**
 * Fire pending ScheduledPush due now. Called by cron every 5 minutes.
 */
export async function fireDuePushes(): Promise<FireResult> {
  const result: FireResult = { scanned: 0, sent: 0, failed: 0, skipped: 0, errors: [] };

  // 1. Query due pending
  const duePushes = await prisma.scheduledPush.findMany({
    where: {
      scheduledAt: { lte: new Date() },
      status: 'pending',
      retryCount: { lt: MAX_RETRY },
    },
    take: BATCH_SIZE,
    orderBy: { scheduledAt: 'asc' },
    include: {
      user: {
        select: {
          id: true, phone: true, name: true, journeyStatus: true,
          messagingProfile: { select: { muteUntil: true } },
        },
      },
    },
  });

  result.scanned = duePushes.length;
  if (duePushes.length === 0) return result;

  logger.info({ batch: duePushes.length }, 'fireDuePushes: scanning batch');

  // 2. Process từng push
  for (const push of duePushes) {
    // Skip if user paused/graduated
    if (push.user.journeyStatus !== 'active') {
      await prisma.scheduledPush.update({
        where: { id: push.id },
        data: { status: 'cancelled', errorMessage: `journeyStatus=${push.user.journeyStatus}` },
      });
      result.skipped++;
      continue;
    }

    // Skip if user mute period active
    if (push.user.messagingProfile?.muteUntil && push.user.messagingProfile.muteUntil > new Date()) {
      await prisma.scheduledPush.update({
        where: { id: push.id },
        data: { status: 'cancelled', errorMessage: 'user_muted' },
      });
      result.skipped++;
      continue;
    }

    // Need phone for ZNS
    if (!push.user.phone) {
      await prisma.scheduledPush.update({
        where: { id: push.id },
        data: { status: 'failed', errorMessage: 'no_phone', errorCode: 'NO_PHONE' },
      });
      result.failed++;
      result.errors.push({ pushId: push.id, reason: 'no_phone' });
      continue;
    }

    // Lock as sending
    await prisma.scheduledPush.update({
      where: { id: push.id },
      data: { status: 'sending' },
    });

    // 3. Lookup template
    const template = await prisma.zaloTemplate.findUnique({
      where: { code: push.templateCode },
      select: { zaloTemplateId: true, status: true, code: true },
    });

    if (!template?.zaloTemplateId || template.status !== 'APPROVED') {
      await prisma.scheduledPush.update({
        where: { id: push.id },
        data: {
          status: 'failed',
          errorMessage: `template ${push.templateCode} not approved (status=${template?.status ?? 'NOT_FOUND'})`,
          errorCode: 'TEMPLATE_NOT_APPROVED',
        },
      });
      result.failed++;
      result.errors.push({ pushId: push.id, reason: `template_not_approved:${push.templateCode}` });
      continue;
    }

    // 4. Send ZNS
    const sendResult = await znsSendTemplate({
      phone: push.user.phone,
      templateId: template.zaloTemplateId,
      templateData: push.templateParams as Record<string, string | number>,
      trackingId: `sched-${push.id}`,
    });

    if (sendResult.ok) {
      // 5a. Success — log ZNSLog + update push
      const znsLog = await prisma.zNSLog.create({
        data: {
          userId: push.userId,
          templateCode: push.templateCode,
          zaloTemplateId: template.zaloTemplateId,
          params: push.templateParams as any,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      await prisma.scheduledPush.update({
        where: { id: push.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          znsLogId: znsLog.id,
        },
      });

      // Update messaging profile counters
      await prisma.userMessagingProfile.upsert({
        where: { userId: push.userId },
        create: { userId: push.userId, totalSent: 1, lastInteractAt: new Date() },
        update: { totalSent: { increment: 1 }, lastInteractAt: new Date() },
      });

      result.sent++;
    } else {
      // 5b. Failed — increment retry, reschedule
      const newRetryCount = push.retryCount + 1;
      const willRetry = newRetryCount < MAX_RETRY;
      const backoffMs = Math.pow(2, newRetryCount) * 60 * 1000; // 2, 4, 8 phút

      await prisma.scheduledPush.update({
        where: { id: push.id },
        data: {
          status: willRetry ? 'pending' : 'failed',
          retryCount: newRetryCount,
          errorMessage: sendResult.error ?? 'unknown',
          errorCode: 'ZNS_API_FAIL',
          scheduledAt: willRetry ? new Date(Date.now() + backoffMs) : push.scheduledAt,
        },
      });

      result.failed++;
      result.errors.push({ pushId: push.id, reason: sendResult.error ?? 'unknown' });
    }
  }

  logger.info(result, 'fireDuePushes: batch done');
  return result;
}

/**
 * Expire stale pending pushes (scheduled > 7 days ago, never fired).
 * Run daily — cleanup.
 */
export async function expireStaleScheduledPushes(): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.scheduledPush.updateMany({
    where: {
      scheduledAt: { lt: cutoff },
      status: 'pending',
    },
    data: { status: 'expired', errorMessage: 'expired_after_7d' },
  });
  if (result.count > 0) {
    logger.info({ count: result.count }, 'Expired stale scheduled pushes');
  }
  return result.count;
}
