# Sol v4 - Re-publish 104 Vietnamese-edited articles to sol.vn
# Run on Windows PowerShell. Idempotent UPDATE (keeps post ID + SEO authority).
#
# Usage:
#   cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
#   .\REPUBLISH-ALL-104.ps1
#
# Or run partial:
#   .\REPUBLISH-ALL-104.ps1 -Only "pre-qday"
#   .\REPUBLISH-ALL-104.ps1 -Only "qday"
#   .\REPUBLISH-ALL-104.ps1 -Only "cluster-ab"
#   .\REPUBLISH-ALL-104.ps1 -Only "chip"
#   .\REPUBLISH-ALL-104.ps1 -Only "pillar"

param([string]$Only = "all")

$ErrorActionPreference = "Continue"
$start = Get-Date

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Sol v4 - Re-publish 104 articles to sol.vn" -ForegroundColor Cyan
Write-Host "  Mode: $Only" -ForegroundColor Cyan
Write-Host "  Start: $start" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

function Run-Script {
    param([string]$Name, [string]$Script, [int]$Count)
    Write-Host ""
    Write-Host ">> [$Name] $Script ($Count articles)..." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
    & node $Script
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] $Name FAILED (exit $LASTEXITCODE)" -ForegroundColor Red
    } else {
        Write-Host "[OK] $Name done" -ForegroundColor Green
    }
    Start-Sleep -Seconds 3
}

if ($Only -eq "all" -or $Only -eq "pre-qday") {
    Run-Script -Name "Pre-Q-Day" -Script "publish-pre-qday.js" -Count 21
}

if ($Only -eq "all" -or $Only -eq "qday") {
    Run-Script -Name "Q-Day-Series" -Script "publish-qday-series.js" -Count 30
}

if ($Only -eq "all" -or $Only -eq "cluster-ab") {
    Run-Script -Name "Cluster-AB" -Script "publish-cluster-ab.js" -Count 11
}

if ($Only -eq "all" -or $Only -eq "chip") {
    Run-Script -Name "CHIP" -Script "publish-chip-batch.js" -Count 34
}

if ($Only -eq "all" -or $Only -eq "pillar") {
    Run-Script -Name "Pillar-Tier-1" -Script "publish-pillar.js" -Count 7
    Run-Script -Name "Pillar-QDay-Prep" -Script "publish-pillar-qday-prep.js" -Count 1
}

$end = Get-Date
$dur = $end - $start

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ("  Done - total time: {0:F1} minutes" -f $dur.TotalMinutes) -ForegroundColor Green
Write-Host "  Verify: open https://sol.vn/wiki/ and spot-check 5-10 articles" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
