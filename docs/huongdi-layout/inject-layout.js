#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  HUONGDI.SOL.VN — Layout Injector (Header + Footer)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Inject SOL header + footer thống nhất vào tất cả HTML files trong dir
 *
 *  Usage:
 *    node inject-layout.js [--dir=/var/www/huongdi/public] [--dry-run]
 *
 *  Markers:
 *    Header: <!-- SOL-HEADER-START --> ... <!-- SOL-HEADER-END -->
 *    Footer: <!-- SOL-FOOTER-START --> ... <!-- SOL-FOOTER-END -->
 *
 *  Idempotent: chạy lại nhiều lần sẽ thay đổi markers cũ, không duplicate.
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

const SCRIPT_DIR = __dirname;

// ── Load layout HTML ──────────────────────────────────────────────────
const headerHtml = fs.readFileSync(path.join(SCRIPT_DIR, 'header.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(SCRIPT_DIR, 'footer.html'), 'utf8');

const HEADER_BLOCK = `<!-- SOL-HEADER-START -->\n${headerHtml.trim()}\n<!-- SOL-HEADER-END -->`;
const FOOTER_BLOCK = `<!-- SOL-FOOTER-START -->\n${footerHtml.trim()}\n<!-- SOL-FOOTER-END -->`;

// ── Helpers ───────────────────────────────────────────────────────────
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

// ── Strip existing layout ─────────────────────────────────────────────
function stripExisting(html) {
  html = html.replace(/<!-- SOL-HEADER-START -->[\s\S]*?<!-- SOL-HEADER-END -->\s*/g, '');
  html = html.replace(/\s*<!-- SOL-FOOTER-START -->[\s\S]*?<!-- SOL-FOOTER-END -->/g, '');
  return html;
}

// ── Inject layout ─────────────────────────────────────────────────────
function injectLayout(html) {
  html = stripExisting(html);

  // Inject header after <body>
  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const insertAt = bodyMatch.index + bodyMatch[0].length;
    html = html.slice(0, insertAt) + '\n' + HEADER_BLOCK + '\n' + html.slice(insertAt);
  } else {
    console.warn('  ⚠️  No <body> tag — skipping header inject');
  }

  // Inject footer before </body>
  if (html.includes('</body>')) {
    html = html.replace('</body>', FOOTER_BLOCK + '\n</body>');
  } else {
    console.warn('  ⚠️  No </body> tag — appending footer');
    html = html + '\n' + FOOTER_BLOCK;
  }

  return html;
}

// ── List HTML files ───────────────────────────────────────────────────
function getHtmlFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .filter(f => !f.includes('.bak.'))
    .sort();
}

// ── Main ──────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  HUONGDI.SOL.VN — Layout Injector (Header + Footer)');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Target dir: ${targetDir}`);
console.log(`Dry run:    ${dryRun ? 'YES (no files written)' : 'NO (files will be modified)'}`);
console.log(`Header HTML: ${headerHtml.length} bytes`);
console.log(`Footer HTML: ${footerHtml.length} bytes`);
console.log('');

const ts = timestamp();
const files = getHtmlFiles(targetDir);
console.log(`Found ${files.length} HTML files:\n`);

let ok = 0, skip = 0, fail = 0;

for (const filename of files) {
  const filepath = path.join(targetDir, filename);

  try {
    const original = fs.readFileSync(filepath, 'utf8');
    const newHtml = injectLayout(original);

    if (original === newHtml) {
      console.log(`  ⏭️  ${filename} — no changes`);
      skip++;
      continue;
    }

    if (!dryRun) {
      const bakPath = `${filepath}.bak-layout.${ts}`;
      fs.writeFileSync(bakPath, original, 'utf8');
      fs.writeFileSync(filepath, newHtml, 'utf8');
    }

    const sizeDelta = newHtml.length - original.length;
    console.log(`  ✅ ${filename} — injected (+${sizeDelta} bytes)${dryRun ? ' [DRY-RUN]' : ''}`);
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
  console.log(`💾 Backup files: *.bak-layout.${ts}`);
  console.log('');
  console.log('Verify:');
  console.log('  curl -s https://huongdi.sol.vn/p1.html | grep -o "sol-header\\|sol-footer" | sort -u');
}

process.exit(fail > 0 ? 1 : 0);
