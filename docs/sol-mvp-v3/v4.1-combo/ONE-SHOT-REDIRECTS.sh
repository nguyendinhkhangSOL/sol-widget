#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Sol V4.1 Redirects — ONE-SHOT DEPLOY
# ═══════════════════════════════════════════════════════════
# Copy toàn bộ khối này vào terminal VPS → chạy 1 lần → xong
# Không cần nano, không cần edit tay
# ═══════════════════════════════════════════════════════════

set -e  # Dừng nếu có lỗi

echo "🔧 STEP 1/5 — Backup config Nginx..."
sudo cp /etc/nginx/sites-available/huongdi /etc/nginx/sites-available/huongdi.bak-$(date +%Y%m%d-%H%M)
echo "✅ Backup: /etc/nginx/sites-available/huongdi.bak-$(date +%Y%m%d-%H%M)"

echo ""
echo "🔧 STEP 2/5 — Tạo snippet redirects..."
sudo mkdir -p /etc/nginx/snippets
sudo tee /etc/nginx/snippets/sol-redirects.conf > /dev/null <<'REDIRECTS_EOF'
# ─── Sol V4.1 — 301 Redirects (không edit tay, dùng tee) ───

# 5 Bước Việt hoá
location = /kham-pha-ban-than       { return 301 /thau-hieu/; }
location = /kham-pha-ban-than/      { return 301 /thau-hieu/; }
location = /kiem-ke-nguon-luc       { return 301 /khai-pha/; }
location = /kiem-ke-nguon-luc/      { return 301 /khai-pha/; }
location = /la-ban-huong-di         { return 301 /chon-huong/; }
location = /la-ban-huong-di/        { return 301 /chon-huong/; }

# P1/P2/P3 short URLs
location = /p1                      { return 301 /thau-hieu/; }
location = /p1/                     { return 301 /thau-hieu/; }
location = /p2                      { return 301 /khai-pha/; }
location = /p2/                     { return 301 /khai-pha/; }
location = /p3                      { return 301 /chon-huong/; }
location = /p3/                     { return 301 /chon-huong/; }

# Pricing aliases
location = /active                  { return 301 /pricing/; }
location = /active/                 { return 301 /pricing/; }
location = /premium                 { return 301 /pricing/; }
location = /premium/                { return 301 /pricing/; }
location = /gia                     { return 301 /pricing/; }
location = /gia/                    { return 301 /pricing/; }

# Sub-paths (nested URLs từ sitemap cũ)
location ~ ^/kham-pha-ban-than/(.*)$ { return 301 /thau-hieu/$1; }
location ~ ^/kiem-ke-nguon-luc/(.*)$ { return 301 /khai-pha/$1; }
location ~ ^/la-ban-huong-di/(.*)$   { return 301 /chon-huong/$1; }
REDIRECTS_EOF
echo "✅ Snippet: /etc/nginx/snippets/sol-redirects.conf"

echo ""
echo "🔧 STEP 3/5 — Kiểm tra đã include chưa..."
if sudo grep -q "sol-redirects.conf" /etc/nginx/sites-available/huongdi; then
  echo "ℹ️  Include đã tồn tại — skip"
else
  echo "🔧 STEP 3/5 — Chèn include vào server block..."
  sudo sed -i '0,/location \/ {/{s|location / {|include /etc/nginx/snippets/sol-redirects.conf;\n    location / {|}' /etc/nginx/sites-available/huongdi
  echo "✅ Đã chèn include line"
fi

echo ""
echo "🔧 STEP 4/5 — Test Nginx syntax..."
sudo nginx -t

echo ""
echo "🔧 STEP 5/5 — Reload Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🧪 TEST 301 REDIRECTS..."
echo "═══════════════════════════════════════════════════════════"
sleep 1
for url in kham-pha-ban-than kiem-ke-nguon-luc la-ban-huong-di p1 p2 p3 active premium; do
  echo "─── /$url/ ───"
  curl -sI "https://huongdi.sol.vn/$url/" | grep -iE "^(HTTP|Location)" || echo "  (không phản hồi)"
  echo ""
done

echo "═══════════════════════════════════════════════════════════"
echo "✅ REDIRECTS DEPLOYED"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Kỳ vọng: mỗi URL trả về:"
echo "   HTTP/2 301"
echo "   Location: /thau-hieu/  (hoặc /khai-pha/, /chon-huong/, /pricing/)"
echo ""
echo "🛡️ Rollback nếu cần:"
echo "   sudo cp /etc/nginx/sites-available/huongdi.bak-<timestamp> /etc/nginx/sites-available/huongdi"
echo "   sudo nginx -t && sudo systemctl reload nginx"
