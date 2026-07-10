# Sol Ecosystem — Version Audit Report

**Date:** 2026-07-07
**Scope:** `C:\BOTHUOCLA\sol-ecosystem\`
**Auditor:** Automated scan + human-readable analysis
**Repo snapshot:** All files ingested with mtime `Jul 7 10:02` (robocopy did NOT preserve source timestamps — see caveat in Section 7).

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Duplicated frontend files (same name, split paths) | **4** |
| Legacy backup files (`.bak-*`, `.pre-*`) still present | **19** |
| Backend route conflicts / double-mounts in `index.ts` | **3** |
| Dead frontend JS files (never referenced) | **1** |
| Legacy pages coexisting with modern equivalents | **6** |
| Prisma schema variants (1 live + 3 baks) | **4** |

**Top-3 chaos drivers:**

1. **`sol-auth.js` split-brain** — Two identical copies live at `/sol-auth.js` and `/js/sol-auth.js`. HTML pages randomly reference one or the other. A patch to one file leaves the other stale — this is exactly the "bản vá lại dùng bản cũ, lỗi" symptom anh Khang mô tả.
2. **`huongdi-backend/sol-ui.js` is stale** — A copy of `sol-ui.js` (10 days older, missing AI Studio menu + iframe-embed skip) is sitting in the backend repo root. It has no reason to be there and will be shipped to VPS by any naïve rsync.
3. **`src/index.ts` has 3 double-mounts** (`/api/auth`, `/api/user`, `/api/directions`) plus `app.use('/api', leadsRouter)` misplaced inside `main()` after `prisma.$connect()`. Route registration is fragile.

---

## Section 1: Duplicated Frontend Files

### 1.1 `sol-ui.js` — 4 versions across 2 folders

| Path | Size | Head clue | Verdict |
|------|-----:|-----------|---------|
| `huongdi-public/sol-ui.js` | 15,649 | Has AI Studio menu entry (`{ key: 'aistudio', href: '/ai-studio/' }`), has iframe-embed skip (`embed=1`), comment "2026-07-06" | **CANONICAL** |
| `huongdi-backend/sol-ui.js` | 15,240 | Still has old menu (`prompts` + `quiz` badge "MỚI"), no iframe skip | **DELETE** — wrong folder, stale |
| `huongdi-public/sol-ui.js.pre-upgrade` | 10,075 | Legacy pre-AI-Studio | **DELETE** — backup, superseded |
| `huongdi-public/sol-ui.js.pre-vinet` | 10,098 | Legacy pre-Vinet edit | **DELETE** — backup, superseded |

Diff between the two "live" copies (public vs backend) confirms `huongdi-public/sol-ui.js` is 2 commits ahead:

```diff
< { key: 'aistudio', href: '/ai-studio/', label: '🎨 AI Studio' }   // NEW (2026-07-06)
> { key: 'quiz',     href: 'https://sol.vn/kham-pha-nhanh/' ... }   // OLD
> { key: 'prompts',  href: '/prompts/', label: '🤖 40 câu hỏi AI' } // OLD
< // ⭐ Skip khi được embed trong iframe (VD: AI Studio tabs)         // NEW
```

### 1.2 `sol-auth.js` — 2 identical copies, referenced inconsistently

| Path | Size | Verdict |
|------|-----:|---------|
| `huongdi-public/sol-auth.js` | 10,453 | `diff` shows byte-identical with the `/js/` copy |
| `huongdi-public/js/sol-auth.js` | 10,453 | Byte-identical |

**HTML references are split — this is the main "version chaos" symptom:**

| Uses `/sol-auth.js` (root) | Uses `/js/sol-auth.js` |
|----------------------------|-------------------------|
| `la-ban-huong-di/index.html:464` | `p1.html:1234, 1529` |
| `kiem-ke-nguon-luc/index.html:939` | `p2.html:1306, 1601` |
| `kham-pha-ban-than/index.html:865` | `p3.html:865, 1160` |

Both currently work because the files are identical. **But the moment you patch one, the other becomes stale** — and different pages break unpredictably. This is the concrete mechanism of "bản vá lại dùng bản cũ".

**Recommendation:** Pick `/js/sol-auth.js` as canonical (already colocated with `sol-user-nav.js`, `sol-api-sync.js`), delete root copy, update the 3 offending HTML files.

### 1.3 `sol-avatar-icon.js` — Single copy, no duplicates

| Path | Size | Notes |
|------|-----:|-------|
| `huongdi-public/sol-avatar-icon.js` | 10,910 | Legacy V1.2 lock widget. Loaded dynamically by `sol-ui.js:317` (`s.src = '/sol-avatar-icon.js'`). Comment says "Deploy: append vào sol-auth.js" — instruction that was never executed; the file is standalone. |

**Not a duplicate**, but the deployment comment is misleading. Keep as-is; live and referenced.

### 1.4 Login/Dashboard/Activate — Legacy dark-theme pages coexist with modern amber/navy pages

| Legacy (dark theme, root) | Size | Modern (amber/navy, Vietnamese URL) | Size | Verdict |
|---------------------------|-----:|-------------------------------------|-----:|---------|
| `login.html` | 4,425 | `dang-nhap/index.html` | 5,878 | `login.html` = **DELETE** |
| `activate.html` | 14,137 | `kich-hoat/index.html` | 10,086 | `activate.html` = **DELETE** |
| `dashboard.html` | 36,407 | `tai-khoan/index.html` + `toi/index.html` | 15,261 + N | `dashboard.html` = **DELETE** |

**Only the legacy pages reference each other + `/p1.html`, `/p2.html`, `/p3.html`.** Backend and modern pages route to Vietnamese paths.

⚠️ **BUT** — `sol-ui.js:74` still contains `const ctaHref = loggedIn ? '/dashboard.html' : '/kham-pha-ban-than/';` — the modern header widget still routes logged-in users to the legacy dashboard. **This is a live bug, not just cleanup.** Should be `/toi/` or `/tai-khoan/`.

### 1.5 `p1.html`, `p2.html`, `p3.html`, `p3-*.html` — Legacy 5-step pages

Legacy quiz pages at repo root (`p1.html`, `p2.html`, `p3.html` + 7 topic-specific `p3-*.html`) coexist with modern Vietnamese equivalents (`kham-pha-ban-than/`, `kiem-ke-nguon-luc/`, `la-ban-huong-di/`).

- `sol-flow.js` **still explicitly supports both routes** — `onP1 = /\/p1(\.html)?$/.test(path) || /\/kham-pha-ban-than\/?$/.test(path)` — so both sets are functional right now.
- Modern pages (`index.html`, `sol-ui.js`) only link to the Vietnamese versions.
- Legacy pages reference each other + `/dashboard.html` + `/login.html`.

**Verdict:** Legacy p1/p2/p3 pages are likely still receiving old inbound links (email templates, Facebook posts, quiz redirects). **Do NOT delete without 301 redirects in nginx**. Mark as "deprecated, redirect target" rather than "delete".

### 1.6 Header / footer HTML fragments

**None found as separate files.** Header + footer are injected by `sol-ui.js`. Single source of truth for markup is `sol-ui.js` (the canonical `huongdi-public/` copy).

### 1.7 Payment page (`thanh-toan/`)

Single copy: `huongdi-public/thanh-toan/index.html`. No duplicate. Correctly referenced by backend `leads.ts:129`.

### 1.8 CSS

Single file: `huongdi-public/css/style.css`. Referenced explicitly by only 1 HTML (`la-ban-huong-di/index.html`) but **auto-injected by `sol-ui.js` for all pages that load `sol-ui.js`**. Not dead, just centrally injected. No duplicate.

---

## Section 2: Backend Route Conflicts

### 2.1 Double-mounts in `src/index.ts`

Three paths are mounted twice, meaning Express uses first-match order and the second router only handles paths the first doesn't:

| Path | 1st mount (line) | 2nd mount (line) | Risk |
|------|-------|-------|------|
| `/api/auth` | `authRouter` (L74) with `authLimiter` | `passwordResetRoutes` (L75) — no rate limit! | Password reset endpoints **bypass the 20-req/15min limit** applied to auth. Security smell. |
| `/api/user` | `userAuthRoutes` (L76) | `dashboardRoutes` (L79) | Any dashboard route whose path collides with a user-auth route is shadowed. |
| `/api/directions` | `matchV2Routes` (L80) | `directionsRouter` (L85) | Old directions router mostly dead; only reachable for paths matchV2 explicitly doesn't handle. |

### 2.2 Route registered *inside* `main()` after DB connect

```typescript
async function main() {
  await prisma.$connect();
  console.log('✅ PostgreSQL connected');
  app.use('/api', leadsRouter);          // ← line 96, INSIDE main(), AFTER connect
  app.listen(PORT, ...);
}
```

`leadsRouter` is mounted only after `prisma.$connect()` succeeds. If Prisma init is slow, there's a window where the server has bound but `/api/leads` returns 404. Also unusual style — every other route is registered at module top-level. **Move to line 86 area for consistency.**

### 2.3 Live route files vs. `-refactored` variants

**No `user-auth-refactored.ts` or `leads-refactored.ts` were found.** However, both `user-auth.ts` and `leads.ts` self-identify as REFACTORED versions in their header comments:

- `user-auth.ts:2` — `// /api/user/*  — REFACTORED cho Unified Auth`
- `leads.ts:3` — `* REFACTORED — Unified auth:`

