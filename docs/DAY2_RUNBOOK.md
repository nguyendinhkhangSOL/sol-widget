# Day 2-3 Runbook — Deploy Backend trên VPS

**Mục tiêu:** Backend Express + Prisma chạy tại `bothuocla.sol.vn/api/*`, port 4000 internal.

Anh follow theo thứ tự dưới đây. Em đã viết script tự động — phần lớn chỉ cần copy-paste.

---

## ⚠️ Trước khi bắt đầu — anh cần chuẩn bị

### 1. Thông tin cần điền vào `.env`

| Biến | Giá trị | Nguồn |
|---|---|---|
| `JWT_SECRET` | 64-char random | Em sẽ generate hộ |
| `GEMINI_API_KEY` | Key Gemini Free hiện đang LIVE | Anh có sẵn trong setup hiện tại của Next.js |
| `ZALO_APP_SECRET` | 32 char | https://developers.zalo.me/app/3779171417159107862 → Settings |
| `ZALO_OA_ACCESS_TOKEN` | Long token | https://oa.zalo.me → Settings → Cấu hình API |
| `SMTP_PASSWORD` | Zoho app password | Zoho Mail → Settings → Security |
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | Web push | Em sẽ generate hộ |
| `VIETQR_BANK_BIN` + `VIETQR_ACCOUNT_NO` | Số TK Khang Sol | Anh cung cấp (cần cho Day 5) |

### 2. DNS Cloudflare (làm trên dashboard cloudflare.com)

- Vào sol.vn → DNS → Add record:
  - Type: **A**
  - Name: **admin**
  - IPv4: **103.72.57.11**
  - Proxy: **DNS only (xám)** — bật cam sau khi Certbot xong

`bothuocla.sol.vn` đã có sẵn, không cần thêm.

---

## Bước 1 — SSH vào VPS

```bash
ssh root@103.72.57.11
# hoặc tên user đã setup
```

## Bước 2 — Clone repo

```bash
cd /var/www
# Backup landing cũ nếu cần
[ -d sol-widget-old ] && mv sol-widget-old sol-widget-old.bak-$(date +%s)

git clone <repo-url> sol-widget-old
cd sol-widget-old

# Verify
ls -la backend/ dashboard/ admin/
```

## Bước 3 — Cài Node + PM2 (nếu chưa)

```bash
# Verify
node -v   # cần v20.x hoặc v22.x
pm2 -v    # cần >= 5

# Nếu chưa có:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

## Bước 4 — Verify Postgres

```bash
sudo systemctl status postgresql
psql --version   # cần >= 14

# Test kết nối:
sudo -u postgres psql -c "SELECT version();"
```

Nếu Postgres chưa cài: `sudo apt-get install -y postgresql postgresql-contrib`

## Bước 5 — Generate secrets

```bash
# JWT secret
echo "JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')"

# VAPID keys cho web push
cd /var/www/sol-widget-old/backend
npx web-push generate-vapid-keys
# Copy "Public Key" và "Private Key"
```

## Bước 6 — Tạo file .env

```bash
cd /var/www/sol-widget-old/backend
# Copy template (em đã upload trong session này):
cp /var/www/sol-widget/app/scripts/.env.production.template .env

# Mở edit:
nano .env
# Điền các giá trị anh đã chuẩn bị ở Bước 1 + secrets ở Bước 5
# Lưu: Ctrl+O → Enter → Ctrl+X

# Set permission an toàn:
chmod 600 .env
```

## Bước 7 — Chạy deploy script

```bash
cd /var/www/sol-widget-old

# Copy script:
cp /var/www/sol-widget/app/scripts/deploy-backend.sh ./
chmod +x deploy-backend.sh

# Set DB password (sẽ dùng để tạo user sol_app):
export DB_PASSWORD="<password mạnh em chọn — trùng với password trong .env DATABASE_URL>"

# Chạy:
bash ./deploy-backend.sh
```

Script sẽ tự động:
1. Sanity checks (Node, PM2, psql)
2. Cleanup `.bak` files
3. `npm ci` install dependencies
4. Tạo DB `sol_prod` + user `sol_app`
5. Prisma generate + migrate deploy (9 migrations)
6. Apply 21 raw SQL files theo thứ tự
7. Build TypeScript → `dist/`
8. Seed CHIP + Q-Day templates
9. PM2 start `sol-api`
10. Smoke test `/healthz` + anon auth

**Thời gian dự kiến: 5-10 phút.**

## Bước 8 — Setup nginx config bothuocla.sol.vn

```bash
# Backup nginx config cũ (Next.js):
sudo cp /etc/nginx/sites-enabled/bothuocla.sol.vn /etc/nginx/sites-enabled/bothuocla.sol.vn.bak-$(date +%s)

