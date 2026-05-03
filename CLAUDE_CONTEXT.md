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
