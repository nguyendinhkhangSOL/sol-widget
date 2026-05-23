# Sol — Architecture Overview

> Toàn bộ kiến trúc kỹ thuật Sol / Đi Cùng Sol. Đọc file này để hiểu hệ thống vận hành cách nào.
> Cập nhật: 2026-05-22 (sau khi deploy backend Express + Brevo SMTP + dashboard SPA).

---

## 1. Bird's-eye view

```
                        ┌────────────────────────────────────┐
                        │      Cloudflare (CDN + Proxy)      │
                        │  - SSL Full strict                 │
                        │  - Worker sol-robots-override      │
                        │  - AI bot allow (22 bots)          │
                        │  - DNS authoritative cho sol.vn    │
                        └────────────┬───────────────────────┘
                                     │
        ┌────────────────────────────┼───────────────────────────────┐
        │                            │                               │
        ▼                            ▼                               ▼
  ┌──────────────┐          ┌────────────────────┐         ┌──────────────────┐
  │   sol.vn     │          │  bothuocla.sol.vn  │         │  admin.sol.vn    │
  │  (WordPress) │          │  (Dashboard SPA +  │         │  (Admin SPA)     │
  │  Wiki SEO    │          │   Backend API)     │         │  Ops console     │
  └──────┬───────┘          └─────────┬──────────┘         └────────┬─────────┘
         │                            │                              │
         ▼                            ▼                              ▼
  Hosting eztech.vn        VPS 103.72.57.11 (Ubuntu 24.04)     (cùng VPS)
  (cPanel WP riêng)        Nginx → Express :4000 → Postgres
  140+ bài SEO             + Dashboard static + Admin static
  Rank Math + RSS          + 26 cron job in-process
                           + PM2 sol-api process
```

**Ngoài ra**: `www.sol.vn` → 301 redirect về `sol.vn`.

---

## 2. Domains & roles

| Domain | Mục đích | Tech stack | Hosting |
|---|---|---|---|
| `sol.vn` | Content SEO + wiki (143 bài) + landing tổng | WordPress + Rank Math + RSS | eztech.vn cPanel (KHÁC VPS) |
| `bothuocla.sol.vn` | Dashboard SPA + Backend REST API + Zalo OA webhook | Vite React 18 + Express 4 + Prisma + Postgres 16 | VPS 103.72.57.11 |
| `admin.sol.vn` | Admin ops console — Zalo OA, Content CMS, Payments, SOS | Vite React 18 (static SPA) | Cùng VPS, nginx vhost riêng |
| `www.sol.vn` | Redirect | — | Cloudflare 301 → `sol.vn` |

---

## 3. VPS layers (bothuocla.sol.vn)

```
[ Internet → Cloudflare proxy (orange cloud) ]
                       │
                       ▼  HTTPS :443
┌──────────────────────────────────────────────────────────┐
│  Nginx 1.24 — TLS terminate, route, gzip, security hdrs  │
│  /etc/nginx/sites-enabled/bothuocla.sol.vn               │
│                                                          │
│  ─ location /api/zalo/webhook   → proxy 127.0.0.1:4000   │
│  ─ location /api/socket.io/      → proxy + WS upgrade    │
│  ─ location /api/                → proxy :4000           │
│  ─ location /assets/             → static cache 1y       │
│  ─ location /                    → SPA fallback index    │
└────────────────┬─────────────────────────────────────────┘
                 │
       ┌─────────┴──────────┐
       ▼                    ▼
 ┌────────────┐       ┌────────────────────┐
 │ Dashboard  │       │ Backend Express    │
 │ static     │       │ (PM2 sol-api)      │
 │ /var/www/  │       │ 127.0.0.1:4000     │
 │ sol-widget-│       │ /var/www/sol-      │
 │ old/dash.. │       │ widget-old/backend │
 └────────────┘       │   ├─ Prisma ORM    │
                      │   ├─ Socket.IO     │
                      │   └─ 26 cron jobs  │
                      └─────────┬──────────┘
                                │
                                ▼
                       ┌────────────────────┐
                       │ Postgres 16 local  │
                       │ port 5432          │
                       │ db: sol_prod       │
                       │ user: sol_app      │
                       └────────────────────┘
```

**Path quan trọng trên VPS**:

```
/var/www/sol-widget-old/         ← git clone code đã deploy (codebase cũ)
  ├── backend/                    Express + Prisma source + dist/
  ├── dashboard/                  React SPA source (build → dist/)
  └── admin/                      React SPA source (build → dist/)

/var/www/bothuocla-sol-vn/        ← dashboard dist served bởi nginx
/var/www/admin-sol-vn/            ← admin dist served bởi nginx

/etc/nginx/sites-enabled/
  ├── bothuocla.sol.vn           SPA + API proxy
  └── admin.sol.vn                Admin SPA + IP allowlist (optional)

/etc/letsencrypt/live/
  ├── bothuocla.sol.vn/           Let's Encrypt cert
  └── admin.sol.vn/

/home/solop/                      User SSH chính (NOPASSWD sudo)
```

