#!/bin/bash
# =================================================================
# Sol Backend Deployment — Express + Prisma + 26 cron jobs
# Run on VPS: bash /var/www/sol-widget/scripts/deploy-backend.sh
#
# Prerequisites:
#   1. Code repo cloned tại /var/www/sol-widget-old/
#   2. Postgres running (port 5432)
#   3. Node 20 + PM2 installed
#   4. .env file đã tạo tại /var/www/sol-widget-old/backend/.env
#      (xem .env.production.template để biết biến nào cần)
# =================================================================

set -e

REPO_DIR="/var/www/sol-widget-old"
BACKEND_DIR="$REPO_DIR/backend"
DB_NAME="${DB_NAME:-sol_prod}"
DB_USER="${DB_USER:-sol_app}"
DB_PASSWORD="${DB_PASSWORD:?Phải set DB_PASSWORD trước khi chạy script}"
PM2_NAME="sol-api"

echo ""
echo "================================================="
echo "  SOL BACKEND DEPLOYMENT"
echo "  Repo: $REPO_DIR"
echo "  Backend: $BACKEND_DIR"
echo "  DB: $DB_NAME (user: $DB_USER)"
echo "================================================="
echo ""

# === 1. Sanity checks ===
echo "[1/8] Sanity checks..."

if [ ! -d "$BACKEND_DIR" ]; then
    echo "  ❌ Backend dir không tồn tại: $BACKEND_DIR"
    echo "  Chạy: cd /var/www && git clone <repo-url> sol-widget-old"
    exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "  ❌ Thiếu file .env tại $BACKEND_DIR/.env"
    echo "  Copy từ .env.production.template, điền giá trị thật"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v 2>/dev/null || echo "MISSING")
if [[ "$NODE_VERSION" != v20* ]] && [[ "$NODE_VERSION" != v22* ]]; then
    echo "  ⚠️  Node version: $NODE_VERSION (khuyến nghị v20 LTS hoặc v22)"
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "  ❌ PM2 chưa cài. Run: npm install -g pm2"
    exit 1
fi

# Check Postgres
if ! command -v psql &> /dev/null; then
    echo "  ❌ psql client chưa cài"
    exit 1
fi

echo "  ✓ All checks passed"
echo ""

# === 2. Cleanup .bak files ===
echo "[2/8] Cleanup .bak files..."
cd "$BACKEND_DIR"
find src -name "*.bak*" -type f -delete 2>/dev/null
echo "  ✓ Cleaned"
echo ""

# === 3. Install dependencies ===
echo "[3/8] npm ci..."
npm ci --omit=dev --no-audit --no-fund 2>&1 | tail -5
# Cần devDependencies cho Prisma generate
npm install --save-dev prisma typescript tsx --no-audit --no-fund 2>&1 | tail -3
echo "  ✓ Installed"
echo ""

# === 4. Database setup ===
echo "[4/8] Database setup..."
export PGPASSWORD="postgres"   # Adjust nếu superuser khác

# Tạo DB + user nếu chưa có
sudo -u postgres psql <<EOF 2>&1 | grep -v "already exists" || true
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

echo "  ✓ DB ready"
echo ""

# === 5. Prisma migrate ===
echo "[5/8] Prisma generate + migrate deploy..."
npx prisma generate 2>&1 | tail -3
npx prisma migrate deploy 2>&1 | tail -10
echo "  ✓ Migrations applied"
echo ""

# === 6. Raw SQL files (chạy theo thứ tự chronological mtime) ===
echo "[6/8] Apply 21 raw SQL files..."
export PGPASSWORD="$DB_PASSWORD"

# Thứ tự chronological (cũ → mới)
SQL_FILES=(
    "manual_migration_admin_content.sql"
    "manual_migration_phase5.sql"
    "manual_migration_phase_a.sql"
    "manual_migration_phase_b.sql"
    "manual_migration_email_auth.sql"
    "manual-migration-silent-companionship.sql"
    "fix-canned-reply-encoding.sql"
    "fix-canned-reply-answer.sql"
    "fix-canned-reply-wikilabel.sql"
    "fix-khang-voice-encoding.sql"
    "fix-confession-encoding.sql"
    "fix-content-item-encoding.sql"
    "migrate_v3_schedule.sql"
    "fix_canned_reply_encoding.sql"
    "fix_canned_reply_triggers.sql"
    "create_zalo_tables.sql"
    "fix_admin_name.sql"
    "seed_zalo_templates.sql"
    "manual_migration_phase5_journey.sql"
    "seed_phase5_journey_templates.sql"
    "seed_qday_prep_template.sql"
)

