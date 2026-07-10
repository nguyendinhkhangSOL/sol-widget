#!/bin/bash
# Check state of roadmap_12_tuan field for 37 directions
# Chạy trên VPS: bash /tmp/check-roadmap-data.sh

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detect DB name from .env
DB_NAME=$(sudo grep 'DATABASE_URL' /var/www/huongdi/backend/.env 2>/dev/null | \
    grep -oP 'postgresql://[^:]+:[^@]+@[^:/]+:[0-9]+/\K[^?]+' | head -1)
[ -z "$DB_NAME" ] && DB_NAME="huongdi_prod"

echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Roadmap Data Audit — 37 Directions           ${NC}"
echo -e "${CYAN}  DB: $DB_NAME                                  ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

# ─── 1. Overview count ────────────────────
echo -e "${YELLOW}[1/4] Overview — Directions & Roadmap coverage${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
    COUNT(*) AS total_directions,
    COUNT(*) FILTER (WHERE roadmap_12_tuan IS NOT NULL) AS has_roadmap,
    COUNT(*) FILTER (WHERE roadmap_12_tuan IS NULL) AS missing_roadmap,
    COUNT(*) FILTER (WHERE giai_doan_3_tieu_de IS NOT NULL) AS has_phases,
    COUNT(*) FILTER (WHERE sai_lam_5 IS NOT NULL) AS has_mistakes,
    COUNT(*) FILTER (WHERE cong_cu_10 IS NOT NULL) AS has_tools,
    COUNT(*) FILTER (WHERE status = 'PUBLISHED') AS published,
    COUNT(*) FILTER (WHERE status = 'DRAFT') AS drafts
FROM directions;
SQL
echo ""

# ─── 2. Which directions have roadmap ─────
echo -e "${YELLOW}[2/4] List directions — has roadmap or not${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
    id,
    LEFT(title, 40) AS title,
    CASE WHEN roadmap_12_tuan IS NOT NULL THEN 'YES' ELSE '--' END AS roadmap,
    CASE WHEN giai_doan_3_tieu_de IS NOT NULL THEN 'YES' ELSE '--' END AS phases,
    status
FROM directions
ORDER BY (roadmap_12_tuan IS NULL), id
LIMIT 40;
SQL
echo ""

# ─── 3. Sample structure of 1 roadmap ────
echo -e "${YELLOW}[3/4] Sample: roadmap_12_tuan structure (first direction has data)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
    id,
    jsonb_pretty(roadmap_12_tuan::jsonb) AS roadmap_structure
FROM directions
WHERE roadmap_12_tuan IS NOT NULL
LIMIT 1;
SQL
echo ""

# ─── 4. Verify field types (JSON schema hint) ────
echo -e "${YELLOW}[4/4] JSON keys used in roadmap_12_tuan (across all rows)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT DISTINCT
    jsonb_object_keys(roadmap_12_tuan::jsonb) AS json_keys
FROM directions
WHERE roadmap_12_tuan IS NOT NULL
ORDER BY json_keys;
SQL

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Audit complete                                ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
