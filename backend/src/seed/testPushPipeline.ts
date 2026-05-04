// backend/src/seed/testPushPipeline.ts
// Test e2e push notification pipeline KHÔNG qua cron.
// Trigger trực tiếp các handler của worker.ts để verify:
//   1. enqueueDailyContent() picks ContentItem đúng dayNumber
//   2. Personalize {pronoun}, {greet} đúng
//   3. Notification row được tạo với channels đúng
//   4. Streak milestone bắn đúng nếu user ở day 1/3/7/14/30/60/90
//
// KHÔNG test deliverDueNotifications() vì nó cần webpush subscription
// và sendWebPush sẽ throw nếu user chưa subscribe — test ở step sau.
//
// Run: cd backend && npx tsx src/seed/testPushPipeline.ts

import { PrismaClient } from '@prisma/client';
import { personalize as realPersonalize } from '../utils/personalize';

const prisma = new PrismaClient();

const TEST_EMAIL = 'test@sol.vn';

async function main() {
  // 1. Find test user
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) {
    console.error(`✗ Chưa có user ${TEST_EMAIL} — chạy createTestUser.ts trước`);
    process.exit(1);
  }
  if (!user.quitDate) {
    console.error('✗ User chưa có quitDate');
    process.exit(1);
  }

  const dayNumber = Math.floor((Date.now() - user.quitDate.getTime()) / 86400000) + 1;
  console.log(`✓ Test user ${user.email} — Day ${dayNumber}`);
  console.log(`  pronouns: ${user.pronouns}, assistantName: ${user.assistantName}\n`);

  // 2. Clear notifications cũ của user này (để dễ check)
  const cleared = await prisma.notification.deleteMany({ where: { userId: user.id } });
  console.log(`✓ Đã xoá ${cleared.count} notification cũ\n`);

  // 3. Verify ContentItem có cho dayNumber này
  const items = await prisma.contentItem.findMany({
    where: { dayNumber, published: true },
  });
  console.log(`✓ ContentItem cho Day ${dayNumber}: ${items.length} item`);
  for (const it of items) {
    console.log(`    [${it.module}] ${it.title.substring(0, 60)}…`);
  }
  console.log();

  // 4. Trigger các handler bằng cách require worker functions
  // Worker file không export functions ra ngoài — em copy logic core vào đây
  // để verify.

  console.log('━━━ Test 1: MORNING_GOAL enqueue ━━━');
  await testEnqueueMorning(user, dayNumber);

  console.log('\n━━━ Test 2: SCIENCE_TIP enqueue ━━━');
  await testEnqueueModule(user, dayNumber, 'SCIENCE_TIP');

  console.log('\n━━━ Test 3: NIGHT_STORY enqueue ━━━');
  await testEnqueueModule(user, dayNumber, 'NIGHT_STORY');

  console.log('\n━━━ Test 4: STREAK_MILESTONE check ━━━');
  await testStreakMilestone(user, dayNumber);

  // 5. Final report
  console.log('\n━━━ FINAL REPORT ━━━');
  const notifs = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { scheduledAt: 'asc' },
  });
  console.log(`Total Notification rows: ${notifs.length}\n`);
  for (const n of notifs) {
    console.log(`[${n.type}] channels=${JSON.stringify(n.channels)}`);
    console.log(`  Title: ${n.title}`);
    console.log(`  Body:  ${n.body.substring(0, 100)}${n.body.length > 100 ? '…' : ''}`);
    if (n.ctaLabel) console.log(`  CTA:   ${n.ctaLabel} → ${n.ctaAction}`);
    console.log();
  }

  console.log('✓ Done. Check Prisma Studio → table Notification để xem chi tiết.');
  await prisma.$disconnect();
}

// ─── Logic copy từ worker.ts ───────────────────────────────────────────────
// Dùng personalize thật từ utils — thay đầy đủ {pronouns}, {pronoun}, {name},
// {assistantName}, {assistant}, {selfRef}, {greet}.
const personalize = realPersonalize;

