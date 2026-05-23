# 🖥️ Sol — VPS Configuration (Full Reference)

> Toàn bộ setting VPS Ubuntu 24.04 cho bothuocla.sol.vn. Dùng để reinstall/restore khi cần.

---

## Server specs

```
Provider:     eztech.vn
Service:      Cloud VPS giá rẻ - VMWare vSAN ESA - vSan GR1
IP:           103.72.57.11
Hostname:     sol-vps-01
OS:           Ubuntu 24.04 LTS (Noble Numbat)
Kernel:       6.8.0-31-generic
RAM:          2 GB
CPUs:         2
Disk:         30 GB (28 GB usable, /dev/mapper/ubuntu--vg-ubuntu--lv)
Swap:         2 GB (provider preset)
Timezone:     Asia/Ho_Chi_Minh
```

---

## Users

### root (LOCKED for SSH)

```
PermitRootLogin no   ← chỉ login qua VNC console
Password:            drUv*P4K?Kr8SCC  (gốc eztech)
```

### solop (chính)

```
Username:    solop
UID/GID:     1000/1000
Home:        /home/solop/
Shell:       /bin/bash
Groups:      solop, sudo, users
Password:    KhangSol2026!
Sudo:        NOPASSWD ALL
SSH:         ed25519 key-based only
```

#### solop sudoers config

```
File: /etc/sudoers.d/90-solop-nopasswd
Content: solop ALL=(ALL) NOPASSWD: ALL
Permission: 0440
```

---

## Installed packages (managed)

### Core
- Ubuntu 24.04 base
- openssh-server
- ufw (firewall)
- fail2ban (brute-force protection)
- unattended-upgrades (auto security updates)
- net-tools, htop, vim, nano, curl, wget, git

### Web stack
- **Nginx** 1.24.0 (Ubuntu repo)
- **Node.js** v20.20.2 LTS (NodeSource repo)
- **npm** 10.8.2
- **PostgreSQL** 16 (postgres repo)
- **PM2** (global npm, process manager)
- **Certbot** + python3-certbot-nginx (snap)

---

## Nginx Configuration

### Main config

```
File:    /etc/nginx/nginx.conf
User:    www-data
Worker:  auto
```

### Sol site config

```
File:    /etc/nginx/sites-enabled/bothuocla.sol.vn
Backup:  /root/nginx-backup.conf (snapshot trước changes)
Source:  C:\BOTHUOCLA\sol-widget\landing\nginx-bothuocla.conf
```

#### Nội dung config

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name bothuocla.sol.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bothuocla.sol.vn;

    ssl_certificate /etc/letsencrypt/live/bothuocla.sol.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bothuocla.sol.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## SSL Certificate (Let's Encrypt)

```
Domain:        bothuocla.sol.vn
Type:          ECDSA (modern, 30% faster than RSA)
Provider:      Let's Encrypt (Certbot)
Cert path:     /etc/letsencrypt/live/bothuocla.sol.vn/fullchain.pem
Key path:      /etc/letsencrypt/live/bothuocla.sol.vn/privkey.pem
Expires:       2026-08-18 (90 days)
Auto-renew:    systemd timer certbot.timer (runs 2x/day)
```

### Verify cert

```bash
sudo certbot certificates
```

### Manual renew (nếu auto fail)

```bash
sudo certbot renew --dry-run    # test
sudo certbot renew                # thật
sudo systemctl reload nginx
```

### ⚠️ Trước khi chạy Certbot lần đầu

Cloudflare Proxy phải **DNS only** (xám), không phải Proxied (cam). Sau khi SSL có, bật lại Proxied.

---

## Firewall (UFW)

```
sudo ufw status verbose
```

Expected:
```
Status: active
Default: deny (incoming), allow (outgoing)

22/tcp   ALLOW IN  Anywhere   # SSH
80/tcp   ALLOW IN  Anywhere   # HTTP
443/tcp  ALLOW IN  Anywhere   # HTTPS
```

