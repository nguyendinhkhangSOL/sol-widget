// backend/src/zalo/qdayPrepReminder.ts
//
// Sprint 4 — Cron T-7 reminder: nhắc user enrolled chưa confirm checklist
// đọc bài + tick 3 mục bắt buộc.
//
// Mục đích: User đã enroll Phase 5 (52 ScheduledPush tạo) nhưng chưa hoàn
// thành checklist (qDayConfirmedAt = NULL). Cron mỗi ngày 19:00 push reminder
// qua Zalo OA với template SOL_QDAY_PREP_REMINDER.
//
// Trigger condition:
//   - journeyStatus = 'active'
//   - qDayConfirmedAt IS NULL  (chưa confirm checklist)
//   - qDayDate within next 7 days (T-7 → T-1)
//   - zaloUserId IS NOT NULL (có Zalo)
//   - Không push lại nếu đã push trong 24h qua
//
// Cron: 19:00 mỗi ngày (sau giờ làm để user có thời gian đọc).

import { prisma } from '../db';
import { logger } from '../utils/logger';
import { znsSendTemplate } from './oaClient';

const TEMPLATE_CODE = 'SOL_QDAY_PREP_REMINDER';

export async function firePrepReminders(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const result = { scanned: 0, sent: 0, skipped: 0, failed: 0 };

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Tìm user enrolled but chưa confirm checklist
  const eligibleUsers = await prisma.user.findMany({
    where: {
      journeyStatus: 'active',
      qDayConfirmedAt: null,
      qDayDate: { gte: new Date(), lte: sevenDaysFromNow },
      zaloUserId: { not: null },
      phone: { not: null },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      qDayDate: true,
      pronouns: true,
    },
    take: 200,
  });

  result.scanned = eligibleUsers.length;
  if (eligibleUsers.length === 0) {
    logger.debug('No users eligible for prep reminder');
    return result;
  }

  // 2. Lookup template
  const template = await prisma.zaloTemplate.findUnique({
    where: { code: TEMPLATE_CODE },
    select: { zaloTemplateId: true, status: true },
  });
  if (!template?.zaloTemplateId || template.status !== 'APPROVED') {
    logger.warn(
      { templateCode: TEMPLATE_CODE, status: template?.status },
      'Prep reminder template chưa APPROVED — skip batch',
    );
    return result;
  }

  // 3. Process từng user
  for (const u of eligibleUsers) {
    if (!u.phone || !u.qDayDate) {
      result.skipped++;
      continue;
    }

    // Đã push trong 24h qua → skip
    const recentLog = await prisma.zNSLog.findFirst({
      where: {
        userId: u.id,
        templateCode: TEMPLATE_CODE,
        sentAt: { gte: oneDayAgo },
      },
      select: { id: true },
    });
    if (recentLog) {
      result.skipped++;
      continue;
    }

    const daysLeft = Math.ceil(
      (u.qDayDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const qDayStr = u.qDayDate.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const sendResult = await znsSendTemplate({
      phone: u.phone,
      templateId: template.zaloTemplateId,
      templateData: {
        name: u.name ?? u.pronouns ?? 'anh',
        days_left: String(daysLeft),
        qday_date: qDayStr,
      },
      trackingId: `prep-reminder-${u.id}-${Date.now()}`,
    });

    if (sendResult.ok) {
      await prisma.zNSLog.create({
        data: {
          userId: u.id,
          templateCode: TEMPLATE_CODE,
          zaloTemplateId: template.zaloTemplateId,
          params: { days_left: daysLeft, qday_date: qDayStr },
          status: 'SENT',
          sentAt: new Date(),
        },
      });
      result.sent++;
    } else {
      logger.warn(
        { userId: u.id, error: sendResult.error },
        'Prep reminder send failed',
      );
      result.failed++;
    }
  }

  logger.info(result, 'firePrepReminders done');
  return result;
}
