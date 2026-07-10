# Deploy Footer Quiz CTA — Phase 1

**Đích:** Thêm "Kiểm tra 3 phút" vào footer TRƯỚC khi bỏ khỏi menu chính.

**Strategy:** Footer-first (safe). Nếu OK → phase 2 update menu. Nếu miss link → user vẫn access qua footer.

---

## 📍 Vị trí Footer

**huongdi.sol.vn:**
- File chính: `/var/www/huongdi/public/js/sol-ui.js` (nếu footer render qua JS)
- Hoặc: static footer trong `/var/www/huongdi/public/*/index.html` (nếu inline)

**sol.vn (WordPress cPanel):**
- File chính: `/public_html/wp-content/mu-plugins/sol-default-template.php`
- Có thể: `sol-post-template.php`, `sol-archive-template.php`, `sol-landing-template-v3.php`

---

## 🔧 Bước 1: Locate footer hiện tại

### huongdi.sol.vn

```bash
ssh sol-vps
grep -l "footer\|Công cụ\|Sản phẩm" /var/www/huongdi/public/js/sol-ui.js
grep -n "kham-pha-nhanh\|quiz\|Kiểm tra" /var/www/huongdi/public/js/sol-ui.js
```

### sol.vn

Trong cPanel File Manager → `/public_html/wp-content/mu-plugins/`:
- Right-click `sol-default-template.php` → Edit
- Ctrl+F tìm `footer` → xem section hiện tại

---

## 🎨 HTML Snippet — Paste vào Footer

**Vị trí paste:** Trong section "Công cụ" / "Sản phẩm" / "Miễn phí" của footer (không tạo section mới).

### Version A — Compact (recommended)

```html
<!-- Add vào section "Công cụ miễn phí" hiện có, TRÊN các link khác -->
<a href="/kham-pha-nhanh/" class="footer-link">
  🎯 Kiểm tra 3 phút <span class="badge-new">Quiz</span>
</a>
```

Kèm CSS badge nếu chưa có:
```css
.badge-new {
  display: inline-block;
  padding: 1px 6px;
  background: #FEF3C7;
  color: #B45309;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin-left: 4px;
}
```

### Version B — Section riêng "Công cụ miễn phí"

Nếu footer chưa có section này, tạo mới:

```html
<div class="footer-section">
  <h4 class="footer-section__title">Công cụ miễn phí</h4>
  <ul class="footer-links">
    <li><a href="/kham-pha-nhanh/">🎯 Kiểm tra 3 phút — Quiz gợi ý mô hình</a></li>
    <li><a href="/thau-hieu/">🧭 Sol La Bàn Bước 1 — Thấu hiểu DNA</a></li>
    <li><a href="/ai-studio/">🎨 AI Studio — 40 prompt + Sol AI</a></li>
    <li><a href="/prompts/">📚 Prompt Library</a></li>
  </ul>
</div>
```

---

## 🚀 Deploy huongdi.sol.vn Footer (case: footer trong sol-ui.js)

### Bước 1: Backup

```bash
ssh sol-vps
sudo cp /var/www/huongdi/public/js/sol-ui.js /var/www/huongdi/public/js/sol-ui.js.bak-$(date +%s)
```

### Bước 2: Edit sol-ui.js

Anh chọn cách sửa:

**Cách A — Manual edit (recommended nếu file dài):**
```bash
sudo nano /var/www/huongdi/public/js/sol-ui.js
# Ctrl+_ → nhập line số section "Công cụ" hoặc "Miễn phí"
# Paste HTML snippet A vào đầu list
# Ctrl+O → Enter → Ctrl+X
```

**Cách B — Ship em file mới:**
Anh gửi em nội dung sol-ui.js hiện tại (`cat /var/www/huongdi/public/js/sol-ui.js`) → em patch chính xác + ship file mới → anh upload.

### Bước 3: Reload

Static file → chỉ cần Ctrl+F5 browser.

---

## 🚀 Deploy sol.vn Footer (WordPress)

### Bước 1: Backup templates

Trong cPanel File Manager:
1. Right-click `sol-default-template.php` → Copy
2. Rename copy thành `sol-default-template.php.bak-2026-07-06`

### Bước 2: Edit template

1. Edit `sol-default-template.php`
2. Ctrl+F tìm section footer (thường có `class="footer"` hoặc `<footer>`)
3. Paste snippet HTML vào section "Công cụ" phù hợp
4. Save

### Bước 3: Verify

- Purge LiteSpeed cache
- Hard refresh sol.vn

---

## ✅ Verify sau deploy

**Footer huongdi.sol.vn:**
```
https://huongdi.sol.vn/  → scroll xuống footer
Expected: "🎯 Kiểm tra 3 phút" link trong Công cụ miễn phí
```

**Footer sol.vn:**
```
https://sol.vn/  → scroll xuống footer
Expected: Same
```

**Test click:**
```
Click "Kiểm tra 3 phút" → redirect /kham-pha-nhanh/ → Quiz page render
```

---

## 🔄 Phase 2 (session sau) — Bỏ khỏi menu chính

Sau khi Footer stable 1-2 ngày:

**Files cần update:**
1. `sol-ui.js` header nav (huongdi.sol.vn)
2. `sol-default-template.php` nav (sol.vn)
3. `sol-post-template.php` nav
4. `sol-archive-template.php` nav
5. `sol-landing-template-v3.php` nav

**Search-replace:**
```
Search: <a href="/kham-pha-nhanh/">🎯 Kiểm tra 3 phút</a>
Replace: (xóa hoàn toàn)
```

Hoặc:
```
Search: <a href="/kham-pha-nhanh/">🎯 Kiểm tra 3 phút MỚI</a>
Replace: (xóa)
```

Chú ý: Có 2-3 variations (có/không "MỚI" badge). Search rộng.

---

## 📋 Anh làm 3 việc

### 1. Locate footer hiện tại

Gửi em kết quả:
```bash
ssh sol-vps
head -5 /var/www/huongdi/public/js/sol-ui.js
grep -A 3 "footer\|Công cụ" /var/www/huongdi/public/js/sol-ui.js | head -30
```

Hoặc cat toàn bộ file `/var/www/huongdi/public/js/sol-ui.js` (nếu ngắn).

### 2. Chụp screenshot footer hiện tại

`https://huongdi.sol.vn/` → scroll bottom → screenshot footer. Em xem layout để paste đúng chỗ.

### 3. Confirm approach

- Version A (add 1 link vào section hiện có) — nhanh
- Version B (tạo section mới "Công cụ miễn phí") — clean hơn

Từ 3 info trên, em ship patched file chính xác cho anh upload.
