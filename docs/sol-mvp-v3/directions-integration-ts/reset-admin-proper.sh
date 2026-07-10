#!/bin/bash
# Reset admin password với bcrypt rounds=12 (đúng schema Sol)
set -e

BACKEND="/var/www/huongdi/backend"
NEW_PASSWORD="${1:-huongdi2026!}"

echo "═══ Reset admin@sol.vn password (bcrypt rounds=12) ═══"
echo ""

# Generate hash với rounds=12 (khớp seed.ts)
HASH=$(cd "$BACKEND" && node -e "console.log(require('bcryptjs').hashSync('$NEW_PASSWORD', 12));")
echo "Hash prefix: ${HASH:0:20}..."

# Update DB
sudo -u postgres psql huongdi_prod << EOF
UPDATE admin_users
SET password_hash = '$HASH', updated_at = now(), is_active = true
WHERE email = 'admin@sol.vn';

SELECT id, email, role, is_active, LEFT(password_hash, 20) AS hash_prefix, updated_at
FROM admin_users WHERE email = 'admin@sol.vn';
EOF

echo ""
echo "✅ Password reset"
echo "  🌐 Login: https://adminhuongdi.sol.vn/login"
echo "  📧 Email: admin@sol.vn"
echo "  🔑 Password: $NEW_PASSWORD"
