#!/bin/bash
# Audit toàn bộ paywall system — xem tier check ở đâu

PUBLIC="/var/www/huongdi/public"

echo "═══ 1. sol-auth.js hiện tại (ROOT + /js/) ═══"
for path in "$PUBLIC/sol-auth.js" "$PUBLIC/js/sol-auth.js"; do
    if [ -f "$path" ]; then
        echo ""
        echo ">>> $path (size: $(stat -c '%s' $path))"
        echo "----------------------------------------"
        head -60 "$path"
        echo "..."
        echo "Contains: getJwt=$(grep -c getJwt $path) | tier=$(grep -c tier $path) | isPaidTier=$(grep -c isPaidTier $path)"
    fi
done

echo ""
echo "═══ 2. Paywall logic trong la-ban-huong-di/index.html ═══"
if [ -f "$PUBLIC/la-ban-huong-di/index.html" ]; then
    grep -n "lock\|paywall\|tier\|isActive\|sol_active\|isPaid\|SolAuth" "$PUBLIC/la-ban-huong-di/index.html" | head -30
fi

echo ""
echo "═══ 3. Paywall logic trong prompts/index.html ═══"
if [ -f "$PUBLIC/prompts/index.html" ]; then
    grep -n "lock\|paywall\|tier\|isActive\|sol_active\|SolAuth" "$PUBLIC/prompts/index.html" | head -30
fi

echo ""
echo "═══ 4. Search sol_active flag toàn public ═══"
grep -rln "sol_active\|localStorage.sol_tier" "$PUBLIC" --include="*.js" --include="*.html" | head -10

echo ""
echo "═══ 5. Search tier check patterns ═══"
grep -rln "tier.*===\|tier.*==" "$PUBLIC" --include="*.js" --include="*.html" | head -10
