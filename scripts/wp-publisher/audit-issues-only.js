#!/usr/bin/env node
/**
 * Sol v4 — Liệt kê CHỈ những bài có vấn đề SEO/featured trong category
 *
 * Usage:
 *   node audit-issues-only.js wiki-bo-thuoc-la
 */

const { api } = require('./_lib');

const categorySlug = process.argv[2] || 'wiki-bo-thuoc-la';

function stripEntities(s) {
  return (s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[^;]+;/g, '');
}

async function main() {
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(categorySlug)}&_fields=id`);
  if (!cats[0]) { console.error('Category not found'); process.exit(1); }
  const catId = cats[0].id;

  const posts = [];
  let page = 1;
  while (true) {
    let items;
    try {
      items = await api.get(
        `/wp-json/wp/v2/posts?categories=${catId}&status=publish,draft&context=edit&per_page=50&page=${page}&_fields=id,slug,title,link,featured_media,meta,excerpt`
      );
    } catch (e) {
      // WP returns 400 "rest_post_invalid_page_number" khi page vượt total — stop pagination
      if (e.status === 400 && e.body?.code === 'rest_post_invalid_page_number') break;
      throw e;
    }
    if (!items.length) break;
    posts.push(...items);
    if (items.length < 50) break;
    page++;
    if (page > 10) break;
  }

  const problems = [];
  for (const p of posts) {
    const m = p.meta || {};
    const seoTitle = m.rank_math_title || '';
    const seoDesc = m.rank_math_description || '';
    const focus = m.rank_math_focus_keyword || '';
    const issues = [];

    if (!seoTitle) issues.push('NO_SEO_TITLE');
    else if (seoTitle.length > 60) issues.push(`SEO_TITLE_TOO_LONG (${seoTitle.length}c)`);
    else if (seoTitle.length < 30) issues.push(`SEO_TITLE_TOO_SHORT (${seoTitle.length}c)`);

    if (!seoDesc) issues.push('NO_SEO_DESC');
    else if (seoDesc.length < 120 || seoDesc.length > 160) issues.push(`SEO_DESC_LEN (${seoDesc.length}c)`);

    if (!focus) issues.push('NO_FOCUS_KEYWORD');
    if (!p.featured_media) issues.push('NO_FEATURED');

    if (issues.length > 0) problems.push({ p, issues, seoTitle, seoDesc, focus });
  }

  console.log(`▶ Bài có vấn đề (${problems.length}/${posts.length}):`);
  console.log('');
  problems.forEach(({ p, issues, seoTitle, seoDesc, focus }) => {
    console.log(`#${p.id} — ${p.slug}`);
    console.log(`    Title:    ${stripEntities(p.title?.rendered)}`);
    console.log(`    URL:      ${p.link}`);
    console.log(`    SEO Title (${seoTitle.length}c): ${seoTitle || '(rỗng)'}`);
    console.log(`    SEO Desc  (${seoDesc.length}c): ${seoDesc || '(rỗng)'}`);
    console.log(`    Focus:    ${focus || '(rỗng)'}`);
    console.log(`    Featured: ${p.featured_media || '(không có)'}`);
    console.log(`    ⚠️  ${issues.join(', ')}`);
    console.log('');
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
