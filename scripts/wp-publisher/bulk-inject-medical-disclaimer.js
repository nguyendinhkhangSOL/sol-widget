#!/usr/bin/env node
/**
 * Sol — Bulk inject medical disclaimer + author block cho 143 bài health-related
 *
 * Mục đích: YMYL compliance sau Google FAQ deprecation 2026-05-07.
 * Sol.vn là health-focused → cần signals authority mạnh.
 *
 * Inject 2 thứ vào mỗi bài:
 *   1. Author block (đầu bài, sau H1) — Khang Sol credentials
 *   2. Medical disclaimer (cuối bài, trước references) — không thay BS
 *
 * Skip nếu bài đã có marker '<!-- MEDICAL-DISCLAIMER -->' hoặc '<!-- AUTHOR-BLOCK -->'.
 *
 * Usage:
 *   node bulk-inject-medical-disclaimer.js --dry-run        # preview
 *   node bulk-inject-medical-disclaimer.js                  # inject thật
 *   node bulk-inject-medical-disclaimer.js --only=PILLAR-vape  # 1 file
 *   node bulk-inject-medical-disclaimer.js --pattern=CHIP   # chỉ CHIP-*.html
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');
const DRY = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const patternArg = process.argv.find((a) => a.startsWith('--pattern='));

// ─── Templates ──────────────────────────────────────────────────────

const AUTHOR_BLOCK = `<!-- AUTHOR-BLOCK -->
<div class="author-meta" style="font-size: 14px; color: #5A5650; margin: 16px 0 24px 0; padding: 12px 16px; background: #FBF7F0; border-left: 4px solid #B25C2C; border-radius: 4px;">
  👤 <strong><a href="https://sol.vn/khang-sol/" style="color: #B25C2C; text-decoration: none;">Khang Sol</a></strong> · Kỹ sư IT · Đã sạch thuốc lá từ 22/12/2020 (5+ năm) · Founder <a href="https://sol.vn">sol.vn</a><br>
  <span style="font-size: 13px; color: #8A857C;">
    Khang viết từ trải nghiệm cá nhân 30 năm hút thuốc + 5 năm Tự do. KHÔNG phải bác sĩ — bài viết chỉ chia sẻ trải nghiệm và kiến thức tổng hợp.
  </span>
</div>`;

const MEDICAL_DISCLAIMER = `<!-- MEDICAL-DISCLAIMER -->
<div class="medical-disclaimer" style="background: #F5DDD9; border: 1px solid #C62828; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 14px; color: #5A5650;">
  <strong style="color: #C62828;">⚕️ Lưu ý y khoa quan trọng</strong>
  <p style="margin: 8px 0 0 0; line-height: 1.6;">
    Bài viết này chia sẻ trải nghiệm cá nhân và tổng hợp kiến thức công khai về cai thuốc lá.
    <strong>KHÔNG thay thế tư vấn y khoa chuyên nghiệp.</strong>
  </p>
  <ul style="margin: 8px 0 0 0; padding-left: 20px;">
    <li>Mọi quyết định dùng <strong>thuốc kê (Champix, Bupropion, NRT liều cao)</strong> phải tham khảo bác sĩ.</li>
    <li>Nếu anh có bệnh nền (tim mạch, hô hấp, tâm thần) — gặp BS trước khi cai.</li>
    <li>Triệu chứng nặng (đau ngực, khó thở dữ dội, ho ra máu) → đi cấp cứu ngay, gọi <strong>115</strong>.</li>
    <li>Hỗ trợ cai thuốc miễn phí qua Đường dây nóng Tư vấn Cai Thuốc Lá Bộ Y tế: <strong>1800 6606</strong>.</li>
  </ul>
  <p style="margin: 8px 0 0 0; font-size: 13px; color: #8A857C;">
    Sol cung cấp thông tin tham khảo và công cụ tự đánh giá (Test FTND chuẩn quốc tế).
    Sol KHÔNG bán thuốc, KHÔNG kê đơn, KHÔNG thay phòng khám.
  </p>
</div>`;

// ─── Inject logic ───────────────────────────────────────────────────

function injectAuthorBlock(html) {
  if (html.includes('<!-- AUTHOR-BLOCK -->')) return { html, skipped: 'already-has-author' };
  // Insert sau </h1> đầu tiên
  const h1Match = html.match(/<\/h1>/);
  if (!h1Match) return { html, skipped: 'no-h1' };
  const idx = h1Match.index + h1Match[0].length;
  const newHtml = html.slice(0, idx) + '\n\n' + AUTHOR_BLOCK + '\n' + html.slice(idx);
  return { html: newHtml, injected: 'author' };
}

function injectDisclaimer(html) {
  if (html.includes('<!-- MEDICAL-DISCLAIMER -->')) return { html, skipped: 'already-has-disclaimer' };

  // Insert trước <div class="references"> nếu có
  const refMatch = html.match(/<div class="references"/);
  if (refMatch) {
    const idx = refMatch.index;
    const newHtml = html.slice(0, idx) + MEDICAL_DISCLAIMER + '\n\n' + html.slice(idx);
    return { html: newHtml, injected: 'disclaimer-before-references' };
  }

  // Else: insert trước </body> hoặc cuối file
  const bodyMatch = html.match(/<\/body>/);
  if (bodyMatch) {
    const idx = bodyMatch.index;
    const newHtml = html.slice(0, idx) + MEDICAL_DISCLAIMER + '\n\n' + html.slice(idx);
    return { html: newHtml, injected: 'disclaimer-before-body' };
  }

  // Else: append cuối file
  return { html: html + '\n\n' + MEDICAL_DISCLAIMER + '\n', injected: 'disclaimer-appended' };
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf-8');

  const r1 = injectAuthorBlock(original);
  const r2 = injectDisclaimer(r1.html);

  return {
    file: path.basename(filePath),
    original,
    final: r2.html,
    changed: original !== r2.html,
    author: r1.injected || r1.skipped,
    disclaimer: r2.injected || r2.skipped,
  };
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  // Filter pattern
  let files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.html') && !f.includes('.bak'));

  if (patternArg) {
    const pattern = patternArg.slice(10);
    files = files.filter((f) => f.includes(pattern));
  }

  if (onlyArg) {
    const only = onlyArg.slice(7);
    files = files.filter((f) => f.includes(only));
  }

  console.log(`\n▶ Bulk inject medical disclaimer + author block`);
  console.log(`  Files: ${files.length}`);
  console.log(`  Mode: ${DRY ? 'DRY RUN' : 'WRITE'}`);
  console.log('');

  const stats = { changed: 0, alreadyDone: 0, partial: 0, error: 0 };

  for (const f of files) {
    const fp = path.join(ARTICLES_DIR, f);
    try {
      const r = processFile(fp);

      if (!r.changed) {
        stats.alreadyDone++;
        // console.log(`  ⊘ ${f.padEnd(60)} — already has both`);
        continue;
      }

      const authorStatus = r.author === 'author' ? '+author' : `(${r.author})`;
      const discStatus = r.disclaimer.startsWith('disclaimer') ? '+disclaimer' : `(${r.disclaimer})`;

      if (DRY) {
        console.log(`  📋 ${f.padEnd(60)} — ${authorStatus} ${discStatus}`);
      } else {
        fs.writeFileSync(fp, r.final, 'utf-8');
        console.log(`  ✓ ${f.padEnd(60)} — ${authorStatus} ${discStatus}`);
      }
      stats.changed++;
    } catch (e) {
      stats.error++;
      console.log(`  ✗ ${f.padEnd(60)} — ${e.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  Changed: ${stats.changed}`);
  console.log(`  Already done: ${stats.alreadyDone}`);
  console.log(`  Error: ${stats.error}`);

  if (DRY && stats.changed > 0) {
    console.log(`\n  Run without --dry-run to apply changes.`);
  }

  if (!DRY && stats.changed > 0) {
    console.log(`\n  Next steps:`);
    console.log(`    1. Verify 1-2 files trông OK: cat wiki-skeletons/wiki-articles/PILLAR-*.html | grep -A 5 AUTHOR-BLOCK`);
    console.log(`    2. Commit + push file changes`);
    console.log(`    3. Re-publish bulk lên WordPress: node bulk-update.js (hoặc tay từng bài)`);
  }
}

main();
