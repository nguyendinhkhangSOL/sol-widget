# EOD WRAP — 14/8/2026 · Nền Toàn Trình U40–60 + dọn "chết" + video mô hình

**Phiên:** Khang Sol · **Trọng tâm:** dựng toàn bộ **bộ nền tài liệu Toàn Trình U40–60** (Hướng 1 Đi làm lại + chuẩn cho Hướng 2 La Bàn), cộng vài việc content/WP.

---

## 1. TOÀN TRÌNH U40–60 — BỘ NỀN (việc chính, mới)

Thư mục: **`C:\BOTHUOCLA\TOAN-TRINH-U40-60\`** — 11 file, tất cả xuất phát từ brief `brief-toan-trinh-sol-u40-60.md` (anh Khang chốt 14/8).

| File | Là gì |
|---|---|
| `BAT-DAU-TU-DAY.md` | README đóng gói: đọc theo thứ tự, file nào chi phối lát nào, 4 chỗ dev phải hỏi |
| `SPEC-HUONG-1-GUI-DEV.md` | Thứ tự thi công **6 lát cắt** + nghiệm thu bấm được **N1–N20** |
| `CHUAN-HO-SO-CHUNG-SOL.md` | Chuẩn "một hồ sơ, hai máy" (chấm việc làm + map mô hình) |
| `CHUAN-XUAT-CV-ATS.md` | CV xuất ra đạt ATS để khách **nộp mọi nơi** (không dính brand Sol) |
| `CHUAN-DATA-MAU-va-TU-KHOA.md` | Dữ liệu mẫu + từ khoá ATS (bản đọc) |
| `seed-chuan-sol.json` | **Dữ liệu thật để dev nạp** — kiểm máy 0 lỗi |
| `TranVanMinh_TruongPhongKinhDoanh.docx` | CV .docx mẫu đạt chuẩn (đã render kiểm) |
| `mockup-huong-1.html` · `mockup-huong-1-cua-B.html` · `mockup-CV-mau-chuan-ATS.html` | 3 mockup lẻ |
| `mockup-toan-trinh.html` | **Mockup gộp 1 luồng** bấm liền (chọn cửa → xuất CV) |
| `SEED-MO-HINH-gan-ma.md` | SQL an toàn 3 bước gắn mã kỹ năng vào 64 mô hình |

### Quyết định/nguyên tắc đã chốt
- **Kiến trúc trục:** một người → một **HỒ SƠ CHUNG** 4 khối (đã làm gì · còn sẵn gì · ở đâu · quen ai), mỗi ô có **nhãn nguồn + trạng thái** (đã/chưa/**còn trống**). Hướng 1 ăn Khối 1+3; Hướng 2 sống bằng Khối 2+4 (đúng phần CV không có).
- **Một chuẩn, hai máy:** mọi thứ quy về **MÃ** → máy CHẤM (CV×JD, Hướng 1) + máy MAP (hồ sơ×64 mô hình, Hướng 2) dùng chung bộ mã.
- **Bộ mã:** 19 ngành · **54 kỹ năng 2 tầng** · 209 từ khoá/alias (autocomplete + tách JD). Chấm mẫu P1×JD1 = **lần đầu 54 → 71** (khớp mockup). Map mẫu mô hình kế toán × hồ sơ Nga = **4/4 kỹ năng lõi**.
- **CV xuất ra là của khách** để nộp ATS nơi khác: không logo/watermark Sol, mã `KN.*` chạy ngầm; **Khối 2/4 (đồ nghề, quan hệ, tiền) KHÔNG đưa vào CV xin việc**.
- **6 lát cắt**, Lát 2+Lát 5 ghép lại = demo bán được. Phỏng vấn giả lập **nấc 1** (mic → chép → sửa → nhận xét); luật **chống nói phét** (thêm gì vào CV bị hỏi lại) là con hào.
- 4 chỗ dev **bắt buộc hỏi**: dịch vụ trả phí/tài khoản mới · ranh giới free/paid · cách thu-giữ-chuyển dữ liệu · tên sản phẩm.

### Em góp thêm ngoài brief
- Parse CV lỗi → **tự rớt sang Cửa B** (N9).
- **Chỉ báo sớm** cho số đo #3 (bao nhiêu người xong Hướng 1 bấm mở xem Hướng 2) — khỏi chờ 90 ngày.
- Cờ rủi ro: STT giọng U40–60 + đọc CV ảnh chụp (test sớm) · **luật 91/2025** cần người rành luật đọc câu đồng ý (CHƯA kiểm).

---

## 2. VIỆC WP/CONTENT LÀM TRONG PHIÊN

- **Video mô hình:** nhúng YouTube vào 2 trang mô hình — `mo-hinh/ke-toan-thue-ho-kinh-doanh` (id 4001, `Kv3ImRBSeHo`) và `mo-hinh/so-hoa-ai-hoa-ho-kinh-doanh-sme` (id 4003, `CRyArdWOb18`). Iframe `youtube-nocookie`, 16:9, đặt trước H2 đầu, đã verify live.
- **Video AI Tập 30 (dòng tiền):** bản ngang `VIDEO-AI-quan-ly-dong-tien-SOL.mp4` (hook + badge che logo NotebookLM + card kết Sol) và bản dọc 9:16 `VIDEO-AI-MOBILE-...` — trong `C:\BOTHUOCLA\Tap30\`.
- **Dọn từ "chết" (nhạy cảm, dễ bị chặn):** quét toàn WP (huong-di + pages + posts). Đổi theo ngữ cảnh:
  - "chỗ chết/chỗ dễ chết/chỗ hay chết" → **"chỗ hay vấp"** (8 bài + 1 tiêu đề id 3921).
  - Ẩn dụ KD: giết chết→bóp nghẹt · chết dần→lụi dần · chết khô→khô cạn · hợp đồng chết→đứt · chết trước→bị đào thải…
  - Vốn/tiền chết → **vốn đọng / tiền đọng / nằm im**; thành ngữ: chết người→chí mạng.
  - Y tế (giữ facts): "X người **chết**"→**tử vong** · tế bào chết→bong tróc · tim chết→hoại tử · thai chết lưu→thai lưu.
  - Tổng ~**42 bài** đổi. **Giữ nguyên 10 chỗ** cảm xúc/tâm lý (thà chết còn hơn, cảm giác sắp chết, cái chết…) — cố ý không sửa.

---

## 3. ĐANG CHỜ (mở phiên sau làm tiếp)

1. **Anh chạy Bước 1+2 trong `SEED-MO-HINH-gan-ma.md`** (backup + 2 lệnh `psql` dò bảng mô hình) → dán kết quả → em sinh đủ 64 lệnh `UPDATE` gắn mã + rollback.
2. **Dev khởi công Lát 1** (nền hồ sơ chung + đồng ý dữ liệu + nút xoá) theo SPEC.
3. **(Tuỳ) kiểm luật 91/2025** về thu giọng nói + chuyển dữ liệu sang sản phẩm khác — đối chiếu câu đồng ý.
4. (Nhỏ) 12 mô hình lõi: gắn mã theo bảng đề xuất; audio các mô hình còn lại (task MH-AUDIO 514→523).

---

## 4. TÓM MỘT DÒNG
Đã xong **toàn bộ bộ nền Toàn Trình U40–60** (spec 6 lát + chuẩn hồ sơ + chuẩn xuất CV ATS + bộ mã 54 kỹ năng kiểm 0 lỗi + 4 mockup + CV .docx mẫu + SQL gắn mã). Bóng đang ở phía **dev (Lát 1)** và **anh (2 lệnh DB)**.
