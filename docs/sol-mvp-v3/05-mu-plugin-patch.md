# Mu-Plugin Patch V3.1 — Update Header + Footer cho trang con đồng nhất với Homepage V3

*Áp dụng cho 2 file: `sol-default-template.php` (pages) + `sol-post-template.php` (posts + CPTs)*

**Phương pháp:** Find/Replace 4 block code — KHÔNG cần rewrite toàn file. Risk thấp, rollback dễ.

---

## 🛡️ Bước 0 — Backup trước (BẮT BUỘC)

cPanel File Manager → `/public_html/wp-content/mu-plugins/`

1. Right-click `sol-default-template.php` → **Copy** → đổi tên backup `sol-default-template.php.bak-2026-06-30`
2. Right-click `sol-post-template.php` → **Copy** → đổi tên backup `sol-post-template.php.bak-2026-06-30`

→ Nếu lỗi sau update: Delete file mới + Rename `.bak` về tên gốc → recovery.

---

## 📝 PATCH 1 — Header nav (áp dụng cho CẢ 2 file)

### FIND (block cũ):

```html
<header class="sol-header" role="banner">
  <div class="sol-header__inner">
    <a href="https://sol.vn/" class="sol-logo">
      <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol" width="36" height="36">
      <span>Đi Cùng <strong>Sol</strong></span>
    </a>
    <nav class="sol-nav-main" aria-label="Menu chính">
      <a href="/sach/" class="sol-nav__featured">📘 Sách</a>
      <a href="https://huongdi.sol.vn/">Hệ thống</a>
      <a href="/huong-di/">Bài viết</a>
      <a href="/khang-sol/">Khang Sol</a>
    </nav>
    <a href="/sach/tai-khoi-nghiep-dung-huong/" class="sol-cta-header">Đặt sách →</a>
  </div>
</header>
```

### REPLACE (block mới — V3 Sol La Bàn):

```html
<header class="sol-header" role="banner">
  <div class="sol-header__inner">
    <a href="https://sol.vn/" class="sol-logo">
      <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol" width="36" height="36">
      <span>Đi Cùng <strong>Sol</strong></span>
    </a>
    <nav class="sol-nav-main" aria-label="Menu chính">
      <a href="/sach/tai-khoi-nghiep-dung-huong/" class="sol-nav__featured">📖 Sách</a>
      <a href="https://huongdi.sol.vn/">🧭 Sol La Bàn</a>
      <a href="/huong-di/">✍️ Bài viết</a>
      <a href="/khang-sol/">👤 Khang Sol</a>
    </nav>
    <a href="https://huongdi.sol.vn/thau-hieu/" class="sol-cta-header">Bắt đầu miễn phí →</a>
  </div>
</header>
```

**Thay đổi:**
- "Hệ thống" → "🧭 Sol La Bàn" (brand mới)
- "Bài viết" → "✍️ Bài viết" (icon)
- "Khang Sol" → "👤 Khang Sol" (icon)
- CTA "Đặt sách →" → "Bắt đầu miễn phí →" (link huongdi.sol.vn/thau-hieu/)
- Sách link → trỏ thẳng tới book V2 page

---

## 📝 PATCH 2 — Footer brand-pitch (cột 1)

### FIND:

```html
        <p class="sol-footer__brand-pitch">
          Sách <strong>"Tái Khởi Nghiệp Đúng Hướng"</strong> + Hệ thống <strong>huongdi.sol.vn</strong> dành riêng cho đàn ông Việt 40-65.
        </p>
```

### REPLACE:

```html
        <p class="sol-footer__brand-pitch">
          Hệ thống <strong>Sol La Bàn</strong> + Sách <strong>"Tái Khởi Nghiệp Đúng Hướng"</strong> — 5 Bước Sol La Bàn cho người 40-60 tái khởi nghiệp đúng hướng.
        </p>
```

**Thay đổi:** Đẩy "Sol La Bàn" lên TRƯỚC (sản phẩm trọng tâm), cập nhật tuổi 40-60, thêm "5 Bước Sol La Bàn".

---

## 📝 PATCH 3 — Footer cột "Sản phẩm"

### FIND:

```html
      <div class="sol-footer__col">
        <h4>Sản phẩm</h4>
        <ul>
          <li><a href="/sach/tai-khoi-nghiep-dung-huong/">📘 Sách "Tái Khởi Nghiệp Đúng Hướng"</a></li>
          <li><a href="https://huongdi.sol.vn/">🎯 Hệ thống huongdi.sol.vn</a></li>
          <li><a href="https://huongdi.sol.vn/kham-pha-ban-than/">Khám phá bản thân (P1)</a></li>
          <li><a href="https://huongdi.sol.vn/kiem-ke-nguon-luc/">Kiểm kê nguồn lực (P2)</a></li>
          <li><a href="https://huongdi.sol.vn/la-ban-huong-di/">La bàn hướng đi (P3)</a></li>
        </ul>
      </div>
```

### REPLACE:

