# Sol — Deploy Workflow (edit code → live)

> Quy trình chuẩn từ lúc anh edit code trên Windows local cho tới khi user thấy thay đổi trên prod.
> Áp dụng cho cả backend, dashboard, admin.
> Cập nhật: 2026-05-22.

---

## 1. Phân loại thay đổi

| Loại thay đổi | Cần build? | Cần migrate? | Cần restart? |
|---|---|---|---|
| Backend `src/**.ts` (route, logic) | `tsc` | — | `pm2 restart sol-api` |
| Backend `prisma/schema.prisma` | `tsc` + `prisma generate` | `prisma migrate deploy` | `pm2 restart sol-api` |
| Dashboard `src/**.tsx` | `npm run build` | — | `cp dist → /var/www/...` (nginx serve static, không restart) |
| Admin `src/**.tsx` | `npm run build` | — | `cp dist → /var/www/...` |
| Nginx config `*.conf` | — | — | `sudo nginx -t && sudo systemctl reload nginx` |
| `.env` backend | — | — | `pm2 restart sol-api` |
| Cloudflare Worker `robots-override.js` | — | — | Paste vào dash → Deploy → Purge cache |

---

## 2. Setup local 1 lần (đã xong nhưng note để khôi phục)

```powershell
# Windows
cd C:\BOTHUOCLA\sol-widget

# Backend deps
cd backend
npm install
cp .env.example .env             # rồi sửa giá trị thật
npx prisma generate

# Dashboard deps
cd ../dashboard
npm install

# Admin deps  
cd ../admin
npm install
```

Local servers:
- Backend dev: `cd backend && npm run dev` → :4000
- Dashboard dev: `cd dashboard && npm run dev` → :5174
- Admin dev: `cd admin && npm run dev` → :5175 (hoặc port nó tự pick)

---

## 3. Workflow chuẩn

### Bước 1 — Edit code local

Edit trên Windows tại `C:\BOTHUOCLA\sol-widget\...`.

**Quick sanity check trước commit**:
```powershell
cd C:\BOTHUOCLA\sol-widget\backend
npx tsc --noEmit                 # TypeScript clean?
```

### Bước 2 — Git commit + push

```powershell
cd C:\BOTHUOCLA\sol-widget
git status
git add .
git commit -m "feat: <description>"
git push origin main
```

**⚠️ Edge case `.gitignore` block SQL**: lúc trước `.gitignore` filter `*.sql` chặn cả `prisma/*.sql` cần commit. Verify `git status` thấy file SQL muốn add → nếu KHÔNG → edit `.gitignore` allow `!prisma/*.sql`.

### Bước 3 — SSH VPS

```powershell
ssh sol-vps
# Hoặc full: ssh -i ~/.ssh/sol_vps solop@103.72.57.11
```

Nhận solop user. Đa số ops phải `sudo` → switch root tiện hơn:

```bash
sudo -i
```

### Bước 4 — Pull code mới

```bash
cd /var/www/sol-widget-old
git status                      # verify clean
git pull origin main
```

**Edge case 1 — git lock**:
```
fatal: Unable to create '.git/index.lock': File exists.
```
→ Có process git khác đang chạy hoặc crash:
```bash
ls -la .git/index.lock
rm .git/index.lock               # CHỈ khi chắc không có git process khác
```

**Edge case 2 — dirty working tree**:
```
error: Your local changes to the following files would be overwritten by merge
```
→ Có file đã sửa trên VPS (vd `.env`):
```bash
git stash                        # stash thay đổi
git pull
git stash pop                    # restore
```

### Bước 5a — Deploy backend

```bash
cd /var/www/sol-widget-old/backend
npm install                      # nếu package.json đổi
npx prisma generate              # nếu schema.prisma đổi
npx prisma migrate deploy        # nếu có migration mới
npm run build                    # tsc → dist/
pm2 restart sol-api
pm2 logs sol-api --lines 30      # verify không error
```

**Smoke test**:
```bash
curl -s http://127.0.0.1:4000/healthz
# Expect: {"ok":true,"now":"..."}

curl -s https://bothuocla.sol.vn/api/healthz
# Expect: cùng response qua nginx proxy
```

### Bước 5b — Deploy dashboard

