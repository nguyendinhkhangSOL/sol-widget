#!/usr/bin/env node
/**
 * Sol v4 — Add "📖 Bài liên quan" section cuối mỗi bài Phenomena Day
 *
 * Tăng mật độ internal link từ 1.74 → ~3.5 link/bài (chuẩn SEO).
 *
 * Idempotent: nếu bài đã có section "sol-related" → skip.
 * Insert TRƯỚC tag </div> đầu tiên gặp class "cta-box" hoặc cuối content.
 *
 * Usage:
 *   node add-related-links.js --dry-run
 *   node add-related-links.js
 */

const { api } = require('./_lib');

const dryRun = process.argv.includes('--dry-run');

// ─── Mapping: slug → 3 bài liên quan (slug + label) ─────────────────
// Chuỗi timeline Phenomena Day — cross-link nhau theo thứ tự
const RELATED_LINKS = {
  // Phenomena Day series (timeline chronological)
  '24h-dau-bo-thuoc': [
    ['quy-luat-5-phut', 'Quy luật 5 phút khi thèm thuốc'],
    ['ngay-2-3-bo-thuoc', 'Ngày 2-3 sau khi bỏ thuốc — đỉnh withdrawal'],
    ['72-gio-dau-bo-thuoc-la', '72 giờ đầu — cột mốc nicotine sạch'],
  ],
  'ngay-2-3-bo-thuoc': [
    ['24h-dau-bo-thuoc', '24 giờ đầu sau bỏ thuốc'],
    ['ngay-4-7-bo-thuoc-hoi-phuc-ban-dau', 'Ngày 4-7 — giai đoạn hồi phục ban đầu'],
    ['72-gio-dau-bo-thuoc-la', '72 giờ đầu — nicotine rời cơ thể'],
  ],
  'ngay-4-7-bo-thuoc-hoi-phuc-ban-dau': [
    ['ngay-2-3-bo-thuoc', 'Ngày 2-3 — đỉnh khó nhất'],
    ['tuan-2-bo-thuoc-nao-tai-can-bang', 'Tuần 2 — não bắt đầu tái cân bằng'],
    ['dau-dau-sau-cai', 'Đau đầu sau khi cai — bài chi tiết'],
  ],
  'tuan-2-bo-thuoc-nao-tai-can-bang': [
    ['ngay-4-7-bo-thuoc-hoi-phuc-ban-dau', 'Ngày 4-7 hồi phục ban đầu'],
    ['tuan-3-4-sau-khi-bo-thuoc', 'Tuần 3-4 sau khi bỏ thuốc'],
    ['buon-chan-tuan-2', '"Đống tro tàn" — buồn vô cớ tuần 2'],
  ],
  'tuan-3-4-sau-khi-bo-thuoc': [
    ['tuan-2-bo-thuoc-nao-tai-can-bang', 'Tuần 2 — não tái cân bằng'],
    ['sau-30-ngay-bo-thuoc', 'Sau 30 ngày bỏ thuốc — milestone đầu'],
    ['ngay-3-cai-thuoc-kho-nhat', 'Ngày 3 — ngày khó nhất, vì sao?'],
  ],
  'sau-30-ngay-bo-thuoc': [
    ['tuan-3-4-sau-khi-bo-thuoc', 'Tuần 3-4 — tổng kết tháng đầu'],
    ['cai-thuoc-bao-lau-phoi-sach', 'Phổi sạch sau bao lâu cai?'],
    ['tim-mach-hoi-phuc', 'Tim mạch hồi phục — timeline'],
  ],

  // Quy luật 5 phút — link sang series
  'quy-luat-5-phut': [
    ['them-thuoc-dem-khuya-90-giay', 'Thèm thuốc đêm khuya — kỹ thuật 90 giây'],
    ['24h-dau-bo-thuoc', '24 giờ đầu — chiến thuật vượt qua'],
    ['ngay-3-cai-thuoc-kho-nhat', 'Ngày 3 — ngày khó nhất'],
  ],

  // 72 giờ
  '72-gio-dau-bo-thuoc-la': [
    ['nicotine-roi-khoi-co-the-trong-bao-lau', 'Nicotine rời cơ thể trong bao lâu?'],
    ['ngay-2-3-bo-thuoc', 'Ngày 2-3 — đỉnh withdrawal'],
    ['quy-luat-5-phut', 'Quy luật 5 phút khi thèm'],
  ],

  // Nicotine
  'nicotine-roi-khoi-co-the-trong-bao-lau': [
    ['72-gio-dau-bo-thuoc-la', '72 giờ đầu sau bỏ thuốc'],
    ['cai-thuoc-bao-lau-phoi-sach', 'Phổi sạch sau bao lâu?'],
    ['con-them-nicotine-thuoc-la-keo-dai-bao-lau', 'Cơn thèm kéo dài bao lâu?'],
  ],

  // Tăng cân
  'bo-thuoc-la-co-tang-can-khong': [
    ['tang-can-khi-cai-thuoc', 'Tăng cân khi cai — vì sao + cách giảm'],
    ['thuc-don-cai-thuoc-khong-tang-can', 'Thực đơn 30 ngày không tăng cân'],
    ['sau-30-ngay-bo-thuoc', 'Sau 30 ngày — tổng kết'],
  ],

  // Con them
  'lam-gi-khi-con-them-thuoc-ap-den': [
    ['quy-luat-5-phut', 'Quy luật 5 phút khi thèm'],
    ['them-thuoc-dem-khuya-90-giay', '90 giây vượt sóng thèm'],
    ['sap-hut-lai-cuu', 'Sắp hút lại — cứu nguy'],
  ],
  'con-them-nicotine-thuoc-la-keo-dai-bao-lau': [
    ['nicotine-roi-khoi-co-the-trong-bao-lau', 'Nicotine sạch sau bao lâu?'],
    ['them-thuoc-dem-khuya-90-giay', 'Sóng thèm 90 giây'],
    ['quy-luat-5-phut', 'Quy luật 5 phút'],
  ],
};

