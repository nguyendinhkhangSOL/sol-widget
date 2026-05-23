# 🗄️ Sol — Storage Structure trên VPS

> **Mục đích**: Hiểu rõ data, code, log, backup của Sol nằm ở đâu trên VPS — theo **vật lý** (filesystem) và theo **chức năng ứng dụng** (app nào dùng folder nào).
>
> Đọc file này khi: cần troubleshoot disk full, plan backup, audit security, hoặc onboard người mới.

---

## 1. 🖥️ VPS Overview

```
Provider:     eztech.vn
Hostname:     sol-vps-01
OS:           Ubuntu 24.04 LTS
RAM:          2 GB
Disk:         30 GB SSD
IP:           103.221.221.79
Users:        root (admin), solop (deploy + pm2 owner)
```

---

## 2. 📁 Physical Filesystem Tree

```
/
├── etc/                              ⚙️ System config
│   ├── nginx/
│   │   ├── nginx.conf                ← Main nginx config
│   │   ├── sites-available/          ← All site configs
│   │   │   ├── bothuocla.sol.vn      ← Dashboard + API proxy
│   │   │   └── admin.sol.vn          ← Admin SPA
│   │   └── sites-enabled/            ← Symlinks active sites
│   ├── letsencrypt/
│   │   ├── live/
│   │   │   ├── bothuocla.sol.vn/     ← SSL cert + key
│   │   │   └── admin.sol.vn/         ← SSL cert + key
│   │   └── renewal/                  ← Auto-renew config
│   ├── postgresql/
│   │   └── 16/main/
│   │       ├── postgresql.conf       ← DB config
│   │       └── pg_hba.conf           ← DB auth rules
│   └── systemd/system/               ← Services (postgres, nginx)
│
├── var/
│   ├── www/                          🌐 Web roots (CODE + STATIC)
│   │   ├── sol-widget-old/           ← MAIN APP (git repo)
│   │   │   ├── .git/                 ← Git repo state
│   │   │   ├── .env                  ← (root level — env cho scripts)
│   │   │   ├── backend/              ← Express + Prisma + Postgres client
│   │   │   │   ├── src/              ← TypeScript source
│   │   │   │   ├── dist/             ← Compiled JS (pm2 chạy file này)
│   │   │   │   │   └── index.js      ← Entry point
│   │   │   │   ├── prisma/
│   │   │   │   │   ├── schema.prisma ← DB schema source of truth
│   │   │   │   │   └── migrations/   ← SQL migration history
│   │   │   │   ├── .env              ← Backend secrets (SMTP, JWT, DB URL)
│   │   │   │   └── node_modules/     ← Heavy: ~300MB
│   │   │   ├── dashboard/            ← Dashboard React SPA build
│   │   │   │   ├── dist/             ← nginx serve từ đây
│   │   │   │   │   ├── index.html
│   │   │   │   │   └── assets/       ← JS + CSS bundle (hash filename)
│   │   │   │   └── node_modules/     ← (build time only)
│   │   │   ├── admin/                ← Admin React SPA build
│   │   │   │   └── dist/             ← nginx serve từ đây
│   │   │   ├── wiki-skeletons/       ← Source 143 wiki articles
│   │   │   │   ├── wiki-articles/    ← HTML files (.bak/.bak2 = backups)
│   │   │   │   └── sprint-31-5/      ← 7 bài Sprint mới
│   │   │   │       ├── 01-*.html ... 07-*.html
│   │   │   │       └── og-images/    ← 7 OG PNG branded
│   │   │   ├── scripts/wp-publisher/ ← Publish scripts (REST API client)
│   │   │   │   ├── publish-sprint-31-5.js
│   │   │   │   ├── bulk-republish-wikis.js
│   │   │   │   ├── gen-og-images.js  ← (NEW 22/5)
│   │   │   │   └── .env              ← WP_USER + WP_APP_PASSWORD
│   │   │   └── docs/                 ← Documentation (you are here)
│   │   ├── sol-widget/               ← LEGACY Next.js landing (still serve sol.vn?)
│   │   └── (other domain dirs nếu có)
│   │
│   ├── lib/postgresql/16/main/       💾 POSTGRES DATA FILES
│   │   ├── base/                     ← DB cluster files
│   │   ├── pg_wal/                   ← Write-Ahead Log (replay on crash)
│   │   └── pg_stat/                  ← Statistics
│   │
│   ├── log/                          📋 SYSTEM LOGS
│   │   ├── nginx/
│   │   │   ├── access.log            ← Tất cả HTTP requests
│   │   │   ├── error.log             ← Nginx errors (502, 403, etc.)
│   │   │   ├── bothuocla.access.log  ← Per-site (nếu config)
│   │   │   └── admin.access.log
│   │   ├── postgresql/
│   │   │   └── postgresql-16-main.log
│   │   └── auth.log                  ← SSH login attempts (xem khi audit)
│   │
│   └── backups/                      💾 SYSTEM BACKUPS
│       └── sol-widget/               ← Old code backups (pre-deploy snapshots)
│
├── home/
│   └── solop/                        👤 USER home (pm2 owner)
│       ├── .ssh/
│       │   └── authorized_keys       ← SSH public keys cho Khang
│       ├── .pm2/                     ⚙️ PM2 STATE
│       │   ├── dump.pm2              ← Saved process list (pm2 resurrect)
│       │   ├── pm2.log               ← PM2 daemon log
│       │   ├── pids/                 ← PID files
│       │   │   └── sol-api-0.pid
│       │   ├── logs/                 ← App stdout/stderr
│       │   │   ├── sol-api-out.log   ← Backend stdout (info logs)
│       │   │   └── sol-api-error.log ← Backend stderr (errors)
│       │   └── module_conf.json
│       └── (bash history, ssh known_hosts, etc.)
│
├── root/                             👑 root user home
│   └── .ssh/authorized_keys          ← SSH keys for root (nếu cho phép)
│
└── tmp/                              🗑️ Temporary
    └── (build artifacts, npm cache nếu chạy với sudo)
```

