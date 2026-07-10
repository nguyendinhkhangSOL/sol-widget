#!/bin/bash
# Tạo Lead cho admin@sol.vn để login qua /api/auth/login
set -e

BACKEND="/var/www/huongdi/backend"
NEW_PASSWORD="${1:-SolAdmin2026}"

echo "═══ Setup admin@sol.vn as Lead ═══"
echo ""

# Generate bcrypt hash (rounds=10)
HASH=$(cd "$BACKEND" && node -e "console.log(require('bcryptjs').hashSync('$NEW_PASSWORD', 10));")
echo "Hash: ${HASH:0:30}..."

# Check nếu Lead đã có email admin@sol.vn
EXISTING=$(sudo -u postgres psql huongdi_prod -t -c "SELECT id FROM leads WHERE email='admin@sol.vn';" | tr -d '[:space:]')

if [ -n "$EXISTING" ]; then
    echo "Lead admin@sol.vn đã tồn tại (id=$EXISTING) — UPDATE password_hash..."
    sudo -u postgres psql huongdi_prod << EOF
UPDATE leads
SET password_hash = '$HASH',
    password_set_at = now(),
    payment_status = 'ACTIVATED',
    activated_at = COALESCE(activated_at, now()),
    expires_at = now() + interval '10 years'
WHERE email = 'admin@sol.vn';

SELECT id, ten, email, payment_status, LEFT(password_hash, 20) FROM leads WHERE email = 'admin@sol.vn';
EOF
else
    echo "Tạo Lead admin@sol.vn mới..."
    sudo -u postgres psql huongdi_prod << EOF
INSERT INTO leads (
  ten, sdt, email, goi, amount, payment_status,
  magic_token, password_hash, password_set_at,
  activated_at, expires_at, created_at, updated_at
) VALUES (
  'Admin Sol',
  '0912727381',
  'admin@sol.vn',
  'FOUNDER',
  1999000,
  'ACTIVATED',
  'admin-lead-token-' || gen_random_uuid()::text,
  '$HASH',
  now(),
  now(),
  now() + interval '10 years',
  now(),
  now()
);

SELECT id, ten, email, payment_status, LEFT(password_hash, 20) FROM leads WHERE email = 'admin@sol.vn';
EOF
fi

echo ""
echo "✅ Setup done"
echo "  🌐 Login: https://adminhuongdi.sol.vn/login"
echo "  📧 Email: admin@sol.vn"
echo "  🔑 Password: $NEW_PASSWORD"
