#!/usr/bin/env node
/**
 * SOL.VN SEO AUDIT
 * ─────────────────
 * Crawl sitemap → fetch every URL → check 9 SEO signals → output CSV + Markdown.
 *
 * Usage:
 *   node audit.js                          # full sol.vn audit
 *   node audit.js https://sol.vn/foo       # single URL test
 *
 * Checks per URL:
 *   1. <title> 30-60 chars
 *   2. <meta name="description"> 120-160 chars
 *   3. <h1> exists, single, non-empty
 *   4. JSON-LD with @type="Article" or "BlogPosting"
 *   5. <link rel="canonical">
 *   6. OG tags (og:title, og:description, og:image)
 *   7. Internal links → /bo-thuoc-la AND bothuocla.sol.vn
 *   8. Word count (rough text content)
 *   9. <img> without alt
 *
 * Output:
 *   ./report.csv     — full data per URL
 *   ./report.md      — top issues summary
 *   ./console        — live progress
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ─────────────────────────────────────────────────────────
const ROOT = 'https://sol.vn';
const SITEMAP_URLS = [
  `${ROOT}/sitemap_index.xml`,
  `${ROOT}/sitemap.xml`,
  `${ROOT}/wp-sitemap.xml`,
];
const TIMEOUT_MS = 15000;
const CONCURRENCY = 4;
const HUB_TARGETS = ['/bo-thuoc-la', 'bothuocla.sol.vn'];

// ─── HTTP helper ────────────────────────────────────────────────────
function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        timeout: TIMEOUT_MS,
        headers: { 'User-Agent': 'SolSeoAudit/1.0 (+https://sol.vn)' },
      },
      (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode)) {
          return resolve(fetch(new URL(res.headers.location, url).toString()));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} on ${url}`));
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`timeout ${url}`));
    });
    req.on('error', reject);
  });
}

// ─── Sitemap parser (handles index + nested) ────────────────────────
async function discoverUrls() {
  const seen = new Set();
  const queue = [];

  for (const sm of SITEMAP_URLS) {
    try {
      await fetch(sm);
      queue.push(sm);
      break;
    } catch {
      /* try next */
    }
  }
  if (!queue.length) {
    throw new Error('Không tìm được sitemap. Thử URL: ' + SITEMAP_URLS.join(', '));
  }

  while (queue.length) {
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    try {
      const xml = await fetch(sm);
      // sitemap index?
      const sitemaps = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/g)].map(
        (m) => m[1].trim()
      );
      sitemaps.forEach((u) => queue.push(u));
      // urlset?
      const urls = [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g)].map((m) =>
        m[1].trim()
      );
      urls.forEach((u) => seen.add(u));
    } catch (err) {
      console.warn(`  ⚠ skip ${sm}: ${err.message}`);
    }
  }

  return [...seen].filter((u) => u.startsWith('http') && !u.endsWith('.xml'));
}

