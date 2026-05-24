#!/usr/bin/env node
/**
 * Sol — Generate Khang Sol photo portfolio từ ảnh Yulong source
 *
 * Output 3 versions:
 *   1. khang-yulong-hero.jpg     (full body, 1200×900) — Featured image
 *   2. khang-yulong-portrait.jpg (mặt + torso, 800×800) — Inline content
 *   3. khang-yulong-avatar.jpg   (face close-up, 400×400) — Footer/contact
 *
 * Source: assets/branding/khang-yulong-portrait.jpg (Khang Yulong source)
 *
 * Usage:
 *   node scripts/branding/gen-khang-portfolio.js
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

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`✗ Không tìm thấy file source: ${SOURCE}`);
    process.exit(1);
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const meta = await sharp(SOURCE).metadata();
  console.log(`▶ Source: ${meta.width} × ${meta.height} px`);

  const srcW = meta.width;
  const srcH = meta.height;

  // ═══════════════════════════════════════════════════════════════════
  // 1. HERO — Full body, landscape 4:3 (1200×900) cho featured image
  // ═══════════════════════════════════════════════════════════════════
  const heroPath = path.join(OUTPUT_DIR, 'khang-yulong-hero.jpg');
  // Keep entire image, resize to 1200 wide maintaining aspect
  await sharp(SOURCE)
    .resize(1200, null, { fit: 'inside', withoutEnlargement: false })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(heroPath);
  console.log(`  ✓ Hero: ${path.basename(heroPath)} (full body)`);

  // ═══════════════════════════════════════════════════════════════════
  // 2. PORTRAIT — Mặt + torso, 800×800 square cho inline
  // Khang ở y~55-95% source → crop từ y=45% → y=85% (mặt + torso)
  // ═══════════════════════════════════════════════════════════════════
  const portraitPath = path.join(OUTPUT_DIR, 'khang-yulong-portrait-square.jpg');
  const portraitTop = Math.round(srcH * 0.42);
  const portraitH = Math.round(srcH * 0.45); // 45% height
  // Center horizontal, full width if portrait, or center crop
  const portraitW = Math.min(srcW, portraitH); // square-ish
  const portraitLeft = Math.round((srcW - portraitW) / 2);

  await sharp(SOURCE)
    .extract({ left: portraitLeft, top: portraitTop, width: portraitW, height: portraitH })
    .resize(800, 800, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(portraitPath);
  console.log(`  ✓ Portrait: ${path.basename(portraitPath)} (mặt + torso, square)`);

  // ═══════════════════════════════════════════════════════════════════
  // 3. AVATAR — Face close-up, 400×400 cho footer/contact
  // Khang's face ở y~55-65% source, center horizontal
  // ═══════════════════════════════════════════════════════════════════
  const avatarPath = path.join(OUTPUT_DIR, 'khang-yulong-avatar-tight.jpg');
  const faceTop = Math.round(srcH * 0.50);
  const faceH = Math.round(srcH * 0.20); // 20% height = face area
  const faceLeft = Math.round(srcW * 0.30);
  const faceW = Math.round(srcW * 0.40); // 40% width center

  await sharp(SOURCE)
    .extract({ left: faceLeft, top: faceTop, width: faceW, height: faceH })
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(avatarPath);
  console.log(`  ✓ Avatar: ${path.basename(avatarPath)} (face close-up)`);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ 3 versions generated trong:');
  console.log(`     ${OUTPUT_DIR}`);
  console.log('');
  console.log('  Sử dụng:');
  console.log('  1. khang-yulong-hero.jpg          → Featured image trang /khang-sol/');
  console.log('  2. khang-yulong-portrait-square.jpg → Inline content (giữa bài)');
  console.log('  3. khang-yulong-avatar-tight.jpg  → Footer/contact section');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
