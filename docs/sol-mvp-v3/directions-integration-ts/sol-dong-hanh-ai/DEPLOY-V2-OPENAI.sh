#!/bin/bash
# Deploy Sol Đồng Hành AI v2 — Multi-provider (OpenAI + Anthropic)
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

echo -e "${CYAN}═══ DEPLOY v2 — Multi-provider (OpenAI + Anthropic) ═══${NC}"

# ─── 1. Install openai SDK ────────────────────────────
echo -e "${YELLOW}[1/4] Install openai SDK...${NC}"
cd "$BACKEND"
if ! grep -q '"openai"' package.json; then
    npm install openai --save
    echo -e "    ${GREEN}✅ Installed${NC}"
else
    echo -e "    ⏭  Already installed"
fi

# ─── 2. Deploy routes v2 ──────────────────────────────
echo -e "${YELLOW}[2/4] Deploy routes v2...${NC}"
if [ -f /tmp/sol-dong-hanh-routes-v2.ts ]; then
    sudo cp /tmp/sol-dong-hanh-routes-v2.ts "$BACKEND/src/routes/sol-dong-hanh.ts"
    sudo chown $(stat -c '%U:%G' "$BACKEND/src/") "$BACKEND/src/routes/sol-dong-hanh.ts"
    echo -e "    ${GREEN}✅ Deployed${NC}"
fi

# ─── 3. Build + Restart ────────────────────────────────
echo -e "${YELLOW}[3/4] Build + Restart...${NC}"
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
echo -e "    ${GREEN}✅ Restarted${NC}"

# ─── 4. Check provider ─────────────────────────────────
echo -e "${YELLOW}[4/4] Check provider status...${NC}"
sleep 1
pm2 logs huongdi-api --lines 5 --nostream --out | grep -E "Provider|Sol Đồng Hành" | tail -5

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ v2 Deployed${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Next — Add OPENAI_API_KEY:${NC}"
echo -e "  1. Đăng ký: https://platform.openai.com/api-keys"
echo -e "  2. Create key (name: sol-production)"
echo -e "  3. Nạp credit: https://platform.openai.com/settings/organization/billing (min \$5)"
echo -e "  4. sudo nano $BACKEND/.env"
echo -e "  5. Thêm: OPENAI_API_KEY=sk-proj-..."
echo -e "  6. pm2 restart huongdi-api"
