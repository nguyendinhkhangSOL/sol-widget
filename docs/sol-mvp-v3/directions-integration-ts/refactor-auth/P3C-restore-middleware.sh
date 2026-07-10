#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# P3C: Just restore middleware — nó ĐÃ ĐÚNG SẴN
# Original code:
#   const adminRoles: UserRole[] = ['SUPER_ADMIN', 'RESEARCH_EDITOR',
#                                    'CONTENT_EDITOR', 'ANALYST'];
# → Không cần patch, chỉ restore
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
MW_TS="$BACKEND/src/middleware/auth.ts"

echo -e "${CYAN}═══ P3C: Restore middleware (no patch needed) ═══${NC}"

# ─── 1. Restore ──────────────────────────────────────────────
LATEST_BACKUP=$(ls -td /var/backups/huongdi/refactor-auth-* 2>/dev/null | head -1)
echo -e "${YELLOW}[1/3] Restore middleware/auth.ts from backup...${NC}"
sudo cp "$LATEST_BACKUP/middleware.bak/auth.ts" "$MW_TS"
sudo chown $(stat -c '%U:%G' "$BACKEND/src/") "$MW_TS"
echo -e "    ${GREEN}✅ Restored to original (already correct)${NC}"

# ─── 2. Verify content ───────────────────────────────────────
echo -e "${YELLOW}[2/3] Verify requireAdmin (should have 4 admin roles):${NC}"
grep -A 8 "export function requireAdmin" "$MW_TS" | head -10

# ─── 3. Build + restart ──────────────────────────────────────
echo -e "${YELLOW}[3/3] Test build...${NC}"
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ] || echo "$BUILD_LOG" | grep -q "error TS"; then
    echo -e "${RED}❌ Build FAILED:${NC}"
    echo "$BUILD_LOG" | tail -60
    exit 1
fi

echo -e "${GREEN}✅ Build OK${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "${GREEN}✅ PM2 restarted${NC}"

# Quick smoke test
echo ""
echo -e "${CYAN}Smoke test /api/health...${NC}"
curl -s http://localhost:4001/api/health || echo "(no /api/health)"
echo ""
