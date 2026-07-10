# Sol Ecosystem — Architecture

**Version:** 1.0
**Last updated:** 2026-07-07

## System overview

Sol Ecosystem gồm 5 domains chạy trên 2 environments physical:

```
                    ┌─────────────────────────────────┐
                    │   Cloudflare / DNS              │
                    │   sol.vn, huongdi.sol.vn        │
                    │   adminhuongdi.sol.vn           │
                    │   admin.sol.vn, bothuocla.sol.vn│
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────┴───────────────┐
                    │                            │
        ┌───────────▼────────────┐    ┌─────────▼──────────────┐
        │  VPS (Ubuntu 22)       │    │  cPanel shared host    │
        │  Public IP: [redacted] │    │  FTP + File Manager    │
        │                        │    │                        │
        │  - huongdi.sol.vn      │    │  - sol.vn (WordPress)  │
        │  - adminhuongdi.sol.vn │    │  - admin.sol.vn        │
        │                        │    │  - bothuocla.sol.vn    │
        │  Stack:                │    │                        │
        │  - Nginx (reverse)     │    │  Stack:                │
        │  - Node.js 20 (PM2)    │    │  - Apache + PHP        │
        │  - Postgres 15         │    │  - WordPress core      │
        │  - Static assets       │    │  - GeneratePress theme │
        └────────────────────────┘    │  - JetBackup 5 daily   │
                                      └────────────────────────┘
```

## Domain roles

### `huongdi.sol.vn` (VPS — main product)
- **Static frontend** — HTML + CSS + JS ở `/var/www/huongdi/public/`
- **Backend API** — Node.js Express + Prisma ở `/var/www/huongdi/backend/`
- **Database** — Postgres `huongdi_prod` (users, leads, directions, saved, journey, sol_dong_hanh_conversations)
- **Nginx** — Reverse proxy `/api/*` → `localhost:3001`, serve static `/*` từ `public/`

### `sol.vn` (cPanel — marketing + SEO)
- **WordPress core** + GeneratePress theme
- **Custom mu-plugins** — Sol templates (default, landing V3, post, archive)
- **Content** — Blog posts, Pillar pages, Author profile, Sol Là Gì

### `adminhuongdi.sol.vn` (VPS subdomain)
- **React SPA** — Admin panel cho User Management + CRM
- **Cùng backend** với huongdi.sol.vn (chia sẻ Postgres)

### `admin.sol.vn` + `bothuocla.sol.vn` (cPanel — stable, DO NOT TOUCH)
- Legacy admin panel + Bộ Thuốc Lá product
- Not part of active dev

## Data flow

### User signup flow
```
Landing sol.vn → Kham-pha-ban-than (quiz Bước 1)
              → POST /api/leads (Node.js backend)
                → Create lead in Postgres
                → Send magic link (Zoho SMTP)
              → User click magic link
              → GET /kich-hoat/?token=xxx
                → Verify token
                → Create user (FREE tier)
                → JWT cookie set
              → Redirect /toi/ (dashboard)
```

### Payment flow (Unified auth architecture)
```
User (Free) → /gia/ (pricing page)
            → Click "Nâng cấp Active"
            → /thanh-toan/?tier=active
              → Check email (register-first enforcement)
              → If not registered: /dang-ky/ → back
              → If registered: Show VietQR (Vinet Techcombank)
            → User transfer 499k
            → User submit form (SDT + email + Zalo)
            → POST /api/payment/notify
              → Save pending payment
              → Admin manual verify
              → PATCH user tier = 'active'
            → Auto redirect /toi/ (unlocked)
```

### AI Studio flow (Active tier only)
```
/ai-studio/ (iframe container)
    ├── Tab 1: /prompts/ (40 templates) — iframe embed=1
    ├── Tab 2: /prompts-studio/ (biên tập) — iframe embed=1
    └── Tab 3: /toi/sol-dong-hanh/ (Claude chat) — iframe embed=1
```

## Tech stack

### Frontend
- Vanilla HTML + CSS + JS (no framework)
- Fonts: Inter + Lora (Google Fonts)
- Palette: Amber `#F59E0B` + Navy `#0F172A`
- Shared components:
  - `sol-ui.js` — Header + Footer navigation
  - `sol-user-nav.js` — Login pill widget V3
  - `sol-auth.js` — Auth token + tier detection
  - `sol-api-sync.js` — API wrapper

