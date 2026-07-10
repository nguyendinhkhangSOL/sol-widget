# Fix Plan — Huongdi.sol.vn Frontend Consistency

**Version:** 1.0
**Date:** 2026-07-07
**Owner:** Khang Sol
**Source:** `CONSISTENCY-AUDIT-REPORT.md` findings
**Status:** ⏳ Draft — chờ anh Khang approve trước khi execute

Kịch bản chi tiết vá đồng bộ giao diện huongdi.sol.vn theo audit findings. Ship theo 4 batches, mỗi batch = 1 commit độc lập, có test + rollback riêng.

---

## Executive Summary

**Total effort:** ~3.5-4 giờ chia 4 batches
**Total files affected:** ~22 files (14 HTML + 4 JS + 4 CSS/config)
**Total commits:** 4 commits
**Deploy risk:** Medium (production live, mitigation: test staging + rollback ready)

**Strategy — Ship theo priority từ safe → risky:**

| Batch | Focus | Effort | Risk | Rollback |
|-------|-------|--------|------|----------|
| 1 | P0 cache-buster + broken URL | 15 phút | Low | git revert 1 commit |
| 2 | P0 post-login pages (add header/footer) | 30 phút | Low | git revert 1 commit |
| 3 | P1 auth pages palette + fonts | 1-1.5 giờ | Medium | git revert + palette rollback |
| 4 | P1 widget consolidation (kill sol-avatar-icon) | 1-1.5 giờ | Medium-High | git revert + restore file |

---

## Prerequisites — Trước khi execute

### 1. Backup snapshot
```bash
# Trên VPS
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
sudo tar -czf /var/backups/pre-fix-huongdi-${DATE}.tar.gz \
    -C /var/www huongdi/public
```

### 2. Verify staging (nếu có) hoặc test path

- **Preferred:** Deploy vào `/staging.huongdi.sol.vn/` trước, verify manual
- **Fallback:** Deploy vào `/var/www/huongdi/public-test/`, curl test 5 pages critical
- **Worst case (no staging):** Deploy trực tiếp production, monitor 15 phút sau mỗi batch

### 3. Anh Khang confirm 4 điểm sau

- [ ] Palette V4.1 canonical: Amber `#F59E0B` + Navy `#0F172A` (không phải gold `#C9A961`)
- [ ] Fonts canonical: Inter (body) + Lora (headings) — Google Fonts
- [ ] ADR-001 áp dụng: `/dang-nhap/`, `/dang-ky/`, `/kich-hoat/`, `/quen-mat-khau/`, `/dat-lai-mat-khau/`, `/thanh-toan/`, `/dang-xuat/` — NO header/footer
- [ ] Post-login (`/toi/*`, `/tai-khoan/`) — CÓ header/footer

---

## Batch 1 — P0 Cache-buster fix (15 phút, LOW RISK)

### Vấn đề

3 trang core dùng URL script sai:
```html
<script src="/sol-auth.js?v=1783154731"?v=202607041519></script>
                                       ^^^ double ?v= — invalid URL, browser bỏ qua
```

**Impact:** Cache-buster không hoạt động → user có thể vẫn dùng version JS cũ nếu cache. Cosmetic today, nhưng khi ship next fix (Batch 3+) → user sẽ cache stale JS.

### Files affected (3)

1. `huongdi-public/kham-pha-ban-than/index.html`
2. `huongdi-public/kiem-ke-nguon-luc/index.html`
3. `huongdi-public/la-ban-huong-di/index.html`

### Diff (per file)

**Before:**
```html
<script src="/sol-auth.js?v=1783154731"?v=202607041519></script>
```

**After:**
```html
<script src="/js/sol-auth.js?v=20260707"></script>
```

Cùng lúc migrate:
- Fix double `?v=` bug
- Migrate root `/sol-auth.js` → `/js/sol-auth.js` (canonical per docs/04)
- Unify cache-buster: `?v=20260707` (date-based, human-readable)

### Additional fix — sol-user-nav.js cache-buster inconsistency

Same 3 files có `sol-user-nav.js?v=1783225472` — normalize:

**Before:**
```html
<script src="/js/sol-user-nav.js?v=1783225472" defer></script>
```

**After:**
```html
<script src="/js/sol-user-nav.js?v=20260707" defer></script>
```

### Test plan

