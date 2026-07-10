#!/bin/bash
# Check CORS config trong backend + test cross-origin
set -e

echo "═══ Check CORS ═══"
echo ""

echo "[1] Grep cors config trong index.ts:"
sudo grep -n "cors\|origin" /var/www/huongdi/backend/src/index.ts 2>/dev/null | head -20 || echo "❌ Cors config not found"

echo ""
echo "[2] Test CORS preflight từ sol.vn → huongdi.sol.vn:"
curl -s -I -X OPTIONS https://huongdi.sol.vn/api/leads \
    -H "Origin: https://sol.vn" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    2>&1 | grep -iE "^(HTTP|access-control)" || echo "❌ No CORS headers returned"

echo ""
echo "[3] Test check-email từ browser sol.vn (simulate):"
curl -s -H "Origin: https://sol.vn" \
    "https://huongdi.sol.vn/api/user/check-email?email=test@test.com" \
    2>&1 | head -3

echo ""
echo "═══ Done ═══"
echo ""
echo "Nếu thiếu 'Access-Control-Allow-Origin: https://sol.vn' → cần add CORS."
