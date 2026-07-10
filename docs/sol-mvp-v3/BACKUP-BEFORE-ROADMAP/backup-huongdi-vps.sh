#!/bin/bash
# ═══════════════════════════════════════════════
# Backup huongdi.sol.vn — Code + DB
# Chạy trên VPS: bash /tmp/backup-huongdi-vps.sh
# ═══════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

DATE=$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_DIR="/var/backups/sol/${DATE}-before-roadmap"

echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sol Backup — Before Bước 4 Roadmap Build    ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "Backup destination: ${BACKUP_DIR}"
echo ""

sudo mkdir -p "$BACKUP_DIR"

# ─── 1. Backup /var/www/huongdi code ────────────
echo -e "${YELLOW}[1/6] Archiving /var/www/huongdi (excluding node_modules)...${NC}"
sudo tar --exclude='node_modules' --exclude='.next' --exclude='dist' \
    -czf "$BACKUP_DIR/huongdi-code.tar.gz" \
    -C /var/www huongdi 2>/dev/null

CODE_SIZE=$(du -h "$BACKUP_DIR/huongdi-code.tar.gz" | cut -f1)
echo -e "    ${GREEN}✅ huongdi-code.tar.gz${NC} (${CODE_SIZE})"

# ─── 2. Backup Postgres DB ──────────────────────
echo ""
echo -e "${YELLOW}[2/6] pg_dump huongdi_prod...${NC}"
DB_NAME=$(sudo grep 'DATABASE_URL' /var/www/huongdi/backend/.env 2>/dev/null | \
    grep -oP 'postgresql://[^:]+:[^@]+@[^:/]+:[0-9]+/\K[^?]+' | head -1)

if [ -z "$DB_NAME" ]; then
    DB_NAME="huongdi_prod"
    echo -e "    ${YELLOW}⚠ DB name not detected, defaulting to: $DB_NAME${NC}"
fi

sudo -u postgres pg_dump "$DB_NAME" \
    --no-owner --no-acl \
    --clean --if-exists \
    -f "/tmp/huongdi-db.sql" 2>&1 | tail -5

sudo mv /tmp/huongdi-db.sql "$BACKUP_DIR/huongdi-db.sql"
sudo gzip "$BACKUP_DIR/huongdi-db.sql"

DB_SIZE=$(du -h "$BACKUP_DIR/huongdi-db.sql.gz" | cut -f1)
echo -e "    ${GREEN}✅ huongdi-db.sql.gz${NC} (${DB_SIZE})"

# ─── 3. Backup .env files ──────────────────────
echo ""
echo -e "${YELLOW}[3/6] Backup .env files (SMTP, JWT, API keys)...${NC}"
if [ -f "/var/www/huongdi/backend/.env" ]; then
    sudo cp /var/www/huongdi/backend/.env "$BACKUP_DIR/backend.env"
    echo -e "    ${GREEN}✅ backend.env${NC}"
fi

# ─── 4. Backup Nginx config ─────────────────────
echo ""
echo -e "${YELLOW}[4/6] Backup Nginx config...${NC}"
sudo cp /etc/nginx/sites-available/huongdi.sol.vn "$BACKUP_DIR/nginx-huongdi.conf" 2>/dev/null || echo "   (no config)"
sudo cp /etc/nginx/sites-available/adminhuongdi.sol.vn "$BACKUP_DIR/nginx-adminhuongdi.conf" 2>/dev/null || echo "   (no config)"
echo -e "    ${GREEN}✅ nginx configs${NC}"

# ─── 5. Backup PM2 process list ────────────────
echo ""
echo -e "${YELLOW}[5/6] Backup PM2 process list...${NC}"
pm2 save 2>/dev/null || true
pm2 list > "$BACKUP_DIR/pm2-status.txt" 2>&1
echo -e "    ${GREEN}✅ pm2-status.txt${NC}"

# ─── 6. Metadata + verification ────────────────
echo ""
echo -e "${YELLOW}[6/6] Verify + metadata...${NC}"
cat > "/tmp/BACKUP-INFO.txt" << METAEOF
Sol Backup — Before Bước 4 Roadmap Build
========================================
Date: $(date +'%Y-%m-%d %H:%M:%S')
Hostname: $(hostname)
User: $(whoami)
Purpose: Snapshot trước khi build Bước 4 Roadmap 90 ngày
DB: $DB_NAME

Files:
$(sudo ls -la $BACKUP_DIR/ 2>/dev/null)

Restore code:
  sudo tar -xzf huongdi-code.tar.gz -C /var/www/

Restore DB:
  gunzip huongdi-db.sql.gz
  sudo -u postgres psql $DB_NAME < huongdi-db.sql
METAEOF

sudo mv /tmp/BACKUP-INFO.txt "$BACKUP_DIR/BACKUP-INFO.txt"

TOTAL_SIZE=$(sudo du -sh "$BACKUP_DIR" | cut -f1)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Backup Complete — ${TOTAL_SIZE}                ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "Location: ${CYAN}$BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}Files:${NC}"
sudo ls -la "$BACKUP_DIR/"
echo ""
echo -e "${CYAN}Download về máy anh (optional):${NC}"
echo -e "  scp -r sol-vps:$BACKUP_DIR ./backup-huongdi-$(date +%F)/"
