# Install docs vao sol-ecosystem/docs/
# Copy 7 canonical doc files + commit lên GitHub

param(
    [string]$RepoRoot = "C:\BOTHUOCLA\sol-ecosystem",
    [string]$DocsSource = "C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\ECOSYSTEM-AUDIT\PROJECT-DOCS"
)

$ErrorActionPreference = "Continue"

Write-Host "==============================================="  -ForegroundColor Cyan
Write-Host "  Install Sol Ecosystem Documentation"          -ForegroundColor Cyan
Write-Host "==============================================="  -ForegroundColor Cyan

if (-not (Test-Path $RepoRoot)) {
    Write-Host "ERR: Repo not found: $RepoRoot" -ForegroundColor Red
    exit 1
}

# Create docs folder
$DocsTarget = Join-Path $RepoRoot "docs"
if (-not (Test-Path $DocsTarget)) {
    New-Item -Path $DocsTarget -ItemType Directory -Force | Out-Null
    Write-Host "  OK: Created docs/" -ForegroundColor Green
}

# Copy 7 canonical files
$files = @(
    "00-README.md",
    "01-OVERVIEW.md",
    "02-ARCHITECTURE.md",
    "03-DESIGN-DECISIONS.md",
    "04-CANONICAL-VERSIONS.md",
    "05-WORKFLOW.md",
    "06-DEPLOY.md",
    "07-RUNBOOK.md"
)

foreach ($file in $files) {
    $src = Join-Path $DocsSource $file
    $dst = Join-Path $DocsTarget $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Force
        $size = (Get-Item $dst).Length
        Write-Host "  OK: $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ERR: Missing $file" -ForegroundColor Red
    }
}

# Also copy audit report
$auditSrc = "C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\ECOSYSTEM-AUDIT\VERSION-AUDIT-REPORT.md"
$auditDst = Join-Path $DocsTarget "VERSION-AUDIT-REPORT.md"
if (Test-Path $auditSrc) {
    Copy-Item -Path $auditSrc -Destination $auditDst -Force
    Write-Host "  OK: VERSION-AUDIT-REPORT.md" -ForegroundColor Green
}

Set-Location $RepoRoot

# Git status
Write-Host ""
Write-Host "  Git status:" -ForegroundColor Yellow
git status --short docs/

Write-Host ""
Write-Host "  === NEXT STEPS ===" -ForegroundColor Yellow
Write-Host "  Review docs, then commit + push:" -ForegroundColor Gray
Write-Host "    cd $RepoRoot" -ForegroundColor DarkGray
Write-Host "    git add docs/" -ForegroundColor DarkGray
Write-Host "    git commit -m ""docs: canonical documentation suite v1.0""" -ForegroundColor DarkGray
Write-Host "    git push" -ForegroundColor DarkGray
