# Sol V2.2 Global Header Deployment

**Mục đích:** Replace theme header CŨ (có "Thân · Tâm · Trí") bằng Sol V2.2 header (📘 Sách + Hệ thống + Bài viết + Khang Sol) trên **TẤT CẢ** pages của sol.vn.

→ Đồng nhất với homepage + footer V2.2 đã deploy. Professional design xuyên suốt.

---

## 📦 3 Files

| File | Vai trò |
|---|---|
| `header-replacement.html` | HTML thay vào theme header.php (chỉ 14 dòng — gọn) |
| `css-header-global.css` | CSS scope global (không có `body.home` prefix) |
| `README.md` | Hướng dẫn deploy + checklist (file này) |

---

## 🎯 Thay đổi cốt lõi

### TRƯỚC (theme cũ):
```
[Logo Sol]  Đi Cùng Sol               🌱 Thân  💬 Tâm  🚀 Trí  Khang Sol  [Bắt đầu]
           THÂN · TÂM · TRÍ CHO U45 VIỆT
```

### SAU (V2.2):
```
[Logo Sol]  Đi Cùng Sol                  📘 Sách · Hệ thống · Bài viết · Khang Sol  [Đặt sách →]
```

### Khác biệt
- ❌ **Bỏ tagline** "THÂN · TÂM · TRÍ CHO U45 VIỆT"
- ❌ **Bỏ pills** "🌱 Thân  💬 Tâm  🚀 Trí" (focus chính cho Sách + Huongdi)
- ✅ **Thêm** "📘 Sách" làm featured link (màu amber)
- ✅ **Thêm** "Hệ thống" link → huongdi.sol.vn
- ✅ **Thêm** "Bài viết" link → /huong-di/
- ✅ **Đổi CTA** "Bắt đầu" → "Đặt sách →" (link tới /sach/...)

---

## 🚀 Deploy — 4 bước (10 phút)

### Bước 1: Backup theme header.php

WP Admin → **Appearance → Theme File Editor**

1. Panel bên phải → chọn **`header.php`**
2. Copy TOÀN BỘ → paste vào Notepad → save `header-backup-2026-06-27.php` trên máy local

### Bước 2: Replace header content

Trong WP Theme File Editor đang mở header.php:

1. **Tìm** `<header class="sol-header">` (block lớn)
2. **Tìm** `</header>` đóng tương ứng
3. **Select + Delete** toàn bộ block từ `<header>` đến `</header>`
4. **Paste** TOÀN BỘ nội dung từ `header-replacement.html`

**Lưu ý KHÔNG XOÁ:**
- `<head>...</head>` block
- `<?php wp_head(); ?>` ở cuối `<head>`
- `<body <?php body_class(); ?>>` opening tag
- Bất kỳ `<?php ... ?>` block khác

→ Click **Update File**.

### Bước 3: Add Global CSS

WP Admin → **Customize → Additional CSS**

→ SCROLL XUỐNG CUỐI (sau footer CSS đã có) → paste TOÀN BỘ `css-header-global.css` → **Publish**.

### Bước 4: Test 4 page khác nhau

Mở Incognito (**Ctrl + Shift + N**) test:

| URL | Phải có |
|---|---|
| `https://sol.vn/` | Sol V2.2 header ✓ (đã có từ trước) |
| `https://sol.vn/khang-sol/` | Sol V2.2 header NEW ✓ |
| `https://sol.vn/sol-la-gi/` | Sol V2.2 header NEW ✓ |
| `https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/` | Sol V2.2 header NEW ✓ |

**Tất cả 4 pages phải có header GIỐNG NHAU:** Logo + 4 nav links + "Đặt sách →" CTA.

---

## 📋 Pre-deploy Checklist

### Trước
- [ ] Backup theme header.php → save local file
- [ ] Verify Customize Additional CSS đã có footer global CSS (từ task trước)
- [ ] Theme footer global đã deploy thành công (verify 1 blog post)

### Sau
- [ ] Homepage `/` → header mới ✓
- [ ] Founder page `/khang-sol/` → header mới ✓
- [ ] About page `/sol-la-gi/` → header mới ✓
- [ ] Blog post pillar → header mới ✓
- [ ] Mobile responsive OK
- [ ] Nav links hoạt động (click test)
- [ ] CTA "Đặt sách" hoạt động → đến `/sach/tai-khoi-nghiep-dung-huong/`
- [ ] KHÔNG còn "Thân · Tâm · Trí" pills trong header

