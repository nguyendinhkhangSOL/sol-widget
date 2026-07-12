# SOL — Astra Free Deploy Guide
## Cài Master Footer + Homepage v3 trên Astra Free theme

> **Setup hiện tại:** sol.vn dùng theme **Astra (Free)**
> **Mục tiêu:** Thay footer + tạo homepage Thân–Tâm–Trí mới mà KHÔNG cần Astra Pro / Elementor Pro
> **Effort:** ~45-60 phút · An toàn (child theme có rollback)
>
> **Tác giả:** Sol AI · **Date:** 2026-06-16

---

## ⚡ TÓM TẮT — Chiến lược cho Astra Free

| Vấn đề | Giải pháp |
|---|---|
| Astra Free KHÔNG có Theme Builder cho footer | ✅ Dùng **Child Theme** override `footer.php` |
| Astra default footer vẫn render | ✅ Hide bằng CSS `display: none` (đã có sẵn trong code em viết) |
| Cập nhật Astra parent xoá custom | ✅ Child theme **không bị ghi đè** khi Astra update |
| Rollback nhanh nếu lỗi | ✅ Deactivate child theme → site về Astra parent ngay |

---

## 🚀 PHẦN 1 — TẠO CHILD THEME (1 lần setup)

### Bước 1.1: Cài plugin "Child Theme Configurator"

```
WP Admin → Plugins → Add New
Search: "Child Theme Configurator"
Tác giả: Lilaea Media (300k+ active installs, rating 4.8)
Install → Activate
```

### Bước 1.2: Tạo child theme từ Astra

```
WP Admin → Tools → Child Themes
```

Cấu hình:

```
1. Create a new Child Theme
2. Select a Parent Theme: Astra
3. Analyze
4. Name the new theme directory: astra-child-sol
5. Pick where to save new styles: Primary Stylesheet (style.css)
6. (Tuỳ chọn) Copy menus, widgets, customizer settings: YES
7. Click "Create New Child Theme"
```

### Bước 1.3: Activate child theme

```
WP Admin → Appearance → Themes
→ Tìm "Astra Child - sol"
→ Activate
```

**Verify:** Mở `sol.vn` — giao diện vẫn giống Astra cũ. Nếu vỡ → deactivate child theme, làm lại Bước 1.2.

---

## 🚀 PHẦN 2 — UPLOAD FILES MỚI VÀO CHILD THEME

### Bước 2.1: Truy cập child theme folder

**Cách A — Qua WP Admin (không cần SSH):**

```
WP Admin → Appearance → Theme File Editor
→ Select theme to edit: "Astra Child - sol"
→ Cột phải có cấu trúc folder
```

**Cách B — Qua SFTP/SSH (khuyến nghị cho file lớn):**

```bash
ssh sol-vps
cd /var/www/sol.vn/wp-content/themes/astra-child-sol/
```

### Bước 2.2: Tạo cấu trúc folder

```
astra-child-sol/
├── style.css                  ← (đã có từ Child Theme Configurator)
├── functions.php              ← (đã có)
├── footer.php                 ← MỚI — copy từ em
├── template-homepage-than-tam-tri.php   ← MỚI — copy từ em
└── css/
    └── sol-homepage.css       ← MỚI — copy từ em
```

### Bước 2.3: Copy 3 file từ em vào

| File em viết | Đích trên VPS |
|---|---|
| `docs/wp-theme/footer.php` | `astra-child-sol/footer.php` |
| `docs/wp-theme/template-homepage-than-tam-tri.php` | `astra-child-sol/template-homepage-than-tam-tri.php` |
| `docs/wp-theme/sol-homepage.css` | `astra-child-sol/css/sol-homepage.css` |

### Bước 2.4: Edit `functions.php` child theme

Mở `astra-child-sol/functions.php`, thêm code:

```php
<?php
/**
 * Astra Child - Sol functions
 */

// ─── Enqueue Astra parent style + Sol custom CSS ───────────────────────
function sol_astra_child_enqueue_styles() {
    // Astra parent style
    wp_enqueue_style( 'astra-parent-style', get_template_directory_uri() . '/style.css' );

    // Child theme style.css
    wp_enqueue_style( 'astra-child-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'astra-parent-style' ),
        wp_get_theme()->get( 'Version' )
    );

    // Sol homepage + footer CSS
    wp_enqueue_style( 'sol-homepage',
        get_stylesheet_directory_uri() . '/css/sol-homepage.css',
        array( 'astra-child-style' ),
        '3.1'
    );
}
add_action( 'wp_enqueue_scripts', 'sol_astra_child_enqueue_styles' );

// ─── Register footer nav menu locations (cho phép admin edit qua Menus) ─
function sol_register_footer_menus() {
    register_nav_menus( array(
        'footer-than'  => 'Footer — Trụ Thân',
        'footer-tam'   => 'Footer — Trụ Tâm',
        'footer-tri'   => 'Footer — Trụ Trí',
        'footer-about' => 'Footer — Về Sol',
    ) );
}
add_action( 'after_setup_theme', 'sol_register_footer_menus' );

// ─── Sol Zalo group URL — admin edit qua wp-cli hoặc Options Pages ─────
add_action( 'admin_init', function() {
    if ( false === get_option( 'sol_zalo_group_url' ) ) {
        add_option( 'sol_zalo_group_url', 'https://zalo.me/g/sol' );
    }
} );

// ─── ẨN ASTRA DEFAULT FOOTER khi child footer.php render Master Footer ──
// (Vì Astra dùng action hook 'astra_footer', child footer.php override hoàn toàn
// nên block này không cần thiết — chỉ phòng trường hợp Astra render duplicate)
function sol_hide_astra_default_footer() {
    if ( is_admin() ) return;
    ?>
    <style>
        /* Astra default footer wrapper — child theme đã có Master Footer rồi */
        .ast-small-footer,
        .ast-advanced-footer,
        .site-info {
            display: none !important;
        }
    </style>
    <?php
}
add_action( 'wp_head', 'sol_hide_astra_default_footer', 99 );
```

