# Move /thanh-toan/ về huongdi.sol.vn — Deploy Guide

**Kiến trúc mới:** Register-first → Pay-after (bỏ pay-first path)

## 📦 3 files

| File | Deploy đến | Vai trò |
|------|-----------|---------|
| `thanh-toan-index.html` | `huongdi.sol.vn:/var/www/huongdi/public/thanh-toan/index.html` | Trang thanh toán mới (auth-required) |
| `solvn-htaccess-redirect.txt` | `sol.vn:/public_html/thanh-toan/.htaccess` | 301 redirect sol.vn → huongdi.sol.vn |
| `deploy-thanh-toan-huongdi.sh` | Script deploy trên VPS | Auto deploy + verify |

## 🎯 Điểm khác biệt so với version cũ

| Aspect | Cũ (sol.vn) | Mới (huongdi.sol.vn) |
|--------|-------------|----------------------|
| Auth requirement | Optional | **Bắt buộc** — auth guard redirect |
| API call | Cross-origin (cần CORS) | Same-origin (relative `/api/leads`) |
| Pay-first shell user | Có | **Bỏ** — user phải register trước |
| localStorage JWT | Isolated (không đọc được từ sol.vn) | **Cùng domain** → đọc trực tiếp |
| Form UX | Full form 5 fields | **Compact form** — email/phone/name pre-fill readonly |

## 🚀 Deploy 3 bước

### Bước 1: Deploy file lên huongdi.sol.vn

```powershell
# PowerShell máy anh:
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\EMAIL-UNIFICATION\sub-C-huongdi\thanh-toan-index.html sol-vps:/tmp/
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\EMAIL-UNIFICATION\sub-C-huongdi\deploy-thanh-toan-huongdi.sh sol-vps:/tmp/
```

```bash
# SSH VPS:
bash /tmp/deploy-thanh-toan-huongdi.sh
```

Kết quả: `https://huongdi.sol.vn/thanh-toan/` live.

### Bước 2: 301 Redirect sol.vn → huongdi.sol.vn

Trong cPanel sol.vn:
- Vào `/public_html/thanh-toan/`
- Enable "Show Hidden Files (dotfiles)" trong Settings
- Edit `.htaccess` (nếu chưa có, tạo mới)
- Paste nội dung từ `solvn-htaccess-redirect.txt` vào **đầu file**
- Save

Test:
```bash
curl -I https://sol.vn/thanh-toan/
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://huongdi.sol.vn/thanh-toan/
```

### Bước 3: Update sol.vn CTA links (Progressive)

Sau khi redirect hoạt động, mọi link cũ `sol.vn/thanh-toan/` tự động redirect. Nhưng nên update trực tiếp để avoid extra hop:

**A. Menu header sol.vn:**
- File: `wp-content/mu-plugins/sol-default-template.php`
- Search: `/thanh-toan/`
- Replace: `https://huongdi.sol.vn/thanh-toan/`

**B. Homepage V3 pricing:**
- WP Admin → Trang chủ → Edit
- Update các button/link "Nâng cấp Active" → `https://huongdi.sol.vn/thanh-toan/`

**C. Blog posts (nếu có link cứng):**
- Dùng plugin **Better Search Replace** (WP Admin)
- Search: `href="/thanh-toan/"` → Replace: `href="https://huongdi.sol.vn/thanh-toan/"`
- Search: `href="https://sol.vn/thanh-toan/"` → Replace: `href="https://huongdi.sol.vn/thanh-toan/"`

## 🧪 Test flow — 3 case

### Case 1: Anonymous truy cập

```
Mở https://huongdi.sol.vn/thanh-toan/ (incognito)
  ↓ Auth guard fire
Redirect → /dang-nhap/?next=/thanh-toan/&reason=payment_required
```

Expected: URL cuối là `/dang-nhap/` với query params.

### Case 2: Logged-in user

```
Login trước với nguyendinhkhang@gmail.com (đã có password)
  ↓
Mở /thanh-toan/
  ↓
Banner xanh: "✅ Bạn đang đăng nhập với nguyendinhkhang@gmail.com (ACTIVE)"
Form pre-fill: email + phone + name (readonly, gray bg)
Chỉ điền: zalo (optional) + chọn gói + submit
  ↓
POST /api/leads với JWT header
  ↓
Response success → hiện VietQR
```

### Case 3: Sol.vn redirect

```
Mở https://sol.vn/thanh-toan/
  ↓
301 redirect từ .htaccess
  ↓
Landing → https://huongdi.sol.vn/thanh-toan/
  ↓
Auth guard → redirect /dang-nhap/ nếu chưa login
```

## ⚠ Rollback plan

Nếu có issue:

**Rollback trên huongdi.sol.vn:**
```bash
ssh sol-vps
cd /var/www/huongdi/public/thanh-toan/
sudo cp index.html.bak-XXXXX index.html  # dùng file .bak-timestamp tự tạo lúc deploy
```

**Rollback trên sol.vn:**
- Xoá dòng `RewriteRule` trong `/public_html/thanh-toan/.htaccess`

## 📊 Sau deploy

- [x] `sol.vn/thanh-toan/` → 301 → `huongdi.sol.vn/thanh-toan/`
- [x] `huongdi.sol.vn/thanh-toan/` auth guard active
- [x] Logged-in user: pre-fill form
- [x] Same-origin API — no CORS
- [x] No pay-first shell user (register-first enforced)

## 🎯 Cleanup sau khi confirm work OK

Có thể XÓA folder `sol.vn/public_html/thanh-toan/` hoàn toàn (giữ `.htaccess` redirect ở root sol.vn:

Trong `/public_html/.htaccess`:
```
RewriteRule ^thanh-toan/?(.*)$ https://huongdi.sol.vn/thanh-toan/ [R=301,L]
```

Sau đó xoá `/public_html/thanh-toan/` folder → cleaner.

Nhưng nên **giữ vài tuần** để đảm bảo mọi thứ stable trước khi xoá.
