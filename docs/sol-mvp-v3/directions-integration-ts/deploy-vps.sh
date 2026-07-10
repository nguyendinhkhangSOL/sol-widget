#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Sol La Bàn — Directions Integration V1 — Auto Deploy
# Chạy trên VPS: bash deploy-vps.sh
# ═══════════════════════════════════════════════════════════════
set -e

BACKEND_DIR="/var/www/huongdi/backend"
ADMIN_DIR="/var/www/huongdi/admin"
PUBLIC_DIR="/var/www/huongdi/public"
PKG_DIR="$(dirname "$(readlink -f "$0")")"
BUOC3_HTML="${1:-$PUBLIC_DIR/huongdi-phase2/buoc3.html}"

echo "═══════════════════════════════════════════════════════════════"
echo "  🧭 Sol La Bàn — Directions Integration V1 (Batch 1)"
echo "═══════════════════════════════════════════════════════════════"
echo

# ─── STEP 1: Verify paths ────────────────────────────────────
[ -d "$BACKEND_DIR" ] || { echo "❌ $BACKEND_DIR không tồn tại"; exit 1; }
[ -f "$PKG_DIR/prisma-additions.prisma" ] || { echo "❌ Package không đúng thư mục"; exit 1; }
[ -f "$BUOC3_HTML" ] || { echo "❌ buoc3.html không tìm thấy tại $BUOC3_HTML"; exit 1; }

# ─── STEP 2: Backup ─────────────────────────────────────────
echo "[1/9] 🗂️  Backup files hiện tại..."
BAK_DIR="/tmp/directions-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BAK_DIR"
cp "$BACKEND_DIR/prisma/schema.prisma" "$BAK_DIR/schema.prisma"
cp "$BACKEND_DIR/src/routes/admin.ts" "$BAK_DIR/admin.ts" 2>/dev/null || true
cp "$BACKEND_DIR/src/index.ts" "$BAK_DIR/index.ts" 2>/dev/null || \
  cp "$BACKEND_DIR/src/server.ts" "$BAK_DIR/server.ts" 2>/dev/null || true

# Backup PostgreSQL leads tables (untouched by this deploy but safe)
if command -v pg_dump &> /dev/null; then
  pg_dump -U postgres -d huongdi_prod --table=leads --table=lead_notifications > "$BAK_DIR/leads-tables.sql" 2>/dev/null || \
    echo "    ⚠️  pg_dump skip (may need manual auth)"
fi

echo "    ✅ Backup tại: $BAK_DIR"

# ─── STEP 3: Prisma schema append ────────────────────────────
echo "[2/9] 🗄️  Append Prisma models..."
if grep -q "model Direction " "$BACKEND_DIR/prisma/schema.prisma"; then
  echo "    ⏭️  Đã có model Direction — skip append"
else
  echo "" >> "$BACKEND_DIR/prisma/schema.prisma"
  cat "$PKG_DIR/prisma-additions.prisma" >> "$BACKEND_DIR/prisma/schema.prisma"
  echo "    ✅ Đã append 4 models + 4 enums"
fi

# ─── STEP 4: Prisma migrate ──────────────────────────────────
echo "[3/9] 🔄 Prisma migrate..."
cd "$BACKEND_DIR"
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push
echo "    ✅ Migration done"

# ─── STEP 5: Copy backend files ──────────────────────────────
echo "[4/9] 📥 Copy backend files..."
mkdir -p "$BACKEND_DIR/src/routes"
mkdir -p "$BACKEND_DIR/src/seed"

cp "$PKG_DIR/backend/routes/directions.ts" "$BACKEND_DIR/src/routes/directions.ts"
cp "$PKG_DIR/backend/routes/admin-directions-block.ts" "/tmp/admin-directions-block.ts"
cp "$PKG_DIR/backend/seed/extract-from-buoc3.ts" "$BACKEND_DIR/src/seed/"
cp "$PKG_DIR/backend/seed/seed-directions.ts" "$BACKEND_DIR/src/seed/"

