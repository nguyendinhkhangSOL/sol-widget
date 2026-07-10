# Sol Ecosystem — Canonical Versions Registry

**Version:** 1.0
**Last updated:** 2026-07-07
**Source:** VERSION-AUDIT-REPORT.md (audit 2026-07-07)

**Nguyên tắc:** Mỗi component có 1 file "canonical" duy nhất. Files khác cùng tên → xoá hoặc rename.

Trước khi vá bug: xem canonical path ở đây, KHÔNG vá bản khác.

---

## Frontend components

### `sol-ui.js` (Header + Footer navigation)

**Canonical:** `huongdi-public/sol-ui.js`
**Purpose:** Inject header nav + footer vào mọi trang không phải auth flow

**Duplicates cần xoá:**
- `huongdi-backend/sol-ui.js` (stale, thiếu AI Studio menu + embed skip)
- Bất kỳ copy nào khác trong repo

**Rule:**
- Include: `<script src="/sol-ui.js" defer></script>`
- Skip trên: auth pages (ADR-001), iframe embed (query `?embed=1`)

---

### `sol-user-nav.js` (Login pill widget V3)

**Canonical:** `huongdi-public/js/sol-user-nav.js`
**Purpose:** Login pill top-right, hiện email + logout khi logged in

**Duplicates cần xoá:**
- Root level `huongdi-public/sol-user-nav.js` (nếu có)
- Legacy V1.2 versions

**Rule:**
- Include: `<script src="/js/sol-user-nav.js" defer></script>`
- Skip trên: auth pages (ADR-001), iframe embed

---

### `sol-avatar-icon.js` (LEGACY — planned deletion)

**Status:** ⚠️ Legacy V1.2, sẽ xoá sau Phase 3
**Current path:** `huongdi-public/sol-avatar-icon.js`
**Reason:** Lock icon design bị replace bởi sol-user-nav.js V3

**Migration:**
- Xoá reference `<script src="/sol-avatar-icon.js">` trong HTML templates
- Xoá file sau khi confirm không còn reference

---

### `sol-auth.js` (Auth token + tier detection)

**Canonical:** `huongdi-public/js/sol-auth.js`
**Purpose:** JWT check, tier gating (Free/Active/Founder), paywall trigger

**⚠️ CRITICAL SPLIT-BRAIN BUG:**
Audit tìm thấy 2 copies:
- `huongdi-public/sol-auth.js` (root — dùng bởi la-ban-huong-di, kiem-ke-nguon-luc, kham-pha-ban-than)
- `huongdi-public/js/sol-auth.js` (js folder — dùng bởi p1/p2/p3.html)

Hôm nay byte-identical, nhưng future update 1 chỗ → chỗ kia stale → bug khác nhau giữa trang.

**Fix (Phase 3):**
- Xoá root copy `huongdi-public/sol-auth.js`
- Update 3 trang legacy để dùng `/js/sol-auth.js`
- Chỉ 1 canonical `js/sol-auth.js`

---

### `sol-api-sync.js` (API wrapper)

**Canonical:** `huongdi-public/js/sol-api-sync.js`
**Purpose:** Fetch wrapper với JWT header + error handling

**No known duplicates** — Verify audit report Section 1.

---

### `sol-flow.js` (Bước 1-3 breadcrumb + progress)

**Canonical:** `huongdi-public/js/sol-flow.js`
**Purpose:** 5 Bước breadcrumb + step navigation trong trang Bước 1/2/3

**Palette:** Amber active + Navy completed (V4.1)

---

## Frontend pages

### Landing + content pages (V4.1)

**Canonical paths (huongdi.sol.vn):**
- `huongdi-public/index.html` — Homepage V4.1
- `huongdi-public/gia/index.html` — Pricing page V4.1
- `huongdi-public/thanh-toan/index.html` — Payment (moved from sol.vn)
- `huongdi-public/kham-pha-ban-than/index.html` — Bước 1
- `huongdi-public/kiem-ke-nguon-luc/index.html` — Bước 2
- `huongdi-public/la-ban-huong-di/index.html` — Bước 3
- `huongdi-public/ai-studio/index.html` — AI Studio container (iframes)
- `huongdi-public/prompts/index.html` — 40 templates
- `huongdi-public/prompts-studio/index.html` — Biên tập
- `huongdi-public/toi/index.html` — Dashboard sau login
- `huongdi-public/toi/sol-dong-hanh/index.html` — Chat AI

### Legacy pages cần 301 redirect + xoá (Phase 3)

**Frontend legacy:**
- `p1.html`, `p2.html`, `p3.html` (root) → redirect tới `/kham-pha-ban-than/`, `/kiem-ke-nguon-luc/`, `/la-ban-huong-di/`
- `p1-original.html`, `p1-old.html`, tương tự cho p2/p3
- `login.html`, `activate.html`, `dashboard.html` (dark theme legacy) — check redirect trong sol-redirects.php trước khi xoá

**Blocker:** Cần sync `solvn-wp/mu-plugins/sol-redirects.php` để biết inbound redirects nằm ở đâu. Đợi backup cPanel xong.

---

## Backend routes (Node.js `huongdi-backend/src/routes/`)

### Canonical routes (post-Refactor Sub-B)