---

## 3. 🎯 Functional Map — App nào dùng folder nào?

### 🔵 Backend Express API (PM2 process `sol-api`)

| Chức năng | Path |
|---|---|
| Source code | `/var/www/sol-widget-old/backend/src/` |
| Compiled (PM2 runs) | `/var/www/sol-widget-old/backend/dist/index.js` |
| Env secrets | `/var/www/sol-widget-old/backend/.env` |
| DB schema | `/var/www/sol-widget-old/backend/prisma/schema.prisma` |
| DB migrations | `/var/www/sol-widget-old/backend/prisma/migrations/` |
| PM2 stdout log | `~solop/.pm2/logs/sol-api-out.log` |
| PM2 stderr log | `~solop/.pm2/logs/sol-api-error.log` |
| PM2 state | `~solop/.pm2/dump.pm2` |
| Listen port | `127.0.0.1:4000` (nginx reverse proxy) |

### 🟢 Dashboard SPA (nginx static `bothuocla.sol.vn`)

| Chức năng | Path |
|---|---|
| Source code | `/var/www/sol-widget-old/dashboard/src/` |
| Build output (trung gian) | `/var/www/sol-widget-old/dashboard/dist/` |
| **nginx serves** ✅ | `/var/www/bothuocla-sol-vn/` (4.7 MB — chỉ dist files) |
| nginx config | `/etc/nginx/sites-enabled/bothuocla.sol.vn` (owner: `solop`) |
| SSL cert | `/etc/letsencrypt/live/bothuocla.sol.vn/` |
| Access log | `/var/log/nginx/access.log` |

⚠️ **Workflow build → serve**:
```bash
cd /var/www/sol-widget-old/dashboard && npm run build
sudo cp -r dist/* /var/www/bothuocla-sol-vn/
sudo chown -R www-data:www-data /var/www/bothuocla-sol-vn/
```

### 🟡 Admin SPA (nginx static `admin.sol.vn`)

