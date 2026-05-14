#!/usr/bin/env node
/**
 * Sol v4 — Audit Q-Day series — quét TẤT CẢ posts (không filter category)
 *
 * Tìm mọi bài có slug "ngay-N-*" hoặc "tuan-N-*" trên toàn site.
 *
 * Usage:
 *   node audit-qday-all.js
 */

const { api } = require('./_lib');

function stripHtml(s) { return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function stripEntities(s) { return (s || '').replace(/&nbsp;/g, ' ').replace(/&[^;]+;/g, ''); }

function extractDay(slug, title) {
  let m = slug.match(/^ngay-(\d+)/i);
  if (m) return parseInt(m[1], 10);
  m = slug.match(/^tuan-(\d+)/i);
  if (m) return parseInt(m[1], 10) * 7;
  m = slug.match(/sau-(\d+)-ngay/i);
  if (m) return parseInt(m[1], 10);
  m = slug.match(/(\d+)-gio/i);
  if (m) return parseInt(m[1], 10) / 24;
  m = (title || '').match(/Ngày\s+(\d+)/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

async function main() {
  console.log('▶ Audit toàn bộ Q-Day series trên sol.vn (không filter category)');

  const all = [];
  let page = 1;
  while (true) {
    let items;
    try {
      items = await api.get(
        `/wp-json/wp/v2/posts?status=publish,draft,private&context=edit&per_page=100&page=${page}&_fields=id,slug,title,link,content,meta,featured_media,categories`
      );
    } catch (e) {
      if (e.status === 400 && e.body?.code === 'rest_post_invalid_page_number') break;
      throw e;
    }
    if (!items.length) break;
    all.push(...items);
    if (items.length < 100) break;
    page++;
    if (page > 20) break;
  }

  console.log(`  Tổng ${all.length} posts trên sol.vn\n`);

  // Filter Q-Day series
  const qday = all.filter((p) => {
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

  qday.forEach((p) => {
    p._day = extractDay(p.slug, p.title?.rendered);
  });
  qday.sort((a, b) => (a._day ?? 999) - (b._day ?? 999));

  console.log(`Tìm thấy ${qday.length} bài Q-Day series\n`);
  console.log('Day   ID     Slug                                              Title');
  console.log('─'.repeat(140));

  for (const p of qday) {
    const content = stripHtml(p.content?.rendered || '');
    const title = stripEntities(p.title?.rendered || '').slice(0, 50);
    const meta = p.meta || {};
    const hasKhang = /khang\s+(nói|chia sẻ|từng|đã)/i.test(content);
    const hasCitation = /<sup>|\[\d+\]/.test(p.content?.rendered || '');
    const seoOK = (meta.rank_math_title || '').length > 0;
    const internalLinks = (p.content?.rendered || '').match(/href=["']https?:\/\/sol\.vn/g)?.length || 0;

    const dayStr = p._day != null ? `D${String(p._day).padStart(2, ' ')}` : '?  ';
    const slug = p.slug.slice(0, 48).padEnd(48);
    const idStr = `#${String(p.id).padStart(4, ' ')}`;
    const flags = `${seoOK ? '✓' : '✗'}SEO ${hasKhang ? '✓' : '✗'}K ${hasCitation ? '✓' : '✗'}Cite L${internalLinks}`;

    console.log(`${dayStr}  ${idStr}  ${slug} ${title.padEnd(52)} ${content.length}c  ${flags}`);
  }

  // Find missing days 1-30
  const existingDays = new Set(qday.map((p) => p._day).filter((d) => d != null && d >= 1 && d <= 30));
  const missing = [];
  for (let i = 1; i <= 30; i++) {
    if (!existingDays.has(i)) missing.push(i);
  }

  console.log('');
  console.log('━'.repeat(80));
  console.log(`Tổng Q-Day posts: ${qday.length}`);
  console.log(`Có SEO meta: ${qday.filter((p) => (p.meta?.rank_math_title || '').length > 0).length}/${qday.length}`);
  console.log(`Có Khang voice: ${qday.filter((p) => /khang\s+(nói|chia sẻ|từng|đã)/i.test(stripHtml(p.content?.rendered || ''))).length}/${qday.length}`);
  console.log(`Có citation: ${qday.filter((p) => /<sup>|\[\d+\]/.test(p.content?.rendered || '')).length}/${qday.length}`);
  console.log(`Có featured image: ${qday.filter((p) => p.featured_media > 0).length}/${qday.length}`);
  if (missing.length > 0) {
    console.log(`\n⚠️  Ngày THIẾU (chưa có bài cho Day N): ${missing.join(', ')}`);
  } else {
    console.log(`\n✓ Đủ Day 1 → Day 30`);
  }
  console.log('━'.repeat(80));
}

main().catch((e) => { console.error('Error:', e.message); if (e.body) console.error(JSON.stringify(e.body).slice(0, 300)); process.exit(1); });
