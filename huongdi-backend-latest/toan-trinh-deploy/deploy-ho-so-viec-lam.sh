#!/bin/bash
# ============================================================
# Deploy "Hồ sơ & Việc làm" — 5 trang tách + chrome chung
# Chạy TRÊN SERVER sau khi clone repo mới.
#  1) Backend: build mới (gồm chấm AI, tự hoàn thiện, CV dashboard, migration)
#  2) FE tĩnh: sol-chrome.js + sol-nav.json + tt-core.js + 5 trang /ho-so-viec-lam/
# ============================================================
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"       # .../huongdi-backend-latest/toan-trinh-deploy
SRC="$(cd "$HERE/.." && pwd)"                # .../huongdi-backend-latest
ROOT="$(cd "$SRC/.." && pwd)"               # .../sol-widget
PUB=/var/www/huongdi/public

echo "▶ 1) Backend (dùng lại deploy-cv-ai.sh: build + migration + restart)"
bash "$HERE/deploy-cv-ai.sh"

echo "▶ 2) Copy chrome chung + JS lõi"
sudo cp "$ROOT/huongdi-public/sol-chrome.js" "$PUB/sol-chrome.js"
sudo cp "$ROOT/huongdi-public/sol-nav.json"  "$PUB/sol-nav.json"

echo "▶ 3) Copy 5 trang /ho-so-viec-lam/ (tao-cv · cham · danh-gia · thu · phong-van)"
sudo mkdir -p "$PUB/ho-so-viec-lam"
sudo cp -r "$ROOT/huongdi-public/ho-so-viec-lam/." "$PUB/ho-so-viec-lam/"

echo "▶ 4) Phân quyền www-data"
sudo chown -R www-data:www-data "$PUB/ho-so-viec-lam" "$PUB/sol-chrome.js" "$PUB/sol-nav.json"

echo "✅ XONG."
echo "   Mở thử: https://huongdi.sol.vn/ho-so-viec-lam/tao-cv/  (đăng nhập trước)"
echo "   Nếu 404: nginx cần phục vụ thư mục tĩnh có index.html (giống /toan-trinh/). Báo em nếu vướng."
