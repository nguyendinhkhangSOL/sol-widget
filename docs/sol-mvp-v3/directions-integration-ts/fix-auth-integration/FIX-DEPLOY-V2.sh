#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# FIX v2: Restore + Patch với REPLACE logic (không duplicate userId)
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

echo ""
echo -e "${CYAN}═══ FIX v2: Restore + Smart Patch ═══${NC}"
echo ""

# ─── 1. Restore từ backup mới nhất ─────────────────────────
LATEST_BACKUP=$(ls -td /var/backups/huongdi/fix-auth-* 2>/dev/null | head -1)
if [ -z "$LATEST_BACKUP" ] || [ ! -d "$LATEST_BACKUP/routes.bak" ]; then
    echo -e "${RED}❌ Không tìm thấy backup routes${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/5] Restore routes từ backup: $LATEST_BACKUP${NC}"
sudo cp -r "$LATEST_BACKUP/routes.bak/"* "$BACKEND/src/routes/"
sudo chown -R $(stat -c '%U:%G' "$BACKEND/src/") "$BACKEND/src/routes/"
echo -e "    ${GREEN}✅ Restored${NC}"

# ─── 2. Diagnose: xem userId đã có trong file như thế nào ──
echo -e "${YELLOW}[2/5] Diagnose existing userId patterns...${NC}"
for f in p1.ts p2.ts events.ts; do
    fpath="$BACKEND/src/routes/$f"
    if [ -f "$fpath" ]; then
        echo -e "  ${CYAN}$f:${NC}"
        grep -n "userId" "$fpath" | head -5 || echo "    (no userId found)"
    fi
done

# ─── 3. Smart patch: REPLACE existing userId với req.user?.userId ──
echo -e "${YELLOW}[3/5] Smart patch — REPLACE (không INSERT)...${NC}"

python3 << 'PYEOF'
import re
import os

BACKEND = '/var/www/huongdi/backend/src/routes'
targets = ['p1.ts', 'p2.ts', 'events.ts']

for fname in targets:
    fpath = os.path.join(BACKEND, fname)
    if not os.path.exists(fpath):
        print(f"  ⏭  {fname} not found — skip")
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changed_reasons = []

    # ─── A. Add optionalAuth import if not exists ────────────
    if 'optionalAuth' not in content:
        imports = re.findall(r"^import.*$", content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            content = content.replace(
                last_import,
                last_import + "\nimport { optionalAuth } from '../middleware/optional-auth';"
            )
            changed_reasons.append("added optionalAuth import")

    # ─── B. Apply optionalAuth to POST routes ─────────────────
    # router.post('/', async (req  →  router.post('/', optionalAuth, async (req
    # router.post('/result', async  →  router.post('/result', optionalAuth, async
    def add_middleware(match):
        full = match.group(0)
        if 'optionalAuth' in full:
            return full
        return full.replace('async (', 'optionalAuth, async (', 1)

    new_content = re.sub(
        r"router\.post\(['\"][^'\"]*['\"],\s*async\s+\(",
        add_middleware,
        content
    )
    if new_content != content:
        content = new_content
        changed_reasons.append("added optionalAuth to POST routes")

    # ─── C. REPLACE existing userId assignment với req.user?.userId ──
    # Patterns to REPLACE:
    #   userId: null,
    #   userId: req.body.userId,
    #   userId: req.body.userId || null,
    #   userId: undefined,
    #   userId: userId,
    # ALL → userId: (req as any).user?.userId || (req.body?.userId || null),

    replacement = "userId: (req as any).user?.userId || (req.body?.userId ?? null),"

    patterns = [
        r'userId:\s*null\s*,',
        r'userId:\s*undefined\s*,',
        r'userId:\s*req\.body\.userId\s*,',
        r'userId:\s*req\.body\.userId\s*\|\|\s*null\s*,',
        r'userId:\s*userId\s*,',
        r'userId:\s*[a-zA-Z_][a-zA-Z0-9_]*\s*,',  # any single var assignment
    ]

    for pat in patterns:
        new_content, n = re.subn(pat, replacement, content)
        if n > 0:
            content = new_content
            changed_reasons.append(f"REPLACED {n} userId assignment(s)")
            break  # Only first pattern matched

    # ─── Write back ──────────────────────────────────────────
    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {fname}: {', '.join(changed_reasons)}")
    else:
        print(f"  ⏭  {fname}: no changes")

# Also handle directions.ts if it has optionalAuth pending
dpath = os.path.join(BACKEND, 'directions.ts')
if os.path.exists(dpath):
    with open(dpath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'optionalAuth' not in content:
        imports = re.findall(r"^import.*$", content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            content = content.replace(
                last_import,
                last_import + "\nimport { optionalAuth } from '../middleware/optional-auth';"
            )
            # Add to POST/GET routes
            content = re.sub(
                r"router\.(post|get)\((['\"][^'\"]*['\"]),\s*async\s+\(",
                r"router.\1(\2, optionalAuth, async (",
                content
            )
            with open(dpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print("  ✅ directions.ts: added optionalAuth")
PYEOF

# ─── 4. Build ────────────────────────────────────────────────
echo -e "${YELLOW}[4/5] npm run build...${NC}"
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ] || echo "$BUILD_LOG" | grep -q "error TS"; then
    echo -e "${RED}❌ Build FAILED:${NC}"
    echo "$BUILD_LOG" | tail -30
    echo ""
    echo -e "${YELLOW}Xem file gây lỗi:${NC}"
    echo "$BUILD_LOG" | grep "error TS" | head -5
    exit 1
fi
echo -e "    ${GREEN}✅ Build OK${NC}"

# ─── 5. PM2 restart + smoke test ──────────────────────────
echo -e "${YELLOW}[5/5] PM2 restart + verify...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2

# Verify với JWT
JWT=$(curl -s -X POST http://localhost:4001/api/auth/login-v2 \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@sol.vn","password":"huongdi2026!"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")

# Test POST /p1/result với JWT
if [ -n "$JWT" ]; then
    RES=$(curl -s -X POST http://localhost:4001/api/p1/result \
      -H "Authorization: Bearer $JWT" \
      -H 'Content-Type: application/json' \
      -d '{"sessionId":"test-fix-auth","people":50,"expert":80,"builder":60,"independent":75,"rank1":"expert","rank2":"independent","rank3":"builder","rank4":"people","rawAnswers":{"test":true}}')

    if echo "$RES" | grep -q '"id"'; then
        USER_ID=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('userId','NULL'))")
        P1_ID=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','?'))")
        if [ "$USER_ID" != "NULL" ] && [ "$USER_ID" != "None" ]; then
            echo -e "    ${GREEN}✅ P1 with JWT → userId=$USER_ID (LINKED!)${NC}"
        else
            echo -e "    ${YELLOW}⚠  P1 saved (id=$P1_ID) nhưng userId vẫn NULL${NC}"
            echo -e "    ${YELLOW}Response: $RES${NC}"
        fi
        # Cleanup test data
        sudo -u postgres psql huongdi_prod -c "DELETE FROM p1_results WHERE session_id='test-fix-auth';" > /dev/null 2>&1
    else
        echo -e "    ${YELLOW}⚠  P1 test failed: $RES${NC}"
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FIX v2 COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Now hard refresh browser + login lại → làm P1${NC}"