# Stop Next.js PM2 cũ:
pm2 delete sol-widget 2>/dev/null || echo "Next.js không chạy"

# Install nginx config mới:
sudo cp /var/www/sol-widget/app/scripts/nginx-bothuocla-sol-vn-v3.conf /etc/nginx/sites-enabled/bothuocla.sol.vn

# Test config (chưa có dashboard SPA thì static / sẽ 404 nhưng OK):
# Tạo tạm 1 file index.html để test reload không lỗi:
sudo mkdir -p /var/www/bothuocla-sol-vn
echo "<h1>Sol Widget - placeholder, dashboard sẽ deploy Day 7</h1>" | sudo tee /var/www/bothuocla-sol-vn/index.html

# Test nginx:
sudo nginx -t

# Reload:
sudo systemctl reload nginx
```

## Bước 9 — Smoke test sau deploy

```bash
# 1. Backend health qua nginx (https)
curl -i https://bothuocla.sol.vn/api/healthz
# Expected: HTTP 200 + {"ok":true,"now":"..."}

# 2. Anon auth
curl -X POST https://bothuocla.sol.vn/api/auth/anonymous \
  -H "Content-Type: application/json" \
  -d '{"deviceUid":"test-smoke","originDomain":"bothuocla.sol.vn"}'
# Expected: {"user":{...},"token":"eyJ..."}

# 3. PM2 status
pm2 list
pm2 logs sol-api --lines 30 --nostream | grep -i "scheduler\|cron"
# Expected thấy: "Scheduler started — 26 cron jobs active"

# 4. DB counts
sudo -u postgres psql -d sol_prod -c "
  SELECT 'User' AS t, COUNT(*) FROM \"User\"
  UNION ALL SELECT 'CannedReply', COUNT(*) FROM \"CannedReply\"
  UNION ALL SELECT 'ZaloTemplate', COUNT(*) FROM \"ZaloTemplate\";
"
# Expected: User >= 1 (smoke test anon), CannedReply >= 58, ZaloTemplate >= 0

# 5. Verify NO double-scheduler bug
pm2 logs sol-api --lines 100 --nostream | grep -c "Scheduler started"
# Expected: 1 (KHÔNG phải 2 như trước)
```

## Bước 10 — Grant admin cho Khang

```bash
cd /var/www/sol-widget-old/backend
npm run admin:grant nguyendinhkhang@gmail.com
# Output: "✓ Granted isAdmin to user nguyendinhkhang@gmail.com"
```

(Cần làm Bước 10 sau khi anh đã đăng nhập 1 lần bằng email magic link để tạo User record.)

---

## ⚠️ Nếu có lỗi

### Lỗi: `Prisma migrate deploy failed`

```bash
# Check migration status:
cd /var/www/sol-widget-old/backend
npx prisma migrate status

# Nếu lỗi schema drift:
# 1. Drop DB và làm lại từ đầu (CHỈ NẾU PILOT, KHÔNG có data thật)
sudo -u postgres psql -c "DROP DATABASE sol_prod;"
# Rồi chạy lại deploy-backend.sh
```

### Lỗi: `pm2 start sol-api` rồi crash

```bash
pm2 logs sol-api --lines 50 --err
# Xem error stack → fix .env hoặc dependencies
```

### Lỗi: SQL file `seed_zalo_templates.sql` báo "relation does not exist"

→ File `create_zalo_tables.sql` chưa chạy trước. Script đã order đúng — nếu vẫn lỗi, chạy tay:
```bash
PGPASSWORD=<pass> psql -h 127.0.0.1 -U sol_app -d sol_prod \
  -f /var/www/sol-widget-old/backend/prisma/create_zalo_tables.sql
PGPASSWORD=<pass> psql -h 127.0.0.1 -U sol_app -d sol_prod \
  -f /var/www/sol-widget-old/backend/prisma/seed_zalo_templates.sql
```

### Lỗi: Cloudflare 521 "Web server is down"

→ Backend chưa khởi động, hoặc nginx chưa reload. Check:
```bash
pm2 list                       # sol-api status?
sudo systemctl status nginx
curl http://127.0.0.1:4000/healthz   # internal check
```

---

## ✅ Khi nào Day 2-3 xong

Khi anh chạy `curl https://bothuocla.sol.vn/api/healthz` ra `{"ok":true,"now":"..."}` + thấy 26 cron loaded trong pm2 logs + DB có 58+ CannedReply → ✓ DONE.

Báo em "Backend live" → em chuyển sang Day 4 (port FTND vào dashboard).
