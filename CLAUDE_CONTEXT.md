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


---

## SESSION 2026-05-03 (delta)

Tiếp từ session 2026-05-02. Hôm nay: Docker production-ready + Phase 1 chat UX
upgrade.

### 🐳 Docker stack — chạy được full local

Lần đầu containerize đầy đủ 4 service. Setup local Postgres → Docker volume.
DB tối qua (volume `sol_pgdata`) **vẫn còn 9 migrations + data**.

**Fix bugs khi build trong Docker**:

1. **TS errors backend (11 chỗ)**: `req.params.id` báo `string | string[]`.
   Root cause: `package.json` mismatch — `express: ^4.21.1` nhưng `@types/express: ^5.0.0`.
   Fix: downgrade `npm i -D @types/express@^4.17.21` match Express 4.

2. **Prisma engine error trong Alpine**: `Could not parse schema engine response: SyntaxError: Unexpected token 'E', "Error load"...`.
   Root cause #1: Backend không có `.dockerignore` → Dockerfile `COPY . .` đè node_modules
   Windows từ host vào container Alpine → Prisma binary mismatch.
   Root cause #2: `node:20-alpine` không có sẵn libssl → Prisma engine fail load.
   Fix:
   - **NEW** `backend/.dockerignore` exclude `node_modules`, `dist`, `.env`, `.git`
   - **PATCH** `backend/Dockerfile` thêm `RUN apk add --no-cache openssl libc6-compat`
     trong CẢ 2 stage (builder + runtime)
   - **PATCH** `backend/prisma/schema.prisma` thêm
     `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` để generate cho cả
     Windows (host dev) lẫn Alpine (container)

**Lệnh chạy chuẩn** sau fix:
```powershell
cd D:\BOTHUOCLA\sol-widget
docker compose up -d --build       # lần đầu
docker compose logs --tail=40 backend
```
Verify thấy `9 migrations found / No pending migrations` + `SOL backend listening port 4000`.

### 🎯 Phase 1 — Smart Suggested Chips trong dashboard chat

**Bối cảnh**: `dashboard/src/pages/Chat.tsx` (commit b7a307e tối hôm trước)
chỉ có composer + send tới `/messages`. Comment dòng 8 nói "Quick chips dùng
intent matcher" nhưng CHƯA implement. Mục tiêu: **giảm AI quota cost +
tăng accuracy + tạo marketing loop sang sol.vn wiki**.

**Files mới/đổi (dashboard)**:

| File | Status | Mục đích |
|---|---|---|
| `lib/bodyClock.ts` | NEW (copy từ frontend) | `daysSober`, `hoursSober` cho ranking |
| `lib/intentMatcher.ts` | NEW (copy từ frontend) | Match user text → chip (normalize VN, score, negation) |
| `lib/quickReplies.ts` | NEW (copy từ frontend) | Load chip từ API + cache localStorage 24h + fallback |
| `lib/chipRanking.ts` | **NEW (123 dòng)** | Rank 8-10 chip theo `day × hour × mood × phase` |
| `components/SuggestedChips.tsx` | **NEW (142 dòng)** | Card grid mode + compact pill mode |
| `services/api.ts` | PATCH | Thêm `getCannedReplies()` gọi `/content/canned-replies` |
| `pages/Chat.tsx` | PATCH (190 → 306 dòng) | Tích hợp chips + autocomplete + wiki CTA |

**3 layer chip UX**:

1. **Empty state** (chưa có tin nhắn): Grid 2-3 cột × 8-10 chip card. Cuối list
   có 1 chip đặc biệt *"❓ Câu của tôi không có ở đây — hỏi Sol"* để user hiểu
   tier system: chip = nhanh-miễn-phí, gõ tự do = AI có quota.

2. **Inline autocomplete**: Khi user gõ ≥2 ký tự, run `matchUserMessage()` →
   match score ≥ 0.5 → hiện suggestion bar `💡 Sol gợi ý: [icon] [label]`
   với hint `Tab để chọn`. Tab → instant Q&A, KHÔNG gọi AI.

3. **Sticky compact bar** (sau khi đã có tin): 6 chip pill scroll-x ngang trên
   composer. Luôn 1-click access cho user 45+ không quen scroll.

**Chip click flow** (PHASE 1 = client-only):
1. `markUsed(chip.id)` (trừ chip reusable)
2. Optimistic render `userMsg` (label) + `botMsg` (resolved answer + wikiUrl)
3. **KHÔNG POST `/messages`** → 0 AI call → 0 quota use
4. Re-rank chip list (loại chip vừa used khỏi display)

**Wiki link CTA** trong bubble assistant: nếu chip có `wikiUrl`, render nút
*"📖 Đọc chi tiết trên sol.vn →"* dưới text → drive traffic sang WordPress.

**Ranking algorithm** (`chipRanking.ts`):

```
score = chip.priority (default 100)
  + (CRITICAL ? 5000 : 0)              // SOS chip luôn top
  + (slug match "ngay-N" với daysSober ? 500 : 0)  // chip ngày-cụ-thể
  + (phase boost theo D1-3, D4-7, D8-30)
  + (night & sleep keyword ? 200 : 0)  // 22h-6h
  + (morning & motivation keyword ? 100 : 0)
  + (lateAfternoon & craving keyword ? 150 : 0)
  + (chip.reusable ? 50 : 0)
```

Sort desc, slice maxN=10. Filter chip non-reusable đã used.

**Trade-off Phase 1**: Chip Q&A KHÔNG persist DB → reload mất. Acceptable vì
cost = 0. Phase 2 sẽ wire `metadata.cannedReplyId` vào POST `/messages`.

### 📈 Phase 2 backlog

| # | Tính năng | Effort | Impact |
|---|---|---|---|
| A | Chip Q&A lưu DB qua `metadata.cannedReplyId` (no AI call) | 2h | HIGH |
| B | Smart clarification chips (intent score 0.3-0.5) | 3h | HIGH |
| C | Follow-up chips sau câu trả lời (chuỗi 3-5 chip = 0 AI) | 3h | HIGH |
| D | Crisis chip pin top + admin alert log | 2h | MED (trust) |
| E | Onboarding chip tour (lần đầu /chat) | 2h | MED |
| F | Voice input cho user 45+ (Whisper API) | 6h | MED |
| G | A/B chip variant tracking + auto-promote | 8h | LOW (cần data) |

### 📝 Quy tắc tránh đầy chat (founder note)

Học từ session "Smoking cessation" trước (đầy do paste posts.json 866KB):

- ❌ KHÔNG paste JSON/HTML/log dài vào chat
- ✅ Save file trên ổ → bảo Claude `Đọc D:\BOTHUOCLA\...\file`
- ✅ Cuối phiên: Claude update `CLAUDE_CONTEXT.md` mục delta + Phase backlog

### 🔧 Tooling note (cho session sau)

**Edit/Write tool có thể bị clip ở byte boundary** với file lớn (>6KB).
Workaround: dùng `bash heredoc + cp` để write file dài. Cụ thể:

```bash
cat > /tmp/file.tsx << 'EOF'
[full content]
EOF
cp /tmp/file.tsx /path/to/dest
```

Áp dụng cho `Chat.tsx` (10.6KB, 306 dòng) — Write/Edit fail, heredoc OK.

### Pending từ session 2026-05-03

- ❌ Khang chưa commit Phase 1 (em đề xuất command sẵn)
- ❌ Bug 2026-05-02 (dashboard vs widget out-of-sync) đã có `syncBus.ts` —
      cần verify thực tế đã fix sau khi user login phone
- ❌ Phase 2 (A-G) — Khang chọn ưu tiên trong session sau
- ❌ Frontend + Dashboard chưa có `.dockerignore` — preventive cleanup
- ❌ `docker-compose.yml` còn `version: '3.9'` obsolete warning — minor cleanup


---

## SESSION 2026-05-03 (delta 2 — Brand Positioning + Naming)

Sau khi Khang & em phân tích sâu Smoke Free + Allen Carr + role-play user
journey, anh em chốt brand architecture chính thức cho SOL.

