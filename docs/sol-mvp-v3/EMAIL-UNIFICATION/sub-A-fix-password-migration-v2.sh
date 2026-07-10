#!/bin/bash
# Fix v2: Migrate password_hash từ leads → users (bỏ password_set_at column)
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME="huongdi_prod"

echo -e "${CYAN}═══ Fix v2: Migrate password_hash leads → users ═══${NC}"
echo ""

# ─── 1. Migrate password_hash từ leads → users ────
echo -e "${YELLOW}[1/3] Copy password_hash từ leads → users (bỏ password_set_at)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
WITH latest_pw_lead AS (
  SELECT DISTINCT ON (COALESCE(l.user_id, u.id))
    COALESCE(l.user_id, u.id) AS target_user_id,
    l.password_hash
  FROM leads l
  LEFT JOIN users u ON u.email = l.email
  WHERE l.password_hash IS NOT NULL
  ORDER BY COALESCE(l.user_id, u.id), l.password_set_at DESC NULLS LAST, l.created_at DESC
)
UPDATE users u
SET password_hash = lpl.password_hash,
    updated_at = NOW()
FROM latest_pw_lead lpl
WHERE u.id = lpl.target_user_id
  AND u.password_hash IS NULL
RETURNING u.email, u.password_hash IS NOT NULL AS now_has_pw;
SQL
echo ""

# ─── 2. Fix source cho users vừa link orphan lead ────
echo -e "${YELLOW}[2/3] Fix source = 'thanhtoan' cho users có active_lead_id${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
UPDATE users
SET source = 'thanhtoan',
    updated_at = NOW()
WHERE source IN ('unknown', 'dangky')
  AND active_lead_id IS NOT NULL
RETURNING email, source;
SQL
echo ""

# ─── 3. Update status = 'active' cho users có password_hash ────
echo -e "${YELLOW}[3/3] Update status = active cho users có password${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
UPDATE users
SET status = 'active',
    email_verified = TRUE,
    updated_at = NOW()
WHERE password_hash IS NOT NULL
  AND status = 'pending_activation'
RETURNING email, status;
SQL
echo ""

# ─── Verify final ────
echo -e "${YELLOW}Final state${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT email, source, status, tier,
  CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END AS has_pw,
  active_lead_id
FROM users
ORDER BY created_at DESC;
SQL

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Fix v2 Complete                              ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Reset rate limit + Test 409:${NC}"
echo -e "  pm2 restart huongdi-api  # Clear in-memory rate limit"
echo -e '  curl -s "https://huongdi.sol.vn/api/user/check-email?email=nguyendinhkhang@gmail.com" | python3 -m json.tool'
