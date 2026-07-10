#!/bin/bash
# Diagnostic: SavedDirection có user_id đúng không?

echo "═══ 1. Recent saved_directions ═══"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT id, user_id, direction_id, match_score, created_at
FROM saved_directions
ORDER BY created_at DESC LIMIT 10;
EOF

echo ""
echo "═══ 2. Count saved by user_id ═══"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS linked,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS anonymous,
  COUNT(*) AS total
FROM saved_directions;
EOF

echo ""
echo "═══ 3. Routes có /saved endpoint ═══"
grep -rn "saved\|SavedDirection" /var/www/huongdi/backend/src/routes/*.ts | head -15

echo ""
echo "═══ 4. Check middleware apply cho save route ═══"
if [ -f /var/www/huongdi/backend/src/routes/saved.ts ]; then
    grep -n "router\|Auth\|save" /var/www/huongdi/backend/src/routes/saved.ts | head -10
else
    echo "  No saved.ts — check other files"
    grep -rn "prisma\.savedDirection\.create" /var/www/huongdi/backend/src/ | head -5
fi

echo ""
echo "═══ 5. admin user id ═══"
sudo -u postgres psql huongdi_prod -c "SELECT id, email, tier FROM users WHERE email='admin@sol.vn'"
