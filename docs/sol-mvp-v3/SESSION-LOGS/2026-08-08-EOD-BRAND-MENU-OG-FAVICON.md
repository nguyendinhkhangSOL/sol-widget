# EOD Wrap — 2026-08-08 · Đồng nhất thương hiệu (Menu · Ảnh share · Favicon · Logo)

> Phiên "làm sạch mặt tiền": thống nhất menu 2 site, dựng ảnh share (OG) branded cho mọi trang hay-share, chuẩn hoá favicon + logo về **La Bàn**, quét bỏ logo cũ (mầm cây), làm lại 4 mockup trang chủ, purge Cloudflare.

---

## 1. Tổng quan
Cả sol.vn (WordPress + trang chủ tĩnh, trên **cPanel** `sol.vn:2083`, home `/home/qbsigblp/public_html`) và huongdi.sol.vn (app tĩnh trên **VPS** `sol-vps` `/var/www/huongdi/public`) giờ **đồng nhất**: menu 5 mục, favicon la bàn, logo la bàn, ảnh share branded. sol.vn chạy sau **Cloudflare** (đã purge).

---

## 2. Việc đã làm

### 2.1 Menu thống nhất
| Site | Trước | Sau |
|---|---|---|
| huongdi (sol-ui.js) | có sẵn 5 mục | + fix canh hàng "La Bàn Sol" (mục không dropdown render lệch → bọc `.hd-nav-item--has-children`) |
| sol.vn WP (sol-chrome.php) | "AI Studio", 4 mục | 5 mục khớp huongdi: 🧭 Chọn hướng đi · 🧭 La Bàn Sol · 🧰 Công cụ AI (tự dùng) · 📖 Kiến thức · ✨ Về Sol |
| sol.vn trang chủ (solvn-landing/index.html) | menu phẳng 4 mục | 5 mục + dropdown khớp |

Menu con "Công cụ AI" có mục **🧭 Khác gì La Bàn Sol? →** trỏ `sol.vn/la-ban-sol/`. Link Bước 4/5 sửa từ `so-hanh-trinh`/`ho-so-doanh-nghiep` → `kiem-thu`/`lam-ho-so`.

### 2.2 Trang La Bàn Sol
- Đăng LIVE **`sol.vn/la-ban-sol/`** (WP Page id **3912**, dồn nội dung mới, xoá bản trùng `-2` id 3968). Dùng REST `wp.apiFetch` để đăng (tránh treo Gutenberg).

### 2.3 Ảnh share (OG) — 15 trang có card branded (navy + amber + la bàn)
| Ảnh | Trang |
|---|---|
| og-trang-chu.png | sol.vn (trang chủ) |
| la-ban-sol (dùng Custom HTML) | sol.vn/la-ban-sol |
| og-kham-pha-ban-than.png | quiz CTA |
| og-pricing / og-thu-vien-huong-di / og-sol-lam-viec | 3 trang ưu tiên cao |
| og-ai-studio / og-tao-prompts / og-sach-hay / og-lam-viec-cung-khang / og-kiem-ke / og-chi-tiet / og-brand | 7 trang "pro pack" |
| og-brand.png (dùng lại) | huongdi.sol.vn/ (trang gốc — vốn THIẾU og:image) |
- Trang tĩnh sol.vn (35 bài SEO) đã có ảnh riêng sẵn → không đụng.
- Chuẩn CTA vẫn: **https://huongdi.sol.vn/kham-pha-ban-than/**.

### 2.4 Favicon đồng nhất (La Bàn)
- huongdi: thả `favicon.ico/.svg`, `icon-512.png`, `apple-touch-icon.png` ở gốc + inject `<link rel=icon>` qua sol-ui.js (phủ 40 trang, kể cả 38 trang trước không khai).
- sol.vn WP: **Site Icon** đã là la bàn (Appearance → Customize → Site Identity).
- sol.vn trang chủ: đổi favicon sang SVG la bàn (nhúng data-uri).

### 2.5 LOGO CHÍNH THỨC = 🧭 LA BÀN (chốt 2026-08-08)
- Phát hiện 2 biểu tượng cùng dùng: **la bàn** (header/UI) vs **mầm cây `Icon_2.png`** (JSON-LD + vài logo nhỏ + tài liệu ghi là "logo").
- Anh Khang **chốt la bàn** là chính thức.
- Repo đã có sẵn brand kit la bàn (`brand/` từ 19/7: mark/horizontal/banner YouTube-Zalo/avatar TikTok — tất cả la bàn). Bổ sung **`brand/BRAND.md`** làm nguồn duy nhất.
- **Quét bỏ mầm cây:** 31 chỗ `Icon_2.png` → `https://sol.vn/icon-512.png` (visible logo login/p1-3/sol-dong-hanh + JSON-LD mu-plugin WP). Còn 0 chỗ.

