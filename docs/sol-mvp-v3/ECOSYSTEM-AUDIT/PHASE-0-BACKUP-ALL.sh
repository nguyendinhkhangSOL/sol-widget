#!/bin/bash
# Phase 0 — Backup 3 domains active DEV trước khi reorganize
# Chạy trên VPS: bash /tmp/PHASE-0-BACKUP-ALL.sh
#
# Backup:
#   1. huongdi.sol.vn — /var/www/huongdi/ (public + backend + DB)
#   2. adminhuongdi.sol.vn — /var/www/adminhuongdi/ (nếu có)
#   3. Copy backups sẵn có tồn tại → 1 nơi tập trung
#
# KHÔNG đụng:
#   - admin.sol.vn (ổn định, riêng biệt)
#   - bothuocla.sol.vn (ổn định, đã stable)
#   - sol.vn WordPress (shared host — anh backup thủ công qua cPanel)

set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

DATE=$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_ROOT="/var/backups/sol-ecosystem/${DATE}"

echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sol Ecosystem — FULL BACKUP                   ${NC}"
echo -e "${CYAN}  Date: ${DATE}                                  ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

sudo mkdir -p "$BACKUP_ROOT"/{huongdi,adminhuongdi,databases,configs}

# ─── 1. Backup huongdi.sol.vn code ────────────────
echo -e "${YELLOW}[1/7] Backup huongdi.sol.vn code${NC}"
if [ -d "/var/www/huongdi" ]; then
    sudo tar --exclude='node_modules' --exclude='.next' --exclude='dist' \
        --exclude='*.bak-*' --exclude='*.bak.*' \
        -czf "$BACKUP_ROOT/huongdi/huongdi-full.tar.gz" \
        -C /var/www huongdi 2>/dev/null
    SIZE=$(du -h "$BACKUP_ROOT/huongdi/huongdi-full.tar.gz" | cut -f1)
    echo -e "   ${GREEN}✓ huongdi-full.tar.gz${NC} (${SIZE})"
else
    echo -e "   ${YELLOW}⚠ /var/www/huongdi không tồn tại${NC}"
fi

# ─── 2. Backup adminhuongdi.sol.vn code (nếu có) ────
echo ""
echo -e "${YELLOW}[2/7] Backup adminhuongdi.sol.vn code${NC}"
if [ -d "/var/www/adminhuongdi" ]; then
    sudo tar --exclude='node_modules' --exclude='.next' --exclude='dist' \
        --exclude='*.bak-*' \
        -czf "$BACKUP_ROOT/adminhuongdi/adminhuongdi-full.tar.gz" \
        -C /var/www adminhuongdi 2>/dev/null
    SIZE=$(du -h "$BACKUP_ROOT/adminhuongdi/adminhuongdi-full.tar.gz" | cut -f1)
    echo -e "   ${GREEN}✓ adminhuongdi-full.tar.gz${NC} (${SIZE})"
else
    # Có thể adminhuongdi nằm trong huongdi/admin/
    if [ -d "/var/www/huongdi/admin" ]; then
        echo -e "   ${YELLOW}⚠ Trong huongdi/admin/ (already in huongdi backup)${NC}"
    else
        echo -e "   ${YELLOW}⚠ Không tìm thấy — check path khác${NC}"
        find /var/www -maxdepth 2 -type d -name "*admin*" 2>/dev/null
    fi
fi

# ─── 3. Backup Postgres huongdi_prod ────────────────
echo ""
echo -e "${YELLOW}[3/7] Backup Postgres DB (huongdi_prod)${NC}"
DB_NAME=$(sudo grep 'DATABASE_URL' /var/www/huongdi/backend/.env 2>/dev/null | \
    grep -oP 'postgresql://[^:]+:[^@]+@[^:/]+:[0-9]+/\K[^?]+' | head -1)
[ -z "$DB_NAME" ] && DB_NAME="huongdi_prod"

sudo -u postgres pg_dump "$DB_NAME" \
    --no-owner --no-acl --clean --if-exists \
    -f "/tmp/huongdi-db.sql" 2>&1 | tail -3

sudo mv /tmp/huongdi-db.sql "$BACKUP_ROOT/databases/${DB_NAME}.sql"
sudo gzip "$BACKUP_ROOT/databases/${DB_NAME}.sql"
DB_SIZE=$(du -h "$BACKUP_ROOT/databases/${DB_NAME}.sql.gz" | cut -f1)
echo -e "   ${GREEN}✓ ${DB_NAME}.sql.gz${NC} (${DB_SIZE})"