- `user-auth.ts` — Unified register + login + orphan lead auto-link
- `leads.ts` — POST quiz Bước 1 (with `-refactored` merged in)
- `auth.ts` — Login + forgot password + reset password
- `directions.ts` — 37 mô hình list + detail + save/unsave
- `journey.ts` — Sổ Hành Trình 90 ngày
- `sol-dong-hanh.ts` — Claude API chat streaming
- `dashboard.ts` — Aggregated stats /toi/
- `p1.ts`, `p2.ts` — Bước 1/2 quiz results
- `match-v2.ts` — Matching algorithm
- `events.ts` — User activity events
- `saved.ts` — Saved directions CRUD
- `password-reset.ts` — Reset token flow
- `admin.ts` — Admin-only endpoints

### Route mount points chuẩn (index.ts)

**⚠️ Audit tìm thấy 3 double-mounts — cần fix ngay:**

- `/api/auth` mount 2 lần (password-reset bypass rate limit — LỖ HỔNG)
- `/api/user` mount 2 lần (userAuth shadow dashboardRoutes)
- `/api/directions` mount 2 lần

**Canonical mount (fix):**
```typescript
app.use('/api/auth', authRoutes);          // login, forgot, reset
app.use('/api/user', userAuthRoutes);      // register, profile
app.use('/api/leads', leadsRoutes);        // quiz Bước 1
app.use('/api/activate', activateRoutes);  // magic link
app.use('/api/directions', directionsRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/sol-dong-hanh', solDongHanhRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/p1', p1Routes);
app.use('/api/p2', p2Routes);
app.use('/api/match', matchV2Routes);
app.use('/api/events', eventsRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/admin', adminRoutes);
```

**Rule:** Mỗi mount point unique. `leads` route mount trong app setup ở TOP, KHÔNG trong `main()` sau `prisma.$connect()`.

---

## Backup files (`.bak-*`) — cần xoá

Audit tìm thấy 19 backup files (leftover từ workflow cũ trước Git):

**Cần xoá:**
- `huongdi-backend/src/routes/user-auth.ts.bak` + 2 copies identical
- `huongdi-backend/src/routes/admin.ts.bak` + 1 copy identical
- `huongdi-backend/src/index.ts.bak-cors` + 1 copy identical
- Bất kỳ file có suffix: `.bak-*`, `.bak.*`, `-original`, `-old`, `-v1`, `-v2`

**Chỉ giữ:**
- 1 canonical version của mỗi file
- Git history đã lưu tất cả versions cũ

---

## WordPress mu-plugins (sol.vn — chờ sync)

**Chưa sync** — Phase 2 kết thúc chờ sol.vn JetBackup download.

**Expected canonical:**
- `sol-default-template.php` — V3
- `sol-landing-template-v3.php` — Homepage V3
- `sol-post-template.php` — Blog posts V2.2
- `sol-user-nav.php` — Login pill inject (UTF-8 safe with Unicode escapes)
- `sol-redirects.php` — 301 redirects V4.1

**Update sau khi sync:** Fill vào file này với exact paths + versions.

---

## CSS files

### Canonical CSS

- `huongdi-public/css/main.css` (nếu tồn tại) — Global styles V4.1
- Inline styles trong mỗi HTML page — chỉ cho page-specific

**Palette V4.1 (LOCKED):**
- Primary: Amber `#F59E0B`
- Secondary: Navy `#0F172A`
- Background: White `#FFFFFF`
- Muted: Gray `#6B7280`

**Fonts:**
- Body: Inter (Google Fonts)
- Headings: Lora serif (Google Fonts)

---

## Legacy dead files (audit findings)

**Confirmed dead — safe to delete:**
- `huongdi-public/js/app.js` (zero HTML references — có vẻ là JS của sol.vn lạc vào wrong repo)
- `huongdi-public/prompts-original.html`
- `huongdi-public/prompts-studio-original.html`
- `huongdi-public/sol-dong-hanh-original.html`

(3 `-original.html` files đã xoá trong Phase 2 sync)

---

## Consolidation plan (Phase 3)

### Phase 3.1 — Xoá backup files (an toàn nhất)
- Grep `.bak-*`, `.bak.*` trong repo → xoá tất cả
- Verify Git history có snapshot
- Commit `chore: cleanup .bak leftover files`

### Phase 3.2 — Fix sol-auth.js split-brain
- Xoá `huongdi-public/sol-auth.js` (root)
- Update 3 trang dùng root → dùng `/js/sol-auth.js`
- Test 3 trang không break
- Commit `refactor: consolidate sol-auth.js — single canonical path`

### Phase 3.3 — Fix backend double-mount
- Sửa `huongdi-backend/src/index.ts` — mỗi mount point unique
- Test tất cả routes vẫn work
- Commit `fix: remove backend route double-mount (security fix)`

### Phase 3.4 — Xoá stale backend/sol-ui.js
- Xoá `huongdi-backend/sol-ui.js`
- Fix rsync script nếu reference file này
- Commit `chore: remove stale sol-ui.js from backend folder`

### Phase 3.5 — Update auth pages canonical (ADR-001)
- Rewrite `/dang-nhap/`, `/dang-ky/`, `/kich-hoat/`, `/quen-mat-khau/`, `/reset-password/` — bỏ sol-ui.js + sol-user-nav.js
- Test flow không break
- Commit `refactor: auth pages minimal (ADR-001)`

### Phase 3.6 — Legacy pages xoá (chờ solvn-wp sync)
- Check `sol-redirects.php` cho legacy paths
- Setup 301 redirects trước khi xoá physical files
- Xoá `p1.html`, `p2.html`, `p3.html`, `login.html`, `activate.html`, `dashboard.html`, `-original.html`, `-old.html`
- Commit `chore: remove legacy pages after redirect setup`
