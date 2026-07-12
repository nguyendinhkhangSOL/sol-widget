# 🚀 Publish Guide — Tuyến Bài sol.vn/huong-di/

## Setup 1 lần (5 phút)

### 1. Lấy WordPress Application Password

- Login `sol.vn/wp-admin` (bằng account admin)
- **Users → Your Profile**
- Scroll xuống **"Application Passwords"**
- Name: `sol-auto-publish`
- Click **"Add New Application Password"**
- Copy password hiển thị (dạng `xxxx xxxx xxxx xxxx xxxx xxxx`) — **chỉ hiện 1 lần**

### 2. Cấu hình .env

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\seo-articles\huong-di
copy .env.example .env
# Edit .env — paste WP_USER và WP_APP_PASSWORD
```

### 3. Install Python dependencies

```powershell
pip install requests python-dotenv
```

## Deploy Bài Pillar Ngay

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\seo-articles\huong-di
python wp-publish.py 01-pillar-ai-2026-nghe-nao-bi-thay-the.html
```

**Output mong đợi:**
```
📤 Publishing: AI 2026 thay thế nghề nào? Framework 5+5 dấu hiệu...
   Slug: /huong-di/ai-2026-nghe-nao-bi-thay-the/
   Category: Hướng Đi (id=42)
   Tags: 5 tags
   ✅ Published: https://sol.vn/huong-di/ai-2026-nghe-nao-bi-thay-the/
   Post ID: 1234
```

## Dry Run Trước Khi Post Thật

```powershell
python wp-publish.py 01-pillar-ai-2026-nghe-nao-bi-thay-the.html --dry-run
```

Script sẽ show payload sẽ post nhưng KHÔNG post → verify trước.

## Deploy Toàn Bộ Tuyến

Khi có nhiều bài (pillar + 7 clusters):

```powershell
python wp-publish.py --all
```

Script auto-publish tất cả `*.html` trong folder này theo thứ tự alphabetical (01-, 02-, 03-...).

## Update Bài Đã Đăng

Script tự detect bài đã tồn tại (bằng slug) → **UPDATE** thay vì tạo mới. Không sợ duplicate.

## Troubleshooting

### ❌ HTTP 401 Unauthorized
- Check WP_USER (phải là email/username của WP admin, không phải Sol user)
- Check WP_APP_PASSWORD (có đủ 24 ký tự, có spaces)

### ❌ HTTP 403 Forbidden
- Account WP không có quyền publish → dùng account admin

### ❌ HTTP 404 khi tạo category
- Category `huong-di` chưa tồn tại → script tự tạo. Nếu vẫn fail, tạo thủ công trong WP admin: **Posts → Categories → Add New**

### ⚠ Post publish nhưng URL không phải `/huong-di/slug/`
- **Root cause:** WordPress permalink chưa config đúng
- **Fix:** WP Admin → Settings → Permalinks → chọn `Post name` custom structure `/%category%/%postname%/`
- Đảm bảo bài có category `huong-di` (script auto assign)

### ⚠ Yoast SEO meta không apply
- Yoast không expose qua REST API mặc định
- Sau khi publish, vào bài trên WP admin → thêm Focus Keyword + Meta Description thủ công (1 phút)
- Hoặc cài plugin **WPGraphQL for Yoast** để expose meta

## Content Plan Tuyến /huong-di/

| # | Slug | Title | Status |
|---|------|-------|--------|
| 1 | `ai-2026-nghe-nao-bi-thay-the` | Pillar: AI 2026 framework 5+5 | ✅ Ready |
| 2 | `ke-toan-45-dung-ai-thay-mat-viec` | Kế toán 45+ dùng AI thế nào để không mất việc | 📝 TBD |
| 3 | `content-marketer-40-ai-2026` | Content marketer 40+ trong thời AI: 5 skill | 📝 TBD |
| 4 | `ky-su-cntt-45-ai` | Kỹ sư CNTT 45+: Code thuê → CTO độc lập | 📝 TBD |
| 5 | `luat-su-50-ai` | Luật sư 50+ + AI: Bảo vệ vị trí 5 năm tới | 📝 TBD |
| 6 | `bac-si-gia-dinh-ai` | Bác sĩ gia đình + AI: Không thay mà nâng cấp | 📝 TBD |
| 7 | `so-tay-30-ngay-ai-chuyen-gia` | Sổ tay 30 ngày làm quen AI cho chuyên gia 40+ | 📝 TBD |
| 8 | `3-cau-hoi-nghe-an-toan-ai` | 3 câu hỏi kiểm tra nghề mình an toàn với AI | 📝 TBD |

**Ship strategy:** đăng pillar trước → 3 ngày sau đăng cluster #2 → mỗi 3 ngày 1 cluster → hoàn tất trong 3 tuần.

Internal link:
- Pillar → mỗi cluster (đã có sẵn ở section "Bài viết cùng tuyến")
- Cluster → pillar (mỗi bài cluster mở đầu bằng "Bài này là 1 phần của [pillar link]")
- Cluster ↔ cluster (link related in "Cùng tuyến")
