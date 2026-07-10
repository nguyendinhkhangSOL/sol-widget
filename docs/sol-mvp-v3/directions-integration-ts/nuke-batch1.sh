#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# NUKE BATCH 1 — Xoá sạch mọi thứ Batch 1 đã touch
# Restore về pre-Batch-1: existing DirectionList/DirectionEdit UI hoạt động
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
ADMIN="/var/www/huongdi/admin"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  💣 NUKE BATCH 1 — Restore về pre-Batch-1${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── STEP 1: Backup current state ────────────────────────────
echo -e "${YELLOW}[1/9] Backup state hiện tại...${NC}"
NUKE_BAK="/tmp/nuke-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$NUKE_BAK"
cp "$BACKEND/prisma/schema.prisma" "$NUKE_BAK/"
cp "$BACKEND/src/routes/admin.ts" "$NUKE_BAK/"
cp "$BACKEND/src/routes/auth.ts" "$NUKE_BAK/"
cp "$BACKEND/src/index.ts" "$NUKE_BAK/"
cp "$ADMIN/src/App.tsx" "$NUKE_BAK/"
[ -f "$ADMIN/src/components/Layout.tsx" ] && cp "$ADMIN/src/components/Layout.tsx" "$NUKE_BAK/"
echo -e "    ${GREEN}✅ Backup: $NUKE_BAK${NC}"

# ─── STEP 2: Xoá 6 Batch 1 admin files ───────────────────────
echo -e "${YELLOW}[2/9] Xoá 6 Batch 1 admin files...${NC}"
DELETED=0
for f in \
    "$ADMIN/src/pages/DirectionsPage.tsx" \
    "$ADMIN/src/pages/DirectionEditPage.tsx" \
    "$ADMIN/src/pages/DirectionRevisionsPage.tsx" \
    "$ADMIN/src/pages/CaseStudiesPage.tsx" \
    "$ADMIN/src/pages/CaseStudyEditPage.tsx" \
    "$ADMIN/src/utils/api-directions.ts"; do
    if [ -f "$f" ]; then
        rm -f "$f"
        DELETED=$((DELETED + 1))
    fi
done
echo -e "    ${GREEN}✅ Deleted $DELETED files${NC}"

# ─── STEP 3: Xoá Batch 1 imports trong App.tsx ───────────────
echo -e "${YELLOW}[3/9] Fix App.tsx (xóa Batch 1 imports)...${NC}"
sed -i '/^import DirectionsPage/d' "$ADMIN/src/App.tsx"
sed -i '/^import DirectionEditPage/d' "$ADMIN/src/App.tsx"
sed -i '/^import DirectionRevisionsPage/d' "$ADMIN/src/App.tsx"
sed -i '/^import CaseStudiesPage/d' "$ADMIN/src/App.tsx"
sed -i '/^import CaseStudyEditPage/d' "$ADMIN/src/App.tsx"
# Xoá routes Batch 1 nếu có (không xoá routes existing)
sed -i '/<Route path="directions\/new"/d' "$ADMIN/src/App.tsx"
sed -i '/<Route path="directions\/:id\/edit"/d' "$ADMIN/src/App.tsx"
sed -i '/<Route path="directions\/:id\/revisions"/d' "$ADMIN/src/App.tsx"
sed -i '/<Route path="case-studies/d' "$ADMIN/src/App.tsx"

REMAINING=$(grep -c "DirectionsPage\|DirectionEditPage\|DirectionRevisionsPage\|CaseStudiesPage\|CaseStudyEditPage" "$ADMIN/src/App.tsx" 2>/dev/null | head -1)
if [ "$REMAINING" = "0" ]; then
    echo -e "    ${GREEN}✅ App.tsx clean Batch 1 (existing DirectionList/DirectionEdit vẫn còn)${NC}"
    grep -n "Direction\|CaseStud" "$ADMIN/src/App.tsx" || true
else
    echo -e "    ${YELLOW}⚠  Còn ${REMAINING} references:${NC}"
    grep -n "DirectionsPage\|DirectionEditPage" "$ADMIN/src/App.tsx" || true
fi

# ─── STEP 4: Fix auth.ts duplicate ──────────────────────────
echo -e "${YELLOW}[4/9] Fix auth.ts duplicate authRouter...${NC}"
awk '/^export \{ router as authRouter \};$/ && ++seen > 1 {next} 1' "$BACKEND/src/routes/auth.ts" > "$BACKEND/src/routes/auth.ts.tmp"
mv "$BACKEND/src/routes/auth.ts.tmp" "$BACKEND/src/routes/auth.ts"
COUNT=$(grep -c "^export { router as authRouter }" "$BACKEND/src/routes/auth.ts")
echo -e "    ${GREEN}✅ Còn $COUNT dòng export authRouter (expect 1)${NC}"

# ─── STEP 5: Xoá Batch 1 backend files ───────────────────────
echo -e "${YELLOW}[5/9] Xoá Batch 1 backend files...${NC}"
rm -f "$BACKEND/src/routes/directions.ts"
rm -rf "$BACKEND/src/seed"
echo -e "    ${GREEN}✅ Backend Batch 1 files removed${NC}"

# ─── STEP 6: Revert admin.ts (xóa PrismaClient nếu Batch 1 add) ─
echo -e "${YELLOW}[6/9] Check admin.ts state...${NC}"
# admin.ts của Sol dùng `export const adminRouter = Router()` — không có Batch 1 patch
# Nếu deploy-all.sh add PrismaClient ở đầu, xóa nó
if head -3 "$BACKEND/src/routes/admin.ts" | grep -q "prismaDirections = new PrismaClient"; then
    sed -i '/^import { PrismaClient } from '\''@prisma\/client'\'';$/,/^const prismaDirections = new PrismaClient();$/d' "$BACKEND/src/routes/admin.ts"
    echo -e "    ${GREEN}✅ Xóa PrismaClient import Batch 1 add${NC}"
elif grep -q "prismaDirections" "$BACKEND/src/routes/admin.ts"; then
    # Xóa alias nếu có
    sed -i '/^const prismaDirections = /d' "$BACKEND/src/routes/admin.ts"
    echo -e "    ${GREEN}✅ Xóa alias prismaDirections${NC}"
else
    echo -e "    ${CYAN}⏭  admin.ts clean${NC}"
fi

# ─── STEP 7: Drop Batch 1 tables + schema Direction model ───
echo -e "${YELLOW}[7/9] Drop Batch 1 tables + revert schema...${NC}"

# Drop tables cascade
sudo -u postgres psql huongdi_prod << 'SQL' 2>&1 | grep -v "does not exist\|NOTICE" || true
DROP TABLE IF EXISTS direction_revisions CASCADE;
DROP TABLE IF EXISTS case_studies CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS directions CASCADE;
DROP TYPE IF EXISTS "DirectionStatus";
DROP TYPE IF EXISTS "CaseStudyTier";
DROP TYPE IF EXISTS "ArticleCategory";
DROP TYPE IF EXISTS "ContentStatus";
SQL
echo -e "    ${GREEN}✅ Tables dropped${NC}"

# Revert schema — strip appended Batch 1 block
if grep -q "^// SOL LA BÀN — Directions Core (Batch 1)" "$BACKEND/prisma/schema.prisma"; then
    LINE=$(grep -n "^// SOL LA BÀN — Directions Core (Batch 1)" "$BACKEND/prisma/schema.prisma" | head -1 | cut -d: -f1)
    # Xóa từ 2 dòng trước comment header (loại bỏ `// ═══════════` separator)
    START=$((LINE - 2))
    head -n $((START - 1)) "$BACKEND/prisma/schema.prisma" > "$BACKEND/prisma/schema.prisma.new"
    mv "$BACKEND/prisma/schema.prisma.new" "$BACKEND/prisma/schema.prisma"
    echo -e "    ${GREEN}✅ Schema Batch 1 block removed${NC}"
elif grep -q "^model Direction " "$BACKEND/prisma/schema.prisma"; then
    echo -e "    ${YELLOW}⚠  Vẫn còn model Direction — restore từ NUKE_BAK${NC}"
    # Fallback: restore from latest legit backup
    LATEST_BAK=$(ls -td /tmp/directions-backup-* 2>/dev/null | head -1)
    if [ -n "$LATEST_BAK" ] && [ -f "$LATEST_BAK/schema.prisma" ]; then
        # Check backup không có model Direction
        if ! grep -q "^model Direction " "$LATEST_BAK/schema.prisma"; then
            cp "$LATEST_BAK/schema.prisma" "$BACKEND/prisma/schema.prisma"
            echo -e "    ${GREEN}✅ Restored từ $LATEST_BAK/schema.prisma${NC}"
        fi
    fi
else
    echo -e "    ${CYAN}⏭  Schema clean${NC}"
fi

# Regenerate Prisma client
cd "$BACKEND"
npx prisma generate > /dev/null 2>&1
echo -e "    ${GREEN}✅ Prisma client regenerated${NC}"

# ─── STEP 8: Rebuild backend + admin ────────────────────────
echo -e "${YELLOW}[8/9] Rebuild...${NC}"

echo -e "    Building backend..."
cd "$BACKEND"
BUILD_OUT=$(npm run build 2>&1)
if echo "$BUILD_OUT" | grep -q "error TS"; then
    echo -e "    ${RED}❌ Backend build failed:${NC}"
    echo "$BUILD_OUT" | tail -15
    echo ""
    echo -e "    ${YELLOW}Backup at: $NUKE_BAK${NC}"
    exit 1
fi
echo -e "    ${GREEN}✅ Backend OK${NC}"

echo -e "    Building admin..."
cd "$ADMIN"
BUILD_OUT=$(npm run build 2>&1)
if echo "$BUILD_OUT" | grep -q "error TS"; then
    echo -e "    ${RED}❌ Admin build failed:${NC}"
    echo "$BUILD_OUT" | tail -15
    echo ""
    echo -e "    ${YELLOW}Backup at: $NUKE_BAK${NC}"
    exit 1
fi
echo -e "    ${GREEN}✅ Admin OK${NC}"

# ─── STEP 9: PM2 restart + verify ────────────────────────────
echo -e "${YELLOW}[9/9] PM2 restart + verify...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 3
echo ""
pm2 logs huongdi-api --lines 10 --nostream

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ NUKE XONG — Restored về pre-Batch-1${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📊 Verify:"

# Leads API
LEADS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/api/leads/count 2>/dev/null)
echo -e "    Leads API: HTTP $LEADS_STATUS"

# DB counts
sudo -u postgres psql huongdi_prod -c "SELECT 'leads' as tbl, COUNT(*) FROM leads UNION ALL SELECT 'lead_notifications' as tbl, COUNT(*) FROM lead_notifications;" 2>&1 | tail -6

echo ""
echo -e "  🌐 Test browser:"
echo -e "    ${CYAN}https://adminhuongdi.sol.vn/leads${NC}       (phải OK)"
echo -e "    ${CYAN}https://adminhuongdi.sol.vn/directions${NC}   (existing UI, không phải Batch 1)"
echo ""
echo -e "  📁 Nuke backup: ${CYAN}$NUKE_BAK${NC}"
echo ""
echo -e "  🎯 Trạng thái: Sạch pre-Batch-1. Existing UI hoạt động."
echo ""
