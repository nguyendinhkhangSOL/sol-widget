#!/bin/bash
# Test Batch A activation flow
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══ Test Batch A — Activation Creates User ═══${NC}"
echo ""

# ─── Step 1: Show existing leads ─────────────────────────────
echo -e "${YELLOW}[1/5] Existing leads:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT id, ten, sdt, email, goi, payment_status, LEFT(COALESCE(magic_token, ''), 20) AS token_prefix, expires_at
FROM leads ORDER BY id DESC LIMIT 5;
EOF

# ─── Step 2: Create test lead (or reuse) ────────────────────
echo ""
echo -e "${YELLOW}[2/5] Ensure test lead exists...${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
INSERT INTO leads (ten, sdt, email, goi, amount, payment_status, magic_token, magic_sent_at, expires_at, created_at, updated_at)
VALUES ('Test Batch A', '0987654321', 'test-batch-a@sol.vn', 'ACTIVE', 499000, 'PAID',
        'batch-a-test-token-abcdefghijk', now(), now() + interval '365 days', now(), now())
ON CONFLICT (magic_token) DO UPDATE
SET payment_status = 'PAID', expires_at = now() + interval '365 days';

SELECT id, ten, sdt, goi, payment_status, LEFT(magic_token, 20) FROM leads WHERE magic_token = 'batch-a-test-token-abcdefghijk';
EOF

# ─── Step 3: Call activation endpoint ────────────────────────
echo ""
echo -e "${YELLOW}[3/5] Call GET /api/activate?token=...${NC}"
curl -s "http://localhost:4001/api/activate?token=batch-a-test-token-abcdefghijk" | python3 -m json.tool || echo "(parse fail — check raw)"
echo ""

# ─── Step 4: Verify User created ─────────────────────────────
echo -e "${YELLOW}[4/5] Users created:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT id, phone, email, display_name, tier, tier_started_at, tier_expires_at, active_lead_id, created_at
FROM users ORDER BY created_at DESC LIMIT 5;
EOF

# ─── Step 5: Verify Lead ↔ User link ─────────────────────────
echo ""
echo -e "${YELLOW}[5/5] Lead ↔ User link:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT l.id AS lead_id, l.ten, l.goi, l.payment_status, l.activated_at,
       u.id AS user_id, u.tier, u.tier_expires_at
FROM leads l
LEFT JOIN users u ON u.active_lead_id = l.id
WHERE l.payment_status = 'ACTIVATED'
ORDER BY l.id DESC LIMIT 5;
EOF

echo ""
echo -e "${GREEN}✅ Test done${NC}"
