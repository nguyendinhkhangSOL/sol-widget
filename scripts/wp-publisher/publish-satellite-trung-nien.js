#!/usr/bin/env node
/**
 * Sol — Publish 3 bài vệ tinh "Trung niên" lên WordPress sol.vn
 *
 * 3 bài:
 *   01 — Khởi nghiệp tinh gọn tuổi trung niên (ít vốn)
 *   02 — Stress trung niên & cái bẫy khói thuốc (cầu nối sang Sol)
 *   03 — Khởi nghiệp tuổi 40+ khẳng định bản thân
 *
 * Fork từ publish-seo-pass-26-5.js — chỉ đổi SEO_FOLDER + CATEGORY_SLUG.
 * Logic parse + publish giữ nguyên.
 *
 * Usage:
 *   node publish-satellite-trung-nien.js --dry-run
 *   node publish-satellite-trung-nien.js
 *
 * NOTE: Default category = 'ngam'. Nếu sol.vn dùng category khác cho cluster
 * "trung niên / khởi nghiệp", anh sửa CATEGORY_SLUG bên dưới rồi chạy lại.
 */

const fs = require('fs');
const path = require('path');
const { api, WP_URL } = require('./_lib');

// ─── Config ────────────────────────────────────────────────────────
const SEO_FOLDER = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'satellite-trung-nien');
const CATEGORY_SLUG = 'ngam';                // hoặc 'kinh-doanh-trung-nien' nếu sol.vn có
const FALLBACK_CATEGORY_ID = 1;              // uncategorized

