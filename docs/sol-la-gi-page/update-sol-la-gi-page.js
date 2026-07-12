#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SOL.VN — Update trang sol.vn/sol-la-gi/ (About Sol)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Tự động:
 *  1. Convert MD → Gutenberg HTML (preserve Gutenberg blocks)
 *  2. Inject Schema Organization JSON-LD
 *  3. Update page hiện có hoặc tạo mới (status: draft)
 *
 *  Usage:
 *    node update-sol-la-gi-page.js [--search-slug sol-la-gi]
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
  console.error('❌ marked not found. Run: cd ../pillar-to-wp && npm install marked');
  process.exit(1);
}

const WP_URL = process.env.WP_URL || 'https://sol.vn';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('❌ Missing credentials in ../pillar-to-wp/.env.wp');
  process.exit(1);
}

const args = process.argv.slice(2);
let postId = null;
let searchSlug = 'sol-la-gi';
let postType = 'pages';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--post-id' && args[i+1]) postId = args[++i];
  if (args[i] === '--search-slug' && args[i+1]) searchSlug = args[++i];
}

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

  // Protect raw Gutenberg blocks
  const gutenbergBlocks = [];
  md = md.replace(/<!-- wp:(\w+)[\s\S]*?<!-- \/wp:\1 -->/g, (match) => {
    const i = gutenbergBlocks.length;
    gutenbergBlocks.push(match);
    return `\n\n<div data-gb-placeholder="${i}"></div>\n\n`;
  });

  let html = marked.parse(md);

  // Restore Gutenberg blocks
  html = html.replace(/<p>\s*<div data-gb-placeholder="(\d+)"><\/div>\s*<\/p>/g, (m, i) => gutenbergBlocks[parseInt(i)]);
  html = html.replace(/<div data-gb-placeholder="(\d+)"><\/div>/g, (m, i) => gutenbergBlocks[parseInt(i)]);

  // Wrap elements
  html = html.replace(/<h1>[^<]+<\/h1>/g, '');
  html = html.replace(/<h2>([^<]+)<\/h2>/g, (m,t) => `<!-- wp:heading -->\n<h2>${t}</h2>\n<!-- /wp:heading -->\n`);
  html = html.replace(/<h3>([^<]+)<\/h3>/g, (m,t) => `<!-- wp:heading {"level":3} -->\n<h3>${t}</h3>\n<!-- /wp:heading -->\n`);
  html = html.replace(/<h4>([^<]+)<\/h4>/g, (m,t) => `<!-- wp:heading {"level":4} -->\n<h4>${t}</h4>\n<!-- /wp:heading -->\n`);
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (m,t) => `<!-- wp:paragraph -->\n<p>${t}</p>\n<!-- /wp:paragraph -->\n`);
  html = html.replace(/<ul>([\s\S]*?)<\/ul>/g, (m,t) => `<!-- wp:list -->\n<ul>${t}</ul>\n<!-- /wp:list -->\n`);
  html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (m,t) => `<!-- wp:quote -->\n<blockquote class="wp-block-quote">${t}</blockquote>\n<!-- /wp:quote -->\n`);
  html = html.replace(/<hr\s*\/?>/g, `<!-- wp:separator -->\n<hr class="wp-block-separator"/>\n<!-- /wp:separator -->\n`);
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, (m, t) => `<!-- wp:html -->\n<table>${t}</table>\n<!-- /wp:html -->\n`);
  return html;
}

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  SOL.VN — Update trang Sol Là Gì (About Page)');
  console.log('═══════════════════════════════════════════════════════════════════');

  const mdPath = path.join(__dirname, 'sol-la-gi-content.md');
  const raw = fs.readFileSync(mdPath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  const schemaPath = path.join(__dirname, 'schema-organization-sol.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  console.log(`Title:    ${meta.title}`);
  console.log(`Slug:     ${meta.slug}`);

  const contentHtml = mdToGutenberg(body);
  const schemaBlock = `\n<!-- wp:html -->\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n<!-- /wp:html -->\n`;
  const fullContent = contentHtml + schemaBlock;

  console.log(`Content size: ${(fullContent.length / 1024).toFixed(1)} KB`);

  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD.replace(/\s/g, '')}`).toString('base64');
  const f = await fetch;

  // Search existing
  if (searchSlug && !postId) {
    console.log(`\n── Searching for slug "${searchSlug}"... ──`);
    const searchRes = await f(`${WP_URL}/wp-json/wp/v2/${postType}?slug=${searchSlug}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const posts = await searchRes.json();
    if (Array.isArray(posts) && posts.length > 0) {
      postId = posts[0].id;
      console.log(`✅ Found existing page ID: ${postId}`);
    } else {
      console.log(`⚠️  Không tìm thấy. Sẽ tạo PAGE mới.`);
    }
  }

  const payload = {
    title: meta.title,
    slug: meta.slug,
    status: 'draft',
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

  console.log(`\n── ${postId ? 'UPDATING' : 'CREATING'} page ──`);

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

  // ── Auto upload + set Featured Image ──
  const featuredImgPath = path.join(__dirname, 'featured-image', 'sol-la-gi-featured.png');
  if (fs.existsSync(featuredImgPath)) {
    console.log(`\n── Searching for existing sol-la-gi featured image... ──`);
    const mediaSearch = await f(`${WP_URL}/wp-json/wp/v2/media?search=sol-la-gi-featured&per_page=5`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const mediaList = await mediaSearch.json();
    let mediaId = null;

    if (Array.isArray(mediaList) && mediaList.length > 0) {
      const existing = mediaList.find(m => m.source_url && m.source_url.includes('sol-la-gi-featured'));
      if (existing) {
        mediaId = existing.id;
        console.log(`✅ Found existing media: ID ${mediaId}`);
      }
    }

    // Upload new nếu chưa có
    if (!mediaId) {
      console.log(`── Uploading new featured image... ──`);
      const imageBuffer = fs.readFileSync(featuredImgPath);
      const uploadRes = await f(`${WP_URL}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="sol-la-gi-featured.png"',
        },
        body: imageBuffer,
      });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok) {
        mediaId = uploadData.id;
        console.log(`✅ Uploaded: ID ${mediaId}`);

        // Set alt text
        await f(`${WP_URL}/wp-json/wp/v2/media/${mediaId}`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alt_text: 'Sol Là Gì - Hệ Sinh Thái Thân Tâm Trí',
            title: 'Sol Là Gì - Hệ Sinh Thái Thân Tâm Trí',
            caption: 'Đi Cùng Sol - Hệ sinh thái 3 trụ Thân Tâm Trí cho đàn ông Việt 40-65'
          })
        });
      } else {
        console.warn(`⚠️  Upload failed: ${JSON.stringify(uploadData).substring(0, 200)}`);
      }
    }

    // Set featured_media
    if (mediaId) {
      const fmRes = await f(`${WP_URL}/wp-json/wp/v2/${postType}/${data.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured_media: mediaId })
      });
      if (fmRes.ok) {
        console.log(`✅ Featured Image SET (media ID ${mediaId})`);
      } else {
        console.log(`⚠️  Could not set featured image`);
      }
    }
  } else {
    console.log(`\n⚠️  Featured image file not found: ${featuredImgPath}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  ✅ SUCCESS');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  ID:       ${data.id}`);
  console.log(`  Status:   ${data.status}`);
  console.log(`  URL:      ${WP_URL}/${data.slug}/`);
  console.log(`  Edit:     ${WP_URL}/wp-admin/post.php?post=${data.id}&action=edit`);
  console.log('');
  console.log('Next: review wp-admin → Publish → submit GSC');
})();
