# Sol — Documentation Index

> Tổng hợp toàn bộ tài liệu Sol infrastructure, code, business model & operations.
> **Đọc theo thứ tự khi setup lần đầu. Dùng làm reference khi cần lookup.**
> Anh Khang (founder) maintain. Em (Claude session) cập nhật mỗi khi có thay đổi lớn.

---

## File structure

```
C:\BOTHUOCLA\sol-widget\docs\
├── 00-INDEX.md                       ← FILE NÀY (bắt đầu đọc)
├── 01-CREDENTIALS.md                 ← 🔐 Passwords, keys (NHẠY CẢM, không commit public)
├── 02-CHEATSHEET.md                  ← 📋 Lệnh thường dùng (SSH, scp, CF, nginx)
├── 03-CLOUDFLARE_CONFIG.md           ← ☁️ Cloudflare DNS + Worker + SSL settings
├── 04-VPS_CONFIG.md                  ← 🖥️ VPS Ubuntu 24.04 layout + restore steps
├── 05-ARCHITECTURE.md                ← 🏗️ Kiến trúc đầy đủ — domains, layers, integrations
├── 06-DATABASE.md                    ← 🗄️ Postgres + Prisma schema (38 model) + migration
├── 07-DEPLOY_WORKFLOW.md             ← 🚀 Edit code → live workflow + edge cases
├── 08-OPERATIONS.md                  ← 🛠️ Runbook ops hằng ngày + troubleshooting
├── 09-DECISIONS.md                   ← 📝 Technical decisions log (date + lý do)
├── 10-ROADMAP.md                     ← 🗓️ Roadmap Day 1 → D-Day → post-launch
├── CHANGELOG_2026-05.md              ← 📅 Log chi tiết task + bug fix tháng 5
├── SETUP_LOG_2026-05-20.md           ← 📝 Chi tiết setup ngày 2026-05-20
├── SEO_COMPLIANCE_AUDIT_2026-05-22.md ← ✅ Audit Google compliance (PASS)
├── SEO_GOOGLE_FAQ_DEPRECATION_2026.md ← 📊 SEO strategy FAQ deprecation
├── SOFT_LAUNCH_CHECKLIST.md          ← ✓ Pre-launch checklist 10 beta
├── DEPLOYMENT_PLAN_OLD_CODEBASE.md   ← 📦 Deploy plan v3 (gốc 21/5)
└── SOL_BUSINESS_MODEL_CANONICAL.md   ← 💼 Business model canonical (pricing, voice, glossary)
```

---

## Khi nào đọc file nào?

### Mới vào dự án / Claude session mới resume
→ Đọc theo thứ tự: **05 → 09 → 10 → 06 → 07 → 08**

### Sửa code → deploy
→ **07-DEPLOY_WORKFLOW.md**

### Sửa schema → migrate DB
→ **06-DATABASE.md**

### Site down / bug production
→ **08-OPERATIONS.md** (runbook troubleshoot)

### Cần SSH/deploy/log quick
→ **02-CHEATSHEET.md**

### Quên password / key
→ **01-CREDENTIALS.md**

### Setup lại Cloudflare từ scratch
→ **03-CLOUDFLARE_CONFIG.md**

### Reinstall VPS từ scratch
→ **04-VPS_CONFIG.md** (có 10-step restore)

### Muốn hiểu "tại sao Sol làm thế này?"
→ **09-DECISIONS.md**

### Plan ngày này tuần này tháng này làm gì?
→ **10-ROADMAP.md**

### Pricing / messaging / glossary cho content
→ **SOL_BUSINESS_MODEL_CANONICAL.md**

### Recall chi tiết task đã làm hôm trước
→ **CHANGELOG_2026-05.md**

---

## Sol Architecture Overview

```
                 ┌──────────────────────┐
                 │    Cloudflare CDN    │
                 │  - SSL Full strict   │
                 │  - Worker override   │
                 │  - AI Crawl Control  │
                 └──────────┬───────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
  ┌────────┐         ┌──────────────┐      ┌──────────┐
  │ sol.vn │         │  bothuocla   │      │  admin   │
  │  WIKI  │         │   .sol.vn    │      │ .sol.vn  │
  │  (WP)  │         │  App + API   │      │  (admin) │
  └───┬────┘         └──────┬───────┘      └────┬─────┘
      │                     │                   │
      ▼                     ▼                   ▼
  Hosting eztech    VPS 103.72.57.11 (Ubuntu 24.04)
  cPanel WP                          (3 services cùng VPS)
  140+ bài SEO        ┌────────────────────────────┐
  Rank Math           │ Nginx → Express :4000 → PG │
                      │ + Dashboard static + Admin │
                      │ + PM2 + 26 cron job        │
                      └────────────────────────────┘
```

