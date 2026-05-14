// backend/src/scripts/wireChipWikiUrls.ts
//
// Script chạy 1 lần (idempotent) để wire wikiUrl + wikiLabel cho từng chip
// canned-reply trong DB. Đọc mapping từ ../seed/chipWikiUrls.ts.
//
// KHÔNG đụng đến answer/label/icon/triggers — chỉ cập nhật wikiUrl + wikiLabel.
//
// Usage:
//   npm run wire:wiki              # LIVE — cập nhật DB
//   npm run wire:wiki -- --dry     # Preview, không update
//
// Khi có wiki mới LIVE: thêm entry vào chipWikiUrls.ts → chạy lại script này.

import 'dotenv/config';
import { prisma } from '../db';
import { CHIP_WIKI_URLS } from '../seed/chipWikiUrls';

const DRY = process.argv.includes('--dry');

async function main() {
  console.log('━'.repeat(70));
  console.log('🔗 Wire chip → wikiUrl mapping');
  console.log('━'.repeat(70));
  console.log(`Mode: ${DRY ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Total chip mappings: ${Object.keys(CHIP_WIKI_URLS).length}`);
  console.log('');

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const [slug, mapping] of Object.entries(CHIP_WIKI_URLS)) {
    const existing = await prisma.cannedReply.findUnique({ where: { slug } });
    if (!existing) {
      console.warn(`⚠️  ${slug} — không có trong DB (chạy npm run seed trước)`);
      missing++;
      continue;
    }

    const newUrl = mapping.wikiUrl;
    const newLabel = mapping.wikiLabel ?? 'Đọc bài đầy đủ trên sol.vn';

    const urlChanged = existing.wikiUrl !== newUrl;
    const labelChanged = existing.wikiLabel !== newLabel;

    if (!urlChanged && !labelChanged) {
      skipped++;
      continue;
    }

    console.log(`📝 ${slug}`);
    if (urlChanged) console.log(`   wikiUrl   : ${existing.wikiUrl || '(rỗng)'} → ${newUrl}`);
    if (labelChanged) console.log(`   wikiLabel : ${existing.wikiLabel || '(rỗng)'} → ${newLabel}`);

    if (!DRY) {
      await prisma.cannedReply.update({
        where: { slug },
        data: { wikiUrl: newUrl, wikiLabel: newLabel },
      });
    }
    updated++;
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log(`✓ Updated:  ${updated}`);
  console.log(`◯ Skipped:  ${skipped} (đã đúng)`);
  if (missing > 0) console.log(`⚠️  Missing:  ${missing} (chưa seed chip)`);
  console.log('━'.repeat(70));

  if (DRY) {
    console.log('');
    console.log('💡 Dry run — không thay đổi DB. Bỏ --dry để chạy thật.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
