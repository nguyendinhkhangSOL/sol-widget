#!/bin/bash
# Deploy Sub-C Frontend: /kich-hoat page + smart checkout snippet
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"

echo -e "${CYAN}═══ Deploy Sub-C Frontend ═══${NC}"
echo ""

# ─── 1. Create /kich-hoat/ page ────
echo -e "${YELLOW}[1/3] Deploy /kich-hoat/index.html${NC}"
if [ ! -f "/tmp/kich-hoat-index.html" ]; then
    echo "❌ /tmp/kich-hoat-index.html not found. scp lên trước!"
    exit 1
fi
sudo mkdir -p "$PUBLIC/kich-hoat"
sudo cp /tmp/kich-hoat-index.html "$PUBLIC/kich-hoat/index.html"
sudo chown www-data:www-data "$PUBLIC/kich-hoat/index.html"
echo -e "   ${GREEN}✓ $PUBLIC/kich-hoat/index.html${NC}"

# ─── 2. Backup existing /thanh-toan/ ────
echo ""
echo -e "${YELLOW}[2/3] Backup existing /thanh-toan/index.html${NC}"
if [ -f "$PUBLIC/thanh-toan/index.html" ]; then
    sudo cp "$PUBLIC/thanh-toan/index.html" "$PUBLIC/thanh-toan/index.html.bak-$(date +%s)"
    echo -e "   ${GREEN}✓ Backup created${NC}"
fi

# ─── 3. Print instructions cho integrate snippet ────
echo ""
echo -e "${YELLOW}[3/3] Manual integrate smart checkout snippet${NC}"
echo ""
echo -e "${CYAN}Anh cần thêm 3 elements vào file $PUBLIC/thanh-toan/index.html:${NC}"
echo ""
echo -e "  1. Modal HTML — Paste TRƯỚC </body> (từ tmp/thanh-toan-smart-snippet.html)"
echo -e "  2. Info banner — Paste TRƯỚC form checkout"
echo -e "  3. <script id='sol-checkout-smart'> — Paste NGAY TRƯỚC </body>"
echo ""
echo -e "${YELLOW}Đảm bảo form có các fields:${NC}"
echo -e "  - <input id='email' name='email' ...>"
echo -e "  - <input id='sdt' name='sdt' ...>  (hoặc name='phone')"
echo -e "  - <input id='ten' name='ten' ...>  (hoặc name='name')"
echo -e "  - <input id='zalo' name='zalo' ...>  (optional)"
echo -e "  - <input name='goi' value='active|founder' ...>"
echo -e "  - <form id='checkout-form'> ...  (hoặc form đầu tiên trong page)"
echo ""
echo -e "${CYAN}Xem full snippet:${NC}"
echo -e "  cat /tmp/thanh-toan-smart-snippet.html"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Sub-C Frontend base deployed                ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test /kich-hoat page:${NC}"
echo -e "  https://huongdi.sol.vn/kich-hoat/?token=<magic_token>"
echo -e ""
echo -e "${CYAN}Nếu chưa có magic_token, gen 1 cái để test:${NC}"
echo -e '  sudo -u postgres psql huongdi_prod -c "'
echo -e '    UPDATE leads SET '
echo -e '      magic_token = md5(random()::text || id::text),'
echo -e '      magic_sent_at = NOW(),'
echo -e '      expires_at = NOW() + INTERVAL '"'"'7 days'"'"''
echo -e '    WHERE email = '"'"'test-batch-a@sol.vn'"'"' RETURNING magic_token;'
echo -e '  "'
