# EOD WRAP — 2026-08-10 — PHÓNG TRANG MÔ HÌNH SEO (cờ đầu) + rót lực

## 1. Kết quả chính (LIVE)

**12 trang mô hình đã lên `sol.vn/mo-hinh/<slug>/`** (11 cờ đầu + pilot), dày ~13–28k ký tự, đúng Phương án A (con số + pháp lý CÔNG KHAI), có Tóm tắt 2 phút + Q&A (GEO), teaser deep-link về La Bàn, hộp tác giả Khang Sol.

| # | Slug | Cụm demand |
|---|------|-----------|
| 1 | fractional-manager-sme (pilot, đã đồng bộ v3) | Cố vấn / bán chuyên môn |
| 2 | ke-toan-thue-ho-kinh-doanh | Sóng chính sách thuế hộ KD |
| 3 | so-hoa-ai-hoa-ho-kinh-doanh-sme | AI thực chiến |
| 4 | cho-thue-tai-san-nho | Vốn nhỏ / asset-light |
| 5 | freelancer-chuyen-mon | Solopreneur |
| 6 | tu-van-doanh-nghiep | Cố vấn 40–60 |
| 7 | kinh-doanh-online-1-nguoi | Bán online tuổi 50 |
| 8 | day-kem-nguoi-lon-theo-ngach | Học/dạy nghề 45 |
| 9 | kenh-chia-se-chuyen-mon-nghe-cu | Nghề cũ → nội dung |
| 10 | thuc-pham-nha-lam-co-dang-ky | Phụ nữ / vốn nhỏ |
| 11 | sua-chua-bao-tri-nha-theo-goi | Tay nghề trung niên |
| 12 | affiliate-marketing-nganh | Online / thu nhập thêm |

**Nghiệm thu:** 12/12 render đúng · con số + pháp lý công khai · 0 rác markdown · 0 rò mã MH · 0 trang trùng (-2) — ghi đè đúng slug↔ID.

## 2. Hạ tầng dựng trong phiên

- **Generator v3** lưu tại `sol-widget/tools/mohinh-generator-v3.js` — nguồn chuẩn, backup-first + 4 bất biến, chọn section theo CHUNG/RIÊNG (bỏ mục 8 case nháp + 9 lộ trình=riêng), làm sạch title ("— mục", "(bản nháp)"), quét mã MH toàn trang.
- **Trang thực thể `/mo-hinh/`** (page 3995): hub liệt kê 12 mô hình gom 5 cụm, cho AI/Google đọc + CTA La Bàn.
- **Rót lực:** chèn hộp "Mô hình cụ thể để bắt đầu" vào **10 trụ tình cảnh** (3884 sự-nghiệp-thứ-hai, 3813 asset-light, 3709 khởi-nghiệp-40-60, 3315 có-100-triệu, 3719 học-nghề-45, 3486 45-tuổi-KD, 3749 bán-online-50, 3820 phụ-nữ, 3557 solopreneur, 3924 vốn-gần-0) → 29 link nội bộ xuống mô hình. Idempotent (marker `sol:mohinh-links`).
- **2 mu-plugin (anh đã upload):** `sol-mohinh-no-sidebar.php` (bỏ sidebar lệch chủ đề trên /mo-hinh/*) + `sol-fix-titlecase.php` v2 (fix og:title; thẻ <title> tab vẫn viết-hoa do template host — cosmetic, đã park).

## 3. Mạch hoạt động
Trụ (có traffic) → Mô hình (deep, có con số) → La Bàn (chấm riêng, trả phí).

## 4. Còn treo — cần làm tiếp

### 4.1 Sitemap (nhỏ, không chặn)
12 trang chưa vào `page-sitemap.xml` (cache Rank Math cũ, 25 URL). Pages đều index bình thường + đã có 10 trụ + hub trỏ link → Google vẫn discover. **Việc anh (10s):** Rank Math → Sitemap → Save Changes để flush; hoặc để cache tự hết.

### 4.2 Hai deploy app (spec cho đội code — repo app KHÔNG nằm trong workspace nên chưa dựng lệnh)
1. **Canonical trang chi tiết app → sol.vn/mo-hinh/<slug>/** cho 12 slug đã có trang (whitelist). Các slug chưa có trang: giữ self-canonical. File: `huongdi-public/la-ban-huong-di/chi-tiet/` (chỗ set canonical qua JS). *Ưu tiên thấp: trang app render rỗng với bot nên gần như không cạnh tranh index.*
2. **Mở "con số + pháp lý" cho user free trong app** (hệ quả A) để khớp bản công khai trên sol.vn. Đụng backend gating section (visibility/entitlement) — nhiều khả năng chỉ là 1 toggle config (`app_config`) hoặc quy tắc visibility. Cần repo để ra lệnh chính xác.

### 4.3 Mở rộng (sau)
- Đo 1–2 tuần → chạy nốt các mô hình còn lại (46 cái) qua generator v3 (đã sẵn hàm chạy loạt).
- Ảnh đại diện branded 1200×630 cho 12 trang (hiện chưa gắn featured image).

## 5. Quyết định giữ nguyên
- WordPress /mo-hinh = bản IN; DB app = GỐC. Không sửa tay bản in — sửa nguồn rồi chạy lại generator.
- CHUNG/RIÊNG = Phương án A (công khai deep incl con số/pháp lý; riêng = La Bàn cá nhân hoá).
