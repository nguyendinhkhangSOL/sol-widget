#!/bin/bash
# Fix: Copy password_hash từ leads → users nếu users.password_hash NULL
# Vấn đề: Legacy design lưu password ở cả 2 tables → sau refactor cần merge về users
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME="huongdi_prod"

echo -e "${CYAN}═══ Fix: Migrate password_hash leads → users ═══${NC}"
echo ""

# ─── 1. Diagnose current state ────
echo -e "${YELLOW}[1/4] Diagnose — Ai có password ở đâu${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
  u.email,
  u.status,
  CASE WHEN u.password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END AS user_pw,
  MAX(CASE WHEN l.password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END) AS lead_pw,
  COUNT(l.id) FILTER (WHERE l.password_hash IS NOT NULL) AS leads_with_pw
FROM users u
LEFT JOIN leads l ON l.user_id = u.id OR l.email = u.email
GROUP BY u.email, u.status, u.password_hash
ORDER BY u.email;
SQL
echo ""

# ─── 2. Migrate password_hash từ leads sang users ────
echo -e "${YELLOW}[2/4] Copy password_hash từ leads → users (nếu users chưa có)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
WITH latest_pw_lead AS (
  -- Lấy lead mới nhất có password cho mỗi email
  SELECT DISTINCT ON (COALESCE(l.user_id, u.id))
    COALESCE(l.user_id, u.id) AS target_user_id,
    l.password_hash,
    l.password_set_at
  FROM leads l
  LEFT JOIN users u ON u.email = l.email
  WHERE l.password_hash IS NOT NULL
  ORDER BY COALESCE(l.user_id, u.id), l.password_set_at DESC NULLS LAST, l.created_at DESC
)
UPDATE users u
SET password_hash = lpl.password_hash,
    password_set_at = COALESCE(u.password_set_at, lpl.password_set_at, NOW()),
    updated_at = NOW()
FROM latest_pw_lead lpl
WHERE u.id = lpl.target_user_id
  AND u.password_hash IS NULL
RETURNING u.email, u.password_hash IS NOT NULL AS now_has_pw;
SQL
echo ""

# ─── 3. Update status based on password ────
echo -e "${YELLOW}[3/4] Update status = 'active' cho users có password_hash${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
UPDATE users
SET status = 'active',
    updated_at = NOW()
WHERE password_hash IS NOT NULL
  AND status = 'pending_activation'
RETURNING email, status;
SQL
echo ""

# ─── 4. Verify final state ────
echo -e "${YELLOW}[4/4] Verify — All users final state${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
  email,
  source,
  status,
  tier,
  CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END AS has_password,
  source_lead_id,
  active_lead_id
FROM users
ORDER BY created_at DESC;
SQL

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Fix Complete                                  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Kết quả mong đợi: 5/5 users đều có has_password=YES + status=active${NC}"
