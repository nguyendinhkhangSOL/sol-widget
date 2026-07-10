# Huongdi.sol.vn — Consistency Audit Report

**Date:** 2026-07-07
**Auditor:** Claude (Opus 4.7) subagent
**Scope:** `C:\BOTHUOCLA\sol-ecosystem\huongdi-public\` (excluding `node_modules/`)
**Reference docs:**
- `docs/03-DESIGN-DECISIONS.md` ADR-001 — Auth pages KHÔNG include sol-ui.js + sol-user-nav.js
- `docs/04-CANONICAL-VERSIONS.md` — Canonical versions registry

---

## Executive Summary

- **Total pages audited:** 35 HTML files
- **Total shared JS files:** 8 (root: 4, `/js/`: 4; sol-auth.js **duplicated byte-identical** across two paths)
- **CSS files:** 1 (`css/style.css`)
- **Header/Footer inconsistencies:** 5 pages missing sol-ui.js when they should have it
- **Auth pages violating ADR-001:** 0 (all 7 auth-flow pages correctly omit sol-ui + sol-user-nav) — good baseline
- **Legacy V1 duplicate pages to delete:** 3 (`login.html`, `dashboard.html`, `activate.html`)
- **Design system split:** 3 palette systems co-exist (v1 green `#1a6b4a`, v1.5 purple `#6c63ff`, v2 amber `#F59E0B`+navy `#0F172A`)
- **Duplicate JS load risk:** 1 file has broken cache-buster URL (`?v=1783154731"?v=202607041519`) — 3 pages affected
- **Cache-buster inconsistency:** sol-user-nav.js loaded with 2 different versions (`?v=3` vs `?v=1783225472`)

---

## Section 1: All HTML pages inventory

Classification per ADR-001:
- **A** = Landing/Content — SHOULD have sol-ui.js + sol-user-nav.js
- **B** = Auth flow — SHOULD NOT have sol-ui.js + sol-user-nav.js (only auth JS)
- **C** = Post-login (dashboard, tài khoản) — SHOULD have sol-ui.js + sol-user-nav.js
- **L** = LEGACY — should be deleted

