# EOD Wrap · Sol Ecosystem · 2026-07-11
## Tuần 1 Migration (Phương án C — Big Bang) — SHIPPED TO PRODUCTION ✅

**Owner:** Khang Sol (nguyendinhkhang@gmail.com)
**Model phiên này:** Claude Opus 4.8 (Cowork mode)
**Chủ đề:** Thực thi Tuần 1 roadmap — adopt schema đối tác + seed 38 + import 8 rich + 21 vector
**Kết quả:** Deploy production thành công, 9/9 nghiệm thu khớp. Commit `83f717d` trên GitHub.

---

## 1. Quyết định phiên này (anh Khang chốt)

| Câu hỏi | Anh chọn |
|---------|----------|
| Cách migrate | **A — Big Bang** (thay toàn bộ, adopt schema đối tác) |
| Phạm vi phiên | **Full Tuần 1** (Task 1.1 → 1.5) |
| 4 file đối tác đã mất | **Upload lại** → cứu vào repo `partner-assets/` |

---

## 2. Đã ship gì (5 task + verify)

| Task | Nội dung | File |
|:----:|----------|------|
| 1.1 | Backup DB full trước migration | `/var/backups/pre-bigbang-*.sql.gz` |
| 1.2 | Migration 19 bảng (adapt Supabase→Sol Postgres) | `prisma/migrations/20260711000000_partner_schema_v2/migration.sql` |
| 1.3 | Seed 38 mô hình (8 published + 30 draft) | `prisma/seeds/02-seed-38-partner.sql` |
| 1.4 | Import 8 rich content → 88 sections | `prisma/seeds/03-import-8-rich.sql` |
| 1.5 | Chấm 21 vector cho 8 mô hình | (gộp trong 03) |
| Verify | 9 query nghiệm thu | `prisma/seeds/05-verify.sql` |

**19 bảng mới:** models, model_versions, model_sections, categories, tags, model_tags, model_scores, quiz_questions, quiz_options, option_scores, quiz_responses, journeys, journey_phases, journey_actions, journey_expenses, journey_gates, notebooks, journey_events, template_update_notices.

**Kết quả nghiệm thu production (9/9 khớp):**
- 38 models · 7 categories · 8 published + 30 draft versions
- 88 sections (48 public / 40 locked — đúng gate Free/Active)
- 8 bộ có 21 vector scores
- ✅ Full-text search tiếng Việt không dấu: "ke toan" → MH-104
- ✅ Lọc theo số (vốn/rủi ro) chạy đúng
- ✅ Dữ liệu cũ NGUYÊN VẸN: directions=37, users=7

---

## 3. Phát hiện & xử lý quan trọng (đọc kỹ cho phiên sau)

### 3.1. 4 file quà đối tác TỪNG BỊ MẤT
Phiên 08/07 chỉ lưu 4 file trong vùng upload tạm, **chưa copy vào repo** → mất khi hết phiên. Phiên này anh upload lại, đã cứu vào `sol-ecosystem/partner-assets/` + commit GitHub. **Bài học: mọi tài sản đối tác PHẢI copy vào repo ngay.**

### 3.2. Máy chủ dùng `prisma db push`, KHÔNG dùng migrate
- `_prisma_migrations` = 0 dòng, không có folder `prisma/migrations` trên VPS.
- → Bỏ `prisma migrate deploy`, áp SQL trực tiếp bằng `psql -f`.
- Owner tất cả 18 bảng cũ = **`huongdi_user`** → dùng `SET ROLE huongdi_user` để 19 bảng mới cùng owner.

### 3.3. Hai lỗi production đã sửa TRƯỚC khi deploy
1. **`unaccent()` không immutable** → DDL đối tác gốc dùng nó trong generated column sẽ báo lỗi khi tạo bảng. Đã sửa bằng wrapper `f_unaccent()` (immutable, gọi `unaccent('unaccent', $1)`).
2. **`create extension` cần superuser** → tách ra `00-extensions.sql` chạy bằng `postgres`, migration chính chạy bằng `huongdi_user`.

