# SOL — Bỏ thuốc lá 30 ngày · Claude Session Context

> **File này là "memory snapshot"** cho Claude session mới (sang máy khác,
> hoặc resume sau gap dài). Share file này với Claude → Claude đọc xong sẽ
> pickup được toàn bộ context dự án và tiếp tục code.

---

## 1. Founder + Tone

- **Founder**: KHANG SOL (`nguyendinhkhang@gmail.com`) — gọi là "Khang" hoặc "anh Khang"
- **Tone**: founder-to-founder, tiếng Việt, không formal. Comment code và UI string đều bằng tiếng Việt (giải thích "tại sao" theo phong cách Khang).
- **Nguyên tắc làm việc**:
  - Trước khi code: clarify scope với Khang (qua AskUserQuestion hoặc trực tiếp)
  - Verify TypeScript clean sau mỗi major change
  - TaskCreate/TaskUpdate cho mọi task >2 step
  - Không tự ý add feature ngoài scope; nếu thấy vấn đề khác → flag cho Khang quyết
  - Founder-to-founder explain trade-offs, không lecture

---

## 2. Sản phẩm

**SOL** = ứng dụng cai thuốc lá 30 ngày cho người Việt **45+** (mục tiêu chính).
Cốt lõi: "Có Khang đi cùng" — Khang là founder + face của brand.

**Domains**:
- `sol.vn` = marketing landing + wiki SEO (WordPress)
- `bothuocla.sol.vn` = app entry (React widget + dashboard)
- Widget có thể embed vào partner site qua `<script src="...sol-widget.js">`

**Tier system**:
- **FREE**: anonymous, 5 tin AI/ngày (boost 15 tuần đầu sau Q-Day)
- **KHOI_DONG** (99k, 10 ngày): chat unlimited + voice D1/D3/D7 + báo cáo Day-10
- **DONG_HANH** (199k, 30 ngày + 30 maintenance): full + refund pro-rated từ Day 15
- **ALUMNI**: post 30+ ngày, identity "Đại sứ Sol"

---

## 3. Tech Stack

| Layer | Stack |
|---|---|
| Backend | Node 20 + Express + Socket.IO + Prisma + PostgreSQL 16 (`sol` db) |
| Frontend widget | Vite + React 18 + Zustand + Tailwind (Be Vietnam Pro 17px base) |
| Dashboard | Vite + React 18 + React Router + Zustand + Tailwind (cùng design tokens) |
| AI | Anthropic Claude (haiku/sonnet primary), multi-provider abstraction qua `/admin/ai` |
| Hosting (current) | Firebase Hosting `claude-4b270.web.app` cho `bothuocla.sol.vn` (CNAME) |
| DNS | Nhà Hoà — sol.vn root, không thêm record được dễ → verify domain dùng meta tag |

