#!/bin/bash
# Backfill User accounts cho leads đã ACTIVATED trước Batch A
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══ Backfill User accounts cho ACTIVATED leads chưa có User ═══${NC}"
echo ""

echo -e "${YELLOW}[1/3] Leads ACTIVATED chưa có User:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT l.id, l.ten, l.sdt, l.email, l.goi, l.activated_at, l.expires_at
FROM leads l
LEFT JOIN users u ON u.active_lead_id = l.id
WHERE l.payment_status = 'ACTIVATED' AND u.id IS NULL
ORDER BY l.id;
EOF

echo ""
echo -e "${YELLOW}[2/3] Backfill Users...${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
INSERT INTO users (
  id, phone, email, display_name,
  tier, tier_started_at, tier_expires_at, active_lead_id,
  is_active, last_seen_at, created_at, updated_at, provider, role
)
SELECT
  gen_random_uuid()::text,
  l.sdt,
  l.email,
  l.ten,
  CASE WHEN l.goi = 'FOUNDER' THEN 'FOUNDER'::"UserTier" ELSE 'ACTIVE'::"UserTier" END,
  l.activated_at,
  CASE WHEN l.goi = 'FOUNDER' THEN NULL ELSE l.expires_at END,
  l.id,
  true,
  l.activated_at,
  l.activated_at,
  now(),
  'EMAIL',
  'USER'
FROM leads l
LEFT JOIN users u ON u.active_lead_id = l.id
WHERE l.payment_status = 'ACTIVATED' AND u.id IS NULL
ON CONFLICT DO NOTHING;
EOF

echo ""
echo -e "${YELLOW}[3/3] Verify:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT l.id AS lead_id, l.ten, l.goi, l.payment_status,
       u.id AS user_id, u.tier, u.tier_expires_at
FROM leads l
LEFT JOIN users u ON u.active_lead_id = l.id
WHERE l.payment_status = 'ACTIVATED'
ORDER BY l.id;
EOF

echo ""
echo -e "${GREEN}✅ Backfill done${NC}"
