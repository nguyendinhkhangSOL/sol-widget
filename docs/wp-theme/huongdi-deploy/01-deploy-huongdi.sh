#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# HUONGDI.SOL.VN — Automation Deploy Script (Bước 2-7)
# ═══════════════════════════════════════════════════════════════════════
#
# Sử dụng:
#   sudo bash 01-deploy-huongdi.sh
#
# Script tự động:
#   1. Tiền kiểm tra (Node, PM2, PostgreSQL, port 4001)
#   2. Tạo PostgreSQL DB + user
#   3. Upload/clone code
#   4. Tạo file .env
#   5. npm ci + prisma generate + build
#   6. prisma migrate deploy + seed
#   7. PM2 start + save
#   8. Smoke test local (curl :4001/health)
#
# Sau script này → chạy Bước 4 manual (nginx + certbot).
# ═══════════════════════════════════════════════════════════════════════

set -e  # Exit on error
set -u  # Exit on undefined var

# ── Color codes ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── Config ──────────────────────────────────────────────────────────────
DEPLOY_DIR="/var/www/huongdi"
DB_NAME="huongdi_prod"
DB_USER="huongdi_user"
APP_NAME="huongdi-api"
APP_PORT="4001"
RUN_USER="${SUDO_USER:-root}"  # User chạy npm/PM2

# ── Header ──────────────────────────────────────────────────────────────
clear
cat << 'EOF'
═══════════════════════════════════════════════════════════════════════
   🌅  HUONGDI.SOL.VN — Automation Deploy Script
   Server: 103.72.57.11 · Bước 2-7 trong DEPLOY_GUIDE.md
═══════════════════════════════════════════════════════════════════════
EOF
echo ""

# ── Step 0: Pre-flight checks ───────────────────────────────────────────
info "Step 0/8: Pre-flight checks..."

# Check sudo
[ "$EUID" -ne 0 ] && error "Phải chạy với sudo: sudo bash $0"

# Check Node version
if ! command -v node &>/dev/null; then
    error "Node.js chưa cài. Cài qua: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
[ "$NODE_MAJOR" -lt 20 ] && error "Node version $NODE_MAJOR < 20. Upgrade Node trước."
success "Node $(node -v)"

# Check PM2
if ! command -v pm2 &>/dev/null; then
    warn "PM2 chưa cài. Cài: npm install -g pm2"
    read -p "Cài PM2 ngay? (y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] && npm install -g pm2 || error "Cần PM2 để chạy app"
fi
success "PM2 $(pm2 -v)"

# Check PostgreSQL
if ! command -v psql &>/dev/null; then
    error "PostgreSQL chưa cài. Cài: sudo apt-get install -y postgresql postgresql-contrib"
fi
if ! systemctl is-active --quiet postgresql; then
    warn "PostgreSQL không chạy. Start..."
    systemctl start postgresql
fi
success "PostgreSQL $(psql --version | awk '{print $3}')"

# Check Nginx
command -v nginx &>/dev/null || warn "Nginx chưa cài (sẽ cần ở Bước 4)"

# Check port 4001
if lsof -i :$APP_PORT &>/dev/null; then
    error "Port $APP_PORT đang được dùng. Stop process khác trước."
fi
success "Port $APP_PORT rảnh"

# Check DNS
DNS_HUONGDI=$(dig huongdi.sol.vn +short 2>/dev/null | tail -1)
DNS_ADMIN=$(dig adminhuongdi.sol.vn +short 2>/dev/null | tail -1)
if [ "$DNS_HUONGDI" != "103.72.57.11" ] || [ "$DNS_ADMIN" != "103.72.57.11" ]; then
    warn "DNS chưa propagate (huongdi=$DNS_HUONGDI, admin=$DNS_ADMIN)"
    warn "Tiếp tục — có thể cần chờ DNS trước khi chạy certbot ở Bước 4"
else
    success "DNS đã trỏ đúng 103.72.57.11"
fi

# Check RAM
RAM_FREE=$(free -m | awk 'NR==2{print $7}')
[ "$RAM_FREE" -lt 300 ] && warn "RAM available thấp: ${RAM_FREE}MB (recommend >= 500MB)"
success "RAM available: ${RAM_FREE}MB"

echo ""
echo "─────────────────────────────────────────────────────────────────"

# ── Step 1: Collect credentials ─────────────────────────────────────────
info "Step 1/8: Thu thập credentials..."

echo ""
echo "Em sẽ hỏi anh các credentials. Tip:"
echo "  - JWT secret: openssl rand -hex 64"
echo "  - DB password: openssl rand -base64 32"
echo ""

read -sp "DB password cho huongdi_user: " DB_PASSWORD; echo
[ -z "$DB_PASSWORD" ] && error "DB password không được rỗng"

