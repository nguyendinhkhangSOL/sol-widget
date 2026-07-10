# Phase 1 — Setup Local Repo (HTTPS version - dung Git Credential Manager)
# Khong can SSH key — Windows tu popup login GitHub qua browser
#
# Usage:
#   cd C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\ECOSYSTEM-AUDIT\
#   .\phase1-setup-local-repo-https.ps1 -GitHubUser "nguyendinhkhangSOL"

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUser,

    [string]$RepoName = "sol-ecosystem",
    [string]$TargetPath = "C:\BOTHUOCLA\sol-ecosystem"
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  WARN: $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  ERR: $msg" -ForegroundColor Red }

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Phase 1 - Setup Sol Ecosystem Git Repo       " -ForegroundColor Cyan
Write-Host "  User: $GitHubUser                             " -ForegroundColor Cyan
Write-Host "  Repo: $RepoName                               " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# ─── PRE-FLIGHT CHECKS ───────────────────────────────
Write-Step "Pre-flight checks"

try {
    $gitVersion = git --version
    Write-Ok "Git: $gitVersion"
} catch {
    Write-Err "Git not installed"
    exit 1
}

# Check target path
if (Test-Path $TargetPath) {
    Write-Warn "Target da ton tai: $TargetPath"
    $overwrite = Read-Host "Xoa va tao lai? (y/N)"
    if ($overwrite -eq "y") {
        Remove-Item -Path $TargetPath -Recurse -Force
        Write-Ok "Da xoa old target"
    } else {
        Write-Err "Aborted."
        exit 1
    }
}

# ─── STEP 1: Create folder structure ─────────────────
Write-Step "1/6 - Tao folder structure"

New-Item -Path $TargetPath -ItemType Directory -Force | Out-Null
Set-Location $TargetPath

@("huongdi-public", "huongdi-backend", "solvn-wp", "admin", "content", "docs", "scripts") | ForEach-Object {
    New-Item -Path $_ -ItemType Directory -Force | Out-Null
    Write-Ok "$_/"
}

# ─── STEP 2: Init git ────────────────────────────────
Write-Step "2/6 - Init git"

git init -q
git branch -M main
Write-Ok "git init + main branch"

# Set user.email + user.name neu chua co (global)
$gitEmail = git config --global user.email
if (-not $gitEmail) {
    git config --global user.email "nguyendinhkhang@gmail.com"
    git config --global user.name "Khang Sol"
    Write-Ok "Set global git user (Khang Sol / nguyendinhkhang@gmail.com)"
}

# ─── STEP 3: Copy assets ─────────────────────────────
Write-Step "3/6 - Copy assets tu local sol-widget"

$SOL_WIDGET = "C:\BOTHUOCLA\sol-widget"

# huongdi-public
if (Test-Path "$SOL_WIDGET\huongdi-public") {
    Write-Host "  Copying huongdi-public/ ..." -ForegroundColor Gray
    robocopy "$SOL_WIDGET\huongdi-public" "$TargetPath\huongdi-public" /E /XD "node_modules" /XF "*.bak-*" "*.bak.*" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "huongdi-public/ copied"
} else {
    Write-Warn "huongdi-public not found in $SOL_WIDGET"
}

# huongdi-backend
if (Test-Path "$SOL_WIDGET\huongdi-backend-latest") {
    Write-Host "  Copying huongdi-backend-latest/ ..." -ForegroundColor Gray
    robocopy "$SOL_WIDGET\huongdi-backend-latest" "$TargetPath\huongdi-backend" /E /XD "node_modules" ".next" "dist" /XF ".env" "*.bak-*" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "huongdi-backend/ copied (from huongdi-backend-latest)"
} elseif (Test-Path "$SOL_WIDGET\huongdi-backend") {
    Write-Host "  Copying huongdi-backend/ ..." -ForegroundColor Gray
    robocopy "$SOL_WIDGET\huongdi-backend" "$TargetPath\huongdi-backend" /E /XD "node_modules" ".next" "dist" /XF ".env" "*.bak-*" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "huongdi-backend/ copied (from huongdi-backend)"
} else {
    Write-Warn "huongdi-backend not found - se sync tu VPS o Phase 2"
}

# content - prompts + directions
if (Test-Path "$SOL_WIDGET\docs\sol-mvp-v3\BUOC-4-ROADMAP\prompts") {
    robocopy "$SOL_WIDGET\docs\sol-mvp-v3\BUOC-4-ROADMAP\prompts" "$TargetPath\content\prompts" /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "content/prompts/ copied"
}

# docs - ecosystem audit
if (Test-Path "$SOL_WIDGET\docs\sol-mvp-v3\ECOSYSTEM-AUDIT") {
    robocopy "$SOL_WIDGET\docs\sol-mvp-v3\ECOSYSTEM-AUDIT" "$TargetPath\docs\ecosystem-audit" /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "docs/ecosystem-audit/ copied"
}

