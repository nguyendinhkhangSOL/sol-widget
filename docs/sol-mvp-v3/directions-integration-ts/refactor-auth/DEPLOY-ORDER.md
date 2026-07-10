# Refactor Auth — Deploy Order

## ⚠️ CRITICAL: Chạy theo thứ tự — KHÔNG được skip Phase 1 (backup)

## Từ máy local (PowerShell):

```powershell
$LOCAL = "C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\directions-integration-ts\refactor-auth"

# Upload tất cả scripts + files
scp $LOCAL\P1-backup-before-refactor.sh sol-vps:/tmp/
scp $LOCAL\P2-schema-refactor.sh sol-vps:/tmp/
scp $LOCAL\P3-deploy-backend.sh sol-vps:/tmp/
scp $LOCAL\P4-deploy-frontend.sh sol-vps:/tmp/
scp $LOCAL\P5-e2e-test.sh sol-vps:/tmp/

# Backend routes
scp $LOCAL\backend\user-auth-routes.ts sol-vps:/tmp/

# Frontend pages
scp $LOCAL\public\dang-ky.html sol-vps:/tmp/
scp $LOCAL\public\dang-nhap.html sol-vps:/tmp/
```

## SSH vào VPS chạy theo thứ tự:

```bash
ssh sol-vps

# ─── PHASE 1: BACKUP (30s) ─────────────────────────────
bash /tmp/P1-backup-before-refactor.sh
# → Verify: ls /var/backups/huongdi/refactor-auth-*/

# ─── PHASE 2: SCHEMA (1-2 phút) ────────────────────────
bash /tmp/P2-schema-refactor.sh
# → Verify: sudo -u postgres psql huongdi_prod -c "\d users" (có password_hash + role)

# ─── PHASE 3: BACKEND (2 phút) ─────────────────────────
bash /tmp/P3-deploy-backend.sh
# → Verify: curl http://localhost:4001/api/user/register (should 400 missing password)

# ─── PHASE 4: FRONTEND (30s) ───────────────────────────
bash /tmp/P4-deploy-frontend.sh
# → Verify: mở https://huongdi.sol.vn/dang-ky/

# ─── PHASE 5: E2E TESTS ────────────────────────────────
bash /tmp/P5-e2e-test.sh
# → Expect: ALL TESTS PASSED
```

## Rollback nếu fail

```bash
# Restore từ backup mới nhất
LATEST=$(ls -td /var/backups/huongdi/refactor-auth-* | head -1)
cd $LATEST

# Restore DB
sudo -u postgres dropdb huongdi_prod
sudo -u postgres createdb huongdi_prod
sudo -u postgres pg_restore -d huongdi_prod db-full.dump

# Restore schema.prisma
cp schema.prisma.bak /var/www/huongdi/backend/prisma/schema.prisma
cd /var/www/huongdi/backend
npx prisma generate
npm run build
pm2 restart huongdi-api
```

## Post-Deploy Verification

**Auth endpoints:**
- `POST /api/user/register` — Free tier
- `POST /api/user/link-session` — Merge anonymous → user
- `GET /api/user/me` — Current user info
- `POST /api/auth/login-v2` — Unified login (phone/email)
- `POST /api/auth/admin/login` — Admin alias (backward compat)
- `POST /api/auth/set-password-v2` — Post-activation set password

**Frontend pages:**
- `https://huongdi.sol.vn/dang-ky/` — Free register
- `https://huongdi.sol.vn/dang-nhap/` — Unified login
- `https://adminhuongdi.sol.vn/login` — Admin (dùng chung endpoint alias)

**Admin credential (unchanged):**
- Email: `admin@sol.vn`
- Password: `huongdi2026!` (nhớ đổi sau)
- Role: `SUPER_ADMIN`
- Tier: `FOUNDER`
