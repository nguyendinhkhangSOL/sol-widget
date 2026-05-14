#!/usr/bin/env node
/**
 * Sol v4 — Audit toàn bộ bài trong 1 category (vd wiki-bo-thuoc-la)
 *
 * Liệt kê từng bài + check SEO quality:
 *   - slug pattern (có /wiki/ prefix cũ?)
 *   - Rank Math title (≤60c, chứa focus keyword?)
 *   - Rank Math description (120-160c?)
 *   - Focus keyword (có không?)
 *   - Featured image (có hay không?)
 *   - Excerpt
 *   - Content length
 *
 * Usage:
 *   node audit-category.js <category-slug>    # vd wiki-bo-thuoc-la
 *   node audit-category.js wiki-bo-thuoc-la --csv > audit.csv
 */

const { api } = require('./_lib');

const categorySlug = process.argv[2] || 'wiki-bo-thuoc-la';
const csvMode = process.argv.includes('--csv');

function pad(s, n) {
  s = String(s ?? '');
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

function audit(post) {
  const issues = [];
  const meta = post.meta || {};
  const seoTitle = meta.rank_math_title || '';
  const seoDesc = meta.rank_math_description || '';
  const focus = meta.rank_math_focus_keyword || '';

  // SEO checks
  if (!seoTitle) issues.push('NO_SEO_TITLE');
  else if (seoTitle.length > 60) issues.push(`SEO_TITLE_TOO_LONG(${seoTitle.length})`);
  else if (seoTitle.length < 30) issues.push(`SEO_TITLE_TOO_SHORT(${seoTitle.length})`);

  if (!seoDesc) issues.push('NO_SEO_DESC');
  else if (seoDesc.length < 120 || seoDesc.length > 160) issues.push(`SEO_DESC_LEN(${seoDesc.length})`);

  if (!focus) issues.push('NO_FOCUS_KEYWORD');

  // Featured image
  if (!post.featured_media || post.featured_media === 0) issues.push('NO_FEATURED');

  // Slug
  if (post.slug.startsWith('wiki-')) issues.push('OLD_WIKI_PREFIX');

  // Excerpt
  if (!post.excerpt?.rendered || post.excerpt.rendered.length < 50) issues.push('WEAK_EXCERPT');

  // Content length
  const contentText = (post.content?.rendered || '').replace(/<[^>]+>/g, '');
  if (contentText.length < 1000) issues.push(`SHORT(${contentText.length}c)`);

  return { issues, seoTitle, seoDesc, focus, contentLen: contentText.length };
}

async function main() {
  // Find category ID
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(categorySlug)}&_fields=id,name,count`);
  if (!Array.isArray(cats) || cats.length === 0) {
    console.error(`✗ Không tìm thấy category slug="${categorySlug}"`);
    process.exit(1);
  }
  const cat = cats[0];

  if (!csvMode) {
    console.log(`▶ Category: ${cat.name} (#${cat.id}) — ${cat.count} bài`);
    console.log('');
  }

  // Fetch all posts in category (paginate)
  const allPosts = [];
  let page = 1;
  while (true) {
    let items;
    try {
      items = await api.get(
        `/wp-json/wp/v2/posts?categories=${cat.id}&status=publish,draft,private&context=edit&per_page=50&page=${page}&_fields=id,slug,title,link,featured_media,excerpt,content,meta,date,status`
      );
    } catch (e) {
      if (e.status === 400 && e.body?.code === 'rest_post_invalid_page_number') break;
      throw e;
    }
    if (!Array.isArray(items) || items.length === 0) break;
    allPosts.push(...items);
    if (items.length < 50) break;
    page++;
    if (page > 20) break; // safety
  }

  if (csvMode) {
    // CSV header
    console.log('id,slug,status,title,link,seoTitle,seoTitleLen,seoDesc,seoDescLen,focus,featuredMedia,contentLen,issues');
    for (const post of allPosts) {
      const a = audit(post);
      const title = (post.title?.rendered || '').replace(/&[^;]+;/g, '').replace(/"/g, '""');
      const csv = [
        post.id,
        post.slug,
        post.status,
        `"${title}"`,
        post.link,
        `"${a.seoTitle.replace(/"/g, '""')}"`,
        a.seoTitle.length,
        `"${a.seoDesc.replace(/"/g, '""')}"`,
        a.seoDesc.length,
        `"${a.focus.replace(/"/g, '""')}"`,
        post.featured_media || 0,
        a.contentLen,
        `"${a.issues.join(';')}"`,
      ].join(',');
      console.log(csv);
    }
    return;
  }

  // Pretty mode
  const issueCount = {};
  for (const post of allPosts) {
    const a = audit(post);
    const title = (post.title?.rendered || '').replace(/&[^;]+;/g, '').slice(0, 60);
    const statusIcon = post.status === 'publish' ? '✓' : (post.status === 'draft' ? '○' : '?');

    console.log(`${statusIcon} #${pad(post.id, 5)} ${pad(post.slug, 40)} ${title}`);

    if (a.issues.length > 0) {
      console.log(`     ⚠️  ${a.issues.join(', ')}`);
    }
    a.issues.forEach((iss) => {
      const key = iss.split('(')[0];
      issueCount[key] = (issueCount[key] || 0) + 1;
    });
  }

  console.log('');
  console.log('━'.repeat(80));
  console.log(`Tổng bài: ${allPosts.length}`);
  console.log('Vấn đề:');
  Object.entries(issueCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${pad(k, 25)} ${v} bài`);
  });
  console.log('━'.repeat(80));
}

main().catch((e) => {
  console.error('Error:', e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exit(1);
});
