#!/bin/bash
# Diagnose v2: Check if 5 users + 7 leads are properly linked
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME="huongdi_prod"

echo -e "${CYAN}═══ Email Sync Check ═══${NC}"
echo ""

# ─── 1. All users with their linked lead ────
echo -e "${YELLOW}[1/5] Users + linked lead (active_lead_id)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
  u.email AS user_email,
  u.tier,
  u.created_at::date AS user_created,
  u.active_lead_id,
  l.email AS lead_email,
  l.payment_status,
  l.amount
FROM users u
LEFT JOIN leads l ON u.active_lead_id = l.id
ORDER BY u.created_at DESC;
SQL
echo ""

# ─── 2. All leads with their linked user ────
echo -e "${YELLOW}[2/5] Leads + linked user (user_id)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
  l.id AS lead_id,
  l.email AS lead_email,
  l.sdt,
  l.goi,
  l.payment_status,
  l.user_id,
  u.email AS user_email,
  u.tier
FROM leads l
LEFT JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC;
SQL
echo ""

# ─── 3. UNIFIED VIEW — email đã ở đâu ────
echo -e "${YELLOW}[3/5] UNIFIED — Ai đã có trong hệ thống (từ mọi nguồn)${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
  COALESCE(u.email, l.email) AS email,
  COALESCE(u.phone, l.sdt) AS phone_or_sdt,
  CASE
    WHEN u.id IS NOT NULL AND l.id IS NOT NULL THEN 'BOTH (đăng ký + thanh toán)'
    WHEN u.id IS NOT NULL THEN 'chỉ /dang-ky/ (chưa thanh toán)'
    WHEN l.id IS NOT NULL THEN 'chỉ /thanh-toan/ (chưa đăng ký)'
  END AS source,
  u.tier,
  l.payment_status,
  COALESCE(u.created_at, l.created_at) AS first_seen
FROM users u
FULL OUTER JOIN leads l ON u.email = l.email
ORDER BY first_seen DESC;
SQL
echo ""

# ─── 4. Orphan leads (thanh toán nhưng chưa đăng ký) ────
echo -e "${YELLOW}[4/5] Orphan leads — email đã thanh toán nhưng chưa có user${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
  l.id, l.email, l.sdt, l.goi, l.payment_status, l.created_at::date
FROM leads l
LEFT JOIN users u ON u.email = l.email OR u.id = l.user_id
WHERE u.id IS NULL AND l.email IS NOT NULL
ORDER BY l.created_at DESC;
SQL
echo ""

# ─── 5. Orphan users (đăng ký nhưng chưa từng thanh toán) ────
echo -e "${YELLOW}[5/5] Orphan users — đăng ký nhưng chưa từng thanh toán${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT
  u.id, u.email, u.phone, u.tier, u.created_at::date
FROM users u
LEFT JOIN leads l ON l.email = u.email OR l.user_id = u.id
WHERE l.id IS NULL
ORDER BY u.created_at DESC;
SQL

echo ""
echo -e "${GREEN}═══ Done ═══${NC}"
