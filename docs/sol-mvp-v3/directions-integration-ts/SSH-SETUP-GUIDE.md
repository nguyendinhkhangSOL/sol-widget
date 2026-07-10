# SSH Key Setup — 1 Lần Xong, Không Cần Pass

Setup SSH key ed25519 cho VPS Sol La Bàn. Sau khi chạy 1 lần, mọi `ssh` / `scp` / `rsync` không cần nhập pass nữa.

## 🚀 CÁCH 1 — Chạy script PowerShell (khuyến nghị)

Mở **PowerShell** (không cần Admin), copy-paste 1 dòng:

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\directions-integration-ts
powershell.exe -ExecutionPolicy Bypass -File .\setup-ssh-sol-vps.ps1 -VpsHost "IP-HOẶC-DOMAIN-VPS"
```

**Ví dụ:**
```powershell
# Nếu VPS có domain:
powershell.exe -ExecutionPolicy Bypass -File .\setup-ssh-sol-vps.ps1 -VpsHost "sol-vps.thanhkhang.com"

# Nếu chỉ có IP:
powershell.exe -ExecutionPolicy Bypass -File .\setup-ssh-sol-vps.ps1 -VpsHost "123.45.67.89"

# Custom port:
powershell.exe -ExecutionPolicy Bypass -File .\setup-ssh-sol-vps.ps1 -VpsHost "1.2.3.4" -VpsPort 2222

# Custom user (mặc định solop):
powershell.exe -ExecutionPolicy Bypass -File .\setup-ssh-sol-vps.ps1 -VpsHost "1.2.3.4" -VpsUser "root"
```

Script sẽ:
1. Verify OpenSSH client trên Windows
2. Tạo `~/.ssh/id_ed25519` (nếu chưa có)
3. Copy public key lên VPS (**cần nhập pass VPS 1 lần cuối**)
4. Setup `~/.ssh/config` với alias `sol-vps-01`
5. Test connection

**Sau khi xong:** Chạy `ssh sol-vps-01` — vào thẳng VPS không cần pass.

## 🛠️ CÁCH 2 — Thủ công (nếu script fail)

### Bước 1: Generate SSH key

```powershell
# PowerShell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519 -N '""' -C "solop@sol-vps"
```

### Bước 2: Copy public key lên VPS

Windows không có `ssh-copy-id`, dùng workaround:

```powershell
# Copy nội dung public key vào clipboard
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard

# SSH vào VPS (nhập pass)
ssh solop@VPS-HOST

# Trên VPS, chạy 3 lệnh:
mkdir -p ~/.ssh
echo "PASTE-CLIPBOARD-VÀO-ĐÂY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Hoặc 1 dòng PowerShell (cần pass 1 lần):
```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | ssh solop@VPS-HOST "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### Bước 3: Setup config

Tạo file `C:\Users\ADMIN\.ssh\config`:

```
Host sol-vps-01
    HostName VPS-HOST-HOẶC-IP
    User solop
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    StrictHostKeyChecking accept-new
```

### Bước 4: Test

```powershell
ssh sol-vps-01 "echo Connected"
# Expected: Connected (không cần pass)
```

## 📋 Sau Khi Setup Xong — Deploy Batch 1

Từ giờ mọi command đơn giản, không cần pass:

```powershell
# 1. Upload package Batch 1 lên VPS:
scp -r C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\directions-integration-ts sol-vps-01:/tmp/

# 2. Upload buoc3.html để seed:
scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\huongdi-phase2\buoc3.html sol-vps-01:/tmp/

# 3. SSH và chạy deploy:
ssh sol-vps-01
cd /tmp/directions-integration-ts
bash deploy-vps.sh /tmp/buoc3.html
```

Xong! Batch 1 deploy trong 45 phút, không nhập pass lần nào.

## 🔒 Backup Private Key

**QUAN TRỌNG:** Backup file `C:\Users\ADMIN\.ssh\id_ed25519` (private key) vào nơi an toàn:
- USB flash drive
- 1Password / Bitwarden
- Google Drive private folder (encrypted)

Nếu mất private key → không ssh được vào VPS nữa (trừ khi có backup admin khác).

## 🐛 Troubleshooting

**"ssh: command not found":**
Windows Settings → Apps → Optional Features → Add "OpenSSH Client".

**"Permission denied (publickey)":**
- Check quyền `~/.ssh` (chmod 700) và `~/.ssh/authorized_keys` (chmod 600) trên VPS
- SSH debug: `ssh -v sol-vps-01`

**"Host key verification failed":**
```powershell
# Xoá known_hosts entry cũ
ssh-keygen -R sol-vps-01
# Kết nối lại
ssh sol-vps-01
```

**Script "cannot be loaded" (execution policy):**
```powershell
# Chạy PowerShell as Admin 1 lần:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# Rồi chạy lại script
```

**"Connection timed out":**
- VPS firewall block SSH? Check `sudo ufw status` trên VPS
- Port sai? Default 22, check với provider VPS

**Multiple VPS cần setup:**
Chạy script nhiều lần với `-AliasName` khác:
```powershell
.\setup-ssh-sol-vps.ps1 -VpsHost "1.2.3.4" -AliasName "sol-vps-01"
.\setup-ssh-sol-vps.ps1 -VpsHost "5.6.7.8" -AliasName "sol-vps-backup"
```

## 🎁 Bonus — Useful Aliases

Thêm vào PowerShell profile (`$PROFILE`):

```powershell
# Sol shortcuts
function sol-ssh { ssh sol-vps-01 }
function sol-logs { ssh sol-vps-01 "pm2 logs huongdi-api --lines 50 --nostream" }
function sol-restart { ssh sol-vps-01 "pm2 restart huongdi-api && pm2 logs huongdi-api --lines 10 --nostream" }
function sol-status { ssh sol-vps-01 "pm2 status && df -h / && free -h" }
function sol-db-count {
    ssh sol-vps-01 "sudo -u postgres psql huongdi_prod -c 'SELECT COUNT(*) as directions FROM directions; SELECT COUNT(*) as case_studies FROM case_studies; SELECT COUNT(*) as leads FROM leads;'"
}
```

Sau đó chỉ cần gõ: `sol-logs` · `sol-restart` · `sol-db-count`

---

**Version:** V1 — 2026-07-03
**Tested:** Windows 10/11 + OpenSSH Client 8.6+
