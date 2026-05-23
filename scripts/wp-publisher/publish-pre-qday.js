#!/usr/bin/env node
/**
 * Sol v4 — Publish Pre-Q-Day Wave 1+2 lên WordPress (sol.vn)
 *
 * 7 bài Làm quen + 6 bài Giảm dần = 13 bài. Data từ pre-qday-articles.json.
 * Idempotent — slug đã có trên WP thì UPDATE.
 *
 * Usage:
 *   node publish-pre-qday.js --dry-run
 *   node publish-pre-qday.js
 *   node publish-pre-qday.js --only=lam-quen-ngay-1,giam-dan-ngay-5
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

const ARTICLES = require('./pre-qday-articles.json');

function loadPwd() {
  const lines = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^WP_APP_PASSWORD=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  }
  throw new Error('Khong tim thay WP_APP_PASSWORD');
}
const AUTH = 'Basic ' + Buffer.from(WP_USERNAME + ':' + loadPwd()).toString('base64');

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
        'Content-Disposition': 'attachment; filename="' + fileName + '"',
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
        else {
          const err = new Error('HTTP ' + res.statusCode);
          err.body = parsed;
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function findCategoryId(slug) {
  const cats = await api.get('/wp-json/wp/v2/categories?slug=' + encodeURIComponent(slug) + '&_fields=id');
  return Array.isArray(cats) && cats[0] ? cats[0].id : null;
}

async function findPostBySlug(slug) {
  const items = await api.get(
    '/wp-json/wp/v2/posts?slug=' + encodeURIComponent(slug) +
    '&status=publish,draft,private&context=edit&_fields=id,slug,link'
  );
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function processOne(art, dryRun, categoryId) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', art.htmlFile);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', art.slug + '.png');

  if (!fs.existsSync(htmlPath)) return { slug: art.slug, status: 'NO_HTML' };
  if (!fs.existsSync(ogPath)) return { slug: art.slug, status: 'NO_OG' };

  if (dryRun) {
    const existing = await findPostBySlug(art.slug);
    return { slug: art.slug, status: 'WOULD_PUBLISH', existing: existing ? existing.id : null };
  }

  let mediaId;
  try {
    const media = await uploadFile(ogPath);
    mediaId = media.id;
  } catch (e) {
    return { slug: art.slug, status: 'UPLOAD_FAIL', error: e.message, body: e.body };
  }

  const existing = await findPostBySlug(art.slug);
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const payload = {
    slug: art.slug,
    title: art.title,
    content: content,
    excerpt: art.seoDesc,
    status: 'publish',
    featured_media: mediaId,
    meta: {
      rank_math_title: art.seoTitle,
      rank_math_description: art.seoDesc,
      rank_math_focus_keyword: art.focus,
    },
  };
  if (categoryId) payload.categories = [categoryId];

  try {
    const result = existing
      ? await api.post('/wp-json/wp/v2/posts/' + existing.id, payload)
      : await api.post('/wp-json/wp/v2/posts', payload);
    return {
      slug: art.slug,
      status: existing ? 'UPDATED' : 'CREATED',
      postId: result.id,
      mediaId: mediaId,
      link: result.link,
    };
  } catch (e) {
    return { slug: art.slug, status: 'POST_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? ARTICLES.filter((a) => onlyList.includes(a.slug)) : ARTICLES;

  const bar = '-'.repeat(72);
  console.log(bar);
  console.log('Publish ' + tasks.length + ' bai Pre-Q-Day' + (dryRun ? ' (DRY RUN)' : ''));
  console.log(bar);

  let categoryId = null;
  try {
    categoryId = await findCategoryId('wiki-bo-thuoc-la');
    if (categoryId) console.log('  Category: wiki-bo-thuoc-la -> #' + categoryId);
    else console.log('  Category: (not found, use default)');
  } catch (e) {
    console.log('  Category: (lookup error)');
  }
  console.log('');

  const results = [];
  for (let i = 0; i < tasks.length; i++) {
    const art = tasks[i];
    process.stdout.write('> ' + art.slug.padEnd(44) + '... ');
    const r = await processOne(art, dryRun, categoryId);
    results.push(r);
    if (r.status === 'CREATED' || r.status === 'UPDATED') {
      console.log('OK ' + r.status + ' ' + r.link);
    } else if (r.status === 'WOULD_PUBLISH') {
      console.log('(dry-run OK' + (r.existing ? ' - update #' + r.existing : ' - create new') + ')');
    } else {
      console.log('FAIL ' + r.status);
      if (r.error) console.log('   ' + r.error);
      if (r.body) console.log('   ' + JSON.stringify(r.body).slice(0, 250));
    }
  }

  console.log('');
  console.log(bar);
  const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log('Summary:');
  Object.keys(counts).forEach((k) => console.log('  ' + k + ': ' + counts[k]));
  console.log(bar);

  const liveResults = results.filter((r) => r.status === 'CREATED' || r.status === 'UPDATED');
  if (liveResults.length > 0 && !dryRun) {
    console.log('');
    console.log('LIVE URLs - submit GSC indexing:');
    liveResults.forEach((r) => console.log('   ' + r.link));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
