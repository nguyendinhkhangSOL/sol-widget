#!/usr/bin/env node
/**
 * Sol v4 — Cleanup 6 bài duplicate trong Q-Day series
 *
 * Trash + chuẩn bị redirect cho 6 bài cũ bị thay thế bởi Day 1-30 series mới:
 *   #533 24h-dau-bo-thuoc           → /ngay-1-24-gio-dau-tien-bo-thuoc-la/
 *   #536 ngay-2-3-bo-thuoc          → /ngay-2-dinh-con-them-nicotine/
 *   #538 ngay-4-7-bo-thuoc-hoi-phuc → /ngay-4-mat-ngu-va-roi-loan-giac-ngu-giai-thich-khoa-hoc/ (Day 4 đại diện)
 *   #540 tuan-2-bo-thuoc-nao-tai-can-bang → /moc-2-tuan-tuan-hoan-cai-thien-phoi-manh-hon/ (Day 14)
 *   #542 tuan-3-4-sau-khi-bo-thuoc  → /ngay-21-moc-3-tuan-bo-thuoc-vong-lap-thoi-quen-da-vung-chua/
 *   #547 sau-30-ngay-bo-thuoc       → /ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-nguoi-khac/
 *
 * Backup content trước khi trash. KHÔNG xóa permanent.
 *
 * Usage:
 *   node cleanup-qday-duplicates.js --dry-run    # preview
 *   node cleanup-qday-duplicates.js              # trash thật + in redirect lines
 */

const fs = require('fs');
const path = require('path');
const { api } = require('./_lib');

const dryRun = process.argv.includes('--dry-run');

const DUPLICATES = [
  { id: 533, oldSlug: '24h-dau-bo-thuoc', newPath: '/ngay-1-24-gio-dau-tien-bo-thuoc-la/' },
  { id: 536, oldSlug: 'ngay-2-3-bo-thuoc', newPath: '/ngay-2-dinh-con-them-nicotine/' },
  { id: 538, oldSlug: 'ngay-4-7-bo-thuoc-hoi-phuc-ban-dau', newPath: '/ngay-4-mat-ngu-va-roi-loan-giac-ngu-giai-thich-khoa-hoc/' },
  { id: 540, oldSlug: 'tuan-2-bo-thuoc-nao-tai-can-bang', newPath: '/moc-2-tuan-tuan-hoan-cai-thien-phoi-manh-hon/' },
  { id: 542, oldSlug: 'tuan-3-4-sau-khi-bo-thuoc', newPath: '/ngay-21-moc-3-tuan-bo-thuoc-vong-lap-thoi-quen-da-vung-chua/' },
  { id: 547, oldSlug: 'sau-30-ngay-bo-thuoc', newPath: '/ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-nguoi-khac/' },
];

const BACKUP_DIR = path.join(__dirname, 'backups', 'qday-duplicates');

async function main() {
  console.log(`▶ Cleanup 6 Q-Day duplicates${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  if (!dryRun && !fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const redirectLines = [];
  for (const dup of DUPLICATES) {
    console.log(`#${dup.id} ${dup.oldSlug}`);
    console.log(`  → Redirect to: ${dup.newPath}`);

    if (!dryRun) {
      // 1. Backup content
      try {
        const post = await api.get(`/wp-json/wp/v2/posts/${dup.id}?context=edit`);
        const ts = new Date().toISOString().slice(0, 10);
        const fp = path.join(BACKUP_DIR, `${dup.oldSlug}-${dup.id}-${ts}.html`);
        fs.writeFileSync(fp, post.content?.raw || '');
        const metaFp = path.join(BACKUP_DIR, `${dup.oldSlug}-${dup.id}-${ts}.json`);
        fs.writeFileSync(metaFp, JSON.stringify({
          id: post.id, slug: post.slug, title: post.title?.raw,
          status: post.status, modified: post.modified, meta: post.meta,
        }, null, 2));
        console.log(`  ✓ Backed up to ${path.basename(fp)}`);

        // 2. Move to DRAFT (REST DELETE returns 410 on this WP — trash disabled).
        //    Status=draft hides post from public, URL returns 404 → sol-redirects.php catches.
        await api.post(`/wp-json/wp/v2/posts/${dup.id}`, { status: 'draft' });
        console.log(`  ✓ Moved to draft (out of publish)`);
      } catch (e) {
        console.log(`  ✗ FAIL: ${e.message}`);
        // Vẫn push redirect line — vì sol-redirects.php sẽ catch URL khi user click
      }
    }
    redirectLines.push(`    '/${dup.oldSlug}/' => '${dup.newPath}',`);
    console.log('');
  }

  console.log('━'.repeat(70));
  console.log('Thêm 6 entry này vào sol-redirects.php (sau line cuối $SOL_REDIRECTS):');
  console.log('');
  console.log('    // 6 Q-Day duplicates trash (task #118)');
  redirectLines.forEach((l) => console.log(l));
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
