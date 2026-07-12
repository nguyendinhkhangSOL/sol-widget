# EOD Wrap · Sol Ecosystem · 2026-07-11 (phiên 5 — CHỐT LUỒNG LÕI)
## FE-3: Quiz → match-v3 → Chi tiết — LUỒNG LÕI HOÀN CHỈNH ✅

**Owner:** Khang Sol · **Model:** Claude Opus 4.8 (Cowork)
**Nối tiếp:** `2026-07-11-EOD-TUAN3-FE-DOT2.md`
**Kết quả:** Vòng lõi sản phẩm (test → gợi ý cá nhân hóa → chi tiết) chạy thật trên web, nối vào 73 mô hình + engine match-v3.

---

## 1. FE-3 đã ship

**Trang mới:** `/la-ban-huong-di/ket-qua/` — đọc kết quả Bước 1+2 từ localStorage (`p1_result`, `p2_result`), POST `/api/directions/match-v3`, render Top matches (gauge %, badge "Hợp nhất", lý do tiếng Việt, vốn, cảnh báo vốn), mỗi thẻ link sang `/chi-tiet/?slug=`.

**Nối luồng:**
- Nút "Xem hướng đi phù hợp" ở cuối Bước 2 (`kiem-ke-nguon-luc`) → đổi sang `/ket-qua/`.
- Hub cũ (`la-ban-huong-di/index.html`): nếu đã làm quiz → tự `location.replace('/ket-qua/')`.
- Trang duyệt (`tat-ca`) thêm link "✨ Xem hướng đi hợp với anh chị nhất".

**Fix backend (match-v3):** category lấy từ bảng categories (hết enum thô `DAO_TAO`), vốn null trả `null` (hiện "—" thay vì "0-0tr") cho 35 mô hình Sol chưa có số.

**Đã verify screenshot:** /ket-qua/ hiện đúng — "Sol so khớp 73 hướng đi. Hợp nhất: Dạy kèm người lớn 94%", gauge + lý do + link chi tiết.

---

## 2. LUỒNG LÕI khép kín (LIVE)

```
Bước 1 (Khám phá bản thân) → Bước 2 (Kiểm kê nguồn lực)
   → [Xem hướng đi phù hợp]
   → /la-ban-huong-di/ket-qua/  (match-v3, 21 vector, Top N từ 73 mô hình)
   → bấm thẻ → /la-ban-huong-di/chi-tiet/?slug=  (11 section, gate Free/Active)
Ngoài ra: /tat-ca/ duyệt toàn bộ 73 · hub cũ tự redirect sang /ket-qua/
```

---

## 3. Toàn cảnh Sol sau phiên lớn (2026-07-11)

**Backend + DB (prod, huongdi.sol.vn):**
- Schema partner V2: 19 bảng (immutable versioning, section gating, journey, full-text search VN).
- **73 mô hình published** · 38 rich content 11 section · 35 Sol migrated 3 section · 2 archived.
- API: `match-v3` (cosine P + resource R, trả sections+reasons), `sections/:slug` (entitlement server-side), `catalog-v2` (danh mục).

**Frontend (LIVE):**
- `/la-ban-huong-di/ket-qua/` — kết quả cá nhân hóa
- `/la-ban-huong-di/chi-tiet/?slug=` — chi tiết 11 section + gate Free/Active + upsell
- `/la-ban-huong-di/tat-ca/` — duyệt 73 mô hình + filter nhóm

**Nội dung:** 38 bộ rich content (8 partner gốc + 30 Sol biên soạn qua 3 đợt, dùng subagent song song). Đã bắt+sửa 5 file subagent chép sai số liệu.

---

## 4. Việc còn lại (cho phiên sau)

| Ưu tiên | Việc |
|:--:|------|
| Trung bình | **Refine 35 direction Sol** (3→11 section) để cả 73 bộ đều sâu |
| Cần anh | **5 quyết định kinh doanh:** scope hợp đồng đối tác P1, pricing 3/4 tier, payment webhook, Email OTP, IP ownership |
| Nhỏ | **Google OAuth:** verify cột google_id prod DB + test nút login |
| Cleanup | Dedupe 9 overlap Sol↔partner; hub cũ dùng DB hardcode riêng (lệch backend) — cân nhắc retire hub, dùng /ket-qua/ |
| SEO | Thêm /chi-tiet, /tat-ca, /ket-qua vào sitemap; meta cho trang chi tiết theo slug |

---

## 5. Cảnh báo vận hành (GIỮ NGUYÊN)
- ⚠️ **KHÔNG chạy `prisma db push`** (19 bảng + generated column không trong schema.prisma).
- Deploy backend: scp src → `npx tsc --noEmit` → `npm run build` → `pm2 reload ecosystem.config.js`.
- Deploy FE: scp → /var/www/huongdi/public/... → `chown www-data`.
- Import content: `sudo -u postgres psql huongdi_prod -f` (file có `set role huongdi_user`, atomic).
- Raw query cột uuid phải cast `::uuid`.
- Quy trình biên soạn: viết .md (11 section) → generator sinh import SQL → validate tĩnh → **so số liệu với seed** (đã có bài học 5 file sai) → deploy psql.

---

## 6. Vào phiên sau
> "Đọc `2026-07-11-EOD-TUAN3-FE3-CORELOOP.md` và tiếp tục"

Sol giờ đã là một sản phẩm chạy được đầu-cuối: người dùng làm test, nhận gợi ý cá nhân hóa từ gần 60 hướng đi có nội dung, xem chi tiết với phân tầng Free/Active. Nền tảng vững để chuyển sang marketing + hoàn thiện nốt.

_Sol Ecosystem · CTY CP VINET · Khang Sol · Zalo 3547084958635197535 · Sealed 2026-07-11 (phiên 5)_
