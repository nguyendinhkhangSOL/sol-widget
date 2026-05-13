#!/usr/bin/env node
/**
 * Sol v4 — Bulk update nhiều Page từ mapping slug → HTML file
 *
 * Usage:
 *   node bulk-update.js                    → chạy theo mapping ở trên
 *   node bulk-update.js --dry-run          → chỉ in plan, không thực sự update
 *   node bulk-update.js --only=gia,pilot   → chỉ update các slug cụ thể
 *
 * Mapping ở dưới — em update khi cần.
 */

const fs = require('fs');
const path = require('path');
const { api } = require('./_lib');

// ─── Mapping slug → file HTML (relative to project root) ──────────────
const LANDING_ROOT = path.resolve(__dirname, '../../wiki-skeletons/landing-html');

const MAPPING = [
  // Tên hiển thị (cho log)   | WP slug                    | HTML file
  ['Homepage',                  'home-v3',                   '05-sol-homepage-LEAN-v3.html'],
  ['Trang Giá',                 'gia',                       'GIA-pricing-page-v3.html'],
  ['Câu chuyện Khang',          'khang-sol',                 'KHANG-SOL-page-v3.html'],
  ['Sol là gì',                 'sol-la-gi',                 'SOL-LA-GI-page-v3.html'],
  ['Câu hỏi (FAQ)',             'cau-hoi',                   'CAU-HOI-page-v3.html'],
  ['Pilot 30 anh em',           'pilot',                     'PILOT-page-v3.html'],
  ['5 phương pháp',             'phuong-phap-cai-thuoc-la',  'PHUONG-PHAP-page-v1.html'],
  ['Hub Bỏ thuốc lá',           'bo-thuoc-la',               'BO-THUOC-LA-HUB-page-v3.html'],
];

async function findBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,title`);
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[0];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? MAPPING.filter((m) => onlyList.includes(m[1])) : MAPPING;

  console.log(`▶ Bulk update ${tasks.length} page${dryRun ? ' (DRY RUN)' : ''}…`);
  console.log('');

  const results = [];
  for (const [name, slug, file] of tasks) {
    const fullPath = path.join(LANDING_ROOT, file);

    if (!fs.existsSync(fullPath)) {
      console.log(`✗ ${name.padEnd(28)} | slug=${slug.padEnd(28)} | FILE NOT FOUND: ${file}`);
      results.push({ slug, status: 'file-not-found' });
      continue;
    }

    let page;
    try {
      page = await findBySlug(slug);
    } catch (e) {
      console.log(`✗ ${name.padEnd(28)} | slug=${slug.padEnd(28)} | API ERROR: ${e.message}`);
      results.push({ slug, status: 'api-error' });
      continue;
    }

    if (!page) {
      console.log(`⚠ ${name.padEnd(28)} | slug=${slug.padEnd(28)} | PAGE NOT FOUND on WP — cần tạo mới`);
      results.push({ slug, status: 'not-found' });
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log(`▶ ${name.padEnd(28)} | slug=${slug.padEnd(28)} | id=${page.id} | file=${file} (${content.length} bytes)`);

    if (dryRun) {
      results.push({ slug, status: 'would-update', id: page.id });
      continue;
    }

    try {
      const updated = await api.post(`/wp-json/wp/v2/pages/${page.id}`, { content });
      console.log(`  ✓ DONE — ${updated.link}`);
      results.push({ slug, status: 'updated', id: page.id, link: updated.link });
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}`);
      if (e.body) console.log(`    ${JSON.stringify(e.body)}`);
      results.push({ slug, status: 'fail', id: page.id, error: e.message });
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Tổng kết:`);
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  if (counts['not-found']) {
    console.log('');
    console.log('💡 Page slug không có trên WP → có thể slug thực tế khác. Chạy:');
    console.log('   node list-pages.js');
    console.log('   → tìm slug đúng → update MAPPING trong file này.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
