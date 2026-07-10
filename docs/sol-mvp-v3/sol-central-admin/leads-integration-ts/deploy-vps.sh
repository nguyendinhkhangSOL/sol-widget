#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Sol User Management V1 — Auto Deploy Script
# Chạy trên VPS solop@sol-vps-01
# ═══════════════════════════════════════════════════════════════
set -e

BACKEND_DIR="/var/www/huongdi/backend"
ADMIN_DIR="/var/www/huongdi/admin"
PKG_DIR="$(dirname "$(readlink -f "$0")")"

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 Sol User Management V1 — Auto Deploy"
echo "═══════════════════════════════════════════════════════════════"
echo

# ─── STEP 1: Verify paths ────────────────────────────────────
[ -d "$BACKEND_DIR" ] || { echo "❌ $BACKEND_DIR không tồn tại"; exit 1; }
[ -d "$ADMIN_DIR" ] || { echo "❌ $ADMIN_DIR không tồn tại"; exit 1; }
[ -f "$PKG_DIR/backend/routes/leads.ts" ] || { echo "❌ Package chưa đúng — chạy trong sol-user-mgmt-v1-deploy/"; exit 1; }

# ─── STEP 2: Backup ─────────────────────────────────────────
echo "[1/9] 🗂  Backup files hiện tại..."
BAK_DIR="/tmp/sol-user-mgmt-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BAK_DIR"
cp "$BACKEND_DIR/prisma/schema.prisma" "$BAK_DIR/" 2>/dev/null || true
cp "$BACKEND_DIR/src/routes/admin.ts" "$BAK_DIR/" 2>/dev/null || true
cp "$BACKEND_DIR/src/index.ts" "$BAK_DIR/" 2>/dev/null || cp "$BACKEND_DIR/src/server.ts" "$BAK_DIR/" 2>/dev/null || true
cp "$ADMIN_DIR/src/App.tsx" "$BAK_DIR/" 2>/dev/null || true
cp "$ADMIN_DIR/src/utils/api.ts" "$BAK_DIR/" 2>/dev/null || true
cp "$ADMIN_DIR/src/components/Layout.tsx" "$BAK_DIR/" 2>/dev/null || true
echo "    ✅ Backup tại: $BAK_DIR"

# ─── STEP 3: Copy backend files ──────────────────────────────
echo "[2/9] 📥 Copy backend files..."
cp "$PKG_DIR/backend/routes/leads.ts"           "$BACKEND_DIR/src/routes/leads.ts"
cp "$PKG_DIR/backend/services/notification.ts"  "$BACKEND_DIR/src/services/notification.ts"
echo "    ✅ Backend files copied"

# ─── STEP 4: Prisma schema append ────────────────────────────
echo "[3/9] 🗄  Append Prisma models..."
if grep -q "model Lead " "$BACKEND_DIR/prisma/schema.prisma"; then
  echo "    ⏭  Đã có model Lead — skip append"
else
  echo "" >> "$BACKEND_DIR/prisma/schema.prisma"
  cat "$PKG_DIR/prisma-additions.prisma" >> "$BACKEND_DIR/prisma/schema.prisma"
  echo "    ✅ Đã append 2 models + 4 enums"
fi

# ─── STEP 5: Install nodemailer ──────────────────────────────
echo "[4/9] 📦 Install nodemailer..."
cd "$BACKEND_DIR"
if ! grep -q "nodemailer" package.json; then
  npm install nodemailer @types/nodemailer --save
fi
echo "    ✅ Nodemailer ready"

# ─── STEP 6: Prisma migrate ──────────────────────────────────
echo "[5/9] 🔄 Prisma migrate..."
cd "$BACKEND_DIR"
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push
echo "    ✅ Migration done"

# ─── STEP 7: MANUAL edits reminder ───────────────────────────
echo
echo "═══════════════════════════════════════════════════════════════"
echo "  ⚠️  MANUAL EDITS CẦN LÀM (không auto được):"
echo "═══════════════════════════════════════════════════════════════"
echo
echo "▶ 1. $BACKEND_DIR/src/routes/admin.ts"
echo "   Thêm imports ở đầu file:"
echo '     import crypto from "crypto";'
echo '     import { sendMagicLinkToUser, makeZaloDeepLink, makeZaloMessage } from "../services/notification";'
echo "   Sau đó paste content của $PKG_DIR/backend/routes/admin-leads-block.ts"
echo "   vào TRƯỚC export default router;"
echo
echo "▶ 2. $BACKEND_DIR/src/index.ts (hoặc server.ts hay app.ts):"
echo '     import leadsRouter from "./routes/leads";'
echo '     app.use("/api/leads", leadsRouter);'
echo '     app.use("/api/activate", leadsRouter);'
echo
echo "▶ 3. $ADMIN_DIR/src/utils/api.ts"
echo "   Paste content của $PKG_DIR/admin/utils/api-additions.ts vào cuối file"
echo
echo "▶ 4. $ADMIN_DIR/src/App.tsx"
echo '     import LeadsPage from "./pages/LeadsPage";'
echo '     <Route path="leads" element={<LeadsPage />} />'
echo
echo "▶ 5. $ADMIN_DIR/src/components/Layout.tsx"
echo "   Thêm menu link:  <NavLink to=\"/leads\">💰 Leads</NavLink>"
echo
echo "▶ 6. $BACKEND_DIR/.env — thêm:"
cat << 'ENVEOF'
     ADMIN_EMAIL=nguyendinhkhang@gmail.com
     ADMIN_ZALO=0912727381
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=nguyendinhkhang@gmail.com
     SMTP_PASS=<16-char Gmail App Password>
     SMTP_FROM="Sol Payment Bot <hello@sol.vn>"
ENVEOF
echo
echo "═══════════════════════════════════════════════════════════════"
read -p "  ↩ Xong 6 edits? Enter để tiếp tục build (hoặc Ctrl+C để pause)"

# ─── STEP 8: Copy admin React files ──────────────────────────
echo "[6/9] 🎨 Copy React admin files..."
cp "$PKG_DIR/admin/pages/LeadsPage.tsx" "$ADMIN_DIR/src/pages/LeadsPage.tsx"
echo "    ✅ LeadsPage.tsx copied"

# ─── STEP 9: Build backend ───────────────────────────────────
echo "[7/9] 🔨 Build backend..."
cd "$BACKEND_DIR"
npm run build
echo "    ✅ Backend built"

# ─── STEP 10: Build admin SPA ────────────────────────────────
echo "[8/9] 🔨 Build admin SPA..."
cd "$ADMIN_DIR"
npm run build
echo "    ✅ Admin SPA built"

# ─── STEP 11: Restart PM2 ────────────────────────────────────
echo "[9/9] ♻️  Restart PM2..."
pm2 restart huongdi-api
sleep 2
pm2 logs huongdi-api --lines 10 --nostream

echo
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOY XONG!"
echo "═══════════════════════════════════════════════════════════════"
echo
echo "  🧪 Test:"
echo "    curl -X POST https://huongdi.sol.vn/api/leads \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"ten\":\"Test\",\"sdt\":\"0912345678\",\"email\":\"test@sol.vn\",\"goi\":\"active\"}'"
echo
echo "  🌐 Admin panel:"
echo "    https://adminhuongdi.sol.vn/leads"
echo
echo "  📧 Check email Khang inbox có thấy notification không"
echo
echo "  ⚠ Nếu có lỗi:"
echo "    - Xem PM2 log: pm2 logs huongdi-api"
echo "    - Rollback: cp -r $BAK_DIR/* /var/www/huongdi/ tương ứng"
echo
