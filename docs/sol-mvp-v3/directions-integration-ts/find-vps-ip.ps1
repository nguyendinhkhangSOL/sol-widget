# ═══════════════════════════════════════════════════════════════
# Tự tìm IP VPS Sol La Bàn từ domain + verify SSH port
# Chạy: powershell.exe -ExecutionPolicy Bypass -File find-vps-ip.ps1
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔍 Tìm IP VPS Sol La Bàn" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$domains = @("huongdi.sol.vn", "adminhuongdi.sol.vn", "sol.vn")
$foundIps = @{}

foreach ($domain in $domains) {
    Write-Host "→ $domain" -NoNewline -ForegroundColor Yellow

    try {
        $result = Resolve-DnsName -Name $domain -Type A -ErrorAction Stop
        $ips = $result | Where-Object { $_.Type -eq "A" } | Select-Object -ExpandProperty IPAddress
        foreach ($ip in $ips) {
            Write-Host "  → $ip" -ForegroundColor Green
            if (-not $foundIps.ContainsKey($ip)) {
                $foundIps[$ip] = @()
            }
            $foundIps[$ip] += $domain
        }
    } catch {
        Write-Host "  ❌ DNS lookup failed" -ForegroundColor Red
    }
}

Write-Host ""

if ($foundIps.Count -eq 0) {
    Write-Host "❌ Không tìm được IP từ bất kỳ domain nào." -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Cách khác:" -ForegroundColor Yellow
    Write-Host "  1. Vào panel VPS provider (Vultr/DigitalOcean/Viettel IDC/VNG Cloud/FPT Cloud...)"
    Write-Host "  2. Check ~/.ssh/known_hosts nếu đã SSH trước đây:"
    Write-Host "     Get-Content `$env:USERPROFILE\.ssh\known_hosts | Select-String 'sol'"
    Write-Host "  3. Check email onboarding của VPS provider"
    exit 1
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎯 Tổng kết IP tìm được" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ipList = @($foundIps.Keys)
foreach ($ip in $ipList) {
    Write-Host "IP: $ip" -ForegroundColor Green
    Write-Host "   Serves: $($foundIps[$ip] -join ', ')" -ForegroundColor Gray

    # Test SSH port
    Write-Host "   Testing SSH ports..." -NoNewline -ForegroundColor Yellow

    $sshPorts = @(22, 2222)
    $openPort = $null
    foreach ($port in $sshPorts) {
        $tcp = New-Object System.Net.Sockets.TcpClient
        try {
            $connect = $tcp.BeginConnect($ip, $port, $null, $null)
            $wait = $connect.AsyncWaitHandle.WaitOne(3000, $false)
            if ($wait -and $tcp.Connected) {
                $tcp.EndConnect($connect)
                $openPort = $port
                Write-Host "  ✅ Port $port OPEN" -ForegroundColor Green
                break
            }
        } catch {} finally {
            $tcp.Close()
        }
    }

    if (-not $openPort) {
        Write-Host "  ⚠️  Port 22, 2222 đóng — có thể VPS dùng custom port" -ForegroundColor Yellow
        Write-Host "     Check email provider hoặc panel VPS" -ForegroundColor Gray
    }

    # Test HTTP 80/443
    Write-Host "   Testing HTTP ports..." -NoNewline -ForegroundColor Yellow
    foreach ($port in @(80, 443)) {
        $tcp = New-Object System.Net.Sockets.TcpClient
        try {
            $connect = $tcp.BeginConnect($ip, $port, $null, $null)
            $wait = $connect.AsyncWaitHandle.WaitOne(2000, $false)
            if ($wait -and $tcp.Connected) {
                $tcp.EndConnect($connect)
                Write-Host "  ✅ $port" -NoNewline -ForegroundColor Green
            }
        } catch {} finally {
            $tcp.Close()
        }
    }
    Write-Host ""
    Write-Host ""
}

# ─── Auto-suggest next step ───────────────────────────────────
$mainIp = $ipList[0]

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Bước tiếp theo — Chạy setup SSH key" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy-paste dòng này vào PowerShell:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  cd C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\directions-integration-ts" -ForegroundColor White
Write-Host "  .\setup-ssh-sol-vps.ps1 -VpsHost `"$mainIp`"" -ForegroundColor White
Write-Host ""
Write-Host "Hoặc dùng domain (chậm hơn 1 tí nhưng bền hơn nếu IP đổi):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  .\setup-ssh-sol-vps.ps1 -VpsHost `"adminhuongdi.sol.vn`"" -ForegroundColor White
Write-Host ""

$runNow = Read-Host "Chạy setup SSH ngay bây giờ? (Y/n)"
if ($runNow -ne "n" -and $runNow -ne "N") {
    $scriptPath = Join-Path $PSScriptRoot "setup-ssh-sol-vps.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -VpsHost $mainIp
    } else {
        Write-Host "❌ setup-ssh-sol-vps.ps1 không tìm thấy tại $scriptPath" -ForegroundColor Red
    }
}
