#!/usr/bin/env node
/**
 * Sol v4 — Audit 30 bài Q-Day series ("ngay-X-...")
 *
 * Quét tất cả post có slug bắt đầu bằng "ngay-" hoặc chứa pattern Day N
 * trong category wiki-bo-thuoc-la. Trả về:
 *   - Slug + title + URL + ngày (extracted from slug)
 *   - Content length, SEO meta
 *   - Khang voice presence ("Khang nói" / "Khang chia sẻ")
 *   - Internal links count
 *   - Schema/citation presence
 *
 * Usage:
 *   node audit-qday-series.js                    # pretty report
 *   node audit-qday-series.js --csv > qday.csv   # CSV export
 */

const { api } = require('./_lib');

const csvMode = process.argv.includes('--csv');

function stripHtml(s) { return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function stripEntities(s) { return (s || '').replace(/&nbsp;/g, ' ').replace(/&[^;]+;/g, ''); }

function extractDay(slug, title) {
  // Match patterns: ngay-3-, ngay-25-, tuan-2-, sau-30-ngay
  let m = slug.match(/^ngay-(\d+)/);
  if (m) return parseInt(m[1], 10);
  m = slug.match(/^tuan-(\d+)/);
  if (m) return parseInt(m[1], 10) * 7;
  m = slug.match(/sau-(\d+)-ngay/);
  if (m) return parseInt(m[1], 10);
  m = slug.match(/(\d+)-gio/);
  if (m) return parseInt(m[1], 10) / 24;
  // Try title
  m = (title || '').match(/Ngày\s+(\d+)/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

async function main() {
  if (!csvMode) console.log('▶ Audit 30-Day Q-Day series');

  // Fetch all posts in wiki-bo-thuoc-la
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=wiki-bo-thuoc-la&_fields=id`);
  if (!cats[0]) { console.error('Category not found'); process.exit(1); }
  const catId = cats[0].id;

  const posts = [];
  let page = 1;
  while (true) {
    let items;
    try {
      items = await api.get(
        `/wp-json/wp/v2/posts?categories=${catId}&status=publish,draft&context=edit&per_page=50&page=${page}&_fields=id,slug,title,link,excerpt,content,meta,featured_media,date`
      );
    } catch (e) {
      if (e.status === 400 && e.body?.code === 'rest_post_invalid_page_number') break;
      throw e;
    }
    if (!items.length) break;
    posts.push(...items);
    if (items.length < 50) break;
    page++;
  }

  // Filter: chỉ những bài thuộc series Q-Day
  const qdayPosts = posts.filter((p) => {
    const slug = p.slug.toLowerCase();
    const title = (p.title?.rendered || '').toLowerCase();
    return (
      /^ngay-\d+/.test(slug) ||
      /^tuan-\d+/.test(slug) ||
      /sau-\d+-ngay/.test(slug) ||
      /\d+h-dau/.test(slug) ||
      /\bngày\s+\d+/.test(title) ||
      /\btuần\s+\d+/.test(title)
    );
  });

  // Sort by extracted day
  qdayPosts.forEach((p) => {
    p._day = extractDay(p.slug, p.title?.rendered);
  });
  qdayPosts.sort((a, b) => (a._day ?? 999) - (b._day ?? 999));

  if (csvMode) {
    console.log('day,id,slug,title,link,contentLen,seoTitleLen,seoDescLen,focus,featured,khangVoice,internalLinks,citations');
    qdayPosts.forEach((p) => {
      const content = stripHtml(p.content?.rendered || '');
      const title = stripEntities(p.title?.rendered || '').replace(/"/g, '""');
      const meta = p.meta || {};
      const hasKhang = /khang\s+(nói|chia sẻ|từng|đã)/i.test(content);
      const internalLinks = (p.content?.rendered || '').match(/href=["']https?:\/\/sol\.vn/g)?.length || 0;
      const citations = (p.content?.rendered || '').match(/(\[\d+\]|<sup>|nghiên cứu|cochrane|surgeon general|bmj|jama|et al)/gi)?.length || 0;

      console.log([
        p._day ?? '',
        p.id,
        p.slug,
        `"${title}"`,
        p.link,
        content.length,
        (meta.rank_math_title || '').length,
        (meta.rank_math_description || '').length,
        `"${(meta.rank_math_focus_keyword || '').replace(/"/g, '""')}"`,
        p.featured_media || 0,
        hasKhang ? 'Y' : 'N',
        internalLinks,
        citations,
      ].join(','));
    });
    return;
  }

  console.log(`  ${qdayPosts.length} bài Q-Day series trên sol.vn\n`);

  // Pretty report
  console.log('Ngày    ID     Slug                                       Title                                Content  SEO  Khang  Links Citations');
  console.log('─'.repeat(150));

  for (const p of qdayPosts) {
    const content = stripHtml(p.content?.rendered || '');
    const title = stripEntities(p.title?.rendered || '').slice(0, 36);
    const meta = p.meta || {};
    const hasKhang = /khang\s+(nói|chia sẻ|từng|đã)/i.test(content);
    const seoOK = (meta.rank_math_title || '').length > 0 && (meta.rank_math_description || '').length > 0;
    const internalLinks = (p.content?.rendered || '').match(/href=["']https?:\/\/sol\.vn/g)?.length || 0;
    const citations = (p.content?.rendered || '').match(/(\[\d+\]|<sup>|nghiên cứu|cochrane|surgeon general|bmj|jama|et al)/gi)?.length || 0;

    const dayStr = p._day != null ? `Day ${String(p._day).padStart(2, ' ')}` : '?    ';
    const slug = p.slug.slice(0, 40).padEnd(40);
    const idStr = `#${String(p.id).padStart(4, ' ')}`;
    const contentLen = String(content.length).padStart(5);
    const seoFlag = seoOK ? '✓' : '✗';
    const khangFlag = hasKhang ? '✓' : '✗';
    const linksStr = String(internalLinks).padStart(3);
    const citationStr = String(citations).padStart(3);

    console.log(`${dayStr}  ${idStr}  ${slug} ${title.padEnd(38)} ${contentLen}c   ${seoFlag}    ${khangFlag}     ${linksStr}    ${citationStr}`);
  }

  // Find missing days (1-30)
  const existingDays = new Set(qdayPosts.map((p) => p._day).filter((d) => d != null && d <= 30));
  const missing = [];
  for (let i = 1; i <= 30; i++) {
    if (!existingDays.has(i)) missing.push(i);
  }

  console.log('');
  console.log('━'.repeat(80));
  console.log(`Tổng: ${qdayPosts.length} bài Q-Day`);
  console.log(`Có SEO meta đầy đủ: ${qdayPosts.filter((p) => (p.meta?.rank_math_title || '').length > 0).length}/${qdayPosts.length}`);
  console.log(`Có Khang voice: ${qdayPosts.filter((p) => /khang\s+(nói|chia sẻ|từng|đã)/i.test(stripHtml(p.content?.rendered || ''))).length}/${qdayPosts.length}`);
  console.log(`Có citation: ${qdayPosts.filter((p) => (p.content?.rendered || '').match(/<sup>/g)?.length > 0).length}/${qdayPosts.length}`);
  if (missing.length > 0) {
    console.log(`\n⚠️  Ngày THIẾU (chưa có bài): ${missing.join(', ')}`);
  } else {
    console.log(`\n✓ Đủ 30 ngày (Day 1 → Day 30)`);
  }
  console.log('━'.repeat(80));
}

main().catch((e) => { console.error('Error:', e.message); if (e.body) console.error(JSON.stringify(e.body).slice(0, 300)); process.exit(1); });
