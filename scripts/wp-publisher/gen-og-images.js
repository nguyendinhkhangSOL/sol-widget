#!/usr/bin/env node
/**
 * Sol — Auto-generate 7 OG images cho Sprint 31-5
 *
 * 1200x630 PNG, branded Sol design:
 *   - Background: warm cream → peach gradient
 *   - Sol "sun" graphic (warm circle decoration)
 *   - Eyebrow tag (red, uppercase)
 *   - Title 2 lines (large bold)
 *   - Subtitle 1 line
 *   - Footer: "Đi Cùng Sol · sol.vn"
 *
 * Uses sharp + SVG → PNG (no Puppeteer/Chromium needed).
 *
 * Usage:
 *   node gen-og-images.js              # gen tất cả 7
 *   node gen-og-images.js --only=01    # gen 1 bài
 *
 * Output: wiki-skeletons/sprint-31-5/og-images/<slug>.png
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'sprint-31-5', 'og-images');
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

// ─── 7 bài Sprint 31-5 OG content ────────────────────────────────
// [num, slug, eyebrow, title (2 dòng \n), subtitle]
const OG = [
  ['01', 'world-no-tobacco-day-2026-viet-nam',
    'WHO · 31/5/2026',
    'World No Tobacco\nDay 2026',
    'Người Việt cần biết gì'],

  ['02', '7-dau-hieu-nghien-nicotine-nang',
    'TEST FTND · 90 GIÂY',
    '7 Dấu Hiệu Nghiện\nNicotine NẶNG',
    'Anh có thuộc nhóm nặng?'],

  ['03', 'cach-bo-thuoc-la-88-ngay-lo-trinh-sol',
    'PHƯƠNG PHÁP SOL',
    'Lộ Trình 88 Ngày\nBỏ Thuốc Lá',
    'Hybrid 5 — 4 Phase Step-by-Step'],

  ['04', 'co-the-hoi-phuc-sau-bo-thuoc-timeline',
    'TIMELINE PHỤC HỒI',
    'Bỏ Thuốc Bao Lâu\nPhổi Sạch?',
    '20 phút → 10 năm'],

  ['05', '5-ly-do-nguoi-viet-that-bai-cai-thuoc',
    'VÌ SAO?',
    '5 Lý Do Người Việt\nThất Bại Cai Thuốc',
    'Cách Sol giải quyết'],

  ['06', 'app-cai-thuoc-la-tieng-viet-2026-so-sanh',
    'SO SÁNH 2026',
    'App Cai Thuốc Lá\nTiếng Việt 2026',
    '5 app tốt nhất'],

  ['07', 'khang-sol-cau-chuyen-sach-thuoc-tu-2021',
    'CÂU CHUYỆN THẬT',
    'Khang Sol\n30 Năm → 5 Năm Tự Do',
    'Founder · Đi Cùng Sol'],
];

// ─── SVG template ────────────────────────────────────────────────
//
// Brand:
//   #FBF7F0  cream (BG)
//   #F5DDD9  peach (gradient bottom)
//   #B25C2C  warm orange (Sol primary)
//   #C62828  red (eyebrow)
//   #2A2620  dark warm (title)
//   #5A5650  mid warm (subtitle)
//   #8A857C  light warm (footer)
//
function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSvg({ eyebrow, title, subtitle }) {
  const [line1, line2] = title.split('\n');
  const safeEyebrow = escapeXml(eyebrow);
  const safeLine1 = escapeXml(line1 || '');
  const safeLine2 = escapeXml(line2 || '');
  const safeSubtitle = escapeXml(subtitle);

  // Font stack: Segoe UI (Windows), system-ui fallback. Bold weights.
  const fontFamily = '"Segoe UI", "Inter", "Roboto", system-ui, -apple-system, sans-serif';

  // FIX (Sol v2): bỏ radialGradient (librsvg render sai) — dùng concentric
  // circles với opacity giảm dần để tạo hiệu ứng glow.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FBF7F0"/>
      <stop offset="100%" stop-color="#F5E6DE"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Sol sun (decorative, top-right) - concentric layers thay radial gradient -->
  <circle cx="1010" cy="160" r="220" fill="#E8924A" opacity="0.08"/>
  <circle cx="1010" cy="160" r="170" fill="#E8924A" opacity="0.12"/>
  <circle cx="1010" cy="160" r="125" fill="#E8924A" opacity="0.18"/>
  <circle cx="1010" cy="160" r="88"  fill="#D67233" opacity="0.35"/>
  <circle cx="1010" cy="160" r="62"  fill="#B25C2C" opacity="0.95"/>
  <circle cx="1010" cy="160" r="46"  fill="#E8924A" opacity="0.85"/>
  <circle cx="1010" cy="160" r="28"  fill="#FBF7F0" opacity="0.6"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="14" height="630" fill="#B25C2C"/>

  <!-- Content area -->
  <g font-family='${fontFamily}'>

    <!-- Eyebrow (small red) -->
    <text x="78" y="125" font-size="22" font-weight="700" fill="#C62828" letter-spacing="3">
      ${safeEyebrow}
    </text>

    <!-- Title line 1 (large bold dark) -->
    <text x="78" y="245" font-size="76" font-weight="800" fill="#2A2620" letter-spacing="-1.5">
      ${safeLine1}
    </text>

    <!-- Title line 2 -->
    <text x="78" y="335" font-size="76" font-weight="800" fill="#B25C2C" letter-spacing="-1.5">
      ${safeLine2}
    </text>

    <!-- Subtitle (mid warm) -->
    <text x="78" y="425" font-size="34" font-weight="500" fill="#5A5650">
      ${safeSubtitle}
    </text>

    <!-- Divider line -->
    <line x1="78" y1="510" x2="240" y2="510" stroke="#B25C2C" stroke-width="3"/>

    <!-- Footer brand -->
    <text x="78" y="558" font-size="28" font-weight="700" fill="#2A2620">
      Đi Cùng Sol
    </text>
    <text x="78" y="592" font-size="20" font-weight="500" fill="#8A857C" letter-spacing="0.5">
      sol.vn · cai thuốc lá cho đàn ông Việt 45+
    </text>

  </g>
</svg>`;
}

// ─── Main ───────────────────────────────────────────────────────
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

  console.log(`\n▶ Generating ${items.length} OG image(s)`);
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
    console.log(`   2. Nếu OK → re-publish để upload OG + set featured_media:`);
    console.log(`      node scripts/wp-publisher/publish-sprint-31-5.js --action=publish`);
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
