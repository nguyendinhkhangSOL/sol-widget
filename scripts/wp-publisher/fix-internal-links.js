#!/usr/bin/env node
/**
 * Sol v4 — Auto-fix internal links gãy trong category
 *
 * Cho mỗi bài có link CŨ pattern /YYYY/MM/DD/slug/ hoặc /wiki/slug/:
 *   - Replace bằng /slug/ (nếu slug đó còn tồn tại)
 *   - Update post content via REST
 *
 * Idempotent — chạy lại nhiều lần không gây vấn đề.
 *
 * Usage:
 *   node fix-internal-links.js wiki-bo-thuoc-la --dry-run    # preview
 *   node fix-internal-links.js wiki-bo-thuoc-la              # apply
 *   node fix-internal-links.js wiki-bo-thuoc-la --only=123   # 1 post
 */

const { api } = require('./_lib');

const categorySlug = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const onlyIds = onlyArg ? onlyArg.slice(7).split(',').map((s) => parseInt(s, 10)) : null;

if (!categorySlug || categorySlug.startsWith('--')) {
  console.error('Usage: node fix-internal-links.js <category-slug> [--dry-run]');
  process.exit(1);
}

// Pattern: //sol.vn/2026/04/10/slug/ → //sol.vn/slug/
// Match cả http(s)?://sol.vn/... lẫn /... (relative)
const OLD_DATE_GLOBAL = /(https?:\/\/sol\.vn)?\/(\d{4})\/(\d{2})\/(\d{2})\/([a-z0-9-]+)\/?/gi;
const OLD_WIKI_GLOBAL = /(https?:\/\/sol\.vn)?\/wiki\/([a-z0-9-]+)\/?/gi;

async function fetchAllSlugs() {
  const slugs = new Set();
  for (const type of ['posts', 'pages']) {
    let page = 1;
    while (true) {
      let items;
      try {
        items = await api.get(`/wp-json/wp/v2/${type}?status=publish&per_page=100&page=${page}&_fields=slug`);
      } catch (e) {
        if (e.status === 400) break;
        throw e;
      }
      if (!items.length) break;
      items.forEach((it) => slugs.add(it.slug));
      if (items.length < 100) break;
      page++;
      if (page > 10) break;
    }
  }
  return slugs;
}

async function fetchPosts(catId) {
  const posts = [];
  let page = 1;
  while (true) {
    let items;
    try {
      items = await api.get(
        `/wp-json/wp/v2/posts?categories=${catId}&status=publish,draft&context=edit&per_page=50&page=${page}&_fields=id,slug,title,content`
      );
    } catch (e) {
      if (e.status === 400 && e.body?.code === 'rest_post_invalid_page_number') break;
      throw e;
    }
    if (!items.length) break;
    posts.push(...items);
    if (items.length < 50) break;
    page++;
    if (page > 10) break;
  }
  return posts;
}

function rewriteContent(html, allSlugs) {
  let result = html;
  let dateFixed = 0;
  let dateBroken = 0;
  let wikiFixed = 0;
  let wikiBroken = 0;

  // Replace /YYYY/MM/DD/slug/ → /slug/
  result = result.replace(OLD_DATE_GLOBAL, (match, host, y, m, d, slug) => {
    if (allSlugs.has(slug)) {
      dateFixed++;
      return `https://sol.vn/${slug}/`;
    } else {
      dateBroken++;
      return match;
    }
  });

  // Replace /wiki/slug/ → /slug/
  result = result.replace(OLD_WIKI_GLOBAL, (match, host, slug) => {
    if (allSlugs.has(slug)) {
      wikiFixed++;
      return `https://sol.vn/${slug}/`;
    } else {
      wikiBroken++;
      return match;
    }
  });

  return { html: result, dateFixed, dateBroken, wikiFixed, wikiBroken };
}

async function main() {
  console.log(`▶ Fix internal links cho category "${categorySlug}"${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(categorySlug)}&_fields=id`);
  if (!cats[0]) { console.error('Category not found'); process.exit(1); }

  const [posts, allSlugs] = await Promise.all([
    fetchPosts(cats[0].id),
    fetchAllSlugs(),
  ]);

  console.log(`  ${posts.length} bài, ${allSlugs.size} slug tồn tại`);
  console.log('');

  let totalFixed = 0, totalBroken = 0, postsUpdated = 0, postsFailed = 0;

  for (const post of posts) {
    if (onlyIds && !onlyIds.includes(post.id)) continue;

    const html = post.content?.rendered || '';
    // Skip nếu không có pattern nào
    if (!OLD_DATE_GLOBAL.test(html) && !OLD_WIKI_GLOBAL.test(html)) continue;

    // Reset regex lastIndex
    OLD_DATE_GLOBAL.lastIndex = 0;
    OLD_WIKI_GLOBAL.lastIndex = 0;

    const { html: newHtml, dateFixed, dateBroken, wikiFixed, wikiBroken } = rewriteContent(html, allSlugs);
    const fixed = dateFixed + wikiFixed;
    const broken = dateBroken + wikiBroken;
    totalFixed += fixed;
    totalBroken += broken;

    if (fixed === 0 && broken === 0) continue;
    if (newHtml === html) continue;

    const parts = [];
    if (dateFixed) parts.push(`date→${dateFixed}`);
    if (wikiFixed) parts.push(`wiki→${wikiFixed}`);
    if (broken > 0) parts.push(`broken=${broken}`);

    console.log(`📝 #${String(post.id).padEnd(5)} ${post.slug.padEnd(45)} ${parts.join(' ')}`);

    if (!dryRun) {
      try {
        await api.post(`/wp-json/wp/v2/posts/${post.id}`, { content: newHtml });
        postsUpdated++;
      } catch (e) {
        console.log(`    ✗ FAIL: ${e.message}`);
        if (e.body) console.log(`    ${JSON.stringify(e.body).slice(0, 250)}`);
        postsFailed++;
      }
    } else {
      postsUpdated++;
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log(`${dryRun ? 'Would fix' : 'Fixed'}: ${totalFixed} link trong ${postsUpdated} bài`);
  if (totalBroken > 0) console.log(`Còn broken (slug không tồn tại): ${totalBroken} link`);
  if (postsFailed > 0) console.log(`Failed update: ${postsFailed} bài`);
  console.log('━'.repeat(70));
  if (dryRun) console.log('Bỏ --dry-run để apply.');
}

main().catch((e) => { console.error('Error:', e.message); if (e.body) console.error(JSON.stringify(e.body, null, 2)); process.exit(1); });
