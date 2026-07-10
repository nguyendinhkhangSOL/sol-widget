#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# END-OF-DAY BACKUP — 5/7/2026
# Backup toàn bộ trạng thái sau session dài
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_ROOT="/var/backups/huongdi/eod-$TIMESTAMP"
DB="huongdi_prod"

echo -e "${CYAN}═══ EOD BACKUP — 5/7/2026 ═══${NC}"
echo -e "${CYAN}   Location: $BACKUP_ROOT${NC}"
echo ""

sudo mkdir -p "$BACKUP_ROOT"
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT"

# ─── 1. Database dump ─────────────────────────────────────
echo -e "${YELLOW}[1/6] Full DB dump...${NC}"
sudo -u postgres pg_dump -Fc -d "$DB" -f "/tmp/db-$TIMESTAMP.dump"
sudo -u postgres pg_dump -d "$DB" -f "/tmp/db-$TIMESTAMP.sql"
sudo mv "/tmp/db-$TIMESTAMP.dump" "$BACKUP_ROOT/db-full.dump"
sudo mv "/tmp/db-$TIMESTAMP.sql" "$BACKUP_ROOT/db-full.sql"
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/db-full."*
DB_SIZE=$(ls -lh "$BACKUP_ROOT/db-full.dump" | awk '{print $5}')
echo -e "    ${GREEN}✅ DB dump: $DB_SIZE${NC}"

# ─── 2. Backend source ─────────────────────────────────────
echo -e "${YELLOW}[2/6] Backend source...${NC}"
sudo tar czf "$BACKUP_ROOT/backend-src.tar.gz" \
  -C /var/www/huongdi/backend \
  src prisma package.json package-lock.json .env 2>/dev/null
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/backend-src.tar.gz"
SRC_SIZE=$(ls -lh "$BACKUP_ROOT/backend-src.tar.gz" | awk '{print $5}')
echo -e "    ${GREEN}✅ Backend: $SRC_SIZE${NC}"

# ─── 3. Public HTML/JS ──────────────────────────────────────
echo -e "${YELLOW}[3/6] Public files...${NC}"
sudo tar czf "$BACKUP_ROOT/public.tar.gz" \
  -C /var/www/huongdi public
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/public.tar.gz"
PUB_SIZE=$(ls -lh "$BACKUP_ROOT/public.tar.gz" | awk '{print $5}')
echo -e "    ${GREEN}✅ Public: $PUB_SIZE${NC}"

# ─── 4. Admin SPA source ────────────────────────────────────
echo -e "${YELLOW}[4/6] Admin SPA...${NC}"
if [ -d /var/www/huongdi/admin/src ]; then
    sudo tar czf "$BACKUP_ROOT/admin.tar.gz" \
      -C /var/www/huongdi admin/src admin/package.json 2>/dev/null
    sudo chown $(whoami):$(whoami) "$BACKUP_ROOT/admin.tar.gz"
    echo -e "    ${GREEN}✅ Admin backed up${NC}"
fi

# ─── 5. Data snapshot — Directions + Users ─────────────────
echo -e "${YELLOW}[5/6] Data snapshot...${NC}"
sudo -u postgres psql "$DB" -c "\COPY (SELECT * FROM directions) TO '/tmp/directions-$TIMESTAMP.csv' CSV HEADER" 2>/dev/null || true
sudo -u postgres psql "$DB" -c "\COPY (SELECT id, email, tier, role, created_at FROM users) TO '/tmp/users-$TIMESTAMP.csv' CSV HEADER" 2>/dev/null || true
sudo mv "/tmp/directions-$TIMESTAMP.csv" "$BACKUP_ROOT/directions.csv" 2>/dev/null || true
sudo mv "/tmp/users-$TIMESTAMP.csv" "$BACKUP_ROOT/users.csv" 2>/dev/null || true
sudo chown $(whoami):$(whoami) "$BACKUP_ROOT"/*.csv 2>/dev/null || true

DIR_COUNT=$(sudo -u postgres psql "$DB" -t -A -c "SELECT COUNT(*) FROM directions;")
USER_COUNT=$(sudo -u postgres psql "$DB" -t -A -c "SELECT COUNT(*) FROM users;")
JOURNEY_COUNT=$(sudo -u postgres psql "$DB" -t -A -c "SELECT COUNT(*) FROM journey_days;" 2>/dev/null || echo 0)
CHAT_COUNT=$(sudo -u postgres psql "$DB" -t -A -c "SELECT COUNT(*) FROM sol_chat_conversations;" 2>/dev/null || echo 0)

echo -e "    ${GREEN}✅ Snapshot: $DIR_COUNT directions, $USER_COUNT users, $JOURNEY_COUNT journey days, $CHAT_COUNT chats${NC}"

# ─── 6. Metadata + Restore guide ────────────────────────────
echo -e "${YELLOW}[6/6] Metadata...${NC}"
cat > "$BACKUP_ROOT/README.md" << DOC
# End-of-Day Backup — $(date +%d/%m/%Y)

## Contents
- \`db-full.dump\` — Full PostgreSQL backup (pg_restore format)
- \`db-full.sql\` — Human-readable SQL dump
- \`backend-src.tar.gz\` — Backend source + .env
- \`public.tar.gz\` — Frontend public folder
- \`admin.tar.gz\` — Admin SPA source
- \`directions.csv\` — 37 direction data snapshot
- \`users.csv\` — User list

## Session Snapshot
- Directions: $DIR_COUNT
- Users: $USER_COUNT
- Journey days logged: $JOURNEY_COUNT
- Sol Đồng Hành chats: $CHAT_COUNT
- Provider: Gemini 2.5 Flash (FREE tier)

## Restore Full System
\`\`\`bash
# Restore DB
sudo -u postgres dropdb huongdi_prod
sudo -u postgres createdb huongdi_prod
sudo -u postgres pg_restore -d huongdi_prod db-full.dump

# Restore backend
tar xzf backend-src.tar.gz -C /var/www/huongdi/backend/
cd /var/www/huongdi/backend && npx prisma generate && npm run build && pm2 restart huongdi-api

# Restore public
sudo tar xzf public.tar.gz -C /var/www/huongdi/
\`\`\`
DOC

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ EOD BACKUP COMPLETE${NC}"
echo -e "${GREEN}   $BACKUP_ROOT${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
ls -lh "$BACKUP_ROOT/"
echo ""
echo -e "${CYAN}Total size:${NC}"
du -sh "$BACKUP_ROOT"
