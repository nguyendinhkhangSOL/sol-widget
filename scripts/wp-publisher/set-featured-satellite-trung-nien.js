#!/usr/bin/env node
/**
 * Sol — Bulk set Featured Image cho 3 bài vệ tinh "Trung niên"
 *
 * Tiền điều kiện:
 *   1. Chạy gen-og-satellite-trung-nien.js (3 PNG tồn tại)
 *   2. 3 post đã publish (có slug trong WP)
 *
 * Usage:
 *   node set-featured-satellite-trung-nien.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

const OG_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'satellite-trung-nien', 'og-images');

const SLUGS = [
  'khoi-nghiep-tinh-gon-tuoi-trung-nien-it-von',
  'stress-tuoi-trung-nien-va-cai-bay-khoi-thuoc',
  'khoi-nghiep-tuoi-40-khang-dinh-ban-than',
];

function loadPwd() {
  const envPath = path.join(__dirname, '.env');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^WP_APP_PASSWORD=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  }
  throw new Error('Không tìm thấy WP_APP_PASSWORD trong .env');
}
const AUTH = 'Basic ' + Buffer.from(`${WP_USERNAME}:${loadPwd()}`).toString('base64');

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const url = new URL('/wp-json/wp/v2/media', WP_URL);
    const req = https.request(
      {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          'Authorization': AUTH,
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileData.length,
          'Accept': 'application/json',
        },
        timeout: 60000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(raw); } catch { parsed = raw; }
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else { const err = new Error(`HTTP ${res.statusCode}`); err.body = parsed; reject(err); }
        });
      },
    );
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function findPostBySlug(slug) {
  const items = await api.get(
    `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,title,featured_media`
  );
  if (Array.isArray(items) && items.length > 0) return items[0];
  return null;
}

async function processSlug(slug) {
  console.log(`\n▶ ${slug}`);
  const ogPath = path.join(OG_DIR, `${slug}.png`);
  if (!fs.existsSync(ogPath)) {
    return { slug, status: 'fail', err: `OG file không tồn tại: ${ogPath}` };
  }
  const post = await findPostBySlug(slug);
  if (!post) return { slug, status: 'fail', err: 'Post không tìm thấy' };

  console.log(`   Post #${post.id} | featured hiện tại: ${post.featured_media || '(chưa có)'}`);
  const media = await uploadFile(ogPath);
  console.log(`   ✓ Uploaded media #${media.id}`);
  const updated = await api.post(`/wp-json/wp/v2/posts/${post.id}`, { featured_media: media.id });
  console.log(`   ✓ Set featured_media = ${updated.featured_media}`);
  return { slug, status: 'ok', postId: post.id, mediaId: media.id, link: updated.link };
}

async function main() {
  console.log('========================================');
  console.log('  SATELLITE TRUNG NIÊN — Set Featured Image (3 bài)');
  console.log(`  Target: ${WP_URL}`);
  console.log('========================================');

  const results = [];
  for (const slug of SLUGS) {
    try {
      results.push(await processSlug(slug));
    } catch (e) {
      results.push({ slug, status: 'fail', err: e.message });
      console.log(`   ✗ FAIL: ${e.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================');
  const ok = results.filter((r) => r.status === 'ok').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  console.log(`  ✓ Thành công: ${ok} bài`);
  console.log(`  ✗ Lỗi:        ${fail} bài\n`);

  for (const r of results) {
    if (r.status === 'ok') {
      console.log(`    ✓ ${r.slug}  → media #${r.mediaId}`);
      console.log(`      ${r.link}`);
    } else {
      console.log(`    ✗ ${r.slug}  → ${r.err}`);
    }
  }
}

main().catch((e) => {
  console.error('✗ FATAL:', e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exit(1);
});