| Chức năng | Path |
|---|---|
| Source code | `/var/www/sol-widget-old/admin/src/` |
| Build output (trung gian) | `/var/www/sol-widget-old/admin/dist/` |
| **nginx serves** ✅ | `/var/www/admin-sol-vn/` (368 KB — chỉ dist files) |
| nginx config | `/etc/nginx/sites-enabled/admin.sol.vn` (owner: `root` — inconsistent!) |
| SSL cert | `/etc/letsencrypt/live/admin.sol.vn/` |

⚠️ **Inconsistent ownership giữa 2 nginx config**:
- `bothuocla.sol.vn` owner `solop:solop` (deploy user)
- `admin.sol.vn` owner `root:root` (system)

→ Nếu Khang muốn edit `admin.sol.vn` config bằng user `solop` (không cần sudo), cần `sudo chown solop:solop /etc/nginx/sites-enabled/admin.sol.vn`. Hoặc dùng `sudo nano ...` mỗi lần edit.

### 🔴 Postgres Database

| Chức năng | Path |
|---|---|
| Data cluster | `/var/lib/postgresql/16/main/` |
| WAL (transaction log) | `/var/lib/postgresql/16/main/pg_wal/` |
| Config | `/etc/postgresql/16/main/postgresql.conf` |
| Auth rules | `/etc/postgresql/16/main/pg_hba.conf` |
| Server log | `/var/log/postgresql/postgresql-16-main.log` |
| Service file | `/lib/systemd/system/postgresql@.service` |
| Listen | `127.0.0.1:5432` (local only) |
| Database | `sol_app` (user `sol_app`) |

### ⚫ Cron Jobs (Backend in-process, KHÔNG dùng system cron)

| Chức năng | Path |
|---|---|
| 26 cron jobs scheduler | `/var/www/sol-widget-old/backend/src/scheduler/` |
| Compiled | `/var/www/sol-widget-old/backend/dist/scheduler/` |

Cron jobs chạy **trong PM2 process** `sol-api` (không phải system cron). Restart PM2 = restart cron.

System cron (`/etc/cron.d/`) hiện **chưa setup** — daily `pg_dump` backup là **việc còn thiếu**.

### 🟣 WordPress sol.vn (KHÔNG trên VPS này)

WordPress của sol.vn host trên **eztech.vn shared hosting**, KHÔNG phải VPS sol-vps-01.

Scripts `wp-publisher/*.js` chạy local trên máy Windows Khang, gọi REST API qua HTTPS đến `https://sol.vn/wp-json/`.

VPS sol-vps-01 KHÔNG host WordPress, chỉ host: backend API + dashboard SPA + admin SPA.

---

## 4. 💾 Disk Usage Summary (đo lúc 2026-05-22 21:30 UTC+7)

### Tổng quan:
```
Filesystem: /dev/mapper/ubuntu--vg-ubuntu--lv
Total:      28 GB    Used: 11 GB    Free: 16 GB    Used%: 42%
/boot:      1.7 GB   Used: 200 MB   Free: 1.4 GB   Used%: 13%
```

### Per-folder:

| Folder | Size | Mục đích | Xóa khẩn? |
|---|---|---|---|
| `/var/www/sol-widget-old/` | **531 MB** | MAIN APP repo | ❌ KHÔNG |
| `/var/www/sol-widget-old/backend/` | 291 MB | Express + node_modules ~250MB | ⚠️ Cần rebuild |
| `/var/www/sol-widget-old/dashboard/` | 111 MB | Dashboard SPA src + node_modules | ⚠️ Cần rebuild |
| `/var/www/sol-widget-old/admin/` | 87 MB | Admin SPA src + node_modules | ⚠️ Cần rebuild |
| `/var/www/sol-widget-old/wiki-skeletons/` | 20 MB | 143 wiki HTML + Sprint 31-5 | ❌ Source code |
| `/var/www/sol-widget-old/docs/` | 3.4 MB | Documentation (file này!) | ❌ KHÔNG |
| `/var/www/sol-widget/` | **423 MB** | 🟡 LEGACY Next.js (xóa được sau launch) | ✅ Sau verify |
| `/var/www/bothuocla-sol-vn-backups/` | 24 MB | Snapshot backups 21/5 | ⚠️ Giữ 7 ngày |
| `/var/www/bothuocla-sol-vn/` | **4.7 MB** | 🟢 nginx serves dashboard từ đây | ❌ KHÔNG |
| `/var/www/admin-sol-vn/` | **368 KB** | 🟢 nginx serves admin từ đây | ❌ KHÔNG |
| `/var/lib/postgresql/16/` | 81 MB | DB data (mới, chưa có user thật) | ❌ KHÔNG BAO GIỜ |
| `~solop/.pm2/logs/` | 100 KB | App logs (small, OK) | ⚠️ Setup rotate |
| `/var/backups/sol-widget/` | (3 snapshots 21/5) | Pre-deploy snapshots | ⚠️ Giữ 30 ngày |

**Tổng disk used**: 11 GB / 28 GB (42%). **Free: 16 GB** → an toàn cho launch + 6 tháng grow.

### 🚨 Quick wins (giải phóng ~423 MB):

```bash
# Sau khi verify legacy Next.js không còn nginx serve nữa:
sudo rm -rf /var/www/sol-widget/      # 423 MB Next.js legacy
sudo rm -rf /var/www/bothuocla-sol-vn-backups/2026052*  # nếu > 7 ngày
```

⚠️ **KHÔNG xóa** `/var/www/sol-widget/` cho đến khi confirm:
1. `nginx -T | grep "sol-widget"` không reference folder này
2. Không có script nào đọc từ đây


---

## 5. 🔐 Permissions & Ownership

| Path | Owner | Group | Permissions | Lý do |
|---|---|---|---|---|
| `/var/www/sol-widget-old/` | `solop` | `solop` | `755` | solop deploy + pm2 chạy |
| `/var/www/sol-widget-old/backend/.env` | `solop` | `solop` | `600` | Secrets — chỉ owner đọc |
| `/var/www/sol-widget-old/dashboard/dist/` | `www-data` hoặc `solop` | `www-data` | `755` | nginx (www-data) cần read |
| `/etc/nginx/sites-enabled/` | `root` | `root` | `755` | System config |
| `/etc/letsencrypt/live/*/privkey.pem` | `root` | `root` | `600` | SSL private key |
| `/var/lib/postgresql/16/main/` | `postgres` | `postgres` | `700` | DB data |
| `~solop/.ssh/authorized_keys` | `solop` | `solop` | `600` | SSH key |

**Nguyên tắc**:
- `.env` luôn `600` — chmod 600 nếu lỡ tạo bằng quyền khác
- `dist/` static files nginx cần read → `chown www-data:www-data` hoặc đặt `solop` group có www-data

---

## 6. 🛡️ Backup Strategy (HIỆN CHƯA SETUP — TODO PRIORITY 1)

### 6.1. DB backup (cần setup gấp trước Wave 1 23/5)

```bash
# Daily backup 02:00 sáng — cron của postgres user
sudo crontab -u postgres -e

# Thêm dòng:
0 2 * * * pg_dump -U sol_app sol_app | gzip > /var/backups/postgres/sol_app-$(date +\%F).sql.gz

# Tạo folder:
sudo mkdir -p /var/backups/postgres
sudo chown postgres:postgres /var/backups/postgres

# Retention 30 ngày (auto delete cũ):
0 3 * * * find /var/backups/postgres -name "*.sql.gz" -mtime +30 -delete
```

### 6.2. Code backup

Code đã có Git remote (GitHub `nguyendinhkhangSOL/sol-widget`) → mỗi commit push là backup. Không cần backup riêng.

### 6.3. Off-site backup (chưa có — backlog)

Sau launch 31/5, consider:
- Daily `pg_dump` → rclone push lên Google Drive / Dropbox
- Hoặc dùng dịch vụ managed như Restic + B2 (Backblaze)

---