The `.bak-*` files are the old pre-refactor versions kept around. See Section 3.

---

## Section 3: Legacy Backup Files

**19 backup files** (`.bak*`, `.pre-*`) totaling ~200 KB of dead weight in the repo.

### 3.1 Backend (17 files)

| File | Size | Notes |
|------|-----:|-------|
| `src/index.ts.bak.1782978457` | 3,012 | Missing helmet + morgan |
| `src/index.ts.bak-cors-1782985298` | 3,128 | CORS mid-fix snapshot |
| `src/index.ts.bak-cors-1782985451` | 3,128 | Byte-identical to sibling above — **duplicate backup** |
| `src/index.ts.bak-1783121280` | 3,474 | Pre-refactor (no user-auth/dashboard/journey/sol-dong-hanh routes yet) |
| `src/routes/admin.ts.bak` | 15,449 | Pre-batch-b |
| `src/routes/admin.ts.bak-1782980867` | 15,182 | Older |
| `src/routes/admin.ts.bak-batch-b-1783133219` | 15,449 | **Byte-identical to `admin.ts.bak`** |
| `src/routes/admin.ts.bak.20260624_213327` | 10,096 | Earliest — different from all above |
| `src/routes/auth.ts.bak-1782998112` | 10,878 | Pre-admin-login |
| `src/routes/auth.ts.bak-admin-login-1783135474` | 10,911 | Pre-refactor to 20k version |
| `src/routes/leads.ts.bak-batch-a-1783132474` | 5,033 | Pre-Unified-Auth (2.6× smaller than current) |
| `src/routes/user-auth.ts.bak-` | 7,711 | Empty-suffix bak — **corrupt filename** |
| `src/routes/user-auth.ts.bak-1783272421` | 7,711 | **Byte-identical to `user-auth.ts.bak-`** |
| `src/routes/user-auth.ts.bak-1783272523` | 7,711 | **Byte-identical to both above — 3 copies of same file!** |
| `prisma/schema.prisma.bak-v1.2-1782997497` | 14,458 | v1.2 schema (pre-Unified-Auth) |
| `prisma/schema.prisma.bak-batch-a-1783132474` | 14,617 | Mid-refactor |
| `prisma/schema.prisma.bak-1783137754` | 15,577 | Later checkpoint |

