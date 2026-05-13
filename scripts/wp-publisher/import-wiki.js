#!/usr/bin/env node
/**
 * Sol v4 — Tạo / update 1 bài Wiki (Post) với featured image
 *
 * Usage:
 *   node import-wiki.js <slug> [options]
 *
 * Options:
 *   --html=<file>         File HTML content (required mới)
 *   --title="..."         Title (required mới)
 *   --excerpt="..."       Excerpt
 *   --category=<id|slug>  Category (Wiki Bỏ Thuốc Lá hoặc tương tự)
 *   --featured=<media-id> Media ID làm ảnh đại diện (đã upload trước)
 *   --seo-title="..."     SEO Title (Rank Math)
 *   --seo-desc="..."      SEO Description
 *   --focus="..."         Focus keyword
 *   --status=draft|publish (default draft)
 *
 * Example:
 *   node import-wiki.js cai-thuoc-la-tai-nha \
 *     --html=../../wiki-skeletons/wiki-articles/A1-cai-thuoc-la-tai-nha.html \
 *     --title="Cai Thuốc Lá Tại Nhà — 7 Bước Khoa Học Cho Đàn Ông 45+" \
 *     --excerpt="7 bước cai thuốc lá tại nhà — Khang Sol hướng dẫn từ 30 năm hút Vinataba, 5 năm Tự do." \
 *     --category=wiki-bo-thuoc-la \
 *     --featured=12345 \
 *     --seo-title="Cai Thuốc Lá Tại Nhà — 7 Bước Khoa Học (2026)" \
 *     --seo-desc="..." \
 *     --focus="cai thuốc lá tại nhà" \
 *     --status=publish
 */

const fs = require('fs');
const path = require('path');
const { api } = require('./_lib');

function arg(name, defaultVal) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!found) return defaultVal;
  return found.slice(name.length + 3).replace(/^["']|["']$/g, '');
}

async function findCategoryId(slugOrId) {
  if (/^\d+$/.test(slugOrId)) return parseInt(slugOrId, 10);
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(slugOrId)}&_fields=id,slug,name`);
  if (Array.isArray(cats) && cats.length > 0) return cats[0].id;
  throw new Error(`Không tìm thấy category slug="${slugOrId}"`);
}

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function main() {
  const slug = process.argv[2];
  if (!slug || slug.startsWith('--')) {
    console.error('Usage: node import-wiki.js <slug> --html=<file> --title="..." [...options]');
    process.exit(1);
  }

  const htmlFile = arg('html');
  const title = arg('title');
  const excerpt = arg('excerpt', '');
  const categorySlug = arg('category', '');
  const featuredId = arg('featured', '');
  const seoTitle = arg('seo-title', '');
  const seoDesc = arg('seo-desc', '');
  const focus = arg('focus', '');
  const status = arg('status', 'draft');

  if (!htmlFile && !title) {
    // Update mode — tìm post existing, chỉ update meta/featured
  } else if (!htmlFile || !title) {
    console.error('✗ Mới tạo: cần cả --html và --title');
    process.exit(1);
  }

  console.log(`▶ Import Wiki: slug="${slug}"`);

  // Check existing post
  let existing = await findPostBySlug(slug);
  console.log(`  ${existing ? `(update existing #${existing.id})` : '(create new)'}`);

  // Read HTML
  let content = '';
  if (htmlFile) {
    const fullPath = path.resolve(htmlFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`✗ HTML file không thấy: ${fullPath}`);
      process.exit(1);
    }
    content = fs.readFileSync(fullPath, 'utf-8');
    console.log(`  HTML: ${path.relative(process.cwd(), fullPath)} (${content.length} bytes)`);
  }

  // Resolve category
  let categories;
  if (categorySlug) {
    const catId = await findCategoryId(categorySlug);
    categories = [catId];
    console.log(`  Category: ${categorySlug} → id=${catId}`);
  }

  // Build payload
  const meta = {};
  if (seoTitle) meta.rank_math_title = seoTitle;
  if (seoDesc) meta.rank_math_description = seoDesc;
  if (focus) meta.rank_math_focus_keyword = focus;

  const payload = {
    slug,
    ...(title ? { title } : {}),
    ...(content ? { content } : {}),
    ...(excerpt ? { excerpt } : {}),
    ...(categories ? { categories } : {}),
    ...(featuredId ? { featured_media: parseInt(featuredId, 10) } : {}),
    ...(Object.keys(meta).length > 0 ? { meta } : {}),
    status,
  };

  console.log(`  Status: ${status}`);
  if (featuredId) console.log(`  Featured media ID: ${featuredId}`);
  if (seoTitle) console.log(`  SEO title (${seoTitle.length}c): ${seoTitle}`);
  if (focus) console.log(`  Focus keyword: ${focus}`);

  try {
    let result;
    if (existing) {
      result = await api.post(`/wp-json/wp/v2/posts/${existing.id}`, payload);
      console.log(`✓ UPDATED post #${result.id}`);
    } else {
      result = await api.post(`/wp-json/wp/v2/posts`, payload);
      console.log(`✓ CREATED post #${result.id}`);
    }
    console.log(`  URL: ${result.link}`);
    if (result.meta?.rank_math_title) {
      console.log(`  Verify SEO Title: ${result.meta.rank_math_title}`);
    }
    if (result.featured_media) {
      console.log(`  Featured media: ${result.featured_media}`);
    }
  } catch (e) {
    console.error('✗ FAIL:', e.message);
    if (e.body) console.error(JSON.stringify(e.body, null, 2));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
