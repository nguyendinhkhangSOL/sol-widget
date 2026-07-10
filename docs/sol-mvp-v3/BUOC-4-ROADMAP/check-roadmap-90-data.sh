#!/bin/bash
# Check roadmap_90 data coverage + sample structure
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME="huongdi_prod"

echo -e "${CYAN}═══ Roadmap 90 Data Audit ═══${NC}"
echo ""

# ─── 1. Coverage: how many directions have roadmap_90 ────
echo -e "${YELLOW}[1/4] Coverage summary${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE roadmap_30 IS NOT NULL) AS has_r30,
    COUNT(*) FILTER (WHERE roadmap_90 IS NOT NULL) AS has_r90,
    COUNT(*) FILTER (WHERE roadmap_180 IS NOT NULL) AS has_r180,
    COUNT(*) FILTER (WHERE status = 'PUBLISHED') AS published,
    COUNT(*) FILTER (WHERE status = 'DRAFT') AS drafts
FROM directions;
SQL
echo ""

# ─── 2. Per-direction status ────
echo -e "${YELLOW}[2/4] Per-direction: has roadmap_90?${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
    id,
    LEFT(name, 40) AS name,
    CASE WHEN roadmap_90 IS NOT NULL THEN 'YES' ELSE '--' END AS r90,
    CASE WHEN roadmap_30 IS NOT NULL THEN 'YES' ELSE '--' END AS r30,
    status
FROM directions
ORDER BY (roadmap_90 IS NULL), sort_order
LIMIT 40;
SQL
echo ""

# ─── 3. Sample roadmap_90 structure ────
echo -e "${YELLOW}[3/4] Sample roadmap_90 (first direction with data)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
    id,
    name,
    jsonb_pretty(roadmap_90) AS roadmap_90_content
FROM directions
WHERE roadmap_90 IS NOT NULL
ORDER BY sort_order
LIMIT 1;
SQL
echo ""

# ─── 4. JSON top-level keys ────
echo -e "${YELLOW}[4/4] Top-level keys used in roadmap_90${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT DISTINCT
    jsonb_object_keys(roadmap_90) AS key
FROM directions
WHERE roadmap_90 IS NOT NULL
ORDER BY key;
SQL

echo ""
echo -e "${GREEN}═══ Done ═══${NC}"
