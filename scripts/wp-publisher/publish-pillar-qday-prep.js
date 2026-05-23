#!/usr/bin/env node
/**
 * Publish PILLAR-chuan-bi-q-day-cai-thuoc.html lên sol.vn
 *
 * Usage:
 *   node publish-pillar-qday-prep.js --dry-run
 *   node publish-pillar-qday-prep.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

function loadPwd() {
  const envPath = path.join(__dirname, '.env');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^WP_APP_PASSWORD=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  }
  throw new Error('Không tìm thấy WP_APP_PASSWORD');
}
const AUTH = 'Basic ' + Buffer.from(`${WP_USERNAME}:${loadPwd()}`).toString('base64');

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const url = new URL('/wp-json/wp/v2/media', WP_URL);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: {
        'Authorization': AUTH, 'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileData.length, 'Accept': 'application/json',
      }, timeout: 60000,
    }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else { const err = new Error(`HTTP ${res.statusCode}`); err.body = parsed; reject(err); }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function findCategoryId(slug) {
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}&_fields=id`);
  return Array.isArray(cats) && cats[0] ? cats[0].id : null;
}

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

const SLUG = 'chuan-bi-q-day-cai-thuoc';
const TITLE = 'Chuẩn Bị Q-Day Cai Thuốc — Checklist 8 Mục Khoa Học 2026';
const SEO_TITLE = 'Chuẩn Bị Q-Day Cai Thuốc — Checklist 8 Mục 2026';
const SEO_DESC = '8 mục checklist chuẩn bị Q-Day: y tế, gia đình, kit khẩn cấp. Khoa học Hughes 2008 — tăng 130% tỷ lệ thành công. Sol đồng hành.';
const FOCUS = 'chuẩn bị q-day cai thuốc';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'PILLAR-chuan-bi-q-day-cai-thuoc.html');
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${SLUG}.png`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`✗ HTML không tồn tại: ${htmlPath}`);
    process.exit(1);
  }

  const hasOG = fs.existsSync(ogPath);
  console.log(`▶ Publishing pillar: ${SLUG}${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  OG image: ${hasOG ? ogPath : '(missing — sẽ dùng OG default)'}`);

  const categoryId = await findCategoryId('wiki-bo-thuoc-la');
  if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);

  const existing = await findPostBySlug(SLUG);
  console.log(`  Existing post: ${existing ? `#${existing.id} (UPDATE)` : '(CREATE new)'}`);

  if (dryRun) {
    console.log('✓ Dry run OK — không gửi lên WP.');
    return;
  }

  let mediaId;
  if (hasOG) {
    try {
      const media = await uploadFile(ogPath);
      mediaId = media.id;
      console.log(`✓ Uploaded OG image → media #${mediaId}`);
    } catch (e) {
      console.warn(`⚠ Upload OG fail: ${e.message} — skip featured_media`);
    }
  }

  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: SEO_TITLE,
    rank_math_description: SEO_DESC,
    rank_math_focus_keyword: FOCUS,
  };

  const payload = {
    slug: SLUG,
    title: TITLE,
    content,
    excerpt: SEO_DESC,
    status: 'publish',
    meta,
    ...(mediaId ? { featured_media: mediaId } : {}),
    ...(categoryId ? { categories: [categoryId] } : {}),
  };

  try {
    const result = existing
      ? await api.post(`/wp-json/wp/v2/posts/${existing.id}`, payload)
      : await api.post(`/wp-json/wp/v2/posts`, payload);
    console.log(`✓ ${existing ? 'UPDATED' : 'CREATED'} post #${result.id}`);
    console.log(`  Link: ${result.link}`);
  } catch (e) {
    console.error(`✗ POST fail: ${e.message}`);
    if (e.body) console.error(`   ${JSON.stringify(e.body).slice(0, 300)}`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
