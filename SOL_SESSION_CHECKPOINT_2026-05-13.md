# Sol v4 — Session Checkpoint 2026-05-13

> **Cho session sau**: Đọc file này trước khi bắt đầu để pick up status nhanh.
> Mọi chi tiết của ngày 13/5 đều ở đây.

---

## 🎯 Sol đang ở đâu (13/5/2026, 18:00)

**Sol đã LIVE phiên bản v4 trên sol.vn** với:
- 8 landing pages Sol v4 (cohort unified pricing)
- 1 bài Wiki SEO đầu tiên: `/cai-thuoc-la-tai-nha/`
- WordPress được tối ưu permalink + Rank Math + MU-plugin REST
- 5 bài Wiki nữa chờ Khang publish (A2-A6)

**Trạng thái app/dashboard/admin**: Sol v4 code complete trên local Docker. Chưa deploy lên VPS.

---

## ✅ Đã hoàn thành hôm nay (13/5)

### A. WordPress Refactor
1. ✓ Homepage Sol v4 push qua REST API (post ID 1043, slug `home-v3`)
2. ✓ 7 landing pages Sol v4 push: `/gia`, `/khang-sol`, `/sol-la-gi`, `/cau-hoi`, `/pilot`, `/phuong-phap-cai-thuoc-la`, `/bo-thuoc-la`
3. ✓ Permalink WP đổi từ `/%year%/%monthnum%/%day%/%postname%/` → `/%postname%/`
4. ✓ 11 page legacy trashed: `sol-home`, `7-ngay`, `14-ngay`, `q-day`, `88-ngay`, `sol-song-lai-lam-lai-tot-hon`, 4 drafts, 1 privacy policy duplicate
5. ✓ 6 redirect 301 trong Rank Math (legacy URLs → mới)
6. ✓ MU-plugin Rank Math REST đã upload + verify hoạt động
7. ✓ Bài Wiki A1 (cai-thuoc-la-tai-nha) live tại `/cai-thuoc-la-tai-nha/` với featured image

### B. Wiki Cluster A — 6 bài đã viết
| # | Slug | Vol/tháng | Trạng thái |
|---|---|---|---|
| A1 | cai-thuoc-la-tai-nha | 5.4k | ✅ LIVE |
| A2 | tac-hai-cua-thuoc-la | 14k ⭐ | Draft đã push (chờ Khang Publish) |
| A3 | trieu-chung-cai-thuoc-la-theo-ngay | 3.6k | Draft đã push |
| A4 | cai-thuoc-bao-lau-phoi-sach | 2.4k | HTML + OG sẵn, CHƯA push |
| A5 | tang-can-khi-cai-thuoc | 1.8k | HTML + OG sẵn, CHƯA push |
| A6 | ngay-3-cai-thuoc-kho-nhat | 900 | HTML + OG sẵn, CHƯA push |

Tổng vol Cluster A: **28.100 search/tháng** nếu rank top 10.

