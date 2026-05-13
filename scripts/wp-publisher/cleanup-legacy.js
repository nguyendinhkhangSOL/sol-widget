#!/usr/bin/env node
/**
 * Sol v4 — Cleanup Pages legacy
 *
 * Backup content + move to trash các Page Sol v1/v2 cũ.
 * KHÔNG xoá permanent — vẫn restore được trong 30 ngày từ WP Admin.
 *
 * Usage:
 *   node cleanup-legacy.js --dry-run    → in plan, không xoá
 *   node cleanup-legacy.js              → backup + trash thật
 *
 * Mapping ở dưới — em update khi cần.
 */

const fs = require('fs');
const path = require('path');
const { api } = require('./_lib');

// ─── Pages legacy cần dọn (từ list-pages output) ────────────────────
const LEGACY_PAGES = [
  // ID,   slug,                             reason
  [958,    'sol-home',                       'Homepage Sol cũ — duplicate với home-v3 (1043)'],
  [946,    '88-ngay',                        'Sol v1 — 88 ngày (Sol v4 đã đổi 35/52/65)'],
  [944,    'q-day',                          'Sol v1 — Q-Day standalone (giờ là chặng trong lộ trình)'],
  [942,    '14-ngay',                        'Sol v1 — 14 ngày standalone'],
  [940,    '7-ngay',                         'Sol v1 — 7 ngày standalone'],
  [440,    'sol-song-lai-lam-lai-tot-hon',   'Brand cũ trước khi pivot cai thuốc'],

  // Drafts (no title) — chỉ xoá nếu Khang confirm
  [923,    '(draft)',                        'Draft no title — 2026-05-07'],
  [419,    '(draft)',                        'Draft no title — 2026-03-23'],
  [196,    '(draft)',                        'Draft "Tôi đã từng mất hết" — 2025-05-31'],
  [195,    'chuyen-cua-nguoi-sang-lap',      'Draft "Chuyện của người sáng lập" — 2026-05-12'],
  [3,      'privacy-policy',                 'Draft Privacy Policy cũ — duplicate với /chinh-sach-bao-mat (1004)'],
];

// Các page MUỐN GIỮ NGUYÊN cho SEO juice (legacy nhưng có backlink) — em note để Khang biết:
const KEEP_FOR_SEO = [
  // [349, 'gui-thu-cho-sol',               'Trang submit câu chuyện — có thể vẫn dùng'],
  // [325, 'khang-nguyen-tai-sinh-tuoi-50', 'Founder story cũ — có traffic'],
  // [206, 'gioi-thieu-sol-vi-sao-blog-nay-duoc-viet', 'About cũ'],
  // [2,   'sol-gioi-thieu-thuong-hieu-va-su-menh', 'Brand intro cũ'],
];

const BACKUP_DIR = path.join(__dirname, 'backups', 'legacy-cleanup');

async function backupPage(id) {
  const page = await api.get(`/wp-json/wp/v2/pages/${id}?context=edit`);
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const slug = page.slug || `id-${id}`;
  const ts = new Date().toISOString().slice(0, 10);
  const htmlFile = path.join(BACKUP_DIR, `${slug}-${id}-${ts}.html`);
  const metaFile = path.join(BACKUP_DIR, `${slug}-${id}-${ts}.meta.json`);
  fs.writeFileSync(htmlFile, page.content?.raw || '');
  fs.writeFileSync(metaFile, JSON.stringify({
    id: page.id,
    slug: page.slug,
    title: page.title?.raw,
    status: page.status,
    modified: page.modified,
    meta: page.meta,
    link: page.link,
  }, null, 2));
  return { htmlFile, metaFile, slug: page.slug, title: page.title?.raw };
}

async function trashPage(id) {
  // WP REST: DELETE không có force=true → move to trash (restore được)
  // Nếu thêm ?force=true → xoá permanent (skip — không an toàn)
  return api.delete(`/wp-json/wp/v2/pages/${id}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`▶ Cleanup ${LEGACY_PAGES.length} legacy pages${dryRun ? ' (DRY RUN)' : ''}…`);
  console.log('');

  const results = [];
  for (const [id, slug, reason] of LEGACY_PAGES) {
    console.log(`▶ #${id} ${slug.padEnd(38)} | ${reason}`);

    if (dryRun) {
      console.log(`  (dry-run) sẽ backup + trash`);
      results.push({ id, slug, status: 'would-trash' });
      continue;
    }

    try {
      // Skip backup nếu đã có file backup hôm nay
      const ts = new Date().toISOString().slice(0, 10);
      const existing = fs.existsSync(BACKUP_DIR)
        ? fs.readdirSync(BACKUP_DIR).filter((f) => f.includes(`-${id}-${ts}.html`))
        : [];

      let title;
      if (existing.length > 0) {
        console.log(`  ⊙ Skip backup — đã có ${existing[0]}`);
        title = '(backup existing)';
      } else {
        const bkp = await backupPage(id);
        console.log(`  ✓ Backup: ${path.relative(__dirname, bkp.htmlFile)}`);
        console.log(`    Title: ${bkp.title}`);
        title = bkp.title;
      }

      const trashed = await trashPage(id);
      const newStatus = trashed?.previous?.status ? `was ${trashed.previous.status} → trash` : 'trashed';
      console.log(`  ✓ Moved to trash (${newStatus})`);
      results.push({ id, slug, status: 'trashed', title });
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}`);
      if (e.body) console.log(`    ${JSON.stringify(e.body)}`);
      results.push({ id, slug, status: 'fail', error: e.message });
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Tổng kết:');
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('');
  console.log('💡 Page trash trong 30 ngày sẽ tự xoá permanent (WP default).');
  console.log('   Để khôi phục: WP Admin → Trang → Thùng rác → Khôi phục.');
  console.log('');
  console.log('📋 Tiếp theo — tạo 301 redirect trong Rank Math:');
  console.log('   WP Admin → Rank Math → Redirections → Add New');
  console.log('   ┌─ Source URL ──────────────────────────┬─ Destination ──────────────────┐');
  console.log('   │ /sol-home                              │ /                              │');
  console.log('   │ /88-ngay                               │ /sol-la-gi                     │');
  console.log('   │ /q-day                                 │ /sol-la-gi                     │');
  console.log('   │ /14-ngay                               │ /sol-la-gi                     │');
  console.log('   │ /7-ngay                                │ /sol-la-gi                     │');
  console.log('   │ /sol-song-lai-lam-lai-tot-hon          │ /                              │');
  console.log('   └────────────────────────────────────────┴────────────────────────────────┘');
}

main().catch((e) => { console.error(e); process.exit(1); });
