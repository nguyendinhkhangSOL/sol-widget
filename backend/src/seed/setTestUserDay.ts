// backend/src/seed/setTestUserDay.ts
// Set test user về Day N để test content tin nhắn ngày khác.
//
// Run: npx tsx src/seed/setTestUserDay.ts 14
//      → set test@sol.vn về Day 14 (quitDate = today - 13 days)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const day = parseInt(process.argv[2] ?? '1', 10);
  if (isNaN(day) || day < 1 || day > 30) {
    console.error('Usage: npx tsx src/seed/setTestUserDay.ts <1-30>');
    process.exit(1);
  }

  const quitDate = new Date(Date.now() - (day - 1) * 86400000);

  const u = await prisma.user.update({
    where: { email: 'test@sol.vn' },
    data: { quitDate },
  });

  console.log(`✓ test@sol.vn → Day ${day}`);
  console.log(`  quitDate: ${u.quitDate?.toISOString()}`);
  console.log(`  pronouns: ${u.pronouns}, name: ${u.name}`);
  console.log(`  quitReasons: ${JSON.stringify(u.quitReasons)}`);
  console.log(`\nGiờ chạy: npx tsx src/seed/testPushPipeline.ts`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
