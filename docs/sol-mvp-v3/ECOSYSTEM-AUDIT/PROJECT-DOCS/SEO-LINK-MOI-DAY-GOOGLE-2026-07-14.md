# 🔎 SEO các trang mới + Hướng dẫn đẩy lên Google
> Cập nhật 2026-07-14. Dùng khi publish + submit các trang mới lên Google Search Console.

---

## 1. Danh sách link mới / vừa đổi

| Trang | URL | Loại | Trạng thái |
|---|---|---|---|
| Phương pháp chấm điểm | `sol.vn/phuong-phap-dinh-vi-huong-di-sol/` | WP page mới | Cần publish |
| Câu hỏi thường gặp (Sol) | `sol.vn/cau-hoi/` | WP — viết lại (bỏ cai thuốc) | Cần dán nội dung mới |
| Liên hệ | `sol.vn/lien-he/` | WP — soạn mới | Cần dán nội dung |
| Trang chủ | `sol.vn/` | Landing tĩnh (đã live) | Re-index |
| Sol làm việc thế nào | `huongdi.sol.vn/sol-lam-viec-the-nao/` | Tĩnh (đã live) | Thêm sitemap |

---

## 2. SEO chuẩn cho mỗi trang (đặt trong WP editor — mục SEO/Yoast)

### `phuong-phap-dinh-vi-huong-di-sol`
- **Tiêu đề SEO** (≤60 ký tự): `Phương pháp định vị hướng đi Sol La Bàn (40-60)`
- **Mô tả** (≤155): `Cách Sol La Bàn chấm điểm & so khớp hướng đi tái khởi nghiệp: 3 lớp đánh giá, nền tảng khoa học minh bạch. Dành cho người Việt 40-60.`
- **Từ khoá chính**: phương pháp định vị hướng đi · chấm điểm hướng đi
- **Schema**: Article (tuỳ chọn) · noindex = KHÔNG (cho index)

### `cau-hoi`
- **Tiêu đề SEO**: `Câu hỏi thường gặp về Sol La Bàn — tái khởi nghiệp 40-60`
- **Mô tả**: `Miễn phí Bước 1-2, phí đồng hành 499k/năm, hoàn tiền 7 ngày, dữ liệu mã hoá, không đa cấp. Giải đáp về Sol La Bàn cho người Việt 40-60.`
- **Từ khoá**: Sol La Bàn câu hỏi thường gặp
- **Schema**: ✅ **FAQPage đã nhúng sẵn** (Google hiện câu hỏi xổ)
- ⚠️ Trang này cũ là nội dung cai thuốc → **bắt buộc Request Indexing lại** để Google cập nhật.

### `lien-he`
- **Tiêu đề SEO**: `Liên hệ Sol — Zalo, email, hotline đồng hành 40-60`
- **Mô tả**: `Liên hệ Sol La Bàn: nhắn Zalo, email donghanh@sol.vn, hotline 024.3993.1800. Sol đồng hành người Việt 40-60 tái khởi nghiệp.`
- **Từ khoá**: liên hệ Sol

---

## 3. Đẩy lên Google — 4 bước (Google Search Console)

> Vào **search.google.com/search-console** — chọn property **sol.vn** (và **huongdi.sol.vn** riêng).

**Bước 1 — Kiểm sitemap đã submit chưa**
- Menu trái → **Sitemaps**. sol.vn (WordPress) tự sinh sitemap: nhập `sitemap_index.xml` (hoặc `sitemap.xml`) → Submit. Trang WP mới tự vào sitemap sau khi Publish.

**Bước 2 — Request Indexing từng URL mới** (nhanh nhất)
- Dán từng URL vào ô **"Kiểm tra URL"** (trên cùng) → chờ kiểm → bấm **"Yêu cầu lập chỉ mục" (Request Indexing)**.
- Làm cho: 3 URL mới + `sol.vn/` (trang chủ) + `huongdi.sol.vn/sol-lam-viec-the-nao/`.

**Bước 3 — Kiểm rich result FAQ**
- Dán `sol.vn/cau-hoi/` vào **search.google.com/test/rich-results** → phải thấy **FAQ hợp lệ**.

**Bước 4 — Theo dõi (sau 3-7 ngày)**
- GSC → **Trang (Pages)** → xem URL đã "Đã lập chỉ mục" chưa. Chưa thì Request lại.

---

## 4. Việc kỹ thuật còn lại (em làm)
- [ ] Thêm `sol-lam-viec-the-nao` vào `huongdi-public/sitemap.xml`
- [ ] (Tuỳ chọn) Thêm Article schema cho trang phương pháp
- [ ] 301 redirect các trang cai thuốc cũ trên sol.vn (khi anh dọn cụm bothuocla)

---

*Ghi chú: trang tĩnh sol.vn (trang chủ) + huongdi dùng sitemap.xml riêng; các trang WP (phuong-phap, cau-hoi, lien-he) dùng sitemap Yoast tự sinh.*
