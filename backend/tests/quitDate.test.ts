// tests/quitDate.test.ts
//
// Test 4 — Q-Day checklist gate cho PATCH /users/me { quitDate }.
// Verify:
//   - Set quitDate khi checklist incomplete → 412
//   - Set quitDate khi checklist complete → 200
//   - Cập nhật field khác (name, pronouns) không bị gate
//   - Set quitDate=null (reset) không bị gate

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/db';
import { createTestUser, bearer, cleanDb } from './helpers';

describe('PATCH /users/me — Q-Day gate', () => {
  beforeEach(cleanDb);
  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('Reject quitDate khi checklist chưa xong (412)', async () => {
    const { token } = await createTestUser({ completeChecklist: false });

    const res = await request(app)
      .patch('/users/me')
      .set(bearer(token))
      .send({ quitDate: new Date().toISOString() });

    expect(res.status).toBe(412);
    expect(res.body.error).toBe('q_day_checklist_incomplete');
    expect(res.body.requiredCount).toBeGreaterThan(0);
    expect(Array.isArray(res.body.missing)).toBe(true);
  });

  it('Accept quitDate khi checklist đã xong (200)', async () => {
    const { user, token } = await createTestUser({ completeChecklist: true });
    const qDay = new Date().toISOString();

    const res = await request(app)
      .patch('/users/me')
      .set(bearer(token))
      .send({ quitDate: qDay });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.quitDate).not.toBeNull();
  });

  it('Update name/pronouns không bị gate', async () => {
    const { token } = await createTestUser({ completeChecklist: false });

    const res = await request(app)
      .patch('/users/me')
      .set(bearer(token))
      .send({ name: 'Anh Khang Mới', pronouns: 'em' });

    expect(res.status).toBe(200);
  });

  it('Cho phép quitDate=null (reset) mà không cần checklist', async () => {
    const { token } = await createTestUser({
      completeChecklist: false,
      quitDate: new Date(),
    });

    const res = await request(app)
      .patch('/users/me')
      .set(bearer(token))
      .send({ quitDate: null });

    expect(res.status).toBe(200);
  });

  it('Giữ quitDate cũ — không re-validate khi quitDate không đổi', async () => {
    const existing = new Date(Date.now() - 5 * 86_400_000);
    const { token } = await createTestUser({
      completeChecklist: false,
      quitDate: existing,
    });

    // Patch với cùng quitDate cũ
    const res = await request(app)
      .patch('/users/me')
      .set(bearer(token))
      .send({ quitDate: existing.toISOString(), name: 'New name' });

    expect(res.status).toBe(200);
  });
});
