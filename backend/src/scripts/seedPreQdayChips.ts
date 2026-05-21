// backend/src/scripts/seedPreQdayChips.ts
//
// PHASE 4B — Seed/upsert chip Pre-Q-Day vào canned_replies.
// Hỗ trợ cả Làm quen (lam-quen-N) và Giảm dần (giam-dan-N).
//
// Idempotent: chạy nhiều lần không trùng (upsert theo slug).
//
// Usage:
//   npm run seed:pre-qday           # LIVE — cập nhật DB
//   npm run seed:pre-qday -- --dry  # Preview, không update

import 'dotenv/config';
import { prisma } from '../db';
import { PRE_QDAY_CHIPS } from '../seed/preQdayChips';

const DRY = process.argv.includes('--dry');

// Sort offset: 2000+N cho lam-quen (sort sau qday 1001-1030),
//              3000+N cho giam-dan (sort sau lam-quen).
function sortOrderFor(phase: 'lam-quen' | 'giam-dan', dayNumber: number): number {
  return (phase === 'lam-quen' ? 2000 : 3000) + dayNumber;
}

async function main() {
  const bar = '━'.repeat(72);
  console.log(bar);
  console.log('🌱 Seed chip Pre-Q-Day → canned_replies');
  console.log(bar);
  console.log(`Mode:           ${DRY ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Total chips:    ${PRE_QDAY_CHIPS.length}`);

  const byPhase = PRE_QDAY_CHIPS.reduce<Record<string, number>>((acc, c) => {
    acc[c.phase] = (acc[c.phase] || 0) + 1;
    return acc;
  }, {});
  console.log(`Phase counts:   lam-quen=${byPhase['lam-quen'] || 0} (target 7), giam-dan=${byPhase['giam-dan'] || 0} (target 14)`);
  console.log('');

  // Sanity: slug unique?
  const slugs = PRE_QDAY_CHIPS.map((c) => c.slug);
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupSlugs.length > 0) {
    console.error(`❌ Duplicate slugs: ${dupSlugs.join(', ')}`);
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const chip of PRE_QDAY_CHIPS) {
    const data = {
      label: chip.label,
      icon: chip.icon,
      answer: chip.answer,
      wikiUrl: chip.wikiUrl,
      wikiLabel: chip.wikiLabel,
      reusable: false,
      sortOrder: sortOrderFor(chip.phase, chip.dayNumber),
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
            console.log(`◯ ${chip.slug.padEnd(14)} ${chip.icon}  ${chip.label}  (unchanged)`);
          }
          continue;
        }

        if (DRY) {
          console.log(`📝 ${chip.slug.padEnd(14)} ${chip.icon}  ${chip.label}  (would update)`);
        } else {
          await prisma.cannedReply.update({ where: { slug: chip.slug }, data });
          console.log(`📝 ${chip.slug.padEnd(14)} ${chip.icon}  ${chip.label}  (updated)`);
        }
        updated++;
      } else {
        if (DRY) {
          console.log(`✨ ${chip.slug.padEnd(14)} ${chip.icon}  ${chip.label}  (would create)`);
        } else {
          await prisma.cannedReply.create({ data: { slug: chip.slug, ...data } });
          console.log(`✨ ${chip.slug.padEnd(14)} ${chip.icon}  ${chip.label}  (created)`);
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
    const lamQuenCount = await prisma.cannedReply.count({
      where: { slug: { startsWith: 'lam-quen-' } },
    });
    const giamDanCount = await prisma.cannedReply.count({
      where: { slug: { startsWith: 'giam-dan-' } },
    });
    console.log(`📊 Trong DB: lam-quen=${lamQuenCount}/7, giam-dan=${giamDanCount}/14`);
  }
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch((err) => {
    console.error('Error:', err);
    prisma.$disconnect();
    process.exit(1);
  });