### Add new rule (nếu cần)

```bash
sudo ufw allow 3000/tcp comment "Node.js dev"
sudo ufw reload
```

---

## Fail2ban

```
Config:    /etc/fail2ban/jail.local
Jail:      sshd
Findtime:  10 minutes
Bantime:   1 hour
Maxretry:  5
```

### Commands

```bash
sudo fail2ban-client status                  # all jails
sudo fail2ban-client status sshd             # ssh jail detail
sudo fail2ban-client unban --all             # unban tất cả
sudo fail2ban-client set sshd unbanip <IP>   # unban 1 IP
```

---

## SSH Configuration

### sshd_config hardening

```
File: /etc/ssh/sshd_config.d/99-sol-hardening.conf
Content:
  PermitRootLogin no
  PasswordAuthentication yes     ← tạm thời, sẽ no khi hoàn toàn dùng key
  PubkeyAuthentication yes
  AllowUsers solop
  MaxAuthTries 3
  LoginGraceTime 30
  ClientAliveInterval 300
  ClientAliveCountMax 2
```

### authorized_keys (solop)

```
File:        /home/solop/.ssh/authorized_keys
Permission:  600
Owner:       solop:solop

Key fingerprint: SHA256:9cCUvbSJfwPgHNvOP1Nd5s4HPQD+wMlCAAUU6DMLojE
Comment:     khang-sol-windows
```

---

## PostgreSQL

```
Version:     16
Port:        5432 (localhost only)
Data dir:    /var/lib/postgresql/16/main/
Config:      /etc/postgresql/16/main/postgresql.conf
HBA:         /etc/postgresql/16/main/pg_hba.conf
```

### Default user

```
User:        postgres
Password:    (peer auth — sudo -u postgres)
```

### Future: Create Sol app database

```bash
sudo -u postgres psql
CREATE USER sol_app WITH PASSWORD 'TODO_SET_PASSWORD';
CREATE DATABASE sol_widget OWNER sol_app;
GRANT ALL PRIVILEGES ON DATABASE sol_widget TO sol_app;
\q
```

### Backup database (TODO setup cron)

```bash
sudo -u postgres pg_dump sol_widget | gzip > /var/backups/sol-db-$(date +%Y%m%d).sql.gz
```

---

## Node.js & PM2

```
Node version:   v20.20.2 LTS
npm version:    10.8.2
PM2:            global install
```

### PM2 setup (khi deploy Sol Widget)

```bash
cd /var/www/sol-widget
npm install
npm run build
pm2 start ecosystem.config.js
pm2 startup       # tạo systemd service
pm2 save          # save current processes
```

### PM2 commands

```bash
pm2 list                  # all processes
pm2 logs sol-widget       # realtime logs
pm2 restart sol-widget    # restart app
pm2 stop sol-widget       # stop
pm2 delete sol-widget     # remove
pm2 monit                 # interactive monitor
```

---

## Directory structure

```
/var/www/
├── html/                          # Static landing page
│   └── index.html                 (current — Sol "Sắp ra mắt")
└── sol-widget/                    # Future Sol Widget app (Node.js)
    └── (empty for now)

/etc/nginx/
├── nginx.conf                     # Main nginx config
├── sites-available/
│   └── bothuocla.sol.vn          
└── sites-enabled/
    └── bothuocla.sol.vn          # → ../sites-available/bothuocla.sol.vn

/etc/letsencrypt/
├── live/bothuocla.sol.vn/         # Symlinks to active certs
└── archive/bothuocla.sol.vn/      # All historical certs

/home/solop/
├── .ssh/
│   └── authorized_keys            # SSH public key
└── (future Sol code repos here)

/root/
├── provision-vps.sh              # Original provision script
├── provision.log                 # Provision output log
└── nginx-backup.conf             # Backup nginx config trước changes
```

