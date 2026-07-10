# Sol Ecosystem — Deploy Playbook

**Version:** 1.0
**Last updated:** 2026-07-07

Deploy commands cho VPS + cPanel. Ship code từ GitHub tới production.

## Prerequisites

- SSH access VPS (`sol-vps` trong `~/.ssh/config`)
- cPanel credentials sol.vn
- Git repo cloned trên VPS: `/var/www/huongdi-git/` (setup 1 lần)
- WinSCP or FileZilla cho cPanel

## VPS setup (1 lần đầu)

```bash
ssh sol-vps

# Clone repo (dùng HTTPS + Personal Access Token cho automation)
cd /var/www/
sudo git clone https://TOKEN@github.com/nguyendinhkhangSOL/sol-ecosystem.git huongdi-git
sudo chown -R solop:solop huongdi-git/

# Verify
cd huongdi-git
git remote -v
git log --oneline | head -3
```

## Deploy scripts

Tất cả scripts ở `sol-ecosystem/scripts/`. Chạy từ VPS home hoặc `/var/www/huongdi-git/`.

### Deploy 1: Static frontend (huongdi.sol.vn public)

```bash
#!/bin/bash
# scripts/deploy-huongdi-public.sh
set -e

echo "[1/4] Pull latest from GitHub"
cd /var/www/huongdi-git
git pull origin main

echo "[2/4] Rsync to production"
sudo rsync -av --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.bak-*' \
    huongdi-public/ /var/www/huongdi/public/

echo "[3/4] Fix ownership"
sudo chown -R www-data:www-data /var/www/huongdi/public/

echo "[4/4] Test"
curl -sI https://huongdi.sol.vn/ | head -3

echo "✓ Deployed huongdi.sol.vn static"
```

Run:
```bash
bash /var/www/huongdi-git/scripts/deploy-huongdi-public.sh
```

Time: ~10 giây.

### Deploy 2: Backend Node.js

```bash
#!/bin/bash
# scripts/deploy-huongdi-backend.sh
set -e

echo "[1/6] Pull latest from GitHub"
cd /var/www/huongdi-git
git pull origin main

echo "[2/6] Backup DB before migration"
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
sudo -u postgres pg_dump huongdi_prod | gzip > /var/backups/db-pre-deploy/${DATE}.sql.gz

echo "[3/6] Rsync backend code"
sudo rsync -av \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='dist' \
    --exclude='*.bak-*' \
    huongdi-backend/ /var/www/huongdi/backend/

echo "[4/6] Install dependencies + build"
cd /var/www/huongdi/backend
sudo npm install --production
sudo npm run build

echo "[5/6] Run Prisma migrations"
sudo npx prisma generate
sudo npx prisma migrate deploy

echo "[6/6] Restart PM2"
pm2 restart huongdi-api --update-env
sleep 3
pm2 logs huongdi-api --lines 20 --nostream

echo "✓ Deployed huongdi backend"
```

Run:
```bash
bash /var/www/huongdi-git/scripts/deploy-huongdi-backend.sh
```

Time: ~2-3 phút.

### Deploy 3: Admin panel (adminhuongdi.sol.vn)

```bash
#!/bin/bash
# scripts/deploy-adminhuongdi.sh
set -e

cd /var/www/huongdi-git
git pull origin main

sudo rsync -av --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    admin/ /var/www/huongdi/admin/

sudo chown -R www-data:www-data /var/www/huongdi/admin/

echo "✓ Deployed adminhuongdi.sol.vn"
```

### Deploy 4: WordPress sol.vn (cPanel — SFTP)

Vì cPanel không có SSH, deploy qua SFTP client (WinSCP recommended).

**Automated PowerShell script (laptop):**

```powershell
# scripts/deploy-solvn-wp.ps1
# Prerequisites: WinSCP CLI installed

param(
    [string]$User = "cpanel-user",
    [string]$Host = "sol.vn"
)

$FILES = Get-ChildItem -Path "C:\BOTHUOCLA\sol-ecosystem\solvn-wp\mu-plugins\*.php"

foreach ($file in $FILES) {
    Write-Host "Uploading $($file.Name)..."
    & winscp.com /command `
        "open sftp://${User}@${Host}/" `
        "put $($file.FullName) /public_html/wp-content/mu-plugins/" `
        "exit"
}

