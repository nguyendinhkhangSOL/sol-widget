#!/usr/bin/env node
/**
 * Sol — Gen OG images cho SEO Pass 26-5 (3 bài)
 *
 * Fork từ gen-og-images.js (sprint 31-5). Khác:
 *   - 3 bài thay vì 7
 *   - Output: wiki-skeletons/seo-pass-26-5/og-images/
 *   - Title/eyebrow phù hợp SEO long-tail
 *
 * Usage:
 *   node gen-og-seo-pass-26-5.js              # gen tất cả 3
 *   node gen-og-seo-pass-26-5.js --only=01    # gen 1 bài
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'seo-pass-26-5', 'og-images');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice(7) : null;

// ─── Auto-install sharp nếu chưa có ──────────────────────────────
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('▶ Installing sharp (lần đầu, ~30s)...');
  execSync('npm install sharp --no-save', {
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: 'inherit',
  });
  sharp = require('sharp');
}

// ─── 3 bài SEO Pass 26-5 OG content ──────────────────────────────
// [num, slug, eyebrow, title (2 dòng \n), subtitle]
const OG = [
  ['01', 'lo-trinh-cai-thuoc-la-khoa-hoc-7-ngay',
    'HƯỚNG DẪN · CDC + NHS',
    'Lộ Trình Cai Thuốc\n7 Ngày Khoa Học',
    'Từng ngày — triệu chứng, mẹo xử lý'],

  ['02', 'tai-sao-cai-thuoc-la-lai-bi-ho-co-dom',
    'PHỔI TỰ DETOX',
    'Vì Sao Cai Thuốc\nBị Ho Có Đờm?',
    'Cơ chế lông phổi · Bao lâu hết'],

  ['03', 'tac-hai-thuoc-la-thu-dong-doi-voi-tre-nho',
    'SURGEON GENERAL · 2006',
    'Hút Thụ Động\n— 7 Bệnh Trẻ Nhỏ',
    'SIDS · Hen · Viêm tai · Viêm phổi'],
];

// ─── SVG template (copy từ gen-og-images.js — same brand) ────────
function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSvg({ eyebrow, title, subtitle }) {
  const [line1, line2] = title.split('\n');
  const safeEyebrow = escapeXml(eyebrow);
  const safeLine1 = escapeXml(line1 || '');
  const safeLine2 = escapeXml(line2 || '');
  const safeSubtitle = escapeXml(subtitle);

  const fontFamily = '"Segoe UI", "Inter", "Roboto", system-ui, -apple-system, sans-serif';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FBF7F0"/>
      <stop offset="100%" stop-color="#F5E6DE"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Sol sun (concentric, top-right) -->
  <circle cx="1010" cy="160" r="220" fill="#E8924A" opacity="0.08"/>
  <circle cx="1010" cy="160" r="170" fill="#E8924A" opacity="0.12"/>
  <circle cx="1010" cy="160" r="125" fill="#E8924A" opacity="0.18"/>
  <circle cx="1010" cy="160" r="88"  fill="#D67233" opacity="0.35"/>
  <circle cx="1010" cy="160" r="62"  fill="#B25C2C" opacity="0.95"/>
  <circle cx="1010" cy="160" r="46"  fill="#E8924A" opacity="0.85"/>
  <circle cx="1010" cy="160" r="28"  fill="#FBF7F0" opacity="0.6"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="14" height="630" fill="#B25C2C"/>

  <!-- Content -->
  <g font-family='${fontFamily}'>
    <text x="78" y="125" font-size="22" font-weight="700" fill="#C62828" letter-spacing="3">
      ${safeEyebrow}
    </text>

    <text x="78" y="245" font-size="76" font-weight="800" fill="#2A2620" letter-spacing="-1.5">
      ${safeLine1}
    </text>

    <text x="78" y="335" font-size="76" font-weight="800" fill="#B25C2C" letter-spacing="-1.5">
      ${safeLine2}
    </text>

    <text x="78" y="425" font-size="34" font-weight="500" fill="#5A5650">
      ${safeSubtitle}
    </text>

    <line x1="78" y1="510" x2="240" y2="510" stroke="#B25C2C" stroke-width="3"/>

    <text x="78" y="558" font-size="28" font-weight="700" fill="#2A2620">
      Đi Cùng Sol
    </text>
    <text x="78" y="592" font-size="20" font-weight="500" fill="#8A857C" letter-spacing="0.5">
      sol.vn · cai thuốc lá cho đàn ông Việt 45+
    </text>
  </g>
</svg>`;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`▶ Created: ${OUT_DIR}`);
  }

  const items = ONLY ? OG.filter((r) => r[0] === ONLY) : OG;
  if (items.length === 0) {
    console.log(`✗ Không tìm thấy bài ${ONLY}`);
    process.exit(1);
  }

  console.log(`\n▶ Generating ${items.length} OG image(s) cho SEO Pass 26-5`);
  console.log(`  Output: ${OUT_DIR}\n`);

  let ok = 0, fail = 0;
  for (const [num, slug, eyebrow, title, subtitle] of items) {
    const outPath = path.join(OUT_DIR, `${slug}.png`);
    try {
      const svg = buildSvg({ eyebrow, title, subtitle });
      await sharp(Buffer.from(svg))
        .resize(1200, 630)
        .png({ compressionLevel: 9, quality: 90 })
        .toFile(outPath);

      const size = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`  ✓ [${num}] ${slug}.png  (${size} KB)`);
      ok++;
    } catch (e) {
      console.log(`  ✗ [${num}] ${slug}  — ${e.message}`);
      fail++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`  Generated: ${ok}`);
  if (fail > 0) console.log(`  Failed:    ${fail}`);

  if (ok > 0) {
    console.log(`\n▶ Next:`);
    console.log(`   1. Mở 1 file PNG xem có đẹp không:`);
    console.log(`      ${path.join(OUT_DIR, OG[0][1] + '.png')}`);
    console.log(`   2. Nếu OK → upload làm featured_media:`);
    console.log(`      (em sẽ viết script upload + set featured riêng nếu cần)`);
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
