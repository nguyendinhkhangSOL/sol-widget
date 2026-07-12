# Deploy Guide — Đồng nhất Header/Footer cho TOÀN BỘ sol.vn

## 🎯 Mục tiêu

Áp dụng Sol V2.2 design (giống homepage) cho **TẤT CẢ** content trên sol.vn:

| Content Type | Hiện tại | Sau deploy |
|---|---|---|
| Homepage `/` | ✅ V2.2 (custom HTML page) | ✅ V2.2 |
| Pages `/khang-sol/`, `/sol-la-gi/`, etc. | ❌ V2 cũ (Thân/Tâm/Trí) | ✅ V2.2 |
| Posts `/huong-di/{slug}`, `/ngam/{slug}` | ❌ Theme rendering | ✅ V2.2 |
| Landing `/sach/...` | ❌ V2 hoặc theme | ✅ V2.2 (Phase 2) |

---

## 📦 Files cần deploy

| File | Vai trò |
|---|---|
| `sol-default-template-v3.php` | Override pages (template `sol-default-page.php`) |
| `sol-post-template.php` | Override blog posts (mới tạo) |

---

## 🚀 Deploy Strategy — Tránh lỗi như lần trước

### Lý do lỗi trước
1. **PHP opcache** cache file PHP cũ — không thay đổi ngay sau upload
2. **WPCode snippet active** conflict với mu-plugin
3. **Browser cache** giữ version cũ

### Strategy mới — Deploy AN TOÀN

**Quy tắc vàng:**
- ✅ Upload 1 file mỗi lần
- ✅ Wait 60 giây sau upload (cho PHP opcache clear)
- ✅ Test ngay sau upload
- ✅ Nếu lỗi → rename file thành `.disabled` ngay lập tức
- ✅ Verify trên Incognito (bypass browser cache)

---

## 📋 Bước 1: Disable WPCode snippet (nếu còn active)

Trước khi deploy, đảm bảo WPCode KHÔNG render header/footer (conflict).

WP Admin → **Code Snippets** → Tìm snippet nào liên quan header/footer/Sol:
- Toggle **Inactive** (switch xám)
- Hoặc Delete luôn

→ Verify: WPCode page hiển thị "No active snippets" hoặc snippets đều xám.

---

## 📋 Bước 2: Deploy `sol-default-template-v3.php`

### 2.1. Backup file v2 hiện tại

cPanel File Manager → `/public_html/wp-content/mu-plugins/`

1. Right-click `sol-default-template.php` (v2 hiện tại)
2. **Download** → Save: `sol-default-template-V2-BACKUP-2026-06-27.php` (giữ trên máy local)

### 2.2. Upload v3

1. Trong cùng folder `mu-plugins/`:
2. Click **Upload** trên toolbar
3. Drag-drop file `sol-default-template-v3.php` từ máy local
4. **Đợi upload xong** (verify file size match)

### 2.3. Test SYNTAX trước khi swap

Quan trọng — KHÔNG xoá v2 file ngay. Trước hết test syntax v3:

1. Trong File Manager, navigate to `/public_html/wp-content/mu-plugins/`
2. Right-click `sol-default-template-v3.php` → **Rename**
3. Đổi thành `_TEST_sol-default-template-v3.php` (prefix `_TEST_` để mu-plugins KHÔNG auto-load)
4. Verify site vẫn work bình thường (v2 vẫn active)

### 2.4. Test v3 syntax via PHP CLI (nếu cPanel cho phép)

cPanel → **Terminal** (nếu có):
```bash
php -l /public_html/wp-content/mu-plugins/_TEST_sol-default-template-v3.php
```

→ Output cần là: `No syntax errors detected in ...`

→ Nếu báo lỗi → file v3 có vấn đề → DỪNG. Paste error cho mình debug.

### 2.5. Nếu không có Terminal — test online

1. Download file `_TEST_sol-default-template-v3.php`
2. Vào https://www.piliapp.com/php-syntax-check/
3. Paste content → check
4. Nếu OK → tiếp tục

### 2.6. Swap v2 → v3

Sau khi confirm syntax OK:

1. cPanel File Manager → `/public_html/wp-content/mu-plugins/`
2. **Delete** `sol-default-template.php` (file v2 cũ)
3. **Rename** `_TEST_sol-default-template-v3.php` → `sol-default-template.php`
4. **WAIT 60 giây** (cho PHP opcache clear)
5. Mở Incognito → test:
   - https://sol.vn/khang-sol/
   - https://sol.vn/sol-la-gi/

→ Phải thấy V2.2 design (header: 📘 Sách · Hệ thống · Bài viết · Khang Sol).

---

## 📋 Bước 3: Deploy `sol-post-template.php`

