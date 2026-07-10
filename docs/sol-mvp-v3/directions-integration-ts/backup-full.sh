#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BACKUP FULL — Sol La Bàn ecosystem
# Backup TẤT CẢ trước khi làm bất cứ thao tác nào
# Chạy: bash backup-full.sh [tag]
#   VD: bash backup-full.sh pre-batch1b
# ═══════════════════════════════════════════════════════════════
set -e

TAG="${1:-manual}"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP_ROOT="/home/solop/backups"
BACKUP_DIR="$BACKUP_ROOT/sol-full-$TAG-$TS"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  💾 SOL BACKUP FULL — Tag: $TAG${NC}"
echo -e "${CYAN}  📁 Target: $BACKUP_DIR${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

mkdir -p "$BACKUP_DIR"

# ═══════════════════════════════════════════════════════════════
# 1. PostgreSQL DUMP — FULL DATABASE
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[1/8] 🗄️  PostgreSQL FULL dump...${NC}"
sudo -u postgres pg_dump -Fc huongdi_prod > "$BACKUP_DIR/huongdi_prod.dump" 2>&1
sudo -u postgres pg_dump huongdi_prod > "$BACKUP_DIR/huongdi_prod.sql" 2>&1
SIZE=$(du -h "$BACKUP_DIR/huongdi_prod.dump" | cut -f1)
echo -e "    ${GREEN}✅ Compressed: $SIZE${NC}"

# Per-table backup (dễ inspect)
echo -e "${YELLOW}[2/8] 📋 Per-table CSV exports...${NC}"
mkdir -p "$BACKUP_DIR/tables-csv"
for TABLE in $(sudo -u postgres psql -d huongdi_prod -t -c "\dt" 2>/dev/null | awk '{print $3}' | grep -v '^$'); do
    sudo -u postgres psql -d huongdi_prod -c "\COPY $TABLE TO '$BACKUP_DIR/tables-csv/$TABLE.csv' CSV HEADER" 2>/dev/null && \
        echo -e "    ${GREEN}✅ $TABLE.csv${NC}" || \
        echo -e "    ${YELLOW}⏭  $TABLE (empty or fail)${NC}"
done

# ═══════════════════════════════════════════════════════════════
# 3. Code files — Backend
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[3/8] 💻 Backend code...${NC}"
mkdir -p "$BACKUP_DIR/backend-src"
cp -r /var/www/huongdi/backend/src "$BACKUP_DIR/backend-src/"
cp -r /var/www/huongdi/backend/prisma "$BACKUP_DIR/backend-src/"
cp /var/www/huongdi/backend/package.json "$BACKUP_DIR/backend-src/" 2>/dev/null || true
cp /var/www/huongdi/backend/package-lock.json "$BACKUP_DIR/backend-src/" 2>/dev/null || true
cp /var/www/huongdi/backend/tsconfig.json "$BACKUP_DIR/backend-src/" 2>/dev/null || true
cp /var/www/huongdi/backend/.env "$BACKUP_DIR/backend-src/.env.backup" 2>/dev/null || true
echo -e "    ${GREEN}✅ Backend src + prisma + configs${NC}"

# ═══════════════════════════════════════════════════════════════
# 4. Code files — Admin SPA
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[4/8] 🎨 Admin SPA code...${NC}"
mkdir -p "$BACKUP_DIR/admin-src"
cp -r /var/www/huongdi/admin/src "$BACKUP_DIR/admin-src/"
cp /var/www/huongdi/admin/package.json "$BACKUP_DIR/admin-src/" 2>/dev/null || true
cp /var/www/huongdi/admin/package-lock.json "$BACKUP_DIR/admin-src/" 2>/dev/null || true
cp /var/www/huongdi/admin/tsconfig.json "$BACKUP_DIR/admin-src/" 2>/dev/null || true
cp /var/www/huongdi/admin/vite.config.ts "$BACKUP_DIR/admin-src/" 2>/dev/null || true
echo -e "    ${GREEN}✅ Admin src + configs${NC}"

# ═══════════════════════════════════════════════════════════════
# 5. Nginx configs
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[5/8] 🌐 Nginx configs...${NC}"
mkdir -p "$BACKUP_DIR/nginx"
sudo cp -r /etc/nginx/sites-available "$BACKUP_DIR/nginx/" 2>/dev/null || true
sudo cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/nginx/" 2>/dev/null || true
sudo cp /etc/nginx/nginx.conf "$BACKUP_DIR/nginx/" 2>/dev/null || true
echo -e "    ${GREEN}✅ Nginx configs${NC}"

