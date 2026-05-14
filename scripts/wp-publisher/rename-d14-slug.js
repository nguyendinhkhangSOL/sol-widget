#!/usr/bin/env node
/**
 * Sol v4 — Đổi slug D14 cho consistent pattern ngay-N-...
 *
 * #605: moc-2-tuan-tuan-hoan-cai-thien-phoi-manh-hon → ngay-14-moc-2-tuan-bo-thuoc
 *
 * Usage:
 *   node rename-d14-slug.js --dry-run
 *   node rename-d14-slug.js
 */

const { api } = require('./_lib');

const dryRun = process.argv.includes('--dry-run');

const RENAME = {
  id: 605,
  oldSlug: 'moc-2-tuan-tuan-hoan-cai-thien-phoi-manh-hon',
  newSlug: 'ngay-14-moc-2-tuan-bo-thuoc',
};

async function main() {
  console.log(`▶ Rename D14 slug${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');
  console.log(`#${RENAME.id}`);
  console.log(`  OLD: /${RENAME.oldSlug}/`);
  console.log(`  NEW: /${RENAME.newSlug}/`);
  console.log('');

  if (!dryRun) {
    try {
      const result = await api.post(`/wp-json/wp/v2/posts/${RENAME.id}`, { slug: RENAME.newSlug });
      console.log(`  ✓ Updated`);
      console.log(`  Link: ${result.link}`);
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}`);
      if (e.body) console.log(`    ${JSON.stringify(e.body).slice(0, 300)}`);
      process.exit(1);
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log('Đã thêm sẵn vào sol-redirects.php (em đã update — anh re-upload lên VPS):');
  console.log('');
  console.log(`    '/${RENAME.oldSlug}/' => '/${RENAME.newSlug}/',`);
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
