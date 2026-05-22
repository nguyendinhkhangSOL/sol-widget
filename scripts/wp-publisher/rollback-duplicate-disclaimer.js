#!/usr/bin/env node
/**
 * Sol — Rollback duplicate medical disclaimer
 *
 * Lý do: sol-global-footer.php đã inject Sol footer + medical disclaimer
 * vào MỌI page WP. Disclaimer em vừa add trong content body = trùng lặp.
 *
 * Script này:
 *   1. Tìm block từ '<!-- MEDICAL-DISCLAIMER-v2 -->' đến '</div>' tương ứng
 *   2. Xóa block đó khỏi file
 *   3. GIỮ author block (không trùng với footer plugin)
 *
 * Usage:
 *   node rollback-duplicate-disclaimer.js --dry-run
 *   node rollback-duplicate-disclaimer.js
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');
const DRY = process.argv.includes('--dry-run');

function removeDisclaimer(html) {
  const startMarker = '<!-- MEDICAL-DISCLAIMER-v2 -->';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return { html, removed: false };

  // Tìm closing </div> sau startMarker — cần balance div
  // Block của em là: <!-- MARKER -->\n<div class="medical-disclaimer" ...>...</div>
  // Bên trong có nested <ul>, <li>, <p>, <strong> — KHÔNG có nested div
  // → Tìm </div> đầu tiên sau startMarker là đủ.

  const afterMarker = html.slice(startIdx);
  const endRelative = afterMarker.indexOf('</div>');
  if (endRelative === -1) return { html, removed: false };

  const endIdx = startIdx + endRelative + '</div>'.length;

  // Cũng remove whitespace/newline trước startMarker và sau endIdx
  let cleanStart = startIdx;
  while (cleanStart > 0 && /\s/.test(html[cleanStart - 1])) cleanStart--;
  let cleanEnd = endIdx;
  while (cleanEnd < html.length && /\s/.test(html[cleanEnd])) cleanEnd++;

  const newHtml = html.slice(0, cleanStart) + '\n' + html.slice(cleanEnd);
  return { html: newHtml, removed: true };
}

function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.html') && !f.includes('.bak'));

  console.log(`\n▶ Rollback duplicate disclaimer in ${files.length} files`);
  console.log(`  Mode: ${DRY ? 'DRY RUN' : 'WRITE'}`);
  console.log('');

  const stats = { removed: 0, notFound: 0, error: 0 };

  for (const f of files) {
    const fp = path.join(ARTICLES_DIR, f);
    try {
      const original = fs.readFileSync(fp, 'utf-8');
      const r = removeDisclaimer(original);

      if (!r.removed) {
        stats.notFound++;
        continue;
      }

      if (DRY) {
        console.log(`  📋 ${f.padEnd(60).slice(0, 60)} — would REMOVE disclaimer`);
      } else {
        fs.writeFileSync(fp, r.html, 'utf-8');
        console.log(`  ✓ ${f.padEnd(60).slice(0, 60)} — removed`);
      }
      stats.removed++;
    } catch (e) {
      stats.error++;
      console.log(`  ✗ ${f.padEnd(60).slice(0, 60)} — ${e.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  Removed: ${stats.removed}`);
  console.log(`  Not found (no disclaimer to remove): ${stats.notFound}`);
  console.log(`  Error: ${stats.error}`);

  if (!DRY && stats.removed > 0) {
    console.log(`\n  Next: re-publish lên WP:`);
    console.log(`    node bulk-republish-wikis.js`);
  }
}

main();
