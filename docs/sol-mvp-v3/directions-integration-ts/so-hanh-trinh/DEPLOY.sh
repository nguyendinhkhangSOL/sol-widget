#!/bin/bash
# Deploy Sổ Hành Trình — Layer 2
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
PUBLIC="/var/www/huongdi/public"

echo -e "${CYAN}═══ DEPLOY: Sổ Hành Trình 90 ngày ═══${NC}"

# ─── 1. Backup ─────────────────────────────────────────
BACKUP_DIR="/var/backups/huongdi/journey-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"
sudo chown $(whoami):$(whoami) "$BACKUP_DIR"
sudo cp "$BACKEND/prisma/schema.prisma" "$BACKUP_DIR/schema.prisma.bak"
echo -e "${GREEN}✅ Backup: $BACKUP_DIR${NC}"

# ─── 2. Append JourneyDay model vào schema ────────────
echo -e "${YELLOW}[2/6] Append JourneyDay model...${NC}"
if [ ! -f /tmp/journey-schema.prisma ]; then
    echo "❌ /tmp/journey-schema.prisma not found"
    exit 1
fi

# Check nếu đã có model
if grep -q "model JourneyDay" "$BACKEND/prisma/schema.prisma"; then
    echo -e "    ⏭  JourneyDay model đã có"
else
    # Copy nội dung file schema qua tmp (writable)
    sudo cp "$BACKEND/prisma/schema.prisma" /tmp/schema-work.prisma
    sudo chown $(whoami) /tmp/schema-work.prisma
    cat /tmp/journey-schema.prisma >> /tmp/schema-work.prisma
    sudo cp /tmp/schema-work.prisma "$BACKEND/prisma/schema.prisma"

    # Add relation vào User model
    python3 << 'PYEOF'
import re
fpath = '/var/www/huongdi/backend/prisma/schema.prisma'
with open(fpath, 'r') as f: content = f.read()

if 'journeyDays' not in content:
    # Find User model, insert relation before @@map
    m = re.search(r'(model User \{[^}]+)(@@map)', content, re.DOTALL)
    if m:
        new = m.group(1) + '  journeyDays    JourneyDay[]  @relation("UserJourneyDays")\n\n  ' + m.group(2)
        content = content.replace(m.group(0), new)
        with open(fpath, 'w') as f: f.write(content)
        print("✅ Added journeyDays relation vào User")
PYEOF
    echo -e "    ${GREEN}✅ Schema updated${NC}"
fi

# ─── 3. Push schema + generate ────────────────────────
echo -e "${YELLOW}[3/6] Prisma db push + generate...${NC}"
cd "$BACKEND"
npx prisma db push --accept-data-loss --skip-generate 2>&1 | tail -5
npx prisma generate 2>&1 | tail -3
echo -e "    ${GREEN}✅ Schema pushed${NC}"

# ─── 4. Deploy backend routes ────────────────────────
echo -e "${YELLOW}[4/6] Deploy journey routes...${NC}"
if [ -f /tmp/journey-routes.ts ]; then
    sudo cp /tmp/journey-routes.ts "$BACKEND/src/routes/journey.ts"
    sudo chown $(stat -c '%U:%G' "$BACKEND/src/") "$BACKEND/src/routes/journey.ts"
fi

# Mount route trong index.ts
python3 << 'PYEOF'
import re
fpath = '/var/www/huongdi/backend/src/index.ts'
with open(fpath, 'r') as f: content = f.read()

if 'journeyRoutes' not in content:
    lines = content.split('\n')
    last_import = 0
    for i, ln in enumerate(lines):
        if ln.startswith('import '): last_import = i
    lines.insert(last_import + 1, "import journeyRoutes from './routes/journey';")
    content = '\n'.join(lines)

if "app.use('/api/journey', journeyRoutes)" not in content:
    m = re.search(r"(app\.use\(['\"]/api/user['\"][^)]+\);)", content)
    if m:
        content = content.replace(m.group(1), m.group(1) + "\napp.use('/api/journey', journeyRoutes);")

with open(fpath, 'w') as f: f.write(content)
print("✅ Mounted /api/journey")
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
echo -e "    ${GREEN}✅ Backend rebuild + restarted${NC}"

# ─── 5. Deploy frontend ────────────────────────────────
echo -e "${YELLOW}[5/6] Deploy /toi/so-hanh-trinh/...${NC}"
sudo mkdir -p "$PUBLIC/toi/so-hanh-trinh"
if [ -f /tmp/so-hanh-trinh-index.html ]; then
    sudo cp /tmp/so-hanh-trinh-index.html "$PUBLIC/toi/so-hanh-trinh/index.html"
    echo -e "    ${GREEN}✅ Deployed${NC}"
fi

# ─── 6. Smoke test ─────────────────────────────────────
echo -e "${YELLOW}[6/6] Smoke test /api/journey/state...${NC}"
JWT=$(curl -s -X POST http://localhost:4001/api/auth/login-v2 \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@sol.vn","password":"huongdi2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

STATE=$(curl -s http://localhost:4001/api/journey/state -H "Authorization: Bearer $JWT")
echo "  Response: $(echo $STATE | head -c 200)..."

CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://huongdi.sol.vn/toi/so-hanh-trinh/")
[ "$CODE" = "200" ] && echo -e "  ${GREEN}✅ /toi/so-hanh-trinh/ → HTTP 200${NC}" || echo -e "  ⚠ HTTP $CODE"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Sổ Hành Trình 90 ngày DEPLOYED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test: https://huongdi.sol.vn/toi/so-hanh-trinh/${NC}"
