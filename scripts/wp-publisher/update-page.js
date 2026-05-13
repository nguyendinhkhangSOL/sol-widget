#!/usr/bin/env node
/**
 * Sol v4 — Update 1 Page WP từ file HTML local
 *
 * Usage:
 *   node update-page.js <id|slug> <html-file> [--draft|--publish]
 *
 * Examples:
 *   # Update Page có ID=42 với nội dung file LEAN-v3
 *   node update-page.js 42 ../../wiki-skeletons/landing-html/05-sol-homepage-LEAN-v3.html
 *
 *   # Tìm Page theo slug + update
 *   node update-page.js slug:gia ../../wiki-skeletons/landing-html/GIA-pricing-page-v3.html --publish
 *
 *   # Update bài Post (blog post) — thêm flag --post
 *   node update-page.js 100 some-post.html --post
 *
 * Lưu ý:
 *   - Script đẩy NGUYÊN content HTML vào field "content.raw"
 *   - WP sẽ tự sanitize — đảm bảo file không có <html>/<head>/<body> tags
 *   - Nếu file có comment <!--...--> ở đầu, WP giữ nguyên (ignore khi render)
 */

const fs = require('fs');
const path = require('path');
const { api, WP_URL } = require('./_lib');

async function findBySlug(type, slug) {
  const items = await api.get(`/wp-json/wp/v2/${type}?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,title`);
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`Không tìm thấy ${type} với slug "${slug}"`);
  }
  if (items.length > 1) {
    console.warn(`⚠ Tìm thấy ${items.length} ${type} cùng slug "${slug}" — dùng cái đầu.`);
  }
  return items[0];
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node update-page.js <id|slug:name> <html-file> [--draft|--publish] [--post]');
    process.exit(1);
  }

  const target = args[0];
  const htmlFile = args[1];
  const flags = args.slice(2);
  const status = flags.includes('--draft') ? 'draft' : flags.includes('--publish') ? 'publish' : null;
  const type = flags.includes('--post') ? 'posts' : 'pages';

  // Resolve target → ID
  let id, currentTitle, currentSlug;
  if (/^\d+$/.test(target)) {
    id = parseInt(target, 10);
    try {
      const cur = await api.get(`/wp-json/wp/v2/${type}/${id}?context=edit&_fields=id,slug,title`);
      currentTitle = cur.title?.rendered;
      currentSlug = cur.slug;
    } catch (e) {
      console.error(`✗ Không tìm được ${type} #${id}:`, e.message);
      process.exit(1);
    }
  } else if (target.startsWith('slug:')) {
    const slug = target.slice(5);
    const found = await findBySlug(type, slug);
    id = found.id;
    currentTitle = found.title?.rendered;
    currentSlug = found.slug;
  } else {
    console.error('✗ Target phải là số (ID) hoặc "slug:tên-slug"');
    process.exit(1);
  }

  // Read HTML
  const fullPath = path.resolve(htmlFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`✗ Không thấy file: ${fullPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath, 'utf-8');

  console.log(`▶ Update ${type} #${id}`);
  console.log(`  Slug:        ${currentSlug}`);
  console.log(`  Title:       ${currentTitle}`);
  console.log(`  File:        ${path.relative(process.cwd(), fullPath)} (${content.length} bytes)`);
  console.log(`  Status:      ${status || '(giữ nguyên)'}`);
  console.log('');

  const body = { content };
  if (status) body.status = status;

  try {
    const updated = await api.post(`/wp-json/wp/v2/${type}/${id}`, body);
    console.log('✓ ĐÃ UPDATE');
    console.log(`  URL: ${updated.link}`);
    console.log(`  Modified: ${updated.modified}`);
    console.log(`  Status: ${updated.status}`);
    console.log('');
    console.log(`💡 Mở incognito (Ctrl+Shift+N) → ${updated.link} để verify`);
    console.log(`   Nếu vẫn cũ → clear cache plugin trong WP Admin.`);
  } catch (e) {
    console.error('✗ Update FAIL:', e.message);
    if (e.body) console.error(JSON.stringify(e.body, null, 2));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
