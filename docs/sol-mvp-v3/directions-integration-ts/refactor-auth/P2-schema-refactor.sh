#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PHASE 2 (v3): Schema Refactor — Chính xác với User schema hiện tại
#
# User model đã có sẵn:
#   ✅ role UserRole @default(USER)
#   ✅ provider AuthProvider @default(EMAIL)
#   ✅ displayName, phone, email, zaloId
#   ✅ tier UserTier @default(FREE) — Batch A
#   ✅ activeLeadId, tierStartedAt, tierExpiresAt
#
# CẦN THÊM:
#   ❌ passwordHash    String?   @map("password_hash")
#   ❌ phoneVerified   Boolean   @default(false)
#   ❌ emailVerified   Boolean   @default(false)
#   ❌ lastLoginAt     DateTime? (khác lastSeenAt hiện có)
#   ❌ leads[]         @relation("LeadOwner")
#
# LEAD:
#   ❌ userId          String?   @db.Uuid
#   ❌ user            User?     @relation("LeadOwner")
#   ⚠  passwordHash   → mark DEPRECATED (giữ data)
#
# MIGRATION:
#   • admin_users.admin@sol.vn → users (role=SUPER_ADMIN, tier=FOUNDER)
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
SCHEMA="$BACKEND/prisma/schema.prisma"
DB_NAME="huongdi_prod"

echo ""
echo -e "${CYAN}═══ PHASE 2 (v3): SCHEMA REFACTOR ═══${NC}"
echo ""

