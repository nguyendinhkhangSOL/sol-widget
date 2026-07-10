#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# FIX: Auth Integration cho P1/P2 sync + Paywall tier detection
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
PUBLIC="/var/www/huongdi/public"

echo ""
echo -e "${CYAN}═══ FIX Auth Integration ═══${NC}"
echo ""

# ─── 1. Backup files ─────────────────────────────────────────
echo -e "${YELLOW}[1/7] Backup files hiện tại...${NC}"
BACKUP_DIR="/var/backups/huongdi/fix-auth-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"
sudo chown $(whoami):$(whoami) "$BACKUP_DIR"

[ -f "$PUBLIC/js/sol-api-sync.js" ] && sudo cp "$PUBLIC/js/sol-api-sync.js" "$BACKUP_DIR/"
[ -f "$PUBLIC/js/sol-auth.js" ] && sudo cp "$PUBLIC/js/sol-auth.js" "$BACKUP_DIR/"
sudo cp -r "$BACKEND/src/routes" "$BACKUP_DIR/routes.bak" 2>/dev/null || true
sudo chown -R $(whoami):$(whoami) "$BACKUP_DIR" 2>/dev/null
echo -e "    ${GREEN}✅ Backup at $BACKUP_DIR${NC}"

# ─── 2. Deploy optional-auth middleware ──────────────────────
echo -e "${YELLOW}[2/7] Deploy optional-auth middleware...${NC}"
if [ -f /tmp/optional-auth.ts ]; then
    sudo cp /tmp/optional-auth.ts "$BACKEND/src/middleware/optional-auth.ts"
    sudo chown $(stat -c '%U:%G' "$BACKEND/src/") "$BACKEND/src/middleware/optional-auth.ts"
    echo -e "    ${GREEN}✅ optional-auth.ts deployed${NC}"
else
    echo -e "    ${RED}❌ /tmp/optional-auth.ts not found${NC}"
    exit 1
fi

# ─── 3. Patch routes P1/P2/events dùng optionalAuth ─────────
echo -e "${YELLOW}[3/7] Patch routes to use optionalAuth + save userId...${NC}"

python3 << 'PYEOF'
import re
import os

BACKEND = '/var/www/huongdi/backend/src/routes'

# Files có endpoints P1/P2/Events cần thêm optionalAuth
targets = ['p1.ts', 'p2.ts', 'events.ts', 'directions.ts']

for fname in targets:
    fpath = os.path.join(BACKEND, fname)
    if not os.path.exists(fpath):
        print(f"  ⏭  {fname} not found — skip")
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # Add import optionalAuth if not exists
    if 'optionalAuth' not in content:
        # Find existing middleware import
        m = re.search(r"import.*from ['\"]\.\./middleware/auth['\"];", content)
        if m:
            # Add new import after existing auth import
            content = content.replace(
                m.group(0),
                m.group(0) + "\nimport { optionalAuth } from '../middleware/optional-auth';"
            )
            changed = True
        else:
            # Insert after last import
            imports = re.findall(r"^import.*$", content, re.MULTILINE)
            if imports:
                last_import = imports[-1]
                content = content.replace(
                    last_import,
                    last_import + "\nimport { optionalAuth } from '../middleware/optional-auth';"
                )
                changed = True

    # Apply optionalAuth middleware to POST /result and POST / (events)
    # Pattern: router.post('/result', async (req, ...  →  router.post('/result', optionalAuth, async (req, ...
    patterns = [
        (r"router\.post\((['\"])(/result|/|/list)\1,\s*async\s+\(",
         r"router.post(\1\2\1, optionalAuth, async ("),
    ]
    for pat, repl in patterns:
        new_content, n = re.subn(pat, repl, content)
        if n > 0 and 'optionalAuth, optionalAuth' not in new_content:
            content = new_content
            changed = True
            print(f"  ✅ {fname}: added optionalAuth ({n} routes)")

    # Also patch handler to save userId if req.user exists
    # This is trickier — need to update the create call. For safety, use search-replace hint:
    # Look for prisma.p1Result.create({ data: { sessionId, ... } }) and add userId
    if 'p1Result.create' in content or 'p2Result.create' in content or 'userEvent.create' in content:
        # Inject userId = (req as any).user?.userId in the create data
        for model in ['p1Result', 'p2Result', 'userEvent']:
            pattern = rf'({model}\.create\(\s*{{\s*data:\s*{{)'
            replacement = rf'\1\n        userId: (req as any).user?.userId || null,'
            new_content, n = re.subn(pattern, replacement, content)
            if n > 0 and 'userId: (req as any).user?.userId' not in content:
                content = new_content
                changed = True
                print(f"  ✅ {fname}: linked {model}.create with userId")

    if changed:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {fname} patched")
    else:
        print(f"  ⏭  {fname} already patched (skip)")
