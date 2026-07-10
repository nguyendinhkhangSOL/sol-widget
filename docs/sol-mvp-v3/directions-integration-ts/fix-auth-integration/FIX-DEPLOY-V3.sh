#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# FIX v3: Force add optionalAuth vào routes (code đã có req.user)
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

echo ""
echo -e "${CYAN}═══ FIX v3: Force-add optionalAuth middleware ═══${NC}"
echo ""

# ─── 1. Show current router signatures ──────────────────────
echo -e "${YELLOW}[1/5] Current router signatures:${NC}"
for f in p1.ts p2.ts events.ts; do
    fpath="$BACKEND/src/routes/$f"
    if [ -f "$fpath" ]; then
        echo -e "  ${CYAN}$f:${NC}"
        grep -n "router\.\(post\|get\)" "$fpath" | head -5 || echo "    (nothing)"
    fi
done
echo ""

# ─── 2. Force patch với multiline-aware regex ───────────────
echo -e "${YELLOW}[2/5] Force patch — inject optionalAuth...${NC}"

python3 << 'PYEOF'
import re
import os

BACKEND = '/var/www/huongdi/backend/src/routes'
targets = ['p1.ts', 'p2.ts', 'events.ts', 'directions.ts']

for fname in targets:
    fpath = os.path.join(BACKEND, fname)
    if not os.path.exists(fpath):
        print(f"  ⏭  {fname} not found")
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    reasons = []

    # ─── A. Import optionalAuth ──────────────────────────────
    if 'optional-auth' not in content and 'optionalAuth' not in content:
        # Add import after last import
        m = list(re.finditer(r"^import.*$", content, re.MULTILINE))
        if m:
            last = m[-1]
            insert_pos = last.end()
            content = (content[:insert_pos] +
                       "\nimport { optionalAuth } from '../middleware/optional-auth';" +
                       content[insert_pos:])
            reasons.append("import optionalAuth")

    # ─── B. Force apply optionalAuth to ALL router.post/get ──
    # Match pattern: router.post('...', <no middleware>, async  OR  router.post('...', async
    # Handle both single-line and multi-line signatures
    # Approach: find all `router.<method>(` and check what follows

    method_pattern = re.compile(
        r"(router\.(post|get|put|delete|patch)\(\s*['\"][^'\"]+['\"]\s*,\s*)",
        re.MULTILINE
    )

    def inject_middleware(m):
        prefix = m.group(0)  # e.g. "router.post('/result', "
        # Get the next non-whitespace token to check
        return prefix  # Placeholder, we'll do manual replacement below

    # Manual scan
    new_content = content
    matches = list(method_pattern.finditer(content))
    # Iterate reversed to keep positions
    for m in reversed(matches):
        end = m.end()
        # Check next 200 chars for optionalAuth
        rest = content[end:end + 200]
        # If already has optionalAuth in first 100 chars, skip
        if re.match(r'\s*optionalAuth\s*,', rest):
            continue
        # If next token is `requireAuth` or other middleware, still add optionalAuth after
        # For now: if `async` is right after → inject optionalAuth
        # If middleware(s) present → skip (already protected)
        if re.match(r'\s*async\s*\(', rest):
            # Insert optionalAuth right after the prefix
            new_content = new_content[:end] + "optionalAuth, " + new_content[end:]
            reasons.append(f"apply optionalAuth to {m.group(0)[:40]}...")

    content = new_content

    # ─── Write back ──────────────────────────────────────────
    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {fname}: {'; '.join(reasons)}")
    else:
        print(f"  ⏭  {fname}: no changes (already protected)")
PYEOF

# ─── 3. Verify patch ────────────────────────────────────────
echo -e "${YELLOW}[3/5] Verify optionalAuth applied...${NC}"
for f in p1.ts p2.ts events.ts; do
    fpath="$BACKEND/src/routes/$f"
    if grep -q "optionalAuth" "$fpath" 2>/dev/null; then
        LINES=$(grep -c "optionalAuth" "$fpath")
        echo -e "    ${GREEN}✅ $f: $LINES occurrence(s)${NC}"
    else
        echo -e "    ${RED}❌ $f: NO optionalAuth found${NC}"
    fi
done

# ─── 4. Build + restart ─────────────────────────────────────
echo -e "${YELLOW}[4/5] Build + PM2 restart...${NC}"
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ] || echo "$BUILD_LOG" | grep -q "error TS"; then
    echo -e "${RED}❌ Build FAILED:${NC}"
    echo "$BUILD_LOG" | tail -20
    exit 1
fi
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Build + restart OK${NC}"

# ─── 5. Smoke test ──────────────────────────────────────────
echo -e "${YELLOW}[5/5] Smoke test P1 với JWT...${NC}"
JWT=$(curl -s -X POST http://localhost:4001/api/auth/login-v2 \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@sol.vn","password":"huongdi2026!"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")

if [ -z "$JWT" ]; then
    echo -e "    ${RED}❌ Không login được${NC}"
    exit 1
fi
echo -e "    ${CYAN}JWT: ${JWT:0:40}...${NC}"

RES=$(curl -s -X POST http://localhost:4001/api/p1/result \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"test-fix-v3","people":50,"expert":80,"builder":60,"independent":75,"rank1":"expert","rank2":"independent","rank3":"builder","rank4":"people","rawAnswers":{"test":true}}')

echo -e "    ${CYAN}Response: $RES${NC}"

# Verify via DB
sleep 1
DB_CHECK=$(sudo -u postgres psql huongdi_prod -t -A -c \
  "SELECT id, user_id, session_id FROM p1_results WHERE session_id='test-fix-v3' ORDER BY created_at DESC LIMIT 1;")

echo -e "    ${CYAN}DB: $DB_CHECK${NC}"

if echo "$DB_CHECK" | grep -qE "^[a-f0-9-]+\|[a-f0-9-]+\|"; then
    echo -e "    ${GREEN}✅ P1 LINKED WITH USER — Auth integration WORKING!${NC}"
else
    echo -e "    ${YELLOW}⚠  P1 saved nhưng user_id NULL${NC}"
    echo ""
    echo -e "${YELLOW}Debug: check pm2 logs cho error${NC}"
    pm2 logs huongdi-api --lines 10 --nostream | tail -15
fi

# Cleanup
sudo -u postgres psql huongdi_prod -c "DELETE FROM p1_results WHERE session_id='test-fix-v3';" > /dev/null 2>&1

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FIX v3 COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
