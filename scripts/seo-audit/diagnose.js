#!/usr/bin/env node
/**
 * SOL.VN — Diagnose title/desc pattern
 * Prints actual title + meta description text for 6 sample URLs
 * to identify whether TITLE_LONG comes from:
 *   - Yoast/theme auto-append suffix " — Sol" / " | Sol.vn"
 *   - Long content title
 *   - H1 mismatch with title
 *
 * Usage:  node diagnose.js
 */

const https = require('https');

const SAMPLE_URLS = [
  // Top issues from report
  'https://sol.vn/2025/05/31/ve-sol/',
  'https://sol.vn/2026/04/10/dieu-thuoc-cuoi-cung-khong-phai-de-bo-ma-de-hieu/',
  'https://sol.vn/category/wiki-bo-thuoc-la/',
  'https://sol.vn/category/ngam/',
  // 1 random wiki
  'https://sol.vn/category/wiki-bo-thuoc-la/30-ngay-cai-thuoc-la/',
  // Homepage
  'https://sol.vn/',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          timeout: 15000,
          headers: { 'User-Agent': 'SolSeoDiag/1.0' },
        },
        (res) => {
          if ([301, 302, 307, 308].includes(res.statusCode)) {
            return resolve(fetch(new URL(res.headers.location, url).toString()));
          }
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(data));
        }
      )
      .on('error', reject);
  });
}

function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, ' ') : '';
}
function getDesc(html) {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  return m ? m[1].trim() : '';
}
function getH1s(html) {
  return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  );
}
function getOgTitle(html) {
  const m = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i
  );
  return m ? m[1].trim() : '';
}
function getYoastSiteName(html) {
  // Yoast injects <meta property="og:site_name" content="Sol">
  const m = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i
  );
  return m ? m[1].trim() : '';
}

(async () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' SOL.VN — TITLE/DESC PATTERN DIAGNOSTIC');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const url of SAMPLE_URLS) {
    try {
      const html = await fetch(url);
      const title = getTitle(html);
      const ogTitle = getOgTitle(html);
      const desc = getDesc(html);
      const h1s = getH1s(html);
      const siteName = getYoastSiteName(html);

      console.log(`URL:        ${url}`);
      console.log(`<title>     [${title.length}] ${title}`);
      console.log(`og:title    [${ogTitle.length}] ${ogTitle}`);
      console.log(`<meta desc> [${desc.length}] ${desc}`);
      console.log(`<h1> count: ${h1s.length}`);
      h1s.forEach((h, i) => console.log(`  H1[${i}]: ${h}`));
      console.log(`og:site_name: ${siteName || '(none)'}`);
      console.log('───────────────────────────────────────────────────────────────\n');
    } catch (err) {
      console.log(`URL:    ${url}`);
      console.log(`ERROR:  ${err.message}\n`);
    }
  }

  console.log('Copy ALL output trên gửi cho Sol để chẩn đoán pattern.\n');
})();