### Brand Architecture chốt cứng

```
SOL (umbrella) — Tái sinh Thân Tâm Trí
   └── Khang Sol (persona — "Người Anh Đi Trước", KHÔNG phải bác sĩ)
        └── Đi Cùng Sol (method/program universal)
             ├── THÂN: bothuocla.sol.vn (vertical 1: cai thuốc, 2026)
             ├── THÂN: cairuou.sol.vn (vertical 2: cai rượu, 2027+)
             ├── THÂN: giacngu.sol.vn (vertical 3: mất ngủ)
             ├── TRÍ: sunghiep.sol.vn (vertical 4: chuyển nghề 45+)
             └── TÂM: tinhthan/mothon/caicobac... (future)
```

### Naming chính thức

- **Method name**: **"Đi Cùng Sol"** (3 từ, thuận mồm, universal)
- **Master tagline**: **"Đi Cùng Sol để tái sinh"**
- **Công thức tagline universal**: `"Đi Cùng Sol để [verb]"`
  - Đi Cùng Sol để bỏ thuốc
  - Đi Cùng Sol để bỏ rượu
  - Đi Cùng Sol để ngủ ngon
  - Đi Cùng Sol để chuyển nghề
  - Đi Cùng Sol để vượt qua
- **Founder voice tagline**: "Tôi đi rồi. Anh không phải đi một mình."

### Tier rename (chỉ display, KHÔNG migrate DB code)

| DB code | Display cũ | Display mới |
|---|---|---|
| FREE | FREE | **Mở Đầu** |
| KHOI_DONG | Khởi Động | Khởi Động (giữ) |
| DONG_HANH | Đồng Hành | **Trọn Vẹn** ← đổi để không trùng "Đi Cùng" |
| ALUMNI | Alumni | **Đại Sứ** |

### Vai Khang Sol — chốt cứng

- ✅ **"Người anh đi trước"** (peer mentor / witness-companion)
- ❌ KHÔNG phải: bác sĩ · coach · guru · influencer
- Compliance: disclaimer mọi bài + cite NHS/CDC + mời 1-2 BS advisor board (free)
- Money-back guarantee 100% (thay refund pro-rated D15)

### Files mới (kim chỉ nam)

- `docs/BRAND_POSITIONING.md` (12.7 KB) — Brand Bible đầy đủ
- `docs/STRATEGY_MEMO_2026-05-03.md` (4 KB) — Research Smoke Free + Allen Carr + role-play

→ Mọi quyết định content/feature/marketing sau này đối chiếu 2 file trên.

### 5 features ưu tiên cao nhất từ analysis

1. **Crisis chip + SOS Khang Zalo** (Day 2 đỉnh thèm — 60% drop point)
2. **Cravings tracker geo + context** (Smoke Free killer feature)
3. **Money saved + Health milestone + 30 badges** (dopamine cho 45+)
4. **Refactor 30 → 90 ngày program** (đỉnh tâm lý ở tháng 2-3)
5. **Zalo Group Cohort tháng** (0 code, peer support — Allen Carr group format)

### 3 B2B channels thử trong 6 tháng

A. Bệnh viện K outpatient cessation (2000 patient/năm × 100k = 200M VND)
B. Công ty 500+ CSR program (5M/tháng × 5 deal = 300M/năm)
C. Hội Cựu Chiến Binh / công đội (workshop offline)

### Pending sau session 2026-05-03

- ❌ Update sol.vn About page với Brand Bible manifest
- ❌ Refactor bothuocla.sol.vn copy theo "Đi Cùng Sol" + "tái sinh" frame
- ❌ Đổi tier display name (frontend only, không migrate DB)
- ❌ Outreach 2 BS advisor board (free)
- ❌ Pre-sell 10 user 199k tuần này (test market — em đề xuất)
- ❌ Phase 2A test thực browser (chip persist DB) — chưa verify
- ❌ Phase 2C/2B (follow-up + clarification chips) — defer
- ❌ Content sprint tuần 1 (10 wiki) — defer

---

## SESSION 2026-05-03 (delta 3 — Color Palette "Bình Minh")

Khang chốt swap palette từ Forest Green → "Bình Minh" toàn hệ thống.

### Thay đổi color tokens (giữ nguyên class names, chỉ swap hex)

| Token | Cũ | Mới |
|---|---|---|
| sol-green | #3AA06B | **#4A7C3A** (olive) |
| sol-orange | #E8812E | **#D2691E** (clay/terracotta) |
| sol-red | #C04331 | **#C62828** |
| sol-bg | #F7F4EF | **#FBF7F0** (kem ấm hơn) |
| sol-soft | #EEE9E0 | **#F0E5D0** (warm hơn) |
| sol-line | #E5DFD3 | **#E8DFC8** |
| sol-line-strong | #CFC8B9 | **#D4C7A8** |

### Mới thêm: sol-gold tokens
- sol-gold: #C9A227 (premium/Alumni badge)
- sol-gold-ink: #8B6914
- sol-gold-soft: #F5EBC8

### Files đã update (13 file)

Config (4):
- dashboard/tailwind.config.js
- frontend/tailwind.config.js
- dashboard/src/styles.css
- frontend/src/styles.css

Components có hardcoded hex (9):
- dashboard/src/components/workbook/PrepSections.tsx
- dashboard/src/components/workbook/shared.tsx
- dashboard/src/components/workbook/WorkbookNav.tsx
- dashboard/src/lib/recovery.ts
- dashboard/src/pages/Analytics.tsx
- dashboard/src/pages/Settings.tsx
- frontend/src/components/views/HomeView.tsx
- frontend/src/components/views/JourneyView.tsx
- frontend/src/lib/promptBank.ts

Plus: docs/BRAND_POSITIONING.md (section 12), docs/landing-bothuocla-preview.html.

### Lý do chọn palette này

- Mệnh Sa Trung Thổ (Bính Thìn 1976) — hợp Hoả (cam clay, đỏ, vàng) + Thổ (kem)
- Olive #4A7C3A nhẹ hơn forest #3AA06B — ít khắc Thổ
- 45+ Việt thấy ấm + chân thành (terracotta) thay vì clinical (forest green pure)
- Khác biệt với Vinmec/BV K (xanh dương lạnh) — moat visual
- Match founder lived-experience tone — "ngồi quán cafe sáng kể chuyện"

### Verify
- ✅ TypeScript clean (npx tsc --noEmit)
- ❌ Chưa rebuild Docker dashboard để render visual
- ❌ Chưa migrate DB tier displayName (Mở Đầu/Trọn Vẹn/Đại Sứ)

---

## SESSION 2026-05-03 (delta 4 — Color Palette FINAL "Đất Lửa")

Khang reject Bình Minh (olive green primary) — lý do: green = vegetable, không phù hợp 45+ "tái sinh không phải non xanh". Chốt swap sang **"Đất Lửa"** (Phoenix palette) — masculine, mature, warm, grounded.

### Color tokens chính thức (giữ class names legacy)

| Class | Hex Đất Lửa | Vai trò semantic |
|---|---|---|
| sol-green (legacy) | **#B25C2C** | CLAY primary CTA |
| sol-orange (legacy) | **#B8860B** | GOLD premium/achievement/voice Khang |
| sol-blue | #3A7CA5 (giữ) | Info rare |
| sol-red | #C62828 | Crisis/SOS only |
| sol-earth ⭐ NEW | **#5C3A1E** | Brown foundation, footer, sidebar dark |
| sol-wine ⭐ NEW | **#8B2D2D** | Power CTA (paid upgrade Trọn Vẹn) |
| sol-bg | #FBF7F0 | Cream page bg |
| sol-soft | #F0E5D0 | Warm sidebar |
| sol-line | #D4C7A8 | Warm border |
| sol-line-strong | #A8957A | Stronger border |

### Files đã update (Đất Lửa final)
- 4 config/CSS files (đã restore từ git → re-swap clean)
- 9 component files (sed swap)
- docs/BRAND_POSITIONING.md (section 12 thay mới)
- docs/landing-bothuocla-preview.html
- docs/LANDING_PAGE_SPEC.md

