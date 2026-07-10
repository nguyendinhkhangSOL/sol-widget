@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Sol SEO Publisher - CPT huong_di

echo.
echo ============================================================
echo    SOL SEO PUBLISHER - CPT huong_di (URL /huong-di/slug/)
echo ============================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Chua cai Python.
    pause
    exit /b 1
)

echo [OK] Python:
python --version
echo.

echo [+] Cai thu vien...
pip install requests Pillow --quiet
echo.

set IMG_DIR=%~dp0..\featured-images
if not exist "%IMG_DIR%\01-PILLAR.png" (
    echo [!] Tao 16 anh PNG...
    python "%IMG_DIR%\generate-images.py"
    echo.
)

echo ------------------------------------------------------------
echo Application Password tu sol.vn:
echo   https://sol.vn/wp-admin/profile.php
echo ------------------------------------------------------------
set /p WP_APP_PASS="Dan Application Password: "

if "%WP_APP_PASS%"=="" (
    echo [X] Chua dan Password. Thoat.
    pause
    exit /b 1
)

set /p WP_USER_INPUT="Username WP (Enter de dung 'admin'): "
if "%WP_USER_INPUT%"=="" (
    set WP_USER=admin
) else (
    set WP_USER=%WP_USER_INPUT%
)

set WP_URL=https://sol.vn

echo.
echo ------------------------------------------------------------
echo [+] Dang test ket noi...
echo ------------------------------------------------------------
python "%~dp0wp-publish-rest.py" --test

if errorlevel 1 (
    echo.
    echo [X] Ket noi that bai.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo QUY TRINH MIGRATE SANG CPT huong_di
echo ============================================================
echo BUOC 1: Upload plugin PHP vao WP (chi lam 1 lan):
echo   - File: sol-huong-di-cpt.php (cung thu muc voi .bat nay)
echo   - Upload qua WP Admin - Plugins - Add New - Upload
echo   - HOAC Cpanel - Files - Upload vao wp-content/plugins/
echo   - Sau do Activate plugin "Sol - Custom Post Type Huong Di"
echo   - Vao Settings - Permalinks - Save Changes (khong doi gi)
echo.
echo BUOC 2: Chay Menu tu file .bat nay:
echo   [D] Delete 16 bai cu (post_id 3464-3479) - LAM DAU TIEN
echo   [3] Publish 16 bai vao CPT huong_di (DRAFT)
echo   [4] Publish 16 bai vao CPT huong_di (LIVE)
echo   [5] Force update 16 bai da co
echo ============================================================
echo.

echo Chon hanh dong:
echo   [D] DELETE 16 bai cu (post_id 3464-3479 o post type "post")
echo   [1] Test dang Pillar #01 - DRAFT (vao CPT huong_di)
echo   [2] Dang Pillar #01 - LIVE
echo   [3] Dang TAT CA 16 bai - DRAFT
echo   [4] Dang TAT CA 16 bai - LIVE
echo   [5] Force UPDATE tat ca 16 bai da dang o CPT
echo   [P] PUSH CTA Prompts HOANH TRANG vao TAT CA bai huong-di ***
echo   [6] Xem list 16 bai
echo   [7] Tao lai 16 anh PNG
echo   [Q] Thoat
echo ------------------------------------------------------------
set /p CHOICE="Chon: "

if /i "%CHOICE%"=="D" goto optD
if /i "%CHOICE%"=="P" goto optP
if "%CHOICE%"=="1" goto opt1
if "%CHOICE%"=="2" goto opt2
if "%CHOICE%"=="3" goto opt3
if "%CHOICE%"=="4" goto opt4
if "%CHOICE%"=="5" goto opt5
if "%CHOICE%"=="6" goto opt6
if "%CHOICE%"=="7" goto opt7
if /i "%CHOICE%"=="Q" goto end
echo Lua chon khong hop le.
goto done

:optD
echo [!] SE DELETE 16 bai cu: post_id 3464 den 3479
set /p CONFIRM="Chac chan xoa? (yes/no): "
if /i "!CONFIRM!"=="yes" (
    python "%~dp0wp-publish-rest.py" --delete-old
) else (
    echo Da huy.
)
goto done

:opt1
python "%~dp0wp-publish-rest.py" --article 01 --draft
goto done

:opt2
python "%~dp0wp-publish-rest.py" --article 01
goto done

:opt3
python "%~dp0wp-publish-rest.py" --all --draft
goto done

:opt4
echo [!] Se dang LIVE 16 bai vao CPT huong_di
set /p CONFIRM="Chac chan? (yes/no): "
if /i "!CONFIRM!"=="yes" (
    python "%~dp0wp-publish-rest.py" --all
) else (
    echo Da huy.
)
goto done

:opt5
python "%~dp0wp-publish-rest.py" --all --force
goto done

:opt6
python "%~dp0wp-publish-rest.py" --list
goto done

:opt7
python "%~dp0..\featured-images\generate-images.py"
goto done

:optP
echo [+] PUSH CTA Prompts HOANH TRANG vao TAT CA bai huong-di...
echo Se scan tat ca bai trong CPT huong-di:
echo   - Bai da co box moi (marker HOANH TRANG) - SKIP
echo   - Bai chua co - INJECT CTA box vao cuoi content
python "%~dp0push-cta-prompts-all.py"
goto done

:done
echo.
echo ------------------------------------------------------------
echo [OK] Xong! Review tai:
echo   Bai Huong Di: https://sol.vn/wp-admin/edit.php?post_type=huong_di
echo   Bai Post cu: https://sol.vn/wp-admin/edit.php
echo ------------------------------------------------------------

:end
pause