**Quan trọng:**
- Đoạn `register_nav_menus()` cho phép Khang edit footer link qua Admin (Appearance → Menus) thay vì sửa code.
- Đoạn `sol_hide_astra_default_footer()` ẩn footer default của Astra phòng trường hợp có duplicate.

---

## 🚀 PHẦN 3 — TẠO HOMEPAGE PAGE

### Bước 3.1: Tạo page mới

```
WP Admin → Pages → Add New
├── Title: "Đi Cùng Sol Homepage"
├── Slug: bất kỳ (vd: "homepage-than-tam-tri")
├── Sidebar phải → Page Attributes → Template:
│   chọn "Sol Homepage v3 — Thân · Tâm · Trí"
└── Publish
```

### Bước 3.2: Set homepage

```
WP Admin → Settings → Reading
├── Front page displays: "A static page"
├── Front page: "Đi Cùng Sol Homepage"
└── Save Changes
```

**Verify:** Mở `sol.vn/` — hero "Đi Cùng Sol — Tái thiết U45 theo Thân · Tâm · Trí" phải hiện.

---

## 🚀 PHẦN 4 — TẮT ASTRA HEADER/FOOTER ELEMENTS THỪA

Astra Free có sẵn một số footer widget cài qua Customizer. Em đề xuất tắt để Master Footer hiển thị sạch.

### Bước 4.1: Tắt Astra Footer Bar

```
WP Admin → Appearance → Customize → Footer Builder
→ Section "Below Footer" hoặc "Footer Bar"
→ Toggle ALL widgets thành Off / Hide
```

### Bước 4.2: Hide widgets thừa (nếu còn)

```
WP Admin → Appearance → Customize → Widgets → Footer 1/2/3/4
→ Remove tất cả widget khỏi 4 vùng footer
```

### Bước 4.3: Verify mobile

```
Mở sol.vn trên điện thoại
→ Hero hiện đẹp
→ Footer 4 zone collapse 1 cột dọc
→ Không có vùng trống thừa
```

---

## ✅ CHECKLIST VERIFY SAU DEPLOY

```
─── Trang chủ ─────────────────────────────────────
□  https://sol.vn/ → Hero Thân-Tâm-Trí
□  3 CTA button (bothuocla, ngam, huongdi)
□  Schema Organization + Person render (View Source tìm "application/ld+json")
□  Footer hiện 4 zone đúng thứ tự

─── Bài blog cũ ────────────────────────────────────
□  https://sol.vn/lo-trinh-cai-thuoc-la-khoa-hoc-7-ngay/
   → Content giữ nguyên + Master Footer mới
□  https://sol.vn/khoi-nghiep-tinh-gon-tuoi-trung-nien-it-von/
   → Content giữ nguyên + Master Footer mới
□  https://sol.vn/khang-sol/
   → Content giữ nguyên + Master Footer mới

─── Mobile ────────────────────────────────────────
□  Mobile responsive — footer 5 col → 1 col
□  Hero 3 CTA card → 3 stacked
□  Founder block 3 pillar mini → 3 stacked

─── Schema (Rich Results Test) ────────────────────
□  https://search.google.com/test/rich-results?url=https://sol.vn/
   → Organization + WebSite pass

─── Performance ───────────────────────────────────
□  PageSpeed Insights desktop ≥ 90
□  PageSpeed Insights mobile ≥ 75
□  CSS load < 200ms
```

---

## 🔄 ROLLBACK NẾU LỖI

### Option 1 — Deactivate child theme (NHANH NHẤT)

```
WP Admin → Appearance → Themes
→ Activate lại "Astra" parent
→ Sol về footer cũ Astra ngay
```

→ 30 giây rollback. Không mất dữ liệu.

### Option 2 — Restore footer cũ

```bash
ssh sol-vps
cd /var/www/sol.vn/wp-content/themes/astra-child-sol/
mv footer.php footer.php.broken-2026-06-16
# Astra parent footer sẽ tự động được dùng (WP theme inheritance)
```

### Option 3 — Restore database backup

Nếu có lỗi nghiêm trọng:

```bash
# Restore từ backup hàng ngày
gunzip < /var/backups/sol_vn_2026-06-15.sql.gz | mysql -u sol_user -p sol_db
```

