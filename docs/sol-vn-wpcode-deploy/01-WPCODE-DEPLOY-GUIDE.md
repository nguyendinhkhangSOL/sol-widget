# Sol V2.2 Global Header + Footer — Deploy qua WPCode Plugin

**Tại sao dùng WPCode:** Sol.vn ở hosting khác sol-vps, không SSH được. Theme File Editor bị disable. → WPCode = giải pháp dễ + an toàn nhất.

---

## 📋 Tổng quan

Plugin **WPCode** (formerly "Insert Headers and Footers Code") cho phép:
- Inject PHP/HTML/CSS code vào WordPress qua hooks
- Không cần edit theme files (giữ nguyên khi theme update)
- GUI dễ dùng — không cần SSH/FTP
- Free version đủ dùng cho Sol

---

## 🚀 Deploy — 5 bước (15 phút)

### Bước 1: Install WPCode plugin

1. WP Admin → **Plugins → Add New**
2. Search box gõ: **"WPCode"**
3. Tìm plugin **"WPCode – Insert Headers and Footers + Custom Code Snippets"** (by WPCode)
4. Click **Install Now** → **Activate**

→ Sau activate, menu mới "**Code Snippets**" xuất hiện ở sidebar trái.

### Bước 2: Snippet 1 — Inject Sol Header vào top of body

WP Admin → **Code Snippets → + Add Snippet → Add Your Custom Code (New Snippet)**

Config:
- **Title:** `Sol V2.2 Global Header`
- **Code Type:** chọn **`PHP Snippet`**
- **Insertion Method:** **`Auto Insert`**
- **Location:** **`Site Wide Header`** → ❌ KHÔNG đúng
  → Đúng phải là: **`Site Wide Body`** → **`Body Open`** (chèn ngay sau `<body>`)

Trong code editor, paste:

```php
<?php if (!is_admin()): ?>
<header class="sol-header" role="banner">
  <div class="sol-container sol-header__inner">

    <a href="/" class="sol-logo" aria-label="Đi Cùng Sol — Trang chủ">
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
<?php endif; ?>
```

→ Toggle **"Active"** ở top right → **Save Snippet**.

### Bước 3: Snippet 2 — Inject Sol Footer vào trước `</body>`

WP Admin → **Code Snippets → + Add Snippet**:

- **Title:** `Sol V2.2 Global Footer`
- **Code Type:** **`PHP Snippet`**
- **Insertion:** **`Auto Insert`** → **`Site Wide Footer`** (chèn trước `</body>`)

Paste:

