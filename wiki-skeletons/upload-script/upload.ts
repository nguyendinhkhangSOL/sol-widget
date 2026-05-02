// upload.ts — Bulk upload 27 wiki articles vào WordPress sol.vn
//
// Usage:
//   npm run upload:dry         # Test, không gọi API
//   npm run upload             # Upload thật (status=draft mặc định)
//   npm run upload -- --only chip-khac-mau.md   # Upload 1 bài thôi
//   npm run upload -- --publish  # Publish luôn (KHÔNG khuyến cáo)

import 'dotenv/config';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownFile } from './lib/markdown.ts';
import { WpClient } from './lib/wp-client.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHIPS_DIR = join(__dirname, '..', 'chips');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PUBLISH = args.includes('--publish');
const onlyIdx = args.indexOf('--only');
const ONLY_FILE = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

interface Result {
  file: string;
  slug: string;
  status: 'created' | 'exists' | 'error' | 'skipped';
  postId?: number;
  url?: string;
  error?: string;
}

async function main() {
  console.log('━'.repeat(70));
  console.log('🌱 SOL Wiki Bulk Uploader');
  console.log('━'.repeat(70));

  const wpUrl = process.env.WP_URL;
  const wpUser = process.env.WP_USER;
  const wpAppPass = process.env.WP_APP_PASSWORD;
  const categorySlug = process.env.WP_CATEGORY_SLUG ?? 'trieu-chung-khi-cai-thuoc';
  const defaultStatus = (process.env.WP_DEFAULT_STATUS ?? 'draft') as
    | 'draft'
    | 'publish';
  const status: 'draft' | 'publish' = PUBLISH ? 'publish' : defaultStatus;

  if (!wpUrl || !wpUser || !wpAppPass) {
    console.error('❌ Thiếu env vars: WP_URL, WP_USER, WP_APP_PASSWORD');
    console.error('   Copy .env.example → .env và điền credentials');
    process.exit(1);
  }

  console.log(`🔗 WordPress: ${wpUrl}`);
  console.log(`👤 User: ${wpUser}`);
  console.log(`📂 Category slug: ${categorySlug}`);
  console.log(`📊 Status: ${status}${status === 'publish' ? ' ⚠️ (PUBLISH NGAY)' : ''}`);
  console.log(`🧪 Dry run: ${DRY_RUN ? 'YES' : 'NO'}`);
  if (ONLY_FILE) console.log(`🎯 Only: ${ONLY_FILE}`);
  console.log('');

  const client = new WpClient(wpUrl, wpUser, wpAppPass);

  // Step 1: Verify credentials
  console.log('🔐 Verify credentials...');
  try {
    const me = await client.whoAmI();
    console.log(`   ✓ Đăng nhập thành công: ${me.name} (id ${me.id})`);
  } catch (err: any) {
    console.error(`   ❌ Authentication failed: ${err.message}`);
    console.error('   Kiểm tra WP_USER + WP_APP_PASSWORD trong .env');
    process.exit(1);
  }

  // Step 2: Verify Rank Math REST plugin
  console.log('🔌 Verify Rank Math REST...');
  const rankMathOk = await client.checkRankMathRestRegistered();
  if (!rankMathOk) {
    console.warn('   ⚠️  Rank Math meta keys chưa register trong REST API.');
    console.warn('      → Cài plugin wp-mu-plugin/sol-rank-math-rest.php');
    console.warn('      → Hoặc tiếp tục — meta SEO sẽ phải set thủ công sau');
    console.warn('');
  } else {
    console.log('   ✓ Rank Math REST hoạt động');
  }

  // Step 3: Find category
  console.log('🔍 Tìm category...');
  const categoryId = await client.getCategoryIdBySlug(categorySlug);
  if (!categoryId) {
    console.error(`   ❌ Không tìm thấy category slug "${categorySlug}"`);
    console.error('   Tạo category đó trên WP admin → Posts → Categories');
    process.exit(1);
  }
  console.log(`   ✓ Category ID: ${categoryId}`);
  console.log('');

  // Step 4: Read all chip files
  let files = (await readdir(CHIPS_DIR))
    .filter((f) => f.startsWith('chip-') && f.endsWith('.md'))
    .sort();

  if (ONLY_FILE) {
    files = files.filter((f) => f === ONLY_FILE || f === `chip-${ONLY_FILE}.md`);
    if (files.length === 0) {
      console.error(`❌ Không tìm thấy file: ${ONLY_FILE}`);
      process.exit(1);
    }
  }

  console.log(`📚 Sẽ upload ${files.length} bài`);
  console.log('━'.repeat(70));

  // Step 5: Upload từng file
  const results: Result[] = [];

  for (const file of files) {
    console.log('');
    const filePath = join(CHIPS_DIR, file);

    try {
      const md = await readFile(filePath, 'utf-8');
      const { meta, html, excerpt } = parseMarkdownFile(md);

      console.log(`📝 ${file}`);
      console.log(`   Title: ${meta.title}`);
      console.log(`   Slug:  ${meta.slug}`);
      console.log(`   Focus: ${meta.target_keyword ?? '(none)'}`);

      // Check exists
      const existing = await client.getPostBySlug(meta.slug);
      if (existing) {
        console.log(`   ⚠️  Đã tồn tại — post #${existing.id} (${existing.status}) — bỏ qua`);
        console.log(`   🔗 ${existing.link}`);
        results.push({
          file,
          slug: meta.slug,
          status: 'exists',
          postId: existing.id,
          url: existing.link,
        });
        continue;
      }

      if (DRY_RUN) {
        console.log(`   🧪 [DRY RUN] Skip API call`);
        results.push({ file, slug: meta.slug, status: 'skipped' });
        continue;
      }

      // Create post
      const post = await client.createPost({
        title: meta.title,
        slug: meta.slug,
        content: html,
        excerpt,
        status,
        categories: [categoryId],
        meta: {
          rank_math_focus_keyword: meta.target_keyword ?? '',
          rank_math_description: meta.meta_description ?? '',
          rank_math_title: meta.title,
        },
      });

      console.log(`   ✓ Created post #${post.id} (${post.status})`);
      console.log(`   🔗 ${post.link}`);
      results.push({
        file,
        slug: meta.slug,
        status: 'created',
        postId: post.id,
        url: post.link,
      });

      // Throttle — tránh quá tải server
      await sleep(500);
    } catch (err: any) {
      console.error(`   ❌ Lỗi: ${err?.message ?? err}`);
      results.push({
        file,
        slug: '',
        status: 'error',
        error: err?.message ?? String(err),
      });
    }
  }

  // Step 6: Output CSV
  console.log('');
  console.log('━'.repeat(70));
  const created = results.filter((r) => r.status === 'created').length;
  const exists = results.filter((r) => r.status === 'exists').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  console.log(`📊 Tổng kết: ${results.length} bài`);
  console.log(`   ✓ Tạo mới:    ${created}`);
  console.log(`   ⚠️  Đã tồn tại: ${exists}`);
  console.log(`   ❌ Lỗi:        ${errors}`);
  if (skipped > 0) console.log(`   🧪 Dry-run:    ${skipped}`);
  console.log('');

  // Write CSV
  const csv = [
    'file,slug,status,post_id,url,error',
    ...results.map((r) =>
      [
        r.file,
        r.slug,
        r.status,
        r.postId ?? '',
        r.url ?? '',
        (r.error ?? '').replace(/,/g, ';').replace(/\n/g, ' '),
      ]
        .map((v) => String(v))
        .join(','),
    ),
  ].join('\n');

  const outPath = join(__dirname, 'output.csv');
  await writeFile(outPath, csv, 'utf-8');
  console.log(`📄 Output CSV: ${outPath}`);
  console.log('━'.repeat(70));
  console.log('');
  console.log('Bước tiếp theo:');
  console.log('  1. Mở từng URL trên WP admin → review nội dung');
  console.log('  2. Upload featured image cho mỗi bài');
  console.log('  3. Sửa "Khang nói" placeholder thành câu chuyện thật');
  console.log('  4. Verify Rank Math meta (focus keyword + description)');
  console.log('  5. Đổi status Draft → Publish khi OK');
  console.log('  6. Copy URL vào /admin/canned-replies cho chip tương ứng');
  console.log('');

  if (errors > 0) process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error('');
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
