#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SETUP AUTO BACKUP — Cronjob backup daily 2h sáng
# Chạy 1 lần: bash setup-auto-backup.sh
# ═══════════════════════════════════════════════════════════════
set -e

BACKUP_SCRIPT="/home/solop/backup-full.sh"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ⏰ SETUP AUTO BACKUP (Daily 2h sáng)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Copy backup script vào home
if [ -f "/tmp/directions-integration-ts/backup-full.sh" ]; then
    cp /tmp/directions-integration-ts/backup-full.sh "$BACKUP_SCRIPT"
    chmod +x "$BACKUP_SCRIPT"
    echo "  ✅ Copied backup script to $BACKUP_SCRIPT"
else
    echo "  ❌ /tmp/directions-integration-ts/backup-full.sh không tồn tại"
    echo "     Upload từ laptop trước, rồi chạy lại"
    exit 1
fi

# 2. Setup cronjob
CRONJOB="0 2 * * * /bin/bash $BACKUP_SCRIPT auto >> /home/solop/backup.log 2>&1"

# Check nếu cron đã có
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "  ⏭  Cronjob đã có — skip"
else
    (crontab -l 2>/dev/null; echo "$CRONJOB") | crontab -
    echo "  ✅ Cronjob added: daily 2:00 AM"
fi

# 3. Verify
echo ""
echo "  📋 Current crontab:"
crontab -l | grep -v '^#' | grep -v '^$'

# 4. Test run backup 1 lần luôn
echo ""
read -p "  🧪 Chạy backup manual ngay bây giờ? (Y/n): " RUN_NOW
if [ "$RUN_NOW" != "n" ] && [ "$RUN_NOW" != "N" ]; then
    bash "$BACKUP_SCRIPT" "setup-verify"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ AUTO BACKUP SETUP XONG!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📅 Lịch: Mỗi ngày 2:00 AM"
echo "  📁 Location: /home/solop/backups/sol-full-auto-YYYYMMDD-HHMMSS.tar.gz"
echo "  📊 Retention: Giữ 10 backup mới nhất, xóa cũ"
echo "  📝 Log: /home/solop/backup.log"
echo ""
echo "  🛠️  Backup manual (trước khi làm thao tác lớn):"
echo "    bash $BACKUP_SCRIPT pre-batch1b"
echo "    bash $BACKUP_SCRIPT pre-migration"
echo "    bash $BACKUP_SCRIPT before-nuke"
echo ""
echo "  📥 Sync về laptop định kỳ (tránh mất VPS):"
echo "    scp -r sol-vps:/home/solop/backups/ C:/BOTHUOCLA/backups/"
echo ""
