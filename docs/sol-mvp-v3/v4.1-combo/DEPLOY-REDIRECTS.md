# Sol V4.1 — Deploy 301 Redirects (Nginx)

## 🛡️ Bước 0 — Backup Nginx config

**SSH VPS:**
```bash
ssh sol-vps
```

**Backup file config:**
```bash
sudo cp /etc/nginx/sites-available/huongdi /etc/nginx/sites-available/huongdi.bak-$(date +%Y%m%d-%H%M)
sudo ls /etc/nginx/sites-available/huongdi.bak-*
```

---

## 🔍 Bước 1 — Xem config hiện tại

```bash
sudo cat /etc/nginx/sites-available/huongdi
```

Tìm khối `server { ... }` cho huongdi.sol.vn. Cần tìm vị trí `location /` để chèn redirects TRƯỚC nó.

**Ví dụ cấu trúc điển hình:**
```nginx
server {
    listen 443 ssl http2;
    server_name huongdi.sol.vn;

    ssl_certificate ...;
    ssl_certificate_key ...;

    root /var/www/huongdi/public;
    index index.html;

    # ← REDIRECTS PHẢI CHÈN Ở ĐÂY (trước location /)

    location / {
        try_files $uri $uri/ =404;
    }

    # ... các location khác
}
```

---

## ✏️ Bước 2 — Edit config

```bash
sudo nano /etc/nginx/sites-available/huongdi
```

Tìm đến TRƯỚC `location / { try_files ... }` và paste khối redirects sau:

```nginx
# ─── Sol V4.1 — 301 Redirects (5 Bước Việt hoá) ───
location = /kham-pha-ban-than       { return 301 /thau-hieu/; }
location = /kham-pha-ban-than/      { return 301 /thau-hieu/; }
location = /kiem-ke-nguon-luc       { return 301 /khai-pha/; }
location = /kiem-ke-nguon-luc/      { return 301 /khai-pha/; }
location = /la-ban-huong-di         { return 301 /chon-huong/; }
location = /la-ban-huong-di/        { return 301 /chon-huong/; }

# ─── P1/P2/P3 short URLs ───
location = /p1                      { return 301 /thau-hieu/; }
location = /p1/                     { return 301 /thau-hieu/; }
location = /p2                      { return 301 /khai-pha/; }
location = /p2/                     { return 301 /khai-pha/; }
location = /p3                      { return 301 /chon-huong/; }
location = /p3/                     { return 301 /chon-huong/; }

# ─── Pricing aliases ───
location = /active                  { return 301 /pricing/; }
location = /active/                 { return 301 /pricing/; }
location = /premium                 { return 301 /pricing/; }
location = /premium/                { return 301 /pricing/; }
location = /gia                     { return 301 /pricing/; }
location = /gia/                    { return 301 /pricing/; }

# ─── Sub-paths (nested URL) ───
location ~ ^/kham-pha-ban-than/(.*)$ { return 301 /thau-hieu/$1; }
location ~ ^/kiem-ke-nguon-luc/(.*)$ { return 301 /khai-pha/$1; }
location ~ ^/la-ban-huong-di/(.*)$   { return 301 /chon-huong/$1; }
```

**Lưu file:** `Ctrl+O` → Enter → `Ctrl+X`

---

## 🧪 Bước 3 — Test config (KHÔNG reload nếu lỗi!)

```bash
sudo nginx -t
```

**Kết quả kỳ vọng:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Nếu lỗi:** rollback ngay:
```bash
sudo cp /etc/nginx/sites-available/huongdi.bak-<TIMESTAMP> /etc/nginx/sites-available/huongdi
sudo nginx -t
```

---

## 🚀 Bước 4 — Reload Nginx (apply)

```bash
sudo systemctl reload nginx
```

Không có output = OK. Nếu có error → rollback.

---

## ✅ Bước 5 — Test 301 redirects

Trên VPS chạy curl để xem HTTP status:

```bash
# Test 6 URL cũ
for url in kham-pha-ban-than kiem-ke-nguon-luc la-ban-huong-di p1 p2 p3; do
  echo "─── /$url/ ───"
  curl -sI "https://huongdi.sol.vn/$url/" | grep -E "^(HTTP|Location|location)"
  echo ""
done
```

**Kết quả kỳ vọng:**
```
─── /kham-pha-ban-than/ ───
HTTP/2 301
location: /thau-hieu/

─── /kiem-ke-nguon-luc/ ───
HTTP/2 301
location: /khai-pha/

─── /la-ban-huong-di/ ───
HTTP/2 301
location: /chon-huong/

─── /p1/ ───
HTTP/2 301
location: /thau-hieu/

─── /p2/ ───
HTTP/2 301
location: /khai-pha/

─── /p3/ ───
HTTP/2 301
location: /chon-huong/
```

**Test pricing aliases:**
```bash
for url in active premium gia; do
  curl -sI "https://huongdi.sol.vn/$url/" | grep -E "^(HTTP|Location|location)"
done
```

Tất cả phải return `HTTP/2 301` + `location: /pricing/`

---

## 🌐 Bước 6 — Test browser (Incognito)

Mở các URL cũ trong Incognito:
- https://huongdi.sol.vn/kham-pha-ban-than/ → phải chuyển đến `/thau-hieu/`
- https://huongdi.sol.vn/p1/ → phải chuyển đến `/thau-hieu/`
- https://huongdi.sol.vn/active/ → phải chuyển đến `/pricing/`

URL trên address bar sau redirect PHẢI là URL mới (không phải cũ).

---

## 📊 Bước 7 — Submit sitemap update lên Google

Sau khi redirect chạy ổn 24h, submit sitemap mới:

1. **Google Search Console** → huongdi.sol.vn property
2. Menu **Sitemaps** → submit `https://huongdi.sol.vn/sitemap.xml`
3. Google sẽ update index trong 7-30 ngày

**Old URLs sẽ giữ trong GSC ~90 ngày sau đó auto-drop** — bình thường.

---

## 🛡️ Rollback nếu lỗi

```bash
sudo ls /etc/nginx/sites-available/huongdi.bak-*
sudo cp /etc/nginx/sites-available/huongdi.bak-<TIMESTAMP> /etc/nginx/sites-available/huongdi
sudo nginx -t && sudo systemctl reload nginx
echo "✅ ROLLED BACK"
```

---

## 📋 Checklist cuối

- [ ] Backup config OK
- [ ] Nginx test OK (`nginx -t`)
- [ ] Reload Nginx OK
- [ ] 6 URL cũ trả về 301
- [ ] Browser test chuyển đúng URL mới
- [ ] Sitemap submit GSC (làm sau 24h)

---

## 💡 Bonus — Redirects cho sol.vn (WordPress)

Nếu anh muốn redirect trên sol.vn nữa (tuy WP có mu-plugin `sol-redirects.php` từ trước), check file:

```bash
# SSH vào share hosting (nếu có), hoặc cPanel File Manager
# Path: /public_html/wp-content/mu-plugins/sol-redirects.php
```

Nếu chưa có, hoặc cần thêm redirect mới, mình có thể viết PHP snippet.
