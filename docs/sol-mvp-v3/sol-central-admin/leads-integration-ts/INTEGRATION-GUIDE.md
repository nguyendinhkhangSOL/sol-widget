# Sol User Management V1 — Integration Guide (TypeScript + Prisma + React)

Stack đã xác định:
- **Backend:** TypeScript + Prisma + Express + PostgreSQL 16 (port 4001)
- **Admin SPA:** React 18 + TS + Vite + React Router 6 + Zustand + Axios
- **Auth:** JWT trong `localStorage.getItem('admin_token')`

## 📦 Files có sẵn (copy vào VPS đúng path)

```
leads-integration-ts/
├── prisma-schema-additions.prisma    → APPEND vào backend/prisma/schema.prisma
├── backend/
│   ├── routes/
│   │   ├── leads.ts                  → backend/src/routes/leads.ts (public API)
│   │   └── admin-leads-block.ts      → APPEND vào backend/src/routes/admin.ts
│   └── services/
│       └── notification.ts           → backend/src/services/notification.ts
├── admin/src/
│   ├── pages/
│   │   └── LeadsPage.tsx             → admin/src/pages/LeadsPage.tsx
│   └── utils/
│       └── api-additions.ts          → APPEND vào admin/src/utils/api.ts
└── INTEGRATION-GUIDE.md              → file này
```

## 🚀 Deploy sequence

### STEP 1 — Backend: Add Prisma models

```bash
ssh solop@sol-vps-01
cd /var/www/huongdi/backend

# 1. Backup schema hiện tại
cp prisma/schema.prisma prisma/schema.prisma.bak

# 2. Paste content của prisma-schema-additions.prisma vào cuối prisma/schema.prisma
nano prisma/schema.prisma
# → Ctrl+End để xuống cuối file → paste → Ctrl+O save → Ctrl+X exit

# 3. Generate + migrate
npx prisma migrate dev --name add_leads_management
# → nhập tên: add_leads_management → Enter
# Nếu prod DB: dùng: npx prisma migrate deploy

# 4. Verify
npx prisma studio    # (optional, GUI xem tables mới)
```

### STEP 2 — Backend: Install nodemailer

```bash
cd /var/www/huongdi/backend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### STEP 3 — Backend: Update .env

```bash
# Thêm vào /var/www/huongdi/backend/.env
cat >> .env << 'ENVEOF'

# Sol User Management V1
ADMIN_EMAIL=nguyendinhkhang@gmail.com
ADMIN_ZALO=0912727381
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nguyendinhkhang@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM="Sol Payment Bot <hello@sol.vn>"
ENVEOF
```

⚠️ Nhớ đổi `SMTP_PASS` bằng 16-char Gmail App Password thật.

### STEP 4 — Backend: Copy files

Upload từ máy local:

```powershell
# Windows PowerShell
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\sol-central-admin\leads-integration-ts\backend\routes\leads.ts solop@sol-vps-01:/var/www/huongdi/backend/src/routes/
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\sol-central-admin\leads-integration-ts\backend\services\notification.ts solop@sol-vps-01:/var/www/huongdi/backend/src/services/
```

### STEP 5 — Backend: Update admin.ts + server.ts

```bash
cd /var/www/huongdi/backend/src

# Backup
cp routes/admin.ts routes/admin.ts.bak

# Xem content admin.ts hiện tại
tail -30 routes/admin.ts
```

**A. Update `routes/admin.ts`:**

Ở đầu file, thêm imports:

```typescript
import crypto from 'crypto';
import { sendMagicLinkToUser, makeZaloDeepLink, makeZaloMessage } from '../services/notification';
```

Copy toàn bộ nội dung file `admin-leads-block.ts` (5 endpoints) → paste vào **CUỐI** file `admin.ts`, TRƯỚC `export default router;`.

**B. Update `server.ts` hoặc `app.ts`** (entry point) để mount `/api/leads`:

Tìm chỗ `app.use('/api/admin', adminRouter);` hoặc similar → thêm:

```typescript
import leadsRouter from './routes/leads';
app.use('/api/leads', leadsRouter);          // POST public + GET activate
```

Nếu muốn tách `activate` khỏi `leads`:

```typescript
app.use('/api/leads',    leadsRouter);
app.use('/api/activate', leadsRouter);       // reuse same router — vì có GET /activate defined
```

### STEP 6 — Backend: Build + PM2 restart

```bash
cd /var/www/huongdi/backend
npm run build          # tsc compile → dist/
pm2 restart huongdi-api
pm2 logs huongdi-api --lines 30
```

Kiểm tra không có compile error hay runtime error.

### STEP 7 — Admin SPA: Add API functions

```bash
cd /var/www/huongdi/admin/src/utils
```

Copy content của `api-additions.ts` → paste vào cuối `api.ts`.

### STEP 8 — Admin SPA: Add LeadsPage

```bash
# Copy LeadsPage.tsx
scp .../LeadsPage.tsx solop@sol-vps-01:/var/www/huongdi/admin/src/pages/
```

### STEP 9 — Admin SPA: Update App.tsx

Sửa `/var/www/huongdi/admin/src/App.tsx`:

```typescript
import LeadsPage from './pages/LeadsPage';   // ← thêm import

