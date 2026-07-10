# Phase 1 — Setup Local Repo (Automated)
# Chạy trên PowerShell (KHÔNG cần Administrator)
# Prerequisites:
#   1. Đã tạo GitHub repo private "sol-ecosystem" (rỗng, không add README)
#   2. Đã setup SSH key (xem PHASE-1-SETUP-GUIDE.md Bước 2)
#   3. Đã chạy Phase 0 backup thành công
#
# Usage:
#   cd C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\ECOSYSTEM-AUDIT\
#   .\phase1-setup-local-repo.ps1 -GitHubUser "your-github-username"

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

# ─── PRE-FLIGHT CHECKS ───────────────────────────────
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Phase 1 — Setup Sol Ecosystem Git Repo       " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

Write-Step "Pre-flight checks"

# Check git
try {
    $gitVersion = git --version
    Write-Ok "Git: $gitVersion"
} catch {
    Write-Err "Git not installed. Download: https://git-scm.com/download/win"
    exit 1
}

# Check SSH connection to GitHub
$sshTest = ssh -T -o BatchMode=yes -o ConnectTimeout=5 git@github.com 2>&1
if ($sshTest -match "successfully authenticated") {
    Write-Ok "GitHub SSH OK"
} else {
    Write-Warn "GitHub SSH chua setup — xem PHASE-1-SETUP-GUIDE.md Buoc 2"
    Write-Host "  Chi tiet: $sshTest" -ForegroundColor DarkGray
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y") { exit 1 }
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

# ─── STEP 3: Copy assets ─────────────────────────────
Write-Step "3/6 - Copy assets tu local sol-widget"

$SOL_WIDGET = "C:\BOTHUOCLA\sol-widget"

# huongdi-public
if (Test-Path "$SOL_WIDGET\huongdi-public") {
    robocopy "$SOL_WIDGET\huongdi-public" "$TargetPath\huongdi-public" /E /XD "node_modules" /XF "*.bak-*" "*.bak.*" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "huongdi-public/ copied"
} else {
    Write-Warn "huongdi-public not found in $SOL_WIDGET"
}

# huongdi-backend
if (Test-Path "$SOL_WIDGET\huongdi-backend-latest") {
    robocopy "$SOL_WIDGET\huongdi-backend-latest" "$TargetPath\huongdi-backend" /E /XD "node_modules" ".next" "dist" /XF ".env" "*.bak-*" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "huongdi-backend/ copied"
} elseif (Test-Path "$SOL_WIDGET\huongdi-backend") {
    robocopy "$SOL_WIDGET\huongdi-backend" "$TargetPath\huongdi-backend" /E /XD "node_modules" ".next" "dist" /XF ".env" "*.bak-*" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "huongdi-backend/ copied (fallback)"
} else {
    Write-Warn "huongdi-backend not found — se sync tu VPS o Buoc 4"
}

# content (prompts + directions)
if (Test-Path "$SOL_WIDGET\docs\sol-mvp-v3\BUOC-4-ROADMAP\prompts") {
    robocopy "$SOL_WIDGET\docs\sol-mvp-v3\BUOC-4-ROADMAP\prompts" "$TargetPath\content\prompts" /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Ok "content/prompts/ copied"
}

# docs snapshot (chi phan quan trong)
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

@"
# Sol Ecosystem

**Sol La Bàn** — Hệ sinh thái tái khởi nghiệp cho người Việt 40-60.

3 trụ cột: **Thân** (Sức khỏe) · **Tâm** (Đồng hành) · **Trí** (Kinh doanh).

---

## Structure

| Folder | Description |
|--------|-------------|
| ``huongdi-public/`` | Static assets cho huongdi.sol.vn (VPS Node.js) |
| ``huongdi-backend/`` | Node.js API + Prisma DB (huongdi_prod) |
| ``solvn-wp/`` | WordPress custom code cho sol.vn (cPanel shared host) |
| ``admin/`` | Admin panel (adminhuongdi.sol.vn) |
| ``content/`` | Content assets (37 mô hình, 40 prompts, case studies) |
| ``docs/`` | Documentation + architecture |
| ``scripts/`` | Deploy scripts |

---

## Domains

- **huongdi.sol.vn** — Nền tảng học viên (VPS, Node.js + Postgres)
- **sol.vn** — Website chính (cPanel shared host, WordPress)
- **adminhuongdi.sol.vn** — Admin panel
- **admin.sol.vn** — WordPress admin (stable, ít khi động)
- **bothuocla.sol.vn** — Bộ thuốc lá (stable, ít khi động)

---

## Workflow

**Golden rule:** GitHub = Single Source of Truth. Không edit trực tiếp VPS/cPanel.

Xem chi tiết: ``docs/ecosystem-audit/WORKFLOW-CHUAN.md``

---

## Deploy

- **VPS domains:** ``bash scripts/deploy-huongdi-public.sh`` (SSH VPS)
- **WordPress:** SFTP upload mu-plugins qua WinSCP

Xem chi tiết: ``docs/DEPLOY.md`` *(Phase 3)*

---

## Contact

- **Owner:** Khang Sol
- **Email:** nguyendinhkhang@gmail.com
- **Initialized:** $today
"@ | Out-File -FilePath "README.md" -Encoding utf8

Write-Ok "README.md created"

# ─── STEP 6: First commit + push ─────────────────────
Write-Step "6/6 - Commit + Push to GitHub"

git add . 2>&1 | Out-Null
git commit -m "chore: initial commit - consolidate from laptop" -q

$fileCount = (git ls-files | Measure-Object).Count
Write-Ok "Commit created ($fileCount files)"

$remoteUrl = "git@github.com:$GitHubUser/$RepoName.git"
git remote add origin $remoteUrl 2>&1 | Out-Null
Write-Ok "Remote added: $remoteUrl"

Write-Host "`n  Pushing to GitHub..." -ForegroundColor Yellow
$pushResult = git push -u origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Ok "Pushed successfully!"
} else {
    Write-Err "Push failed. Output:"
    Write-Host $pushResult -ForegroundColor Red
    Write-Host "`nManual fix:" -ForegroundColor Yellow
    Write-Host "  1. Check repo URL: git remote -v" -ForegroundColor Gray
    Write-Host "  2. Fix URL:        git remote set-url origin git@github.com:USERNAME/sol-ecosystem.git" -ForegroundColor Gray
    Write-Host "  3. Retry push:     git push -u origin main" -ForegroundColor Gray
    exit 1
}

# ─── SUMMARY ─────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  PHASE 1 COMPLETE                              " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Local repo: $TargetPath" -ForegroundColor White
Write-Host "  GitHub:     https://github.com/$GitHubUser/$RepoName" -ForegroundColor White
Write-Host "  Files:      $fileCount" -ForegroundColor White
Write-Host ""
Write-Host "  === NEXT STEPS ===" -ForegroundColor Yellow
Write-Host "  1. Sync VPS assets (chua co trong local):" -ForegroundColor Gray
Write-Host "     cd $TargetPath" -ForegroundColor DarkGray
Write-Host "     scp -r sol-vps:/var/www/huongdi/public/* huongdi-public/" -ForegroundColor DarkGray
Write-Host "     git add . && git commit -m 'chore: sync VPS assets' && git push" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Download sol.vn WordPress qua cPanel File Manager" -ForegroundColor Gray
Write-Host "     Extract vao: $TargetPath\solvn-wp\" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. Verify:" -ForegroundColor Gray
Write-Host "     cd $TargetPath && git log --oneline" -ForegroundColor DarkGray
Write-Host ""