### sol-gold tokens REMOVED
Đã merge vào sol-orange family — semantic giờ là gold. Không cần thêm slot.

### Lưu ý cho session sau
- Class names "sol-green" và "sol-orange" giờ là **legacy** — hex đã đổi semantic.
  Nếu rename, cần coordinate toàn bộ codebase. Tạm thời keep cho không break.
- Khi naming component mới, có thể dùng `bg-sol-clay` không tồn tại — phải dùng
  `bg-sol-green` (legacy) hoặc `bg-sol-earth/wine` (new).

### Verify
- ✅ TypeScript clean (npx tsc --noEmit)
- ❌ Chưa rebuild Docker dashboard để render visual mới

---

## SESSION 2026-05-03 (delta 5 — Brand Consistency Audit)

Khang yêu cầu kiểm tra toàn dự án + apply lockup "Đi Cùng Sol — bỏ thuốc lá" ở các thiết kế. Cleanup brand text cũ ("SOL Dashboard", "Sol Bỏ Thuốc", "App cai thuốc"...) sang format chuẩn.

### Files updated (6)

1. `dashboard/index.html` — title "SOL Dashboard" → "Đi Cùng Sol — Trang quản lý" + theme-color clay #B25C2C
2. `frontend/index.html` — title "bothuocla.sol.vn — Đăng nhập" → "Đi Cùng Sol — bỏ thuốc lá", description, theme-color, favicon SVG (green → clay)
3. `dashboard/src/components/workbook/PrepSections.tsx` — link "Trang chủ Sol Bỏ Thuốc" → "Đi Cùng Sol — bỏ thuốc lá"
4. `dashboard/src/pages/admin/AdminCannedReplies.tsx` — comment update
5. `frontend/package.json` + `backend/package.json` + `dashboard/package.json` — description fields

### Section 13 added vào BRAND_POSITIONING.md

Typography & Punctuation rules — chuẩn 3 dạng brand text:
- **Logo lockup**: "Đi Cùng Sol — bỏ thuốc lá" (em-dash) — header, SEO, social share
- **Formula CTA**: "Đi Cùng Sol để [verb]" — mission, CTA, hero copy
- **Văn nói**: "đi cùng Sol bỏ thuốc" — voice, body, casual

### Quy tắc capitalization
- Brand standalone: SOL (all caps)
- Method name: Đi Cùng Sol (3 chữ cap)
- Founder: Khang Sol (cả 2 chữ cap)
- URL: bothuocla.sol.vn (lowercase)

### Punctuation rules
- Em-dash — cho lockup
- Middle dot · cho inline list
- Pipe | cho SEO title
- Hyphen - chỉ cho nối từ (KHÔNG cho lockup)

### KHÔNG động đến (giữ nguyên)
- Assistant presets "Sol Đồng hành" / "Sol Trợ lý" / "Sol Phó tướng" — user data, separate scope
- Body chat copy giọng tự nhiên
- Wiki article body content
- URL paths

### Verify
- ✅ TypeScript clean
- ❌ Chưa rebuild Docker để render visual mới (title browser tab + favicon)

---

## SESSION 2026-05-03 (delta 6 — Script "Sol là gì?")

Khang chốt 4 phiên bản câu trả lời "Sol là gì?" cho các ngữ cảnh:
- Văn nói (5s casual)
- Văn viết (formal About page)
- Pitch giới thiệu (30-60s investor/partner)
- AI chatbot canned reply (slug: `gioi-thieu-sol` — instant, 0 AI quota)

Thêm cheat sheet 5 câu hỏi thường gặp + tone rules.

→ Section 14 trong `docs/BRAND_POSITIONING.md`.

### TODO sau session
- ❌ Tạo canned reply slug `gioi-thieu-sol` trong DB (qua admin /admin/canned-replies)
- ❌ Update About page sol.vn WordPress dùng văn viết section 14.2
- ❌ Khang ghi âm voice giới thiệu Sol theo pitch 14.3 — dùng làm voice intro

---

## SESSION 2026-05-03 (delta 7 — Casting & Storytelling)

Khang xác lập 5 nhân vật chính của brand SOL:

1. **Khang Sol** = "Người Anh Đi Trước" — đã graduate vertical 1 (cai 3 năm), vẫn practice Sol ở chiều khác (continuous), quay lại đi cùng anh em mới
2. **Đi Cùng Sol** = "Con Đường" (không phải nhân vật, là method)
3. **Anh Em Đồng Hành** = Cohort peers (10-20 người cùng tháng)
4. **Đại Sứ Sol** = Alumni quay lại đi cùng (tier ALUMNI 49k/tháng)
5. **Người Đi Mới (Anh)** = Protagonist — chủ chính của hành trình

→ Section 15 trong BRAND_POSITIONING.md.

### Key insight — User là protagonist
KHÔNG phải Khang. Khang ngồi "ahead of" không phải "above". Đảo motif guru truyền thống. Đây là moat brand SOL khác Allen Carr (Allen = method center) và Smoke Free (David Crane = ẩn danh).

### Story script 1 phút sẵn
Cho voice intro, landing video, investor pitch, interview báo.

### Casting quy tắc tên (không dùng English)
- "User" → "Người Đi Mới" / "Anh" / "Em"
- "Coach" → "Người Anh Đi Trước"
- "Community" → "Anh Em Đồng Hành"
- "Alumni" → "Đại Sứ Sol"
- "App" → "Đi Cùng Sol" / "Con Đường"

---

## SESSION 2026-05-03 (delta 8 — Việt hoá "Cohort" → "Đội Sol")

Khang chốt bỏ hoàn toàn từ "cohort" trong UI/copy/docs. Việt hoá thành **"Đội Sol Tháng X"**.

### 11 files updated (UI strings + docs prose)
- 5 admin pages (AdminCohorts, AdminHome, AdminLayout, AdminUserDetail, AdminUsers) — display strings
- 2 types/index.ts — comments
- 4 docs (BRAND_POSITIONING, STRATEGY_MEMO, landing HTML, LANDING_PAGE_SPEC) — prose

### Naming format
- "Đội Sol Tháng 5/2026"
- "Đội Sol Tháng 5"
- Đội = đội lữ hành/đội quân — match casting + palette + spirit

### Code identifiers GIỮ NGUYÊN
- interface Cohort, cohortKey property, AdminCohorts component, adminListCohorts API, route /admin/cohorts, feature gate community.cohort_badge

### Section 16 added vào BRAND_POSITIONING.md
Quy tắc dùng + voice test + lý do chọn "Đội".

### Verify
- ✅ TypeScript clean
- ✅ Zero "cohort" trong user-facing text
- ❌ Chưa rebuild Docker để xem admin sidebar mới

---

## SESSION 2026-05-03 (delta 9 — Đội Sol + đồng đội FINAL)

Khang reject "Đoàn Sol" — quá formal/military. Chốt **2-layer naming**:

### Architecture
- **CONTAINER**: "Đội Sol Tháng X" (modern team, không hierarchy)
- **MEMBERS**: "đồng đội" (teammates, peer-equal)
- **RELATIONSHIP**: "anh em đồng hành" (đã có trong casting)

### Lý do "Đội" không "Đoàn"
- Đoàn = formal/military (công đoàn, đoàn quân)
- Đội = modern team (đội bóng, đội tuyển) — match peer brand
- 10-20 người = đúng size Đội, Đoàn quá lớn

### 12 files swapped lần này
- 5 admin pages
- 2 types/index.ts
- 4 docs (BRAND_POSITIONING, STRATEGY_MEMO, landing HTML, LANDING_PAGE_SPEC)
- CLAUDE_CONTEXT.md itself

### Section 16 BRAND_POSITIONING — REWRITTEN
Giải thích 2-layer naming + voice test 7 câu + quy tắc dùng.

### Lịch sử naming swaps (2026-05-03)
1. "Cohort" (English) →
2. "Đoàn Sol" (Việt hoá lần 1, formal) →
3. **"Đội Sol" + "đồng đội"** (FINAL, modern peer)

