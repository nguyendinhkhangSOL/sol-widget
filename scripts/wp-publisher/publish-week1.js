#!/usr/bin/env node
/**
 * Sol v4 — Publish bài Tuần 1 (Nhóm 6 + Pillar 2B)
 *
 * Tuần 1 sẽ publish lần lượt 5 bài. Bài 1: cai-thuoc-bao-nhieu-lan-moi-thanh-cong
 *
 * Usage:
 *   node publish-week1.js --dry-run
 *   node publish-week1.js                              # publish all in queue
 *   node publish-week1.js --only=cai-thuoc-bao-nhieu-lan-moi-thanh-cong
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

// ─── Tuần 1 — 5 bài (Nhóm 6 + Pillar 2B) ─────────────────
// slug, title (≤60c), seo_title (≤60c), seo_desc (120-160c), focus_keyword
const WEEK1 = [
  // Nhóm 6 — Last-resort (3 bài)
  ['cai-thuoc-bao-nhieu-lan-moi-thanh-cong',
    'Cai Thuốc Bao Nhiêu Lần Mới Thành Công? — Khoa Học 2026',
    'Cai Thuốc Bao Nhiêu Lần Mới Thành Công? Trung Bình 30+',
    'Khoa học 2026: trung bình 30+ lần thử mới cai hẳn. Khang đã cai 5 lần — lần 5 là cuối. Tỷ lệ thành công + chiến lược lần tiếp theo.',
    'cai thuốc bao nhiêu lần thành công'],

  ['khong-the-cai-thuoc-da-thu-moi-cach',
    'Không Thể Cai Thuốc — Đã Thử Mọi Cách Vẫn Vấp 2026',
    'Không Thể Cai Thuốc — Đã Thử Mọi Cách Vẫn Vấp?',
    'Đã thử cold turkey, NRT, Champix, vape — vẫn không cai. Vấn đề KHÔNG phải bạn — là dùng từng cách đơn lẻ. Combo 4 lớp = tỷ lệ thành công 50%.',
    'không cai được thuốc lá'],

  ['mat-y-chi-cai-thuoc-phai-lam-sao',
    'Mất Ý Chí Cai Thuốc Phải Làm Sao? — Khoa Học 2026',
    'Mất Ý Chí Cai Thuốc — Lỗi Hệ Thống, Không Phải Anh',
    'Mất ý chí cai thuốc KHÔNG phải lỗi cá nhân — là dopamine tụt + ý chí cạn. 6 bước xây hệ thống không cần ý chí. Khang chia sẻ kinh nghiệm.',
    'mất ý chí cai thuốc'],

  ['phoi-den-co-sach-lai-duoc-khong',
    'Phổi Đen Có Sạch Lại Được Không Sau Khi Cai? 2026',
    'Phổi Đen Có Sạch Lại Được Không? — Timeline 20 Năm',
    'Phổi tự sạch tar 80-90% sau cai 1-3 năm. Cilia phục hồi 3 tháng, FEV1 tăng 30%, ung thư phổi giảm 50% sau 10 năm. Khang chia sẻ CT trước-sau.',
    'phổi đen có sạch không'],

  ['kha-nang-tinh-duc-sau-cai-thuoc',
    'Khả Năng Sinh Lý Sau Cai Thuốc — Phục Hồi 12 Tháng',
    'Khả Năng Sinh Lý Sau Cai Thuốc — Khoa Học 2026',
    'Cai thuốc 2-4 tuần cương cứng cải thiện. 3 tháng ED giảm 50%. 6 tháng tinh trùng tốt hơn. Khang: 50 tuổi cảm thấy như 40 sau 4 năm cai.',
    'sinh lý sau cai thuốc'],
];

async function processOne(slug, title, seoTitle, seoDesc, focus, dryRun, categoryId) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', `CHIP-${slug}.html`);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${slug}.png`);

  if (!fs.existsSync(htmlPath)) return { slug, status: 'NO_HTML' };
  if (!fs.existsSync(ogPath)) return { slug, status: 'NO_OG' };

  if (dryRun) {
    const existing = await findPostBySlug(slug);
    return { slug, status: 'WOULD_PUBLISH', existing: existing?.id };
  }

  let mediaId;
  try {
    const media = await uploadFile(ogPath);
    mediaId = media.id;
  } catch (e) {
    return { slug, status: 'UPLOAD_FAIL', error: e.message };
  }

  const existing = await findPostBySlug(slug);
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
    rank_math_focus_keyword: focus,
  };

  const payload = {
    slug, title, content, excerpt: seoDesc, status: 'publish',
    featured_media: mediaId, meta,
    ...(categoryId ? { categories: [categoryId] } : {}),
  };

  try {
    const result = existing
      ? await api.post(`/wp-json/wp/v2/posts/${existing.id}`, payload)
      : await api.post(`/wp-json/wp/v2/posts`, payload);
    return {
      slug, status: existing ? 'UPDATED' : 'CREATED',
      postId: result.id, mediaId, link: result.link,
    };
  } catch (e) {
    return { slug, status: 'POST_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? WEEK1.filter((w) => onlyList.includes(w[0])) : WEEK1;

  console.log(`▶ Publish ${tasks.length} bài Tuần 1${dryRun ? ' (DRY RUN)' : ''}`);

  const categoryId = await findCategoryId('wiki-bo-thuoc-la');
  if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);
  console.log('');

  const results = [];
  for (const [slug, title, seoTitle, seoDesc, focus] of tasks) {
    process.stdout.write(`▶ ${slug.padEnd(45)}... `);
    const r = await processOne(slug, title, seoTitle, seoDesc, focus, dryRun, categoryId);
    results.push(r);
    if (r.status === 'CREATED' || r.status === 'UPDATED') console.log(`✓ ${r.status} ${r.link}`);
    else if (r.status === 'WOULD_PUBLISH') console.log(`(dry-run — ${r.existing ? `update #${r.existing}` : 'tạo mới'})`);
    else {
      console.log(`✗ ${r.status}`);
      if (r.error) console.log(`   ${r.error}`);
      if (r.body) console.log(`   ${JSON.stringify(r.body).slice(0, 200)}`);
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  console.log('Tổng kết:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