- [ ] Open `/kham-pha-ban-than/` → check Network tab: `sol-auth.js?v=20260707` 200 OK
- [ ] Same for 2 trang còn lại
- [ ] Console: no 404 errors
- [ ] Auth still works (login pill renders)

### Commit
```bash
git add huongdi-public/kham-pha-ban-than/index.html \
        huongdi-public/kiem-ke-nguon-luc/index.html \
        huongdi-public/la-ban-huong-di/index.html
git commit -m "fix: repair broken cache-buster URL + unify sol-auth.js path (P0)"
```

### Rollback
```bash
git revert HEAD
git push
bash scripts/deploy-huongdi-public.sh
```

---

## Batch 2 — P0 Post-login pages add header/footer (30 phút, LOW RISK)

### Vấn đề

5 post-login pages MISSING sol-ui.js — user login xong thấy trang trống không nav, không footer.

### Files affected (5)

1. `huongdi-public/toi/index.html` (dashboard)
2. `huongdi-public/toi/ban-do/index.html`
3. `huongdi-public/toi/so-hanh-trinh/index.html`
4. `huongdi-public/toi/sol-dong-hanh/index.html`
5. `huongdi-public/tai-khoan/index.html`

### Diff (per file)

Thêm 3 dòng script trước `</body>`:

**Add:**
```html
<!-- Global nav + auth (per ADR-001: Category C post-login pages) -->
<script src="/sol-ui.js?v=20260707" defer></script>
<script src="/js/sol-user-nav.js?v=20260707" defer></script>
<script src="/js/sol-auth.js?v=20260707"></script>
```

**Vị trí insert:** Trước closing `</body>` tag của mỗi page.

**Trường hợp đặc biệt `/tai-khoan/index.html`:** Hiện tại KHÔNG có bất kỳ script auth nào → add cả sol-api-sync.js:
```html
<script src="/js/sol-api-sync.js?v=20260707"></script>
```

### Test plan

- [ ] Login → redirect `/toi/` → thấy header (nav + login pill logged in) + footer
- [ ] Click "Bản đồ hướng đi" → `/toi/ban-do/` → thấy header/footer đúng
- [ ] Test tương tự 3 pages còn lại
- [ ] Verify sol-user-nav.js hiện email + logout button
- [ ] Verify footer có hotline 024.3993.1800

### Commit
```bash
git add huongdi-public/toi/ huongdi-public/tai-khoan/
git commit -m "fix: add header+footer to 5 post-login pages (ADR-001 Category C)"
```

### Rollback
```bash
git revert HEAD
bash scripts/deploy-huongdi-public.sh
```

---

## Batch 3 — P1 Auth pages palette + fonts unification (1-1.5 giờ, MEDIUM RISK)

### Vấn đề

**3.1. `/dang-nhap/` + `/dang-ky/` màu gold `#C9A961`** — off-brand touchpoint LỚN NHẤT user thấy. 4 auth pages khác đã amber `#F59E0B`.

**3.2. All 6 auth pages missing Google Fonts** (Inter + Lora) → fallback system fonts → không đồng bộ brand.

### Files affected (6)

1. `huongdi-public/dang-nhap/index.html`
2. `huongdi-public/dang-ky/index.html`
3. `huongdi-public/kich-hoat/index.html`
4. `huongdi-public/quen-mat-khau/index.html`
5. `huongdi-public/dat-lai-mat-khau/index.html`
6. `huongdi-public/dang-xuat/index.html`

### Diff — Palette migration

**Chỉ áp dụng cho `dang-nhap` + `dang-ky`:**

**Find & Replace trong `<style>` block:**
- `#C9A961` → `#F59E0B` (amber primary)
- `#B8985A` → `#D97706` (amber darker hover)
- `#8B7355` → `#B45309` (amber even darker text)
- Any gold-family → amber-family (list exhaustive trong file `PALETTE-MIGRATION.md`)

**Also update CSS variables (nếu có):**
```css
:root {
  --primary: #F59E0B;     /* was #C9A961 */
  --primary-hover: #D97706; /* was #B8985A */
  --primary-dark: #B45309;  /* was #8B7355 */
  --text-primary: #0F172A;
  --bg: #FFFFFF;
}
```

### Diff — Google Fonts add (all 6 files)

**Add trong `<head>`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:wght@600;700;800&display=swap" rel="stylesheet">
```

**Update body CSS:**
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
h1, h2, h3, h4, .heading-serif {
  font-family: 'Lora', Georgia, serif;
}
```

