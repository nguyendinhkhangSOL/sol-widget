# Sol Ecosystem — Runbook (Emergency Procedures)

**Version:** 1.0
**Last updated:** 2026-07-07

Procedures khi có sự cố production. Đọc + nhớ vị trí file này. Khi khủng hoảng — mở đúng section.

## 🚨 Site down — Diagnostic tree

### Step 1: Xác định site nào down

Test 5 domains:
```bash
curl -sI https://sol.vn/ | head -1
curl -sI https://huongdi.sol.vn/ | head -1
curl -sI https://adminhuongdi.sol.vn/ | head -1
curl -sI https://admin.sol.vn/ | head -1
curl -sI https://bothuocla.sol.vn/ | head -1
```

Nếu return `HTTP/2 200` → OK. Nếu timeout / 502 / 503 / 500 → down.

### Step 2: Nếu tất cả VPS domains down

VPS-level issue.

```bash
ssh sol-vps

# Check Nginx
sudo systemctl status nginx
sudo tail -50 /var/log/nginx/error.log

# Check disk full
df -h

# Check RAM
free -h

# Check CPU
top -bn1 | head -10
```

**Fixes:**
- Nginx down: `sudo systemctl restart nginx`
- Disk full: `sudo journalctl --vacuum-time=7d` (giảm logs), clean `.bak-*` files
- OOM: `pm2 restart all` (memory leak), consider upgrade RAM

### Step 3: Nếu chỉ huongdi.sol.vn down (Node.js API 502)

```bash
# Check PM2
pm2 status
pm2 logs huongdi-api --lines 100

# Restart
pm2 restart huongdi-api

# If crash loop:
pm2 delete huongdi-api
cd /var/www/huongdi/backend
pm2 start dist/index.js --name huongdi-api --update-env
pm2 save
```

**Common causes:**
- `.env` sai (Zoho SMTP EAUTH 535)
- DB connection dropped (Prisma reconnect)
- Uncaught exception → PM2 restart loop

### Step 4: Nếu sol.vn WordPress fatal error

**Symptoms:** "Critical error on this site" hoặc blank page.

```bash
# Không có SSH cPanel, dùng cPanel File Manager
# Login cPanel → File Manager → /public_html/
# 1. Xem file wp-config.php có bị corrupt không
# 2. Kiểm tra mu-plugins/ có file mới break
# 3. Rename folder mu-plugins → mu-plugins-disabled → test
```

**Common causes trong history:**
- `is_login()` function không tồn tại trong WordPress → xoá reference
- NULL bytes từ Edit tool → strip bytes trong file
- UTF-8 mojibake do cPanel encoded Windows-1252 → dùng Unicode escapes

**Fix flow:**
1. Login cPanel File Manager
2. Rename `wp-content/mu-plugins/` → `mu-plugins-disabled`
3. Reload sol.vn — nếu OK → biết bug trong mu-plugins
4. Enable từng file để tìm file broken
5. Restore file từ Git: `C:\BOTHUOCLA\sol-ecosystem\solvn-wp\mu-plugins\[file].php`
6. Upload lại

## 🔐 Restore DB from backup

### From Phase 0 backup (2026-07-07)

```bash
# On VPS
DATE="2026-07-07_09-00-02"
BACKUP="/var/backups/sol-ecosystem/${DATE}/databases/huongdi_prod.sql.gz"

# Verify backup file
ls -lah $BACKUP

# WARNING: Điều này XOÁ tất cả data hiện tại
# Backup current DB trước:
sudo -u postgres pg_dump huongdi_prod | gzip > /tmp/pre-restore-$(date +%s).sql.gz

# Restore
gunzip -c $BACKUP | sudo -u postgres psql huongdi_prod
```

### From daily rolling backup

```bash
# List available
ls -1t /var/backups/db-daily/*.sql.gz | head -7

# Restore latest
LATEST=$(ls -1t /var/backups/db-daily/*.sql.gz | head -1)
gunzip -c $LATEST | sudo -u postgres psql huongdi_prod
```

## 🔄 Rollback bad deploy

### Rollback single file

```bash
ssh sol-vps
cd /var/www/huongdi-git

# Xem history
git log --oneline huongdi-public/sol-ui.js

# Restore file từ commit cũ
git checkout <commit-hash> huongdi-public/sol-ui.js

# Push + deploy
git commit -m "revert: restore sol-ui.js to <commit-hash>"
git push origin main

sudo rsync -av huongdi-public/sol-ui.js /var/www/huongdi/public/sol-ui.js
```

### Rollback entire commit

```bash
cd /var/www/huongdi-git
git log --oneline | head -5

# Revert last commit
git revert HEAD --no-edit
git push origin main

# Re-deploy
bash scripts/deploy-huongdi-public.sh
# Hoặc bash scripts/deploy-huongdi-backend.sh
```

## 💳 Payment issue — Manual verify

### User claim đã chuyển tiền nhưng chưa activate

1. **Check Postgres:**
```bash
sudo -u postgres psql -d huongdi_prod
SELECT id, email, tier, status FROM users WHERE email = 'user@example.com';
SELECT * FROM payments WHERE user_id = <id> ORDER BY created_at DESC;
```

