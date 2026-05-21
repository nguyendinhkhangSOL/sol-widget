// backend/src/scripts/seedPillarChips.ts
//
// Seed/upsert 7 PILLAR chip vào table CannedReply.
// Sort order: 4000+N (sau qday 1001-1030, lam-quen 2001-2007, giam-dan 3001-3014).
//
// Idempotent.
//
// Usage:
//   npm run seed:pillar           # LIVE
//   npm run seed:pillar -- --dry  # Preview

import 'dotenv/config';
import { prisma } from '../db';
import { PILLAR_CHIPS } from '../seed/pillarChips';

const DRY = process.argv.includes('--dry');

async function main() {
  const bar = '━'.repeat(72);
  console.log(bar);
  console.log('🌱 Seed 7 PILLAR chip → CannedReply');
  console.log(bar);
  console.log(`Mode:        ${DRY ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Total chips: ${PILLAR_CHIPS.length}`);
  console.log('');

  // Sanity: slug unique?
  const slugs = PILLAR_CHIPS.map((c) => c.slug);
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupSlugs.length > 0) {
    console.error(`❌ Duplicate slugs: ${dupSlugs.join(', ')}`);
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < PILLAR_CHIPS.length; i++) {
    const chip = PILLAR_CHIPS[i];
    const data = {
      label: chip.label,
      icon: chip.icon,
      answer: chip.answer,
      wikiUrl: chip.wikiUrl,
      wikiLabel: chip.wikiLabel,
      reusable: false,
      sortOrder: 4001 + i,
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
          existing.sortOrder !== data.sortOrder;
        if (!changed) {
          skipped++;
          continue;
        }
        if (DRY) console.log(`📝 ${chip.slug.padEnd(34)} ${chip.icon}  (would update)`);
        else {
          await prisma.cannedReply.update({ where: { slug: chip.slug }, data });
          console.log(`📝 ${chip.slug.padEnd(34)} ${chip.icon}  (updated)`);
        }
        updated++;
      } else {
        if (DRY) console.log(`✨ ${chip.slug.padEnd(34)} ${chip.icon}  (would create)`);
        else {
          await prisma.cannedReply.create({ data: { slug: chip.slug, ...data } });
          console.log(`✨ ${chip.slug.padEnd(34)} ${chip.icon}  (created)`);
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
  console.log(`◯ Skipped: ${skipped} (unchanged)`);
  console.log(bar);

  if (DRY) {
    console.log('\n💡 Dry run. Bỏ --dry để chạy thật.');
  } else {
    const pillarCount = await prisma.cannedReply.count({
      where: { slug: { startsWith: 'pillar-' } },
    });
    const totalCount = await prisma.cannedReply.count();
    console.log(`\n📊 Trong DB: pillar=${pillarCount}/7, TOTAL chip=${totalCount}`);
  }
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch((err) => {
    console.error('Error:', err);
    prisma.$disconnect();
    process.exit(1);
  });
