#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Deploy huongdi.sol.vn Landing Page (fixed sudo)
# ═══════════════════════════════════════════════════════════════════════

set -e

WWW=/var/www/huongdi/public
BACKUP=/var/backups/huongdi-landing-$(date +%Y%m%d_%H%M%S)

echo "═══════════════════════════════════════════════════════════════════"
echo "  Deploy Landing Page huongdi.sol.vn"
echo "═══════════════════════════════════════════════════════════════════"

# Check sources
for f in /tmp/landing-index.html /tmp/landing-style.css /tmp/landing-app.js; do
  [ ! -f "$f" ] && { echo "❌ Missing $f"; exit 1; }
done

# Backup existing nếu có (with sudo)
sudo mkdir -p "$BACKUP"
if [ -f "$WWW/index.html" ]; then
  sudo cp "$WWW/index.html" "$BACKUP/index.html"
  echo "✅ Backup old index.html → $BACKUP/"
fi
if [ -d "$WWW/css" ]; then
  sudo cp -r "$WWW/css" "$BACKUP/css" 2>/dev/null || true
fi
if [ -d "$WWW/js" ]; then
  sudo cp -r "$WWW/js" "$BACKUP/js" 2>/dev/null || true
fi

# Create folders (sudo)
sudo mkdir -p "$WWW/css" "$WWW/js"

# Deploy files (sudo)
echo "── Deploy index.html ──"
sudo cp /tmp/landing-index.html "$WWW/index.html"

echo "── Deploy css/style.css ──"
sudo cp /tmp/landing-style.css "$WWW/css/style.css"

echo "── Deploy js/app.js ──"
sudo cp /tmp/landing-app.js "$WWW/js/app.js"

# Ownership
sudo chown -R www-data:www-data "$WWW/index.html" "$WWW/css" "$WWW/js"
sudo chmod 644 "$WWW/index.html" "$WWW/css/style.css" "$WWW/js/app.js"

echo ""
echo "── Verify files ──"
ls -la "$WWW/index.html" "$WWW/css/style.css" "$WWW/js/app.js"

echo ""
echo "── HTTP test (after nginx reload, wait 1s) ──"
sleep 1
echo "  / :"
curl -s -o /dev/null -w "    Status %{http_code}\n" https://huongdi.sol.vn/
echo "  /css/style.css :"
curl -s -o /dev/null -w "    Status %{http_code}\n" https://huongdi.sol.vn/css/style.css
echo "  /js/app.js :"
curl -s -o /dev/null -w "    Status %{http_code}\n" https://huongdi.sol.vn/js/app.js
echo "  /kham-pha-ban-than/ :"
curl -s -o /dev/null -w "    Status %{http_code}\n" https://huongdi.sol.vn/kham-pha-ban-than/

echo ""
echo "── Page title verify ──"
curl -s https://huongdi.sol.vn/ | grep -oE '<title>[^<]+</title>' | head -1

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ DONE"
echo "═══════════════════════════════════════════════════════════════════"
