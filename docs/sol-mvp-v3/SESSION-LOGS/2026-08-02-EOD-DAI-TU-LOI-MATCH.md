# EOD WRAP — 02/08/2026 · Đại tu LÕI Test + Hồ sơ hướng đi
*Phiên marathon. Mổ + vá xong bộ máy chính của Sol (test hướng đi + 58 hồ sơ + thuật toán match + thẻ kết quả). Test đậu nhiều persona.*

## 1. ĐÃ LÀM (Pha 0 → 4, chạy live hết)
- **Pha 0** ✅ Backup + thêm 4 cột (rubric_version, can_ha_tang, can_do_nghe, content_reviewed_at).
- **Pha 1** ✅ Ẩn 6 hồ sơ trùng → **58 hồ sơ published**. Bước 3 tự hiện đúng số (đọc từ API).
- **Pha 2** ✅ Chấm lại **cả 58 hồ sơ** theo rubric v1.0 (2 đợt): khử lạm phát 101-108, sửa MH-124, **dựng archetype người/quan hệ**, chấm mới 14 Sol + rà 29 partner. Hết drift, hết default-50.
- **Pha 3 (engine)** ✅ Sửa `match-v3.ts`: **vốn/thu nhập → tham khảo** (hết lọc oan) + **cảnh báo mềm** (⏳📚💪🏗️🧰). Deploy backend OK.
- **Pha 4 (thẻ kết quả)** ✅ Thẻ mới "pro": 👤 Hợp với · ⚠️ chip cảnh báo · **🔴 Rủi ro / ⛔ Không hợp** (nói thẳng chỗ chết) · 💰 Vốn tham khảo. Deploy FE OK. Anh duyệt "ra dáng tư vấn trung thực có chất".

## 2. NGHIỆM THU (test engine live)
| Persona | Top hướng | Đúng? |
|---|---|---|
| Quan hệ (chị Nga) | Workshop · Đại lý · Coaching · Môi giới | ✅ |
| Xây dựng (anh Khang) | Cho thuê thiết bị/tài sản · Chụp sự kiện | ✅ |
| Chuyên môn | BHXH · Biên-phiên dịch · Thủ tục HC | ✅ |
| Nội dung | Blog (⏳ cảnh báo lâu ra tiền) · Lập trình | ✅ |
→ Engine phân biệt sạch theo chất riêng · vốn thấp vẫn thấy hướng vốn cao · cảnh báo mềm bật đúng chỗ.

## 3. FILE MỚI (C:\BOTHUOCLA\)
audit-test · audit-64-hồ-sơ · rubric-1.0 · dedup-quyết-định · lộ-trình-6-pha · **SOL-UX-U40-MOBILE-PLAN** (mới).

## 4. CÒN LẠI
- **Pha 4C — UX mobile cho U40** (việc tiếp theo chính): thuần Việt, cỡ chữ ≥16px, nút ≥44px, nút đáy cố định, thêm breakpoint. **Cách chuẩn: anh test trên điện thoại thật, chụp chỗ đau → em vá trúng.** (Xem SOL-UX-U40-MOBILE-PLAN.md)
- Cụm "64→số động" ở **trang chủ (5 chỗ ghi cứng) + email notification.ts + getFacts đếm động** — Bước 3 đã đúng, còn mấy chỗ tĩnh này gộp vào 1 lượt.
- L1-L4 (quiz FE): 1 nguồn điểm trục, gỡ "nghiêng nhóm" Bước 2, sửa rủi ro/runway, giảm độ nhạy — chưa làm (là FE quiz).
- Pha 5: nghiệm thu tổng + bật cờ "hồ sơ sống".

## 4b. TẦNG 2 — Lớp lọc tay nghề (nghề cũ ↔ hồ sơ)
*Gốc bệnh anh bắt: test đo "kiểu người" nhưng không đo "biết làm gì" → chụp ảnh nhảy lên top cho người không phải dân ảnh.*
- ✅ Thiết kế xong: `SOL-SKILL-MAPPING-DESIGN.md` (ô nhập tay + AI phân tích → mã chuyên môn · nhãn "tiên quyết"/"lợi thế cạnh tranh").
- ✅ Nền đã deploy: schema (can_tay_nghe, loi_the_neu_co, skills, skills_raw) + **tag 58 hồ sơ** (11 nghề craft bị gate, 53 mở).
- ✅ **ĐÃ SHIP TRỌN (02/08 tối):** match-v3 đọc `skills` (body/lưu) → gate: thiếu tay nghề bắt buộc −25 + nhãn 🎯 tiên quyết · có → +8 + ⭐ lợi thế · lợi thế phụ +4. FE trang kết quả có **ô 🧰 nhập nghề cũ** + parser tiếng Việt (15 nhóm) + nhãn tay nghề trên thẻ. Deploy + verify LIVE trên phiên anh (ACTIVE): khai "kế toán"→KT #1 ⭐, chụp ảnh sự kiện rớt top; khai "nhiếp ảnh"→ảnh vọt #2 ⭐; không khai→ảnh ở #6 nhãn 🎯 không phạt. **backend tsc 0 lỗi.**
- ⏳ Còn (nhỏ, tuỳ chọn): (a) parser AI thật thay bộ từ khoá; (b) lưu skills lên tài khoản (giờ đang localStorage/body); (c) **cân nhắc: MH-121 "Chụp ảnh SP + vận hành TMĐT" tiêu đề dẫn bằng "Chụp ảnh" → có thể đổi tên dẫn bằng "Vận hành gian hàng TMĐT" để U40 không nhầm là nghề ảnh.**

## 5. Việc treo khác (không gấp)
- `hide-6` đã chạy. T17 chờ anh ném NotebookLM. T16 3 reel chờ rải lịch.

## 6. LƯU Ý KỸ THUẬT (cho lần sau)
- Đổi DB/deploy: **scp file trong C:\BOTHUOCLA thẳng lên VPS** (khỏi base64). Nếu inline SQL → **base64 -w0, giữ <800 ký tự/lệnh** (PowerShell gãy dòng dài).
- Backend gate: `npm run build && pm2 restart huongdi-api` (build lỗi thì không restart).
- match_scores KHÔNG cache → đổi điểm ăn ngay. app_config CÓ cache → cần pm2 restart.
