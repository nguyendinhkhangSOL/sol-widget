#!/usr/bin/env node
/**
 * Sol v4 — Verify URLs LIVE trên sol.vn — status + meta + indexability
 *
 * Check mỗi URL:
 *   - HTTP status (200 OK?)
 *   - <title> length
 *   - meta description length
 *   - robots noindex flag?
 *   - canonical URL
 *   - response time
 *
 * Usage:
 *   node verify-live-urls.js
 *
 * Note: KHÔNG check indexing status (cần GSC API auth) — chỉ verify URL khoẻ
 * và meta đúng để Google CÓ THỂ index khi crawl.
 */

const https = require('https');

const URLS = [
  // 6 bài Wave 2 (mới publish 2026-05-13)
  'https://sol.vn/muon-bo-cuoc-cai-thuoc/',
  'https://sol.vn/mat-ngu-khi-cai-thuoc/',
  'https://sol.vn/cau-gat-khi-cai-thuoc/',
  'https://sol.vn/tao-bon-khi-cai/',
  'https://sol.vn/vape-co-an-toan-de-cai-thuoc/',
  'https://sol.vn/thuc-don-cai-thuoc-khong-tang-can/',
  // 2 bài đổi slug (cần Google crawl lại)
  'https://sol.vn/ngay-4-7-bo-thuoc-hoi-phuc-ban-dau/',
  'https://sol.vn/tuan-2-bo-thuoc-nao-tai-can-bang/',
  // 3 bài CHIP sample (xem bài cũ còn ổn không)
  'https://sol.vn/dau-dau-sau-cai/',
  'https://sol.vn/ho-co-dom-khi-cai/',
  'https://sol.vn/y-nghi-tu-hai-cai-thuoc/',
  // 3 bài Cluster A/B
  'https://sol.vn/cai-thuoc-la-tai-nha/',
  'https://sol.vn/phuong-phap-cai-thuoc-la-pho-bien/',
  'https://sol.vn/them-thuoc-dem-khuya-90-giay/',
  // 3 redirect test
  'https://sol.vn/sol-home/',
  'https://sol.vn/88-ngay/',
  'https://sol.vn/tam-nhin-sol-mien-tru-trach-nhiem/',
];

function fetchHead(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const u = new URL(url);
    const req = https.request({
      method: 'GET', // GET vì cần parse HTML
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'Mozilla/5.0 SolVerifier/1.0' },
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        const time = Date.now() - start;
        const result = {
          url, status: res.statusCode, time, location: res.headers.location,
          contentLength: body.length,
        };
        // Parse HTML chỉ nếu 200
        if (res.statusCode === 200) {
          const title = (body.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
          const desc = (body.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
          const canonical = (body.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || [])[1] || '';
          const robots = (body.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
          const ogTitle = (body.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
          const ogImage = (body.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
          const h1 = (body.match(/<h1[^>]*>([^<]+)<\/h1>/) || [])[1] || '';
          Object.assign(result, { title, desc, canonical, robots, ogTitle, ogImage, h1 });
        }
        resolve(result);
      });
    });
    req.on('error', (e) => resolve({ url, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, error: 'timeout' }); });
    req.end();
  });
}

function pad(s, n) {
  s = String(s ?? '');
  return s.length >= n ? s.slice(0, n - 1) + '…' : s + ' '.repeat(n - s.length);
}

async function main() {
  console.log(`▶ Verify ${URLS.length} URLs LIVE trên sol.vn`);
  console.log('');

  const results = [];
  for (const url of URLS) {
    const r = await fetchHead(url);
    results.push(r);

    const path = r.url.replace('https://sol.vn', '');

    if (r.error) {
      console.log(`✗ ${pad(path, 50)} ERROR: ${r.error}`);
      continue;
    }

    let icon = '✓';
    let note = '';
    if (r.status === 301 || r.status === 302) {
      icon = '➜';
      note = `redirect → ${(r.location || '').replace('https://sol.vn', '')}`;
    } else if (r.status === 200) {
      const titleLen = r.title.length;
      const descLen = r.desc.length;
      note = `${titleLen}c·${descLen}c·${r.contentLength}b·${r.time}ms`;
      if (r.robots && r.robots.includes('noindex')) {
        icon = '⚠';
        note += ' NOINDEX!';
      }
      if (!r.ogImage) note += ' no-og';
      if (!r.canonical) note += ' no-canon';
    } else if (r.status === 404) {
      icon = '✗';
      note = '404 NOT FOUND';
    } else {
      icon = '?';
      note = `HTTP ${r.status}`;
    }

    console.log(`${icon} ${pad(path, 50)} ${note}`);
  }

  // Summary
  console.log('');
  console.log('━'.repeat(70));
  const counts = results.reduce((acc, r) => {
    const key = r.error ? 'ERROR' : r.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log('Status counts:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${pad(String(k), 8)} ${v}`));

  const ok = results.filter((r) => r.status === 200);
  if (ok.length > 0) {
    const avgTime = ok.reduce((s, r) => s + r.time, 0) / ok.length;
    const minTime = Math.min(...ok.map((r) => r.time));
    const maxTime = Math.max(...ok.map((r) => r.time));
    console.log(`\nResponse time (200 OK only): min ${minTime}ms · avg ${avgTime.toFixed(0)}ms · max ${maxTime}ms`);
  }

  const noindex = results.filter((r) => r.robots?.includes('noindex'));
  if (noindex.length > 0) {
    console.log(`\n⚠️  ${noindex.length} URL có noindex — Google sẽ KHÔNG index:`);
    noindex.forEach((r) => console.log(`   ${r.url}`));
  }

  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
