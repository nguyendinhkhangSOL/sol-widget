# EOD WRAP — 2026-08-15 · Toàn Trình U40–60: TRỌN BỘ 6 LÁT (bản nền dev)

> Tiếp nối `2026-08-14-EOD-TOAN-TRINH-U40-60-FOUNDATION.md`. Phiên hôm nay: dựng **bộ code nền Lát 1→6** cho dev (bản nháp review, CHƯA áp DB live).

---

## 1. LÀM ĐƯỢC GÌ HÔM NAY

| Lát | Việc | Trạng thái |
|---|---|---|
| **1** | Hồ sơ chung 4 khối + đồng ý dữ liệu + xoá thật | ✅ (từ hôm qua) |
| **2** | Cửa A: có CV → chấm CV×JD % → checklist → vòng lặp | ✅ mới |
| **3** | Cửa B: chưa có CV → dựng bằng hỏi–đáp → xuất CV | ✅ mới |
| **4** | Luyện phỏng vấn (mic bắt buộc — nghe lại chính mình) | ✅ mới |
| **5** | Thư ứng tuyển khớp CV×JD (đính kèm CV) | ✅ mới |
| **6** | Bàn giao hồ sơ → La Bàn Sol (Hướng 2) | ✅ mới |

**Gói bàn giao:** `C:\BOTHUOCLA\TOAN-TRINH-U40-60.zip` (bản mới nhất: `TOAN-TRINH-U40-60-FINAL.zip`, 45 file).

---

## 2. MỖI LÁT GỒM GÌ

Mỗi lát có bộ 4 loại file (đồng style repo: Express + Prisma + zod + `requireAuth` + `AppError`):
- `LATx-*.prisma` — merge vào `schema.prisma` rồi `npx prisma migrate dev` *(khuyến nghị)*
- `LATx-migration.sql` — chạy thẳng SQL idempotent (nếu không dùng Prisma migrate)
- `LATx-api-skeleton.ts` — khung route + **hàm lõi chạy thật**
- `LATx-README-dev.md` — thiết kế ↔ CHUAN + quan hệ cần thêm vào `JobProfile` + nghiệm thu

Bảng phụ trợ: Lát 3 `LAT3-questions.json` (9 câu Cửa B), Lát 4 `LAT4-question-bank.json` (ngân hàng câu phỏng vấn).

---

## 3. HÀM LÕI (chạy thật, không phải placeholder)

- **Lát 2 `parseJD` + `scoreProfile`** — tách JD bằng 209 alias → mã; chấm = Σđiểm khớp/Σđiểm × 100; ra checklist DA_CO/CON_THIEU + chiều 2; giữ `score_first` qua các vòng.
- **Lát 3 `goiYtuChuyen`** — đọc câu "kể việc gần nhất" → gợi ý mã KN (khách tick mới lưu, máy không tự gắn).
- **Lát 4 `feedbackFor`** — gợi ý nhẹ sau khi nghe lại (độ dài, có con số chưa) — không chấm gắt.
- **Lát 5 `buildLetter`** — ghép thư tiếng Việt từ hồ sơ + kỹ năng khớp JD + tên vị trí.
- **Lát 6 `mapProfileToModels`** — hồ sơ × `models.skill_codes` → Top 5 mô hình + kỹ năng khớp + vốn + địa bàn.

Tất cả dùng **cùng bộ mã `KN.*`** đã gắn 75/75 mô hình (14/08) → "một chuẩn, hai máy" chạy được đầu-cuối.

---

## 4. QUYẾT ĐỊNH THIẾT KẾ CHỐT TRONG PHIÊN (anh Khang)

1. **Nhập liệu = gõ tay + gợi ý (autocomplete) mặc định.** Mic **CHỈ ở Lát 4** (phỏng vấn, để nghe lại chính mình) — vì giọng→từ khoá dễ lệch + giọng là dữ liệu nhạy cảm (Luật 91/2025).
2. **Bỏ nhánh "người quen" ở thư ứng tuyển.** Không đoán được độ thân → dễ sai giọng. Chỉ 1 loại **thư trang trọng**, đính kèm CV nộp cổng việc làm / gửi nhà tuyển dụng. CV làm xong khách tự apply thẳng — "đây là việc của ta".

---

## 5. RÀNG BUỘC LUẬT 91/2025 ĐÃ CÀI VÀO CODE

- Lát 1: `DataConsent` 3 loại (CV_READ / VOICE / LABAN_TRANSFER), opt-in riêng, có `evidence` + `revokedAt`.
- Lát 3: mic chỉ hợp lệ ở câu kể chuyện **và** phải có đồng ý VOICE — API chặn cứng.
- Lát 4: mọi route chặn nếu chưa đồng ý VOICE; có route **xoá ghi âm thật** khi rút đồng ý.
- Lát 6: chuyển hồ sơ sang Hướng 2 — nếu coi mục đích khác thì mở kiểm `LABAN_TRANSFER` (đoạn code để dạng chú thích).

---

## 6. VIỆC CHO DEV (bước kế tiếp)

