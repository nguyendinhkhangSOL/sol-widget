# SOL — Infrastructure Runbook

> **Stack production** (chốt 2026-05-03, sửa lại từ Render ban đầu):
>
> - **Frontend + Dashboard** → Firebase Hosting (CDN edge + SSL miễn phí)
> - **Backend + Worker + Postgres** → VPS Ubuntu 22.04 (1 server tự quản)
> - **WordPress (sol.vn wiki)** → tách riêng, host hiện tại của Khang giữ nguyên
>
> **Vì sao tách**: frontend tĩnh nên đẩy lên CDN cho user load nhanh từ VN; backend cần webhook + cron + DB nên cần server có state. Ban đầu định cùng 1 VPS nhưng để frontend trên Firebase tốt hơn cho SEO + tải.
>
> **Chi phí ước**: VPS $5-7/tháng (Hetzner CX22 hoặc Vultr 2GB), Firebase free tier 360MB/ngày bandwidth (đủ cho 5k-10k user/ngày), tổng < $10/tháng tới khi vượt 10k MAU.

---

## Phần 1 — VPS Ubuntu 22.04 setup (backend + DB + worker)

### 1.1 Mua VPS

Khuyến nghị (theo thứ tự ưu tiên):

| Provider | Plan | Giá | Lý do |
|----------|------|-----|-------|
| Hetzner | CX22 (2 vCPU, 4GB RAM, 40GB SSD) | €4.5/tháng | Tốt nhất giá/hiệu năng, datacenter Frankfurt latency tới VN ~280ms (vẫn OK cho REST/Socket) |
| Vultr | High Performance 2GB | $7/tháng | Có Singapore datacenter — latency tới VN ~50ms |
| DigitalOcean | Basic Droplet 2GB | $12/tháng | Đắt hơn nhưng UI thân thiện, có Singapore |

**Khuyến nghị mua**: Vultr Singapore — latency thấp + giá hợp lý.

### 1.2 Initial server hardening

```bash
# SSH vào server lần đầu
ssh root@<IP>

# 1. Tạo user non-root
adduser sol
usermod -aG sudo sol
rsync --archive --chown=sol:sol ~/.ssh /home/sol

# 2. Cấm root SSH login
nano /etc/ssh/sshd_config
# Sửa: PermitRootLogin no
#      PasswordAuthentication no
systemctl restart ssh

# 3. Cài UFW firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 4. Cài fail2ban (block brute-force SSH)
apt update && apt install -y fail2ban
systemctl enable fail2ban
```

### 1.3 Cài runtime

```bash
# Đăng nhập lại với user sol
ssh sol@<IP>

# Node 20 LTS (qua nvm để dễ update)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20

# pnpm (faster than npm)
npm install -g pnpm

# PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# pm2 (process manager — backend + worker)
npm install -g pm2
pm2 startup systemd  # auto-start sau reboot
# Chạy lệnh nó in ra (sudo env...)
```

### 1.4 Postgres setup

```bash
sudo -u postgres psql

-- Trong psql:
CREATE USER sol_app WITH PASSWORD 'TỰ_CHỌN_MẬT_KHẨU_DÀI';
CREATE DATABASE sol_prod OWNER sol_app;
GRANT ALL PRIVILEGES ON DATABASE sol_prod TO sol_app;
\q
```

Connection string: `postgresql://sol_app:MẬT_KHẨU@localhost:5432/sol_prod`

### 1.5 Clone code + setup .env

```bash
cd /home/sol
git clone https://github.com/<your-username>/sol-widget.git
cd sol-widget/backend
pnpm install
```

Tạo `/home/sol/sol-widget/backend/.env`:

```bash
DATABASE_URL=postgresql://sol_app:MẬT_KHẨU@localhost:5432/sol_prod
NODE_ENV=production
PORT=4000

# Auth
JWT_SECRET=<openssl rand -hex 32>
SESSION_SECRET=<openssl rand -hex 32>

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Web Push (VAPID — tạo bằng `npx web-push generate-vapid-keys`)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:nguyendinhkhang@gmail.com

# Origins (CORS)
ALLOWED_ORIGINS=https://bothuocla.sol.vn,https://sol.vn,https://app.sol.vn

# Features
ENABLE_SCHEDULER=true
```

**Quan trọng**: chmod 600 .env để user khác trên server không đọc được.

```bash
chmod 600 .env
```

### 1.6 Migrate + seed

```bash
cd /home/sol/sol-widget/backend
pnpm prisma migrate deploy
pnpm prisma generate

# Seed canned replies (chip)
npx tsx src/seed/runCannedReplies.ts

# Seed 127 ContentItems (push notification content)
npx tsx src/seed/runContentItems.ts
```

### 1.7 Build + start backend với pm2

```bash
cd /home/sol/sol-widget/backend
pnpm build
```

