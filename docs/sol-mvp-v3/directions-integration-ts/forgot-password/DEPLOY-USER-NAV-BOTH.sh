#!/bin/bash
# Deploy sol-user-nav-v3.js cho CẢ huongdi.sol.vn + sol.vn
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

HUONGDI="/var/www/huongdi"
SOLVN="/var/www/sol.vn"

echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sol User Nav v3 → Deploy 2 domains          ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

# ─── STEP 1: Copy JS lên huongdi.sol.vn ─────────
echo -e "${YELLOW}[1/5] Deploy JS lên huongdi.sol.vn...${NC}"

if [ ! -f "/tmp/sol-user-nav-v3.js" ]; then
    echo -e "${RED}❌ Cần scp sol-user-nav-v3.js lên /tmp/ trước!${NC}"
    echo -e "   scp sol-user-nav-v3.js sol-vps:/tmp/"
    exit 1
fi

sudo mkdir -p "$HUONGDI/public/js"
sudo cp /tmp/sol-user-nav-v3.js "$HUONGDI/public/js/sol-user-nav.js"
sudo chown www-data:www-data "$HUONGDI/public/js/sol-user-nav.js"
sudo chmod 644 "$HUONGDI/public/js/sol-user-nav.js"

FILE_SIZE=$(stat -c%s "$HUONGDI/public/js/sol-user-nav.js")
echo -e "    ${GREEN}✅ Deployed: $HUONGDI/public/js/sol-user-nav.js${NC} (${FILE_SIZE} bytes)"
echo -e "    URL: https://huongdi.sol.vn/js/sol-user-nav.js"

# ─── STEP 2: Setup CORS header cho JS ────────────
echo ""
echo -e "${YELLOW}[2/5] Verify CORS header (JS phải load được từ sol.vn)...${NC}"

CORS_TEST=$(curl -s -I -H "Origin: https://sol.vn" \
    https://huongdi.sol.vn/js/sol-user-nav.js 2>/dev/null | \
    grep -i 'access-control-allow' || echo "")

if [ -z "$CORS_TEST" ]; then
    echo -e "    ${YELLOW}⚠  Không có CORS header — thêm vào nginx${NC}"
    echo -e "    Anh chạy: sudo nano /etc/nginx/sites-available/huongdi.sol.vn"
    echo -e "    Thêm trong location /js/ hoặc trong server block:"
    echo -e "${CYAN}"
    cat << 'NGINX'
    location ~ ^/js/.*\.js$ {
        add_header Access-Control-Allow-Origin "https://sol.vn" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Cache-Control "public, max-age=3600" always;
    }
NGINX
    echo -e "${NC}"
    echo -e "    Rồi: sudo nginx -t && sudo systemctl reload nginx"
else
    echo -e "    ${GREEN}✅ CORS OK${NC}"
fi

# ─── STEP 3: Inject vào huongdi pages ────────────
echo ""
echo -e "${YELLOW}[3/5] Inject script tag vào tất cả HTML pages huongdi.sol.vn...${NC}"

PAGES=(
    "$HUONGDI/public/index.html"
    "$HUONGDI/public/founder/index.html"
    "$HUONGDI/public/40-60-la-thoi-diem/index.html"
    "$HUONGDI/public/menh-nghiep-thoi-4-0/index.html"
    "$HUONGDI/public/dam-thay-doi/index.html"
    "$HUONGDI/public/tai-khoi-nghiep-nghi-huu-som/index.html"
    "$HUONGDI/public/dieu-huong-nghe-nghiep/index.html"
    "$HUONGDI/public/tri-tue-40-60/index.html"
    "$HUONGDI/public/khoi-nghiep-tuoi-40-50/index.html"
    "$HUONGDI/public/toi/index.html"
    "$HUONGDI/public/toi/ban-do/index.html"
    "$HUONGDI/public/toi/so-hanh-trinh/index.html"
    "$HUONGDI/public/prompts-studio/index.html"
    "$HUONGDI/public/toi/sol-dong-hanh/index.html"
)

INJECTED=0
SCRIPT_TAG='<script src="/js/sol-user-nav.js?v=3" async></script>'

