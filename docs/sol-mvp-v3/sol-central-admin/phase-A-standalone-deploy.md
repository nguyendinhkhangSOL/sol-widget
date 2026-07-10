# Phase A — Deploy Leads Page Standalone (30 phút)

**Mục tiêu:** Deploy trang Leads hoạt động ngay tại `adminhuongdi.sol.vn/leads.html`, không cần biết framework SPA.

## Chuẩn bị

- File cần deploy: `sol-widget/docs/sol-mvp-v3/user-management-v1/admin-spa/leads-page.html`
- Backend API đã deploy xong (theo `SSH-DEPLOY-STEPS.md`)
- Biết key auth token của SPA (bước 1 dưới)

## STEP 1 — Xác định key auth token của SPA hiện có

Anh mở https://adminhuongdi.sol.vn/login → đăng nhập → F12:

- **Application tab** → Storage → **Local Storage** → `https://adminhuongdi.sol.vn`
- Xem có key nào chứa JWT không, ví dụ:
  - `token` — pure JWT
  - `admin_token`
  - `authToken`
  - `access_token`
  - `sol_admin_token`

Copy tên key đó cho em (không cần copy giá trị).

Nếu không có gì trong Local Storage → check **Cookies** (session-based).

## STEP 2 — Chỉnh sửa leads-page.html cho khớp auth SPA

Mở file `leads-page.html`, tìm dòng:

```javascript
const TOKEN = localStorage.getItem('admin_token') || '';
```

Đổi `'admin_token'` thành key thật của SPA (từ STEP 1). Ví dụ:

```javascript
const TOKEN = localStorage.getItem('token') || '';  // Nếu SPA lưu key 'token'
```

Nếu SPA dùng cookie session (không có localStorage), thay bằng:

```javascript
async function apiCall(url, method = 'GET', body = null) {
  const opts = {
    method,
    credentials: 'include',   // ← Thêm dòng này để gửi cookie
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + url, opts);
  return r.json();
}
```

## STEP 3 — Upload lên VPS

SSH vào VPS:

```bash
# Location của public files SPA (điều chỉnh nếu khác):
ls /var/www/adminhuongdi/public/  # HOẶC /var/www/adminhuongdi/dist/
                                  # HOẶC /var/www/adminhuongdi/build/

# Từ máy local scp lên:
# scp leads-page.html root@your-vps:/var/www/adminhuongdi/public/leads.html
```

Từ máy local Windows:

```powershell
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\user-management-v1\admin-spa\leads-page.html root@your-vps-ip:/var/www/adminhuongdi/public/leads.html
```

## STEP 4 — Test truy cập

Mở https://adminhuongdi.sol.vn/leads.html trong browser.

**Nếu 404**: Nginx của adminhuongdi có thể có SPA fallback rule (mọi request → index.html). Cần thêm exception:

```nginx
# Trong /etc/nginx/sites-available/adminhuongdi.sol.vn
server {
  # ... existing config ...

  # Serve leads.html trực tiếp (không route qua SPA)
  location = /leads.html {
    root /var/www/adminhuongdi/public;
    try_files /leads.html =404;
  }

  # SPA fallback vẫn giữ nguyên bên dưới
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Reload nginx:
```bash
nginx -t && systemctl reload nginx
```

## STEP 5 — Thêm menu link "💰 Leads" vào SPA hiện có

Đây là hack đơn giản: dùng browser bookmark hoặc thêm link vào SPA.

**Cách nhanh nhất — bookmark:**
- Bookmark https://adminhuongdi.sol.vn/leads.html trên trình duyệt của Khang

**Cách proper — thêm menu:**

Nếu SPA có file component `Sidebar.jsx` / `Sidebar.vue` / `sidebar.js`, tìm chỗ render menu → thêm 1 item:

```
<a href="/leads.html">💰 Leads</a>
```

(Không dùng `<Link>` React Router hay `<router-link>` — vì `/leads.html` không phải route SPA)

## STEP 6 — Test end-to-end

1. Đăng nhập vào SPA cũ tại `/login`
2. Mở tab mới → truy cập `/leads.html`
3. Trang Leads load được, thấy list leads (nếu chưa có, cần tạo test lead qua STEP 11 của SSH-DEPLOY-STEPS)
4. Filter status, search, approve/reject hoạt động
5. Click "📱 Gửi Zalo" → modal Zalo helper hiện ra

## ⚠️ Nếu API 401 Unauthorized

Nghĩa là key auth em đặt sai (STEP 2). Recheck localStorage key hoặc thử cookie mode.

Xem console F12 → sẽ hiện lỗi 401 từ endpoint `/api/admin/leads`. Fix key auth → reload.

## ✅ Success criteria

- [ ] `/leads.html` load OK, không lỗi 404
- [ ] Auth OK, không lỗi 401
- [ ] Hiện list lead + summary stats
- [ ] Filter status dropdown hoạt động
- [ ] Click Approve → generate magic link OK
- [ ] Modal "📱 Gửi Zalo" hiện tin nhắn mẫu + button mở Zalo Web

## Chuyển sang Phase B

Sau khi Phase A hoạt động, em sẽ integrate proper vào SPA:
- Xem SPA structure (anh gửi output 3 lệnh check ở tin nhắn trước)
- Convert leads.html → component/module theo pattern SPA
- Xoá standalone leads.html
- Trang leads trở thành route trong SPA: `/leads` (không có .html)