### 3.1. Upload file mới

cPanel File Manager → `/public_html/wp-content/mu-plugins/`

1. Click **Upload** → drag-drop `sol-post-template.php`
2. Upload xong, file mới sẽ xuất hiện

### 3.2. Test syntax

Tương tự bước 2.3-2.5 — rename thành `_TEST_sol-post-template.php` → test syntax → rename về `sol-post-template.php`.

### 3.3. Activate + test

Sau khi rename về tên đúng:

1. **WAIT 60 giây**
2. Mở Incognito → test:
   - https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/ (blog post)
   - https://sol.vn/category/ngam/

→ Post phải có V2.2 header + footer giống pages.

---

## 🛡️ Rollback nếu lỗi

### Nếu sol-default-template.php (v3) lỗi:

1. **Delete** `sol-default-template.php` (v3 lỗi)
2. **Upload** lại file backup `sol-default-template-V2-BACKUP-2026-06-27.php`
3. **Rename** thành `sol-default-template.php`
4. Wait 60s → site back to v2

### Nếu sol-post-template.php lỗi:

1. **Rename** `sol-post-template.php` → `sol-post-template.php.disabled`
2. Wait 60s → posts fallback về theme rendering

### Nếu cả mu-plugins folder broken:

1. **Rename** folder `mu-plugins` → `mu-plugins-OFF`
2. Site recover với theme defaults

---

## 📋 Pre-deploy Checklist

### Trước
- [ ] Backup `sol-default-template.php` v2 → save local
- [ ] Disable WPCode snippet
- [ ] Verify Customize → Additional CSS không có rule conflict
- [ ] PHP version check (PHP 7.4+ required cho heredoc)

### Sau deploy v3 default
- [ ] `/khang-sol/` hiển thị V2.2 design ✓
- [ ] `/sol-la-gi/` hiển thị V2.2 ✓
- [ ] `/tuyen-bo-mien-tru/` hiển thị V2.2 ✓
- [ ] Mobile responsive OK
- [ ] All CTAs hoạt động
- [ ] Schema.org load OK (test với Rich Results Test)

### Sau deploy post template
- [ ] `/huong-di/{slug}/` hiển thị V2.2 design ✓
- [ ] Featured image hiển thị đúng
- [ ] Author + date + reading time hiển thị
- [ ] Breadcrumb hoạt động
- [ ] Category badge hiển thị
- [ ] Content render đầy đủ (formatting OK)

---

## 🎯 Expected result sau deploy

```
sol.vn (toàn bộ ecosystem)
├── / (Homepage)                  → V2.2 ✓ (custom HTML page)
├── /khang-sol/                   → V2.2 ✓ (sol-default-template-v3)
├── /sol-la-gi/                   → V2.2 ✓ (sol-default-template-v3)
├── /tuyen-bo-mien-tru/           → V2.2 ✓ (sol-default-template-v3)
├── /chinh-sach-bao-mat/          → V2.2 ✓ (sol-default-template-v3)
├── /huong-di/freelancer-...      → V2.2 ✓ (sol-post-template)
├── /huong-di/coaching-...        → V2.2 ✓ (sol-post-template)
├── /category/ngam/article-1      → V2.2 ✓ (sol-post-template)
└── ...
```

→ **Đồng nhất 100% header + footer xuyên suốt sol.vn.**

---

## ⏰ Time estimate

| Task | Time |
|---|---|
| Disable WPCode snippet | 2 phút |
| Backup v2 | 2 phút |
| Upload + test syntax v3 default | 5 phút |
| Deploy + test v3 default | 5 phút |
| Upload + test syntax post template | 5 phút |
| Deploy + test post template | 5 phút |
| **Total** | **~25 phút** |

---

## ⚠️ Quan trọng

### PHP Opcache
Shared hosting có thể cache PHP file 1-5 phút. Sau upload:
- KHÔNG refresh ngay
- **Wait 60 giây**
- Test trên **Incognito** (bypass cả PHP opcache + browser cache)

### Browser Cache
Sau khi v3 active, browser có thể cache HTML cũ. Test bằng:
- Ctrl+Shift+R (hard refresh)
- Hoặc Incognito (Ctrl+Shift+N)

### Cloudflare/CDN
Nếu sol.vn dùng CDN:
- Cần **Purge Cache** từ CDN dashboard
- Hoặc wait 24h cho cache TTL expire

---

Anh deploy theo 3 bước (Disable WPCode → v3 default → post template) tuần tự. Mỗi bước test 60s trước khi sang bước tiếp.

→ Paste cho mình **screenshot 1 page + 1 post** sau khi deploy → mình verify V2.2 hiển thị đúng.

Nếu có lỗi → rollback ngay → paste error log cho mình debug.
