#!/usr/bin/env node
/**
 * Sol v4 - Publish/Update 16 bai Method Cluster (Phuong phap cai thuoc)
 *
 * Data manifest: ./method-cluster-articles.json (16 entries)
 *
 * Bao gom:
 *   - 1 PILLAR refresh (UPDATE): phuong-phap-cai-thuoc-la-pho-bien
 *   - 4 CHIP khoa hoc: Bupropion, Allen Carr, CBT+MI, Keo OTC
 *   - 4 CHIP dan gian VN: Nhi cham, Laser, Thoi mien, Cay thuoc nam
 *   - 2 CHIP harm reduction: Vape, IQOS
 *   - 2 Decision: Chon phuong phap / Sol Hybrid v2
 *   - 3 Long-tail: Cai khi nhau / Champix vs NRT vs Bupropion / Nguoi 50+
 *
 * OG image: optional (publish without featured_media neu chua co)
 *
 * Usage:
 *   node publish-method-cluster.js --dry-run
 *   node publish-method-cluster.js                       # tat ca 16
 *   node publish-method-cluster.js --only=bupropion-wellbutrin-zyban-cai-thuoc
 *   node publish-method-cluster.js --skip-existing
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

function loadPwd() {
  const envPath = path.join(__dirname, '.env');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^WP_APP_PASSWORD=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  }
  throw new Error('Khong tim thay WP_APP_PASSWORD');
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
        'Authorization': AUTH, 'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileData.length, 'Accept': 'application/json',
      }, timeout: 60000,
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

const ARTICLES = require('./method-cluster-articles.json');

async function processOne(article, dryRun, categoryId, skipExisting) {
  const { slug, filename, title, seoTitle, seoDesc, focus } = article;
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', filename);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', slug + '.png');

  if (!fs.existsSync(htmlPath)) return { slug, status: 'NO_HTML' };

  const existing = await findPostBySlug(slug);
  if (skipExisting && existing) return { slug, status: 'SKIPPED', postId: existing.id };
  if (dryRun) return { slug, status: 'WOULD_PUBLISH', existing: existing ? existing.id : null };

  let mediaId = null;
  if (fs.existsSync(ogPath)) {
    try {
      const media = await uploadFile(ogPath);
      mediaId = media.id;
    } catch (e) {
      console.log('   warning OG upload fail (continuing): ' + e.message);
    }
  }

  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
    rank_math_focus_keyword: focus,
  };
  const payload = {
    slug, title, content, excerpt: seoDesc, status: 'publish', meta,
  };
  if (mediaId) payload.featured_media = mediaId;
  if (categoryId) payload.categories = [categoryId];

  try {
    const result = existing
      ? await api.post('/wp-json/wp/v2/posts/' + existing.id, payload)
      : await api.post('/wp-json/wp/v2/posts', payload);
    return {
      slug, status: existing ? 'UPDATED' : 'CREATED',
      postId: result.id, mediaId, link: result.link,
    };
  } catch (e) {
    return { slug, status: 'POST_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipExisting = process.argv.includes('--skip-existing');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? ARTICLES.filter((a) => onlyList.includes(a.slug)) : ARTICLES;

  console.log('Publish ' + tasks.length + ' bai Method Cluster' + (dryRun ? ' (DRY RUN)' : '') + (skipExisting ? ' (SKIP EXISTING)' : ''));
  const categoryId = await findCategoryId('wiki-bo-thuoc-la');
  if (categoryId) console.log('  Category: wiki-bo-thuoc-la -> #' + categoryId);
  console.log('');

  const results = [];
  for (const article of tasks) {
    process.stdout.write('> ' + article.slug.padEnd(55) + '... ');
    const r = await processOne(article, dryRun, categoryId, skipExisting);
    results.push(r);
    if (r.status === 'CREATED' || r.status === 'UPDATED') console.log('OK ' + r.status + ' ' + r.link);
    else if (r.status === 'WOULD_PUBLISH') console.log('(dry-run - ' + (r.existing ? 'update #' + r.existing : 'tao moi') + ')');
    else if (r.status === 'SKIPPED') console.log('skipped (#' + r.postId + ')');
    else {
      console.log('FAIL ' + r.status);
      if (r.error) console.log('   ' + r.error);
      if (r.body) console.log('   ' + JSON.stringify(r.body).slice(0, 200));
    }
  }

  console.log('');
  console.log('='.repeat(70));
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  console.log('Tong ket:');
  Object.entries(counts).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
  console.log('='.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
