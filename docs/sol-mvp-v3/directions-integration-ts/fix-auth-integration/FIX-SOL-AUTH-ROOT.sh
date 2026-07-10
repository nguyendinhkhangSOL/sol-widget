#!/bin/bash
# Deploy sol-auth-v2 vào ROOT path (không /js/) để match existing HTML reference
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"

echo "═══ Fix sol-auth.js root path ═══"

# ─── 1. Deploy sol-auth-v2 vào /sol-auth.js (root) ────────
if [ -f /tmp/sol-auth-v2.js ]; then
    sudo cp /tmp/sol-auth-v2.js "$PUBLIC/sol-auth.js"
    sudo chown www-data:www-data "$PUBLIC/sol-auth.js" 2>/dev/null || true
    echo -e "${GREEN}✅ Deployed sol-auth-v2 vào $PUBLIC/sol-auth.js (ROOT)${NC}"
fi

# ─── 2. Verify content ───────────────────────────────────
V2_MARKERS=$(grep -c "getJwt\|getTier\|isPaidTier" "$PUBLIC/sol-auth.js" || echo 0)
echo -e "${GREEN}✅ v2 markers: $V2_MARKERS (expect >3)${NC}"

# ─── 3. Bump cache-bust cho sol-auth.js references ─────
NEW_VER=$(date +%Y%m%d%H%M)
FILES=$(grep -rl "sol-auth" "$PUBLIC" --include="*.html")
for f in $FILES; do
    # Add ?v= nếu chưa có, hoặc bump
    sudo sed -i -E \
        -e "s|(sol-auth\.js)\?v=[0-9]+|\1?v=$NEW_VER|g" \
        -e "s|(<script src=\"/sol-auth\.js\")(></script>)|\1?v=$NEW_VER\2|g" \
        "$f"
done
echo -e "${GREEN}✅ Bumped cache-bust: $NEW_VER${NC}"

# ─── 4. Show HTML references (verify) ────────────────────
echo ""
echo "HTML references cho sol-auth.js:"
grep -rn "sol-auth" "$PUBLIC/kham-pha-ban-than/index.html" | head -3
echo ""
grep -rn "sol-auth" "$PUBLIC/la-ban-huong-di/index.html" | head -3

echo ""
echo -e "${GREEN}✅ Done. Hard refresh browser để test${NC}"
