# Upload sol-flow.js da patch len VPS
# Usage: .\upload-sol-flow.ps1

$src = "C:\BOTHUOCLA\sol-widget\docs\url-rename-p1-p2-p3\current-html-updated\sol-flow.js"

if (!(Test-Path $src)) {
    Write-Host "Source not found. Run: node update-sol-flow.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1 - Upload sol-flow.js to /tmp/..."
scp $src sol-vps:/tmp/sol-flow.js

Write-Host ""
Write-Host "Step 2 - Backup + sudo cp + chown on VPS..."
ssh sol-vps 'sudo cp /var/www/huongdi/public/sol-flow.js /var/www/huongdi/public/sol-flow.js.bak.$(date +%Y%m%d_%H%M%S) && sudo cp /tmp/sol-flow.js /var/www/huongdi/public/sol-flow.js && sudo chown www-data:www-data /var/www/huongdi/public/sol-flow.js && echo OK_UPLOADED'

Write-Host ""
Write-Host "Step 3 - Verify new labels (count):"
ssh sol-vps "grep -c 'Kham\|Kiem\|La ban' /var/www/huongdi/public/sol-flow.js; echo '--- Old labels remaining (should be 0):'; grep -c 'P1 . DNA' /var/www/huongdi/public/sol-flow.js"

Write-Host ""
Write-Host "============================================================="
Write-Host "  Done. Browser test (Ctrl+Shift+R bypass cache):"
Write-Host "    https://huongdi.sol.vn/kham-pha-ban-than/"
Write-Host "  Breadcrumb expected: 1.Kham pha 2.Kiem ke 3.La ban"
Write-Host "============================================================="
