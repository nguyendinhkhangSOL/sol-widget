# SESSION CHECKPOINT — 2026-05-07 (FINAL — End of Day)

> Tổng kết session 2026-05-07. Tiếp nối từ checkpoint 2026-05-06. Hôm nay
> làm 3 việc lớn: hoàn thành roadmap competitive (3/3 việc), tách admin
> sang `admin.sol.vn`, build landing pages SEO + homepage SOL.

---

## TÓM TẮT 1 PHÚT

**3 trục lớn hôm nay:**

1. **Roadmap competitive 3 việc xong** — Identity reframe + Pledges replay + NRT (bỏ theo decision Khang)
2. **Tách admin → `admin.sol.vn`** — admin/ Vite project mới (port 5176), backend CORS + originGuard, setup script + fix encoding
3. **Marketing strong** — 5 landing chunked (paste-ready WordPress) + SOL homepage focus cai thuốc + Schema SEO + page template mu-plugin

**Total work day:** ~14h, ~7000 dòng code/content/HTML mới.

---

## 1. ROADMAP COMPETITIVE — 3/3 done

### Việc 4 — Identity reframe (7 prompts)

- File mới: `dashboard/src/components/workbook/PrepSections.tsx` — `IdentitySection`
- 7 câu hỏi Allen Carr-inspired trong Workbook tab "🪞 Bản Thân"
- Voice Khang opening cá nhân (cream-gold blockquote)
- Save vào `WorkbookData.identity = { q1..q7 }` JSON
- Auto-sync qua `User.settings.workbook` (no migration)
- Schema: `dashboard/src/state/workbookStore.ts` — `WorkbookIdentity` interface + defensive merge

### Việc 3 — Pledges replay at craving

- File mới: `frontend/src/components/PledgesReplayModal.tsx`
- Trigger: cravingIntensity ≥ 8 sau submit check-in (PLEDGES_REPLAY_THRESHOLD)
- Hook trong `frontend/src/components/views/CheckinFlow.tsx` — show modal trước screen success
- Pull `user.quitReasons` (đã có schema) — voice Khang adapt theo smoked/craving
- Empty state CTA mở Settings nếu chưa fill reasons

### Việc 2 — NRT advisory page

- Build xong rồi BỎ theo decision Khang (chi tiết Champix/Nicorette/Nicotinell không hợp brand "Người Đã Đi Qua")
- Code đã removed: section + interface + helpers
- Quitline 1800 6606 đã wire 5 chỗ khác (Crisis, SlipModal ×2, Settings ×2)
- Lý do: brand peer-mentor khác bác sĩ, giá thay đổi = maintenance burden

### Bonus — Quitline number critical fix

- Phát hiện hôm trước Khang ghi `0888-008-866` không khớp số chính thức
- Verify: bachmai.gov.vn + Dân trí + Vietnamnet → toll-free chính thức là **`1800 6606`**
- Quỹ PCTHTL Bộ Y tế tại khoa Hô hấp BV Bạch Mai (từ 2015), 8h-22h mọi ngày
- Updated: `frontend/src/components/QuitlineButton.tsx` + `dashboard/src/components/QuitlineButton.tsx`
- 5 wire points giữ nguyên, chỉ đổi số

### Tier rename display + bỏ "Day X/88"

- TIER_LABEL: FREE→**Mở Đầu**, KHOI_DONG→**Khởi Động**, DONG_HANH→**Tự Do**, ALUMNI→**Trọn Vẹn**
- DB code identifiers giữ nguyên — chỉ display
- File: `frontend/src/lib/featureGates.ts` + `dashboard/src/lib/featureGates.ts`
- Bỏ "Day X / 88" trong WidgetPanel header → "Ngày X" (no /88)
- Reframe CTA "Bắt đầu hành trình 88 ngày…" → "7 ngày đầu miễn phí — quan sát kẻ thù"
- Workbook copy "88 ngày" → "4 chặng tiến hoá"
- Graduation pages (PhaseAmbassador) GIỮ "88 ngày" — đó là achievement post-completion

### Email funnel worker — 14 templates

