#!/bin/bash
# Fix backfill: cleanup + relink User to LATEST Lead per email
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══ Fix Backfill — Latest Lead Per Email ═══${NC}"
echo ""

echo -e "${YELLOW}[1/4] Current state:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT l.id AS lead_id, l.ten, l.email, l.payment_status,
       u.id AS user_id, u.tier
FROM leads l
LEFT JOIN users u ON u.active_lead_id = l.id
WHERE l.payment_status = 'ACTIVATED'
ORDER BY l.id;
EOF

echo ""
echo -e "${YELLOW}[2/4] Delete User đã tạo cho Lead cũ (test data #2)...${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
-- Xoá User dbd48bc0 (test data từ Lead #2 Test Deploy)
DELETE FROM users WHERE active_lead_id = 2;
EOF

echo ""
echo -e "${YELLOW}[3/4] Backfill Users cho LATEST lead per email...${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
-- Với mỗi email unique, tìm lead ACTIVATED mới nhất → tạo User
WITH latest_lead_per_email AS (
  SELECT DISTINCT ON (email) id, ten, sdt, email, goi, activated_at, expires_at
  FROM leads
  WHERE payment_status = 'ACTIVATED' AND email IS NOT NULL
  ORDER BY email, activated_at DESC
)
INSERT INTO users (
  id, phone, email, display_name,
  tier, tier_started_at, tier_expires_at, active_lead_id,
  is_active, last_seen_at, created_at, updated_at, provider, role
)
SELECT
  gen_random_uuid()::text,
  ll.sdt,
  ll.email,
  ll.ten,
  CASE WHEN ll.goi = 'FOUNDER' THEN 'FOUNDER'::"UserTier" ELSE 'ACTIVE'::"UserTier" END,
  ll.activated_at,
  CASE WHEN ll.goi = 'FOUNDER' THEN NULL ELSE ll.expires_at END,
  ll.id,
  true,
  ll.activated_at,
  ll.activated_at,
  now(),
  'EMAIL',
  'USER'
FROM latest_lead_per_email ll
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = ll.email
)
ON CONFLICT DO NOTHING;
EOF

echo ""
echo -e "${YELLOW}[4/4] Verify final state:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT l.id AS lead_id, l.ten, l.email, l.payment_status, l.activated_at::date,
       u.id AS user_id, u.tier
FROM leads l
LEFT JOIN users u ON u.active_lead_id = l.id
WHERE l.payment_status = 'ACTIVATED'
ORDER BY l.id;

SELECT '─── User counts ───' AS section;
SELECT tier, COUNT(*) FROM users GROUP BY tier;
EOF

echo ""
echo -e "${GREEN}✅ Backfill fixed${NC}"
