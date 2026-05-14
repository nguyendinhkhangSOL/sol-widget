#!/usr/bin/env node
/**
 * Sol v4 — Dump full slug của 30 bài Q-Day series (không truncate)
 *
 * Output: 1 dòng/bài — "Day N | postId | full slug | full title"
 *
 * Usage:
 *   node dump-qday-slugs.js
 */

const { api } = require('./_lib');

const POST_IDS = [
  560, 562, 570, 572, 574, 581, 583, 585, 587, 589,    // Day 1-10
  592, 594, 596, 605, 607, 610, 614, 616, 609, 629,    // Day 11-20
  686, 688, 691, 693, 695, 699, 701, 703, 705, 707,    // Day 21-30
];

async function main() {
  console.log('Day | PostID | Slug đầy đủ');
  console.log('─'.repeat(110));

  for (let i = 0; i < POST_IDS.length; i++) {
    const day = i + 1;
    const id = POST_IDS[i];
    try {
      const post = await api.get(`/wp-json/wp/v2/posts/${id}?context=edit&_fields=id,slug,title,status`);
      const title = (post.title?.raw || post.title?.rendered || '').replace(/&[^;]+;/g, '').slice(0, 50);
      const status = post.status === 'publish' ? '✓' : `[${post.status}]`;
      console.log(`D${String(day).padStart(2)} | #${String(id).padStart(4)} | ${post.slug.padEnd(60)} ${status} ${title}`);
    } catch (e) {
      console.log(`D${String(day).padStart(2)} | #${String(id).padStart(4)} | ERROR: ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
