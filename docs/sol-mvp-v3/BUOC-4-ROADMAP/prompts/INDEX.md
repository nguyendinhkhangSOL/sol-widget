# 37 Prompts Ready-to-Paste — Bước 4 Roadmap

**Ngày build**: 2026-07-05
**Total files**: 37 prompt files
**Skip**: 1 file (Freelancer Chuyên Môn — đã có sample)
**Cần generate**: 36 files

---

## Quy trình sử dụng

### Bước 1: Chuẩn bị

- Tạo folder `generated/` bên cạnh folder `prompts/` để lưu JSON output
- Mở https://claude.ai (dùng Sonnet 4.5 — free plan OK)

### Bước 2: Với mỗi file trong `prompts/`

1. Mở file `.md` (VD `02-freelancer-chuyen-mon.md`)
2. Skip nếu đã ✅ DONE
3. Copy toàn bộ nội dung từ `═══ PROMPT ═══` xuống hết
4. Paste vào Claude web
5. Claude generate JSON output
6. Copy JSON → save vào `generated/roadmap-<slug>.json`
7. Đổi status trong file `.md` thành ✅ DONE + note ngày

### Bước 3: Khi có đủ 37 files JSON trong `generated/`

Ping em → em ship script SQL import vào DB (Phase 1e).

---

## Danh sách 37 mô hình

| # | Mô hình | Slug | Status |
|---|---------|------|--------|
| 01 | Blog / Website Chuyên Môn | `blog-chuyen-mon` | ⬜ TODO |
| 02 | Freelancer Chuyên Môn | `freelancer-chuyen-mon` | ✅ DONE (sample) |
| 03 | Đầu Tư Bất Động Sản Cho Thuê | `dau-tu-bat-dong-san` | ⬜ TODO |
| 04 | Chụp Ảnh / Quay Video Sự Kiện | `chup-anh-quay-video` | ⬜ TODO |
| 05 | Dịch Vụ Vận Chuyển / Giao Hàng | `van-chuyen-giao-hang` | ⬜ TODO |
| 06 | Kinh Doanh Online 1 Người | `kinh-doanh-online-1-nguoi` | ⬜ TODO |
| 07 | Life Coaching / Career Coaching | `life-coaching` | ⬜ TODO |
| 08 | Cho Thuê Phòng Trọ / Airbnb | `cho-thue-phong-tro-airbnb` | ⬜ TODO |
| 09 | YouTube Channel | `youtube-channel` | ⬜ TODO |
| 10 | Dropshipping | `dropshipping` | ⬜ TODO |
| 11 | Marketing / Social Media Agency Nhỏ | `marketing-agency-nho` | ⬜ TODO |
| 12 | Tư Vấn Doanh Nghiệp | `tu-van-doanh-nghiep` | ⬜ TODO |
| 13 | Giảng Dạy Online (Khóa Học) | `giang-day-online` | ⬜ TODO |
| 14 | Sửa Chữa Nhà / Điện Nước | `sua-chua-nha` | ⬜ TODO |
| 15 | Kinh Doanh Đồ Gia Dụng / Nội Thất | `kinh-doanh-do-gia-dung` | ⬜ TODO |
| 16 | Tổ Chức Sự Kiện | `to-chuc-su-kien` | ⬜ TODO |
| 17 | Đầu Tư Tài Chính (Cổ Phiếu / Quỹ ETF) | `dau-tu-tai-chinh` | ⬜ TODO |
| 18 | Gia Sư / Dạy Kèm | `gia-su-day-kem` | ⬜ TODO |
| 19 | Dịch Vụ Vệ Sinh / Dọn Dẹp | `dich-vu-ve-sinh` | ⬜ TODO |
| 20 | Podcast | `podcast` | ⬜ TODO |
| 21 | Chuyên Gia Đào Tạo Nội Bộ | `chuyen-gia-dao-tao-noi-bo` | ⬜ TODO |
| 22 | Chăm Sóc Sức Khỏe Tại Nhà | `cham-soc-suc-khoe-tai-nha` | ⬜ TODO |
| 23 | Dịch Vụ Kế Toán / Thuế Cho SME | `ke-toan-thue-sme` | ⬜ TODO |
| 24 | Luật Sư / Kế Toán Độc Lập | `luat-su-ke-toan-doc-lap` | ⬜ TODO |
| 25 | Đại Lý / Nhà Phân Phối | `dai-ly-nha-phan-phoi` | ⬜ TODO |
| 26 | Viết Sách / Ebook | `viet-sach-ebook` | ⬜ TODO |
| 27 | Workshop Chuyên Đề | `workshop-chuyen-de` | ⬜ TODO |
| 28 | Dịch Vụ Thú Cưng | `dich-vu-thu-cung` | ⬜ TODO |
| 29 | Nhượng Quyền Thương Hiệu | `nhuong-quyen-thuong-hieu` | ⬜ TODO |
| 30 | Newsletter / Substack | `newsletter` | ⬜ TODO |
| 31 | Thiết Kế Độc Lập (Graphic / UX) | `thiet-ke-doc-lap` | ⬜ TODO |
| 32 | Mentoring Doanh Nhân Trẻ | `mentoring-doanh-nhan` | ⬜ TODO |
| 33 | Kinh Doanh Thực Phẩm Đặc Sản | `kinh-doanh-thuc-pham-dac-san` | ⬜ TODO |
| 34 | Affiliate Marketing | `affiliate-marketing` | ⬜ TODO |
| 35 | Lập Trình Viên Freelance | `lap-trinh-vien-freelance` | ⬜ TODO |
| 36 | Dịch Thuật Chuyên Ngành | `dich-thuat-chuyen-nganh` | ⬜ TODO |
| 37 | Kinh Doanh Handmade / Thủ Công | `kinh-doanh-handmade` | ⬜ TODO |


---

## Tips để paste nhanh

- **Tab quản lý**: Mở 3-4 tab Claude web song song, chạy đồng thời 3-4 mô hình
- **Naming JSON output**: `roadmap-<slug>.json` (VD `roadmap-life-coaching-career-coaching.json`)
- **Track progress**: Đổi filename `.md` thành `.done.md` sau khi generate xong
- **Nếu Claude trả về markdown**: Copy chỉ phần JSON bên trong ```json ... ```
- **Retry nếu lỗi**: Nếu JSON không valid, chat "Trả về JSON hợp lệ, không markdown" → Claude fix

## Time estimate

- 3-5 phút/mô hình × 36 mô hình = 2-3 giờ nếu tự làm
- Có thể chia người, hire assistant paste, hoặc làm dần trong tuần

## Nếu anh nạp Anthropic credit thay vì manual

Chạy script bulk generate:
```bash
ssh sol-vps
cd /var/www/huongdi/backend
sudo node scripts/generate-roadmaps.js
```

Script sẽ tự chạy 36 mô hình còn lại, cost ~$6, thời gian ~15 phút.
