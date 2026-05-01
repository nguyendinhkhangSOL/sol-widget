// tests/refunds.test.ts
//
// Test 2 — Refund eligibility + tính tiền hoàn.
// Verify:
//   - Chỉ DONG_HANH được hoàn tiền
//   - Trước Ngày 15: refuse (too_early)
//   - Sau hết hạn gói: refuse (too_late)
//   - Trong cửa sổ: tính đúng số tiền theo công thức
//     refund = floor((30 - daysUsed) / 20 × 100k / 1000) × 1000

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/db';
import { createTestUser, bearer, cleanDb } from './helpers';

/** Tạo user DONG_HANH với daysUsed cụ thể + payment PAID. */
async function createDongHanhUser(daysUsed: number) {
  const tierStartedAt = new Date(Date.now() - daysUsed * 86_400_000);
  const tierExpiresAt = new Date(tierStartedAt.getTime() + 30 * 86_400_000);
  const maintenanceUntil = new Date(tierExpiresAt.getTime() + 30 * 86_400_000);

  const { user, token } = await createTestUser({
    tier: 'DONG_HANH',
    quitDate: tierStartedAt,
    tierStartedAt,
    tierExpiresAt,
    maintenanceUntil,
  });

  // Tạo PaymentLog để link với refund
  await prisma.paymentLog.create({
    data: {
      userId: user.id,
      targetTier: 'DONG_HANH',
      amountVnd: 199_000,
      provider: 'MOCK',
      status: 'PAID',
      paidAt: tierStartedAt,
    },
  });

  return { user, token };
}

describe('POST /refunds/request', () => {
  beforeEach(cleanDb);
  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('Reject FREE user (only_dong_hanh_refundable)', async () => {
    const { token } = await createTestUser({ tier: 'FREE' });
    const res = await request(app)
      .post('/refunds/request')
      .set(bearer(token))
      .send({ reason: 'change my mind' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('not_eligible');
    expect(res.body.reason).toBe('only_dong_hanh_refundable');
  });

  it('Reject DONG_HANH user ở Ngày 10 (too_early — chưa đến Ngày 15)', async () => {
    const { token } = await createDongHanhUser(10);
    const res = await request(app)
      .post('/refunds/request')
      .set(bearer(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.reason).toBe('too_early');
  });

  it('Approve DONG_HANH user ở Ngày 15 — refund = (30-15)/20 × 100k = 75k', async () => {
    const { token } = await createDongHanhUser(15);
    const res = await request(app)
      .post('/refunds/request')
      .set(bearer(token))
      .send({ reason: 'tài chính khó khăn' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.refund.daysUsed).toBe(15);
    // 15 days used → 15 ngày còn lại → 15/20 * 100000 = 75000
    expect(res.body.refund.amountVnd).toBe(75_000);
    expect(res.body.refund.status).toBe('REQUESTED');
    expect(res.body.refund.reason).toBe('tài chính khó khăn');
  });

  it('Approve ở Ngày 25 — refund = 5/20 × 100k = 25k', async () => {
    const { token } = await createDongHanhUser(25);
    const res = await request(app).post('/refunds/request').set(bearer(token)).send({});
    expect(res.status).toBe(200);
    expect(res.body.refund.amountVnd).toBe(25_000);
  });

  it('Reject sau Ngày 30 — đã sang maintenance (too_late)', async () => {
    const { token } = await createDongHanhUser(35); // đã sang ngày 35 = maintenance
    const res = await request(app).post('/refunds/request').set(bearer(token)).send({});
    expect(res.status).toBe(400);
  });
});
