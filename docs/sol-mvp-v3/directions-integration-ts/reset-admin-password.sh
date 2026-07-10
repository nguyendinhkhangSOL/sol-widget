#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Reset password cho admin@sol.vn
# Usage: bash reset-admin-password.sh <new-password>
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

# Check password argument
NEW_PASSWORD="${1:-}"
if [ -z "$NEW_PASSWORD" ]; then
    echo -e "${YELLOW}Usage: bash reset-admin-password.sh <new-password>${NC}"
    echo "Example: bash reset-admin-password.sh MyNewPass2026"
    exit 1
fi

echo ""
echo -e "${CYAN}═══ Reset admin@sol.vn password ═══${NC}"
echo ""

# ─── Step 1: Check schema admin table ────────────────────────
echo -e "${YELLOW}[1/4] Check admin_users schema:${NC}"
sudo -u postgres psql huongdi_prod -c '\d admin_users' 2>&1 | head -15

echo ""
echo -e "${YELLOW}[2/4] Existing admin accounts:${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT id, email, role, is_active, created_at FROM admin_users ORDER BY created_at LIMIT 10;
EOF

# ─── Step 3: Generate bcrypt hash ────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Generate bcrypt hash cho new password...${NC}"

HASH=$(cd "$BACKEND" && node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('$NEW_PASSWORD', 10);
console.log(hash);
")

if [ -z "$HASH" ]; then
    echo -e "${RED}❌ Failed to generate bcrypt hash${NC}"
    exit 1
fi

echo -e "    ${GREEN}✅ Hash generated: ${HASH:0:20}...${NC}"

# ─── Step 4: Update DB ───────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Update admin_users password_hash...${NC}"

sudo -u postgres psql huongdi_prod << EOF
UPDATE admin_users
SET password_hash = '$HASH', updated_at = now()
WHERE email = 'admin@sol.vn';

SELECT id, email, role, is_active, updated_at FROM admin_users WHERE email = 'admin@sol.vn';
EOF

echo ""
echo -e "${GREEN}✅ Password reset done!${NC}"
echo ""
echo -e "  🌐 Login: ${CYAN}https://adminhuongdi.sol.vn/login${NC}"
echo -e "  📧 Email: ${CYAN}admin@sol.vn${NC}"
echo -e "  🔑 Password: ${CYAN}$NEW_PASSWORD${NC}"
echo ""
