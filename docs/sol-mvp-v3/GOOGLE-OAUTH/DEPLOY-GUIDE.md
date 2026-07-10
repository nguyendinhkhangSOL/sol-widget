# Google OAuth — Deploy Guide

## Prerequisites

Anh Khang xong Google Cloud Console setup, ship em:
- `GOOGLE_CLIENT_ID` (dạng `xxx.apps.googleusercontent.com`)
- `GOOGLE_CLIENT_SECRET` (chuỗi ngẫu nhiên)

Callback URL đã dùng trong code: `https://huongdi.sol.vn/api/auth/google/callback`

## Deploy Step 1 — Backend

### 1.1 Install dependency

```bash
ssh sol-vps
cd /var/www/huongdi/backend
sudo npm install google-auth-library
```

### 1.2 Add env vars

```bash
sudo nano /var/www/huongdi/backend/.env
# Add 3 lines:
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=https://huongdi.sol.vn/api/auth/google/callback
```

### 1.3 Upload backend files từ laptop

```powershell
# Windows PowerShell
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-backend\src\routes\google-auth.ts sol-vps:/tmp/
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-backend\src\index.ts sol-vps:/tmp/index.ts.new
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-backend\prisma\schema.prisma sol-vps:/tmp/schema.prisma.new
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-backend\prisma\migrations\20260707_add_google_oauth\migration.sql sol-vps:/tmp/gg-migration.sql
```

```bash
# On VPS
ssh sol-vps
sudo cp /tmp/google-auth.ts /var/www/huongdi/backend/src/routes/
sudo cp /tmp/index.ts.new /var/www/huongdi/backend/src/index.ts
sudo cp /tmp/schema.prisma.new /var/www/huongdi/backend/prisma/schema.prisma
sudo chown solop:solop /var/www/huongdi/backend/src/routes/google-auth.ts /var/www/huongdi/backend/src/index.ts /var/www/huongdi/backend/prisma/schema.prisma
```

### 1.4 Run Prisma migration

```bash
cd /var/www/huongdi/backend

# Backup DB before migration
sudo -u postgres pg_dump huongdi_prod | gzip > /var/backups/db-pre-oauth-$(date +%s).sql.gz

# Apply migration manually
sudo -u postgres psql huongdi_prod < /tmp/gg-migration.sql

# Regenerate Prisma client
sudo npx prisma generate
```

### 1.5 Build + Restart

```bash
sudo npm run build
pm2 restart huongdi-api --update-env
pm2 logs huongdi-api --lines 30 --nostream
```

### 1.6 Smoke test

```bash
# Test endpoint exists (should redirect to Google)
curl -I "https://huongdi.sol.vn/api/auth/google?next=/toi/"
# Expected: HTTP/2 302 with Location: accounts.google.com/...
```

## Deploy Step 2 — Frontend

```powershell
# Windows PowerShell — upload 3 files
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-public\dang-nhap\index.html sol-vps:/tmp/dn.html
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-public\dang-ky\index.html sol-vps:/tmp/dk.html
scp C:\BOTHUOCLA\sol-ecosystem\huongdi-public\dang-ky\step-2\index.html sol-vps:/tmp/dk-step2.html
```

```powershell
$TS = Get-Date -Format "yyyyMMdd-HHmmss"
ssh sol-vps "sudo mkdir -p /var/backups/oauth-$TS /var/www/huongdi/public/dang-ky/step-2 && sudo cp /var/www/huongdi/public/dang-nhap/index.html /var/backups/oauth-$TS/dn.html && sudo cp /var/www/huongdi/public/dang-ky/index.html /var/backups/oauth-$TS/dk.html && sudo mv /tmp/dn.html /var/www/huongdi/public/dang-nhap/index.html && sudo mv /tmp/dk.html /var/www/huongdi/public/dang-ky/index.html && sudo mv /tmp/dk-step2.html /var/www/huongdi/public/dang-ky/step-2/index.html && sudo chown -R www-data:www-data /var/www/huongdi/public/dang-nhap /var/www/huongdi/public/dang-ky && echo 'Deploy frontend OK'"
```

## Test E2E

### Test 1: New Gmail user
1. Mở incognito `https://huongdi.sol.vn/dang-ky/`
2. Click "Đăng ký với Gmail"
3. Chọn 1 Gmail chưa dùng cho Sol
4. Grant permission
5. Redirect `/dang-ky/step-2/?token=xxx`
6. Nhập SDT
7. Redirect `/kham-pha-ban-than/`

### Test 2: Existing user (auto-link)
1. Đăng ký user với email `test@gmail.com` bằng password thường
2. Logout
3. Click "Đăng nhập với Gmail" → chọn `test@gmail.com`
4. Redirect `/toi/` — user auto-linked Google

### Test 3: Returning Google user
1. Test 1 xong
2. Logout
3. Click "Đăng nhập với Gmail" → chọn cùng Gmail
4. Redirect `/toi/` — instant login

## Rollback nếu có bug

```bash
# Rollback backend
ssh sol-vps
cd /var/www/huongdi/backend
# Remove google-auth mount from index.ts (restore từ backup)
sudo cp /var/backups/oauth-*/index.ts.original /var/www/huongdi/backend/src/index.ts
sudo npm run build
pm2 restart huongdi-api
```

Frontend rollback: copy các file `.bak-*` từ /var/backups/oauth-*/
