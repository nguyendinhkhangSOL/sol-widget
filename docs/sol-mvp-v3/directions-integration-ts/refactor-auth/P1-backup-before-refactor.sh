#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PHASE 1: Full Backup Before Auth Refactor
# CRITICAL: Chạy TRƯỚC mọi thao tác schema
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_ROOT="/var/backups/huongdi/refactor-auth-$TIMESTAMP"
DB_NAME="huongdi_prod"
BACKEND="/var/www/huongdi/backend"

echo ""
echo -e "${CYAN}═══ PHASE 1: BACKUP TRƯỚC REFACTOR AUTH ═══${NC}"
echo -e "${CYAN}   Timestamp: $TIMESTAMP${NC}"
echo -e "${CYAN}   Backup dir: $BACKUP_ROOT${NC}"
echo ""

sudo mkdir -p "$BACKUP_ROOT"
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT"

# ─── 1. Full DB dump ─────────────────────────────────────────
echo -e "${YELLOW}[1/6] Dump toàn bộ huongdi_prod...${NC}"
sudo -u postgres pg_dump -Fc -d "$DB_NAME" -f "/tmp/db-full-$TIMESTAMP.dump"
sudo -u postgres pg_dump -d "$DB_NAME" -f "/tmp/db-full-$TIMESTAMP.sql"
sudo mv "/tmp/db-full-$TIMESTAMP.dump" "$BACKUP_ROOT/db-full.dump"
sudo mv "/tmp/db-full-$TIMESTAMP.sql" "$BACKUP_ROOT/db-full.sql"
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/db-full.dump" "$BACKUP_ROOT/db-full.sql"
DUMP_SIZE=$(ls -lh "$BACKUP_ROOT/db-full.dump" | awk '{print $5}')
echo -e "    ${GREEN}✅ Dump size: $DUMP_SIZE${NC}"

# ─── 2. Export 37 Direction JSON (safety copy) ───────────────
echo -e "${YELLOW}[2/6] Export 37 Direction JSON...${NC}"
sudo -u postgres psql "$DB_NAME" -t -A -c "
SELECT json_agg(row_to_json(d)) FROM (
  SELECT * FROM directions ORDER BY code
) d;
" | sudo tee "$BACKUP_ROOT/directions-37.json" > /dev/null
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/directions-37.json"
DIR_COUNT=$(sudo -u postgres psql "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM directions;")
echo -e "    ${GREEN}✅ Exported $DIR_COUNT directions${NC}"

# ─── 3. Export Users + Leads + AdminUsers (test data) ────────
echo -e "${YELLOW}[3/6] Export user-related tables (test data)...${NC}"
for tbl in users leads admin_users user_sessions user_events; do
    if sudo -u postgres psql "$DB_NAME" -t -A -c "SELECT to_regclass('public.$tbl');" | grep -q "$tbl"; then
        sudo -u postgres psql "$DB_NAME" -c "\COPY $tbl TO '/tmp/$tbl-$TIMESTAMP.csv' CSV HEADER" 2>/dev/null || true
        sudo mv "/tmp/$tbl-$TIMESTAMP.csv" "$BACKUP_ROOT/$tbl.csv" 2>/dev/null || true
        sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/$tbl.csv" 2>/dev/null || true
        COUNT=$(sudo -u postgres psql "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM $tbl;")
        echo -e "    ${CYAN}$tbl: $COUNT rows${NC}"
    fi
done

# ─── 4. Backup schema Prisma ─────────────────────────────────
echo -e "${YELLOW}[4/6] Backup schema.prisma + code hiện tại...${NC}"
sudo cp "$BACKEND/prisma/schema.prisma" "$BACKUP_ROOT/schema.prisma.bak"
sudo cp -r "$BACKEND/src/routes" "$BACKUP_ROOT/routes.bak"
sudo cp -r "$BACKEND/src/middleware" "$BACKUP_ROOT/middleware.bak" 2>/dev/null || true
sudo chown -R $(whoami):$(whoami) "$BACKUP_ROOT/schema.prisma.bak" "$BACKUP_ROOT/routes.bak" "$BACKUP_ROOT/middleware.bak" 2>/dev/null || true
echo -e "    ${GREEN}✅ Backed up schema + routes${NC}"

# ─── 5. Backup admin SPA source ──────────────────────────────
echo -e "${YELLOW}[5/6] Backup admin SPA...${NC}"
if [ -d "/var/www/huongdi/admin/src" ]; then
    sudo tar -czf "$BACKUP_ROOT/admin-src.tar.gz" -C /var/www/huongdi/admin src package.json
    sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/admin-src.tar.gz"
    echo -e "    ${GREEN}✅ Admin source backed up${NC}"
fi

# ─── 6. Metadata + Restore instructions ──────────────────────
echo -e "${YELLOW}[6/6] Generate metadata + restore guide...${NC}"
cat > "$BACKUP_ROOT/README.md" << 'DOC'
# Refactor Auth Backup

## Restore full DB
```bash
sudo -u postgres dropdb huongdi_prod
sudo -u postgres createdb huongdi_prod
sudo -u postgres pg_restore -d huongdi_prod db-full.dump
```

## Restore chỉ 37 directions
```bash
sudo -u postgres psql huongdi_prod -c "TRUNCATE directions CASCADE;"
# Load từ directions-37.json via Node script
```

## Restore schema.prisma
```bash
cp schema.prisma.bak /var/www/huongdi/backend/prisma/schema.prisma
cd /var/www/huongdi/backend && npm run db:push
```

## Rollback complete
Tất cả trong dir này. Copy về code + restore DB là xong.
DOC

cat > "$BACKUP_ROOT/metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "purpose": "Before auth refactor - unified User table",
  "db_name": "$DB_NAME",
  "backend_path": "$BACKEND",
  "directions_count": $DIR_COUNT,
  "dump_size": "$DUMP_SIZE"
}
EOF

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ BACKUP HOÀN TẤT${NC}"
echo -e "${GREEN}   Location: $BACKUP_ROOT${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
ls -lh "$BACKUP_ROOT/"
echo ""
echo -e "${CYAN}Đường link restore nếu cần:${NC}"
echo -e "${CYAN}  cd $BACKUP_ROOT && cat README.md${NC}"