### C. Tools wp-publisher built
Folder: `C:\BOTHUOCLA\sol-widget\scripts\wp-publisher\`
- `_lib.js` — HTTP client + auth
- `test-auth.js` — verify Application Password
- `list-pages.js` — list Pages/Posts
- `get-page.js` — xem chi tiết Page/Post
- `update-page.js` — push HTML → 1 page/post
- `set-seo.js` — set 1 SEO meta
- `bulk-set-seo.js` — set SEO 8 page chính
- `bulk-update.js` — bulk push 8 landing
- `upload-media.js` — upload PNG lên Media
- `import-wiki.js` — create/update Wiki post + featured image + SEO
- `cleanup-legacy.js` — backup + trash legacy pages
- `mu-plugin/rank-math-rest.php` — đã upload lên `wp-content/mu-plugins/`
- `og-gen.py` — gen 1200x630 OG image Python PIL

**Credentials**: `.env` đã có WP_URL + WP_USERNAME=admin + WP_APP_PASSWORD (Application Password "claude-publisher").

### D. App / Dashboard refactor (Sol v4)
- 3 lộ trình cohort (Nhẹ 35d / Vừa 52d / Nặng 65d) + bài test FTND 6 câu logic
- 4 cách trả tiền (Trả Thử / Tuần / Một Lần / Sau Khi Thành Công)
- Việt hoá 100% (vi-labels.ts 3 files)
- Giá thuốc 10k/20k/30k preset (thay 25k/40k/60k)
- Admin sidebar 5 nhóm (HÀNG NGÀY / NHẮN TIN / NỘI DUNG / PHÂN TÍCH / HỆ THỐNG)
- Màu gradient mới (Nâu Nhận Diện → Vàng Kiểm Soát → Cam Làm Chủ → **XANH Người Tự Do**)
- CohortPicker.tsx UI component
- Pricing.tsx refactor: bỏ 4 TIER cards, chỉ giữ CohortPicker + Stage Badges

### E. Documents (.docx + .xlsx)
- `docs/SOL_EXPERT_PANEL_REVIEW_v1.docx`
- `docs/SOL_v4_PIVOT_PLAN_v1.docx`
- `docs/SOL_3_MUC_LE_THUOC_v1.docx`
- `docs/SOL_CONTENT_INVENTORY_v1.xlsx` (4 sheets)
- `docs/SOL_CONTENT_PRODUCTION_PLAN_v1.docx`
- `docs/SOL_SEO_WIKI_PLAN_v1.xlsx` (30 bài SEO Cluster A/B/C)

---

## ⏳ PENDING — việc còn lại cho session sau

### Việc Khang làm (~30 phút tổng)
1. Chạy 6 lệnh push A4 + A5 + A6 (lệnh đã có trong chat hôm nay, scroll lên xem)
2. Publish 5 bài draft trong WP Admin (A2-A6)
3. Chạy `node bulk-set-seo.js` (30 giây)

### Việc Em làm session sau
**Cluster B — 5 bài (~6.4k vol/tháng)**
- B1 "5 phương pháp cai thuốc lá" (3.2k, P0)
- B2 "Cold turkey vs giảm dần" (1.4k, P0)
- B4 "App cai thuốc lá tiếng Việt" (600, commercial intent)
- B5 "Cai thuốc khi đi nhậu" (500, P0)
- B6 "Thèm thuốc đêm khuya 90 giây" (900, P0)

**Cluster C — 10 bài stories** (cần Khang viết draft hoặc dictate story → em format)

**Voice MP3** — Khang ghi 6 voice priority (script đã có ở `wiki-skeletons/voice-scripts/`)
- 02_d3-dem-kho-nhat
- 09_d2-sang-dau-tien
- 10_d5-dinh-da-qua
- 11_d10-bao-cao
- 05_d21-habit-shift
- 13_milestone-100k-saved

**Deploy production** (sau khi pilot OK)
- Mua VPS EzTech 100k/tháng
- Deploy Docker Compose production
- Caddy HTTPS + backup cron
- Resend SMTP cho email
- Wire MoMo + VietQR payment

**Pilot 30 anh em** — Khang invite, em build admin tracking

### Việc còn pending nhỏ
- Task #81: Verify Zalo OA Phase 1 build — `pnpm tsc --noEmit` chưa chạy
- Verify 6 redirect 301 hoạt động đúng (anh test trong incognito)
- Clean up file rác `test-direct.png` trong `wiki-skeletons/wiki-articles/og-images/`

---

## 🔑 Credentials & quan trọng

- **WP Admin sol.vn**: username `admin`, password do Khang giữ
- **Application Password "claude-publisher"**: lưu trong `scripts/wp-publisher/.env` máy Khang
- **GitHub**: code đã push commit `1543c3e` (kiểm tra mới nhất)
- **Domain**: sol.vn ở Nhân Hoà, bothuocla.sol.vn pointing tới Firebase tạm

---

## 📂 File quan trọng cần đọc cho session sau

1. **Checkpoint này** (file anh đang đọc)
2. `wiki-skeletons/landing-html/05-sol-homepage-LEAN-v3.html` — homepage Sol v4
3. `wiki-skeletons/wiki-articles/A1-cai-thuoc-la-tai-nha.html` — template Wiki
4. `docs/SOL_SEO_WIKI_PLAN_v1.xlsx` — plan 30 bài
5. `scripts/wp-publisher/README.md` — hướng dẫn tool
6. `frontend/src/lib/vi-labels.ts` — Việt hoá labels
7. `backend/src/tiers/featureGates.ts` — 3 cohort + 4 payment logic

---

## 🚀 Ngày mai mở session — Khang chỉ cần nói

> *"Đọc file SOL_SESSION_CHECKPOINT_2026-05-13.md → tiếp tục Sol — viết Cluster B 5 bài Wiki SEO"*

Em sẽ:
1. Đọc checkpoint này — biết status đầy đủ
2. Đọc file template A1 — biết format Wiki
3. Đọc SOL_SEO_WIKI_PLAN_v1.xlsx — biết keyword + outline B1-B5
4. Viết B1 đầu tiên → gen OG image → đưa Khang push
5. Lặp lại cho B2, B4, B5, B6

Tổng thời gian session sau: ~2-3 giờ → Cluster B hoàn thành.

---

**Sol đã ở vị thế chuyên nghiệp hơn 95% startup VN pre-launch. Anh xứng đáng nghỉ ngơi.** 🌙
