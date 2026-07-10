#!/bin/bash
# Deploy /thanh-toan/ về huongdi.sol.vn + config Nginx
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"

echo -e "${CYAN}═══ Deploy /thanh-toan/ on huongdi.sol.vn ═══${NC}"
echo ""

# ─── 1. Deploy HTML ────
echo -e "${YELLOW}[1/4] Deploy /thanh-toan/index.html${NC}"
if [ ! -f "/tmp/thanh-toan-index.html" ]; then
    echo "❌ /tmp/thanh-toan-index.html not found"
    exit 1
fi
sudo mkdir -p "$PUBLIC/thanh-toan"
if [ -f "$PUBLIC/thanh-toan/index.html" ]; then
    sudo cp "$PUBLIC/thanh-toan/index.html" "$PUBLIC/thanh-toan/index.html.bak-$(date +%s)"
fi
sudo cp /tmp/thanh-toan-index.html "$PUBLIC/thanh-toan/index.html"
sudo chown www-data:www-data "$PUBLIC/thanh-toan/index.html"
echo -e "   ${GREEN}✓ $PUBLIC/thanh-toan/index.html${NC}"

# ─── 2. Test URL ────
echo ""
echo -e "${YELLOW}[2/4] Test URL${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://huongdi.sol.vn/thanh-toan/ 2>/dev/null || echo "000")
echo -e "   https://huongdi.sol.vn/thanh-toan/ → HTTP $STATUS"

# ─── 3. Check nginx has thanh-toan location ────
echo ""
echo -e "${YELLOW}[3/4] Check Nginx config${NC}"
NGINX_CONF="/etc/nginx/sites-available/huongdi.sol.vn"
if [ -f "$NGINX_CONF" ]; then
    if sudo grep -q "location.*thanh-toan\|try_files" "$NGINX_CONF"; then
        echo -e "   ${GREEN}✓ Nginx routing OK (try_files handles static)${NC}"
    else
        echo -e "   ⚠  Check nginx config manually"
    fi
fi

# ─── 4. Print sol.vn integration steps ────
echo ""
echo -e "${YELLOW}[4/4] Sol.vn integration checklist${NC}"
echo ""
echo -e "${CYAN}Cần thao tác trên sol.vn (cPanel):${NC}"
echo ""
echo -e "  ${YELLOW}A. Update .htaccess trong /public_html/thanh-toan/${NC}"
echo -e "     Thêm 301 redirect ở đầu file .htaccess:"
echo ""
echo -e '     RewriteEngine On'
echo -e '     RewriteRule ^(.*)$ https://huongdi.sol.vn/thanh-toan/ [R=301,L]'
echo ""
echo -e "     Hoặc XÓA folder /public_html/thanh-toan/ (WordPress sẽ 404)"
echo -e "     rồi WordPress 301 handling tự động."
echo ""
echo -e "  ${YELLOW}B. Update tất cả links '/thanh-toan/' trong sol.vn:${NC}"
echo -e "     Search-replace trong DB WordPress:"
echo -e "     - '/thanh-toan/'                → 'https://huongdi.sol.vn/thanh-toan/'"
echo -e "     - 'https://sol.vn/thanh-toan/'  → 'https://huongdi.sol.vn/thanh-toan/'"
echo ""
echo -e "     Hoặc dùng plugin Better Search Replace / Search Replace DB"
echo ""
echo -e "  ${YELLOW}C. Files sol.vn cần update thủ công:${NC}"
echo -e "     - Menu header (sol-default-template.php)"
echo -e "     - Homepage V3 pricing CTAs"
echo -e "     - Blog posts (nếu có link cứng)"
echo -e "     - Email templates"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ /thanh-toan/ deployed on huongdi.sol.vn      ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test flow:${NC}"
echo -e "  1. Anonymous: mở https://huongdi.sol.vn/thanh-toan/"
echo -e "     → Phải redirect /dang-nhap/?next=... ngay lập tức"
echo ""
echo -e "  2. Logged in: login trước, sau đó vào /thanh-toan/"
echo -e "     → Form pre-fill email/phone/name readonly"
echo -e "     → Chỉ điền zalo + chọn gói + submit"
echo ""
echo -e "  3. Test tại: https://huongdi.sol.vn/thanh-toan/"
