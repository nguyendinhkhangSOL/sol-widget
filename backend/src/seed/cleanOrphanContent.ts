// backend/src/seed/cleanOrphanContent.ts
// Xoá row dư trong ContentItem không match contentItems.ts hiện tại.
//
// Run: npx tsx src/seed/cleanOrphanContent.ts

import { PrismaClient } from '@prisma/client';
import { CONTENT_ITEMS } from './contentItems';

const prisma = new PrismaClient();

async function main() {
  // Build set các (dayNumber, module) hợp lệ từ contentItems.ts
  const validKeys = new Set<string>();
  for (const item of CONTENT_ITEMS) {
    validKeys.add(`${item.dayNumber}::${item.module}`);
  }

  // Lấy tất cả row trong DB
  const allItems = await prisma.contentItem.findMany();
  console.log(`Total in DB: ${allItems.length}`);
  console.log(`Valid in seed: ${CONTENT_ITEMS.length}`);

  // Xác định orphan: row trong DB nhưng không có (dayNumber, module) tương ứng
  const orphans = allItems.filter((item) => {
    const key = `${item.dayNumber}::${item.module}`;
    return !validKeys.has(key);
  });

  // Cũng tính duplicate: cùng (dayNumber, module) nhưng nhiều row
  const dupGroups = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const key = `${item.dayNumber}::${item.module}::${item.exerciseKey ?? 'null'}`;
    if (!dupGroups.has(key)) dupGroups.set(key, []);
    dupGroups.get(key)!.push(item);
  }

  const dups: typeof allItems = [];
  for (const [_, items] of dupGroups) {
    if (items.length > 1) {
      // Sort theo updatedAt desc, giữ row mới nhất, mark còn lại là duplicate
      items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      dups.push(...items.slice(1));
    }
  }

  console.log(`Orphans (không match seed): ${orphans.length}`);
  console.log(`Duplicates (cùng day+module+exerciseKey): ${dups.length}`);

  const toDelete = [...orphans, ...dups];
  if (toDelete.length === 0) {
    console.log('\n✓ Không có row cần xoá. DB sạch.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nIDs sẽ xoá:');
  for (const item of toDelete) {
    console.log(`  - ${item.id} | day ${item.dayNumber} | ${item.module} | "${item.title.substring(0, 40)}"`);
  }

  const result = await prisma.contentItem.deleteMany({
    where: { id: { in: toDelete.map((i) => i.id) } },
  });
  console.log(`\n✓ Xoá ${result.count} row`);

  // Stats sau
  const stats = await prisma.contentItem.groupBy({
    by: ['module'],
    _count: { _all: true },
  });
  console.log('\n=== After cleanup ===');
  for (const s of stats) {
    console.log(`  ${s.module.padEnd(20)} ${s._count._all} items`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