### Code KHÔNG đổi (kỹ thuật)
interface Cohort, cohortKey, AdminCohorts component, adminListCohorts API, route /admin/cohorts, feature gate community.cohort_badge — keep English cho dev maintenance.

### Verify
- ✅ Zero "Đoàn"/"cohort" trong user-facing
- ✅ TypeScript clean
- ❌ Chưa rebuild Docker để xem admin sidebar mới

---

## SESSION 2026-05-03 (delta 10 — Chip Images + Brand Insertion + Việt hoá)

### 27 chip featured images (palette Đất Lửa)

**Files:**
- `wiki-skeletons/upload-script/featured-images/chips/*.jpg` — 27 ảnh 1200×630, ~70KB
- `wiki-skeletons/upload-script/featured-images/chips/_manifest.json` — SEO metadata
- `wiki-skeletons/upload-script/generate-chip-featured-images.py` — render script v2

**Template features:**
- SOL logo mark (clay circle với chữ "S")
- "ĐI CÙNG SOL — bỏ thuốc lá" header + subtitle
- Category badge top-right (6 màu: KHẨN CẤP wine, TRIỆU CHỨNG/TRIGGER clay, TÂM LÝ/PHỤC HỒI gold, CHIA SẺ clay)
- Method line: "Đi Cùng Sol để bỏ thuốc · 30 ngày đầu"
- Footer CTA: "→ bothuocla.sol.vn" + "Khang Sol đi cùng anh"
- 12px clay accent bar trái

**SEO manifest (cho upload):**
- alt_text: "{title} | Đi Cùng Sol để bỏ thuốc — {category}"
- title_attr: "Đi Cùng Sol — {title}"
- meta_description, target_keyword (từ frontmatter)

### Brand block insertion vào 27 chip MD articles

Mỗi chip cuối bài giờ có 4 block:
1. **📖 Đọc thêm trên Đi Cùng Sol — {Category}** — internal links 2-3 chip cùng category (SEO topical authority)
2. **🌅 Đi Cùng Sol để bỏ thuốc lá** — 5 bullet (free, AI 24/7, voice Khang, SOS, Đội Sol) + CTA với UTM
3. **👤 Khang Sol — Người Anh Đi Trước** — bio chuẩn (50 tuổi, 22 năm hút, 3 năm cai)
4. **⚕️ Lưu ý y tế** — disclaimer compliance (NHS/CDC source, không thay BS)

**Cleanup tự động:**
- Xoá "## Ghi chú cho Khang" (internal note, 4 chips)
- Xoá legacy "## Bắt đầu cùng SOL" CTA (replaced by full brand block)

### Việt hoá content

- "## Hook" → "## Đọc nhanh" (27/27 chips)
- "Identity-based statement" → "Khẳng định danh tính"
- "Dopamine system" → "Hệ dopamine"
- "Cook 2017 study" → "Nghiên cứu Cook 2017"
- "Partial agonist nAChR" → "Đối vận từng phần (Partial agonist) thụ thể nAChR"
- "trầm cảm clinical" → "trầm cảm lâm sàng"
- "urge surfing" → "urge surfing — cưỡi sóng thèm" (keep technical + add VN)
- "grounding 5-4-3-2-1" → "grounding 5-4-3-2-1 (kỹ thuật neo cảm giác)"

### PowerShell scripts (chip upload)

- `wiki-skeletons/upload-script/upload-chip-featured.ps1` — fetch posts (status=any), match slug, upload media, set alt_text/title/caption/description, set featured_media

**Quy tắc PowerShell + UTF-8 (golden rule cho session sau):**
- Save .ps1 với **UTF-8 BOM** (Python: `encoding='utf-8-sig'`) — PowerShell auto-detect
- URL có `&` build qua **string concat** (`$url = $base + '&page=' + $i`), KHÔNG double-quote interpolation
- Avoid em-dash `—`, smart quotes — dùng ASCII tương đương trong code
- Force console: `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`

### Pending sau session 2026-05-03

- ❌ Khang test `upload-chip-featured.ps1` (chưa run)
- ❌ Viết `update-chip-content.ps1` — push 27 MD đã có brand block lên WP draft/pending posts
- ❌ Khang chụp ảnh chân dung + ảnh "lúc còn hút" (cho landing hero + chip images sau)
- ❌ 2 chip CHIA SẺ (chip-khac-mau, chip-khong-la-minh) có thể recategorize:
  - chip-khac-mau → TRIỆU CHỨNG (khạc máu = symptom)
  - chip-khong-la-minh → TÂM LÝ (identity issue)

### Audit log
`wiki-skeletons/upload-script/chip-brand-audit.json` — log changes per chip MD

---

## SESSION 2026-05-03 (delta 11 — chip content upload BLOCKED)

### Tình hình cuối session

Đã viết xong infrastructure publish chip lên WP, NHƯNG **PATCH content hang** chưa giải quyết.

### Files mới hôm nay (chip publish pipeline)

- `wiki-skeletons/upload-script/convert-chips-to-html.py` — convert 27 MD → HTML
- `wiki-skeletons/upload-script/chips-html/*.html` — 27 file HTML đã render (~7KB mỗi file)
- `wiki-skeletons/upload-script/chips-html/_manifest.json` — slug + title + excerpt + html_file
- `wiki-skeletons/upload-script/update-chip-content.ps1` — v3 với curl.exe + timeout + retry
- `wiki-skeletons/upload-script/upload-chip-featured.ps1` — set featured image (đã test phát hiện)

### Bug chưa giải quyết — PATCH content hang

