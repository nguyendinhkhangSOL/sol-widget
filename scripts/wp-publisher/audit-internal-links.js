#!/usr/bin/env node
/**
 * Sol v4 — Audit internal links trong tất cả bài của 1 category
 *
 * Phát hiện:
 *   - Link nội bộ sol.vn có pattern CŨ /YYYY/MM/DD/slug/ — bị gãy sau đổi permalink
 *   - Link tới /wiki/slug/ — prefix cũ
 *   - Link tới slug không tồn tại — broken
 *   - Link external (không liên quan SEO nội bộ)
 *
 * Usage:
 *   node audit-internal-links.js wiki-bo-thuoc-la
 *   node audit-internal-links.js wiki-bo-thuoc-la --csv > internal-links.csv
 */

const { api } = require('./_lib');

const categorySlug = process.argv[2] || 'wiki-bo-thuoc-la';
const csvMode = process.argv.includes('--csv');

// Pattern cần fix:
//   /YYYY/MM/DD/slug/   → /slug/
//   /wiki/slug/         → /slug/
const OLD_DATE_PATTERN = /\/(\d{4})\/(\d{2})\/(\d{2})\/([a-z0-9-]+)\/?/i;
const OLD_WIKI_PATTERN = /\/wiki\/([a-z0-9-]+)\/?/i;

function extractLinks(html) {
  // Tìm tất cả <a href="...">
  const links = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    links.push(m[1]);
  }
  return links;
}

function classifyLink(url, allSlugs) {
  // Chỉ quan tâm link sol.vn nội bộ
  const isInternal = /sol\.vn\//i.test(url) || url.startsWith('/');
  if (!isInternal) return { type: 'EXTERNAL', url };

  // Clean fragment + query
  const cleaned = url.replace(/^https?:\/\/sol\.vn/i, '').split('#')[0].split('?')[0];

  // Old date pattern?
  const dateMatch = cleaned.match(OLD_DATE_PATTERN);
  if (dateMatch) {
    const slug = dateMatch[4];
    const exists = allSlugs.has(slug);
    return {
      type: exists ? 'OLD_DATE_FIXABLE' : 'OLD_DATE_BROKEN',
      url, slug, newUrl: exists ? `https://sol.vn/${slug}/` : null,
    };
  }

  // /wiki/slug pattern?
  const wikiMatch = cleaned.match(OLD_WIKI_PATTERN);
  if (wikiMatch) {
    const slug = wikiMatch[1];
    const exists = allSlugs.has(slug);
    return {
      type: exists ? 'OLD_WIKI_FIXABLE' : 'OLD_WIKI_BROKEN',
      url, slug, newUrl: exists ? `https://sol.vn/${slug}/` : null,
    };
  }

  // /slug/ — check if slug exists
  const slugMatch = cleaned.match(/^\/([a-z0-9-]+)\/?$/i);
  if (slugMatch) {
    const slug = slugMatch[1];
    return {
      type: allSlugs.has(slug) ? 'OK' : 'UNKNOWN_SLUG',
      url, slug,
    };
  }

  // /category/... — bỏ qua
  if (cleaned.startsWith('/category/')) return { type: 'CATEGORY', url };

  return { type: 'OTHER_INTERNAL', url };
}

