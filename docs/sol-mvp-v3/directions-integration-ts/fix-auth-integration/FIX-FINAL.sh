#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# FIX FINAL: Legacy compat aliases + Login redirect + Cache bust
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"
NEW_VER=$(date +%Y%m%d%H%M)

echo -e "${CYAN}═══ FIX FINAL — Legacy compat + redirect ═══${NC}"

# ─── 1. Deploy sol-auth-v2 (updated with aliases) vào BOTH paths ─
echo -e "${YELLOW}[1/4] Deploy sol-auth v2 (with isActive alias)...${NC}"
if [ -f /tmp/sol-auth-v2.js ]; then
    # Verify có isActive alias
    if grep -q "isActive: isPaidTier" /tmp/sol-auth-v2.js; then
        sudo cp /tmp/sol-auth-v2.js "$PUBLIC/sol-auth.js"
        sudo cp /tmp/sol-auth-v2.js "$PUBLIC/js/sol-auth.js"
        sudo chown www-data:www-data "$PUBLIC/sol-auth.js" "$PUBLIC/js/sol-auth.js" 2>/dev/null || true
        echo -e "    ${GREEN}✅ Deployed sol-auth.js (root + /js/)${NC}"
    else
        echo -e "    ❌ /tmp/sol-auth-v2.js chưa có 'isActive: isPaidTier' — check file"
        exit 1
    fi
fi

# ─── 2. Deploy dang-nhap.html mới (redirect /toi/ + legacy flags) ─
echo -e "${YELLOW}[2/4] Deploy dang-nhap.html mới...${NC}"
if [ -f /tmp/dang-nhap.html ]; then
    sudo cp /tmp/dang-nhap.html "$PUBLIC/dang-nhap/index.html"
    echo -e "    ${GREEN}✅ dang-nhap.html updated${NC}"
fi

# ─── 3. Bump cache-bust toàn bộ HTML ────────────────────────
echo -e "${YELLOW}[3/4] Bump cache-bust ?v=$NEW_VER...${NC}"
FILES=$(grep -rl "sol-auth\|sol-api-sync" "$PUBLIC" --include="*.html")
for f in $FILES; do
    sudo sed -i -E \
        -e "s|(sol-auth\.js)(\?v=[0-9]+)?|\1?v=$NEW_VER|g" \
        -e "s|(sol-api-sync\.js)(\?v=[0-9]+)?|\1?v=$NEW_VER|g" \
        "$f"
done
echo -e "    ${GREEN}✅ Updated cache-bust${NC}"

# ─── 4. Verify + Test ────────────────────────────────────────
echo -e "${YELLOW}[4/4] Verify deployment...${NC}"

# Test HTTPS fetch return v2
V2_TEST=$(curl -s "https://huongdi.sol.vn/sol-auth.js?nocache=$NEW_VER" | grep -c "isActive: isPaidTier")
if [ "$V2_TEST" -gt 0 ]; then
    echo -e "    ${GREEN}✅ HTTPS fetch xác nhận v2 với isActive alias${NC}"
else
    echo -e "    ${YELLOW}⚠  v2 alias không tìm thấy trong HTTPS response${NC}"
fi

# Check /toi/ redirect logic
if grep -q "let dest = '/toi/';" "$PUBLIC/dang-nhap/index.html"; then
    echo -e "    ${GREEN}✅ dang-nhap redirect luôn /toi/${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FIX FINAL DEPLOYED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test browser (Incognito tốt nhất):${NC}"
echo -e "  1. https://huongdi.sol.vn/dang-nhap/"
echo -e "  2. Login admin@sol.vn / huongdi2026!"
echo -e "  3. Auto redirect → /toi/ (KHÔNG qua adminhuongdi)"
echo -e "  4. Vào /la-ban-huong-di/ — thấy 37 direction unlock hết"
echo -e "  5. Vào /prompts/ — thấy prompt library unlock hết"
echo ""
echo -e "${CYAN}Debug console:${NC}"
echo -e "  window.SolAuth.isActive()      // → true (FOUNDER)"
echo -e "  window.SolAuth.isPaidTier()    // → true"
echo -e "  localStorage.getItem('sol_active')  // → 'true'"
