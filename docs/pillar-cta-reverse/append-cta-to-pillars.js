#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SOL.VN — Append CTA "Bắt đầu DNA Test" cuối 7 Pillar Pages
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Mục đích: Add CTA cross-link sol.vn pillar → huongdi.sol.vn P1
 *  Idempotent: Skip nếu đã có CTA marker (sol-pillar-cta)
 *
 *  Usage:
 *    node append-cta-to-pillars.js
 *    node append-cta-to-pillars.js --dry-run        (test, không update)
 *    node append-cta-to-pillars.js --ids 3345,3348  (chỉ update IDs này)
 *    node append-cta-to-pillars.js --force          (re-append kể cả đã có)
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// Load deps từ pillar-to-wp/node_modules
const VENDOR = path.join(__dirname, '../pillar-to-wp/node_modules');
const dotenv = require(path.join(VENDOR, 'dotenv'));
const nodeFetch = require(path.join(VENDOR, 'node-fetch'));

dotenv.config({ path: path.join(__dirname, '../pillar-to-wp/.env.wp') });

const WP_URL = process.env.WP_URL || 'https://sol.vn';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('❌ Missing credentials in ../pillar-to-wp/.env.wp');
  process.exit(1);
}

// ── Parse args ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
let targetIds = null;
const idsArg = args.indexOf('--ids');
if (idsArg >= 0 && args[idsArg + 1]) {
  targetIds = args[idsArg + 1].split(',').map(s => s.trim());
}

// ── 7 Pillar IDs ───────────────────────────────────────────────────────
const PILLAR_IDS = [
  { id: '3345', name: 'Pillar #1 — Freelancer Chuyên Môn' },
  { id: '3348', name: 'Pillar #2 — Huấn luyện & Đào Tạo' },
  { id: '3349', name: 'Pillar #3 — Content Creator' },
  { id: '3350', name: 'Pillar #4 — Khởi Nghiệp Tinh Gọn' },
  { id: '3351', name: 'Pillar #5 — Đại Lý Phân Phối' },
  { id: '3352', name: 'Pillar #6 — Dịch Vụ Service' },
  { id: '3353', name: 'Pillar #7 — Đấu Thầu B2B' },
];

const PILLARS_TO_UPDATE = targetIds
  ? PILLAR_IDS.filter(p => targetIds.includes(p.id))
  : PILLAR_IDS;

// ── CTA block ──────────────────────────────────────────────────────────
const CTA_HTML = fs.readFileSync(path.join(__dirname, 'cta-block.html'), 'utf8');
const CTA_MARKER = 'class="sol-pillar-cta"';  // Để detect idempotency

// ── Helpers ────────────────────────────────────────────────────────────
const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD.replace(/\s/g, '')}`).toString('base64');

async function fetchPost(id) {
  const url = `${WP_URL}/wp-json/wp/v2/huong-di/${id}?context=edit&_fields=id,slug,status,content,title`;
  const res = await nodeFetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch ${id} failed: ${res.status} — ${text.substring(0, 200)}`);
  }
  return res.json();
}

async function updatePost(id, content) {
  const url = `${WP_URL}/wp-json/wp/v2/huong-di/${id}`;
  const res = await nodeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update ${id} failed: ${res.status} — ${text.substring(0, 200)}`);
  }
  return res.json();
}

// ── Main ───────────────────────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  SOL.VN — Append CTA cross-link cho 7 Pillar Pages');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Mode: ${dryRun ? 'DRY-RUN (preview only)' : 'LIVE UPDATE'}`);
  console.log(`Force: ${force ? 'YES (overwrite existing CTA)' : 'NO (skip if already exists)'}`);
  console.log(`Target: ${PILLARS_TO_UPDATE.length} pillars`);
  console.log('');

  const results = { updated: [], skipped: [], failed: [] };

  for (const pillar of PILLARS_TO_UPDATE) {
    console.log(`── Processing ${pillar.name} (ID ${pillar.id}) ──`);

    try {
      const post = await fetchPost(pillar.id);
      const currentContent = post.content?.raw ?? post.content?.rendered ?? '';

      // Check idempotency
      if (currentContent.includes(CTA_MARKER) && !force) {
        console.log(`  ⏭️  CTA đã có, skip (dùng --force để overwrite)`);
        results.skipped.push(pillar);
        console.log('');
        continue;
      }

      // Remove existing CTA nếu --force
      let newContent = currentContent;
      if (force && currentContent.includes(CTA_MARKER)) {
        const ctaRegex = /<!-- wp:html -->\s*<div class="sol-pillar-cta"[\s\S]*?<\/div>\s*<!-- \/wp:html -->/g;
        newContent = currentContent.replace(ctaRegex, '').trim();
        console.log(`  🔄 Removed existing CTA, will re-append`);
      }

      // Append CTA
      newContent = newContent.trimEnd() + '\n\n' + CTA_HTML.trim() + '\n';

      if (dryRun) {
        console.log(`  📝 DRY-RUN: would update ${(newContent.length / 1024).toFixed(1)} KB`);
        console.log(`     Status: ${post.status}, Slug: ${post.slug}`);
        results.updated.push(pillar);
      } else {
        await updatePost(pillar.id, newContent);
        console.log(`  ✅ Updated successfully`);
        console.log(`     URL: ${WP_URL}/huong-di/${post.slug}/`);
        results.updated.push(pillar);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      results.failed.push({ ...pillar, error: err.message });
    }

    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  TỔNG KẾT');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`✅ Updated: ${results.updated.length}`);
  results.updated.forEach(p => console.log(`   - ${p.name}`));
  if (results.skipped.length > 0) {
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    results.skipped.forEach(p => console.log(`   - ${p.name}`));
  }
  if (results.failed.length > 0) {
    console.log(`❌ Failed: ${results.failed.length}`);
    results.failed.forEach(p => console.log(`   - ${p.name}: ${p.error}`));
  }
  console.log('');

  if (!dryRun && results.updated.length > 0) {
    console.log('Next: Verify trên browser:');
    console.log('  https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/');
    console.log('  → Scroll xuống cuối → phải thấy CTA "Bắt đầu DNA Test"');
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
})();
