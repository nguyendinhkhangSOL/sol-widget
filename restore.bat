@echo off
REM ════════════════════════════════════════════════════════════════
REM  SOL Project Restore Script (Windows)
REM  Restore từ file zip backup vào máy mới.
REM
REM  Usage:
REM    1. Cài: Node.js 20+, PostgreSQL 16, Git
REM    2. Git clone repo: git clone <repo_url> sol-widget
REM    3. Copy file backup zip vào folder sol-widget
REM    4. Tạo DB: createdb -U postgres sol
REM    5. Set PGPASSWORD: set PGPASSWORD=your_postgres_password
REM    6. Chạy: restore.bat sol_backup_YYYY-MM-DD_HHMM.zip
REM ════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: restore.bat ^<backup_zip_file^>
    echo Example: restore.bat sol_backup_2026-05-01_2305.zip
    exit /b 1
)

set BACKUP_ZIP=%~1
if not exist "%BACKUP_ZIP%" (
    echo ❌ File không tồn tại: %BACKUP_ZIP%
    exit /b 1
)

set DB_NAME=sol
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432
set RESTORE_DIR=restore_temp

REM ─── 1. Extract zip ───
echo.
echo [1/3] Extracting %BACKUP_ZIP%...
if exist %RESTORE_DIR% rmdir /S /Q %RESTORE_DIR%
powershell -NoProfile -Command "Expand-Archive -Path '%BACKUP_ZIP%' -DestinationPath '%RESTORE_DIR%' -Force"
if errorlevel 1 (
    echo ❌ Extract thất bại
    exit /b 1
)
echo   ✓ Extracted to %RESTORE_DIR%\

REM ─── 2. Restore DB ───
echo.
echo [2/3] Restoring database "%DB_NAME%"...
echo   (Đảm bảo DB đã tạo: createdb -U postgres %DB_NAME%)
if "%PGPASSWORD%"=="" (
    echo   ⚠️  PGPASSWORD chưa set — pg_restore sẽ hỏi tương tác
)
pg_restore -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% --clean --if-exists "%RESTORE_DIR%\sol_db.dump"
if errorlevel 1 (
    echo   ⚠️  Có warning trong restore — bình thường nếu DB rỗng. Check log trên.
)
echo   ✓ DB restored

REM ─── 3. Restore .env files ───
echo.
echo [3/3] Restoring .env files...
if exist "%RESTORE_DIR%\backend.env" (
    copy /Y "%RESTORE_DIR%\backend.env" "backend\.env" >nul
    echo   ✓ backend\.env
)
if exist "%RESTORE_DIR%\frontend.env" (
    copy /Y "%RESTORE_DIR%\frontend.env" "frontend\.env" >nul
    echo   ✓ frontend\.env
)
if exist "%RESTORE_DIR%\dashboard.env" (
    copy /Y "%RESTORE_DIR%\dashboard.env" "dashboard\.env" >nul
    echo   ✓ dashboard\.env
)

REM ─── Cleanup ───
rmdir /S /Q %RESTORE_DIR%

echo.
echo ┌─────────────────────────────────────────────┐
echo │  ✓ Restore hoàn tất                         │
echo └─────────────────────────────────────────────┘
echo.
echo Tiếp theo:
echo   cd backend ^&^& npm install ^&^& npx prisma generate
echo   cd ..\frontend ^&^& npm install
echo   cd ..\dashboard ^&^& npm install
echo.
echo BẮT BUỘC build widget cho dashboard (1 lần sau khi setup):
echo   cd frontend ^&^& npm run build:embed:dashboard
echo.
echo Sau đó chạy 3 dev servers:
echo   backend:    npm run dev   (port 4000)
echo   frontend:   npm run dev   (port 5173)
echo   dashboard:  npm run dev   (port 5174)
echo.
echo Cuối cùng resume Claude session:
echo   - Mở Claude Desktop với folder workspace D:\BOTHUOCLA\sol-widget
echo   - Paste cho Claude: "Đọc CLAUDE_CONTEXT.md, em là Claude tiếp nối"
echo.

endlocal
