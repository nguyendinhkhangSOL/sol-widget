#!/bin/bash
# Sub-Phase A — Schema updates cho Unified Auth
# An toàn: chỉ ADD columns, không DROP/RENAME
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

DB_NAME="huongdi_prod"

echo -e "${CYAN}═══ Sub-Phase A: Schema Update ═══${NC}"
echo ""

# ─── Backup ────
echo -e "${YELLOW}[1/6] Backup users + leads before ALTER${NC}"
BACKUP_DIR="/var/backups/sol/$(date +%Y%m%d-%H%M%S)-before-auth-refactor"
sudo mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump "$DB_NAME" \
    --table=users --table=leads \
    -f "/tmp/before-auth-refactor.sql"
sudo mv /tmp/before-auth-refactor.sql "$BACKUP_DIR/"
echo -e "   ${GREEN}✓ Backup: $BACKUP_DIR/${NC}"
echo ""

# ─── Add columns to users ────
echo -e "${YELLOW}[2/6] Add columns to users${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
-- Add source (đăng ký từ đâu)
ALTER TABLE users ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown';

-- Add status (active | pending_activation | suspended | deleted)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add source_lead_id (lead đầu tiên gắn với user, nếu source=thanhtoan)
ALTER TABLE users ADD COLUMN IF NOT EXISTS source_lead_id INTEGER
    REFERENCES leads(id) ON DELETE SET NULL;

-- Index cho search theo source/status
CREATE INDEX IF NOT EXISTS users_source_idx ON users(source);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('source', 'status', 'source_lead_id');
SQL
echo -e "   ${GREEN}✓ Added source, status, source_lead_id to users${NC}"
echo ""

# ─── Add columns to leads ────
echo -e "${YELLOW}[3/6] Add columns to leads${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
-- Magic token expiry (7 days default)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS magic_token_expires_at TIMESTAMP(3);

-- Backfill: existing magic_tokens → set expiry 7 days from magic_sent_at
UPDATE leads
SET magic_token_expires_at = magic_sent_at + INTERVAL '7 days'
WHERE magic_token IS NOT NULL
  AND magic_token_expires_at IS NULL
  AND magic_sent_at IS NOT NULL;

-- Index cho cleanup expired tokens
CREATE INDEX IF NOT EXISTS leads_magic_token_expires_idx
    ON leads(magic_token_expires_at)
    WHERE magic_token IS NOT NULL;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'magic_token_expires_at';
SQL
echo -e "   ${GREEN}✓ Added magic_token_expires_at to leads${NC}"
echo ""

# ─── Backfill users.source ────
echo -e "${YELLOW}[4/6] Backfill users.source based on history${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
-- Source = 'thanhtoan' nếu user có lead
-- Source = 'dangky' nếu user KHÔNG có lead (chỉ đăng ký)
UPDATE users u
SET source = CASE
    WHEN EXISTS (SELECT 1 FROM leads l WHERE l.user_id = u.id OR l.email = u.email) THEN 'thanhtoan'
    ELSE 'dangky'
END
WHERE source = 'unknown';

-- Show result
SELECT source, COUNT(*) FROM users GROUP BY source;
SQL
echo ""

# ─── Backfill users.status ────
echo -e "${YELLOW}[5/6] Backfill users.status${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
-- Status = 'active' nếu có password_hash
-- Status = 'pending_activation' nếu password_hash NULL (shell user)
UPDATE users u
SET status = CASE
    WHEN password_hash IS NOT NULL THEN 'active'
    ELSE 'pending_activation'
END
WHERE status = 'active'; -- Update default 'active' rows correctly

-- Show result
SELECT status, COUNT(*) FROM users GROUP BY status;
SQL
echo ""

# ─── Backfill users.source_lead_id ────
echo -e "${YELLOW}[6/6] Backfill users.source_lead_id (first lead per user)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
UPDATE users u
SET source_lead_id = first_lead.id
FROM (
    SELECT DISTINCT ON (user_id) id, user_id
    FROM leads
    WHERE user_id IS NOT NULL
    ORDER BY user_id, created_at ASC
) first_lead
WHERE u.id = first_lead.user_id AND u.source_lead_id IS NULL;

-- Verify
SELECT
    u.email,
    u.source,
    u.status,
    u.source_lead_id,
    u.active_lead_id,
    u.tier
FROM users u
ORDER BY u.created_at DESC;
SQL
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Sub-Phase A Complete                          ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Next: Sub-Phase B — Backend refactor (session sau)${NC}"
echo ""
echo -e "${CYAN}Rollback if needed:${NC}"
echo -e "  sudo -u postgres psql $DB_NAME < $BACKUP_DIR/before-auth-refactor.sql"