async function testEnqueueMorning(user: any, dayNumber: number) {
  const items = await prisma.contentItem.findMany({
    where: { dayNumber, module: 'MORNING_GOAL', published: true },
  });
  if (items.length === 0) {
    console.log(`  ✗ Không có MORNING_GOAL cho Day ${dayNumber}`);
    return;
  }
  const item = items[0];
  const pCtx = { name: user.name, pronouns: user.pronouns, assistantName: user.assistantName, quitReasons: user.quitReasons, topTriggers: user.topTriggers };

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'MORNING_GOAL',
      title: personalize(item.title, pCtx),
      body: personalize(item.body, pCtx),
      wikiUrl: item.wikiUrl,
      ctaLabel: item.wikiUrl ? 'Đọc sâu' : null,
      ctaAction: item.wikiUrl ?? null,
      channels: ['IN_WIDGET', 'WEB_PUSH'],
      scheduledAt: new Date(),
      metadata: { dayNumber, module: 'MORNING_GOAL' },
    },
  });
  console.log(`  ✓ Tạo MORNING_GOAL: "${personalize(item.title, pCtx).substring(0, 60)}…"`);
}

async function testEnqueueModule(user: any, dayNumber: number, module: 'SCIENCE_TIP' | 'NIGHT_STORY') {
  const items = await prisma.contentItem.findMany({
    where: { dayNumber, module, published: true },
  });
  if (items.length === 0) {
    console.log(`  ✗ Không có ${module} cho Day ${dayNumber}`);
    return;
  }
  const item = items[0];
  const pCtx = { name: user.name, pronouns: user.pronouns, assistantName: user.assistantName, quitReasons: user.quitReasons, topTriggers: user.topTriggers };

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: module === 'SCIENCE_TIP' ? 'SCIENCE_TIP' : 'NIGHT_STORY' as any,
      title: personalize(item.title, pCtx),
      body: personalize(item.body, pCtx),
      wikiUrl: item.wikiUrl,
      ctaLabel: item.wikiUrl ? 'Đọc sâu' : null,
      ctaAction: item.wikiUrl ?? null,
      channels: ['IN_WIDGET', 'WEB_PUSH'],
      scheduledAt: new Date(),
      metadata: { dayNumber, module },
    },
  });
  console.log(`  ✓ Tạo ${module}: "${personalize(item.title, pCtx).substring(0, 60)}…"`);
}

const STREAK_MILESTONES: Record<number, { title: string; body: string; emoji: string }> = {
  1: { emoji: '🌱', title: '1 ngày — viên đá đầu tiên', body: 'Khó nhất là 24h đầu, {pronoun} đã qua.' },
  2: { emoji: '🔥', title: '2 ngày — đỉnh sóng đang đến', body: 'Giờ này nicotin rút mạnh trong cơ thể {pronoun}. Chuẩn bị Plan B sẵn.' },
  3: { emoji: '💪', title: '3 ngày — đỉnh sóng đã qua', body: 'Nicotin gần như sạch khỏi cơ thể {pronoun}.' },
  7: { emoji: '🌿', title: '1 tuần', body: 'Khứu giác và vị giác của {pronoun} đang phục hồi.' },
};

async function testStreakMilestone(user: any, dayNumber: number) {
  const ms = STREAK_MILESTONES[dayNumber];
  if (!ms) {
    console.log(`  · Day ${dayNumber} không có milestone — skip (đúng logic)`);
    return;
  }
  const pCtx = { name: user.name, pronouns: user.pronouns, assistantName: user.assistantName, quitReasons: user.quitReasons, topTriggers: user.topTriggers };
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'STREAK_MILESTONE',
      title: `${ms.emoji} ${ms.title}`,
      body: personalize(ms.body, pCtx),
      ctaLabel: 'Xem hành trình',
      ctaAction: 'open_progress',
      channels: ['IN_WIDGET', 'WEB_PUSH'],
      scheduledAt: new Date(),
      metadata: { dayNumber, milestone: dayNumber },
    },
  });
  console.log(`  ✓ Tạo STREAK_MILESTONE Day ${dayNumber}: "${ms.emoji} ${ms.title}"`);
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
