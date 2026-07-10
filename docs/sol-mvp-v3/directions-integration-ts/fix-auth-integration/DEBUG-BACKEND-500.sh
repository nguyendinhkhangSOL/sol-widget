#!/bin/bash
# Debug backend 500 error trên /api/directions/list

echo "═══ 1. PM2 error logs mới nhất ═══"
pm2 logs huongdi-api --lines 40 --nostream --err 2>&1 | tail -50
echo ""

echo "═══ 2. PM2 stdout logs mới nhất ═══"
pm2 logs huongdi-api --lines 20 --nostream --out 2>&1 | tail -30
echo ""

echo "═══ 3. Force call /api/directions/list và capture stderr ═══"
curl -v http://localhost:4001/api/directions/list 2>&1 | tail -30
echo ""

echo "═══ 4. Route file content — directions.ts ═══"
if [ -f /var/www/huongdi/backend/src/routes/directions.ts ]; then
    grep -n "router.get\|router.post\|optionalAuth" /var/www/huongdi/backend/src/routes/directions.ts | head -10
fi
echo ""

echo "═══ 5. Check optional-auth.ts content ═══"
if [ -f /var/www/huongdi/backend/src/middleware/optional-auth.ts ]; then
    head -20 /var/www/huongdi/backend/src/middleware/optional-auth.ts
else
    echo "  ❌ optional-auth.ts NOT FOUND"
fi
echo ""

echo "═══ 6. Check compiled JS optional-auth ═══"
if [ -f /var/www/huongdi/backend/dist/middleware/optional-auth.js ]; then
    echo "  ✅ Compiled exists"
    head -20 /var/www/huongdi/backend/dist/middleware/optional-auth.js
else
    echo "  ❌ /dist/middleware/optional-auth.js NOT FOUND — build lỗi"
fi
