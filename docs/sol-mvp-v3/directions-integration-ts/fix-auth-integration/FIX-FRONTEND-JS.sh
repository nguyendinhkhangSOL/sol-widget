#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# FIX FRONTEND: Force deploy sol-api-sync v2 + bump cache-bust
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"
NEW_VER=$(date +%Y%m%d%H%M)  # Cache-bust mới

echo -e "${CYAN}═══ FIX Frontend JS — Force Deploy v2 ═══${NC}"
echo -e "${CYAN}   New cache-bust version: $NEW_VER${NC}"
echo ""

# ─── 1. Deploy sol-api-sync-v2.js ───────────────────────────
echo -e "${YELLOW}[1/5] Deploy sol-api-sync v2...${NC}"
if [ ! -f /tmp/sol-api-sync-v2.js ]; then
    echo -e "${RED}❌ /tmp/sol-api-sync-v2.js not found. Upload trước!${NC}"
    exit 1
fi

# Verify file uploaded IS v2
if ! grep -q "authHeaders\|Version: 2" /tmp/sol-api-sync-v2.js; then
    echo -e "${RED}❌ File /tmp/sol-api-sync-v2.js không phải v2!${NC}"
    head -20 /tmp/sol-api-sync-v2.js
    exit 1
fi

sudo cp /tmp/sol-api-sync-v2.js "$PUBLIC/js/sol-api-sync.js"
sudo chown www-data:www-data "$PUBLIC/js/sol-api-sync.js" 2>/dev/null || true
echo -e "    ${GREEN}✅ Deployed. Size: $(stat -c '%s' $PUBLIC/js/sol-api-sync.js) bytes${NC}"

# Verify v2 content
V2_CHECK=$(grep -c "authHeaders\|sol_jwt" "$PUBLIC/js/sol-api-sync.js")
echo -e "    ${GREEN}✅ Content check: $V2_CHECK v2 markers found (expect >5)${NC}"

# ─── 2. Deploy sol-auth-v2.js ───────────────────────────────
echo -e "${YELLOW}[2/5] Deploy sol-auth v2...${NC}"
if [ -f /tmp/sol-auth-v2.js ]; then
    sudo cp /tmp/sol-auth-v2.js "$PUBLIC/js/sol-auth.js"
    sudo chown www-data:www-data "$PUBLIC/js/sol-auth.js" 2>/dev/null || true
    echo -e "    ${GREEN}✅ Deployed sol-auth v2${NC}"
else
    echo -e "    ${YELLOW}⚠  sol-auth-v2.js not found, skipping${NC}"
fi

# ─── 3. Bump cache-bust version trong TẤT CẢ HTML files ────
echo -e "${YELLOW}[3/5] Bump cache-bust ?v= trong HTML files...${NC}"

# Find all HTML files referencing sol-api-sync.js
FILES=$(grep -rl "sol-api-sync.js" "$PUBLIC" --include="*.html")
COUNT=0
for f in $FILES; do
    # Replace existing ?v=xxx với new timestamp
    if sudo sed -i.bak-$(date +%s) -E "s|sol-api-sync\.js\?v=[0-9]+|sol-api-sync.js?v=$NEW_VER|g" "$f"; then
        # Also bump sol-auth.js nếu có
        sudo sed -i -E "s|sol-auth\.js\?v=[0-9]+|sol-auth.js?v=$NEW_VER|g" "$f" 2>/dev/null || true
        COUNT=$((COUNT + 1))
    fi
done
echo -e "    ${GREEN}✅ Updated $COUNT HTML files với version $NEW_VER${NC}"

# ─── 4. Also add sol-auth.js include nếu chưa có ────────────
echo -e "${YELLOW}[4/5] Ensure sol-auth.js loaded on P1/P2/P3 pages...${NC}"
for page in "kham-pha-ban-than/index.html" "kiem-ke-nguon-luc/index.html" "la-ban-huong-di/index.html" "p1.html" "p2.html" "p3.html"; do
    fpath="$PUBLIC/$page"
    [ ! -f "$fpath" ] && continue

    if ! grep -q "sol-auth.js" "$fpath"; then
        # Inject sol-auth.js AFTER sol-api-sync.js
        sudo sed -i -E "s|(<script src=\"/js/sol-api-sync\.js\?v=[0-9]+\"></script>)|\1\n    <script src=\"/js/sol-auth.js?v=$NEW_VER\"></script>|" "$fpath"
        echo -e "    ${GREEN}✅ Injected sol-auth.js vào $page${NC}"
    fi
done

# ─── 5. Verify + smoke test ─────────────────────────────────
echo -e "${YELLOW}[5/5] Verify deployment...${NC}"

# Check content head
echo -e "  ${CYAN}Content head sol-api-sync.js:${NC}"
head -13 "$PUBLIC/js/sol-api-sync.js" | tail -5

echo ""
echo -e "  ${CYAN}HTML reference check:${NC}"
grep "sol-api-sync\|sol-auth" "$PUBLIC/kham-pha-ban-than/index.html" | tail -5

# Test HTTP fetch
echo ""
JS_HEAD=$(curl -s "https://huongdi.sol.vn/js/sol-api-sync.js?v=$NEW_VER" | head -15 | tail -5)
if echo "$JS_HEAD" | grep -q "Version: 2\|authHeaders"; then
    echo -e "    ${GREEN}✅ HTTPS fetch xác nhận v2 loaded${NC}"
else
    echo -e "    ${YELLOW}⚠  HTTPS fetch chưa v2:${NC}"
    echo "$JS_HEAD"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FRONTEND V2 DEPLOYED — Cache-bust: $NEW_VER${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test ngay trong browser:${NC}"
echo -e "  1. Hard refresh (Ctrl+Shift+R) https://huongdi.sol.vn/kham-pha-ban-than/"
echo -e "  2. F12 → Console → gõ:"
echo -e "     ${YELLOW}window.SolAuth.getJwt()      // Should return JWT string${NC}"
echo -e "     ${YELLOW}window.SolAuth.getTier()      // Should return 'FOUNDER'${NC}"
echo -e "  3. Làm quiz P1 xong → Check DB:"
echo -e "     ${YELLOW}user_id sẽ được link với admin@sol.vn${NC}"
