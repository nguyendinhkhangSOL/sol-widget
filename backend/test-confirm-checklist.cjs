/**
 * Test Sprint 4 — Confirm checklist + auto enroll Phase 5.
 *
 * Test 2 scenarios:
 *   A. User CHƯA tick required → expect error q_day_checklist_incomplete
 *   B. User ĐÃ tick 3 required → expect ok + enrolled + 52 ScheduledPush
 *
 * Run: node test-confirm-checklist.cjs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Tìm test user
  const user = await prisma.user.findFirst({
    where: { name: { startsWith: 'Test User Phase5' } },
    orderBy: { createdAt: 'desc' },
  });
  if (!user) {
    console.error('Không có test user. Chạy test-enroll-user.cjs trước.');
    process.exit(1);
  }
  console.log(`\nTest user: ${user.id} (${user.name})`);

  // 2. Reset journey để test fresh
  await prisma.user.update({
    where: { id: user.id },
    data: {
      journeyStatus: null,
      qDayConfirmedAt: null,
      qDayDate: null,
      journeyType: null,
      settings: {},  // clear qDayChecklist trong settings
    },
  });
  await prisma.scheduledPush.deleteMany({ where: { userId: user.id } });
  console.log('  ✓ Reset journey state + xoá ScheduledPush');

  // 3. Import function trực tiếp (bypass HTTP)
  const { confirmChecklistAndEnroll } = require('./dist/tiers/qDayChecklist.js');

  // ─── SCENARIO A: Chưa tick → expect throw 412 ──────────────────────
  console.log('\n▶ Scenario A: Confirm KHI CHƯA TICK CHECKLIST');
  try {
    await confirmChecklistAndEnroll({ userId: user.id });
    console.log('  ✗ FAIL — đã enroll mà không tick? Lỗi guard!');
  } catch (e) {
    if (e.statusCode === 412 && e.payload?.error === 'q_day_checklist_incomplete') {
      console.log('  ✓ OK — guard chặn đúng');
      console.log('    Missing:', e.payload.missing);
    } else {
      console.log('  ✗ Unexpected error:', e.message);
    }
  }

  // ─── SCENARIO B: Tick 3 required → expect enroll ──────────────────
  console.log('\n▶ Scenario B: Tick 3 required → enroll Phase 5');
  const now = new Date().toISOString();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      settings: {
        qDayChecklist: {
          read_medical_disclaimer: now,
          inform_family: now,
          commit_digital: now,
        },
      },
    },
  });
  console.log('  ✓ Đã tick 3 mục required');

  try {
    const qDayDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await confirmChecklistAndEnroll({
      userId: user.id,
      qDayDate,
      journeyType: 'full-51',
    });
    console.log('  ✓ Enrolled successfully:');
    console.log('    ok:', result.ok);
    console.log('    enrolled:', result.enrolled);
    console.log('    qDayConfirmedAt:', result.qDayConfirmedAt);
    console.log('    qDayDate:', result.qDayDate.toISOString().slice(0, 10));
    console.log('    journeyType:', result.journeyType);
    console.log('    scheduledPushCount:', result.scheduledPushCount);
  } catch (e) {
    console.log('  ✗ FAIL:', e.message);
  }

  // ─── SCENARIO C: Re-confirm (idempotent) ──────────────────────────
  console.log('\n▶ Scenario C: Re-confirm (idempotent check)');
  try {
    const result2 = await confirmChecklistAndEnroll({ userId: user.id });
    console.log(`  ✓ Re-confirm OK — enrolled=${result2.enrolled} (expect false vì đã enrolled)`);
  } catch (e) {
    console.log('  ✗ FAIL:', e.message);
  }

  // ─── Verify DB cuối cùng ─────────────────────────────────────────
  console.log('\n▶ Final DB state:');
  const final = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      journeyStatus: true,
      qDayConfirmedAt: true,
      qDayDate: true,
      journeyType: true,
    },
  });
  const pushCount = await prisma.scheduledPush.count({ where: { userId: user.id } });
  console.log('  journeyStatus:', final.journeyStatus);
  console.log('  qDayConfirmedAt:', final.qDayConfirmedAt);
  console.log('  qDayDate:', final.qDayDate?.toISOString().slice(0, 10));
  console.log('  journeyType:', final.journeyType);
  console.log('  ScheduledPush:', pushCount, '(expect 52)');

  await prisma.$disconnect();
  console.log('\n✅ Test complete!\n');
}

main().catch(async (err) => {
  console.error('Test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
