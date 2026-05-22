#!/usr/bin/env node
/**
 * Sol — Publish 7 bài flagship Sprint 31-5 lên WordPress sol.vn
 *
 * Reuse pattern bulk-create-new-wikis.js. Khác:
 *   - HTML path: wiki-skeletons/sprint-31-5/0X-<slug>.html
 *   - OG image OPTIONAL (skip nếu thiếu — Khang gen sau)
 *   - 7 bài Sprint 31-5 với SEO metadata đầy đủ
 *
 * Usage:
 *   node publish-sprint-31-5.js --dry-run     # preview, không push
 *   node publish-sprint-31-5.js               # push tất cả 7 bài
 *   node publish-sprint-31-5.js --only=01,03  # chỉ bài 1 + 3
 *   node publish-sprint-31-5.js --draft       # publish dưới status draft
 *
 * Yêu cầu:
 *   - .env có WP_URL, WP_USERNAME, WP_APP_PASSWORD
 *   - 7 file HTML trong wiki-skeletons/sprint-31-5/
 *   - (Optional) 7 OG image trong wiki-skeletons/sprint-31-5/og-images/<slug>.png
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

// ─── 7 bài Sprint 31-5 ──────────────────────────────────────────
// [num, slug, title (≤60c hợp WP), seo_title (≤60c rank_math), seo_desc (120-160c), focus_keyword]
const SPRINT_BAI = [
  ['01', 'world-no-tobacco-day-2026-viet-nam',
    'World No Tobacco Day 31/5/2026 — Người Việt Cần Biết Gì',
    'World No Tobacco Day 31/5/2026: Người Việt Cần Biết | sol.vn',
    'WHO chọn 31/5/2026 chủ đề "Unmasking the appeal" — bóc trần chiêu marketing thuốc lá nhắm trẻ em. 15.4 triệu người Việt hút, 40.000 chết/năm. 8 sự thật cần biết.',
    'world no tobacco day 2026'],

  ['02', '7-dau-hieu-nghien-nicotine-nang',
    '7 Dấu Hiệu Anh Đang Nghiện Nicotine NẶNG — Test FTND 90s',
    '7 Dấu Hiệu Nghiện Nicotine Nặng — Test FTND 90s | sol.vn',
    'Anh hút trong 5 phút sau khi thức dậy? Đó là 1 trong 7 dấu hiệu nghiện nicotine NẶNG theo Fagerström 1991. Test FTND miễn phí 90 giây.',
    'dấu hiệu nghiện thuốc lá'],

  ['03', 'cach-bo-thuoc-la-88-ngay-lo-trinh-sol',
    'Cách Bỏ Thuốc Lá 88 Ngày — Lộ Trình Sol Step-by-Step',
    'Cách Bỏ Thuốc Lá 88 Ngày — Lộ Trình Sol Step-by-Step | sol.vn',
    'Hướng dẫn bỏ thuốc lá theo phương pháp Hybrid 5 của Sol — 4 phase: Nhận Thức 7d FREE, Hành Động 21d, Giải Phóng 30d, Tái Thiết 30d. Step-by-step.',
    'cách bỏ thuốc lá'],

  ['04', 'co-the-hoi-phuc-sau-bo-thuoc-timeline',
    'Bỏ Thuốc Bao Lâu Phổi Sạch? Timeline 20 Phút → 10 Năm',
    'Bỏ Thuốc Lá Bao Lâu Phổi Sạch? Timeline 20p → 10n | sol.vn',
    'Sau 20 phút huyết áp ổn. Sau 12 giờ CO máu giảm 50%. Sau 1 năm tim mạch giảm 50% nguy cơ. Sau 10 năm ung thư phổi giảm 50%. Chi tiết từng mốc.',
    'bỏ thuốc bao lâu phổi sạch'],

  ['05', '5-ly-do-nguoi-viet-that-bai-cai-thuoc',
    '5 Lý Do Người Việt Thất Bại Cai Thuốc Lá — Cách Khắc Phục',
    '5 Lý Do Người Việt Thất Bại Cai Thuốc — Sol Giải | sol.vn',
    '90% người Việt cai thuốc thất bại lần đầu. 5 lý do: thiếu kế hoạch, áp lực nhậu, không người đồng hành, dùng sai phương pháp, bỏ cuộc lần thèm. Cách Sol giải.',
    'tại sao cai thuốc thất bại'],

  ['06', 'app-cai-thuoc-la-tieng-viet-2026-so-sanh',
    'App Cai Thuốc Lá Tiếng Việt 2026 — So Sánh 5 App Tốt Nhất',
    'App Cai Thuốc Lá Tiếng Việt 2026: 5 App Top | sol.vn',
    'So sánh 5 app cai thuốc 2026: Sol, QuitGenius, Smoke Free, Kwit, EasyQuit. Sol = app duy nhất viết riêng cho đàn ông Việt 45+, AI Mentor Gemini.',
    'app cai thuốc lá tiếng việt'],

  ['07', 'khang-sol-cau-chuyen-sach-thuoc-tu-2021',
    'Khang Sol — 30 Năm Hút Vinataba, 5 Năm Tự Do (Story)',
    'Khang Sol: 30 Năm Hút, 5 Năm Tự Do — Câu Chuyện Thật | sol.vn',
    'Câu chuyện thật Khang Sol — kỹ sư IT 45 tuổi, hút Vinataba từ 15 tuổi ở quê, thử bỏ 4 lần thất bại, lần 5 thành công 22/12/2020. Bài học 5 năm Tự do.',
    'câu chuyện cai thuốc thành công'],
];

async function processOne({ num, slug, title, seoTitle, seoDesc, focus, dryRun, draft, categoryId }) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'sprint-31-5', `${num}-${slug}.html`);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'sprint-31-5', 'og-images', `${slug}.png`);

  if (!fs.existsSync(htmlPath)) return { slug, status: 'NO_HTML', path: htmlPath };
  const hasOg = fs.existsSync(ogPath);

  if (dryRun) {
    const existing = await findPostBySlug(slug);
    return { slug, status: 'WOULD_PUBLISH', existing: existing ? existing.id : null, hasOg };
  }

  // 1. Upload OG image (optional — skip nếu chưa gen)
  let mediaId = null;
  if (hasOg) {
    try {
      const media = await uploadFile(ogPath);
      mediaId = media.id;
    } catch (e) {
      console.warn(`  ⚠️  OG upload fail (continuing without): ${e.message}`);
    }
  } else {
    console.warn(`  ⚠️  No OG image — publish without featured_media`);
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
    status: draft ? 'draft' : 'publish',
    meta,
    ...(mediaId ? { featured_media: mediaId } : {}),
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
  const draft = process.argv.includes('--draft');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList
    ? SPRINT_BAI.filter((b) => onlyList.includes(b[0]) || onlyList.includes(b[1]))
    : SPRINT_BAI;

  console.log(`\n▶ Sprint 31-5: Publish ${tasks.length} bài flagship`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : draft ? 'DRAFT' : 'PUBLISH'}`);
  console.log('');

  // Find category
  let categoryId = null;
  try {
    categoryId = await findCategoryId('wiki-bo-thuoc-la');
    if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);
    else console.log('  Category: (không tìm thấy wiki-bo-thuoc-la, dùng default)');
  } catch (e) {
    console.log(`  Category: (lỗi tra cứu — ${e.message})`);
  }
  console.log('');

  const results = [];
  for (const [num, slug, title, seoTitle, seoDesc, focus] of tasks) {
    process.stdout.write(`▶ [${num}] ${slug.padEnd(42)}... `);
    const r = await processOne({ num, slug, title, seoTitle, seoDesc, focus, dryRun, draft, categoryId });
    results.push(r);

    if (r.status === 'CREATED' || r.status === 'UPDATED') {
      console.log(`✓ ${r.status} ${r.link}`);
    } else if (r.status === 'WOULD_PUBLISH') {
      console.log(`📋 ${r.existing ? 'would UPDATE #' + r.existing : 'would CREATE'} ${r.hasOg ? '(+OG)' : '(no OG)'}`);
    } else if (r.status === 'NO_HTML') {
      console.log(`✗ NO HTML at ${r.path}`);
    } else {
      console.log(`✗ ${r.status} — ${r.error || ''}`);
      if (r.body) console.log(`    ${JSON.stringify(r.body).slice(0, 200)}`);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(counts).forEach(([s, n]) => console.log(`  ${s}: ${n}`));

  // List published URLs
  const published = results.filter((r) => r.link);
  if (published.length > 0) {
    console.log('\n=== PUBLISHED URLs ===');
    published.forEach((r) => console.log(`  https://sol.vn${new URL(r.link).pathname}`));

    console.log('\n=== Next steps ===');
    console.log('  1. Submit URLs vào GSC URL Inspection → Request Indexing');
    console.log('  2. Add OG images vào wiki-skeletons/sprint-31-5/og-images/ rồi re-run');
    console.log('  3. Post link FB Group + Zalo OA broadcast');
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
