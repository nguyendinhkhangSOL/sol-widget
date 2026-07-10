#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Inject <script src="/js/sol-api-sync.js"></script> vào buoc1/2/3.html
# Non-breaking: chỉ thêm 1 dòng trước </body>
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  💉 Inject sol-api-sync.js vào buoc1/2/3.html${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Find P1/P2/P3 HTML files (Việt hoá URLs + legacy)
FILES=""
# Việt hoá URLs (production)
[ -f "/var/www/huongdi/public/kham-pha-ban-than/index.html" ] && FILES="$FILES /var/www/huongdi/public/kham-pha-ban-than/index.html"
[ -f "/var/www/huongdi/public/kiem-ke-nguon-luc/index.html" ] && FILES="$FILES /var/www/huongdi/public/kiem-ke-nguon-luc/index.html"
[ -f "/var/www/huongdi/public/la-ban-huong-di/index.html" ] && FILES="$FILES /var/www/huongdi/public/la-ban-huong-di/index.html"

# Legacy compat (nếu có redirect old URLs)
[ -f "/var/www/huongdi/public/p1.html" ] && FILES="$FILES /var/www/huongdi/public/p1.html"
[ -f "/var/www/huongdi/public/p2.html" ] && FILES="$FILES /var/www/huongdi/public/p2.html"
[ -f "/var/www/huongdi/public/p3.html" ] && FILES="$FILES /var/www/huongdi/public/p3.html"

if [ -z "$FILES" ]; then
    echo "❌ Không tìm được P1/P2/P3 HTML files"
    exit 1
fi

echo -e "${YELLOW}Files found:${NC}"
echo "$FILES"
echo ""

VERSION=$(date +%Y%m%d%H%M)
SCRIPT_TAG="<script src=\"/js/sol-api-sync.js?v=${VERSION}\"></script>"

for f in $FILES; do
    echo -e "${YELLOW}Processing: $f${NC}"

    # Check if already injected
    if grep -q "sol-api-sync.js" "$f"; then
        echo -e "    ${CYAN}⏭  Đã có sol-api-sync.js — skip${NC}"
        continue
    fi

    # Backup
    sudo cp "$f" "$f.bak-$(date +%s)"

    # Insert before </body>
    if grep -q '</body>' "$f"; then
        sudo sed -i "s|</body>|    ${SCRIPT_TAG}\n</body>|" "$f"
        echo -e "    ${GREEN}✅ Injected${NC}"
    else
        # Append at end if no </body>
        echo "$SCRIPT_TAG" | sudo tee -a "$f" > /dev/null
        echo -e "    ${GREEN}✅ Appended (no </body> found)${NC}"
    fi
done

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ INJECT XONG!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Verify:${NC}"
for f in $FILES; do
    if grep -q "sol-api-sync.js" "$f"; then
        echo -e "    ${GREEN}✅ $(basename $f) has sol-api-sync.js${NC}"
    else
        echo -e "    ⚠️  $(basename $f) MISSING"
    fi
done

echo ""
echo -e "${CYAN}Test browser:${NC}"
echo -e "  https://huongdi.sol.vn/kham-pha-ban-than/  → Complete P1 quiz"
echo -e "  https://huongdi.sol.vn/kiem-ke-nguon-luc/  → Complete P2 quiz"
echo -e "  Then check DB:"
echo -e "    ssh sol-vps \"sudo -u postgres psql huongdi_prod -c 'SELECT COUNT(*) FROM p1_results; SELECT COUNT(*) FROM p2_results;'\""
