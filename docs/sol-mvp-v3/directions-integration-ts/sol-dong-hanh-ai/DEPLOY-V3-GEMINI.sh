#!/bin/bash
# Deploy Sol Đồng Hành AI v3 — Gemini + OpenAI + Anthropic
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

echo -e "${CYAN}═══ DEPLOY v3 — Gemini + OpenAI + Anthropic ═══${NC}"

# ─── 1. Install SDKs ────────────────────────────
echo -e "${YELLOW}[1/4] Install SDKs...${NC}"
cd "$BACKEND"
INSTALLED=""
if ! grep -q '"@google/generative-ai"' package.json; then
    npm install @google/generative-ai --save && INSTALLED="$INSTALLED gemini"
fi
if ! grep -q '"openai"' package.json; then
    npm install openai --save && INSTALLED="$INSTALLED openai"
fi
echo -e "    ${GREEN}✅ Installed:${INSTALLED:-nothing new}${NC}"

# ─── 2. Deploy routes v3 ──────────────────────────
echo -e "${YELLOW}[2/4] Deploy routes v3...${NC}"
if [ -f /tmp/sol-dong-hanh-routes-v3-gemini.ts ]; then
    sudo cp /tmp/sol-dong-hanh-routes-v3-gemini.ts "$BACKEND/src/routes/sol-dong-hanh.ts"
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
pm2 logs huongdi-api --lines 5 --nostream --out | grep -E "Sol Đồng Hành" | tail -3

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ v3 Deployed — Priority: Gemini > OpenAI > Anthropic${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Setup Gemini API Key (RECOMMEND — FREE tier):${NC}"
echo -e "  1. https://aistudio.google.com/apikey"
echo -e "  2. Login Gmail → Create API key"
echo -e "  3. Copy key AIza..."
echo -e "  4. sudo nano $BACKEND/.env"
echo -e "  5. Thêm: GEMINI_API_KEY=AIza..."
echo -e "  6. pm2 restart huongdi-api"
echo ""
echo -e "${CYAN}Cost so sánh (per 1M tokens):${NC}"
echo -e "  Gemini 2.5 Flash: \$0.075 in / \$0.30 out  ← RẺ NHẤT + FREE 1500 req/day"
echo -e "  OpenAI 4o-mini:   \$0.15 in / \$0.60 out"
echo -e "  Claude Haiku:     \$0.80 in / \$4.00 out"
