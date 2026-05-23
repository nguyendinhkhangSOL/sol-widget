#!/bin/bash
# =================================================================
# Sol Widget — Backup script
# Run on VPS: bash /var/www/sol-widget/scripts/backup-vps.sh
# Or remote: ssh sol-vps "bash /var/www/sol-widget/scripts/backup-vps.sh"
# =================================================================

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_ROOT="/var/backups/sol-widget"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

echo ""
echo "=== Sol Widget Backup — $TIMESTAMP ==="
echo ""

# Create backup dir with world-writable temporarily (postgres user needs it)
sudo mkdir -p "$BACKUP_DIR"
sudo chmod 777 "$BACKUP_DIR"

# ----- 1. PostgreSQL dump -----
echo "[1/4] Dumping PostgreSQL database..."
sudo -u postgres pg_dump -d sol_widget --no-owner --no-acl -Fc -f "$BACKUP_DIR/sol_widget.dump"
DB_SIZE=$(sudo du -h "$BACKUP_DIR/sol_widget.dump" | cut -f1)
echo "  OK: sol_widget.dump ($DB_SIZE)"

# ----- 2. App source code (without node_modules + .next) -----
echo ""
echo "[2/4] Archiving app source..."
sudo tar --exclude='node_modules' --exclude='.next' --exclude='*.log' \
  -czf "$BACKUP_DIR/app-source.tar.gz" \
  -C /var/www sol-widget
APP_SIZE=$(sudo du -h "$BACKUP_DIR/app-source.tar.gz" | cut -f1)
echo "  OK: app-source.tar.gz ($APP_SIZE)"

# ----- 3. .env + configs (cẩn thận, có secret) -----
echo ""
echo "[3/4] Backing up .env + configs..."
sudo cp /var/www/sol-widget/.env "$BACKUP_DIR/.env"
sudo cp /etc/nginx/sites-enabled/bothuocla.sol.vn "$BACKUP_DIR/nginx-bothuocla.conf" 2>/dev/null || true
sudo cp -r /etc/letsencrypt/live/bothuocla.sol.vn "$BACKUP_DIR/ssl-cert" 2>/dev/null || true
echo "  OK: .env + nginx + ssl cert"

# ----- 4. PM2 state -----
echo ""
echo "[4/4] PM2 state..."
pm2 save 2>&1 | tail -3
sudo cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2-dump" 2>/dev/null || true
echo "  OK: pm2-dump"

# ----- Summary -----
sudo chown -R solop:solop "$BACKUP_DIR"
TOTAL_SIZE=$(sudo du -sh "$BACKUP_DIR" | cut -f1)

echo ""
echo "=== BACKUP COMPLETE ==="
echo ""
echo "Location: $BACKUP_DIR"
echo "Total size: $TOTAL_SIZE"
echo ""
echo "Files:"
sudo ls -la "$BACKUP_DIR"
echo ""

# Keep only last 10 backups (auto-cleanup)
echo "Cleaning old backups (keep last 10)..."
sudo find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | sort -r | tail -n +11 | xargs -r sudo rm -rf
KEPT=$(sudo find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" | wc -l)
echo "  Kept: $KEPT backups"

echo ""
echo "To restore:"
echo "  Database: sudo -u postgres pg_restore -d sol_widget --clean $BACKUP_DIR/sol_widget.dump"
echo "  Source:   sudo tar -xzf $BACKUP_DIR/app-source.tar.gz -C /var/www"
echo "  .env:     sudo cp $BACKUP_DIR/.env /var/www/sol-widget/.env"
echo ""