---

## Maintenance tasks

### Hàng tuần (15 phút)

```bash
ssh sol-vps
sudo apt update && sudo apt upgrade -y
df -h                                # Check disk usage
free -h                              # Check RAM
sudo fail2ban-client status sshd     # Check banned IPs
sudo tail -50 /var/log/auth.log      # Check auth attempts
```

### Hàng tháng (30 phút)

```bash
ssh sol-vps
sudo apt full-upgrade -y
sudo apt autoremove -y
sudo apt autoclean

# Check SSL cert
sudo certbot certificates

# Check nginx config
sudo nginx -t

# Check disk + clean logs
sudo journalctl --vacuum-time=30d   # Clean systemd logs older than 30d
sudo find /var/log -name "*.gz" -mtime +30 -delete   # Old log archives

# Reboot if needed
sudo reboot
```

### Hàng quý (1 tiếng)

```
- Backup PostgreSQL database
- Backup /etc/nginx/, /etc/letsencrypt/
- Review fail2ban logs for patterns
- Check Cloudflare bot analytics
- Upgrade Node.js LTS nếu có
```

---

## Restore from scratch (nếu phải reinstall VPS)

### Bước 1: Order VPS mới (eztech.vn hoặc khác)

```
Spec tương đương:
  - Ubuntu 24.04 LTS
  - 2GB RAM minimum
  - 30GB disk minimum
  - SSH access
```

### Bước 2: Login VNC console

```
Username: root
Password: <new password từ provider>
```

### Bước 3: Upload + chạy provision script

```powershell
# Từ Windows:
scp C:\BOTHUOCLA\sol-widget\scripts\vps\provision-vps.sh root@<NEW_IP>:/root/

# Trên VPS (via VNC hoặc SSH lần đầu):
chmod +x /root/provision-vps.sh
bash /root/provision-vps.sh 2>&1 | tee /root/provision.log
```

Script sẽ tự cài:
- apt update + upgrade
- timezone, hostname, swap
- user solop + password
- SSH hardening
- UFW + fail2ban
- Node.js 20, PostgreSQL 16, Nginx, Certbot, PM2

Khi script hỏi password → gõ `KhangSol2026!` (gõ tay, không paste).

### Bước 4: Setup SSH key

```bash
# Trên VPS (login solop):
mkdir -p /home/solop/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOVBf8p6svO7+4NRFGUJnec6PavQUZOl7rU9dP+E59ok khang-sol-windows" > /home/solop/.ssh/authorized_keys
chmod 700 /home/solop/.ssh
chmod 600 /home/solop/.ssh/authorized_keys
chown -R solop:solop /home/solop/.ssh
```

### Bước 5: NOPASSWD sudo

```bash
echo "solop ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/90-solop-nopasswd
sudo chmod 0440 /etc/sudoers.d/90-solop-nopasswd
```

### Bước 6: Cloudflare DNS

```
- A record: bothuocla → <NEW_IP> (tạm Proxied OFF)
- Đợi 5 phút DNS propagate
```

### Bước 7: Run Certbot

```bash
sudo certbot --nginx -d bothuocla.sol.vn --email nguyendinhkhang@gmail.com --agree-tos --non-interactive --redirect
```

### Bước 8: Deploy landing page

```powershell
scp C:\BOTHUOCLA\sol-widget\landing\index.html sol-vps:/tmp/
ssh sol-vps "sudo mv /tmp/index.html /var/www/html/index.html"
```

### Bước 9: Bật Cloudflare Proxy lại

```
DNS → bothuocla → click đám mây xám → Proxied (cam)
SSL/TLS → Full (strict)
```

### Bước 10: Verify

```powershell
curl.exe -I https://bothuocla.sol.vn   # Expect: 200 OK
```

---

**Last updated**: 2026-05-20
**Maintainer**: Khang Sol (Nguyễn Đình Khang)
