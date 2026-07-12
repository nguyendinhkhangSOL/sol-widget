# Sol Mu-Plugin V3 — Default Template Update

## 📦 File mới

`sol-default-template-v3.php` — replace cho `sol-default-template.php` hiện tại trong `/wp-content/mu-plugins/`.

---

## 🎯 Thay đổi V2 → V3

### Giữ nguyên (intact)
- ✅ PHP class structure (`Sol_Default_Template`)
- ✅ `load_template()` + `add_template()` methods
- ✅ Page template registration
- ✅ Meta tags (Open Graph, Twitter Card)
- ✅ Schema.org WebPage + Breadcrumb
- ✅ Schema Organization với knowsAbout updated
- ✅ JWT cross-domain transfer script (cuối file)
- ✅ Plugin auto-active (mu-plugins pattern)

### Đổi
| Phần | V2 | V3 |
|---|---|---|
| **Font** | Be Vietnam Pro | Inter + Lora |
| **Palette** | Clay/terracotta (#B25C2C) | Amber + Navy (V2.2) |
| **Header class** | `sol-top-nav` | `sol-header` |
| **Header nav** | 🌱 Thân · 💭 Tâm · 🚀 Trí · Khang Sol · Bắt đầu | 📘 Sách · Hệ thống · Bài viết · Khang Sol · Đặt sách |
| **Header tagline** | "Thân · Tâm · Trí cho U45 Việt" | (Bỏ — sạch sẽ) |
| **Footer class** | `sol-footer-inner` | `sol-footer__grid` (BEM) |
| **Footer 5 cols** | Brand + Thân + Tâm + Trí + Về + Liên hệ | Brand + Sản phẩm + Tài nguyên + Về Sol + Dự án liên quan |
| **Bothuocla position** | "Trụ Thân" cột riêng | Footer "Dự án liên quan" (de-emphasized) |
| **Page content max-width** | 1080px | 760px (đọc tốt hơn) |
| **Regulatory line** | Có (Luật ANM + NĐ 13) | **Bỏ** (đã có trong /tuyen-bo-mien-tru/) |
| **Sources line** | Có (CDC + NHS + ...) | **Bỏ** (clean) |

### Giữ Compliance critical
- ✅ Emergency hotlines (115 + BV Bạch Mai + Ngày Mai + startup.gov.vn)
- ✅ 4 YMYL warnings (Y khoa + Tinh thần + Tài chính + tổng)

---

## 🚀 Deploy — 3 bước (5 phút)

### Bước 1: Backup file cũ

cPanel File Manager → vào folder:
```
public_html/wp-content/mu-plugins/
```

Right-click `sol-default-template.php` → **Download**
→ Save vào máy local: `sol-default-template-v2-backup-2026-06-27.php`

### Bước 2: Upload file v3

**Cách A: Upload + Rename**
1. Tải file `sol-default-template-v3.php` từ máy local
2. cPanel File Manager → folder `mu-plugins/` → click **Upload**
3. Select `sol-default-template-v3.php` → Upload
4. Sau upload xong → quay lại folder → **Delete** `sol-default-template.php` (file cũ)
5. **Rename** `sol-default-template-v3.php` → `sol-default-template.php`

**Cách B: Replace direct (nguy hiểm hơn, có risk)**
1. Right-click `sol-default-template.php` → **Edit**
2. Select All → Delete
3. Paste nội dung từ `sol-default-template-v3.php`
4. Save Changes

→ **Recommend Cách A** vì có file backup riêng để rollback dễ.

### Bước 3: Test

Mu-plugins tự active — KHÔNG cần làm gì thêm trong WP Admin.

Mở Incognito → vào 3 page:
- `https://sol.vn/khang-sol/`
- `https://sol.vn/sol-la-gi/`
- `https://sol.vn/tuyen-bo-mien-tru/`

Cần thấy:
- ✓ Header V2.2 (logo + 📘 Sách + Hệ thống + Bài viết + Khang Sol + "Đặt sách →")
- ✓ Page content render bình thường
- ✓ Footer V2.2 (5 cols + Emergency + Disclaimer + Bottom)
- ❌ KHÔNG còn header cũ (Thân/Tâm/Trí pills)
- ❌ KHÔNG còn footer cũ (TRỤ THÂN/TÂM/TRÍ)

---

## 🛡️ Rollback (1 phút)

Nếu lỗi:
1. cPanel File Manager → `mu-plugins/`
2. **Delete** `sol-default-template.php` (file mới)
3. **Upload** lại `sol-default-template-v2-backup-2026-06-27.php`
4. **Rename** thành `sol-default-template.php`

→ Site về trạng thái v2.

---

## ⚠️ Lưu ý quan trọng

### File này chỉ apply cho PAGE template
Page nào dùng template `sol-default-page.php` (set trong Page Attributes → Template).

→ Page **KHÔNG** dùng template này (vd: blog posts, archive pages, custom CPT) sẽ render theo theme `news-magazine-x-child` (cha là `news-magazine-x`).

### Page nào hiện đang dùng template này?
Vào WP Admin → Pages → list pages → kiểm tra cột "Template" hoặc mở từng page xem Page Attributes:
- `/khang-sol/`
- `/sol-la-gi/`
- `/tuyen-bo-mien-tru/`
- `/chinh-sach-bao-mat/`
- `/dieu-khoan-su-dung/`
- ... (các page tĩnh khác)

### Còn POST (bài viết blog) + Landing pages
- **Blog posts** (`/huong-di/{slug}`, `/ngam/{slug}`) → render theo theme → vẫn header/footer theme cũ → cần update riêng
- **Landing pages** → dùng `sol-landing-template.php` (cần update tương tự — V3 tiếp theo)

---

## 📋 Pre-deploy Checklist

### Trước
- [ ] Backup `sol-default-template.php` v2 → save local
- [ ] Verify đã có Customize → Additional CSS (V2.2 all-in-one)
- [ ] Note WordPress version (để rollback dễ nếu có lỗi)

### Sau
- [ ] File mới upload OK (verify size ~30KB)
- [ ] File renamed thành `sol-default-template.php`
- [ ] 3 page test render với V2.2 design
- [ ] All nav links hoạt động (click test)
- [ ] CTA "Đặt sách" link đến `/sach/tai-khoi-nghiep-dung-huong/`
- [ ] Emergency hotlines tap (mobile) → mở dialer
- [ ] JWT script vẫn work (test 1 link sang huongdi)

---

## 🎯 Sau khi deploy thành công

**Tiếp theo:**
1. Update `sol-landing-template.php` lên v3 tương tự (cho landing pages)
2. Update header/footer cho **blog posts** (cần edit theme child hoặc tạo mu-plugin riêng cho post template)

→ Mình sẽ chuẩn bị `sol-landing-template-v3.php` sau khi anh confirm v3 default work OK.

---

*v3 = unified design + cohesive brand + revenue focus.*
*Đi cùng nhau, đường dài đỡ mỏi.*
