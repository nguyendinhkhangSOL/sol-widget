#!/usr/bin/env node
/**
 * Sol v4 - Bump dateModified trong JSON-LD cua bai wiki
 *
 * AI search engines (Claude, ChatGPT, Perplexity, Google AI Overview)
 * prefer FRESH content. Script nay update dateModified de signal cho AI
 * rang content moi update.
 *
 * Usage:
 *   node bump-date-modified.js --dry-run            # preview
 *   node bump-date-modified.js --all                # bump tat ca
 *   node bump-date-modified.js --older-than=30      # chi bump file > 30 ngay
 *   node bump-date-modified.js --only=cai-thuoc-la-vinh-vien,phuong-phap-cai-thuoc-la-pho-bien
 *
 * Sau khi bump, can chay publish-method-cluster.js hoac publish-chip-batch.js
 * de update WordPress voi date moi.
 */

const fs = require('fs');
const path = require('path');

const WIKI_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function getDaysOld(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function bumpFile(filepath, dryRun) {
  const content = fs.readFileSync(filepath, 'utf-8');

  // Pattern: "dateModified": "YYYY-MM-DD" hoac "dateModified":"YYYY-MM-DD"
  const re = /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/g;
  let match;
  let oldDates = [];
  while ((match = re.exec(content)) !== null) {
    oldDates.push(match[1]);
  }

  if (oldDates.length === 0) return { changed: false, reason: 'no_dateModified' };

  const oldestDays = Math.min(...oldDates.map(getDaysOld));
  const newest = oldDates[0];

  if (newest === TODAY) return { changed: false, reason: 'already_today', oldestDays };

  const updated = content.replace(re, `"dateModified": "${TODAY}"`);

  if (!dryRun) {
    // Backup
    const bakPath = filepath + '.bakdate';
    if (!fs.existsSync(bakPath)) fs.writeFileSync(bakPath, content);
    fs.writeFileSync(filepath, updated);
  }

  return {
    changed: true,
    oldestDays,
    oldDates: [...new Set(oldDates)],
    newDate: TODAY,
    count: oldDates.length,
  };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const all = args.includes('--all');
  const olderThanArg = args.find((a) => a.startsWith('--older-than='));
  const olderThan = olderThanArg ? parseInt(olderThanArg.split('=')[1], 10) : 0;
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.split('=')[1].split(',') : null;

  if (!all && !olderThanArg && !onlyList) {
    console.log('Su dung:');
    console.log('  --dry-run            preview, khong sua');
    console.log('  --all                bump tat ca');
    console.log('  --older-than=30      chi bump file dateModified > 30 ngay');
    console.log('  --only=slug1,slug2   chi bump specific slugs');
    process.exit(0);
  }

  const files = fs.readdirSync(WIKI_DIR)
    .filter((f) => f.endsWith('.html') && !f.includes('.bak'))
    .filter((f) => {
      if (!onlyList) return true;
      return onlyList.some((slug) => f.includes(slug));
    });

  console.log(`Tim thay ${files.length} file HTML${dryRun ? ' (DRY RUN)' : ''}${olderThan ? ` (chi older than ${olderThan} ngay)` : ''}`);
  console.log('');

  let bumped = 0, skipped = 0, noDate = 0;

  for (const file of files) {
    const filepath = path.join(WIKI_DIR, file);
    const result = bumpFile(filepath, true); // peek first

    if (result.reason === 'no_dateModified') {
      noDate++;
      continue;
    }

    if (olderThan > 0 && result.oldestDays < olderThan) {
      console.log(`  skip  ${file.padEnd(60)} (${result.oldestDays}d, < ${olderThan})`);
      skipped++;
      continue;
    }

    if (result.reason === 'already_today') {
      skipped++;
      continue;
    }

    if (result.changed) {
      // Real bump
      if (!dryRun) bumpFile(filepath, false);
      console.log(`  ${dryRun ? 'WOULD' : 'OK   '} ${file.padEnd(60)} ${result.oldDates.join(',')} -> ${TODAY}`);
      bumped++;
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log(`Tong ket:`);
  console.log(`  ${dryRun ? 'Would bump' : 'Bumped  '}: ${bumped}`);
  console.log(`  Skipped         : ${skipped}`);
  console.log(`  Khong co date   : ${noDate}`);
  console.log(`  Today           : ${TODAY}`);
  console.log('='.repeat(70));

  if (!dryRun && bumped > 0) {
    console.log('');
    console.log('Buoc tiep: chay publish script de push date moi len WordPress');
    console.log('  node publish-method-cluster.js');
    console.log('  node publish-chip-batch.js');
  }
}

main();
