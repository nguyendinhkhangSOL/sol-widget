# Sol Widget — Deployment Plan (Old Codebase Path)

**Date:** 2026-05-21 · **D-Day:** 2026-05-31 (10 ngày) · **Author:** Claude + Khang

---

## 0. Quyết định chiến lược (đã chốt với Khang)

Sau khi đọc kỹ 3 codebase cũ (`backend/`, `dashboard/`, `admin/`), thực tế là:

- **Backend cũ**: Express + Prisma + 53 model + ~30 admin endpoint + 26 cron job + Zalo OA tích hợp đầy đủ. **Production-grade.**
- **Dashboard cũ**: 18+ trang, hành trình **88 ngày Phase B** (Nhận Thức 7 + Hành Động 21 + Giải Phóng 30 + Tái Thiết 30), mobile-first, polished UX cho 45+.
- **Admin cũ**: 18 trang gồm Zalo OA (4 trang), Content CMS, Voice library, Refunds, SOS triage, AI test, CHIP với intent matching. **Gấp 3-4× surface area** so với Next.js admin mới em đã build.

→ **Path 1 (đã chốt)**: Deploy **toàn bộ codebase cũ**, giữ Next.js làm landing + Test FTND entry point. Không build lại từ đầu.

### Kiến trúc đích (v3 — CHỐT 21/5 sau khi Khang refine scope lần 3)

**Nguyên tắc tối giản:** Dashboard SPA cũ làm TẤT CẢ. Bỏ Next.js hoàn toàn. Widget độc lập `frontend/` để embed partners.

```
sol.vn                  → Cloudflare Worker marketing wiki + embed sol-widget.js (1 dòng script)
                          (widget từ frontend/ — không động tới)

bothuocla.sol.vn        → Dashboard SPA cũ DUY NHẤT (Vite build ở root)
   /                       → Landing/Overview (route mới, em tự quyết UX)
   /test-ftnd              → MỚI — port từ Next.js, thay OnboardingWizard
   /pricing                → Refactor theo business model 3 gói + VietQR
   /journey, /chat, /settings, /workbook, /analytics, ... (giữ 18 page)
   /api/                   → Backend Express (nginx proxy → 127.0.0.1:4000)
   /api/zalo/webhook       → Zalo OA webhook
   /api/socket.io          → Socket.IO realtime

admin.sol.vn            → Admin SPA cũ — 18 trang ops console
                          + IP allowlist Khang + CORS cross-origin về bothuocla/api

db                      → PostgreSQL local service (port 5432)
```

**BỎ:** Next.js app/ em đã build 7 ngày qua. Chỉ EXTRACT 2 file:
- `app/lib/ftnd.ts` (logic FTND + COHORT_PLANS)
- `app/app/test-ftnd/TestFtndForm.tsx` (UI 6 câu)
→ port sang dashboard SPA (Vite React, không Server Component).

