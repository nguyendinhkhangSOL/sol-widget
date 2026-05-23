#!/usr/bin/env node
/**
 * Sol v4 — Publish 3 PILLAR cluster Vợ/Bạn gái lên sol.vn
 *
 * 3 bài:
 *   - vo-giup-chong-bo-thuoc-la (~700 vol/m)
 *   - khoi-thuoc-thu-dong-cho-con (~600 vol/m)
 *   - chong-hut-thuoc-khi-vo-mang-thai (~1000 vol/m P0)
 *
 * Idempotent — slug đã có trên WP thì UPDATE.
 *
 * Usage:
 *   node publish-vo-cluster.js --dry-run     # preview
 *   node publish-vo-cluster.js               # publish 3 bài
 *   node publish-vo-cluster.js --only=vo-giup-chong-bo-thuoc-la
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

const ARTICLES = require('./vo-cluster-articles.json');

function loadPwd() {
  const envPath = path.join(__dirname, '.env');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^WP_APP_PASSWORD=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  }
  throw new Error('Không tìm thấy WP_APP_PASSWORD');
}
const AUTH = 'Basic ' + Buffer.from(`${WP_USERNAME}:${loadPwd()}`).toString('base64');

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const url = new URL('/wp-json/wp/v2/media', WP_URL);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: {
        'Authorization': AUTH,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileData.length,
        'Accept': 'application/json',
      },
      timeout: 60000,
    }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else { const err = new Error(`HTTP ${res.statusCode}`); err.body = parsed; reject(err); }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function findCategoryId(slug) {
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}&_fields=id`);
  return Array.isArray(cats) && cats[0] ? cats[0].id : null;
}

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function publishArticle(article, options) {
  const { dryRun, categoryId } = options;
  const { slug, htmlFile, ogImage, title, seoTitle, seoDesc, focusKeyword } = article;

  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', htmlFile);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', ogImage);

  console.log(`\n▶ ${slug}`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`  ✗ HTML missing: ${htmlPath}`);
    return { ok: false, slug };
  }

  const hasOG = fs.existsSync(ogPath);
  if (!hasOG) console.log(`  ⚠ OG image missing — sẽ publish không featured_media`);

  const existing = await findPostBySlug(slug);
  console.log(`  ${existing ? `UPDATE #${existing.id}` : 'CREATE new'}${dryRun ? ' (DRY RUN)' : ''}`);

  if (dryRun) return { ok: true, slug, action: 'dryrun' };

  let mediaId;
  if (hasOG) {
    try {
      const media = await uploadFile(ogPath);
      mediaId = media.id;
      console.log(`  ✓ OG uploaded → media #${mediaId}`);
    } catch (e) {
      console.warn(`  ⚠ OG upload fail: ${e.message}`);
    }
  }

  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
    rank_math_focus_keyword: focusKeyword,
  };

  const payload = {
    slug,
    title,
    content,
    excerpt: seoDesc,
    status: 'publish',
    meta,
    ...(mediaId ? { featured_media: mediaId } : {}),
    ...(categoryId ? { categories: [categoryId] } : {}),
  };

  try {
    const result = existing
      ? await api.post(`/wp-json/wp/v2/posts/${existing.id}`, payload)
      : await api.post(`/wp-json/wp/v2/posts`, payload);
    console.log(`  ✓ ${existing ? 'UPDATED' : 'CREATED'} post #${result.id}`);
    console.log(`  → ${result.link}`);
    return { ok: true, slug, postId: result.id, link: result.link, action: existing ? 'update' : 'create' };
  } catch (e) {
    console.error(`  ✗ POST fail: ${e.message}`);
    if (e.body) console.error(`     ${JSON.stringify(e.body).slice(0, 300)}`);
    return { ok: false, slug, error: e.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const onlySlug = onlyArg ? onlyArg.slice(7) : null;

  const articles = onlySlug
    ? ARTICLES.filter((a) => a.slug === onlySlug)
    : ARTICLES;

  if (articles.length === 0) {
    console.error(`✗ Không tìm thấy bài: ${onlySlug}`);
    process.exit(1);
  }

  console.log(`──────────────────────────────────────────────────────────────`);
  console.log(`  Sol v4 — Publish ${articles.length} bài cluster Vợ/Bạn gái${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`──────────────────────────────────────────────────────────────`);

  const categoryId = await findCategoryId('wiki-bo-thuoc-la');
  if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);
  else console.log(`  ⚠ Category 'wiki-bo-thuoc-la' không tìm thấy — publish không gán category`);

  const results = [];
  for (const article of articles) {
    const r = await publishArticle(article, { dryRun, categoryId });
    results.push(r);
    if (!dryRun) await new Promise((r) => setTimeout(r, 2000)); // 2s delay
  }

  console.log(`\n──────────────────────────────────────────────────────────────`);
  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`  Done — ${ok}/${results.length} OK${fail > 0 ? `, ${fail} FAIL` : ''}`);
  if (!dryRun && ok > 0) {
    console.log(`\n  Links live:`);
    results.filter((r) => r.ok && r.link).forEach((r) => console.log(`   → ${r.link}`));
  }
  console.log(`──────────────────────────────────────────────────────────────\n`);

  if (fail > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
