# Tuyên Bố Miễn Trừ Trách Nhiệm — Đi Cùng Sol

YMYL Disclaimer toàn diện cover 3 trụ Thân-Tâm-Trí, thay thế phiên bản cũ chỉ tập trung cho bỏ thuốc lá.

## URL
`https://sol.vn/tuyen-bo-mien-tru/`

## Nội dung

- **12 sections** cover toàn bộ 3 trụ
- **Section 3** chi tiết miễn trừ theo từng trụ:
  - 3.1 Thân — Sức khoẻ thể chất (bothuocla.sol.vn)
  - 3.2 Tâm — Tinh thần & chiêm nghiệm (sol.vn/ngam/)
  - 3.3 Trí — Sự nghiệp & tái khởi nghiệp (huongdi.sol.vn)
- **Section 5** bảng chuyên gia cần tham khảo (10 tình huống YMYL)
- **Schema FAQPage** 7 Q&A cho rich snippet Google

## Voice

- "mình - anh" (NEVER "tôi - bạn")
- Founder bio: Sáng lập + GĐ CTY CNTT 20 năm + Sáng lập DN TMĐT 8 năm (KHÔNG phải ex-FPT/Viettel)
- Term "Tâm" (NOT "Ngẫm") — URL vẫn `/ngam/`

## Deploy

### Bước 1: Cài đặt (nếu chưa)
```bash
cd C:\BOTHUOCLA\sol-widget\docs\tuyen-bo-mien-tru-page
# Reuse modules từ pillar-to-wp
# Không cần npm install riêng
```

### Bước 2: Verify .env.wp
```bash
cat ../pillar-to-wp/.env.wp
# WP_URL=https://sol.vn
# WP_USER=admin
# WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

### Bước 3: Run script
```bash
# Lần đầu — search slug "tuyen-bo-mien-tru" + update OR create
node update-tuyen-bo-mien-tru-page.js

# Nếu biết post ID
node update-tuyen-bo-mien-tru-page.js --post-id 1234
```

### Bước 4: Verify wp-admin
1. Vào `https://sol.vn/wp-admin/edit.php?post_type=page`
2. Tìm "Tuyên Bố Miễn Trừ Trách Nhiệm — Đi Cùng Sol"
3. Preview để check format
4. Verify Rank Math:
   - Focus keyword: `tuyên bố miễn trừ Sol`
   - Title tag chuẩn
   - Meta description chuẩn
   - Canonical URL: `https://sol.vn/tuyen-bo-mien-tru/`

### Bước 5: Publish + GSC
1. Đổi status: Draft → Publish
2. Vào Google Search Console
3. URL Inspection: `https://sol.vn/tuyen-bo-mien-tru/`
4. Click "Request Indexing"

## Cross-link cần thực hiện

Sau khi publish, update các trang sau để link về `/tuyen-bo-mien-tru/`:

1. **Footer huongdi.sol.vn** — `huongdi-layout/footer.html` đã có link YMYL disclaimer, cần update text thêm rõ "Đọc tuyên bố đầy đủ tại sol.vn/tuyen-bo-mien-tru/"
2. **Footer sol.vn (WP)** — Update Customizer hoặc theme footer
3. **Trang Khang Sol** (sol.vn/khang-sol/) — Section disclaimer cuối trang link tới
4. **Trang Sol Là Gì** (sol.vn/sol-la-gi/) — Section #10 disclaimer link tới
5. **7 Pillar Pages** huongdi — Mỗi bài thêm note "Xem tuyên bố miễn trừ đầy đủ"
6. **bothuocla.sol.vn** — Footer cập nhật

## YMYL Compliance Check

- ✅ Không bán dịch vụ y tế
- ✅ Không tư vấn tài chính có giấy phép
- ✅ Không khuyến nghị đầu tư cụ thể
- ✅ Cảnh báo rủi ro mất vốn rõ ràng
- ✅ Không MLM, không ponzi
- ✅ Affiliate disclosure rõ ràng (hiện không có)
- ✅ Hotline tâm lý 1800 599 920 + 115 + 18001567
- ✅ Bảng "Khi nào CẦN chuyên gia"
- ✅ Last updated date rõ ràng
- ✅ Contact email contact@sol.vn

## Lưu ý

- Page này KHÔNG cần featured image lớn (legal page, ít share social)
- Robots: index, follow (Google cần thấy disclaimer trên domain)
- Không nên publish chung 1 lần với các update khác — publish riêng để track index