**Tại sao đơn giản hóa thế này:**
1. `VITE_BASE=/app/` vốn đã có sẵn trong `dashboard/vite.config.ts` → không cần override (red flag #1 tự biến mất).
2. `VITE_API_BASE=/api` (relative URL) → same-origin, không CORS preflight, không cross-domain JWT transfer phức tạp.
3. 1 SSL cert thay vì 3 — setup nhanh, ít chỗ chết.
4. Cookie 1st-party → tránh Safari ITP block 3rd-party cookie (Zalo OA login mobile Safari êm hơn).
5. SEO consolidation về 1 domain.
6. DNS gọn: chỉ thêm 1 record `admin.sol.vn`.
7. Cross-domain JWT transfer giữa FTND → app **không cần nữa** (cùng origin, localStorage share).

**Trade-off chấp nhận được:**
- Nginx `bothuocla.sol.vn` multi-location (3 block: `/`, `/app/`, `/api/`) — phức tạp hơn nhưng pattern chuẩn.
- Cùng VPS chia tài nguyên Next.js + dashboard + Express + Postgres. Pilot 10-100 user OK; scale 10k+ về sau mới phải tách subdomain.
- Admin cross-origin về `bothuocla.sol.vn/api` → CORS chỉ cần whitelist 1 origin `admin.sol.vn`.

### Lý do chốt path này

| Tiêu chí | Path A: Build mới trong Next.js | **Path 1: Deploy code cũ (đã chốt)** |
|---|---|---|
| Thời gian | 6-8 tuần (rebuild 50+ model + 18 trang) | **3-5 ngày deploy** |
| Risk | Cao (bài toán em không hiểu hết) | Thấp (đã chạy production rồi) |
| Feature coverage | 30% | **95%** |
| Zalo OA | Chưa có | **Đầy đủ (login, OA reply, ZNS, SOS, 51-day scheduler)** |
| Content CMS | Chưa có | Có (3-zone editor + revisions + lint) |
| Cron jobs | Chưa có | 26 jobs (smart scheduler + funnel + memory book) |

---

## 0.5. Business Model (chốt 21/5 sáng — đã live ở `bothuocla.sol.vn/bang-gia`)

**Cơ chế giá:** 5.000đ/ngày (tri ân 500 anh em đầu — giá thực 9.000đ/ngày) · **7 ngày Nhận Diện FREE** · KHÔNG auto-charge · Quét QR thủ công → TK Khang Sol.

**3 gói theo FTND cohort:**

| Cohort | FTND | Audience | Lộ trình | Tổng giá |
|---|---|---|---|---|
| LIGHT | 0-3 | < 10 điếu/ngày | 35 ngày (7 free + 28 × 5k) | **140.000đ** |
| MODERATE ⭐ POPULAR | 4-6 | 10-20 điếu/ngày | 52 ngày (7 free + 45 × 5k) | **225.000đ** |
| HEAVY | 7-10 | > 1 bao/ngày | 65 ngày (7 free + 58 × 5k) | **290.000đ** |

**Alternative trả góp tuần:** 35.000đ/tuần (sau 7 ngày free).

**Refund "Rút lui văn minh":** ≥ 7 ngày Ngắt Cơn · ≥ 80% tương tác · 1 lần/SĐT/TK chống fraud.

**Payment provider thật:** **VietQR static** (không cần MoMo SDK). Backend generate QR (VietQR API format: `BIDV/MB Bank/Vietcombank` + STK + nội dung CK `SOL <userId>` + amount). User chuyển khoản tay → admin (Khang) confirm bằng tay qua admin panel `/payments` route. Phase 2 có thể wire MB Bank webhook tự động sau.

**Khoản tiền dùng vào:** Server + Zalo OA + AI Mentor API (transparency).

---

## 1. Inventory: Cái cũ có gì

### 1.1 Backend (`C:\BOTHUOCLA\sol-widget\backend\`)

**Stack:** Node 20 + TypeScript 5.6 + Express 4.21 + Prisma 5.22 + Socket.IO 4.8 + node-cron + Postgres. Dockerfile có sẵn (multi-stage, Alpine, `npx prisma migrate deploy` ở `CMD`).

**Prisma models (53 total)** chia theo cụm domain:

- **Users/Auth (5):** `User` (mega-model ~250 field), `UserState`, `OtpCode`, `EmailVerificationToken`, `PushSubscription`
- **Journey (4):** `CheckIn`, `ExerciseEntry`, `CigaretteLog`, `ProgressJournal`
- **Content (3):** `ContentItem` (per dayNumber × module × voice), `ContentItemRevision`, `CannedReply` (CHIP với triggers + priority + minScore)
- **Messaging (1):** `Message`
- **Notifications (2):** `Notification` + `PushSubscription`
- **Crisis (2):** `CrisisEvent`, `CrisisTimerLog` (90s craving timer)
- **Payments (2):** `PaymentLog` (mock/MoMo/VietQR/Bank — **CHỈ mock wired**), `RefundRequest`
- **Voice library (4):** `VoiceMessage` + delivery, `KhangVoice` + reactions + questions + upvotes
- **Silent Companionship (3):** `Confession`, reactions, reads — pivot 2026-05-08
- **Lapse-friendly (1):** `LapseEvent`
- **Cohort/stats (2):** `Cohort`, `AnonymousStatsCache`
- **App settings (1):** `AppSetting` (key/JSON — AI provider keys + checklist config)
- **Zalo OA (5):** `ZaloOAUser`, `ZNSLog`, `ZaloTemplate`, `MessagingPolicy`, `UserMessagingProfile`
- **Phase 5 (2):** `ScheduledPush` (51-day ZNS queue), `SOSAlert`

**API surface (~150 route handler)**: auth (anonymous/OTP/email magic/Zalo OAuth/recovery), journey (dashboard/qday-confirm/onboarding/cigarette/exit/resume/journals/money-breakdown), checkins, exercises, content, messages, voice (2 routers — `/voice` cũ + `/voices` mới), confessions, khang-questions, lapse, crisis-timer, stats, tiers, payments, refunds, notifications, zalo OA (webhook + templates + journey enrollment + SOS), messaging policy, admin (~30 endpoints).

**26 cron jobs** trong `src/scheduler/worker.ts` chạy in-process, TZ `Asia/Ho_Chi_Minh`: `* * * * *` deliverDueNotifications, `*/5 * * * *` fireDuePushes (ZNS queue), `0 7` morning_goal, `5 7` Q-Day morning, `30 7` recompute journey day + streak milestones, `0 8` email funnel + memory book, `0 14` phenomena alert, `0 19` missed-day + prep reminders, `0 20` evening check-in, etc.

### 1.2 Dashboard (`C:\BOTHUOCLA\sol-widget\dashboard\`)

**Stack:** Vite 5.3 + React 18.3 + React Router 6.26 (BrowserRouter, `basename={import.meta.env.BASE_URL}`) + Zustand 4.5 + Tailwind 3.4 + Be Vietnam Pro font + bespoke `fetch` wrapper (không React Query).

**Routes (18 page polished)**: `/login` `/auth/email` `/` (Overview phase router) `/chat` (ranked CHIP + AI fallback) `/doc` (Khoảng Lặng) `/nghe` (NgheKhang voice) `/hoi` (HoiKhang mailbox) `/journey` `/journey/:day` `/workbook` `/history` `/analytics` `/settings` `/pricing` `/refund` `/reports` `/voice` `/science` `/q-day-checklist` `/admin/*` (redirect ra admin.sol.vn).

**Auth:** Anonymous-first. `App.tsx` bootstrap: (a) Zalo OAuth callback `?zalo=success`, (b) cross-domain transfer `?sol_token=` từ widget chat trên sol.vn, (c) JWT từ `localStorage['sol_token']`, (d) fallback tạo anon user qua `POST /auth/anonymous { deviceUid, originDomain }`.

**Mobile-first:** viewport meta, `useIsMobile(768)` switch bottom-nav 4-item (Tổng quan / Trò chuyện / Hành trình / Cài đặt), `env(safe-area-inset-bottom)` cho iPhone notch, `min-h-tap` 48px, font 17px line-height 1.6 cho user 45+.

### 1.3 Admin (`C:\BOTHUOCLA\sol-widget\admin\`)

**Stack:** Vite 5.3 + React 18.3 + React Router 6.26 + Zustand 4.5 + Tailwind 3.4. **Không** dùng UI lib (no shadcn/Radix), hand-rolled Tailwind.

**18 page** chia theo nhóm sidebar:

| Nhóm | Trang | Mức độ |
|---|---|---|
| **Hàng ngày** | `/` AdminHome (5-min morning + auto-refresh 30s + needs-attention list) | Polished |
| **Hàng ngày** | `/users` + `/users/:id` (filter/search + profile + check-in timeline + 30 messages + payments/refunds + comp tier + send voice) | Polished |
| **Hàng ngày** | `/refunds` (queue: APPROVE/DENY/PROCESSED + internal note) | Polished |
| **Nhắn tin** | `/messaging` (5 tab: Global wired, **Cohort/User/A-B/Reports đang hardcode mock**) | **WIP** |
| **Nhắn tin** | `/zalo-templates` (CRUD ZNS + 400-char counter + banned-word linter + submit-to-Zalo) | Polished |
| **Nhắn tin** | `/zalo-journey` (51-day scheduler: overview + queue 24h + users + enroll) | Functional |
| **Nhắn tin** | `/zalo-sos` (real-time SOS critical/high/medium/low + reply 48h OA window + resolve note) | Functional |
| **Nội dung** | `/content` (3-zone editor + revision history + lint + mock-user preview) | Polished |
| **Nội dung** | `/content-audit` (typo / broken-wiki / duplicate scan) | Functional |
| **Nội dung** | `/canned-replies` (CHIP CRUD + slug + emoji + triggers + priority + minScore) | Polished |
| **Nội dung** | `/voice` (CRUD voice library + trigger types DAY_MATCH/CRISIS/MILESTONE/MANUAL) | Functional |
| **Nội dung** | `/q-day-checklist` (editor + intro/outro) | Functional |
| **Phân tích** | `/analytics` (funnel + revenue range select) | Functional |
| **Phân tích** | `/cohorts` (monthly Q-Day retention) | Functional |
| **Phân tích** | `/wiki` (link-out + **mock top-posts**) | **WIP (mock)** |
| **Hệ thống** | `/ai` (provider picker + key masked + test connection + quota + temperature) | Polished |

**Auth:** Email magic link only (không password). Backend whitelists origin. Multi-user với flag `user.isAdmin`. JWT trong `localStorage['sol_token']`.

**Cái admin cũ CÓ mà Next.js admin mới CHƯA CÓ:**
1. Zalo OA suite (4 trang đầy đủ)
2. Content CMS với revision + lint
3. Voice library
4. Refunds lifecycle
5. Q-Day checklist editor
6. Cohorts retention
7. Member detail depth (30 messages timeline + comp gift + send voice)
8. AI live test với latency

**Cái Next.js admin mới CÓ mà admin cũ KHÔNG CÓ:**
- Chat inbox 2 chiều thật (admin cũ chỉ đọc message + reply qua SOS)

→ Strategy: Deploy admin cũ là chính. Cân nhắc giữ trang `/chat` của Next.js admin làm sidecar nếu cần 2-way inbox (hoặc port `AdminChatClient.tsx` sang admin SPA cũ).

---

## 2. Red flags phải fix TRƯỚC khi deploy

### 2.1 Backend (12 issue)

1. **Double-scheduler bug**: `src/scheduler/worker.ts` gọi `startScheduler()` ở cuối file (line 1057) VÀ `src/index.ts` gọi lại trên `server.listen` (line 134). Nếu cả hai chạy → cron chạy 2 lần → double ZNS spend + double Anthropic. **Fix:** xóa `startScheduler()` cuối worker.ts.

2. **17 file `.sql` rời ngoài `prisma/migrations/`** (create_zalo_tables.sql, seed_zalo_templates.sql, manual_migration_phase_a/b.sql, encoding fixes...). `prisma migrate deploy` KHÔNG chạy chúng. Trên VPS fresh DB → phải `psql -f` thủ công đúng thứ tự.

3. **Payments = MOCK only**. Endpoint `/payments/checkout` instant mark `PAID` không cần ai trả tiền. Cần (a) gate admin manual confirm, hoặc (b) wire MoMo/VietQR thật, hoặc (c) disable endpoint cho đến khi sẵn sàng.

4. **`ZALO_OA_ACCESS_TOKEN` long-lived nhưng không có refresh logic** trong `oaClient.ts`. Token Zalo OA hết hạn ~90 ngày → lịch nhắc ~25/8/2026 hoặc implement refresh.

5. **`AppSetting` lưu AI API key plaintext** — comment thừa nhận "encrypt-at-rest at DB level". Self-host VPS → enable disk encryption.

6. **JWT secret có fallback `'dev-secret-change-me'`** — phải set `JWT_SECRET` thật trong `.env`.

7. **Dockerfile dùng `npm install` không phải `npm ci`** — build không reproducible. Đảm bảo `package-lock.json` có trong repo.

8. **Q-Day push cron conflict** — 3 cron lúc 7:00/7:30 cùng query DB → connection pool exhaustion ở scale. OK ở pilot 10 user.

9. **OTP_DEV_MODE default `true`** → phải set `false` khi có SMS thật. Tạm thời pilot ok.

10. **`adminOriginGuard` return next() ngay nếu `NODE_ENV === 'test'`** — verify `NODE_ENV=production` set trên VPS.

11. **CORS falls open ở non-production** — verify `NODE_ENV=production`.

12. **`.bak3` files trong source tree** — clean trước khi build (`khangQuestions/routes.ts.bak3`...).

### 2.2 Dashboard (5 critical)

1. **`VITE_BASE` default `/app/`** — sẽ brick deploy ở `app.sol.vn` root. PHẢI build với `VITE_BASE=/`.

2. **`VITE_API_BASE` không set → fallback `http://localhost:4000`** — silently ship nếu `.env.production` thiếu trên VPS build step. Set `VITE_API_BASE=https://api.sol.vn`.

3. **Không có daily check-in submission UI** trong dashboard pages. `submitCheckin()` exists trong api.ts nhưng không page nào gọi. Hoặc users check-in qua widget cũ, hoặc thêm UI trước launch.

4. **Pricing dùng mock provider** — `api.checkout(tier, 'mock')`. Nối với backend payment fix.

5. **Phase B content gap** — Phase 1/2/4 (Days 1-7, 8-28, 59-88) hiển thị "Khang đang biên soạn (38 bài)". Day-1 user thấy banner "no content yet". **Fix nội dung:** dùng content cũ 30-day cho Phase 3 + viết tay 38 bài còn lại HOẶC tạm map Phase 1/2/4 sang nội dung tương đương.

### 2.3 Admin (5 issue)

1. **`/messaging` tabs 2-5 hardcode mock** — user click "Save Cohort Rules" không lưu gì. Hoặc disable tab, hoặc wire backend.

2. **`/wiki` analytics `integrationStatus === 'mock'`** — render badge "mock" nhưng vẫn ship. Hide hoặc fix.

3. **No SPA fallback config** trong repo — nginx phải rewrite tất cả path lạ về `/index.html` hoặc `/users/abc` refresh → 404.

4. **`.bak3` files trong `src/pages/`** (AdminLayout, AdminMessaging, AdminUserDetail). Xóa trước build.

5. **Không có chat inbox 2 chiều** — chỉ có SOS reply window 48h. Nếu narrative "Khang reply chat trực tiếp", phải port `AdminChatClient` từ Next.js admin sang admin SPA cũ HOẶC giữ trang `/chat` Next.js admin làm sidecar trên `chat.sol.vn`.

---

## 3. Lịch trình 10 ngày (21/5 → 31/5)

### Day 1 — 21/5 (HÔM NAY) ✅
- [x] Đọc kỹ 3 codebase (backend / dashboard / admin)
- [x] Viết DEPLOYMENT_PLAN_OLD_CODEBASE.md (file này)

### Day 2 — 22/5: Chuẩn bị infrastructure
- [ ] SSH VPS, kiểm tra Postgres đang chạy (port 5432, version 16+)
- [ ] Tạo DB `sol_prod` + user `sol_app` + grant
- [ ] Tạo subdomain DNS Cloudflare: **CHỈ `admin.sol.vn`** → 103.72.57.11 (DNS-only xám cho Certbot). `bothuocla.sol.vn` đã có sẵn.
- [ ] Clone repo lên VPS: `/var/www/sol-widget-old/{backend,dashboard,admin}/`
- [ ] Cài Node 20 LTS + PM2 (nếu chưa)

### Day 3 — 23/5: Deploy backend (Express → port 4000 internal)
- [ ] **Fix red flags trước**: double-scheduler, JWT_SECRET, clean .bak files
- [ ] Cài `backend/`: `npm ci && npx prisma generate && npm run build`
- [ ] Setup `.env` production (xem section 4 dưới — `PUBLIC_ORIGIN=https://bothuocla.sol.vn`, `APP_URL=https://bothuocla.sol.vn/app`)
- [ ] Run `npx prisma migrate deploy`
- [ ] Run 17 raw SQL files theo thứ tự (xem section 5 dưới)
- [ ] Run seed scripts: `npm run seed` + `seed:triggers` + `seed:qday`
- [ ] PM2 start: `pm2 start dist/index.js --name sol-api` (chỉ listen `127.0.0.1:4000`, không expose ngoài)
- [ ] Backend KHÔNG có subdomain riêng — nginx sẽ proxy `bothuocla.sol.vn/api/` về `127.0.0.1:4000` ở Day 4
- [ ] Smoke test internal: `curl http://127.0.0.1:4000/healthz`

### Day 4 — 24/5: Port Test FTND vào dashboard (thay OnboardingWizard)
- [ ] Tạo `dashboard/src/pages/TestFtnd.tsx` (port từ `app/app/test-ftnd/TestFtndForm.tsx`)
- [ ] Tạo `dashboard/src/lib/ftnd.ts` (port từ `app/lib/ftnd.ts` — bỏ Next.js-specific code, giữ COHORT_PLANS + scoreToCohort)
- [ ] Add route `/test-ftnd` vào `App.tsx`
- [ ] Sửa `App.tsx` bootstrap: user mới (chưa có `onboardingCompletedAt`) → redirect `/test-ftnd` thay vì hiện `OnboardingWizard` overlay
- [ ] User submit FTND → tính score → cohort → trích `cigsBaseline` từ Q4 (số điếu/ngày) → estimate `pricePerCig` (default 1000đ, user có thể chỉnh sau ở `/settings`)
- [ ] Call `POST /api/journey/onboarding { cigsBaseline, pricePerCig }` + thêm `cohort` (backend cần extend endpoint nhận thêm field `cohort`)
- [ ] Sau onboarding xong → redirect `/` (Overview) với cohort đã set
- [ ] Delete cũ `components/views/phaseB/OnboardingWizard.tsx` HOẶC giữ làm fallback nếu FTND lỗi
- [ ] Test: user mới vào lần đầu → `/test-ftnd`, lần sau vào → `/`

### Day 5 — 25/5: Refactor `/pricing` + wire VietQR backend
- [ ] Port nội dung từ `app/app/bang-gia/page.tsx` sang `dashboard/src/pages/Pricing.tsx`
  - 3 gói LIGHT/MODERATE/HEAVY (color border green/amber/red)
  - "Lời nhắn Khang" 5k tri ân
  - Alternative trả góp 35k/tuần
  - "Rút lui văn minh" 3 điều kiện
  - FAQ 5 câu (details/summary)
  - "Khoản đóng góp dùng vào đâu" 3 hạng mục
- [ ] CTA `Bắt đầu` → highlight gói matching `user.cohort` từ FTND
- [ ] Backend: tạo endpoint `POST /api/payments/vietqr` nhận `{ tier, paymentMode: 'full' | 'weekly' }` → trả về `{ qrUrl, amount, content }`
- [ ] VietQR static format: `https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NO}-compact2.png?amount={amount}&addInfo={SOL+userId}`
- [ ] Render QR + STK + nội dung CK trong UI, copy-to-clipboard button
- [ ] Admin panel `/payments` đã có sẵn (verify) → Khang click "Mark PAID" → backend update PaymentLog status + extend user tier expiry

### Day 6-7 — 26-27/5: UI/UX refactor dashboard (em tự quyết)
**Mục tiêu:** Layout sạch hơn cho user 45+, mobile-first cohort-aware.

- [ ] **Layout**: sidebar 5 mục desktop (Tổng quan / Hành trình / Sổ tay / Trò chuyện / Cài đặt) + bottom-nav 4 tab mobile (drop Workbook khỏi mobile bottom)
- [ ] **Top bar**: streak counter + tier badge cohort color + AI quota progress bar
- [ ] **Typography**: Be Vietnam Pro 18px / line-height 1.6, headings tăng 2px (vốn 17px cho 45+)
- [ ] **Cohort color coding**: LIGHT `#10B981` xanh / MODERATE `#F59E0B` vàng / HEAVY `#EF4444` đỏ — apply vào tier badge, journey progress bar, ChipCard border
- [ ] **Empty states**: hand-drawn SVG icon thay emoji (Khang aesthetic)
- [ ] **Loading**: skeleton component thay spinner (4 variant: text/card/list/avatar)
- [ ] **Notifications**: build Toast component thay `alert()` — fix 7 file: Overview.tsx:238, PhaseAmbassador.tsx, PhaseRebuild.tsx, SosCard.tsx, ShareModal.tsx, QDayChecklist.tsx, WorkbookHero.tsx
- [ ] **Brand**: sidebar text "bothuocla.sol.vn" → "Đi Cùng Sol" (Layout.tsx:123)
- [ ] **Font**: switch `index.html <link>` preconnect Inter → Be Vietnam Pro (match Tailwind config)
- [ ] **Mobile bottom-nav**: thêm safe-area-inset-bottom đã có, kiểm tra iPhone notch + Android gesture bar
- [ ] **Landing route `/`**: nếu user chưa login (no anon yet) → hiển thị hero "Đi Cùng Sol — bỏ thuốc lá" + CTA "Thử Test FTND miễn phí" → `/test-ftnd`. Nếu đã login → Overview as usual.

### Day 7 — 27/5: Deploy dashboard SPA tại `bothuocla.sol.vn` root
- [ ] **Stop Next.js**: `pm2 delete sol-widget` (Next.js cũ ở port 3000)
- [ ] Tạo `dashboard/.env.production`: `VITE_API_BASE=/api` (relative same-origin), `VITE_BASE=/` (root, KHÔNG `/app/` như trước)
- [ ] Build: `cd dashboard && VITE_BASE=/ VITE_API_BASE=/api npm run build`
- [ ] Copy `dist/` → `/var/www/bothuocla-sol-vn/`
- [ ] Refactor nginx `bothuocla.sol.vn`: 2 location block (xem section 6.1 v3):
  - `location /api/` → proxy 127.0.0.1:4000
  - `location /` → serve static SPA + SPA fallback try_files
- [ ] Test 3 đường:
  - `curl -I https://bothuocla.sol.vn/` → dashboard index
  - `curl -I https://bothuocla.sol.vn/journey` → 200 (SPA fallback)
  - `curl https://bothuocla.sol.vn/api/healthz` → backend OK

### Day 8 — 28/5: Deploy admin `admin.sol.vn`
- [ ] Xóa `.bak3` files trong `admin/src/pages/`
- [ ] Hide hoặc disable mock tabs trong `AdminMessaging.tsx`
- [ ] Hide mock badge trong `AdminWiki.tsx`
- [ ] Build admin: `VITE_API_BASE=https://bothuocla.sol.vn/api npm run build`
- [ ] Copy `dist/` → `/var/www/admin-sol-vn/`
- [ ] Nginx config `admin.sol.vn` (static + SPA fallback)
- [ ] IP allowlist Khang (uncomment trong nginx config)
- [ ] Certbot SSL cho `admin.sol.vn`
- [ ] **Backend `.env`**: thêm `admin.sol.vn` vào `CORS_ORIGINS`
- [ ] Login email magic link → grant isAdmin `nguyendinhkhang@gmail.com`
- [ ] Test 18 pages, mark functional vs broken

### Day 9 — 29/5: E2E test + soft launch 10 beta
- [ ] Test 6 critical flows:
  - Anon signup → FTND 6 câu → cohort assigned → Overview
  - Q-Day pick + checklist gate
  - Daily check-in (verify có UI submit)
  - CHIP + AI fallback chat (verify AI key trong AppSetting)
  - `/pricing` flow → VietQR generate → admin confirm payment
  - Refund flow
- [ ] Test admin flows: Login + isAdmin, SOS reply Zalo OA, edit CHIP, test AI provider, refund queue, mark payment PAID
- [ ] Test Zalo OA webhook: `https://bothuocla.sol.vn/api/zalo/webhook`
- [ ] Test 26 cron job chạy đúng giờ (tail log 24h)
- [ ] Mời 10 beta qua Zalo (Khang + 9 người quen) — danh sách từ Khang
- [ ] Thu feedback, fix critical bugs
- [ ] Backup DB pre-launch (`pg_dump > backup_pre_launch_2026-05-29.sql`)

### Day 10 — 30/5: Final dry-run + content
- [ ] Full E2E retest sau bug fix
- [ ] Viết hoặc seed Phase 1/2/4 content (38 bài còn thiếu) — hoặc tạm map từ Phase 3 nếu Khang chưa viết kịp
- [ ] Verify VAPID key cho web push
- [ ] Verify Sentry DSN (optional)
- [ ] Document credential mới vào `docs/01-CREDENTIALS.md`
- [ ] Update `docs/02-CHEATSHEET.md` với restart commands (pm2 sol-api, nginx reload, certbot renew)

### D-Day — 31/5: World No Tobacco Day launch
- [ ] Sáng 7:00: Push promo qua Zalo OA + Group
- [ ] FB Group warmup (campaign Sprint 31-5 tasks #49-53)
- [ ] Monitor `pm2 logs sol-api` + admin `/` morning dashboard
- [ ] Soft monitor 24h, hot bugfix
- [ ] Update SETUP_LOG ngày 31/5 ghi nhận user count + cohort distribution

---

## 4. Env vars template (backend `.env`)

```bash
# === Critical ===
NODE_ENV=production
PORT=4000                # Internal only — nginx proxies /api/ to here
HOST=127.0.0.1           # KHÔNG expose 0.0.0.0
DATABASE_URL="postgresql://sol_app:STRONG_PASS@127.0.0.1:5432/sol_prod?schema=public&connection_limit=20"
JWT_SECRET="<random 64 hex chars — openssl rand -hex 32>"
CORS_ORIGINS="https://bothuocla.sol.vn,https://admin.sol.vn,https://sol.vn"   # same-origin /app/ tự OK
PUBLIC_ORIGIN="https://bothuocla.sol.vn"                                       # backend URL public
APP_URL="https://bothuocla.sol.vn/app"
ADMIN_DASHBOARD_URL="https://admin.sol.vn"

# === AI (Gemini Free hiện tại) ===
ANTHROPIC_API_KEY="sk-ant-..."   # fallback, primary stored in AppSetting
GEMINI_API_KEY="..."              # tạo từ ClaudeGemini project Free tier
CLAUDE_MODEL_PRIMARY="claude-3-5-haiku-20241022"
CLAUDE_MODEL_ESCALATED="claude-3-5-sonnet-20241022"
AI_DAILY_QUOTA_MSGS=50
AI_MAX_OUTPUT_TOKENS=800
ENABLE_AI=true

# === Zalo OA ===
ZALO_APP_ID="3779171417159107862"
ZALO_APP_SECRET="<from Zalo console>"
ZALO_REDIRECT_URI="https://bothuocla.sol.vn/api/auth/zalo/callback"
ZALO_FRONTEND_URL="https://bothuocla.sol.vn/app"
ZALO_OA_ID="3049397094672064963"
ZALO_OA_ACCESS_TOKEN="<from Zalo OA dashboard — exp 90d>"

# === Web Push ===
VAPID_PUBLIC_KEY="<npx web-push generate-vapid-keys>"
VAPID_PRIVATE_KEY="<from above>"
VAPID_SUBJECT="mailto:nguyendinhkhang@gmail.com"

# === Email (Zoho) ===
SMTP_HOST="smtp.zoho.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="khang@sol.vn"
SMTP_PASSWORD="<Zoho app password>"
EMAIL_FROM="Đi Cùng Sol <khang@sol.vn>"
EMAIL_REPLY_TO="khang@sol.vn"

# === Operational ===
ENABLE_SCHEDULER=true   # CHỈ chạy 1 instance!
OTP_DEV_MODE=false      # khi có SMS thật, hiện tại có thể true để Khang nhìn OTP trong log
OTP_TTL_MINUTES=10
LOG_LEVEL=info
SENTRY_DSN=""           # optional

# === Khang alert channel ===
KHANG_ZALO_USER_ID=""   # follow OA xong lấy
KHANG_ALERT_EMAIL="nguyendinhkhang@gmail.com"
VIETTEL_SMS_API_KEY=""  # optional
PUBLIC_AUDIO_BASE="https://api.sol.vn/audio"
```

---

## 5. Raw SQL files cần chạy thủ công sau `prisma migrate deploy`

Trong `backend/prisma/` ngoài `migrations/` có 17 file SQL. Chạy theo thứ tự (kiểm tra lại danh sách thực tế bằng `ls backend/prisma/*.sql`):

```bash
cd /var/www/sol-widget-old/backend
export PGPASSWORD="STRONG_PASS"

# Thứ tự đề xuất (verify với mtime):
psql -U sol_app -d sol_prod -f prisma/create_zalo_tables.sql
psql -U sol_app -d sol_prod -f prisma/seed_zalo_templates.sql
psql -U sol_app -d sol_prod -f prisma/manual_migration_phase_a.sql
psql -U sol_app -d sol_prod -f prisma/manual_migration_phase_b.sql
# ... các file encoding fix + seed khác
```

**Kiểm tra:** `psql -U sol_app -d sol_prod -c "\dt"` → phải có ~53 bảng.

---

## 6. Nginx configs cần viết

### 6.1 `bothuocla.sol.vn` — dashboard SPA + backend (v3 đơn giản hóa, BỎ Next.js)
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bothuocla.sol.vn;

    ssl_certificate /etc/letsencrypt/live/bothuocla.sol.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bothuocla.sol.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    root /var/www/bothuocla-sol-vn;
    index index.html;

    # === 1. BACKEND API (priority cao nhất nhờ exact + longer prefix) ===
    location = /api/zalo/webhook {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /api/socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # === 2. DASHBOARD SPA tại root / ===
    # Cache aggressive cho Vite hashed assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — mọi route không match file thật → index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options "SAMEORIGIN" always;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/javascript application/xml;

    access_log /var/log/nginx/bothuocla-access.log;
    error_log /var/log/nginx/bothuocla-error.log warn;
}

server {
    listen 80;
    server_name bothuocla.sol.vn;
    return 301 https://$host$request_uri;
}
```

**Đơn giản hơn nhiều so với v2** — chỉ 2 nhóm location (`/api/*` proxy backend, `/` static SPA fallback). Không cần proxy Next.js. Không phải lo `/_next/static/` cache. Không chia subdir `/app/`.

### 6.2 `admin.sol.vn` (admin static SPA — subdomain duy nhất)
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.sol.vn;
    root /var/www/admin-sol-vn;
    index index.html;

    # SSL — Certbot generate
    ssl_certificate /etc/letsencrypt/live/admin.sol.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.sol.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    # IP allowlist — bật khi có IP cố định Khang
    # allow 222.254.21.0/24;
    # allow 103.x.x.x;
    # deny all;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    access_log /var/log/nginx/admin-sol-vn-access.log;
    error_log /var/log/nginx/admin-sol-vn-error.log warn;
}
server { listen 80; server_name admin.sol.vn; return 301 https://$host$request_uri; }
```

---

## 7. Smoke test sau deploy mỗi phần

### Backend (qua nginx proxy)
```bash
curl https://bothuocla.sol.vn/api/healthz                    # { ok: true, now: ... }
curl https://bothuocla.sol.vn/api/auth/anonymous \           # tạo anon user
  -H "Content-Type: application/json" \
  -d '{"deviceUid":"test-uid","originDomain":"bothuocla.sol.vn"}'
pm2 logs sol-api --lines 50                                  # check không có error
pm2 logs sol-api | grep "cron"                               # verify 26 cron loaded
psql -U sol_app -d sol_prod -c "SELECT COUNT(*) FROM \"User\""   # đếm user
```

### Dashboard (mount /app/)
- Mở `https://bothuocla.sol.vn/app/` → thấy Overview, không có 404 asset
- Devtools Network: gọi `/api/...` (relative, same-origin) trả 200, không `localhost:4000`
- Bottom-nav 4 tab mobile hiển thị
- Bind email/phone từ Settings hoạt động
- Refresh `https://bothuocla.sol.vn/app/settings` (deep link) → SPA fallback hoạt động, không 404

### Landing Next.js
- `https://bothuocla.sol.vn/` → landing
- `https://bothuocla.sol.vn/test-ftnd` → FTND form
- Sau khi hoàn thành FTND → CTA "Bắt đầu hành trình" → redirect `/app/?score=X&cohort=Y` → dashboard tạo anon user
- `https://bothuocla.sol.vn/bang-gia` → redirect hoặc embed pricing

### Admin
- Mở `https://admin.sol.vn/` → redirect `/login`
- Email magic link đến hộp thư → click → vào dashboard
- 18 trang load không lỗi console
- Network: gọi `https://bothuocla.sol.vn/api/admin/...` cross-origin với CORS preflight OK
- `/ai` → "Test connection" returns latency

### Zalo OA
- Vào Zalo console → set webhook URL `https://bothuocla.sol.vn/api/zalo/webhook` → "Test webhook"
- OAuth callback URL: `https://bothuocla.sol.vn/api/auth/zalo/callback`
- Reply tin nhắn test trên OA → admin `/zalo-sos` thấy alert

---

## 8. Rollback plan

Nếu deploy thất bại trước 31/5:

- **Plan B1:** Giữ Next.js `bothuocla.sol.vn` đang chạy + chỉ launch landing + Test FTND + email signup form. Push manual hỗ trợ qua Zalo 1-1. Defer dashboard + admin sang tuần sau.
- **Plan B2:** Nếu backend Express crash, fallback Next.js admin mới (6 trang) + Next.js chat client em đã build. Mất Zalo OA + content CMS + voice + refund tự động.
- **Backup DB:** `pg_dump > /backups/pre_launch_$(date +%F).sql` mỗi sáng từ Day 7 → Day 10.

---

## 9. Post-launch (sau 31/5)

- **Tuần 1 (1-7/6):** Monitor production + fix bug pilot. Wire MoMo/VietQR thật. Seed content Phase 1/2/4 còn thiếu.
- **Tuần 2 (8-14/6):** Port `AdminChatClient` từ Next.js admin sang admin SPA cũ để có chat inbox 2 chiều. Build PWA manifest cho `app.sol.vn`.
- **Tháng sau:** Refresh logic cho Zalo OA token. Sentry production. Backup tự động hàng đêm.

---

## 10. Open questions cho Khang

1. ✅ **Payment provider** — VietQR static (đã chốt từ business model)
2. **Phase 1/2/4 content (38 bài):** Khang viết tay hay tạm map từ Phase 3?
3. **Beta 10 user:** danh sách ai? (Khang gửi list số điện thoại Zalo)
4. **Zalo OA token:** đã renew chưa? Còn bao nhiêu ngày hết hạn?
5. ✅ **AI key** — Gemini Free tier `gemini-2.5-flash` (đã LIVE trên Next.js, port sang backend cũ)
6. **IP allowlist admin:** chỉ Khang truy cập hay có thêm cộng tác viên?
7. **VietQR bank info:** số tài khoản + bank BIN code + tên chính chủ Khang Sol để format VietQR URL

---

**File location:** `C:\BOTHUOCLA\sol-widget\docs\DEPLOYMENT_PLAN_OLD_CODEBASE.md`

**Plan version history:**
- v1 (21/5 sáng): 4 subdomain (bothuocla + app + admin + api)
- v2 (21/5 chiều): 2 subdomain (gom bothuocla, tách admin) — multi-location nginx
- **v3 (21/5 tối — CHỐT)**: BỎ Next.js hoàn toàn, dashboard SPA cũ làm landing + entry + journey. Chỉ port FTND + business model sang. Widget `frontend/` giữ độc lập cho partners.

**Next action:** Day 2 (22/5) — Chuẩn bị infrastructure VPS. Tasks #88-95 đã ready.