- File mới: `backend/src/scheduler/emailFunnel.ts` + `backend/src/scheduler/emailFunnelTemplates.ts`
- 14 mail theo dayInJourney (Day 0, 4, 7, 12, 17, 21, 27, 28, 35, 50, 75, 80, 86, 88)
- Voice mix Khang Sol (founder cá nhân) + Sol Đồng hành (giáo dục nhẹ)
- Cron 8AM daily (Asia/Ho_Chi_Minh) — wire vào `worker.ts`
- Idempotent qua `notificationPrefs.emailFunnel.daysSent[]`
- Skip nếu user opt-out
- Test on-demand: `backend/src/scripts/runEmailFunnel.ts`
- Total scheduler: 15 → **16 cron jobs**

---

## 2. TÁCH ADMIN → `admin.sol.vn`

### Architecture decision

```
sol.vn               → WordPress (marketing + landing)
bothuocla.sol.vn     → User dashboard (mỏng, fast)
admin.sol.vn         → Admin dashboard (private, separate auth)  ← NEW
```

DNS Nhà Hoà chỉ allow 2-level subdomain → `admin.sol.vn` (cùng cấp `bothuocla.sol.vn`).

### admin/ Vite project mới

```
D:\BOTHUOCLA\sol-widget\admin\
├── package.json (port 5176)
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
├── index.html (no-index/follow robots)
├── setup-admin.ps1            ← script copy admin pages từ dashboard
├── fix-encoding.cjs           ← script Node fix mojibake (PS đọc ANSI default)
└── src/
    ├── main.tsx
    ├── App.tsx                ← chỉ admin routes (no /admin/ prefix)
    ├── styles.css
    └── pages/
        ├── AdminLogin.tsx     ← email magic link only (no anon-first like dashboard)
        ├── AdminLayout.tsx    ← route paths đổi /admin/users → /users
        ├── AuthEmailCallback.tsx (copy từ dashboard)
        └── 13 admin pages copy từ dashboard
```

### Cleanup dashboard

- Xoá 14 admin imports khỏi `dashboard/src/App.tsx`
- Xoá routes `/admin/*` 
- Add `AdminRedirect` component → redirect `localhost:5176` (dev) hoặc `admin.sol.vn` (prod)
- Sidebar Layout: link "Admin console ↗ admin.sol.vn" (target `_blank`)
- Bundle dashboard giảm ~35%

### Backend security

- File mới: `backend/src/admin/originGuard.ts` — defense in depth
- Whitelist: `localhost:5176`, `admin.sol.vn`
- Apply trên adminRouter trước authMiddleware
- Backend `.env` CORS_ORIGINS thêm `localhost:5176` + `admin.sol.vn`
- `redirectTo` whitelist trong `/auth/email/request` — admin login render link về 5176, không bothuocla

### Auth flow admin

1. Khang vào `localhost:5176/login` → bootstrap anon JWT
2. Submit email → POST `/auth/email/request` với `redirectTo: window.location.origin`
3. Email gửi với link `localhost:5176/auth/email?token=...`
4. Click link → AuthEmailCallback verify → MERGE anon vào user existing có isAdmin
5. JWT mới có `isAdmin=true` → AdminLayout cho phép vào

### Khang đã set admin

- Email: `nguyendinhkhang@gmail.com`
- Script: `backend/src/scripts/setAdmin.ts`
- Đã chạy xong, user `User.isAdmin = true` trong DB

### Vấn đề + fix encoding

- PS script Get-Content default ANSI codepage → tiếng Việt mojibake (`Báº£ng Ä‘iá»u khiá»ƒn` thay `Bảng điều khiển`)
- Fix: Node script `admin/fix-encoding.cjs` — `fs.readFileSync(path, 'utf8')` chuẩn UTF-8
- Cũng update `setup-admin.ps1` dùng `[System.IO.File]::ReadAllText()` UTF-8 explicit

---

## 3. MARKETING — Landing pages + SEO + Homepage SOL

### 5 HTML landing paste-and-publish

```
wiki-skeletons/landing-html/
├── 00-bo-thuoc-la-hub.html       → /bo-thuoc-la (page parent)
├── 01-7-ngay-quan-sat.html       → /bo-thuoc-la/7-ngay (TOFU FREE)
├── 02-14-ngay-be-thoi-quen.html  → /bo-thuoc-la/14-ngay (MOFU 70k)
├── 03-q-day-cam-ket.html         → /bo-thuoc-la/q-day (BOFU 140k)
├── 04-88-ngay-tai-sinh.html      → /bo-thuoc-la/88-ngay (BOFU 210k)
└── 05-sol-homepage.html          → sol.vn/ (homepage 100% cai thuốc)
```