Chi tiết: [05-ARCHITECTURE.md](./05-ARCHITECTURE.md).

---

## Sol Stack Status (2026-05-22)

| Component | Status | Reference |
|---|---|---|
| VPS Ubuntu 24.04 (2GB/30GB) | ✅ Live | 04-VPS_CONFIG.md |
| SSH key auth (no password) | ✅ | 01-CREDENTIALS.md |
| Nginx + SSL Let's Encrypt | ✅ Expiry 2026-08-18 | 04-VPS_CONFIG.md |
| Cloudflare DNS + Proxy | ✅ | 03-CLOUDFLARE_CONFIG.md |
| Cloudflare Worker v7 | ✅ 9 endpoints | 03-CLOUDFLARE_CONFIG.md |
| **Backend API (Express + Prisma)** | ✅ **Live PM2 sol-api :4000** | 05-ARCHITECTURE.md |
| **Postgres 16 (sol_prod)** | ✅ **38 model active** | 06-DATABASE.md |
| **Dashboard SPA bothuocla.sol.vn** | ✅ **Live, Test FTND entry** | 05-ARCHITECTURE.md |
| **Admin SPA admin.sol.vn** | ✅ **Live, 18 page** | 05-ARCHITECTURE.md |
| **Brevo SMTP (magic link)** | ✅ **DKIM+SPF+DMARC verified** | 09-DECISIONS.md |
| Zalo OA webhook | ✅ Live (token exp 25/8) | 09-DECISIONS.md |
| **VietQR static payment** | ✅ **Admin confirm manual** | 09-DECISIONS.md |
| 26 cron job in-process | ✅ Active (ENABLE_SCHEDULER=true) | 05-ARCHITECTURE.md |
| GA4 tracking | ✅ G-S5ELGXBLWK | 01-CREDENTIALS.md |
| Microsoft Clarity | ✅ wu12r2qt0o | 01-CREDENTIALS.md |
| GSC 4 properties | ✅ verified | 01-CREDENTIALS.md |
| llms.txt | ✅ Live | (in workspace public/) |
| robots.txt + Content Signals | ✅ Allow 22 AI bots | 03-CLOUDFLARE_CONFIG.md |
| **Sprint 31-5 SEO (7 bài flagship)** | ✅ **Published 22/5** | CHANGELOG_2026-05.md |
| **143 wiki author block** | ✅ **Bulk injected** | CHANGELOG_2026-05.md |
| Agent Readiness Score | ✅ ~95/100 | SETUP_LOG_2026-05-20.md |
| Soft launch Wave 1 | 🟡 **Pending 23/5** | SOFT_LAUNCH_CHECKLIST.md |
| **D-Day World No Tobacco Day** | 🔥 **2026-05-31 (D-9)** | 10-ROADMAP.md |

---

## Backend Stack (deployed 2026-05-21)

```
Runtime:     Node 20 LTS
Framework:   Express 4.21 + Socket.IO 4.8
ORM:         Prisma 5.22 → Postgres 16
Process:     PM2 sol-api (fork, instances: 1)
Listen:      127.0.0.1:4000 (nginx proxy /api/*)
Cron:        node-cron 26 jobs in-process
AI:          Anthropic Claude (Haiku primary, Sonnet escalated)
Mail:        nodemailer → Brevo SMTP
Push:        web-push (VAPID)
Auth:        JWT 30d + Anonymous-first + Zalo OAuth + Email magic link + Recovery code
Logging:     pino + pretty
Error:       @sentry/node (DSN optional)
```

Source: `/var/www/sol-widget-old/backend/`
Entry: `src/index.ts` → mount 20+ router → `server.listen(4000)`

Chi tiết: [05-ARCHITECTURE.md](./05-ARCHITECTURE.md) section 4.

---

## Mail Stack (config 2026-05-22)

```
Outbound:    nodemailer → smtp-relay.brevo.com:587 STARTTLS
             EMAIL_FROM "Đi Cùng Sol <khang@sol.vn>"
             EMAIL_REPLY_TO khang@sol.vn (Zoho inbox)
             Quota: 300 mail/day (Brevo free)

Inbound:     khang@sol.vn → Zoho mailbox (existing, KHÔNG đổi)

DNS (Cloudflare sol.vn):
  TXT  mail._domainkey.sol.vn  → DKIM RSA pubkey từ Brevo
  TXT  sol.vn                  → SPF: include:spf.brevo.com include:zoho.com ~all
  TXT  _dmarc.sol.vn           → DMARC p=quarantine rua=khang@sol.vn

Use cases:
  - Magic link auth (POST /auth/email/send-magic)
  - User notification (transactional)
  - Báo cáo Day 3/7/14/30
  - Email funnel (sau Day 14 nếu chưa upgrade)
```

