# 🔐 Sol — Credentials & Access (CONFIDENTIAL)

## ⚠️ FILE NÀY CHỨA THÔNG TIN NHẠY CẢM

- **KHÔNG commit lên Git public**
- **KHÔNG share** với bên thứ 3
- **Backup** vào USB hoặc password manager (1Password, Bitwarden)
- Nếu lộ → đổi password NGAY

---

## 1. VPS — bothuocla.sol.vn

### Server info

```
Provider:    eztech.vn
Service:     Cloud VPS giá rẻ - VMWare vSAN ESA - vSan GR1
Service ID:  PfpoKnWmqsl4XjWtIBE3.eztech.vn
Renewal:     20/05/2027 (799,000đ/năm)
Portal:      https://my.eztech.vn (login: nguyendinhkhang@gmail.com)

IP:          103.72.57.11
Hostname:    sol-vps-01
OS:          Ubuntu 24.04 LTS (Noble Numbat)
RAM:         2 GB
CPUs:        2
Disk:        30 GB
Datacenter:  DC 2 (Singapore?)
Timezone:    Asia/Ho_Chi_Minh
```

### Users

```
Root user:
  Username:      root
  Password:      drUv*P4K?Kr8SCC
  SSH login:     ❌ DISABLED (PermitRootLogin no)
  Access via:    eztech.vn VNC console only

Solop user (chính dùng để deploy):
  Username:      solop
  Password:      KhangSol2026!
  Groups:        solop, sudo, users
  Sudo:          NOPASSWD ALL (đã enable)
  SSH:           ✅ Enabled (key-based only)
  Home:          /home/solop/
```

### SSH key authentication

```
Private key:   C:\Users\ADMIN\.ssh\sol_vps
Public key:    C:\Users\ADMIN\.ssh\sol_vps.pub
Type:          ed25519
Fingerprint:   SHA256:9cCUvbSJfwPgHNvOP1Nd5s4HPQD+wMlCAAUU6DMLojE
Comment:       khang-sol-windows

Server side:
  Path:        /home/solop/.ssh/authorized_keys
  Permission:  600 (file), 700 (dir)
  Owner:       solop:solop

SSH config alias (Windows):
  File:        C:\Users\ADMIN\.ssh\config
  Alias:       sol-vps
  Login:       ssh sol-vps  (= ssh -i ~/.ssh/sol_vps solop@103.72.57.11)
```

### SSL Certificate

```
Domain:        bothuocla.sol.vn
Provider:      Let's Encrypt (Certbot)
Type:          ECDSA
Cert path:     /etc/letsencrypt/live/bothuocla.sol.vn/fullchain.pem
Key path:      /etc/letsencrypt/live/bothuocla.sol.vn/privkey.pem
Expiry:        2026-08-18 (auto-renew via systemd timer)
```

---

## 2. Cloudflare

```
Account email:    nguyendinhkhang@gmail.com
Account ID:       b33a57e2c969d6f3a5649bb988f0844e
Plan:             Free
Login URL:        https://dash.cloudflare.com

Zone:             sol.vn
SSL mode:         Full (strict)
AI Audit:
  - Managed robots.txt: ❌ DISABLED (KEY FIX!)
  - Markdown for Agents: ❌ Not on Free plan

Worker:
  Name:           sol-robots-override
  URL:            sol-robots-override.nguyendinhkhang.workers.dev
  Routes:
    - sol.vn/*  (wildcard catch-all)

DNS records:
  A    sol.vn         103.221.221.79   🟠 Proxied  (hosting WP cũ)
  A    bothuocla      103.72.57.11     🟠 Proxied  (VPS mới)
  CNAME www           sol.vn           🟠 Proxied
  CNAME mail          sol.vn           ⚪ DNS only
  MX   sol.vn         mx*.zoho.com     ⚪ DNS only (3 records)
```

---

## 3. WordPress sol.vn

```
Admin URL:      https://sol.vn/wp-admin/
Hosting:        eztech.vn (hosting WP riêng, KHÁC với VPS)
cPanel user:    qbsigblp
cPanel URL:     (xem trong dashboard eztech.vn)

WordPress root: /home/qbsigblp/public_html/
robots.txt:     /home/qbsigblp/public_html/robots.txt  (vật lý — KHÔNG còn dùng vì Worker override)
llms.txt:       /home/qbsigblp/public_html/llms.txt
sitemap:        https://sol.vn/sitemap_index.xml (Rank Math auto)

Active plugins:
  - Rank Math SEO (RankMath, không phải Yoast)
  - WP Mail SMTP
  - WPForms

Theme: News Magazine X
```