for PAGE in "${PAGES[@]}"; do
    if [ -f "$PAGE" ]; then
        # Remove old versions (v1, v2, v3)
        sudo sed -i '/sol-user-nav\.js/d' "$PAGE"

        # Inject before </body>
        if grep -q '</body>' "$PAGE"; then
            sudo sed -i "s|</body>|${SCRIPT_TAG}\n</body>|" "$PAGE"
            INJECTED=$((INJECTED + 1))
            echo -e "    ${GREEN}✅${NC} $(basename $(dirname $PAGE))/$(basename $PAGE)"
        fi
    fi
done

echo -e "    ${GREEN}→ Injected ${INJECTED}/${#PAGES[@]} pages${NC}"

# ─── STEP 4: Deploy mu-plugin PHP lên sol.vn ─────
echo ""
echo -e "${YELLOW}[4/5] Deploy mu-plugin PHP lên sol.vn WordPress...${NC}"

if [ ! -f "/tmp/sol-user-nav.php" ]; then
    echo -e "${RED}❌ Cần scp sol-user-nav.php lên /tmp/ trước!${NC}"
    echo -e "   scp sol-user-nav.php sol-vps:/tmp/"
    exit 1
fi

if [ ! -d "$SOLVN/wp-content" ]; then
    echo -e "${RED}❌ Không tìm thấy $SOLVN/wp-content${NC}"
    echo -e "    Check lại đường dẫn WordPress sol.vn:"
    ls -la /var/www/ | grep -i sol
    exit 1
fi

sudo mkdir -p "$SOLVN/wp-content/mu-plugins"
sudo cp /tmp/sol-user-nav.php "$SOLVN/wp-content/mu-plugins/sol-user-nav.php"
sudo chown www-data:www-data "$SOLVN/wp-content/mu-plugins/sol-user-nav.php"
sudo chmod 644 "$SOLVN/wp-content/mu-plugins/sol-user-nav.php"

echo -e "    ${GREEN}✅ mu-plugin installed: $SOLVN/wp-content/mu-plugins/sol-user-nav.php${NC}"
echo -e "    (mu-plugins = auto-load, không cần activate qua Admin)"

# ─── STEP 5: Test cả 2 URLs ─────────────────────
echo ""
echo -e "${YELLOW}[5/5] Test cả 2 URLs...${NC}"

# Test huongdi
HUONGDI_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://huongdi.sol.vn/ 2>/dev/null)
HUONGDI_JS=$(curl -s -o /dev/null -w "%{http_code}" https://huongdi.sol.vn/js/sol-user-nav.js 2>/dev/null)
echo -e "    huongdi.sol.vn/         → HTTP $HUONGDI_TEST"
echo -e "    huongdi.sol.vn/js/sol-user-nav.js → HTTP $HUONGDI_JS"

# Test sol.vn
SOLVN_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://sol.vn/ 2>/dev/null)
SCRIPT_ON_SOLVN=$(curl -s https://sol.vn/ 2>/dev/null | grep -c 'sol-user-nav.js' || echo "0")
echo -e "    sol.vn/                 → HTTP $SOLVN_TEST"
echo -e "    Script tag on sol.vn HTML → ${SCRIPT_ON_SOLVN} matches"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deploy Done — Widget live trên 2 domains  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test browser:${NC}"
echo -e "  1. ${YELLOW}https://sol.vn/${NC}"
echo -e "     → Góc phải: nút 'Vào Sol La Bàn →' (CTA vàng)"
echo -e ""
echo -e "  2. ${YELLOW}https://huongdi.sol.vn/${NC} (chưa đăng nhập)"
echo -e "     → Góc phải: nút 'Đăng nhập' (đen)"
echo -e ""
echo -e "  3. ${YELLOW}Login → https://huongdi.sol.vn/toi/${NC}"
echo -e "     → Góc phải: User pill (avatar + tên + tier)"
echo -e "     → Click → menu Dashboard, Bản đồ, Đăng xuất..."
echo -e ""
echo -e "${CYAN}Nếu widget KHÔNG hiện trên sol.vn:${NC}"
echo -e "  - Check console browser (F12) — CORS error?"
echo -e "  - Cần thêm CORS header (xem STEP 2)"
echo -e "  - Hoặc host JS trực tiếp trên sol.vn:"
echo -e "    sudo cp $HUONGDI/public/js/sol-user-nav.js $SOLVN/wp-content/uploads/sol-user-nav.js"
echo -e "    (Rồi sửa mu-plugin URL thành /wp-content/uploads/sol-user-nav.js)"
