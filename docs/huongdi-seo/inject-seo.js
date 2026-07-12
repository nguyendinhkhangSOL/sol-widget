#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  HUONGDI.SOL.VN — SEO Injector
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Inject meta tags + JSON-LD schemas vào tất cả HTML files theo seo-data.json
 *
 *  Usage:
 *    node inject-seo.js [--dir=/var/www/huongdi/public] [--dry-run]
 *
 *  Backup: mỗi file gốc được copy thành .bak.YYYYMMDD-HHMMSS trước khi sửa
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ── Parse args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let targetDir = '/var/www/huongdi/public';
let dryRun = false;

for (const arg of args) {
  if (arg.startsWith('--dir=')) targetDir = arg.split('=')[1];
  if (arg === '--dry-run') dryRun = true;
}

// ── Load configs ──────────────────────────────────────────────────────
const SCRIPT_DIR = __dirname;
const seoData = JSON.parse(fs.readFileSync(path.join(SCRIPT_DIR, 'seo-data.json'), 'utf8'));
const schemas = JSON.parse(fs.readFileSync(path.join(SCRIPT_DIR, 'schemas.json'), 'utf8'));

const meta = seoData._meta;
const pages = seoData.pages;

// ── Helpers ───────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function timestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '-',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join('');
}

// ── Build SEO block ───────────────────────────────────────────────────
function buildSEOBlock(filename, config) {
  const baseUrl = meta.base_url;
  const canonicalUrl = baseUrl + (config.canonical || '/');
  const ogImage = config.og_image
    ? (config.og_image.startsWith('http') ? config.og_image : baseUrl + config.og_image)
    : meta.default_image;

  const lines = [];
  lines.push('  <!-- ═══════ SEO META (injected by inject-seo.js) ═══════ -->');
  lines.push(`  <title>${escapeHtml(config.title)}</title>`);
  lines.push(`  <meta name="description" content="${escapeHtml(config.description)}">`);
  if (config.keywords) {
    lines.push(`  <meta name="keywords" content="${escapeHtml(config.keywords)}">`);
  }
  lines.push(`  <link rel="canonical" href="${canonicalUrl}">`);
  lines.push(`  <meta name="author" content="${escapeHtml(meta.author)}">`);
  lines.push(`  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`);
  lines.push(`  <meta name="language" content="${meta.language}">`);

  // Open Graph
  lines.push('');
  lines.push('  <!-- Open Graph -->');
  lines.push(`  <meta property="og:title" content="${escapeHtml(config.title)}">`);
  lines.push(`  <meta property="og:description" content="${escapeHtml(config.description)}">`);
  lines.push(`  <meta property="og:type" content="website">`);
  lines.push(`  <meta property="og:url" content="${canonicalUrl}">`);
  lines.push(`  <meta property="og:image" content="${ogImage}">`);
  lines.push(`  <meta property="og:image:width" content="1200">`);
  lines.push(`  <meta property="og:image:height" content="630">`);
  lines.push(`  <meta property="og:locale" content="vi_VN">`);
  lines.push(`  <meta property="og:site_name" content="${escapeHtml(meta.site_name)}">`);

  // Twitter
  lines.push('');
  lines.push('  <!-- Twitter Card -->');
  lines.push(`  <meta name="twitter:card" content="summary_large_image">`);
  lines.push(`  <meta name="twitter:title" content="${escapeHtml(config.title)}">`);
  lines.push(`  <meta name="twitter:description" content="${escapeHtml(config.description)}">`);
  lines.push(`  <meta name="twitter:image" content="${ogImage}">`);
  if (meta.twitter_handle) {
    lines.push(`  <meta name="twitter:site" content="${meta.twitter_handle}">`);
  }

  // JSON-LD Schemas
  if (config.schemas && config.schemas.length > 0) {
    lines.push('');
    lines.push('  <!-- JSON-LD Schemas -->');
    for (const schemaKey of config.schemas) {
      const schema = schemas[schemaKey];
      if (!schema) {
        console.warn(`  ⚠️  Schema "${schemaKey}" not found in schemas.json`);
        continue;
      }
      lines.push(`  <script type="application/ld+json">`);
      lines.push(`  ${JSON.stringify(schema, null, 2).split('\n').join('\n  ')}`);
      lines.push(`  </script>`);
    }
  }

  lines.push('  <!-- ═══════ /SEO META ═══════ -->');
  return lines.join('\n');
}

