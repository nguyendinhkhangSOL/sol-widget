// tests/payments.test.ts
//
// Test 1 — Payment checkout flow.
// Verify:
//   - Mock checkout tạo PaymentLog status=PAID
//   - User tier upgrade lên đúng targetTier
//   - tierStartedAt + tierExpiresAt set đúng
//   - DONG_HANH có maintenanceUntil = expiresAt + 30 ngày
//   - FREE user mua DONG_HANH lần đầu cũng work (skip KHOI_DONG)
//   - Không cho downgrade DONG_HANH → KHOI_DONG

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/db';
import { createTestUser, bearer, cleanDb } from './helpers';

describe('POST /payments/checkout', () => {
  beforeEach(cleanDb);
  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('FREE user mua KHOI_DONG (mock) → tier upgraded + payment PAID', async () => {
    // Cần complete checklist trước (do gate ở backend)
    const { user, token } = await createTestUser({ completeChecklist: true });

    const res = await request(app)
      .post('/payments/checkout')
      .set(bearer(token))
      .send({ targetTier: 'KHOI_DONG', provider: 'mock' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mock).toBe(true);
    expect(res.body.payment.targetTier).toBe('KHOI_DONG');
    expect(res.body.payment.amountVnd).toBe(99_000);
    expect(res.body.payment.status).toBe('PAID');

    // User tier đã upgrade
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.tier).toBe('KHOI_DONG');
    expect(updated?.tierStartedAt).not.toBeNull();
    expect(updated?.tierExpiresAt).not.toBeNull();

    // tierExpiresAt cách tierStartedAt 10 ngày
    const startMs = updated!.tierStartedAt!.getTime();
    const expiresMs = updated!.tierExpiresAt!.getTime();
    const diffDays = (expiresMs - startMs) / 86_400_000;
    expect(diffDays).toBeCloseTo(10, 1);
  });

  it('FREE user mua DONG_HANH trực tiếp → set maintenanceUntil = expires + 30d', async () => {
    const { user, token } = await createTestUser({ completeChecklist: true });

    const res = await request(app)
      .post('/payments/checkout')
      .set(bearer(token))
      .send({ targetTier: 'DONG_HANH', provider: 'mock' });

    expect(res.status).toBe(200);
    expect(res.body.payment.amountVnd).toBe(199_000);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.tier).toBe('DONG_HANH');
    expect(updated?.maintenanceUntil).not.toBeNull();
    const expiresMs = updated!.tierExpiresAt!.getTime();
    const maintMs = updated!.maintenanceUntil!.getTime();
    expect((maintMs - expiresMs) / 86_400_000).toBeCloseTo(30, 1);
  });

  it('Reject DONG_HANH → KHOI_DONG (downgrade)', async () => {
    const { token } = await createTestUser({
      completeChecklist: true,
      tier: 'DONG_HANH',
      quitDate: new Date(),
      tierStartedAt: new Date(),
      tierExpiresAt: new Date(Date.now() + 30 * 86_400_000),
    });

    const res = await request(app)
      .post('/payments/checkout')
      .set(bearer(token))
      .send({ targetTier: 'KHOI_DONG', provider: 'mock' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('cannot_downgrade');
  });

  it('Block checkout khi checklist chưa xong (412)', async () => {
    // KHÔNG complete checklist
    const { token } = await createTestUser({ completeChecklist: false });

    const res = await request(app)
      .post('/payments/checkout')
      .set(bearer(token))
      .send({ targetTier: 'KHOI_DONG', provider: 'mock' });

    expect(res.status).toBe(412);
    expect(res.body.error).toBe('q_day_checklist_incomplete');
    expect(Array.isArray(res.body.missing)).toBe(true);
  });

  it('Bỏ qua checklist nếu user đã có quitDate (re-purchase)', async () => {
    // User đã từng cai (có quitDate), nay mua thêm — không cần checklist lại
    const { token } = await createTestUser({
      completeChecklist: false,
      quitDate: new Date(Date.now() - 60 * 86_400_000), // 60 ngày trước
    });

    const res = await request(app)
      .post('/payments/checkout')
      .set(bearer(token))
      .send({ targetTier: 'DONG_HANH', provider: 'mock' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
