#!/bin/bash
# EMERGENCY: Add SolAuth.isActive alias + patch inline HTML defensive
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"
NEW_VER=$(date +%s)

echo "═══ EMERGENCY: Fix SolAuth.isActive ═══"

# ─── 1. Verify sol-auth.js hiện tại có isActive alias ──────
echo ""
echo "[1/4] Check current sol-auth.js:"
ISACTIVE_ROOT=$(grep -c "isActive.*isPaidTier\|isActive:" "$PUBLIC/sol-auth.js" 2>/dev/null || echo 0)
ISACTIVE_JS=$(grep -c "isActive.*isPaidTier\|isActive:" "$PUBLIC/js/sol-auth.js" 2>/dev/null || echo 0)
echo "  /sol-auth.js: isActive occurrences = $ISACTIVE_ROOT"
echo "  /js/sol-auth.js: isActive occurrences = $ISACTIVE_JS"

# ─── 2. Deploy sol-auth-v2.js (với isActive) — force overwrite ─
if [ -f /tmp/sol-auth-v2.js ]; then
    if grep -q "isActive" /tmp/sol-auth-v2.js; then
        sudo cp /tmp/sol-auth-v2.js "$PUBLIC/sol-auth.js"
        sudo cp /tmp/sol-auth-v2.js "$PUBLIC/js/sol-auth.js"
        echo -e "  ${GREEN}✅ Deployed sol-auth-v2 (root + /js/)${NC}"
    else
        echo -e "  ${RED}❌ /tmp/sol-auth-v2.js không có isActive${NC}"
    fi
else
    echo -e "  ${RED}❌ /tmp/sol-auth-v2.js not found — scp trước!${NC}"
    exit 1
fi

# ─── 3. Belt-and-suspenders: patch inline HTML defensive ────
# Nếu SolAuth.isActive undefined → fallback SolAuth.isPaidTier
echo ""
echo "[3/4] Patch inline HTML defensive fallback..."

# Copy file ra /tmp trước (có write access) rồi sudo mv về
sudo cp /var/www/huongdi/public/la-ban-huong-di/index.html /tmp/laban-work.html
sudo chown $(whoami) /tmp/laban-work.html

python3 << 'PYEOF'
import re

fpath = '/tmp/laban-work.html'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

old_pattern = r'return\s+window\.SolAuth\s*\?\s*SolAuth\.isActive\(\)\s*:\s*false;'
new_pattern = '''return window.SolAuth ?
      ((SolAuth.isActive || SolAuth.isPaidTier || (function(){ return !!localStorage.getItem('sol_active'); }))()) :
      !!localStorage.getItem('sol_active');'''

content = re.sub(old_pattern, new_pattern, content)

content = re.sub(
    r'SolAuth\.showPaywall\(',
    '(SolAuth.showPaywall || SolAuth.showPaywallModal || function(){ if(confirm("Nâng cấp Active 499k để mở khoá?")) location.href="/thanh-toan/"; })(',
    content
)

if content != original:
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Patched (defensive fallback)")
else:
    print("  ⏭  No changes")
PYEOF

# Move back với sudo
sudo cp /tmp/laban-work.html /var/www/huongdi/public/la-ban-huong-di/index.html
sudo chown www-data:www-data /var/www/huongdi/public/la-ban-huong-di/index.html 2>/dev/null || true
rm -f /tmp/laban-work.html

# ─── 4. Bump cache-bust mạnh ────────────────────────────────
echo ""
echo "[4/4] Aggressive cache-bust: ?v=$NEW_VER"
FILES=$(grep -rl "sol-auth\|sol-api-sync" "$PUBLIC" --include="*.html")
for f in $FILES; do
    sudo sed -i -E \
        -e "s|(sol-auth\.js)(\?v=[0-9]+)?|\1?v=$NEW_VER|g" \
        -e "s|(sol-api-sync\.js)(\?v=[0-9]+)?|\1?v=$NEW_VER|g" \
        "$f"
done
echo -e "${GREEN}✅ Bump cache-bust done${NC}"

# ─── 5. Verify HTTPS response ───────────────────────────────
echo ""
echo "[5/5] Verify HTTPS response contains isActive:"
V2_MARK=$(curl -s "https://huongdi.sol.vn/sol-auth.js?v=$NEW_VER" | grep -c "isActive")
if [ "$V2_MARK" -gt 0 ]; then
    echo -e "  ${GREEN}✅ HTTPS response contains isActive ($V2_MARK matches)${NC}"
else
    echo -e "  ${RED}❌ HTTPS response KHÔNG có isActive — Cloudflare/nginx cache?${NC}"
fi

echo ""
echo -e "${GREEN}═══ Done ═══${NC}"
echo ""
echo "Test NGAY — Tab Incognito (Ctrl+Shift+N):"
echo "  1. https://huongdi.sol.vn/dang-nhap/"
echo "  2. Login admin@sol.vn / huongdi2026!"
echo "  3. Vào /la-ban-huong-di/"
echo "  4. F12 Console — expect: no 'isActive is not a function' error"
