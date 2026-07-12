# EOD Wrap · Sol Ecosystem · 2026-07-11 (phiên 3)
## Tuần 3 Đợt 1 — Biên soạn 6 mô hình P1 — LIVE PRODUCTION ✅

**Owner:** Khang Sol · **Model:** Claude Opus 4.8 (Cowork)
**Nối tiếp:** `2026-07-11-EOD-TUAN2-API.md`
**Kết quả:** 6 mô hình priority-1 biên soạn đầy đủ 11 section, import + publish trên prod. Thư viện đạt 49 mô hình có nội dung.

---

## 1. Đã ship

Biên soạn rich content (11 section chuẩn MH-108) cho **6 mô hình Đợt 1 P1**:

| Mã | Slug | Nghề | Vốn | Thu nhập |
|:--:|------|------|-----|----------|
| MH-113 | dich-vu-bhxh-ho-so-lao-dong | BHXH & hồ sơ lao động hộ KD | 10-30tr | 10-25tr |
| MH-115 | day-kem-nguoi-lon-theo-ngach | Dạy kèm người lớn theo ngách | 5-20tr | 8-30tr |
| MH-121 | chup-anh-sp-van-hanh-gian-hang-tmdt | Chụp ảnh + vận hành gian hàng TMĐT | 20-60tr | 12-35tr |
| MH-125 | kenh-chia-se-chuyen-mon-nghe-cu | Kênh video chia sẻ nghề cũ | 5-25tr | 0-25tr |
| MH-129 | cham-soc-kenh-so-tron-goi-ho-kd | Chăm sóc kênh số hộ KD | 10-30tr | 12-35tr |
| MH-133 | sua-chua-bao-tri-nha-theo-goi | Sửa chữa - bảo trì nhà theo gói | 20-60tr | 15-45tr |

Mỗi bộ: frontmatter YAML đầy đủ + 11 section (1,2,3,3B public preview; 4,5,6,8,9 locked; 7,10 public) + 21 vector chấm theo nội dung.

**File nguồn:** `partner-assets/biensoan-dot1/MH-*.md` (6 file)
**Import SQL:** `huongdi-backend/prisma/seeds/08-import-6-p1.sql` (version 2026-08 published)
**Verify:** `09-verify-p1.sql`

---

## 2. Nghiệm thu prod (6/6 khớp)

- 6 model → status **published** + current_version_id trỏ đúng version 2026-08.
- Draft cũ (2026-07-d0) → **superseded** (immutable versioning đúng chuẩn đối tác).
- Sections: 66 (6×11), public 36 / locked 30.
- Scores: 6 bộ 21 vector.
- **ready_for_match: 49** (43 trước + 6 mới) — match-v3 giờ chọn từ 49 mô hình.
- Catalog tổng: 49 published · 24 draft · 2 archived · 75 tổng.

---

## 3. Trạng thái thư viện hiện tại

| Nhóm | Số lượng | Nội dung |
|------|:--------:|----------|
| Partner rich (MH-101→108) | 8 | 11 section đầy đủ |
| Sol migrated (MH-201→237) | 35 published + 2 archived | 3 section (description/whyFit/barriers) |
| **P1 mới (Đợt 1)** | **6** | **11 section đầy đủ** |
| Partner draft còn lại (MH-109→138 trừ 6 P1) | 24 | catalog draft, chờ Đợt 2-3 |

**49 published** sẵn sàng cho match-v3 + sections API.

---

## 4. Roadmap tiếp theo

**Đợt 2 P2 (10 mô hình):** MH-109, 110, 116, 117, 124, 126, 128, 134, 135, 136 — cùng quy trình biên soạn.
**Đợt 3 P3 (14 mô hình):** 111,112,114,118,119,120,122,123,127,130,131,132,137,138.
**Refine 35 Sol:** nâng từ 3 section lên 11 section dần.

**Frontend (Tuần 2 chưa làm):**
- `/la-ban-huong-di/[slug]/` render 11 section + gate Free/Active (gọi API sections đã live).
- Quiz → match-v3 → Top 3 + gauge.

---

## 5. Quy trình biên soạn + import (tái sử dụng cho Đợt 2-3)

1. Viết .md (frontmatter + 11 section) trong `partner-assets/biensoan-dot1/` (hoặc dot2/dot3).
2. Chấm 21 vector theo nội dung.
3. Generator Python đọc .md → sinh import SQL (version mới published + sections + scores + supersede draft).
4. Validate tĩnh (cột, dollar-quote, JSON).
5. Deploy: scp → `sudo -u postgres psql huongdi_prod -f` (set role huongdi_user, atomic).
6. Verify.

---

## 6. Cảnh báo giữ nguyên

- ⚠️ **KHÔNG chạy `prisma db push`**.
- Deploy code backend: scp src → `tsc --noEmit` → `npm run build` → `pm2 reload`.
- Raw query cột uuid phải cast `::uuid`.
- Google login: code đã lên prod, cột google_id trong prod DB cần kiểm tra trước khi bật.

---

## 7. Vào phiên sau

> "Đọc `2026-07-11-EOD-TUAN3-DOT1-CONTENT.md` và tiếp tục — Đợt 2 biên soạn / hoặc Frontend render"

Backend + 49 nội dung đã vững trên prod. Việc còn lại: biên soạn tiếp (Đợt 2-3) và/hoặc dựng frontend để chị Nga thấy được trên web.

_Sol Ecosystem · CTY CP VINET · Khang Sol · Zalo 3547084958635197535 · Sealed 2026-07-11 (phiên 3)_