for sql in "${SQL_FILES[@]}"; do
    FULL_PATH="$BACKEND_DIR/prisma/$sql"
    if [ -f "$FULL_PATH" ]; then
        echo "  → $sql"
        psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$FULL_PATH" -v ON_ERROR_STOP=0 2>&1 | tail -2 || true
    else
        echo "  ⚠️  Skip (file missing): $sql"
    fi
done

echo "  ✓ All SQL files processed"
echo ""

# === 7. Build TypeScript ===
echo "[7/8] Build TypeScript (tsc → dist/)..."
npm run build 2>&1 | tail -5
if [ ! -f "$BACKEND_DIR/dist/index.js" ]; then
    echo "  ❌ Build failed — dist/index.js not found"
    exit 1
fi
echo "  ✓ Built"
echo ""

# === 8. Seed CHIP + Q-Day templates ===
echo "[8/8] Seed CHIP + Q-Day templates..."
npm run seed 2>&1 | tail -3 || echo "  ⚠️  seed warning (idempotent — có thể đã chạy)"
npm run seed:triggers 2>&1 | tail -3 || echo "  ⚠️  triggers warning"
npm run seed:qday 2>&1 | tail -3 || echo "  ⚠️  qday warning"
npm run seed:pre-qday 2>&1 | tail -3 || echo "  ⚠️  pre-qday warning"
npm run seed:pillar 2>&1 | tail -3 || echo "  ⚠️  pillar warning"
echo "  ✓ Seed done"
echo ""

# === 9. PM2 start ===
echo "[9/9] PM2 start sol-api..."
pm2 delete "$PM2_NAME" 2>/dev/null || true
cd "$BACKEND_DIR"
pm2 start dist/index.js \
    --name "$PM2_NAME" \
    --max-memory-restart 800M \
    --time \
    --update-env

sleep 4
echo ""
pm2 list | grep "$PM2_NAME"
echo ""

# === 10. Smoke test ===
echo "=== SMOKE TEST ==="
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/healthz)
if [ "$HEALTH" = "200" ]; then
    echo "  ✓ Backend healthz: 200 OK"
else
    echo "  ❌ Backend healthz: $HEALTH (xem pm2 logs sol-api)"
fi

# Test anon auth
ANON_RESP=$(curl -s -X POST http://127.0.0.1:4000/api/auth/anonymous \
    -H "Content-Type: application/json" \
    -d '{"deviceUid":"deploy-smoke-test","originDomain":"bothuocla.sol.vn"}' \
    | head -c 200)
echo "  Anon test response (first 200 chars):"
echo "    $ANON_RESP"

# Count users
USER_COUNT=$(psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | xargs || echo "?")
echo "  → Total users in DB: $USER_COUNT"

# Verify cron loaded
echo ""
echo "  → Cron jobs (xem trong pm2 logs):"
pm2 logs "$PM2_NAME" --lines 10 --nostream 2>/dev/null | grep -i "scheduler\|cron" | tail -3

echo ""
echo "================================================="
echo "  DONE!"
echo "================================================="
echo ""
echo "Next steps:"
echo "  1. Setup nginx config bothuocla.sol.vn để proxy /api/* → 127.0.0.1:4000"
echo "  2. Test https://bothuocla.sol.vn/api/healthz"
echo "  3. Grant admin: npm run admin:grant nguyendinhkhang@gmail.com"
echo ""
echo "Useful commands:"
echo "  pm2 logs sol-api          # Xem realtime log"
echo "  pm2 restart sol-api       # Restart"
echo "  pm2 monit                 # Monitoring dashboard"
echo "  psql -U $DB_USER -d $DB_NAME"
echo ""
