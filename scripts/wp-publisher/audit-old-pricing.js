#!/usr/bin/env node
/**
 * Sol v4 — Audit toàn bộ bài + landing để tìm pricing CŨ
 *
 * Sol pricing hiện tại: Free → 25k/tuần (1 mốc, linh hoạt).
 * Pricing CŨ cần dọn:
 *   - 99k, 99.000đ, 99000
 *   - 199k, 199.000đ, 199000
 *   - 298k, 298.000đ
 *   - "Gói Kiểm Soát", "Gói Làm Chủ" (v3 cũ — 2 gói)
 *   - "Sol Trả Thử", "Sol Một Lần" (v4 cohort cũ)
 *
 * Usage:
 *   node audit-old-pricing.js                    # audit all posts + pages
 *   node audit-old-pricing.js --posts-only       # chỉ posts
 *   node audit-old-pricing.js --csv > old-pricing.csv
 */

const { api } = require('./_lib');

const csvMode = process.argv.includes('--csv');
const postsOnly = process.argv.includes('--posts-only');

const OLD_PATTERNS = [
  { regex: /99\.?000\s*đ/gi, label: '99.000đ' },
  { regex: /199\.?000\s*đ/gi, label: '199.000đ' },
  { regex: /298\.?000\s*đ/gi, label: '298.000đ' },
  { regex: /\b99k\b/gi, label: '99k' },
  { regex: /\b199k\b/gi, label: '199k' },
  { regex: /\b298k\b/gi, label: '298k' },
  { regex: /Gói Kiểm Soát/gi, label: 'Gói Kiểm Soát' },
  { regex: /Gói Làm Chủ/gi, label: 'Gói Làm Chủ' },
  // v3 cũ:
  { regex: /Khởi Động\s*[—:-]?\s*99/gi, label: 'Khởi Động 99' },
  { regex: /Đồng Hành\s*[—:-]?\s*199/gi, label: 'Đồng Hành 199' },
];

async function fetchAll(endpoint) {
  const items = [];
  let page = 1;
  while (true) {
    let chunk;
    try {
      chunk = await api.get(`/wp-json/wp/v2/${endpoint}?status=publish,draft&context=edit&per_page=50&page=${page}&_fields=id,slug,title,link,content`);
    } catch (e) {
      if (e.status === 400 && e.body?.code?.includes('invalid_page_number')) break;
      throw e;
    }
    if (!chunk.length) break;
    items.push(...chunk);
    if (chunk.length < 50) break;
    page++;
    if (page > 10) break;
  }
  return items;
}

function findMatches(content) {
  const hits = {};
  for (const { regex, label } of OLD_PATTERNS) {
    const matches = content.match(regex);
    if (matches) hits[label] = matches.length;
  }
  return hits;
}

async function main() {
  if (!csvMode) console.log(`▶ Audit pricing cũ trong WordPress`);

  const posts = await fetchAll('posts');
  const pages = postsOnly ? [] : await fetchAll('pages');
  const all = [...posts.map((p) => ({ ...p, type: 'post' })), ...pages.map((p) => ({ ...p, type: 'page' }))];

  if (!csvMode) console.log(`  ${posts.length} posts + ${pages.length} pages = ${all.length} items\n`);

  const problems = [];
  for (const item of all) {
    const content = item.content?.rendered || '';
    const hits = findMatches(content);
    if (Object.keys(hits).length > 0) {
      problems.push({ item, hits });
    }
  }

  if (csvMode) {
    console.log('type,id,slug,link,patterns_found,total_hits');
    problems.forEach(({ item, hits }) => {
      const patterns = Object.entries(hits).map(([k, v]) => `${k}=${v}`).join(';');
      const total = Object.values(hits).reduce((a, b) => a + b, 0);
      console.log([item.type, item.id, item.slug, item.link, `"${patterns}"`, total].join(','));
    });
    return;
  }

  console.log(`Tìm thấy ${problems.length} bài chứa pricing CŨ:\n`);
  problems.forEach(({ item, hits }) => {
    const title = (item.title?.rendered || '').replace(/&[^;]+;/g, '').slice(0, 60);
    console.log(`${item.type === 'post' ? '📄' : '📃'} #${String(item.id).padEnd(5)} ${item.slug}`);
    console.log(`     ${title}`);
    Object.entries(hits).forEach(([k, v]) => {
      console.log(`     ⚠️  "${k}" × ${v}`);
    });
    console.log('');
  });

  // Aggregate by pattern
  const aggregate = {};
  problems.forEach(({ hits }) => {
    Object.entries(hits).forEach(([k, v]) => {
      aggregate[k] = (aggregate[k] || 0) + v;
    });
  });
  console.log('━'.repeat(70));
  console.log('Tổng pattern occurrences:');
  Object.entries(aggregate).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(28)} ${v}`);
  });
  console.log('━'.repeat(70));
  console.log(`\n${problems.length} bài cần update pricing.`);
  console.log(`Lệnh fix: node fix-old-pricing.js [--dry-run]`);
}

main().catch((e) => { console.error(e); process.exit(1); });