**Triệu chứng:**
- Khang test `update-chip-content.ps1 -OnlySlug "con-them-du-doi"` (post #801 [draft])
- Output dừng ở "Found post #801 [draft]" — không tới được PATCH log
- Sau Ctrl+C verify: post 801 modified 16:43 (không phải lúc test), content = 5057 chars cũ (không phải 7144 mới)
- Markers brand mới đều ❌ (không có "Đọc nhanh", "Đi Cùng Sol", "Khang Sol", "Lưu ý y tế")

**3 phiên bản đã thử:**
- v1: PowerShell `Invoke-RestMethod` plain — hang
- v2: IRM với `-TimeoutSec 90` + retry — vẫn hang trước khi log [try 1]
- v3: **`curl.exe -X POST --data-binary @body.json --max-time 120`** — CHƯA test

**Hypotheses (cho session sau debug):**
1. PowerShell IRM bug với PATCH 7KB UTF-8 content — curl.exe nên fix (v3)
2. Rank Math/Yoast plugin hooks chạy chậm trên `save_post` — cần disable temp qua mu-plugin
3. AZDIGI shared hosting throttle PATCH lớn — cần chunk (excerpt → meta → content riêng)
4. PHP memory_limit thấp — server crash silently

**Plan session sau:**
1. Test v3 script với curl.exe (đã ready, chưa run)
2. Nếu vẫn hang → curl test PATCH chỉ với title (1 field nhỏ) để isolate vấn đề
3. Nếu title OK + content fail → viết mu-plugin endpoint riêng `/sol/v1/post-content` bypass hooks
4. Hoặc fallback: split body → PATCH excerpt + meta riêng (1KB), content riêng

### Quy tắc PowerShell + WP (golden rules cho session sau)

- **PowerShell IRM unreliable cho PATCH > 5KB** với UTF-8 content — dùng curl.exe
- **Curl pattern**: lưu body vào temp file, dùng `--data-binary @file` + `--max-time` + `-w "%{http_code}"`
- **Verify after PATCH**: GET back ngay, check `content.raw.Length` + `modified` time
- **UTF-8 BOM** cho .ps1 files (Python: `encoding='utf-8-sig'`)
- **URL có `&`** build qua string concat — NEVER trong double-quoted với `$var`

### Status pipeline chip publish

- ✅ 27 chip MD đã có brand block (Đi Cùng Sol + Khang bio + disclaimer + related)
- ✅ 27 chip MD đã Việt hoá ("Hook" → "Đọc nhanh", 5 English terms)
- ✅ 27 chip HTML rendered (chips-html/)
- ✅ 27 featured images Đất Lửa palette (featured-images/chips/)
- ✅ SEO manifest sẵn sàng (alt_text + title_attr + meta_description)
- ❌ PATCH content lên WP — BLOCKED, chưa work
- ❌ Upload featured image — chưa test (chờ content xong trước)

### Backup recommendation

- Git commit toàn bộ thay đổi hôm nay
- Push lên GitHub repo private
- Quan trọng: 27 chip MD đã có brand block là **value lớn nhất** cần lưu

---

## SESSION 2026-05-04 (delta 12 — Push Notification Analysis + ContentItem Seed)

### Phân tích push system hiện có
- ✅ **Backend ~85% hoàn thiện** — multi-channel (IN_WIDGET/WEB_PUSH/EMAIL/SMS), 7 cron jobs, personalize 5 lớp (per-day × per-user × per-time × per-pattern × per-preference), quiet hours + calm mode, auto-cleanup dead subs
- ✅ **Frontend ~90%** — service worker `sol-sw.js`, `webpush.ts` với register/permission/subscribe full flow, SettingsView toggle
- ⚠️ **5 gaps cần fill**: ContentItem data, default channels (push không gửi mặc định), 4 cron handler (STREAK_MILESTONE/MISSED_DAY/REENGAGEMENT/FOUNDER_WEEKLY), email/sms sender, frontend banner proactive
- ⚠️ **CRITICAL bug**: `enqueueDailyContent` không set `channels: ['IN_WIDGET', 'WEB_PUSH']` mặc định → push không gửi

### 12 cải thiện (em đề xuất)
**A. Business model (4):**
- A1 Tier-aware push (paid voice Khang Day 1/3/7)
- A2 Conversion-driven (Day 7 → "nâng Trọn Vẹn?")
- A3 Streak protection (22:30)
- A4 Đại Sứ flywheel (Day 30 → invite)

**B. Benchmarks (3):**
- B1 Money saved counter (mỗi mốc)
- B2 Social proof (Đội Sol cohort updates)
- B3 Streak gamification

**C. Việt 45+ culture (5):**
- C1 Push 7:30 / 12:30 / 19:00 (sau bữa cơm — cao điểm thèm Việt)
- C2 Tết special (5 ngày trước Tết: kế hoạch từ chối)
- C3 Family motivation (Day 14 vợ con)
- C4 Cancer fear (Day 30 phổi sửa thứ 30 năm phá)
- C5 Cộng đồng (cựu chiến binh / bạn nhậu)

### Files đã build hôm nay

`backend/src/seed/contentItems.ts` (41KB, 127 items):
- 30 MORNING_GOAL (7h)
- 30 SCIENCE_TIP (10h)
- 7 PHENOMENA_ALERT (Day 1, 2, 3, 4, 7, 14, 30)
- 30 EXERCISE (16:30)
- 30 NIGHT_STORY (21:30)

Voice: "Người Anh Đi Trước" — {pronouns}, {name}, {assistantName}, {greet} placeholders.
Science: cite NHS/CDC/WHO/Hughes/Cosgrove/Lally/Brody/Doll-Hill/Krut/Marlatt.
Wiki: link sol.vn/{slug}/ cho mỗi item.

`backend/src/seed/runContentItems.ts` — runner upsert 127 vào DB:
```bash
cd backend
npx tsx src/seed/runContentItems.ts
```

### Deferred (Khang chọn ưu tiên session sau)
- ❌ Fix default channels bug (30 phút — quan trọng nhất)
- ❌ Code 4 cron handler thiếu (3-4h dev)
- ❌ Email/SMS sender (10-15h Y2)
- ❌ Frontend banner proactive (1-2h)
- ❌ Test end-to-end push thực tế

### Khang sẽ edit
Khang xem 127 items trong `backend/src/seed/contentItems.ts` và chỉnh:
- Voice cá nhân hơn (story riêng)
- Cite chính xác source khoa học
- Bổ sung items đặc biệt (Tết, Quốc khánh)
- Thêm STREAK_MILESTONE / MISSED_DAY templates

---

## Delta 11 — Push Pipeline Fix + Test Verified (2026-05-04)

### Tóm tắt phiên

Sau khi seed 127 ContentItem (delta 10) — em build test pipeline (`testPushPipeline.ts`) để verify e2e. Test EXPOSE 3 BUG CRITICAL trong codebase production mà nếu không test thì cron sẽ silently fail / crash:

#### Bug #1 — `NotificationType` enum thiếu `NIGHT_STORY`

- **Triệu chứng**: cron 21:30 NIGHT_STORY → `prisma.notification.create({ type: 'NIGHT_STORY' })` → throw `Invalid value for argument 'type'`.
- **Impact**: Cron silently fail mỗi đêm 21:30 → user không nhận night story.
- **Fix**: thêm `NIGHT_STORY` vào enum trong `schema.prisma`. DB đã có sẵn (do phiên trước), chỉ cần `prisma generate`.

#### Bug #2 — `ContentModule` mismatch giữa `EXERCISE` vs `EXERCISE_REMINDER`

- **Triệu chứng**: `enqueueDailyContent('EXERCISE_REMINDER')` → `findMany({ module: 'EXERCISE_REMINDER' })` → 0 result vì ContentModule chỉ có `EXERCISE`. Cron 16:30 silently không bắn — ContentItem có nhưng query không match.
- **Impact**: User không nhận daily exercise notification, ContentItem EXERCISE bị orphan.
- **Fix**: Tách 2 type:
  - `ContentModuleParam` (dùng query ContentItem): 5 giá trị `MORNING_GOAL | SCIENCE_TIP | PHENOMENA_ALERT | EXERCISE | NIGHT_STORY`
  - `NotificationType` (output): `EXERCISE_REMINDER` (rename) + 11 giá trị khác
  - Map function `moduleToNotifType()` chuyển đổi.
  - Cron `enqueueDailyContent('EXERCISE_REMINDER')` → `enqueueDailyContent('EXERCISE')`.

#### Bug #3 — `deliverDueNotifications` không map `NIGHT_STORY` → MessageType

- **Triệu chứng**: Even nếu Notification tạo thành công, khi deliver, switch case rơi vào `'SYSTEM_NOTICE'` default → message log hiện sai type → UI không render kiểu night story (không có icon đêm, không CTA "Đọc tiếp").
- **Fix**: Thêm case `n.type === 'NIGHT_STORY' ? 'NIGHT_STORY'` vào switch chain.

### File modified

- `backend/prisma/schema.prisma` — add `NIGHT_STORY` vào `NotificationType` enum
- `backend/src/scheduler/worker.ts` — 5 fix: type tách + moduleToNotifType + cron schedule + deliver mapping + channels default
- `backend/src/seed/createTestUser.ts` — script tạo test user Day 2
- `backend/src/seed/testPushPipeline.ts` — script verify pipeline (import personalize thật)
- `backend/src/seed/resetContentItems.ts` — script wipe + re-seed clean

### Workflow test pipeline (lưu lại để dùng cho user tương lai)

```bash
cd backend
docker compose up -d db                           # bật Postgres
npx tsx src/seed/resetContentItems.ts            # wipe ContentItem cũ
npx tsx src/seed/runContentItems.ts               # seed 127 row clean
npx tsx src/seed/createTestUser.ts                # tạo test@sol.vn Day 2
npx tsx src/seed/testPushPipeline.ts              # verify direct enqueue
```

Output kỳ vọng cuối: 4 Notification (MORNING_GOAL + SCIENCE_TIP + NIGHT_STORY + STREAK_MILESTONE) với channels đúng + personalize đúng (`{pronouns}` → `anh`).

### Lessons learned

- **Test e2e BẮT BUỘC trước deploy**: 3 bug critical em vừa fix sẽ silently crash cron production nếu không test. Cron error chỉ log → không alert → mất 1-2 tuần mới phát hiện qua "tại sao retention thấp".
- **Tách concern enum**: ContentModule (nội dung) vs NotificationType (delivery) phải tách rõ — đừng share enum giữa 2 layer.
- **Personalize function real source**: dùng `utils/personalize.ts` luôn — đừng duplicate trong test/seed scripts → bug subtle khó debug.
- **PowerShell escape**: `\"` không work → dùng backtick `` ` `` hoặc viết file `.ts` riêng.
- **DB drift handling**: khi `prisma db push` báo "constraint already exists", dùng raw SQL `ALTER TYPE` thay vì force-reset → preserve data.

### Outstanding bugs (queue cho phiên sau)

- [ ] CONFIRMED không có thêm bug từ test này
- [ ] Verify chain: Notification → deliverDueNotifications → Message → Socket emit → Widget UI render (chưa test, cần frontend chạy + push subscription)
- [ ] Test `enqueueStreakMilestones` với milestone Day 7/14/30 (cần ngày-skip-test, chưa làm)

---

## Delta 12 — Level 3 Personalization + Messaging Playbook (2026-05-04)

### Tóm tắt phiên

Sau khi anh hỏi "biên tập tin nhắn ở đâu? lên kịch bản thế nào? cá nhân hóa thế nào?" — em làm 3 việc parallel:

1. **Code Level 3 personalize** — thêm placeholder `{topReason}`, `{reasonsList}`, `{topTrigger}` để replay user's own words (Allen Carr + Smoke Free pattern, +30-40% compliance).
2. **Inject 5 chỗ strategic** trong `contentItems.ts` — Day 1 (opening hook), Day 7 (tuần đầu celebrate), Day 14 (bước ngoặt), Day 21 (anchor reminder), Day 30 (full reflection).
3. **Soạn MESSAGING_PLAYBOOK.md** (384 dòng) — kim chỉ nam biên tập tin nhắn cho Khang.

### File modified

- `backend/src/utils/personalize.ts` — thêm `quitReasons`, `topTriggers` vào `PersonalizationCtx`. 3 placeholder mới: `{topReason}`, `{reasonsList}`, `{topTrigger}` với fallback `'lý do của anh'` / `''` / `'tình huống khó của anh'`.
- `backend/src/scheduler/worker.ts` — pass `quitReasons` + `topTriggers` vào pCtx ở 7 chỗ (5 enqueue + 2 helper).
- `backend/src/seed/contentItems.ts` — inject `{topReason}` 5 chỗ:
  - Day 1 MORNING: "Lý do {pronouns} bắt đầu: {topReason}. Lúc khó nhất, nhớ câu này."
  - Day 7 NIGHT: "{topReason} — 1 tuần rồi vẫn còn đó."
  - Day 14 MORNING: "{topReason} — 14 ngày rồi {pronouns} vẫn giữ."
  - Day 21 NIGHT: "21 ngày rồi — {topReason} vẫn ở đó, {pronouns} vẫn ở đây."
  - Day 30 NIGHT: "{topReason} — lý do {pronouns} bắt đầu, hôm nay vẫn còn nguyên."
- `backend/src/seed/createTestUser.ts` — set `quitReasons: ['vì cu Tí', 'ho buổi sáng', 'vợ nhăn']`, `topTriggers: ['nhậu', 'cà phê sáng', 'sau bữa cơm']`, `assistantName: 'Sol Phó tướng'`.
- `backend/src/seed/setTestUserDay.ts` MỚI — đổi test user về Day N để test content khác ngày.
- `backend/src/seed/inspectTestUser.ts` MỚI — debug print user fields (xem `quitReasons` đã set hay chưa).
- `backend/src/seed/testPushPipeline.ts` — thêm `quitReasons` + `topTriggers` vào pCtx ở 3 chỗ (BUG mới: script test em duplicate, không follow worker.ts).
- `docs/MESSAGING_PLAYBOOK.md` MỚI — 9 phần: Voice (Khang Sol vs Sol Đồng hành), Variable cheat sheet, Slot template, 30-day emotional arc, Anti-pattern, Edit + test workflow, Quality checklist, Pattern thư viện, Khi nào cần em review.

### Test verified e2e

Day 30 NIGHT_STORY render đúng:
> "anh đã hoàn thành. Phổi 30%, tim chậm hơn, não tái cấu trúc. **vì cu Tí** — lý do anh bắt đầu, hôm nay vẫn còn nguyên. Đêm nay ngủ với một con người mới."

Day 7 NIGHT_STORY:
> "168 giờ sạch. anh đã làm điều 9/10 người không. **vì cu Tí** — 1 tuần rồi vẫn còn đó. Ngủ ngon — mai sang chương mới."

### Workflow đầy đủ test với data đa dạng

```bash
cd backend
npx tsx src/seed/runContentItems.ts             # seed 127 (idempotent)
npx tsx src/seed/createTestUser.ts              # tạo/update test user với quitReasons
npx tsx src/seed/inspectTestUser.ts             # verify quitReasons có trong DB
npx tsx src/seed/setTestUserDay.ts 7            # đổi Day
npx tsx src/seed/testPushPipeline.ts            # render preview
npx tsx src/seed/setTestUserDay.ts 30           # test ngày khác
npx tsx src/seed/testPushPipeline.ts
```

### Lessons learned (4)

1. **Khi sửa `PersonalizationCtx`, phải update TẤT CẢ chỗ tạo pCtx**: worker.ts (7 chỗ), testPushPipeline.ts (3 chỗ), nếu có chỗ mới quên — placeholder fallback silently → bug khó nhận biết. **Best practice**: tạo helper function `buildPCtx(user)` trong utils, mọi nơi dùng — single source of truth.

2. **Test pipeline cũng phải đồng bộ với production code**. Em duplicate signature pCtx trong testPushPipeline.ts, sau đó quên update khi extend → bug giả phát hiện qua test (`{topReason}` fallback `"lý do của anh"`). Nếu Khang chỉ test rồi deploy, sẽ không catch ra. → Phiên sau em sẽ refactor: testPushPipeline import worker functions trực tiếp thay vì copy logic.

3. **`{topReason}` cần warning nếu user `quitReasons=[]`**. Hiện fallback là `"lý do của anh"` — nghe ngộ. Nên thay bằng skip nguyên đoạn nếu rỗng (vd: nếu `quitReasons[]` thiếu → bỏ luôn câu chứa `{topReason}` thay vì hiển thị fallback). → TODO phiên sau: dùng conditional template syntax `{{if topReason}}{topReason} — ...{{/if}}`.

4. **Onboarding bắt buộc khai `quitReasons` 1-3 lý do trước khi enable push**. Không có `quitReasons` → Level 3 không có effect → mất 30-40% compliance boost. UI: thêm vào `ProfileSetupWizard` hoặc inline trong SettingsView, BEFORE EnablePushBanner appear.

### Outstanding cho phiên sau

- [ ] Refactor `buildPCtx(user)` helper trong utils, dùng chung worker + test
- [ ] Conditional template syntax `{{if topReason}}...{{/if}}` trong personalize.ts
- [ ] UI flow: ép user khai `quitReasons` (1-3 lý do) ở onboarding hoặc EnablePushBanner CTA
- [ ] Test các Day strategic khác: 1, 14, 21 (em đã verify Day 7 + Day 30)
- [ ] Append `{topReason}` vào worker.ts STREAK_MILESTONES Day 30 hardcoded body (hiện chỉ ContentItem dùng)

---

## Delta 13 — AdminContent Phase 1 + Smart Scheduler Phase 5 (2026-05-04, ngày dài)

### Tóm tắt

Phiên dài nhất từ trước tới nay. Em build từ 0 lên 2 hệ thống lớn:
1. **AdminContent UI** — Khang biên tập 127+ ContentItem qua dashboard (CRUD đầy đủ + revision history + preview personalize + lint anti-pattern theo MESSAGING_PLAYBOOK)
2. **Smart Notification Schedule** — user opt-in vào bảng điều khiển: dailyMax 1-5, khung giờ active/quiet, weekend reduce, 6 moments cá nhân (cà phê sáng, trà đá trưa, sau cơm, nhậu, trước ngủ). Worker.ts có `smartSchedulerSweep()` mỗi 15 phút match content theo moment user.

### Schema migration

3 enum + 1 model + 2 column:
```prisma
enum ContentVoice { KHANG_SOL, SOL_DONG_HANH }      // Phase 1
enum Moment { COFFEE_MORNING, TEA_AFTERNOON, POST_LUNCH, POST_DINNER, PRE_SOCIAL_DRINK, PRE_BEDTIME, GENERIC }  // Phase 5

model ContentItem {
  voice: ContentVoice  @default(SOL_DONG_HANH)       // Phase 1
  priority: Int         @default(100)                 // Phase 1
  targetRules: Json?                                  // Phase 1 (UI Phase 2)
  variantGroup: String?                               // Phase 3 reserved
  weight: Int           @default(1)                   // Phase 3 reserved
  moment: Moment?                                     // Phase 5
  lastEditedBy: String?                               // Phase 1
  revisions: ContentItemRevision[]                    // Phase 1
  @@unique([dayNumber, module, exerciseKey, voice])   // changed from old [dayNumber, module, exerciseKey]
}

model ContentItemRevision {                           // Phase 1 NEW
  versionNum, title, body, voice, targetRules, priority, editedBy, editedAt, changeNote
  @@index([contentItemId, versionNum])
}

model User {
  notificationPrefs Json @default("{}")              // Phase 5
}
```

DB drift recovery: dùng raw SQL `manual_migration_admin_content.sql` + `manual_migration_phase5.sql` thay vì `prisma db push` (vì existing constraint conflict).

### File NEW

**Backend (~900 dòng new code)**:
- `backend/src/admin/content/linter.ts` — anti-pattern check theo MESSAGING_PLAYBOOK (từ TA blacklist, câu >20 từ, exclamation dồn, emoji nhiều)
- `backend/src/admin/content/service.ts` — CRUD + revision tracking + preview engine
- `backend/src/admin/content/routes.ts` — 8 endpoint: GET list/get, POST create/preview/lint/restore, PATCH update, DELETE
- `backend/src/users/notificationPrefs.ts` — helper functions (isInQuietHours, isInActiveWindow, detectCurrentMoment, effectiveDailyMax) + Express router
- `backend/prisma/manual_migration_admin_content.sql` — Phase 1 migration
- `backend/prisma/manual_migration_phase5.sql` — Phase 5 migration
- `backend/src/seed/syncContentVoice.ts` — set 6 KHANG_SOL items theo voice arc
- `backend/src/seed/cleanOrphanContent.ts` — xoá row dư khỏi ContentItem
- `backend/src/seed/createTestUser.ts` — tạo test@sol.vn với quitReasons, topTriggers
- `backend/src/seed/setTestUserDay.ts` — đổi quitDate test user về Day N
- `backend/src/seed/inspectTestUser.ts` — debug print user fields
- `backend/src/seed/testPushPipeline.ts` — verify pipeline e2e

**Frontend (~600 dòng new code)**:
- `frontend/src/components/NotificationPrefsPanel.tsx` (~210 dòng) — user control bảng điều khiển: slider dailyMax, time picker active/quiet, weekend reduce, 6 moment checkboxes
- `frontend/src/components/EnablePushBanner.tsx` (~138 dòng) — banner D+1 nhắc bật push

**Dashboard (~860 dòng new code)**:
- `dashboard/src/pages/admin/AdminContent.tsx` (~860 dòng) — 3-zone layout: filter sidebar + list panel + edit + preview + revision + create modal + delete

**Docs (~1400 dòng new)**:
- `docs/ADMIN_CONTENT_DESIGN.md` (806 dòng) — design Phase 1-6
- `docs/MESSAGING_PLAYBOOK.md` (384 dòng) — voice + variable + slot + arc + anti-pattern + workflow
- `INFRASTRUCTURE.md` (529 dòng) — VPS + Firebase deployment runbook
- `MARKETING_ZERO_BUDGET.md` (322 dòng) — FB + Zalo strategy

### File modified

- `backend/prisma/schema.prisma` — 3 enum + 1 model + 5 column mới
- `backend/src/scheduler/worker.ts` — thêm `userHasSmartPrefs`, `smartSchedulerSweep` (~150 dòng), cron `*/15 * * * *`. Total 12 cron jobs.
- `backend/src/admin/routes.ts` — mount contentRouter
- `backend/src/utils/personalize.ts` — Level 3 placeholder ({topReason}, {reasonsList}, {topTrigger})
- `backend/src/seed/contentItems.ts` — full rewrite 127 items theo MESSAGING_PLAYBOOK voice arc 7 giai đoạn
- `backend/src/seed/runContentItems.ts`, `seed.ts` — fix composite key
- `backend/src/index.ts` — mount notificationPrefsRouter
- `dashboard/src/services/api.ts` — 7 admin content methods + types
- `dashboard/src/App.tsx`, `dashboard/src/pages/admin/AdminLayout.tsx` — route + sidebar link
- `frontend/src/services/api.ts` — getNotificationPrefs, updateNotificationPrefs
- `frontend/src/components/views/SettingsView.tsx` — section "🔔 Bảng điều khiển tin nhắn"
- `frontend/src/components/views/HomeView.tsx` — wire EnablePushBanner

### Bug critical phát hiện + fix

1. **NotificationType enum thiếu NIGHT_STORY** → cron 21:30 crash. Fix: ALTER TYPE ADD VALUE.
2. **enqueueDailyContent('EXERCISE_REMINDER') vs ContentModule.EXERCISE** → query 0 result, cron silent fail. Fix: tách `ContentModuleParam` (5 giá trị) + `moduleToNotifType()` map.
3. **deliverDueNotifications không map NIGHT_STORY → MessageType** → fall vào SYSTEM_NOTICE. Fix: thêm case.
4. **enqueueDailyContent thiếu WEB_PUSH default channels** → user opt push không nhận. Fix: morning/night/science = ['IN_WIDGET', 'WEB_PUSH'].
5. **testPushPipeline.ts duplicate personalize đơn giản** → {pronouns} không thay. Fix: import `realPersonalize` từ utils.
6. **package.json mất dấu `}` cuối** (golden rule lần 3) → ERR_INVALID_PACKAGE_CONFIG khi npx tsx. Fix: append `}`.
7. **api.ts truncate giữa Edit nhiều lần** (golden rule lần 4-6) → mất 60+ dòng types. Fix: restore git + apply lại bằng python script.

### Workflow quan trọng

**Khang edit content** (qua dashboard `/admin/content`):
1. Click filter → list 127 item
2. Click 1 item → edit form bên phải
3. Sửa title/body/voice/priority/moment/published
4. Live preview với mock user (Khang, anh, "vì cu Tí" reasons)
5. Lint warnings hiện ngay nếu vi phạm playbook
6. Save → tự tạo ContentItemRevision v1 (audit log)
7. Restore from any revision

**Khang create new content** (modal "+ Tạo tin nhắn mới"):
1. Click button → modal mở
2. Chọn day, module, voice (auto-fill pushTime theo module)
3. Title + body + priority + moment
4. Click Tạo → modal đóng + auto-select item mới

**User config bảng điều khiển** (Settings widget tab "🔔 Bảng điều khiển tin nhắn"):
1. Slider dailyMax 1-5
2. Time picker active/quiet
3. Checkbox weekend reduce
4. 6 moment checkboxes — mỗi cái có time picker riêng
5. Auto-save mỗi thay đổi
6. Worker `smartSchedulerSweep` chạy mỗi 15 phút match content theo moment

### Lessons learned (5)

1. **Docker Desktop hay treo trên Windows** — restart không phải lúc nào cũng cứu, có lúc phải restart Windows. Plan B: chỉ Docker DB, code local `npm run dev` cho hot reload + tránh rebuild Docker liên tục.

2. **Edit/Write tool ăn 6KB+ file** (golden rule lặp lại 5 lần phiên này) — luôn dùng `bash heredoc` cho file lớn, hoặc Python script + `cp`. Đặc biệt với api.ts, schema.prisma, contentItems.ts > 500 dòng.

3. **DB drift Prisma** — `prisma db push` báo "constraint already exists" thường, dùng raw SQL `ALTER TABLE IF NOT EXISTS` thay vì force-reset (mất data).

4. **Schema mới → restart backend Docker** để Prisma client trong container biết enum mới. Nếu chỉ generate trên host Windows, container vẫn dùng client cũ.

5. **PowerShell escape ` `$` ` và `\"`** — chạy interactive psql thay vì inline `-c` cho SQL phức tạp. Hoặc viết file `.ts` riêng dùng Prisma client thay vì pipe SQL.