# ═══════════════════════════════════════════════════════════════
# 6. PM2 config
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[6/8] ♻️  PM2 config...${NC}"
mkdir -p "$BACKUP_DIR/pm2"
pm2 save > /dev/null 2>&1
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2/" 2>/dev/null || true
pm2 list > "$BACKUP_DIR/pm2/pm2-status.txt" 2>&1
pm2 logs huongdi-api --lines 200 --nostream > "$BACKUP_DIR/pm2/pm2-logs.txt" 2>&1
echo -e "    ${GREEN}✅ PM2 dump + logs${NC}"

# ═══════════════════════════════════════════════════════════════
# 7. Public static files (frontend huongdi.sol.vn)
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[7/8] 📄 Public HTML files...${NC}"
if [ -d "/var/www/huongdi/public" ]; then
    mkdir -p "$BACKUP_DIR/public"
    # Chỉ backup HTML/JS/CSS gốc, không backup dist build
    cp /var/www/huongdi/public/*.html "$BACKUP_DIR/public/" 2>/dev/null || true
    cp -r /var/www/huongdi/public/huongdi-phase2 "$BACKUP_DIR/public/" 2>/dev/null || true
    cp -r /var/www/huongdi/public/kham-pha-ban-than "$BACKUP_DIR/public/" 2>/dev/null || true
    cp -r /var/www/huongdi/public/kiem-ke-nguon-luc "$BACKUP_DIR/public/" 2>/dev/null || true
    cp -r /var/www/huongdi/public/la-ban-huong-di "$BACKUP_DIR/public/" 2>/dev/null || true
    echo -e "    ${GREEN}✅ Public HTML files${NC}"
else
    echo -e "    ${CYAN}⏭  /var/www/huongdi/public không tồn tại${NC}"
fi

# ═══════════════════════════════════════════════════════════════
# 8. Metadata + Compress
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[8/8] 📦 Metadata + compress...${NC}"

# Metadata
cat > "$BACKUP_DIR/METADATA.txt" << EOF
Backup created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Tag: $TAG
Host: $(hostname)
User: $(whoami)
DB: huongdi_prod
Postgres version: $(sudo -u postgres psql -c 'SELECT version();' 2>/dev/null | head -3 | tail -1)
Node version: $(node -v 2>/dev/null)
PM2 processes: $(pm2 list 2>/dev/null | grep -c "online\|stopped")

Tables backed up:
$(sudo -u postgres psql -d huongdi_prod -t -c "\dt" 2>/dev/null | awk '{print "  - " $3}' | grep -v '^  - $')

Row counts:
$(sudo -u postgres psql -d huongdi_prod -c "
SELECT schemaname||'.'||relname AS table, n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 30;" 2>/dev/null)

Restore hướng dẫn:
  1. Restore DB:
     sudo -u postgres pg_restore -d huongdi_prod -c $BACKUP_DIR/huongdi_prod.dump
     OR:
     sudo -u postgres psql huongdi_prod < $BACKUP_DIR/huongdi_prod.sql

  2. Restore code (nếu cần):
     cp -r $BACKUP_DIR/backend-src/* /var/www/huongdi/backend/
     cp -r $BACKUP_DIR/admin-src/* /var/www/huongdi/admin/
     cd /var/www/huongdi/backend && npm run build
     cd /var/www/huongdi/admin && npm run build
     pm2 restart huongdi-api
EOF
echo -e "    ${GREEN}✅ METADATA.txt${NC}"

# Compress toàn bộ
cd "$BACKUP_ROOT"
TARBALL="sol-full-$TAG-$TS.tar.gz"
tar czf "$TARBALL" "sol-full-$TAG-$TS/"
FINAL_SIZE=$(du -h "$TARBALL" | cut -f1)
echo -e "    ${GREEN}✅ Compressed: $TARBALL ($FINAL_SIZE)${NC}"

# Retention: keep last 10 tarballs, delete older
KEEP=10
ls -1t "$BACKUP_ROOT"/sol-full-*.tar.gz 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f
KEPT=$(ls -1 "$BACKUP_ROOT"/sol-full-*.tar.gz 2>/dev/null | wc -l)
echo -e "    ${CYAN}📁 Kept last $KEPT backups${NC}"

# ═══════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ BACKUP XONG!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📦 Backup files:"
echo -e "    ${CYAN}Folder:  $BACKUP_DIR/${NC}"
echo -e "    ${CYAN}Tarball: $BACKUP_ROOT/$TARBALL${NC}"
echo ""
echo -e "  📊 Summary:"
ls -la "$BACKUP_DIR" | tail -n +2 | awk '{printf "    %-30s %s\n", $NF, $5}'
echo ""
echo -e "  🔄 Restore DB command:"
echo -e "    ${CYAN}sudo -u postgres pg_restore -d huongdi_prod -c $BACKUP_DIR/huongdi_prod.dump${NC}"
echo ""
echo -e "  📥 Download về laptop (safest):"
echo -e "    ${CYAN}scp sol-vps:$BACKUP_ROOT/$TARBALL C:/BOTHUOCLA/backups/${NC}"
echo ""
