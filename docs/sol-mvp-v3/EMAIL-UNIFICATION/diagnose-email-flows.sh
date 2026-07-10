#!/bin/bash
# Diagnose 2 email flows: /dang-ky/ + /thanh-toan/
# Tìm email ngayhomnayonline@gmail.com + check schema
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME="huongdi_prod"
TARGET_EMAIL="ngayhomnayonline@gmail.com"

echo -e "${CYAN}═══ Email Flow Diagnostic ═══${NC}"
echo ""

# ─── 1. List all tables with 'email' column ────
echo -e "${YELLOW}[1/5] Tables có column 'email'${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name ILIKE '%email%'
  AND table_schema = 'public'
ORDER BY table_name;
SQL
echo ""

# ─── 2. Search target email across all likely tables ────
echo -e "${YELLOW}[2/5] Tìm email '$TARGET_EMAIL' trong TẤT CẢ tables${NC}"

# users table
echo -e "${CYAN}   → users${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT id, email, phone, display_name, tier, created_at
FROM users
WHERE email ILIKE '%$TARGET_EMAIL%'
LIMIT 5;
" 2>&1 | tail -6

# leads table
echo -e "${CYAN}   → leads${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT * FROM leads
WHERE email ILIKE '%$TARGET_EMAIL%'
LIMIT 5;
" 2>&1 | tail -6

# lead_notifications
echo -e "${CYAN}   → lead_notifications${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT * FROM lead_notifications
WHERE email ILIKE '%$TARGET_EMAIL%'
LIMIT 5;
" 2>&1 | tail -6

# user_outcomes
echo -e "${CYAN}   → user_outcomes${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT * FROM user_outcomes
WHERE email ILIKE '%$TARGET_EMAIL%'
LIMIT 5;
" 2>&1 | tail -6

# user_events
echo -e "${CYAN}   → user_events${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT * FROM user_events
WHERE properties::text ILIKE '%$TARGET_EMAIL%'
LIMIT 3;
" 2>&1 | tail -6

echo ""

# ─── 3. Count rows in each user-related table ────
echo -e "${YELLOW}[3/5] Overview counts${NC}"
sudo -u postgres psql "$DB_NAME" << 'SQL'
SELECT 'users' AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'leads', COUNT(*) FROM leads
UNION ALL SELECT 'lead_notifications', COUNT(*) FROM lead_notifications
UNION ALL SELECT 'user_outcomes', COUNT(*) FROM user_outcomes
UNION ALL SELECT 'p1_results', COUNT(*) FROM p1_results
UNION ALL SELECT 'p2_results', COUNT(*) FROM p2_results
UNION ALL SELECT 'user_events', COUNT(*) FROM user_events
UNION ALL SELECT 'saved_directions', COUNT(*) FROM saved_directions
UNION ALL SELECT 'admin_users', COUNT(*) FROM admin_users
ORDER BY rows DESC;
SQL
echo ""

# ─── 4. Show schema of users vs leads ────
echo -e "${YELLOW}[4/5] Schema: users${NC}"
sudo -u postgres psql "$DB_NAME" -c "\d users" 2>&1 | head -30
echo ""

echo -e "${YELLOW}    Schema: leads${NC}"
sudo -u postgres psql "$DB_NAME" -c "\d leads" 2>&1 | head -30
echo ""

# ─── 5. Recent registrations vs recent payments ────
echo -e "${YELLOW}[5/5] Recent activity (last 20 emails from each source)${NC}"

echo -e "${CYAN}   → Recent users (từ /dang-ky/)${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT email, phone, tier, created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;
"
echo ""

echo -e "${CYAN}   → Recent leads (từ /thanh-toan/ hoặc form khác)${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT email, phone, source, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 20;
" 2>&1

echo ""
echo -e "${GREEN}═══ Done ═══${NC}"
