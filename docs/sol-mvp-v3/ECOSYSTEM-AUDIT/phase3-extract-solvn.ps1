# Phase 3 - Extract sol.vn WordPress backup + Selective copy vao Git
# All ASCII PowerShell safe

param(
    [string]$BackupFile = "C:\Users\ADMIN\Downloads\download_qbsigblp_1783394396_26405.tar.gz",
    [string]$RepoRoot = "C:\BOTHUOCLA\sol-ecosystem",
    [string]$BackupArchive = "C:\BOTHUOCLA\backups\2026-07-07_solvn-cpanel",
    [string]$TempExtract = "C:\BOTHUOCLA\solvn-extract-temp"
)

$ErrorActionPreference = "Continue"

function Write-Step { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  WARN: $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  ERR: $msg" -ForegroundColor Red }

Write-Host "==============================================="  -ForegroundColor Cyan
Write-Host "  Phase 3 - Extract sol.vn WordPress Backup"     -ForegroundColor Cyan
Write-Host "==============================================="  -ForegroundColor Cyan

# ===== STEP 1: Verify prerequisites =====
Write-Step "1/7 - Verify prerequisites"

if (-not (Test-Path $BackupFile)) {
    Write-Err "Backup file not found: $BackupFile"
    exit 1
}
$fileSize = [math]::Round((Get-Item $BackupFile).Length / 1GB, 2)
Write-Ok "Backup file: $BackupFile ($fileSize GB)"

if (-not (Test-Path $RepoRoot)) {
    Write-Err "Repo not found: $RepoRoot"
    exit 1
}
Write-Ok "Repo: $RepoRoot"

# Check tar available (Windows 10+ has built-in tar)
try {
    tar --version | Out-Null
    Write-Ok "tar utility available"
} catch {
    Write-Err "tar not available. Install Git for Windows (includes tar)."
    exit 1
}

# ===== STEP 2: Create backup archive folder + Move original =====
Write-Step "2/7 - Backup original file to archive folder"

if (-not (Test-Path $BackupArchive)) {
    New-Item -Path $BackupArchive -ItemType Directory -Force | Out-Null
}

$archivedFile = Join-Path $BackupArchive "solvn-full-backup.tar.gz"
if (-not (Test-Path $archivedFile)) {
    Copy-Item -Path $BackupFile -Destination $archivedFile -Force
    Write-Ok "Copied to archive: $archivedFile"
} else {
    Write-Warn "Archive already exists: $archivedFile (skipping copy)"
}

# ===== STEP 3: Extract to temp folder =====
Write-Step "3/7 - Extract archive to temp folder (may take 3-5 min)"

if (Test-Path $TempExtract) {
    Write-Warn "Temp folder exists - clearing..."
    Remove-Item -Path $TempExtract -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -Path $TempExtract -ItemType Directory -Force | Out-Null

Write-Host "  Extracting (please wait)..." -ForegroundColor Gray
$startTime = Get-Date
tar -xzf "$BackupFile" -C "$TempExtract" 2>&1 | Out-Null
$duration = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)

if ($LASTEXITCODE -eq 0) {
    $extractedSize = (Get-ChildItem $TempExtract -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $extractedGB = [math]::Round($extractedSize / 1GB, 2)
    Write-Ok "Extracted successfully ($extractedGB GB in $duration min)"
} else {
    Write-Err "Extract failed"
    exit 1
}

# ===== STEP 4: Find public_html folder =====
Write-Step "4/7 - Locate public_html in extracted archive"

$publicHtml = Get-ChildItem -Path $TempExtract -Directory -Recurse -ErrorAction SilentlyContinue |
              Where-Object { $_.Name -eq "public_html" } |
              Select-Object -First 1

if ($publicHtml) {
    Write-Ok "Found: $($publicHtml.FullName)"
    $sourcePath = $publicHtml.FullName
} else {
    Write-Warn "public_html not found - listing top-level:"
    Get-ChildItem $TempExtract -Directory | Select-Object -First 10 | ForEach-Object {
        Write-Host "    $($_.FullName)" -ForegroundColor DarkGray
    }
    Write-Warn "Please check structure manually"
    exit 1
}

# ===== STEP 5: Selective copy to sol-ecosystem/solvn-wp =====
Write-Step "5/7 - Copy custom parts to sol-ecosystem/solvn-wp"

$solvnWp = Join-Path $RepoRoot "solvn-wp"
if (-not (Test-Path $solvnWp)) {
    New-Item -Path $solvnWp -ItemType Directory -Force | Out-Null
}

# 5a. Copy mu-plugins (Sol custom PHP)
$muPluginsSrc = Join-Path $sourcePath "wp-content\mu-plugins"
if (Test-Path $muPluginsSrc) {
    $muPluginsDst = Join-Path $solvnWp "mu-plugins"
    robocopy $muPluginsSrc $muPluginsDst /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    $fileCount = (Get-ChildItem $muPluginsDst -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Ok "mu-plugins: $fileCount files"
} else {
    Write-Warn "mu-plugins folder not found in backup"
}

# 5b. Copy custom child themes (if any) - skip standard GeneratePress
$themesSrc = Join-Path $sourcePath "wp-content\themes"
if (Test-Path $themesSrc) {
    $themesDst = Join-Path $solvnWp "themes"
    New-Item -Path $themesDst -ItemType Directory -Force | Out-Null

    Get-ChildItem $themesSrc -Directory | ForEach-Object {
        $themeName = $_.Name
        # Skip standard themes - only copy custom child themes
        if ($themeName -match "child|sol|custom" -and $themeName -notmatch "twentytwenty|generatepress$") {
            $themeDst = Join-Path $themesDst $themeName
            robocopy $_.FullName $themeDst /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
            Write-Ok "Custom theme: $themeName"
        } else {
            Write-Host "  Skip standard theme: $themeName" -ForegroundColor DarkGray
        }
    }
}

# 5c. Copy root config files
$rootFiles = @("index.php", "index.html", "wp-config.php", ".htaccess", "robots.txt", "sitemap.xml")
foreach ($file in $rootFiles) {
    $src = Join-Path $sourcePath $file
    if (Test-Path $src) {
        $dst = Join-Path $solvnWp $file
        Copy-Item -Path $src -Destination $dst -Force
        Write-Ok "Root file: $file"
    }
}

# ===== STEP 6: Sanitize wp-config.php (mask secrets) =====
Write-Step "6/7 - Sanitize wp-config.php secrets"

$wpConfigPath = Join-Path $solvnWp "wp-config.php"
if (Test-Path $wpConfigPath) {
    # Read raw content
    $content = Get-Content -Path $wpConfigPath -Raw -Encoding UTF8

    # Backup original with .real extension (NOT commit to git)
    $wpConfigReal = Join-Path $solvnWp "wp-config.php.real-DO-NOT-COMMIT"
    Copy-Item -Path $wpConfigPath -Destination $wpConfigReal -Force
    Write-Ok "Original secrets backed up to: wp-config.php.real-DO-NOT-COMMIT (gitignored)"

    # Sanitize using regex - replace value inside quotes
    $sanitized = $content
    $sanitized = $sanitized -replace "(define\s*\(\s*'DB_PASSWORD'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_DB_PASSWORD'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'DB_USER'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_DB_USER'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'DB_NAME'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_DB_NAME'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'AUTH_KEY'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_AUTH_KEY'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'SECURE_AUTH_KEY'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_SECURE_AUTH_KEY'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'LOGGED_IN_KEY'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_LOGGED_IN_KEY'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'NONCE_KEY'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_NONCE_KEY'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'AUTH_SALT'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_AUTH_SALT'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'SECURE_AUTH_SALT'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_SECURE_AUTH_SALT'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'LOGGED_IN_SALT'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_LOGGED_IN_SALT'"
    $sanitized = $sanitized -replace "(define\s*\(\s*'NONCE_SALT'\s*,\s*)'[^']*'", "`$1'REPLACE_WITH_REAL_NONCE_SALT'"

    # Rename sanitized to wp-config.example.php (safe to commit)
    $wpConfigExample = Join-Path $solvnWp "wp-config.example.php"
    Set-Content -Path $wpConfigExample -Value $sanitized -Encoding UTF8
    Write-Ok "Sanitized: wp-config.example.php (safe to commit)"

    # Remove original wp-config.php - will be gitignored anyway
    Remove-Item -Path $wpConfigPath -Force
    Write-Ok "Removed original wp-config.php from git tree"
}

# ===== STEP 7: Add secrets to .gitignore =====
Write-Step "7/7 - Update .gitignore for WordPress secrets"

$gitignore = Join-Path $RepoRoot ".gitignore"
$secretsPatterns = @(
    "",
    "# WordPress secrets",
    "solvn-wp/wp-config.php",
    "solvn-wp/*.real-DO-NOT-COMMIT",
    "solvn-wp/.htpasswd"
)

$currentIgnore = if (Test-Path $gitignore) { Get-Content $gitignore -Raw } else { "" }
if ($currentIgnore -notmatch "solvn-wp/wp-config.php") {
    Add-Content -Path $gitignore -Value ($secretsPatterns -join "`r`n")
    Write-Ok ".gitignore updated with WP secrets patterns"
} else {
    Write-Ok ".gitignore already has WP secrets patterns"
}

# ===== SUMMARY =====
Write-Host ""
Write-Host "==============================================="  -ForegroundColor Green
Write-Host "  PHASE 3 EXTRACT COMPLETE"                       -ForegroundColor Green
Write-Host "==============================================="  -ForegroundColor Green

Set-Location $RepoRoot

Write-Host ""
Write-Host "  Backup archived: $BackupArchive"                -ForegroundColor White
Write-Host "  Custom parts copied to: $solvnWp"               -ForegroundColor White
Write-Host "  Temp extract folder: $TempExtract (can delete)" -ForegroundColor White
Write-Host ""

Write-Host "  === REVIEW BEFORE COMMIT ===" -ForegroundColor Yellow
Write-Host "  git status solvn-wp/" -ForegroundColor Gray
Write-Host "  ls -la solvn-wp/" -ForegroundColor Gray
Write-Host ""
Write-Host "  Verify wp-config.php is REMOVED (only .example version should exist)" -ForegroundColor Yellow
Write-Host ""

Write-Host "  === COMMIT COMMANDS ===" -ForegroundColor Yellow
Write-Host "  cd $RepoRoot" -ForegroundColor Gray
Write-Host "  git add solvn-wp/ .gitignore" -ForegroundColor Gray
Write-Host "  git commit -m ""chore: add sol.vn WordPress custom code (mu-plugins + config)""" -ForegroundColor Gray
Write-Host "  git push" -ForegroundColor Gray
Write-Host ""

Write-Host "  === CLEANUP LATER ===" -ForegroundColor Yellow
Write-Host "  # After confirm commit OK, delete temp folder:" -ForegroundColor Gray
Write-Host "  Remove-Item $TempExtract -Recurse -Force" -ForegroundColor DarkGray
Write-Host ""