Write-Host "✓ Deployed sol.vn WordPress mu-plugins"
```

**Manual via cPanel File Manager:**
1. Login cPanel `https://sol.vn:2083`
2. File Manager → `/public_html/wp-content/mu-plugins/`
3. Upload files từ `C:\BOTHUOCLA\sol-ecosystem\solvn-wp\mu-plugins\`
4. Confirm overwrite

## Rollback

### Rollback frontend (huongdi.sol.vn)

```bash
ssh sol-vps
cd /var/www/huongdi-git

# Xem history
git log --oneline | head -5

# Rollback về commit trước
git revert HEAD
git push origin main

# Re-deploy
bash scripts/deploy-huongdi-public.sh
```

### Rollback backend (breaking migration)

```bash
# 1. Restore DB từ backup
LATEST=$(ls -1t /var/backups/db-pre-deploy/*.sql.gz | head -1)
gunzip -c $LATEST | sudo -u postgres psql huongdi_prod

# 2. Rollback code
cd /var/www/huongdi-git
git revert HEAD
git push origin main

# 3. Re-deploy backend
bash scripts/deploy-huongdi-backend.sh
```

### Rollback WordPress (cPanel)

- JetBackup 5 → chọn snapshot trước bug → Restore Files
- Restore specific file: `sol-redirects.php` từ backup ngày cũ

## Deploy checklist

### Before deploy
- [ ] Đã commit + push GitHub?
- [ ] Đã test local?
- [ ] Backup DB (nếu deploy backend)?
- [ ] Đã note commit hash để rollback nếu cần?

### After deploy
- [ ] Test URL sau deploy (curl -I hoặc browser)
- [ ] Check logs không có error mới (`pm2 logs`, `tail -f nginx error.log`)
- [ ] Smoke test flow: login → dashboard → save direction
- [ ] Check backend API responsive: `curl https://huongdi.sol.vn/api/health`

## Post-deploy verification

```bash
# 1. HTTP status
curl -sI https://huongdi.sol.vn/ | head -3
curl -sI https://adminhuongdi.sol.vn/ | head -3
curl -sI https://sol.vn/ | head -3

# 2. API health
curl https://huongdi.sol.vn/api/health

# 3. PM2 status
pm2 status
pm2 logs huongdi-api --lines 20 --nostream

# 4. Nginx status
sudo systemctl status nginx
sudo tail -20 /var/log/nginx/error.log

# 5. Postgres check
sudo -u postgres psql -d huongdi_prod -c "SELECT COUNT(*) FROM users;"
```

## Zero-downtime deploy (Future)

Hiện tại deploy có 5-10 giây downtime (PM2 restart). Nếu cần zero-downtime:

- **Blue-green deployment** — 2 instances Node.js, Nginx switch
- **PM2 cluster mode** — Multiple workers, rolling restart

Đợi user > 1000 mới đầu tư.

## Deploy monitoring

### Discord webhook (optional)

Ship notification khi deploy xong:

```bash
DEPLOY_STATUS="✓ Deployed huongdi.sol.vn"
curl -X POST -H "Content-Type: application/json" \
     -d "{\"content\":\"$DEPLOY_STATUS\"}" \
     $DISCORD_WEBHOOK_URL
```

Setup: Discord server → Channel → Edit → Integrations → Webhooks → Copy URL.

### Uptime monitoring (recommended)

Đăng ký free tier:
- **UptimeRobot** — Ping mỗi 5 phút, email alert
- **BetterStack** — Advanced monitoring

Endpoints monitor:
- `https://huongdi.sol.vn/` — 200 OK
- `https://huongdi.sol.vn/api/health` — 200 OK
- `https://sol.vn/` — 200 OK
- `https://adminhuongdi.sol.vn/` — 200 OK