# ─── STEP 4: Create .gitignore ───────────────────────
Write-Step "4/6 - Tao .gitignore"

@'
# Dependencies
node_modules/
package-lock.json

# Env / Secrets
.env
.env.local
.env.production
*.env
secrets/

# Backups
*.bak-*
*.bak.*
*.bak

# OS
.DS_Store
Thumbs.db
desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
logs/
npm-debug.log*

# Build
dist/
build/
.next/
out/

# Uploads (large binary)
uploads/
*.zip
*.tar.gz
'@ | Out-File -FilePath ".gitignore" -Encoding utf8

Write-Ok ".gitignore created"

# ─── STEP 5: Create README.md ────────────────────────
Write-Step "5/6 - Tao README.md"

$today = Get-Date -Format "yyyy-MM-dd"

$readmeContent = @"
# Sol Ecosystem

**Sol La Ban** - He sinh thai tai khoi nghiep cho nguoi Viet 40-60.

3 tru cot: **Than** (Suc khoe) - **Tam** (Dong hanh) - **Tri** (Kinh doanh).

## Structure

| Folder | Description |
|--------|-------------|
| ``huongdi-public/`` | Static assets cho huongdi.sol.vn (VPS Node.js) |
| ``huongdi-backend/`` | Node.js API + Prisma DB (huongdi_prod) |
| ``solvn-wp/`` | WordPress custom code cho sol.vn (cPanel shared host) |
| ``admin/`` | Admin panel (adminhuongdi.sol.vn) |
| ``content/`` | Content assets (37 mo hinh, 40 prompts, case studies) |
| ``docs/`` | Documentation + architecture |
| ``scripts/`` | Deploy scripts |

## Domains

- **huongdi.sol.vn** - Nen tang hoc vien (VPS, Node.js + Postgres)
- **sol.vn** - Website chinh (cPanel shared host, WordPress)
- **adminhuongdi.sol.vn** - Admin panel

## Workflow

**Golden rule:** GitHub = Single Source of Truth. Khong edit truc tiep VPS/cPanel.

Xem chi tiet: ``docs/ecosystem-audit/WORKFLOW-CHUAN.md``

## Contact

- **Owner:** Khang Sol
- **Email:** nguyendinhkhang@gmail.com
- **Initialized:** $today
"@

$readmeContent | Out-File -FilePath "README.md" -Encoding utf8
Write-Ok "README.md created"

# ─── STEP 6: First commit + push (HTTPS) ─────────────
Write-Step "6/6 - Commit + Push to GitHub (HTTPS)"

git add . 2>&1 | Out-Null
git commit -m "chore: initial commit - consolidate from laptop" -q

$fileCount = (git ls-files | Measure-Object).Count
Write-Ok "Commit created ($fileCount files)"

# HTTPS URL - Windows Git Credential Manager se popup login lan dau
$remoteUrl = "https://github.com/$GitHubUser/$RepoName.git"
git remote add origin $remoteUrl 2>&1 | Out-Null
Write-Ok "Remote added: $remoteUrl"

Write-Host ""
Write-Host "  === PUSHING TO GITHUB ===" -ForegroundColor Yellow
Write-Host "  Lan dau: Windows se popup login GitHub browser" -ForegroundColor Yellow
Write-Host "  Click 'Sign in with your browser' - login Gmail" -ForegroundColor Yellow
Write-Host "  Sau do auto-save credential, khong hoi lai" -ForegroundColor Yellow
Write-Host ""

$pushResult = git push -u origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Ok "Pushed successfully!"
} else {
    Write-Err "Push failed:"
    Write-Host $pushResult -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual fix:" -ForegroundColor Yellow
    Write-Host "  1. cd $TargetPath" -ForegroundColor Gray
    Write-Host "  2. git remote -v (verify URL)" -ForegroundColor Gray
    Write-Host "  3. git push -u origin main (retry)" -ForegroundColor Gray
    exit 1
}

# ─── SUMMARY ─────────────────────────────────────────
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  PHASE 1 COMPLETE                              " -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Local repo: $TargetPath" -ForegroundColor White
Write-Host "  GitHub:     https://github.com/$GitHubUser/$RepoName" -ForegroundColor White
Write-Host "  Files:      $fileCount" -ForegroundColor White
Write-Host ""
Write-Host "  === NEXT: Phase 2 - Sync VPS assets ===" -ForegroundColor Yellow
Write-Host "  cd $TargetPath" -ForegroundColor Gray
Write-Host "  scp -r sol-vps:/var/www/huongdi/public/* huongdi-public/" -ForegroundColor Gray
Write-Host "  git add . && git commit -m 'chore: sync VPS assets' && git push" -ForegroundColor Gray
Write-Host ""