### Test plan

- [ ] `/dang-nhap/` — visual check: amber button, no gold
- [ ] Same for `/dang-ky/`
- [ ] All 6 auth pages: fonts render Inter (body) + Lora (heading)
- [ ] Cross-browser check: Chrome + Firefox + Safari mobile
- [ ] Screenshot before/after cho từng page → save vào `docs/screenshots/batch3-before-after/`
- [ ] Verify auth flow không break: register → login → forgot → reset

### Commit
```bash
git add huongdi-public/dang-nhap/ huongdi-public/dang-ky/ \
        huongdi-public/kich-hoat/ huongdi-public/quen-mat-khau/ \
        huongdi-public/dat-lai-mat-khau/ huongdi-public/dang-xuat/
git commit -m "refactor: unify auth pages palette to V4.1 amber + add Inter/Lora fonts (P1)"
```

### Rollback

Palette migration là visual only → không break functionality. Rollback đơn giản:
```bash
git revert HEAD
bash scripts/deploy-huongdi-public.sh
```

**⚠️ Risk mitigation:** Ship batch này sau khi Batch 1+2 chạy live 24 giờ ổn định.

---

## Batch 4 — P1 Widget consolidation (1-1.5 giờ, MEDIUM-HIGH RISK)

### Vấn đề

**Xung đột 2 account widgets trên mọi Category A page:**
- `sol-avatar-icon.js` — Bottom-right, V1.2 legacy, icon lock 🔒 (auto-loaded by sol-ui.js)
- `sol-user-nav.js` — Top-right, V3, login pill (canonical)

User thấy 2 UI account cùng lúc → confusing.

### Prerequisites

**Feature parity check** — Verify sol-user-nav.js đủ features của sol-avatar-icon.js:
- [ ] Show user email khi logged in
- [ ] Logout button
- [ ] Login CTA khi chưa logged in
- [ ] Tier badge (Free/Active/Founder)
- [ ] Link vào `/tai-khoan/`
- [ ] Mobile responsive

Nếu MISSING feature nào → add vào sol-user-nav.js trước khi kill avatar-icon.

### Files affected

**Remove reference (3 places):**
1. `huongdi-public/sol-ui.js` — Remove auto-load logic của avatar-icon (line ~XX)
2. `huongdi-public/js/sol-user-nav.js` — Ensure feature parity (nếu cần add features)
3. `huongdi-public/sol-avatar-icon.js` — Move to `_legacy/sol-avatar-icon.js` (keep for reference)

**Update HTML pages có manual reference (grep first):**
```bash
grep -r "sol-avatar-icon" huongdi-public/**/*.html
```

Nếu có page manual include → remove.

### Diff — `sol-ui.js`

**Find:**
```javascript
// Auto-load sol-avatar-icon.js
const avatarScript = document.createElement('script');
avatarScript.src = '/sol-avatar-icon.js';
avatarScript.defer = true;
document.head.appendChild(avatarScript);
```

**Replace:** Delete entire block.

**Add comment:**
```javascript
// Legacy sol-avatar-icon.js removed (2026-07-07)
// Canonical account widget: /js/sol-user-nav.js (see docs/04-CANONICAL-VERSIONS.md)
```

### Test plan

**Critical — Test 5 pages với 3 scenarios:**

Pages test:
- `/` (homepage)
- `/founder/`
- `/pricing/`
- `/kham-pha-ban-than/`
- `/toi/`

Scenarios:
1. **Not logged in** — sol-user-nav.js render "Đăng nhập" CTA top-right. NO lock icon bottom-right.
2. **Logged in Free** — sol-user-nav.js render email + Free badge. NO lock icon.
3. **Logged in Active** — sol-user-nav.js render email + Active badge. NO lock icon.

### Commit
```bash
git add huongdi-public/sol-ui.js \
        huongdi-public/js/sol-user-nav.js
git mv huongdi-public/sol-avatar-icon.js huongdi-public/_legacy/sol-avatar-icon.js
git commit -m "refactor: consolidate account widget — remove legacy sol-avatar-icon.js, sol-user-nav.js V3 canonical (P1)"
```

### Rollback

**More complex vì có git mv:**
```bash
git revert HEAD
# Verify sol-avatar-icon.js restored to original path
ls huongdi-public/sol-avatar-icon.js
# Deploy
bash scripts/deploy-huongdi-public.sh
```

