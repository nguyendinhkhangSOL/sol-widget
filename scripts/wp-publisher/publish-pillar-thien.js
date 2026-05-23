#!/usr/bin/env node
/**
 * Publish PILLAR-cai-thuoc-bang-thien-va-chanh-niem.html lên sol.vn
 *
 * P0 Long-tail keyword Q3 2026:
 *   - cai thuốc lá bằng thiền và chánh niệm (~100 vol/m)
 *
 * Usage:
 *   node publish-pillar-thien.js --dry-run
 *   node publish-pillar-thien.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

function loadPwd() {
  const lines = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').split('\n');
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

const SLUG = 'cai-thuoc-bang-thien-va-chanh-niem';
const TITLE = 'Cai Thuốc Bằng Thiền và Chánh Niệm — Khoa Học 2026 (Khang Sol)';
const SEO_TITLE = 'Cai Thuốc Bằng Thiền và Chánh Niệm — Khoa Học 2026';
const SEO_DESC = 'Thiền + chánh niệm tăng tỷ lệ cai thuốc thành công 2.5 lần (Yale 2011). 3 kỹ thuật cụ thể 5 phút/ngày. Khang Sol 5 năm cai chia sẻ. Miễn phí.';
const FOCUS = 'cai thuốc lá bằng thiền và chánh niệm';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'PILLAR-cai-thuoc-bang-thien-va-chanh-niem.html');
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${SLUG}.png`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`✗ HTML không tồn tại: ${htmlPath}`);
    process.exit(1);
  }
  const hasOG = fs.existsSync(ogPath);

  console.log(`▶ Publishing pillar: ${SLUG}${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  OG image: ${hasOG ? ogPath : '(missing)'}`);

  const categoryId = await findCategoryId('wiki-bo-thuoc-la');
  if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);

  const existing = await findPostBySlug(SLUG);
  console.log(`  Existing post: ${existing ? `#${existing.id} (UPDATE)` : '(CREATE new)'}`);

  if (dryRun) {
    console.log('✓ Dry run OK.');
    return;
  }

  let mediaId;
  if (hasOG) {
    try {
      const media = await uploadFile(ogPath);
      mediaId = media.id;
      console.log(`✓ Uploaded OG → media #${mediaId}`);
    } catch (e) {
      console.warn(`⚠ Upload OG fail: ${e.message}`);
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