---

## 🎨 OPTIONAL — Tạo footer menus qua Admin (sau deploy)

Đây là feature em đã prep trong code — admin có thể edit footer links mà không cần sửa code:

### Bước 1: Tạo menu mới

```
WP Admin → Appearance → Menus → Create a new menu
```

Tạo 4 menu:
- "Footer Than" — assign location "Footer — Trụ Thân"
- "Footer Tam" — assign location "Footer — Trụ Tâm"
- "Footer Tri" — assign location "Footer — Trụ Trí"
- "Footer About" — assign location "Footer — Về Sol"

### Bước 2: Thêm menu items vào mỗi menu

Drag/drop links từ Pages, Posts, Custom Links vào menu.

→ Footer tự động render menu admin thay vì fallback hard-coded trong code.

---

## ❓ TROUBLESHOOTING

### Lỗi 1: Footer mới hiện nhưng footer Astra vẫn còn ở dưới (duplicate)

Nguyên nhân: Astra render footer.php của parent THÊM vào (rare).

Fix: Code `sol_hide_astra_default_footer()` em đã thêm trong `functions.php` ẩn `.ast-small-footer`, `.ast-advanced-footer`, `.site-info`. Nếu vẫn còn duplicate, inspect element tìm class cụ thể của footer thừa rồi thêm vào danh sách.

### Lỗi 2: CSS không load (footer hiện raw HTML không style)

Check:
- File `css/sol-homepage.css` đã upload đúng folder chưa?
- `functions.php` có code `wp_enqueue_style('sol-homepage', ...)` chưa?
- Cache WordPress (W3 Total Cache, WP Rocket) đã purge chưa?

```bash
# Quick test CSS path:
curl -sI https://sol.vn/wp-content/themes/astra-child-sol/css/sol-homepage.css
# Expect: HTTP/1.1 200 OK
```

### Lỗi 3: Schema không render

Check:
- Page template em viết có `add_action('wp_footer', 'sol_homepage_schema')` không?
- Hook chỉ trigger khi `is_page_template('template-homepage-than-tam-tri.php')`
- View Source page sol.vn/ tìm `application/ld+json`

### Lỗi 4: Homepage hiện nhưng menu navigation cũ của Astra vẫn trên đầu

Đây là **header.php** của Astra, KHÔNG phải footer. Em chưa override header.
→ Nếu Khang muốn header có menu 3 trụ Thân/Tâm/Trí riêng, em viết thêm `header.php` cho child theme. Hỏi em.

---

## 📋 BỘ FILES CẦN UPLOAD CHO ASTRA CHILD THEME

```
/wp-content/themes/astra-child-sol/
├── style.css                  (auto-generated by Child Theme Configurator)
├── functions.php              (paste code em viết ở Bước 2.4)
├── footer.php                 (copy từ docs/wp-theme/footer.php)
├── template-homepage-than-tam-tri.php   (copy từ docs/wp-theme/)
└── css/
    └── sol-homepage.css       (copy từ docs/wp-theme/sol-homepage.css)
```

→ 4 file cần thao tác. Effort tổng ~45 phút first time, ~10 phút lần sau (đã quen).

---

## 🚦 QUY TRÌNH 1-PAGE CHO NGƯỜI CHƯA QUEN WORDPRESS

Nếu Khang chưa quen với SFTP/file editor, dưới đây là quy trình **chỉ dùng WP Admin** (không cần SSH):

```
1.  Plugins → cài "Child Theme Configurator"
2.  Tools → Child Themes → tạo child từ Astra
3.  Themes → Activate child
4.  Plugins → cài "WPCode Lite" (snippet manager an toàn hơn editor mặc định)
5.  WPCode → Add Snippet → PHP → paste code functions.php Khang nhận từ em
6.  Appearance → Theme File Editor → mở child theme:
    a. Tạo file "footer.php" → paste code em viết
    b. Tạo file "template-homepage-than-tam-tri.php" → paste code
    c. Tạo folder "css" → file "sol-homepage.css" → paste CSS
7.  Pages → Add New "Đi Cùng Sol Homepage" → template "Sol Homepage v3"
8.  Settings → Reading → Front page → page mới
9.  Verify sol.vn/ trên browser
```

Total: ~30 phút nếu copy/paste thành thạo.

---

## ✅ SUMMARY

| Phần | Thời gian | Khó/Dễ |
|---|---|---|
| 1. Tạo child theme | 5-10 phút | ⭐ Dễ |
| 2. Upload 3 files + edit functions.php | 15-20 phút | ⭐⭐ Trung bình |
| 3. Tạo Homepage page | 5 phút | ⭐ Dễ |
| 4. Tắt Astra footer mặc định | 5 phút | ⭐ Dễ |
| **Tổng** | **~45-60 phút** | ⭐⭐ |

**Sau khi xong:** sol.vn có Master Footer mới site-wide + Homepage 3 trụ Thân-Tâm-Trí. Astra parent vẫn giữ → update Astra không phá Sol customization.

---

**Phiên bản:** 1.0 — 2026-06-16
**Tác giả:** Sol AI · viết riêng cho setup Astra Free
