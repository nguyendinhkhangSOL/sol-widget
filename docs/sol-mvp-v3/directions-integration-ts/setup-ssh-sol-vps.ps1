# ═══════════════════════════════════════════════════════════════
# Setup SSH Key cho sol-vps-01 — chạy 1 lần, sau đó không cần pass
# Chạy: powershell.exe -ExecutionPolicy Bypass -File setup-ssh-sol-vps.ps1
# ═══════════════════════════════════════════════════════════════

param(
    [string]$VpsUser = "solop",
    [string]$VpsHost = "103.72.57.11",
    [int]$VpsPort = 22,
    [string]$AliasName = "sol-vps"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔐 Setup SSH Key cho $AliasName" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── STEP 1: Verify OpenSSH client ────────────────────────────
Write-Host "[1/6] 🔍 Verify OpenSSH client..." -ForegroundColor Yellow

$sshVersion = ssh -V 2>&1
if ($LASTEXITCODE -ne 0 -and -not ($sshVersion -match "OpenSSH")) {
    Write-Host "    ❌ OpenSSH client không có." -ForegroundColor Red
    Write-Host "    → Windows Settings → Apps → Optional Features → Add 'OpenSSH Client'" -ForegroundColor Yellow
    exit 1
}
Write-Host "    ✅ $sshVersion" -ForegroundColor Green

# ─── STEP 2: Prompt for missing host ──────────────────────────
if (-not $VpsHost) {
    Write-Host ""
    Write-Host "  ⚠ Chưa có VPS host (IP hoặc domain)." -ForegroundColor Yellow
    Write-Host "  VD: sol-vps.example.com  hoặc  123.45.67.89" -ForegroundColor Gray
    $VpsHost = Read-Host "  Nhập VPS host"
    if (-not $VpsHost) {
        Write-Host "  ❌ Cần VPS host để tiếp tục." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "  📋 Cấu hình:" -ForegroundColor Cyan
Write-Host "    Alias:  $AliasName"
Write-Host "    User:   $VpsUser"
Write-Host "    Host:   $VpsHost"
Write-Host "    Port:   $VpsPort"
Write-Host ""

# ─── STEP 3: Setup ~/.ssh directory ───────────────────────────
Write-Host "[2/6] 📁 Setup ~/.ssh directory..." -ForegroundColor Yellow

$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "    ✅ Tạo $sshDir" -ForegroundColor Green
} else {
    Write-Host "    ⏭  $sshDir đã tồn tại" -ForegroundColor Gray
}

# Windows ACL — chỉ owner có quyền
$acl = Get-Acl $sshDir
$acl.SetAccessRuleProtection($true, $false)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "$env:USERNAME", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
)
$acl.AddAccessRule($rule)
Set-Acl -Path $sshDir -AclObject $acl -ErrorAction SilentlyContinue

# ─── STEP 4: Generate SSH key (nếu chưa có) ───────────────────
Write-Host "[3/6] 🔑 SSH key ed25519..." -ForegroundColor Yellow

$privateKey = "$sshDir\id_ed25519"
$publicKey = "$sshDir\id_ed25519.pub"

if (Test-Path $privateKey) {
    Write-Host "    ⏭  Key đã tồn tại: $privateKey" -ForegroundColor Gray
    $reuse = Read-Host "    Dùng key hiện tại? (Y/n)"
    if ($reuse -eq "n" -or $reuse -eq "N") {
        Rename-Item $privateKey "$privateKey.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        if (Test-Path $publicKey) {
            Rename-Item $publicKey "$publicKey.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        }
        ssh-keygen -t ed25519 -f $privateKey -N '""' -C "solop@$AliasName-$(Get-Date -Format 'yyyyMMdd')"
        Write-Host "    ✅ Tạo key mới" -ForegroundColor Green
    }
} else {
    Write-Host "    → Đang tạo key mới (không passphrase)..."
    ssh-keygen -t ed25519 -f $privateKey -N '""' -C "solop@$AliasName-$(Get-Date -Format 'yyyyMMdd')"
    Write-Host "    ✅ Tạo key: $privateKey" -ForegroundColor Green
}

# ─── STEP 5: Copy public key lên VPS ──────────────────────────
Write-Host ""
Write-Host "[4/6] 📤 Copy public key lên VPS..." -ForegroundColor Yellow
Write-Host "    ⚠ Bước này CẦN nhập pass VPS 1 LẦN CUỐI." -ForegroundColor Yellow
Write-Host ""

$pubKeyContent = Get-Content $publicKey -Raw
$pubKeyContent = $pubKeyContent.Trim()

# Copy via SSH command
$remoteCmd = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKeyContent' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys && echo '✅ Key installed'"

$sshTarget = "${VpsUser}@${VpsHost}"
Write-Host "    Command: ssh -p $VpsPort $sshTarget ..."

# Execute
ssh -p $VpsPort $sshTarget $remoteCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "    ❌ SSH copy failed. Kiểm tra:" -ForegroundColor Red
    Write-Host "       - VPS host đúng chưa? ($VpsHost)" -ForegroundColor Gray
    Write-Host "       - User đúng chưa? ($VpsUser)" -ForegroundColor Gray
    Write-Host "       - Port đúng chưa? ($VpsPort)" -ForegroundColor Gray
    Write-Host "       - Pass VPS đúng chưa?" -ForegroundColor Gray
    exit 1
}

