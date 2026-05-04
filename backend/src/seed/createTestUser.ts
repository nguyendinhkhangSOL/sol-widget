// backend/src/seed/createTestUser.ts
// Tạo test user với quitDate = hôm qua → user đang ở Day 1 (or Day 2).
// Idempotent — nếu user 'test@sol.vn' đã có thì update lại quitDate.
//
// Run: cd backend && npx tsx src/seed/createTestUser.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const yesterday = new Date(Date.now() - 86400000);

  const user = await prisma.user.upsert({
    where: { email: 'test@sol.vn' },
    update: {
      quitDate: yesterday,
      pronouns: 'anh',
      assistantName: 'Sol Phó tướng',
      name: 'Khang Test',
      // LEVEL 3 — story personalization vars để test {topReason}
      quitReasons: ['vì cu Tí', 'ho buổi sáng', 'vợ nhăn'],
      topTriggers: ['nhậu', 'cà phê sáng', 'sau bữa cơm'],
    },
    create: {
      email: 'test@sol.vn',
      deviceUid: 'test-device-uid-001',
      name: 'Khang Test',
      pronouns: 'anh',
      assistantName: 'Sol Phó tướng',
      quitDate: yesterday,
      tier: 'FREE',
      isAnonymous: false,
      // LEVEL 3
      quitReasons: ['vì cu Tí', 'ho buổi sáng', 'vợ nhăn'],
      topTriggers: ['nhậu', 'cà phê sáng', 'sau bữa cơm'],
    },
  });

  console.log('✓ Test user:', {
    id: user.id,
    email: user.email,
    quitDate: user.quitDate?.toISOString(),
    tier: user.tier,
  });

  if (user.quitDate) {
    const diff = Math.floor((Date.now() - user.quitDate.getTime()) / 86400000);
    const dayNum = Math.max(1, diff + 1);
    console.log(`  → Day ${dayNum}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