```bash
cd /var/www/sol-widget-old/dashboard
npm install                      # nếu package.json đổi
VITE_BASE=/ VITE_API_BASE=/api npm run build
# → tạo dist/

# Copy sang nginx root
cp -r dist/* /var/www/bothuocla-sol-vn/
chown -R www-data:www-data /var/www/bothuocla-sol-vn/

# Nginx serve static, KHÔNG restart
```

**Verify**:
```bash
curl -I https://bothuocla.sol.vn/
# 200 OK + content-type: text/html

# Test SPA fallback
curl -I https://bothuocla.sol.vn/journey
# Expect: 200 OK (nginx try_files fallback /index.html)
```

### Bước 5c — Deploy admin

```bash
cd /var/www/sol-widget-old/admin
npm install
VITE_API_BASE=https://bothuocla.sol.vn/api npm run build
cp -r dist/* /var/www/admin-sol-vn/
chown -R www-data:www-data /var/www/admin-sol-vn/
```

### Bước 6 — Verify browser

Mở incognito tab:
- `https://bothuocla.sol.vn/` → dashboard load
- `https://bothuocla.sol.vn/test-ftnd` → FTND form
- DevTools Network → API call `/api/users/me` trả 200, KHÔNG `localhost:4000`
- `https://admin.sol.vn/` → admin login screen

---

## 4. Edge cases & fixes thường gặp

### 4.1. Nginx 403 Forbidden

**Nguyên nhân**: permission `/var/www/bothuocla-sol-vn/` không đúng.

```bash
sudo chown -R www-data:www-data /var/www/bothuocla-sol-vn/
sudo chmod -R 755 /var/www/bothuocla-sol-vn/
sudo systemctl reload nginx
```

### 4.2. Nginx 502 Bad Gateway

**Nguyên nhân**: backend down hoặc port khác.

```bash
pm2 list                                    # sol-api status?
pm2 logs sol-api --err --lines 50           # error gì?
pm2 restart sol-api
curl http://127.0.0.1:4000/healthz          # internal có healthy?
```

Nếu backend OK mà nginx vẫn 502 → check nginx error log:
```bash
sudo tail -50 /var/log/nginx/bothuocla-error.log
```

### 4.3. Nginx rewrite loop (308 → 308 → ...)

**Nguyên nhân**: Cloudflare SSL mode `Flexible` thay vì `Full strict` → CF gửi HTTP về origin → nginx redirect 301 về HTTPS → CF gửi HTTP lại → loop.

**Fix**: Cloudflare dash → sol.vn → SSL/TLS → `Full (strict)`.

### 4.4. /api/* prefix strip

Backend Express mount router không có `/api` prefix (route là `/auth/...`, `/users/...`). Nginx phải proxy `/api/*` → `127.0.0.1:4000/*` (strip `/api`).

Nginx config đã đúng (xem `nginx-bothuocla-sol-vn-v3.conf` — `proxy_pass http://127.0.0.1:4000;` không có trailing slash → nginx strip prefix do location prefix matching).

⚠️ NẾU đổi nginx → đừng thêm trailing slash `proxy_pass http://127.0.0.1:4000/;` nếu Express expect path nguyên (sẽ break).

### 4.5. TypeScript build errors (TS7006 implicit any)

Hôm 21/5 backend `src/scheduler/worker.ts` báo 5 lỗi TS7006 (`Parameter 'x' implicitly has an 'any' type.`):

Fix: add explicit types ở callback (vd `(notif: Notification) => …`). Hoặc tạm tắt `noImplicitAny` trong `tsconfig.json` (KHÔNG khuyến khích).

### 4.6. `.env` comment trailing trong values

Bug ngày 22/5 — `.env` viết:
```
SMTP_PASSWORD=xxxxxxxx        # SMTP key Brevo
```

→ Node `dotenv` đọc value bao gồm cả space + comment. Backend authenticate fail.

**Fix**: KHÔNG có comment cùng dòng value:
```
# SMTP key Brevo
SMTP_PASSWORD=xxxxxxxx
```

TODO post-launch: viết helper `strip-env-comments.js` để tự clean lúc load.

### 4.7. PM2 cluster mode → cron chạy nhiều lần

Mỗi instance PM2 chạy `worker.ts` → cron chạy N lần. Hiện set `instances: 1` + `exec_mode: 'fork'`. Đừng đổi sang `cluster`.

Alternative: tách worker thành PM2 process riêng `sol-worker` với `ENABLE_SCHEDULER=true`, còn `sol-api` chạy với `ENABLE_SCHEDULER=false`.

