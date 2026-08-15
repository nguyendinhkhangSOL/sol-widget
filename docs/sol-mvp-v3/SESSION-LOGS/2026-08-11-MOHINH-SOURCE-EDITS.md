# SỬA NGUỒN MÔ HÌNH — bỏ giọng bán hàng, checklist chốt bằng điều kiện LOẠI
Ngày 2026-08-11 · Áp vào **DB app (CMS biên tập model)** rồi báo AI regenerate trang WP.

## 0. Kết luận quét 12 nguồn
- **Cả 12 đều đã có mục "phải trung thực".** Cấu trúc đúng.
- **5 trang đang index (fractional, kế-toán, số-hoá, cho-thuê, affiliate): SẠCH.** Các chữ "tuyệt đối/suốt đời" bị máy gắn cờ đều là **cảnh báo/quy tắc an toàn**, KHÔNG phải hype → giữ nguyên.
- Hype thật nằm ở **sửa-chữa (MH-133)** + lẻ tẻ **kênh-nghề-cũ** — cả hai đang **noindexed**, nên sửa trong đợt bổ sung nguồn, không gấp.
- 5 trang 🟢 checklist đã theo kiểu LOẠI. 7 trang còn lại (gồm thực-phẩm 🟡 đang index) checklist còn kiểu điểm-cộng → nên đổi.

## 1. SỬA-CHỮA (MH-133) — bản sửa nguồn chuẩn (mẫu để áp cho các nghề tay-chân khác)

**§2 — thay 2 gạch đầu dòng:**
- CŨ: "**AI gần như không đụng tới:** đây là nghề tay chân và hiện diện thật, an toàn trước làn sóng tự động hóa."
- MỚI: "**AI khó thay phần lõi:** việc trèo mái, thay ống, xử lý ổ điện phải có người ở hiện trường — nhưng bạn vẫn nên dùng AI cho báo giá, lịch hẹn, hồ sơ để đỡ việc bàn giấy."
- CŨ: "**Nhu cầu vô tận và lặp lại:** nhà nào cũng cần sửa, cần bảo trì; làm tốt một lần là có khách suốt đời và được giới thiệu."
- MỚI: "**Nhu cầu đều và lặp lại:** nhiều hộ cần sửa và bảo trì định kỳ; làm tử tế thì khách quay lại và giới thiệu — nhưng khách chỉ ở lại nếu chất lượng giữ được, không tự nhiên mà có."

**§3 — thay:**
- CŨ: "Nhà cửa, chung cư ngày càng nhiều, ai cũng cần bảo trì định kỳ — cầu ổn định và lặp lại."
- MỚI: "Nhà cửa, chung cư ngày càng nhiều nên phần lớn hộ có nhu cầu bảo trì định kỳ — cầu tương đối ổn định, nhưng cạnh tranh về giá và uy tín cũng cao."

**§3B — thay câu đầu:**
- CŨ: "Đây là một trong số ít nghề mà **AI gần như không đe dọa**: không có AI nào trèo lên mái nhà chống thấm…"
- MỚI: "Đây là nghề mà **AI khó thay phần thi công tay chân** — không AI nào trèo mái chống thấm hay xử lý ổ điện chập. Nhưng nghề vẫn chịu áp lực cạnh tranh giá và giữ uy tín, và AI đang giúp đối thủ báo giá/vận hành nhanh hơn."

**§10 — đổi checklist sang kiểu LOẠI (bỏ "tick 5-6 ô là bền"):**
- CŨ: "**Nếu tick được 5-6 ô:** đây là nghề rất bền — AI không đụng tới, cầu vô tận, dòng tiền lặp lại từ gói bảo trì. **Nếu bạn không tick được ô số 2 hoặc số 3:** …"
- MỚI: "**Cách đọc checklist:** đây không phải bảng chấm điểm để cộng. **Nếu có từ 2 ô 'chưa' trở lên — nhất là ô kiểm soát chất lượng thợ và ô dám nhận bảo hành — thì KHOAN làm.** Nghề này phản chủ rất nhanh nếu bạn không quản được thợ hoặc ngại đền khi lỗi: một công trình hỏng là mất uy tín gây dựng cả năm."

## 2. KÊNH-NGHỀ-CŨ — 2 chỗ mềm hoá
- §5 "kho đề tài **vô tận**" → "kho đề tài **không lo cạn**".
- §7 "…đó là **moat**…" → "…đó là **lợi thế khó sao chép**…".

## 3. Mẫu đổi checklist §10 sang LOẠI (áp cho 7 model còn kiểu điểm-cộng: thực-phẩm, tư-vấn-DN, dạy-kèm, sửa-chữa, kênh-nghề-cũ, freelancer, KD-online)
Thêm/khép checklist bằng câu LOẠI thay vì "tick N ô là nên làm":
> "Đây không phải bảng cộng điểm. Nếu có từ 2 ô 'chưa' — đặc biệt ở [2 ô tử huyệt của nghề này] — thì đừng bắt đầu vội; xử xong mấy ô đó rồi hẵng làm."
(AI sẽ điền "[2 ô tử huyệt]" theo đúng rào cản lớn nhất đã nêu ở mục 2 của từng nghề.)

## 4. Cách áp
1. Anh (hoặc em nếu được cấp quyền CMS app) dán các đoạn MỚI vào đúng section trong **CMS biên tập model** (MH-133 trước, rồi các model thin khi bổ sung nguồn).
2. Báo AI → AI chạy generator v4 ghi đè lại đúng slug (không đẻ trang).
3. Khi 1 model đã đủ dày + hết hype → xoá slug khỏi `sol-mohinh-noindex.php` để index lại.
