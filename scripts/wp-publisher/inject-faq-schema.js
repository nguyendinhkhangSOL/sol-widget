#!/usr/bin/env node
/**
 * Sol — Inject FAQ Schema (FAQPage JSON-LD) + visible FAQ section vào HTML bài viết
 *
 * Loop qua tất cả slug trong faq-library.json:
 *   1. Tìm file HTML tương ứng (LAMQUEN/GIAMDAN/PILLAR pattern)
 *   2. Skip nếu đã inject (chứa marker '<!-- FAQ-SCHEMA -->')
 *   3. Tạo JSON-LD FAQPage script
 *   4. Tạo visible FAQ section HTML (Q&A pairs)
 *   5. Inject schema script ở đầu file (trước <style>)
 *   6. Inject visible FAQ section trước <div class="references">
 *   7. Save file
 *
 * Usage:
 *   node inject-faq-schema.js --dry-run    # preview, không write
 *   node inject-faq-schema.js               # inject thật
 *   node inject-faq-schema.js --only=cai-thuoc-la-vinh-vien
 */

const fs = require('fs');
const path = require('path');

const FAQ_LIB = require('./faq-library.json');
const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

const DRY = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

// ⚠️ DEPRECATED 2026-05-22 — Google ngừng FAQ rich result từ 7/5/2026.
// Bài mới KHÔNG nên inject FAQ schema. Pass --force-faq-deprecated để override.
if (!process.argv.includes('--force-faq-deprecated')) {
  console.error('\n⛔ DEPRECATED — Google ngừng FAQ rich result từ 7/5/2026.');
  console.error('   Cho bài mới: dùng bulk-set-seo-v2.js (HowTo/QAPage/Article).');
  console.error('   Pass --force-faq-deprecated để override.\n');
  process.exit(1);
}

// Map slug → filename
function findHtmlFile(slug) {
  // Try patterns: LAMQUEN-NN-<tail>, GIAMDAN-NN-<tail>, PILLAR-<slug>
  if (slug === 'cai-thuoc-la-vinh-vien') return 'PILLAR-cai-thuoc-la-vinh-vien.html';

  const m = slug.match(/^(lam-quen-ngay|giam-dan-ngay)-(\d+)-(.+)$/);
  if (m) {
    const prefix = m[1] === 'lam-quen-ngay' ? 'LAMQUEN' : 'GIAMDAN';
    const dayNum = String(parseInt(m[2])).padStart(2, '0');
    const tail = m[3];
    return `${prefix}-${dayNum}-${tail}.html`;
  }
  return null;
}

function escapeJSON(s) {
  // Schema.org JSON-LD cần escape đúng
  return JSON.stringify(s);
}

function buildJsonLdScript(qaList) {
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

function buildVisibleFaqSection(qaList) {
  let html = '\n<!-- FAQ-SCHEMA: visible section + JSON-LD đã inject ở đầu file -->\n';
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
  const MARKER = '<!-- FAQ-SCHEMA';

  if (html.includes(MARKER)) {
    return { html, status: 'ALREADY_INJECTED' };
  }

  // 1. Inject JSON-LD ở đầu file (trước <style>)
  const jsonLd = buildJsonLdScript(qaList);
  let newHtml = html;
  if (html.startsWith('<style>')) {
    newHtml = jsonLd + html;
  } else {
    // Fallback: prepend
    newHtml = jsonLd + html;
  }

  // 2. Inject visible FAQ section trước <div class="references"> (hoặc <div class="cta-box">)
  const visibleFaq = buildVisibleFaqSection(qaList);
  const refMarker = '<div class="references">';
  const ctaMarker = '<div class="cta-box">';
  const disclaimerMarker = '<div class="disclaimer">';

  if (newHtml.includes(refMarker)) {
    newHtml = newHtml.replace(refMarker, visibleFaq + '\n' + refMarker);
  } else if (newHtml.includes(disclaimerMarker)) {
    newHtml = newHtml.replace(disclaimerMarker, visibleFaq + '\n' + disclaimerMarker);
  } else if (newHtml.includes(ctaMarker)) {
    newHtml = newHtml.replace(ctaMarker, visibleFaq + '\n' + ctaMarker);
  } else {
    // Fallback: append before </div> cuối cùng
    const lastDiv = newHtml.lastIndexOf('</div>');
    if (lastDiv > 0) {
      newHtml = newHtml.slice(0, lastDiv) + visibleFaq + '\n' + newHtml.slice(lastDiv);
    }
  }

  return { html: newHtml, status: 'INJECTED' };
}

function main() {
  const bar = '-'.repeat(72);
  console.log(bar);
  console.log('Inject FAQ Schema vào HTML' + (DRY ? ' (DRY RUN)' : ''));
  console.log(bar);

  const slugs = onlyList ? onlyList : Object.keys(FAQ_LIB);
  console.log('Total slugs: ' + slugs.length);
  console.log('');

  let injected = 0;
  let skipped = 0;
  let missing = 0;

  for (const slug of slugs) {
    const qaList = FAQ_LIB[slug];
    if (!qaList || qaList.length === 0) {
      console.log('SKIP ' + slug + ' - no Q&A in library');
      missing++;
      continue;
    }

    const fileName = findHtmlFile(slug);
    if (!fileName) {
      console.log('SKIP ' + slug + ' - cannot determine filename');
      missing++;
      continue;
    }

    const filePath = path.join(ARTICLES_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.log('MISS ' + slug + ' - file not found: ' + fileName);
      missing++;
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf-8');
    const result = injectIntoHtml(html, qaList);

    if (result.status === 'ALREADY_INJECTED') {
      console.log('SKIP ' + slug.padEnd(44) + ' (already has FAQ schema)');
      skipped++;
      continue;
    }

    if (DRY) {
      console.log('OK   ' + slug.padEnd(44) + ' (would inject, +' + (result.html.length - html.length) + ' bytes)');
    } else {
      fs.writeFileSync(filePath, result.html, 'utf-8');
      console.log('OK   ' + slug.padEnd(44) + ' (+' + (result.html.length - html.length) + ' bytes, ' + qaList.length + ' Q&A)');
    }
    injected++;
  }

  console.log('');
  console.log(bar);
  console.log('Injected: ' + injected + ' / Skipped: ' + skipped + ' / Missing: ' + missing);
  console.log(bar);
  if (DRY) console.log('Dry run - không write file. Bỏ --dry-run để inject thật.');
}

main();