```html
      <div class="sol-footer__col">
        <h4>Sản phẩm</h4>
        <ul>
          <li><a href="https://huongdi.sol.vn/">🧭 Sol La Bàn</a></li>
          <li><a href="https://huongdi.sol.vn/thau-hieu/">Bước 1 · Thấu hiểu</a></li>
          <li><a href="https://huongdi.sol.vn/khai-pha/">Bước 2 · Khai phá</a></li>
          <li><a href="https://huongdi.sol.vn/chon-huong/">Bước 3 · Chọn hướng</a></li>
          <li><a href="https://huongdi.sol.vn/active/">💎 Active 499k</a></li>
          <li><a href="/sach/tai-khoi-nghiep-dung-huong/">📖 Sách miễn phí</a></li>
        </ul>
      </div>
```

**Thay đổi:**
- "Hệ thống huongdi.sol.vn" → "🧭 Sol La Bàn"
- P1/P2/P3 → Việt hóa Bước 1/2/3 với URLs mới (`/thau-hieu/`, `/khai-pha/`, `/chon-huong/`)
- Thêm "💎 Active 499k" để promote pricing tier
- Sách xuống cuối (nhường ưu tiên cho Sol La Bàn)

---

## 📝 PATCH 4 — Footer cột "Liên kết" → "Cộng đồng"

### FIND:

```html
      <div class="sol-footer__col">
        <h4>Liên kết</h4>
        <ul>
          <li><a href="mailto:contact@sol.vn">📧 contact@sol.vn</a></li>
          <li><a href="tel:02439931800">📞 024 3993 1800</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook Khang</a></li>
        </ul>
      </div>
```

### REPLACE:

```html
      <div class="sol-footer__col">
        <h4>Cộng đồng</h4>
        <ul>
          <li><a href="https://www.facebook.com/groups/dicungsol/" target="_blank" rel="noopener">👥 FB Group "Đi Cùng Sol"</a></li>
          <li><a href="#" target="_blank" rel="noopener">💬 Zalo Group</a></li>
          <li><a href="mailto:hello@sol.vn">📧 hello@sol.vn</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook Khang</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
        </ul>
      </div>
```

**Thay đổi:**
- Đổi tên cột "Liên kết" → "Cộng đồng" (đúng vai trò phễu top-of-funnel)
- Đẩy FB Group "Đi Cùng Sol" lên đầu (priority cao nhất)
- Thêm Zalo Group
- Bỏ phone (không cần thiết, có email)

---

## 🚀 Hướng dẫn áp dụng patch

### Cho file `sol-default-template.php` (Pages):

1. cPanel File Manager → `/public_html/wp-content/mu-plugins/`
2. Right-click `sol-default-template.php` → **Edit** (Code Editor)
3. Ctrl+F để search → tìm chuỗi `<header class="sol-header" role="banner">` → áp dụng **PATCH 1**
4. Search `sol-footer__brand-pitch` → áp dụng **PATCH 2**
5. Search `<h4>Sản phẩm</h4>` → áp dụng **PATCH 3**
6. Search `<h4>Liên kết</h4>` → áp dụng **PATCH 4**
7. **Save Changes**

### Cho file `sol-post-template.php` (Posts + CPTs `huong-di`, `ngam`):

Lặp lại 4 patch tương tự (file có cấu trúc giống nhau).

### Test sau khi save (đợi 60s cho opcache clear):

Mở Incognito:
- **https://sol.vn/khang-sol/** → header mới (Sol La Bàn) + footer mới
- **https://sol.vn/sol-la-gi/** → header mới + footer mới
- **https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/** → header mới + footer mới (CPT)
- **https://sol.vn/tuyen-bo-mien-tru/** → header mới + footer mới

→ 4 URL trên phải có header + footer **GIỐNG HỆT** Homepage V3 (Sol La Bàn brand).

---

## 🛡️ Rollback nếu lỗi

Nếu sau patch có lỗi PHP / page broken:

1. cPanel File Manager → `/public_html/wp-content/mu-plugins/`
2. Delete file lỗi (vd `sol-default-template.php`)
3. Rename backup `.bak-2026-06-30` → tên gốc (`sol-default-template.php`)
4. Wait 60s → site về v3 cũ

---

## ✅ Checklist sau khi patch xong

- [ ] Backup 2 file `.bak` đã tồn tại trong mu-plugins
- [ ] PATCH 1+2+3+4 applied cho `sol-default-template.php`
- [ ] PATCH 1+2+3+4 applied cho `sol-post-template.php`
- [ ] Test 4 URL trên Incognito → đồng nhất với homepage V3
- [ ] Mobile responsive OK (resize < 768px)
- [ ] Nav links click test (Sol La Bàn → huongdi.sol.vn)
- [ ] CTA "Bắt đầu miễn phí" → huongdi.sol.vn/thau-hieu/
- [ ] Footer FB Group link → facebook.com/groups/dicungsol

→ Tất cả pass → header/footer đồng nhất toàn ecosystem sol.vn.

---

*Đúng hướng. Đúng bước. Đúng tương lai.*