### Backup nhắc nhở (RULE từ giờ)

Mỗi cuối phiên CODE LỚN (rewrite >100 dòng, schema migration, hoặc trước rebuild Docker):
```bash
cd D:\BOTHUOCLA\sol-widget
docker exec sol-widget-db-1 pg_dump -U sol -d sol --no-owner --no-acl > backups\sol-YYYY-MM-DD.sql
powershell Compress-Archive -Path backups\sol-YYYY-MM-DD.sql -DestinationPath backups\sol-YYYY-MM-DD.zip -Force
del backups\sol-YYYY-MM-DD.sql
```

→ Khi Docker chết / DB drift / human error → restore 1 lệnh.

### TODO phiên sau

- [ ] **Phase 5c** — Admin `/admin/notifications` dashboard (cần data 7 ngày để build)
- [ ] **Phase 6** — Smart anti-spam (counter consecutiveUnopened)
- [ ] **POST /admin/content schema add moment field** — hiện workaround qua PATCH sau create
- [ ] **Test Phase 5 e2e** — set test user vào COFFEE_MORNING 07:30 → đợi 15 phút → verify Notification có row mới với metadata.moment='COFFEE_MORNING'
- [ ] **Onboarding step 4** — UI khai báo moments (skip-able) lúc lần đầu setup
- [ ] **VAPID keys** — generate qua `npx web-push generate-vapid-keys`, paste .env, restart → push thật
- [ ] **Ghi chú Khang biên tập tay** — voice "cá nhân" cho 5 ngày quan trọng (Day 1, 3, 7, 14, 30) — em chỉ làm first draft, Khang phải replace với stories thật

