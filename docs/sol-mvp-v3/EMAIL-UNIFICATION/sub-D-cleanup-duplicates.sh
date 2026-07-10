#!/bin/bash
# Cleanup duplicate leads (test data từ trước refactor)
# nguyendinhkhang@gmail.com có 4 leads (id 1-4) → archive #1,#2,#3 giữ #4
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB="huongdi_prod"

echo -e "${CYAN}═══ Cleanup Duplicate Leads ═══${NC}"
echo ""

# ─── Xem trước duplicates ────
echo -e "${YELLOW}[1/3] Duplicates hiện tại${NC}"
sudo -u postgres psql "$DB" << 'SQL'
SELECT email, COUNT(*) as leads, ARRAY_AGG(id ORDER BY id) as ids
FROM leads
GROUP BY email
HAVING COUNT(*) > 1;
SQL
echo ""

# ─── Archive duplicates (giữ latest) ────
echo -e "${YELLOW}[2/3] Archive duplicate leads (giữ latest per email)${NC}"
sudo -u postgres psql "$DB" << 'SQL'
UPDATE leads SET
  payment_status = 'CANCELLED',
  cancel_reason = 'Duplicate test data — superseded',
  notes = COALESCE(notes, '') || ' [AUTO-CANCELLED: duplicate cleanup 2026-07-05]'
WHERE id IN (
  SELECT id FROM (
    SELECT id, email,
      ROW_NUMBER() OVER (PARTITION BY email ORDER BY activated_at DESC NULLS LAST, created_at DESC) AS rn
    FROM leads
    WHERE payment_status = 'ACTIVATED'
  ) t
  WHERE rn > 1
)
RETURNING id, email, payment_status;
SQL
echo ""

# ─── Verify final ────
echo -e "${YELLOW}[3/3] Verify final state${NC}"
sudo -u postgres psql "$DB" << 'SQL'
SELECT email,
  COUNT(*) FILTER (WHERE payment_status = 'ACTIVATED') AS active,
  COUNT(*) FILTER (WHERE payment_status = 'CANCELLED') AS cancelled,
  COUNT(*) as total
FROM leads
GROUP BY email
ORDER BY email;
SQL

echo ""
echo -e "${GREEN}✅ Cleanup Done${NC}"