// Trong <Routes>, thêm route:
<Route path="leads" element={<LeadsPage />} />
```

### STEP 10 — Admin SPA: Update Layout.tsx menu

Sửa `/var/www/huongdi/admin/src/components/Layout.tsx`:

Tìm chỗ render menu sidebar (thường có link Dashboard, Directions, Users) → thêm 1 item:

```tsx
<NavLink to="/leads">💰 Leads</NavLink>
```

Menu order gợi ý:
```
📊 Dashboard
💰 Leads         ← MỚI (đặt ưu tiên cao)
🗺️  Directions
👤 Users
```

### STEP 11 — Admin SPA: Build

```bash
cd /var/www/huongdi/admin
npm run build         # tsc + vite build → dist/
```

Nginx serve `/var/www/huongdi/admin/dist` → refresh browser → menu Leads xuất hiện.

### STEP 12 — Update frontend thanh-toan.html POST tới API

Trong `sol.vn/thanh-toan/` form JS, đổi endpoint POST → `https://huongdi.sol.vn/api/leads`.

Xem chi tiết: `user-management-v1/frontend/thanh-toan-integration.md`.

### STEP 13 — Deploy trang kích hoạt

```bash
# sol.vn WP hoặc static
# Copy kich-hoat.html vào /var/www/sol.vn/kich-hoat/index.html
# Hoặc tạo WP Page /kich-hoat/ paste HTML
```

### STEP 14 — Test end-to-end

```bash
# 1. Test POST public
curl -X POST https://huongdi.sol.vn/api/leads \
  -H "Content-Type: application/json" \
  -d '{"ten":"Test","sdt":"0912345678","email":"test@sol.vn","goi":"active"}'

# 2. Check DB
psql -U ... -d huongdi_prod -c "SELECT * FROM leads;"
# hoặc npx prisma studio → xem table leads

# 3. Check email Khang inbox

# 4. Vào adminhuongdi.sol.vn/leads → thấy lead test
# 5. Click Approve → modal Zalo hiện ra
# 6. Copy link kích hoạt → mở incognito → verify auto activate + localStorage set
```

## ✅ Success checklist

- [ ] `npx prisma migrate deploy` chạy thành công, table `leads` + `lead_notifications` tồn tại
- [ ] `curl POST /api/leads` return `{success: true, lead_id: N}`
- [ ] Khang nhận email trong 30s
- [ ] Vào https://adminhuongdi.sol.vn/leads thấy sidebar menu Leads
- [ ] Table hiển thị lead vừa tạo với badge "Chờ CK"
- [ ] Click "✅ Approve" → modal ghi chú → confirm → hiện modal Zalo với tin nhắn mẫu
- [ ] Click "📋 Copy tin nhắn" → clipboard có text
- [ ] Click "💬 Mở Zalo chat" → tab mới zalo.me/SDT
- [ ] Mở magic_link → sol.vn/kich-hoat/?token=... → "🎉 Chào [Tên]"
- [ ] localStorage của huongdi.sol.vn có `sol_tier = active`

## 🛠️ Troubleshooting

**Prisma migrate lỗi:** Kiểm tra `DATABASE_URL` trong `.env`. Có thể cần `npx prisma db push` nếu prod không migrate.

**TypeScript compile error:** Kiểm tra import path. Nodemailer types cần install: `npm install -D @types/nodemailer`.

**API 401 trên admin panel:** Auth token key phải là `admin_token` (đã match code hiện tại).

**Route /leads 404 trong admin SPA:** React Router cần rebuild. Chạy `npm run build` xong reload trình duyệt hard (Ctrl+Shift+R).

**Email không gửi được:** Verify Gmail App Password (không phải password thường). Port 587 với `secure=false` (TLS).
