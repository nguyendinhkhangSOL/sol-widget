# Sub-B FINAL — Deploy Guide (Matches Real Codebase)

**Đã đọc code thực tế và refactor 2 files chính xác theo pattern.**

## 📦 2 files ship

| File | Đè lên | Vai trò |
|------|--------|---------|
| `user-auth-refactored.ts` | `src/routes/user-auth.ts` | Register auto-link orphan lead + endpoint check-email |
| `leads-refactored.ts` | `src/routes/leads.ts` | POST /leads auto-create shell user + NEW endpoint `/activate/set-password` |

## ✅ Verified alignment với codebase hiện tại

- ✅ Uses `bcryptjs` (matches package.json)
- ✅ JWT: `jwt.sign({ userId, tier, role }, ...)` (matches existing pattern)
- ✅ `import { PrismaClient } from '@prisma/client'` (matches)
- ✅ Response format: `{ success, message, ... }` (matches)
- ✅ Router pattern (Express Router)
- ✅ BCRYPT_ROUNDS = 12 (matches)
- ✅ Uses `optionalAuth` middleware (từ `src/middleware/optional-auth`)
- ✅ Uses `requireAuth` middleware (từ `src/middleware/auth`)

## 🚀 Deploy 4 bước

### 1. Backup files hiện tại

```bash
ssh sol-vps
cd /var/www/huongdi/backend/src/routes
sudo cp user-auth.ts user-auth.ts.bak-$(date +%s)
sudo cp leads.ts leads.ts.bak-$(date +%s)
```

### 2. Upload 2 files mới

```powershell
# Máy anh:
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\EMAIL-UNIFICATION\sub-B-FINAL\user-auth-refactored.ts sol-vps:/tmp/
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\EMAIL-UNIFICATION\sub-B-FINAL\leads-refactored.ts sol-vps:/tmp/
```

### 3. Copy đè lên backend + Build

```bash
# SSH VPS:
sudo cp /tmp/user-auth-refactored.ts /var/www/huongdi/backend/src/routes/user-auth.ts
sudo cp /tmp/leads-refactored.ts /var/www/huongdi/backend/src/routes/leads.ts

cd /var/www/huongdi/backend
sudo npm run build 2>&1 | tail -20
```

Nếu build error → check output, fix typos hoặc rollback (rename `.bak-XXX` về `.ts`).

### 4. PM2 restart + verify

```bash
pm2 restart huongdi-api --update-env
sleep 3
pm2 logs huongdi-api --lines 30 --nostream
```

Không có `Error` hoặc `TypeError` → OK.

## 🧪 Test endpoints ngay

### Test 1: Check email exists

```bash
curl "https://huongdi.sol.vn/api/user/check-email?email=nguyendinhkhang@gmail.com"
# Expected: {"success":true,"exists":true,"hasPassword":true,"tier":"ACTIVE",...}

curl "https://huongdi.sol.vn/api/user/check-email?email=random@email.com"
# Expected: {"success":true,"exists":false}
```

### Test 2: Register với email mới hoàn toàn

```bash
curl -X POST https://huongdi.sol.vn/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test-new-user@sol.vn","password":"test123456","displayName":"Test User"}'
# Expected: success=true, user.tier=FREE, autoActivated=false
```

### Test 3: Register với email đã pay (nguyendinhkhang1 hoặc nguyendinhkhangn — 2 orphan leads)

```bash
curl -X POST https://huongdi.sol.vn/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nguyendinhkhang1@gmail.com","password":"test123456","displayName":"DinhKhang 1"}'
# Expected: success=true, user.tier=ACTIVE (auto-upgraded!), autoActivated=true
```

### Test 4: POST /leads với email đã có account (chưa login)

```bash
curl -X POST https://huongdi.sol.vn/api/leads \
  -H "Content-Type: application/json" \
  -d '{"ten":"Test","sdt":"0912727388","email":"nguyendinhkhang@gmail.com","goi":"active"}'
# Expected: 409, errorCode=ACCOUNT_EXISTS, redirect=/dang-nhap/
```

