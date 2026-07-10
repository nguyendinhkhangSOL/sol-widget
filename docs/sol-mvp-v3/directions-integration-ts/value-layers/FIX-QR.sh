#!/bin/bash
# Quick fix: remove QRCode CDN + suppress alert
set -e

PUBLIC="/var/www/huongdi/public"

echo "═══ Fix QRCode CSP + alert ═══"

if [ -f /tmp/ban-do-index.html ]; then
    sudo cp /tmp/ban-do-index.html "$PUBLIC/toi/ban-do/index.html"
    sudo chown www-data:www-data "$PUBLIC/toi/ban-do/index.html" 2>/dev/null || true
    echo "✅ Deployed fixed ban-do/index.html"
else
    echo "❌ /tmp/ban-do-index.html missing"
    exit 1
fi

echo ""
echo "Verify DNA scores trong DB..."
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT user_id, session_id, people, expert, builder, independent, created_at
FROM p1_results
WHERE user_id IS NOT NULL
ORDER BY created_at DESC LIMIT 3;
EOF
