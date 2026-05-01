// tests/messages.test.ts
//
// Test 3 — Daily message quota cho FREE / paid tier.
// Verify:
//   - FREE: tin thứ 6 trong ngày → 402 quota_exceeded (limit 5)
//   - KHOI_DONG/DONG_HANH (active): unlimited
//   - DONG_HANH trong maintenance: limit 10/ngày
//   - Reset count khi sang ngày mới (giả lập bằng cách set dailyMessageDate)

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/db';
import { createTestUser, bearer, cleanDb } from './helpers';

describe('POST /messages with quota', () => {
  beforeEach(cleanDb);
  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('FREE user gửi 5 tin OK, tin thứ 6 → 402 quota_exceeded', async () => {
    const { user, token } = await createTestUser({ tier: 'FREE' });

    // Set count = 4 (đã dùng 4 tin), date hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyMessageCount: 4, dailyMessageDate: today },
    });

    // Tin thứ 5 — vẫn OK
    const ok = await request(app)
      .post('/messages')
      .set(bearer(token))
      .send({ content: 'Tin thứ 5' });
    expect(ok.status).toBe(200);

    // Tin thứ 6 — phải fail
    const fail = await request(app)
      .post('/messages')
      .set(bearer(token))
      .send({ content: 'Tin thứ 6' });
    expect(fail.status).toBe(402);
    expect(fail.body.error).toBe('quota_exceeded');
    expect(fail.body.dailyLimit).toBe(5);
    expect(fail.body.used).toBe(5);
  });

  it('KHOI_DONG (active) → unlimited, gửi 20 tin không fail', async () => {
    const start = new Date();
    const { token } = await createTestUser({
      tier: 'KHOI_DONG',
      tierStartedAt: start,
      tierExpiresAt: new Date(start.getTime() + 10 * 86_400_000),
      quitDate: start,
    });

    for (let i = 0; i < 20; i++) {
      const r = await request(app)
        .post('/messages')
        .set(bearer(token))
        .send({ content: `Tin ${i}` });
      expect(r.status).toBe(200);
    }
  });

  it('FREE — quota reset khi sang ngày mới', async () => {
    const { user, token } = await createTestUser({ tier: 'FREE' });

    // Giả lập: hôm qua đã dùng 5 tin
    const yesterday = new Date(Date.now() - 86_400_000);
    yesterday.setHours(0, 0, 0, 0);
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyMessageCount: 5, dailyMessageDate: yesterday },
    });

    // Hôm nay tin thứ nhất — phải OK (vì reset)
    const r = await request(app)
      .post('/messages')
      .set(bearer(token))
      .send({ content: 'Sáng hôm nay' });
    expect(r.status).toBe(200);
  });

  it('DONG_HANH trong maintenance window — limit 10/ngày', async () => {
    // tier expired, đã sang maintenance
    const tierStarted = new Date(Date.now() - 35 * 86_400_000);
    const tierExpires = new Date(Date.now() - 5 * 86_400_000); // expired 5 ngày trước
    const maintEnd = new Date(Date.now() + 25 * 86_400_000); // còn 25 ngày maintenance

    const { user, token } = await createTestUser({
      tier: 'DONG_HANH',
      tierStartedAt: tierStarted,
      tierExpiresAt: tierExpires,
      maintenanceUntil: maintEnd,
      quitDate: tierStarted,
    });

    // Set đã dùng 9 tin hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyMessageCount: 9, dailyMessageDate: today },
    });

    // Tin thứ 10 OK
    const r10 = await request(app)
      .post('/messages')
      .set(bearer(token))
      .send({ content: 'Tin 10' });
    expect(r10.status).toBe(200);

    // Tin thứ 11 fail
    const r11 = await request(app)
      .post('/messages')
      .set(bearer(token))
      .send({ content: 'Tin 11' });
    expect(r11.status).toBe(402);
    expect(r11.body.dailyLimit).toBe(10);
  });
});
