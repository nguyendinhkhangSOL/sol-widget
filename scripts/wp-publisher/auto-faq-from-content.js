#!/usr/bin/env node
/**
 * ⚠️ DEPRECATED 2026-05-22 — KHÔNG dùng cho bài mới!
 *
 * Lý do: Google ngừng FAQ rich result từ 7/5/2026
 * (https://developers.google.com/search/blog/2026/04/faq-deprecation).
 * Schema FAQPage vẫn valid HTML nhưng Google KHÔNG render rich snippet.
 *
 * Bài cũ đã inject FAQ schema (~143 bài) GIỮ NGUYÊN — không cần xóa
 * vì AI crawlers (Bing Copilot, Claude, GPT, Perplexity) vẫn parse được.
 *
 * Cho bài MỚI: dùng schema khác (HowTo / QAPage / Article) — xem
 * docs/SEO_GOOGLE_FAQ_DEPRECATION_2026.md + bulk-set-seo-v2.js.
 *
 * Để chạy script này anyway, pass --force-faq-deprecated.
 *
 * ─────────────────────────────────────────────────────────────────────
 *
 * Sol — Auto-extract FAQ Schema từ content có sẵn (H2 + paragraph đầu)
 *
 * Mục đích: Inject FAQ schema vào bài cũ đã xuất bản chưa có FAQ.
 * Approach: Parse H2 headings → rephrase thành Question → lấy paragraph đầu làm Answer.
 *
 * Áp dụng cho:
 *   - 30 Q-Day (QDAY-*.html)
 *   - 6 Cluster A (A*.html)
 *   - 5 Cluster B (B*.html)
 *   - 34 Chip wiki (CHIP-*.html) — optional, --include-chip flag
 *
 * Skip nếu bài đã có '<!-- FAQ-SCHEMA' marker hoặc 'FAQPage' trong file.
 *
 * Usage:
 *   node auto-faq-from-content.js --dry-run                # preview
 *   node auto-faq-from-content.js                          # inject Q-Day + A + B (41 bài)
 *   node auto-faq-from-content.js --include-chip           # +34 chip wiki = 75 bài
 *   node auto-faq-from-content.js --only=QDAY-01           # 1 file
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

const DRY = process.argv.includes('--dry-run');
const INCLUDE_CHIP = process.argv.includes('--include-chip');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

// 2026-05-22: Block execution unless explicitly forced. Google ngừng FAQ
// rich result — bài mới không nên inject. Bài cũ giữ nguyên.
if (!process.argv.includes('--force-faq-deprecated')) {
  console.error('\n⛔ DEPRECATED 2026-05-22 — Google ngừng FAQ rich result từ 7/5/2026.');
  console.error('   Bài mới: dùng HowTo / QAPage / Article — xem bulk-set-seo-v2.js');
  console.error('   Bài cũ: GIỮ NGUYÊN (AI crawlers vẫn dùng).');
  console.error('   Pass --force-faq-deprecated để override.\n');
  process.exit(1);
}

// ─── Question rephrase patterns ───────────────────────────────
// Heading → Vietnamese question
function rephraseToQuestion(heading) {
  let h = heading.trim();
  // Bỏ emoji đầu nếu có
  h = h.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');
  h = h.trim();

  // Đã là câu hỏi rồi
  if (h.endsWith('?') || h.endsWith('？')) return h;

  // Patterns phổ biến
  const lower = h.toLowerCase();

  // "Vì sao..." / "Tại sao..." / "Khi nào..." / "Bao lâu..." — đã là question form, thêm "?"
  if (/^(vì sao|tại sao|khi nào|bao lâu|bao nhiêu|làm sao|làm thế nào|làm gì|cách nào|cần gì|có cần|có nên|có phải|có thể|ai|gì|đâu|nào|sao|mấy|bao giờ)/i.test(h)) {
    return h + '?';
  }

  // "X là gì" → "X là gì?"
  if (/là gì$/i.test(h)) return h + '?';

  // "Triệu chứng X" / "Cách X" / "5 lý do X" → "X là gì?"
  if (/^(triệu chứng|cách|5 |3 |4 |6 |7 |10 |hành động|lý do|nguyên nhân|dấu hiệu|cảnh báo)/i.test(h)) {
    return h + ' là gì?';
  }

  // "Hôm nay X" → "Hôm nay X như thế nào?"
  if (/^hôm nay/i.test(h)) {
    return h + ' như thế nào?';
  }

  // "Tránh X" → "Cần tránh X gì?"
  if (/^(tránh|nên tránh)/i.test(h)) {
    return 'Cần ' + h.toLowerCase().replace(/^/, '') + ' gì?';
  }

  // "Phải làm gì" → đã là question
  if (/làm gì/i.test(h)) return h + '?';

  // Default: thêm " là gì?"
  return h + ' là gì?';
}

// ─── Clean text content ───────────────────────────────────────
function cleanText(html) {
  return html
    .replace(/<sup>[^<]*<\/sup>/gi, '')      // bỏ <sup>[1]</sup>
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(strong|em|b|i|span|code|a|p)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')               // strip remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, max) {
  if (s.length <= max) return s;
  // Cut at sentence boundary
  let cut = s.slice(0, max);
  const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (lastPeriod > max * 0.6) {
    cut = cut.slice(0, lastPeriod + 1);
  }
  return cut.trim();
}

// ─── Parse HTML: extract H2 + paragraph đầu ───────────────────
function extractQAFromHtml(html) {
  // Match: <h2>Question</h2> ... <p>Answer paragraph</p>
  // Or H2 followed by some elements then first <p>
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  const sections = [];
  let lastIdx = 0;
  const matches = [];
  let m;
  while ((m = h2Regex.exec(html)) !== null) {
    matches.push({ index: m.index, text: m[1], end: m.index + m[0].length });
  }

  // Cho mỗi H2, lấy content giữa nó và H2 kế tiếp
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const end = (i + 1 < matches.length) ? matches[i + 1].index : html.length;
    const section = html.slice(start, end);

    // Tìm paragraph đầu tiên trong section
    const pMatch = section.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (!pMatch) continue;

    const heading = cleanText(matches[i].text);
    const paragraph = cleanText(pMatch[1]);

    if (heading.length < 4 || paragraph.length < 30) continue;
    if (heading.length > 200) continue; // skip overly long headings

    sections.push({ heading, paragraph });
  }

  return sections;
}

function buildFaqSchema(qaList) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": qaList.map((qa) => ({
      "@type": "Question",
      "name": qa.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": qa.a
      }
    }))
  };
  return '<script type="application/ld+json">\n' + JSON.stringify(schema, null, 2) + '\n</script>\n';
}

function buildVisibleFaq(qaList) {
  let html = '\n<!-- FAQ-SCHEMA: auto-extracted from H2 sections + JSON-LD đã inject ở đầu file -->\n';
  html += '<div class="sol-faq" style="background:#FAFAF8;border-left:4px solid #B25C2C;border-radius:0 12px 12px 0;padding:18px 22px;margin:24px 0;">\n';
  html += '<h2 style="margin-top:0;color:#5C3A1E;font-size:20px;">Câu hỏi thường gặp</h2>\n';
  qaList.forEach((qa, idx) => {
    html += `<details style="margin:10px 0;border-bottom:1px solid rgba(178,92,44,0.12);padding-bottom:10px;">\n`;
    html += `<summary style="cursor:pointer;font-weight:700;color:#5C3A1E;font-size:15.5px;padding:6px 0;">${idx + 1}. ${qa.q}</summary>\n`;
    html += `<p style="margin:8px 0 0;font-size:14.5px;line-height:1.7;color:#2C2A27;">${qa.a}</p>\n`;
    html += `</details>\n`;
  });
  html += '</div>\n';
  return html;
}

function injectIntoHtml(html, qaList) {
  if (html.includes('FAQ-SCHEMA') || html.includes('FAQPage')) {
    return { html, status: 'ALREADY_HAS_FAQ' };
  }

  const jsonLd = buildFaqSchema(qaList);
  const visibleFaq = buildVisibleFaq(qaList);

  let newHtml = jsonLd + html;

  // Inject visible FAQ trước <div class="references"> hoặc <div class="cta-box"> hoặc <div class="disclaimer">
  const markers = [
    /<div class="references">/,
    /<div class="disclaimer">/,
    /<div class="cta-box">/,
    /<div class="related-links">/,
  ];
  let injected = false;
  for (const marker of markers) {
    if (newHtml.match(marker)) {
      newHtml = newHtml.replace(marker, visibleFaq + '\n$&');
      injected = true;
      break;
    }
  }
  if (!injected) {
    // Fallback: trước </div> cuối cùng
    const lastDiv = newHtml.lastIndexOf('</div>');
    if (lastDiv > 0) {
      newHtml = newHtml.slice(0, lastDiv) + visibleFaq + '\n' + newHtml.slice(lastDiv);
    }
  }

  return { html: newHtml, status: 'INJECTED' };
}

// ─── Main ─────────────────────────────────────────────────────
function shouldProcess(filename) {
  if (onlyList) return onlyList.some((o) => filename.includes(o));
  // Q-Day, Cluster A, Cluster B
  if (/^QDAY-\d{2}-/.test(filename)) return true;
  if (/^A\d-/.test(filename)) return true;
  if (/^B\d-/.test(filename)) return true;
  if (INCLUDE_CHIP && /^CHIP-/.test(filename)) return true;
  return false;
}

function main() {
  const bar = '-'.repeat(72);
  console.log(bar);
  console.log('Auto-extract FAQ Schema từ HTML' + (DRY ? ' (DRY RUN)' : ''));
  console.log(bar);

  const allFiles = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.html')).sort();
  const targetFiles = allFiles.filter(shouldProcess);

  console.log('Target files: ' + targetFiles.length);
  console.log('');

  let injected = 0;
  let skipped = 0;
  let lowQuality = 0;
  let errors = 0;

  for (const file of targetFiles) {
    const filePath = path.join(ARTICLES_DIR, file);
    const html = fs.readFileSync(filePath, 'utf-8');

    if (html.includes('FAQ-SCHEMA') || html.includes('FAQPage')) {
      skipped++;
      if (process.env.VERBOSE) console.log('SKIP ' + file + ' (already has FAQ)');
      continue;
    }

    const sections = extractQAFromHtml(html);

    if (sections.length < 2) {
      lowQuality++;
      console.log('LOW  ' + file.padEnd(48) + ' (only ' + sections.length + ' H2 sections — skip)');
      continue;
    }

    // Lấy top 4-6 Q&A đầu (skip H2 cuối nếu là CTA/footer)
    const qaList = sections.slice(0, 6).map((s) => ({
      q: rephraseToQuestion(s.heading),
      a: truncate(s.paragraph, 350)
    }));

    if (DRY) {
      console.log('OK   ' + file.padEnd(48) + ' (' + qaList.length + ' Q&A)');
      if (process.env.VERBOSE) {
        qaList.forEach((qa, i) => {
          console.log('     Q' + (i + 1) + ': ' + qa.q.slice(0, 60));
        });
      }
      injected++;
      continue;
    }

    try {
      const result = injectIntoHtml(html, qaList);
      if (result.status === 'INJECTED') {
        fs.writeFileSync(filePath, result.html, 'utf-8');
        console.log('OK   ' + file.padEnd(48) + ' (+' + (result.html.length - html.length) + ' bytes, ' + qaList.length + ' Q&A)');
        injected++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors++;
      console.error('FAIL ' + file + ': ' + err.message);
    }
  }

  console.log('');
  console.log(bar);
  console.log('Injected: ' + injected + ' / Skipped (already): ' + skipped + ' / Low quality: ' + lowQuality + ' / Errors: ' + errors);
  console.log(bar);
}

main();
