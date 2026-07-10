#!/bin/bash
# Fix admin login:
#  1. Rename endpoint /auth/admin-login → /auth/admin/login (match frontend)
#  2. Reset password với bcrypt rounds=12 (khớp seed)
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
AUTH_TS="$BACKEND/src/routes/auth.ts"
NEW_PASSWORD="${1:-huongdi2026!}"

echo ""
echo -e "${CYAN}═══ Fix Admin Login Final ═══${NC}"
echo ""

# ─── FIX 1: Rename endpoint ─────────────────────────────────
echo -e "${YELLOW}[1/4] Fix endpoint URL: admin-login → admin/login${NC}"
if grep -q "'/admin-login'" "$AUTH_TS"; then
    sed -i "s|'/admin-login'|'/admin/login'|g" "$AUTH_TS"
    echo -e "    ${GREEN}✅ Renamed endpoint${NC}"
else
    echo -e "    ${CYAN}⏭  Not found — check if /admin/login already exists:${NC}"
    grep -n "admin/login\|admin-login" "$AUTH_TS" || echo "    ❌ Chưa có endpoint nào"
fi

# ─── FIX 2: Reset password bcrypt rounds=12 ─────────────────
echo -e "${YELLOW}[2/4] Reset password với bcrypt rounds=12...${NC}"
HASH=$(cd "$BACKEND" && node -e "console.log(require('bcryptjs').hashSync('$NEW_PASSWORD', 12));")
echo "    Hash prefix: ${HASH:0:20}... (should be \$2a\$12\$ or \$2b\$12\$)"

sudo -u postgres psql huongdi_prod << EOF
UPDATE admin_users
SET password_hash = '$HASH', updated_at = now(), is_active = true
WHERE email = 'admin@sol.vn';
SELECT id, email, role, is_active, LEFT(password_hash, 8) AS hash_prefix FROM admin_users;
EOF

# ─── FIX 3: Verify bcrypt verify ────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Verify bcrypt trực tiếp...${NC}"
cd "$BACKEND"
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const admin = await prisma.adminUser.findUnique({ where: { email: 'admin@sol.vn' } });
  const ok = await bcrypt.compare('$NEW_PASSWORD', admin.passwordHash);
  console.log('    Verify:', ok ? '✅ PASS' : '❌ FAIL');
  process.exit(0);
})();
"

# ─── FIX 4: Rebuild + PM2 restart ───────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Build + Restart...${NC}"
cd "$BACKEND"
if npm run build 2>&1 | tail -5 | grep -q "error TS"; then
    echo -e "❌ Build errors:"
    npm run build 2>&1 | tail -10
    exit 1
fi
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "${GREEN}✅ Backend restarted${NC}"

# ─── Test final ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}Test POST /api/auth/admin/login:${NC}"
echo "{\"email\":\"admin@sol.vn\",\"password\":\"$NEW_PASSWORD\"}" > /tmp/final-login.json
curl -s -w "\n[HTTP %{http_code}]\n" -X POST http://localhost:4001/api/auth/admin/login \
  -H 'Content-Type: application/json' --data @/tmp/final-login.json

echo ""
echo -e "${GREEN}✅ Done${NC}"
echo -e "  🌐 Login: ${CYAN}https://adminhuongdi.sol.vn/login${NC}"
echo -e "  📧 Email: admin@sol.vn"
echo -e "  🔑 Password: $NEW_PASSWORD"
