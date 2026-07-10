# Phase 2 - Sync VPS assets to laptop, then push GitHub
# All ASCII - PowerShell safe

param(
    [string]$VpsHost = "sol-vps",
    [string]$RepoRoot = "C:\BOTHUOCLA\sol-ecosystem"
)

$ErrorActionPreference = "Continue"

function Write-Step { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  WARN: $msg" -ForegroundColor Yellow }

Write-Host "==============================================="  -ForegroundColor Cyan
Write-Host "  Phase 2 - Sync VPS to Laptop to GitHub"         -ForegroundColor Cyan
Write-Host "==============================================="  -ForegroundColor Cyan

if (-not (Test-Path $RepoRoot)) {
    Write-Host "ERR: Repo not found. Run Phase 1 first." -ForegroundColor Red
    exit 1
}

Set-Location $RepoRoot

$remote = git remote get-url origin 2>&1
if ($remote -notmatch "sol-ecosystem") {
    Write-Host "ERR: Not in sol-ecosystem repo" -ForegroundColor Red
    exit 1
}
Write-Ok "In sol-ecosystem repo"

# STEP 1: Sync huongdi-public
Write-Step "1/4 - Sync huongdi-public from VPS"

$tempDir = "$env:TEMP\huongdi-public-vps-$(Get-Random)"
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

Write-Host "  Running scp -r for huongdi/public ..." -ForegroundColor Gray
$scpTarget = $tempDir + "\"
scp -r ($VpsHost + ":/var/www/huongdi/public") $scpTarget 2>&1 | Out-Null

if (Test-Path "$tempDir\public") {
    robocopy "$tempDir\public" "$RepoRoot\huongdi-public" /MIR /XF "*.bak-*" "*.bak.*" /XD "node_modules" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "huongdi-public synced from VPS"
    Remove-Item -Path $tempDir -Recurse -Force
} else {
    Write-Warn "Cannot download - check SSH config sol-vps"
}

# STEP 2: Sync huongdi-backend
Write-Step "2/4 - Sync huongdi-backend from VPS"

$backendTemp = "$env:TEMP\huongdi-backend-vps-$(Get-Random)"
New-Item -Path $backendTemp -ItemType Directory -Force | Out-Null
$backendTarget = $backendTemp + "\"

Write-Host "  Running scp backend/src ..." -ForegroundColor Gray
scp -r ($VpsHost + ":/var/www/huongdi/backend/src") $backendTarget 2>&1 | Out-Null
if (Test-Path "$backendTemp\src") {
    robocopy "$backendTemp\src" "$RepoRoot\huongdi-backend\src" /MIR /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "backend/src synced"
}

Write-Host "  Running scp backend/prisma ..." -ForegroundColor Gray
scp -r ($VpsHost + ":/var/www/huongdi/backend/prisma") $backendTarget 2>&1 | Out-Null
if (Test-Path "$backendTemp\prisma") {
    robocopy "$backendTemp\prisma" "$RepoRoot\huongdi-backend\prisma" /MIR /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "backend/prisma synced"
}

Write-Host "  Running scp package.json + tsconfig.json ..." -ForegroundColor Gray
scp ($VpsHost + ":/var/www/huongdi/backend/package.json") "$RepoRoot\huongdi-backend\" 2>&1 | Out-Null
scp ($VpsHost + ":/var/www/huongdi/backend/tsconfig.json") "$RepoRoot\huongdi-backend\" 2>&1 | Out-Null
Write-Ok "package.json + tsconfig.json synced"

Remove-Item -Path $backendTemp -Recurse -Force -ErrorAction SilentlyContinue

# STEP 3: Check diff
Write-Step "3/4 - Check diff VPS vs Laptop"

$diff = git status --short
if ($diff) {
    Write-Host "  Files changed from VPS:" -ForegroundColor Yellow
    git status --short | Select-Object -First 30
    Write-Host ""
    $count = ($diff | Measure-Object).Count
    Write-Ok "$count files changed"
} else {
    Write-Ok "No diff - Laptop matches VPS"
    Write-Host "Phase 2 complete - nothing to commit." -ForegroundColor Green
    exit 0
}

# STEP 4: Commit + Push
Write-Step "4/4 - Commit + Push GitHub"

git add .
git commit -m "chore: sync VPS truth to GitHub"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==============================================="  -ForegroundColor Green
    Write-Host "  PHASE 2 COMPLETE"                                -ForegroundColor Green
    Write-Host "==============================================="  -ForegroundColor Green
    Write-Host ""
    Write-Host "  VPS truth -> Laptop -> GitHub SUCCESS"           -ForegroundColor White
    Write-Host "  Repo: https://github.com/nguyendinhkhangSOL/sol-ecosystem" -ForegroundColor White
    Write-Host ""
    Write-Host "  === NEXT STEPS ==="                              -ForegroundColor Yellow
    Write-Host "  1. Verify on browser - reload GitHub repo"       -ForegroundColor Gray
    Write-Host "  2. Download sol.vn WordPress via cPanel"         -ForegroundColor Gray
    Write-Host "     cPanel -> File Manager -> mu-plugins folder"  -ForegroundColor DarkGray
    Write-Host "     Compress -> Download -> Extract to solvn-wp"  -ForegroundColor DarkGray
    Write-Host "  3. Phase 3 - Ship deploy scripts"                -ForegroundColor Gray
}
