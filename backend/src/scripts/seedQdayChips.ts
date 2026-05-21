// backend/src/scripts/seedQdayChips.ts
//
// PHASE 4 — Seed/upsert 30 chip Q-Day vào table canned_replies.
//
// Idempotent: chạy nhiều lần không trùng (upsert theo slug `qday-N`).
//
// Usage:
//   npm run seed:qday           # LIVE — cập nhật DB
//   npm run seed:qday -- --dry  # Preview, không update
//
// Sau khi seed → chip Q-Day có sẵn trong DB với wikiUrl chuẩn để Phase 5
// (Zalo push scheduler) query theo dayNumber và push hằng ngày.

import 'dotenv/config';
import { prisma } from '../db';
import { QDAY_CHIPS } from '../seed/qdayChips';

const DRY = process.argv.includes('--dry');

const QDAY_SORT_OFFSET = 1000; // 1001..1030, sort sau 42 chip cũ

async function main() {
  const bar = '━'.repeat(70);
  console.log(bar);
  console.log('🌅 Seed 30 chip Q-Day → canned_replies');
  console.log(bar);
  console.log(`Mode:           ${DRY ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Total chips:    ${QDAY_CHIPS.length}`);
  console.log('');

  if (QDAY_CHIPS.length !== 30) {
    console.warn(`⚠️  Expected 30 chips, got ${QDAY_CHIPS.length}`);
  }

  // Sanity: slug unique?
  const slugs = QDAY_CHIPS.map((c) => c.slug);
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupSlugs.length > 0) {
    console.error(`❌ Duplicate slugs: ${dupSlugs.join(', ')}`);
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const chip of QDAY_CHIPS) {
    const data = {
      label: chip.label,
      icon: chip.icon,
      answer: chip.answer,
      wikiUrl: chip.wikiUrl,
      wikiLabel: chip.wikiLabel,
      reusable: false,
      sortOrder: QDAY_SORT_OFFSET + chip.dayNumber,
      enabled: true,
      triggers: [],
      priority: 100,
      minScore: 0.5,
    };

    try {
      const existing = await prisma.cannedReply.findUnique({ where: { slug: chip.slug } });

      if (existing) {
        const changed =
          existing.label !== data.label ||
          existing.icon !== data.icon ||
          existing.answer !== data.answer ||
          existing.wikiUrl !== data.wikiUrl ||
          existing.wikiLabel !== data.wikiLabel ||
          existing.sortOrder !== data.sortOrder ||
          existing.reusable !== data.reusable ||
          existing.enabled !== data.enabled;

        if (!changed) {
          skipped++;
          if (process.env.VERBOSE) {
            console.log(`◯ ${chip.slug.padEnd(8)} ${chip.icon}  ${chip.label}  (unchanged)`);
          }
          continue;
        }

        if (DRY) {
          console.log(`📝 ${chip.slug.padEnd(8)} ${chip.icon}  ${chip.label}  (would update)`);
        } else {
          await prisma.cannedReply.update({ where: { slug: chip.slug }, data });
          console.log(`📝 ${chip.slug.padEnd(8)} ${chip.icon}  ${chip.label}  (updated)`);
        }
        updated++;
      } else {
        if (DRY) {
          console.log(`✨ ${chip.slug.padEnd(8)} ${chip.icon}  ${chip.label}  (would create)`);
        } else {
          await prisma.cannedReply.create({ data: { slug: chip.slug, ...data } });
          console.log(`✨ ${chip.slug.padEnd(8)} ${chip.icon}  ${chip.label}  (created)`);
        }
        created++;
      }
    } catch (err: any) {
      console.error(`❌ ${chip.slug}: ${err.message}`);
    }
  }

  console.log('');
  console.log(bar);
  console.log(`✨ Created: ${created}`);
  console.log(`📝 Updated: ${updated}`);
  console.log(`◯ Skipped: ${skipped} (already up-to-date)`);
  console.log(bar);

  if (DRY) {
    console.log('');
    console.log('💡 Dry run — không thay đổi DB. Bỏ --dry để chạy thật.');
  } else {
    // Summary từ DB sau khi seed
    const total = await prisma.cannedReply.count({
      where: { slug: { startsWith: 'qday-' } },
    });
    console.log(`📊 Q-Day chips trong DB: ${total}/30`);
  }
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch((err) => {
    console.error('Error:', err);
    prisma.$disconnect();
    process.exit(1);
  });
