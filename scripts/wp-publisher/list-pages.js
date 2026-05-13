#!/usr/bin/env node
/**
 * Sol v4 — List tất cả Page (Trang) và Post (Bài viết) trong WP
 *
 * Usage:
 *   node list-pages.js                  → list Pages
 *   node list-pages.js posts            → list Posts (bài viết)
 *   node list-pages.js posts 2          → page 2 (mỗi page 50 items)
 *
 * Output: bảng ID | slug | status | modified | title
 */

const { api } = require('./_lib');

async function main() {
  const type = process.argv[2] === 'posts' ? 'posts' : 'pages';
  const page = parseInt(process.argv[3] || '1', 10);
  const perPage = 50;

  console.log(`▶ Đang list ${type} (page ${page}, ${perPage}/page)…`);
  console.log('');

  // status=any để lấy cả draft + published + private
  const path = `/wp-json/wp/v2/${type}?per_page=${perPage}&page=${page}&status=publish,draft,private&context=edit&_fields=id,slug,status,modified,title,link`;
  let items;
  try {
    items = await api.get(path);
  } catch (e) {
    console.error('✗ Lỗi:', e.message);
    if (e.body) console.error(JSON.stringify(e.body, null, 2));
    process.exit(1);
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.log('Không có item nào.');
    return;
  }

  // Header
  console.log('ID   | STATUS    | MODIFIED            | SLUG                                      | TITLE');
  console.log('-----+-----------+---------------------+-------------------------------------------+--------------------------------');

  for (const item of items) {
    const id = String(item.id).padEnd(5);
    const status = String(item.status).padEnd(10);
    const mod = item.modified.slice(0, 19).replace('T', ' ').padEnd(20);
    const slug = (item.slug || '').slice(0, 40).padEnd(42);
    const title = (item.title?.rendered || '(no title)').slice(0, 60);
    console.log(`${id}| ${status}| ${mod}| ${slug}| ${title}`);
  }

  console.log('');
  console.log(`Tổng: ${items.length} item.`);
  if (items.length === perPage) {
    console.log(`→ Có thể còn nữa. Chạy: node list-pages.js ${type} ${page + 1}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
