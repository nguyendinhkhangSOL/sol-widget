#!/usr/bin/env node
/**
 * Remove "Chip tóm tắt (Zalo push + App)" box khỏi tất cả wiki articles.
 *
 * Box này chỉ dành cho Zalo push + in-app card — không nên hiển thị trên web.
 *
 * Pattern remove: <div class="chip-summary">...</div>
 *
 * Backup: .bak2 file before edit (giữ riêng từ .bak Việt hoá).
 *
 * Usage:
 *   node remove-chip-summary.js --dry-run
 *   node remove-chip-summary.js
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

function removeChipBox(html) {
  // Pattern: <div class="chip-summary"> ... </div>
  // Need to handle nested </div> — chip-summary có structure đơn giản, không nested div
  // Use non-greedy multiline match
  const pattern = /\s*<div class="chip-summary">[\s\S]*?<\/div>\s*/g;
  const matches = html.match(pattern);
  if (!matches) return { html, removed: 0 };

  const cleaned = html.replace(pattern, '\n\n');
  return { html: cleaned, removed: matches.length };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.html') && !f.endsWith('.bak') && !f.endsWith('.bak2'))
    .map((f) => path.join(ARTICLES_DIR, f));

  console.log(`\n▶ Scan ${files.length} files for chip-summary box${dryRun ? ' (DRY RUN)' : ''}\n`);

  let totalFiles = 0;
  let totalRemoved = 0;
  const affected = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { html: cleaned, removed } = removeChipBox(raw);

    if (removed === 0) continue;
    totalFiles++;
    totalRemoved += removed;
    affected.push({ name: path.basename(filePath), count: removed });

    if (dryRun) continue;

    // Backup to .bak2
    const bakPath = filePath + '.bak2';
    if (!fs.existsSync(bakPath)) fs.writeFileSync(bakPath, raw, 'utf-8');
    fs.writeFileSync(filePath, cleaned, 'utf-8');
  }

  console.log('━'.repeat(70));
  console.log(`  Files affected: ${totalFiles}  |  Total boxes removed: ${totalRemoved}`);
  console.log('━'.repeat(70));
  for (const a of affected) {
    console.log(`  ${dryRun ? '◯' : '✓'} ${a.name.padEnd(58)} ${a.count} box`);
  }

  if (dryRun) {
    console.log('\n  → DRY RUN — không có file nào bị sửa. Run lại không có --dry-run để apply.');
  } else {
    console.log('\n  → Backups saved as *.bak2. Run publish chain để re-publish bài đã sửa.');
  }
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