---

## 4. Backend stack chi tiết

### 4.1. Process

- **Runtime**: Node 20 LTS (NodeSource).
- **Process manager**: PM2 — process name `sol-api`, `pm2 startup` + `pm2 save` để bật auto sau reboot.
- **Listen**: `127.0.0.1:4000` (KHÔNG expose ngoài, nginx proxy).
- **Build**: `tsc` → `dist/index.js`, start `node dist/index.js`.

### 4.2. Framework + libs

```
Express 4.21    HTTP + middleware (cors, helmet, rate-limit)
Socket.IO 4.8   Realtime chat (user-mentor)
Prisma 5.22     ORM PostgreSQL — schema có 38 model
node-cron 3     26 cron jobs in-process
nodemailer 6    SMTP qua Brevo (magic link email)
@anthropic-ai   Claude API client (AI mentor)
bcryptjs        Hash recovery code + password (nếu có)
jsonwebtoken    JWT auth (30d expiry)
zod             Validation request body
web-push        VAPID web push notification
pino + pretty   Structured logging
helmet          Security headers
@sentry/node    Error tracking (DSN optional)
```

### 4.3. Routers mount (qua nginx `/api/*`)

```
/auth/*              anonymous / phone OTP / Zalo OAuth / recovery
/auth/email/*        magic link email (Brevo)
/users/*             profile + notification prefs
/journey/*           dashboard, qday-confirm, onboarding, money-breakdown
/messages/*          chat AI + history
/checkins/*          daily check-in
/exercises/*         workbook exercise log
/content/*           content items (per dayNumber × module × voice)
/notifications/*     notification preferences
/tiers/*             tier status, upgrade
/payments/*          VietQR generate + admin confirm PAID
/refunds/*           refund queue (queue: APPROVE/DENY/PROCESSED)
/voice/* + /voices/* voice messages library
/confessions/*       Silent Companionship (Khoảng Lặng anonymous)
/khang-questions/*   HoiKhang mailbox
/lapse/*             lapse event log
/crisis-timer/*      90s craving timer
/stats/*             anonymous stats
/api/zalo/*          Zalo OA webhook + ZNS + admin
/api/messaging/*     messaging policy
/admin/*             ~30 admin endpoint (gate isAdmin)
```

Health check: `GET /healthz` → `{ ok: true, now: ISO }`.

### 4.4. Cron scheduler

`backend/src/scheduler/worker.ts` — 26 cron job, TZ `Asia/Ho_Chi_Minh`.

**Critical** (chạy mỗi phút / 5 phút):
- `* * * * *` `deliverDueNotifications` — đẩy Notification queue ra channel (push / Zalo / in-widget)
- `*/5 * * * *` `fireDuePushes` — Zalo ZNS 51-day journey queue
- `*/15 * * * *` `smartSchedulerSweep` — match content theo moment user

**Hàng ngày**:
- `0 7` morning_goal push
- `5 7` Q-Day morning reminder
- `30 7` recompute journey day + streak milestones
- `0 8` email funnel + memory book delivery
- `0 14` phenomena alert
- `0 19` missed-day + prep reminders
- `0 20` evening check-in
- `30 21` NIGHT_STORY

Xem thêm trong code `worker.ts` (1057 dòng).

**⚠️ Rule**: chỉ chạy 1 instance scheduler. `ENABLE_SCHEDULER=true` chỉ set 1 PM2 process.

---

## 5. Frontend stacks

### 5.1. Dashboard (bothuocla.sol.vn)

```
Vite 5 + React 18 + React Router 6 (BrowserRouter, basename="/")
Zustand 4 (state)
Tailwind 3 + Be Vietnam Pro 17-18px (chuyên 45+)
Bespoke fetch wrapper (KHÔNG React Query)
@sentry/react (optional)
```

**18 page**: `/login`, `/auth/email`, `/` Overview, `/chat`, `/journey/[:day]`, `/workbook`, `/history`, `/analytics`, `/settings`, `/pricing`, `/test-ftnd` (entry funnel), `/refund`, `/reports`, `/voice`, `/science`, `/q-day-checklist`, `/doc` (Khoảng Lặng), `/nghe`, `/hoi`.

**Auth bootstrap (App.tsx)**: 
1. Zalo OAuth callback `?zalo=success`
2. Cross-domain transfer `?sol_token=`
3. JWT từ `localStorage.sol_token`
4. Fallback: anonymous user qua `POST /api/auth/anonymous`

**Build**:
```
cd /var/www/sol-widget-old/dashboard
VITE_BASE=/ VITE_API_BASE=/api npm run build
cp -r dist/* /var/www/bothuocla-sol-vn/
```

### 5.2. Admin (admin.sol.vn)

```
Vite 5 + React 18 + React Router 6
Zustand 4 + Tailwind 3 (no UI lib — hand-rolled)
```