```php
<?php if (!is_admin()): ?>
<footer class="sol-footer" role="contentinfo">
  <div class="sol-container">

    <div class="sol-footer__grid">

      <div class="sol-footer__brand-col">
        <a href="/" class="sol-footer__brand">
          <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol" width="40" height="40">
          <strong>Đi Cùng Sol</strong>
        </a>
        <p class="sol-footer__motto">Đi cùng nhau,<br>đường dài đỡ mỏi.</p>
        <p class="sol-footer__brand-pitch">
          Sách <strong>"Tái Khởi Nghiệp Đúng Hướng"</strong> + Hệ thống <strong>huongdi.sol.vn</strong> dành riêng cho đàn ông Việt 40-65.
        </p>
      </div>

      <div class="sol-footer__col">
        <h4>Sản phẩm</h4>
        <ul>
          <li><a href="/sach/tai-khoi-nghiep-dung-huong/">📘 Sách "Tái Khởi Nghiệp Đúng Hướng"</a></li>
          <li><a href="https://huongdi.sol.vn/">🎯 Hệ thống huongdi.sol.vn</a></li>
          <li><a href="https://huongdi.sol.vn/kham-pha-ban-than/">P1 Discover™</a></li>
          <li><a href="https://huongdi.sol.vn/kiem-ke-nguon-luc/">P2 Resources™</a></li>
          <li><a href="https://huongdi.sol.vn/la-ban-huong-di/">P3 Navigator™</a></li>
        </ul>
      </div>

      <div class="sol-footer__col">
        <h4>Tài nguyên miễn phí</h4>
        <ul>
          <li><a href="/huong-di/">📝 Bài viết Hướng Đi</a></li>
          <li><a href="/ngam/">🧘 Bài viết Chiêm nghiệm</a></li>
          <li><a href="/category/wiki-bo-thuoc-la/">🌿 Bài viết Bỏ thuốc lá</a></li>
          <li><a href="#newsletter">📧 Bản tin Sol Cuối Tuần</a></li>
          <li><a href="/podcast/">🎙 Podcast (sắp có)</a></li>
        </ul>
      </div>

      <div class="sol-footer__col">
        <h4>Về Sol</h4>
        <ul>
          <li><a href="/khang-sol/">Khang Sol — Người sáng lập</a></li>
          <li><a href="/sol-la-gi/">Sol Là Gì?</a></li>
          <li><a href="/ve-sol/">Về dự án Sol</a></li>
          <li><a href="/cau-hoi/">21 câu hỏi thường gặp</a></li>
          <li><a href="/cong-dong/">Cộng đồng Sol</a></li>
        </ul>
      </div>

      <div class="sol-footer__col">
        <h4>Dự án liên quan</h4>
        <ul>
          <li><a href="https://bothuocla.sol.vn/" rel="noopener" target="_blank">🌿 bothuocla.sol.vn</a><br><small>Dự án cộng đồng bỏ thuốc — miễn phí</small></li>
          <li style="margin-top:14px;"><a href="mailto:contact@sol.vn">📧 contact@sol.vn</a></li>
          <li><a href="tel:02439931800">📞 024 3993 1800</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook Khang</a></li>
        </ul>
      </div>

    </div>

    <div class="sol-footer__emergency">
      <div class="sol-footer__emergency-title">🚨 Thông tin khẩn cấp</div>
      <div class="sol-footer__emergency-grid">
        <div class="sol-footer__emergency-item">
          <span class="sol-footer__tag sol-footer__tag--than">🌿 Thân</span>
          Cấp cứu y tế → <a href="tel:115" class="sol-footer__emergency-tel">115</a>
        </div>
        <div class="sol-footer__emergency-item">
          <span class="sol-footer__tag sol-footer__tag--than">🌿 Thân</span>
          Cai thuốc BV Bạch Mai → <a href="tel:0888008866">0888-008-866</a>
        </div>
        <div class="sol-footer__emergency-item">
          <span class="sol-footer__tag sol-footer__tag--tam">🧘 Tâm</span>
          Khủng hoảng tâm lý → Ngày Mai <a href="tel:1900599958" class="sol-footer__emergency-tel">1900 599958</a>
        </div>
        <div class="sol-footer__emergency-item">
          <span class="sol-footer__tag sol-footer__tag--tri">🎯 Trí</span>
          Hỗ trợ DN → <a href="https://startup.gov.vn" target="_blank" rel="noopener">startup.gov.vn</a>
        </div>
      </div>
    </div>

    <div class="sol-footer__disclaimer">
      <p><strong>Sol là dự án cá nhân của Khang Sol (Nguyễn Đình Khang).</strong> Sol KHÔNG kê đơn y khoa, KHÔNG điều trị tâm lý, KHÔNG cam kết thu nhập kinh doanh.</p>
      <p><span class="sol-footer__warn sol-footer__warn--than">⚠️ Thân (Y khoa):</span> Khang Sol KHÔNG phải bác sĩ. Triệu chứng nặng → gọi 115 hoặc khám bác sĩ chuyên khoa hô hấp.</p>
      <p><span class="sol-footer__warn sol-footer__warn--tam">⚠️ Tâm (Tinh thần):</span> Sol KHÔNG phải nhà trị liệu tâm lý có giấy phép. Trầm cảm, lo âu nặng, ý nghĩ tự hại → gọi Ngày Mai 1900 599958 hoặc đến BV chuyên khoa tâm thần kinh.</p>
      <p><span class="sol-footer__warn sol-footer__warn--tri">⚠️ Trí (Tài chính):</span> Khang Sol KHÔNG phải nhà tư vấn tài chính có giấy phép. Sol KHÔNG cam kết thu nhập. Tham vấn chuyên gia tài chính, luật sư, kế toán trước khi đầu tư.</p>
    </div>

    <div class="sol-footer__bottom">
      <div class="sol-footer__trustlinks">
        <a href="/chinh-sach-bao-mat/">Chính sách bảo mật</a> ·
        <a href="/dieu-khoan-su-dung/">Điều khoản sử dụng</a> ·
        <a href="/tuyen-bo-mien-tru/">Tuyên bố miễn trừ</a> ·
        <a href="/chinh-sach-cookie/">Cookie</a> ·
        <a href="/lien-he/">Liên hệ</a>
      </div>
      <div class="sol-footer__copyright">
        © 2025–2026 <strong>Đi Cùng Sol</strong> · Khang Sol (Nguyễn Đình Khang) · <a href="https://sol.vn">sol.vn</a>
      </div>
    </div>

  </div>
</footer>
<?php endif; ?>
```

→ Active + Save.

### Bước 4: Add Global CSS (Hide theme header/footer + Style Sol)

WP Admin → **Customize → Additional CSS** → Tìm CSS hiện tại (V2.2 + body.home rules).

**Thay thế dòng `body.home` thành nothing** để CSS apply globally. Hoặc paste thêm CSS này vào CUỐI:

