#!/usr/bin/env node
/**
 * Sol — Bulk republish 143 wiki articles lên WordPress sol.vn
 *
 * Mục đích: Sau khi inject medical disclaimer + author block local,
 * cần push content mới lên sol.vn (REST API PATCH).
 *
 * Đọc tất cả file *.html trong wiki-skeletons/wiki-articles/,
 * skip .bak* files, derive slug từ filename, tìm post bằng slug,
 * PATCH content lên WP.
 *
 * Usage:
 *   node bulk-republish-wikis.js --dry-run        # preview, không push
 *   node bulk-republish-wikis.js                  # republish tất cả
 *   node bulk-republish-wikis.js --pattern=QDAY   # chỉ QDAY-*.html
 *   node bulk-republish-wikis.js --only=A1        # 1 file
 *   node bulk-republish-wikis.js --limit=10       # giới hạn 10 file đầu (test)
 */

const fs = require('fs');
const path = require('path');
const { api } = require('./_lib');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');
const DRY = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const patternArg = process.argv.find((a) => a.startsWith('--pattern='));
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.slice(8), 10) : null;

// ─── Derive slug từ filename ────────────────────────────────────────
function filenameToSlug(filename) {
  // Strip .html
  let s = filename.replace(/\.html$/, '');

  // PILLAR-cach-bo-thuoc-khong-tai-nghien → cach-bo-thuoc-khong-tai-nghien (drop PILLAR- prefix)
  s = s.replace(/^(PILLAR|CHIP|QDAY|LAMQUEN|GIAMDAN|A\d|B\d|COMPARISON|DECISION|DEMOGRAPHIC|SITUATIONAL)-/, '');

  // QDAY-01-ngay-1-... → ngay-1-... (already handled by regex above)

  // A1-cai-thuoc-la-tai-nha → cai-thuoc-la-tai-nha
  // (A1- prefix removed by regex above ONLY if A\d works)
  // Cleanup numeric prefix nếu còn (vd "01-")
  s = s.replace(/^\d+-/, '');

  return s;
}

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function updatePost(postId, content) {
  return api.post(`/wp-json/wp/v2/posts/${postId}`, { content });
}

async function processOne(filename) {
  const filePath = path.join(ARTICLES_DIR, filename);
  const slug = filenameToSlug(filename);
  const content = fs.readFileSync(filePath, 'utf-8');

  if (DRY) {
    const existing = await findPostBySlug(slug).catch(() => null);
    return {
      filename, slug,
      status: existing ? 'WOULD_UPDATE' : 'NO_POST_FOUND',
      postId: existing?.id,
      size: content.length,
    };
  }

  const existing = await findPostBySlug(slug);
  if (!existing) return { filename, slug, status: 'NO_POST_FOUND' };

  try {
    const result = await updatePost(existing.id, content);
    return {
      filename, slug,
      status: 'UPDATED',
      postId: existing.id,
      link: result.link,
    };
  } catch (e) {
    return { filename, slug, status: 'POST_FAIL', error: e.message };
  }
}

async function main() {
  let files = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.html') && !f.includes('.bak'));

  if (patternArg) {
    const pattern = patternArg.slice(10);
    files = files.filter((f) => f.includes(pattern));
  }
  if (onlyArg) {
    const only = onlyArg.slice(7);
    files = files.filter((f) => f.includes(only));
  }
  if (LIMIT) files = files.slice(0, LIMIT);

  console.log(`\n▶ Bulk republish ${files.length} wiki articles`);
  console.log(`  Mode: ${DRY ? 'DRY RUN' : 'PUSH'}`);
  if (LIMIT) console.log(`  Limit: first ${LIMIT}`);
  console.log('');

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    process.stdout.write(`  [${(i + 1).toString().padStart(3)}/${files.length}] ${f.padEnd(60).slice(0, 60)}... `);
    const r = await processOne(f);
    results.push(r);

    if (r.status === 'UPDATED') {
      console.log(`✓ #${r.postId}`);
    } else if (r.status === 'WOULD_UPDATE') {
      console.log(`📋 would UPDATE #${r.postId} (${r.size}b)`);
    } else if (r.status === 'NO_POST_FOUND') {
      console.log(`⊘ no post (slug=${r.slug})`);
    } else {
      console.log(`✗ ${r.status} — ${r.error || ''}`);
    }

    // Throttle nhẹ tránh hit rate limit WP
    if (!DRY) await new Promise((r) => setTimeout(r, 300));
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(counts).forEach(([s, n]) => console.log(`  ${s}: ${n}`));

  // List no-post-found cho Khang verify
  const missing = results.filter((r) => r.status === 'NO_POST_FOUND');
  if (missing.length > 0) {
    console.log('\n⚠️  Files KHÔNG tìm thấy post trên WP (slug có thể khác):');
    missing.forEach((r) => console.log(`    ${r.filename} → slug=${r.slug}`));
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
