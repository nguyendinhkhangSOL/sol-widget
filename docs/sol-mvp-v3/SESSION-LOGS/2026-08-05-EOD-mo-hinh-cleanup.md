# EOD WRAP — 2026-08-05 · Dọn & chuẩn hoá toàn bộ 58 mô hình

> Phiên tập trung vào lớp NỘI DUNG SẢN PHẨM LÕI (bảng `models` / `model_versions` / `model_sections` trên `huongdi_prod`). Không đụng code backend TS (bản live mới hơn mọi bản local — mọi thay đổi làm ở tầng DB cho an toàn).

## 1. Bối cảnh mở màn — "64 vs 58"
- Trang chủ sol.vn hiện "64 mô hình" (data-fact `so_mo_hinh`, giá trị gõ tay trong `app_config`), app Thư viện hiện "58" (đếm sống). Lệch.
- **KHÔNG có endpoint `/api/config/facts` trong bất kỳ bản backend local nào** (huongdi-backend-latest, sol-widget/backend đều thiếu) → live newer than local. Chốt: mọi fix ở tầng DB, không sửa/deploy TS.

## 2. ĐÃ SHIP (tất cả qua SQL trên VPS, live)

### A. Số mô hình tự đồng bộ REALTIME (thay cho sửa tay)
- Tạo **trigger `trg_sync_so_mo_hinh` trên bảng `models`** + hàm `sync_so_mo_hinh()`:
  mỗi INSERT/UPDATE/DELETE trên `models` → `UPDATE app_config SET value=(SELECT count(*) FROM models WHERE status='published') WHERE key='so_mo_hinh'`.
- getFacts đọc `app_config` verbatim → trang chủ tự khớp. **Không cần build/pm2.**
- Đổi label `so_mo_hinh` = "…TỰ ĐỘNG đếm từ danh mục (đừng sửa tay)".
- ⚠️ LƯU Ý PHIÊN SAU: `so_mo_hinh` giờ là số TỰ ĐỘNG. Sửa tay trong admin sẽ bị trigger ghi đè khi có mô hình thay đổi. Muốn đổi số → thêm/ẩn mô hình, đừng sửa config.
- Bảng `directions` (37 rows, PUBLISHED) là hệ match CŨ — KHÔNG phải "mô hình". "Mô hình" = bảng `models` (58 published + 17 archived = 75).

### B. Dedup (kết quả roster hiện tại)
- **Ẩn MH-113** (BHXH) — trùng 32% nội dung với MH-110, gộp vào MH-104 làm gói BHXH mở rộng (theo kế hoạch dedup cũ). `status='archived'`.
- **Mở lại MH-221** (vệ sinh/dọn dẹp solo, vốn ~3tr) — đọc kỹ thấy KHÁC MH-134 (điều phối đội, vốn cao); là cửa vào dễ nhất cho đối tượng lõi. `status='published'`.
- **Giữ ẩn MH-214** (agency marketing) — gần trùng MH-129 (cùng làm social media theo tháng cho shop nhỏ). Ẩn đúng.
- Net: vẫn **58 published**.

### C. AI rà chất CẢ 58 mô hình (2 vòng, subagent đọc song song)
- Vòng 1: 24 mô hình ưu tiên (8 thiếu suitable_for + 16 ngắn nhất). Vòng 2: 34 còn lại.
- Kết quả: **0 bản phải viết lại**. Cấu trúc đồng đều (11 mục, đủ chỉ số, không mục mỏng).
- Lệch đợt XÁC NHẬN: cụm đối tác MH-1xx xưng "bạn" + hơi "Tây" + thiếu nhãn số; cụm Sol MH-2xx xưng "chị", chuẩn giọng.
- Báo cáo: `C:\BOTHUOCLA\_content-fix-gia\RA-CHAT-24-mo-hinh.md` (+ nội dung 58 mô hình bóc ở outputs/ra-noidung, ra-noidung-2).

