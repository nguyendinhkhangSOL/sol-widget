#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Patch cronjob backup — include huongdi_prod
# Chạy: bash patch-backup-crontab.sh
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🔧 Patch backup crontab — include huongdi_prod${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── STEP 1: Backup current crontab ──────────────────────────
echo -e "${YELLOW}[1/4] Backup current crontab...${NC}"
BAK_FILE="/tmp/postgres-crontab-bak-$(date +%Y%m%d-%H%M%S)"
sudo -u postgres crontab -l > "$BAK_FILE" 2>/dev/null || echo "" > "$BAK_FILE"
echo -e "    ${GREEN}✅ Backup: $BAK_FILE${NC}"

# ─── STEP 2: Check if already patched ────────────────────────
if sudo -u postgres crontab -l 2>/dev/null | grep -q "pg_dump huongdi_prod"; then
    echo -e "    ${CYAN}⏭  Đã có backup huongdi_prod — skip${NC}"
    exit 0
fi

# ─── STEP 3: Add new backup lines ────────────────────────────
echo -e "${YELLOW}[2/4] Thêm 2 dòng cronjob mới cho huongdi_prod...${NC}"

TMPFILE=$(mktemp)
sudo -u postgres crontab -l 2>/dev/null > "$TMPFILE" || true

cat >> "$TMPFILE" << 'EOF'

# Added 2026-07-04: Include huongdi_prod backup
0 2 * * * pg_dump huongdi_prod | gzip > /var/backups/postgres/huongdi_prod-$(date +\%F).sql.gz
0 3 * * * find /var/backups/postgres -name "huongdi_prod-*.sql.gz" -mtime +30 -delete
EOF

sudo -u postgres crontab "$TMPFILE"
rm "$TMPFILE"
echo -e "    ${GREEN}✅ Added 2 lines${NC}"

# ─── STEP 4: Verify + Run first backup NOW ───────────────────
echo -e "${YELLOW}[3/4] Verify crontab...${NC}"
echo ""
sudo -u postgres crontab -l | tail -8
echo ""

echo -e "${YELLOW}[4/4] Chạy backup huongdi_prod NGAY (không đợi 2AM)...${NC}"
sudo -u postgres bash -c "pg_dump huongdi_prod | gzip > /var/backups/postgres/huongdi_prod-$(date +%F).sql.gz"

FIRST_BACKUP="/var/backups/postgres/huongdi_prod-$(date +%F).sql.gz"
if [ -f "$FIRST_BACKUP" ]; then
    SIZE=$(du -h "$FIRST_BACKUP" | cut -f1)
    echo -e "    ${GREEN}✅ First backup: $FIRST_BACKUP ($SIZE)${NC}"
else
    echo -e "    ⚠️  First backup không tạo được — check permissions"
fi

# List all backups
echo ""
echo -e "${CYAN}📁 Backups hiện có:${NC}"
sudo ls -la /var/backups/postgres/ | grep -E "\.sql\.gz$"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ PATCH XONG!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📅 Lịch: Mỗi ngày 2:00 AM backup CẢ sol_prod + huongdi_prod"
echo -e "  📁 Retention: 30 ngày (auto delete cũ)"
echo -e "  🔄 Rollback: sudo -u postgres crontab $BAK_FILE"
echo ""
