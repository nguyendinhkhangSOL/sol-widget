# EOD — 2026-08-07 · UX Audit + vá P0 (sáng)

**Phiên:** Redesign UX U40-60 (Sổ, /toi/, chấm sáng 5 bước) → Việt hoá lộ trình → Audit UX toàn hành trình → vá P0-1/P0-3/P0-4.
**Tất cả đã LIVE + git push.** Chiều làm tiếp **P0-2 (wizard Bước 5: 36 bước → 5 chặng)**.

---

## 1) Đã ship hôm nay (đều live)

| # | Việc | Kết quả |
|---|---|---|
| 1 | **Sổ Hành Trình** dựng lại | Chữ to 18px, chỉ mở giai đoạn đang làm, thu gọn phần còn lại, "✓ Xong" |
| 2 | **Trang /toi/** tổ chức lại | La Bàn Sol = thẻ hero #1, đường ray Bước 4/5 + Sổ + Bản đồ; hạ Prompt Studio/Library xuống dòng nhỏ |
| 3 | **Chấm sáng Bước 4/5** | Backend nối tín hiệu thật: Kiểm thử (user_business_memory.kiemthu) + Làm thật (journeys) |
| 4 | **Việt hoá lộ trình** | Thay ~24 từ Tây (affiliate, checklist, coaching, OA…) → tiếng Việt; SQL có backup; 64 mô hình + 50 việc Sổ + 12 tiêu đề |
| 5 | **Báo cáo UX** (.docx) | `C:\BOTHUOCLA\Bao-cao-UX-Sol-LaBan-2026-08-07.docx` — bản đồ điểm chạm + P0/P1/P2 + lộ trình vá |
| 6 | **P0-1** | Thống nhất tên 5 bước (Thấu hiểu·Khai phá·Chọn hướng·Kiểm thử·Làm thật) ở sol-flow.js, sol-ui.js, quiz, footer, hub, ket-qua, thau-hieu, toi; sửa link Bước 4/5 (menu/footer trỏ sai vào Sổ → về kiem-thu/lam-ho-so) |
| 7 | **Cache-bust** | Thêm `?v=20260807` cho sol-flow.js/sol-ui.js trên 33 trang → khách cũ thấy ngay |
| 8 | **P0-3** | Khớp %/dot/"Bước tiếp theo" ở /toi/: backend coi "có Sổ = đã chọn hướng + đang làm thật"; frontend lấp thang đơn điệu (không sáng lộn thứ tự) |
| 9 | **P0-4** | Trang Kết quả: spinner ngắn → skeleton cao (min-height 72vh), footer xuống đáy, "chỉ vài giây thôi" |

---

## 2) Trạng thái git / deploy

- **Repo:** github.com/nguyendinhkhangSOL/sol-ecosystem `main` — đã push toàn bộ (Sổ, /toi/, dashboard.ts, sql việt hoá, P0-1+cachebust, P0-3, P0-4).
- **Backend:** `huongdi-api` (pm2 id 1) đã restart sau mỗi lần build. Đang online.
- **DB:** đã chạy SQL việt hoá lộ trình (backup: `_bak_msec9_/_bak_jact_/_bak_jphase_20260807`).

---

## 3) Sự cố + xử lý (bài học)

- **403 Forbidden /toi/** sau khi giải nén gói cache-bust → file trong tar giữ quyền **700** (chỉ chủ đọc), nginx không đọc được.
  - **Fix:** `sudo find /var/www/huongdi/public -type d -exec chmod 755 {} \; && ... -type f -exec chmod 644 {} \;` → toi=200.
  - **Bài học:** khi đóng tar để deploy, phải set quyền 644/755 (file sandbox mặc định 700).

---

## 4) Còn nợ → phiên CHIỀU

| Ưu tiên | Việc | Ghi chú |
|---|---|---|
| **P0-2** ⭐ | Wizard Bước 5: **36 bước → 5 chặng** + lõi ~10 ô + nút "Lưu & nghỉ" + hiện "Chặng X/5 · còn ~Y phút" | Việc lớn nhất, đụng logic wizard (`la-ban-huong-di/lam-ho-so/`). Nên mở **phiên mới** cho gọn context |
| P1-1 | Đưa "La Bàn Sol" thành mục nav hạng 1 (đang chìm trong "AI Studio") | |
| P1-3 | Việt hoá nav: "AI Studio"→"Công cụ AI"; cân nhắc "Vốn Ngầm" | |
| P1-2/4/5 | Nới lượt free La Bàn Sol; tăng ô "bấm chọn" trong wizard; viết lại gợi ý ngắn gọn | |
| Nội dung | Biên tập lộ trình 90 ngày các mô hình lõi cho dễ hiểu hơn (không chỉ thay từ) | |

---

## 5) Ghi chú kỹ thuật (đọc trước khi vá tiếp)

- **DRIFT (quan trọng):** LIVE `la-ban-huong-di/ket-qua/index.html` có **khối paywall** KHÔNG có trong repo. `thanh-toan/` cũng có nội dung riêng. → **KHÔNG ghi đè cả file 2 trang này**; vá bằng script python targeted (giữ paywall). Các script trong `C:\BOTHUOCLA\_content-fix-gia\patch-ketqua-*.py`.
- **Cache-bust:** version hiện tại `?v=20260807`. Lần sau sửa sol-flow.js/sol-ui.js phải **bump version** để khách cũ nhận bản mới.
- **Deploy gói nhiều file:** dùng tar nhưng nhớ `chmod 644/755` sau khi giải nén (tránh 403).
- **File hạ tầng:** VPS 103.72.57.11 user solop; pm2 huongdi-api id1 port 4001; DB huongdi_prod; FE tĩnh nginx `/var/www/huongdi/public`; backend `/var/www/huongdi/backend` (`npm run build`=tsc gate → pm2 restart).
- **5 bước chuẩn (chốt):** 1 Thấu hiểu · 2 Khai phá · 3 Chọn hướng · 4 Kiểm thử · 5 Làm thật.

---

## 6) CHIỀU 07/08 — vá nốt P0-2 + trọn P1 (đều live + git)

| # | Việc | Kết quả |
|---|---|---|
| **P0-2** | Wizard Bước 5: **36 bước → 5 chặng** (① Bán gì ② Vận hành ③ Khách ④ Quảng bá ⑤ Giấy tờ) + **bản nháp nhanh 10 ô lõi** ("câu i/10 · còn ~X phút") + mốc giữa "🎉 đủ để bắt đầu" → khai sâu tuỳ chọn (26 ô) + **"💾 Lưu & nghỉ"** (resume câu chưa trả lời) | ✅ live |
| **P0-4** | Trang Kết quả: spinner ngắn → **skeleton cao 72vh**, footer xuống đáy (hết "trông như lỗi") | ✅ live (patch python giữ paywall) |
| **P1-1** | **La Bàn Sol thành mục nav hạng nhất** (trước chôn trong AI Studio) | ✅ live |
| **P1-3** | "🎨 AI Studio" → **"🛠 Công cụ AI"** + "Thư viện Prompt"→"Mẫu câu lệnh AI"; cache-bump **v=20260807b** (33 html) | ✅ live |
| **P1-2** | Lượt hỏi La Bàn Sol FREE **5 → 10/tháng** (app_config `free_ai_quota`=10 + nâng row `sol_chat_quota` tháng này) | ✅ (SQL `2026-08-07-free-ai-quota-10.sql`) |
| **P1-4** | Wizard: **15/36 câu** có nút bấm-chọn (thêm chi phí, giữ khách, mục tiêu bán, giấy tờ) | ✅ live |

**→ Đã đóng trọn P0 (1-4) + P1 (1-4) của báo cáo UX.**

### Còn nợ (phiên sau)
- **P1-5**: gợi ý trong wizard hơi văn hoa ("cưỡi đúng cơn sóng chính sách…") — nằm ở `solSuggestion` theo từng mô hình (DB), gộp vào tuyến **biên tập nội dung mô hình lõi**.
- **Biên tập lộ trình 90 ngày** các mô hình lõi cho dễ hiểu hơn (không chỉ thay từ).

### Ghi chú kỹ thuật thêm
- **Sự cố 403 lần 2 (đã fix):** giải nén tar cache-bust khiến file quyền 700 → `sudo find ... -exec chmod 644/755`. **Luôn chmod sau khi giải nén tar.**
- **Cache version hiện tại: `?v=20260807b`.** Lần sau sửa sol-ui.js/sol-flow.js phải bump tiếp (vd `...c`).
- Patch giữ-paywall cho ket-qua: `C:\BOTHUOCLA\_content-fix-gia\patch-ketqua-*.py` (skeleton, vbump).

---

## 7) TỐI 07/08 — Biên tập nội dung mô hình lõi (đóng nốt tuyến còn nợ)

| # | Việc | Kết quả |
|---|---|---|
| **Rút gọn lộ trình 90 ngày** | 8 mô hình lõi **MH-101→108**: viết lại từng dòng cho ngắn – dễ đọc – giữ MỌI con số (12 triệu, 20 buổi×2 giờ, cọc 30–50%, 5–8%…), bỏ chữ Tây/văn hoa | ✅ live (DB) |
| **P1-5** | Gợi ý wizard bớt văn hoa (`dossier.ts` — cắt đuôi tagline sau dấu "—") | ✅ live (tsc pass + pm2 restart) |
| **Fix việt hoá** | Dọn "Zalo Zalo doanh nghiệp" (MH-101) + "Shopee (chương trình tiếp thị liên kết) (+ Accesstrade)" (MH-102) | ✅ |

**Cách làm (quan trọng để sau này tái dùng):** sửa **theo từng dòng** (old→new exact match) áp cho **cả model_sections gốc LẪN journey đang chạy** (`journey_actions`/`journey_phases`) → Sổ hiện tại của khách cũng gọn ngay **không mất tick**. Vì journey là bản copy đông cứng lúc "Bắt đầu hành trình", sửa mình model_sections chỉ ảnh hưởng journey MỚI.

- **Script sinh SQL:** `C:\BOTHUOCLA\_content-fix-gia\gen_mh103.py` (mẫu), `gen_batch.py` (102+104), `gen_batch2.py` (105–108). Đọc old exact từ `sec9ids.txt` (dump `id@@@model_num@@@content`, ⏎ = xuống dòng), ghép new NH/NI, emit backup + UPDATE by id + per-line find-replace.
- **File SQL đã chạy (có backup `_bak_msec9_20260807b/c/d/e`):** `rutgon-lotrinh-MH101.sql`, `rutgon-MH103.sql`, `rutgon-MH102-104.sql`, `rutgon-MH105-108.sql` — đã copy vào repo `huongdi-backend/sql/2026-08-07-rutgon-lotrinh-*.sql` (lịch sử migration).
- **Git:** dossier.ts đã push (commit `b67c224`). 4 file SQL rút gọn vừa copy vào repo — chờ push kèm phiên sau (hoặc push ngay: `git add -A && git commit -m "archive SQL rut gon lo trinh MH101-108" && git push`).

**→ ĐÓNG TRỌN tuyến biên tập nội dung mô hình lõi (P1-5 + lộ trình 8 lõi). Không còn nợ của báo cáo UX.**

### Còn nợ (tuỳ chọn, không gấp)
- **56 mô hình không-lõi** (MH-1xx khác + 2xx): lộ trình đã việt-hoá (thay từ) nhưng chưa rút gọn từng câu như 8 lõi. Ưu tiên thấp — khách chủ yếu rơi vào 8 lõi. Nếu làm: cùng script `gen_batch*.py`, đọc old từ `sec9ids.txt`.
- Push 4 file SQL rút gọn vào GitHub (lịch sử migration).
