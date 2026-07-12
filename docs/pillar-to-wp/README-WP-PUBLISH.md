# Sol.vn — Publish Pillar Pages to WordPress

> Workflow: Markdown (local) → WordPress REST API → Draft post → Review → Publish.

## Bộ file

```
docs/pillar-to-wp/
├── publish-pillar-to-wp.js   — Node script: MD → WP REST API
├── .env.wp.example           — Template credentials
├── .env.wp                   — Real credentials (CHỈ LOCAL, không commit)
└── README-WP-PUBLISH.md      — File này
```

## Setup 1 lần duy nhất (10 phút)

### Bước 1 — Verify CPT "huong-di" có REST API

```
wp-admin → CPT UI → Edit Post Types → "huong-di"
→ Tìm setting "Show in REST API" = TRUE
→ "REST API Base Slug" = huong-di (hoặc để trống dùng default slug)
→ Save
```

Test REST API endpoint:
```
https://sol.vn/wp-json/wp/v2/huong-di
```

→ Nếu trả về JSON list posts (có thể empty `[]`) = OK.
→ Nếu 404 = chưa enable REST.

### Bước 2 — Tạo Application Password

```
wp-admin → Users → Profile (hoặc Edit user khangsol)
→ Scroll xuống "Application Passwords"
→ "New Application Password Name": Sol Pillar Publisher
→ Click "Add New Application Password"
→ COPY password ngay (chỉ show 1 lần!)
   Format: xxxx xxxx xxxx xxxx xxxx xxxx (24 ký tự + 5 spaces)
```

⚠️ Có thể revoke bất cứ lúc nào trong cùng panel.

### Bước 3 — Setup local credentials

```powershell
# Vào folder
cd C:\BOTHUOCLA\sol-widget\docs\pillar-to-wp\

# Copy template
copy .env.wp.example .env.wp

# Edit .env.wp với credentials thật
notepad .env.wp
```

Fill in:
```
WP_URL=https://sol.vn
WP_USER=khangsol
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx   # ← paste từ Bước 2
WP_CPT_SLUG=huong-di
WP_DEFAULT_STATUS=draft
```

### Bước 4 — Install dependencies

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\pillar-to-wp\
npm init -y
npm install marked node-fetch@2 dotenv
```

→ Mất ~10 giây.

## Publish Pillar #1

### 1 lệnh duy nhất

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\pillar-to-wp\
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-01-freelancer-chuyen-mon.md
```

### Output mẫu

```
═══════════════════════════════════════════════════════════════════
  SOL.VN — Publish Pillar to WordPress
═══════════════════════════════════════════════════════════════════
Input:  ../huongdi-seo-content/pillar-01-freelancer-chuyen-mon.md
Target: https://sol.vn/wp-json/wp/v2/huong-di
User:   khangsol
Status: draft

Metadata:
  Title: Freelancer Chuyên Môn Tuổi 45+ — 7 Hướng Từ 20 Năm Kinh Nghiệm
  Slug:  freelancer-chuyen-mon-tuoi-45
  KW:    freelancer chuyên môn tuổi 45+

── Converting MD → Gutenberg blocks ──────────────────────
  Content size: 18.4 KB

── Submitting to WordPress REST API ──────────────────────

═══════════════════════════════════════════════════════════════════
  ✅ POST CREATED SUCCESSFULLY
═══════════════════════════════════════════════════════════════════
  ID:        4521
  Status:    draft
  Slug:      freelancer-chuyen-mon-tuoi-45
  URL final: https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/
  Edit URL:  https://sol.vn/wp-admin/post.php?post=4521&action=edit

Next steps:
  1. Vào wp-admin → Edit post để:
     - Review content
     - Set Featured Image (1200×630)
     - Verify Yoast SEO meta
     - Add Tags + Category
  2. Click "Publish" để go live
  3. Submit URL lên Google Search Console
```

## Workflow chuẩn cho mỗi Pillar

