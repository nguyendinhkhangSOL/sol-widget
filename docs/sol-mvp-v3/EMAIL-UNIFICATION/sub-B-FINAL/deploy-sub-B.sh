#!/bin/bash
# Deploy Sub-B refactored routes — chạy trong SSH VPS
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
ROUTES="$BACKEND/src/routes"

echo -e "${CYAN}═══ Deploy Sub-B: Unified Auth Refactor ═══${NC}"
echo ""

# ─── 1. Verify uploaded files ────
echo -e "${YELLOW}[1/6] Verify uploaded files${NC}"
if [ ! -f "/tmp/user-auth-refactored.ts" ]; then
    echo -e "${RED}❌ /tmp/user-auth-refactored.ts not found. scp lên trước!${NC}"
    exit 1
fi
if [ ! -f "/tmp/leads-refactored.ts" ]; then
    echo -e "${RED}❌ /tmp/leads-refactored.ts not found${NC}"
    exit 1
fi
echo -e "   ${GREEN}✓ Both files at /tmp/${NC}"

# ─── 2. Backup current files ────
echo ""
echo -e "${YELLOW}[2/6] Backup current routes${NC}"
TS=$(date +%s)
sudo cp "$ROUTES/user-auth.ts" "$ROUTES/user-auth.ts.bak-$TS"
sudo cp "$ROUTES/leads.ts" "$ROUTES/leads.ts.bak-$TS"
echo -e "   ${GREEN}✓ Backup: user-auth.ts.bak-$TS + leads.ts.bak-$TS${NC}"

# ─── 3. Deploy new files ────
echo ""
echo -e "${YELLOW}[3/6] Deploy refactored files${NC}"
sudo cp /tmp/user-auth-refactored.ts "$ROUTES/user-auth.ts"
sudo cp /tmp/leads-refactored.ts "$ROUTES/leads.ts"
echo -e "   ${GREEN}✓ user-auth.ts + leads.ts updated${NC}"

# ─── 4. Build TypeScript ────
echo ""
echo -e "${YELLOW}[4/6] Build TypeScript${NC}"
cd "$BACKEND"
if sudo npm run build 2>&1 | tee /tmp/build-output.log | tail -10; then
    if grep -q "error TS" /tmp/build-output.log; then
        echo -e "${RED}❌ Build có TypeScript errors!${NC}"
        echo -e "${YELLOW}Rollback:${NC}"
        echo -e "   sudo cp $ROUTES/user-auth.ts.bak-$TS $ROUTES/user-auth.ts"
        echo -e "   sudo cp $ROUTES/leads.ts.bak-$TS $ROUTES/leads.ts"
        echo -e "   cd $BACKEND && sudo npm run build"
        exit 1
    fi
    echo -e "   ${GREEN}✓ Build success${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# ─── 5. Restart PM2 ────
echo ""
echo -e "${YELLOW}[5/6] Restart PM2${NC}"
pm2 restart huongdi-api --update-env
sleep 3
echo -e "   ${GREEN}✓ PM2 restarted${NC}"

# ─── 6. Health check ────
echo ""
echo -e "${YELLOW}[6/6] Health check + logs${NC}"
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/api/user/check-email?email=test@test.com 2>/dev/null || echo "000")
echo -e "   Health check /api/user/check-email: HTTP $STATUS"

echo ""
echo -e "${CYAN}Recent logs (last 20):${NC}"
pm2 logs huongdi-api --lines 20 --nostream 2>&1 | tail -20

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Sub-B Deployed — Ready for testing         ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test commands:${NC}"
echo ""
echo -e "${YELLOW}# Test 1: Check email exists${NC}"
echo -e '  curl "https://huongdi.sol.vn/api/user/check-email?email=nguyendinhkhang@gmail.com"'
echo ""
echo -e "${YELLOW}# Test 2: Register email đã pay (orphan lead auto-upgrade)${NC}"
echo -e '  curl -X POST https://huongdi.sol.vn/api/user/register \\'
echo -e '    -H "Content-Type: application/json" \\'
echo -e '    -d "{\"email\":\"nguyendinhkhang1@gmail.com\",\"password\":\"test123456\",\"displayName\":\"Test\"}"'
echo ""
echo -e "${YELLOW}# Test 3: POST /leads với email trùng account existing → 409${NC}"
echo -e '  curl -X POST https://huongdi.sol.vn/api/leads \\'
echo -e '    -H "Content-Type: application/json" \\'
echo -e '    -d "{\"ten\":\"Test\",\"sdt\":\"0912727388\",\"email\":\"nguyendinhkhang@gmail.com\",\"goi\":\"active\"}"'
echo ""
echo -e "${YELLOW}Rollback nếu có issue:${NC}"
echo -e "  sudo cp $ROUTES/user-auth.ts.bak-$TS $ROUTES/user-auth.ts"
echo -e "  sudo cp $ROUTES/leads.ts.bak-$TS $ROUTES/leads.ts"
echo -e "  cd $BACKEND && sudo npm run build && pm2 restart huongdi-api"