Tạo `/home/sol/sol-widget/ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'sol-backend',
      cwd: '/home/sol/sol-widget/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      error_file: '/home/sol/logs/backend-err.log',
      out_file: '/home/sol/logs/backend-out.log',
      max_memory_restart: '500M',
    },
    {
      name: 'sol-worker',
      cwd: '/home/sol/sol-widget/backend',
      script: 'dist/scheduler/run-worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', ENABLE_SCHEDULER: 'true' },
      error_file: '/home/sol/logs/worker-err.log',
      out_file: '/home/sol/logs/worker-out.log',
      max_memory_restart: '300M',
    },
  ],
};
```

```bash
mkdir -p /home/sol/logs
pm2 start /home/sol/sol-widget/ecosystem.config.cjs
pm2 save
```

Check status:
```bash
pm2 status
pm2 logs sol-backend --lines 50
pm2 logs sol-worker --lines 50
```

### 1.8 Nginx reverse proxy + SSL

`/etc/nginx/sites-available/sol-api`:

```nginx
server {
  listen 80;
  server_name api.sol.vn;

  location / {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;       # cho Socket.IO
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sol-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL với Let's Encrypt — auto renew
sudo certbot --nginx -d api.sol.vn
# Trả lời: email, đồng ý ToS, redirect HTTP → HTTPS = yes
```

Test: `curl https://api.sol.vn/health` → `{"ok":true}`

---

## Phần 2 — Firebase Hosting setup (frontend + dashboard)

### 2.1 Cài Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2.2 Init project (1 lần)

```bash
cd /d/BOTHUOCLA/sol-widget
firebase init hosting

# Chọn:
# - Use existing project (chọn project sol-vn nếu đã có, không thì tạo mới)
# - Public directory: dist
# - Single-page app: Yes
# - GitHub Actions: No (deploy manual qua CLI cho đơn giản)
```

Kết quả tạo `firebase.json`. Sửa lại để host 2 site (widget + dashboard):

```json
{
  "hosting": [
    {
      "target": "widget",
      "public": "frontend/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        {
          "source": "**/sol-sw.js",
          "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
        },
        {
          "source": "**/*.@(js|css|png|jpg|svg|woff2)",
          "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
        }
      ]
    },
    {
      "target": "app",
      "public": "dashboard/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

```bash
firebase target:apply hosting widget bothuocla-sol
firebase target:apply hosting app app-sol
```

### 2.3 Custom domain

Firebase Console → Hosting → Add custom domain:

- `bothuocla.sol.vn` → site `bothuocla-sol`
- `app.sol.vn` → site `app-sol`

Firebase sẽ yêu cầu thêm record DNS (A hoặc TXT). Vào DNS provider của sol.vn (Cloudflare/registrar) thêm vào.

### 2.4 Frontend env

Tạo `frontend/.env.production`:
```
VITE_API_BASE=https://api.sol.vn
VITE_VAPID_PUBLIC=<paste public key của VAPID>
```

`dashboard/.env.production`:
```
VITE_API_BASE=https://api.sol.vn
```

### 2.5 Build + deploy

```bash
cd /d/BOTHUOCLA/sol-widget

# Build frontend
cd frontend && pnpm build && cd ..

# Build dashboard
cd dashboard && pnpm build && cd ..

# Deploy cả 2
firebase deploy --only hosting
```

Lần đầu deploy mất ~2 phút. Subsequent ~30 giây vì Firebase chỉ upload diff.

---

## Phần 3 — Backup strategy

### 3.1 Database backup (cron daily)

`/home/sol/scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/sol/backups
mkdir -p $BACKUP_DIR

# Dump
pg_dump -U sol_app -h localhost sol_prod | gzip > $BACKUP_DIR/sol_prod_$DATE.sql.gz

# Giữ 30 ngày gần nhất
find $BACKUP_DIR -name "sol_prod_*.sql.gz" -mtime +30 -delete

# Upload lên Backblaze B2 (rẻ nhất, $0.005/GB/tháng)
# rclone copy $BACKUP_DIR/sol_prod_$DATE.sql.gz b2:sol-backups/
```

Cron:
```bash
crontab -e
# Thêm: 0 3 * * * /home/sol/scripts/backup-db.sh >> /home/sol/logs/backup.log 2>&1
```

### 3.2 Code backup

Code đã ở GitHub — không cần backup riêng. Chỉ cần backup `.env` (không commit vào git):

```bash
# Mỗi tháng manual:
scp sol@<IP>:/home/sol/sol-widget/backend/.env ~/.sol-prod-env-2026-05.env
```

Lưu vào 1Password hoặc Bitwarden.

---

## Phần 4 — Monitoring & alerts

### 4.1 Uptime monitoring (free)

UptimeRobot (free 50 monitors):
- `https://api.sol.vn/health` — every 5 min
- `https://bothuocla.sol.vn` — every 5 min
- `https://app.sol.vn` — every 5 min

