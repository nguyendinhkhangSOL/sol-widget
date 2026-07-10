#!/bin/bash
# Diagnostic: xem sol-api-sync.js đang ở đâu + version gì

echo "═══ Diagnose sol-api-sync.js ═══"
echo ""

echo "1. Tìm tất cả file sol-api-sync.js trên server:"
find /var/www/huongdi/public -name "sol-api-sync*.js" 2>/dev/null | while read f; do
    echo "   → $f"
    HAS_V2=$(grep -c "authHeaders\|v2" "$f" 2>/dev/null || echo "0")
    HAS_JWT=$(grep -c "getJwt\|sol_jwt" "$f" 2>/dev/null || echo "0")
    SIZE=$(stat -c '%s' "$f")
    echo "      Size: $SIZE bytes | 'authHeaders' occurrences: $HAS_V2 | 'sol_jwt': $HAS_JWT"
done
echo ""

echo "2. HTML files reference sol-api-sync:"
grep -rn "sol-api-sync" /var/www/huongdi/public/ --include="*.html" | head -10
echo ""

echo "3. Kiểm tra file HTML trang kham-pha-ban-than:"
if [ -d /var/www/huongdi/public/kham-pha-ban-than ]; then
    ls -la /var/www/huongdi/public/kham-pha-ban-than/ | head -10
    echo ""
    grep -n "sol-api-sync\|localStorage.setItem" /var/www/huongdi/public/kham-pha-ban-than/index.html 2>/dev/null | head -10
fi
echo ""

echo "4. Check content của sol-api-sync.js hiện tại:"
if [ -f /var/www/huongdi/public/js/sol-api-sync.js ]; then
    head -20 /var/www/huongdi/public/js/sol-api-sync.js
fi