read -sp "JWT_SECRET (64 chars hex): " JWT_SECRET; echo
[ ${#JWT_SECRET} -lt 32 ] && error "JWT_SECRET quá ngắn (cần >= 32 chars)"

read -sp "ADMIN_SEED_PASSWORD (cho admin@sol.vn): " ADMIN_PASSWORD; echo
[ -z "$ADMIN_PASSWORD" ] && error "Admin password không được rỗng"

read -p "ZALO_APP_ID (19 chữ số): " ZALO_APP_ID
read -sp "ZALO_APP_SECRET (32 chars): " ZALO_APP_SECRET; echo

read -p "SMTP_USER Brevo (vd 123456@smtp-brevo.com): " SMTP_USER
read -sp "SMTP_PASS Brevo (32 chars key): " SMTP_PASS; echo

read -sp "ANTHROPIC_API_KEY (sk-ant-...): " ANTHROPIC_KEY; echo

echo ""
echo "Code source:"
echo "  (1) Git repo (clone)"
echo "  (2) Local folder (đã upload sẵn vào /var/www/huongdi/)"
echo "  (3) SCP từ máy local (em sẽ skip — anh tự upload trước khi chạy)"
read -p "Chọn (1/2/3): " CODE_SRC

if [ "$CODE_SRC" = "1" ]; then
    read -p "Git URL (vd https://github.com/khang/huongdi.git): " REPO_URL
elif [ "$CODE_SRC" = "2" ]; then
    [ ! -d "$DEPLOY_DIR/backend" ] && error "Folder $DEPLOY_DIR/backend không tồn tại. Upload code trước."
    success "Sử dụng code đã có ở $DEPLOY_DIR"
elif [ "$CODE_SRC" = "3" ]; then
    error "Anh scp code lên trước, rồi chạy lại script với option 2"
else
    error "Chọn 1, 2, hoặc 3"
fi

echo ""
echo "─────────────────────────────────────────────────────────────────"

# ── Step 2: PostgreSQL Setup ────────────────────────────────────────────
info "Step 2/8: Tạo PostgreSQL DB + user..."

# Check DB tồn tại chưa — PostgreSQL không cho CREATE DATABASE trong DO block
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null)
if [ "$DB_EXISTS" != "1" ]; then
    info "Tạo database $DB_NAME..."
    sudo -u postgres createdb "$DB_NAME"
    success "Database $DB_NAME đã tạo"
else
    info "Database $DB_NAME đã tồn tại — skip"
fi

# Check user tồn tại chưa
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename='$DB_USER'" 2>/dev/null)
if [ "$USER_EXISTS" != "1" ]; then
    info "Tạo user $DB_USER..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    success "User $DB_USER đã tạo"
else
    info "User $DB_USER đã tồn tại — update password..."
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
fi

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO $DB_USER;" 2>/dev/null || true

# Verify connection
export PGPASSWORD="$DB_PASSWORD"
if psql -U $DB_USER -d $DB_NAME -h localhost -c "SELECT 1;" &>/dev/null; then
    success "DB $DB_NAME + user $DB_USER đã tạo, connection OK"
else
    error "Không kết nối được DB. Check password."
fi
unset PGPASSWORD

# ── Step 3: Setup code ──────────────────────────────────────────────────
info "Step 3/8: Setup code..."

mkdir -p "$DEPLOY_DIR"
chown -R $RUN_USER:$RUN_USER "$DEPLOY_DIR"

if [ "$CODE_SRC" = "1" ]; then
    cd "$DEPLOY_DIR"
    if [ -d ".git" ]; then
        info "Repo đã clone — pull update..."
        sudo -u $RUN_USER git pull
    else
        info "Cloning từ $REPO_URL..."
        sudo -u $RUN_USER git clone "$REPO_URL" .
    fi
fi

[ ! -d "$DEPLOY_DIR/backend" ] && error "Backend folder không tìm thấy. Code structure phải có /backend/"
success "Code ready ở $DEPLOY_DIR"

# ── Step 4: Tạo .env ────────────────────────────────────────────────────
info "Step 4/8: Tạo file .env..."

ENV_FILE="$DEPLOY_DIR/backend/.env"

cat > "$ENV_FILE" <<EOF
# ═══════════════════════════════════════════════════════════════════
# HUONGDI.SOL.VN — Production Environment
# Generated: $(date -Iseconds)
# ═══════════════════════════════════════════════════════════════════

# ── Runtime ───────────────────────────────────────────
NODE_ENV=production
PORT=$APP_PORT
PUBLIC_ORIGIN=https://huongdi.sol.vn

# ── Database ──────────────────────────────────────────
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public&connection_limit=20"

# ── Auth ──────────────────────────────────────────────
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=30d

# ── CORS ──────────────────────────────────────────────
CORS_ORIGINS=https://huongdi.sol.vn,https://adminhuongdi.sol.vn

# ── Zalo OAuth (dùng chung với bothuocla) ─────────────
ZALO_APP_ID=$ZALO_APP_ID
ZALO_APP_SECRET=$ZALO_APP_SECRET
ZALO_REDIRECT_URI=https://huongdi.sol.vn/api/auth/zalo/callback
ZALO_FRONTEND_URL=https://huongdi.sol.vn

# ── Brevo SMTP ────────────────────────────────────────
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM=noreply@sol.vn

# ── Anthropic AI ──────────────────────────────────────
ANTHROPIC_API_KEY=$ANTHROPIC_KEY
CLAUDE_MODEL_PRIMARY=claude-sonnet-4-6
AI_DAILY_QUOTA_MSGS=30
AI_MAX_OUTPUT_TOKENS=400

# ── Admin Seed ────────────────────────────────────────
ADMIN_SEED_PASSWORD=$ADMIN_PASSWORD
ADMIN_SEED_EMAIL=admin@sol.vn

# ── Scheduler ─────────────────────────────────────────
ENABLE_SCHEDULER=true
EOF

chmod 600 "$ENV_FILE"
chown $RUN_USER:$RUN_USER "$ENV_FILE"
success ".env tạo tại $ENV_FILE (chmod 600)"

# ── Step 5: Install dependencies + Build ────────────────────────────────
info "Step 5/8: npm ci + Prisma generate + Build..."

cd "$DEPLOY_DIR/backend"
sudo -u $RUN_USER bash -c "
  cd '$DEPLOY_DIR/backend'
  npm ci --silent
  npx prisma generate
  npm run build
"
success "Backend built — dist/ ready"

# ── Step 6: Prisma migrate + seed ───────────────────────────────────────
info "Step 6/8: Prisma migrate + seed 37 directions..."

cd "$DEPLOY_DIR/backend"
sudo -u $RUN_USER bash -c "
  cd '$DEPLOY_DIR/backend'
  npx prisma migrate deploy
  npx tsx prisma/seed.ts 2>/dev/null || npx ts-node prisma/seed.ts 2>/dev/null || node prisma/seed.js
"

# Verify seed
export PGPASSWORD="$DB_PASSWORD"
DIRECTION_COUNT=$(psql -U $DB_USER -d $DB_NAME -h localhost -t -c "SELECT COUNT(*) FROM directions;" 2>/dev/null | xargs || echo 0)
unset PGPASSWORD

if [ "$DIRECTION_COUNT" = "37" ]; then
    success "Seed OK — 37 directions trong DB"
else
    warn "Direction count = $DIRECTION_COUNT (expect 37). Check seed log."
fi

# ── Step 7: PM2 Start ───────────────────────────────────────────────────
info "Step 7/8: PM2 start huongdi-api..."

cd "$DEPLOY_DIR/backend"

# Check if process already exists
if sudo -u $RUN_USER pm2 list | grep -q "$APP_NAME"; then
    warn "PM2 process $APP_NAME đã tồn tại. Reload..."
    sudo -u $RUN_USER pm2 reload $APP_NAME --update-env
else
    sudo -u $RUN_USER pm2 start ecosystem.config.js --env production
fi

sudo -u $RUN_USER pm2 save

# Wait for API to start
sleep 3

# ── Step 8: Smoke test local ────────────────────────────────────────────
info "Step 8/8: Smoke test local..."

if curl -sf http://localhost:$APP_PORT/health > /tmp/healthz.json 2>/dev/null; then
    success "API health check OK"
    cat /tmp/healthz.json | head -3
else
    warn "API không trả /health. Check logs:"
    sudo -u $RUN_USER pm2 logs $APP_NAME --lines 30 --nostream
fi

# ── DONE ────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
success "DEPLOY HOÀN TẤT — Bước 2-7 xong"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Status:"
echo "   - Database: $DB_NAME (user: $DB_USER)"
echo "   - Directions seeded: $DIRECTION_COUNT/37"
echo "   - PM2 process: $APP_NAME (port $APP_PORT)"
echo "   - Code: $DEPLOY_DIR"
echo "   - .env: $ENV_FILE (chmod 600)"
echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1. Setup Nginx vhost (Bước 8):"
echo "   sudo cp 02-nginx-huongdi.sol.vn.conf /etc/nginx/sites-available/huongdi.sol.vn"
echo "   sudo cp 03-nginx-adminhuongdi.sol.vn.conf /etc/nginx/sites-available/adminhuongdi.sol.vn"
echo "   sudo ln -s /etc/nginx/sites-available/huongdi.sol.vn /etc/nginx/sites-enabled/"
echo "   sudo ln -s /etc/nginx/sites-available/adminhuongdi.sol.vn /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "2. Lấy SSL (Bước 9):"
echo "   sudo certbot --nginx -d huongdi.sol.vn -d adminhuongdi.sol.vn \\"
echo "     --email nguyendinhkhang@gmail.com --agree-tos --no-eff-email"
echo ""
echo "3. Build Admin SPA (Bước 10) — nếu code có /admin/:"
echo "   cd $DEPLOY_DIR/admin && npm install && npm run build"
echo ""
echo "4. Smoke test end-to-end:"
echo "   sudo bash 05-smoke-test.sh"
echo ""
echo "⚠️  GHI NHỚ password admin@sol.vn:"
echo "   $(echo $ADMIN_PASSWORD | sed 's/./*/g')  (em đã hide để screen capture an toàn)"
echo "   Đổi password ngay sau lần login đầu!"
echo ""