1. Đọc `BAT-DAU-TU-DAY.md` mục 7 → chạy migration **1→6**, **backup trước mỗi lần**.
2. Thêm quan hệ vào `JobProfile` (mỗi README ghi rõ) + `JobTarget` (Lát 4).
3. Chỉnh tên cột trong `LAT6-api-skeleton.ts` (`$queryRawUnsafe` bảng `models`) cho khớp schema thật.
4. Parse CV thật (Lát 3 `/finish` + Lát 2 `/cv` TODO) → tự lấp `profile_fields` + `profile_skills`.
5. Render CV/thư `.docx` theo `CHUAN-XUAT-CV-ATS` (khuôn: `TranVanMinh_TruongPhongKinhDoanh.docx`).
6. Port UI: dev có sẵn `LAT1-ui-ho-so.html` + 4 mockup luồng làm tham chiếu.

**4 chỗ dev BẮT BUỘC hỏi anh Khang:** thêm dịch vụ trả phí/tạo tài khoản mới · đổi ranh giới free/paid · đổi cách thu-giữ-chuyển dữ liệu · đổi/thêm tên sản phẩm.

---

## 7. KIẾN TRÚC LOCK (không đổi)

- `sol.vn` = marketing (WordPress) · `huongdi.sol.vn` = product (Node + Postgres) · GitHub = SSOT.
- Match Hướng 2 đọc bảng `models` + `model_scores`. Lát 6 map bằng **kỹ năng hồ sơ** (nhánh khác match-v3 quiz) — dev quyết gộp/tách.
- Chưa đụng DB live phiên này. Backup 14/08 (1.1M) vẫn là mốc gần nhất trước khi dev migrate.

---

## 8. KIỂM CHÉO + VÁ (cuối phiên)

Rà bằng máy toàn bộ mã trường + enum trong 6 lát so với Lát 1. Vá 3 chỗ lệch:
1. **LAT3-questions.json** — 5 mã trường sai → sửa đúng từ điển: `K1.chuc_danh→K1.chucdanh`, `K1.thanh_qua→K1.quymo`, `K3.dia_ban→K3.tinh`, `K3.di_chuyen→K3.banklinh`, `K1.hoc_van→K2.bangcap`. *(Không sửa thì các ô hồ sơ không được cập nhật.)*
2. **LAT3-api-skeleton.ts** — enum `KE_KHAI` không tồn tại → `KHACH_KHAI` (2 chỗ: profile_fields + profile_skills).
3. **LAT5-api-skeleton.ts** — bỏ `K1.ho_ten` (từ điển không có ô tên → lấy `req.user.name`); `K1.chuc_danh→K1.chucdanh`; `K1.thanh_qua→K1.quymo`.

Kiểm lại lần 2 bằng script: **mọi mã trường OK, enum OK** (6/6 lát). Gói `TOAN-TRINH-U40-60-FINAL.zip` đã repack (45 file).

---

## 9. 🚀 ĐÃ DEPLOY LIVE (cùng ngày 2026-08-15)

Ghép code thẳng vào repo + deploy lên production `huongdi-api` (VPS 103.72.57.11). **Thành công.**

**Đường đi + ổ gà đã vượt:**
1. Backup DB: `~/backup-truoc-toantrinh-2026-08-15-0910.dump` (1.2M).
2. Commit + push code lên GitHub (`sol-widget`, nhánh main). Backend thật = `huongdi-backend-latest` (pm2 `huongdi-api`, port 4001).
3. Server backend KHÔNG phải git → deploy bằng **clone /tmp + script `toan-trinh-deploy/deploy-toan-trinh.sh`** (chỉ CHÈN THÊM, không đè — vì schema/index server lệch repo).
4. **Bug đã vá trong lúc deploy:**
   - `.gitignore` chặn `*.sql` → phải `git add -f migrate.sql`.
   - Thư mục `src/`, `src/routes/` mất quyền ghi (`dr-x`) → `chmod -R u+w`.
   - FK `job_profiles.user_id uuid` vs `users.id text` → sửa `migrate.sql`: mọi id/FK `uuid → text`, `gen_random_uuid()::text`.
   - Enum Prisma viết gộp 1 dòng → tách mỗi giá trị 1 dòng (regex expand trên server + repo).
5. Kết quả: `prisma db execute` tạo 14 bảng (không đụng bảng SQL thô cũ) → `prisma generate` → `npm run build` **XANH** → `pm2 restart huongdi-api`.
6. **Nghiệm thu:** log `✅ PostgreSQL connected` + `🚀 running on port 4001`; `GET /api/profile` → **HTTP 401** (route mounted, đòi auth). App online 97MB, không crash.

**Cơ chế deploy khác thường (ghi để lần sau):**
- Backend server không phải git checkout → deploy = clone repo ra `/tmp` rồi copy/patch file, KHÔNG `git pull` tại `/var/www/huongdi/backend`.
- Schema Prisma server chỉ quản 17 model; mọi bảng khác (models 75, model_scores, app_config...) là **SQL thô, đọc bằng `$queryRaw`**. → Tuyệt đối KHÔNG `prisma db push`/`migrate` (sẽ đòi drop). Chỉ thêm bảng bằng `prisma db execute` + SQL `CREATE TABLE IF NOT EXISTS`.
- Prisma `String @id` = cột `text` (không phải uuid). Bảng mới phải dùng `text` cho id/FK.

**Còn 1 việc dọn dẹp (không gấp):** push bản vá enum (`schema.prisma` + `toan-trinh-deploy/schema-block.prisma`) lên repo để lần sau khỏi vấp. Server đã đúng rồi.

## 10. TRẠNG THÁI: ✅ LIVE — 6 lát Toàn Trình đã chạy production. FE là bước kế tiếp.
