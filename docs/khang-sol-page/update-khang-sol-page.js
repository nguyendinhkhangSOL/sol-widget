#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SOL.VN — Update trang Khang Sol (Author Profile)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Tự động:
 *  1. Convert MD → Gutenberg HTML
 *  2. Inject Schema Person JSON-LD
 *  3. Update post/page hiện có hoặc tạo mới
 *
 *  Usage:
 *    node update-khang-sol-page.js [--post-id <id>]
 *    node update-khang-sol-page.js --search-slug khang-sol
 *
 *  Examples:
 *    Tìm page có slug "khang-sol" → update:
 *      node update-khang-sol-page.js --search-slug khang-sol
 *
 *    Update post ID đã biết:
 *      node update-khang-sol-page.js --post-id 1234
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config({ path: __dirname + '/../pillar-to-wp/.env.wp' });

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

let marked;
try {
  marked = require(path.join(__dirname, '../pillar-to-wp/node_modules/marked'));
} catch (e) {
  console.error('❌ marked not found. Install in pillar-to-wp first:');
  console.error('   cd ../pillar-to-wp && npm install marked');
  process.exit(1);
}

const WP_URL = process.env.WP_URL || 'https://sol.vn';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('❌ Missing credentials in ../pillar-to-wp/.env.wp');
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
let postId = null;
let searchSlug = null;
let postType = 'pages';  // default = pages

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--post-id' && args[i+1]) postId = args[++i];
  if (args[i] === '--search-slug' && args[i+1]) searchSlug = args[++i];
  if (args[i] === '--type' && args[i+1]) postType = args[++i];
}

