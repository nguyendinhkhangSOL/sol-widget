#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BATCH B — Users CMS deploy (backend + frontend)
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
ADMIN="/var/www/huongdi/admin"
PKG="/tmp/batch-b-users-cms"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🎯 BATCH B — Users CMS Deploy${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── Step 1: Backup ────────────────────────────────────────
echo -e "${YELLOW}[1/7] Backup FULL...${NC}"
bash /tmp/directions-integration-ts/backup-full.sh pre-batch-b-users-cms
echo -e "${GREEN}✅ Backup done${NC}"

# ─── Step 2: Backup files trước patch ───────────────────────
echo -e "${YELLOW}[2/7] Backup individual files...${NC}"
cp "$BACKEND/src/routes/admin.ts" "$BACKEND/src/routes/admin.ts.bak-batch-b-$(date +%s)"
cp "$ADMIN/src/pages/Users.tsx" "$ADMIN/src/pages/Users.tsx.bak-batch-b-$(date +%s)"
cp "$ADMIN/src/utils/api.ts" "$ADMIN/src/utils/api.ts.bak-batch-b-$(date +%s)" 2>/dev/null || true
echo -e "${GREEN}✅ Files backed up${NC}"

# ─── Step 3: Patch backend admin.ts ─────────────────────────
echo -e "${YELLOW}[3/7] Patch admin.ts /users endpoints...${NC}"

python3 << 'PYEOF'
import re

filepath = '/var/www/huongdi/backend/src/routes/admin.ts'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Replace existing GET /users handler với version có filter/search
old_get_users = re.search(
    r"adminRouter\.get\('/users'.*?\n\}\);",
    content,
    re.DOTALL
)

if old_get_users:
    # Replace with new version + additional endpoints
    with open('/tmp/batch-b-users-cms/B1-admin-users-extend.ts', 'r') as f:
        new_endpoints = f.read()

    # Strip comment header
    new_endpoints = re.sub(r'^// ═.*?^\n', '', new_endpoints, count=1, flags=re.MULTILINE | re.DOTALL)

    # Replace old handler with new content
    content = content.replace(old_get_users.group(0), new_endpoints.strip())

    with open(filepath, 'w') as f:
        f.write(content)
    print("✅ Patched admin.ts")
else:
    print("⚠️  Không tìm thấy old GET /users handler — manual patch needed")
PYEOF

# ─── Step 4: Copy frontend files ────────────────────────────
echo -e "${YELLOW}[4/7] Copy frontend files...${NC}"
cp "$PKG/B2-Users.tsx" "$ADMIN/src/pages/Users.tsx"
cp "$PKG/B3-UserDetail.tsx" "$ADMIN/src/pages/UserDetail.tsx"
echo -e "${GREEN}✅ Files copied${NC}"

# ─── Step 5: Patch api.ts ───────────────────────────────────
echo -e "${YELLOW}[5/7] Patch api.ts...${NC}"

if grep -q "getUserDetail" "$ADMIN/src/utils/api.ts"; then
    echo -e "    ${CYAN}⏭  getUserDetail đã có — skip${NC}"
else
    # Extract just the export functions (skip comment header)
    tail -n +5 "$PKG/B4-api-additions.ts" | grep -v "^// ⚠️ REPLACE" >> "$ADMIN/src/utils/api.ts"

    # Remove old getUsers (single-arg) if exists — will be overridden by new one
    # (New signature với opts sẽ backward compat vì opts optional)
    echo -e "    ${GREEN}✅ Appended getUserDetail + updateUserTier + getAnonymousSessions${NC}"
fi

# ─── Step 6: Add route to App.tsx ───────────────────────────
echo -e "${YELLOW}[6/7] Add /users/:id route to App.tsx...${NC}"
APP_TSX="$ADMIN/src/App.tsx"

if grep -q "UserDetail" "$APP_TSX"; then
    echo -e "    ${CYAN}⏭  UserDetail route đã có — skip${NC}"
else
    # Backup
    cp "$APP_TSX" "$APP_TSX.bak-batch-b-$(date +%s)"

    # Add import (after last import)
    sed -i "/^import.*Users.*from.*Users';/a import UserDetail from './pages/UserDetail';" "$APP_TSX"

    # Add route (after Users route)
    sed -i "/element={<Users \\/>}/a\\        <Route path=\"users/:id\" element={<UserDetail />} />" "$APP_TSX"

    echo -e "    ${GREEN}✅ Added UserDetail import + route${NC}"
fi

# ─── Step 7: Build + Verify ─────────────────────────────────
echo -e "${YELLOW}[7/7] Build backend + admin...${NC}"

cd "$BACKEND"
if npm run build 2>&1 | tail -5 | grep -q "error TS"; then
    echo -e "${RED}❌ Backend build failed${NC}"
    npm run build 2>&1 | tail -15
    exit 1
fi
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Backend built + restarted${NC}"

cd "$ADMIN"
if npm run build 2>&1 | tail -5 | grep -q "error TS"; then
    echo -e "${RED}❌ Admin build failed${NC}"
    npm run build 2>&1 | tail -15
    exit 1
fi
echo -e "    ${GREEN}✅ Admin built${NC}"

# ─── Verify APIs ────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══ Verify APIs ═══${NC}"
echo -e "${YELLOW}Test 1: GET /api/admin/users${NC}"
curl -s "http://localhost:4001/api/admin/users?limit=5" | python3 -m json.tool 2>/dev/null | head -20 || echo "(need admin token)"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ BATCH B DONE!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Test: ${CYAN}https://adminhuongdi.sol.vn/users${NC}"
echo -e "  🌐 Detail: ${CYAN}https://adminhuongdi.sol.vn/users/eea2dc57-cecd-4996-89e7-7190194d899a${NC}"
echo ""