**Repo structure** (`D:\BOTHUOCLA\sol-widget\`):
```
backend/         Express API + Prisma schema + migrations
frontend/        Widget React (entry: SolWidget.tsx + embed.ts)
dashboard/       Dashboard React (full pages, sidebar nav)
wiki-skeletons/  41 wiki article skeletons (Khang biên tập + publish lên sol.vn)
                 + 15 voice scripts + 5 video scripts Phase 1
                 + WordPress upload script (lib/wp-client.ts)
```

---

## 4. Auth Architecture — 3 layer (đã code + tested)

### Layer 1: Anonymous-first (default)
- User mở widget → FE generate UUID v4 → save `localStorage.sol_device_uid`
- POST `/auth/anonymous` { deviceUid, originDomain } → backend `upsert` (atomic, race-safe) tạo User ẩn danh
- Cấp JWT → user vào dùng được ngay, không cần PII
- 95% case dùng path này

### Layer 2: Identity bind (optional)
- **2a — Zalo OAuth**: nút "💬 Liên kết Zalo (khuyến nghị)" trong Settings
  - GET `/auth/zalo/init` → redirect Zalo authorize URL
  - User accept → callback `/auth/zalo/callback?code=...&state=...` (kèm PKCE)
  - Backend exchange code → fetch Zalo user info → MERGE anon vào existing user (nếu trùng zaloUserId)
  - Đợi `ZALO_APP_SECRET` để wire (App ID `3779171417159107862` đã có)
- **2b — Phone OTP fallback**: nút "📱 Liên kết SĐT (nếu không có Zalo)"
  - POST `/auth/bind-phone/request` → DEV mode log OTP console; PROD cần Stringee/eSMS
  - POST `/auth/bind-phone/verify` → MERGE logic giống Zalo
  - Hiện Khang đang dev mode `OTP_DEV_MODE=true`

### Layer 3: Recovery code (offline rescue)
- Format `SOL-XXXX-XXXX-XXXX` (12 ký tự, pool 29 chars bỏ 0/O/1/I/L)
- Bcrypt hash, plaintext **chỉ trả về 1 lần** sau khi user bind lần đầu
- POST `/auth/recover` { code } → `findUserByRecoveryCode` → match → invalidate cũ + sinh mã mới
- Nút "🔑 Tôi đã có mã khôi phục" trong Settings → mở RecoverView modal
- Tested 4 scenarios: sinh / recover / mã đã dùng không reuse được / 2 user tách biệt

**Files chính**:
- Backend: `auth/routes.ts`, `auth/zaloClient.ts`, `auth/oauthState.ts`, `auth/userMerge.ts`, `auth/recoveryCode.ts`
- FE shared: `lib/deviceUid.ts` (cả widget + dashboard cùng key `sol_device_uid`)
- Frontend widget: `SolWidget.tsx` (bootstrap 3-path), `BindPhoneModal.tsx`, `RecoveryCodeModal.tsx`, `RecoverView.tsx`
- Dashboard: tương tự widget + `App.tsx` Zalo callback parse

---

## 5. Embed Widget — Dashboard ↔ Partner Site

Cùng cơ chế:
- Widget build IIFE → 1 file `sol-widget.js` (343 kB, gzip 101 kB) với inline CSS
- Build script: `cd frontend && npm run build:embed:dashboard` → output `dist/sol-widget.js` + auto copy sang `dashboard/public/sol-widget.js`
- Dashboard `Layout.tsx` render `<EmbeddedWidget />` → inject script tag → widget tự render bubble vào body
- JWT + deviceUid chia sẻ qua localStorage → user authed seamless giữa dashboard và widget

**Vite config quan trọng**:
- `define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' }` — tránh ReferenceError trong IIFE bundle
- Custom `inlineCssPlugin()` ở `vite.config.ts` để bundle CSS vào JS (không cần ship `style.css` riêng)

**CSS positioning**:
- `.sol-widget-root` fixed bottom-right, z-index 2147483000
- Mobile (<640px): bottom 80px (tránh đè bottom nav host); expanded full-screen
- Icon mới: cấm thuốc lá (no smoking SVG) — không phải mặt trăng/lá cây nữa

---

## 6. UX Refactors đã làm (11 fixes)

### CRITICAL (must fix trước launch paid)
1. Onboarding 7 bước → 2-3 (`AuthGate.tsx`) — bỏ pronoun custom + assistantName lúc onboard, push vào Settings
2. Q-Day checklist 8 mục bắt buộc → 3 (medical_disclaimer + inform_family + paid_starter); 5 mục optional
3. CheckinFlow 4 màn hình → 1 (smoked toggle + craving slider + mood emoji + note trên 1 screen)
4. Widget nav 5 tab → 3 (Trang chính / Trò chuyện / Lịch 30 ngày — đổi từ "Hành trình" để khỏi trùng dashboard)

### HIGH
5. Free quota 5 → 15 tin/ngày trong tuần đầu sau Q-Day (`quotaForUser` helper)
6. Giảm paywall touchpoints (10 → 4): bỏ sidebar "Mở khoá ✨", bỏ auto-redirect 800ms, link "Mở khoá" chỉ hiện khi còn ≤2 tin
7. Workbook 30 ngày modular: tabs Chuẩn bị / T1 / T2 / T3 / T4 / 30+ với auto-detect tab hiện tại từ quitDate; print mode `?print=1` render full sách

### MEDIUM
8. Bỏ phase language toggle (Clinical/Dramatic) — push vào `<details>` "Tuỳ chọn nâng cao"
9. Identity 7 → 4 stages (Người mới bắt đầu → Người vượt cám dỗ → Người không hút → Đại sứ Sol)
10. Settings → accordion 4-5 group (`<details>` collapsible, default open Tài khoản + Xưng hô)
11. Bỏ ProfileSetupWizard popup, edit inline trong Settings

### Bonus
- Auto-name "Soler XXXX" cho user không nhập tên + hiện phone rõ trong Settings
- Anon dashboard preview với DEMO ribbon "🎬 BẢN DEMO" + slider mô phỏng (cho user chưa đặt Q-Day vẫn thấy đồng hồ + milestones với fake data)

---

## 7. Content đã chuẩn bị

| Loại | Số lượng | Path | Status |
|---|---|---|---|
| Wiki articles (skeleton) | 41 | `wiki-skeletons/` | ⏳ Khang biên tập + publish lên sol.vn WordPress |
| Voice scripts | 15 | `wiki-skeletons/voice-scripts/` | ⏳ Khang record |
| Video scripts Phase 1 | 5 | `wiki-skeletons/video-scripts/` | ⏳ Khang record |
| Canned chips + intent matcher | 30 | DB + `frontend/src/lib/intentMatcher.ts` | ✅ Wired |
| WP bulk upload script | — | `wiki-skeletons/upload-script/` | ✅ Ready (cần WP App Password) |

---

## 8. Tech Decisions quan trọng

- **Anonymous-first** ưu tiên acquisition (5% drop khi bắt SĐT từ đầu, có thể 30%+ với 45+)
- **Zalo OAuth > SMS provider** vì: 95% user 45+ Việt có Zalo, brand trust 10/10, free, có channel re-engage qua OA broadcast
- **Recovery code 16-ký-tự** thay vì email magic link vì user 45+ Việt ít kiểm email
- **Domain verify Zalo bằng meta tag** (cách 3) thay vì DNS TXT — vì `bothuocla.sol.vn` đang là CNAME (DNS standard không cho TXT cùng host)
- **Widget icon**: cấm thuốc lá SVG, không emoji (không control visual cross-OS)
- **Free quota tuần đầu boost 15 tin/ngày**: tăng conversion bằng cách cho user trải nghiệm AI đủ lâu trước khi thấy paywall

---

## 9. Pending — Khang execute (manual)

| Việc | Effort | Priority |
|---|---|---|
| Verify Zalo OA (đã có verified pending) + paste `ZALO_APP_SECRET` vào `.env` | 30p | 🔥 HIGH |
| Publish 41 wiki articles lên sol.vn WordPress | 5-10h | 🔥 HIGH |
| Record 15 voice messages | 1-2 buổi studio | 🔥 HIGH |
| Record 5 videos Phase 1 | 1 buổi quay | 🟡 MED |
| Marketing landing sol.vn (homepage) — nếu Khang muốn em build | 4-6h em | 🟡 MED |
| Đăng ký SMS provider Stringee (chưa cần với anon-first) | 1-2h | 🟢 LOW |
| Welcome message Zalo OA | 15p | 🟢 LOW |

---

## 10. Pending — em (Claude) có thể làm tiếp

- `AUTH_FLOW.md` doc cho support reference
- Cron cleanup anon user inactive >90 ngày
- Marketing landing sol.vn template
- Stringee SMS integration
- Health check Zalo (auto-hide nút khi Zalo down)
- Email magic link backup (Layer 4)

---

## 11. Khang's Setup Local

```
D:\BOTHUOCLA\sol-widget\
├── backend\        npm run dev  (port 4000)
├── frontend\       npm run dev  (port 5173)
└── dashboard\      npm run dev  (port 5174)

PostgreSQL: localhost:5432, db "sol", user postgres
Prisma: 9 migrations applied (latest: 20260429210000_recovery_code)
```

**Restart workflow**:
```bash
# Khi sửa schema
npx prisma migrate deploy && npx prisma generate
npm run dev   # restart backend

# Khi sửa widget cho dashboard
cd frontend && npm run build:embed:dashboard
# Reload dashboard browser Ctrl+Shift+R
```

---

## 12. Zalo OA + App Info

- **OA**: "Hỗ trợ & Đồng hành – Sol Official – VINET" (`zalo.me/3547084958635197535`)
- **Zalo App ID**: `3779171417159107862` (https://developers.zalo.me/app/3779171417159107862)
- **Zalo App Secret**: ⏳ Khang paste vào `backend/.env` khi ready
- **Domain verification**: meta tag trong `frontend/index.html` (đã có sẵn token `UFEYTeJR5sb4tvvBfTSgOo_3_6R3jIayDJCt`)
- **Callback URLs cần config**:
  - Dev: `http://localhost:4000/api/auth/zalo/callback`
  - Prod: `https://bothuocla.sol.vn/api/auth/zalo/callback`

---

## 13. Cách Claude session mới resume

Khi Khang share file này với Claude session mới:

1. Claude đọc full file → biết context
2. Khang nói: *"Đọc CLAUDE_CONTEXT.md trong repo, em là Claude tiếp nối session cũ. Tiếp tục làm [việc gì]"*
3. Claude pickup ngay với đầy đủ memory về architecture, decisions, pending items
4. Nếu cần chi tiết hơn, Claude đọc thêm `AUTH_FLOW.md` (nếu đã viết), code files, hoặc git log

**Em (Claude session cũ) sẽ tiếp tục viết file này khi có thay đổi lớn** — hiện tại snapshot là **end of day 2026-05-01**, đã hoàn thành 67 tasks tracked + auth 3-layer + embed widget + 11 UX fixes.

---

*Backup này được tạo end of session 2026-05-01. Update file này khi:*
- *Có architecture decision mới*
- *Pending list thay đổi*
- *Trước khi backup/migrate machine*

---

## SESSION 2026-05-02 (delta)

Tiếp tục từ session trước. Các thay đổi quan trọng:

### Code fixes
- **Bottom nav dashboard**: chuyển từ `lg:hidden` (1024px) sang JS-based `useIsMobile(768)` — nav KHÔNG render trong DOM khi desktop, không thể đè content. `pb-24` mobile, `pb-0` desktop.
- **Sidebar dashboard**: `hidden md:flex md:w-56 lg:w-64` — hiện từ tablet (≥768px) thay vì chỉ desktop ≥1024px.
- **Settings save bug**: input `type="date"` xuất `YYYY-MM-DD` → backend Zod yêu cầu ISO datetime → fix convert `new Date(quitDate).toISOString()` trước khi gửi.
- **userMerge.ts UNIQUE constraint bug**: khi bind phone, anon user và existing user cùng có deviceUid → P2002 conflict. Fix: DELETE anon TRƯỚC khi update existing.deviceUid.
- **CORS_ORIGINS**: thêm `http://localhost:5174` cho dashboard dev.
- **Embed widget vào dashboard**: `EmbeddedWidget` component inject `<script src="/sol-widget.js">` vào Layout. Vite build mode `embed` với plugin inline CSS + define `process.env.NODE_ENV`. Output single `sol-widget.js` (343kB gzip 101kB).
- **Build script**: `npm run build:embed:dashboard` build + auto copy sang `dashboard/public/`.

### UX fixes
- **Widget bubble icon**: đổi từ "moon shape" sang "no smoking" SVG — vòng tròn trắng + viền đỏ + cigarette đen + slash đỏ + 2 sợi khói xám phía phải (đầu cháy).
- **Widget tab tên**: đổi "Lịch 30 ngày" → "Hành trình" (cùng tên dashboard, không trùng nhưng dùng context phân biệt: widget = quick view, dashboard = full).
- **Click ngày trong Hành trình**: modal slide-up có CTA "✅ Check-in 30 giây" nếu là ngày hôm nay + chưa check-in. 1-click vào CheckinFlow.
- **4 entry points Check-in trong widget** (sau khi user kêu không tìm thấy):
  1. Button "✓ Check-in" pill trắng-trên-xanh ở header (luôn hiện mọi tab)
  2. Banner cam to ở đầu Trang chính (chỉ khi chưa check-in hôm nay)
  3. Tile "✅ Check-in 30s" trong action grid Trang chính
  4. CTA trong modal Hành trình > ngày hôm nay
- **Dashboard Check-in entry**: nút cam "✅ Check-in hôm nay" ngay đầu sidebar nav. Click → `window.SOLWidget.openView('checkin')` mở widget panel thẳng vào CheckinFlow.

### React Router
- Add `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` để dọn 2 console warnings.

### Pre-Q-Day demo dashboard (kept)
- Khi user chưa đặt Q-Day, Overview render `RealtimeDashboard` với fake `quitDate = 7 ngày trước` + DEMO ribbon. CTA "Bắt đầu chuẩn bị Q-Day" cuối page.

### Pending từ session này
- Khang chưa setup Zalo OAuth (cần verify domain bothuocla.sol.vn — em đã tạm bỏ qua, dùng sol.vn root).
- Marketing landing sol.vn — chưa build (Khang quyết định sau).
- Test thực user 45+ Việt — cần làm sau khi launch beta.

### Lưu ý quan trọng
- Khang đã push toàn bộ code lên GitHub: `https://github.com/nguyendinhkhangSOL/sol-widget`
- Có scripts `backup.bat` (Windows) + `restore.bat` để backup DB + .env định kỳ.
- Khi rebuild widget, dùng `npm run build:embed:dashboard` (không phải `build:embed` thường) để auto copy sang dashboard.

### 🐛 Bug đang investigate (mai làm tiếp)

**Triệu chứng**: Dashboard và widget hiển thị state khác nhau cùng lúc:
- Dashboard `/journey`: ngày 1, 2 cam (đã check-in có hút), ngày 3 xanh (đã check-in sạch). Click ngày 3 → "Check-in ngày 3" có data đầy đủ.
- Widget panel "Hành trình" (cùng browser, cùng tab): grid hiển thị 1, 2, 3 đỏ-cam (looks like missed, có line-through). Stats "Check-in 0/4 · Ngày sạch 0/1" — như chưa check-in lần nào.

**Có thể nguyên nhân**:
1. Widget và dashboard 2 React app riêng → mỗi cái có Zustand store riêng cho user/checkins. Cùng JWT (localStorage) nhưng KHÔNG share user object.
2. Widget mount lúc đầu (anon user) → fetch checkins về (rỗng). Sau đó dashboard login phone → token đổi → widget không re-fetch.
3. Hoặc backend `/checkins` trả ít data hơn `/checkins/today` — em đã merge cả 2 nhưng có thể chưa đủ.

**Đã làm hôm nay**:
- ✅ JourneyView re-fetch khi `user.lastCheckinDate` đổi (useEffect deps)
- ✅ JourneyView fetch cả `/checkins` history + `/checkins/today` để merge
- ✅ CheckinFlow sau submit → refresh user (api.getMe + setUser) → trigger JourneyView re-fetch

**Cần làm mai** (nếu vẫn bug):
1. Debug Console: `localStorage.getItem('sol_token')` ở widget vs dashboard — cùng token?
2. Network tab: widget request `/checkins` vs dashboard request `/checkins` — cùng response?
3. Có thể cần wire window storage event listener để widget detect token change từ dashboard
4. Hoặc force widget reload khi user login phone từ dashboard (page reload)
5. Long-term: dùng pub-sub event (custom events trên window) để dashboard ↔ widget share state changes