### Backend
- Node.js 20 + Express + TypeScript
- Prisma ORM + Postgres 15
- JWT (jsonwebtoken) + bcryptjs
- Nodemailer (Zoho SMTP port 465 SSL)
- Anthropic SDK (Claude API for Sol Đồng Hành)

### WordPress (sol.vn)
- WordPress 6.x + GeneratePress theme
- Custom mu-plugins:
  - `sol-default-template.php` — Default page template
  - `sol-landing-template-v3.php` — Homepage V3
  - `sol-post-template.php` — Blog posts V2.2
  - `sol-user-nav.php` — Login pill inject
  - `sol-redirects.php` — 301 redirects (V4.1)

### DevOps
- **Git** — GitHub Private repo `sol-ecosystem`
- **VPS deploy** — `git pull` + rsync + PM2 restart
- **cPanel deploy** — SFTP upload mu-plugins qua WinSCP hoặc File Manager
- **Backup** — Cron daily Postgres + JetBackup daily cPanel
- **SSL** — Let's Encrypt auto-renewal (Nginx) + cPanel AutoSSL

## Database schema (Postgres huongdi_prod)

### Core tables
```
users
  id, email (unique), password_hash, name, phone, zalo
  tier (free|active|founder|pending_activation)
  source (leads|register|payment|admin)
  status (active|pending_activation|banned)
  source_lead_id (FK leads.id — orphan link)
  created_at, updated_at, activated_at

leads
  id, email, phone, quiz_result_p1 (jsonb)
  magic_token, magic_token_expires_at
  status (pending|activated|abandoned)
  created_at

directions
  id (1-37), slug, title, description
  category, difficulty, target_persona
  roadmap_90days (jsonb — Bước 4 template)
  is_public (free 5/37 vs active 37/37)

saved
  id, user_id (FK), direction_id (FK)
  saved_at

journey
  id, user_id (FK), direction_id (FK)
  day (1-90), notes, completed
  updated_at

sol_dong_hanh_conversations
  id, user_id (FK)
  messages (jsonb array — Claude API)
  created_at, updated_at

payments
  id, user_id (FK), amount, tier
  status (pending|verified|refunded)
  verification_notes, created_at
```

## API endpoints (Backend Node.js)

Mount points chuẩn (KHÔNG double-mount):
```
/api/auth/*        — Register, login, forgot password, reset
/api/user/*        — Register (unified auth), profile, tier check
/api/leads/*       — POST leads (quiz Bước 1)
/api/activate/*    — Magic link activate + set password
/api/directions/*  — List 37, get by slug, save/unsave
/api/journey/*     — Sổ Hành Trình 90 ngày CRUD
/api/sol-dong-hanh/* — Chat AI (streaming Claude)
/api/dashboard/*   — Aggregated stats for /toi/
/api/events/*      — User events (for CRM)
/api/admin/*       — Admin-only endpoints (require role=admin)
/api/payment/*     — Payment notify + admin verify
```

Middleware:
- `auth.ts` — Verify JWT, populate `req.user`
- `optional-auth.ts` — Populate `req.user` if token present, else null
- `errorHandler.ts` — Central error → JSON response

## Security notes

- JWT secret trong `.env`, KHÔNG commit
- bcryptjs cost = 10 (balance security + speed)
- Rate limiting: TODO (Auth Refactor Sub-D)
- CORS: allow `sol.vn`, `huongdi.sol.vn`, `adminhuongdi.sol.vn`
- HTTPS enforced qua Nginx redirect 80 → 443
- Password reset token TTL 1 giờ
- Magic link token TTL 24 giờ

## Performance targets

- Landing page LCP < 2.5s
- API p95 < 500ms
- Postgres query p99 < 100ms
- Sol Đồng Hành chat first token < 3s (Claude API)

## Scale limits (MVP)

- VPS: 4 vCPU + 8GB RAM — handle ~1000 concurrent users
- Postgres: 2GB storage — ~50k users + 500k saved/journey rows
- Anthropic API: ~$0.005/message — budget $500/tháng cho 100 Active users
