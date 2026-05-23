# =================================================================
# Sol Widget v0.2 - Deploy Script (PowerShell, ASCII-only)
# Usage:  .\deploy.ps1
# =================================================================

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "=== Sol Widget v0.2 Deploy ===" -ForegroundColor Cyan
Write-Host ""

$AppDir = $PSScriptRoot
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TarFile = "$env:TEMP\sol-widget-$Timestamp.tar.gz"
$RemoteScript = "$env:TEMP\sol-widget-remote-$Timestamp.sh"

# ---- 1. Package source ----
Write-Host "[1/5] Packaging source..." -ForegroundColor Yellow
Push-Location $AppDir
tar --exclude='node_modules' --exclude='.next' --exclude='*.log' --exclude='.env*' -czf $TarFile .

if (-not (Test-Path $TarFile)) {
    Write-Host "FAIL: tar failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
$Size = [math]::Round((Get-Item $TarFile).Length / 1MB, 2)
Write-Host "OK: $TarFile ($Size MB)" -ForegroundColor Green

# ---- 2. Upload tar ----
Write-Host ""
Write-Host "[2/5] Uploading to VPS..." -ForegroundColor Yellow
scp -q $TarFile sol-vps:/tmp/sol-widget-deploy.tar.gz
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: scp failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "OK: uploaded" -ForegroundColor Green

# ---- 3. Build remote script (bash) locally, upload, run ----
Write-Host ""
Write-Host "[3/5] Building remote script..." -ForegroundColor Yellow

$BashScript = @'
#!/bin/bash
set -e
cd /var/www/sol-widget

# Backup .env if exists
if [ -f .env ]; then
  cp .env /tmp/sol-env-backup.txt
  echo "  -> Backed up .env"
fi

# Clean old files (keep .env if existed)
echo "  -> Extracting..."
find . -maxdepth 1 ! -name '.' ! -name '..' ! -name 'node_modules' ! -name '.env' -exec rm -rf {} + 2>/dev/null || true
tar -xzf /tmp/sol-widget-deploy.tar.gz

# Restore .env
if [ -f /tmp/sol-env-backup.txt ]; then
  cp /tmp/sol-env-backup.txt .env
  echo "  -> Restored .env"
fi

# CRITICAL: remove deprecated folders that conflict với Next.js routing
# [level] folder conflicts with [cohort] — must delete physically
echo "  -> Removing deprecated routes..."
rm -rf "app/ket-qua/[level]" 2>/dev/null || true
rm -rf "app/dang-ky" 2>/dev/null || true
rm -rf "app/api/register" 2>/dev/null || true

# Install + build
echo "  -> npm ci (may take 2-3 min)..."
npm ci --silent 2>&1 | tail -5

echo "  -> npm run build (may take 1-2 min)..."
npm run build 2>&1 | tail -10

echo "  -> Build complete"
'@

# Save bash script as LF (not CRLF)
$BashScript = $BashScript -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($RemoteScript, $BashScript)

scp -q $RemoteScript sol-vps:/tmp/sol-widget-remote.sh
ssh sol-vps "bash /tmp/sol-widget-remote.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: remote build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "OK: build complete" -ForegroundColor Green

# ---- 4. PM2 start or restart ----
Write-Host ""
Write-Host "[4/5] PM2 start/restart..." -ForegroundColor Yellow

$Pm2Script = @'
#!/bin/bash
set -e
cd /var/www/sol-widget

if pm2 list 2>/dev/null | grep -q sol-widget; then
  echo "  -> Restart PM2..."
  pm2 restart sol-widget --update-env
else
  echo "  -> First PM2 start..."
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

pm2 status
'@

$Pm2Script = $Pm2Script -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($RemoteScript, $Pm2Script)
scp -q $RemoteScript sol-vps:/tmp/sol-pm2.sh
ssh sol-vps "bash /tmp/sol-pm2.sh"
Write-Host "OK: PM2 running" -ForegroundColor Green

# ---- 5. Verify ----
Write-Host ""
Write-Host "[5/5] Verify..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $resp = Invoke-WebRequest -Uri 'https://bothuocla.sol.vn' -Method Head -UseBasicParsing -TimeoutSec 15
    Write-Host ("OK: HTTP " + $resp.StatusCode) -ForegroundColor Green
}
catch {
    Write-Host ("WARN: " + $_.Exception.Message) -ForegroundColor Yellow
    Write-Host "      Check: ssh sol-vps `"pm2 logs sol-widget --lines 30`"" -ForegroundColor Gray
}

# Cleanup
Remove-Item $TarFile -Force -ErrorAction SilentlyContinue
Remove-Item $RemoteScript -Force -ErrorAction SilentlyContinue
Pop-Location

Write-Host ""
Write-Host "=== DEPLOY COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open: https://bothuocla.sol.vn" -ForegroundColor Yellow
Write-Host "Logs: ssh sol-vps `"pm2 logs sol-widget --lines 50`"" -ForegroundColor Gray
Write-Host ""
