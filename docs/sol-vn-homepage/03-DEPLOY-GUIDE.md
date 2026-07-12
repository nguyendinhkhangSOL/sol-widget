# Sol.vn Homepage — Deploy Guide

3 cách deploy, ưu tiên cách đơn giản nhất.

---

## ⭐ METHOD 1 — WP Custom HTML Block (Recommend, 30 phút)

**Đối tượng:** Khang tự làm, không cần dev.

### Bước 1: Backup homepage hiện tại

Vào WP Admin → Settings → Reading → Note xuống current homepage page name.

```
✓ Screenshot trang chủ hiện tại
✓ Nếu homepage là static page → ghi nhớ Page ID
✓ Nếu là "Latest posts" → ghi nhớ để rollback
```

### Bước 2: Upload CSS file lên server

**Cách A (qua FTP/cPanel/SCP):**

```bash
# Trên máy local
scp C:\BOTHUOCLA\sol-widget\docs\sol-vn-homepage\css\sol-homepage.css sol-vps:/tmp/

# Trên VPS (qua ssh)
ssh sol-vps "sudo cp /tmp/sol-homepage.css /var/www/sol.vn/htdocs/wp-content/themes/{TÊN-THEME}/assets/css/sol-homepage.css"

# Set permission
ssh sol-vps "sudo chown www-data:www-data /var/www/sol.vn/htdocs/wp-content/themes/{TÊN-THEME}/assets/css/sol-homepage.css"
```

→ Anh cần biết:
- Path WP root: thường `/var/www/sol.vn/htdocs/` hoặc `/var/www/sol.vn/`
- Theme name hiện tại

Chạy lệnh sau để biết:
```bash
ssh sol-vps "ls -la /var/www/sol.vn/ 2>/dev/null || find /var/www -name 'wp-config.php' 2>/dev/null | head -5"
```

**Cách B (qua WP Admin file uploader — không cần SSH):**

Vào WP Admin → Media Library → Upload `sol-homepage.css`
→ Note URL file (vd: `https://sol.vn/wp-content/uploads/2026/sol-homepage.css`)

### Bước 3: Thêm CSS vào theme Customizer

WP Admin → Appearance → Customize → **Additional CSS**

Paste toàn bộ nội dung `css/sol-homepage.css` vào đây.

→ Save Changes.

**Tip:** Nếu file quá lớn (32KB), thay vì paste, dùng `@import` từ Step 2:

```css
@import url('https://sol.vn/wp-content/uploads/2026/sol-homepage.css');
```

### Bước 4: Tạo Page mới với HTML

WP Admin → Pages → **Add New**

- **Title:** "Trang chủ" (sẽ ẩn trong layout)
- **Permalink slug:** `trang-chu` hoặc giữ blank (sẽ thay bằng `/`)
- **Template (Page Attributes):** Chọn **"Full Width"** hoặc **"Canvas"** (KHÔNG có theme header/footer)

→ Trong nội dung:
- Click "+" → tìm block **"Custom HTML"**
- Paste **toàn bộ nội dung body** (từ `<header class="sol-header">` đến cuối `</footer>`)
- File copy: `index-body-only.html` (mình sẽ tạo)

→ Click **Publish**.

### Bước 5: Set Page làm Homepage

WP Admin → Settings → Reading:
- Your homepage displays: **A static page**
- Homepage: chọn page "Trang chủ" vừa tạo
- Posts page: (giữ nguyên hoặc bỏ trống)

→ Save Changes.

### Bước 6: Test + Verify

Mở browser **Ctrl + Shift + N** (Incognito) → vào https://sol.vn/

Cần thấy:
- ✓ Header với logo Sol + nav 3 trụ
- ✓ Hero gradient + pulse badge
- ✓ Trust bar (3/37/20+/50+)
- ✓ 3 trụ cards (Trí featured)
- ✓ Section sách với 3D cover
- ✓ Footer 5 cột

Nếu **layout bị broken** → CSS chưa load. Check:
- F12 → Network tab → tìm `sol-homepage.css` → phải 200 OK
- Nếu 404 → CSS path sai, cần fix
- Nếu CSS OK nhưng vẫn broken → có conflict với theme, cần `!important`

---

## ⭐⭐ METHOD 2 — Custom Page Template (Recommend cho long-term, 2 giờ)

