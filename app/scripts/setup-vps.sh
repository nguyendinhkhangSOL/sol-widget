#!/bin/bash
# =================================================================
# Sol Widget v0.2 — VPS Setup Script
# Run on VPS: ssh sol-vps "bash -s" < setup-vps.sh
# OR: scp lên VPS rồi sudo bash setup-vps.sh
# =================================================================

set -e

echo "🚀 Sol Widget v0.2 — VPS Setup"
echo "================================"

# 1. Tạo PostgreSQL user + database
echo ""
echo "[1/5] Setup PostgreSQL..."

# Generate random password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)
echo "  → Generated DB password: $DB_PASSWORD"
echo "  → SAVE NÀY VÀO .env.production!"

sudo -u postgres psql <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'sol_app') THEN
    CREATE USER sol_app WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER sol_app WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

DROP DATABASE IF EXISTS sol_widget;
CREATE DATABASE sol_widget OWNER sol_app;
GRANT ALL PRIVILEGES ON DATABASE sol_widget TO sol_app;
EOF

# Grant schema permissions
sudo -u postgres psql -d sol_widget <<EOF
GRANT ALL ON SCHEMA public TO sol_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sol_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sol_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sol_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sol_app;
EOF

echo "  ✓ PostgreSQL setup OK"

# 2. App directory
echo ""
echo "[2/5] Setup /var/www/sol-widget..."
sudo mkdir -p /var/www/sol-widget
sudo chown solop:solop /var/www/sol-widget
echo "  ✓ /var/www/sol-widget ready"

# 3. PM2 setup
echo ""
echo "[3/5] PM2 setup..."
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi
pm2 -v
echo "  ✓ PM2 installed"

# 4. Log directory
echo ""
echo "[4/5] PM2 logs directory..."
sudo mkdir -p /var/log/pm2
sudo chown solop:solop /var/log/pm2
echo "  ✓ /var/log/pm2 ready"

# 5. Generate .env template
echo ""
echo "[5/5] Generate .env template..."
cat > /tmp/sol-env-template.txt <<ENVEOF
# ====== Sol Widget v0.2 .env.production ======
# COPY các giá trị này vào /var/www/sol-widget/.env

NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://bothuocla.sol.vn

DATABASE_URL=postgresql://sol_app:${DB_PASSWORD}@localhost:5432/sol_widget

# Bank info — UPDATE TRƯỚC LAUNCH
SOL_BANK_SHORT=VCB
SOL_BANK_ACCOUNT=0000000000
SOL_BANK_NAME=NGUYEN DINH KHANG
SOL_QR_TEMPLATE=compact2

# Zalo OA — TODO (sau khi setup oa.zalo.me)
ZALO_OA_ID=
ZALO_OA_ACCESS_TOKEN=
ADMIN_ZALO_PHONE=

# Analytics (đã có)
NEXT_PUBLIC_GA4_ID=G-S5ELGXBLWK
NEXT_PUBLIC_CLARITY_ID=wu12r2qt0o

# Feature flags
NEXT_PUBLIC_LAUNCH_DATE=2026-05-31
NEXT_PUBLIC_TRIAL_DAYS=7
NEXT_PUBLIC_DAILY_RATE=5000
NEXT_PUBLIC_WEEKLY_RATE=35000
ENVEOF

echo "  ✓ Template saved to /tmp/sol-env-template.txt"
echo ""

# Summary
echo ""
echo "================================"
echo "✅ VPS SETUP COMPLETE!"
echo "================================"
echo ""
echo "📝 DB Password: $DB_PASSWORD"
echo ""
echo "📋 Next steps:"
echo "  1. Save DB password to a safe place"
echo "  2. View .env template: cat /tmp/sol-env-template.txt"
echo "  3. Upload Sol Widget source code (run deploy script từ Windows)"
echo "  4. Apply migration: psql \$DATABASE_URL -f /var/www/sol-widget/db/migrations/002_phone_first_refactor.sql"
echo "  5. Build + start PM2"
echo ""
