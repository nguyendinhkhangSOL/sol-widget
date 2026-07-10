#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# DEPLOY ALL — Sol La Bàn Directions Integration V1
# Chạy 1 lần trên VPS: bash deploy-all.sh
#
# Auto-patch: schema.prisma + admin.ts + index.ts + App.tsx + Layout.tsx
# Không cần manual edit gì cả — script làm hết.
# ═══════════════════════════════════════════════════════════════
set -e

# ─── PATHS ───────────────────────────────────────────────────
BACKEND="/var/www/huongdi/backend"
ADMIN="/var/www/huongdi/admin"
PKG=$(dirname "$(readlink -f "$0")")
BUOC3="${1:-/tmp/buoc3.html}"

# ─── COLORS ──────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🧭 Sol La Bàn — Deploy Directions Integration V1${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── STEP 0: Verify prerequisites ───────────────────────────
echo -e "${YELLOW}[0/12] Verify prerequisites...${NC}"
[ -d "$BACKEND" ] || { echo -e "${RED}❌ $BACKEND không tồn tại${NC}"; exit 1; }
[ -d "$ADMIN" ] || { echo -e "${RED}❌ $ADMIN không tồn tại${NC}"; exit 1; }
[ -f "$PKG/prisma-additions.prisma" ] || { echo -e "${RED}❌ Package không đúng${NC}"; exit 1; }
[ -f "$BUOC3" ] || { echo -e "${RED}❌ buoc3.html không tại $BUOC3${NC}"; exit 1; }
echo -e "    ${GREEN}✅ All paths OK${NC}"

# ─── STEP 1: Backup toàn bộ ─────────────────────────────────
echo -e "${YELLOW}[1/12] 🗂️  Backup...${NC}"
BAK="/tmp/directions-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BAK"

cp "$BACKEND/prisma/schema.prisma" "$BAK/schema.prisma"
cp "$BACKEND/src/routes/admin.ts" "$BAK/admin.ts" 2>/dev/null || true

# Detect entry point (index.ts / server.ts / app.ts)
if [ -f "$BACKEND/src/index.ts" ]; then
    ENTRY="$BACKEND/src/index.ts"
elif [ -f "$BACKEND/src/server.ts" ]; then
    ENTRY="$BACKEND/src/server.ts"
elif [ -f "$BACKEND/src/app.ts" ]; then
    ENTRY="$BACKEND/src/app.ts"
else
    echo -e "    ${RED}❌ Không tìm được entry point (index.ts/server.ts/app.ts)${NC}"
    exit 1
fi
cp "$ENTRY" "$BAK/$(basename $ENTRY)"
echo -e "    Entry point: $ENTRY"

cp "$ADMIN/src/App.tsx" "$BAK/App.tsx" 2>/dev/null || true
cp "$ADMIN/src/components/Layout.tsx" "$BAK/Layout.tsx" 2>/dev/null || true

echo -e "    ${GREEN}✅ Backup tại: $BAK${NC}"

# ─── STEP 2: Append Prisma schema ───────────────────────────
echo -e "${YELLOW}[2/12] 🗄️  Append Prisma models...${NC}"
if grep -q "^model Direction " "$BACKEND/prisma/schema.prisma"; then
    echo -e "    ${CYAN}⏭  Đã có model Direction — skip${NC}"
else
    echo "" >> "$BACKEND/prisma/schema.prisma"
    cat "$PKG/prisma-additions.prisma" >> "$BACKEND/prisma/schema.prisma"
    echo -e "    ${GREEN}✅ Append 4 models + 4 enums${NC}"
fi

# ─── STEP 3: Prisma generate + migrate ──────────────────────
echo -e "${YELLOW}[3/12] 🔄 Prisma migrate...${NC}"
cd "$BACKEND"
npx prisma generate > /dev/null 2>&1
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss=false 2>&1 | tail -5
echo -e "    ${GREEN}✅ Migration done${NC}"

# ─── STEP 4: Copy backend files ─────────────────────────────
echo -e "${YELLOW}[4/12] 📥 Copy backend files...${NC}"
mkdir -p "$BACKEND/src/seed"

