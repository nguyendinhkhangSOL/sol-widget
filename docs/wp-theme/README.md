# SOL — WordPress Production Files

> 3 file production-ready cho team WP triển khai trang chủ Thân–Tâm–Trí
> + Master Footer v3 trên sol.vn.
>
> **Tác giả:** Sol AI · **Date:** 2026-06-16

---

## 📦 File trong bộ này

| File | Mục đích | Cài đặt tại |
|---|---|---|
| `template-homepage-than-tam-tri.php` | Page Template — Homepage v3 (Thân/Tâm/Trí) | `wp-content/themes/sol-theme/` |
| `footer.php` | Master Footer 4-zone (Brand · Nav · Safety+Disclaimer · Copyright) | `wp-content/themes/sol-theme/` |
| `sol-homepage.css` | CSS cho homepage + footer (vanilla, không SCSS) | `wp-content/themes/sol-theme/css/` |

---

## 🚀 Quy trình deploy (4 bước)

### Bước 1: Upload file vào theme

```bash
# SSH vào VPS
ssh sol-vps
cd /var/www/sol-vn/wp-content/themes/sol-theme/

# Upload qua SFTP hoặc rsync
# Cấu trúc cuối cùng:
sol-theme/
├── template-homepage-than-tam-tri.php
├── footer.php   (BACKUP file cũ trước khi ghi đè!)
├── css/
│   └── sol-homepage.css
└── functions.php  (cần edit để enqueue CSS — xem Bước 2)
```

**⚠️ Backup file cũ trước:**

```bash
cp footer.php footer.php.bak-2026-06-16
cp header.php header.php.bak-2026-06-16
```

### Bước 2: Edit functions.php enqueue CSS

Thêm vào `functions.php`:

```php
/**
 * Enqueue SOL homepage + footer CSS
 */
function sol_enqueue_homepage_css() {
    wp_enqueue_style(
        'sol-homepage',
        get_template_directory_uri() . '/css/sol-homepage.css',
        array(),
        '3.1'
    );
}
add_action( 'wp_enqueue_scripts', 'sol_enqueue_homepage_css' );

/**
 * Register footer menu locations (cho phép admin edit qua Appearance → Menus)
 */
function sol_register_footer_menus() {
    register_nav_menus( array(
        'footer-than'    => 'Footer — Trụ Thân',
        'footer-tam'     => 'Footer — Trụ Tâm',
        'footer-tri'     => 'Footer — Trụ Trí',
        'footer-about'   => 'Footer — Về Sol',
    ) );
}
add_action( 'after_setup_theme', 'sol_register_footer_menus' );

/**
 * Sol Zalo group URL — admin có thể edit qua wp-cli hoặc plugin Options Pages
 *   wp option set sol_zalo_group_url "https://zalo.me/g/abc123"
 */
add_action( 'admin_init', function() {
    if ( false === get_option( 'sol_zalo_group_url' ) ) {
        add_option( 'sol_zalo_group_url', 'https://zalo.me/g/sol' );
    }
} );
```

### Bước 3: Tạo Homepage page

```
WP Admin → Pages → Add New
├── Title: "Đi Cùng Sol Homepage"
├── Slug: bất kỳ (vd: "homepage")
├── Page Attributes → Template: "Sol Homepage v3 — Thân · Tâm · Trí"
└── Publish
```

### Bước 4: Set homepage

```
WP Admin → Settings → Reading
├── Front page displays: "A static page"
├── Front page: "Đi Cùng Sol Homepage"
└── Save Changes
```

**Verify:** Mở https://sol.vn/ — hero "Đi Cùng Sol — Tái thiết U45 theo Thân · Tâm · Trí" hiện ra.

---

## 🧪 Smoke tests sau deploy

```bash
# 1. Homepage load 200
curl -sI https://sol.vn/ | head -2

# 2. CSS load 200
curl -sI https://sol.vn/wp-content/themes/sol-theme/css/sol-homepage.css | head -2

# 3. Schema JSON-LD render (View Source tìm "Organization")
curl -s https://sol.vn/ | grep -A 30 'application/ld+json'

# 4. Footer render đầy đủ 4 zone
curl -s https://sol.vn/ | grep -E 'sol-footer-brand|sol-footer-nav|sol-footer-disclaimer|sol-footer-bottom' | wc -l
# Expect: 4 matches
```

**Google Rich Results Test:**

```
https://search.google.com/test/rich-results?url=https://sol.vn/
```

→ Expect: Pass với Organization + WebSite schema.

---

## 🎨 Override nav menu qua admin (optional)

Sau khi register menus (Bước 2), admin có thể:

```
WP Admin → Appearance → Menus
├── Create new menu: "Footer Thân"
│   Assign location: "Footer — Trụ Thân"
│   Add menu items qua drag&drop
└── Save
```

Lúc đó `sol_footer_links()` ưu tiên menu admin thay vì hard-coded fallback.

---

## 🔄 Rollback nếu có issue

```bash
cd /var/www/sol-vn/wp-content/themes/sol-theme/
cp footer.php.bak-2026-06-16 footer.php
cp header.php.bak-2026-06-16 header.php
# WP Admin → Settings → Reading → Front page: "Your latest posts"
```

→ Quay về trạng thái trước trong < 30 giây.

---

## 📋 Migration trang chủ cũ (3 câu Khang chốt)

### Câu 1: Slug cho trang chủ cũ?

Khang chọn 1:

```
□  (a) /cau-chuyen-bo-thuoc-cua-khang-sol/
□  (b) /khang-sol-cai-vinataba-30-nam/
□  (c) /khang-sol-cau-chuyen-bo-thuoc/    ⭐ em recommend
□  (d) /hanh-trinh-bo-thuoc-cua-khang-sol/
```

### Câu 2: Trang chủ cũ vs bài /khang-sol-cau-chuyen-sach-thuoc-tu-2021/

Khang xác nhận:

```
□  (a) Trùng nhiều → gộp 1 chỗ, redirect 1 cái về cái còn lại
□  (b) Khác hoàn toàn → tạo slug mới riêng cho trang chủ cũ
```

### Câu 3: Trước migrate có muốn em xem trang chủ cũ?

```
□  Có — Khang paste URL hoặc HTML export, em đọc + tinh chỉnh content trước khi migrate
□  Không — Khang tự migrate, em chỉ guide quy trình
```

---

## 🗂 Cấu trúc file đã có trong project Sol

Em đã viết các file liên quan vào `docs/`:

| File | Vai trò |
|---|---|
| `docs/homepage-sol-vn-v3-than-tam-tri-preview.html` | Preview standalone HTML (Khang test browser) |
| `docs/footer-sol-vn-master-v3-preview.html` | Preview footer standalone |
| `docs/SOL_VN_HOMEPAGE_FOOTER_REDESIGN.md` | Phân tích chiến lược (v1, em đã update) |
| `docs/SOL_ECOSYSTEM_INTEGRATION_ANALYSIS.md` | Phân tích tích hợp bothuocla + huongdi |
| `docs/HUONGDI_DEPLOY_BRIEFING.md` | Briefing infrastructure cho team huongdi |
| `docs/wp-theme/template-homepage-than-tam-tri.php` | **Production** Page Template |
| `docs/wp-theme/footer.php` | **Production** Master Footer |
| `docs/wp-theme/sol-homepage.css` | **Production** CSS |
| `docs/wp-theme/README.md` | (file này) — hướng dẫn deploy + 3 câu chốt |

---

**Phiên bản:** 1.0 — 2026-06-16
**Tác giả:** Sol AI
