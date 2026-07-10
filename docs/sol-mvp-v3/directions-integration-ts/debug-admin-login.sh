#!/bin/bash
# Debug toàn bộ admin login flow
set -e

BACKEND="/var/www/huongdi/backend"
PASSWORD="${1:-huongdi2026!}"

echo "═══ Debug Admin Login Flow ═══"
echo ""

# ─── 1. Check adminLogin function trong api.ts ─────────────
echo "[1/6] adminLogin function trong api.ts:"
grep -B 2 -A 10 'adminLogin\|adminAuth' /var/www/huongdi/admin/src/utils/api.ts | head -30
echo ""

# ─── 2. Check tất cả routes hiện có ─────────────────────────
echo "[2/6] Routes trong index.ts:"
grep 'app.use' /var/www/huongdi/backend/src/index.ts
echo ""

# ─── 3. Test bcrypt verify với password ─────────────────────
echo "[3/6] Test bcrypt verify:"
cd "$BACKEND"
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const admin = await prisma.adminUser.findUnique({ where: { email: 'admin@sol.vn' } });
  if (!admin) { console.log('❌ Admin not found in DB'); process.exit(1); }
  console.log('Email:', admin.email);
  console.log('Role:', admin.role);
  console.log('Active:', admin.isActive);
  console.log('Hash prefix:', admin.passwordHash?.substring(0, 20));
  const ok = await bcrypt.compare('$PASSWORD', admin.passwordHash);
  console.log('Password verify:', ok ? '✅ PASS' : '❌ FAIL');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
"
echo ""

# ─── 4. Test endpoint /api/auth/admin-login ─────────────────
echo "[4/6] Test POST /api/auth/admin-login:"
echo "{\"email\":\"admin@sol.vn\",\"password\":\"$PASSWORD\"}" > /tmp/login-test.json
curl -s -w "HTTP %{http_code}\n" -X POST http://localhost:4001/api/auth/admin-login -H 'Content-Type: application/json' --data @/tmp/login-test.json
echo ""

# ─── 5. Test endpoint /api/auth/login (fallback) ────────────
echo "[5/6] Test POST /api/auth/login (Lead route):"
echo "{\"identifier\":\"admin@sol.vn\",\"password\":\"$PASSWORD\"}" > /tmp/login-test2.json
curl -s -w "HTTP %{http_code}\n" -X POST http://localhost:4001/api/auth/login -H 'Content-Type: application/json' --data @/tmp/login-test2.json
echo ""

# ─── 6. Test qua nginx HTTPS ────────────────────────────────
echo "[6/6] Test qua HTTPS nginx:"
curl -s -w "HTTP %{http_code}\n" -X POST https://adminhuongdi.sol.vn/api/auth/admin-login -H 'Content-Type: application/json' --data @/tmp/login-test.json
echo ""

echo "═══ Recent PM2 errors ═══"
pm2 logs huongdi-api --lines 20 --nostream --err | tail -15
