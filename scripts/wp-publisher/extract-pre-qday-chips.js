// scripts/wp-publisher/extract-pre-qday-chips.js
//
// PHASE 4 (Pre-Q-Day) — Extract chip-summary từ LAMQUEN-*.html + GIAMDAN-*.html
//
// 7 ngày Làm quen + 14 ngày Giảm dần — tổng 21 bài (khi đủ).
// Output: pre-qday-chips.json
//
// Parser logic giống extract-chip-summaries.js cho Q-Day, với:
//   - File pattern: LAMQUEN-NN-*.html | GIAMDAN-NN-*.html
//   - Slug DB: lam-quen-N | giam-dan-N (N = số ngày)
//   - wikiUrl: https://sol.vn/<full-slug>/?utm_source=zalo&utm_campaign=<phase>-N
//
// Usage:
//   cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
//   node extract-pre-qday-chips.js

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');
const OUTPUT_FILE = path.resolve(__dirname, 'pre-qday-chips.json');
const WIKI_BASE = 'https://sol.vn';

// File pattern: LAMQUEN-NN-<slug-tail>.html | GIAMDAN-NN-<slug-tail>.html
// Slug WP đầy đủ: <phase>-ngay-<N>-<tail>
//   phase: 'lam-quen' | 'giam-dan'
function parseFilename(file) {
  const m = file.match(/^(LAMQUEN|GIAMDAN)-(\d{2})-(.+)\.html$/);
  if (!m) return null;
  const phase = m[1] === 'LAMQUEN' ? 'lam-quen' : 'giam-dan';
  const dayNumber = parseInt(m[2], 10);
  const tail = m[3];
  return { phase, dayNumber, tail, wpSlug: `${phase}-ngay-${dayNumber}-${tail}` };
}

function extractChipSummaryBlock(html) {
  const re = /<div class="chip-summary">([\s\S]*?)<\/div>\s*(?=<div class="disclaimer")/;
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function parseChip(block, dayNumber, phase) {
  let working = block;

  // 1. Strip chip-label header
  working = working.replace(/<div class="chip-label">[\s\S]*?<\/div>\s*/g, '').trim();

  // 2. Match emoji + <strong>Title</strong>
  const labelRe = /^\s*([^\s<]+)\s*<strong>([^<]+)<\/strong>\s*(?:<br\s*\/?>\s*)+/i;
  const labelMatch = working.match(labelRe);
  let icon = '📱';
  let label = (phase === 'lam-quen' ? 'Ngày ' : 'Giảm dần Ngày ') + dayNumber;
  let bodyStart = working;
  if (labelMatch) {
    icon = labelMatch[1].trim();
    label = labelMatch[2].trim();
    bodyStart = working.slice(labelMatch[0].length);
  }

  // 3. Strip trailing <a href>
  let originalWikiUrl = null;
  const hrefRe = /<a\s+href="([^"]+)"[^>]*>[^<]*<\/a>\s*$/;
  const hrefMatch = bodyStart.match(hrefRe);
  if (hrefMatch) {
    originalWikiUrl = hrefMatch[1];
    bodyStart = bodyStart.slice(0, hrefMatch.index).trim();
  }

  // 4. Bỏ "📖 ..." dẫn vào link (nếu sót)
  bodyStart = bodyStart.replace(/\s*📖\s*$/m, '').trim();

  // 5. Convert <br><br> → \n\n, strip tags
  let answer = bodyStart
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong>([^<]*)<\/strong>/gi, '$1')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { icon, label, answer, originalWikiUrl };
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error('[X] Khong tim thay folder: ' + ARTICLES_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(function (f) { return /^(LAMQUEN|GIAMDAN)-\d{2}-.+\.html$/.test(f); })
    .sort();

  const line = '-'.repeat(75);
  console.log(line);
  console.log('Articles dir: ' + ARTICLES_DIR);
  console.log('Found ' + files.length + ' Pre-Q-Day HTML files');
  console.log(line);

  const chips = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const info = parseFilename(file);
    if (!info) continue;

    const html = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
    const block = extractChipSummaryBlock(html);
    if (!block) {
      errors.push({ file: file, error: 'no chip-summary block' });
      console.error('[X] ' + file + ': no chip-summary block');
      continue;
    }

    const parsed = parseChip(block, info.dayNumber, info.phase);
    const utmCampaign = (info.phase === 'lam-quen' ? 'lamquen-' : 'giamdan-') + info.dayNumber;
    const wikiUrl = WIKI_BASE + '/' + info.wpSlug + '/?utm_source=zalo&utm_campaign=' + utmCampaign;
    const dbSlug = info.phase + '-' + info.dayNumber; // 'lam-quen-1' | 'giam-dan-1'

    const wordCount = parsed.answer.split(/\s+/).filter(Boolean).length;

    chips.push({
      phase: info.phase,
      dayNumber: info.dayNumber,
      slug: dbSlug,
      wpSlug: info.wpSlug,
      icon: parsed.icon,
      label: parsed.label,
      answer: parsed.answer,
      wikiUrl: wikiUrl,
      wikiLabel: 'Đọc bài đầy đủ trên sol.vn',
      sourceFile: file,
      originalWikiUrl: parsed.originalWikiUrl,
      wordCount: wordCount,
    });

    const flag = parsed.originalWikiUrl && parsed.originalWikiUrl.indexOf(info.wpSlug) !== -1 ? '[OK]' : '[!! ]';
    console.log(
      flag + ' ' + info.phase.padEnd(8) + ' D' + String(info.dayNumber).padStart(2, '0') +
      '  ' + parsed.icon + '  ' + parsed.label.padEnd(45).slice(0, 45) + '  ' + wordCount + 'w'
    );
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chips, null, 2) + '\n', 'utf8');

  console.log(line);
  console.log('Extracted: ' + chips.length);
  console.log('Errors:    ' + errors.length);
  console.log('Output:    ' + OUTPUT_FILE);
  if (chips.length > 0) {
    const wcs = chips.map(function (c) { return c.wordCount; });
    const avg = Math.round(wcs.reduce(function (a, b) { return a + b; }, 0) / wcs.length);
    console.log('Words:     min=' + Math.min.apply(null, wcs) + ', avg=' + avg + ', max=' + Math.max.apply(null, wcs));
    const byPhase = {};
    chips.forEach(function (c) { byPhase[c.phase] = (byPhase[c.phase] || 0) + 1; });
    console.log('By phase:  lam-quen=' + (byPhase['lam-quen'] || 0) + ' / 7, giam-dan=' + (byPhase['giam-dan'] || 0) + ' / 14');
  }
  console.log(line);

  if (errors.length > 0) process.exit(1);
}

main();