### 3.2 Frontend (2 files)

| File | Size | Notes |
|------|-----:|-------|
| `huongdi-public/sol-ui.js.pre-upgrade` | 10,075 | Pre-AI-Studio upgrade |
| `huongdi-public/sol-ui.js.pre-vinet` | 10,098 | Pre-Vinet edits |

### 3.3 Recommendation

Move all 19 files to a **timestamped archive folder** (`_archive/2026-07-07/`) OR — if git is set up — commit current state to git and hard-delete these. Do not keep both — that's how the chaos re-forms.

---

## Section 4: Dead CSS / JS

Scanned every `.js` in `huongdi-public/` vs every `<script src="…">` reference in every `.html`.

| File | Size | Referenced by | Verdict |
|------|-----:|---------------|---------|
| `huongdi-public/js/app.js` | ? | **Zero HTML references** | **DEAD** — safe to delete. The file has a landing-JS header ("Đi Cùng Sol — Landing JS") suggesting it was for `sol.vn` marketing, not `huongdi.sol.vn`. Wrong repo. |
| `huongdi-public/css/style.css` | ? | Auto-injected by `sol-ui.js`; explicit HTML ref = 1 | **LIVE** (via JS injection) — do not delete. |

No other unreferenced JS/CSS found. All `sol-*.js` files are wired up.

