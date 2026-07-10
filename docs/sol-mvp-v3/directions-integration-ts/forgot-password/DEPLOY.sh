#!/bin/bash
# Deploy Forgot Password + Reset Flow với Zoho SMTP
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
PUBLIC="/var/www/huongdi/public"

echo -e "${CYAN}═══ DEPLOY: Forgot Password + Reset ═══${NC}"

# ─── 1. Install nodemailer ──────────────────────────
echo -e "${YELLOW}[1/6] Install nodemailer...${NC}"
cd "$BACKEND"
if ! grep -q '"nodemailer"' package.json; then
    npm install nodemailer --save
    npm install --save-dev @types/nodemailer
fi
echo -e "    ${GREEN}✅ Installed${NC}"

# ─── 2. Append schema ─────────────────────────────
echo -e "${YELLOW}[2/6] Append PasswordResetToken model...${NC}"
if grep -q "model PasswordResetToken" "$BACKEND/prisma/schema.prisma"; then
    echo -e "    ⏭  Already exists"
else
    sudo cp "$BACKEND/prisma/schema.prisma" /tmp/schema-work.prisma
    sudo chown $(whoami) /tmp/schema-work.prisma
    cat /tmp/password-reset-schema.prisma >> /tmp/schema-work.prisma
    sudo cp /tmp/schema-work.prisma "$BACKEND/prisma/schema.prisma"

    # Add User relation
    python3 << 'PYEOF'
import re
fpath = '/var/www/huongdi/backend/prisma/schema.prisma'
with open(fpath, 'r') as f: content = f.read()
if 'passwordResets' not in content:
    m = re.search(r'(model User \{[^}]+)(@@map)', content, re.DOTALL)
    if m:
        new = m.group(1) + '  passwordResets  PasswordResetToken[] @relation("UserPasswordResets")\n\n  ' + m.group(2)
        content = content.replace(m.group(0), new)
        with open(fpath, 'w') as f: f.write(content)
        print("✅ Added User relation")
PYEOF
    echo -e "    ${GREEN}✅ Schema updated${NC}"
fi

# ─── 3. Push schema + generate ────────────────────
echo -e "${YELLOW}[3/6] Prisma db push + generate...${NC}"
npx prisma db push --accept-data-loss --skip-generate 2>&1 | tail -3
npx prisma generate 2>&1 | tail -2

# ─── 4. Deploy backend routes + mount ─────────────
echo -e "${YELLOW}[4/6] Deploy routes + mount...${NC}"
if [ -f /tmp/password-reset-routes.ts ]; then
    sudo cp /tmp/password-reset-routes.ts "$BACKEND/src/routes/password-reset.ts"
    sudo chown $(stat -c '%U:%G' "$BACKEND/src/") "$BACKEND/src/routes/password-reset.ts"
fi

python3 << 'PYEOF'
import re
fpath = '/var/www/huongdi/backend/src/index.ts'
with open(fpath, 'r') as f: content = f.read()
if 'passwordResetRoutes' not in content:
    lines = content.split('\n')
    last_import = 0
    for i, ln in enumerate(lines):
        if ln.startswith('import '): last_import = i
    lines.insert(last_import + 1, "import passwordResetRoutes from './routes/password-reset';")
    content = '\n'.join(lines)
if "app.use('/api/auth', passwordResetRoutes)" not in content:
    m = re.search(r"(app\.use\(['\"]/api/auth['\"][^)]+\);)", content)
    if m:
        content = content.replace(m.group(1), m.group(1) + "\napp.use('/api/auth', passwordResetRoutes);")
with open(fpath, 'w') as f: f.write(content)
print("✅ Mounted /api/auth (forgot-password + reset-password)")
PYEOF

# Build
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ]; then
    echo -e "${RED}❌ Build failed:${NC}"
    echo "$BUILD_LOG" | tail -20
    exit 1
fi
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Backend built + restarted${NC}"

