// tests/helpers.ts
// Helpers cho test — tạo user, gen token, clean DB giữa các test.

import { prisma } from '../src/db';
import { signToken } from '../src/auth/middleware';
import { getChecklistConfig } from '../src/tiers/qDayChecklist';

let userCounter = 0;

/**
 * Tạo 1 user test với phone unique. Trả về user + JWT token.
 */
export async function createTestUser(opts: {
  isAdmin?: boolean;
  tier?: 'FREE' | 'KHOI_DONG' | 'DONG_HANH' | 'ALUMNI';
  tierStartedAt?: Date;
  tierExpiresAt?: Date;
  maintenanceUntil?: Date;
  yearsSmoked?: number;
  quitDate?: Date;
  /** Hoàn thành checklist tự động */
  completeChecklist?: boolean;
} = {}) {
  userCounter++;
  const phone = `+8490000${String(userCounter).padStart(4, '0')}`;
  const settings: any = {};

  if (opts.completeChecklist) {
    const cfg = await getChecklistConfig();
    const checks: Record<string, string> = {};
    const now = new Date().toISOString();
    for (const item of cfg.items) {
      if (item.required) checks[item.id] = now;
    }
    settings.qDayChecklist = checks;
  }

  const user = await prisma.user.create({
    data: {
      phone,
      name: `Test User ${userCounter}`,
      pronouns: 'anh',
      isAdmin: opts.isAdmin ?? false,
      tier: (opts.tier ?? 'FREE') as any,
      tierStartedAt: opts.tierStartedAt ?? null,
      tierExpiresAt: opts.tierExpiresAt ?? null,
      maintenanceUntil: opts.maintenanceUntil ?? null,
      yearsSmoked: opts.yearsSmoked ?? null,
      quitDate: opts.quitDate ?? null,
      settings,
    },
  });

  const token = signToken(user.id);
  return { user, token };
}

/**
 * Auth header cho supertest requests.
 */
export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Xoá toàn bộ DB test giữa các test file. Dùng trong beforeEach hoặc afterAll.
 * Thứ tự xoá theo FK dependency để tránh constraint error.
 */
export async function cleanDb() {
  // Tắt FK check tạm thời rồi truncate — nhanh hơn delete từng table
  // theo thứ tự nhưng cần Postgres extension. Simple approach: delete có thứ tự.
  await prisma.voiceDelivery.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.paymentLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.exerciseEntry.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.crisisEvent.deleteMany();
  await prisma.userState.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.voiceMessage.deleteMany();
  // Giữ lại: AppSetting, ContentItem, CannedReply (config-level)
}