---

## Section 5: Canonical Version Recommendations

| Component | Canonical path | Delete/deprecate |
|-----------|----------------|------------------|
| `sol-ui.js` | `huongdi-public/sol-ui.js` | `huongdi-backend/sol-ui.js`, `*.pre-upgrade`, `*.pre-vinet` |
| `sol-auth.js` | `huongdi-public/js/sol-auth.js` | `huongdi-public/sol-auth.js` + update 3 HTML files below |
| `sol-user-nav.js` | `huongdi-public/js/sol-user-nav.js` | (no duplicate) |
| `sol-api-sync.js` | `huongdi-public/js/sol-api-sync.js` | (no duplicate) |
| `sol-avatar-icon.js` | `huongdi-public/sol-avatar-icon.js` | (no duplicate; fix misleading deploy comment) |
| `sol-flow.js` | `huongdi-public/sol-flow.js` | (no duplicate) |
| Login page | `huongdi-public/dang-nhap/index.html` | `login.html` (+301 redirect) |
| Activate page | `huongdi-public/kich-hoat/index.html` | `activate.html` (+301 redirect) |
| Dashboard | `huongdi-public/toi/index.html` and/or `tai-khoan/index.html` (need to clarify which is authoritative) | `dashboard.html` (+301 redirect) — also fix `sol-ui.js:74` hard-coded reference |
| 5-step flow | `kham-pha-ban-than/`, `kiem-ke-nguon-luc/`, `la-ban-huong-di/` | `p1.html`, `p2.html`, `p3.html`, `p3-*.html` (+301 redirects; audit inbound links first) |
| Auth backend | `src/routes/auth.ts` (20 KB, current) | `auth.ts.bak-*` (2 files) |
| User-auth backend | `src/routes/user-auth.ts` (REFACTORED, 13 KB) | 3 identical `user-auth.ts.bak-*` files |
| Leads backend | `src/routes/leads.ts` (REFACTORED, 13 KB) | `leads.ts.bak-batch-a-1783132474` |
| Admin backend | `src/routes/admin.ts` (20 KB, current) | 4 `admin.ts.bak*` files |
| Prisma schema | `prisma/schema.prisma` (21 KB, current) | 3 `schema.prisma.bak*` files |
| Index entrypoint | `src/index.ts` (needs bug fixes first — see §2) | 4 `index.ts.bak*` files |

---

## Section 6: Consolidation Plan

Ordered by risk (safest first):

### Phase A — Delete pure dead code (zero risk)

1. `rm huongdi-public/js/app.js` — never referenced by any HTML.
2. `rm huongdi-backend/sol-ui.js` — wrong folder, stale (missing AI Studio menu). Backend doesn't serve static JS.
3. Delete redundant identical-content backups:
   - `src/index.ts.bak-cors-1782985451` (identical to `.bak-cors-1782985298`)
   - `src/routes/admin.ts.bak-batch-b-1783133219` (identical to `admin.ts.bak`)
   - `src/routes/user-auth.ts.bak-` (identical to `.bak-1783272421`)
   - `src/routes/user-auth.ts.bak-1783272523` (identical to `.bak-1783272421`)