### KPI cuối phiên

- 127 ContentItem trong DB, 6 KHANG_SOL voice + 121 SOL_DONG_HANH (theo arc)
- 12 cron jobs active (11 fix + 1 smart sweep)
- 8 admin content endpoint
- TS clean cả 3 (backend, frontend, dashboard) trên Windows
- Bug critical fixed: 7
- File NEW: 18
- File modified: 13
- Total lines new code: ~3000+
- Docs new: ~1400 dòng


---

## Delta 14 — PIVOT 3-Stage Behavior Journey (2026-05-04 cuối ngày)

### Điều quan trọng nhất

**SOL không phải chương trình 30 ngày cố định nữa**. Sau khi R&D phân tích lại quá trình cai thực tế ở VN 45+, đã chốt:

**SOL là hệ điều hành hành vi 3 giai đoạn (7·21·7)**:
- Stage 1 — Nhận thức (7 ngày): user vẫn hút bình thường, observe + log + soft intervention
- Stage 2 — Hành động (21 ngày): tapering FIXED+ADAPTIVE (-30%/-60%/≤2/ngày)
- Stage 3 — Giải phóng (7 ngày): ổn định ≤2 hoặc 0

→ Adaptive total, không fixed timeline.

### Khác biệt với Allen Carr cold turkey