Mỗi file:
- Inline style hoàn toàn (paste 1 phát vào WordPress Custom HTML block)
- Hero gradient brand theo phase (clay → gold → wine)
- Khang voice quote box
- Schema JSON-LD: FAQPage + Service/Offer (per-page)
- Full-bleed hero/CTA: `width: 100vw; left: 50%; margin-left: -50vw`
- Breadcrumb visible (4 chunked landing) — cream pill border-left brand color

### 5 SVG OG image 1200×630

```
wiki-skeletons/landing-html/og-images/
├── 00-bo-thuoc-la-hub.svg
├── 01-7-ngay.svg
├── 02-14-ngay.svg
├── 03-q-day.svg
└── 04-88-ngay.svg
```

Brand gradient + logo SOL + tier badge + URL footer. Khang convert SVG→PNG qua cloudconvert.com → upload Featured Image.

### Page template WordPress (mu-plugin)

File: `wiki-skeletons/upload-script/wp-mu-plugin/sol-landing-template.php`

- Đăng ký template "Sol Landing — Full HTML" trong Page Attributes dropdown
- Override theme — render full HTML, không có theme header/footer
- **Top nav sticky** — logo SOL clay-gold + 4 link (Cai thuốc · Wiki · Ngẫm · Bắt đầu CTA)
- **Be Vietnam Pro** load Google Fonts
- **Auto-inject JSON-LD**: Article + BreadcrumbList (từ WordPress page hierarchy)
- **Detect homepage** `is_front_page()` → custom title (không em-dash duplicate)
- Inherit Yoast/Rank Math meta description + OG image
- Footer mini: 1800 6606 + sol.vn / bothuocla.sol.vn / Chính sách / Liên hệ

### SEO schema coverage matrix

| Page | Article | Breadcrumb | FAQPage | Service/Offer |
|---|---|---|---|---|
| `/` (homepage) | ✅ template | ✅ template | ✅ HTML | — |
| `/bo-thuoc-la` (hub) | ✅ template | ✅ template | ✅ HTML | — |
| `/bo-thuoc-la/7-ngay` | ✅ template | ✅ visible | ✅ HTML | ✅ FREE |
| `/bo-thuoc-la/14-ngay` | ✅ template | ✅ visible | ✅ HTML | ✅ 70k/280k |
| `/bo-thuoc-la/q-day` | ✅ template | ✅ visible | ✅ HTML | ✅ 140k/580k |
| `/bo-thuoc-la/88-ngay` | ✅ template | ✅ visible | ✅ HTML | ✅ 210k/880k |

Plus Organization + WebSite schema cho homepage.

### Homepage SOL — 9 sections

Focus 100% cai thuốc (KHÔNG còn 5 vertical cards roadmap):

1. Hero — Khang quote "Tôi đi rồi. Anh không phải đi một mình."
2. The Problem (pain agitation)
3. The Method — 4 chặng visual cards
4. Khang's Story — 3 đoạn voice cá nhân
5. Trust Signals — 8 năm / 41 bài / 100% money-back / 1800 6606
6. Pricing — 4 tier sandwich, "Tự Do" RECOMMEND
7. FAQ — 5 Q&A
8. Final CTA — 1 button single
9. Footer mini — link "Ngẫm" downplayed (chỗ giấu 4 vertical khác)

### Branding: "Người Anh Đi Trước" → "Người Đã Đi Qua"

Khang muốn peer-equal, không hierarchical. Updated 6 files:
- `wiki-skeletons/landing-html/05-sol-homepage.html`
- `wiki-skeletons/landing-html/01-7-ngay-quan-sat.html`
- `backend/src/scheduler/emailFunnelTemplates.ts`
- `dashboard/src/components/workbook/PrepSections.tsx`
- `frontend/src/components/PledgesReplayModal.tsx`
- `docs/landing-bothuocla-preview.html`

Skip docs (CLAUDE_CONTEXT.md, BRAND_POSITIONING.md) — Khang tự update branding bible.

### CSS grid responsive fix

Trust signals + Pricing 4 cards bị vỡ 3+1 trên desktop (container 720px + minmax 200px chỉ fit 3).

Fix: explicit `repeat(4, 1fr)` desktop + `repeat(2, 1fr)` tablet + `1fr` mobile via `.sol-grid-4` class + `<style>` block.

