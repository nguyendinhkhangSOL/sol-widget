#!/bin/bash
# Fallback: Host sol-user-nav.js TRỰC TIẾP trên sol.vn (không cần CORS)
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

HUONGDI="/var/www/huongdi"
SOLVN="/var/www/sol.vn"

echo -e "${CYAN}═══ Host JS trực tiếp trên sol.vn ═══${NC}"

# 1. Copy JS vào sol.vn wp-content/uploads
sudo mkdir -p "$SOLVN/wp-content/uploads/sol"
sudo cp "$HUONGDI/public/js/sol-user-nav.js" "$SOLVN/wp-content/uploads/sol/sol-user-nav.js"
sudo chown www-data:www-data "$SOLVN/wp-content/uploads/sol/sol-user-nav.js"
echo -e "${GREEN}✅ Copied to sol.vn/wp-content/uploads/sol/sol-user-nav.js${NC}"

# 2. Update mu-plugin để dùng local URL
sudo tee "$SOLVN/wp-content/mu-plugins/sol-user-nav.php" > /dev/null << 'PHPEOF'
<?php
/**
 * Plugin Name: Sol User Nav Widget
 * Version: 3.0-local
 */
if (!defined('ABSPATH')) exit;

add_action('wp_footer', function() {
    if (is_admin() || is_login()) return;
    $version = '3.0.' . date('Ymd');
    echo "\n<!-- Sol User Nav v3 -->\n";
    echo '<script src="' . esc_url(content_url('/uploads/sol/sol-user-nav.js')) .
         '?v=' . esc_attr($version) . '" async></script>' . "\n";
}, 999);
PHPEOF

sudo chown www-data:www-data "$SOLVN/wp-content/mu-plugins/sol-user-nav.php"
echo -e "${GREEN}✅ mu-plugin updated (dùng local URL, không CORS)${NC}"

echo ""
echo -e "${CYAN}Test:${NC}"
echo -e "  ${YELLOW}https://sol.vn/wp-content/uploads/sol/sol-user-nav.js${NC}"
echo -e "  (mở trực tiếp → phải thấy code JS)"
echo -e ""
echo -e "  ${YELLOW}https://sol.vn/${NC}"
echo -e "  → Xem source, tìm 'sol-user-nav.js' — phải có ở </body>"
echo -e ""
echo -e "${CYAN}Update sau này:${NC}"
echo -e "  Mỗi lần sửa sol-user-nav.js trên huongdi → chạy lại script này"
echo -e "  Hoặc thêm cron sync 1h/lần"
