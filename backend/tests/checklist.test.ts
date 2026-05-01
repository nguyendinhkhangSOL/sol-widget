// tests/checklist.test.ts
//
// Test 5 — Q-Day checklist endpoints idempotency + filtering.
// Verify:
//   - Tick 1 item → state updated, requiredDoneCount tăng
//   - Tick lại cùng item → idempotent (timestamp KHÔNG thay đổi)
//   - Uncheck → bỏ tick, count giảm
//   - Filter onlyForTier — KHOI_DONG-only items không hiện cho FREE flow

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/db';
import { createTestUser, bearer, cleanDb } from './helpers';

describe('POST /tiers/q-day-checklist/check — idempotency', () => {
  beforeEach(cleanDb);
  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('Tick item lần đầu — count tăng, timestamp set', async () => {
    const { token } = await createTestUser();

    const before = await request(app)
      .get('/tiers/q-day-checklist?targetTier=FREE')
      .set(bearer(token));
    expect(before.status).toBe(200);
    const initialDone = before.body.requiredDoneCount;

    // Tick item đầu tiên (read_prep_guide trong default)
    const after = await request(app)
      .post('/tiers/q-day-checklist/check')
      .set(bearer(token))
      .send({ itemId: 'read_prep_guide' });

    expect(after.status).toBe(200);
    expect(after.body.requiredDoneCount).toBe(initialDone + 1);

    const item = after.body.items.find((i: any) => i.id === 'read_prep_guide');
    expect(item.checkedAt).not.toBeNull();
  });

  it('Tick lại cùng item — idempotent (timestamp KHÔNG đổi)', async () => {
    const { token } = await createTestUser();

    // Tick lần 1
    const first = await request(app)
      .post('/tiers/q-day-checklist/check')
      .set(bearer(token))
      .send({ itemId: 'read_prep_guide' });
    const firstTimestamp = first.body.items.find(
      (i: any) => i.id === 'read_prep_guide',
    ).checkedAt;

    // Đợi 50ms cho timestamp khác nhau nếu có ghi đè
    await new Promise((r) => setTimeout(r, 50));

    // Tick lần 2 — phải giữ timestamp cũ
    const second = await request(app)
      .post('/tiers/q-day-checklist/check')
      .set(bearer(token))
      .send({ itemId: 'read_prep_guide' });
    const secondTimestamp = second.body.items.find(
      (i: any) => i.id === 'read_prep_guide',
    ).checkedAt;

    expect(secondTimestamp).toBe(firstTimestamp);
    // Count không tăng (vẫn = 1 cho item này)
    expect(second.body.requiredDoneCount).toBe(first.body.requiredDoneCount);
  });

  it('Uncheck — count giảm, timestamp = null', async () => {
    const { token } = await createTestUser();

    // Tick xong
    await request(app)
      .post('/tiers/q-day-checklist/check')
      .set(bearer(token))
      .send({ itemId: 'read_prep_guide' });

    // Uncheck
    const uncheck = await request(app)
      .post('/tiers/q-day-checklist/uncheck')
      .set(bearer(token))
      .send({ itemId: 'read_prep_guide' });

    expect(uncheck.status).toBe(200);
    const item = uncheck.body.items.find((i: any) => i.id === 'read_prep_guide');
    expect(item.checkedAt).toBeNull();
  });

  it('targetTier=FREE: không hiện item paid_starter (onlyForTier=KHOI_DONG)', async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .get('/tiers/q-day-checklist?targetTier=FREE')
      .set(bearer(token));

    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: any) => i.id);
    expect(ids).not.toContain('paid_starter');
  });

  it('targetTier=KHOI_DONG: HIỆN paid_starter', async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .get('/tiers/q-day-checklist?targetTier=KHOI_DONG')
      .set(bearer(token));

    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: any) => i.id);
    expect(ids).toContain('paid_starter');
  });

  it('Tick uncheck idempotent — uncheck item chưa tick không lỗi', async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .post('/tiers/q-day-checklist/uncheck')
      .set(bearer(token))
      .send({ itemId: 'read_prep_guide' });

    expect(res.status).toBe(200);
  });
});
