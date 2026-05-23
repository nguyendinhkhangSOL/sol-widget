#!/bin/bash
# =============================================================================
# Đi Cùng Sol - VPS Provision Script
# Target: Ubuntu 24.04 LTS (works on 22.04 too)
# Setup: Nginx + Node 20 + PostgreSQL 16 + PM2 + Certbot + Security
#
# Usage:
#   1. SSH vao VPS (lan dau bang password):
#      ssh root@<IP>
#   2. Copy file nay len VPS:
#      scp provision-vps.sh root@<IP>:/root/
#   3. Chay (CAN root hoac sudo):
#      cd /root && bash provision-vps.sh 2>&1 | tee provision.log
#   4. Mat 10-15 phut. Cuoi script in tom tat.
#
# Sau khi xong, chay them: bash deploy-sol-widget.sh (em viet sau)
# =============================================================================

set -e  # Stop neu co loi
set -u  # Bao loi neu dung bien chua khai bao

# ─── CONFIG (sua o day truoc khi chay) ────────────────────────────
DOMAIN="bothuocla.sol.vn"
EMAIL_SSL="nguyendinhkhang@gmail.com"  # Email Let's Encrypt
USERNAME="solop"                        # User non-root se tao
TIMEZONE="Asia/Ho_Chi_Minh"
SWAP_SIZE_GB=2                          # 2GB swap (neu RAM 2GB) hoac 4 neu RAM 4GB
NODE_VERSION="20"                       # Node LTS
POSTGRES_VERSION="16"                   # Postgres version
APP_DIR="/var/www/sol-widget"           # Noi deploy Sol
SSH_PORT=22                             # Co the doi 22 -> port khac de bao mat hon

# Colors
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'

log() { echo -e "${G}[$(date '+%H:%M:%S')] $1${N}"; }
warn() { echo -e "${Y}[WARN] $1${N}"; }
err() { echo -e "${R}[ERR] $1${N}"; exit 1; }

[ "$EUID" -ne 0 ] && err "Chay voi sudo hoac root"

# ─── 0. INFO ──────────────────────────────────────────────────────
log "=============================================================="
log "Di Cung Sol - VPS Provision"
log "Domain: $DOMAIN | User: $USERNAME | Node: $NODE_VERSION | PG: $POSTGRES_VERSION"
log "=============================================================="

# ─── 1. UPDATE OS ─────────────────────────────────────────────────
log "[1/14] Update OS..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq software-properties-common ca-certificates curl wget gnupg lsb-release apt-transport-https

# ─── 2. TIMEZONE ──────────────────────────────────────────────────
log "[2/14] Set timezone $TIMEZONE..."
timedatectl set-timezone "$TIMEZONE"

# ─── 3. SWAP ──────────────────────────────────────────────────────
log "[3/14] Setup swap ${SWAP_SIZE_GB}GB..."
if [ ! -f /swapfile ]; then
  fallocate -l ${SWAP_SIZE_GB}G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  log "  Swap ${SWAP_SIZE_GB}GB OK"
else
  log "  Swap da co, skip"
fi

# ─── 4. USER NON-ROOT ─────────────────────────────────────────────
log "[4/14] Tao user $USERNAME..."
if ! id "$USERNAME" &>/dev/null; then
  adduser --disabled-password --gecos "" "$USERNAME"
  usermod -aG sudo "$USERNAME"
  log "  User $USERNAME tao xong. Set password ngay:"
  passwd "$USERNAME"
else
  log "  User $USERNAME da co"
fi

# Tao thu muc .ssh + authorized_keys
mkdir -p /home/$USERNAME/.ssh
chmod 700 /home/$USERNAME/.ssh
touch /home/$USERNAME/.ssh/authorized_keys
chmod 600 /home/$USERNAME/.ssh/authorized_keys
chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh

warn "  PASTE SSH PUBLIC KEY cua may anh vao /home/$USERNAME/.ssh/authorized_keys SAU khi script xong"
warn "  Lenh: nano /home/$USERNAME/.ssh/authorized_keys"

# ─── 5. UFW FIREWALL ──────────────────────────────────────────────
log "[5/14] Setup UFW firewall..."
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow $SSH_PORT/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
log "  UFW: 22, 80, 443 open"

# ─── 6. FAIL2BAN ──────────────────────────────────────────────────
log "[6/14] Cai fail2ban..."
apt-get install -y -qq fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
EOF
systemctl enable --now fail2ban >/dev/null

# ─── 7. AUTO SECURITY UPDATES ────────────────────────────────────
log "[7/14] Auto security updates..."
apt-get install -y -qq unattended-upgrades apt-listchanges
dpkg-reconfigure -plow unattended-upgrades

# ─── 8. NODE.JS 20 ────────────────────────────────────────────────
log "[8/14] Cai Node.js ${NODE_VERSION} LTS..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
apt-get install -y -qq nodejs
log "  Node: $(node -v) | npm: $(npm -v)"

# PM2 global
log "  Cai PM2..."
npm install -g pm2 >/dev/null 2>&1
pm2 startup systemd -u $USERNAME --hp /home/$USERNAME >/dev/null 2>&1 || true

