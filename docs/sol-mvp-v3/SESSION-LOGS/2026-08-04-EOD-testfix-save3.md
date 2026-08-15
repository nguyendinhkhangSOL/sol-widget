# EOD WRAP — 2026-08-04

Phiên dài: hoàn thiện SEO T18 + GSC, gói "test-fix" 5 điểm anh Khang test ra, và tính năng "Lưu + xem lại" kết quả cho cả 3 bước.

---

## ✅ ĐÃ LIVE (chạy trên bản thật)

1. **GSC** — xin lập chỉ mục lại `sol.vn/` + `sol.vn/sol-la-gi/` (đã "Đã yêu cầu lập chỉ mục").
2. **T18 kịch bản** — `C:\BOTHUOCLA\Tap18\` : `T18-NotebookLM-Handoff.md` + `CAPTION-T18.md`.
3. **Bài trụ WP nâng cấp** — `sol.vn/huong-di/tim-khach-hang-dau-tien/` (post 3699): mở bài góc "sợ ế" + link chéo T16/T17. LIVE.
4. **Case study → "ví dụ minh hoạ"** — trang chi tiết hồ sơ (`/la-ban-huong-di/chi-tiet/`): section 8 của cả 58 hồ sơ đổi tên hiển thị + badge + chú thích, bỏ dev-note "(bản nháp)". LIVE.
5. **Bảng phân tích của khách** — trang Kết quả: khối "📊 Bảng phân tích của anh chị" (3 giai đoạn) đọc từ dữ liệu đã lưu. LIVE.
6. **Bảng chọn từ khoá Bước 2** — trang Kết quả: ô "nghề cũ" thành bảng chip 2 tầng (15 nhóm → chuyên môn con, chọn ≤5), set thẳng mã nghề cho engine. LIVE + đã nghiệm thu bấm thử.
7. **Backup DB** — `/tmp/huongdi_backup_.sql.gz` (757K) trên VPS trước khi đụng lõi.

## ⏳ ĐÃ SHIP CODE — CHỜ ANH DEPLOY (mai)

8. **SAVE3 — nút "Lưu + xem lại" cả 3 bước** (Bước 1/2 nút "👤 Lưu & xem trong Hồ sơ của tôi", Bước 3 link "Xem lại ở Hồ sơ của tôi"). 3 file đã sửa + JS hợp lệ:
   - `huongdi-public/kham-pha-ban-than/index.html`
   - `huongdi-public/kiem-ke-nguon-luc/index.html`
   - `huongdi-public/la-ban-huong-di/ket-qua/index.html`
   - **Lệnh deploy đã đưa trong chat** (scp b1/b2/b3 → cp + chown). An toàn, không restart.

## 📋 VIỆC CỦA ANH (tồn từ trước)

- **Trang chủ sol.vn** — upload `trang-chu-sol-moi.html` → `index.html` qua cPanel (bản live còn cũ: menu khó bấm + số 64 chưa động).
- **T18 audio** — chạy NotebookLM theo handoff → tải `.m4a` về `C:\BOTHUOCLA\Tap18\` → báo em dựng video/reel → nhúng vào bài 3699 → rồi mới xin GSC index lại (gộp chữ + video 1 lần).

## 🔜 MAI LÀM TIẾP (theo thứ tự)

1. **Nghiệm thu SAVE3** sau khi anh deploy 3 file (bấm thử nút Lưu ở Bước 1 → /toi/).
2. **TESTFIX-3 (việc lõi cuối)** — audit đã xong: **48/58 hồ sơ thiếu "tay nghề gốc"**. Em soạn **bảng đề xuất** (48 hồ sơ → mã tay nghề gốc + lợi thế) cho anh duyệt → gom **1 lệnh SQL UPDATE** (đã có backup) → deploy.
3. Tuỳ chọn: bản gọn bảng phân tích ở `/toi/`; vá case study trong Sổ Hành Trình cho đồng bộ.

## Ghi chú kỹ thuật
- Token đăng nhập: `sol_jwt`. Save endpoint: `POST /api/me/quiz-result {p1,p2,matches}` — SAVE3 dùng FE-merge (GET rồi POST) để không xoá bước khác.
- FE tĩnh: `/var/www/huongdi/public/…`. Backend: `/var/www/huongdi/backend` (deploy #417 SQL chạy qua `sudo -u postgres psql huongdi_prod`).
- Taxonomy 2 tầng: `C:\BOTHUOCLA\_testfix-core\taxonomy-chuyen-mon-2tang.md`.
