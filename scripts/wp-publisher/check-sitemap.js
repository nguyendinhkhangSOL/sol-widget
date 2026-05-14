#!/usr/bin/env node
/**
 * Sol v4 — Verify sitemap structure trên sol.vn
 *
 * Check:
 *   /sitemap_index.xml          — index chính (Rank Math)
 *   /post-sitemap.xml           — sitemap posts
 *   /category-sitemap.xml       — sitemap categories
 *   /page-sitemap.xml           — sitemap pages
 *
 * In ra danh sách URL trong từng sitemap để verify.
 *
 * Usage:
 *   node check-sitemap.js                       # full report
 *   node check-sitemap.js --posts-only          # chỉ posts
 */

const https = require('https');
const { WP_URL } = require('./_lib');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(raw);
        else reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      });
    }).on('error', reject);
  });
}

function extractUrls(xml) {
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

function extractLastmods(xml) {
  const mods = [];
  const regex = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const block = m[1];
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const mod = (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc) mods.push({ loc, mod });
  }
  return mods;
}

async function main() {
  const base = WP_URL.replace(/\/$/, '');
  console.log(`▶ Check sitemap structure cho ${base}`);
  console.log('');

  // 1. Sitemap index
  let indexUrls = [];
  try {
    const xml = await fetchText(`${base}/sitemap_index.xml`);
    indexUrls = extractUrls(xml);
    console.log(`✓ sitemap_index.xml — ${indexUrls.length} sitemap con:`);
    indexUrls.forEach((u) => console.log(`    ${u}`));
    console.log('');
  } catch (e) {
    console.log(`✗ sitemap_index.xml: ${e.message}`);
    console.log('  → Rank Math sitemap có thể chưa bật. Vào Rank Math → Sitemap Settings → Enable.');
    process.exit(1);
  }

  // 2. Detail từng sitemap
  for (const subUrl of indexUrls) {
    if (process.argv.includes('--posts-only') && !subUrl.includes('post-sitemap')) continue;

    try {
      const xml = await fetchText(subUrl);
      const items = extractLastmods(xml);
      const name = subUrl.split('/').pop();
      console.log(`▶ ${name} — ${items.length} URL`);

      // Show first 5 + last 5
      const show = items.length <= 10 ? items : [...items.slice(0, 5), { loc: '   ...', mod: '' }, ...items.slice(-5)];
      show.forEach((it) => {
        const path = it.loc.replace(base, '');
        console.log(`    ${path.padEnd(50)} ${it.mod || ''}`);
      });
      console.log('');
    } catch (e) {
      console.log(`✗ ${subUrl}: ${e.message}`);
    }
  }

  // 3. Gợi ý
  console.log('━'.repeat(70));
  console.log('Hành động đề xuất:');
  console.log('  1. Submit sitemap_index.xml lên Google Search Console (sol.vn)');
  console.log('  2. Vào Rank Math → Sitemap Settings → check:');
  console.log('     - Posts: Bật');
  console.log('     - Categories: Bật');
  console.log('     - Exclude any category cũ không cần index');
  console.log('  3. Sau khi fix SEO meta xong, ping Google:');
  console.log(`     curl "https://www.google.com/ping?sitemap=${encodeURIComponent(base + '/sitemap_index.xml')}"`);
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
