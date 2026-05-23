#!/bin/bash
# Install Nginx config cho Sol Widget v0.2 trên VPS
# Run on VPS: sudo bash install-nginx.sh

set -e

BACKUP_DIR="/root/nginx-backups"
mkdir -p "$BACKUP_DIR"

# Backup current config
if [ -f /etc/nginx/sites-enabled/bothuocla.sol.vn ]; then
  BACKUP_FILE="$BACKUP_DIR/bothuocla.sol.vn-$(date +%Y%m%d-%H%M%S).conf"
  cp /etc/nginx/sites-enabled/bothuocla.sol.vn "$BACKUP_FILE"
  echo "✓ Backed up old config to $BACKUP_FILE"
fi

# Apply new config
cp /var/www/sol-widget/nginx-sol-widget.conf /etc/nginx/sites-enabled/bothuocla.sol.vn

# Test config
echo ""
echo "Testing nginx config..."
nginx -t

# Reload
echo ""
echo "Reloading nginx..."
systemctl reload nginx

echo ""
echo "✅ Nginx config applied!"
echo "Test: curl -I https://bothuocla.sol.vn"