2. **Verify bank transfer:**
- Login Techcombank Business Banking
- Filter transactions → find `SDT xxxxxxxxxx` trong content
- Amount: 499.000 (Active) hoặc 1.999.000 (Founder)

3. **Manual upgrade:**
```sql
UPDATE users
SET tier = 'active',
    activated_at = NOW(),
    updated_at = NOW()
WHERE email = 'user@example.com';

INSERT INTO payments (user_id, amount, tier, status, verification_notes, created_at)
VALUES (<id>, 499000, 'active', 'verified', 'Manual verify 2026-07-07', NOW());
```

4. **Send confirmation email:**
- Login `/admin` (adminhuongdi.sol.vn)
- User Management → find user → click "Send activation email"

## 📧 Email không gửi được (Zoho SMTP EAUTH 535)

### Check .env
```bash
ssh sol-vps
sudo cat /var/www/huongdi/backend/.env | grep -i smtp
```

### Common causes
- Password Zoho hết hạn (đổi 90 ngày)
- IMAP không enable trong Zoho settings
- Wrong port (phải 465 SSL, KHÔNG 587 TLS)
- 2FA blocking

### Fix
1. Login `https://mail.zoho.com`
2. Settings → Mail Accounts → IMAP/POP → Enable IMAP
3. Settings → Security → Generate App Password (nếu 2FA)
4. Update `.env`:
```
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=hello@sol.vn
SMTP_PASS=<app-password>
```
5. Restart: `pm2 restart huongdi-api --update-env`
6. Test: send test email từ `/quen-mat-khau/`

## 🤖 Sol Đồng Hành AI không trả lời

### Check Anthropic API

```bash
# Verify key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

**Errors:**
- 401 → key sai → check `.env` `ANTHROPIC_API_KEY`
- 429 → rate limit → wait 60s
- 402 → credit hết → topup https://console.anthropic.com/

### Check backend logs
```bash
pm2 logs huongdi-api --lines 100 | grep -i "sol-dong-hanh\|anthropic"
```

## 🔒 Security incident

### Suspected breach

1. **Rotate secrets ngay:**
```bash
# JWT secret
openssl rand -base64 32                     # Generate new
# Edit /var/www/huongdi/backend/.env
pm2 restart huongdi-api --update-env
```

2. **Force logout tất cả users:**
```sql
-- Update JWT secret → all existing tokens invalid
-- Users cần login lại
```

3. **Change DB password:**
```bash
sudo -u postgres psql
ALTER USER huongdi_user WITH PASSWORD 'new-strong-password';
# Update .env DATABASE_URL
```

4. **Audit access log:**
```bash
sudo tail -1000 /var/log/nginx/access.log | grep -E "POST|PUT|DELETE"
```

## 📦 Backup restore full

### Restore từ Phase 0 backup

```bash
# Trên VPS
DATE="2026-07-07_09-00-02"
BACKUP_DIR="/var/backups/sol-ecosystem/${DATE}"

# 1. Restore code
sudo tar -xzf $BACKUP_DIR/huongdi/huongdi-full.tar.gz -C /var/www/

# 2. Restore .env
sudo cp $BACKUP_DIR/configs/huongdi-backend.env /var/www/huongdi/backend/.env

# 3. Restore DB
gunzip -c $BACKUP_DIR/databases/huongdi_prod.sql.gz | sudo -u postgres psql huongdi_prod

# 4. Restore Nginx configs
sudo cp $BACKUP_DIR/configs/nginx-*.conf /etc/nginx/sites-available/
sudo nginx -t && sudo systemctl reload nginx

# 5. Restore PM2
pm2 delete all
pm2 resurrect $BACKUP_DIR/configs/pm2-dump.pm2

# 6. Verify
curl -I https://huongdi.sol.vn/
pm2 status
```

### Restore từ laptop backup (nếu VPS backup mất)

```powershell
# Download từ laptop
$BACKUP = "C:\BOTHUOCLA\backups\2026-07-07_09-00-02"

# Upload lên VPS
scp -r $BACKUP\huongdi\huongdi-full.tar.gz sol-vps:/tmp/
scp $BACKUP\databases\huongdi_prod.sql.gz sol-vps:/tmp/
scp $BACKUP\configs\huongdi-backend.env sol-vps:/tmp/

# SSH VPS + restore theo commands trên
```

## 📞 Emergency contacts

- **Owner:** Khang Sol
- **Zalo:** 09xxxxxxxx (from Zalo widget config)
- **Email:** nguyendinhkhang@gmail.com
- **Hotline business:** 024.3993.1800
- **Hosting VPS provider:** [Company] — [Support phone/email]
- **Hosting shared cPanel:** [Company] — [Support phone/email]
- **Domain registrar:** [Company] — [Support phone/email]

## 📝 Post-incident checklist

Sau mỗi sự cố:

1. **Document trong CHANGELOG.md** với timestamp + root cause + fix
2. **Add ADR** nếu có architecture decision mới
3. **Update RUNBOOK.md** nếu diagnostic step mới
4. **Commit + push GitHub**
5. **Notify team/user** nếu có ảnh hưởng
6. **Postmortem** nếu incident lớn (> 1 giờ downtime hoặc data loss)
