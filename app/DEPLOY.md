# 🚀 Sol Widget v0.2 — Deploy Guide

> Phone-first model (KHÔNG email) + VietQR cá nhân hoá
> Target: bothuocla.sol.vn (VPS sol-vps-01)

---

## Pre-requisites (đã xong từ session 20-5)

- ✅ VPS Ubuntu 24.04 (`ssh sol-vps` work)
- ✅ Node.js 20 + PM2 + PostgreSQL 16 + Nginx + SSL
- ✅ DNS bothuocla.sol.vn → 103.72.57.11 (Cloudflare Proxied + Full strict SSL)

---

## ⭐ Deploy LẦN ĐẦU — 4 bước

### Bước 1: Setup VPS (chạy 1 lần duy nhất)

```powershell
# Upload setup script
scp C:\BOTHUOCLA\sol-widget\app\scripts\setup-vps.sh sol-vps:/tmp/

# Chạy trên VPS
ssh sol-vps "sudo bash /tmp/setup-vps.sh"
```

→ Script sẽ:
- Tạo PostgreSQL user `sol_app` + database `sol_widget`
- Generate DB password ngẫu nhiên (in ra terminal)
- Tạo `/var/www/sol-widget/` folder
- Install PM2 global
- In ra `.env.production` template với password

**⚠️ LƯU LẠI DB PASSWORD** mà script in ra!

### Bước 2: Deploy code lần đầu

```powershell
cd C:\BOTHUOCLA\sol-widget\app
.\deploy.ps1
```

Script tự động:
- Package source code (tar.gz)
- SCP upload lên VPS
- npm ci + npm run build
- PM2 start lần đầu
- Verify HTTP 200

⚠️ **Build lần đầu sẽ FAIL vì chưa có `.env`** — đến Bước 3.

### Bước 3: Tạo `.env` trên VPS

```powershell
ssh sol-vps "cat /tmp/sol-env-template.txt"
```

Copy nội dung, edit (đặc biệt BANK info), rồi:

```powershell
ssh sol-vps "nano /var/www/sol-widget/.env"
# Paste nội dung → Ctrl+O → Enter → Ctrl+X
```

Hoặc tự generate file local rồi scp:

```powershell
# Create .env.production local
notepad C:\BOTHUOCLA\sol-widget\app\.env.production
# Paste content, edit bank info, save

# Upload
scp C:\BOTHUOCLA\sol-widget\app\.env.production sol-vps:/var/www/sol-widget/.env
```

### Bước 4: Apply database migration

```powershell
ssh sol-vps "psql `$(grep DATABASE_URL /var/www/sol-widget/.env | cut -d= -f2-) -f /var/www/sol-widget/db/migrations/002_phone_first_refactor.sql"
```

Hoặc nếu lỗi escape:
```powershell
ssh sol-vps "bash -c 'source <(grep DATABASE_URL /var/www/sol-widget/.env); psql \$DATABASE_URL -f /var/www/sol-widget/db/migrations/002_phone_first_refactor.sql'"
```

→ Expect output 4 tables created.

### Bước 5: Deploy lại + Install Nginx config + Start

```powershell
# Re-deploy với .env đầy đủ
.\deploy.ps1
```

```powershell
# Install Nginx config (1 lần)
ssh sol-vps "sudo bash /var/www/sol-widget/scripts/install-nginx.sh"
```

### Bước 6: Verify

```powershell
# Test HTTP
curl.exe -I https://bothuocla.sol.vn

# Test API
curl.exe -X POST https://bothuocla.sol.vn/api/test-result `
  -H "Content-Type: application/json" `
  -d '{"answers":[{"q":1,"a":3},{"q":2,"a":1},{"q":3,"a":1},{"q":4,"a":2},{"q":5,"a":1},{"q":6,"a":0}]}'

# Expect JSON: {id, score, cohort: "MODERATE", plan: {...}}
```

→ Mở browser: **https://bothuocla.sol.vn** ✓

---

## 🔄 Re-deploy (sau khi sửa code)

```powershell
cd C:\BOTHUOCLA\sol-widget\app
.\deploy.ps1
```

Mất ~30-60 giây. Tự động:
- Tar source code (bỏ node_modules, .next, .env)
- SCP upload
- Extract (backup .env tự động)
- npm ci + npm run build
- PM2 restart sol-widget

---

## 📊 Monitoring

### PM2 logs

