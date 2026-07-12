# PowerShell wrapper — Upload 3 file + chạy deploy script trên VPS
# Usage: .\upload-to-vps.ps1

Write-Host ""
Write-Host "============================================================="
Write-Host "  Upload P1/P2/P3 + deploy via bash script"
Write-Host "============================================================="

$src = "C:\BOTHUOCLA\sol-widget\docs\url-rename-p1-p2-p3\current-html-updated"
$here = "C:\BOTHUOCLA\sol-widget\docs\url-rename-p1-p2-p3"

if (!(Test-Path "$src\p1.html")) {
    Write-Host "Source not found. Run: node update-p1-p2-p3-content-v2.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1 - Upload 3 HTML files to /tmp/..."
scp "$src\p1.html" sol-vps:/tmp/p1.html
scp "$src\p2.html" sol-vps:/tmp/p2.html
scp "$src\p3.html" sol-vps:/tmp/p3.html

Write-Host ""
Write-Host "Step 2 - Upload deploy script to /tmp/..."
scp "$here\deploy-on-vps.sh" sol-vps:/tmp/deploy-p1p2p3.sh

Write-Host ""
Write-Host "Step 3 - Run deploy script on VPS..."
ssh sol-vps "chmod +x /tmp/deploy-p1p2p3.sh && bash /tmp/deploy-p1p2p3.sh"

Write-Host ""
Write-Host "============================================================="
Write-Host "  Browser test (Ctrl+Shift+R bypass cache):"
Write-Host "    https://huongdi.sol.vn/kham-pha-ban-than/"
Write-Host "    https://huongdi.sol.vn/kiem-ke-nguon-luc/"
Write-Host "    https://huongdi.sol.vn/la-ban-huong-di/"
Write-Host "============================================================="
