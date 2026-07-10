#!/bin/bash
# Migration 1: Link existing leads ↔ users theo email
# An toàn: chỉ UPDATE, không DELETE, không INSERT
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME="huongdi_prod"

echo -e "${CYAN}═══ Migration: Link Existing Data ═══${NC}"
echo ""

# ─── Backup snapshot ────
echo -e "${YELLOW}[1/5] Backup snapshot before migration${NC}"
BACKUP_DIR="/var/backups/sol/$(date +%Y%m%d-%H%M%S)-before-email-migration"
sudo mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump "$DB_NAME" \
    --table=users --table=leads \
    -f "/tmp/before-migration.sql" 2>&1 | tail -3
sudo mv /tmp/before-migration.sql "$BACKUP_DIR/"
echo -e "   ${GREEN}✓ Backup: $BACKUP_DIR/before-migration.sql${NC}"
echo ""

# ─── Migration A: leads.user_id ────
echo -e "${YELLOW}[2/5] Update leads.user_id from matching users.email${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
UPDATE leads l
SET user_id = u.id, updated_at = NOW()
FROM users u
WHERE l.email = u.email
  AND l.user_id IS NULL
RETURNING l.id, l.email, l.user_id;
SQL
echo ""

# ─── Migration B: users.active_lead_id ────
echo -e "${YELLOW}[3/5] Update users.active_lead_id from latest PAID lead${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
UPDATE users u
SET active_lead_id = latest.id, updated_at = NOW()
FROM (
    SELECT DISTINCT ON (email) id, email
    FROM leads
    WHERE payment_status IN ('PAID', 'ACTIVATED')
      AND email IS NOT NULL
    ORDER BY email, created_at DESC
) latest
WHERE u.email = latest.email
  AND u.active_lead_id IS NULL
RETURNING u.email, u.active_lead_id;
SQL
echo ""

# ─── Migration C: Auto-upgrade tier based on paid lead ────
echo -e "${YELLOW}[4/5] Auto-upgrade user.tier từ FREE → ACTIVE nếu có lead PAID${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
UPDATE users u
SET tier = 'ACTIVE'::"UserTier",
    tier_started_at = COALESCE(u.tier_started_at, l.activated_at, NOW()),
    updated_at = NOW()
FROM leads l
WHERE u.email = l.email
  AND l.payment_status IN ('PAID', 'ACTIVATED')
  AND u.tier = 'FREE'::"UserTier"
RETURNING u.email, u.tier, u.tier_started_at;
SQL
echo ""

# ─── Verification ────
echo -e "${YELLOW}[5/5] Verify — recheck sync state${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
    'leads with user_id set' AS metric,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS count,
    COUNT(*) AS total
FROM leads
UNION ALL
SELECT 'users with active_lead_id set',
    COUNT(*) FILTER (WHERE active_lead_id IS NOT NULL),
    COUNT(*)
FROM users
UNION ALL
SELECT 'orphan leads (no user_id + email matched)',
    COUNT(*), 0
FROM leads l
WHERE l.user_id IS NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.email = l.email);
SQL

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Migration Complete — Data linked         ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Rollback (nếu cần):${NC}"
echo -e "  sudo -u postgres psql $DB_NAME < $BACKUP_DIR/before-migration.sql"
