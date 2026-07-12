# Sol V2.2 Footer — Global Deployment

**Mục đích:** Replace theme footer cũ bằng Sol V2.2 footer trên TẤT CẢ page của sol.vn (homepage, blog post, sách, founder profile, etc.)

---

## 📦 Files

| File | Vai trò |
|---|---|
| `01-DEPLOY-GUIDE.md` | Hướng dẫn deploy step-by-step |
| `footer-replacement.html` | HTML thay thế cho theme footer.php |
| `css-footer-global.css` | CSS footer scope global (no `body.home`) |

---

## 🎯 Strategy

### Trước (hiện tại):
- Theme `footer.php` → render theme footer cũ (TRỤ THÂN/TÂM/TRÍ + Khẩn cấp 115)
- CSS V2.2 chỉ apply `body.home` → các page khác vẫn theme footer

### Sau (sau deploy):
- Theme `footer.php` → render Sol V2.2 footer (Sản phẩm/Tài nguyên/Về Sol/Dự án liên quan)
- CSS V2.2 footer styles → apply **global** (mọi page)
- Sol footer consistent xuyên suốt website

---

## 🚀 Deploy — 3 cách

### ⭐ Cách 1: WP Theme Editor (đơn giản nhất — 10 phút)

#### Bước 1: Backup theme footer.php

WP Admin → **Appearance → Theme File Editor**

1. Bên phải, panel "Theme Files" → chọn **`footer.php`**
2. Trong editor, **Ctrl+A** select all → **Ctrl+C** copy
3. Mở **Notepad** (Windows) hoặc **TextEdit** (Mac) → paste → save as `footer-backup-YYYY-MM-DD.php`
4. **Quan trọng:** lưu backup trên máy local để rollback nếu cần

#### Bước 2: Replace footer content

Trong WP Theme File Editor đang mở footer.php:

1. **Tìm dòng** chứa `<footer class="sol-footer">`
2. **Tìm dòng kết thúc** `</footer>` đối tương ứng
3. **Select** toàn bộ từ `<footer class="sol-footer">` đến `</footer>`
4. **Delete**
5. **Paste** toàn bộ nội dung từ `footer-replacement.html`

**Lưu ý:** KHÔNG xoá:
- `<?php wp_footer(); ?>` (thường sau `</footer>`)
- `</body>` và `</html>` (cuối file)
- Bất kỳ `<?php ... ?>` block nào khác

#### Bước 3: Save & Test

1. Click **"Update File"** bên dưới editor
2. Mở 3 page test trong Incognito (**Ctrl+Shift+N**):
   - `https://sol.vn/` (homepage)
   - `https://sol.vn/khang-sol/` (founder)
   - Bất kỳ blog post nào, vd `https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/`
3. Footer phải hiển thị Sol V2.2 design ở tất cả 3 page

---

### ⭐⭐ Cách 2: Child Theme (an toàn nhất khi update theme)

Nếu theme có update thường xuyên, dùng child theme để tránh mất changes:

#### Bước 1: Tạo child theme

```bash
ssh sol-vps
cd /var/www/sol.vn/wp-content/themes/
sudo mkdir sol-child
cd sol-child
```

Tạo `style.css`:
```bash
sudo nano style.css
```

Paste:
```css
/*
Theme Name: Sol Child Theme
Template: PARENT_THEME_NAME
*/
```

(Thay `PARENT_THEME_NAME` bằng folder name của theme hiện tại.)

#### Bước 2: Tạo footer.php trong child theme

```bash
sudo cp /var/www/sol.vn/wp-content/themes/PARENT_THEME/footer.php ./footer.php
sudo nano footer.php
```

Thay nội dung như Cách 1 Bước 2.

#### Bước 3: Activate child theme

WP Admin → Appearance → Themes → tìm "Sol Child Theme" → Activate.

---

### ⭐⭐⭐ Cách 3: WPCode Plugin (no code edit)

Nếu anh không muốn edit theme files:

#### Bước 1: Install WPCode plugin

WP Admin → Plugins → Add New → search **"WPCode"** → Install → Activate.

#### Bước 2: Add snippet

WPCode → Code Snippets → Add New → "Add Your Custom Code"

- **Title:** Sol Global Footer
- **Code Type:** PHP Snippet
- **Insertion:** Auto Insert → "After Page Content"
- **Code:**

```php
function sol_global_footer() {
  if (!is_admin()) {
    ?>
    <!-- Sol V2.2 Footer Override -->
    <style>
      /* Hide theme footer */
      .sol-footer-inner { display: none !important; }
      footer.sol-footer:has(.sol-footer-inner) { display: none !important; }
    </style>

    <?php // Include Sol V2.2 footer HTML ?>
    <!-- Paste footer-replacement.html content here -->
  <?php }
}
add_action('wp_footer', 'sol_global_footer', 99);
```

→ Save → Activate snippet.

---

## 📋 Pre-deploy Checklist

### Trước khi edit
- [ ] Backup theme footer.php (Cách 1)
- [ ] Note theme name + folder
- [ ] Verify Customize → Additional CSS có Sol V2.2 CSS (all-in-one)
- [ ] Tạo 3 URL test trước (homepage + 1 blog + 1 page)