# ─── 0. Safety check backup ─────────────────────────────────
LATEST_BACKUP=$(ls -td /var/backups/huongdi/refactor-auth-* 2>/dev/null | head -1)
if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}❌ Chưa có backup — chạy P1 trước${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backup: $LATEST_BACKUP${NC}"

# ─── 1. RESTORE schema.prisma từ backup + Clean orphan tables ─
echo -e "${YELLOW}[1/6] Restore schema.prisma + clean orphan tables...${NC}"
sudo cp "$LATEST_BACKUP/schema.prisma.bak" "$SCHEMA"
sudo chown $(stat -c '%U:%G' "$BACKEND/prisma/") "$SCHEMA"

# Drop orphan tables từ attempt trước (nếu có)
sudo -u postgres psql "$DB_NAME" << 'ORPHAN'
DROP TABLE IF EXISTS migration_admin_backup CASCADE;
ORPHAN
echo -e "    ${GREEN}✅ Schema restored + orphan cleaned${NC}"

# ─── 2. Diagnose: xem User & UserRole enum ──────────────────
echo -e "${YELLOW}[2/6] Diagnose schema...${NC}"
python3 << 'PYEOF'
import re
with open('/var/www/huongdi/backend/prisma/schema.prisma', 'r') as f:
    content = f.read()

# User fields
user_match = re.search(r'model User \{([^}]+)\}', content, re.DOTALL)
if user_match:
    body = user_match.group(1)
    print("  User fields to add:")
    for f in ['passwordHash', 'phoneVerified', 'emailVerified', 'lastLoginAt']:
        need = f not in body
        print(f"    {'❌ ADD' if need else '⏭  SKIP'} {f}")

# UserRole values
role_match = re.search(r'enum UserRole \{([^}]+)\}', content, re.DOTALL)
if role_match:
    values = [line.strip().split()[0] for line in role_match.group(1).split('\n') if line.strip() and not line.strip().startswith('//')]
    print(f"  UserRole values: {values}")

# AdminUser.role default
admin_match = re.search(r'model AdminUser \{([^}]+)\}', content, re.DOTALL)
if admin_match and 'role' in admin_match.group(1):
    admin_role = re.search(r'\s+role\s+\w+\s+@default\((\w+)\)', admin_match.group(1))
    if admin_role:
        print(f"  AdminUser.role default: {admin_role.group(1)}")
PYEOF

# ─── 3. Apply schema changes ────────────────────────────────
echo -e "${YELLOW}[3/6] Apply changes (defensive, idempotent)...${NC}"

python3 << 'PYEOF'
import re

FILEPATH = '/var/www/huongdi/backend/prisma/schema.prisma'
with open(FILEPATH, 'r') as f:
    content = f.read()

changes = []

# ─── A. User model: add missing fields ───
user_match = re.search(r'(model User \{)([^}]+)(\})', content, re.DOTALL)
if user_match:
    prefix, body, suffix = user_match.group(1), user_match.group(2), user_match.group(3)
    original = body

    new_fields = []
    if 'passwordHash' not in body:
        new_fields.append('  passwordHash   String?   @map("password_hash")')
    if 'phoneVerified' not in body:
        new_fields.append('  phoneVerified  Boolean   @default(false) @map("phone_verified")')
    if 'emailVerified' not in body:
        new_fields.append('  emailVerified  Boolean   @default(false) @map("email_verified")')
    if 'lastLoginAt' not in body:
        new_fields.append('  lastLoginAt    DateTime? @map("last_login_at")')

    # Insert new fields before "// Relations" comment or before "createdAt"
    if new_fields:
        insertion = '\n  // ─── AUTH REFACTOR (2026-07-04) ─────────────────\n' + '\n'.join(new_fields) + '\n'
        # Insert AFTER "role" or "isActive" line (after basic fields)
        if 'isActive' in body:
            body = re.sub(r'(\s+isActive\s+[^\n]+\n)', r'\1' + insertion, body, count=1)
        else:
            # Fallback: before // Relations
            body = body.replace('// Relations', insertion + '\n  // Relations', 1)
        changes.append(f"User: added {len(new_fields)} auth field(s)")

    # Add leads[] relation
    if 'Lead[]      @relation("LeadOwner")' not in body and 'Lead[]    @relation("LeadOwner")' not in body:
        # Insert in relations section (find existing relation)
        if 'events         UserEvent[]' in body:
            body = body.replace(
                'events         UserEvent[]',
                'events         UserEvent[]\n  leads          Lead[]      @relation("LeadOwner")',
                1
            )
            changes.append("User: added leads[] relation")

    if body != original:
        content = content.replace(user_match.group(0), prefix + body + suffix)

# ─── B. Lead model: add userId FK, deprecate passwordHash ───
lead_match = re.search(r'(model Lead \{)([^}]+)(\})', content, re.DOTALL)
if lead_match:
    prefix, body, suffix = lead_match.group(1), lead_match.group(2), lead_match.group(3)
    original = body

    # Add userId FK if not exists
    if 'userId' not in body or 'LeadOwner' not in body:
        # Detect Lead.id type (Int vs String)
        id_match = re.search(r'\s+id\s+(\w+)', body)
        id_type = id_match.group(1) if id_match else 'String'

        # userId type must match User.id → User.id is String (uuid)
        insertion = '''
  // ─── AUTH REFACTOR (2026-07-04) ─────────────────
  userId         String?    @map("user_id")
  user           User?      @relation("LeadOwner", fields: [userId], references: [id], onDelete: SetNull)
'''
        # Insert before "// Relations" or before "@@map"
        if '// Relations' in body:
            body = body.replace('// Relations', insertion + '\n  // Relations', 1)
        elif '@@map' in body:
            body = body.replace('@@map', insertion + '\n\n  @@map', 1)
        changes.append("Lead: added userId FK + user relation")

    # Deprecate passwordHash — chỉ mark comment
    if 'passwordHash' in body and 'DEPRECATED' not in body:
        body = re.sub(
            r'(\s+passwordHash\s+String\?)(\s+@map[^\n]*)',
            r'\1\2 // DEPRECATED-AUTH-REFACTOR: use User.passwordHash',
            body
        )
        changes.append("Lead: deprecated passwordHash comment")

    if body != original:
        content = content.replace(lead_match.group(0), prefix + body + suffix)

# ─── Write back ───
with open(FILEPATH, 'w') as f:
    f.write(content)

if changes:
    print("  Changes:")
    for c in changes:
        print(f"    ✅ {c}")
else:
    print("  ⏭  No changes needed")
PYEOF

# ─── 4. Push schema to DB ───────────────────────────────────
echo -e "${YELLOW}[4/6] Push schema (npx prisma db push)...${NC}"
cd "$BACKEND"

PUSH_OUT=$(npx prisma db push --accept-data-loss --skip-generate 2>&1) || {
    echo -e "${RED}❌ Prisma push failed:${NC}"
    echo "$PUSH_OUT" | tail -30
    exit 1
}
echo "$PUSH_OUT" | grep -E "✔|Warning|Error" | head -10
echo -e "    ${GREEN}✅ Schema pushed${NC}"

# ─── 5. Generate Prisma client ──────────────────────────────
echo -e "${YELLOW}[5/6] Generate Prisma client...${NC}"
npx prisma generate 2>&1 | tail -3

# ─── 6. Migrate admin_users → users ─────────────────────────
echo -e "${YELLOW}[6/6] Migrate admin@sol.vn: AdminUser → User...${NC}"
echo -e "${CYAN}    UserRole enum: USER | RESEARCH_EDITOR | CONTENT_EDITOR | ANALYST | SUPER_ADMIN${NC}"
echo -e "${CYAN}    Copying role trực tiếp từ admin_users (both dùng cùng UserRole enum)${NC}"

sudo -u postgres psql "$DB_NAME" << 'SQL'
-- Merge admin@sol.vn từ admin_users vào users
-- Note: cả 2 tables dùng cùng enum UserRole → copy role trực tiếp
INSERT INTO users (
  id, email, phone, display_name,
  password_hash, role, tier,
  email_verified, phone_verified,
  is_active,
  provider,
  created_at, updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE((SELECT sdt FROM leads WHERE email=au.email LIMIT 1), '0912727381'),
  au.display_name,
  au.password_hash,
  au.role,  -- keep original role (SUPER_ADMIN / ANALYST / etc.)
  'FOUNDER'::"UserTier",
  true, true,
  au.is_active,
  'EMAIL'::"AuthProvider",
  au.created_at, au.updated_at
FROM admin_users au
WHERE au.email = 'admin@sol.vn'
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    tier = EXCLUDED.tier,
    display_name = EXCLUDED.display_name,
    email_verified = true,
    is_active = true,
    updated_at = now();

-- Verify
SELECT id, email, phone, role, tier, display_name FROM users WHERE role::text != 'USER';
SQL

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PHASE 2 (v3) COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