const RELATED_MARKER = 'sol-related-links'; // marker để skip idempotent

function buildRelatedHtml(items) {
  const links = items.map(([slug, label]) =>
    `  <li style="margin-bottom: 8px;"><a href="https://sol.vn/${slug}/" style="color: #B25C2C; text-decoration: none;">→ ${label}</a></li>`
  ).join('\n');

  return `
<div class="${RELATED_MARKER}" style="background: #FFF4EA; border-left: 4px solid #B25C2C; padding: 18px 22px; margin: 32px 0 16px; border-radius: 8px;">
  <h3 style="color: #5C3A1E; margin: 0 0 12px; font-size: 17px;">📖 Bài liên quan trong hành trình</h3>
  <ul style="margin: 0; padding-left: 20px; list-style: none;">
${links}
  </ul>
</div>
`.trim();
}

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft&context=edit&_fields=id,slug,content`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function main() {
  console.log(`▶ Add "Bài liên quan" cho ${Object.keys(RELATED_LINKS).length} bài${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  let added = 0, skipped = 0, notFound = 0, failed = 0;

  for (const [slug, related] of Object.entries(RELATED_LINKS)) {
    const post = await findPostBySlug(slug);
    if (!post) {
      console.log(`⚠ ${slug.padEnd(50)} NOT FOUND`);
      notFound++;
      continue;
    }

    const html = post.content?.rendered || '';

    // Skip nếu đã có section
    if (html.includes(RELATED_MARKER)) {
      console.log(`◯ ${slug.padEnd(50)} đã có (skip)`);
      skipped++;
      continue;
    }

    const relatedHtml = buildRelatedHtml(related);
    let newHtml;

    // Insert TRƯỚC cta-box nếu có, ELSE append cuối
    const ctaMatch = html.match(/<div class="cta-box"/);
    if (ctaMatch) {
      newHtml = html.replace(/<div class="cta-box"/, relatedHtml + '\n<div class="cta-box"');
    } else {
      // Append before closing </div> last hoặc cuối content
      newHtml = html + '\n' + relatedHtml;
    }

    console.log(`✓ ${slug.padEnd(50)} +${related.length} link`);

    if (!dryRun) {
      try {
        await api.post(`/wp-json/wp/v2/posts/${post.id}`, { content: newHtml });
        added++;
      } catch (e) {
        console.log(`    ✗ FAIL: ${e.message}`);
        if (e.body) console.log(`    ${JSON.stringify(e.body).slice(0, 250)}`);
        failed++;
      }
    } else {
      added++;
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log(`${dryRun ? 'Would add' : 'Added'}: ${added} bài`);
  console.log(`Already has section: ${skipped}`);
  if (notFound > 0) console.log(`Not found: ${notFound}`);
  if (failed > 0) console.log(`Failed: ${failed}`);
  console.log('━'.repeat(70));
  if (dryRun) console.log('Bỏ --dry-run để apply.');
}

main().catch((e) => { console.error('Error:', e.message); if (e.body) console.error(JSON.stringify(e.body, null, 2)); process.exit(1); });