async function fetchAllPostsInCategory(catId) {
  const posts = [];
  let page = 1;
  while (true) {
    let items;
    try {
      items = await api.get(
        `/wp-json/wp/v2/posts?categories=${catId}&status=publish,draft&context=edit&per_page=50&page=${page}&_fields=id,slug,title,link,content`
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

async function fetchAllSlugs() {
  // Fetch all post + page slugs để check broken links
  const slugs = new Set();
  for (const type of ['posts', 'pages']) {
    let page = 1;
    while (true) {
      let items;
      try {
        items = await api.get(`/wp-json/wp/v2/${type}?status=publish&per_page=100&page=${page}&_fields=slug`);
      } catch (e) {
        if (e.status === 400 && e.body?.code?.includes('invalid_page_number')) break;
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

async function main() {
  if (!csvMode) console.log(`▶ Audit internal links trong category "${categorySlug}"…`);

  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(categorySlug)}&_fields=id`);
  if (!cats[0]) { console.error('Category not found'); process.exit(1); }
  const catId = cats[0].id;

  const [posts, allSlugs] = await Promise.all([
    fetchAllPostsInCategory(catId),
    fetchAllSlugs(),
  ]);

  if (!csvMode) {
    console.log(`  ${posts.length} bài trong category`);
    console.log(`  ${allSlugs.size} slug tồn tại trên site (post + page)`);
    console.log('');
  }

  const stats = { OK: 0, OLD_DATE_FIXABLE: 0, OLD_DATE_BROKEN: 0, OLD_WIKI_FIXABLE: 0, OLD_WIKI_BROKEN: 0, UNKNOWN_SLUG: 0, EXTERNAL: 0, CATEGORY: 0, OTHER_INTERNAL: 0 };
  const fixableByPost = {};
  const brokenByPost = {};

  if (csvMode) {
    console.log('postId,postSlug,linkType,oldUrl,newUrl,extractedSlug');
  }

  for (const post of posts) {
    const html = post.content?.rendered || '';
    const links = extractLinks(html);
    for (const url of links) {
      const c = classifyLink(url, allSlugs);
      stats[c.type] = (stats[c.type] || 0) + 1;

      if (csvMode) {
        console.log([post.id, post.slug, c.type, `"${c.url}"`, c.newUrl || '', c.slug || ''].join(','));
      }

      if (c.type === 'OLD_DATE_FIXABLE' || c.type === 'OLD_WIKI_FIXABLE') {
        fixableByPost[post.id] = fixableByPost[post.id] || { slug: post.slug, links: [] };
        fixableByPost[post.id].links.push({ old: c.url, new: c.newUrl });
      }
      if (c.type === 'OLD_DATE_BROKEN' || c.type === 'OLD_WIKI_BROKEN' || c.type === 'UNKNOWN_SLUG') {
        brokenByPost[post.id] = brokenByPost[post.id] || { slug: post.slug, links: [] };
        brokenByPost[post.id].links.push({ url: c.url, slug: c.slug });
      }
    }
  }

  if (csvMode) return;

  // Pretty report
  console.log('━'.repeat(70));
  console.log('Phân loại links:');
  Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    if (v > 0) console.log(`  ${k.padEnd(22)} ${v}`);
  });

  console.log('');
  console.log(`Bài có link FIXABLE (auto-fix được): ${Object.keys(fixableByPost).length}`);
  const fixablePreview = Object.entries(fixableByPost).slice(0, 5);
  fixablePreview.forEach(([id, { slug, links }]) => {
    console.log(`  #${id} ${slug} — ${links.length} link`);
    links.slice(0, 3).forEach((l) => {
      console.log(`    ${l.old.slice(0, 55)}${l.old.length > 55 ? '…' : ''} → ${l.new}`);
    });
  });

  if (Object.keys(brokenByPost).length > 0) {
    console.log('');
    console.log(`Bài có link BROKEN (chưa fix tự động được): ${Object.keys(brokenByPost).length}`);
    Object.entries(brokenByPost).slice(0, 5).forEach(([id, { slug, links }]) => {
      console.log(`  #${id} ${slug} — ${links.length} link`);
      links.slice(0, 3).forEach((l) => {
        console.log(`    ✗ ${l.url} (slug: ${l.slug || '?'})`);
      });
    });
  }

  console.log('━'.repeat(70));
  console.log('Bước tiếp:');
  console.log(`  node fix-internal-links.js ${categorySlug} --dry-run    # preview`);
  console.log(`  node fix-internal-links.js ${categorySlug}              # fix thật`);
}

main().catch((e) => { console.error('Error:', e.message); if (e.body) console.error(JSON.stringify(e.body, null, 2)); process.exit(1); });