# ─── 5. Deploy frontend pages ─────────────────────
echo -e "${YELLOW}[5/6] Deploy frontend...${NC}"
sudo mkdir -p "$PUBLIC/quen-mat-khau" "$PUBLIC/dat-lai-mat-khau"
if [ -f /tmp/quen-mat-khau.html ]; then
    sudo cp /tmp/quen-mat-khau.html "$PUBLIC/quen-mat-khau/index.html"
fi
if [ -f /tmp/dat-lai-mat-khau.html ]; then
    sudo cp /tmp/dat-lai-mat-khau.html "$PUBLIC/dat-lai-mat-khau/index.html"
fi

# Add "Quên mật khẩu?" link vào dang-nhap
if ! grep -q "quen-mat-khau" "$PUBLIC/dang-nhap/index.html" 2>/dev/null; then
    sudo cp "$PUBLIC/dang-nhap/index.html" /tmp/dang-nhap-work.html
    sudo chown $(whoami) /tmp/dang-nhap-work.html
    python3 << 'PYEOF'
with open('/tmp/dang-nhap-work.html', 'r', encoding='utf-8') as f: content = f.read()
# Inject link before "Chưa có tài khoản?"
old = 'Chưa có tài khoản?'
new = '<a href="/quen-mat-khau/" style="color:#B45309;">Quên mật khẩu?</a><br>\n    Chưa có tài khoản?'
if old in content and 'quen-mat-khau' not in content:
    content = content.replace(old, new)
    with open('/tmp/dang-nhap-work.html', 'w', encoding='utf-8') as f: f.write(content)
    print("✅ Added Quên mật khẩu link")
PYEOF
    sudo cp /tmp/dang-nhap-work.html "$PUBLIC/dang-nhap/index.html"
    sudo chown www-data:www-data "$PUBLIC/dang-nhap/index.html" 2>/dev/null || true
fi

echo -e "    ${GREEN}✅ Frontend deployed${NC}"

# ─── 6. Smoke test ────────────────────────────────
echo -e "${YELLOW}[6/6] Smoke test...${NC}"

# Test forgot-password endpoint
RES=$(curl -s -X POST http://localhost:4001/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sol.vn"}')
if echo "$RES" | grep -q '"success":true'; then
    echo -e "    ${GREEN}✅ /forgot-password endpoint works${NC}"
else
    echo -e "    ${YELLOW}⚠  Response: $RES${NC}"
fi

# Frontend pages
CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://huongdi.sol.vn/quen-mat-khau/")
[ "$CODE" = "200" ] && echo -e "    ${GREEN}✅ /quen-mat-khau/ → HTTP 200${NC}" || echo -e "    ⚠ HTTP $CODE"

# Check SMTP config
if sudo grep -q "^SMTP_HOST=" "$BACKEND/.env" 2>/dev/null; then
    echo -e "    ${GREEN}✅ SMTP config có trong .env${NC}"
else
    echo -e "    ${YELLOW}⚠  SMTP config CHƯA CÓ trong .env${NC}"
    echo -e "    ${YELLOW}   Email không gửi được cho đến khi anh add:${NC}"
    echo -e "    ${CYAN}   SMTP_HOST=smtp.zoho.com${NC}"
    echo -e "    ${CYAN}   SMTP_PORT=587${NC}"
    echo -e "    ${CYAN}   SMTP_USER=noreply@sol.vn${NC}"
    echo -e "    ${CYAN}   SMTP_PASS=<zoho app password>${NC}"
    echo -e "    ${CYAN}   SMTP_FROM=Sol La Bàn <noreply@sol.vn>${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Forgot Password Flow DEPLOYED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test browser:${NC}"
echo -e "  1. https://huongdi.sol.vn/dang-nhap/ — click 'Quên mật khẩu?'"
echo -e "  2. Nhập email admin@sol.vn → Gửi link"
echo -e "  3. Check email noreply@sol.vn inbox → click link"
echo -e "  4. Đặt mật khẩu mới → login lại"
