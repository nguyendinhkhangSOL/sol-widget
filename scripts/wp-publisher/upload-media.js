#!/usr/bin/env node
/**
 * Sol v4 — Upload ảnh / file PNG lên WP Media Library qua REST API
 *
 * Usage:
 *   node upload-media.js <file-path> [--alt="alt text"] [--caption="caption"]
 *
 * Example:
 *   node upload-media.js ../../wiki-skeletons/wiki-articles/og-images/cai-thuoc-la-tai-nha.png \
 *     --alt="Cai thuốc lá tại nhà — 7 bước khoa học cho đàn ông 45+"
 *
 * Output: in ra Media ID + URL. Lưu lại Media ID để set featured_media khi create post.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { WP_URL, WP_USERNAME } = require('./_lib');

function loadEnvPwd() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  });
  return env.WP_APP_PASSWORD.replace(/\s+/g, '');
}

const AUTH = 'Basic ' + Buffer.from(`${WP_USERNAME}:${loadEnvPwd()}`).toString('base64');

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
  }[ext] || 'application/octet-stream';
}

function uploadFile(filePath, altText, caption) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const mime = mimeOf(filePath);
    const url = new URL('/wp-json/wp/v2/media', WP_URL);

    const req = https.request(
      {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          'Authorization': AUTH,
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileData.length,
          'Accept': 'application/json',
        },
        timeout: 60000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(raw); } catch { parsed = raw; }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(`HTTP ${res.statusCode}`);
            err.body = parsed;
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Upload timeout 60s')); });
    req.write(fileData);
    req.end();
  });
}

async function updateMediaMeta(id, altText, caption) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      ...(altText ? { alt_text: altText } : {}),
      ...(caption ? { caption } : {}),
    });
    const url = new URL(`/wp-json/wp/v2/media/${id}`, WP_URL);
    const req = https.request(
      {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          'Authorization': AUTH,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node upload-media.js <file-path> [--alt="..."] [--caption="..."]');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ File không tồn tại: ${filePath}`);
    process.exit(1);
  }

  const altArg = args.find((a) => a.startsWith('--alt='));
  const capArg = args.find((a) => a.startsWith('--caption='));
  const altText = altArg ? altArg.slice(6).replace(/^["']|["']$/g, '') : '';
  const caption = capArg ? capArg.slice(10).replace(/^["']|["']$/g, '') : '';

  console.log(`▶ Upload: ${path.relative(process.cwd(), filePath)} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);

  try {
    const media = await uploadFile(filePath);
    console.log('✓ UPLOADED');
    console.log(`  Media ID: ${media.id}`);
    console.log(`  URL:      ${media.source_url}`);
    console.log(`  MIME:     ${media.mime_type}`);

    if (altText || caption) {
      console.log('▶ Đặt alt text + caption…');
      await updateMediaMeta(media.id, altText, caption);
      console.log(`  ✓ Alt: ${altText || '(empty)'}`);
      console.log(`  ✓ Caption: ${caption || '(empty)'}`);
    }

    console.log('');
    console.log('💡 Lưu lại Media ID này. Dùng khi update-page hoặc create-post:');
    console.log(`   featured_media: ${media.id}`);
  } catch (e) {
    console.error('✗ FAIL:', e.message);
    if (e.body) console.error(JSON.stringify(e.body, null, 2));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
