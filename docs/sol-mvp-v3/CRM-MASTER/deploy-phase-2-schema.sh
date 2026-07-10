#!/bin/bash
# Deploy CRM Phase 2 — Prisma migration add 4 tables
# An toàn: backup schema.prisma trước khi patch
set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
SCHEMA="$BACKEND/prisma/schema.prisma"
ADDITIONS="/tmp/phase-2-schema-additions.prisma"

echo -e "${CYAN}═══ CRM Phase 2 — Prisma Migration ═══${NC}"
echo ""

# ─── 1. Verify files ────
echo -e "${YELLOW}[1/6] Verify prerequisites${NC}"
if [ ! -f "$ADDITIONS" ]; then
    echo -e "${RED}❌ /tmp/phase-2-schema-additions.prisma not found${NC}"
    echo "   scp phase-2-schema-additions.prisma sol-vps:/tmp/"
    exit 1
fi
if [ ! -f "$SCHEMA" ]; then
    echo -e "${RED}❌ schema.prisma not found at $SCHEMA${NC}"
    exit 1
fi
echo -e "   ${GREEN}✓ Files ready${NC}"

# ─── 2. Backup current schema ────
echo ""
echo -e "${YELLOW}[2/6] Backup current schema.prisma${NC}"
BACKUP_TS=$(date +%Y%m%d-%H%M%S)
sudo cp "$SCHEMA" "$SCHEMA.backup-$BACKUP_TS"
echo -e "   ${GREEN}✓ Backup: $SCHEMA.backup-$BACKUP_TS${NC}"

# ─── 3. Check if already applied ────
echo ""
echo -e "${YELLOW}[3/6] Check if CRM models already exist${NC}"
if sudo grep -q "model CustomerNote" "$SCHEMA"; then
    echo -e "${YELLOW}⚠  CustomerNote model already exists in schema. Skip append.${NC}"
    read -p "Continue anyway (append duplicate)? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# ─── 4. Append new models ────
echo ""
echo -e "${YELLOW}[4/6] Append new models to schema.prisma${NC}"
echo "" | sudo tee -a "$SCHEMA" > /dev/null
sudo cat "$ADDITIONS" | sudo tee -a "$SCHEMA" > /dev/null
echo -e "   ${GREEN}✓ Appended 4 models + 3 enums${NC}"

# ─── 5. IMPORTANT: Manually add relations to User + Lead ────
echo ""
echo -e "${YELLOW}[5/6] ⚠  MANUAL STEP REQUIRED${NC}"
echo ""
echo -e "${CYAN}Cần THÊM 3 dòng vào model User (before closing brace):${NC}"
echo -e "   notes       CustomerNote[]  @relation(\"UserNotes\")"
echo -e "   tags        CustomerTag[]   @relation(\"UserTags\")"
echo -e "   followUps   FollowUp[]      @relation(\"UserFollowUps\")"
echo ""
echo -e "${CYAN}Cần THÊM 3 dòng vào model Lead (before closing brace):${NC}"
echo -e "   notes       CustomerNote[]  @relation(\"LeadNotes\")"
echo -e "   tags        CustomerTag[]   @relation(\"LeadTags\")"
echo -e "   followUps   FollowUp[]      @relation(\"LeadFollowUps\")"
echo ""
echo -e "${YELLOW}Edit file:${NC}"
echo -e "   sudo nano $SCHEMA"
echo ""
read -p "Sau khi edit xong, nhấn Enter để continue với migration..."

# ─── 6. Run Prisma migrate ────
echo ""
echo -e "${YELLOW}[6/6] Run Prisma migrate${NC}"
cd "$BACKEND"

echo -e "${CYAN}   → Validate schema...${NC}"
sudo npx prisma validate

echo ""
echo -e "${CYAN}   → Generate migration (dry-run first)...${NC}"
sudo npx prisma migrate diff \
    --from-schema-datamodel "$SCHEMA.backup-$BACKUP_TS" \
    --to-schema-datamodel "$SCHEMA" \
    --script > /tmp/migration-preview.sql 2>&1 || true

echo ""
echo -e "${CYAN}   → Migration SQL preview:${NC}"
head -50 /tmp/migration-preview.sql
echo ""
read -p "Apply migration? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted. Rollback:${NC}"
    echo -e "   sudo cp $SCHEMA.backup-$BACKUP_TS $SCHEMA"
    exit 0
fi

echo ""
echo -e "${CYAN}   → Apply migration...${NC}"
sudo npx prisma migrate dev --name add_crm_tables --skip-seed

echo ""
echo -e "${CYAN}   → Regenerate Prisma Client...${NC}"
sudo npx prisma generate

echo ""
echo -e "${CYAN}   → Restart PM2 to load new client...${NC}"
pm2 restart huongdi-api --update-env

# ─── Verification ────
echo ""
echo -e "${YELLOW}Verify — new tables created${NC}"
sudo -u postgres psql huongdi_prod -c "\dt" | grep -E "customer_notes|customer_tags|follow_ups|email_campaigns"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Phase 2 Complete — 4 CRM tables ready       ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Next: Phase 3 — Build Backend API endpoints${NC}"
