#!/usr/bin/env node
/**
 * Sol v4 — Update SEO metadata cho 10 bài Quick Win Long-tail Q3 2026.
 *
 * Update rank_math_title, rank_math_description, rank_math_focus_keyword
 * cho bài đã LIVE trên sol.vn. KHÔNG đụng content, KHÔNG đụng slug.
 *
 * Idempotent — chạy nhiều lần không vấn đề.
 *
 * Usage:
 *   node update-seo-meta.js --dry-run   # preview
 *   node update-seo-meta.js             # apply
 *   node update-seo-meta.js --only=app-cai-thuoc-la-tieng-viet
 */

const fs = require('fs');
const path = require('path');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

const UPDATES = require('./seo-meta-updates.json');

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

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link,title,meta`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function updateMeta(post, update, dryRun) {
  const { newTitle, newMetaDesc, focusKeyword } = update;
  const meta = {
    rank_math_title: newTitle,
    rank_math_description: newMetaDesc,
    rank_math_focus_keyword: focusKeyword,
  };

  if (dryRun) {
    console.log(`  → Would update post #${post.id}`);
    console.log(`     New title: ${newTitle}`);
    console.log(`     New focus: ${focusKeyword}`);
    return { ok: true, action: 'dryrun' };
  }

  try {
    // Update meta only — KHÔNG đụng content/slug/title (visible)
    await api.post(`/wp-json/wp/v2/posts/${post.id}`, { meta });
    console.log(`  ✓ Updated #${post.id}`);
    console.log(`     SEO Title: ${newTitle}`);
    return { ok: true, postId: post.id };
  } catch (e) {
    console.error(`  ✗ POST fail: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const onlySlug = onlyArg ? onlyArg.slice(7) : null;

  const updates = onlySlug ? UPDATES.filter((u) => u.wpSlug === onlySlug) : UPDATES;
  if (updates.length === 0) {
    console.error(`✗ Không tìm thấy slug: ${onlySlug}`);
    process.exit(1);
  }

  console.log(`\n──────────────────────────────────────────────────────────────`);
  console.log(`  Sol v4 — Update SEO meta cho ${updates.length} bài Long-tail Q3${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`──────────────────────────────────────────────────────────────\n`);

  const results = [];
  for (const update of updates) {
    console.log(`▶ ${update.wpSlug}`);
    console.log(`  Focus: ${update.focusKeyword}`);

    const post = await findPostBySlug(update.wpSlug);
    if (!post) {
      console.error(`  ✗ Slug not found on sol.vn — skip\n`);
      results.push({ ok: false, slug: update.wpSlug, error: 'not_found' });
      continue;
    }

    const r = await updateMeta(post, update, dryRun);
    results.push({ ...r, slug: update.wpSlug });
    console.log('');

    if (!dryRun) await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`──────────────────────────────────────────────────────────────`);
  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`  Done — ${ok}/${results.length} OK${fail > 0 ? `, ${fail} FAIL/NOT FOUND` : ''}`);

  if (fail > 0) {
    console.log(`\n  Slug not found (cần kiểm tra slug thật trên sol.vn):`);
    results.filter((r) => !r.ok && r.error === 'not_found').forEach((r) => console.log(`    - ${r.slug}`));
  }

  if (!dryRun && ok > 0) {
    console.log(`\n  📋 NEXT STEPS:`);
    console.log(`     1. Google Search Console → URL Inspection → Request Indexing cho ${ok} URLs`);
    console.log(`     2. Test FAQ Rich Snippet: https://search.google.com/test/rich-results`);
    console.log(`     3. Đợi 24-48h Google crawl → check ranking shift`);
  }
  console.log(`──────────────────────────────────────────────────────────────\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
