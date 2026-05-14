#!/usr/bin/env node
/**
 * Sol v4 — Auto-fill Rank Math SEO meta cho mọi bài thiếu trong category
 *
 * Cho mỗi bài thiếu meta:
 *   - rank_math_title:    dùng post.title (truncate 60c)
 *   - rank_math_description: dùng excerpt → fallback first 160c content
 *   - rank_math_focus_keyword: dẫn xuất từ slug (replace - → space)
 *
 * Skip nếu bài đã có đầy đủ. KHÔNG override meta đã có.
 *
 * Usage:
 *   node bulk-fix-seo-auto.js wiki-bo-thuoc-la --dry-run    # preview
 *   node bulk-fix-seo-auto.js wiki-bo-thuoc-la              # fix thật
 *   node bulk-fix-seo-auto.js wiki-bo-thuoc-la --only=123,456  # chỉ post ID
 */

const { api } = require('./_lib');

const categorySlug = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const onlyIds = onlyArg ? onlyArg.slice(7).split(',').map((s) => parseInt(s, 10)) : null;

if (!categorySlug || categorySlug.startsWith('--')) {
  console.error('Usage: node bulk-fix-seo-auto.js <category-slug> [--dry-run] [--only=id1,id2]');
  process.exit(1);
}

function stripHtml(s) { return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function stripEntities(s) {
  return (s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&[^;]+;/g, '');
}

function truncate(s, n) {
  s = (s || '').trim();
  if (s.length <= n) return s;
  // truncate at word boundary
  const slice = s.slice(0, n);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > n * 0.7 ? slice.slice(0, lastSpace) : slice).trim();
}

function focusFromSlug(slug) {
  // ho-co-dom-khi-cai → ho có đờm khi cai (best-effort, không có dấu)
  return slug.replace(/-/g, ' ').trim();
}

function pad(s, n) {
  s = String(s ?? '');
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

async function main() {
  // Find category
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(categorySlug)}&_fields=id,name`);
  if (!cats[0]) { console.error(`✗ Category not found`); process.exit(1); }
  const catId = cats[0].id;
  console.log(`▶ Auto-fix SEO for category "${categorySlug}" (#${catId})${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  // Fetch all
  const posts = [];
  let page = 1;
  while (true) {
    let items;
    try {
      items = await api.get(
        `/wp-json/wp/v2/posts?categories=${catId}&status=publish,draft&context=edit&per_page=50&page=${page}&_fields=id,slug,title,excerpt,content,meta,featured_media`
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

  let fixed = 0, skipped = 0, failed = 0;
  for (const p of posts) {
    if (onlyIds && !onlyIds.includes(p.id)) continue;

    const m = p.meta || {};
    const hasTitle = !!m.rank_math_title;
    const hasDesc = !!m.rank_math_description;
    const hasFocus = !!m.rank_math_focus_keyword;

    if (hasTitle && hasDesc && hasFocus) {
      skipped++;
      continue;
    }

    const title = stripEntities(p.title?.rendered || '');
    const excerptRaw = stripHtml(stripEntities(p.excerpt?.rendered || ''));
    const contentRaw = stripHtml(stripEntities(p.content?.rendered || ''));

    const newMeta = {};
    if (!hasTitle && title) {
      newMeta.rank_math_title = truncate(title, 60);
    }
    if (!hasDesc) {
      const src = excerptRaw && excerptRaw.length > 50 ? excerptRaw : contentRaw;
      newMeta.rank_math_description = truncate(src, 155);
    }
    if (!hasFocus) {
      newMeta.rank_math_focus_keyword = focusFromSlug(p.slug);
    }

    const shortTitle = title.slice(0, 50);
    console.log(`📝 #${pad(p.id, 5)} ${pad(p.slug, 36)} ${shortTitle}`);
    Object.entries(newMeta).forEach(([k, v]) => {
      console.log(`    ${pad(k, 28)} → ${String(v).slice(0, 80)}${String(v).length > 80 ? '…' : ''}`);
    });

    if (!dryRun) {
      try {
        await api.post(`/wp-json/wp/v2/posts/${p.id}`, { meta: newMeta });
        fixed++;
      } catch (e) {
        console.log(`    ✗ FAIL: ${e.message}`);
        if (e.body) console.log(`    ${JSON.stringify(e.body).slice(0, 200)}`);
        failed++;
      }
    } else {
      fixed++; // count as would-fix
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log(`${dryRun ? 'Would fix' : 'Fixed'}: ${fixed}`);
  console.log(`Already OK (skipped): ${skipped}`);
  if (failed > 0) console.log(`Failed: ${failed}`);
  console.log('━'.repeat(70));
  if (dryRun) console.log('Bỏ --dry-run để áp dụng thật.');
}

main().catch((e) => { console.error('Error:', e.message); if (e.body) console.error(JSON.stringify(e.body, null, 2)); process.exit(1); });