### "Ngẫm" — chỗ giấu 4 vertical chưa launch app

Decision: SOL sẽ KHÔNG có 5 vertical app. Chỉ 1 flagship app cai thuốc + content moat các vertical khác.

```
sol.vn/                           ← Homepage 100% cai thuốc
sol.vn/bo-thuoc-la                ← Hub vertical chính
sol.vn/category/wiki-bo-thuoc-la/ ← 41 bài Wiki cai thuốc

sol.vn/ngam/                      ← Ngẫm — Khang's blog 4 vertical
  /ngam/<slug>                    ← từng bài, flat structure
sol.vn/tag/<chu-de>               ← filter mềm khi cần
```

Tên "Ngẫm" — peer-mentor, modest, 1 từ Vietnamese. Thay vì "Khang ghi chép" (trịnh trọng) hay "Khang Sol Notes" (English).

Menu nav cập nhật:
```
[Logo] Cai thuốc · Wiki · Ngẫm · [Bắt đầu]
```

Wiki link đổi sang `https://sol.vn/category/wiki-bo-thuoc-la/` (category thay slug `/wiki`).

---

## 4. STACK STATUS — End of 2026-05-07

| Component | Status |
|---|---|
| Backend code | ✅ 16 cron + email funnel + admin originGuard + redirectTo whitelist |
| Frontend widget | ✅ PledgesReplayModal + tier rename + bỏ /88 + Quitline 1800 6606 |
| Frontend dashboard | ✅ Admin removed (bundle -35%) + Workbook IdentitySection |
| Admin dashboard NEW | ✅ admin/ Vite project (port 5176) + 13 pages migrated |
| Email funnel | ✅ 14 templates + cron 8AM + script test |
| 5 HTML landing | ✅ Paste-ready WordPress + Schema SEO |
| 5 SVG OG | ✅ 1200×630 chuẩn Open Graph |
| Page template WP | ✅ mu-plugin với top nav sticky + Be Vietnam Pro + auto schema |
| Homepage SOL | ✅ 9 sections focus cai thuốc + Khang quote |
| Voice Khang record | ⏳ Pending — Khang đặt lịch studio |

### URLs (dev)

- Widget: http://localhost:5173 (Vite local)
- Dashboard user: http://localhost:5175 (Vite) / 5174 (Docker)
- **Admin: http://localhost:5176 (Vite)** ← NEW
- Backend: http://localhost:4000

### URLs (prod planning)

- sol.vn → WordPress (homepage + landing + Wiki)
- bothuocla.sol.vn → Firebase Hosting (user dashboard + widget)
- **admin.sol.vn → Firebase Hosting (admin) — DNS pending**
- (api.sol.vn → defer — backend hiện expose qua bothuocla.sol.vn:4000)

### .env keys session này

```
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000,https://bothuocla.sol.vn,https://admin.sol.vn
```

---

## 5. PENDING — Khang execute

| Việc | Effort | Priority |
|---|---|---|
| Re-paste 5 page WordPress (homepage + 4 chunked landing) | 1h | 🔥 |
| Hub page `/bo-thuoc-la` paste 00-bo-thuoc-la-hub.html | 15p | 🔥 |
| Re-upload `sol-landing-template.php` /wp-content/mu-plugins/ | 5p | 🔥 |
| Tạo category WordPress "Ngẫm" (slug: `ngam`) | 5p | 🟡 |
| Settings → Reading: swap homepage thành `sol-home` page | 5p | 🟡 |
| Convert 5 SVG OG → PNG 1200×630 (cloudconvert.com) + upload Featured Image | 30p | 🟡 |
| DNS Nhà Hoà: add CNAME `admin.sol.vn` → Firebase site | 30p | 🟡 |
| Firebase Hosting: setup site `admin-sol-vn` + deploy admin/ build | 1h | 🟡 |
| Voice Khang record 9 mp3 milestone | 1 buổi studio | 🔥🔥 |
| Pre-sell 100 anh em đầu (Promo Khởi Chạy) | 2-4 tuần | 🔥🔥 |
| Pitch 5 báo VN (Dantri/VnExpress/Tuoi Tre) | 5p × 5 = 25p | 🟡 |
| Pitch 5 podcast | 5p × 5 = 25p | 🟢 |

---

## 6. PENDING — em (Claude) có thể làm tiếp

