#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# HUONGDI.SOL.VN — Deploy Pillar Page
# ═══════════════════════════════════════════════════════════════════════
#
# Usage:
#   bash deploy-pillar.sh <pillar-md-filename> <slug>
#
# Example:
#   bash deploy-pillar.sh pillar-01-freelancer-chuyen-mon.md freelancer-chuyen-mon-tuoi-45
#
# Pre-requisites trên VPS (chạy 1 lần):
#   cd /tmp/huongdi-pillar-deploy
#   npm install marked
# ═══════════════════════════════════════════════════════════════════════

set -e

PILLAR_FILE="${1:-}"
SLUG="${2:-}"

if [ -z "$PILLAR_FILE" ] || [ -z "$SLUG" ]; then
    echo "Usage: bash deploy-pillar.sh <pillar-md-filename> <slug>"
    exit 1
fi

WORK_DIR="/tmp/huongdi-pillar-deploy"
INPUT_MD="$WORK_DIR/content/$PILLAR_FILE"
OUTPUT_HTML="/var/www/huongdi/public/$SLUG/index.html"
SITEMAP="/var/www/huongdi/public/sitemap.xml"
NEW_URL="https://huongdi.sol.vn/$SLUG/"

echo "═══════════════════════════════════════════════════════════════════"
echo "  DEPLOY PILLAR PAGE"
echo "═══════════════════════════════════════════════════════════════════"
echo "Markdown:    $INPUT_MD"
echo "Slug:        $SLUG"
echo "Output HTML: $OUTPUT_HTML"
echo "URL:         $NEW_URL"
echo ""

# Check input exists
if [ ! -f "$INPUT_MD" ]; then
    echo "❌ Pillar MD file not found: $INPUT_MD"
    exit 1
fi

# Check marked installed
if [ ! -d "$WORK_DIR/node_modules/marked" ]; then
    echo "📦 Installing 'marked' package..."
    cd "$WORK_DIR"
    npm install marked
    cd - > /dev/null
fi

# Backup existing if any
if [ -f "$OUTPUT_HTML" ]; then
    BAK="$OUTPUT_HTML.bak.$(date +%Y%m%d-%H%M%S)"
    sudo cp "$OUTPUT_HTML" "$BAK"
    echo "💾 Backed up existing: $BAK"
fi

# Convert MD → HTML
echo ""
echo "── 1. Converting Markdown → HTML ────────────────────────────────"
sudo mkdir -p "$(dirname $OUTPUT_HTML)"
node "$WORK_DIR/convert-pillar-to-html.js" "$INPUT_MD" "/tmp/pillar-output.html"
sudo mv /tmp/pillar-output.html "$OUTPUT_HTML"
sudo chmod 644 "$OUTPUT_HTML"
sudo chown www-data:www-data "$OUTPUT_HTML" 2>/dev/null || true
echo "✅ Generated: $OUTPUT_HTML"

# Update sitemap
echo ""
echo "── 2. Updating sitemap.xml ──────────────────────────────────────"
sudo node "$WORK_DIR/update-sitemap.js" "$SITEMAP" "$NEW_URL" 0.9

# Set permissions for parent dir (nginx www-data needs traverse)
echo ""
echo "── 3. Setting permissions ───────────────────────────────────────"
sudo chmod o+x "/var/www/huongdi/public/$SLUG"
echo "✅ Permission OK"

# Verify
echo ""
echo "── 4. Verify deployment ─────────────────────────────────────────"
sleep 1
HTTP_CODE=$(curl -sI "$NEW_URL" -o /dev/null -w '%{http_code}')
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ URL accessible: $NEW_URL (HTTP $HTTP_CODE)"
else
    echo "⚠️  URL returned HTTP $HTTP_CODE — check nginx config"
fi

echo ""
echo "── 5. Content checks ────────────────────────────────────────────"
echo "  Title: $(curl -s $NEW_URL | grep -oP '<title>[^<]+' | head -1)"
echo "  H1:    $(curl -s $NEW_URL | grep -oP '<h1[^>]*>[^<]+' | head -1)"
echo "  JSON-LD: $(curl -s $NEW_URL | grep -c 'application/ld+json') schemas"
echo "  Header: $(curl -s $NEW_URL | grep -c 'SOL-HEADER-START') markers"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ PILLAR DEPLOYED: $NEW_URL"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Test browser: $NEW_URL"
echo "  2. Submit URL to GSC: https://search.google.com/search-console"
echo "     → URL Inspection → $NEW_URL → Request Indexing"
echo "  3. Share lên LinkedIn/Facebook để tạo backlink + signal"
