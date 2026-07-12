#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SOL.VN — Upload Featured Image + Set cho Post
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Workflow:
 *    1. Upload PNG/JPG lên WP Media Library
 *    2. Set thành featured image của post (CPT huong-di)
 *
 *  Usage:
 *    node set-featured-image.js <post_id> <image_path> [alt_text]
 *
 *  Example:
 *    node set-featured-image.js 3345 \
 *      ../huongdi-seo-content/featured-images/pillar-01-freelancer-chuyen-mon.png \
 *      "Freelancer Chuyên Môn Tuổi 45+ — Đi Cùng Sol"
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config({ path: __dirname + '/.env.wp' });

const fs = require('fs');
const path = require('path');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const WP_URL = process.env.WP_URL || 'https://sol.vn';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const CPT_SLUG = process.env.WP_CPT_SLUG || 'huong-di';

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('❌ Missing credentials in .env.wp');
  process.exit(1);
}

const [, , postId, imagePath, altTextArg] = process.argv;
if (!postId || !imagePath) {
  console.error('Usage: node set-featured-image.js <post_id> <image_path> [alt_text]');
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`❌ Image not found: ${imagePath}`);
  process.exit(1);
}

const filename = path.basename(imagePath);
const altText = altTextArg || filename.replace(/\.\w+$/, '').replace(/-/g, ' ');
const ext = path.extname(imagePath).toLowerCase().slice(1);
const mimeType = ext === 'png' ? 'image/png' :
                 ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                 ext === 'webp' ? 'image/webp' : 'application/octet-stream';

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  SOL.VN — Set Featured Image');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Post ID:    ${postId}`);
  console.log(`Image:      ${imagePath}`);
  console.log(`Filename:   ${filename}`);
  console.log(`MIME:       ${mimeType}`);
  console.log(`Alt text:   ${altText}`);
  console.log(`File size:  ${(fs.statSync(imagePath).size / 1024).toFixed(1)} KB`);

  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD.replace(/\s/g, '')}`).toString('base64');
  const imageBuffer = fs.readFileSync(imagePath);

  // ── Step 1: Upload to Media Library ──────────────────────────────────
  console.log('\n── 1. Uploading to Media Library ──────────────────────');
  const f = await fetch;
  const uploadRes = await f(`${WP_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: imageBuffer,
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    console.error(`❌ Upload failed (${uploadRes.status}):`);
    console.error(JSON.stringify(uploadData, null, 2));
    process.exit(1);
  }

  const mediaId = uploadData.id;
  const mediaUrl = uploadData.source_url;
  console.log(`✅ Uploaded: ID ${mediaId}`);
  console.log(`   URL:     ${mediaUrl}`);

  // ── Step 2: Update alt text ──────────────────────────────────────────
  console.log('\n── 2. Setting alt text + caption ──────────────────────');
  const altRes = await f(`${WP_URL}/wp-json/wp/v2/media/${mediaId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alt_text: altText,
      title: altText,
      caption: altText,
    }),
  });

  if (!altRes.ok) {
    console.warn(`⚠️  Could not update alt text (${altRes.status})`);
  } else {
    console.log(`✅ Alt text set: "${altText}"`);
  }

  // ── Step 3: Set as featured image cho post ───────────────────────────
  console.log(`\n── 3. Setting as featured image cho post ${postId} ────────`);
  const updateRes = await f(`${WP_URL}/wp-json/wp/v2/${CPT_SLUG}/${postId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      featured_media: mediaId,
    }),
  });

  const updateData = await updateRes.json();

  if (!updateRes.ok) {
    console.error(`❌ Update post failed (${updateRes.status}):`);
    console.error(JSON.stringify(updateData, null, 2));
    process.exit(1);
  }

  console.log(`✅ Featured image SET cho post ${postId}`);

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  ✅ DONE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Post URL:     ${WP_URL}/?p=${postId}&preview=true`);
  console.log(`  Edit URL:     ${WP_URL}/wp-admin/post.php?post=${postId}&action=edit`);
  console.log(`  Image URL:    ${mediaUrl}`);
  console.log(`  Media ID:     ${mediaId}`);
})();