Nếu down → email + Telegram alert.

### 4.2 Error tracking

Sentry free tier (5k errors/tháng):

```bash
cd /home/sol/sol-widget/backend
pnpm add @sentry/node
```

Thêm vào `backend/src/server.ts`:
```typescript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: 'production' });
```

### 4.3 Log rotation

PM2 logs auto-rotate qua `pm2-logrotate`:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 4.4 Disk + RAM monitoring

```bash
# Cài netdata (free, real-time dashboard)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Truy cập: http://<IP>:19999  (nhớ ufw allow từ IP của Khang only)
```

---

## Phần 5 — Deploy workflow (mỗi lần update code)

### Backend update:

```bash
ssh sol@<IP>
cd /home/sol/sol-widget
git pull

cd backend
pnpm install
pnpm prisma migrate deploy   # nếu có migration mới
pnpm build

pm2 restart sol-backend
pm2 restart sol-worker

pm2 logs --lines 30  # check không có error
```

### Frontend update:

```bash
# Trên máy Khang (Windows)
cd D:\BOTHUOCLA\sol-widget
git pull   # nếu có collab

# Build
cd frontend && pnpm build && cd ..
cd dashboard && pnpm build && cd ..

# Deploy
firebase deploy --only hosting
```

### Rollback nếu deploy hỏng:

**Backend**: `git checkout <previous-commit>` → rebuild → `pm2 restart`
**Frontend**: Firebase Console → Hosting → Release history → "Rollback" 1 click

---

## Phần 6 — Disaster recovery checklist

Nếu VPS bị ddos / data loss / server cháy:

1. Mua VPS mới (cùng provider hoặc khác — DR plan có Hetzner làm backup nếu Vultr down)
2. SSH vào, chạy lại bước 1.2 → 1.7 (đã document đầy đủ)
3. Restore DB từ B2 backup gần nhất:
   ```bash
   rclone copy b2:sol-backups/sol_prod_<DATE>.sql.gz ./
   gunzip sol_prod_<DATE>.sql.gz
   psql -U sol_app -d sol_prod < sol_prod_<DATE>.sql
   ```
4. Update DNS A record của `api.sol.vn` → IP server mới
5. Đợi DNS propagate (~5-30 phút)

**RTO** (Recovery Time Objective): 2 tiếng
**RPO** (Recovery Point Objective): 24 tiếng (vì backup daily)

Nếu cần RPO thấp hơn → thêm WAL archive streaming sang B2 (sau khi vượt 1k MAU).

---

## Phần 7 — Cost projection

| Tháng | MAU | Postgres | Push msg/tháng | Anthropic | Tổng |
|-------|-----|----------|----------------|-----------|------|
| 0 | 0 | $7 (VPS) | 0 | $0 | **$7** |
| 1 | 50 | $7 | ~5k | ~$5 | **$12** |
| 3 | 200 | $7 | ~30k | ~$25 | **$32** |
| 6 | 1000 | $14 (upgrade VPS 4GB) | ~150k | ~$120 | **$134** |
| 12 | 5000 | $30 (8GB VPS) | ~700k | ~$600 | **$630** |

Anthropic là chi phí biến lớn nhất. Mỗi user FREE limited 5 msg/ngày → max 150 msg/tháng. ALUMNI maintenance limited 30 msg/tháng. Trường hợp xấu nhất 5000 user × $0.12/user = $600.

**Optimization khi scale**:
- Cache canned reply qua chip → 60% truy vấn không tốn token
- Tier ALUMNI maintenance limit chặt hơn nếu cần
- Batch message + dùng Haiku cho intent classification (rẻ hơn 12x Sonnet)

---

## Phần 8 — TODO đầu tiên (sau khi đọc xong)

- [ ] Chốt provider VPS (recommend Vultr Singapore)
- [ ] Mua VPS, ghi IP vào 1Password
- [ ] Mua/đăng ký domain `api.sol.vn` (subdomain của sol.vn — chỉ cần thêm DNS A record)
- [ ] Setup VPS theo phần 1.1-1.8
- [ ] Test backend qua `curl https://api.sol.vn/health`
- [ ] Init Firebase Hosting (phần 2)
- [ ] Deploy frontend + dashboard
- [ ] Test e2e: mở `https://bothuocla.sol.vn` từ điện thoại
- [ ] Setup UptimeRobot
- [ ] Setup backup script + cron
- [ ] Pre-sell 5-10 user qua Facebook (xem MARKETING_ZERO_BUDGET.md)

---

**Lần update cuối**: 2026-05-04
**Người maintain**: Khang Sol (solo)
**Câu hỏi gấp gáp**: → grep từ này trong CLAUDE_CONTEXT.md trước khi hỏi lại
