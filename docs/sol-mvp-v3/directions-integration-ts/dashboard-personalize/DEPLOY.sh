#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# DEPLOY: Dashboard + P3 Personalization
#   - Backend: /api/user/dashboard + /api/directions/match-v2
#   - Frontend: /toi/ dashboard page
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
PUBLIC="/var/www/huongdi/public"

echo ""
echo -e "${CYAN}═══ DEPLOY: Dashboard + P3 Personalization ═══${NC}"
echo ""

# ─── 1. Backend: copy routes ─────────────────────────────────
echo -e "${YELLOW}[1/6] Deploy backend routes...${NC}"

if [ ! -f /tmp/dashboard-routes.ts ] || [ ! -f /tmp/match-v2-routes.ts ]; then
    echo -e "${RED}❌ Missing /tmp/dashboard-routes.ts or /tmp/match-v2-routes.ts${NC}"
    echo -e "${YELLOW}   Run: scp dashboard-routes.ts match-v2-routes.ts sol-vps:/tmp/${NC}"
    exit 1
fi

sudo cp /tmp/dashboard-routes.ts "$BACKEND/src/routes/dashboard.ts"
sudo cp /tmp/match-v2-routes.ts "$BACKEND/src/routes/match-v2.ts"
sudo chown $(stat -c '%U:%G' "$BACKEND/src/") "$BACKEND/src/routes/dashboard.ts" "$BACKEND/src/routes/match-v2.ts"
echo -e "    ${GREEN}✅ Copied backend files${NC}"

# ─── 2. Mount routes trong index.ts ──────────────────────────
echo -e "${YELLOW}[2/6] Mount routes trong index.ts...${NC}"
python3 << 'PYEOF'
filepath = '/var/www/huongdi/backend/src/index.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Add imports
if 'dashboardRoutes' not in content:
    import_block = "import dashboardRoutes from './routes/dashboard';\nimport matchV2Routes from './routes/match-v2';\n"
    # Find first import line
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    lines.insert(last_import_idx + 1, import_block.rstrip())
    content = '\n'.join(lines)

# Mount routes
if "app.use('/api/user', dashboardRoutes)" not in content:
    # Insert after existing app.use('/api/user'
    import re
    match = re.search(r"(app\.use\(['\"]/api/user['\"][^)]+\);)", content)
    if match:
        insertion = "\napp.use('/api/user', dashboardRoutes);\napp.use('/api/directions', matchV2Routes);"
        content = content.replace(match.group(1), match.group(1) + insertion)
    else:
        # Fallback: prepend before app.listen
        content = content.replace('app.listen(',
            "app.use('/api/user', dashboardRoutes);\napp.use('/api/directions', matchV2Routes);\n\napp.listen(", 1)

with open(filepath, 'w') as f:
    f.write(content)
print("✅ Mounted dashboard + match-v2 routes")
PYEOF

# ─── 3. Build backend ────────────────────────────────────────
echo -e "${YELLOW}[3/6] npm run build...${NC}"
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ] || echo "$BUILD_LOG" | grep -q "error TS"; then
    echo -e "${RED}❌ Build FAILED:${NC}"
    echo "$BUILD_LOG" | tail -40
    exit 1
fi
echo -e "    ${GREEN}✅ Build OK${NC}"

# ─── 4. PM2 restart ──────────────────────────────────────────
echo -e "${YELLOW}[4/6] PM2 restart huongdi-api...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Restarted${NC}"

# ─── 5. Deploy frontend /toi/ ────────────────────────────────
echo -e "${YELLOW}[5/6] Deploy /toi/ dashboard page...${NC}"
sudo mkdir -p "$PUBLIC/toi"
if [ -f /tmp/toi-index.html ]; then
    sudo cp /tmp/toi-index.html "$PUBLIC/toi/index.html"
    echo -e "    ${GREEN}✅ /toi/ deployed${NC}"
else
    echo -e "    ${RED}❌ /tmp/toi-index.html not found${NC}"
    exit 1
fi

# ─── 6. Smoke test ───────────────────────────────────────────
echo -e "${YELLOW}[6/6] Smoke tests...${NC}"

# Test /api/user/dashboard requires auth (should return 401 without JWT)
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/api/user/dashboard)
if [ "$CODE" = "401" ]; then
    echo -e "    ${GREEN}✅ /api/user/dashboard requires auth (401 without JWT)${NC}"
else
    echo -e "    ${YELLOW}⚠  /api/user/dashboard returned HTTP $CODE (expected 401)${NC}"
fi

# Test /api/directions/match-v2 with minimal body
RES=$(curl -s -X POST http://localhost:4001/api/directions/match-v2 \
  -H 'Content-Type: application/json' \
  -d '{"p1":{"people":50,"expert":80,"builder":60,"independent":75},"p2":{"experience":80,"capital":40,"time":60,"technology":70,"network":50,"risk":55,"energy":75,"incomeGoal":"15-30tr"},"limit":3}')

if echo "$RES" | grep -q '"success":true'; then
    TOP=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('matches',[{}])[0].get('name','?'), '-', d.get('matches',[{}])[0].get('matchScore','?'), '%')")
    echo -e "    ${GREEN}✅ /api/directions/match-v2 works — Top 1: $TOP${NC}"
else
    echo -e "    ${YELLOW}⚠  /api/directions/match-v2 failed: $(echo $RES | head -c 200)${NC}"
fi

# Test /toi/ HTTP access
CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://huongdi.sol.vn/toi/")
[ "$CODE" = "200" ] && echo -e "    ${GREEN}✅ /toi/ → HTTP 200${NC}" || echo -e "    ${YELLOW}⚠  /toi/ → HTTP $CODE${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOY COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test manually:${NC}"
echo -e "  1. Đăng nhập tại https://huongdi.sol.vn/dang-nhap/"
echo -e "  2. Truy cập https://huongdi.sol.vn/toi/ — thấy dashboard cá nhân"
echo -e "  3. Test /api/directions/match-v2 với P1+P2 vector thật"
