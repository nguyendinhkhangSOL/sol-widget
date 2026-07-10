#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ROLLBACK + REPAIR — Restore về trạng thái trước Batch 1
# Chạy trên VPS: bash rollback-repair.sh
#
# Tự động detect backup + restore + rebuild + PM2 restart
# ═══════════════════════════════════════════════════════════════
set -e

BACKEND="/var/www/huongdi/backend"
ADMIN="/var/www/huongdi/admin"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🔄 ROLLBACK + REPAIR${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── STEP 1: Find backup dir ────────────────────────────────
echo -e "${YELLOW}[1/6] Tìm backup dir...${NC}"

BAK_LIST=$(ls -td /tmp/directions-backup-* 2>/dev/null || true)

if [ -z "$BAK_LIST" ]; then
    echo -e "    ${RED}❌ Không có /tmp/directions-backup-*/${NC}"
    echo -e "    Kiểm tra .bak files:"

    ls -la $BACKEND/prisma/schema.prisma.bak 2>/dev/null && echo -e "    ${GREEN}✅ schema.prisma.bak${NC}"
    ls -la $BACKEND/src/routes/admin.ts.bak 2>/dev/null && echo -e "    ${GREEN}✅ admin.ts.bak${NC}"
    ls -la $BACKEND/src/index.ts.bak 2>/dev/null && echo -e "    ${GREEN}✅ index.ts.bak${NC}"
    ls -la $BACKEND/src/server.ts.bak 2>/dev/null && echo -e "    ${GREEN}✅ server.ts.bak${NC}"
    ls -la $ADMIN/src/App.tsx.bak 2>/dev/null && echo -e "    ${GREEN}✅ App.tsx.bak${NC}"
    ls -la $ADMIN/src/components/Layout.tsx.bak 2>/dev/null && echo -e "    ${GREEN}✅ Layout.tsx.bak${NC}"

    echo ""
    read -p "  Dùng .bak files để restore? (y/N): " USE_BAK
    if [ "$USE_BAK" != "y" ] && [ "$USE_BAK" != "Y" ]; then
        echo -e "    ${RED}Cancelled.${NC}"
        exit 1
    fi
    USE_BAK_FILES=true
else
    BAK=$(echo "$BAK_LIST" | head -1)
    echo -e "    ${GREEN}✅ Latest backup: $BAK${NC}"
    ls -la "$BAK/"
    echo ""
    USE_BAK_FILES=false
fi

# ─── STEP 2: Restore schema.prisma ──────────────────────────
echo -e "${YELLOW}[2/6] Restore schema.prisma...${NC}"

if [ "$USE_BAK_FILES" = "true" ]; then
    if [ -f "$BACKEND/prisma/schema.prisma.bak" ]; then
        cp "$BACKEND/prisma/schema.prisma.bak" "$BACKEND/prisma/schema.prisma"
        echo -e "    ${GREEN}✅ Từ .bak${NC}"
    else
        # Try to strip appended block manually
        if grep -q "^model Direction " "$BACKEND/prisma/schema.prisma"; then
            LINE=$(grep -n "^// ═.*SOL LA BÀN — Directions Core" "$BACKEND/prisma/schema.prisma" | head -1 | cut -d: -f1)
            if [ -n "$LINE" ]; then
                head -n $((LINE - 1)) "$BACKEND/prisma/schema.prisma" > "$BACKEND/prisma/schema.prisma.new"
                mv "$BACKEND/prisma/schema.prisma.new" "$BACKEND/prisma/schema.prisma"
                echo -e "    ${GREEN}✅ Strip appended block${NC}"
            fi
        else
            echo -e "    ${CYAN}⏭  schema.prisma không có changes${NC}"
        fi
    fi
else
    cp "$BAK/schema.prisma" "$BACKEND/prisma/schema.prisma"
    echo -e "    ${GREEN}✅ Từ $BAK/schema.prisma${NC}"
fi

# ─── STEP 3: Restore admin.ts + entry point ─────────────────
echo -e "${YELLOW}[3/6] Restore admin.ts + entry point...${NC}"

# Detect entry point
if [ -f "$BACKEND/src/index.ts" ]; then
    ENTRY="$BACKEND/src/index.ts"
elif [ -f "$BACKEND/src/server.ts" ]; then
    ENTRY="$BACKEND/src/server.ts"
else
    ENTRY=""
fi

if [ "$USE_BAK_FILES" = "true" ]; then
    [ -f "$BACKEND/src/routes/admin.ts.bak" ] && cp "$BACKEND/src/routes/admin.ts.bak" "$BACKEND/src/routes/admin.ts" && echo -e "    ${GREEN}✅ admin.ts từ .bak${NC}"
    [ -n "$ENTRY" ] && [ -f "$ENTRY.bak" ] && cp "$ENTRY.bak" "$ENTRY" && echo -e "    ${GREEN}✅ $(basename $ENTRY) từ .bak${NC}"
else
    [ -f "$BAK/admin.ts" ] && cp "$BAK/admin.ts" "$BACKEND/src/routes/admin.ts" && echo -e "    ${GREEN}✅ admin.ts từ backup${NC}"
    for f in index.ts server.ts app.ts; do
        [ -f "$BAK/$f" ] && cp "$BAK/$f" "$BACKEND/src/$f" && echo -e "    ${GREEN}✅ $f từ backup${NC}"
    done
fi

# ─── STEP 4: Drop tables mới (nếu có) ───────────────────────
echo -e "${YELLOW}[4/6] Drop tables mới (nếu đã migrate)...${NC}"

sudo -u postgres psql huongdi_prod << 'SQL' 2>&1 | grep -v "does not exist\|NOTICE\|^$" || true
DROP TABLE IF EXISTS direction_revisions CASCADE;
DROP TABLE IF EXISTS case_studies CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS directions CASCADE;
DROP TYPE IF EXISTS "DirectionStatus";
DROP TYPE IF EXISTS "CaseStudyTier";
DROP TYPE IF EXISTS "ArticleCategory";
DROP TYPE IF EXISTS "ContentStatus";
SQL

echo -e "    ${GREEN}✅ Tables mới đã drop (Leads + Users giữ nguyên)${NC}"

# ─── STEP 5: Restore admin SPA files ────────────────────────
echo -e "${YELLOW}[5/6] Restore admin SPA...${NC}"

if [ "$USE_BAK_FILES" = "true" ]; then
    [ -f "$ADMIN/src/App.tsx.bak" ] && cp "$ADMIN/src/App.tsx.bak" "$ADMIN/src/App.tsx" && echo -e "    ${GREEN}✅ App.tsx${NC}"
    [ -f "$ADMIN/src/components/Layout.tsx.bak" ] && cp "$ADMIN/src/components/Layout.tsx.bak" "$ADMIN/src/components/Layout.tsx" && echo -e "    ${GREEN}✅ Layout.tsx${NC}"
else
    [ -f "$BAK/App.tsx" ] && cp "$BAK/App.tsx" "$ADMIN/src/App.tsx" && echo -e "    ${GREEN}✅ App.tsx${NC}"
    [ -f "$BAK/Layout.tsx" ] && cp "$BAK/Layout.tsx" "$ADMIN/src/components/Layout.tsx" && echo -e "    ${GREEN}✅ Layout.tsx${NC}"
fi

# Xoá 6 file mới nếu có
rm -f "$ADMIN/src/utils/api-directions.ts"
rm -f "$ADMIN/src/pages/DirectionsPage.tsx"
rm -f "$ADMIN/src/pages/DirectionEditPage.tsx"
rm -f "$ADMIN/src/pages/DirectionRevisionsPage.tsx"
rm -f "$ADMIN/src/pages/CaseStudiesPage.tsx"
rm -f "$ADMIN/src/pages/CaseStudyEditPage.tsx"

# Xoá routes mới backend
rm -f "$BACKEND/src/routes/directions.ts"
rm -rf "$BACKEND/src/seed"

echo -e "    ${GREEN}✅ 6 admin files + 3 backend files removed${NC}"

# ─── STEP 6: Rebuild + PM2 restart ──────────────────────────
echo -e "${YELLOW}[6/6] Rebuild + PM2 restart...${NC}"

# Regenerate Prisma client (schema đã restore)
cd "$BACKEND"
npx prisma generate > /dev/null 2>&1
echo -e "    ${GREEN}✅ Prisma client regenerated${NC}"

# Build backend
echo -e "    Building backend..."
if npm run build 2>&1 | tail -5; then
    echo -e "    ${GREEN}✅ Backend built${NC}"
else
    echo -e "    ${RED}❌ Backend build failed${NC}"
fi

# Build admin
echo -e "    Building admin..."
cd "$ADMIN"
if npm run build 2>&1 | tail -5; then
    echo -e "    ${GREEN}✅ Admin built${NC}"
else
    echo -e "    ${RED}❌ Admin build failed${NC}"
fi

pm2 restart huongdi-api > /dev/null
sleep 3
echo -e "    ${GREEN}✅ PM2 restarted${NC}"
echo ""
pm2 logs huongdi-api --lines 10 --nostream

# ─── VERIFY ─────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ ROLLBACK XONG!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "  📊 State hiện tại:"
sudo -u postgres psql huongdi_prod -c "SELECT COUNT(*) AS leads FROM leads;" 2>&1 | grep -E "^\s*[0-9]+" || echo "    Leads count query failed"

TABLES=$(sudo -u postgres psql huongdi_prod -c "\dt" 2>&1 | grep -c "directions\|case_studies\|articles" || echo 0)
if [ "$TABLES" = "0" ]; then
    echo -e "    ${GREEN}✅ Tables Direction/CaseStudy/Article đã bị drop${NC}"
else
    echo -e "    ${YELLOW}⚠  Vẫn còn $TABLES table Direction/CaseStudy/Article${NC}"
fi

curl -s http://localhost:4001/api/leads/count 2>/dev/null | head -c 100
echo ""
echo ""
echo -e "  🌐 Test:"
echo -e "    ${CYAN}https://adminhuongdi.sol.vn/leads${NC}       (phải hoạt động OK)"
echo ""
echo -e "  📁 Backup vẫn giữ tại:"
ls -td /tmp/directions-backup-* 2>/dev/null | head -3 || echo "    (không có)"
echo ""
echo -e "  🚀 Sau khi verify Leads OK, chạy deploy sạch:"
echo -e "    ${CYAN}bash /tmp/directions-integration-ts/deploy-all.sh /tmp/buoc3.html${NC}"
echo ""