**18 page** chia nhóm sidebar: Hàng ngày (`/`, `/users`, `/refunds`), Nhắn tin (`/messaging`, `/zalo-templates`, `/zalo-journey`, `/zalo-sos`), Nội dung (`/content`, `/canned-replies`, `/voice`, `/q-day-checklist`), Phân tích (`/analytics`, `/cohorts`, `/wiki`), Hệ thống (`/ai`).

**Auth**: Email magic link only. Backend flag `user.isAdmin`. JWT trong `localStorage.sol_token`.

**Cross-origin**: admin gọi `https://bothuocla.sol.vn/api/admin/...` → backend `CORS_ORIGINS` whitelist `admin.sol.vn`.

### 5.3. Widget (frontend/, embed cho partners)

Build IIFE `sol-widget.js` (~343kB, gzip 101kB) inline CSS — embed vào sol.vn WordPress hoặc partner site. Hiện chưa deploy ở v3 — giữ độc lập.

---

## 6. External integrations

| Service | Role | Setup |
|---|---|---|
| **Brevo** (smtp-relay.brevo.com:587 STARTTLS) | Magic link email | DKIM + SPF + DMARC DNS Cloudflare — config 2026-05-22 |
| **Zalo OA** (App 3779171417159107862) | OAuth login + push ZNS + SOS | Webhook `https://bothuocla.sol.vn/api/zalo/webhook` |
| **Anthropic Claude** (Haiku primary, Sonnet escalated) | AI mentor chat | Key trong DB `AppSetting` (encrypted-at-rest TODO), fallback env |
| **VietQR static** (img.vietqr.io) | Payment QR | Backend gen `https://img.vietqr.io/image/{BIN}-{ACC}-compact2.png?amount=X&addInfo=SOL+{userId}`. User CK tay → admin confirm. |
| **Cloudflare Worker** `sol-robots-override` | robots.txt + well-known endpoints + Markdown for Agents | Code: `workers/robots-override.js` |
| **Let's Encrypt** | SSL ECDSA | Certbot systemd timer auto-renew |
| **GA4** `G-S5ELGXBLWK` | Web analytics | sol.vn + bothuocla.sol.vn |
| **Microsoft Clarity** `wu12r2qt0o` | Session replay + heatmap | bothuocla.sol.vn |
| **GSC** | Indexing tracking | 4 properties (Domain + URL prefix × sol.vn + bothuocla) |

---

## 7. Mail stack (DKIM/SPF/DMARC — config 2026-05-22)

```
                    [ Sender: khang@sol.vn (Brevo SMTP) ]
                                  │
                                  ▼
                       Brevo signs với DKIM key
                                  │
                                  ▼
   ┌────────────────── DNS Cloudflare sol.vn ──────────────────┐
   │  TXT  mail._domainkey.sol.vn  v=DKIM1; k=rsa; p=...        │
   │  TXT  sol.vn                  v=spf1 include:spf.brevo.com │
   │                               include:zoho.com ~all        │
   │  TXT  _dmarc.sol.vn           v=DMARC1; p=quarantine;      │
   │                               rua=mailto:khang@sol.vn      │
   └────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          [ Receiver Gmail/Outlook ]
                          ✓ SPF pass · ✓ DKIM valid · ✓ DMARC quarantine
```

**Lý do dùng Brevo thay Zoho**: Zoho free không có App Password (yêu cầu phải mua paid để dùng SMTP). Brevo free 300 mail/ngày + có SMTP key sẵn → đủ pilot 100 user.

**Fix email bug 2026-05-22**: bỏ `text` part trong sendMail → single-part `text/html` → Gmail không còn raw base64. Xem `backend/src/auth/email/smtpClient.ts`.

---

## 8. Data flow ví dụ — magic link login

```
1. User mở https://bothuocla.sol.vn/auth/email
2. Nhập email khang@gmail.com → POST /api/auth/email/send-magic
3. Backend gen JWT token (5p TTL) → save EmailVerificationToken row
4. Backend Brevo sendMail HTML link: https://bothuocla.sol.vn/auth/email/verify?token=...
5. Gmail nhận, DKIM verify pass (DNS Cloudflare).
6. User click → frontend GET /api/auth/email/verify?token=... 
7. Backend verify token → upsert User + set JWT 30d → response
8. Frontend save JWT vào localStorage → redirect /
9. Dashboard fetch /api/users/me với Authorization: Bearer <jwt>
```

---

## 9. Tham khảo

- [02-CHEATSHEET.md](./02-CHEATSHEET.md) — lệnh thường dùng
- [04-VPS_CONFIG.md](./04-VPS_CONFIG.md) — VPS Ubuntu config
- [06-DATABASE.md](./06-DATABASE.md) — Postgres + Prisma schema
- [07-DEPLOY_WORKFLOW.md](./07-DEPLOY_WORKFLOW.md) — workflow edit → live
- [08-OPERATIONS.md](./08-OPERATIONS.md) — runbook ops hằng ngày
- [DEPLOYMENT_PLAN_OLD_CODEBASE.md](./DEPLOYMENT_PLAN_OLD_CODEBASE.md) — kế hoạch deploy gốc 21/5

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