// ─── HTML parsing (giống pass 26-5) ───────────────────────────────
function parseSeoHtml(rawHtml, fileName) {
  const commentRe = /<!--[\s\S]*?-->/g;
  let m;
  const commentMatches = [];
  while ((m = commentRe.exec(rawHtml)) !== null) {
    commentMatches.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    if (commentMatches.length >= 2) break;
  }

  const headerBlock = commentMatches.find((c) => /Slug\s*:/i.test(c.text) && /Keyword\s+chính/i.test(c.text));
  const headBlock = commentMatches.find((c) => /<title>/i.test(c.text) && /name=["']description["']/i.test(c.text));

  if (!headerBlock) throw new Error(`Không tìm thấy metadata header comment trong ${fileName}`);
  if (!headBlock) throw new Error(`Không tìm thấy HEAD META comment trong ${fileName}`);

  const slugMatch = headerBlock.text.match(/Slug\s*:\s*([a-z0-9-]+)/i);
  const keywordMatch = headerBlock.text.match(/Keyword\s+chính\s*:\s*["']([^"']+)["']/i);
  const titleMatch = headBlock.text.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = headBlock.text.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);

  if (!slugMatch) throw new Error(`Không parse được Slug trong ${fileName}`);
  if (!keywordMatch) throw new Error(`Không parse được Keyword chính trong ${fileName}`);
  if (!titleMatch) throw new Error(`Không parse được <title> trong ${fileName}`);
  if (!descMatch) throw new Error(`Không parse được <meta description> trong ${fileName}`);

  const firstTwo = commentMatches.slice(0, 2);
  const stripEnd = Math.max(...firstTwo.map((c) => c.end));
  const contentStripped = rawHtml.slice(stripEnd).replace(/^\s+/, '');

  return {
    slug: slugMatch[1].trim(),
    focusKeyword: keywordMatch[1].trim(),
    seoTitle: titleMatch[1].trim(),
    seoDescription: descMatch[1].trim(),
    content: contentStripped,
  };
}

function deriveWpTitle(seoTitle) {
  return seoTitle.replace(/\s*\|\s*sol\.vn\s*$/i, '').trim();
}

async function findCategoryId(slug) {
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}&_fields=id`);
  return Array.isArray(cats) && cats.length > 0 ? cats[0].id : null;
}

async function findPostBySlug(slug) {
  const items = await api.get(
    `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link,status`,
  );
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function processOne({ fileName, dryRun, categoryId, idx }) {
  const filePath = path.join(SEO_FOLDER, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const filenameSlug = fileName.replace(/^\d+-/, '').replace(/\.html$/i, '');

  let parsed;
  try {
    parsed = parseSeoHtml(raw, fileName);
  } catch (e) {
    return { fileName, status: 'PARSE_FAIL', error: e.message };
  }

  const slug = parsed.slug || filenameSlug;
  const slugMismatch = parsed.slug && parsed.slug !== filenameSlug;
  const wpTitle = deriveWpTitle(parsed.seoTitle);

  if (dryRun) {
    console.log(`\n▶ [bài ${idx}] ${fileName}`);
    console.log(`   Slug:           ${slug}${slugMismatch ? `  (⚠️ filename → ${filenameSlug})` : ''}`);
    console.log(`   WP Title:       ${wpTitle}`);
    console.log(`   SEO Title:      ${parsed.seoTitle}`);
    console.log(`   Description:    ${parsed.seoDescription}`);
    console.log(`   Focus keyword:  ${parsed.focusKeyword}`);
    console.log(`   Content (200c): ${parsed.content.replace(/\s+/g, ' ').slice(0, 200)}...`);
    return { fileName, slug, status: 'DRY_RUN' };
  }

  let existing;
  try {
    existing = await findPostBySlug(slug);
  } catch (e) {
    return { fileName, slug, status: 'LOOKUP_FAIL', error: e.message, body: e.body };
  }

  const payload = {
    slug,
    title: wpTitle,
    content: parsed.content,
    excerpt: parsed.seoDescription,
    status: 'publish',
    meta: {
      rank_math_title: parsed.seoTitle,
      rank_math_description: parsed.seoDescription,
      rank_math_focus_keyword: parsed.focusKeyword,
    },
    ...(categoryId ? { categories: [categoryId] } : { categories: [FALLBACK_CATEGORY_ID] }),
  };

  try {
    let result;
    let action;
    if (existing) {
      result = await api.post(`/wp-json/wp/v2/posts/${existing.id}`, payload);
      action = 'updated';
    } else {
      result = await api.post(`/wp-json/wp/v2/posts`, payload);
      action = 'published (new)';
    }
    return {
      fileName, slug, status: 'OK', action,
      postId: result.id, link: result.link,
      title: wpTitle, focusKeyword: parsed.focusKeyword,
    };
  } catch (e) {
    return { fileName, slug, status: 'POST_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!fs.existsSync(SEO_FOLDER)) {
    console.error(`✗ Folder không tồn tại: ${SEO_FOLDER}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SEO_FOLDER).filter((f) => /^\d+-.+\.html$/i.test(f)).sort();
  if (files.length === 0) {
    console.error(`✗ Không có file HTML nào trong ${SEO_FOLDER}`);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log(`  SATELLITE TRUNG NIÊN — Publish ${files.length} bài`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : 'LIVE PUBLISH'}`);
  console.log(`  Target: ${WP_URL}`);
  console.log('========================================');

  let categoryId = null;
  if (!dryRun) {
    try {
      categoryId = await findCategoryId(CATEGORY_SLUG);
      if (categoryId) {
        console.log(`\n  Category: ${CATEGORY_SLUG} → #${categoryId}`);
      } else {
        console.warn(`\n  ⚠️  Category "${CATEGORY_SLUG}" không tìm thấy — dùng fallback #${FALLBACK_CATEGORY_ID} (uncategorized).`);
        console.warn(`     → Tạo category "${CATEGORY_SLUG}" trên WP admin rồi re-run, hoặc đổi CATEGORY_SLUG.`);
      }
    } catch (e) {
      console.warn(`\n  ⚠️  Lỗi tra cứu category: ${e.message} — dùng fallback #${FALLBACK_CATEGORY_ID}`);
    }
  }

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const r = await processOne({ fileName, dryRun, categoryId, idx: i + 1 });
    results.push(r);

    if (dryRun) continue;

    if (r.status === 'OK') {
      const publicUrl = r.link ? r.link.replace(/^https?:\/\/[^/]+/, 'https://sol.vn') : `https://sol.vn/${r.slug}/`;
      console.log(`\n✓ [bài ${i + 1}] Đã publish: ${publicUrl}`);
      console.log(`    - Title:         ${r.title}`);
      console.log(`    - Focus keyword: ${r.focusKeyword}`);
      console.log(`    - Status:        ${r.action}  (post #${r.postId})`);
    } else {
      console.log(`\n✗ [bài ${i + 1}] ${fileName} — ${r.status}`);
      console.log(`    Error: ${r.error || '(no message)'}`);
      if (r.body) {
        const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
        console.log(`    WP response: ${bodyStr.slice(0, 500)}`);
      }
    }
  }

  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================');

  if (dryRun) {
    const parsed = results.filter((r) => r.status === 'DRY_RUN').length;
    const failed = results.filter((r) => r.status === 'PARSE_FAIL').length;
    console.log(`  Dry-run: ${parsed} bài parse OK / ${failed} parse lỗi (tổng ${results.length})`);
    results.filter((r) => r.status === 'PARSE_FAIL').forEach((r) => console.log(`    ✗ ${r.fileName}: ${r.error}`));
  } else {
    const ok = results.filter((r) => r.status === 'OK');
    const fail = results.filter((r) => r.status !== 'OK');
    console.log(`  ✓ Thành công: ${ok.length} bài`);
    console.log(`  ✗ Lỗi:        ${fail.length} bài`);

    if (ok.length > 0) {
      console.log('\n  Published URLs:');
      ok.forEach((r) => {
        const url = r.link ? r.link.replace(/^https?:\/\/[^/]+/, 'https://sol.vn') : `https://sol.vn/${r.slug}/`;
        console.log(`    • ${url}  [${r.action}]`);
      });
    }

    if (fail.length > 0) {
      console.log('\n  Failed:');
      fail.forEach((r) => console.log(`    • ${r.fileName} — ${r.status}: ${r.error || ''}`));
    }

    if (ok.length > 0) {
      console.log('\n  Next steps:');
      console.log('    1. Gen OG: node gen-og-satellite-trung-nien.js');
      console.log('    2. Set featured: node set-featured-satellite-trung-nien.js');
      console.log('    3. Submit GSC URL Inspection cho 3 URL');
    }
  }
}

main().catch((e) => {
  console.error('\n✗ FATAL:', e.message);
  if (e.body) console.error('   Body:', JSON.stringify(e.body).slice(0, 500));
  process.exit(1);
});