// Parse MD frontmatter
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  let cur = null;
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    if (line.startsWith('  - ')) {
      if (Array.isArray(meta[cur])) meta[cur].push(line.substring(4).replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) {
      cur = kv[1];
      const val = kv[2].trim();
      if (val === '') meta[cur] = [];
      else meta[cur] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { meta, body: m[2] };
}

function mdToGutenberg(md) {
  marked.setOptions({ gfm: true, breaks: false, mangle: false, headerIds: false });

  // ── Bước 1: Bảo vệ raw Gutenberg block (vd: <!-- wp:image -->...<!-- /wp:image -->)
  // Dùng HTML span placeholder để marked KHÔNG xử lý (an toàn hơn underscores)
  const gutenbergBlocks = [];
  md = md.replace(/<!-- wp:(\w+)[\s\S]*?<!-- \/wp:\1 -->/g, (match) => {
    const i = gutenbergBlocks.length;
    gutenbergBlocks.push(match);
    return `\n\n<div data-gb-placeholder="${i}"></div>\n\n`;
  });

  let html = marked.parse(md);

  // ── Bước 2: Restore Gutenberg block (loại bỏ <p> wrapper nếu có)
  html = html.replace(/<p>\s*<div data-gb-placeholder="(\d+)"><\/div>\s*<\/p>/g, (m, i) => gutenbergBlocks[parseInt(i)]);
  html = html.replace(/<div data-gb-placeholder="(\d+)"><\/div>/g, (m, i) => gutenbergBlocks[parseInt(i)]);

  // ── Bước 3: Wrap các element còn lại trong Gutenberg block ──
  html = html.replace(/<h1>[^<]+<\/h1>/g, ''); // h1 sẽ là post title
  html = html.replace(/<h2>([^<]+)<\/h2>/g, (m,t) => `<!-- wp:heading -->\n<h2>${t}</h2>\n<!-- /wp:heading -->\n`);
  html = html.replace(/<h3>([^<]+)<\/h3>/g, (m,t) => `<!-- wp:heading {"level":3} -->\n<h3>${t}</h3>\n<!-- /wp:heading -->\n`);
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (m,t) => `<!-- wp:paragraph -->\n<p>${t}</p>\n<!-- /wp:paragraph -->\n`);
  html = html.replace(/<ul>([\s\S]*?)<\/ul>/g, (m,t) => `<!-- wp:list -->\n<ul>${t}</ul>\n<!-- /wp:list -->\n`);
  html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (m,t) => `<!-- wp:quote -->\n<blockquote class="wp-block-quote">${t}</blockquote>\n<!-- /wp:quote -->\n`);
  html = html.replace(/<hr\s*\/?>/g, `<!-- wp:separator -->\n<hr class="wp-block-separator"/>\n<!-- /wp:separator -->\n`);
  return html;
}

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  SOL.VN — Update Khang Sol Author Profile');
  console.log('═══════════════════════════════════════════════════════════════════');

  const mdPath = path.join(__dirname, 'khang-sol-author-profile.md');
  const raw = fs.readFileSync(mdPath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  const schemaPath = path.join(__dirname, 'schema-person-khang-sol.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  console.log(`Title:    ${meta.title}`);
  console.log(`Slug:     ${meta.slug}`);

  const contentHtml = mdToGutenberg(body);

  // Inject schema as custom HTML block at bottom
  const schemaBlock = `\n<!-- wp:html -->\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n<!-- /wp:html -->\n`;
  const fullContent = contentHtml + schemaBlock;

  console.log(`Content size: ${(fullContent.length / 1024).toFixed(1)} KB`);

  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD.replace(/\s/g, '')}`).toString('base64');
  const f = await fetch;

  // Find existing post if search-slug
  if (searchSlug && !postId) {
    console.log(`\n── Searching for slug "${searchSlug}" in pages... ──`);
    const searchRes = await f(`${WP_URL}/wp-json/wp/v2/${postType}?slug=${searchSlug}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const posts = await searchRes.json();
    if (Array.isArray(posts) && posts.length > 0) {
      postId = posts[0].id;
      console.log(`✅ Found existing ${postType.slice(0, -1)} ID: ${postId}`);
    } else {
      // Try search in posts
      const altRes = await f(`${WP_URL}/wp-json/wp/v2/posts?slug=${searchSlug}`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const altPosts = await altRes.json();
      if (Array.isArray(altPosts) && altPosts.length > 0) {
        postId = altPosts[0].id;
        postType = 'posts';
        console.log(`✅ Found existing post ID: ${postId}`);
      } else {
        console.log(`⚠️  Không tìm thấy ${postType}/posts với slug "${searchSlug}". Sẽ tạo PAGE mới.`);
        postType = 'pages';
      }
    }
  }

  // Build payload
  const payload = {
    title: meta.title,
    slug: meta.slug,
    status: 'draft',  // luôn draft cho an toàn
    content: fullContent,
    excerpt: meta.description,
    meta: {
      rank_math_title: meta.title,
      rank_math_description: meta.description,
      rank_math_focus_keyword: meta.primary_keyword,
      rank_math_canonical_url: meta.canonical,
    }
  };

  const endpoint = postId
    ? `${WP_URL}/wp-json/wp/v2/${postType}/${postId}`
    : `${WP_URL}/wp-json/wp/v2/pages`;

  console.log(`\n── ${postId ? 'UPDATING' : 'CREATING'} ${postType} ──`);
  console.log(`Endpoint: ${endpoint}`);

  const res = await f(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`\n❌ Error (${res.status}):`);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  // ── Auto set Featured Image từ Media Library ──────────────────────
  console.log(`\n── Tìm ảnh portrait trong Media Library ──`);
  const mediaSearch = await f(`${WP_URL}/wp-json/wp/v2/media?search=khang-portrait&per_page=5`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  const mediaList = await mediaSearch.json();

  if (Array.isArray(mediaList) && mediaList.length > 0) {
    const portrait = mediaList.find(m =>
      m.source_url && m.source_url.includes('khang-portrait-yulong-mountain')
    ) || mediaList[0];
    console.log(`✅ Found media: ID ${portrait.id} - ${portrait.source_url}`);

    // Set featured_media
    const fmRes = await f(`${WP_URL}/wp-json/wp/v2/${postType}/${data.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ featured_media: portrait.id })
    });
    if (fmRes.ok) {
      console.log(`✅ Featured Image SET (media ID ${portrait.id})`);
    } else {
      console.log(`⚠️  Could not set featured image (${fmRes.status})`);
    }
  } else {
    console.log(`⚠️  Không tìm thấy media "khang-portrait" trong Library. Khang set manual qua wp-admin.`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  ✅ SUCCESS');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  ID:       ${data.id}`);
  console.log(`  Status:   ${data.status}`);
  console.log(`  Type:     ${postType}`);
  console.log(`  URL:      ${WP_URL}/${data.slug}/`);
  console.log(`  Edit:     ${WP_URL}/wp-admin/post.php?post=${data.id}&action=edit`);
  console.log('');
  console.log('Next: review trên wp-admin → Publish → submit GSC');
})();