// ─── HTML field extractors (regex-only, no DOM lib needed) ─────────
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, ' ') : '';
}
function extractMetaDesc(html) {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  return m ? m[1].trim() : '';
}
function extractH1(html) {
  const all = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );
  return all;
}
function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}
function extractOg(html, prop) {
  const re = new RegExp(
    `<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const m = html.match(re);
  return m ? m[1].trim() : '';
}
function extractJsonLd(html) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ].map((m) => m[1].trim());
  const types = new Set();
  for (const b of blocks) {
    try {
      const j = JSON.parse(b);
      const collect = (n) => {
        if (!n) return;
        if (Array.isArray(n)) return n.forEach(collect);
        if (n['@type']) {
          (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).forEach((t) =>
            types.add(t)
          );
        }
        if (n['@graph']) collect(n['@graph']);
      };
      collect(j);
    } catch {
      /* malformed JSON-LD */
    }
  }
  return [...types];
}
function extractInternalLinks(html) {
  const hrefs = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].map((m) =>
    m[1].trim()
  );
  const hits = new Set();
  for (const h of hrefs) {
    for (const target of HUB_TARGETS) {
      if (h.includes(target)) hits.add(target);
    }
  }
  return [...hits];
}
function countWords(html) {
  // strip script/style/tags → rough word count
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  return clean.trim().split(' ').filter((w) => w.length > 1).length;
}
function imagesMissingAlt(html) {
  const imgs = [...html.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
  return imgs.filter((tag) => !/\salt=["'][^"']*["']/i.test(tag) || /\salt=["']\s*["']/i.test(tag))
    .length;
}

// ─── Audit one URL ──────────────────────────────────────────────────
async function audit(url) {
  const html = await fetch(url);
  const title = extractTitle(html);
  const desc = extractMetaDesc(html);
  const h1s = extractH1(html);
  const canon = extractCanonical(html);
  const jsonld = extractJsonLd(html);
  const ogTitle = extractOg(html, 'title');
  const ogDesc = extractOg(html, 'description');
  const ogImage = extractOg(html, 'image');
  const hubLinks = extractInternalLinks(html);
  const words = countWords(html);
  const imgsNoAlt = imagesMissingAlt(html);

  const issues = [];
  if (!title) issues.push('NO_TITLE');
  else if (title.length < 30) issues.push('TITLE_SHORT');
  else if (title.length > 60) issues.push('TITLE_LONG');

  if (!desc) issues.push('NO_DESC');
  else if (desc.length < 120) issues.push('DESC_SHORT');
  else if (desc.length > 160) issues.push('DESC_LONG');

  if (h1s.length === 0) issues.push('NO_H1');
  else if (h1s.length > 1) issues.push('MULTIPLE_H1');

  if (!canon) issues.push('NO_CANONICAL');

  const hasArticle = jsonld.some((t) =>
    ['Article', 'BlogPosting', 'NewsArticle', 'WebPage'].includes(t)
  );
  if (!hasArticle) issues.push('NO_ARTICLE_SCHEMA');

  if (!ogTitle) issues.push('NO_OG_TITLE');
  if (!ogDesc) issues.push('NO_OG_DESC');
  if (!ogImage) issues.push('NO_OG_IMAGE');

  if (!hubLinks.length) issues.push('NO_HUB_LINK');
  if (words < 300) issues.push('THIN_CONTENT');
  if (imgsNoAlt > 0) issues.push(`IMG_NO_ALT(${imgsNoAlt})`);

  return {
    url,
    title,
    titleLen: title.length,
    desc,
    descLen: desc.length,
    h1Count: h1s.length,
    canonical: canon,
    schemas: jsonld.join('|'),
    ogTitle: !!ogTitle,
    ogDesc: !!ogDesc,
    ogImage: !!ogImage,
    hubLinks: hubLinks.join('|'),
    words,
    imgsNoAlt,
    issues: issues.join(';'),
    issueCount: issues.length,
  };
}

// ─── Concurrency limiter ────────────────────────────────────────────
async function runPool(items, fn, n) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx]);
        process.stdout.write(`\r  [${idx + 1}/${items.length}] ${items[idx].slice(-50)}`);
      } catch (err) {
        results[idx] = { url: items[idx], error: err.message, issueCount: 99, issues: 'FETCH_FAIL' };
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write('\n');
  return results;
}

// ─── CSV / Markdown writers ─────────────────────────────────────────
function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function toMarkdown(rows) {
  const total = rows.length;
  const failed = rows.filter((r) => r.error).length;
  const ok = rows.filter((r) => !r.error && r.issueCount === 0).length;
  const issues = {};
  rows.forEach((r) => {
    (r.issues || '').split(';').filter(Boolean).forEach((i) => {
      // strip parenthetical counts so IMG_NO_ALT(3) and IMG_NO_ALT(5) group together
      const key = i.replace(/\(\d+\)$/, '');
      issues[key] = (issues[key] || 0) + 1;
    });
  });

  const sortedIssues = Object.entries(issues).sort((a, b) => b[1] - a[1]);

  let md = `# Sol.vn SEO Audit Report\n\n`;
  md += `Date: ${new Date().toISOString().slice(0, 10)}\n\n`;
  md += `## Tổng quan\n\n`;
  md += `| Metric | Count |\n|---|---|\n`;
  md += `| Tổng URL audit | ${total} |\n`;
  md += `| Hoàn hảo (0 issue) | ${ok} |\n`;
  md += `| Có vấn đề | ${total - ok - failed} |\n`;
  md += `| Fetch fail | ${failed} |\n\n`;

  md += `## Issue distribution\n\n`;
  md += `| Issue | Số trang |\n|---|---|\n`;
  sortedIssues.forEach(([k, v]) => (md += `| ${k} | ${v} |\n`));
  md += `\n`;

  // Top 10 worst offenders
  const worst = rows
    .filter((r) => !r.error)
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 10);
  md += `## Top 10 trang cần fix gấp\n\n`;
  md += `| URL | Issues | Detail |\n|---|---|---|\n`;
  worst.forEach((r) => {
    md += `| ${r.url} | ${r.issueCount} | ${r.issues} |\n`;
  });
  md += `\n`;

  // Action items
  md += `## Action items đề xuất\n\n`;
  if (issues['NO_ARTICLE_SCHEMA']) {
    md += `- **${issues['NO_ARTICLE_SCHEMA']} trang thiếu Article schema** → cài Yoast SEO (free) hoặc RankMath, bật "Article" auto-inject.\n`;
  }
  if (issues['NO_DESC'] || issues['DESC_SHORT'] || issues['DESC_LONG']) {
    const c = (issues['NO_DESC'] || 0) + (issues['DESC_SHORT'] || 0) + (issues['DESC_LONG'] || 0);
    md += `- **${c} trang meta description không chuẩn** → viết lại 120-160 ký tự, có keyword + CTA.\n`;
  }
  if (issues['NO_HUB_LINK']) {
    md += `- **${issues['NO_HUB_LINK']} trang chưa link tới hub** \`/bo-thuoc-la\` hoặc \`bothuocla.sol.vn\` → bổ sung link nội bộ để pass link juice.\n`;
  }
  if (issues['NO_OG_IMAGE']) {
    md += `- **${issues['NO_OG_IMAGE']} trang thiếu OG image** → set Featured Image trong WordPress để Yoast tự sinh og:image.\n`;
  }
  if (issues['THIN_CONTENT']) {
    md += `- **${issues['THIN_CONTENT']} trang thin content** (<300 từ) → mở rộng nội dung hoặc gộp/redirect.\n`;
  }
  if (issues['MULTIPLE_H1']) {
    md += `- **${issues['MULTIPLE_H1']} trang có nhiều H1** → chỉ giữ 1 H1, các heading khác xuống H2/H3.\n`;
  }

  return md;
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  const arg = process.argv[2];
  let urls;

  if (arg && arg.startsWith('http')) {
    console.log(`▶ Single-URL mode: ${arg}\n`);
    urls = [arg];
  } else {
    console.log(`▶ Discovering URLs from sitemap…`);
    urls = await discoverUrls();
    console.log(`  Found ${urls.length} URLs\n`);
  }

  console.log(`▶ Auditing (concurrency=${CONCURRENCY})…`);
  const rows = await runPool(urls, audit, CONCURRENCY);

  const outDir = __dirname;
  fs.writeFileSync(path.join(outDir, 'report.csv'), toCsv(rows), 'utf8');
  fs.writeFileSync(path.join(outDir, 'report.md'), toMarkdown(rows), 'utf8');

  console.log(`\n✓ Report saved:`);
  console.log(`  ${path.join(outDir, 'report.csv')}`);
  console.log(`  ${path.join(outDir, 'report.md')}`);

  // Console summary
  const total = rows.length;
  const ok = rows.filter((r) => !r.error && r.issueCount === 0).length;
  console.log(`\n  ${ok}/${total} trang hoàn hảo (0 issue)`);
  console.log(`  Xem report.md để biết action items.`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