```css
/* ═══════════════════════════════════════════════════════════════════
   HIDE theme header + footer cũ (apply mọi page)
   ═══════════════════════════════════════════════════════════════════ */

/* Hide theme header (single-dash class) */
.sol-header-inner,
.sol-header-brand,
.sol-header-nav {
  display: none !important;
}
header.sol-header:has(.sol-header-inner) {
  display: none !important;
}

/* Hide theme footer (single-dash class) */
.sol-footer-inner,
.sol-footer-brand,
.sol-footer-nav,
.sol-footer-disclaimer,
.sol-footer-safety,
.sol-footer-bottom:not(.sol-footer__bottom),
.sol-footer-divider {
  display: none !important;
}
footer.sol-footer:has(.sol-footer-inner) {
  display: none !important;
}

/* Hide WordPress entry-content wrapper margin trên Sol header/footer */
.entry-content .sol-header,
.entry-content .sol-footer,
.site-content .sol-header,
.site-content .sol-footer {
  margin: 0 !important;
  padding: 0;
}

/* Đảm bảo Sol header + footer KHÔNG bị wrapper constrain */
.sol-header,
.sol-footer {
  width: 100% !important;
  max-width: 100% !important;
}
```

→ **Publish**.

### Bước 5: Test 3 page

Mở **Incognito** (Ctrl+Shift+N):

| URL | Phải có |
|---|---|
| `https://sol.vn/` | Sol V2.2 header + content + footer |
| `https://sol.vn/khang-sol/` | Sol V2.2 header + content + footer |
| `https://sol.vn/huong-di/freelancer-chuyen-mon-tuoi-45/` | Sol V2.2 header + content + footer |

→ Cả 3 phải có **header + footer giống nhau**, không còn theme cũ.

---

## ⚠️ Common issues + fix

### Issue 1: 2 header xuất hiện (cũ + mới)

**Nguyên nhân:** CSS hide chưa apply hết các selector của theme.

**Fix:** Mở F12 → Inspect theme header → note exact class → thêm vào CSS hide list.

### Issue 2: Sol header xuất hiện 2 lần

**Nguyên nhân:** Snippet WPCode chạy trên cả admin pages.

**Fix:** Verify `<?php if (!is_admin()): ?>` wrapper đã có (đã include sẵn trong code trên).

### Issue 3: Footer xuất hiện trên admin pages

**Fix:** Same — `if (!is_admin())` đã handle.

### Issue 4: Snippet không load

**Nguyên nhân:** Snippet chưa **Active** (chưa enable).

**Fix:** WP Admin → Code Snippets → tìm snippet → toggle **Active** ở top right.

### Issue 5: Sol header bị wrap trong content padding

**Fix:** Thêm CSS:
```css
.sol-header, .sol-footer {
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  max-width: 100vw;
}
```

---

## 🛡️ Rollback (5 giây)

Nếu lỗi:
1. WP Admin → Code Snippets
2. Tìm 2 snippets (`Sol V2.2 Global Header` + `Sol V2.2 Global Footer`)
3. Toggle **Inactive** (xám)

→ Theme header/footer cũ trở lại ngay.

---

## 📋 Pre-deploy Checklist

### Trước
- [ ] Install WPCode plugin
- [ ] Verify đã có CSS V2.2 all-in-one trong Customize
- [ ] Note URL 3 page test

### Sau
- [ ] Snippet header ACTIVE ✓
- [ ] Snippet footer ACTIVE ✓
- [ ] CSS hide rules đã paste vào Customize ✓
- [ ] Homepage có Sol header + footer mới ✓
- [ ] Founder page có Sol header + footer mới ✓
- [ ] Blog post pillar có Sol header + footer mới ✓
- [ ] KHÔNG còn theme header (Thân/Tâm/Trí pills) ở bất kỳ page nào
- [ ] KHÔNG còn theme footer (TRỤ THÂN/TÂM/TRÍ + 5 col nav) ở bất kỳ page nào

---

## 🎁 Bonus tips

### Snippet ngắn hơn — Pure HTML thay vì PHP

Nếu không cần `<?php if (!is_admin()) ?>` check:

WPCode → Add Snippet → **Code Type: HTML Snippet** → paste HTML thuần. Sẽ inject mọi nơi (cả frontend lẫn admin).

Trade-off: admin pages sẽ thấy Sol header/footer (hơi awkward), nhưng đơn giản hơn.

### Conditional logic

Có thể chỉ inject Sol header trên specific page types:

```php
<?php if (is_page() || is_single() || is_home() || is_front_page()): ?>
<header class="sol-header">...</header>
<?php endif; ?>
```

→ Loại trừ category archives, search results, etc.

---

## 🚀 Effort breakdown

| Task | Time |
|---|---|
| Install WPCode plugin | 2 phút |
| Tạo snippet header | 3 phút |
| Tạo snippet footer | 5 phút |
| Update CSS hide rules | 2 phút |
| Test 3 pages | 3 phút |
| **Total** | **~15 phút** |

---

*WPCode = WP admin Hero. Anh không cần SSH, không cần FTP — chỉ vài click.*