# ─── 4. Backup .env files ────────────────────────
echo ""
echo -e "${YELLOW}[4/7] Backup .env files (secrets)${NC}"
if [ -f "/var/www/huongdi/backend/.env" ]; then
    sudo cp /var/www/huongdi/backend/.env "$BACKUP_ROOT/configs/huongdi-backend.env"
    echo -e "   ${GREEN}✓ huongdi-backend.env${NC}"
fi

# ─── 5. Backup Nginx configs ────────────────────
echo ""
echo -e "${YELLOW}[5/7] Backup Nginx configs${NC}"
for site in huongdi.sol.vn adminhuongdi.sol.vn sol.vn; do
    if [ -f "/etc/nginx/sites-available/$site" ]; then
        sudo cp "/etc/nginx/sites-available/$site" "$BACKUP_ROOT/configs/nginx-$site.conf"
        echo -e "   ${GREEN}✓ nginx-$site.conf${NC}"
    fi
done

# ─── 6. Backup PM2 processes ────────────────────
echo ""
echo -e "${YELLOW}[6/7] Backup PM2 process list${NC}"
pm2 save 2>/dev/null || true
pm2 list > "$BACKUP_ROOT/configs/pm2-status.txt" 2>&1
if [ -f "$HOME/.pm2/dump.pm2" ]; then
    sudo cp $HOME/.pm2/dump.pm2 "$BACKUP_ROOT/configs/pm2-dump.pm2"
fi
echo -e "   ${GREEN}✓ pm2-status.txt + pm2-dump.pm2${NC}"

# ─── 7. Create metadata file ────────────────────
echo ""
echo -e "${YELLOW}[7/7] Create backup metadata${NC}"
sudo tee "$BACKUP_ROOT/BACKUP-INFO.md" > /dev/null << METAEOF
# Sol Ecosystem Backup — ${DATE}

## Environment
- Server: $(hostname)
- Date: $(date +'%Y-%m-%d %H:%M:%S')
- User: $(whoami)

## Domains backed up
- ✅ huongdi.sol.vn (code + DB + configs)
- ✅ adminhuongdi.sol.vn (via nginx config)
- ✅ Databases: ${DB_NAME}
- ✅ Nginx configs
- ✅ PM2 process list

## Domains NOT backed up (stable, don't touch)
- ❌ admin.sol.vn
- ❌ bothuocla.sol.vn

## sol.vn WordPress
- 🌐 Shared host — anh phải backup thủ công qua cPanel:
  - File Manager → public_html → Compress → Download
  - phpMyAdmin → Export DB → Download SQL

## Files
$(sudo ls -la $BACKUP_ROOT/ 2>/dev/null)

## Total size
$(sudo du -sh $BACKUP_ROOT 2>/dev/null)

## Restore commands

### Restore code
sudo tar -xzf huongdi/huongdi-full.tar.gz -C /var/www/

### Restore DB
gunzip databases/${DB_NAME}.sql.gz
sudo -u postgres psql ${DB_NAME} < databases/${DB_NAME}.sql

### Restore .env
sudo cp configs/huongdi-backend.env /var/www/huongdi/backend/.env

### Restore Nginx
sudo cp configs/nginx-*.conf /etc/nginx/sites-available/
sudo nginx -t && sudo systemctl reload nginx
METAEOF

echo -e "   ${GREEN}✓ BACKUP-INFO.md${NC}"

# ─── Summary ────────────────────────────────────
TOTAL_SIZE=$(sudo du -sh "$BACKUP_ROOT" | cut -f1)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ BACKUP COMPLETE                                ${NC}"
echo -e "${GREEN}   Total size: ${TOTAL_SIZE}                       ${NC}"
echo -e "${GREEN}   Location: ${BACKUP_ROOT}                        ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Files:${NC}"
sudo find "$BACKUP_ROOT" -type f -exec du -h {} \; | sort -k1,1h
echo ""
echo -e "${YELLOW}=== NEXT STEPS ===${NC}"
echo -e "  1. Download backup về máy anh (an toàn hơn):"
echo -e "     ${CYAN}scp -r sol-vps:${BACKUP_ROOT} C:\\BOTHUOCLA\\backups\\${DATE}${NC}"
echo -e ""
echo -e "  2. Anh backup thủ công sol.vn WordPress qua cPanel"
echo -e ""
echo -e "  3. Sau khi có backup an toàn → tổ chức lại Git repo"
