# EOD Wrap · Sol Ecosystem · 2026-07-11 (phiên 4)
## Tuần 3 — Frontend (chi tiết + duyệt) + Đợt 2 (10 mô hình P2) — LIVE ✅

**Owner:** Khang Sol · **Model:** Claude Opus 4.8 (Cowork)
**Nối tiếp:** `2026-07-11-EOD-TUAN3-DOT1-CONTENT.md`
**Kết quả:** Frontend hiển thị sản phẩm trên web thật + thư viện đạt 59 mô hình (24 rich content).

---

## 1. Frontend (FE-1 + FE-2) — LIVE trên huongdi.sol.vn

| Trang | URL | Chức năng |
|-------|-----|-----------|
| Chi tiết | `/la-ban-huong-di/chi-tiet/?slug=...` | Gọi API sections, render 11 section markdown, gate Free/Active (public full, locked preview + upsell), header có facts vốn/thu nhập/TTR |
| Duyệt | `/la-ban-huong-di/tat-ca/` | Gọi catalog-v2, liệt kê 59 mô hình, filter theo nhóm, badge "Mở miễn phí"/"Chi tiết đầy đủ", click → chi tiết |

**API mới:** `GET /api/directions/catalog-v2` (danh mục published + facts + section count) + sections endpoint bổ sung category (từ bảng categories) + facts.

**Tech:** HTML tĩnh + marked.js (CDN) render markdown; palette amber #F59E0B + navy #0F172A; Inter+Lora; sol-ui.js header; JWT `sol_jwt` cho entitlement. Đã verify bằng screenshot: render chuẩn, gating đúng.

**Fix polish:** category filter ban đầu hiện enum thô (CHUYEN_MON...) → join bảng categories lấy tên tiếng Việt.

---

## 2. Đợt 2 — 10 mô hình P2 (dùng 10 subagent song song)

MH-109, 110, 116, 117, 124, 126, 128, 134, 135, 136 — mỗi bộ 11 section chuẩn MH-108/113.

| Mã | Nghề |
|:--:|------|
| 109 | Hỗ trợ thủ tục hành chính DN nhỏ |
| 110 | Nhân sự thuê ngoài SME |
| 116 | Quản lý nhà trọ thuê ngoài |
| 117 | Chăm sóc nhà vắng chủ / quản gia |
| 124 | Thẩm định nhượng quyền (hồ sơ phản biện) |
| 126 | Ebook + khóa học thu nhỏ |
| 128 | Hồi ký + gia phả số |
| 134 | Chuyển nhà + dọn dẹp sâu |
| 135 | Chăm sóc cây cảnh sân vườn |
| 136 | Trông giữ thú cưng |

File: `partner-assets/biensoan-dot2/`. Import: `seeds/10-import-10-p2.sql` (version 2026-08 published).

**Nghiệm thu:** 10 published + 110 sections (60 public/50 locked) + 10 scores, draft cũ superseded.

---

## 3. Trạng thái thư viện hiện tại (prod)

- **59 mô hình published** sẵn sàng match-v3.
- **24 bộ rich content 11 section** (8 partner + 6 P1 + 10 P2).
- 35 Sol migrated (3 section) + phần draft còn lại.
- 2 archived (nhạy cảm).

Quy trình biên soạn bằng subagent song song đã chứng minh hiệu quả — dùng lại cho Đợt 3.

---

## 4. Roadmap tiếp

- **Đợt 3 P3 (14 mô hình):** 111,112,114,118,119,120,122,123,127,130,131,132,137,138 → subagent song song như Đợt 2.
- **FE-3:** Quiz → match-v3 Top 3 + gauge (thay match client-side cũ trong hub) — việc lớn hơn.
- **Refine 35 Sol:** nâng 3 → 11 section dần.
- Wire hub cũ (`la-ban-huong-di/index.html`) link sang trang chi tiết / trỏ nút "Xem tất cả" tới `/tat-ca/`.

---

## 5. Cảnh báo giữ nguyên
- ⚠️ KHÔNG chạy `prisma db push`.
- Deploy backend: scp src → `tsc --noEmit` → `npm run build` → `pm2 reload`. Deploy FE: scp → /var/www/huongdi/public + chown www-data.
- Raw query cột uuid cast `::uuid`.

---

## 6. Vào phiên sau
> "Đọc `2026-07-11-EOD-TUAN3-FE-DOT2.md` và tiếp tục — Đợt 3 / hoặc FE-3 quiz match"

_Sol Ecosystem · CTY CP VINET · Khang Sol · Zalo 3547084958635197535 · Sealed 2026-07-11 (phiên 4)_