# ─── 9. POSTGRESQL ────────────────────────────────────────────────
log "[9/14] Cai PostgreSQL ${POSTGRES_VERSION}..."
install -d /usr/share/postgresql-common/pgdg
curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc 2>/dev/null
sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
apt-get update -qq
apt-get install -y -qq postgresql-${POSTGRES_VERSION} postgresql-contrib-${POSTGRES_VERSION}
systemctl enable --now postgresql

# Tao DB + user cho Sol
log "  Tao database 'soldb' + user 'soluser'..."
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='soluser') THEN CREATE USER soluser WITH PASSWORD 'CHANGE_ME_$(openssl rand -hex 8)'; END IF; END \$\$;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE soldb OWNER soluser;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE soldb TO soluser;" 2>/dev/null || true

# ─── 10. NGINX ────────────────────────────────────────────────────
log "[10/14] Cai Nginx..."
apt-get install -y -qq nginx
systemctl enable --now nginx

# Config Nginx cho domain
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # ACME challenge (Let's Encrypt)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Reverse proxy Node app (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
log "  Nginx OK (chua co SSL, se cai o buoc tiep)"

# ─── 11. CERTBOT (Let's Encrypt) ──────────────────────────────────
log "[11/14] Cai Certbot..."
apt-get install -y -qq certbot python3-certbot-nginx
warn "  KHI CHAY THUC TE, chay tay lenh nay sau khi DNS A record cua $DOMAIN da tro ve IP VPS:"
warn "  certbot --nginx -d $DOMAIN --email $EMAIL_SSL --agree-tos --non-interactive --redirect"

# ─── 12. APP DIRECTORIES ──────────────────────────────────────────
log "[12/14] Tao app directory..."
mkdir -p $APP_DIR
mkdir -p /var/log/sol
mkdir -p /var/backups/sol
chown -R $USERNAME:$USERNAME $APP_DIR /var/log/sol /var/backups/sol
log "  Dir: $APP_DIR (cho deploy Sol Widget)"

# ─── 13. UTILITIES ────────────────────────────────────────────────
log "[13/14] Cai utilities..."
apt-get install -y -qq \
  git \
  rsync \
  htop \
  ncdu \
  vim \
  tmux \
  jq \
  zip unzip \
  build-essential \
  python3-pip \
  net-tools \
  iotop \
  logrotate

# ─── 14. SECURITY HARDENING ───────────────────────────────────────
log "[14/14] Security hardening SSH..."
# Backup
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Hardening rules
cat > /etc/ssh/sshd_config.d/99-sol-hardening.conf << EOF
# Sol VPS hardening
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
ChallengeResponseAuthentication no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers $USERNAME
EOF

warn "  SSH hardening configured. SAU KHI add SSH key cho user $USERNAME, doi 'PasswordAuthentication yes' thanh 'no'"
warn "  File: /etc/ssh/sshd_config.d/99-sol-hardening.conf"

# Khong restart sshd ngay - de tranh kick out connection hien tai

# ─── DONE ─────────────────────────────────────────────────────────
log "=============================================================="
log "DONE! Tom tat:"
log "=============================================================="
echo ""
echo "${G}OS:${N}        $(lsb_release -ds)"
echo "${G}Kernel:${N}    $(uname -r)"
echo "${G}Node.js:${N}   $(node -v)"
echo "${G}PostgreSQL:${N} $(sudo -u postgres psql -c 'SELECT version();' 2>/dev/null | grep PostgreSQL | head -1)"
echo "${G}Nginx:${N}     $(nginx -v 2>&1)"
echo "${G}PM2:${N}       $(pm2 -v)"
echo "${G}Disk:${N}      $(df -h / | tail -1 | awk '{print $4}') free / $(df -h / | tail -1 | awk '{print $2}') total"
echo "${G}RAM:${N}       $(free -h | awk 'NR==2{print $7}') free / $(free -h | awk 'NR==2{print $2}') total"
echo "${G}Swap:${N}      $(free -h | awk 'NR==3{print $2}')"
echo ""
log "BUOC TIEP THEO:"
echo "  1. Add SSH public key:"
echo "     nano /home/$USERNAME/.ssh/authorized_keys"
echo "     (paste public key tu may anh, vd: ~/.ssh/id_ed25519.pub)"
echo ""
echo "  2. Test SSH key auth (mo terminal moi):"
echo "     ssh -p $SSH_PORT $USERNAME@<IP>"
echo "     -> Phai vao duoc KHONG can password"
echo ""
echo "  3. Sau khi key auth work, DISABLE password login:"
echo "     sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config.d/99-sol-hardening.conf"
echo "     systemctl restart ssh"
echo ""
echo "  4. Add DNS A record tren Cloudflare:"
echo "     $DOMAIN -> $(curl -s ifconfig.me)"
echo ""
echo "  5. Sau khi DNS tro ve IP nay (~5 phut), chay Certbot:"
echo "     certbot --nginx -d $DOMAIN --email $EMAIL_SSL --agree-tos --non-interactive --redirect"
echo ""
echo "  6. Deploy Sol Widget (script rieng):"
echo "     git clone <repo-url> $APP_DIR"
echo "     cd $APP_DIR && npm install && npm run build && pm2 start ecosystem.config.js"
echo ""
log "Log da luu: provision.log"
