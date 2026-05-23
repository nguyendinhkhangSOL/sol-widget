#!/usr/bin/env node
/**
 * Dedupe Pass 2 — Sau khi batch replace, một số phrase "Việt (Anh)" lặp lại
 * 3-5 lần trong cùng bài → đọc xấu.
 *
 * Quy tắc: Trong cùng 1 file, phrase "X (Y)" xuất hiện lần đầu giữ ngoặc,
 * các lần sau chỉ giữ "X" (bỏ "(Y)").
 *
 * Apply trên tất cả file đã batch.
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

// Phrases cần dedupe — sau lần đầu xuất hiện trong cùng file
const DEDUPE_PHRASES = [
  { full: 'bỏ đột ngột (cold turkey)', short: 'bỏ đột ngột' },
  { full: 'triệu chứng cai (withdrawal)', short: 'triệu chứng cai' },
  { full: 'chánh niệm (mindfulness)', short: 'chánh niệm' },
];

function dedupeFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let updated = raw;
  const stats = {};

  for (const { full, short } of DEDUPE_PHRASES) {
    const fullRegex = new RegExp(full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = updated.match(fullRegex);
    if (!matches || matches.length <= 1) continue;

    let firstFound = false;
    updated = updated.replace(fullRegex, (m) => {
      if (!firstFound) {
        firstFound = true;
        return m; // giữ lần đầu nguyên gốc
      }
      return short; // các lần sau dùng short
    });

    stats[full] = `${matches.length} → 1+${matches.length - 1}`;
  }

  if (updated === raw) return { changed: false, stats };

  fs.writeFileSync(filePath, updated, 'utf-8');
  return { changed: true, stats };
}

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.html') && !f.endsWith('.bak'))
    .map((f) => path.join(ARTICLES_DIR, f));

  console.log(`\n▶ Dedupe ${files.length} files\n`);

  let changedFiles = 0;
  for (const filePath of files) {
    const { changed, stats } = dedupeFile(filePath);
    if (changed) {
      changedFiles++;
      const name = path.basename(filePath);
      const statsStr = Object.entries(stats).map(([k, v]) => `"${k.split(' ')[0]}"=${v}`).join(', ');
      console.log(`  ✓ ${name.padEnd(60)} ${statsStr}`);
    }
  }

  console.log(`\n  Dedupe ${changedFiles} files\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