**Đối tượng:** Dev access SSH, cần WP-native page editable.

### Bước 1: Tạo file template trong theme

SSH vào VPS:
```bash
ssh sol-vps
cd /var/www/sol.vn/htdocs/wp-content/themes/{TÊN-THEME}/
sudo nano page-sol-homepage.php
```

Paste nội dung sau (đầu file):

```php
<?php
/**
 * Template Name: Sol Homepage
 * Description: Homepage đặc biệt cho Sol ecosystem
 */

// KHÔNG include get_header() — chúng ta tự define
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php wp_head(); ?>
  <link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/assets/css/sol-homepage.css">
</head>
<body <?php body_class(); ?>>

<?php
// PASTE toàn bộ body content từ index-body-only.html vào đây
?>

<!-- ... [body HTML content] ... -->

<?php wp_footer(); ?>
</body>
</html>
```

### Bước 2: Upload CSS

```bash
sudo mkdir -p assets/css
sudo cp /tmp/sol-homepage.css assets/css/sol-homepage.css
sudo chown -R www-data:www-data assets/
```

### Bước 3: Tạo Page với template

WP Admin → Pages → Add New:
- Title: "Sol Homepage"
- Page Attributes → Template: **Sol Homepage** (template mới vừa tạo)
- Publish

### Bước 4: Set as Homepage

Settings → Reading → Static page → chọn "Sol Homepage".

---

## ⭐⭐⭐ METHOD 3 — Static HTML Override (Advanced, 1 giờ)

**Đối tượng:** Anh ưu tiên performance, không cần WP edit homepage qua admin.

### Bước 1: Upload toàn bộ files

```bash
# Trên máy local
scp -r C:\BOTHUOCLA\sol-widget\docs\sol-vn-homepage\index.html sol-vps:/tmp/sol-index.html
scp -r C:\BOTHUOCLA\sol-widget\docs\sol-vn-homepage\css sol-vps:/tmp/sol-css

# Trên VPS
ssh sol-vps "sudo cp /tmp/sol-index.html /var/www/sol.vn/htdocs/index.html && sudo cp -r /tmp/sol-css /var/www/sol.vn/htdocs/css && sudo chown -R www-data:www-data /var/www/sol.vn/htdocs/index.html /var/www/sol.vn/htdocs/css"
```

### Bước 2: Update Nginx config — serve index.html trước WordPress

```nginx
# /etc/nginx/sites-available/sol.vn

location = / {
    try_files /index.html @wordpress;
}

location @wordpress {
    try_files $uri $uri/ /index.php?$args;
}

# Existing WP config khác giữ nguyên
location / {
    try_files $uri $uri/ /index.php?$args;
}
```

### Bước 3: Reload nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Bước 4: Test

`curl -I https://sol.vn/` → phải 200 OK + Content-Type: text/html

→ **Warning:** Method này tách homepage khỏi WordPress hoàn toàn. KHÔNG update qua WP admin được. Nếu muốn đổi text → phải edit file `/var/www/sol.vn/htdocs/index.html` trực tiếp.

---

## ⚠️ Common Issues + Fix

### Issue 1: CSS không load (broken layout)

**Symptoms:** Hero text không có gradient, layout dồn cục.

**Fix:**
```bash
# Check CSS accessible
curl -I https://sol.vn/wp-content/uploads/2026/sol-homepage.css

# Hoặc theme path
curl -I https://sol.vn/wp-content/themes/{theme}/assets/css/sol-homepage.css
```

Nếu 404 → path sai. Update `<link rel="stylesheet" href="...">` trong HTML.

### Issue 2: Theme header/footer vẫn hiện

**Symptoms:** Layout có header WP cũ + Sol header → double header.

**Fix:** Khi tạo Page, chọn template **"Blank"** / **"Full Width"** / **"Canvas"**. Nếu theme không có → cần create custom template (Method 2).

### Issue 3: Fonts không load (text rendering xấu)

**Symptoms:** Vietnamese diacritics broken, font không đẹp.

**Fix:** Đảm bảo Google Fonts được load. Check trong HTML có:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,500;1,500&display=swap" rel="stylesheet">
```

### Issue 4: 3D book cover trông không như mock-up

**Symptoms:** Cover hiện là rectangle solid gradient.

**Fix:** Thay thế CSS-only cover bằng image thật:

```html
<!-- Thay vì .sol-book__cover -->
<img src="https://sol.vn/wp-content/uploads/2026/book-cover-3d.png"
     alt="Tái Khởi Nghiệp Đúng Hướng"
     width="300" height="420">
