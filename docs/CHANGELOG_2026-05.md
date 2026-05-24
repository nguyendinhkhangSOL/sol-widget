# Sol — Changelog tháng 5/2026

> Log chi tiết từng task + bug fix theo ngày, dùng để recall context khi review hoặc nhập session mới.
> Cập nhật: 2026-05-24.

---

## 2026-05-24 — Branding photo update (Khang Yulong Mountain)

### Update featured image bài "Khang Sol — 30 Năm Hút Vinataba"
- URL: https://sol.vn/khang-sol-cau-chuyen-sach-thuoc-tu-2021/
- Featured image: Khang đứng trước đỉnh Ngọc Long Tuyết Sơn (Vân Nam), áo wine-red HOLLISTER, khoanh tay
- OG image (cho FB/Zalo share preview): `https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg`
- Source: ảnh anh Khang chụp tại Yulong Snow Mountain (Lijiang, Yunnan) — 2026

### Storytelling significance
- 30 năm Vinataba + 5 năm Tự do + đỉnh núi tuyết = visual metaphor cho "đã chinh phục"
- Match founder narrative cho Sol launch 31/5
- Trust signal mạnh cho health YMYL product

### Brand asset portfolio
- `assets/branding/khang-yulong-portrait.jpg` (source, portrait full body)
- Featured image WP (sol.vn/khang-sol-cau-chuyen-...)
- Avatar FB cá nhân (Khang's face crop từ Yulong source)
- (Pending) Banner FB cá nhân — landscape núi only / branded with text overlay
- Files generated: `assets/branding/output/*.{jpg,png}`

### Scripts created
- `scripts/branding/gen-fb-banner.js` — 2 banners có Khang
- `scripts/branding/gen-mountain-banner.js` — landscape only (no Khang)
- `scripts/branding/gen-sol-brand-banner.js` — flat design brand banner
- `scripts/branding/gen-khang-portfolio.js` — 3 crops (hero/portrait/avatar) từ source

---

## 2026-05-24 — WP admin Editor 404 (browser Service Worker bug)

### Symptom
- `wp-admin/post.php?action=edit` + `plugins.php` đều bị treo, console hiện hàng loạt 404:
  - `GET https://sol.vn/api-fetch.min.js 404`
  - `GET https://sol.vn/i18n.min.js 404`
  - `GET https://sol.vn/modern/colors.min.css 404`
- URL trong errors bị strip path `/wp-includes/js/dist/` hoặc `/wp-admin/css/colors/...`
- Frontend (web public) vẫn work bình thường

### Debug path (mất nhiều thời gian vì đi nhầm hướng)
1. Suspect Cloudflare Redirect Rules → check 2 rules có pattern `202*` → KHÔNG match URL `/wp-includes/...`
2. Suspect Cloudflare Worker `sol-robots-override` → disable route `sol.vn/*` → vẫn lỗi
3. Test curl trực tiếp URL `/wp-includes/js/dist/api-fetch.min.js` → **HTTP 200** (server serve OK, không có redirect)
4. View Source HTML → URL trong `<script src>` ĐÚNG `https://sol.vn/wp-includes/js/dist/api-fetch.min.js`
5. Test **Incognito** → **HẾT LỖI** → khẳng định bug ở browser chính, không phải server

### Root cause
- **Service Worker cũ** registered cho domain `sol.vn` đang intercept requests và rewrite URL (strip path)
- Có thể do plugin PWA hoặc Cloudflare APO cài trong WP trước đây, đã uninstall nhưng Service Worker vẫn active trong browser

### Fix
1. F12 → Application → Service Workers → Unregister tất cả entries `sol.vn`
2. Application → Clear storage → Clear site data
3. Ctrl+Shift+R hard refresh

### Lesson learned
- **Khi WP admin bị JS errors lạ, test Incognito đầu tiên** trước khi debug Cloudflare/server
- Service Worker là cache layer mạnh nhất + persistent — uninstall plugin KHÔNG xóa nó
- Bug chỉ ảnh hưởng 1 browser của 1 user (Khang), không ảnh hưởng user khác (vì SW riêng per-browser)

---

## 2026-05-24 — SEO redirect WordPress URL cũ + ảnh fix

### Cloudflare 301 redirect URL date format (WP permalink change)
- WordPress sol.vn đã đổi permalink structure từ `/YYYY/MM/DD/slug/` sang `/slug/`
- Google đã index hàng trăm URL cũ → cần 301 redirect để giữ SEO + user click link cũ vẫn tới đúng
- WP **KHÔNG** tự handle canonical redirect cho case này → setup Cloudflare Redirect Rules
- Setup 2 rules trong Cloudflare Dashboard → sol.vn → Rules → Redirect Rules:
  - **Rule 1** — trailing slash:
    - Request URL (wildcard): `https://sol.vn/202*/*/*/*/`
    - Target: `https://sol.vn/${4}/`
    - Status: 301, Preserve query string: ON
  - **Rule 2** — không trailing slash:
    - Request URL: `https://sol.vn/202*/*/*/*`
    - Target: `https://sol.vn/${4}/`
    - Status: 301, Preserve query string: ON

### Bug critical: Pattern broad phá ảnh
- **Lần đầu setup** dùng pattern `https://sol.vn/*/*/*/*` (4 wildcards bất kỳ) — quá rộng
- Pattern này match cả URL ảnh `/wp-content/uploads/2026/05/image.png` (do `wp-content/uploads/2026/05` cũng là 4 segments) → redirect ảnh sang `/05/image.png/` → 404
- **Fix**: pattern hẹp `202*/*/*/*` — chỉ match URL bắt đầu bằng năm `2020-2029`, không match `wp-content/`, `wp-json/`, `wp-admin/`
- Lesson learned: với Cloudflare wildcard, **pattern phải đủ specific** — không dùng `*` ở vị trí đầu URL path

### Năm 2030+ cần update rule
- Pattern `202*` chỉ cover 2020-2029. Khi WP có bài năm 2030+, cần thêm rule `203*/*/*/*/` hoặc đổi sang regex Custom expression
- TODO 2029: review redirect rules trước khi sang năm mới

---

## 2026-05-20 — Infrastructure foundation

### VPS provisioning
- Order Cloud VPS eztech.vn — Ubuntu 24.04 LTS, 2GB RAM, 30GB disk, IP 103.72.57.11
- Provision script `scripts/vps/provision-vps.sh` — install Node 20 / Postgres 16 / Nginx / PM2 / Certbot / UFW / fail2ban
- Create user `solop` với NOPASSWD sudo
- SSH key ed25519 setup — `C:\Users\ADMIN\.ssh\sol_vps` + `sol-vps` alias trong `~/.ssh/config`
- Disable root SSH login
- UFW allow 22/80/443
- Fail2ban sshd jail

### Cloudflare DNS + SSL
- Add A record `bothuocla.sol.vn` → 103.72.57.11 proxied (orange cloud)
- SSL mode `Full (strict)` (KHÔNG Flexible — gây loop)
- AI Crawl Control: **disabled managed robots.txt** (key fix — Worker override)
- Cloudflare Worker `sol-robots-override` v7 — 9 endpoints (robots.txt, well-known/api-catalog, agent-skills, oidc stub, oauth stub, mcp server-card, Markdown for Agents converter)
- Certbot SSL ECDSA cho `bothuocla.sol.vn` — expiry 2026-08-18, auto-renew systemd timer

### Landing + analytics
- Deploy landing "Sắp ra mắt" Sol-branded vào `/var/www/html/index.html`
- GA4 setup property ID `365443123`, measurement ID `G-S5ELGXBLWK`
- Microsoft Clarity project `wu12r2qt0o` — bothuocla.sol.vn
- GSC 4 properties verified (sol.vn + bothuocla.sol.vn × Domain + URL prefix)

### Documentation
- Tạo `docs/00-INDEX.md`, `01-CREDENTIALS.md`, `02-CHEATSHEET.md`, `03-CLOUDFLARE_CONFIG.md`, `04-VPS_CONFIG.md`
- Tạo `SETUP_LOG_2026-05-20.md` chi tiết quy trình + troubleshooting

**Agent Readiness Score**: 33 → ~95/100 (top 1% website VN về AI-readiness).

---

## 2026-05-21 — Backend + Dashboard + Admin deploy

### Backend deploy (Express + Prisma + Postgres)

**Workflow**:
1. Clone repo `git clone https://github.com/nguyendinhkhangSOL/sol-widget /var/www/sol-widget-old`
2. `cd backend && npm ci && npx prisma generate && npm run build`
3. Setup `.env` production (xem section env trong [05-ARCHITECTURE.md](./05-ARCHITECTURE.md))
4. Create Postgres DB: `CREATE USER sol_app + CREATE DATABASE sol_prod`
5. `npx prisma migrate deploy` — apply 9 Prisma migration
6. Run 17 raw SQL file (Zalo tables, manual phase A/B, encoding fixes) — `psql -f` từng file
7. `npm run seed` + `seed:triggers` + `seed:qday` — 127 ContentItem + canned replies
8. `pm2 start dist/index.js --name sol-api` (listen `127.0.0.1:4000`)
9. `pm2 startup` + `pm2 save` — bật auto sau reboot

### Nginx setup

- Refactor `/etc/nginx/sites-enabled/bothuocla.sol.vn` — multi-location:
  - `location = /api/zalo/webhook` exact match priority cao
  - `location /api/socket.io/` WS upgrade
  - `location /api/` proxy `127.0.0.1:4000`
  - `location /assets/` cache 1y
  - `location /` SPA fallback `try_files $uri /index.html`
- Config nginx subdomain `admin.sol.vn` — Certbot SSL + IP allowlist (commented)
- Add `admin.sol.vn` vào CORS_ORIGINS backend `.env`

### Bug fix khi build

1. **Nginx 403 Forbidden** — permission `/var/www/bothuocla-sol-vn/` không phải `www-data`. Fix `chown -R www-data:www-data`.
2. **Nginx rewrite loop** — Cloudflare đang `Flexible` SSL → CF gửi HTTP → nginx redirect HTTPS → loop. Fix: switch CF `Full (strict)`.
3. **`/api/*` prefix strip** — nginx `proxy_pass http://127.0.0.1:4000;` (KHÔNG trailing slash) để Express expect path nguyên.
4. **TypeScript build errors `worker.ts` 5× TS7006** — add explicit types `(notif: Notification) => …` cho callback.
5. **`.gitignore` blocking SQL files** — filter `*.sql` chặn `prisma/*.sql`. Fix: add allow rule `!prisma/*.sql`.
6. **double-scheduler bug** — `worker.ts` line 1057 + `index.ts` line 134 cả 2 gọi `startScheduler()` → cron chạy 2 lần → double ZNS spend. Fix: xóa call ở `worker.ts`.

### Dashboard SPA deploy

- `cd dashboard && VITE_BASE=/ VITE_API_BASE=/api npm run build`
- `cp -r dist/* /var/www/bothuocla-sol-vn/`
- Nginx serve static + SPA fallback
- Verify: `https://bothuocla.sol.vn/journey` 200 OK (deep link refresh không 404)

### Admin SPA deploy

- Delete `.bak3` files trong `admin/src/pages/`
- Disable mock tabs trong `AdminMessaging.tsx`
- `cd admin && VITE_API_BASE=https://bothuocla.sol.vn/api npm run build`
- `cp -r dist/* /var/www/admin-sol-vn/`
- Login email magic link → grant `isAdmin = true` cho `nguyendinhkhang@gmail.com` qua psql

### Verify post-deploy

- `pm2 list` → sol-api online, restart count 0
- `curl https://bothuocla.sol.vn/api/healthz` → 200 `{ok:true}`
- `pm2 logs sol-api | grep cron` → 26 cron job loaded
- E2E manual: anon signup → FTND → onboard → chat → check-in

---

## 2026-05-22 sáng — Dashboard UX refactor

### Test FTND refactor

**Phases**: intro → questions → submitting → result

**New file**: `dashboard/src/pages/TestFtnd.tsx` (~600 dòng)

- **Intro phase**: hero "Test Mức Lệ Thuộc Nicotin" + 6 câu, 2 phút
- **Questions phase**: 6 câu Fagerström, radio buttons, progress bar
- **Submitting phase**: 3-step dramatic animation 2.8s
  - Step 1: "Đang phân tích câu trả lời của anh..." (800ms)
  - Step 2: "Đang tính điểm FTND..." (800ms)  
  - Step 3: "Đang tạo gói cá nhân hoá..." (1200ms)
- **Result phase**: score badge + cohort recommendation + 8 marketing section
  - Cohort plan details (LIGHT/MODERATE/HEAVY)
  - "Khang đã đi qua" — founder story
  - "Sol đồng hành thế nào"
  - Pricing 3 gói
  - Testimonial placeholder
  - CTA + FAQ

### App.tsx redirect fix

**Bug**: User submit FTND → backend tạo user + redirect `/` → App.tsx detect đã onboarded → render Overview thay vì Result.

**Fix**: App.tsx SKIP redirect khi đang ở `/test-ftnd?result=*`. Hold user trên result làm marketing landing.

```tsx
// Skip redirect cho FTND result page
if (location.pathname === '/test-ftnd' && searchParams.has('result')) {
  return;
}
```

### Phase B card crash

**Bug**: `dashboard/src/components/views/phaseB/PhaseAction.tsx` crash `Cannot read properties of undefined (reading 'length')`.

**Root cause**: render `user.cigaretteLogs.length` khi field chưa fetch về.

**Fix**: guard `(logs ?? []).length`.

### Stats endpoint 400/403 console spam

**Bug**: Dashboard fetch `/api/stats/...` cho anon user → backend return 400 (missing user context) → console đầy lỗi spam.

**Fix**: backend return 200 `{available: false}` thay vì 400/403 cho stats public-ish endpoint.

---

## 2026-05-22 trưa — SEO content production

### Wiki articles refactor (143 bài)

- **Bulk inject author block** — Khang Sol bio + facts + sạch thuốc 2021 + Person Schema JSON-LD
- Script: `scripts/wp-publisher/bulk-inject-author-block.js`
- **Bulk inject medical disclaimer** — TỰ ROLLBACK vì footer plugin `sol-global-footer.php` đã inject vào mọi page → trùng. Duplicate UX bad.

### FAQ schema deprecation

- **Disable** `inject-faq-schema.js` + `auto-faq-from-content.js`
- Add CLI flag `--force-faq-deprecated` (block default execution)
- Add DEPRECATED warning ở đầu mỗi script
- 143 bài cũ **GIỮ** FAQ schema (Google ignore not penalty, AI crawlers vẫn parse)

### Sprint 31-5 — 7 bài flagship publish

| # | Slug | Schema | Type |
|---|---|---|---|
| 1 | `lo-trinh-bo-thuoc-la-7-ngay` | HowTo | Tutorial |
| 2 | `bao-lau-phoi-sach-sau-bo-thuoc` | QAPage | Single Q&A |
| 3 | `cach-bo-thuoc-cho-nguoi-45-tuoi` | HowTo | Tutorial |
| 4 | `bo-thuoc-tai-nha-vs-thuoc-cai` | Article | Comparison |
| 5 | `7-dau-hieu-nghien-thuoc-la` | QAPage | Single Q&A |
| 6 | `cai-thuoc-bi-stress-lam-sao` | QAPage | Single Q&A |
| 7 | `khang-sol-cau-chuyen-sach-thuoc-tu-2021` | Article | Story/Founder |

- Script publish: `scripts/wp-publisher/publish-sprint-31-5.js`
- Generate 7 OG image branded — script Python `og-gen.py` (sharp/SVG composite)
- Re-publish 7 bài với `featured_media` set sau khi OG image upload

### SEO compliance audit

- 15 mục check toàn site sol.vn — PASS (xem [SEO_COMPLIANCE_AUDIT_2026-05-22.md](./SEO_COMPLIANCE_AUDIT_2026-05-22.md))
- 0 vi phạm Google nghiêm trọng
- 3 risk minor sau launch xử lý

---

## 2026-05-22 chiều — Email auth + DNS

### SMTP Zoho fail

**Triệu chứng**: `Invalid login: 535-5.7.8 Authentication failed`.

**Root cause**: Zoho Free tier KHÔNG có App Password feature. Phải upgrade Zoho Mail Premium (~$1/user/mo).

**Decision**: Switch sang Brevo (xem [09-DECISIONS.md](./09-DECISIONS.md)).

### Brevo SMTP setup

- Sign up Brevo free tier — 300 mail/ngày
- Verify domain `sol.vn` trong Brevo dashboard
- Generate SMTP key — copy 32-char
- Update `backend/.env`:
  ```
  SMTP_HOST=smtp-relay.brevo.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=<id>@smtp-brevo.com
  SMTP_PASSWORD=<32-char key>
  EMAIL_FROM="Đi Cùng Sol <khang@sol.vn>"
  EMAIL_REPLY_TO=khang@sol.vn
  ```

### Bug `.env` comment trailing

**Triệu chứng**: Backend SMTP auth fail mặc dù key đúng.

**Root cause**: `.env` viết:
```
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        # SMTP key Brevo
```

Node `dotenv` đọc value bao gồm cả space + comment → key sai.

**Fix**: KHÔNG có inline comment cùng dòng value. Comment phải DÒNG RIÊNG trên value:
```
# SMTP key Brevo
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Bug email base64 raw

**Triệu chứng**: Gmail hiện `PCFET0NUWVBFIGh0bWw+...` chuỗi base64 thay vì HTML render.

**Root cause**: nodemailer gửi multipart/alternative (text + html) → Brevo (hoặc nodemailer side) strip Content-Type header → Gmail không decode.

**Fix** `smtpClient.ts`:
```typescript
await t.sendMail({
  from, to, replyTo, subject,
  html,                                  // CHỈ html
  textEncoding: 'quoted-printable',
  // KHÔNG có text: '...' nữa
});
```

→ Single-part `text/html; charset=utf-8` = không multipart boundary → không strip header → Gmail OK.

### DNS DKIM/SPF/DMARC Cloudflare

Setup trong dash.cloudflare.com → sol.vn → DNS:

```
TXT  mail._domainkey.sol.vn
     v=DKIM1; k=rsa; p=<2048-bit pubkey from Brevo>

TXT  sol.vn  (modify existing SPF)
     v=spf1 include:spf.brevo.com include:zoho.com ~all
     # Giữ Zoho cho mailbox khang@sol.vn vẫn nhận email,
     # thêm Brevo cho outbound magic link

TXT  _dmarc.sol.vn
     v=DMARC1; p=quarantine; rua=mailto:khang@sol.vn; aspf=r; adkim=r
```

Verify:
```bash
dig TXT mail._domainkey.sol.vn +short
dig TXT sol.vn +short
dig TXT _dmarc.sol.vn +short
# Cross-check qua mxtoolbox.com
```

### Regenerate Brevo SMTP key

- Sau khi expose key trong chat session debug, regenerate trên Brevo dash
- Update `backend/.env` mới
- `pm2 restart sol-api`
- Verify test gửi magic link → Gmail nhận đẹp, KHÔNG spam

### OG images branded (7 ảnh Sprint 31-5)

- Script: `scripts/og-gen.py` (Python + Pillow + Sharp composite)
- Template SVG branded với Sol palette + Be Vietnam Pro font
- Output 1200×630 JPEG, file size <100kb
- Upload qua WP REST API → set `featured_media` cho 7 bài

---

## 2026-05-22 tối — Documentation overhaul

### New files created (6)

- `docs/05-ARCHITECTURE.md` — kiến trúc đầy đủ (domains, VPS layers, backend stack, integrations, mail stack)
- `docs/06-DATABASE.md` — Postgres + Prisma schema chi tiết (38 model)
- `docs/07-DEPLOY_WORKFLOW.md` — workflow edit code → live + edge cases
- `docs/08-OPERATIONS.md` — runbook ops + troubleshooting
- `docs/09-DECISIONS.md` — technical decisions log với date + lý do
- `docs/10-ROADMAP.md` — roadmap Day 1 → D-Day → post-launch

### Updated files

- `docs/00-INDEX.md` — refresh file structure, Sol Stack Status table state 2026-05-22, add Backend Stack + Mail Stack section

### Stats

- Total file mới: 6
- Total file updated: 1
- Total dòng documentation viết hôm nay: ~1800 dòng (markdown)

---

## 2026-05-23 sáng — 3-cohort FTND backend migration

### `backend/src/journey/cohortConfig.ts` (new)

Source of truth cho 3 cohort:

```typescript
export const COHORTS = {
  LIGHT:    { ftnd: [0, 3], total: 35, recognize: 7, control: 7,  master: 21, qDay: 15 },
  MODERATE: { ftnd: [4, 6], total: 52, recognize: 7, control: 14, master: 30, qDay: 22 },
  HEAVY:    { ftnd: [7,10], total: 65, recognize: 7, control: 21, master: 30, qDay: 28 },
};
```

Plus helper `computeCohort(ftndScore)` → `'LIGHT'|'MODERATE'|'HEAVY'`.

### `backend/src/journey/service.ts` V2 helpers

- `buildJourneyV2(user)` → `{ cohort, dayInJourney, chapter, chapterIndex, totalDays, qDayDay }`
- `buildQDayV2(user)` → `{ qDayDate, daysToQDay, needsConfirmation }`
- `getCohortMilestones(cohort, day)` → milestone array filter cho dayInJourney
- Backward compat: cũ `buildJourney` vẫn được giữ cho dashboard legacy (delete sau khi confirm 100% migrate)

### Schema migration `User.ftndCohort`

```prisma
model User {
  // ... existing fields
  ftndCohort   String?  @db.VarChar(16)   // 'LIGHT' | 'MODERATE' | 'HEAVY'
}
```

- Migration: `prisma/migrations/20260523_add_ftnd_cohort/migration.sql`
- Auto-backfill cho user cũ: SQL UPDATE where `ftndScore IS NOT NULL` set theo dải FTND
- Default null → backend recompute lúc user submit FTND

### Routes `/journey/dashboard` V2 response

Response cũ giữ keys `journey/qDay/checkin/...`, thêm 2 keys mới:

```json
{
  "journeyV2": { "cohort": "MODERATE", "dayInJourney": 12, "chapter": "Kiểm Soát", "totalDays": 52, "qDayDay": 22 },
  "qDayV2": { "qDayDate": "2026-06-14", "daysToQDay": 10, "needsConfirmation": false }
}
```

Frontend đọc `journeyV2` ưu tiên; fallback `journey` cũ nếu null.

### POST `/journey/onboarding/ftnd`

- Input: `answers[6]` array (FTND 6 câu)
- Compute score 0-10
- Compute cohort qua `computeCohort(score)`
- Persist `user.ftndScore + user.ftndCohort`
- Response: `{ score, cohort, label: 'NHẸ' | 'VỪA' | 'NẶNG', cohortPlan: { total, qDay, ... } }`

---

## 2026-05-23 trưa — Frontend cohort migration

### `dashboard/src/pages/Journey.tsx`

Refactor để render dynamic theo cohort của user:

- Grid Day 1 → Day N (35/52/65) thay vì hardcoded 88
- Phase badges dynamic: "Nhận Diện" (Day 1-7) / "Kiểm Soát" (Day 8-14 hoặc 8-21 hoặc 8-28) / "Làm Chủ" (...) tùy cohort
- Q-Day marker đỏ tại `cohort.qDay` (Day 15 / 22 / 22-28)
- Tái Thiết extension Day 36+/53+/66+ ở dưới grid chính với label "🎁 Tái Thiết — Bảo trì miễn phí"

### `dashboard/src/pages/Overview.tsx`

- Mặc định landing → load `/journey/dashboard` → render `<JourneySimulator />` đầu tiên
- `<DailyJourneyAlert />` pulse banner phía trên simulator
- Phase view bên dưới (PhaseObserver/Action/Liberation/Rebuild) chỉ render tương ứng cohort.chapterIndex
- Bỏ luôn block "88-day phase" cũ — cohort-aware all the way

### `dashboard/src/components/PhaseBar.tsx`

- Refactor render 4 chapter dynamic theo cohort widths
- Width prop dạng `[7, 7, 21]` (LIGHT) hoặc `[7, 14, 30]` (MODERATE) hoặc `[7, 21, 30]` (HEAVY)
- Marker Q-Day đỏ render position % theo cohort

### `dashboard/src/components/views/phaseD/PhaseRebuild.tsx`

- Refactor để show "Tái Thiết" content khi `dayInJourney > cohort.total`
- Marketing copy: "🎁 Chúc mừng anh hoàn thành lộ trình chính. Đây là phần thưởng miễn phí — Sol đi cùng anh long-term."
- Body recovery milestones Day 75+ (NHS/Doll & Hill BMJ 2004)

---

## 2026-05-23 trưa — Rename "Sổ Hành Trình" → "Sổ Lưu Niệm"

UI label only — backend file `memoryBook.ts` giữ tên internal.

**Anh giải thích**: "Sổ Lưu Niệm vì là cái họ lưu lại khoe bạn bè nếu cần."

Files updated:
- `dashboard/src/components/Sidebar.tsx` — label "Sổ Lưu Niệm"
- `dashboard/src/pages/Workbook.tsx` — H1 + breadcrumb
- `dashboard/src/components/views/phaseE/MemoryBookCard.tsx` — title
- WP wiki articles: update wording dần (không gấp, do bulk-update task riêng)

Quyết định: [09-DECISIONS.md](./09-DECISIONS.md) section "2026-05-23 — Sổ Lưu Niệm".

---

## 2026-05-23 chiều — Seed test users matrix

### `scripts/seed-test-users.ts` (new)

Tạo 10 user pilot QA toàn 3 cohort × milestone khác nhau:

| # | Email | Cohort | Day | Phase |
|---|---|---|---|---|
| 1 | `qa-light-d3@sol.vn`    | LIGHT    | 3  | Nhận Diện |
| 2 | `qa-light-d15@sol.vn`   | LIGHT    | 15 | Q-Day boundary |
| 3 | `qa-light-d35@sol.vn`   | LIGHT    | 35 | Memory Book trigger |
| 4 | `qa-mod-d7@sol.vn`      | MODERATE | 7  | end Nhận Diện |
| 5 | `qa-mod-d22@sol.vn`     | MODERATE | 22 | Q-Day boundary |
| 6 | `qa-mod-d52@sol.vn`     | MODERATE | 52 | Memory Book trigger |
| 7 | `qa-heavy-d14@sol.vn`   | HEAVY    | 14 | Kiểm Soát early |
| 8 | `qa-heavy-d28@sol.vn`   | HEAVY    | 28 | Q-Day boundary |
| 9 | `qa-heavy-d65@sol.vn`   | HEAVY    | 65 | Memory Book trigger |
| 10| `qa-rebuild-d70@sol.vn` | HEAVY    | 70 | Tái Thiết extension |

Mỗi user có: ftndCohort + quitDate + cigsBaseline + pricePerCig (mặc định 1000đ).

Chạy: `cd backend && npx tsx scripts/seed-test-users.ts`.

Đăng nhập: magic link vào email → token được forward đến tester qua chia sẻ private.

---

## 2026-05-23 chiều — Build JourneySimulator + bodyRecovery research

### `dashboard/src/lib/bodyRecovery.ts` (new ~400 dòng)

**4 recovery curves** với exponential half-life formula:

```typescript
pct(curve, day) = floor + (max - floor) × (1 - 2^(-day / halfLifeDay))
```

| System | halfLife | floor | max | Why |
|---|---:|---:|---:|---|
| 🫀 Tim mạch | 90  | 5  | 100 | CDC 20p HA bt; 50% NMCT 1 năm |
| 🫁 Phổi | 180 | 2  | 100 | NHS lông mao 9 tháng; cancer 50% 10 năm |
| 🧠 Não bộ | 45  | 10 | 100 | Brody 2006 nAChR 6-12 tuần |
| 🛡️ Miễn dịch | 60  | 5  | 100 | WBC 1 tuần; T-cell 1 năm |

**28 milestones** với citation URLs từ:
- CDC (cdc.gov/tobacco)
- NHS (nhs.uk/live-well/quit-smoking)
- AHA (heart.org)
- Surgeon General 2020 report (HHS)
- Mayo Clinic Proceedings
- PubMed/PMC peer-reviewed (Brody 2006, Cosgrove 2009, Rademacher 2016, Saint-André 2024, Shaw 2000 BMJ)

14 unique citation URLs total.

Spec chi tiết: [12-JOURNEY_SIMULATOR_DESIGN.md](./12-JOURNEY_SIMULATOR_DESIGN.md).

### `dashboard/src/components/JourneySimulator.tsx` (new ~600 dòng)

**HERO Tổng Quan** = trang Hành Trình mặc định.

- **Slider time-travel** Day 0 → Day 730 (2 năm)
- **5 quick jumps** (Hôm nay / 1 tuần / 1 tháng / 3 tháng / 1 năm)
- **3 hero stats** nhảy số live theo slider:
  - Điếu KHÔNG đốt = simDay × cigsBaseline
  - Tiền tiết kiệm = cigsAvoided × pricePerCig
  - Tuổi thọ thêm = cigsAvoided × 11 phút (BMJ 2000)
- **4 RecoveryRing** (Tim/Phổi/Não/Miễn dịch) — SVG circle fill % theo slider
- **Milestone list** auto-filter theo dayInJourney + tag "🆕" cho milestone vừa đạt

**Wire vào** `Overview.tsx` — mặc định landing.

---

## 2026-05-23 tối — Daily Alert pulse + 27 curated alerts

### `dashboard/src/lib/dailyJourneyAlerts.ts` (new ~280 dòng)

27 daily alerts curated tone founder-to-founder, gọi "anh":

Distribution:
- Day 1-30: dense (1 alert/day) — critical onboarding period
- Day 35, 45, 60, 90, 180, 365: milestone-based

Mỗi alert có:
- `dayInJourney` (number)
- `icon` (emoji)
- `headline` (1 dòng <60 char)
- `body` (2-3 dòng tone trầm ấm)

Ví dụ Day 1:
```
🌅 Ngày 1 — Hơi thở đầu tiên không khói
Anh đã làm việc khó nhất rồi — quyết định. 20 phút sau khi anh
quyết, huyết áp anh đã về bình thường. Cơ thể nhớ.
```

### `dashboard/src/components/DailyJourneyAlert.tsx` (new ~150 dòng)

- Pulse banner phía trên JourneySimulator
- `animate-pulse-slow` 2s loop (custom Tailwind keyframe) — gây attention vừa phải, không annoy
- LocalStorage `sol_alert_dismissed_day_{N}` → 1 lần dismiss = không show lại trong ngày
- Reset mỗi midnight (theo `dayInJourney` đổi)
- Click expand → modal full text + share button

---

## 2026-05-23 tối — Sidebar rename + URL routing

### Rename labels

- `/` → "Tổng Quan" → **"Hành Trình"** (= Overview.tsx render JourneySimulator)
- `/journey` → "Hành trình" → **"Nhật Ký & Check-in"** (= Journey.tsx grid 88-day cohort-aware)

### Files updated

- `dashboard/src/components/Sidebar.tsx` — labels mới
- `dashboard/src/components/Layout.tsx` — nav links + active state
- `dashboard/src/App.tsx` — routes giữ nguyên paths (chỉ rename labels)

Anh dụng ý: "Tổng Quan" quá clinical, "Hành Trình" mới là cảm xúc landing. Trang grid 88-day thực ra là "Nhật Ký" hằng ngày user check-in — đổi label đúng bản chất.

---

## 2026-05-23 tối — Documentation overhaul (3 docs mới + cập nhật)

### New files

- `docs/12-JOURNEY_SIMULATOR_DESIGN.md` — formula + 28 citations + UI decisions (260 dòng)
- `docs/13-UX_FLOW.md` — user journey end-to-end 6 flow (mới hôm nay)
- `docs/14-FUNCTIONAL_MAP.md` — sơ đồ chức năng pages/components/API/cron (mới hôm nay)

### Updated files

- `docs/05-ARCHITECTURE.md` — bổ sung 4.5 cohort logic, frontend simulator components, /journey/dashboard V2
- `docs/00-INDEX.md` — file structure +3 docs, Sol Stack Status 2026-05-23 mới
- `docs/09-DECISIONS.md` — 4 quyết định mới ngày 23/5 (cohort migrate, Sổ Lưu Niệm, Memory Book trigger, Body Recovery extension)

### Stats

- 12 docs total cho dự án (00-14 + CHANGELOG + DEPLOYMENT + others)
- ~1500 dòng markdown viết hôm nay
- Documentation đã đủ pickup context cho bất kỳ Claude session mới

---

## 2026-05-23 — Bug fixes

### Rate limit auth/anonymous loop

**Triệu chứng**: Console liên tục `429 Too Many Requests /api/auth/anonymous` khi mở dashboard ở incognito.

**Root cause**: App.tsx useEffect không có cleanup → mỗi re-render gọi POST /auth/anonymous → hit rate-limit middleware 5/min → fail → re-render loop.

**Fix**:
```tsx
const [bootstrapping, setBootstrapping] = useState(true);
useEffect(() => {
  let cancelled = false;
  bootstrap().then(() => { if (!cancelled) setBootstrapping(false); });
  return () => { cancelled = true; };
}, []);
```

Plus add deviceUid check trước → nếu localStorage có rồi thì skip gọi anonymous endpoint.

### Vite base `/app/` → `/`

**Triệu chứng**: Sau `npm run build` dashboard, assets path là `/app/assets/...` → 404 vì nginx serve `/var/www/bothuocla-sol-vn/` ở root.

**Root cause**: `vite.config.ts` có `base: '/app/'` từ thời em test local cũ.

**Fix**:
```ts
// vite.config.ts
export default defineConfig({
  base: process.env.VITE_BASE || '/',   // default '/' giờ
  // ...
});
```

Build command rõ ràng: `VITE_BASE=/ VITE_API_BASE=/api npm run build`.

### Schema migration `ftndCohort` cần backfill

**Triệu chứng**: Sau migrate `ALTER TABLE User ADD COLUMN ftndCohort`, dashboard cho user cũ load nil cohort → /journey/dashboard return null → frontend crash.

**Fix**: SQL backfill ngay sau migrate:
```sql
UPDATE "User" SET "ftndCohort" = 
  CASE 
    WHEN "ftndScore" BETWEEN 0 AND 3 THEN 'LIGHT'
    WHEN "ftndScore" BETWEEN 4 AND 6 THEN 'MODERATE'
    WHEN "ftndScore" BETWEEN 7 AND 10 THEN 'HEAVY'
    ELSE NULL
  END
WHERE "ftndScore" IS NOT NULL AND "ftndCohort" IS NULL;
```

Plus thêm fallback `journeyV2 ?? journey` (legacy) ở frontend phòng user chưa có cohort.

---

## Summary tháng 5

- **Code**: backend Express + Prisma deploy production, dashboard + admin SPA live, 3-cohort FTND migration, JourneySimulator HERO + Daily Alert
- **Content**: 7 bài Sprint 31-5 publish, 143 wiki bulk inject author block
- **Mail**: Brevo SMTP + DKIM/SPF/DMARC full setup
- **Payment**: VietQR static decision
- **SEO**: FAQ deprecation strategy, audit PASS
- **Docs**: 12 file documentation overhaul (00-14 + CHANGELOG)
- **QA**: 10 seed test users matrix (3 cohort × milestones)

**D-Day still 8 ngày**. Ready for soft launch Wave 1 từ 24-25/5.

---

**Last updated**: 2026-05-23
**Maintainer**: Khang Sol
