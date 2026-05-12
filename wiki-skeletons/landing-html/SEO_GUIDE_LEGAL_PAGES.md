# Hướng dẫn SEO — 3 trang pháp lý Sol

> Khang điền theo các giá trị dưới khi paste 3 file HTML vào WordPress + Yoast SEO / Rank Math.

---

## TRANG 1: Chính Sách Bảo Mật (`sol.vn/chinh-sach-bao-mat`)

### Khi tạo Page trong WordPress

| Field | Giá trị |
|---|---|
| **Title** | Chính Sách Bảo Mật |
| **Slug** | `chinh-sach-bao-mat` |
| **Parent** | (none) |
| **Template** | Default |
| **Featured image** | Logo Sol (clay #B25C2C) hoặc icon 🔒 |

### Yoast / Rank Math điền

| Field | Giá trị (copy/paste) |
|---|---|
| **Focus keyword** | `chính sách bảo mật sol` |
| **SEO title** | `Chính Sách Bảo Mật \| Sol — Đi Cùng Sol bỏ thuốc lá` |
| **Meta description** (155 ký tự) | `Sol thu thập data gì, dùng thế nào, lưu bao lâu. Theo Nghị định 13/2023. Không bán data, không cookies bên thứ ba. Email: contact@sol.vn` |
| **Open Graph title** | giống SEO title |
| **OG description** | giống meta description |
| **OG image** | Logo Sol 1200×630 (Khang upload sau) |
| **Robots** | Index, Follow |
| **Canonical** | `https://sol.vn/chinh-sach-bao-mat` (WP tự gen) |

---

## TRANG 2: Điều Khoản Sử Dụng (`sol.vn/dieu-khoan-su-dung`)

### Khi tạo Page

| Field | Giá trị |
|---|---|
| **Title** | Điều Khoản Sử Dụng |
| **Slug** | `dieu-khoan-su-dung` |
| **Parent** | (none) |
| **Template** | Default |

### Yoast / Rank Math

| Field | Giá trị |
|---|---|
| **Focus keyword** | `điều khoản sử dụng sol` |
| **SEO title** | `Điều Khoản Sử Dụng \| Sol — Hoàn tiền 100% không hỏi` |
| **Meta description** | `Sol hoàn tiền 100% trong 14-30 ngày — không hỏi lý do. Huỷ Sol Đi Cùng 1 chạm. Đại Sứ Sol KHÔNG là đa cấp. Liên hệ: 024 3993 1800` |
| **OG title** | giống SEO title |
| **OG description** | giống meta description |
| **Robots** | Index, Follow |

---

## TRANG 3: Tuyên Bố Miễn Trừ (`sol.vn/tuyen-bo-mien-tru`)

### Khi tạo Page

| Field | Giá trị |
|---|---|
| **Title** | Tuyên Bố Miễn Trừ |
| **Slug** | `tuyen-bo-mien-tru` |
| **Parent** | (none) |
| **Template** | Default |

### Yoast / Rank Math

| Field | Giá trị |
|---|---|
| **Focus keyword** | `tuyên bố miễn trừ sol` |
| **SEO title** | `Tuyên Bố Miễn Trừ \| Sol KHÔNG là sản phẩm y tế` |
| **Meta description** | `Sol KHÔNG là sản phẩm y tế, KHÔNG kê đơn, KHÔNG hứa kết quả. Khẩn cấp y tế gọi 115. Tham khảo + tự đánh giá — không thay bác sĩ.` |
| **OG title** | giống SEO title |
| **OG description** | giống meta description |
| **Robots** | Index, Follow |

---

## Sau khi publish 3 trang — Khang làm 4 việc nhỏ

### 1. Submit sitemap mới cho Google

Vào **Google Search Console** → Sitemaps → Submit `https://sol.vn/sitemap_index.xml`. Google sẽ crawl 3 trang mới trong 1-7 ngày.

### 2. Internal link cho 3 trang

Đảm bảo footer toàn site (theme WP) có link tới 3 trang. Nếu theme chưa có, vào:

**Appearance → Menus** → tạo menu "Footer Legal" với 3 items:
- Chính Sách Bảo Mật → /chinh-sach-bao-mat
- Điều Khoản Sử Dụng → /dieu-khoan-su-dung
- Tuyên Bố Miễn Trừ → /tuyen-bo-mien-tru

Gán menu vào "Footer Menu" location.

### 3. Test mobile + desktop

Mở `sol.vn/chinh-sach-bao-mat` trên điện thoại + máy tính:
- Header + menu Sol hiện đúng
- Body đọc được không bị tràn
- Link tổng đài + email click được
- Footer Sol hiện đầy đủ

### 4. Test structured data

Vào https://search.google.com/test/rich-results → paste URL 3 trang → kiểm tra JSON-LD valid.

---

## Tham khảo: 4 SEO yếu tố em đã thêm sẵn vào file HTML

3 file 06/07/08 đã có sẵn:

✓ **Heading hierarchy đúng** — 1 H1 + nhiều H2 + H3
✓ **Internal link chéo** — 06↔07↔08 link nhau
✓ **Inline CSS** — không phụ thuộc external stylesheet
✓ **Structured data JSON-LD** — Schema.org WebPage + Organization

Khang không phải sửa gì trong file HTML. Chỉ điền Yoast/Rank Math khi paste vào WP.

---

## Em sẽ làm tiếp (Sprint 2)

- [ ] Thêm footer cố định trong app dashboard + widget với 3 link pháp lý
- [ ] Onboarding ẩn danh: checkbox đồng ý 3 trang trước khi vào Sol Khám Phá
- [ ] Email Day 0/7/14: footer email có link 3 trang + unsubscribe
- [ ] Popup hoàn tiền: hiện link Điều Khoản Section 4

*Cập nhật: Sprint 1.11 — 09/05/2026*
