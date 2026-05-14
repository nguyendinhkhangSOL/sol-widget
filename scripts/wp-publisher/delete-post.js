#!/usr/bin/env node
/**
 * Sol v4 — Delete (trash) 1 Post WP
 *
 * Usage:
 *   node delete-post.js <id|slug:xxx>             → move to trash
 *   node delete-post.js <id|slug:xxx> --force     → delete permanent (CẨN THẬN)
 *
 * Move to trash = restore được trong 30 ngày từ WP Admin → Bài viết → Thùng rác.
 */

const { api } = require('./_lib');
const fs = require('fs');
const path = require('path');

async function findBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,title`);
  if (Array.isArray(items) && items.length > 0) return items[0];
  return null;
}

async function backupPost(id) {
  const post = await api.get(`/wp-json/wp/v2/posts/${id}?context=edit`);
  const backupDir = path.join(__dirname, 'backups', 'deleted-posts');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().slice(0, 10);
  const slug = post.slug || `id-${id}`;
  const htmlFile = path.join(backupDir, `${slug}-${id}-${ts}.html`);
  const metaFile = path.join(backupDir, `${slug}-${id}-${ts}.meta.json`);
  fs.writeFileSync(htmlFile, post.content?.raw || '');
  fs.writeFileSync(metaFile, JSON.stringify({
    id: post.id, slug: post.slug, title: post.title?.raw,
    status: post.status, modified: post.modified, meta: post.meta, link: post.link,
  }, null, 2));
  return { htmlFile, slug: post.slug, title: post.title?.raw };
}

async function main() {
  const target = process.argv[2];
  const force = process.argv.includes('--force');

  if (!target) {
    console.error('Usage: node delete-post.js <id|slug:xxx> [--force]');
    process.exit(1);
  }

  let id;
  if (/^\d+$/.test(target)) {
    id = parseInt(target, 10);
  } else if (target.startsWith('slug:')) {
    const post = await findBySlug(target.slice(5));
    if (!post) { console.error(`✗ Không tìm thấy post slug="${target.slice(5)}"`); process.exit(1); }
    id = post.id;
  } else {
    console.error('✗ Target phải là số ID hoặc "slug:xxx"');
    process.exit(1);
  }

  console.log(`▶ ${force ? 'DELETE PERMANENT' : 'Move to TRASH'} post #${id}`);

  // Backup trước
  try {
    const bkp = await backupPost(id);
    console.log(`  ✓ Backup: ${path.relative(__dirname, bkp.htmlFile)}`);
    console.log(`    Title: ${bkp.title}`);
  } catch (e) {
    console.warn(`  ⚠ Backup fail: ${e.message} — vẫn tiếp tục delete`);
  }

  // Delete
  try {
    const url = `/wp-json/wp/v2/posts/${id}${force ? '?force=true' : ''}`;
    const result = await api.delete(url);
    if (force) {
      console.log(`✓ DELETED PERMANENT`);
    } else {
      console.log(`✓ Moved to trash (status=trash)`);
      console.log(`  Restore: WP Admin → Bài viết → Thùng rác → Khôi phục`);
    }
  } catch (e) {
    console.error('✗ FAIL:', e.message);
    if (e.body) console.error(JSON.stringify(e.body, null, 2));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