```
1. Em delegate subagent viết draft MD          (1-2h compute)
2. Khang review MD local — tweak Sol voice    (30 phút)
3. Khang chạy script publish MD → WP draft    (30 giây)
4. Khang vào wp-admin → review:                (15 phút)
   - Content render OK?
   - Featured Image (1200×630 Sol orange)
   - Yoast SEO meta đúng (title, description, focus keyword)
   - Categories: "Trí" + "Huongdi" + specific category
   - Tags: 3-5 long-tail keywords
   - Schema markup (Yoast tự lo)
5. Click "Publish" → go live                   (1 giây)
6. Submit URL lên GSC → Request Indexing       (1 phút)
7. Share LinkedIn/Facebook Khang để tạo signal (5 phút)
```

**Total per pillar: ~50 phút Khang effort.**

## Yoast SEO checklist sau khi publish

Mỗi pillar trên WP cần Yoast plugin set:

```
□ Focus Keyword:       Primary keyword từ MD frontmatter
□ SEO Title:           Auto-fill từ post title (≤60 chars)
□ Meta Description:    Auto-fill từ excerpt (≤160 chars)
□ Slug:                Đúng theo MD frontmatter
□ Canonical URL:       Auto = post URL
□ Featured Image:      1200×630, alt text có keyword
□ Categories:          Trí (main) + sub-category
□ Tags:                3-5 LSI keywords
□ Internal links:      Yoast suggest → review + accept
□ Readability:         Yoast score Green
□ SEO analysis:        Yoast score Green
```

## Troubleshooting

### Lỗi 1: "WP API Error (401)" — Authentication failed

**Nguyên nhân:**
- Application Password sai
- User không tồn tại
- 2FA bật mà chưa exception cho App Password

**Fix:**
```
1. wp-admin → Users → Edit Khang
2. Application Passwords → Revoke cũ
3. Create new → Copy → Paste vào .env.wp
4. Run lại script
```

### Lỗi 2: "WP API Error (404)" — CPT not found

**Nguyên nhân:** CPT "huong-di" chưa enable REST API.

**Fix:**
```
wp-admin → CPT UI → Edit Post Types → huong-di
→ "Show in REST API" → True
→ Save
→ Run lại script
```

### Lỗi 3: "WP API Error (403)" — Forbidden

**Nguyên nhân:** User Khang không có capability `edit_huong_di` hoặc `publish_huong_di`.

**Fix:**
```
1. Verify role Khang là Administrator hoặc Editor
2. Hoặc cấp custom capability:
   - Cài plugin "User Role Editor"
   - Add cap "edit_huong_di", "publish_huong_di"
```

### Lỗi 4: Content render không đẹp trên WP

**Nguyên nhân:** Gutenberg blocks conversion chưa hoàn hảo cho nested elements.

**Fix:**
- Vào wp-admin edit post
- Toggle "Visual" / "Code" editor để clean up
- Hoặc convert blocks → "Classic Block" để giữ raw HTML

## Bảo mật

✅ **Application Password** an toàn hơn user password vì:
- Có thể revoke riêng từng app
- KHÔNG dùng được cho wp-admin login (chỉ API)
- Audit log: thấy app nào dùng khi nào

✅ `.env.wp` chmod 600 — chỉ user local đọc được

✅ Nếu credentials leak: revoke ngay tại wp-admin → tạo mới

## Scaling — Publish 6 pillar còn lại

Sau khi Pillar #1 publish OK, lặp lại cho #2-#7:

```powershell
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-02-coaching.md
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-03-content-creator.md
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-04-khoi-nghiep-tinh-gon.md
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-05-dai-ly.md
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-06-dich-vu.md
node publish-pillar-to-wp.js ..\huongdi-seo-content\pillar-07-dau-thau.md
```

→ Mỗi lệnh 30 giây → tạo draft trên WP → Khang review + publish.

## Cập nhật pillar đã publish

Script hiện tại tạo NEW post. Để update existing post:

```powershell
# (Em sẽ viết script update-pillar.js sau, dùng PUT request thay POST)
```

Hoặc đơn giản: edit content trực tiếp trên wp-admin.

---

**Author:** Sol AI · **Version:** 1.0 · **Date:** 2026-06-22
