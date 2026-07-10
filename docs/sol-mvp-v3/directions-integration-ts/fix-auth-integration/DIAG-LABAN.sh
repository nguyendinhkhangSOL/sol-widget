#!/bin/bash
# Diagnostic: Xem tại sao /la-ban-huong-di/ stuck loading

PUBLIC="/var/www/huongdi/public"

echo "═══ 1. API /directions/list response ═══"
curl -s https://huongdi.sol.vn/api/directions/list 2>&1 | head -c 500
echo ""
echo ""

echo "═══ 2. API /directions/list count ═══"
COUNT=$(curl -s https://huongdi.sol.vn/api/directions/list | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 'not-array:'+str(type(d)))")
echo "Count: $COUNT"
echo ""

echo "═══ 3. Direction routes trong index.ts ═══"
grep "api/directions\|app.use.*directions" /var/www/huongdi/backend/src/index.ts
echo ""

echo "═══ 4. Load logic trong la-ban-huong-di/index.html ═══"
# Tìm phần JS loading directions
grep -n "SolLoadDirections\|api/directions\|scr on\|loading\|renderCards\|analyzing" "$PUBLIC/la-ban-huong-di/index.html" | head -20
echo ""

echo "═══ 5. Console errors mock — check syntax của inline JS ═══"
# Extract inline <script> content và check syntax
python3 << 'PYEOF'
import re

with open('/var/www/huongdi/public/la-ban-huong-di/index.html', 'r') as f:
    content = f.read()

# Find inline scripts
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', content, re.DOTALL)
print(f"Inline scripts found: {len(scripts)}")

# Show first 30 lines của script cuối cùng (main logic)
if scripts:
    lines = scripts[-1].split('\n')
    print(f"Last inline script — {len(lines)} lines")
    print("─── First 40 lines: ───")
    for i, ln in enumerate(lines[:40], 1):
        print(f"  {i:3}: {ln[:120]}")
PYEOF
echo ""

echo "═══ 6. Test API với JWT của admin ═══"
JWT=$(curl -s -X POST http://localhost:4001/api/auth/login-v2 \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@sol.vn","password":"huongdi2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

echo "  JWT: ${JWT:0:30}..."
echo ""
echo "  /directions/list với JWT:"
curl -s https://huongdi.sol.vn/api/directions/list -H "Authorization: Bearer $JWT" | head -c 300
echo ""
