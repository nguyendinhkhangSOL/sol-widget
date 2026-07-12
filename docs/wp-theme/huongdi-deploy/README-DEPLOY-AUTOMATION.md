# HUONGDI.SOL.VN — Deploy Automation Quick Guide

> 6 files automation để deploy huongdi.sol.vn + adminhuongdi.sol.vn lên VPS
> trong **15-20 phút** thay vì 2-3 giờ manual.
>
> **Yêu cầu:** DNS A records đã trỏ về 103.72.57.11 (Khang đã làm)

---

## 📦 6 files trong bộ này

| File | Vai trò | Chạy ở đâu |
|---|---|---|
| `01-deploy-huongdi.sh` | Bash automation Bước 2-7 | VPS (sudo) |
| `02-nginx-huongdi.sol.vn.conf` | Vhost frontend | `/etc/nginx/sites-available/` |
| `03-nginx-adminhuongdi.sol.vn.conf` | Vhost admin SPA | `/etc/nginx/sites-available/` |
| `04-env.example.huongdi` | Template `.env` | `/var/www/huongdi/backend/.env` |
| `05-smoke-test.sh` | Test sau deploy | VPS |
| `README-DEPLOY-AUTOMATION.md` | File này | — |

---

## 🚀 Quy trình deploy 5 bước

### Bước 1: Upload bộ files lên VPS

```powershell
# Từ máy local Windows
scp -r C:\BOTHUOCLA\sol-widget\docs\wp-theme\huongdi-deploy root@103.72.57.11:/tmp/
```

### Bước 2: Chuẩn bị credentials (~5 phút)

SSH vào VPS:

```bash
ssh root@103.72.57.11
cd /tmp/huongdi-deploy
chmod +x *.sh
```

Sinh JWT secret + DB password:

```bash
# Sinh JWT secret (64 chars hex)
openssl rand -hex 64

# Sinh DB password
openssl rand -base64 32
```

→ Save 2 chuỗi này, sẽ dùng ở Bước 3.

### Bước 3: Chạy automation script

```bash
sudo bash 01-deploy-huongdi.sh
```

Script sẽ prompt anh:
- Database password (paste từ Bước 2)
- JWT secret (paste từ Bước 2)
- Admin seed password (đặt password mạnh)
- Zalo App ID + Secret (anh có sẵn từ bothuocla)
- Brevo SMTP user + pass (anh có sẵn)
- Anthropic API key (em recommend sub-org riêng)
- Repo URL hoặc local folder

Script tự động:
- ✅ Tạo PostgreSQL DB + user
- ✅ Upload/clone code
- ✅ Tạo `.env` đầy đủ
- ✅ npm ci + build
- ✅ prisma migrate + seed 37 directions
- ✅ PM2 start huongdi-api
- ✅ Smoke test local

### Bước 4: Setup Nginx + SSL

```bash
# Copy 2 vhost configs
sudo cp 02-nginx-huongdi.sol.vn.conf /etc/nginx/sites-available/huongdi.sol.vn
sudo cp 03-nginx-adminhuongdi.sol.vn.conf /etc/nginx/sites-available/adminhuongdi.sol.vn

# Enable
sudo ln -s /etc/nginx/sites-available/huongdi.sol.vn /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/adminhuongdi.sol.vn /etc/nginx/sites-enabled/

# Tạm thời dùng HTTP-only mode (xem comments trong file conf)
# Edit cả 2 file → comment phần listen 443 + ssl_certificate

sudo nginx -t && sudo systemctl reload nginx

# Lấy SSL Let's Encrypt
sudo certbot --nginx \
  -d huongdi.sol.vn \
  -d adminhuongdi.sol.vn \
  --email nguyendinhkhang@gmail.com \
  --agree-tos --no-eff-email

# Khôi phục config đầy đủ (uncomment SSL block)
sudo nano /etc/nginx/sites-available/huongdi.sol.vn
sudo nano /etc/nginx/sites-available/adminhuongdi.sol.vn

sudo nginx -t && sudo systemctl reload nginx
```

### Bước 5: Smoke test toàn bộ

```bash
sudo bash 05-smoke-test.sh
```

Script test:
- ✅ API health (`/api/health`)
- ✅ Directions count (= 37)
- ✅ Admin login với seed password
- ✅ Frontend HTML load
- ✅ Admin SPA load
- ✅ PM2 status
- ✅ SSL valid

---

## 📋 Sau khi xong

✅ `https://huongdi.sol.vn/p1.html` → P1 test 20 câu chạy
✅ `https://adminhuongdi.sol.vn/` → admin login OK
✅ `https://bothuocla.sol.vn/` vẫn chạy bình thường (không bị ảnh hưởng)

→ Sẵn sàng cho Giai đoạn B (tích hợp sol.vn).

---

## ⚠️ Troubleshooting

| Lỗi | Fix |
|---|---|
| `Port 4001 in use` | `sudo lsof -i :4001` → kill process cũ |
| `Cannot connect DB` | Check `sudo systemctl status postgresql` + verify password trong `.env` |
| `npm ci` fail | Check Node version `node -v` (cần ≥ 20) |
| Certbot fail | Verify DNS: `dig huongdi.sol.vn +short` ra IP đúng chưa |
| 502 Bad Gateway | `pm2 logs huongdi-api --err` xem lỗi |

---

## 🔄 Rollback nếu cần

```bash
# Stop PM2 process
pm2 delete huongdi-api
pm2 save

# Drop database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS huongdi_prod;"
sudo -u postgres psql -c "DROP USER IF EXISTS huongdi_user;"

# Remove nginx configs
sudo rm /etc/nginx/sites-enabled/huongdi.sol.vn
sudo rm /etc/nginx/sites-enabled/adminhuongdi.sol.vn
sudo nginx -t && sudo systemctl reload nginx

# Remove code
sudo rm -rf /var/www/huongdi
```

→ VPS trở về trạng thái trước khi deploy huongdi. bothuocla.sol.vn KHÔNG bị ảnh hưởng.
