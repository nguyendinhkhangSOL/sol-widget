# Sol — Changelog tháng 5/2026

> Log chi tiết từng task + bug fix theo ngày, dùng để recall context khi review hoặc nhập session mới.
> Cập nhật: 2026-05-22.

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

## Summary tháng 5

- **Code**: backend Express + Prisma deploy production, dashboard + admin SPA live
- **Content**: 7 bài Sprint 31-5 publish, 143 wiki bulk inject author block
- **Mail**: Brevo SMTP + DKIM/SPF/DMARC full setup
- **Payment**: VietQR static decision
- **SEO**: FAQ deprecation strategy, audit PASS
- **Docs**: 11 file documentation overhaul

**D-Day still 9 ngày**. Ready for soft launch Wave 1 từ 23/5.

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
