# SOL — Infra & Deployment Briefing
## Triển khai `huongdi.sol.vn` + `adminhuongdi.sol.vn` trên cùng VPS với `bothuocla.sol.vn`

> Document này tổng hợp toàn bộ thông tin hạ tầng cần thiết để team dev triển
> khai 2 sub-domain `huongdi.sol.vn` (dashboard) + `adminhuongdi.sol.vn` (admin panel)
> trên cùng VPS với app SOL hiện hữu.
>
> **Kiến trúc:** Admin là static SPA dùng chung backend `huongdi-api:4001`
> (theo pattern `admin.sol.vn` dùng chung backend `sol-api:4000`).
>
> **⚠️ Bảo mật:** Tất cả mật khẩu, API key, JWT secret, SSH key, DB password
> KHÔNG có trong file này. Liên hệ Khang Sol (admin) để nhận `.env` thật.
>
> **Cập nhật:** 2026-06-16

---

## 1. SERVER (VPS)

| Mục | Giá trị |
|---|---|
| **Provider** | eztech.vn (Cloud VPS Vietnam) |
| **Hostname** | `sol-vps-01` |
| **Public IP** | `103.72.57.11` |
| **OS** | Ubuntu 24.04 LTS (Noble) |
| **Resources** | 2 GB RAM · 2 vCPU · 30 GB SSD (28 GB usable) |
| **Timezone** | `Asia/Ho_Chi_Minh` (UTC+7) |
| **Current disk** | ~11 GB / 28 GB (42% — đủ chỗ cho huongdi ~500 MB) |

### SSH Access

| | |
|---|---|
| User | `solop` (sudo NOPASSWD) |
| Port | 22 |
| Auth | Ed25519 key-based (key fingerprint trao tay) |
| Bootstrap | `ssh solop@103.72.57.11` |

> Team dev cần Khang Sol whitelist SSH key trước khi access.

### Folder Structure `/var/www/`

```
/var/www/
├── sol-widget-old/              ← Git repo chính (sol-widget)
│   ├── backend/                 ← Express.js + Prisma (PM2 process)
│   ├── dashboard/               ← React + Vite (build → dist/)
│   ├── admin/                   ← React + Vite (build → dist/)
│   └── docs/
├── bothuocla-sol-vn/            ← nginx root — dashboard SPA
└── admin-sol-vn/                ← nginx root — admin SPA

→ Thêm cho huongdi:
├── huongdi/                     ← Git repo huongdi (clone riêng)
│   ├── backend/                 ← Express.js (PM2 process huongdi-api:4001)
│   ├── dashboard/               ← User-facing SPA → huongdi-sol-vn/
│   └── admin/                   ← Admin panel SPA → adminhuongdi-sol-vn/
├── huongdi-sol-vn/              ← nginx root — huongdi.sol.vn (user dashboard)
└── adminhuongdi-sol-vn/         ← nginx root — adminhuongdi.sol.vn (admin panel)
```

---

## 2. PROCESS MANAGER — PM2

### Process hiện tại

| Process | Port | Script | Mode | Status | Memory |
|---|---|---|---|---|---|
| `sol-api` | 4000 (localhost) | `dist/index.js` | fork | online | ~200-300 MB |

**Sau khi thêm huongdi:**

| Process | Port | Script | Phục vụ |
|---|---|---|---|
| `sol-api` | 4000 | `/var/www/sol-widget-old/backend/dist/index.js` | bothuocla + admin.sol.vn |
| `huongdi-api` | 4001 | `/var/www/huongdi/backend/dist/index.js` | huongdi + adminhuongdi.sol.vn |

> Cả `huongdi.sol.vn` (user) và `adminhuongdi.sol.vn` (admin) gọi chung 1 backend
> `huongdi-api:4001`. Phân biệt qua role/permission ở route level
> (vd `/api/admin/*` yêu cầu `isAdmin = true`).

**Cwd:** `/var/www/sol-widget-old/backend/`
**Node:** v20.20.2 LTS
**Auto-restart:** max_memory_restart 500 MB
**Logs:** `~solop/.pm2/logs/sol-api-*.log`

