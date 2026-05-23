// scripts/wp-publisher/extract-chip-summaries.js
//
// PHASE 4 — Extract 30 chip-summary từ QDAY HTML files.
//
// Đọc 30 file QDAY-NN-*.html trong wiki-skeletons/wiki-articles/,
// parse <div class="chip-summary"> để lấy:
//   - icon (emoji đầu)
//   - label ("Ngày N — Tiêu đề")
//   - answer (text body, đã clean <br>)
//   - originalWikiUrl (URL trong HTML, để debug)
//
// Output: qday-chips.json (cùng folder script này)
//
// wikiUrl CANONICAL được override sau từ handoff doc 14-05-2026
// (xem CANONICAL_SLUGS bên dưới — slug LIVE thực tế trên sol.vn).
//
// Usage:
//   cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
//   node extract-chip-summaries.js

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');
const OUTPUT_FILE = path.resolve(__dirname, 'qday-chips.json');

// ── CANONICAL SLUG MAP — đồng bộ từ SOL_SESSION_HANDOFF_14_05_2026.md ──
const CANONICAL_SLUGS = {
  1: 'ngay-1-24-gio-dau-tien-bo-thuoc-la',
  2: 'ngay-2-dinh-con-them-nicotine',
  3: 'ngay-3-buc-tuong-trieu-chung-cai-dat-dinh-va-bat-dau-giam',
  4: 'ngay-4-mat-ngu-va-roi-loan-giac-ngu-giai-thich-khoa-hoc',
  5: 'ngay-5-them-an-va-noi-so-tang-can-su-that-khoa-hoc',
  6: 'ngay-6-cau-gat-voi-nguoi-than-day-khong-phai-tinh-cach-ban',
  7: 'ngay-7-moc-1-tuan-nhung-gi-da-thay-doi-trong-co-the-ban',
  8: 'ngay-8-suong-mu-nao-va-kho-tap-trung-nao-bo-dang-tai-cau-truc',
  9: 'ngay-9-ho-va-dom-phoi-dang-tu-lam-sach',
  10: 'ngay-10-con-them-doi-hinh-dang-tu-sinh-ly-sang-tam-ly',
  11: 'ngay-11-vi-giac-va-khuu-giac-tro-lai-ca-phe-ngon-hon-hoa-thom-hon',
  12: 'ngay-12-dao-dong-nang-luong-luc-khoe-luc-met',
  13: 'ngay-13-cam-xuc-that-thuong-khi-nao-can-kham-tam-ly',
  14: 'ngay-14-moc-2-tuan-bo-thuoc',
  15: 'ngay-15-tinh-huong-kho-khan-can-doi-mat-ca-phe-tra-da-via-he-coc-bia-hoi-nhau-bua-an-stress',
  16: 'ngay-16-nhau-bia-hoi-via-he-khong-hut-thuoc-song-sot-qua-buoi-dau-tien',
  17: 'ngay-17-nham-chan-ke-thu-it-duoc-nhac-den',
  18: 'ngay-18-stress-cong-viec-dieu-thuoc-gio-nghi-khong-con',
  19: 'ngay-19-khi-ban-be-con-hut-giu-ban-giu-cam-ket-nen-ung-xu-the-nao',
  20: 'ngay-20-giac-mo-hut-thuoc-vi-sao-va-no-co-nguy-hiem-khong',
  21: 'ngay-21-moc-3-tuan-bo-thuoc-vong-lap-thoi-quen-da-yeu-di',
  22: 'ngay-22-con-them-sau-bua-an-tai-sao-van-dai-dang',
  23: 'ngay-23-cuoi-tuan-khi-nghi-thuc-cu-khong-con',
  24: 'ngay-24-toi-la-nguoi-khong-hut-chuyen-dich-danh-tinh',
  25: 'ngay-25-can-tai-nghien-lapse-neu-ban-hut-1-dieu-dieu-gi-xay-ra',
  26: 'ngay-26-tien-tiet-kiem-dong-tien-ban-dang-doi-lay-suc-khoe',
  27: 'ngay-27-gia-dinh-va-cac-moi-quan-he-dieu-ban-chua-thay',
  28: 'ngay-28-tu-hao-va-gia-tri-ban-than-day-khong-phai-phu-phiem',
  29: 'ngay-29-nhin-ve-phia-truoc-thang-2-va-thang-3-se-nhu-the-nao',
  30: 'ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-ai',
};