### 4.8. Brevo SMTP fail authentication

**Triệu chứng**: `Invalid login: 535-5.7.8 Username and Password not accepted`.

**Nguyên nhân thường**:
- `SMTP_USER` dùng `khang@sol.vn` thay vì `<id>@smtp-brevo.com` (Brevo cấp login riêng)
- `SMTP_PORT=465 + SMTP_SECURE=true` nhưng Brevo dùng `587 + SMTP_SECURE=false` (STARTTLS)
- SMTP key bị regenerate trên Brevo dash mà chưa update `.env`

**Fix**: Brevo dash → SMTP & API → SMTP → "Generate a new SMTP key" → copy → paste vào `.env`:
```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<id from Brevo>@smtp-brevo.com
SMTP_PASSWORD=<32-char SMTP key>
```

---

## 5. Cloudflare Worker deploy (separate flow)

```
1. Edit C:\BOTHUOCLA\sol-widget\workers\robots-override.js trên Windows
2. dash.cloudflare.com → Workers & Pages → sol-robots-override → Edit code
3. Ctrl+A → Delete editor content
4. Paste content from local file
5. Click "Deploy"
6. Purge cache: Caching → Custom Purge → URL: https://sol.vn/robots.txt
7. Verify:
   curl -I https://sol.vn/robots.txt   # expect x-served-by: sol-worker
```

---

## 6. WordPress deploy (sol.vn — KHÁC VPS)

WordPress chạy trên cPanel eztech.vn (host KHÁC VPS).

- Publish bài qua script: `scripts/wp-publisher/publish-*.js` (dùng WP REST API + App Password)
- Edit theme: cPanel File Manager hoặc SFTP
- OG image: `python og-gen.py --batch og-method-cluster-batch.txt`
- Footer plugin: `wp-content/plugins/sol-global-footer/` (medical disclaimer inject mọi page)

Không có "deploy step" như backend/dashboard — WP self-publish.

---

## 7. Rollback nhanh

### 7.1. Backend bad deploy

```bash
cd /var/www/sol-widget-old
git log --oneline -10            # tìm commit trước khi bad
git checkout <good_sha>
cd backend && npm run build
pm2 restart sol-api
```

Hoặc revert commit + redeploy:
```bash
git revert HEAD
git push
# trên VPS: git pull && rebuild
```

### 7.2. Dashboard bad deploy

```bash
# Trên VPS — restore dist từ backup folder
cp -r /var/www/bothuocla-sol-vn-backup/* /var/www/bothuocla-sol-vn/
```

→ TODO: setup snapshot `/var/www/bothuocla-sol-vn-backup/` trước mỗi deploy.

### 7.3. DB migration bad

```bash
sudo -u postgres psql -c "DROP DATABASE sol_prod;"
sudo -u postgres psql -c "CREATE DATABASE sol_prod OWNER sol_app;"
gunzip < /var/backups/sol-db-<date>.sql.gz | sudo -u postgres psql sol_prod
cd /var/www/sol-widget-old/backend && pm2 restart sol-api
```

---

## 8. One-liner cheat (anh paste là chạy)

### Deploy backend từ Windows
```powershell
ssh sol-vps "cd /var/www/sol-widget-old && sudo git pull && cd backend && sudo npm run build && sudo pm2 restart sol-api && sudo pm2 logs sol-api --lines 20 --nostream"
```

### Deploy dashboard từ Windows
```powershell
ssh sol-vps "cd /var/www/sol-widget-old/dashboard && sudo git pull && sudo VITE_BASE=/ VITE_API_BASE=/api npm run build && sudo cp -r dist/* /var/www/bothuocla-sol-vn/ && sudo chown -R www-data:www-data /var/www/bothuocla-sol-vn/"
```

(Verify hai lệnh trên với current `pm2 list` trước khi paste blind.)

---

## 9. Tham khảo

- [02-CHEATSHEET.md](./02-CHEATSHEET.md) — lệnh thường dùng (SSH, scp, nginx restart)
- [04-VPS_CONFIG.md](./04-VPS_CONFIG.md) — VPS layout
- [05-ARCHITECTURE.md](./05-ARCHITECTURE.md) — kiến trúc
- [06-DATABASE.md](./06-DATABASE.md) — migration workflow chi tiết hơn
- [08-OPERATIONS.md](./08-OPERATIONS.md) — runbook ops + troubleshooting sâu hơn

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
