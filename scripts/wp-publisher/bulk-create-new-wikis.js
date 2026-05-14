#!/usr/bin/env node
/**
 * Sol v4 — Bulk CREATE 6 bài Wiki mới (không có draft sẵn)
 *
 * Khác bulk-publish-chips.js: bài này CREATE NEW (POST), không UPDATE existing draft.
 * Cho mỗi bài:
 *   1. Tìm post slug — nếu đã tồn tại, dùng cách UPDATE.
 *   2. Nếu chưa có: tạo NEW post với content + featured + SEO + publish trực tiếp.
 *
 * Usage:
 *   node bulk-create-new-wikis.js --dry-run     → preview, không push
 *   node bulk-create-new-wikis.js               → push tất cả 6 bài
 *   node bulk-create-new-wikis.js --only=muon-bo-cuoc-cai-thuoc
 *
 * Yêu cầu: HTML + OG image đã gen sẵn
 *   - wiki-skeletons/wiki-articles/CHIP-<slug>.html
 *   - wiki-skeletons/wiki-articles/og-images/<slug>.png
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
  if (Array.isArray(cats) && cats.length > 0) return cats[0].id;
  return null;
}

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

// ─── 6 bài mới ──────────────────────────────────────────────
// slug, title (≤60c), seo_title, seo_desc (120-160c), focus_keyword
const NEW_WIKIS = [
  ['muon-bo-cuoc-cai-thuoc',
    'Muốn Bỏ Cuộc Cai Thuốc — Vì Sao + Cách Vượt 60 Phút Tới',
    'Muốn Bỏ Cuộc Cai Thuốc — Vượt Qua 60 Phút Tới',
    '95% người cai đến điểm muốn bỏ cuộc — đây là khoảnh khắc quyết định. Khang đã bỏ cuộc 6 lần. 5 bước cứu nguy trong giờ tới.',
    'muốn bỏ cuộc cai thuốc'],

  ['mat-ngu-khi-cai-thuoc',
    'Mất Ngủ Khi Cai Thuốc — Vì Sao + Cách Ngủ Lại',
    'Mất Ngủ Khi Cai Thuốc Lá — Cách Giải 4 Tuần',
    '40-60% người cai mất ngủ tuần 1-2. Nicotine từng đặt lại đồng hồ ngủ. Nghi thức 60 phút trước ngủ + ngâm chân + thở 4-7-8. Hết sau 4 tuần.',
    'mất ngủ cai thuốc lá'],

  ['cau-gat-khi-cai-thuoc',
    'Cáu Gắt Khi Cai Thuốc — Vì Sao + Cách Kiểm Soát',
    'Cáu Gắt Khi Cai Thuốc — Kiểm Soát Cơn Nóng Giận',
    '50-70% người cai cáu gắt tuần 1-2. Thiếu dopamine + adrenaline tăng. Báo trước vợ con + 5 kỹ thuật hạ cơn. Khang đã quát con tuần 2.',
    'cáu gắt khi cai thuốc'],

  ['tao-bon-khi-cai',
    'Táo Bón Khi Cai Thuốc — Vì Sao + Thực Đơn 3 Ngày',
    'Táo Bón Khi Cai Thuốc Lá — Cách Giải Tự Nhiên',
    '30-50% người cai bị táo bón 2-3 tuần đầu. Nicotine từng kích thích nhu động ruột. Đu đủ chín + 2.5L nước + đi bộ giải 90%. Khang chia sẻ.',
    'táo bón cai thuốc'],

  ['vape-co-an-toan-de-cai-thuoc',
    'Vape Có An Toàn Để Cai Thuốc Lá Không? — Sự Thật 2026',
    'Vape Có An Toàn Để Cai Thuốc Lá? Không — Đây Là Lý Do',
    'Vape KHÔNG an toàn để cai. 60% người dùng vape "cai" quay lại thuốc lá. VN cấm vape 01-2025. Cách cai đã chứng minh: NRT + Champix.',
    'vape có an toàn cai thuốc'],

  ['thuc-don-cai-thuoc-khong-tang-can',
    'Thực Đơn 30 Ngày Cai Thuốc Không Tăng Cân — Khang',
    'Thực Đơn Cai Thuốc Không Tăng Cân — 7 Ngày Mẫu',
    'Cai thuốc tăng 2-4 kg trung bình. Quy tắc 3-5-2 + thực đơn 7 ngày Việt + đi bộ 30 phút = giữ cân. Khang tăng 3 kg, giảm sau 4 tháng.',
    'thực đơn cai thuốc không tăng cân'],
];

async function processOne(slug, title, seoTitle, seoDesc, focus, dryRun, categoryId) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', `CHIP-${slug}.html`);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${slug}.png`);

  if (!fs.existsSync(htmlPath)) return { slug, status: 'NO_HTML' };
  if (!fs.existsSync(ogPath)) return { slug, status: 'NO_OG' };

  if (dryRun) {
    const existing = await findPostBySlug(slug);
    return { slug, status: 'WOULD_PUBLISH', existing: existing ? existing.id : null };
  }

  // 1. Upload OG image
  let mediaId;
  try {
    const media = await uploadFile(ogPath);
    mediaId = media.id;
  } catch (e) {
    return { slug, status: 'UPLOAD_FAIL', error: e.message, body: e.body };
  }

  // 2. Check existing post
  const existing = await findPostBySlug(slug);

  // 3. Build payload
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
    rank_math_focus_keyword: focus,
  };

  const payload = {
    slug,
    title,
    content,
    excerpt: seoDesc,
    status: 'publish',
    featured_media: mediaId,
    meta,
    ...(categoryId ? { categories: [categoryId] } : {}),
  };

  try {
    let result;
    if (existing) {
      result = await api.post(`/wp-json/wp/v2/posts/${existing.id}`, payload);
      return { slug, status: 'UPDATED', postId: result.id, mediaId, link: result.link };
    } else {
      result = await api.post(`/wp-json/wp/v2/posts`, payload);
      return { slug, status: 'CREATED', postId: result.id, mediaId, link: result.link };
    }
  } catch (e) {
    return { slug, status: 'POST_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? NEW_WIKIS.filter((w) => onlyList.includes(w[0])) : NEW_WIKIS;

  console.log(`▶ Bulk CREATE ${tasks.length} new wiki articles${dryRun ? ' (DRY RUN)' : ''}`);

  // Find Wiki category id (cố gắng — không bắt buộc)
  let categoryId = null;
  try {
    categoryId = await findCategoryId('wiki-bo-thuoc-la');
    if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);
    else console.log('  Category: (không tìm thấy, sẽ dùng default)');
  } catch (e) {
    console.log('  Category: (lỗi tra cứu, skip)');
  }
  console.log('');

  const results = [];
  for (const [slug, title, seoTitle, seoDesc, focus] of tasks) {
    process.stdout.write(`▶ ${slug.padEnd(40)}... `);
    const r = await processOne(slug, title, seoTitle, seoDesc, focus, dryRun, categoryId);
    results.push(r);
    if (r.status === 'CREATED' || r.status === 'UPDATED') {
      console.log(`✓ ${r.status} ${r.link}`);
    } else if (r.status === 'WOULD_PUBLISH') {
      console.log(`(dry-run OK${r.existing ? ` — sẽ update #${r.existing}` : ' — sẽ tạo mới'})`);
    } else {
      console.log(`✗ ${r.status}`);
      if (r.error) console.log(`   ${r.error}`);
      if (r.body) console.log(`   ${JSON.stringify(r.body).slice(0, 250)}`);
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  console.log('Tổng kết:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