70% người 45+ Việt không cold turkey thành công. Tapering + gating phù hợp văn hoá hơn.

### File mới

- `docs/STAGE_JOURNEY_DESIGN.md` (816 dòng) — full spec dev-ready: schema, API contract, event tracking, content migration plan, pricing, roadmap Phase 7-13

### Schema impact (Phase 7 sẽ build)

Models mới:
- `CigaretteLog` — log mỗi điếu user hút (timestamp, trigger, context)
- `DailyProgress` — đếm điếu vs target + relapse flag mỗi ngày
- `StageTransition` — track mỗi lần user qua gate
- `BypassQuiz` — quiz để skip Stage 1
- `Event` — 12 event type cho analytics

Enum mới: JourneyStage (5 giá trị), TriggerCategory, RelapseFlag

User extend: currentStage, stageStartedAt, stageProgress, baseline*

ContentItem extend: stage (replace dayNumber 1-30 semantics), weekInStage

### Pricing chốt

- **Free** — Stage 1 only (acquisition)
- **Khởi Động 89k 1-time** — Stage 1+2 (28 ngày, conversion entry)
- **Trọn Vẹn 149k/tháng** — All 3 stages + AI + cohort + multi-vertical (retention)
- **Đại Sứ** — free sau success (loyalty)

Free preview Stage 2-3: KHÔNG full content, chỉ 1 locked screen demo.

### Brand chốt mới

- ✅ "Đi Cùng Sol — 3 Giai đoạn thay đổi hành vi (7·21·7)"
- ✅ "Nhận thức · Hành động · Giải phóng"
- ❌ KHÔNG dùng "30 ngày" / "Day 1-30" nữa

### Migration risk

127 ContentItem hiện tại dùng dayNumber 1-30 → cần re-tag theo stage:
- Day 1-7 → Stage 1
- Day 8-28 → Stage 2 Week 1/2/3
- Day 29-30 → Stage 3 partial (cần viết thêm 5 ngày Stage 3)

Existing user `test@sol.vn` Day 14 → migrate Stage 2 Week 1.

### Roadmap 7 phase mới (Phase 7-13)

| Phase | Scope | Time |
|-------|-------|------|
| Phase 7 | Schema migration + core API | 4-5h |
| Phase 8 | Worker logic update | 3-4h |
| Phase 9 | Frontend widget (CigaretteLogger, TaperingTarget, Onboarding quiz) | 4-5h |
| Phase 10 | Admin dashboard /admin/journey + content filter stage | 3-4h |
| Phase 11 | Content rewrite (Khang time) | 8-12h |
| Phase 12 | Pricing tier migration | 2-3h |
| Phase 13 | Event tracking + analytics | 3-4h |

Total ~25-30h em build chia 5-7 phiên + ~10h Khang content.

### Outstanding NGAY

- [ ] Anh chạy lệnh backup DB + git commit (đã guide)
- [ ] Phiên sau anh approve checklist 7 điểm trong STAGE_JOURNEY_DESIGN.md Section 16
- [ ] Em execute Phase 7 (schema + core API) phiên sau


### Update 2 (cuối phiên 2026-05-04) — Widget Architecture pivot

R&D gửi tiếp tư vấn architecture pattern: **state-based dynamic dashboard** thay multi-view route-based. Triết lý:

> **"Sol không phải web/app có nhiều màn hình. Sol là một màn hình thay đổi theo hành vi người dùng."**

Append vào `STAGE_JOURNEY_DESIGN.md` Section 18 (300 dòng new) — full spec:

- AppShell + Dashboard resolver theo `userLevel`
- 4 dashboard variants: FreeDashboard, AwarenessDashboard (SOL_7), ActionDashboard (SOL_21), FreedomDashboard (SOL_35)
- Mapping `currentStage` (DB) → `UserLevel` (UI)
- Behavior score formula (0-100, input cho auto-adjust)
- 11 shared components (ProgressBar, StreakCard, TriggerList, InsightCard, DelayTracker, CravingMeter, StabilityScore, BeforeAfter, PatternChart, ComparisonChart, CigaretteLogger)
- UnifiedComposer (always-on chat input) + ContextualSheet (modal slide-up)
- Mockup ASCII của 4 dashboard variant

**Scope Phase 9 tăng**: 4-5h → 10h (chia 2 phiên).

**Refactor impact**: 7+ existing view (HomeView, JourneyView, etc.) → deprecate hoặc convert thành section. Soft launch qua feature flag `USE_NEW_DASHBOARD` cho 5 user pre-sell test trước.

**Task list bổ sung**: #57 — Phase 9 state-based widget dashboard.