const WIKI_BASE = 'https://sol.vn';

function extractChipSummaryBlock(html) {
  const re = /<div class="chip-summary">([\s\S]*?)<\/div>\s*(?=<div class="disclaimer")/;
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function parseChip(block, dayNumber) {
  let working = block;

  // 1. Strip chip-label header
  working = working.replace(/<div class="chip-label">[\s\S]*?<\/div>\s*/g, '').trim();

  // 2. Match emoji + <strong>Ngày N — Title</strong>
  const labelRe = /^\s*([^\s<]+)\s*<strong>([^<]+)<\/strong>\s*(?:<br\s*\/?>\s*)+/i;
  const labelMatch = working.match(labelRe);
  let icon = '📱'; // fallback 📱
  let label = 'Ngay ' + dayNumber;
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

  // 4. Bỏ dấu hieu dẫn vào link (📖 ở cuối)
  bodyStart = bodyStart.replace(/\s*📖\s*$/m, '').trim();

  // 5. Convert <br><br> → blank line, strip tags
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
    .filter(function (f) { return /^QDAY-\d{2}-.*\.html$/.test(f); })
    .sort();

  const line = '-'.repeat(70);
  console.log(line);
  console.log('Articles dir: ' + ARTICLES_DIR);
  console.log('Found ' + files.length + ' QDAY HTML files');
  console.log(line);

  if (files.length !== 30) {
    console.warn('[!] Expected 30 files, got ' + files.length);
  }

  const chips = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const m = file.match(/^QDAY-(\d{2})-/);
    if (!m) continue;
    const dayNumber = parseInt(m[1], 10);

    const html = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
    const block = extractChipSummaryBlock(html);

    if (!block) {
      errors.push({ file: file, error: 'no chip-summary block found' });
      console.error('[X] D' + dayNumber + ' (' + file + '): no chip-summary block');
      continue;
    }

    const parsed = parseChip(block, dayNumber);
    const canonicalSlug = CANONICAL_SLUGS[dayNumber];
    const wikiUrl = canonicalSlug
      ? WIKI_BASE + '/' + canonicalSlug + '/?utm_source=zalo&utm_campaign=qday-' + dayNumber
      : null;

    const wordCount = parsed.answer.split(/\s+/).filter(Boolean).length;

    chips.push({
      dayNumber: dayNumber,
      slug: 'qday-' + dayNumber,
      icon: parsed.icon,
      label: parsed.label,
      answer: parsed.answer,
      wikiUrl: wikiUrl,
      wikiLabel: 'Doc Ngay ' + dayNumber + ' day du tren sol.vn',
      sourceFile: file,
      originalWikiUrl: parsed.originalWikiUrl,
      canonicalSlug: canonicalSlug,
      wordCount: wordCount,
    });

    const slugMatch = parsed.originalWikiUrl && canonicalSlug
      && parsed.originalWikiUrl.indexOf(canonicalSlug) !== -1;
    const flag = slugMatch ? '[OK]' : '[!! ]';
    console.log(
      flag + ' D' + String(dayNumber).padStart(2, '0') + '  ' + parsed.icon + '  ' +
      parsed.label.padEnd(48).slice(0, 48) + '  ' + wordCount + 'w'
    );
    if (!slugMatch && parsed.originalWikiUrl) {
      console.log('       html -> ' + parsed.originalWikiUrl);
      console.log('       live -> ' + wikiUrl);
    }
  }

  // wikiLabel — sửa lại cho có dấu (file ghi UTF-8 OK, console không hiện cũng được)
  for (let j = 0; j < chips.length; j++) {
    chips[j].wikiLabel = 'Đọc Ngày ' + chips[j].dayNumber + ' đầy đủ trên sol.vn';
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chips, null, 2) + '\n', 'utf8');

  console.log(line);
  console.log('Extracted: ' + chips.length);
  console.log('Errors:    ' + errors.length);
  console.log('Output:    ' + OUTPUT_FILE);
  if (chips.length > 0) {
    const sum = chips.reduce(function (s, c) { return s + c.wordCount; }, 0);
    const avg = Math.round(sum / chips.length);
    const wordCounts = chips.map(function (c) { return c.wordCount; });
    const min = Math.min.apply(null, wordCounts);
    const max = Math.max.apply(null, wordCounts);
    console.log('Words:     min=' + min + ', avg=' + avg + ', max=' + max);
  }
  console.log(line);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
