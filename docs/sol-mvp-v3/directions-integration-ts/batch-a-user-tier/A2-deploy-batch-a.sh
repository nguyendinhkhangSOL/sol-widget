#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BATCH A — User Tier System
# 1. Backup FULL DB (nguyên tắc cứng)
# 2. Patch schema.prisma (add UserTier enum + 4 fields User + 1 relation Lead)
# 3. Prisma db push
# 4. Patch leads.ts activation flow (create/upsert User)
# 5. Build + PM2 restart
# 6. Verify
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
SCHEMA="$BACKEND/prisma/schema.prisma"
LEADS_TS="$BACKEND/src/routes/leads.ts"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🎯 BATCH A — User Tier System${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── STEP 1: BACKUP FULL DB ──────────────────────────────────
echo -e "${YELLOW}[1/6] Backup FULL DB...${NC}"
bash /tmp/directions-integration-ts/backup-full.sh pre-batch-a-user-tier
echo -e "${GREEN}✅ Backup done${NC}"

# ─── STEP 2: Backup individual files ─────────────────────────
echo -e "${YELLOW}[2/6] Backup schema + leads.ts...${NC}"
cp "$SCHEMA" "$SCHEMA.bak-batch-a-$(date +%s)"
cp "$LEADS_TS" "$LEADS_TS.bak-batch-a-$(date +%s)"
echo -e "${GREEN}✅ Files backed up${NC}"

# ─── STEP 3: Patch schema.prisma ─────────────────────────────
echo -e "${YELLOW}[3/6] Patch schema.prisma...${NC}"

# 3a. Check if UserTier enum already exists
if grep -q "^enum UserTier" "$SCHEMA"; then
    echo -e "    ${CYAN}⏭  UserTier enum đã có — skip${NC}"
else
    # Append UserTier enum at end of file
    cat >> "$SCHEMA" << 'EOF'

// ═══════════════════════════════════════════════════════════════
// BATCH A — User Tier System (2026-07-04)
// ═══════════════════════════════════════════════════════════════
enum UserTier {
  FREE
  ACTIVE
  FOUNDER
  EXPIRED
}
EOF
    echo -e "    ${GREEN}✅ Added UserTier enum${NC}"
fi

# 3b. Add fields to User model (before @@map("users"))
if grep -q "tier\s*UserTier" "$SCHEMA"; then
    echo -e "    ${CYAN}⏭  User.tier field đã có — skip${NC}"
else
    # Use Python for reliable multi-line insertion
    python3 << 'PYEOF'
import re

with open('/var/www/huongdi/backend/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Find User model block and inject fields before @@map("users")
user_block_pattern = r'(model User \{[^}]*?)(\s*@@map\("users"\)\s*\})'

new_fields = '''
  // ─── BATCH A — Tier gating (2026-07-04) ────────────────
  tier              UserTier   @default(FREE)
  tierStartedAt     DateTime?  @map("tier_started_at")
  tierExpiresAt     DateTime?  @map("tier_expires_at")
  activeLeadId      Int?       @unique @map("active_lead_id")
  activeLead        Lead?      @relation("ActiveLeadUser", fields: [activeLeadId], references: [id])
'''

def replace_user(match):
    return match.group(1) + new_fields + match.group(2)

new_content = re.sub(user_block_pattern, replace_user, content, count=1, flags=re.DOTALL)

# Also add reverse relation in Lead model
if 'activatedUser' not in new_content:
    lead_block_pattern = r'(model Lead \{[^}]*?)(\s*@@index\(\[sdt\]\))'
    lead_new_field = '\n  activatedUser  User?  @relation("ActiveLeadUser")\n'
    new_content = re.sub(lead_block_pattern, r'\1' + lead_new_field + r'\2', new_content, count=1, flags=re.DOTALL)

with open('/var/www/huongdi/backend/prisma/schema.prisma', 'w') as f:
    f.write(new_content)

print("✅ Schema patched")
PYEOF
fi

# Verify
echo ""
echo -e "${CYAN}Verify schema changes:${NC}"
grep -A 5 "UserTier" "$SCHEMA" | head -10
echo ""
grep -A 3 "tier\s*UserTier" "$SCHEMA" || echo "⚠️  Không tìm thấy tier field trong User model"

# ─── STEP 4: Prisma db push ──────────────────────────────────
echo ""
echo -e "${YELLOW}[4/6] Prisma db push...${NC}"
cd "$BACKEND"
npx prisma generate 2>&1 | tail -3
npx prisma db push --accept-data-loss 2>&1 | tail -10
echo -e "${GREEN}✅ DB pushed${NC}"

# ─── STEP 5: Patch leads.ts activation flow ─────────────────
echo -e "${YELLOW}[5/6] Patch leads.ts activation flow...${NC}"

python3 << 'PYEOF'
import re

filepath = '/var/www/huongdi/backend/src/routes/leads.ts'
with open(filepath, 'r') as f:
    content = f.read()

if 'prisma.user.upsert' in content:
    print("⏭  User.upsert đã có trong leads.ts — skip")
else:
    # Find "if (firstActivation) {" block and inject User creation
    old_block = '''  const firstActivation = lead.paymentStatus !== 'ACTIVATED';
  if (firstActivation) {
    await prisma.lead.update({
      where: { id: lead.id },
      data:  { paymentStatus: 'ACTIVATED', activatedAt: new Date() }
    });
  }'''

    new_block = '''  const firstActivation = lead.paymentStatus !== 'ACTIVATED';
  if (firstActivation) {
    // Update lead status
    await prisma.lead.update({
      where: { id: lead.id },
      data:  { paymentStatus: 'ACTIVATED', activatedAt: new Date() }
    });

    // BATCH A — Create/upsert User account linked to Lead
    try {
      const tier: 'ACTIVE' | 'FOUNDER' = lead.goi === 'FOUNDER' ? 'FOUNDER' : 'ACTIVE';
      const tierStartedAt = new Date();
      const tierExpiresAt = lead.goi === 'FOUNDER' ? null : lead.expiresAt;

      // Try upsert by phone (unique-ish). Fallback: findFirst by phone.
      const existing = await prisma.user.findFirst({
        where: { OR: [ { phone: lead.sdt }, ...(lead.email ? [{ email: lead.email }] : []) ] },
      });

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            tier: tier as any,
            tierStartedAt,
            tierExpiresAt,
            activeLeadId: lead.id,
            displayName: existing.displayName || lead.ten,
            email: existing.email || lead.email || undefined,
            phone: existing.phone || lead.sdt,
            lastSeenAt: new Date(),
          },
        });
      } else {
        await prisma.user.create({
          data: {
            phone: lead.sdt,
            email: lead.email || null,
            displayName: lead.ten,
            tier: tier as any,
            tierStartedAt,
            tierExpiresAt,
            activeLeadId: lead.id,
            lastSeenAt: new Date(),
          },
        });
      }
    } catch (userErr: any) {
      console.error('[activate] User upsert error (non-fatal):', userErr?.message);
    }
  }'''

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(filepath, 'w') as f:
            f.write(content)
        print("✅ Injected User upsert into leads.ts activate handler")
    else:
        print("⚠️  Không tìm thấy activation block chuẩn — manual patch needed")
PYEOF

# ─── STEP 6: Build + Restart + Verify ────────────────────────
echo ""
echo -e "${YELLOW}[6/6] Build + Restart + Verify...${NC}"
cd "$BACKEND"

if npm run build 2>&1 | tail -8; then
    pm2 restart huongdi-api
    sleep 3
    pm2 logs huongdi-api --lines 10 --nostream
    echo ""
    echo -e "${GREEN}✅ Backend restarted${NC}"
else
    echo -e "${RED}❌ Build failed. Check errors above.${NC}"
    exit 1
fi

# Verify DB has new column
echo ""
echo -e "${CYAN}Verify User table schema:${NC}"
sudo -u postgres psql huongdi_prod -c "\\d users" 2>&1 | grep -E "tier|active_lead"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ BATCH A DONE!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}📋 Next steps:${NC}"
echo -e "    1. Test activation với 1 Lead PENDING → PAID → ACTIVATE"
echo -e "    2. Verify User được tạo với tier=ACTIVE/FOUNDER + activeLeadId link"
echo -e "    3. Ship Batch B: /api/admin/users/:id detail + UsersPage.tsx enrich"
echo ""
