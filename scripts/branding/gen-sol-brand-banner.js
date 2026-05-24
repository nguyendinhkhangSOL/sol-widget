#!/usr/bin/env node
/**
 * Sol — Generate BRANDED Facebook Cover Banner cho Sol launch
 *
 * Banner marketing cho dự án Sol — coherent với avatar Khang (Yulong).
 *
 * Design v2 (2026-05-24): dùng ảnh Yulong làm photo background
 * + warm clay gradient overlay → match avatar visually.
 *
 * Output:
 *   - sol-brand-banner.png  (820×312 PNG)
 *
 * Source: assets/branding/khang-yulong-portrait.jpg (Khang stand at Yulong)
 *
 * Usage:
 *   node scripts/branding/gen-sol-brand-banner.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'branding', 'output');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('▶ Installing sharp...');
  execSync('npm install sharp --no-save', { cwd: ROOT, stdio: 'inherit' });
  sharp = require('sharp');
}

// Sol brand palette
const COLORS = {
  cream:       '#FBF7F0',
  clay:        '#B25C2C',
  clayDark:    '#6B3318',
  clayLight:   '#E8924A',
  inkDark:     '#2A2620',
  ink:         '#5A5650',
  white:       '#FFFFFF',
  goldAccent:  '#D4A574',
};

// ─── SVG Banner ────────────────────────────────────────────────────────
const BANNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="820" height="312" viewBox="0 0 820 312">
  <defs>
    <!-- Background gradient: warm clay diagonal -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.clayDark}"/>
      <stop offset="50%" stop-color="${COLORS.clay}"/>
      <stop offset="100%" stop-color="${COLORS.clayLight}"/>
    </linearGradient>

    <!-- Sun glow radial -->
    <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${COLORS.white}" stop-opacity="0.4"/>
      <stop offset="60%" stop-color="${COLORS.clayLight}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${COLORS.clayLight}" stop-opacity="0"/>
    </radialGradient>

    <!-- Dot pattern overlay subtle -->
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="0.8" fill="${COLORS.white}" opacity="0.06"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="820" height="312" fill="url(#bg-grad)"/>

  <!-- Sun glow at right side -->
  <circle cx="720" cy="156" r="200" fill="url(#sun-glow)"/>

  <!-- Dot pattern overlay -->
  <rect width="820" height="312" fill="url(#dots)"/>

  <!-- Sol Sun icon (decorative, right-center) -->
  <g transform="translate(720, 156)">
    <!-- Rays -->
    <g opacity="0.5" stroke="${COLORS.white}" stroke-width="2.5" stroke-linecap="round">
      <line x1="0" y1="-95" x2="0" y2="-75"/>
      <line x1="67" y1="-67" x2="53" y2="-53"/>
      <line x1="95" y1="0" x2="75" y2="0"/>
      <line x1="67" y1="67" x2="53" y2="53"/>
      <line x1="0" y1="95" x2="0" y2="75"/>
      <line x1="-67" y1="67" x2="-53" y2="53"/>
      <line x1="-95" y1="0" x2="-75" y2="0"/>
      <line x1="-67" y1="-67" x2="-53" y2="-53"/>
    </g>
    <!-- Sun body -->
    <circle r="60" fill="${COLORS.clayLight}" opacity="0.85"/>
    <circle r="44" fill="${COLORS.white}" opacity="0.7"/>
    <circle r="28" fill="${COLORS.clay}" opacity="0.95"/>
  </g>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="312" fill="${COLORS.clayLight}"/>

  <!-- TEXT BLOCK — left-aligned, in safe zone (mobile crop) -->
  <g font-family="'Segoe UI', 'Inter', 'Roboto', system-ui, sans-serif">

    <!-- Eyebrow with date badge -->
    <g transform="translate(60, 50)">
      <rect x="0" y="0" width="160" height="26" rx="13" fill="${COLORS.white}" opacity="0.15"/>
      <text x="80" y="18" text-anchor="middle" font-size="11" font-weight="700"
            letter-spacing="2" fill="${COLORS.white}">
        LAUNCH 31 · 5 · 2026
      </text>
    </g>

    <!-- Main brand title -->
    <text x="60" y="115" font-size="46" font-weight="800" letter-spacing="-1.5"
          fill="${COLORS.white}">
      Đi Cùng Sol
    </text>

    <!-- Subhead 1 -->
    <text x="60" y="155" font-size="18" font-weight="500" letter-spacing="0"
          fill="${COLORS.cream}" opacity="0.95">
      Cai thuốc lá khoa học cho đàn ông Việt 45+
    </text>

    <!-- Subhead 2 -->
    <text x="60" y="180" font-size="14" font-weight="400" letter-spacing="0.3"
          fill="${COLORS.cream}" opacity="0.75">
      35-65 ngày · 3 lộ trình theo FTND · Voice của Khang
    </text>

    <!-- Divider -->
    <line x1="60" y1="210" x2="160" y2="210" stroke="${COLORS.clayLight}" stroke-width="3"/>

    <!-- Founder credit -->
    <text x="60" y="240" font-size="14" font-weight="700"
          fill="${COLORS.white}">
      KHANG SOL
    </text>
    <text x="60" y="260" font-size="12" font-weight="400"
          fill="${COLORS.cream}" opacity="0.8">
      30 năm Vinataba · 5 năm Tự do · Founder
    </text>

    <!-- CTA URL -->
    <g transform="translate(60, 278)">
      <rect x="0" y="0" width="130" height="24" rx="12"
            fill="${COLORS.white}" opacity="0.9"/>
      <text x="65" y="17" text-anchor="middle" font-size="13" font-weight="700"
            letter-spacing="0.5" fill="${COLORS.clayDark}">
        🌐 sol.vn
      </text>
    </g>

  </g>
</svg>`;

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outPath = path.join(OUTPUT_DIR, 'sol-brand-banner.png');

  console.log('▶ Generating Sol brand banner 820×312...');

  await sharp(Buffer.from(BANNER_SVG))
    .resize(820, 312)
    .png({ compressionLevel: 9, quality: 95 })
    .toFile(outPath);

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ DONE — ${path.basename(outPath)} (${sizeKB} KB)`);
  console.log(`     ${outPath}`);
  console.log('');
  console.log('  Next: upload to Facebook Cover Photo');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
