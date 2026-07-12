# Upload Landing Page huongdi.sol.vn
# Usage: .\upload-landing.ps1

$here = "C:\BOTHUOCLA\sol-widget\docs\huongdi-landing"

if (!(Test-Path "$here\index.html")) {
    Write-Host "Landing files not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================================="
Write-Host "  Upload Landing Page huongdi.sol.vn"
Write-Host "============================================================="

Write-Host ""
Write-Host "Step 1 - Upload 5 files to /tmp/..."
scp "$here\index.html" sol-vps:/tmp/landing-index.html
scp "$here\css\style.css" sol-vps:/tmp/landing-style.css
scp "$here\js\app.js" sol-vps:/tmp/landing-app.js
scp "$here\deploy-landing.sh" sol-vps:/tmp/deploy-landing.sh
scp "$here\huongdi.sol.vn.nginx.v2" sol-vps:/tmp/nginx-v2.conf

Write-Host ""
Write-Host "Step 2 - Run deploy script on VPS..."
ssh sol-vps "chmod +x /tmp/deploy-landing.sh && bash /tmp/deploy-landing.sh"

Write-Host ""
Write-Host "Step 3 - Update Nginx config V2..."
ssh sol-vps 'sudo cp /etc/nginx/sites-available/huongdi.sol.vn /etc/nginx/sites-available/huongdi.sol.vn.bak.$(date +%Y%m%d_%H%M%S) && sudo cp /tmp/nginx-v2.conf /etc/nginx/sites-available/huongdi.sol.vn && sudo nginx -t && sudo systemctl reload nginx && echo NGINX_RELOADED_OK'

Write-Host ""
Write-Host "Step 4 - Smoke test..."
ssh sol-vps "echo 'Home /'; curl -s -o /dev/null -w 'Status %{http_code}' https://huongdi.sol.vn/; echo ''; echo 'CSS:'; curl -s -o /dev/null -w 'Status %{http_code}' https://huongdi.sol.vn/css/style.css; echo ''; echo 'JS:'; curl -s -o /dev/null -w 'Status %{http_code}' https://huongdi.sol.vn/js/app.js; echo ''"

Write-Host ""
Write-Host "============================================================="
Write-Host "  Done. Browser test (Ctrl+Shift+R):"
Write-Host "    https://huongdi.sol.vn/"
Write-Host "    https://huongdi.sol.vn/kham-pha-ban-than/"
Write-Host "============================================================="
