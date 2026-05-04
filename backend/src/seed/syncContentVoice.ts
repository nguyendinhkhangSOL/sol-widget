// backend/src/seed/syncContentVoice.ts
// Sau prisma db push, default voice = SOL_DONG_HANH cho tất cả 127 row.
// Script này set lại voice = KHANG_SOL cho các item trong giai đoạn
// "Khởi động" (Day 1-2 MORNING) và "Cột mốc" (Day 29-30 MORNING + NIGHT)
// theo MESSAGING_PLAYBOOK Phần 1 Voice arc.
//
// Run: npx tsx src/seed/syncContentVoice.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Items dùng voice Khang Sol (ký tên, cá nhân)
const KHANG_SOL_ITEMS: { dayNumber: number; module: 'MORNING_GOAL' | 'NIGHT_STORY' }[] = [
  // Khởi động — MORNING ngày 1-2 mở đầu hành trình
  { dayNumber: 1, module: 'MORNING_GOAL' },
  { dayNumber: 2, module: 'MORNING_GOAL' },
  // Cột mốc — Day 29-30 set up next chapter
  { dayNumber: 29, module: 'MORNING_GOAL' },
  { dayNumber: 30, module: 'MORNING_GOAL' },
  { dayNumber: 29, module: 'NIGHT_STORY' },
  { dayNumber: 30, module: 'NIGHT_STORY' },
];

async function main() {
  console.log('Sync voice cho 127 ContentItem theo MESSAGING_PLAYBOOK voice arc...\n');

  let updated = 0;
  for (const item of KHANG_SOL_ITEMS) {
    const result = await prisma.contentItem.updateMany({
      where: { dayNumber: item.dayNumber, module: item.module as any },
      data: { voice: 'KHANG_SOL' as any },
    });
    if (result.count > 0) {
      console.log(`  ✓ Day ${item.dayNumber} ${item.module} → voice=KHANG_SOL (${result.count} row)`);
      updated += result.count;
    }
  }

  // Đếm voice distribution
  const stats = await prisma.contentItem.groupBy({
    by: ['voice'],
    _count: { _all: true },
  });

  console.log(`\n✓ Updated ${updated} item to KHANG_SOL`);
  console.log('\n=== Voice distribution ===');
  for (const s of stats) {
    console.log(`  ${s.voice.padEnd(15)} ${s._count._all} items`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