cp "$PKG/backend/routes/directions.ts" "$BACKEND/src/routes/directions.ts"
cp "$PKG/backend/seed/extract-from-buoc3.ts" "$BACKEND/src/seed/"
cp "$PKG/backend/seed/seed-directions.ts" "$BACKEND/src/seed/"
echo -e "    ${GREEN}✅ Files copied${NC}"

# ─── STEP 5: AUTO-PATCH admin.ts ────────────────────────────
echo -e "${YELLOW}[5/12] 🔧 Auto-patch admin.ts...${NC}"

ADMIN_TS="$BACKEND/src/routes/admin.ts"

# 5a. Check + add PrismaClient import
if ! grep -q "prismaDirections" "$ADMIN_TS"; then
    # Detect existing prisma import
    if grep -q "PrismaClient" "$ADMIN_TS"; then
        # Reuse existing prisma instance, just alias
        FIRST_LINE_NUM=$(grep -n "PrismaClient" "$ADMIN_TS" | head -1 | cut -d: -f1)
        # Find existing prisma const
        EXISTING_PRISMA=$(grep -oP "const \K\w+(?= = new PrismaClient)" "$ADMIN_TS" | head -1)
        if [ -n "$EXISTING_PRISMA" ]; then
            # Add alias
            sed -i "/^const $EXISTING_PRISMA = new PrismaClient/a const prismaDirections = $EXISTING_PRISMA;" "$ADMIN_TS"
            echo -e "    ${GREEN}✅ Alias prismaDirections = $EXISTING_PRISMA${NC}"
        fi
    else
        # Add fresh import at top
        sed -i "1i import { PrismaClient } from '@prisma/client';\nconst prismaDirections = new PrismaClient();" "$ADMIN_TS"
        echo -e "    ${GREEN}✅ Added PrismaClient import + instance${NC}"
    fi
else
    echo -e "    ${CYAN}⏭  prismaDirections đã có${NC}"
fi

# 5b. Insert admin-directions-block trước "export default router;"
if grep -q "router.get('/directions'" "$ADMIN_TS"; then
    echo -e "    ${CYAN}⏭  Directions endpoints đã có${NC}"
else
    # Backup content of block file (remove comment header)
    BLOCK_CONTENT=$(mktemp)
    grep -v "^// APPEND\|^// TRƯỚC dòng\|^//\s*$" "$PKG/backend/routes/admin-directions-block.ts" > "$BLOCK_CONTENT"

    # Insert BEFORE "export default router;"
    if grep -q "^export default router;" "$ADMIN_TS"; then
        # Use awk to insert
        awk -v block_file="$BLOCK_CONTENT" '
        /^export default router;/ && !inserted {
            while ((getline line < block_file) > 0) print line
            close(block_file)
            print ""
            inserted = 1
        }
        { print }
        ' "$ADMIN_TS" > "$ADMIN_TS.new"
        mv "$ADMIN_TS.new" "$ADMIN_TS"
        rm "$BLOCK_CONTENT"
        echo -e "    ${GREEN}✅ Inserted admin-directions-block ($(wc -l < $PKG/backend/routes/admin-directions-block.ts) dòng)${NC}"
    else
        echo -e "    ${RED}❌ Không tìm thấy 'export default router;' trong admin.ts${NC}"
        echo -e "    Manual add: cat $PKG/backend/routes/admin-directions-block.ts >> $ADMIN_TS"
        exit 1
    fi
fi

# ─── STEP 6: AUTO-PATCH entry point (index.ts/server.ts) ────
echo -e "${YELLOW}[6/12] 🔧 Auto-patch $(basename $ENTRY)...${NC}"

if grep -q "directionsRouter" "$ENTRY"; then
    echo -e "    ${CYAN}⏭  directionsRouter đã mount${NC}"
else
    # Find existing router import pattern (leadsRouter as reference)
    if grep -q "leadsRouter" "$ENTRY"; then
        # Add import sau leadsRouter import
        sed -i "/import leadsRouter/a import directionsRouter from './routes/directions';" "$ENTRY"
        # Add mount sau leadsRouter mount
        sed -i "/app.use.*api\/leads.*leadsRouter/a app.use('/api/directions', directionsRouter);" "$ENTRY"
        echo -e "    ${GREEN}✅ Added import + mount /api/directions${NC}"
    else
        # Fallback: add before any app.listen
        sed -i "/app.listen\|server.listen/i import directionsRouter from './routes/directions';\napp.use('/api/directions', directionsRouter);\n" "$ENTRY"
        echo -e "    ${GREEN}✅ Added import + mount /api/directions (fallback pos)${NC}"
    fi
