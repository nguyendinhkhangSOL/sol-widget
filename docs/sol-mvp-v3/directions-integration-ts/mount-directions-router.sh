#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Mount directionsRouter vào index.ts + build + restart
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

INDEX="/var/www/huongdi/backend/src/index.ts"
BACKEND="/var/www/huongdi/backend"

echo ""
echo -e "${YELLOW}[1/5] Backup index.ts...${NC}"
cp "$INDEX" "$INDEX.bak-$(date +%s)"
echo -e "    ${GREEN}✅ Backed up${NC}"

echo -e "${YELLOW}[2/5] Add import statement...${NC}"
if grep -q "directionsRouter" "$INDEX"; then
    echo -e "    ${YELLOW}⏭  directionsRouter đã có — skip${NC}"
else
    # Insert import sau import savedRouter
    sed -i "/import.*savedRouter.*from.*routes\/saved/a import { directionsRouter } from './routes/directions';" "$INDEX"
    echo -e "    ${GREEN}✅ Added import${NC}"
fi

echo -e "${YELLOW}[3/5] Add mount app.use...${NC}"
if grep -q "app.use.*api/directions.*directionsRouter" "$INDEX"; then
    echo -e "    ${YELLOW}⏭  Mount đã có — skip${NC}"
else
    # Insert mount sau app.use('/api/saved', savedRouter)
    sed -i "/app\.use('\/api\/saved', savedRouter);/a app.use('/api/directions', directionsRouter);" "$INDEX"
    echo -e "    ${GREEN}✅ Added mount${NC}"
fi

echo ""
echo -e "${YELLOW}[4/5] Verify changes...${NC}"
grep -n "directionsRouter\|savedRouter" "$INDEX"

echo ""
echo -e "${YELLOW}[5/5] Build + PM2 restart...${NC}"
cd "$BACKEND"
if npm run build 2>&1 | tail -8; then
    pm2 restart huongdi-api
    sleep 3
    pm2 logs huongdi-api --lines 8 --nostream
fi

echo ""
echo -e "${GREEN}✅ Mount done. Verifying API...${NC}"
sleep 2

RESULT=$(curl -s http://localhost:4001/api/directions | head -c 200)
if echo "$RESULT" | grep -q "count"; then
    COUNT=$(echo "$RESULT" | grep -o '"count":[0-9]*' | head -1)
    echo -e "${GREEN}✅ /api/directions works! ${COUNT}${NC}"
else
    echo -e "${RED}❌ API check failed:${NC}"
    echo "$RESULT"
fi
