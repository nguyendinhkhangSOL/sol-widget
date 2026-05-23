#!/usr/bin/env node
/**
 * Fix Pass 3 — Sửa nested replacement do batch chạy nhiều lần.
 *   "bỏ đột ngột (bỏ đột ngột (cold turkey))" → "bỏ đột ngột (cold turkey)"
 *   "triệu chứng cai (triệu chứng cai (withdrawal))" → "triệu chứng cai (withdrawal)"
 *   "chánh niệm (chánh niệm (mindfulness))" → "chánh niệm (mindfulness)"
 *
 * Pattern: <viet> (<viet> (<eng>)) → <viet> (<eng>)
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

// (phrase Việt, phrase English gốc)
const PAIRS = [
  ['bỏ đột ngột', 'cold turkey'],
  ['triệu chứng cai', 'withdrawal'],
  ['chánh niệm', 'mindfulness'],
];

function fixFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let updated = raw;
  let totalFix = 0;

  for (const [viet, eng] of PAIRS) {
    // Match: "viet (viet (viet ... (eng)...))" — nhiều layer
    // Simpler: while có "viet (viet" → replace bằng "viet"
    // Sau đó cleanup nested "(eng)" còn lại
    let prev;
    do {
      prev = updated;
      // Pattern "viet (viet" với có thể có "(" "(" trùng → bỏ "viet (" duplicate
      const dupPattern = new RegExp(
        `${viet.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s+\\(${viet.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`,
        'gi'
      );
      const before = updated;
      updated = updated.replace(dupPattern, viet);
      if (updated !== before) totalFix++;
    } while (updated !== prev);
  }

  // Clean leftover unbalanced ")" — pattern "X (cold turkey))" → "X (cold turkey)"
  for (const [, eng] of PAIRS) {
    const cleanRegex = new RegExp(`\\(${eng}\\)\\)+`, 'gi');
    updated = updated.replace(cleanRegex, `(${eng})`);
  }

  // Pattern còn lại "X)) " do cleanup không hoàn hảo — strip extra ")"
  // Chỉ apply nếu có pattern bracket mismatch trong text
  // (Skip này — manual fix nếu cần)

  if (updated === raw) return { changed: false, fixes: 0 };

  fs.writeFileSync(filePath, updated, 'utf-8');
  return { changed: true, fixes: totalFix };
}

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.html') && !f.endsWith('.bak'))
    .map((f) => path.join(ARTICLES_DIR, f));

  console.log(`\n▶ Fix nested ${files.length} files\n`);

  let changedFiles = 0;
  for (const filePath of files) {
    const { changed, fixes } = fixFile(filePath);
    if (changed) {
      changedFiles++;
      const name = path.basename(filePath);
      console.log(`  ✓ ${name.padEnd(60)} ${fixes} fixes`);
    }
  }

  console.log(`\n  Fixed ${changedFiles} files\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
