#!/usr/bin/env node
/**
 * Sol v4 — Publish/Update 11 bài Cluster A/B (đã có FAQ schema inject sẵn)
 *
 * Cluster A — Symptom & Education (6 bài):
 *   A1 cai-thuoc-la-tai-nha
 *   A2 tac-hai-cua-thuoc-la
 *   A3 trieu-chung-cai-thuoc-la-theo-ngay
 *   A4 cai-thuoc-bao-lau-phoi-sach
 *   A5 tang-can-khi-cai-thuoc
 *   A6 ngay-3-cai-thuoc-kho-nhat
 *
 * Cluster B — Method & Tool (5 bài):
 *   B1 phuong-phap-cai-thuoc-la-pho-bien
 *   B2 cold-turkey-vs-giam-dan
 *   B4 app-cai-thuoc-la-tieng-viet
 *   B5 cai-thuoc-khi-di-nhau
 *   B6 them-thuoc-dem-khuya-90-giay
 *
 * Usage:
 *   node publish-cluster-ab.js --dry-run
 *   node publish-cluster-ab.js                          # tất cả 11 bài
 *   node publish-cluster-ab.js --only=cai-thuoc-la-tai-nha,tang-can-khi-cai-thuoc
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

// ─── 11 bài Cluster A/B ─────────────────────────────────────────
// [htmlFile, slug, title (≤60c hiển thị), seoTitle (≤60c), seoDesc (120-160c), focusKeyword]
const CLUSTER = [
  // ── Cluster A: Symptom & Education ──
  ['A1-cai-thuoc-la-tai-nha.html', 'cai-thuoc-la-tai-nha',
    'Cai Thuốc Lá Tại Nhà — Lộ Trình 51 Ngày Khoa Học 2026',
    'Cai Thuốc Lá Tại Nhà — Hướng Dẫn 51 Ngày 2026',
    'Cai thuốc lá tại nhà theo lộ trình 7+14+30 ngày. Khoa học Cochrane + Khang chia sẻ kinh nghiệm 5 năm cai. Miễn phí app Đi Cùng Sol.',
    'cai thuốc lá tại nhà'],

  ['A2-tac-hai-cua-thuoc-la.html', 'tac-hai-cua-thuoc-la',
    'Tác Hại Của Thuốc Lá — 7000 Hoá Chất Lên Cơ Thể 2026',
    'Tác Hại Của Thuốc Lá — Khoa Học Toàn Diện 2026',
    'Thuốc lá chứa 7000 hoá chất, 70 chất ung thư. Giảm 10 năm tuổi thọ (Doll 2004). Tác hại đến phổi, tim, sinh lý, gia đình.',
    'tác hại của thuốc lá'],

  ['A3-trieu-chung-cai-thuoc-la-theo-ngay.html', 'trieu-chung-cai-thuoc-la-theo-ngay',
    'Triệu Chứng Cai Thuốc Lá Theo Ngày — Day 1-30 2026',
    'Triệu Chứng Cai Thuốc Theo Ngày — Day 1-30 2026',
    'Triệu chứng cai thuốc theo ngày: D1 CO giảm 50%, D3 đỉnh withdrawal, D7 cilia hoạt động, D14 FEV1 +30%. Timeline đầy đủ + cách xử lý.',
    'triệu chứng cai thuốc lá theo ngày'],

  ['A4-cai-thuoc-bao-lau-phoi-sach.html', 'cai-thuoc-bao-lau-phoi-sach',
    'Cai Thuốc Bao Lâu Phổi Sạch? Timeline 20 Năm 2026',
    'Cai Thuốc Bao Lâu Phổi Sạch — Timeline 20 Năm',
    'Phổi sạch sau cai: 72h CO hết, 3 tháng cilia phục hồi, 1 năm tar giảm 80%, 10 năm risk ung thư phổi -50%. Hướng dẫn đầy đủ.',
    'cai thuốc bao lâu phổi sạch'],

  ['A5-tang-can-khi-cai-thuoc.html', 'tang-can-khi-cai-thuoc',
    'Tăng Cân Khi Cai Thuốc — Trung Bình 2-4kg Giải Pháp 2026',
    'Tăng Cân Khi Cai Thuốc — Vì Sao & Cách Giữ Cân',
    'Cai thuốc tăng trung bình 2-4kg/3 tháng do BMR ↓ 7-10% + dopamine tìm reward khác. 5 cách giữ cân khoa học không stress.',
    'tăng cân khi cai thuốc'],

  ['A6-ngay-3-cai-thuoc-kho-nhat.html', 'ngay-3-cai-thuoc-kho-nhat',
    'Ngày 3 Cai Thuốc Khó Nhất — Bức Tường Vượt Sao 2026',
    'Ngày 3 Cai Thuốc Khó Nhất — Bức Tường 2026',
    'Ngày 3 cai thuốc khó nhất — Bức Tường withdrawal đỉnh, 70% người vấp ở đây. Vì sao + 5 chiến thuật vượt qua. Khang chia sẻ.',
    'ngày 3 cai thuốc khó nhất'],

  // ── Cluster B: Method & Tool ──
  ['B1-phuong-phap-cai-thuoc-la-pho-bien.html', 'phuong-phap-cai-thuoc-la-pho-bien',
    'Phương Pháp Cai Thuốc Lá Phổ Biến — So Sánh 2026',
    'Phương Pháp Cai Thuốc Lá Phổ Biến — Cochrane 2026',
    'So sánh phương pháp cai thuốc: cold turkey 3-5%, NRT 10-15%, Champix 20-25%, combo 35-40% (Cochrane). Chọn cách phù hợp + USP Sol.',
    'phương pháp cai thuốc lá'],

  ['B2-cold-turkey-vs-giam-dan.html', 'cold-turkey-vs-giam-dan',
    'Cold Turkey Vs Giảm Dần — Cách Nào Hiệu Quả Hơn 2026',
    'Cold Turkey Vs Giảm Dần Cai Thuốc — Khoa Học 2026',
    'Cold turkey vs giảm dần (taper): Cochrane Lindson 2019 — không khác biệt thống kê. Khang khuyên: kết hợp 14 ngày giảm + cắt sạch.',
    'cold turkey vs giảm dần'],

  ['B4-app-cai-thuoc-la-tieng-viet.html', 'app-cai-thuoc-la-tieng-viet',
    'App Cai Thuốc Lá Tiếng Việt — Top 5 So Sánh 2026',
    'App Cai Thuốc Lá Tiếng Việt — So Sánh Top 5',
    'Top 5 app cai thuốc tiếng Việt: Đi Cùng Sol, QuitNow, Smoke Free, Kwit, Quit Tracker. So sánh tính năng + giá + USP Khang.',
    'app cai thuốc lá tiếng việt'],

  ['B5-cai-thuoc-khi-di-nhau.html', 'cai-thuoc-khi-di-nhau',
    'Cai Thuốc Khi Đi Nhậu — 5 Bước Sống Sót Văn Hoá Bia 2026',
    'Cai Thuốc Đi Nhậu — Plan B 5 Bước Sống Sót',
    'Cai thuốc đi nhậu = combo nguy hiểm nhất văn hoá Việt. Rượu giảm ý chí 30%. Plan B 5 bước. Khang chia sẻ kinh nghiệm 5 năm.',
    'cai thuốc khi đi nhậu'],

  ['B6-them-thuoc-dem-khuya-90-giay.html', 'them-thuoc-dem-khuya-90-giay',
    'Thèm Thuốc Đêm Khuya — Sóng 90 Giây Vượt Qua 2026',
    'Thèm Thuốc Đêm Khuya — Kỹ Thuật 90 Giây',
    'Thèm thuốc đêm khuya là sóng 90 giây — chỉ cần "trượt sóng" hết. Kỹ thuật Marlatt (1985) + 5 cách thực hành. Khang chia sẻ.',
    'thèm thuốc đêm khuya'],
];

async function processOne(htmlFile, slug, title, seoTitle, seoDesc, focus, dryRun, categoryId) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', htmlFile);
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

  const tasks = onlyList ? CLUSTER.filter((c) => onlyList.includes(c[1])) : CLUSTER;

  console.log(`▶ Publish ${tasks.length} bài Cluster A/B${dryRun ? ' (DRY RUN)' : ''}`);

  const categoryId = await findCategoryId('wiki-bo-thuoc-la');
  if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);
  console.log('');

  const results = [];
  for (const [htmlFile, slug, title, seoTitle, seoDesc, focus] of tasks) {
    process.stdout.write(`▶ ${slug.padEnd(45)}... `);
    const r = await processOne(htmlFile, slug, title, seoTitle, seoDesc, focus, dryRun, categoryId);
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
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
