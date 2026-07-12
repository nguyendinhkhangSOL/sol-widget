#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SOL.VN — Pillar Page Publisher (Markdown → WordPress CPT "huong-di")
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Publish 1 pillar markdown lên sol.vn dưới dạng draft post (CPT huong-di).
 *  Khang vào wp-admin review → publish thủ công để verify trước khi go live.
 *
 *  Pre-requisites:
 *    1. WordPress sol.vn có CPT "huong-di" với REST API enabled
 *    2. User WP có Application Password (Settings → Users → Application Passwords)
 *    3. File .env.wp với credentials (KHÔNG commit lên git)
 *
 *  Usage:
 *    npm install node-fetch dotenv
 *    cp .env.wp.example .env.wp  # edit credentials
 *    node publish-pillar-to-wp.js <pillar.md>
 *
 *  Example:
 *    node publish-pillar-to-wp.js ../huongdi-seo-content/pillar-01-freelancer-chuyen-mon.md
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config({ path: __dirname + '/.env.wp' });

const fs = require('fs');
const path = require('path');

// Try load deps
let fetch, marked;
try {
  fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
  marked = require('marked');
} catch (e) {
  console.error('\n❌ Missing deps. Install:');
  console.error('   cd ' + __dirname);
  console.error('   npm install marked node-fetch@2 dotenv\n');
  process.exit(1);
}

// ── Config từ env ─────────────────────────────────────────────────────
const WP_URL = process.env.WP_URL || 'https://sol.vn';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const CPT_SLUG = process.env.WP_CPT_SLUG || 'huong-di';
const DEFAULT_STATUS = process.env.WP_DEFAULT_STATUS || 'draft';

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('\n❌ Missing credentials in .env.wp');
  console.error('   Create .env.wp with:');
  console.error('     WP_USER=khangsol');
  console.error('     WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx');
  console.error('\n   Get Application Password from:');
  console.error('     wp-admin → Users → Profile → Application Passwords\n');
  process.exit(1);
}

