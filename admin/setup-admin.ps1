# PowerShell script — copy admin code từ dashboard sang admin/
# Chạy 1 lần duy nhất khi setup admin project lần đầu.
#
# Usage:
#   cd D:\BOTHUOCLA\sol-widget
#   powershell -ExecutionPolicy Bypass -File admin\setup-admin.ps1

$root = $PSScriptRoot | Split-Path -Parent
$dashboard = "$root\dashboard\src"
$admin = "$root\admin\src"

Write-Host "=== Sol Admin Setup ===" -ForegroundColor Cyan
Write-Host "Root: $root"
Write-Host ""

# 1. Tạo folder structure
@("pages", "components", "services", "state", "lib", "types") | ForEach-Object {
  $path = Join-Path $admin $_
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Force -Path $path | Out-Null
    Write-Host "  + Created $admin\$_" -ForegroundColor Green
  }
}

# 2. Copy shared libs từ dashboard
Write-Host ""
Write-Host "Copying shared libs..." -ForegroundColor Yellow

$libsCopy = @(
  @{ Src = "services\api.ts"; Dst = "services\api.ts" },
  @{ Src = "types\index.ts"; Dst = "types\index.ts" },
  @{ Src = "lib\featureGates.ts"; Dst = "lib\featureGates.ts" },
  @{ Src = "lib\deviceUid.ts"; Dst = "lib\deviceUid.ts" },
  @{ Src = "lib\syncBus.ts"; Dst = "lib\syncBus.ts" },
  @{ Src = "state\store.ts"; Dst = "state\store.ts" }
)

foreach ($f in $libsCopy) {
  $src = Join-Path $dashboard $f.Src
  $dst = Join-Path $admin $f.Dst
  if (Test-Path $src) {
    Copy-Item $src -Destination $dst -Force
    Write-Host "  + $($f.Src)" -ForegroundColor Green
  } else {
    Write-Host "  - $($f.Src) NOT FOUND (skip)" -ForegroundColor DarkYellow
  }
}

# 3. Copy admin pages từ dashboard/src/pages/admin/*.tsx → admin/src/pages/
Write-Host ""
Write-Host "Copying admin pages..." -ForegroundColor Yellow

$adminSrc = Join-Path $dashboard "pages\admin"
$adminDst = Join-Path $admin "pages"

if (Test-Path $adminSrc) {
  # Skip AdminLayout.tsx — admin/ có version riêng (route paths khác)
  Get-ChildItem -Path $adminSrc -Filter "*.tsx" | Where-Object { $_.Name -ne "AdminLayout.tsx" } | ForEach-Object {
    Copy-Item $_.FullName -Destination $adminDst -Force
    Write-Host "  + $($_.Name)" -ForegroundColor Green
  }
  Write-Host "  - AdminLayout.tsx skipped (dùng version admin/ riêng)" -ForegroundColor DarkYellow
}

# 4. Copy AuthEmailCallback (admin login flow reuse)
$authSrc = Join-Path $dashboard "pages\AuthEmailCallback.tsx"
$authDst = Join-Path $admin "pages\AuthEmailCallback.tsx"
if (Test-Path $authSrc) {
  Copy-Item $authSrc -Destination $authDst -Force
  Write-Host "  + AuthEmailCallback.tsx" -ForegroundColor Green
}

# 5. Adjust import paths trong admin pages
#    `../../services/api` → `../services/api` (vì admin pages giờ ở src/pages/, không phải src/pages/admin/)
Write-Host ""
Write-Host "Adjusting import paths (../../  ->  ../)..." -ForegroundColor Yellow

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
Get-ChildItem -Path $adminDst -Filter "Admin*.tsx" | ForEach-Object {
  # Read với encoding UTF-8 EXPLICIT (default ANSI gây mojibake với tiếng Việt)
  $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
  $newContent = $content
  # Adjust import paths: ../../  ->  ../
  $newContent = $newContent -replace "from '\.\./\.\./", "from '../"
  $newContent = $newContent -replace 'from "\.\./\.\./', 'from "../'
  # Rewrite route paths: /admin/users -> /users, /admin -> /
  # (vì admin.sol.vn ở root, không còn prefix /admin)
  $newContent = $newContent -replace "to=`"/admin/", "to=`"/"
  $newContent = $newContent -replace "to='/admin/", "to='/"
  $newContent = $newContent -replace "to=\{`"/admin/", "to=`{`"/"
  $newContent = $newContent -replace "navigate\('/admin/", "navigate('/"
  $newContent = $newContent -replace 'navigate\("/admin/', 'navigate("/'
  $newContent = $newContent -replace "to=`"/admin`"", "to=`"/`""
  $newContent = $newContent -replace "to='/admin'", "to='/'"
  if ($content -ne $newContent) {
    # Write UTF-8 NO BOM (Vite + TS prefer)
    [System.IO.File]::WriteAllText($_.FullName, $newContent, $utf8NoBom)
    Write-Host "  ~ Adjusted paths + imports in $($_.Name)" -ForegroundColor Cyan
  }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd admin"
Write-Host "  2. npm install"
Write-Host "  3. npm run dev          # port 5176"
Write-Host ""
Write-Host "Then open http://localhost:5176/login"
