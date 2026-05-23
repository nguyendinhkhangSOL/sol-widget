#!/usr/bin/env node
/**
 * Sol v4 — Bulk set SEO Title + Description + Focus Keyword cho nhiều Page
 *
 * Usage:
 *   node bulk-set-seo.js                  → chạy theo mapping
 *   node bulk-set-seo.js --dry-run        → chỉ in plan
 *   node bulk-set-seo.js --only=gia,pilot → chỉ slug cụ thể
 *
 * Yêu cầu MU-plugin rank-math-rest.php đã upload vào /wp-content/mu-plugins/
 */

const { api } = require('./_lib');

// ─── SEO mapping: [tên, slug, title (≤60 chars), desc (120-160 chars), focus keyword] ────
const SEO_MAPPING = [
  [
    'Homepage',
    'home-v3',
    'Sol — Cai Thuốc Lá Cùng Anh Em Việt 45+',
    'App cai thuốc lá tiếng Việt cho đàn ông 45+. Khang Sol 30 năm hút, 5 năm Tự do. 3 lộ trình 35/52/65 ngày. MIỄN PHÍ 7 ngày trước.',
    'cai thuốc lá',
  ],
  [
    'Trang Giá',
    'gia',
    'Giá Sol — 3 Lộ Trình Cai Thuốc, 4 Cách Trả Tiền',
    'Bảng giá Đi Cùng Sol — 3 lộ trình Nhẹ 35d / Vừa 52d / Nặng 65d. 4 cách trả: Trả Thử 49k / Tuần / Một Lần / Sau Khi Thành Công. Hoàn tiền không hỏi.',
    'giá cai thuốc lá',
  ],
  [
    'Câu chuyện Khang',
    'khang-sol',
    'Khang Sol — 30 Năm Hút Vinataba, 5 Năm Tự Do',
    'Câu chuyện founder Đi Cùng Sol. Đã hút Vinataba 30 năm từ 15 tuổi ở quê. Thử bỏ 4 lần thất bại. Lần thứ 5 thành công 22-12-2020 — đến nay 5 năm Tự do.',
    'khang sol',
  ],
  [
    'Sol là gì',
    'sol-la-gi',
    'Đi Cùng Sol Là Gì — Phương Pháp Cai Thuốc Cho Việt 45+',
    'Sol là phương pháp Hybrid 5 — tổng hợp Cold Turkey, NRT, Champix, Allen Carr, app tracker. Viết tiếng Việt cho anh em 45+. 51 ngày Sol đi cùng + Cuốn Nhật Ký giữ mãi.',
    'sol đi cùng',
  ],
  [
    'Câu hỏi (FAQ)',
    'cau-hoi',
    '21 Câu Hỏi Về Cai Thuốc — Khang Trả Lời Thẳng',
    '21 câu hỏi anh em hay hỏi mình về cai thuốc lá: bao lâu hết thèm, tăng cân, lỡ điếu, Champix/NRT, giá, hoàn tiền. Khang trả lời thẳng từ 30 năm hút + 5 năm Tự do.',
    'câu hỏi cai thuốc lá',
  ],
  [
    'Pilot 30 anh em',
    'pilot',
    'Pilot Sol — 30 Anh Em Đầu Tiên Cai Thuốc Miễn Phí',
    'Pilot Q2/2026 — 30 anh em đầu nhận MIỄN PHÍ Đi Cùng Sol (giá 149-349k). Đổi lại: check-in 30 giây/ngày + phỏng vấn cuối lộ trình. Đăng ký ngay.',
    'pilot cai thuốc',
  ],
  [
    '5 phương pháp',
    'phuong-phap-cai-thuoc-la',
    '5 Phương Pháp Cai Thuốc Lá — So Sánh + Sol Hybrid',
    'So sánh chi tiết Cold Turkey, NRT, Champix, Allen Carr, app tracker. Mỗi cái mạnh ở đâu, yếu ở đâu. Đi Cùng Sol = Hybrid 5 — viết tiếng Việt cho Việt 45+.',
    'phương pháp cai thuốc lá',
  ],
  [
    'Hub Bỏ thuốc lá',
    'bo-thuoc-la',
    'Cai Thuốc Lá — Đi Cùng Sol Cho Anh Em Việt 45+',
    'Hub bỏ thuốc lá tiếng Việt #1 cho đàn ông 45+. Cá nhân hoá theo Mức Lệ Thuộc Nicotin (FTND). 3 lộ trình 35/52/65 ngày. 4 cách trả linh hoạt. MIỄN PHÍ 7 ngày trước.',
    'bỏ thuốc lá',
  ],
];

async function findBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug`);
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[0];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? SEO_MAPPING.filter((m) => onlyList.includes(m[1])) : SEO_MAPPING;
  console.log(`▶ Bulk set SEO cho ${tasks.length} page${dryRun ? ' (DRY RUN)' : ''}…`);
  console.log('');

  const results = [];
  for (const [name, slug, title, desc, focus] of tasks) {
    console.log(`▶ ${name.padEnd(22)} | slug=${slug.padEnd(28)} | title=${title.length}c | desc=${desc.length}c`);

    let page;
    try {
      page = await findBySlug(slug);
    } catch (e) {
      console.log(`  ✗ API ERROR: ${e.message}`);
      results.push({ slug, status: 'api-error' });
      continue;
    }
    if (!page) {
      console.log(`  ⚠ PAGE NOT FOUND on WP`);
      results.push({ slug, status: 'not-found' });
      continue;
    }

    if (dryRun) {
      console.log(`  (dry-run) sẽ set SEO cho id=${page.id}`);
      console.log(`    Title:  ${title}`);
      console.log(`    Desc:   ${desc}`);
      console.log(`    Focus:  ${focus}`);
      results.push({ slug, status: 'would-set', id: page.id });
      continue;
    }

    const meta = {
      rank_math_title: title,
      rank_math_description: desc,
      rank_math_focus_keyword: focus,
    };

    try {
      const updated = await api.post(`/wp-json/wp/v2/pages/${page.id}`, { meta });
      const verified = updated.meta?.rank_math_title;
      if (verified) {
        console.log(`  ✓ DONE — Verify: ${verified}`);
        results.push({ slug, status: 'set', id: page.id });
      } else {
        console.log(`  ⚠ Update gửi rồi nhưng response không có meta — kiểm tra MU-plugin có active?`);
        results.push({ slug, status: 'no-verify', id: page.id });
      }
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}`);
      if (e.body) console.log(`    ${JSON.stringify(e.body)}`);
      results.push({ slug, status: 'fail', error: e.message });
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Tổng kết:');
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('');
  console.log('💡 Sau khi set SEO xong, clear cache để sol.vn hiển thị title/desc mới.');
  console.log('   Verify: View Page Source → tìm <title> và <meta name="description">');
}

main().catch((e) => { console.error(e); process.exit(1); });
