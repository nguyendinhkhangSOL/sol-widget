# Bulk upload 27 wiki articles → sol.vn

Script Node.js bulk upload markdown files trong `../chips/` thành post WordPress, status `draft`, category `trieu-chung-khi-cai-thuoc`, set Rank Math SEO meta.

## Yêu cầu

- Node 20+ (cần built-in `fetch` + `import.meta`)
- WordPress 5.6+ (Application Password)
- Plugin **Rank Math SEO** đang active
- Category `trieu-chung-khi-cai-thuoc` đã tạo trên WordPress

## Setup — 5 bước (~30 phút lần đầu)

### Bước 1: Cài MU-plugin trên WordPress

Rank Math không expose meta keys vào REST API mặc định. Plugin nhỏ này đăng ký:

1. SSH/FTP vào server WordPress của bạn
2. Tạo folder `wp-content/mu-plugins/` nếu chưa có
   ```bash
   mkdir -p wp-content/mu-plugins
   ```
3. Upload file `wp-mu-plugin/sol-rank-math-rest.php` vào folder đó
4. Verify (mở trình duyệt):
   ```
   https://sol.vn/wp-json/wp/v2/posts?per_page=1
   ```
   Response phải có field `meta` chứa `rank_math_focus_keyword`. Nếu không có → plugin chưa active.

> **MU plugin** = "must-use" plugin — tự active không cần qua Plugins menu. An toàn, không thể vô tình deactivate.

### Bước 2: Tạo Application Password

1. Login WordPress admin (https://sol.vn/wp-admin)
2. Vào **Users → Profile** (hoặc Users → Your profile)
3. Cuộn xuống section **"Application Passwords"**
4. Đặt tên: `Bulk upload script`
5. Bấm **"Add New Application Password"**
6. **COPY chuỗi xuất hiện** — dạng `xxxx xxxx xxxx xxxx xxxx xxxx`
   - Có khoảng trắng giữa các nhóm 4 ký tự
   - Chỉ hiện 1 lần — copy ngay
   - Mất rồi phải tạo password mới

### Bước 3: Cài dependencies

```bash
cd wiki-skeletons/upload-script
npm install
```

Sẽ cài: `gray-matter`, `marked`, `marked-footnote`, `dotenv`, `tsx`.

### Bước 4: Cấu hình `.env`

```bash
cp .env.example .env
```

Mở `.env` bằng editor, sửa:

```env
WP_URL=https://sol.vn
WP_USER=khang
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
WP_CATEGORY_SLUG=trieu-chung-khi-cai-thuoc
WP_DEFAULT_STATUS=draft
```

> ⚠️ `.env` không được commit vào git — `.gitignore` đã cấu hình.

### Bước 5: Chạy thử với `--dry-run`

```bash
npm run upload:dry
```

Output mong đợi:
```
🌱 SOL Wiki Bulk Uploader
🔗 WordPress: https://sol.vn
👤 User: khang
📂 Category slug: trieu-chung-khi-cai-thuoc
📊 Status: draft
🧪 Dry run: YES

🔐 Verify credentials...
   ✓ Đăng nhập thành công: Khang Sol (id 1)
🔌 Verify Rank Math REST...
   ✓ Rank Math REST hoạt động
🔍 Tìm category...
   ✓ Category ID: 42

📚 Sẽ upload 27 bài
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 chip-buon-chan.md
   Title: "Đống Tro Tàn" — vì sao buồn vô cớ tuần 2 cai thuốc?
   Slug:  buon-chan-tuan-2
   Focus: buồn chán cai thuốc lá tuần 2
   🧪 [DRY RUN] Skip API call

... (26 bài tiếp theo)

📊 Tổng kết: 27 bài
   ✓ Tạo mới:    0
   ⚠️  Đã tồn tại: 0
   ❌ Lỗi:        0
   🧪 Dry-run:    27
```

**Nếu có lỗi ở dry-run** → fix trước khi chạy thật.

## Upload thật

Khi dry-run OK:

```bash
npm run upload
```

Sẽ tạo 27 post status `draft` trên sol.vn. Mỗi post mất ~1-2 giây. Tổng ~1 phút.

## Output

Sau khi xong, file `output.csv`:

```csv
file,slug,status,post_id,url,error
chip-khac-mau.md,khac-dom-co-mau-canh-bao,created,1234,https://sol.vn/?p=1234,
chip-dau-nguc-du.md,dau-nguc-du-doi-115,created,1235,https://sol.vn/?p=1235,
...
```

## Workflow sau upload

Mỗi bài cần Khang làm thủ công (60-90 phút/bài):

| # | Việc | Thời gian |
|---|---|---|
| 1 | Mở URL trên WP admin | 30s |
| 2 | Đọc + sửa giọng Khang nếu cần | 30-60p |
| 3 | Upload featured image (1200×630 px) | 5p |
| 4 | Sửa "💬 Khang nói" placeholder thành câu chuyện thật | 10-20p |
| 5 | Verify Rank Math meta (focus keyword + description) | 2p |
| 6 | Bấm Publish khi OK | 5s |
| 7 | Copy URL vào `/admin/canned-replies` cho chip tương ứng | 1p |

**Tổng:** 1.5-2 giờ × 27 bài = ~40-60 giờ work. Có thể chia 2-3 bài/ngày → 2-3 tuần xong.

## Re-run script — idempotent

Script kiểm tra slug trước khi tạo. Chạy lại sẽ:
- Skip slug đã tồn tại
- Chỉ tạo bài mới (vd Khang viết chip-xxx.md mới sau này)

## Upload 1 file riêng

```bash
npm run upload -- --only chip-khac-mau.md
```

Useful khi:
- Test 1 bài trước khi run cả lô
- Re-upload sau khi sửa skeleton

## Publish luôn (KHÔNG khuyến cáo)

```bash
npm run upload -- --publish
```

⚠️ Chỉ dùng khi đã review từng bài. Default `draft` an toàn hơn.

## Troubleshooting

### `Authentication failed`
- WP_USER hoặc WP_APP_PASSWORD sai
- Application Password đã bị revoke
- → Tạo Application Password mới ở Users → Profile

### `Không tìm thấy category slug`
- Category chưa tạo trên WP, hoặc slug khác
- → Posts → Categories → Add new → đặt slug `trieu-chung-khi-cai-thuoc`

### `meta field not accepted`
- MU-plugin chưa active
- → Verify Bước 1 — file `sol-rank-math-rest.php` ở `wp-content/mu-plugins/`
- → Test endpoint `/wp-json/wp/v2/posts?per_page=1`

### `WP REST 403: rest_forbidden`
- User không đủ permission
- → User cần role Editor hoặc Administrator

### `slug already exists`
- Slug đã được dùng — script đã skip
- → Xoá post cũ trên WP, hoặc đổi slug trong frontmatter MD

### Upload timeout / connection refused
- WP server chậm hoặc bị firewall
- → Tăng throttle trong `upload.ts` (sửa `sleep(500)` → `sleep(2000)`)

## Câu hỏi

Script này không upload featured image — Khang upload thủ công khi review từng bài. Lý do:

- Mỗi bài cần ảnh khác nhau, có alt text khác nhau
- Image SEO quan trọng — tốt hơn Khang chọn riêng
- Script tự upload ảnh thường gây vấn đề bản quyền + chất lượng kém

Nếu sau này Khang muốn auto featured image (vd dùng AI generate), có thể bổ sung script — nhưng nên làm sau khi MVP wiki chạy ổn.