Email format: **single-part text/html** (KHÔNG multipart) — fix bug 22/5 Gmail base64 raw.

---

## Repo structure (Windows local)

```
C:\BOTHUOCLA\sol-widget\
├── backend\               Express + Prisma + Postgres (deploy /var/www/sol-widget-old/backend)
├── dashboard\             Vite React SPA (deploy /var/www/bothuocla-sol-vn/)
├── admin\                 Vite React SPA (deploy /var/www/admin-sol-vn/)
├── frontend\              Widget IIFE (embed sol-widget.js — chưa deploy v3)
├── app\                   Next.js cũ — DEPRECATED (đã bỏ trong deploy v3)
│   └── scripts\           Nginx config + helper scripts
├── workers\               Cloudflare Worker source (robots-override.js)
├── landing\               Landing page HTML cũ
├── wiki-skeletons\        143 wiki article + voice scripts (gốc)
├── scripts\
│   ├── vps\               provision-vps.sh
│   ├── wp-publisher\      publish Sprint articles + bulk SEO
│   └── og-gen.py          OG image generator
├── docs\                  TOÀN BỘ DOCUMENTATION (file này nằm trong đây)
├── CLAUDE_CONTEXT.md      Master memory snapshot cũ (1463 dòng — refer history)
└── README.md (nếu có)
```

---

## Update history

| Date | Change | File updated |
|---|---|---|
| 2026-05-20 | Initial setup ngày đầu — VPS + Cloudflare + landing | 00-04 |
| 2026-05-21 | Backend + Dashboard + Admin deploy | (chưa update docs) |
| 2026-05-22 | Email Brevo + DKIM/SPF/DMARC + Sprint SEO + Docs overhaul | 00 (update), 05-10 + CHANGELOG (new) |

---

## Emergency contacts

```
eztech.vn support:    support@eztech.vn / portal my.eztech.vn
Khang Sol:            nguyendinhkhang@gmail.com
                      https://web.facebook.com/nguyendinhkhang

If site down:
  1. Check Cloudflare status: https://www.cloudflarestatus.com/
  2. Check eztech.vn status page
  3. Test direct IP: curl -H "Host: bothuocla.sol.vn" https://103.72.57.11/
  4. SSH VPS: ssh sol-vps (hoặc VNC console nếu fail)
  5. PM2 restart: pm2 restart sol-api

Postgres down:
  sudo systemctl restart postgresql
  Backup: /var/backups/sol-db-*.sql.gz

SMTP fail:
  Brevo dash → regenerate SMTP key → update .env → pm2 restart sol-api
```

---

## Maintenance schedule

```
Daily   (5 min):   pm2 list, pm2 logs (error count), df -h, DB stats
Weekly  (15 min):  sudo apt update + upgrade, fail2ban status, backup DB
Monthly (30 min):  full-upgrade, cert renew dry-run, clean logs, reboot
Quarterly (1h):    review CF bot analytics, audit refunds, upgrade Node
Yearly:            renew VPS eztech.vn (~20/05, 799k đồng)
                   renew Zalo OA token (~25/8, lịch nhắc)
```

Chi tiết: [08-OPERATIONS.md](./08-OPERATIONS.md) section 11.

---

## Founder note

Em (Claude session) viết toàn bộ docs này cho anh Khang — founder Sol.

Khi anh start session Claude mới:
1. Share file `00-INDEX.md` này
2. Claude đọc 5-10 phút → pickup full context
3. Anh chỉ cần nói: *"Đọc docs/, em là Claude tiếp nối session. Tiếp tục làm [việc gì]"*

Mọi quyết định kỹ thuật quan trọng đều có **date + lý do** trong [09-DECISIONS.md](./09-DECISIONS.md) → đừng undo nếu không hiểu lý do.

Đối thoại tone: founder-to-founder, tiếng Việt, gọi anh = "anh" hoặc "anh Khang". Comment code + UI string đều bằng tiếng Việt.

---

**Maintainer**: Khang Sol (Nguyễn Đình Khang)
**Project**: Đi Cùng Sol — app cai thuốc lá 30 ngày cho người Việt 45+
**Last updated**: 2026-05-22
**Version**: 2.0 (rewrite từ 1.0 sau khi deploy backend + mail stack)