| # | Page | Category | sol-ui | sol-user-nav | sol-auth | sol-api-sync | sol-flow | sol-avatar | Compliance |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/index.html` | A | YES | YES `?v=3` | - | - | - | (auto via sol-ui) | OK |
| 2 | `/founder/index.html` | A | YES | YES `?v=3` | - | - | - | (auto) | OK |
| 3 | `/pricing/index.html` | A | YES | **NO** | - | - | - | (auto) | MISSING sol-user-nav |
| 4 | `/lien-he/index.html` | A | YES | YES `?v=1783225472` | - | - | - | (auto) | Stale cache-buster |
| 5 | `/prompts/index.html` | A | **NO** | YES `?v=3` | - | - | - | - | MISSING sol-ui (no header/footer) |
| 6 | `/prompts-studio/index.html` | A | **NO** | YES `?v=3` | - | - | - | - | MISSING sol-ui |
| 7 | `/ai-studio/index.html` | A | YES defer | **NO** | - | - | - | (auto) | MISSING sol-user-nav |
| 8 | `/kham-pha-ban-than/index.html` | A (Bước 1) | YES | YES `?v=1783225472` | root `?v=…"?v=…` | YES | YES | (auto) | BROKEN URL + stale cache |
| 9 | `/kiem-ke-nguon-luc/index.html` | A (Bước 2) | YES | YES `?v=1783225472` | root broken URL | YES | YES | (auto) | BROKEN URL |
| 10 | `/la-ban-huong-di/index.html` | A (Bước 3) | YES | YES `?v=1783225472` | root broken URL | YES | YES | (auto) | BROKEN URL |
| 11 | `/p1.html` | A/legacy | **NO** | YES `?v=1783225472` | `/js/` | YES | YES | - | MISSING sol-ui (green palette, v1) |
| 12 | `/p2.html` | A/legacy | **NO** | YES `?v=1783225472` | `/js/` | YES | YES | - | MISSING sol-ui (v1) |
| 13 | `/p3.html` | A/legacy | **NO** | YES `?v=1783225472` | `/js/` | YES | YES | - | MISSING sol-ui (v1) |
| 14 | `/p3-chuyenmon.html` | A | YES | **NO** | - | - | YES | (auto) | MISSING sol-user-nav |
| 15 | `/p3-daily.html` | A | YES | **NO** | - | - | YES | (auto) | MISSING sol-user-nav |
| 16 | `/p3-daotao.html` | A | YES | **NO** | - | - | YES | (auto) | MISSING sol-user-nav |
| 17 | `/p3-dauthu.html` | A | YES | **NO** | - | - | YES | (auto) | MISSING sol-user-nav |
| 18 | `/p3-dichvu.html` | A | YES | **NO** | - | - | YES | (auto) | MISSING sol-user-nav |
| 19 | `/p3-kinhdoanh.html` | A | YES | **NO** | - | - | YES | (auto) | MISSING sol-user-nav |
| 20 | `/p3-noidungso.html` | A | YES | **NO** | - | - | YES | (auto) | MISSING sol-user-nav |
| 21 | `/dang-nhap/index.html` | **B** | NO | NO | NO | NO | NO | NO | OK (compliant ADR-001) |
| 22 | `/dang-ky/index.html` | **B** | NO | NO | NO | NO | NO | NO | OK |
| 23 | `/dang-xuat/index.html` | **B** | NO | NO | NO | NO | NO | NO | OK |
| 24 | `/kich-hoat/index.html` | **B** | NO | NO | NO | NO | NO | NO | OK |
| 25 | `/quen-mat-khau/index.html` | **B** | NO | NO | NO | NO | NO | NO | OK |
| 26 | `/dat-lai-mat-khau/index.html` | **B** | NO | NO | NO | NO | NO | NO | OK |
| 27 | `/thanh-toan/index.html` | **B** | NO | NO | NO | NO | NO | NO | OK (register-first inline guard) |
| 28 | `/tai-khoan/index.html` | **C** | **NO** | **NO** | - | - | - | - | MISSING both (should have header+footer) |
| 29 | `/toi/index.html` | **C** | **NO** | YES `?v=3` | - | - | - | - | MISSING sol-ui |
| 30 | `/toi/ban-do/index.html` | **C** | **NO** | YES `?v=3` | - | - | - | - | MISSING sol-ui |
| 31 | `/toi/so-hanh-trinh/index.html` | **C** | **NO** | YES `?v=3` | - | - | - | - | MISSING sol-ui |
| 32 | `/toi/sol-dong-hanh/index.html` | **C** | **NO** | YES `?v=3` | - | - | - | - | MISSING sol-ui |
| 33 | `/login.html` | **L** | NO | NO | NO | NO | NO | NO | DELETE (V1 purple #6c63ff) |
| 34 | `/dashboard.html` | **L** | NO | NO | NO | NO | NO | NO | DELETE (V1 purple) |
| 35 | `/activate.html` | **L** | YES | NO | NO | NO | YES | (auto) | DELETE (V1 purple, superseded by `/kich-hoat/`) |

---

## Section 2: Header/Footer inconsistencies

### Category A pages MISSING sol-ui.js (no header/footer):
- `/prompts/index.html`
- `/prompts-studio/index.html`
- `/p1.html`, `/p2.html`, `/p3.html` (legacy green-palette pages)

### Category A pages MISSING sol-user-nav.js (no user pill/login CTA in header):
- `/pricing/index.html`
- `/ai-studio/index.html`
- `/p3-chuyenmon.html`, `/p3-daily.html`, `/p3-daotao.html`, `/p3-dauthu.html`, `/p3-dichvu.html`, `/p3-kinhdoanh.html`, `/p3-noidungso.html` (all 7 P3 variants)

### Category C (post-login) pages MISSING sol-ui.js:
- `/tai-khoan/index.html` (also missing sol-user-nav.js — completely bare)
- `/toi/index.html`
- `/toi/ban-do/index.html`
- `/toi/so-hanh-trinh/index.html`
- `/toi/sol-dong-hanh/index.html`

**Impact:** Post-login users see no unified header/footer on their own dashboard — jarring UX handoff from landing → dashboard.

### Broken cache-buster URL (double `?v=`):
```
<script src="/sol-auth.js?v=1783154731"?v=202607041519></script>
                                     ^-- second ?v= is a URL syntax mistake
```
Present in 3 files:
- `kham-pha-ban-than/index.html:865`
- `kiem-ke-nguon-luc/index.html:939`
- `la-ban-huong-di/index.html:464`

The trailing `"?v=202607041519` becomes a boolean attribute on the `<script>` tag — browsers ignore it, so the script still loads. But the intended cache-bust doesn't work. Cosmetic + confusing.

### Cache-buster version mismatch on sol-user-nav.js:
- New pages use `?v=3` (index, founder, prompts, prompts-studio, toi/*)
- Old pages use `?v=1783225472` (lien-he, kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di, prompts, p1/p2/p3)

The file itself is a single canonical version at `/js/sol-user-nav.js`. Version tags are just cache-busts — mismatch means some browsers cache old copies briefly. Not a bug, but should be normalized.

---

## Section 3: Auth flow pages audit

Reference: ADR-001 (auth pages must NOT include sol-ui.js / sol-user-nav.js).

### `/dang-nhap/` — Login
- Palette: `--gold: #C9A961`, `--dark: #0f1419` — **OFF-CANONICAL** (should be amber `#F59E0B` + navy `#0F172A`)
- Font: system fallback — **MISSING Inter+Lora**
- API: `POST {API_BASE}/auth/login-v2` where `API_BASE = window.SOL_API_BASE || 'https://huongdi.sol.vn/api'`
- Post-login: writes `sol_jwt`, `sol_user`, `sol_active`, `sol_tier` to localStorage; POSTs `/user/link-session` if `sol_session_id` present
- Redirect: `location.href = '/toi/'` after 600ms
- ADR-001 compliance: OK (no shared scripts)

### `/dang-ky/` — Register
- Palette: same gold `#C9A961` / dark `#0f1419` as dang-nhap — off-canonical
- Font: system fallback
- API: `POST {API_BASE}/user/register`
- Redirect: `/la-ban-huong-di/` or `/kham-pha-ban-than/` (conditional on merged progress)
- ADR-001 compliance: OK

### `/dang-xuat/` — Logout
- Palette: inline hex only, **uses canonical `#F59E0B` + `#0F172A`** ✓
- Font: system fallback
- API: none (client-side clear)
- Redirect: `/dang-nhap/` after 1s
- ADR-001 compliance: OK
- Note: does NOT match dang-nhap/dang-ky visual style (they still use gold `#C9A961`)

### `/kich-hoat/` — Activation
- Palette: full `--amber-500..700` + `--navy` — **CANONICAL** ✓
- Font: Inter mentioned but not Google-loaded, only system fallback
- API: `GET /api/activate?token=`, `POST /api/activate/set-password`
- Redirect: `/dang-nhap/` (already activated) or `/toi/` (success)
- ADR-001 compliance: OK

### `/quen-mat-khau/` — Forgot Password
- Palette: full `--amber`/`--navy` — **CANONICAL** ✓
- Font: system fallback
- API: `POST {API_BASE}/auth/forgot-password`
- ADR-001 compliance: OK

### `/dat-lai-mat-khau/` — Reset Password
- Palette: canonical amber+navy ✓
- Font: system fallback
- API: `GET /auth/verify-reset-token/{token}`, `POST /auth/reset-password`
- Redirect: `/dang-nhap/` after 2s success
- ADR-001 compliance: OK

### `/thanh-toan/` — Payment (see Section 4)

### Inconsistencies:
1. **dang-nhap + dang-ky use gold `#C9A961`**, not canonical amber `#F59E0B`. Every other auth page migrated. These 2 pages are visually stale.
2. **Fonts:** none of the auth pages Google-load Inter+Lora. Only tai-khoan does. Inconsistent with landing pages.
3. **Error handling:** each page rolls its own `.msg.error` / `.msg.success` div — no shared component.

---

## Section 4: Payment flow audit — `/thanh-toan/`

### Register-first enforcement:
YES. Inline IIFE at top of body (lines 310-322) reads `sol_jwt` + `sol_user` from localStorage; if missing → `location.replace('/dang-nhap/?next=/thanh-toan/&reason=payment_required')`.

### API calls:
- `POST /api/leads` on form submit (with Bearer JWT if present)
- `GET /api/user/check-email` on email blur (duplicate-check UX)
- 409 `ACCOUNT_EXISTS` → shows auth modal forcing login
- **NO** `/api/user/register` call — payment does not register; it creates a "lead" only
- **NO** `/api/orders` call — bank transfer flow, not order-creating

### Bank info (hard-coded):
- Bank: **Techcombank** (`tcb`)
- Account: **11522026076011**
- Holder: **CONG TY CO PHAN VINET**
- Located: lines 442-448 (JS config), 525-531 (rendered display)
- VietQR URL: `https://img.vietqr.io/image/tcb-{account}-compact2.png?amount={amount}&addInfo={memo}&accountName={name}`

### Countdown timer:
`timeoutMinutes: 30` (line 537). Countdown turns red at <5 min remaining (line 830).

### ADR-003 compliance (payment on huongdi.sol.vn, not sol.vn):
YES. All URLs relative. No `sol.vn` hardcoded in payment logic. Only external hosts: `zalo.me/0912727381`, `img.vietqr.io`, Google Fonts, Cloudflare beacon.
Only stray sol.vn ref: commented-out `hello@sol.vn` at line 872.

### ADR-004 (unified auth):
YES. Uses same `sol_jwt` + `sol_user` localStorage keys as dang-nhap/toi. Consistent with unified auth model.

### Palette + font:
Full amber-50..700 + navy-50..900 tokens. Inter body + Lora headings (Google-loaded). **CANONICAL** ✓

### ADR-001 compliance:
OK — no sol-ui.js / sol-user-nav.js loaded (correctly, as it's a checkout-style page).

---

## Section 5: CSS consistency

### Files:
- `/css/style.css` — 32 KB canonical design system (defined on `:root`)
  - Amber scale `--color-amber-50..900` (500 = `#F59E0B`, 600 = `#D97706`)
  - Navy scale `--color-navy-50..900` (900 = `#0F172A`)
  - Semantic: `--color-bg`, `--color-text`, `--color-border`, `--color-success`, `--color-warning`
  - Fonts: `--font-sans: 'Inter'`, `--font-serif: 'Lora'`, `--font-mono: 'SF Mono'`
  - Spacing 1..24, radius sm..full, shadows sm/md/lg/xl/amber, ease timings, `--container-max: 1200px`
  - Injected by `sol-ui.js` (`<link href="/css/style.css">` on line 20)

### Which pages use style.css:
Only pages that load `sol-ui.js` get style.css (auto-injected). Pages without sol-ui.js (auth pages, prompts, prompts-studio, p1/p2/p3, tai-khoan, toi/*) do NOT load the design system CSS → each rolls its own inline palette → **fragmentation**.

### Inline styles > 50 lines:
- `dang-ky/index.html` ~63 lines
- `kich-hoat/index.html` ~97 lines
- `tai-khoan/index.html` ~213 lines (largest — full palette redefined)
- `toi/index.html` ~116 lines
- `thanh-toan/index.html` ~massive (full page inline)
- All `p3-*.html` variants have inline styles

### Palette variables — where defined:
| Location | `--amber-500` | `--navy-900` |
|---|---|---|
| `css/style.css` | `--color-amber-500: #f59e0b` | `--color-navy-900: #0f172a` |
| `kich-hoat` inline | `--amber-500: #F59E0B` | `--navy: #0F172A` |
| `quen-mat-khau` inline | `--amber: #F59E0B` | `--navy: #0F172A` |
| `dat-lai-mat-khau` inline | `--amber: #F59E0B` | `--navy: #0F172A` |
| `tai-khoan` inline | full amber-50..700 scale | full navy-50..900 scale |
| `toi/index.html` inline | `--amber: #F59E0B` | `--navy: #0F172A` |
| `thanh-toan` inline | full scale | full scale |
| **`dang-nhap`** inline | **`--gold: #C9A961`** ← WRONG | **`--dark: #0f1419`** ← WRONG |
| **`dang-ky`** inline | **`--gold: #C9A961`** ← WRONG | **`--dark: #0f1419`** ← WRONG |
| **`login.html`** (legacy) | `--accent: #6c63ff` (purple) | `--bg: #090d1a` |
| **`dashboard.html`** (legacy) | `--accent: #6c63ff` | `--bg: #090d1a` |
| **`activate.html`** (legacy) | `--accent: #6c63ff` | `--bg: #0b0f1a` |

### Font imports (Google Fonts):
- Loaded via `sol-ui.js` when it injects `<link>` for style.css
- Redundantly loaded inline in: `tai-khoan/index.html`, `thanh-toan/index.html`, all landing pages that add their own preconnect (harmless dup but bloats HTML)
- Auth pages (dang-nhap, dang-ky, kich-hoat, quen-mat-khau, dat-lai-mat-khau, dang-xuat) DO NOT load Inter+Lora → fall back to system font → visual mismatch with rest of site

---

## Section 6: JS files map

### File inventory:
| Path | Size | Purpose | Loaded by |
|---|---|---|---|
| `/sol-ui.js` | 15,649 B | Header + footer + auto-load avatar-icon | Most category A + C pages (see table §1) |
| `/sol-avatar-icon.js` | 10,910 B | Legacy V1.2 floating avatar bottom-right | Auto-loaded by sol-ui.js |
| `/sol-flow.js` | 15,743 B | P1/P2/P3 progress strip + summary cards | kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di, p1/p2/p3*, activate.html |
| `/sol-auth.js` | 10,453 B | V2 paywall + tier gate | kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di (root path) |
| `/js/sol-auth.js` | 10,453 B | **BYTE-IDENTICAL DUPLICATE** of `/sol-auth.js` | p1, p2, p3 (js/ path) |
| `/js/sol-user-nav.js` | 14,763 B | V3 top-right user pill / login CTA | Many pages (see table §1) |
| `/js/sol-api-sync.js` | 12,403 B | POST results + events to backend | kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di, p1, p2, p3 |
| `/js/app.js` | 5,051 B | Landing page interactions (smooth scroll, FAQ) | Landing pages (implicit via body class) |

### Duplication:
**`sol-auth.js` exists at 2 paths, byte-identical (md5 `05f6b7249c10c8d0e3470406c0ac0f4e`).** Different pages reference different paths:
- Root-path referrers: kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di
- /js/-path referrers: p1, p2, p3

Because they're identical, no runtime divergence today. But **any future edit must touch both files or introduce a drift bug**.

### Conflicts:
- `sol-avatar-icon.js` (bottom-right avatar) + `sol-user-nav.js` (top-right pill) create **two competing account UIs** on any page that loads both.
- Avatar-icon reads legacy keys (`sol_tier`, `sol_active`, `sol_founder`, `sol_ten`).
- User-nav reads new keys (`sol_jwt`, `sol_user`).
- sol-ui.js auto-loads avatar-icon unconditionally → every landing page with sol-user-nav.js shows both widgets.

### Hard-coded hotline `024.3993.1800`:
Only in `sol-ui.js:183` (footer contact strip). No JS file has bank info.

---

## Section 7: Version indicators

### Copyright year:
- Landing pages, auth pages, dashboard pages: **NO explicit copyright year in HTML** (footer year injected by sol-ui.js, but sol-ui.js also has no year literal — need to verify)
- `p3-daotao.html`, `p3-noidungso.html`: **2024** (stale)
- `p3-kinhdoanh.html`: **2025**
- `p1.html`, `p2.html`: **2025-2026**
- Others: none found

### Hotline `024.3993.1800`:
Present in: `sol-ui.js` (footer, all pages that inject sol-ui) + `lien-he/index.html` (6 places)
NOT present in: any other HTML page directly, any JS other than sol-ui.js
→ Every page that has sol-ui.js gets the hotline for free.
→ Pages MISSING sol-ui.js (prompts, prompts-studio, p1/p2/p3, tai-khoan, toi/*, auth pages) show NO hotline anywhere.

### Bank info `Vinet Techcombank 11522026076011`:
Only in `/thanh-toan/index.html`. Confirmed single source of truth. Good.

Company MST `0104127836` (VINET): appears in `sol-ui.js` footer + `lien-he/index.html`. Consistent.

### Design system version comments in code:
- sol-auth.js header: "v2.0 — 2026-07-05"
- sol-user-nav.js: "v3" cache-buster in most pages
- sol-avatar-icon.js: no explicit version string; described as V1.2 in ecosystem docs
- No `V4.1`, `v3`, `v2.2` markers found in HTML comments during grep

---

## Section 8: FIX PLAN (Prioritized)

### P0 — Critical (production bugs / user-facing broken UX)

#### P0.1 — Fix broken cache-buster URL on 3 flow pages
**File(s):** `kham-pha-ban-than/index.html:865`, `kiem-ke-nguon-luc/index.html:939`, `la-ban-huong-di/index.html:464`
**Change:** Remove trailing `"?v=202607041519` after the closing quote:
```html
<!-- BEFORE (broken) -->
<script src="/sol-auth.js?v=1783154731"?v=202607041519></script>
<!-- AFTER -->
<script src="/sol-auth.js?v=202607041519"></script>
```
**Effort:** 5 min (3 sed replaces)
**Risk:** low — HTML syntax fix, script still loads today.

#### P0.2 — Post-login pages (`/tai-khoan/`, `/toi/*`) missing header/footer
**Files:** `tai-khoan/index.html`, `toi/index.html`, `toi/ban-do/index.html`, `toi/so-hanh-trinh/index.html`, `toi/sol-dong-hanh/index.html`
**Change:** Add `<script src="/sol-ui.js" defer></script>` before `</body>` (they already have sol-user-nav where applicable; tai-khoan needs both).
**Impact:** Currently logged-in users see a bare dashboard with no site header/footer — jarring inconsistency vs landing pages.
**Effort:** 10 min (5 files × 1 line each)
**Risk:** low — sol-ui.js is idempotent; possible visual overlap with existing inline dashboard chrome — verify no double header.

#### P0.3 — Delete legacy V1 duplicate pages
**Files:** `login.html`, `dashboard.html`, `activate.html` (root)
**Rationale:** All 3 use abandoned purple `#6c63ff` V1 palette. Vietnamese-slug canonical replacements exist and are wired to current auth: `/dang-nhap/`, `/tai-khoan/`, `/kich-hoat/`. Redirects in `kich-hoat` + `dat-lai-mat-khau` already point to Vietnamese slugs.
**Risk before delete:** Grep production access logs for any hits on `/login.html`, `/dashboard.html`, `/activate.html` — old bookmarks may still reference them. If any hits, add 301 redirects instead of hard delete.
**Effort:** 15 min (grep logs + delete or redirect)

### P1 — High (ADR violations, design system fragmentation)

#### P1.1 — Migrate `/dang-nhap/` + `/dang-ky/` off gold `#C9A961` palette to canonical amber
**Files:** `dang-nhap/index.html`, `dang-ky/index.html`
**Change:** Replace `--gold: #C9A961; --dark: #0f1419;` etc. with canonical `--amber: #F59E0B; --navy: #0F172A;` matching the other auth pages (quen-mat-khau, dat-lai-mat-khau, kich-hoat).
**Effort:** 30-45 min (careful CSS variable rename + visual QA)
**Risk:** medium — biggest brand touchpoint (login form). Ship with A/B check.

#### P1.2 — Load Inter+Lora on auth pages
**Files:** All 6 auth pages (dang-nhap, dang-ky, dang-xuat, kich-hoat, quen-mat-khau, dat-lai-mat-khau)
**Change:** Add Google Fonts preconnect + link in `<head>` matching landing pages, OR extract to a lightweight `/css/auth.css` that auth pages can share.
**Effort:** 20 min
**Risk:** low

#### P1.3 — Fix sol-avatar-icon.js + sol-user-nav.js conflict (double account UI)
**Files:** `sol-ui.js` (currently auto-loads avatar-icon)
**Change:** Stop auto-loading `sol-avatar-icon.js` from sol-ui.js. Since canonical account UI is now `sol-user-nav.js` (top-right pill), the bottom-right avatar V1.2 widget is redundant.
**Effort:** 10 min edit + 30 min visual QA all pages
**Risk:** medium — Some pages rely on avatar dropdown that user-nav does not replicate 1:1 (verify feature parity: tier badge, "Nâng cấp" CTA, logout).
**Fallback:** If sol-user-nav.js doesn't cover all avatar-icon menu items, patch user-nav first, then remove avatar-icon.

#### P1.4 — Category A landing pages MISSING sol-ui.js
**Files:** `prompts/index.html`, `prompts-studio/index.html`, `p1.html`, `p2.html`, `p3.html`
**Change:** Add `<script src="/sol-ui.js" defer></script>`.
**Note on p1/p2/p3:** These 3 use v1 green `#1a6b4a` palette — adding sol-ui.js will layer amber header/footer on a green page. Design decision needed: (a) migrate palette too, or (b) keep them out of sol-ui and add manual mini-header. Recommend (b) if these are being retired.
**Effort:** 15 min for prompts/prompts-studio; p1/p2/p3 needs design call.
**Risk:** low for prompts, medium for p1-3.

### P2 — Medium (cleanup, DX)

#### P2.1 — Consolidate duplicate `sol-auth.js`
**Files:** `sol-auth.js` (root) + `js/sol-auth.js`
**Change:** Keep single canonical file at `/js/sol-auth.js`. Update the 3 root-referrers (kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di) to reference `/js/sol-auth.js`. Delete root `/sol-auth.js` OR leave as redirect via server (nginx `try_files`).
**Effort:** 15 min
**Risk:** low (byte-identical files)

#### P2.2 — Category A pages MISSING sol-user-nav.js
**Files:** `pricing/index.html`, `ai-studio/index.html`, all 7 `p3-*.html` variants
**Change:** Add `<script src="/js/sol-user-nav.js?v=3" async></script>`.
**Impact:** Without user-nav, logged-in users see no "Xin chào [tên]" pill and no "Đăng nhập" CTA on these pages.
**Effort:** 10 min
**Risk:** low

#### P2.3 — Normalize sol-user-nav.js cache-buster to `?v=3`
**Files:** All pages currently using `?v=1783225472` (lien-he, kham-pha-ban-than, kiem-ke-nguon-luc, la-ban-huong-di, prompts, p1/p2/p3)
**Change:** `sed` replace `?v=1783225472` → `?v=3` across those files.
**Effort:** 5 min
**Risk:** none

#### P2.4 — Establish CANONICAL registry link
The document `docs/04-CANONICAL-VERSIONS.md` should explicitly enumerate:
- sol-ui.js current version (byte-hash or timestamp)
- sol-user-nav.js current version
- sol-auth.js current version
- css/style.css current version
So future edits update one registry file and cache-buster propagates from there.
**Effort:** 30 min (doc + optional build script)

### P3 — Low (naming consistency, docs)

#### P3.1 — Update stale copyright years on p3-daotao, p3-noidungso (2024 → 2026)
**Files:** `p3-daotao.html`, `p3-noidungso.html`
**Effort:** 2 min

#### P3.2 — Rename english-named p1/p2/p3 to Vietnamese slugs
Long-term: `/p1.html` → `/buoc-1/`, `/p2.html` → `/buoc-2/`, `/p3.html` → `/buoc-3/` for consistency with the Vietnamese-slug pattern used elsewhere. Requires 301 redirects + SEO consideration.
**Effort:** 2 hr including redirects + link updates
**Risk:** medium (SEO)

#### P3.3 — Extract inline styles from thanh-toan, tai-khoan into shared CSS
Both pages carry >100 lines of inline styles that overlap with `css/style.css`. Refactor to use design system tokens.
**Effort:** 1 hr per page

---

## Summary matrix — what to fix first

| Priority | Item | Files | Effort | Blast radius |
|---|---|---|---|---|
| **P0.1** | Broken cache-buster URL | 3 | 5 min | 3 flow pages (Bước 1/2/3) |
| **P0.2** | Post-login missing header/footer | 5 | 10 min | Entire logged-in UX |
| **P0.3** | Delete legacy login.html/dashboard.html/activate.html | 3 | 15 min | Reduces confusion |
| **P1.1** | dang-nhap/dang-ky gold → amber | 2 | 45 min | Brand consistency |
| **P1.2** | Auth pages Inter+Lora | 6 | 20 min | Typography consistency |
| **P1.3** | Kill avatar-icon vs user-nav conflict | 1 (sol-ui.js) | 40 min | All landing + product pages |
| **P1.4** | Category A missing sol-ui.js | 5 | 30 min | Site chrome consistency |
| **P2.x** | Cleanup + dedup | multiple | 1 hr total | DX |
| **P3.x** | Copyright, slugs, inline CSS | multiple | 3 hr | Polish |

---

## Assumptions & caveats

- Audit is static-only (file inspection). Runtime behavior not verified via browser.
- ADR-001/003/004 semantics inferred from summary in prompt — the actual ADR files were not re-read here to validate wording.
- Some inline styles are so large that a full palette-token audit would need a second pass — the scan above is by grep, not by AST parse.
- `sol-ui.js` copyright year was not directly verified in this pass (out of time budget); check `sol-ui.js` line ~183+ for the footer template.
- No production access logs were consulted — the "delete legacy pages" step should be gated on log grep first.

---

*End of report.*