### 2.6 Mockup trang chủ (4 ảnh) — làm lại theo menu mới
- Chụp lại 4 màn (đăng nhập ACTIVE): Bản đồ (ket-qua) · La Bàn Sol · Thư viện · Hành trình → lồng khung trình duyệt.
- Giữ đúng tên file cũ (`mock_banhdo/labansol/thuvien/hanhtrinh.png`) + thêm `?v=2` trên trang chủ chống cache.

### 2.7 Cloudflare
- **Purge Everything** cho sol.vn (thành công). Lưu ý: Browser Cache TTL = 4h.

---

## 3. TRẠNG THÁI DEPLOY (quan trọng cho phiên sau)

### Đã LIVE (nghiệm thu)
- ✅ Menu mới huongdi (trang pricing xác nhận 5 mục + canh hàng OK, đăng nhập ACTIVE).
- ✅ OG trang chủ sol.vn (FB Debugger hiện ảnh la bàn).
- ✅ WP Site Icon = la bàn.
- ✅ Cloudflare purged.

### Gói deploy đã đóng, **CHỜ anh chạy** (`C:\BOTHUOCLA\_deploy\`)
| Gói | Đích | Nội dung |
|---|---|---|
| **huongdi-FE-ALL.tar.gz** | VPS `/var/www/huongdi/public` | GỘP HẾT: menu + OG 13 trang + trang gốc + favicon + logo sweep + fix canh hàng + cache `sol-ui v20260807d`. Đã loại `ket-qua` + `thanh-toan` (drift paywall). |
| cPanel sol.vn | `public_html/` | `index.html` (menu+OG+favicon+?v=2) · `og-trang-chu.png` |
| cPanel sol.vn | `public_html/` gốc | `icon-512.png` (logo la bàn — cho JSON-LD `sol.vn/icon-512.png`) |
| cPanel sol.vn | `wp-content/mu-plugins/` | `sol-chrome.php` · `sol-default-template.php` · `sol-post-template.php` |
| cPanel sol.vn | `wp-content/uploads/2026/08/` | 4 mockup: `mock_banhdo/labansol/thuvien/hanhtrinh.png` (đè, cùng tên) |

**Lệnh deploy huongdi (1 phát):**
```
scp "C:\BOTHUOCLA\_deploy\huongdi-FE-ALL.tar.gz" sol-vps:/tmp/fe-all.tar.gz
ssh sol-vps "sudo tar -xzf /tmp/fe-all.tar.gz -C /var/www/huongdi/public && sudo chown -R www-data:www-data /var/www/huongdi/public && sudo find /var/www/huongdi/public -type d -exec chmod 755 {} \; && sudo find /var/www/huongdi/public -type f -exec chmod 644 {} \; && echo OK"
```
> Sau deploy: FB Debugger "Scrape Again" các link mới; Ctrl+F5 kiểm tra.

---

## 4. Git (đã push nhánh main `sol-ecosystem`)
- `36fe3b5` chốt logo la bàn + quét Icon_2 + BRAND.md
- + các commit menu/OG/favicon/canh-hàng/cache-bust (theo lệnh anh chạy).

---

## 5. Chuẩn mới ghi nhận
- **Logo chính thức:** 🧭 La Bàn (`brand/sol-logo-mark.svg` / `sol-logo-mark-512.png`). Mầm cây `Icon_2.png` **NGƯNG**. Xem `sol-ecosystem/brand/BRAND.md`.
- **URL logo chuẩn (JSON-LD/social):** `https://sol.vn/icon-512.png`.
- **Palette V4.1:** navy `#0F172A` · amber `#F59E0B` · amber sáng `#FBBF24`. Font: Lora (tiêu đề) + Inter (nội dung).
- **Ảnh share:** khuôn card navy+amber+la bàn; mỗi trang một lời hứa gọn (đừng liệt kê 5 bước ở preview — để trong thân trang).
- **Drift bất di:** KHÔNG deploy `la-ban-huong-di/ket-qua` + `thanh-toan` từ repo (live có paywall riêng).
- **cache sol-ui.js:** đang `?v=20260807d` — đổi sol-ui.js phải bump version.

---

## 6. Còn treo / lần sau (tuỳ chọn)
- Avatar Facebook/YouTube/TikTok/Zalo OA: anh kiểm tra đã là la bàn chưa (brand kit có sẵn file).
- fb:app_id trên sol.vn: cảnh báo phụ, kệ được (chỉ cần nếu muốn Domain Insights).
- Sweep CTA sai (sol.vn/kham-pha-nhanh) ở caption/bài T1–T22 (đã offer, chưa làm).
- Thống nhất "3 phút" vs "5–7 phút / vài phút" cho quiz.
- Xin GSC index bài mới.
