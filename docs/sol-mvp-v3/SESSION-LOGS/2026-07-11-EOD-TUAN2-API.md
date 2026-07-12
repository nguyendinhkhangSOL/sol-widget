# EOD Wrap · Sol Ecosystem · 2026-07-11 (phiên 2)
## Tuần 2 — Migrate 37 direction Sol + API match-v3 + sections — LIVE PRODUCTION ✅

**Owner:** Khang Sol · **Model:** Claude Opus 4.8 (Cowork)
**Nối tiếp:** `2026-07-11-EOD-TUAN1-MIGRATION.md`
**Kết quả:** 6/6 task Tuần 2 xong, 2 API chạy thật trên prod. Backend prod đồng bộ với code local hiện tại.

---

## 1. Đã ship (6 task)

| Task | Nội dung | Trạng thái |
|:----:|----------|:----------:|
| 2.0 | (Quyết định) dùng raw SQL thay vì thêm 19 bảng vào schema.prisma → tránh landmine db push | ✅ |
| 2.1 | Migrate 37 direction Sol → models MH-201..237 (additive, giữ bảng directions) | ✅ |
| 2.2 | Archive 2 direction nhạy cảm (220 dau-tu-tai-chinh, 226 cham-soc-suc-khoe-tai-nha) | ✅ |
| 2.3 | Copy 18 vector Sol → model_scores (default 50 nếu null) | ✅ |
| 2.4 | API `POST /api/directions/match-v3` đọc model_scores + trả sections + reasons | ✅ LIVE |
| 2.5 | API `GET /api/directions/:slug/sections` entitlement server-side | ✅ LIVE |

**Nghiệm thu DB (Pha A):** tổng models **75** (38 partner + 37 Sol), Sol scores 37, versions 37, sections 111, 2 archived, dữ liệu cũ (directions=37, users=7, saved=1) nguyên vẹn.

**Nghiệm thu API (Pha B):**
- `sections` MH-104: totalSections=11, lockedCount=5, FREE thấy 6 public + gate 5 locked (contentMd=null + preview). ✅
- `match-v3`: user mạnh chuyên môn → top MH-104 100% + reasons tiếng Việt + sections. ✅

---

## 2. Kiến trúc API mới (cho phiên sau)

```
POST /api/directions/match-v3   (giữ match-v2 song song, KHÔNG phá cũ)
  Body: { p1:{people,expert,builder,independent}, p2:{capital,time,technology,network,risk,energy,capitalVnd}, limit }
  → đọc models(published) JOIN model_versions JOIN model_scores
  → score = 50% cosine(P) + 50% resource-fit(R)
  → trả Top N + sections (gate theo tier) + reasons

GET /api/directions/:slug/sections
  → trả 11 sections, section 'locked' chỉ có preview 180 ký tự cho FREE
  → Active/Founder thấy full contentMd
  Entitlement check server-side (đọc tier từ DB, không tin token)
```

Cả 2 route dùng **raw SQL `$queryRawUnsafe`** (không phụ thuộc Prisma Client typing của 19 bảng mới).

---

## 3. Phát hiện quan trọng & xử lý (ĐỌC KỸ)

### 3.1. Backend prod đi SAU code local rất nhiều
- Prod chạy `dist` build từ **6/7** — trước Google OAuth (7/7) + nhiều việc local.
- VPS thiếu: package `google-auth-library`, Prisma Client cũ (chưa có `googleId`), src/ thiếu file.
- **Đã đồng bộ:** cài google-auth-library + scp toàn bộ src + scp schema.prisma + `prisma generate` + build lại toàn bộ. **Giờ prod = code local hiện tại.**

### 3.2. Quy trình build/deploy CHUẨN (ghi nhớ)
- **VPS build được** (có tsc + node_modules), nhưng cần: `google-auth-library` đã cài + `schema.prisma` mới + `prisma generate`.
- Deploy code: `scp src → VPS`, `npx tsc --noEmit` (typecheck, không đụng dist), `npm run build`, `pm2 reload ecosystem.config.js`.
- ⚠️ `--env production` báo warning "Environment not defined" — vô hại (env lấy từ .env qua ecosystem.config.js), reload vẫn OK.

### 3.3. 2 lỗi runtime đã fix
- Raw query truyền param uuid (`version_id`) bị Postgres báo `operator does not exist: uuid = text` → **fix: ép `$1::uuid`** trong match-v3 (IN clause) + sections.
- (Chú ý phiên sau: mọi raw query với cột uuid + param string PHẢI cast `::uuid`.)

### 3.4. Git index.lock hay bị kẹt
- Máy anh thỉnh thoảng để lại `.git/index.lock` (tiến trình git cũ crash). Fix: `Remove-Item ...\.git\index.lock -Force` rồi commit lại.
- Commit lần đầu Tuần 2 SÓT `index.ts` do lock → đã commit bù ở cuối phiên.

---

## 4. Trạng thái dữ liệu hiện tại (prod)

- **models:** 75 (38 partner MH-1xx + 37 Sol MH-2xx), 43 published sẵn sàng match-v3.
- **model_scores:** 45 bộ (8 partner chấm tay + 37 Sol từ vector cũ).
- **model_sections:** 88 (partner, 11/bộ) + 111 (Sol, 3/bộ) = 199.
- Bảng cũ `directions` (37) giữ nguyên — frontend cũ + FK không đổi.

---

## 5. Roadmap Tuần 3 (đề xuất)

| # | Việc |
|:-:|------|
| 3.1 | Frontend `/la-ban-huong-di/[slug]/` render 11 sections + gate Free/Active (gọi API sections) |
| 3.2 | Frontend quiz → gọi match-v3, hiện Top 3 + gauge match% |
| 3.3 | Biên soạn Đợt 1 P1 (6 mô hình: MH-113,115,121,125,129,133) — Claude API + Master Prompt |
| 3.4 | Refine 3 section/bộ của 37 Sol → 11 section đầy đủ (dần) |
| 3.5 | (Nếu cần) hoàn tất Google OAuth: thêm cột google_id vào prod DB + test luồng |

---

## 6. Pending / cảnh báo giữ nguyên từ Tuần 1

- ⚠️ **KHÔNG chạy `prisma db push`** (19 bảng mới không trong schema.prisma + generated column) — dùng psql/migration.
- 5 câu hỏi treo (scope đối tác P1, pricing 3/4 tier, payment webhook, Email OTP, IP ownership) — chưa chốt.
- Google login: code đã lên prod nhưng cột `google_id` trong prod DB cần kiểm tra trước khi bật nút.

---

## 7. Vào phiên sau chỉ cần nói

> "Đọc `2026-07-11-EOD-TUAN2-API.md` và tiếp tục Tuần 3 (frontend + biên soạn content)"

Nền tảng backend đã xong: schema + data + matching engine + entitlement API đều LIVE. Tuần 3 chuyển sang frontend rendering + sản xuất nội dung.

_Sol Ecosystem · CTY CP VINET · Khang Sol · Zalo 3547084958635197535 · Sealed 2026-07-11 (phiên 2)_