### Test 5: POST /leads với email mới → tạo shell user

```bash
curl -X POST https://huongdi.sol.vn/api/leads \
  -H "Content-Type: application/json" \
  -d '{"ten":"Fresh User","sdt":"0900000123","email":"fresh-test@sol.vn","goi":"active"}'
# Expected: success=true, user_id=xxx, is_new_shell_user=true, message có "gửi email/Zalo link kích hoạt"
```

Verify DB:
```sql
SELECT u.email, u.password_hash IS NOT NULL AS has_pw, l.id AS lead_id, l.user_id
FROM users u JOIN leads l ON l.user_id = u.id
WHERE u.email = 'fresh-test@sol.vn';
-- Expected: has_pw=false, l.user_id NOT NULL
```

### Test 6: Set password cho shell user (giả lập magic link flow)

Get magic_token cho lead vừa tạo:
```sql
SELECT id, magic_token FROM leads WHERE email='fresh-test@sol.vn';
-- Nếu magic_token NULL (chưa có), admin phải gen. Test flow:
UPDATE leads SET magic_token = md5(random()::text || id::text), magic_sent_at = NOW()
WHERE email='fresh-test@sol.vn';
SELECT magic_token FROM leads WHERE email='fresh-test@sol.vn';
```

Rồi:
```bash
TOKEN="<paste token from query>"
curl -X POST https://huongdi.sol.vn/api/activate/set-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"password\":\"newpass123\"}"
# Expected: success=true, token=<JWT>, user.tier=ACTIVE
```

## 🔄 Rollback nếu có bug

```bash
cd /var/www/huongdi/backend/src/routes
sudo cp user-auth.ts.bak-XXXX user-auth.ts  # dùng file backup gần nhất
sudo cp leads.ts.bak-XXXX leads.ts
cd ..
sudo npm run build
pm2 restart huongdi-api
```

## ✨ Improvements so với code cũ

### user-auth.ts

**Trước:**
- INSERT user tier=FREE luôn
- Nếu email trùng → 409 reject (dù shell user)

**Sau:**
- ⭐ Check shell user (email/phone đã có, password NULL) → UPDATE + upgrade tier nếu có lead ACTIVATED
- ⭐ Check orphan lead (chưa link user_id) → link + upgrade tier
- Return `autoActivated` flag → frontend show welcome message khác nhau
- Added endpoint `/api/user/check-email` cho frontend debounce

### leads.ts

**Trước:**
- INSERT lead không có `userId` → 100% orphan
- GET /activate: upsert user nhưng KHÔNG set password → user shell không dùng được

**Sau:**
- ⭐ POST /leads: 4 cases handle rõ (logged in / conflict / shell / new)
- ⭐ Always SET `lead.userId` — no more orphan
- ⭐ Auto-create shell user cho pay-first flow
- ⭐ GET /activate: sync active_lead_id + return `password_required` flag
- ⭐ NEW /activate/set-password: shell user set password + auto login (return JWT)

## 📊 Data guarantee sau deploy

- **User đăng ký mới:** Auto-upgrade tier nếu email đã pay trước
- **User /leads mới:** LUÔN có `userId` (no more orphan)
- **Magic link:** Set password + login trong 1 lần click
- **Duplicate email:** 409 nếu đã có password, reuse nếu shell

## 🎯 Sau khi deploy Sub-B — Next step

**Sub-C: Frontend `/thanh-toan/` refactor** — Detect login state:
- Đã login → hide email/phone inputs, pre-fill từ session
- Chưa login → email onBlur check `/api/user/check-email` → nếu exists+hasPassword → modal force login

**Sub-D: E2E test** 4 UX paths thực tế.

**Data cleanup:**
- Migrate 2 orphan leads (nguyendinhkhang1, nguyendinhkhangn) → tạo shell user + gửi magic link
- Archive 3 duplicate test leads

Anh deploy Sub-B rồi report em kết quả test.
