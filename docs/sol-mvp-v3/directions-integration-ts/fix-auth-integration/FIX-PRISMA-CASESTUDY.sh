#!/bin/bash
# Fix Prisma schema mismatch trong directions.ts
# CaseStudy field: isPublished (Bool), không phải status enum
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

echo "═══ FIX Prisma CaseStudy field mismatch ═══"

# ─── 1. Show line 89 context ──────────────────────────
echo ""
echo "[1/4] Context around directions.ts:89..."
sed -n '80,100p' "$BACKEND/src/routes/directions.ts"

# ─── 2. Patch ────────────────────────────────────────
echo ""
echo "[2/4] Patch directions.ts..."
python3 << 'PYEOF'
import re

fpath = '/var/www/huongdi/backend/src/routes/directions.ts'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content
changes = []

# Fix 1: status: "PUBLISHED" → isPublished: true (in caseStudies context)
# Match pattern: caseStudies: { where: { status: "PUBLISHED" ... } }
new_content = re.sub(
    r'(caseStudies\s*:\s*\{\s*where\s*:\s*\{\s*)status\s*:\s*[\'\"]PUBLISHED[\'\"]',
    r'\1isPublished: true',
    content
)
if new_content != content:
    content = new_content
    changes.append("caseStudies.where: status → isPublished")

# Fix 2: publishedAt → createdAt (nếu CaseStudy không có publishedAt)
new_content = re.sub(
    r'(caseStudies[^}]*orderBy\s*:\s*\{\s*)publishedAt(\s*:\s*[\'\"]desc[\'\"])',
    r'\1createdAt\2',
    content,
    flags=re.DOTALL
)
if new_content != content:
    content = new_content
    changes.append("caseStudies.orderBy: publishedAt → createdAt")

if content != original:
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Changes:", ", ".join(changes))
else:
    print("  ⏭  No changes (patterns not found)")
    # Debug: show current query context
    idx = content.find('caseStudies:')
    if idx > 0:
        print("  Current caseStudies query:")
        print(content[idx:idx+400])
PYEOF

# ─── 3. Rebuild + restart ────────────────────────────
echo ""
echo "[3/4] Build + PM2 restart..."
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ]; then
    echo -e "${RED}❌ Build failed:${NC}"
    echo "$BUILD_LOG" | tail -20
    exit 1
fi
echo -e "${GREEN}✅ Build OK${NC}"

pm2 restart huongdi-api > /dev/null
sleep 2

# ─── 4. Smoke test ─────────────────────────────────────
echo ""
echo "[4/4] Smoke test /api/directions/list..."
RES=$(curl -s http://localhost:4001/api/directions/list)
COUNT=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 'ERROR: '+str(d)[:100])")

if [[ "$COUNT" =~ ^[0-9]+$ ]] && [ "$COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ /api/directions/list returned $COUNT directions${NC}"
    # Show first direction sample
    echo "First direction:"
    echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d[0], ensure_ascii=False, indent=2)[:400])"
else
    echo -e "${RED}❌ Still error: $COUNT${NC}"
    pm2 logs huongdi-api --lines 15 --nostream --err | tail -20
fi

echo ""
echo -e "${GREEN}═══ Done ═══${NC}"
echo "Test browser: hard refresh /la-ban-huong-di/"
