// backend/src/seed/runContentItems.ts
// Seed/upsert 127 ContentItems vào DB.
// Run: cd backend && npx tsx src/seed/runContentItems.ts
//
// Idempotent — chạy nhiều lần không trùng (upsert theo @@unique [dayNumber, module, exerciseKey]).

import { PrismaClient, ContentModule } from '@prisma/client';
import { CONTENT_ITEMS } from './contentItems';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${CONTENT_ITEMS.length} ContentItems...`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of CONTENT_ITEMS) {
    const moduleEnum = item.module as ContentModule;
    const wikiUrl = item.wikiSlug ? `https://sol.vn/${item.wikiSlug}/` : null;

    try {
      // Check existing trước upsert (track created vs updated)
      const existing = await prisma.contentItem.findFirst({
        where: {
          dayNumber: item.dayNumber,
          module: moduleEnum,
          exerciseKey: null,
        },
      });

      if (existing) {
        await prisma.contentItem.update({
          where: { id: existing.id },
          data: {
            title: item.title,
            body: item.body,
            wikiUrl,
            pushTime: item.pushTime ?? null,
            published: true,
          },
        });
        updated++;
      } else {
        await prisma.contentItem.create({
          data: {
            dayNumber: item.dayNumber,
            module: moduleEnum,
            title: item.title,
            body: item.body,
            wikiUrl,
            pushTime: item.pushTime ?? null,
            published: true,
          },
        });
        created++;
      }
    } catch (err: any) {
      console.warn(`  ⚠ Day ${item.dayNumber} ${item.module}: ${err.message}`);
      skipped++;
    }
  }

  // Summary by module
  const counts = await prisma.contentItem.groupBy({
    by: ['module'],
    _count: { _all: true },
  });

  console.log('');
  console.log('=== DONE ===');
  console.log(`  Created:  ${created}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log('');
  console.log('=== By module (in DB now) ===');
  for (const c of counts) {
    console.log(`  ${c.module.padEnd(20)} ${c._count._all} items`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
