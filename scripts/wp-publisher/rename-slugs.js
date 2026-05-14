#!/usr/bin/env node
/**
 * Sol v4 — Đổi slug bài bị URL-encoded (emoji) sang slug sạch + add redirect
 *
 * Sau khi đổi:
 *   1. Update slug trong WP
 *   2. In ra entry redirect để paste vào sol-redirects.php
 *
 * Usage:
 *   node rename-slugs.js --dry-run    # preview
 *   node rename-slugs.js              # apply
 */

const { api } = require('./_lib');

const dryRun = process.argv.includes('--dry-run');

// Map: post_id → { oldSlugEncoded, newSlug, oldSlugForRedirect }
const RENAMES = [
  {
    id: 538,
    oldSlugForRedirect: '%f0%9f%8c%b1-ngay-4-7-sau-khi-bo-thuoc-giai-doan-hoi-phuc-ban-dau-va-bay-chu-quan',
    newSlug: 'ngay-4-7-bo-thuoc-hoi-phuc-ban-dau',
    note: 'Bài có emoji 🌱 trong slug URL-encoded',
  },
  {
    id: 540,
    oldSlugForRedirect: '%f0%9f%a7%a0-tuan-2-sau-khi-bo-thuoc-nao-bat-dau-tai-can-bang-va-cam-giac-trong-rong',
    newSlug: 'tuan-2-bo-thuoc-nao-tai-can-bang',
    note: 'Bài có emoji 🧠 trong slug URL-encoded',
  },
];

async function main() {
  console.log(`▶ Rename slugs${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  const redirects = [];
  for (const r of RENAMES) {
    console.log(`#${r.id} — ${r.note}`);
    console.log(`  OLD: ${r.oldSlugForRedirect}`);
    console.log(`  NEW: ${r.newSlug}`);

    if (!dryRun) {
      try {
        const result = await api.post(`/wp-json/wp/v2/posts/${r.id}`, { slug: r.newSlug });
        console.log(`  ✓ Slug updated → ${result.link}`);
        redirects.push({ old: `/${r.oldSlugForRedirect}/`, new: `/${r.newSlug}/` });
      } catch (e) {
        console.log(`  ✗ FAIL: ${e.message}`);
        if (e.body) console.log(`    ${JSON.stringify(e.body).slice(0, 250)}`);
      }
    } else {
      redirects.push({ old: `/${r.oldSlugForRedirect}/`, new: `/${r.newSlug}/` });
    }
    console.log('');
  }

  console.log('━'.repeat(70));
  console.log('Thêm 2 entry này vào sol-redirects.php (sau line cuối $SOL_REDIRECTS):');
  console.log('');
  redirects.forEach((r) => {
    console.log(`    '${r.old}' => '${r.new}',`);
  });
  console.log('');
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
