@echo off
REM ════════════════════════════════════════════════════════════════
REM  SOL Project Backup Script (Windows)
REM  Backup: PostgreSQL DB + .env files + CLAUDE_CONTEXT.md
REM  Output: 1 file zip duy nhất kèm timestamp
REM
REM  Usage:
REM    1. Đảm bảo PostgreSQL pg_dump có trong PATH (kiểm: pg_dump --version)
REM    2. Set biến môi trường PGPASSWORD (hoặc dùng %PGPASS_FROM_FILE%)
REM    3. Double-click backup.bat HOẶC chạy: cmd /c backup.bat
REM ════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

REM ─── Cấu hình ───
set DB_NAME=sol
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

REM ─── Timestamp ─── (vd: 2026-05-01_2305)
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set datetime=%%a
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%

set BACKUP_BASE=backups
set BACKUP_DIR=%BACKUP_BASE%\sol_%TIMESTAMP%
set ZIP_OUTPUT=%BACKUP_BASE%\sol_backup_%TIMESTAMP%.zip

if not exist %BACKUP_BASE% mkdir %BACKUP_BASE%
mkdir %BACKUP_DIR%

echo.
echo ┌─────────────────────────────────────────────┐
echo │  SOL Backup — %TIMESTAMP%
echo └─────────────────────────────────────────────┘

REM ─── 1. Database dump ───
echo.
echo [1/4] Dumping PostgreSQL database "%DB_NAME%"...
if "%PGPASSWORD%"=="" (
    echo   ⚠️  PGPASSWORD chưa set. pg_dump sẽ hỏi password tương tác.
    echo      Set sẵn để chạy unattended:  set PGPASSWORD=your_password
)
pg_dump -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -Fc %DB_NAME% > "%BACKUP_DIR%\sol_db.dump"
if errorlevel 1 (
    echo   ❌ pg_dump thất bại. Kiểm tra postgres có chạy + user/pass đúng?
    pause
    exit /b 1
)
echo   ✓ DB dumped to %BACKUP_DIR%\sol_db.dump

REM ─── 2. Copy .env files ───
echo.
echo [2/4] Copying .env files...
if exist backend\.env (
    copy /Y backend\.env "%BACKUP_DIR%\backend.env" >nul
    echo   ✓ backend\.env
) else (
    echo   ⚠️  backend\.env không tồn tại
)
if exist frontend\.env (
    copy /Y frontend\.env "%BACKUP_DIR%\frontend.env" >nul
    echo   ✓ frontend\.env
)
if exist dashboard\.env (
    copy /Y dashboard\.env "%BACKUP_DIR%\dashboard.env" >nul
    echo   ✓ dashboard\.env
)

REM ─── 3. Copy CLAUDE_CONTEXT.md ───
echo.
echo [3/4] Copying CLAUDE_CONTEXT.md...
if exist CLAUDE_CONTEXT.md (
    copy /Y CLAUDE_CONTEXT.md "%BACKUP_DIR%\CLAUDE_CONTEXT.md" >nul
    echo   ✓ CLAUDE_CONTEXT.md
) else (
    echo   ⚠️  CLAUDE_CONTEXT.md không tồn tại — chạy Claude session để Claude tạo
)

REM ─── 4. Zip everything ───
echo.
echo [4/4] Compressing to zip...
powershell -NoProfile -Command "Compress-Archive -Path '%BACKUP_DIR%\*' -DestinationPath '%ZIP_OUTPUT%' -Force"
if errorlevel 1 (
    echo   ❌ Compress thất bại
    pause
    exit /b 1
)

REM ─── Cleanup uncompressed folder ───
rmdir /S /Q "%BACKUP_DIR%"

echo.
echo ┌─────────────────────────────────────────────┐
echo │  ✓ Backup hoàn tất                          │
echo └─────────────────────────────────────────────┘
echo.
echo File backup: %ZIP_OUTPUT%
echo Kích thước:
for %%A in ("%ZIP_OUTPUT%") do echo   %%~zA bytes
echo.
echo Khang nhớ:
echo   1. Copy file zip này vào USB / Google Drive
echo   2. Push code lên git (nếu chưa)
echo   3. CLAUDE_CONTEXT.md đã trong repo — sang máy mới chỉ cần git clone là có
echo.

pause
endlocal