### 3.4. Quoting SSH trên Windows PowerShell
- PowerShell + OpenSSH **nuốt dấu nháy kép** → SQL inline có `()`/`*`/`"` đều lỗi.
- **Cách chuẩn: mọi SQL để trong file `.sql`, chạy `psql -f file`.** Không gõ SQL inline qua ssh nữa.

---

## 4. ⚠️ CẢNH BÁO cho phiên sau

**KHÔNG chạy `npx prisma db push`** cho tới khi Tuần 2 thêm 19 bảng vào `schema.prisma`.
Lý do: hiện `schema.prisma` CHƯA khai 19 bảng mới. Nếu `db push` bây giờ, Prisma thấy 19 bảng "lạ" và có thể đòi xoá chúng.
Deploy thường (`deploy.sh` → `prisma migrate deploy`) thì AN TOÀN (không đụng bảng mới vì không có migrations folder).

---

## 5. Roadmap Tuần 2 (kế tiếp)

Theo `UNIFIED-DB-SCHEMA` mục 5 + `2026-07-08-EOD` mục 6:

| Task | Nội dung |
|:----:|----------|
| 2.0 | **Thêm 19 bảng vào `schema.prisma`** (Prisma Client typing) → gỡ cảnh báo db push |
| 2.1 | Migrate 37 direction Sol hiện tại → `models` MH-201→223 (giữ FK SavedDirection/UserOutcome/JourneyDay) |
| 2.2 | Archive 2 direction nhạy cảm (dau-tu-tai-chinh + cham-soc-suc-khoe-tai-nha) |
| 2.3 | Chấm 21 vector default cho 23 direction Sol chưa có |
| 2.4 | Refactor API `match-v2` → `match-v3` đọc từ `model_scores` + trả `sections` kèm visibility |
| 2.5 | API `GET /api/directions/[slug]/sections` có entitlement check (app-level, không dùng Supabase RLS) |

---

## 6. Pending — câu hỏi treo cần anh quyết (chưa blocker)

Từ `2026-07-08-EOD` mục 7.1, vẫn còn:
1. Scope đối tác Đợt 1: hợp đồng biên soạn 6 mô hình P1 (MH-113,115,121,125,129,133) đã có chưa?
2. Pricing 3 tier hay 4 tier (đối tác đề xuất thêm Lifetime_early 499k × 300 slot)?
3. Auto payment webhook (PayOS/SePay): ship tuần nào?
4. Auth Email OTP: thêm song song password hay giữ nguyên?
5. IP ownership 8 mô hình đối tác — hợp đồng chuyển giao quyền tác giả đã ký chưa?

---

## 7. File map phiên này

```
C:\BOTHUOCLA\sol-ecosystem\
├── partner-assets\                         ← MỚI (cứu 4 file đối tác)
│   ├── SCHEMA-CSDL-solvn-v1.md
│   ├── seed-catalog-38-mo-hinh-v0.sql
│   ├── solvn-prototype-pheu-choedit.html
│   └── MH-108-...md
└── huongdi-backend\prisma\
    ├── migrations\20260711000000_partner_schema_v2\
    │   ├── migration.sql                   ← 19 bảng
    │   ├── ROLLBACK.sql
    │   └── DEPLOY-TUAN1.md                 ← bảng lệnh deploy
    └── seeds\
        ├── 00-extensions.sql
        ├── 01-run-migration.sql            ← wrapper set role + atomic
        ├── 02-seed-38-partner.sql
        ├── 03-import-8-rich.sql            ← auto-gen (versions+sections+scores)
        ├── 05-verify.sql
        └── diag.sql
```
GitHub commit: `83f717d` (repo `nguyendinhkhangSOL/sol-ecosystem`).

---

## 8. Vào phiên sau chỉ cần nói

> "Đọc `2026-07-11-EOD-TUAN1-MIGRATION.md` và tiếp tục Tuần 2"

Nền DB Tuần 1 đã vững trên production. Tuần 2 là lớp logic (migrate 37 direction Sol + API match-v3) — không còn đụng schema lớn nữa.

_Sol Ecosystem · CTY CP VINET · Khang Sol · Zalo 3547084958635197535 · Sealed 2026-07-11_