```

→ Cần tạo image 3D mock-up qua Canva/Photoshop.

### Issue 5: Conflict với theme stylesheet

**Symptoms:** Một số style bị theme override.

**Fix:** Add `!important` cho rule quan trọng:

```css
.sol-hero__title { font-size: clamp(2rem, 5vw, 4rem) !important; }
```

Hoặc inject CSS sau theme CSS bằng `wp_enqueue_style` với priority cao.

---

## 📋 Pre-deploy Checklist

### Content review (Khang approval)
- [ ] Hero copy đã review
- [ ] Trust số liệu (3/37/20+/50+) đúng
- [ ] 3 trụ description chính xác
- [ ] Book price 249k confirm
- [ ] Founder bio chuẩn (Sáng lập + GĐ CTY CNTT 20 năm + DN TMĐT 8 năm)

### Technical
- [ ] CSS upload OK + accessible
- [ ] HTML paste vào page mới (chưa publish)
- [ ] Template "Full Width" / "Blank" được chọn
- [ ] Test trên Preview trước khi publish
- [ ] Mobile responsive test (DevTools → mobile view)
- [ ] Tất cả CTAs link đến URL đúng

### Image assets cần có
- [ ] `https://sol.vn/wp-content/uploads/2025/05/Icon_2.png` (Sol logo) — đã có
- [ ] `https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg` — đã có
- [ ] Book cover 3D mock-up — **CHƯA CÓ, cần tạo**
- [ ] OG image 1200×630 — **CHƯA CÓ, cần tạo**

### After publish
- [ ] Submit URL `/` vào GSC để index
- [ ] Test tất cả CTAs click đúng
- [ ] Set up GA4 conversion events
- [ ] Update internal links từ /huong-di/, /khang-sol/ → /

---

## 🚀 Recommend Path cho Khang

**Mình recommend Method 1 (Custom HTML block) vì:**

✓ Đơn giản nhất — 30 phút deploy
✓ Không cần SSH technical
✓ Editable qua WP admin sau này
✓ Có thể rollback dễ (chỉ đổi homepage setting)
✓ Đủ tốt cho Year 1

**Khi nào nâng cấp lên Method 2/3?**
- Method 1 chậm (>3s page load) → Method 2 với enqueue tốt hơn
- Cần SEO siêu performance → Method 3 (static HTML)
- Có dev team → Method 2 với template file pro

---

## 📦 Files cần ready trước khi deploy

| File | Status |
|---|---|
| `index.html` (700 lines) | ✅ Đã có |
| `index-body-only.html` (chỉ body, không có `<html>`) | ⏳ Mình tạo tiếp |
| `css/sol-homepage.css` (800 lines) | ✅ Đã có |
| Book cover 3D mock-up | ❌ Cần tạo (Canva $0 hoặc Fiverr $30) |
| OG image 1200×630 | ❌ Cần tạo |

---

## 🎯 Suggest deploy steps cụ thể cho Khang HÔM NAY

### Step 1: Mình tạo `index-body-only.html`
File chỉ chứa nội dung từ `<header>` đến `</footer>` để anh paste vào Custom HTML block.

### Step 2: Anh thực hiện
1. Vào WP Admin → Add New Page → "Sol Homepage"
2. Chọn template "Full Width" (theme đang dùng có không?)
3. Paste body HTML vào Custom HTML block
4. Vào Customize → Additional CSS → paste `sol-homepage.css`
5. Settings → Reading → Static page → "Sol Homepage"
6. Mở Incognito → test https://sol.vn/

### Step 3: Mình hướng dẫn fix bugs
Nếu layout broken → mình debug + sửa CSS

### Step 4: Khang tạo image assets
- Book cover 3D (Canva tutorial: search "ebook 3d mockup canva")
- OG image (Canva template)

### Step 5: Polish + GSC
- Update image assets vào HTML
- Submit GSC `https://sol.vn/`
- Setup GA4 events

---

*Total time deploy Method 1: 30-60 phút.*
*Đi cùng nhau, đường dài đỡ mỏi.*
