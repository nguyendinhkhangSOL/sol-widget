#!/usr/bin/env node
/**
 * Sol v4 — Đặt SEO Title + Description (Rank Math) cho 1 Page/Post
 *
 * Usage:
 *   node set-seo.js <id|slug:xxx> "<seo-title>" "<seo-description>" [--post]
 *
 * Example:
 *   node set-seo.js 42 "Sol — Cai Thuốc Lá Cùng Anh Em Việt 45+" "App cai thuốc lá tiếng Việt..."
 *
 * Rank Math lưu meta vào post_meta với keys:
 *   rank_math_title         → SEO title
 *   rank_math_description   → SEO description
 *   rank_math_canonical_url → canonical URL
 *   rank_math_focus_keyword → focus keyword
 *
 * Yêu cầu Rank Math expose REST API endpoint — nếu KHÔNG, dùng WP meta endpoint
 * /wp/v2/pages/{id} với field "meta" (cần Rank Math khai báo meta là REST-visible).
 *
 * Fallback: post_meta endpoint nếu Rank Math chưa register REST field.
 */

const { api } = require('./_lib');

async function findBySlug(type, slug) {
  const items = await api.get(`/wp-json/wp/v2/${type}?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id`);
  if (!Array.isArray(items) || items.length === 0) throw new Error(`Không tìm thấy ${type} slug "${slug}"`);
  return items[0].id;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: node set-seo.js <id|slug:xxx> "<seo-title>" "<seo-description>" [--post] [--focus="từ khoá"]');
    process.exit(1);
  }

  const target = args[0];
  const seoTitle = args[1];
  const seoDesc = args[2];
  const type = args.includes('--post') ? 'posts' : 'pages';
  const focusArg = args.find((a) => a.startsWith('--focus='));
  const focusKeyword = focusArg ? focusArg.slice(8).replace(/^["']|["']$/g, '') : '';

  let id;
  if (/^\d+$/.test(target)) {
    id = parseInt(target, 10);
  } else if (target.startsWith('slug:')) {
    id = await findBySlug(type, target.slice(5));
  } else {
    console.error('✗ Target phải là số (ID) hoặc "slug:tên-slug"');
    process.exit(1);
  }

  console.log(`▶ Đặt SEO cho ${type} #${id}:`);
  console.log(`  Title: ${seoTitle} (${seoTitle.length} chars)`);
  console.log(`  Desc:  ${seoDesc} (${seoDesc.length} chars)`);
  if (focusKeyword) console.log(`  Focus: ${focusKeyword}`);
  console.log('');

  // Try REST API endpoint
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
  };
  if (focusKeyword) meta.rank_math_focus_keyword = focusKeyword;

  try {
    const updated = await api.post(`/wp-json/wp/v2/${type}/${id}`, { meta });
    console.log('✓ ĐÃ ĐẶT SEO');
    console.log(`  URL: ${updated.link}`);
    if (updated.meta?.rank_math_title) {
      console.log(`  Verify Title: ${updated.meta.rank_math_title}`);
    } else {
      console.log('');
      console.log('⚠ Response không có meta.rank_math_title — Rank Math chưa expose qua REST.');
      console.log('  → Em sẽ build fallback dùng custom endpoint Rank Math.');
    }
  } catch (e) {
    console.error('✗ FAIL:', e.message);
    if (e.body) console.error(JSON.stringify(e.body, null, 2));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
