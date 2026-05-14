#!/usr/bin/env node
/**
 * Sol v4 — Set Featured Image cho 1 Post/Page (không đẩy lại HTML)
 *
 * Usage:
 *   node set-featured.js <slug>           → upload + set featured 1 lệnh (auto-find OG)
 *   node set-featured.js <slug> <media_id> → set bằng ID có sẵn
 *
 * Examples:
 *   # 1 lệnh tự upload OG image từ wiki-articles/og-images/<slug>.png + set featured
 *   node set-featured.js cold-turkey-vs-giam-dan
 *
 *   # Set bằng Media ID có sẵn
 *   node set-featured.js cold-turkey-vs-giam-dan 1234
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

// ─── Load .env password ───────────────────────────────────────
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

// ─── Upload PNG → Media Library ───────────────────────────────
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
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,title,featured_media`);
  if (Array.isArray(items) && items.length > 0) return items[0];
  return null;
}

async function main() {
  const slug = process.argv[2];
  const explicitMediaId = process.argv[3];

  if (!slug) {
    console.error('Usage: node set-featured.js <slug> [media_id]');
    process.exit(1);
  }

  console.log(`▶ Set Featured Image cho post slug="${slug}"`);

  // 1. Find post
  const post = await findPostBySlug(slug);
  if (!post) {
    console.error(`✗ Không tìm thấy post slug="${slug}"`);
    process.exit(1);
  }
  console.log(`  Found post #${post.id} — "${post.title?.rendered || ''}"`);
  console.log(`  Featured hiện tại: ${post.featured_media || '(chưa có)'}`);

  // 2. Get media ID
  let mediaId;
  if (explicitMediaId) {
    mediaId = parseInt(explicitMediaId, 10);
    console.log(`  Dùng Media ID truyền vào: ${mediaId}`);
  } else {
    // Auto-find OG image trong wiki-articles/og-images/<slug>.png
    const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${slug}.png`);
    if (!fs.existsSync(ogPath)) {
      console.error(`✗ Không tìm thấy OG image: ${ogPath}`);
      console.error('  → Em đã gen chưa? Hoặc anh truyền explicit media_id: node set-featured.js <slug> <media_id>');
      process.exit(1);
    }
    console.log(`  Auto-upload OG: ${path.relative(process.cwd(), ogPath)} (${(fs.statSync(ogPath).size / 1024).toFixed(1)} KB)`);
    const media = await uploadFile(ogPath);
    mediaId = media.id;
    console.log(`  ✓ Uploaded — Media ID: ${mediaId}`);
    console.log(`    URL: ${media.source_url}`);
  }

  // 3. Update post.featured_media
  const updated = await api.post(`/wp-json/wp/v2/posts/${post.id}`, { featured_media: mediaId });
  console.log(`✓ DONE — featured_media set to ${updated.featured_media}`);
  console.log(`  Verify: ${updated.link}`);
}

main().catch((e) => {
  console.error('✗ FAIL:', e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exit(1);
});