// ── Parse args ────────────────────────────────────────────────────────
let inputPath = null;
let updatePostId = null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--update' && args[i + 1]) {
    updatePostId = args[i + 1];
    i++;
  } else if (!inputPath) {
    inputPath = args[i];
  }
}
if (!inputPath) {
  console.error('Usage: node publish-pillar-to-wp.js <pillar.md> [--update <post_id>]');
  console.error('Examples:');
  console.error('  Create new:  node publish-pillar-to-wp.js pillar.md');
  console.error('  Update:      node publish-pillar-to-wp.js pillar.md --update 3345');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

// ── Parse YAML frontmatter ───────────────────────────────────────────
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  let currentKey = null;
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    if (line.startsWith('  - ')) {
      if (Array.isArray(meta[currentKey])) {
        meta[currentKey].push(line.substring(4).replace(/^["']|["']$/g, ''));
      }
      continue;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (val === '') {
        meta[currentKey] = [];
      } else {
        meta[currentKey] = val.replace(/^["']|["']$/g, '');
      }
    }
  }
  return { meta, body: m[2] };
}

// ── Transform URLs trong MD body trước khi parse ───────────────────────
function transformUrls(md) {
  // Map các slug pillar/spoke về URL đầy đủ sol.vn/huong-di/
  const pillarSlugs = [
    'freelancer-chuyen-mon-tuoi-45',
    'coaching-dao-tao-tuoi-45',
    'content-creator-tuoi-45',
    'khoi-nghiep-kinh-doanh-tinh-gon-tuoi-45',
    'dai-ly-phan-phoi-tuoi-45',
    'dich-vu-service-business-tuoi-45',
    'dau-thau-hop-dong-tuoi-45',
  ];

  // Replace markdown links [text](/slug/) → [text](https://sol.vn/huong-di/slug/)
  for (const slug of pillarSlugs) {
    md = md.replace(
      new RegExp(`\\]\\(/${slug}/?\\)`, 'g'),
      `](https://sol.vn/huong-di/${slug}/)`
    );
    // Also relative without leading slash
    md = md.replace(
      new RegExp(`\\]\\(${slug}/?\\)`, 'g'),
      `](https://sol.vn/huong-di/${slug}/)`
    );
  }

  // Replace /p1.html, /p2.html, /p3.html → https://huongdi.sol.vn/pX.html
  md = md.replace(/\]\(\/?(p[1-3](?:-[a-z]+)?\.html)\)/g, '](https://huongdi.sol.vn/$1)');

  // Replace /huong-di/ → https://sol.vn/huong-di/ (root of content hub)
  md = md.replace(/\]\(\/huong-di\/\)/g, '](https://sol.vn/huong-di/)');

  return md;
}

// ── Convert MD → Gutenberg blocks HTML ────────────────────────────────
function mdToGutenberg(md) {
  marked.setOptions({ gfm: true, breaks: false, mangle: false, headerIds: false });
  // Transform URLs TRƯỚC khi convert
  md = transformUrls(md);
  const html = marked.parse(md);

  // Wrap each block trong Gutenberg comment để WordPress recognize as blocks
  let result = html;

  // <h1> → wp:heading level 1 (nhưng h1 thường là post title, không cần block)
  result = result.replace(/<h1>([^<]+)<\/h1>/g, '');

  // <h2> → wp:heading level 2
  result = result.replace(/<h2>([^<]+)<\/h2>/g, (m, t) =>
    `<!-- wp:heading -->\n<h2>${t}</h2>\n<!-- /wp:heading -->\n`);

  // <h3> → wp:heading level 3
  result = result.replace(/<h3>([^<]+)<\/h3>/g, (m, t) =>
    `<!-- wp:heading {"level":3} -->\n<h3>${t}</h3>\n<!-- /wp:heading -->\n`);

  // <p> → wp:paragraph
  result = result.replace(/<p>([\s\S]*?)<\/p>/g, (m, t) =>
    `<!-- wp:paragraph -->\n<p>${t}</p>\n<!-- /wp:paragraph -->\n`);

  // <ul> → wp:list
  result = result.replace(/<ul>([\s\S]*?)<\/ul>/g, (m, t) =>
    `<!-- wp:list -->\n<ul>${t}</ul>\n<!-- /wp:list -->\n`);

  // <ol> → wp:list ordered
  result = result.replace(/<ol>([\s\S]*?)<\/ol>/g, (m, t) =>
    `<!-- wp:list {"ordered":true} -->\n<ol>${t}</ol>\n<!-- /wp:list -->\n`);

  // <blockquote> → wp:quote
  result = result.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (m, t) =>
    `<!-- wp:quote -->\n<blockquote class="wp-block-quote">${t}</blockquote>\n<!-- /wp:quote -->\n`);

  // <hr> → wp:separator
  result = result.replace(/<hr\s*\/?>/g, `<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->\n`);

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  SOL.VN — Publish Pillar to WordPress');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Input:  ${inputPath}`);
  console.log(`Target: ${WP_URL}/wp-json/wp/v2/${CPT_SLUG}`);
  console.log(`User:   ${WP_USER}`);
  console.log(`Status: ${DEFAULT_STATUS}`);

  const raw = fs.readFileSync(inputPath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  console.log(`\nMetadata:`);
  console.log(`  Title: ${meta.title}`);
  console.log(`  Slug:  ${meta.slug}`);
  console.log(`  KW:    ${meta.primary_keyword}`);

  // Convert MD → Gutenberg
  console.log('\n── Converting MD → Gutenberg blocks ──────────────────────');
  const contentHtml = mdToGutenberg(body);
  console.log(`  Content size: ${(contentHtml.length / 1024).toFixed(1)} KB`);

  // Build excerpt (description from frontmatter)
  const excerpt = meta.description || '';

  // Build post payload
  const post = {
    title: meta.title,
    slug: meta.slug,
    status: DEFAULT_STATUS,  // draft / publish
    content: contentHtml,
    excerpt: excerpt,
    // Rank Math SEO meta (Sol.vn dùng Rank Math)
    meta: {
      rank_math_title: meta.title,
      rank_math_description: meta.description,
      rank_math_focus_keyword: meta.primary_keyword,
      rank_math_canonical_url: meta.canonical,
      rank_math_robots: ['index', 'follow'],
      rank_math_advanced_robots: { 'max-snippet': '-1', 'max-image-preview': 'large' },
    }
  };

  // Submit to WP
  const isUpdate = !!updatePostId;
  console.log(`\n── ${isUpdate ? 'UPDATING post ' + updatePostId : 'Creating new post'} ──────────────────────`);
  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD.replace(/\s/g, '')}`).toString('base64');

  const endpoint = isUpdate
    ? `${WP_URL}/wp-json/wp/v2/${CPT_SLUG}/${updatePostId}`
    : `${WP_URL}/wp-json/wp/v2/${CPT_SLUG}`;

  try {
    const f = await fetch;
    const res = await f(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(post)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`\n❌ WP API Error (${res.status}):`);
      console.error(JSON.stringify(data, null, 2));
      if (res.status === 401) {
        console.error('\n💡 Hint: Kiểm tra Application Password đã đúng chưa, hoặc user có quyền publish CPT không.');
      }
      if (res.status === 404) {
        console.error(`\n💡 Hint: CPT "${CPT_SLUG}" chưa enable REST API. Vào CPT UI → edit "huong-di" → "Show in REST" → save.`);
      }
      process.exit(1);
    }

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('  ✅ POST CREATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`  ID:        ${data.id}`);
    console.log(`  Status:    ${data.status}`);
    console.log(`  Slug:      ${data.slug}`);
    console.log(`  URL final: ${WP_URL}/${CPT_SLUG}/${data.slug}/`);
    console.log(`  Edit URL:  ${WP_URL}/wp-admin/post.php?post=${data.id}&action=edit`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Anh vào wp-admin → Edit post để:');
    console.log('     - Review content');
    console.log('     - Set Featured Image (1200×630, Sol orange)');
    console.log('     - Verify Rank Math SEO (focus keyword, title, description)');
    console.log('     - Add Tags + Category nếu cần');
    console.log('  2. Click "Publish" để go live');
    console.log('  3. Submit URL lên Google Search Console → Request Indexing');

  } catch (err) {
    console.error('\n❌ Network/Fetch error:', err.message);
    process.exit(1);
  }
})();
