#!/bin/bash
# Fix: publishedAt → createdAt trong directions.ts
set -e

BACKEND="/var/www/huongdi/backend"

echo "═══ Fix publishedAt → createdAt ═══"

python3 << 'PYEOF'
import re

fpath = '/var/www/huongdi/backend/src/routes/directions.ts'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Simple approach: publishedAt: 'desc' → createdAt: 'desc' (anywhere)
new_content = re.sub(
    r'publishedAt(\s*:\s*[\'\"]?(?:desc|asc)[\'\"]?)',
    r'createdAt\1',
    content
)

if new_content != content:
    content = new_content
    print("  ✅ Replaced publishedAt → createdAt")
else:
    print("  ⏭  Pattern not found")
    # Show context
    idx = content.find('publishedAt')
    if idx > 0:
        print("  Context:")
        print(content[max(0,idx-100):idx+100])

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "Build + restart..."
cd "$BACKEND"
npm run build 2>&1 | tail -5
pm2 restart huongdi-api > /dev/null
sleep 2

echo ""
echo "Smoke test /api/directions/list:"
RES=$(curl -s http://localhost:4001/api/directions/list)
COUNT=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 'ERROR: '+str(d)[:200])")

if [[ "$COUNT" =~ ^[0-9]+$ ]] && [ "$COUNT" -gt 0 ]; then
    echo "✅ Returned $COUNT directions!"
    echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('First:', d[0].get('name','?'), '·', d[0].get('slug','?'))"
else
    echo "❌ Still error: $COUNT"
    pm2 logs huongdi-api --lines 10 --nostream --err | tail -15
fi
