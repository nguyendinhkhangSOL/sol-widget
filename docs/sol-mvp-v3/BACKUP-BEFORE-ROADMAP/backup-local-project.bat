@echo off
REM Backup local Sol widget project C:\BOTHUOCLA\sol-widget
REM Chạy trên máy anh (Windows) - double-click hoặc chạy trong cmd

setlocal enabledelayedexpansion

set "SRC=C:\BOTHUOCLA\sol-widget"
set "DATE_STAMP=%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%-%TIME:~3,2%"
set "DATE_STAMP=%DATE_STAMP: =0%"
set "BACKUP_DIR=C:\BOTHUOCLA\backups\sol-widget-%DATE_STAMP%-before-roadmap"

echo.
echo ===============================================
echo   Sol Widget Local Backup
echo ===============================================
echo.
echo Source: %SRC%
echo Dest:   %BACKUP_DIR%
echo.

if not exist "C:\BOTHUOCLA\backups\" mkdir "C:\BOTHUOCLA\backups\"

echo [1/3] Creating backup folder...
mkdir "%BACKUP_DIR%"

echo [2/3] Copying files (this may take 1-2 minutes)...
xcopy "%SRC%\*" "%BACKUP_DIR%\" /E /I /H /Y /Q ^
    /EXCLUDE:C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\BACKUP-BEFORE-ROADMAP\.backup-exclude.txt >nul 2>&1

if errorlevel 1 (
    echo    WARNING: Some files may have been skipped
)

echo [3/3] Verifying backup...
for /f %%A in ('dir "%BACKUP_DIR%" /s /b ^| find /c /v ""') do set FILE_COUNT=%%A
echo    Files copied: %FILE_COUNT%

echo.
echo ===============================================
echo   Backup Complete!
echo ===============================================
echo.
echo Location: %BACKUP_DIR%
echo.
echo Optional: Zip the backup for smaller size:
echo   Right-click folder ^> Send to ^> Compressed (zipped) folder
echo.
pause