**⚠️ Risk mitigation:**
- Ship batch này CUỐI CÙNG sau khi Batch 1+2+3 ổn định 48 giờ
- Test kỹ 3 scenarios trên 5 pages TRƯỚC khi commit
- Screenshot trước-sau lưu vào `docs/screenshots/batch4-before-after/`

---

## Post-execution — Verification

Sau khi ship 4 batches:

### 1. Full regression test (30 phút)

Manual test 10 pages critical với 3 user scenarios (not logged in / Free / Active):

Landing pages:
- `/`, `/founder/`, `/pricing/`, `/lien-he/`

Journey pages:
- `/kham-pha-ban-than/`, `/kiem-ke-nguon-luc/`, `/la-ban-huong-di/`

Post-login pages:
- `/toi/`, `/toi/so-hanh-trinh/`, `/tai-khoan/`

Auth pages:
- `/dang-nhap/`, `/dang-ky/`, `/thanh-toan/`

Verify per page:
- [ ] Correct header/footer per ADR-001 category
- [ ] Palette V4.1 amber (no gold, no purple, no green)
- [ ] Fonts Inter + Lora load correctly
- [ ] Console no errors
- [ ] Auth flow works end-to-end

### 2. Automated smoke test

```bash
# On VPS
for URL in / /founder/ /pricing/ /kham-pha-ban-than/ /toi/ /dang-nhap/; do
    STATUS=$(curl -sI "https://huongdi.sol.vn$URL" | head -1)
    echo "$URL: $STATUS"
done
```

Kỳ vọng: All `HTTP/2 200`.

### 3. Analytics monitoring

Monitor 48 giờ sau deploy:
- Google Analytics — bounce rate không tăng > 10%
- Error tracking (Sentry) — no new JS errors
- Payment conversion — không tụt

Nếu có issue → rollback ngay.

---

## Deferred to Later Sessions

Không nằm trong plan này (session sau riêng):

### Legacy pages cleanup (P0 partial — cần solvn-wp/ verify redirects)
- Xoá `login.html`, `dashboard.html`, `activate.html` (V1 purple palette)
- Setup 301 redirects trong `sol-redirects.php` trước khi xoá
- Ship trong session Phase 3.6 (per `04-CANONICAL-VERSIONS.md`)

### sol-auth.js split-brain consolidation
- Consolidate root vs `/js/` copy vào single canonical `/js/sol-auth.js`
- Update 3 trang legacy dùng root path
- Ship trong session Phase 3.2

### Backend route double-mount fix (security)
- Fix `huongdi-backend/src/index.ts` — 3 double-mounts (auth, user, directions)
- Ship trong session backend fix riêng

### CSS consolidation
- 1 file `css/style.css` chưa được audit inline styles per-page
- Ship refactor sau khi frontend consistency ổn

---

## Timeline recommendation

**Option A — Ship gộp 1 session (3.5-4 giờ):**
- Anh dành 1 buổi sáng (9AM-1PM) tập trung
- Ship 4 batches liên tiếp
- Test cuối
- Rủi ro: cường độ cao, có thể miss test details

**Option B — Ship chia 2 sessions (khuyến nghị):**
- **Session 1 (2 giờ):** Batch 1 + Batch 2 — P0 fixes
- Chờ 24 giờ verify production ổn định
- **Session 2 (2 giờ):** Batch 3 + Batch 4 — P1 visual + widget consolidation
- Rủi ro thấp hơn, mỗi session tập trung 1 concern

**Option C — Ship từng batch riêng (4 sessions × 30-90 phút):**
- Tối đa an toàn
- Chậm nhất — mất 1 tuần
- Phù hợp nếu business đang trong critical launch period

Em recommend **Option B**.

---

## Approval checklist trước khi execute

Anh confirm bằng cách reply "OK Batch X" hoặc "Sửa Y":

- [ ] Palette V4.1 canonical: Amber `#F59E0B` + Navy `#0F172A` (yes/no)
- [ ] Fonts canonical: Inter + Lora (yes/no)
- [ ] ADR-001 áp dụng đúng như list Batch 2 (yes/no)
- [ ] Widget consolidation: kill sol-avatar-icon, sol-user-nav.js V3 canonical (yes/no)
- [ ] Timeline: Option A / B / C
- [ ] Ready to ship: Batch nào ship trước (1 / 2 / 3 / 4)?

Em không execute cho tới khi có approve rõ ràng.
