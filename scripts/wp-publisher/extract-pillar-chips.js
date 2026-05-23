#!/usr/bin/env node
/**
 * Extract chip-summary từ 7 PILLAR .bak2 files.
 * Output: pillar-chips.json
 */
const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles');

const PILLAR_MAP = [
  { slug: 'pillar-cai-thuoc-vinh-vien',  wpSlug: 'cai-thuoc-la-vinh-vien',                file: 'PILLAR-cai-thuoc-la-vinh-vien.html',                  icon: '🎯' },
  { slug: 'pillar-tac-hai-phoi',         wpSlug: 'tac-hai-thuoc-la-den-phoi',              file: 'PILLAR-tac-hai-thuoc-la-den-phoi.html',               icon: '🫁' },
  { slug: 'pillar-tang-can',             wpSlug: 'tang-can-khi-cai-thuoc',                 file: 'PILLAR-tang-can-khi-cai-thuoc.html',                  icon: '⚖️' },
  { slug: 'pillar-cach-bo-vinh-vien',    wpSlug: 'cach-bo-thuoc-khong-tai-nghien',         file: 'PILLAR-cach-bo-thuoc-khong-tai-nghien.html',          icon: '🛡️' },
  { slug: 'pillar-ho-ra-mau',            wpSlug: 'ho-ra-mau-khi-cai-thuoc',                file: 'PILLAR-ho-ra-mau-khi-cai-thuoc.html',                 icon: '🚨' },
  { slug: 'pillar-ung-thu-phoi',         wpSlug: 'ung-thu-phoi-va-thuoc-la',               file: 'PILLAR-ung-thu-phoi-va-thuoc-la.html',                icon: '⚠️' },
  { slug: 'pillar-vape',                 wpSlug: 'vape-co-hai-nhu-thuoc-la-khong',         file: 'PILLAR-vape-co-hai-nhu-thuoc-la-khong.html',          icon: '💨' },
];

function extractChip(html) {
  const m = html.match(/<div class="chip-summary">([\s\S]*?<a [^>]+>Đọc đầy đủ[^<]*<\/a>)\s*<\/div>/);
  if (!m) return null;
  const inner = m[1];
  const stripped = inner.replace(/<div class="chip-label">[\s\S]*?<\/div>\s*/, '');
  const titleMatch = stripped.match(/<strong>([^<]+)<\/strong>/);
  const label = titleMatch ? titleMatch[1].trim() : null;
  const linkMatch = stripped.match(/<a href="([^"]+)"/);
  const wikiUrl = linkMatch ? linkMatch[1] : null;
  let answer = stripped
    .replace(/<a [^>]+>[^<]+<\/a>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<strong>([^<]+)<\/strong>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/📖\s*$/m, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { label, answer, wikiUrl };
}

const results = [];
let missing = 0;
for (const p of PILLAR_MAP) {
  const bakPath = path.join(ARTICLES_DIR, p.file + '.bak2');
  if (!fs.existsSync(bakPath)) { console.log(`  ✗ ${p.slug} no .bak2`); missing++; continue; }
  const chip = extractChip(fs.readFileSync(bakPath, 'utf-8'));
  if (!chip || !chip.label) { console.log(`  ✗ ${p.slug} no chip`); missing++; continue; }
  results.push({
    slug: p.slug, wpSlug: p.wpSlug, icon: p.icon,
    label: chip.label, answer: chip.answer,
    wikiUrl: chip.wikiUrl || ('https://sol.vn/' + p.wpSlug + '/?utm_source=zalo&utm_campaign=' + p.slug),
    wikiLabel: 'Đọc bài đầy đủ trên sol.vn',
  });
  console.log(`  ✓ ${p.slug.padEnd(28)} ${chip.label.slice(0, 60)}`);
}

if (missing > 0) { console.error('\n✗ ' + missing + ' missing'); process.exit(1); }

const outPath = path.join(__dirname, 'pillar-chips.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
console.log('\n✓ Saved ' + results.length + ' chips → ' + outPath);