---

## 🛡️ Rollback (10 giây)

Nếu lỗi:
1. WP Admin → Theme File Editor → header.php
2. Paste lại content từ `header-backup-2026-06-27.php`
3. Update File

→ Header cũ trở lại ngay.

---

## ⚠️ Risk: Theme update

Nếu theme có update version → header.php bị reset về default.

**Mitigation:**
- Save backup `header-backup-2026-06-27.php` cẩn thận
- HOẶC dùng **Child Theme** (xem section dưới)

---

## 🔥 Bonus — Tạo Child Theme cho header + footer (an toàn lâu dài)

Nếu anh muốn an toàn 100% (theme update không phá Sol changes):

### SSH vào VPS:

```bash
ssh sol-vps
cd /var/www/sol.vn/wp-content/themes/

# Create child theme folder
sudo mkdir sol-child
cd sol-child

# Tạo style.css declaring child theme
sudo nano style.css
```

Paste vào style.css:
```css
/*
Theme Name: Sol Child Theme
Template: PARENT_THEME_FOLDER_NAME
Version: 1.0
Author: Khang Sol
*/

@import url("../PARENT_THEME_FOLDER_NAME/style.css");
```

(Thay `PARENT_THEME_FOLDER_NAME` bằng folder name theme hiện tại — vd `astra`, `generatepress`, `sol-theme`)

### Copy header.php + footer.php sang child:

```bash
sudo cp ../PARENT_THEME_FOLDER_NAME/header.php ./header.php
sudo cp ../PARENT_THEME_FOLDER_NAME/footer.php ./footer.php

# Edit header.php
sudo nano header.php
# (paste Sol V2.2 header content)

# Edit footer.php
sudo nano footer.php
# (paste Sol V2.2 footer content)
```

### Activate Sol Child Theme:

WP Admin → **Appearance → Themes** → tìm "Sol Child Theme" → **Activate**.

→ Parent theme update KHÔNG ảnh hưởng đến Sol customizations.

---

## 🎯 Strategic narrative đồng nhất

Sau deploy header + footer V2.2 global:

### Mọi page Sol.vn đều mang thông điệp:

```
   Header:  Sol = Sách + Hệ thống huongdi (đặt sách CTA)
   ↓
   Page content (varies)
   ↓
   Footer:
     • Sản phẩm (Sách + huongdi)
     • Tài nguyên miễn phí (Blog + Newsletter)
     • Về Sol + Khang
     • Dự án liên quan (bothuocla de-emphasized)
     • Emergency hotlines (compliance)
     • YMYL warnings
```

→ User vào TRANG NÀO cũng thấy:
1. Sol là **brand sách + hệ thống**
2. Có CTA "Đặt sách" luôn visible
3. Có truy cập đến tất cả tài nguyên
4. Có thông tin khẩn cấp (compliance)

→ **Professional + Consistent + Conversion-focused.**

---

## 📊 Expected impact

| Metric | Trước (theme header) | Sau (Sol V2.2 global) |
|---|---|---|
| Brand consistency score | 6/10 | **9/10** |
| Sách CTA visibility | Chỉ trên homepage | **Mọi page** (sticky header) |
| Click rate "Đặt sách" CTA từ blog | 0% | **3-5%** |
| Click rate "Hệ thống" từ blog | 0% | **2-4%** |
| Time-to-decision (browse → buy) | 3-5 visits | **2-3 visits** |

→ Header sticky với "Đặt sách →" CTA mọi nơi = conversion boost lớn.

---

## ⚙️ Common issues & fixes

### Issue 1: Header trùng lặp (2 header)
**Fix:** Mở header.php → đảm bảo CHỈ có 1 `<header class="sol-header">` block.

### Issue 2: Layout broken trên page khác
**Fix:** Verify CSS global (no `body.home` scope) đã paste vào Customize.

### Issue 3: Mobile menu thiếu
**Fix:** Mobile hiện tại chỉ giữ logo + CTA. Nếu cần full nav mobile → cần thêm JS toggle (Phase 2).

### Issue 4: Sticky header che first section
**Fix:** CSS đã có rule `body:not(.home) .sol-header + main { margin-top: 0 }` → page content tự align.

---

Anh deploy 4 bước → paste screenshot 2 page (homepage + 1 blog post) cho mình verify đồng nhất. Nếu OK → cycle "Sol V2.2 global" hoàn tất.

---

*Đồng nhất = trust compound. Mọi touchpoint đều củng cố brand Sol.*