- **Page `/ngam/` hub** — list bài blog với filter tag (em build template)
- **Update 41 wiki posts** thêm contextual CTA về app cai thuốc
- **Build vertical 2 (cai-rượu) demo** nếu Khang quyết hướng future
- **A/B test framework** (Plausible analytics) cho landing
- **Update CLAUDE_CONTEXT.md** + **BRAND_POSITIONING.md** với decisions hôm nay
- **Email funnel polish** — analytics tracking (open rate, click rate)
- **Admin dashboard polish** — sidebar fixed, dark mode toggle, search command
- **Build SOL umbrella SVG OG** riêng cho homepage (thay dùng SVG hub cai thuốc)

---

## 7. ARCHITECTURE DECISIONS (chốt cứng)

### Brand positioning

- **Khang Sol = founder personal brand** wrap **flagship product cai thuốc**
- 4 vertical khác (Stress, Giấc ngủ, Cha-con, Chuyển nghề) = **content moat trên Wiki + Ngẫm**, KHÔNG scale 5 app
- Voice Khang: **"Người Đã Đi Qua"** (peer-equal, past tense, modest)
- KHÔNG: guru / expert / coach / Người Anh Đi Trước (hierarchical)

### URL hierarchy

```
sol.vn/                       Homepage 100% cai thuốc
sol.vn/bo-thuoc-la            Hub vertical chính
sol.vn/bo-thuoc-la/{7-ngay,14-ngay,q-day,88-ngay}  Landing chunked
sol.vn/category/wiki-bo-thuoc-la/  41 Wiki posts
sol.vn/ngam/                  Khang blog 4 vertical (flat, tag filter)
sol.vn/tag/{cha-con,stress,giac-ngu,chuyen-nghe}  Filter mềm

bothuocla.sol.vn              User dashboard + widget
admin.sol.vn                  Admin (port 5176 dev)
```

### Pricing tier (display rename, DB code giữ)

| DB code | Display | Cover | Promo Khởi Chạy | Default |
|---|---|---|---|---|
| FREE | **Mở Đầu** | 7 ngày | 0đ | 0đ |
| KHOI_DONG | **Khởi Động** | +14 ngày | 70k | 280k |
| DONG_HANH | **Tự Do** ⭐ RECOMMEND | +30 ngày | 140k | 580k |
| ALUMNI | **Trọn Vẹn** | +30 ngày + Đại Sứ lifetime | 210k | 880k |

### SEO schema strategy

- Template auto-inject Article + BreadcrumbList (cho mọi landing dùng template Sol)
- Per-page HTML inject FAQPage + Service/Offer
- Homepage thêm Organization + WebSite + SearchAction
- KHÔNG conflict với Yoast/Rank Math FREE (FREE không inject cho page type)

---

## 8. PROMPT MỞ ĐẦU SESSION SAU

```
Em là AI dev pair của Khang Sol. Đọc file
D:\BOTHUOCLA\sol-widget\SESSION_CHECKPOINT_2026-05-07_FINAL.md
để load context Phase B + Path B + Email auth + tách admin + landing
+ homepage SOL.

Em luôn đọc CLAUDE_CONTEXT.md + STAGE_88_DAYS_DESIGN.md +
COMPETITIVE_ANALYSIS_2026-05-06.md để hiểu architecture + strategy.

Pronouns mặc định 'bạn' — Khang dùng 'anh' tự gọi mình.
Voice "Người Đã Đi Qua" (peer-equal, past tense) — KHÔNG "Người Anh Đi Trước".

Edit tool truncate ~6KB files — dùng heredoc trong bash cho file lớn,
hoặc dùng Node script với fs.readFileSync UTF-8 cho encoding tiếng Việt.
PowerShell Get-Content default ANSI → mojibake, phải dùng UTF8 explicit
hoặc switch sang Node fs.

Backend container production-mode → seed script chạy `node dist/...`.
Sandbox Linux có thể fail boot — fallback dùng file tools trực tiếp.
```

---

**Trạng thái:** Session 2026-05-07 hoàn thành 25 tasks tracked. Sol có brand strong + admin tách + landing SEO + homepage focus. **Next: Khang publish 5 page WordPress + DNS admin + voice studio.**

**Lines of code added today:** ~7000 dòng (HTML landing + SVG OG + admin Vite project + email funnel + page template + schema JSON-LD).