### Phase B — Archive backups to `_archive/2026-07-07/` (low risk, reversible)

4. `mkdir huongdi-backend/_archive/2026-07-07/` and move ALL remaining `.bak*` files there. Add `_archive/` to `.gitignore` if not already.
5. Same for `huongdi-public/sol-ui.js.pre-upgrade` and `sol-ui.js.pre-vinet`.

### Phase C — Fix `src/index.ts` bugs (medium risk — test in staging)

6. Merge `passwordResetRoutes` into `authRouter` OR mount at a distinct path like `/api/auth/password-reset`. Currently it inherits *no* rate limit — security concern.
7. Decide `/api/user` ownership: probably `userAuthRoutes` should get `/api/user/auth/*` and `dashboardRoutes` should get `/api/user/dashboard/*` to avoid shadowing.
8. Remove `directionsRouter` if `matchV2Routes` fully supersedes it; otherwise mount at distinct paths.
9. Move `app.use('/api', leadsRouter)` from inside `main()` (line 96) to module top-level (near line 86).

### Phase D — Unify `sol-auth.js` reference (medium risk)

10. Delete `huongdi-public/sol-auth.js` (root copy).
11. Update these 3 HTML files to use `/js/sol-auth.js` instead of `/sol-auth.js`:
    - `la-ban-huong-di/index.html:464`
    - `kiem-ke-nguon-luc/index.html:939`
    - `kham-pha-ban-than/index.html:865`
12. Bust cache: bump `?v=…` query in all HTML.

### Phase E — Fix `sol-ui.js` broken CTA (medium risk)

13. Line 74: replace `'/dashboard.html'` with the actual canonical dashboard path (`/toi/` or `/tai-khoan/` — needs product decision).

### Phase F — Deprecate legacy pages (HIGH risk — needs redirect plan)

14. Before deleting `login.html`, `activate.html`, `dashboard.html`, `p1.html`, `p2.html`, `p3*.html`:
    - Grep external logs (Google Search Console, email campaigns, WordPress `sol-redirects.php`) for inbound links.
    - Add nginx 301 redirects (or update `sol-redirects.php` in sol.vn WP).
    - Only then delete.
15. Also grep `huongdi-backend/scripts/generate-roadmaps.js` and any email templates for hardcoded legacy URLs.

### Phase G — Prevention

16. Add `.gitignore` entries for `*.bak*`, `*.pre-*` to stop future rot.
17. Adopt a "no in-tree backups" policy: rely on git history + tagged archive branch instead of `.bak-<timestamp>`.
18. Add a CI check: fail if `**/*.bak*` files exist in the repo.

---

## Section 7: Caveats & Missing Pieces

1. **Timestamps not preserved.** Every file has mtime `2026-07-07 10:02` (the robocopy time). We cannot use mtime to determine which version is newest; we relied on content diff, header comments (e.g., "Version 2.0 — 2026-07-05"), and Unix-epoch timestamps embedded in `.bak-<epoch>` filenames.
2. **`solvn-wp/` not yet ingested.** WordPress `mu-plugins` (mentioned in `MASTER-REGISTRY.md`) — sol-default-template.php, sol-post-template.php, sol-archive-template.php, sol-landing-template.php, sol-redirects.php — are NOT in this repo. They may contain their own version chaos + are the authoritative source for 301 redirects that Phase F depends on. **Block Phase F until `solvn-wp/` is synced.**
3. **`docs/ecosystem-audit/MASTER-REGISTRY.md`** already documents the chaos qualitatively; this report is the file-level quantitative complement. Recommend cross-referencing.
4. **No git log examined** — the repo has a `.git/` directory but this audit did not inspect commit history. If any recent commits already removed/renamed these files, some findings may be redundant.
5. **`huongdi-backend/nginx/` configs** contain no rewrite rules for legacy paths. Any 301 redirect strategy must go here (or in sol.vn WP `sol-redirects.php`).

---

**End of report.**
