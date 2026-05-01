// backend/src/scripts/seedTriggers.ts
//
// Script chạy 1 lần để patch trigger config cho 30 chip canned reply đã có
// trong DB. KHÔNG động đến label/answer/wikiUrl mà Khang đã chỉnh qua admin.
//
// Usage:
//   npm run seed:triggers          # Patch tất cả slug có trong CANNED_TRIGGERS
//   npm run seed:triggers -- --dry # Chỉ log, không update DB
//
// Idempotent — chạy lại nhiều lần không gây vấn đề.

import 'dotenv/config';
import { prisma } from '../db';
import { CANNED_TRIGGERS } from '../seed/cannedTriggers';

const DRY = process.argv.includes('--dry');

async function main() {
  console.log('━'.repeat(70));
  console.log('🎯 Seed canned reply triggers');
  console.log('━'.repeat(70));
  console.log(`Mode: ${DRY ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const [slug, cfg] of Object.entries(CANNED_TRIGGERS)) {
    const existing = await prisma.cannedReply.findUnique({ where: { slug } });
    if (!existing) {
      console.warn(`⚠️  ${slug} chưa có trong DB — chạy npm run seed trước`);
      missing++;
      continue;
    }

    const newTriggers = cfg.triggers;
    const newPriority = cfg.priority;
    const newMinScore = cfg.minScore ?? 0.5;

    // Check changes
    const triggersChanged =
      JSON.stringify((existing as any).triggers ?? []) !== JSON.stringify(newTriggers);
    const priorityChanged = (existing as any).priority !== newPriority;
    const scoreChanged = (existing as any).minScore !== newMinScore;

    if (!triggersChanged && !priorityChanged && !scoreChanged) {
      skipped++;
      continue;
    }

    console.log(`📝 ${slug}`);
    if (triggersChanged) console.log(`   triggers: ${newTriggers.length} từ`);
    if (priorityChanged) console.log(`   priority: ${(existing as any).priority} → ${newPriority}`);
    if (scoreChanged) console.log(`   minScore: ${(existing as any).minScore} → ${newMinScore}`);

    if (!DRY) {
      await prisma.cannedReply.update({
        where: { slug },
        data: {
          triggers: newTriggers,
          priority: newPriority,
          minScore: newMinScore,
        } as any,
      });
    }
    updated++;
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log(`✓ Updated:  ${updated}`);
  console.log(`◯ Skipped:  ${skipped} (không thay đổi)`);
  if (missing > 0) console.log(`⚠️  Missing:  ${missing} (chưa seed chip)`);
  console.log('━'.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
