#!/usr/bin/env node
/**
 * Sol — Generate landscape-only banner từ ảnh Yulong source
 *
 * Output: ẢNH NÚI tuyết + sky (KHÔNG có Khang, KHÔNG text)
 *         820×312 PNG, ready upload Facebook Cover.
 *
 * Strategy: crop section TRÊN của ảnh portrait source
 *   - cropTop = 5% từ top (giữ chút sky margin)
 *   - cropH = srcW / 2.628 = 365px
 *   - Result: full sky + đỉnh núi tuyết, no Khang
 *
 * Source: assets/branding/khang-yulong-portrait.jpg
 * Output: assets/branding/output/khang-fb-cover-mountain-only.jpg
 *
 * Usage:
 *   node scripts/branding/gen-mountain-banner.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE = path.join(ROOT, 'assets', 'branding', 'khang-yulong-portrait.jpg');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'branding', 'output');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('▶ Installing sharp...');
  execSync('npm install sharp --no-save', { cwd: ROOT, stdio: 'inherit' });
  sharp = require('sharp');
}

const COVER_WIDTH = 820;
const COVER_HEIGHT = 312;
const COVER_RATIO = COVER_WIDTH / COVER_HEIGHT;

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`✗ Không tìm thấy file: ${SOURCE}`);
    process.exit(1);
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const meta = await sharp(SOURCE).metadata();
  console.log(`▶ Source: ${meta.width} × ${meta.height} px`);

  const srcW = meta.width;
  const srcH = meta.height;

  // Crop để có SKY (upper) + NÚI (lower) — KHÔNG có Khang
  // Source portrait: sky 0-30%, mountain 30-55%, Khang 55-90%, foreground 90-100%
  // Để có sky + mountain ridges (no Khang): cropTop ~22% from top
  // Override: CROP_TOP_PCT=0.18 node ... (more sky)
  //          CROP_TOP_PCT=0.30 node ... (more mountain, less sky)
  const CROP_TOP_PCT = parseFloat(process.env.CROP_TOP_PCT || '0.22');
  const cropH = Math.round(srcW / COVER_RATIO);
  const cropTop = Math.round(srcH * CROP_TOP_PCT);

  // Safety: ensure crop doesn't include Khang area (typically 55-90% of source)
  const KHANG_START = Math.round(srcH * 0.55);
  if (cropTop + cropH > KHANG_START) {
    console.warn(`⚠️  Crop may include Khang area. cropBottom=${cropTop + cropH} > KHANG_START=${KHANG_START}`);
    console.warn('   Reduce CROP_TOP_PCT if you want pure landscape.');
  }

  console.log(`▶ Crop landscape only: ${srcW} × ${cropH} px from top=${cropTop}`);

  const outPath = path.join(OUTPUT_DIR, 'khang-fb-cover-mountain-only.jpg');

  await sharp(SOURCE)
    .extract({ left: 0, top: cropTop, width: srcW, height: cropH })
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outPath);

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ DONE — Banner núi tuyết Yulong (no Khang, no text)`);
  console.log(`     ${outPath}`);
  console.log(`     ${sizeKB} KB · 820 × 312 px`);
  console.log('');
  console.log('  Next:');
  console.log(`  1. Mở folder: ${OUTPUT_DIR}`);
  console.log(`  2. Upload file khang-fb-cover-mountain-only.jpg`);
  console.log(`     vào Facebook → Profile → Cover Photo`);
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