echo "    ✅ Files copied"

# ─── STEP 6: Extract 36 direction từ buoc3.html ──────────────
echo "[5/9] 📖 Extract 36 direction từ buoc3.html..."
cd "$BACKEND_DIR"
npx ts-node src/seed/extract-from-buoc3.ts "$BUOC3_HTML"
echo "    ✅ Extract done"

# ─── STEP 7: Seed database ───────────────────────────────────
echo "[6/9] 🌱 Seed 36 direction + 3 case study vào DB..."
npx ts-node src/seed/seed-directions.ts
echo "    ✅ Seed done"

# ─── STEP 8: MANUAL EDITS reminder ───────────────────────────
echo
echo "═══════════════════════════════════════════════════════════════"
echo "  ⚠️  MANUAL EDITS CẦN LÀM (không auto):"
echo "═══════════════════════════════════════════════════════════════"
echo
echo "▶ 1. $BACKEND_DIR/src/routes/admin.ts"
echo "   Nếu chưa có, THÊM ở đầu file:"
echo '     import { PrismaClient } from "@prisma/client";'
echo '     const prismaDirections = new PrismaClient();'
echo ""
echo "   Sau đó paste content của /tmp/admin-directions-block.ts"
echo "   vào TRƯỚC dòng: export default router;"
echo
echo "▶ 2. $BACKEND_DIR/src/index.ts (hoặc server.ts):"
echo '     import directionsRouter from "./routes/directions";'
echo '     app.use("/api/directions", directionsRouter);'
echo
echo "═══════════════════════════════════════════════════════════════"
read -p "  ↩ Xong 2 edits? Enter để tiếp tục build (Ctrl+C để pause)"

# ─── STEP 9: Build backend ───────────────────────────────────
echo "[7/9] 🔨 Build backend..."
cd "$BACKEND_DIR"
npm run build
echo "    ✅ Backend built"

# ─── STEP 10: Restart PM2 ────────────────────────────────────
echo "[8/9] ♻️  Restart PM2..."
pm2 restart huongdi-api
sleep 3
pm2 logs huongdi-api --lines 15 --nostream

# ─── STEP 11: Smoke tests ────────────────────────────────────
echo "[9/9] 🧪 Smoke tests..."
echo
echo "  Test 1: Count directions"
COUNT=$(curl -s http://localhost:4001/api/directions | grep -o '"count":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "    /api/directions count = $COUNT (expected: 36)"

echo "  Test 2: Detail freelancer-ke-toan"
TITLE=$(curl -s http://localhost:4001/api/directions/freelancer-ke-toan | grep -o '"title":"[^"]*"' | head -1)
echo "    title = $TITLE"

echo "  Test 3: Case studies"
CS_COUNT=$(curl -s http://localhost:4001/api/directions/freelancer-ke-toan | grep -o '"caseStudies":\[[^]]*\]' | head -c 200)
echo "    caseStudies = ${CS_COUNT:0:100}..."

echo
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOY BATCH 1 XONG!"
echo "═══════════════════════════════════════════════════════════════"
echo
echo "  🌐 Production URLs:"
echo "    https://huongdi.sol.vn/api/directions        (public API)"
echo "    https://huongdi.sol.vn/api/directions/matches (POST P1+P2 → top 10)"
echo "    https://adminhuongdi.sol.vn/directions        (admin CRUD)"
echo
echo "  📊 Verify DB:"
echo "    psql -U postgres -d huongdi_prod \\"
echo "      -c 'SELECT COUNT(*) FROM directions; SELECT COUNT(*) FROM case_studies;'"
echo
echo "  🔄 Rollback (nếu cần):"
echo "    cp $BAK_DIR/schema.prisma $BACKEND_DIR/prisma/"
echo "    cd $BACKEND_DIR && npx prisma migrate reset"
echo
echo "  ⚠  Frontend buoc3.html VẪN dùng inline DB (không đổi)."
echo "     Batch 2 sẽ refactor buoc3.html gọi API."
echo
