#!/bin/bash
# List actual columns in directions table (real schema in DB)
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME=$(sudo grep 'DATABASE_URL' /var/www/huongdi/backend/.env 2>/dev/null | \
    grep -oP 'postgresql://[^:]+:[^@]+@[^:/]+:[0-9]+/\K[^?]+' | head -1)
[ -z "$DB_NAME" ] && DB_NAME="huongdi_prod"

echo -e "${CYAN}═══ Real Schema Check — huongdi_prod ═══${NC}"
echo ""

# ─── 1. List all tables ────
echo -e "${YELLOW}[1/4] All tables in DB${NC}"
sudo -u postgres psql "$DB_NAME" -c "\dt" 2>&1 | head -40
echo ""

# ─── 2. Columns in directions (guess table name) ────
echo -e "${YELLOW}[2/4] Columns in table 'directions' (if exists)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'directions'
ORDER BY ordinal_position;
SQL
echo ""

# ─── 3. Try alternative table names ────
echo -e "${YELLOW}[3/4] Try similar table names (Direction / directions / model_cards / ...)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%direction%' OR table_name ILIKE '%model%' OR table_name ILIKE '%roadmap%')
ORDER BY table_name;
SQL
echo ""

# ─── 4. Count rows in directions ────
echo -e "${YELLOW}[4/4] Count rows in directions${NC}"
sudo -u postgres psql "$DB_NAME" -c "SELECT COUNT(*) AS row_count FROM directions;" 2>&1
echo ""

echo -e "${GREEN}═══ Done ═══${NC}"