// ── Strip existing SEO tags (avoid duplicates) ────────────────────────
function stripExistingSEO(html) {
  // Strip previous injection block
  html = html.replace(
    /\s*<!-- ═+ SEO META \(injected by inject-seo\.js\) ═+ -->[\s\S]*?<!-- ═+ \/SEO META ═+ -->/g,
    ''
  );

  // Strip standalone duplicates
  html = html.replace(/\s*<title>[^<]*<\/title>/i, '');
  html = html.replace(/\s*<meta\s+name=["']description["'][^>]*>/gi, '');
  html = html.replace(/\s*<meta\s+name=["']keywords["'][^>]*>/gi, '');
  html = html.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '');
  html = html.replace(/\s*<meta\s+name=["']robots["'][^>]*>/gi, '');
  html = html.replace(/\s*<meta\s+name=["']author["'][^>]*>/gi, '');
  html = html.replace(/\s*<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '');
  html = html.replace(/\s*<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '');
  html = html.replace(/\s*<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  return html;
}

// ── Inject into HTML ──────────────────────────────────────────────────
function injectIntoHtml(html, seoBlock) {
  // Strip existing
  html = stripExistingSEO(html);

  // Insert just before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${seoBlock}\n</head>`);
  }
  // Fallback: insert after <head> opening tag
  if (html.match(/<head[^>]*>/i)) {
    return html.replace(/(<head[^>]*>)/i, `$1\n${seoBlock}`);
  }
  // No head — wrap
  console.warn('  ⚠️  No <head> tag found — wrapping in minimal HTML');
  return `<!DOCTYPE html><html lang="vi"><head>${seoBlock}\n</head>\n${html}`;
}

// ── Main ──────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  HUONGDI.SOL.VN — SEO Injector');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Target dir: ${targetDir}`);
console.log(`Dry run:    ${dryRun ? 'YES (no files written)' : 'NO (files will be modified)'}`);
console.log('');

if (!fs.existsSync(targetDir)) {
  console.error(`❌ Target directory not found: ${targetDir}`);
  process.exit(1);
}

const ts = timestamp();
let ok = 0, skip = 0, fail = 0;

for (const [filename, config] of Object.entries(pages)) {
  const filepath = path.join(targetDir, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`  ⏭️  ${filename} — file not found, skip`);
    skip++;
    continue;
  }

  try {
    const original = fs.readFileSync(filepath, 'utf8');
    const seoBlock = buildSEOBlock(filename, config);
    const newHtml = injectIntoHtml(original, seoBlock);

    if (original === newHtml) {
      console.log(`  ⏭️  ${filename} — no changes needed`);
      skip++;
      continue;
    }

    if (!dryRun) {
      // Backup
      const bakPath = `${filepath}.bak.${ts}`;
      fs.writeFileSync(bakPath, original, 'utf8');
      // Write new
      fs.writeFileSync(filepath, newHtml, 'utf8');
    }

    console.log(`  ✅ ${filename} — injected (${config.schemas?.length || 0} schemas)${dryRun ? ' [DRY-RUN]' : ''}`);
    ok++;
  } catch (err) {
    console.error(`  ❌ ${filename} — ERROR: ${err.message}`);
    fail++;
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`  Result: ${ok} updated · ${skip} skipped · ${fail} failed`);
console.log('═══════════════════════════════════════════════════════════════════');

if (!dryRun && ok > 0) {
  console.log('');
  console.log(`💾 Backup files: *.bak.${ts}`);
  console.log('');
  console.log('Verify with:');
  console.log(`  curl -s https://huongdi.sol.vn/p1.html | grep -A1 'og:title'`);
  console.log(`  curl -s https://huongdi.sol.vn/p3.html | grep 'application/ld+json' | head -1`);
}

process.exit(fail > 0 ? 1 : 0);