### D. 5 đợt vá nội dung (SQL, đã nghiệm thu = 0 sót)
1. **8 "HỢP VỚI"** cho MH-101→108 (trước để trống) — viết tay đúng giọng, `jsonb_set` vào yaml. File: `vaSUITABLE-8-mo-hinh.sql`.
2. **Jargon đợt 1** (~272 chỗ): SME→doanh nghiệp nhỏ, portfolio→hồ sơ năng lực, mentee→người được dìu dắt, combo→gói, ebook→sách điện tử, coaching→kèm cặp, deadline→hạn chót… File: `viethoa-jargon.sql`. Áp `regexp_replace` \y trên content_md + body_md.
3. **Nhãn case study**: "## 8. Case study (bản nháp — sẽ thay bằng case thật)" → "## 8. Ví dụ minh hoạ (nhân vật hư cấu — chưa phải người thật)".
4. **Gỡ ghi chú nội bộ** "Ghi chú cho Sol.vn:" (đang LỘ ra ngoài) — xoá khỏi content_md + body_md.
5. **Jargon đợt 2 + xưng hô + Cyrillic** (file `viethoa-dot2.sql`):
   - "bạn"→"anh chị" TOÀN CỤM, có **bảo vệ compound** (bạn bè/người bạn/bạn trẻ/bạn hàng/bạn đọc/bạn đời/bạn thân/bạn học) qua token ZZiZZ.
   - Jargon đợt 2 (30 loại): network→mạng lưới, F&B→quán ăn uống, franchise→nhượng quyền, retainer→gói tháng, concept→ý tưởng, chatbot→trợ lý trả lời tự động, freelance(r), Fanpage→trang Facebook, niche→ngách, slide→trình chiếu, app→ứng dụng, code→lập trình…
   - **Lỗi ký tự Kirin** ở MH-124 ("rủi ро" — р,о Cyrillic) → thay về Latin.
6. **Nhãn "ước tính lần đầu"** cho tiêu đề mục 4 (41 chỗ trần "## 4. Con số thực tế (VND)") — nối "— ước tính lần đầu", khớp cả xuống dòng nên không đè bản đã có nhãn.

- Kiểm cuối: cyrillic=0, jargon2=0, ban_le=0, ghichu (2 cột)=0, ban_nhap=0, thieu_nhan_muc4 (2 cột)=0.

## 3. QUYẾT ĐỊNH SẢN PHẨM
- Bỏ dòng phân số "37/58" (so_mo_hinh_rich) — cả 58 đều có nội dung thật/sâu, "sâu vs không sâu" không còn đúng. Trang chủ đã chỉ hiện "58 mô hình" (không có phân số). `so_mo_hinh_rich` chỉ còn là giá trị config, không hiển thị.

## 4. CƠ CHẾ TỰ RÀ (đã bàn, chưa build tầng máy)
- Anh chọn "cả hai (máy + AI)". Thực tế dữ liệu cho thấy cấu trúc đồng đều → tầng máy (rule-based flag) giá trị thấp; đã thay bằng AI review 1 lượt (đã xong). Nếu sau này muốn tự-rà định kỳ → dùng cột `audit_flag`/`audit_note` sẵn có + trigger/scheduler (chưa làm).

## 5. CÒN TREO (không gấp)
- Các mục 🟡 riêng lẻ từng mô hình (gợi ý sửa cụ thể trong báo cáo AI) — jargon hệ thống đã dọn toàn cục; phần còn lại là tinh chỉnh câu chữ, làm dần qua CMS khi rảnh.
- Case study cụm MH-1xx vẫn là nhân vật hư cấu chi tiết (đã gắn nhãn rõ) — thay bằng case thật khi thu thập đủ.
- Backlog khác ngoài phiên: T18/T19 (video + bài trụ), các mục SOÁT-P0/P1, SHARE, HDUNI…

## 6. FILE/LỆNH LƯU LẠI (C:\BOTHUOCLA\_content-fix-gia\)
- so-mo-hinh-tu-dong.sql · vaSUITABLE-8-mo-hinh.sql · viethoa-jargon.sql · viethoa-dot2.sql · RA-CHAT-24-mo-hinh.md
- Backup DB trước khi vá: `~/backup_noidung_2026-08-05.sql`, `~/backup_noidung_dot2_2026-08-05.sql` (trên VPS).
- Nguồn phân tích: bản dump `C:\BOTHUOCLA\solbk-VPS\db-all.sql` (LƯU Ý: dump này CŨ hơn live — 64 published, chưa có 6 bản archive gần nhất; dùng để phân tích nội dung survivor thì khớp, nhưng đừng tin roster của nó).
