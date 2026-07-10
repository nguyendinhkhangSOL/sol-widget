#!/bin/bash
# Deploy generate-roadmaps.js to VPS backend + prepare env
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

echo -e "${CYAN}═══ Deploy Roadmap Generator ═══${NC}"
echo ""

# ─── 1. Copy script to backend/scripts/ ────
echo -e "${YELLOW}[1/4] Copy generate-roadmaps.js to backend...${NC}"

if [ ! -f "/tmp/generate-roadmaps.js" ]; then
    echo -e "${RED}❌ /tmp/generate-roadmaps.js not found. Please scp it first.${NC}"
    exit 1
fi

sudo mkdir -p "$BACKEND/scripts"
sudo cp /tmp/generate-roadmaps.js "$BACKEND/scripts/generate-roadmaps.js"
echo -e "   ${GREEN}✓ $BACKEND/scripts/generate-roadmaps.js${NC}"

# Verify sample file
if [ ! -f "/tmp/sample-roadmap-freelancer.json" ]; then
    echo -e "${RED}❌ /tmp/sample-roadmap-freelancer.json not found.${NC}"
    echo -e "   Please scp sample file first, or rename existing:"
    echo -e "   ${YELLOW}mv /tmp/sample-roadmap-freelancer-chuyen-mon.json /tmp/sample-roadmap-freelancer.json${NC}"
    exit 1
fi
echo -e "   ${GREEN}✓ /tmp/sample-roadmap-freelancer.json exists${NC}"

# ─── 2. Verify dependencies ────
echo ""
echo -e "${YELLOW}[2/4] Check dependencies...${NC}"
cd "$BACKEND"

if [ ! -d "node_modules/@anthropic-ai/sdk" ]; then
    echo -e "   ${YELLOW}⚠  Installing @anthropic-ai/sdk...${NC}"
    sudo npm install --save @anthropic-ai/sdk 2>&1 | tail -3
    echo -e "   ${GREEN}✓ Installed${NC}"
else
    SDK_VERSION=$(sudo node -e "console.log(require('@anthropic-ai/sdk/package.json').version)" 2>/dev/null || echo "unknown")
    echo -e "   ${GREEN}✓ @anthropic-ai/sdk v${SDK_VERSION} available${NC}"
fi

if [ ! -d "node_modules/@prisma/client" ]; then
    echo -e "   ${YELLOW}⚠  Prisma client missing — running generate...${NC}"
    sudo npx prisma generate 2>&1 | tail -3
else
    echo -e "   ${GREEN}✓ @prisma/client available${NC}"
fi

# ─── 3. Verify env ────
echo ""
echo -e "${YELLOW}[3/4] Verify env vars...${NC}"
if sudo grep -q "^ANTHROPIC_API_KEY" "$BACKEND/.env"; then
    KEY_PREFIX=$(sudo grep '^ANTHROPIC_API_KEY' "$BACKEND/.env" | cut -d= -f2 | cut -c1-10)
    echo -e "   ${GREEN}✓ ANTHROPIC_API_KEY present (${KEY_PREFIX}...)${NC}"
else
    echo -e "   ${RED}⚠  ANTHROPIC_API_KEY not found in .env${NC}"
    exit 1
fi

# ─── 4. Test with 1 direction (dry-run) ────
echo ""
echo -e "${YELLOW}[4/4] Dry-run test — list directions to be generated...${NC}"
cd "$BACKEND"
sudo node "$BACKEND/scripts/generate-roadmaps.js" --dry-run 2>&1 | tail -40 || {
    echo -e "${RED}⚠  Dry-run failed. Check errors above.${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete                                ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo ""
echo -e "  ${YELLOW}TEST với 1 mô hình${NC} (Life Coaching):"
echo -e "    cd $BACKEND"
echo -e "    sudo node scripts/generate-roadmaps.js --test life-coaching-career-coaching"
echo ""
echo -e "  ${YELLOW}Nếu chất lượng OK → FULL bulk 36 roadmaps${NC} (~10-15 phút):"
echo -e "    cd $BACKEND"
echo -e "    sudo node scripts/generate-roadmaps.js"
echo ""
echo -e "  ${YELLOW}Xem output:${NC}"
echo -e "    ls -la /tmp/roadmaps-generated/"
