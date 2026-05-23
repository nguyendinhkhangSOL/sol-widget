#!/bin/bash
# =================================================================
# Setup admin.sol.vn subdomain
# Run on VPS: bash /var/www/sol-widget/scripts/setup-admin-subdomain.sh
#
# Prerequisites:
#   1. DNS A record admin.sol.vn → 103.72.57.11 (set ở Cloudflare)
#   2. Cloudflare proxy: DNS only (xám) trong khi Certbot chạy
# =================================================================

set -e

DOMAIN="admin.sol.vn"
EMAIL="nguyendinhkhang@gmail.com"
APP_DIR="/var/www/sol-widget"

echo ""
echo "=== Setup $DOMAIN ==="
echo ""

# Check DNS
echo "[1/4] Verify DNS..."
DNS_IP=$(dig +short A $DOMAIN @8.8.8.8 | tail -1)
VPS_IP=$(curl -s ifconfig.me)
if [ -z "$DNS_IP" ]; then
    echo "  ERROR: DNS chưa có A record cho $DOMAIN"
    echo "  Vào Cloudflare → sol.vn → DNS → Add record: A admin → $VPS_IP"
    echo "  ⚠️ TẠM CHUYỂN PROXY SANG DNS-ONLY (xám) khi chạy Certbot"
    exit 1
fi
echo "  ✓ DNS: $DOMAIN → $DNS_IP"
echo "  (VPS IP: $VPS_IP — nếu khác $DNS_IP có thể đang proxied qua Cloudflare)"

# Install Nginx config
echo ""
echo "[2/4] Install Nginx config..."
sudo cp $APP_DIR/nginx-admin-sol-vn.conf /etc/nginx/sites-enabled/admin.sol.vn

# Tạm thời comment SSL block để Certbot có thể chạy lần đầu
sudo sed -i '/listen 443 ssl/,/^}/{/.*/{s/^/#/}}' /etc/nginx/sites-enabled/admin.sol.vn || true

# Test
sudo nginx -t
sudo systemctl reload nginx
echo "  ✓ Nginx config OK"

# Certbot
echo ""
echo "[3/4] Generate SSL with Certbot..."
echo "  ⚠️ Đảm bảo Cloudflare proxy = DNS-only (xám) cho $DOMAIN"
echo "  Đợi 5 giây..."
sleep 5

sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

# Re-apply full config (uncomment SSL)
sudo cp $APP_DIR/nginx-admin-sol-vn.conf /etc/nginx/sites-enabled/admin.sol.vn
sudo nginx -t
sudo systemctl reload nginx
echo "  ✓ SSL generated, full Nginx config applied"

# Restart Sol Widget để load middleware mới
echo ""
echo "[4/4] Restart Sol Widget (load middleware)..."
pm2 restart sol-widget --update-env
sleep 3
pm2 list | grep sol-widget
echo "  ✓ PM2 restarted"

echo ""
echo "=== DONE! ==="
echo ""
echo "Test: curl -I https://$DOMAIN"
echo "Browser: https://$DOMAIN → login với admin key"
echo ""
echo "⚠️ NHỚ: BẬT LẠI Cloudflare proxy (cam) cho $DOMAIN + chuyển SSL/TLS → Full (strict)"
echo ""