fi

# ─── STEP 7: Build backend ──────────────────────────────────
echo -e "${YELLOW}[7/12] 🔨 Build backend...${NC}"
cd "$BACKEND"
if npm run build 2>&1 | tail -10; then
    echo -e "    ${GREEN}✅ Backend built${NC}"
else
    echo -e "    ${RED}❌ Build failed. Check output above.${NC}"
    echo -e "    Rollback: cp $BAK/schema.prisma $BACKEND/prisma/ && cp $BAK/admin.ts $BACKEND/src/routes/ && cp $BAK/$(basename $ENTRY) $BACKEND/src/"
    exit 1
fi

# ─── STEP 8: Extract + Seed data ────────────────────────────
echo -e "${YELLOW}[8/12] 📖 Extract 36 direction từ buoc3.html...${NC}"
cd "$BACKEND"
npx ts-node src/seed/extract-from-buoc3.ts "$BUOC3" 2>&1 | tail -10
echo -e "    ${GREEN}✅ Extract done${NC}"

echo -e "${YELLOW}[9/12] 🌱 Seed DB (36 direction + 3 case study)...${NC}"
npx ts-node src/seed/seed-directions.ts 2>&1 | tail -15
echo -e "    ${GREEN}✅ Seed done${NC}"

# ─── STEP 10: Restart PM2 ───────────────────────────────────
echo -e "${YELLOW}[10/12] ♻️  Restart PM2...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 3
pm2 logs huongdi-api --lines 10 --nostream 2>&1 | tail -10

# ─── STEP 11: Admin SPA integration ─────────────────────────
echo -e "${YELLOW}[11/12] 🎨 Deploy Admin SPA...${NC}"

# Copy admin files
mkdir -p "$ADMIN/src/pages" "$ADMIN/src/utils"
cp "$PKG/admin/src/utils/api-directions.ts" "$ADMIN/src/utils/"
cp "$PKG/admin/src/pages/DirectionsPage.tsx" "$ADMIN/src/pages/"
cp "$PKG/admin/src/pages/DirectionEditPage.tsx" "$ADMIN/src/pages/"
cp "$PKG/admin/src/pages/DirectionRevisionsPage.tsx" "$ADMIN/src/pages/"
cp "$PKG/admin/src/pages/CaseStudiesPage.tsx" "$ADMIN/src/pages/"
cp "$PKG/admin/src/pages/CaseStudyEditPage.tsx" "$ADMIN/src/pages/"
echo -e "    ${GREEN}✅ 6 admin files copied${NC}"

# 11a. Auto-patch App.tsx
APP_TSX="$ADMIN/src/App.tsx"
if grep -q "DirectionsPage" "$APP_TSX"; then
    echo -e "    ${CYAN}⏭  App.tsx đã có DirectionsPage import${NC}"
else
    # Add imports sau leads import (nếu có) hoặc sau import cuối
    if grep -q "LeadsPage" "$APP_TSX"; then
        sed -i "/import LeadsPage/a\\
import DirectionsPage from './pages/DirectionsPage';\\
import DirectionEditPage from './pages/DirectionEditPage';\\
import DirectionRevisionsPage from './pages/DirectionRevisionsPage';\\
import CaseStudiesPage from './pages/CaseStudiesPage';\\
import CaseStudyEditPage from './pages/CaseStudyEditPage';" "$APP_TSX"
    else
        LAST_IMPORT_LINE=$(grep -n "^import " "$APP_TSX" | tail -1 | cut -d: -f1)
        sed -i "${LAST_IMPORT_LINE}a\\