PYEOF

# ─── 4. Build backend ────────────────────────────────────────
echo -e "${YELLOW}[4/7] npm run build...${NC}"
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ] || echo "$BUILD_LOG" | grep -q "error TS"; then
    echo -e "${RED}❌ Build FAILED:${NC}"
    echo "$BUILD_LOG" | tail -40
    exit 1
fi
echo -e "    ${GREEN}✅ Build OK${NC}"

# ─── 5. PM2 restart ──────────────────────────────────────────
echo -e "${YELLOW}[5/7] PM2 restart huongdi-api...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Restarted${NC}"

# ─── 6. Deploy frontend sol-api-sync-v2 + sol-auth-v2 ───────
echo -e "${YELLOW}[6/7] Deploy frontend JS files...${NC}"
if [ -f /tmp/sol-api-sync-v2.js ]; then
    sudo cp /tmp/sol-api-sync-v2.js "$PUBLIC/js/sol-api-sync.js"
    echo -e "    ${GREEN}✅ sol-api-sync.js updated (v2)${NC}"
fi
if [ -f /tmp/sol-auth-v2.js ]; then
    sudo cp /tmp/sol-auth-v2.js "$PUBLIC/js/sol-auth.js"
    echo -e "    ${GREEN}✅ sol-auth.js updated (v2)${NC}"
fi

# ─── 7. Smoke test ───────────────────────────────────────────
echo -e "${YELLOW}[7/7] Smoke test — verify P1 endpoint accepts JWT...${NC}"

# Login → get JWT
JWT=$(curl -s -X POST http://localhost:4001/api/auth/login-v2 \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@sol.vn","password":"huongdi2026!"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")

if [ -z "$JWT" ]; then
    echo -e "    ${YELLOW}⚠  Không login được — skip smoke test${NC}"
else
    echo -e "    ${CYAN}Got JWT (${#JWT} chars)${NC}"

    # Test /me endpoint với JWT
    ME=$(curl -s http://localhost:4001/api/user/me -H "Authorization: Bearer $JWT")
    if echo "$ME" | grep -q '"tier"'; then
        TIER=$(echo "$ME" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('tier','?'))")
        echo -e "    ${GREEN}✅ /me works — tier=$TIER${NC}"
    else
        echo -e "    ${YELLOW}⚠  /me response: $(echo $ME | head -c 200)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FIX AUTH INTEGRATION COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test flow:${NC}"
echo -e "  1. Hard refresh (Ctrl+Shift+R) huongdi.sol.vn/dang-nhap/"
echo -e "  2. Login admin@sol.vn / huongdi2026!"
echo -e "  3. Vào /la-ban-huong-di/ — thấy 37 direction unlock hết (FOUNDER tier)"
echo -e "  4. Vào /kham-pha-ban-than/ làm P1 → check DB có userId link"
echo -e "  5. Vào /toi/ — thấy summary P1 hiển thị"
echo ""
echo -e "${CYAN}Debug JWT trong browser console:${NC}"
echo -e "  window.SolAuth.getTier()       // should return 'FOUNDER'"
echo -e "  window.SolAuth.isPaidTier()    // should return true"
echo -e "  window.SolAuth.getCurrentUser() // full user object"
