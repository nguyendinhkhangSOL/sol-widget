#!/bin/bash
# Deploy sol-user-nav.js — Global logout button widget
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"
NEW_VER=$(date +%s)

echo -e "${CYAN}═══ DEPLOY sol-user-nav.js ═══${NC}"

# ─── 1. Copy JS to /js/ ─────────────────────
echo -e "${YELLOW}[1/3] Deploy sol-user-nav.js...${NC}"
if [ -f /tmp/sol-user-nav.js ]; then
    sudo cp /tmp/sol-user-nav.js "$PUBLIC/js/sol-user-nav.js"
    sudo chown www-data:www-data "$PUBLIC/js/sol-user-nav.js" 2>/dev/null || true
    echo -e "    ${GREEN}✅ Deployed to /js/sol-user-nav.js${NC}"
fi

# ─── 2. Inject vào TẤT CẢ HTML pages có sol-auth.js ─
echo -e "${YELLOW}[2/3] Inject vào các pages...${NC}"

# List các pages cần inject (chỉ pages user thấy, không admin)
PAGES=(
    "toi/index.html"
    "toi/ban-do/index.html"
    "toi/so-hanh-trinh/index.html"
    "toi/sol-dong-hanh/index.html"
    "prompts-studio/index.html"
    "prompts/index.html"
    "la-ban-huong-di/index.html"
    "kham-pha-ban-than/index.html"
    "kiem-ke-nguon-luc/index.html"
    "p1.html"
    "p2.html"
    "p3.html"
    "index.html"
    "thanh-toan/index.html"
    "lien-he/index.html"
)

COUNT=0
for page in "${PAGES[@]}"; do
    fpath="$PUBLIC/$page"
    [ ! -f "$fpath" ] && continue

    # Skip if already injected
    if grep -q "sol-user-nav.js" "$fpath"; then
        continue
    fi

    # Inject before </body>
    sudo cp "$fpath" /tmp/nav-work.html
    sudo chown $(whoami) /tmp/nav-work.html

    python3 << PYEOF
import re
fpath = '/tmp/nav-work.html'
with open(fpath, 'r', encoding='utf-8') as f: content = f.read()

if 'sol-user-nav.js' not in content and '</body>' in content:
    inject = '    <script src="/js/sol-user-nav.js?v=$NEW_VER"></script>\n</body>'
    content = content.replace('</body>', inject, 1)
    with open(fpath, 'w', encoding='utf-8') as f: f.write(content)
PYEOF

    sudo cp /tmp/nav-work.html "$fpath"
    sudo chown www-data:www-data "$fpath" 2>/dev/null || true
    rm -f /tmp/nav-work.html

    COUNT=$((COUNT + 1))
done
echo -e "    ${GREEN}✅ Injected vào $COUNT pages${NC}"

# ─── 3. Verify HTTP fetch ─────────────────
echo -e "${YELLOW}[3/3] Verify HTTP...${NC}"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://huongdi.sol.vn/js/sol-user-nav.js?v=$NEW_VER")
[ "$CODE" = "200" ] && echo -e "    ${GREEN}✅ /js/sol-user-nav.js → HTTP 200${NC}" || echo -e "    ⚠  HTTP $CODE"

# Check 1 sample page
if grep -q "sol-user-nav" "$PUBLIC/toi/index.html" 2>/dev/null; then
    echo -e "    ${GREEN}✅ Dashboard đã inject${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Global User Nav Deployed${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test browser (Ctrl+Shift+R để clear cache):${NC}"
echo -e "  1. Vào bất kỳ trang user (/toi/, /prompts-studio/, /la-ban-huong-di/)"
echo -e "  2. Top-right sẽ có avatar user + tier badge"
echo -e "  3. Click → dropdown menu → Đăng xuất"