Write-Host "    ✅ Public key installed trên VPS" -ForegroundColor Green

# ─── STEP 6: Setup ~/.ssh/config với alias ────────────────────
Write-Host ""
Write-Host "[5/6] ⚙️  Setup ~/.ssh/config..." -ForegroundColor Yellow

$configFile = "$sshDir\config"
$configEntry = @"

# ─── Sol La Bàn VPS (auto-generated $(Get-Date -Format 'yyyy-MM-dd')) ───
Host $AliasName
    HostName $VpsHost
    User $VpsUser
    Port $VpsPort
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking accept-new

"@

if (Test-Path $configFile) {
    $currentConfig = Get-Content $configFile -Raw
    if ($currentConfig -match "Host $AliasName") {
        Write-Host "    ⏭  Alias '$AliasName' đã có trong config — skip append" -ForegroundColor Gray
    } else {
        Add-Content -Path $configFile -Value $configEntry
        Write-Host "    ✅ Append alias '$AliasName' vào $configFile" -ForegroundColor Green
    }
} else {
    Set-Content -Path $configFile -Value $configEntry
    Write-Host "    ✅ Tạo $configFile với alias '$AliasName'" -ForegroundColor Green
}

# ─── STEP 7: Test connection ──────────────────────────────────
Write-Host ""
Write-Host "[6/6] 🧪 Test connection (không cần pass)..." -ForegroundColor Yellow

$testResult = ssh -o BatchMode=yes -o ConnectTimeout=10 $AliasName "echo 'CONNECTED as \$(whoami) at \$(hostname)'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ $testResult" -ForegroundColor Green
} else {
    Write-Host "    ❌ Test failed" -ForegroundColor Red
    Write-Host "    → Debug: ssh -v $AliasName" -ForegroundColor Yellow
    exit 1
}

# ─── DONE ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ SETUP XONG!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📋 Từ giờ dùng như sau (KHÔNG cần pass):" -ForegroundColor Cyan
Write-Host ""
Write-Host "    # SSH connect:" -ForegroundColor Gray
Write-Host "    ssh $AliasName" -ForegroundColor White
Write-Host ""
Write-Host "    # SCP copy file:" -ForegroundColor Gray
Write-Host "    scp file.txt ${AliasName}:/var/www/huongdi/" -ForegroundColor White
Write-Host ""
Write-Host "    # SCP copy folder recursive:" -ForegroundColor Gray
Write-Host "    scp -r directions-integration-ts/ ${AliasName}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "    # Rsync (khuyến nghị cho folder lớn):" -ForegroundColor Gray
Write-Host "    rsync -avz --progress ./ ${AliasName}:/tmp/dest/" -ForegroundColor White
Write-Host ""
Write-Host "    # Chạy remote command:" -ForegroundColor Gray
Write-Host "    ssh $AliasName 'pm2 status'" -ForegroundColor White
Write-Host ""
Write-Host "  🔑 Private key: $privateKey" -ForegroundColor Gray
Write-Host "  📄 Config file: $configFile" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⚠  BACKUP private key ngay:" -ForegroundColor Yellow
Write-Host "     Copy $privateKey + $publicKey vào USB/1Password/GDrive private" -ForegroundColor Gray
Write-Host ""

# ─── BONUS: Show ready-to-run deploy command ──────────────────
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Deploy Batch 1 ngay (copy-paste):" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # 1. Upload package lên VPS:" -ForegroundColor Gray
Write-Host "  scp -r C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\directions-integration-ts $AliasName`:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "  # 2. Upload buoc3.html để seed:" -ForegroundColor Gray
Write-Host "  scp C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\huongdi-phase2\buoc3.html $AliasName`:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "  # 3. SSH và chạy deploy:" -ForegroundColor Gray
Write-Host "  ssh $AliasName" -ForegroundColor White
Write-Host "  cd /tmp/directions-integration-ts" -ForegroundColor White
Write-Host "  bash deploy-vps.sh /tmp/buoc3.html" -ForegroundColor White
Write-Host ""
