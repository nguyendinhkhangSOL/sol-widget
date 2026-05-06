// backend/src/seed/runContentItemsPhaseB.ts
// Seed/upsert 38 ContentItem Phase B (Phase 1+2+4) vào DB.
//
// Run trong Docker:
//   docker compose exec backend npx tsx src/seed/runContentItemsPhaseB.ts
//
// Run local (nếu Khang dev backend ngoài Docker):
//   cd backend && npx tsx src/seed/runContentItemsPhaseB.ts
//
// Idempotent — upsert theo (dayNumber, module, voice). Chạy lại nhiều lần OK.
// dayNumber convention: 101-107 (P1), 108-128 (P2), 159-188 (P4).
// KHÔNG đụng dayNumber 1-30 (Phase 3 GIAI_PHONG = workbook 30 ngày cũ).

import { PrismaClient, ContentModule, ContentVoice } from '@prisma/client';
import { PHASE_B_CONTENT } from './contentItemsPhaseB';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${PHASE_B_CONTENT.length} Phase B ContentItems...`);
  console.log('  Range: dayNumber 101-128 (Phase 1+2) + 159-188 (Phase 4)');
  console.log('');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of PHASE_B_CONTENT) {
    const moduleEnum = item.module as ContentModule;
    const voiceEnum = item.voice as ContentVoice;
    const wikiUrl = item.wikiSlug ? `https://sol.vn/wiki/${item.wikiSlug}/` : null;

    try {
      const existing = await prisma.contentItem.findFirst({
        where: {
          dayNumber: item.dayNumber,
          module: moduleEnum,
          voice: voiceEnum,
          exerciseKey: null,
        },
      });

      if (existing) {
        await prisma.contentItem.update({
          where: { id: existing.id },
          data: {
            title: item.title,
            body: item.body,
            voice: voiceEnum,
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
            voice: voiceEnum,
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
      console.warn(`  ⚠ Day ${item.dayNumber} ${item.module} ${item.voice}: ${err.message}`);
      skipped++;
    }
  }

  // Summary breakdown by phase + module
  async function countPhase(min: number, max: number, mod?: string) {
    return prisma.contentItem.count({
      where: {
        dayNumber: { gte: min, lte: max },
        published: true,
        ...(mod ? { module: mod as any } : {}),
      },
    });
  }

  const p1Total = await countPhase(101, 107);
  const p1Morning = await countPhase(101, 107, 'MORNING_GOAL');
  const p1Science = await countPhase(101, 107, 'SCIENCE_TIP');
  const p1Night = await countPhase(101, 107, 'NIGHT_STORY');
  const p2Total = await countPhase(108, 128);
  const p2Morning = await countPhase(108, 128, 'MORNING_GOAL');
  const p2Science = await countPhase(108, 128, 'SCIENCE_TIP');
  const p2Night = await countPhase(108, 128, 'NIGHT_STORY');
  const p4Total = await countPhase(159, 188);
  const p4Morning = await countPhase(159, 188, 'MORNING_GOAL');
  const p4Science = await countPhase(159, 188, 'SCIENCE_TIP');
  const p4Night = await countPhase(159, 188, 'NIGHT_STORY');

  console.log('');
  console.log('=== DONE ===');
  console.log(`  Created:  ${created}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log('');
  console.log('=== Phase B content in DB ===');
  console.log(`  Phase 1 NHAN_THUC  (101-107): ${p1Total} items (${p1Morning} MORNING + ${p1Science} SCIENCE + ${p1Night} NIGHT)`);
  console.log(`  Phase 2 HANH_DONG  (108-128): ${p2Total} items (${p2Morning} MORNING + ${p2Science} SCIENCE + ${p2Night} NIGHT)`);
  console.log(`  Phase 4 TAI_THIET  (159-188): ${p4Total} items (${p4Morning} MORNING + ${p4Science} SCIENCE + ${p4Night} NIGHT)`);
  console.log('');
  console.log('Frontend mapping (Journey.tsx + DayDetail):');
  console.log('  Phase 1: contentDay = dayInJourney + 100');
  console.log('  Phase 2: contentDay = dayInJourney + 100');
  console.log('  Phase 3: contentDay = dayInJourney - 28 (existing)');
  console.log('  Phase 4: contentDay = dayInJourney + 100');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