import DirectionsPage from './pages/DirectionsPage';\\
import DirectionEditPage from './pages/DirectionEditPage';\\
import DirectionRevisionsPage from './pages/DirectionRevisionsPage';\\
import CaseStudiesPage from './pages/CaseStudiesPage';\\
import CaseStudyEditPage from './pages/CaseStudyEditPage';" "$APP_TSX"
    fi

    # Add routes trong <Routes>
    if grep -q 'path="leads"' "$APP_TSX"; then
        sed -i '/path="leads"/a\
        <Route path="directions" element={<DirectionsPage />} />\
        <Route path="directions/new" element={<DirectionEditPage />} />\
        <Route path="directions/:id/edit" element={<DirectionEditPage />} />\
        <Route path="directions/:id/revisions" element={<DirectionRevisionsPage />} />\
        <Route path="case-studies" element={<CaseStudiesPage />} />\
        <Route path="case-studies/new" element={<CaseStudyEditPage />} />\
        <Route path="case-studies/:id/edit" element={<CaseStudyEditPage />} />' "$APP_TSX"
    else
        echo -e "    ${YELLOW}⚠  Không tìm path='leads' trong App.tsx${NC}"
        echo -e "    ${YELLOW}   Manual add 7 routes vào <Routes>${NC}"
    fi
    echo -e "    ${GREEN}✅ App.tsx patched${NC}"
fi

# 11b. Auto-patch Layout.tsx (menu)
LAYOUT_TSX="$ADMIN/src/components/Layout.tsx"
if [ -f "$LAYOUT_TSX" ]; then
    if grep -q 'to="/case-studies"' "$LAYOUT_TSX"; then
        echo -e "    ${CYAN}⏭  Layout.tsx đã có Case Studies menu${NC}"
    else
        if grep -q 'to="/leads"' "$LAYOUT_TSX"; then
            # Insert Case Studies sau Leads menu
            sed -i '/to="\/leads"/a\        <NavLink to="/case-studies" className={({isActive}) => isActive ? "active" : ""}>📖 Case Studies</NavLink>' "$LAYOUT_TSX"
            echo -e "    ${GREEN}✅ Added Case Studies menu${NC}"
        fi

        # Nếu chưa có Directions menu, add
        if ! grep -q 'to="/directions"' "$LAYOUT_TSX"; then
            if grep -q 'to="/leads"' "$LAYOUT_TSX"; then
                sed -i '/to="\/leads"/i\        <NavLink to="/directions" className={({isActive}) => isActive ? "active" : ""}>🗺️ Hướng đi (36)</NavLink>' "$LAYOUT_TSX"
                echo -e "    ${GREEN}✅ Added Directions menu${NC}"
            fi
        fi
    fi
else
    echo -e "    ${YELLOW}⚠  Layout.tsx không tồn tại${NC}"
fi

# ─── STEP 12: Build admin SPA ───────────────────────────────
echo -e "${YELLOW}[12/12] 🔨 Build admin SPA...${NC}"
cd "$ADMIN"
if npm run build 2>&1 | tail -10; then
    echo -e "    ${GREEN}✅ Admin SPA built${NC}"
else
    echo -e "    ${RED}❌ Admin build failed. Check output above.${NC}"
    echo -e "    Backend deploy OK, chỉ admin SPA fail. Rollback admin:"
    echo -e "    cp $BAK/App.tsx $ADMIN/src/App.tsx"
    echo -e "    cp $BAK/Layout.tsx $ADMIN/src/components/Layout.tsx"
    echo -e "    cd $ADMIN && npm run build"
fi

# ─── DONE ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DEPLOY XONG!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Kiểm tra ngay:"
echo -e "    ${CYAN}https://adminhuongdi.sol.vn/directions${NC}    (36 direction)"
echo -e "    ${CYAN}https://adminhuongdi.sol.vn/case-studies${NC}  (3 case study)"
echo ""
echo -e "  📊 Smoke test:"
curl -s http://localhost:4001/api/directions 2>/dev/null | grep -o '"count":[0-9]*' | head -1
echo ""
echo -e "  🗂️  Backup tại: ${CYAN}$BAK${NC}"
echo ""
echo -e "  🔄 Rollback nếu cần:"
echo -e "    cp $BAK/schema.prisma $BACKEND/prisma/"
echo -e "    cp $BAK/admin.ts $BACKEND/src/routes/"
echo -e "    cp $BAK/$(basename $ENTRY) $BACKEND/src/"
echo -e "    cp $BAK/App.tsx $ADMIN/src/"
echo -e "    cp $BAK/Layout.tsx $ADMIN/src/components/"
echo -e "    cd $BACKEND && npm run build && pm2 restart huongdi-api"
echo -e "    cd $ADMIN && npm run build"
echo ""