---

## 4. Google services

```
Email:                  nguyendinhkhang@gmail.com

Google Analytics 4:
  Property name:        SOL.VN - GA4
  Property ID:          365443123
  Measurement ID:       G-S5ELGXBLWK
  Stream URL:           https://sol.vn
  Dashboard:            https://analytics.google.com

Google Search Console:
  Properties (4):
    1. sol.vn                       (Domain — cover all subdomains)
    2. bothuocla.sol.vn             (Domain)
    3. https://sol.vn/              (URL prefix)
    4. https://bothuocla.sol.vn/    (URL prefix)
  Verification methods used:
    - DNS TXT (Domain properties)
    - HTML meta tag (URL prefix bothuocla.sol.vn)
  Dashboard:            https://search.google.com/search-console
  Verification tag:     <meta name="google-site-verification" content="ifuIrZvF4YgGEj2B0J1TIG9wfY2VH7ZD5HgaLdORChE" />
```

---

## 5. Microsoft Clarity

```
Project name:    Đi Cùng Sol
Project ID:      wu12r2qt0o
URL tracked:     https://bothuocla.sol.vn
Login:           nguyendinhkhang@gmail.com (Microsoft account)
Dashboard:       https://clarity.microsoft.com
```

---

## 6. Personal accounts

```
Khang Sol — Founder profile:
  URL:                https://sol.vn/khang-sol
  Facebook:           https://web.facebook.com/nguyendinhkhang
  LinkedIn:           https://www.linkedin.com/in/vietnaminternet/

Sol social:
  FB Page:            https://fb.com/sol.bothuocla
  FB Group:           https://fb.com/groups/dicungsol
  Email:              nguyendinhkhang@gmail.com
```

---

## 7. Backup recommendations

### Critical files to backup

```
Windows (C:\Users\ADMIN\.ssh\):
  ✅ sol_vps           (private key — CRITICAL)
  ✅ sol_vps.pub
  ✅ config

Workspace (C:\BOTHUOCLA\sol-widget\):
  ✅ docs/             (toàn bộ documentation)
  ✅ workers/          (Cloudflare Worker code)
  ✅ landing/          (landing page + nginx config)
  ✅ scripts/vps/      (provision script)
  ✅ wiki-skeletons/   (143 bài Wiki HTML)

VPS (/home/solop/):
  ✅ /etc/nginx/sites-enabled/  (nginx configs)
  ✅ /etc/letsencrypt/live/     (SSL certs — không cần backup, Certbot tự renew)
  ✅ Postgres database          (TODO: setup auto-backup)
```

### Backup commands

```powershell
# Backup SSH keys + config (Windows)
$backupDir = "D:\Backup\sol-ssh\$(Get-Date -Format yyyyMMdd)"
New-Item -ItemType Directory -Force -Path $backupDir
Copy-Item $env:USERPROFILE\.ssh\sol_vps* $backupDir
Copy-Item $env:USERPROFILE\.ssh\config $backupDir

# Backup workspace (Windows)
Compress-Archive -Path C:\BOTHUOCLA\sol-widget\* -DestinationPath "D:\Backup\sol-widget-$(Get-Date -Format yyyyMMdd).zip"
```

```bash
# Backup VPS configs (run on VPS)
ssh sol-vps
sudo tar -czf /tmp/sol-vps-backup-$(date +%Y%m%d).tar.gz \
  /etc/nginx/sites-enabled/ \
  /etc/letsencrypt/live/ \
  /etc/letsencrypt/renewal/ \
  /etc/sudoers.d/ \
  /etc/ssh/sshd_config.d/

# Download backup to Windows
scp sol-vps:/tmp/sol-vps-backup-*.tar.gz D:\Backup\
```

---

## 8. Emergency contacts

```
eztech.vn support:
  Hotline:        (check trên portal my.eztech.vn)
  Email:          support@eztech.vn

Tổng đài cai thuốc miễn phí (BV Bạch Mai):
  Số:             0888-008-866

Khang Sol:
  Email:          nguyendinhkhang@gmail.com
  FB:             https://web.facebook.com/nguyendinhkhang
```

---

**File này UPDATE khi**:
- Đổi password VPS / WordPress
- Thêm SSH key mới
- Đổi GA4 / Clarity account
- Migrate hosting / domain
- Thay đổi DNS

**Last updated**: 2026-05-20
**Maintainer**: Khang Sol (Nguyễn Đình Khang)
