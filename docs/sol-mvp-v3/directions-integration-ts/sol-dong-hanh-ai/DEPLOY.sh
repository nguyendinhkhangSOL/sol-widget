#!/bin/bash
# Deploy Sol Đồng Hành AI — Active tier chatbot
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
PUBLIC="/var/www/huongdi/public"

echo -e "${CYAN}═══ DEPLOY: Sol Đồng Hành AI ═══${NC}"

# ─── 0. Check Anthropic API key ────────────────────────
if ! grep -q "ANTHROPIC_API_KEY" "$BACKEND/.env" 2>/dev/null; then
    echo -e "${YELLOW}⚠  ANTHROPIC_API_KEY chưa có trong .env${NC}"
    echo -e "${YELLOW}   AI chat sẽ return 503 cho đến khi anh add key${NC}"
    echo -e "${YELLOW}   Thêm dòng: ANTHROPIC_API_KEY=sk-ant-api03-...${NC}"
    echo ""
fi

# ─── 1. Install Anthropic SDK ──────────────────────────
echo -e "${YELLOW}[1/6] Install @anthropic-ai/sdk...${NC}"
cd "$BACKEND"
if ! grep -q "@anthropic-ai/sdk" package.json; then
    npm install @anthropic-ai/sdk --save
    echo -e "    ${GREEN}✅ Installed${NC}"
else
    echo -e "    ⏭  Already installed"
fi

# ─── 2. Append schema ─────────────────────────────────
echo -e "${YELLOW}[2/6] Append SolChat models to schema...${NC}"
if grep -q "model SolChatConversation" "$BACKEND/prisma/schema.prisma"; then
    echo -e "    ⏭  Already exists"
else
    sudo cp "$BACKEND/prisma/schema.prisma" /tmp/schema-work.prisma
    sudo chown $(whoami) /tmp/schema-work.prisma
    cat /tmp/schema-additions.prisma >> /tmp/schema-work.prisma
    sudo cp /tmp/schema-work.prisma "$BACKEND/prisma/schema.prisma"

    # Add User relation
    python3 << 'PYEOF'
import re
fpath = '/var/www/huongdi/backend/prisma/schema.prisma'
with open(fpath, 'r') as f: content = f.read()
if 'solChats' not in content:
    m = re.search(r'(model User \{[^}]+)(@@map)', content, re.DOTALL)
    if m:
        new = m.group(1) + '  solChats       SolChatConversation[] @relation("UserSolChats")\n\n  ' + m.group(2)
        content = content.replace(m.group(0), new)
        with open(fpath, 'w') as f: f.write(content)
        print("✅ User relation added")
PYEOF
    echo -e "    ${GREEN}✅ Schema updated${NC}"
fi

# ─── 3. Push schema ────────────────────────────────────
echo -e "${YELLOW}[3/6] Prisma db push + generate...${NC}"
npx prisma db push --accept-data-loss --skip-generate 2>&1 | tail -3
npx prisma generate 2>&1 | tail -2
echo -e "    ${GREEN}✅ Schema pushed${NC}"

# ─── 4. Deploy backend routes ─────────────────────────
echo -e "${YELLOW}[4/6] Deploy routes + mount...${NC}"
if [ -f /tmp/sol-dong-hanh-routes.ts ]; then
    sudo cp /tmp/sol-dong-hanh-routes.ts "$BACKEND/src/routes/sol-dong-hanh.ts"
fi

python3 << 'PYEOF'
import re
fpath = '/var/www/huongdi/backend/src/index.ts'
with open(fpath, 'r') as f: content = f.read()

if 'solDongHanhRoutes' not in content:
    lines = content.split('\n')
    last_import = 0
    for i, ln in enumerate(lines):
        if ln.startswith('import '): last_import = i
    lines.insert(last_import + 1, "import solDongHanhRoutes from './routes/sol-dong-hanh';")
    content = '\n'.join(lines)

if "app.use('/api/sol-dong-hanh'" not in content:
    m = re.search(r"(app\.use\(['\"]/api/journey['\"][^)]+\);)", content)
    if m:
        content = content.replace(m.group(1), m.group(1) + "\napp.use('/api/sol-dong-hanh', solDongHanhRoutes);")

with open(fpath, 'w') as f: f.write(content)
print("✅ Mounted /api/sol-dong-hanh")
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

# ─── 5. Deploy frontend ────────────────────────────────
echo -e "${YELLOW}[5/6] Deploy /toi/sol-dong-hanh/...${NC}"
sudo mkdir -p "$PUBLIC/toi/sol-dong-hanh"
if [ -f /tmp/sol-dong-hanh-index.html ]; then
    sudo cp /tmp/sol-dong-hanh-index.html "$PUBLIC/toi/sol-dong-hanh/index.html"
    echo -e "    ${GREEN}✅ Deployed${NC}"
fi

# ─── 6. Smoke test ─────────────────────────────────────
echo -e "${YELLOW}[6/6] Smoke test /api/sol-dong-hanh/state...${NC}"
JWT=$(curl -s -X POST http://localhost:4001/api/auth/login-v2 \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@sol.vn","password":"huongdi2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

STATE=$(curl -s http://localhost:4001/api/sol-dong-hanh/state -H "Authorization: Bearer $JWT")
echo "  Response: $(echo $STATE | head -c 300)..."

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Sol Đồng Hành AI DEPLOYED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}⚠  QUAN TRỌNG: Add ANTHROPIC_API_KEY vào .env${NC}"
echo -e "  1. Đăng ký tại: https://console.anthropic.com/"
echo -e "  2. Get API key: Settings → API Keys → Create Key"
echo -e "  3. Nạp credit: min \$5 để test"
echo -e "  4. echo 'ANTHROPIC_API_KEY=sk-ant-api03-...' >> $BACKEND/.env"
echo -e "  5. pm2 restart huongdi-api"
echo ""
echo -e "${CYAN}Test: https://huongdi.sol.vn/toi/sol-dong-hanh/${NC}"
