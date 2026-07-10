#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# FIX BROKEN — Sửa 4 file bị lỗi sau rollback không sạch
# Chạy: bash /tmp/directions-integration-ts/fix-broken.sh
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
echo -e "${CYAN}  🔧 FIX BROKEN FILES${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── Fix 1: index.ts ─────────────────────────────────────────
echo -e "${YELLOW}[1/6] Fix index.ts (xóa directionRouter imports)...${NC}"
sed -i '/import.*directionRouter/d; /app\.use.*directionRouter/d' "$BACKEND/src/index.ts"
REMAINING=$(grep -c "directions\|Directions" "$BACKEND/src/index.ts" || echo 0)
if [ "$REMAINING" -eq 0 ]; then
    echo -e "    ${GREEN}✅ Clean${NC}"
else
    echo -e "    ${YELLOW}⚠  Còn $REMAINING dòng — check thủ công:${NC}"
    grep -n "directions\|Directions" "$BACKEND/src/index.ts"
fi

# ─── Fix 2: App.tsx ──────────────────────────────────────────
echo -e "${YELLOW}[2/6] Fix App.tsx (xóa Directions/CaseStudy imports + routes)...${NC}"
sed -i '/DirectionsPage/d; /DirectionEditPage/d; /DirectionRevisionsPage/d; /CaseStudiesPage/d; /CaseStudyEditPage/d' "$ADMIN/src/App.tsx"
REMAINING=$(grep -c "Direction\|CaseStud" "$ADMIN/src/App.tsx" || echo 0)
if [ "$REMAINING" -eq 0 ]; then
    echo -e "    ${GREEN}✅ Clean${NC}"
else
    echo -e "    ${YELLOW}⚠  Còn $REMAINING dòng:${NC}"
    grep -n "Direction\|CaseStud" "$ADMIN/src/App.tsx"
fi

# ─── Fix 3: auth.ts duplicate authRouter ─────────────────────
echo -e "${YELLOW}[3/6] Fix auth.ts (xóa duplicate authRouter)...${NC}"
# Đếm số lần export { router as authRouter }
COUNT=$(grep -c "^export { router as authRouter }" "$BACKEND/src/routes/auth.ts" || echo 0)
if [ "$COUNT" -gt 1 ]; then
    # Xóa dòng duplicate — giữ dòng đầu tiên, xóa dòng thứ 2 trở đi
    awk '/^export \{ router as authRouter \};$/ && seen++ {next} 1' "$BACKEND/src/routes/auth.ts" > "$BACKEND/src/routes/auth.ts.tmp"
    mv "$BACKEND/src/routes/auth.ts.tmp" "$BACKEND/src/routes/auth.ts"
    echo -e "    ${GREEN}✅ Xóa $((COUNT - 1)) duplicate${NC}"
else
    echo -e "    ${CYAN}⏭  Không có duplicate${NC}"
fi

# ─── Fix 4: Layout.tsx menu items ────────────────────────────
echo -e "${YELLOW}[4/6] Fix Layout.tsx (xóa menu directions/case-studies)...${NC}"
if [ -f "$ADMIN/src/components/Layout.tsx" ]; then
    sed -i "/\/directions/d; /\/case-studies/d" "$ADMIN/src/components/Layout.tsx"
    REMAINING=$(grep -c "directions\|case-studies" "$ADMIN/src/components/Layout.tsx" || echo 0)
    if [ "$REMAINING" -eq 0 ]; then
        echo -e "    ${GREEN}✅ Clean${NC}"
    else
        echo -e "    ${YELLOW}⚠  Còn $REMAINING dòng:${NC}"
        grep -n "directions\|case-studies" "$ADMIN/src/components/Layout.tsx"
    fi
else
    echo -e "    ${CYAN}⏭  Layout.tsx không có${NC}"
fi

# ─── Fix 5: Build backend ────────────────────────────────────
echo -e "${YELLOW}[5/6] Build backend...${NC}"
cd "$BACKEND"
if npm run build 2>&1 | tail -15 | grep -q "error TS"; then
    echo -e "    ${RED}❌ Vẫn còn build error${NC}"
    npm run build 2>&1 | tail -15
    exit 1
else
    echo -e "    ${GREEN}✅ Backend built OK${NC}"
fi

# ─── Fix 6: Build admin + PM2 restart ────────────────────────
echo -e "${YELLOW}[6/6] Build admin + PM2 restart...${NC}"
cd "$ADMIN"
if npm run build 2>&1 | tail -15 | grep -q "error TS"; then
    echo -e "    ${RED}❌ Admin build error${NC}"
    npm run build 2>&1 | tail -15
    exit 1
else
    echo -e "    ${GREEN}✅ Admin built OK${NC}"
fi

pm2 restart huongdi-api > /dev/null
sleep 3
echo ""
pm2 logs huongdi-api --lines 8 --nostream

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ FIX XONG!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verify
echo -e "  📊 Verify:"
LEADS=$(curl -s http://localhost:4001/api/leads/count 2>/dev/null || echo "FAIL")
echo -e "    Leads API: $LEADS"
echo ""
echo -e "  🌐 Test: ${CYAN}https://adminhuongdi.sol.vn/leads${NC}"
echo ""
echo -e "  🚀 Sau khi verify OK, deploy sạch Batch 1:"
echo -e "    ${CYAN}bash /tmp/directions-integration-ts/deploy-all.sh /tmp/buoc3.html${NC}"
echo ""
