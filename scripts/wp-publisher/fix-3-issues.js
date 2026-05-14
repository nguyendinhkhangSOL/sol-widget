#!/usr/bin/env node
/**
 * Sol v4 — Fix 3 bài còn vấn đề trong category wiki-bo-thuoc-la
 *
 * 1. #598 — Tầm nhìn Sol — add focus keyword, đặt slug đẹp
 * 2. #1095 — phuong-phap — rút gọn SEO title từ 62c → ≤60c
 * 3. #768 — thu-ngo-sol — expand SEO desc từ 63c → 130-150c
 *
 * Usage:
 *   node fix-3-issues.js --dry-run    # preview
 *   node fix-3-issues.js              # apply
 */

const { api } = require('./_lib');

const dryRun = process.argv.includes('--dry-run');

const FIXES = [
  {
    id: 598,
    desc: 'Tầm nhìn Sol — add focus keyword + slug + tạm dùng homepage làm featured',
    payload: {
      slug: 'tam-nhin-sol-mien-tru-trach-nhiem',
      meta: {
        rank_math_focus_keyword: 'sol bỏ thuốc lá',
      },
    },
  },
  {
    id: 1095,
    desc: 'phuong-phap — rút gọn SEO title',
    payload: {
      meta: {
        rank_math_title: '5 Phương Pháp Cai Thuốc Lá — So Sánh 2026',
      },
    },
  },
  {
    id: 768,
    desc: 'thu-ngo-sol — expand SEO desc',
    payload: {
      meta: {
        rank_math_description:
          'Thư ngỏ từ Khang Sol gửi anh em cùng nỗi niềm với điếu thuốc — hành trình 72 giờ hồi sinh thân, tâm, trí. Đọc câu chuyện thật.',
        rank_math_focus_keyword: 'sol tái sinh 72 giờ cai thuốc',
      },
    },
  },
];

async function main() {
  console.log(`▶ Fix 3 bài còn vấn đề${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  for (const fix of FIXES) {
    console.log(`#${fix.id} — ${fix.desc}`);
    console.log(`  Payload:`, JSON.stringify(fix.payload, null, 2).split('\n').map((l) => '    ' + l).join('\n'));

    if (!dryRun) {
      try {
        const r = await api.post(`/wp-json/wp/v2/posts/${fix.id}`, fix.payload);
        console.log(`  ✓ Updated: ${r.link}`);
      } catch (e) {
        console.log(`  ✗ ${e.message}`);
        if (e.body) console.log(`    ${JSON.stringify(e.body).slice(0, 300)}`);
      }
    }
    console.log('');
  }

  if (dryRun) console.log('Bỏ --dry-run để apply.');
}

main().catch((e) => { console.error(e); process.exit(1); });