### Cron / Scheduler

- Backend tự chạy 26 cron jobs in-process (NOT system cron)
- Toggle bằng env `ENABLE_SCHEDULER=true`
- **Quan trọng:** Chỉ 1 PM2 instance có `ENABLE_SCHEDULER=true` để tránh duplicate fire

### Thêm process cho huongdi

```js
// ecosystem.config.js — append vào apps array
{
  name: 'huongdi-api',
  script: 'dist/index.js',
  cwd: '/var/www/huongdi/backend',
  instances: 1,
  exec_mode: 'fork',
  env: { NODE_ENV: 'production', PORT: 4001 }, // ← port khác sol-api
  max_memory_restart: '500M',
}
```

```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## 3. WEB SERVER — NGINX

### Sites đang serve

| Domain | Root | Backend proxy | SSL |
|---|---|---|---|
| `bothuocla.sol.vn` | `/var/www/bothuocla-sol-vn/` | `:4000` qua `/api/*` | Let's Encrypt |
| `admin.sol.vn` | `/var/www/admin-sol-vn/` | — (static SPA) | Let's Encrypt |

### Config files

- Main: `/etc/nginx/nginx.conf` (user `www-data`, workers auto)
- Per-site: `/etc/nginx/sites-enabled/<domain>`
- Source templates: `app/scripts/nginx-bothuocla-sol-vn-v3.conf`

### SSL — Let's Encrypt

- Tool: Certbot (snap)
- Cert path: `/etc/letsencrypt/live/<domain>/`
- Auto-renew: systemd timer `certbot.timer` (2× daily)

### Vhost #1 — `huongdi.sol.vn` (user dashboard)

File: `/etc/nginx/sites-enabled/huongdi.sol.vn`

```nginx
server_name huongdi.sol.vn;
root /var/www/huongdi-sol-vn;

location /api/ {
    proxy_pass http://127.0.0.1:4001;  # ← port huongdi-api
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;  # SPA fallback
}
```

### Vhost #2 — `adminhuongdi.sol.vn` (admin panel)

File: `/etc/nginx/sites-enabled/adminhuongdi.sol.vn`

```nginx
server_name adminhuongdi.sol.vn;
root /var/www/adminhuongdi-sol-vn;

location /api/ {
    proxy_pass http://127.0.0.1:4001;  # ← cùng backend huongdi-api
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;  # SPA fallback
}

# (Tuỳ chọn) IP whitelist cho admin — chỉ cho IP văn phòng/VPN truy cập
# allow 1.2.3.4;
# deny all;
```

### Reload + SSL cho cả 2 vhost

```bash
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx \
  -d huongdi.sol.vn \
  -d adminhuongdi.sol.vn \
  --email <ADMIN_EMAIL> --agree-tos --non-interactive
```

> Certbot tạo 2 cert riêng (hoặc 1 SAN cert chứa cả 2 domain — tuỳ flag).

---

## 4. DNS & CLOUDFLARE

### Provider

- **Cloudflare Free plan** (account riêng — Khang quản lý)
- Zone: `sol.vn`

### Records hiện tại (zone sol.vn)

| Type | Name | Content | Proxy | Purpose |
|---|---|---|---|---|
| A | sol.vn | 103.221.221.79 | ✓ Proxied | WordPress hosting (VPS khác) |
| A | bothuocla | 103.72.57.11 | ✓ Proxied | App SOL trên VPS này |
| CNAME | www | sol.vn | ✓ Proxied | WWW redirect |
| MX | sol.vn | mx.zoho.com (10) | DNS only | Email Zoho |
| MX | sol.vn | mx2.zoho.com (20) | DNS only | Email backup |

### Thêm cho huongdi (2 record)

```
# User dashboard
Type:    A
Name:    huongdi
Content: 103.72.57.11
Proxy:   Proxied
TTL:     Auto

# Admin panel
Type:    A
Name:    adminhuongdi
Content: 103.72.57.11
Proxy:   Proxied
TTL:     Auto
```

> Cả 2 trỏ cùng IP VPS. Nginx phân route theo `server_name` (Host header).

### Cloudflare Worker — `sol-robots-override`

- Route: `sol.vn/*`
- Function: robots.txt override (allow 22+ AI bots), .well-known endpoints, MCP card
- Source: `workers/robots-override.js`
- **Nếu huongdi cần AI crawler access** → extend route thành `sol.vn/* + huongdi.sol.vn/*`

### SSL/TLS settings

- Mode: **Full (strict)**
- Always Use HTTPS: ON
- Managed robots.txt: OFF (Worker handle)

---

## 5. DATABASE — PostgreSQL

| Mục | Giá trị |
|---|---|
| **Engine** | PostgreSQL 16 (Ubuntu apt) |
| **Host:Port** | `127.0.0.1:5432` (localhost only — KHÔNG expose ra mạng) |
| **DB hiện tại** | `sol_prod` |
| **DB user** | `sol_app` |
| **ORM** | Prisma 5.22 |
| **Schema file** | `backend/prisma/schema.prisma` (38 models) |
| **Connection limit** | 20 |

### Migration tools

- Prisma migrations (9+)
- 17 raw SQL files (manual phase A/B + Zalo tables + encoding fixes)
- Command: `npx prisma migrate deploy`

### Backup strategy

- Daily pg_dump cron 02:00 ICT → `/var/backups/sol_prod_YYYY-MM-DD.sql.gz`
- Retention: 30 ngày, auto-cleanup
- Restore: `gunzip | psql -U <user> <db>`

### Khuyến nghị cho huongdi — **DB tách riêng**

```sql
CREATE USER huongdi_app WITH PASSWORD '<strong_pwd>';
CREATE DATABASE huongdi_prod OWNER huongdi_app;
GRANT ALL PRIVILEGES ON DATABASE huongdi_prod TO huongdi_app;
```

- ✅ Backup/restore độc lập per sản phẩm
- ✅ Production isolation — bug app này không phá app kia
- ✅ Scaling tương lai (PgBouncer riêng nếu cần)

### Truy cập DB từ máy local

DB không expose. Dùng SSH tunnel:
```bash
ssh -L 5432:127.0.0.1:5432 solop@103.72.57.11
# rồi connect localhost:5432 từ DBeaver/pgAdmin
```

---

## 6. EMAIL — Brevo (Sendinblue) SMTP

| | |
|---|---|
| Provider | Brevo |
| Host | `smtp-relay.brevo.com` |
| Port | 587 (STARTTLS) |
| Auth user | `<id>@smtp-brevo.com` (NOT email cá nhân) |
| SMTP key | 32-char key (regenerate trên dashboard Brevo nếu lộ) |

### Domain authentication (đã setup cho sol.vn)

- DKIM: `mail._domainkey.sol.vn` TXT record
- SPF: sol.vn TXT include Brevo + Zoho
- DMARC: `_dmarc.sol.vn` TXT (monitoring mode)

> Nếu huongdi gửi email từ `*@huongdi.sol.vn` → cần thêm DKIM/SPF records riêng.

### Healthcheck startup

Backend chạy `verifySmtpConnection()` lúc start. Lỗi auth → log + tiếp tục chạy (không crash).

---

## 7. STORAGE & UPLOADS

### Static assets

- Dashboard SPA: `/var/www/bothuocla-sol-vn/` (~4.7 MB, Vite hashed)
- Admin SPA: `/var/www/admin-sol-vn/` (~368 KB)
- Cache: hashed files cache 1 năm; HTML cache theo Cloudflare

### Upload limits

- `client_max_body_size 10M` trong nginx
- Pattern uploaded files: chưa standardize → khuyến nghị `/var/www/<app>/uploads/`

---

## 8. DEPLOYMENT WORKFLOW

### Git → VPS standard flow

```
Local Windows                  VPS (solop user)
─────────────────              ──────────────────────────
git commit + push       ─→     cd /var/www/<app>
                               git pull origin main
                               cd backend
                               npm install
                               npx prisma migrate deploy
                               npm run build
                               pm2 restart <app>-api
                               pm2 logs <app>-api --lines 30
```

### Build commands

| App | Command | Output |
|---|---|---|
| Backend (`huongdi-api`) | `npm run build` | `dist/` |
| User Dashboard (`huongdi.sol.vn`) | `VITE_BASE=/ VITE_API_BASE=/api npm run build` | `dist/` → `/var/www/huongdi-sol-vn/` |
| Admin Panel (`adminhuongdi.sol.vn`) | `VITE_BASE=/ VITE_API_BASE=/api npm run build` | `dist/` → `/var/www/adminhuongdi-sol-vn/` |

> Cả admin và dashboard dùng `VITE_API_BASE=/api` (relative). Nginx mỗi vhost
> proxy `/api/` về cùng `huongdi-api:4001`. Không cần hardcode hostname.

### Smoke tests sau deploy

```bash
# Backend healthz
curl -s http://127.0.0.1:4001/healthz       # → {"ok":true,...}

# Dashboard load
curl -sI https://huongdi.sol.vn/            # → 200 OK
curl -s  https://huongdi.sol.vn/api/healthz # → {"ok":true,...} (proxy → 4001)

# Admin load
curl -sI https://adminhuongdi.sol.vn/        # → 200 OK
curl -s  https://adminhuongdi.sol.vn/api/healthz # → {"ok":true,...}

# Backend logs
pm2 logs huongdi-api --nostream --lines 50 | grep -i error
```

### Rollback

- Backend: `git checkout <good_sha> && npm run build && pm2 restart`
- Frontend: restore `dist/` từ folder backup theo timestamp
- DB: restore `/var/backups/<db>_YYYY-MM-DD.sql.gz`

---

## 9. ENV VARIABLES — schema only

> **KHÔNG include values thực.** Liên hệ admin (Khang) để nhận `.env` file đầy đủ.

### Backend `.env`

```bash
# ── Runtime ──────────────────────────────────────────
NODE_ENV=production
PORT=4001                                   # ← huongdi khác sol-api (4000)
PUBLIC_ORIGIN=https://huongdi.sol.vn

# ── Database ─────────────────────────────────────────
DATABASE_URL="postgresql://huongdi_app:<pwd>@127.0.0.1:5432/huongdi_prod?schema=public&connection_limit=20"

# ── Auth (JWT + Magic link) ──────────────────────────
JWT_SECRET=<random 64-char hex>
JWT_EXPIRES_IN=30d

# ── CORS ─────────────────────────────────────────────
CORS_ORIGINS=https://huongdi.sol.vn,https://adminhuongdi.sol.vn

# ── AI (Claude) ──────────────────────────────────────
ANTHROPIC_API_KEY=<from admin>
CLAUDE_MODEL_PRIMARY=claude-sonnet-4-6
CLAUDE_MODEL_ESCALATED=claude-opus-4-6
AI_DAILY_QUOTA_MSGS=30
AI_MAX_OUTPUT_TOKENS=400

# ── Zalo OAuth ───────────────────────────────────────
ZALO_APP_ID=<19-digit>
ZALO_APP_SECRET=<32-char>
ZALO_REDIRECT_URI=https://huongdi.sol.vn/api/auth/zalo/callback
ZALO_FRONTEND_URL=https://huongdi.sol.vn
ZALO_OA_ACCESS_TOKEN=<refresh ~90d>

# ── Email (Brevo SMTP) ───────────────────────────────
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<brevo-id>@smtp-brevo.com
SMTP_PASSWORD=<32-char Brevo key>

# ── Web Push (VAPID) ─────────────────────────────────
VAPID_PUBLIC_KEY=<87-char base64url>
VAPID_PRIVATE_KEY=<43-char base64url>
VAPID_SUBJECT=mailto:<admin-email>

# ── Scheduler ────────────────────────────────────────
ENABLE_SCHEDULER=true                       # Set false nếu chỉ 1 instance cần fire cron

# ── Dev only ─────────────────────────────────────────
OTP_DEV_MODE=false
```

### Frontend (`dashboard/.env.local`)

```bash
VITE_BASE=/
VITE_API_BASE=/api
```

> Built vào `dist/` lúc build, không chạy runtime.

---

## 10. CHECKLIST DEPLOY `huongdi.sol.vn`

```
─── Setup hạ tầng ───────────────────────────────────────
□  Khang whitelist SSH key của team dev
□  Clone repo huongdi vào /var/www/huongdi/
□  Tạo DB user + database: huongdi_app / huongdi_prod
□  Copy .env.example → .env, fill secrets (CORS gồm cả admin)

─── Backend ─────────────────────────────────────────────
□  cd backend && npm install
□  npx prisma migrate deploy
□  npm run build
□  Thêm PM2 process huongdi-api port 4001, pm2 start + pm2 save
□  curl 127.0.0.1:4001/healthz → 200 OK

─── User Dashboard (huongdi.sol.vn) ─────────────────────
□  cd dashboard && npm install && npm run build
□  cp -r dist/* /var/www/huongdi-sol-vn/
□  sudo chown -R www-data:www-data /var/www/huongdi-sol-vn/
□  Tạo nginx vhost /etc/nginx/sites-enabled/huongdi.sol.vn
□  Cloudflare DNS: A record huongdi → 103.72.57.11 (Proxied)

─── Admin Panel (adminhuongdi.sol.vn) ───────────────────
□  cd admin && npm install && npm run build
□  cp -r dist/* /var/www/adminhuongdi-sol-vn/
□  sudo chown -R www-data:www-data /var/www/adminhuongdi-sol-vn/
□  Tạo nginx vhost /etc/nginx/sites-enabled/adminhuongdi.sol.vn
□  (Tuỳ chọn) Bật IP whitelist cho admin trong vhost
□  Cloudflare DNS: A record adminhuongdi → 103.72.57.11 (Proxied)

─── SSL + Verify ────────────────────────────────────────
□  sudo nginx -t && sudo systemctl reload nginx
□  sudo certbot --nginx -d huongdi.sol.vn -d adminhuongdi.sol.vn
□  Browser test: load cả 2 trang, login admin OK, /api/healthz 200
□  Add huongdi_prod vào daily backup cron /var/backups/
□  Test pm2 restart huongdi-api không ảnh hưởng sol-api
```

---

## 11. RESOURCE BUDGET

### Sau khi thêm huongdi + adminhuongdi

| Resource | Hiện tại | + huongdi (backend + 2 SPA) | % usage |
|---|---|---|---|
| Disk | 11 GB | +600 MB (backend ~400 + dashboard ~5 + admin ~5 + DB 50) | ~12 GB / 28 GB (43%) |
| RAM | sol-api 250 MB + PG 150 MB + nginx 100 MB | +200 MB (huongdi-api) | ~1.2 GB / 2 GB (60%) |
| CPU | ~10% idle avg | +5-10% | ~20-25% (OK) |

> Admin panel là static SPA, không thêm backend process → KHÔNG tăng RAM/CPU.
> Chỉ thêm ~5 MB disk cho admin dist + ~10 MB nginx overhead.

→ Margin OK, **không cần upgrade VPS** trừ khi huongdi traffic spike.

→ Nếu cần upgrade: eztech.vn có gói 4 GB RAM giá ~300k/tháng.

---

## 12. LIÊN HỆ

- **Admin / Owner:** Khang Sol — nguyendinhkhang@gmail.com
- **Mật khẩu, API key, JWT secret, SSH key:** Liên hệ trực tiếp Khang
- **Cloudflare access:** Khang invite team với role giới hạn
- **Brevo account:** Khang (sub-account nếu cần multi-user)

---

**Phiên bản:** 1.0
**Tác giả:** Sol AI (compiled từ docs nội bộ)
**Last reviewed:** 2026-06-16
