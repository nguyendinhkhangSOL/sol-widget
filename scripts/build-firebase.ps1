# ──────────────────────────────────────────────────────────────────────────
#  Build cả widget (frontend) + dashboard, gộp vào thư mục `public/`
#  để Firebase Hosting deploy lên 1 site duy nhất.
#
#  Layout sau khi build:
#    public/                 ← widget (root path /)
#      index.html
#      assets/...
#      app/                  ← dashboard (path /app)
#        index.html
#        assets/...
#
#  Cách dùng (từ thư mục sol-widget):
#    powershell -File scripts/build-firebase.ps1
#  Hoặc:
#    npm run build:firebase   (đã thêm vào package.json root)
# ──────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = 'Stop'

# Đảm bảo đứng ở thư mục root sol-widget (chỗ có firebase.json)
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Split-Path -Parent $root
Set-Location $root

Write-Host "→ Working dir: $root" -ForegroundColor Cyan

# 1. Xoá output cũ
if (Test-Path "public") {
    Write-Host "→ Xoá public/ cũ..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "public"
}

# 2. Build widget (frontend)
Write-Host "`n→ [1/2] Build widget (frontend)..." -ForegroundColor Cyan
Push-Location "frontend"
npm ci
npm run build
Pop-Location

# 3. Build dashboard
Write-Host "`n→ [2/2] Build dashboard..." -ForegroundColor Cyan
Push-Location "dashboard"
npm ci
npm run build
Pop-Location

# 4. Gộp vào public/
Write-Host "`n→ Gộp vào public/..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "public" | Out-Null
Copy-Item -Recurse -Force "frontend/dist/*" "public/"
New-Item -ItemType Directory -Force -Path "public/app" | Out-Null
Copy-Item -Recurse -Force "dashboard/dist/*" "public/app/"

# 5. Xong
Write-Host "`n✓ Build hoàn tất!" -ForegroundColor Green
Write-Host "  public/        — widget (https://bothuocla.sol.vn/)"
Write-Host "  public/app/    — dashboard (https://bothuocla.sol.vn/app)"
Write-Host "`n→ Deploy lên Firebase:"
Write-Host "    firebase deploy --only hosting" -ForegroundColor Yellow