### Sau edit
- [ ] Test homepage `https://sol.vn/` — footer Sol mới
- [ ] Test post `https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/`
- [ ] Test page `https://sol.vn/khang-sol/`
- [ ] Test mobile (DevTools responsive mode)
- [ ] Check footer link đầy đủ (Sách + Hệ thống + huongdi)
- [ ] Check Tuyên bố miễn trừ link work

### Update CSS — Global scope

Vào Customize → Additional CSS → thay phần CSS footer (đang scope `body.home`) bằng version global:

```css
/* Replace .sol-footer styles to apply globally */
.sol-footer { ... } /* không có body.home prefix nữa */
```

(Xem file `css-footer-global.css` cho CSS full)

---

## 🔍 Verify deploy thành công

### Test 1: Homepage
URL: `https://sol.vn/`
Footer phải có: 5 cột (Brand + Sản phẩm + Tài nguyên + Về Sol + Dự án liên quan)

### Test 2: Blog post
URL: `https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/`
Footer giống Homepage (consistent)

### Test 3: Founder page
URL: `https://sol.vn/khang-sol/`
Footer giống Homepage (consistent)

### Test 4: Mobile responsive
DevTools → Device toolbar → 320px width → footer hiển thị 1 cột stack

### Test 5: Old theme footer KHÔNG còn
F12 → search HTML cho "TRỤ THÂN" → KHÔNG tìm thấy nữa (đã xoá)

---

## 🛡️ Rollback nếu lỗi

### Nếu deploy theme editor (Cách 1):

WP Admin → Theme File Editor → footer.php → paste lại nội dung từ `footer-backup-YYYY-MM-DD.php`.

### Nếu child theme (Cách 2):
WP Admin → Appearance → Themes → Activate lại parent theme.

### Nếu WPCode (Cách 3):
WPCode → tìm snippet "Sol Global Footer" → Deactivate.

→ Trong vòng 30 giây, footer cũ trở lại.

---

## ⚠️ Common issues

### Issue 1: Sau deploy, footer trùng lặp (2 footer)

**Nguyên nhân:** Quên xoá theme footer khi thêm Sol footer.

**Fix:** Mở footer.php lại → đảm bảo CHỈ có 1 `<footer class="sol-footer">` block.

### Issue 2: Footer trống không có nội dung

**Nguyên nhân:** Paste content không đầy đủ — thiếu HTML block.

**Fix:** Mở `footer-replacement.html` → copy lại toàn bộ → paste lại.

### Issue 3: Layout broken — cột không đúng vị trí

**Nguyên nhân:** CSS chưa apply global (vẫn còn `body.home` prefix).

**Fix:** Vào Customize → Additional CSS → thay phần footer CSS theo `css-footer-global.css`.

### Issue 4: Tuyên bố miễn trừ + Hotline 115 cần giữ

**Nguyên nhân:** Theme footer cũ có khẩn cấp 115 + cảnh báo Y khoa/Tâm thần — user (đặc biệt YMYL pages) có thể cần.

**Fix:** Add lại section "Thông tin khẩn cấp" vào Sol V2.2 footer:

```html
<!-- Sau .sol-footer__bottom, trước </footer> -->
<div class="sol-footer__emergency">
  <h4>🚨 Thông tin khẩn cấp</h4>
  <ul>
    <li>Cấp cứu y tế → <a href="tel:115">115</a></li>
    <li>Khủng hoảng tâm lý → <a href="tel:1900599958">1900 599958</a></li>
  </ul>
</div>
```

→ Mình có thể tạo file footer-with-emergency.html nếu anh muốn giữ block này.

---

## 🎯 Khuyến nghị

### Cho Khang (không phải dev):
→ **Cách 1 (WP Theme Editor)** — đơn giản nhất, 10 phút xong.

### Cho lâu dài (theme update):
→ **Cách 2 (Child theme)** — an toàn nhất.

### Cho dev muốn modular:
→ **Cách 3 (WPCode plugin)** — không touch theme files.

---

## ✅ Quyết định trước khi deploy

1. **Có giữ block "Thông tin khẩn cấp" (115, hotline tâm lý) không?**
   - YES → Mình tạo `footer-with-emergency.html`
   - NO → Dùng `footer-replacement.html` standard

2. **Có giữ pillar nav "TRỤ THÂN/TÂM/TRÍ" trong footer không?**
   - YES (cohesion) → giữ trong Sol V2.2 footer
   - NO (focus sách + huongdi) → dùng nguyên Sol V2.2 footer như đã làm

3. **Có giữ 4 đoạn cảnh báo Y khoa/Tâm thần/Tài chính không?**
   - YES (YMYL compliance) → add vào Sol V2.2 footer
   - NO → đã có Tuyên bố miễn trừ link

→ Recommend: **GIỮ khẩn cấp + cảnh báo YMYL** (compliance + trust). **BỎ pillar nav** (focus brand mới).

Anh quyết định 3 câu này → mình tạo `footer-replacement.html` final.

---

*Đi cùng nhau, đường dài đỡ mỏi — kể cả khi đọc blog hay xem footer.*
</thinking>