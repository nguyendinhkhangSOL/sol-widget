#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SOL.VN — Update CTA URLs trong 7 Pillar Pages
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  CTA cũ:  huongdi.sol.vn/p1.html?utm_...
 *  CTA mới: huongdi.sol.vn/kham-pha-ban-than/?utm_...
 *
 *  Idempotent: Skip nếu CTA đã point về URL mới
 *
 *  Usage:
 *    node 03-update-pillar-cta-urls.js
 *    node 03-update-pillar-cta-urls.js --dry-run
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const VENDOR = path.join(__dirname, '../pillar-to-wp/node_modules');
const dotenv = require(path.join(VENDOR, 'dotenv'));
const nodeFetch = require(path.join(VENDOR, 'node-fetch'));

dotenv.config({ path: path.join(__dirname, '../pillar-to-wp/.env.wp') });

const WP_URL = process.env.WP_URL || 'https://sol.vn';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const PILLAR_IDS = ['3345', '3348', '3349', '3350', '3351', '3352', '3353'];

const URL_REPLACEMENTS = [
  // Old → New (cụ thể cho CTA, không touch link khác)
  { from: 'huongdi.sol.vn/p1.html', to: 'huongdi.sol.vn/kham-pha-ban-than/' },
  { from: 'huongdi.sol.vn/p2.html', to: 'huongdi.sol.vn/kiem-ke-nguon-luc/' },
  { from: 'huongdi.sol.vn/p3.html', to: 'huongdi.sol.vn/la-ban-huong-di/' },
  // Variations
  { from: 'huongdi.sol.vn/p1?', to: 'huongdi.sol.vn/kham-pha-ban-than/?' },
  { from: 'huongdi.sol.vn/p2?', to: 'huongdi.sol.vn/kiem-ke-nguon-luc/?' },
  { from: 'huongdi.sol.vn/p3?', to: 'huongdi.sol.vn/la-ban-huong-di/?' },
];

const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD.replace(/\s/g, '')}`).toString('base64');

async function fetchPost(id) {
  const res = await nodeFetch(`${WP_URL}/wp-json/wp/v2/huong-di/${id}?context=edit&_fields=id,slug,content`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Fetch ${id} failed: ${res.status}`);
  return res.json();
}

async function updatePost(id, content) {
  const res = await nodeFetch(`${WP_URL}/wp-json/wp/v2/huong-di/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Update ${id} failed: ${res.status}`);
  return res.json();
}

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  Update CTA URLs trong 7 Pillar Pages');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`);
  console.log('');

  const results = { updated: 0, skipped: 0, failed: 0 };

  for (const id of PILLAR_IDS) {
    console.log(`── Pillar ID ${id} ──`);

    try {
      const post = await fetchPost(id);
      const original = post.content?.raw ?? '';

      let updated = original;
      let changeCount = 0;

      for (const { from, to } of URL_REPLACEMENTS) {
        const matches = (updated.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (matches > 0) {
          updated = updated.split(from).join(to);
          changeCount += matches;
        }
      }

      if (changeCount === 0) {
        console.log(`  ⏭️  No old URLs found, skip`);
        results.skipped++;
      } else if (dryRun) {
        console.log(`  📝 DRY-RUN: would replace ${changeCount} occurrences`);
        results.updated++;
      } else {
        await updatePost(id, updated);
        console.log(`  ✅ Updated ${changeCount} URL replacements`);
        results.updated++;
      }
    } catch (err) {
      console.error(`  ❌ ${err.message}`);
      results.failed++;
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log('');

  process.exit(results.failed > 0 ? 1 : 0);
})();
