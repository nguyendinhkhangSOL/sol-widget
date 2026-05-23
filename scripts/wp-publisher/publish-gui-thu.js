#!/usr/bin/env node
/**
 * Publish PILLAR-gui-thu-cho-sol.html lên sol.vn
 *
 * UPDATE bài đang ăn SEO tại sol.vn/gui-thu-cho-sol/ — KHÔNG dùng redirect 301.
 * Giữ post ID + permalink + SEO authority + backlinks.
 *
 * Usage:
 *   node publish-gui-thu.js --dry-run
 *   node publish-gui-thu.js
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

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link,title`);
  if (Array.isArray(items) && items.length > 0) return items[0];
  // Try pages
  const pages = await api.get(`/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link,title`);
  return Array.isArray(pages) && pages.length > 0 ? { ...pages[0], _type: 'page' } : null;
}

const SLUG = 'gui-thu-cho-sol';
const TITLE = 'Gửi Thư Cho Sol — Một Lời Kể, Một Tia Sáng, Một Câu Hỏi';
const SEO_TITLE = 'Gửi Thư Cho Sol — Cộng Đồng Cai Thuốc Lá Việt Nam';
const SEO_DESC = 'Gửi câu chuyện, câu hỏi, kinh nghiệm cai thuốc cho Sol. Khang đọc mỗi thư mỗi sáng. Bảo mật. Trả lời 24-72h. Cộng đồng Việt sống lại làm lại tốt hơn.';
const FOCUS = 'gửi thư cho sol';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'PILLAR-gui-thu-cho-sol.html');
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${SLUG}.png`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`✗ HTML không tồn tại: ${htmlPath}`);
    process.exit(1);
  }
  const hasOG = fs.existsSync(ogPath);

  console.log(`▶ Publishing: ${SLUG}${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  OG: ${hasOG ? ogPath : '(missing)'}`);

  const existing = await findPostBySlug(SLUG);
  if (existing) {
    const type = existing._type === 'page' ? 'PAGE' : 'POST';
    console.log(`  ✓ Found existing ${type} #${existing.id} — sẽ UPDATE (giữ SEO authority)`);
  } else {
    console.log(`  ⚠ Slug not found — sẽ CREATE NEW (post type: post)`);
  }

  if (dryRun) {
    console.log('\n✓ Dry run OK.');
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
  };

  const isPage = existing && existing._type === 'page';
  const endpoint = isPage
    ? `/wp-json/wp/v2/pages/${existing.id}`
    : existing
      ? `/wp-json/wp/v2/posts/${existing.id}`
      : `/wp-json/wp/v2/posts`;

  try {
    const result = await api.post(endpoint, payload);
    console.log(`✓ ${existing ? 'UPDATED' : 'CREATED'} ${isPage ? 'page' : 'post'} #${result.id}`);
    console.log(`  Link: ${result.link}`);
    console.log(`\n📋 NEXT STEPS:`);
    console.log(`   1. Mở ${result.link} verify content render đúng`);
    console.log(`   2. Test form gửi thư (action="/wp-json/sol/v1/letters" — Khang wire backend sau)`);
    console.log(`   3. Submit Google Search Console → URL Inspection → Request Indexing`);
    console.log(`   4. Test FAQ Rich Snippet: https://search.google.com/test/rich-results`);
  } catch (e) {
    console.error(`✗ POST fail: ${e.message}`);
    if (e.body) console.error(`   ${JSON.stringify(e.body).slice(0, 300)}`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
