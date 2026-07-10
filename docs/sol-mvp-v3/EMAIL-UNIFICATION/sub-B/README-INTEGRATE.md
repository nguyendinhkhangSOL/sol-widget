# Sub-B Backend Refactor — Integration Guide

**5 file TypeScript ready-to-integrate** vào backend `/var/www/huongdi/backend/src/`

## 📦 Files

| File | Đích trên backend | Vai trò |
|------|-------------------|---------|
| `auth-register-refactored.ts` | `src/auth/routes.ts` (function `handleRegister`) | Đăng ký + link orphan lead |
| `payment-create-order-refactored.ts` | `src/payments/routes.ts` (function `handleCreateOrder`) | Tạo order + shell user |
| `webhook-payment-confirmed-refactored.ts` | `src/payments/routes.ts` (function `handleWebhook`) | Auto upgrade tier + send email |
| `activate-endpoint-new.ts` | `src/auth/routes.ts` (functions `handleActivate` + `handleVerifyActivationToken`) | Magic link activation |
| `check-email-endpoint.ts` | `src/auth/routes.ts` (function `handleCheckEmail`) | Check email exists |

---

## 🔧 Steps integrate (theo thứ tự)

### Step 1: Sync backend về local (nếu chưa)

```powershell
cd C:\BOTHUOCLA\
scp -r sol-vps:/var/www/huongdi/backend/src ./huongdi-backend-latest/src
scp -r sol-vps:/var/www/huongdi/backend/prisma ./huongdi-backend-latest/prisma
scp sol-vps:/var/www/huongdi/backend/package.json ./huongdi-backend-latest/
```

### Step 2: Compare + Merge từng file

Mở file cũ + file mới bên cạnh nhau (VD dùng VS Code compare):
- `huongdi-backend-latest/src/auth/routes.ts` (cũ)
- `sol-mvp-v3/EMAIL-UNIFICATION/sub-B/auth-register-refactored.ts` (mới)

**Approach:** Replace body của function `handleRegister` với logic mới. Giữ nguyên imports, middleware, error handling patterns của codebase hiện tại.

### Step 3: Add relations vào Prisma schema

Nếu chưa có (Sub-Phase A đã add column source/status), thêm relation vào User + Lead:

```prisma
model User {
  // ... existing fields ...

  // From Sub-A migration
  source              String?     @default("unknown")
  status              String?     @default("active")
  sourceLeadId        Int?        @map("source_lead_id")
  sourceLead          Lead?       @relation("UserSourceLead", fields: [sourceLeadId], references: [id])

  // Existing
  activeLeadId        Int?        @unique @map("active_lead_id")
  activeLead          Lead?       @relation("UserActiveLead", fields: [activeLeadId], references: [id])
}

model Lead {
  // ... existing fields ...
  magicTokenExpiresAt DateTime?   @map("magic_token_expires_at")

  // Relations both ways (nếu cần)
  usersAsActive       User[]      @relation("UserActiveLead")
  usersAsSource       User[]      @relation("UserSourceLead")
}
```

Chạy: `npx prisma generate` để regenerate client.

### Step 4: Wire endpoints trong router

`src/auth/routes.ts`:
```typescript
import { handleRegister, handleActivate, handleVerifyActivationToken, handleCheckEmail } from './handlers';

router.post('/register', handleRegister);
router.post('/activate', handleActivate);
router.get('/activate/verify/:token', handleVerifyActivationToken);
router.get('/check-email', handleCheckEmail);
```

`src/payments/routes.ts`:
```typescript
import { handleCreateOrder, handlePaymentWebhook } from './handlers';

router.post('/create-order', requireAuthOptional, handleCreateOrder);  // Optional auth (allow anonymous)
router.post('/webhook', handlePaymentWebhook);
```

### Step 5: Build + Test locally

```bash
cd huongdi-backend-latest
npm run build
npm run test  # Nếu có test suite
```

### Step 6: Deploy lên VPS

```bash
# Từ local
scp -r huongdi-backend-latest/src sol-vps:/var/www/huongdi/backend/
scp huongdi-backend-latest/prisma/schema.prisma sol-vps:/var/www/huongdi/backend/prisma/

# SSH VPS
ssh sol-vps
cd /var/www/huongdi/backend
sudo npm run build
sudo npx prisma migrate deploy  # Chỉ nếu có schema changes
pm2 restart huongdi-api
pm2 logs huongdi-api --lines 30  # Verify không có error
```

### Step 7: E2E test 4 paths (Sub-D)

Xem file `sub-D-e2e-test-plan.md` (session sau).

---

## ⚠ Common pitfalls

**1. Prisma client outdated:**
```
Error: Property 'source' does not exist on type 'User'
```
→ Chạy `npx prisma generate` sau khi update schema.

**2. Migration order:**
Sub-A schema đã apply (columns added). Nếu deploy Sub-B trước khi migration → runtime error.
→ Verify columns tồn tại: `\d users` trong psql.

**3. Bcrypt version mismatch:**
File dùng `bcryptjs`. Nếu codebase hiện tại dùng `bcrypt` (native) → adjust imports.

**4. JWT function:**
Assume có `generateJwt(user)` function. Nếu không → adapt to codebase.

**5. Email sender:**
Assume có `sendEmail({ to, subject, template, data })` function. Cần add 2 template:
- `ACTIVATION_MAGIC_LINK` — HTML template cho activation email
- `UPGRADE_SUCCESS` — HTML template cho upgrade confirm

Templates location typically: `src/email/templates/` — em ship sau.

---

## ✅ Verification checklist sau deploy

- [ ] `curl -X POST https://huongdi.sol.vn/api/auth/register` với email mới → status 201, user tier=FREE
- [ ] `curl -X POST https://huongdi.sol.vn/api/auth/register` với email đã có orphan lead PAID → user tier=ACTIVE
- [ ] `curl -X POST https://huongdi.sol.vn/api/payment/create-order` với email mới → tạo shell user + lead + magic_token
- [ ] `curl -X POST https://huongdi.sol.vn/api/payment/create-order` với email đã có account (chưa login) → 409 ACCOUNT_EXISTS
- [ ] Webhook simulation → user tier upgrade + email gửi
- [ ] `/api/auth/activate` với valid token → set password + JWT
- [ ] `/api/auth/check-email?email=x` → return exists true/false

---

## 🎯 Sau khi Sub-B deploy xong → next phase

**Sub-C: Frontend refactor**
- `/thanh-toan/` smart page với email exists check
- `/kich-hoat/` set password page

**Sub-D: Cleanup + E2E test**
- Migrate 2 orphan leads (create shell user + gửi magic link retroactive)
- Test 4 UX paths thực tế

**CTA Updates (task #160):**
- Update homepage huongdi.sol.vn hero CTA
- Update paywall lock buttons
- Ship helper `sol-cta.js` global renderer
