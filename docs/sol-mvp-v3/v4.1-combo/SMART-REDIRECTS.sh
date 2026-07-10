#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Sol V4.1 Redirects — SMART VERSION (tự tìm config file)
# ═══════════════════════════════════════════════════════════

set -e

# ─── STEP 0: TỰ TÌM CONFIG FILE ───────────────────
echo "🔍 STEP 0/5 — Tìm config file cho huongdi.sol.vn..."
CONFIG_FILE=$(sudo grep -rl "server_name.*huongdi.sol.vn" /etc/nginx/sites-available/ /etc/nginx/conf.d/ 2>/dev/null | head -1)

if [ -z "$CONFIG_FILE" ]; then
  echo "❌ KHÔNG TÌM THẤY config file cho huongdi.sol.vn"
  echo ""
  echo "Kiểm tra các thư mục:"
  echo "─── /etc/nginx/sites-available/ ───"
  sudo ls /etc/nginx/sites-available/ 2>/dev/null || echo "  (không có)"
  echo ""
  echo "─── /etc/nginx/conf.d/ ───"
  sudo ls /etc/nginx/conf.d/ 2>/dev/null || echo "  (không có)"
  echo ""
  echo "─── /etc/nginx/sites-enabled/ ───"
  sudo ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "  (không có)"
  exit 1
fi

echo "✅ Config file: $CONFIG_FILE"
echo ""

# ─── STEP 1: BACKUP ───────────────────────────────
echo "🔧 STEP 1/5 — Backup..."
sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.bak-$(date +%Y%m%d-%H%M)"
echo "✅ Backup: ${CONFIG_FILE}.bak-$(date +%Y%m%d-%H%M)"
echo ""

# ─── STEP 2: TẠO SNIPPET ──────────────────────────
echo "🔧 STEP 2/5 — Tạo snippet redirects..."
sudo mkdir -p /etc/nginx/snippets
sudo tee /etc/nginx/snippets/sol-redirects.conf > /dev/null <<'REDIRECTS_EOF'
# ─── Sol V4.1 — 301 Redirects ───

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

# Sub-paths
location ~ ^/kham-pha-ban-than/(.*)$ { return 301 /thau-hieu/$1; }
location ~ ^/kiem-ke-nguon-luc/(.*)$ { return 301 /khai-pha/$1; }
location ~ ^/la-ban-huong-di/(.*)$   { return 301 /chon-huong/$1; }
REDIRECTS_EOF
echo "✅ Snippet: /etc/nginx/snippets/sol-redirects.conf"
echo ""

# ─── STEP 3: CHÈN INCLUDE ─────────────────────────
echo "🔧 STEP 3/5 — Chèn include vào server block..."
if sudo grep -q "sol-redirects.conf" "$CONFIG_FILE"; then
  echo "ℹ️  Include đã tồn tại — skip"
else
  sudo sed -i '0,/location \/ {/{s|location / {|include /etc/nginx/snippets/sol-redirects.conf;\n    location / {|}' "$CONFIG_FILE"
  echo "✅ Đã chèn include"
fi
echo ""

# ─── STEP 4: TEST SYNTAX ──────────────────────────
echo "🔧 STEP 4/5 — Test Nginx syntax..."
sudo nginx -t
echo ""

# ─── STEP 5: RELOAD ───────────────────────────────
echo "🔧 STEP 5/5 — Reload Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# ─── TEST 301 ─────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "🧪 VERIFY 301 REDIRECTS..."
echo "═══════════════════════════════════════════════════════════"
sleep 1
for url in kham-pha-ban-than kiem-ke-nguon-luc la-ban-huong-di p1 p2 p3 active premium; do
  echo "─── /$url/ ───"
  curl -sI "https://huongdi.sol.vn/$url/" | grep -iE "^(HTTP|Location)" || echo "  (không phản hồi)"
  echo ""
done

echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📁 Config file được edit: $CONFIG_FILE"
echo "📁 Backup: ${CONFIG_FILE}.bak-$(date +%Y%m%d-%H%M)"
echo ""
echo "🛡️ Rollback nếu cần:"
echo "   sudo cp ${CONFIG_FILE}.bak-<timestamp> $CONFIG_FILE"
echo "   sudo rm -f /etc/nginx/snippets/sol-redirects.conf"
echo "   sudo nginx -t && sudo systemctl reload nginx"