## 7. 🔄 Log Rotation (HIỆN CHƯA SETUP — TODO)

PM2 logs (`~solop/.pm2/logs/sol-api-*.log`) hiện **không rotate** → có thể ngốn disk sau vài tháng.

Setup `pm2-logrotate`:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

Nginx logs đã có `/etc/logrotate.d/nginx` (Ubuntu default), không cần config thêm.

---

## 8. 🚨 Khi disk full — recovery quick

```bash
# 1. Check disk usage
df -h
sudo du -sh /var/* | sort -h | tail -10

# 2. Top 5 quick wins (an toàn xóa):
sudo journalctl --vacuum-time=7d        # System journal
sudo apt clean                          # APT cache
sudo find /tmp -mtime +7 -delete        # Old temp files
pm2 flush                               # PM2 logs
sudo find /var/log -name "*.gz" -mtime +30 -delete  # Old rotated logs

# 3. KHÔNG xóa (chết app):
# /var/lib/postgresql/
# /var/www/sol-widget-old/backend/dist/
# /etc/letsencrypt/
```

---

## 9. 📊 Verify đã xong (data lấy 2026-05-22 21:30 UTC+7)

- [x] Disk usage: 11 GB / 28 GB (42% used) — free 16 GB
- [x] Nginx sites-enabled: ✅ 2 file (bothuocla.sol.vn + admin.sol.vn)
- [x] SSL cert: ✅ cả 2 domain trong `/etc/letsencrypt/live/`
- [x] Free disk: 16 GB — đủ launch + 6 tháng grow
- [x] Phát hiện ngoài kỳ vọng:
  - `/var/www/sol-widget/` (423 MB) — Next.js legacy, **có thể xóa sau verify**
  - File rác `/var/www/sol-widget-old/$null` (4K) + `'Đọc` (0 byte) — artifact từ Windows PowerShell, **xóa được**
  - `/var/www/sol-widget-old/frontend/` (1.1 MB) — folder gì? Cần Khang check
  - `/var/www/sol-widget-old/app/` (64K) — folder gì? Cần Khang check
  - 3 backups snapshots 21/5 trong `/var/backups/sol-widget/` — **giữ thêm 30 ngày**

### 🧹 Cleanup recommended (sau Wave 1 test xong):

```bash
# 1. Xóa file rác (4K + 0 byte, safe)
sudo rm "/var/www/sol-widget-old/\$null"
sudo rm "/var/www/sol-widget-old/'Đọc"

# 2. Verify Next.js legacy không serve, rồi xóa
sudo nginx -T | grep "/var/www/sol-widget/"  # phải empty
sudo mv /var/www/sol-widget /var/www/sol-widget.OLD-DELETE-AFTER-2026-06-15
# (rename trước 2 tuần, rồi mới xóa thật — defensive)
```

---

## 10. 🎯 Action items rút ra

Sau khi đọc doc này, anh nên làm:

### Khẩn cấp (trước Wave 1 — 23/5):
- [ ] Setup `pg_dump` daily cron — section 6.1
- [ ] Verify `.env` permission `600` cả backend lẫn wp-publisher
- [ ] Check disk free > 5 GB để launch an toàn

### Sau launch (sau 31/5):
- [ ] Setup `pm2-logrotate` — section 7
- [ ] Setup off-site backup — section 6.3
- [ ] Document path nginx access log per-site (nếu chưa có)

### Periodic (monthly):
- [ ] Check disk usage `df -h`
- [ ] Check PM2 logs size `du -sh ~/.pm2/logs/`
- [ ] Test restore DB backup vào staging

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
**Cross-references**:
- [02-CHEATSHEET.md](./02-CHEATSHEET.md) — lệnh thường dùng
- [04-VPS_CONFIG.md](./04-VPS_CONFIG.md) — VPS setup gốc
- [07-DEPLOY_WORKFLOW.md](./07-DEPLOY_WORKFLOW.md) — workflow deploy code → live
- [08-OPERATIONS.md](./08-OPERATIONS.md) — runbook ops
