#!/usr/bin/env node
/**
 * Sol v4 — Get chi tiết 1 Page/Post (xem content hiện tại + SEO meta)
 *
 * Usage:
 *   node get-page.js <id|slug:xxx> [--post] [--save]
 *
 * Examples:
 *   node get-page.js 42                                 → xem Page #42
 *   node get-page.js slug:gia                           → xem Page slug="gia"
 *   node get-page.js 42 --save                          → save content + meta vào file
 *
 * Output: title, slug, status, SEO meta (rank_math_*), content preview (500 chars).
 */

const fs = require('fs');
const path = require('path');
const { api } = require('./_lib');

async function findBySlug(type, slug) {
  const items = await api.get(`/wp-json/wp/v2/${type}?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id`);
  if (!Array.isArray(items) || items.length === 0) throw new Error(`Không tìm thấy ${type} slug "${slug}"`);
  return items[0].id;
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node get-page.js <id|slug:xxx> [--post] [--save]');
    process.exit(1);
  }
  const type = process.argv.includes('--post') ? 'posts' : 'pages';
  const save = process.argv.includes('--save');

  let id;
  if (/^\d+$/.test(target)) id = parseInt(target, 10);
  else if (target.startsWith('slug:')) id = await findBySlug(type, target.slice(5));
  else { console.error('✗ Target phải là số ID hoặc "slug:xxx"'); process.exit(1); }

  const page = await api.get(`/wp-json/wp/v2/${type}/${id}?context=edit`);

  console.log(`▶ ${type} #${page.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Slug:      ${page.slug}`);
  console.log(`Status:    ${page.status}`);
  console.log(`Modified:  ${page.modified}`);
  console.log(`Link:      ${page.link}`);
  console.log(`Title:     ${page.title?.raw || page.title?.rendered}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SEO META (Rank Math):');
  const m = page.meta || {};
  console.log(`  rank_math_title:         ${m.rank_math_title || '(empty)'}`);
  console.log(`  rank_math_description:   ${m.rank_math_description || '(empty)'}`);
  console.log(`  rank_math_focus_keyword: ${m.rank_math_focus_keyword || '(empty)'}`);
  console.log(`  rank_math_canonical_url: ${m.rank_math_canonical_url || '(empty)'}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`CONTENT (${(page.content?.raw || '').length} chars):`);
  console.log('');
  const raw = page.content?.raw || '';
  console.log(raw.slice(0, 1000));
  if (raw.length > 1000) console.log(`\n... (${raw.length - 1000} chars nữa)`);

  if (save) {
    const outDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const outFile = path.join(outDir, `${page.slug}-${page.id}-${ts}.html`);
    fs.writeFileSync(outFile, raw);
    fs.writeFileSync(outFile + '.meta.json', JSON.stringify(m, null, 2));
    console.log('');
    console.log(`💾 Saved backup: ${outFile}`);
  }
}

main().catch((e) => { console.error('✗', e.message); if (e.body) console.error(JSON.stringify(e.body, null, 2)); process.exit(1); });