```powershell
ssh sol-vps "pm2 logs sol-widget --lines 50"
ssh sol-vps "pm2 logs sol-widget --err"
ssh sol-vps "pm2 monit"
```

### Nginx logs

```powershell
ssh sol-vps "sudo tail -f /var/log/nginx/sol-widget-access.log"
ssh sol-vps "sudo tail -f /var/log/nginx/sol-widget-error.log"
```

### Database queries (xem leads, payments)

```powershell
ssh sol-vps "sudo -u postgres psql -d sol_widget"
```

Sau đó trong psql:

```sql
-- Members đăng ký gần đây
SELECT id, phone, full_name, cohort, stage, created_at
FROM members
ORDER BY created_at DESC
LIMIT 10;

-- Funnel
SELECT * FROM v_daily_funnel LIMIT 7;

-- Cohort stats
SELECT * FROM v_cohort_stats;

-- Trial sắp hết hạn
SELECT * FROM v_trial_ending_soon;

-- Payments pending
SELECT id, member_id, amount_vnd, qr_content, status, created_at
FROM payments
WHERE status = 'pending'
ORDER BY created_at DESC;

\q
```

---

## 🛠️ Workflow admin hàng ngày (Khang)

### Sáng 8h — Check leads mới

```powershell
ssh sol-vps "sudo -u postgres psql -d sol_widget -c \"SELECT phone, full_name, cohort, created_at FROM members WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC;\""
```

→ Mở Zalo → kết bạn từng SĐT.

### Trưa 12h — Check banking + confirm payments

1. Mở app banking → xem giao dịch mới
2. Match nội dung `SOL-{COHORT}-{SDT}-{TYPE}`
3. Update database:

```sql
UPDATE payments
SET status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = 'khang',
    bank_tx_id = 'YOUR_BANK_REF',
    bank_tx_at = NOW()
WHERE qr_content = 'SOL-MODERATE-0901234567-FULL'
  AND status = 'pending';

-- Update member stage
UPDATE members
SET stage = 'cutting',
    subscription_started_at = NOW(),
    subscription_ends_at = NOW() + INTERVAL '45 days',  -- 45 cho MODERATE
    last_payment_at = NOW(),
    total_paid_vnd = total_paid_vnd + 225000
WHERE phone = '0901234567';
```

→ Sau này em sẽ build admin panel để click chứ không cần SQL.

### Tối 8h — Reply Zalo support

---

## 🚨 Troubleshooting

### 502 Bad Gateway

```powershell
ssh sol-vps "pm2 status"
ssh sol-vps "pm2 logs sol-widget --err --lines 30"

# Restart nếu cần
ssh sol-vps "pm2 restart sol-widget"
```

### Build fail

```powershell
ssh sol-vps "cd /var/www/sol-widget && rm -rf .next node_modules && npm ci && npm run build"
```

### Database connection fail

```powershell
ssh sol-vps "psql \$(grep DATABASE_URL /var/www/sol-widget/.env | cut -d= -f2-) -c 'SELECT 1'"
```

Nếu fail:
- Check Postgres running: `ssh sol-vps "sudo systemctl status postgresql"`
- Check password trong .env có đúng không
- Re-grant permissions: `sudo -u postgres psql -d sol_widget -c "GRANT ALL ON SCHEMA public TO sol_app;"`

### Rollback về landing tĩnh

```powershell
# Stop PM2
ssh sol-vps "pm2 stop sol-widget"

# Restore landing config cũ
ssh sol-vps "sudo cp /root/nginx-backups/LATEST.conf /etc/nginx/sites-enabled/bothuocla.sol.vn"
ssh sol-vps "sudo nginx -t && sudo systemctl reload nginx"
```

---

## ⏱️ Timeline 31-5

| Date | Việc |
|---|---|
| **21/5** | ✅ App v0.1 scaffold |
| **22/5** | ✅ Refactor v0.2 (phone-first + VietQR + Cohort) |
| **23/5** | 🔄 Deploy v0.2 lên VPS, test E2E |
| **24-26/5** | Bug fix + polish + add features missing (voice script, FAQ AI) |
| **27-29/5** | Soft launch 5-10 beta users + feedback |
| **30/5** | Final polish + content SEO 6 bài |
| **31/5** | 🚀 **D-DAY LAUNCH** |

---

**Last updated**: 2026-05-22
**Version**: 0.2 (phone-first + VietQR)
**Author**: Khang Sol
