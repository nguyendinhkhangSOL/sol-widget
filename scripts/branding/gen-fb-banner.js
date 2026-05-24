#!/usr/bin/env node
/**
 * Sol — Generate 2 Facebook Cover banners từ ảnh Khang Yulong Mountain
 *
 * Output:
 *   - khang-fb-cover-clean.jpg     (Option A: clean photo only)
 *   - khang-fb-cover-branded.jpg   (Option B: photo + text overlay sol.vn)
 *
 * Facebook cover specs:
 *   - Dimensions: 820 × 312 px (desktop)
 *   - Mobile crops to center 640 × 360 → safe zone 640px center
 *
 * Usage:
 *   node scripts/branding/gen-fb-banner.js
 *
 * Source file: assets/branding/khang-yulong-portrait.jpg
 * Output dir:  assets/branding/output/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE = path.join(ROOT, 'assets', 'branding', 'khang-yulong-portrait.jpg');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'branding', 'output');

// Auto-install sharp nếu chưa có
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('▶ Installing sharp (lần đầu, ~30s)...');
  execSync('npm install sharp --no-save', { cwd: ROOT, stdio: 'inherit' });
  sharp = require('sharp');
}

const COVER_WIDTH = 820;
const COVER_HEIGHT = 312;
const COVER_RATIO = COVER_WIDTH / COVER_HEIGHT; // ~2.628

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`✗ Không tìm thấy file: ${SOURCE}`);
    console.error('  Anh save ảnh Yulong vào path trên trước rồi chạy lại.');
    process.exit(1);
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Đọc kích thước ảnh gốc
  const meta = await sharp(SOURCE).metadata();
  console.log(`▶ Source: ${meta.width} × ${meta.height} px`);

  // ─── Tính crop region ──────────────────────────────────────────────
  // Target: 820:312 ratio. Crop ngang full width, height = width / 2.628
  // Sky + núi ở trên, Khang ở giữa-dưới. Cần crop bỏ phần dưới (hàng rào, giày)
  // và phần trên cùng (sky thừa).
  //
  // Strategy: crop horizontal full width, height = width / 2.628
  // Position vertical: skip 12% từ top (giữ ít sky), end at 50% (cut chân Khang)
  //
  // Vì ảnh source 960×1280 (portrait), area sau crop ~960×365
  // → resize xuống 820×312

  const srcW = meta.width;
  const srcH = meta.height;

  // ─── Crop region: LANDSCAPE ONLY (không có Khang) ─────────────────
  // STRATEGY UPDATE 2026-05-24:
  // Banner KHÔNG cần có Khang vì:
  //   1. Avatar đã có mặt Khang → identity rõ
  //   2. Avatar Facebook đè lên banner góc dưới trái → nếu Khang trong banner sẽ clash
  //   3. Visual hierarchy: banner = STORY/CONTEXT, avatar = IDENTITY → 2 layer info
  //
  // Crop: phần trên ảnh (chỉ landscape, không có Khang)
  //   - cropTop = ~15% từ top → sky + đỉnh núi tuyết
  //   - cropH = srcW / ratio
  //   - Khang sẽ KHÔNG trong crop (Khang ở center-bottom ảnh portrait)
  //
  // Override: CROP_TOP_PCT=0.20 node gen-fb-banner.js (nếu muốn show ít sky hơn)
  const CROP_TOP_PCT = parseFloat(process.env.CROP_TOP_PCT || '0.15');

  const cropH = Math.round(srcW / COVER_RATIO);
  const cropTop = Math.round(srcH * CROP_TOP_PCT);

  // Safety check: ensure crop doesn't go beyond image bottom
  if (cropTop + cropH > srcH) {
    console.error(`✗ Crop region vượt khỏi ảnh. cropTop=${cropTop} + cropH=${cropH} > srcH=${srcH}`);
    console.error('  Anh thử giảm CROP_TOP_PCT (vd 0.30) hoặc dùng ảnh source dài hơn.');
    process.exit(1);
  }

  console.log(`▶ Crop: ${srcW} × ${cropH} px from top=${cropTop} (${(CROP_TOP_PCT * 100).toFixed(0)}% from top)`);
  console.log(`  Landscape only (núi + sky) — KHÔNG có Khang để tránh trùng với avatar`);

  // ═══════════════════════════════════════════════════════════════════
  // OPTION A — Clean banner
  // ═══════════════════════════════════════════════════════════════════
  const outA = path.join(OUTPUT_DIR, 'khang-fb-cover-clean.jpg');
  await sharp(SOURCE)
    .extract({ left: 0, top: cropTop, width: srcW, height: cropH })
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outA);
  console.log(`  ✓ ${path.basename(outA)}  ${(fs.statSync(outA).size / 1024).toFixed(1)} KB`);

  // ═══════════════════════════════════════════════════════════════════
  // OPTION B — Branded banner with text overlay
  // ═══════════════════════════════════════════════════════════════════
  // Text overlay SVG (góc dưới-trái, trong safe zone 640px center)
  // Font: Segoe UI fallback to system sans-serif

  // Text overlay vị trí: BOTTOM-LEFT corner (tránh đè thân Khang ở center)
  // Avatar Facebook đè góc dưới-trái → text phải bên PHẢI của avatar zone
  // Avatar zone: ~170px wide + 16px margin = ~186px từ left edge
  // → Text bắt đầu từ x=200, kết thúc x=620 (safe avoid avatar)
  // Khang's body khoảng x=350-470 → tránh
  // Text overlay phía DƯỚI-PHẢI: x=420 (center-right area)
  const SVG_OVERLAY = `
<svg xmlns="http://www.w3.org/2000/svg" width="820" height="312" viewBox="0 0 820 312">
  <!-- Gradient backdrop bottom-right corner để text dễ đọc -->
  <defs>
    <linearGradient id="overlay-grad" x1="0%" y1="100%" x2="100%" y2="40%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.7)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>

  <!-- Dark gradient panel bottom-right (520-820 horizontal, 200-312 vertical) -->
  <rect x="520" y="200" width="300" height="112" fill="url(#overlay-grad)"/>

  <!-- Brand block — RIGHT-aligned, BOTTOM-RIGHT corner (tránh Khang ở center) -->
  <g font-family="'Segoe UI', 'Inter', system-ui, sans-serif" text-anchor="end">
    <!-- Eyebrow nhỏ -->
    <text x="800" y="240" font-size="13" font-weight="600" letter-spacing="3"
          fill="#E8924A">
      ĐI CÙNG SOL · sol.vn
    </text>

    <!-- Main name -->
    <text x="800" y="275" font-size="32" font-weight="800" letter-spacing="-0.5"
          fill="#FFFFFF">
      KHANG SOL
    </text>

    <!-- Tagline -->
    <text x="800" y="300" font-size="13" font-weight="500" letter-spacing="0.3"
          fill="#F4DDC8">
      30 năm Vinataba · 5 năm Tự do
    </text>
  </g>
</svg>
  `.trim();

  const outB = path.join(OUTPUT_DIR, 'khang-fb-cover-branded.jpg');
  await sharp(SOURCE)
    .extract({ left: 0, top: cropTop, width: srcW, height: cropH })
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: 'cover', position: 'center' })
    .composite([{ input: Buffer.from(SVG_OVERLAY), top: 0, left: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outB);
  console.log(`  ✓ ${path.basename(outB)}  ${(fs.statSync(outB).size / 1024).toFixed(1)} KB`);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ DONE — 2 banners ready trong:');
  console.log(`     ${OUTPUT_DIR}`);
  console.log('');
  console.log('  Bước tiếp:');
  console.log('  1. Mở folder output xem 2 banner');
  console.log('  2. Pick option A (clean) hoặc B (branded)');
  console.log('  3. Upload Facebook Cover Photo');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
