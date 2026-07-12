#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Deploy P1/P2/P3 updated content — chạy trên VPS
# ═══════════════════════════════════════════════════════════════════════
# Expects files already in /tmp/p1.html /tmp/p2.html /tmp/p3.html
# ═══════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "  Deploy 3 file × 6 destinations + chown"
echo "═══════════════════════════════════════════════════════════════════"

if [ ! -f /tmp/p1.html ] || [ ! -f /tmp/p2.html ] || [ ! -f /tmp/p3.html ]; then
  echo "❌ Source files missing in /tmp/"
  exit 1
fi

echo "── Copy original p1/p2/p3.html ──"
sudo cp /tmp/p1.html /var/www/huongdi/public/p1.html
sudo cp /tmp/p2.html /var/www/huongdi/public/p2.html
sudo cp /tmp/p3.html /var/www/huongdi/public/p3.html

echo "── Copy to Vietnamese URLs ──"
sudo cp /tmp/p1.html /var/www/huongdi/public/kham-pha-ban-than/index.html
sudo cp /tmp/p2.html /var/www/huongdi/public/kiem-ke-nguon-luc/index.html
sudo cp /tmp/p3.html /var/www/huongdi/public/la-ban-huong-di/index.html

echo "── Set ownership ──"
sudo chown -R www-data:www-data /var/www/huongdi/public/kham-pha-ban-than/ \
                                 /var/www/huongdi/public/kiem-ke-nguon-luc/ \
                                 /var/www/huongdi/public/la-ban-huong-di/
sudo chown www-data:www-data /var/www/huongdi/public/p1.html \
                              /var/www/huongdi/public/p2.html \
                              /var/www/huongdi/public/p3.html

echo ""
echo "── VERIFY content ──"
for f in /var/www/huongdi/public/kham-pha-ban-than/index.html \
         /var/www/huongdi/public/kiem-ke-nguon-luc/index.html \
         /var/www/huongdi/public/la-ban-huong-di/index.html; do
  name=$(basename $(dirname "$f"))
  echo ""
  echo "── $name ──"
  echo "  Nav 'Khám phá bản thân':  $(grep -c '>Khám phá bản thân<' "$f")"
  echo "  Nav 'Kiểm kê nguồn lực':  $(grep -c '>Kiểm kê nguồn lực<' "$f")"
  echo "  Nav 'La bàn hướng đi':    $(grep -c '>La bàn hướng đi<' "$f")"
  echo "  Cũ /p1.html href:         $(grep -c 'href=\"/p1.html\"' "$f")"
  echo "  Cũ 'P1 Khám phá' label:   $(grep -c 'P1 Khám phá' "$f")"
  echo "  Voice Bạn remaining:      $(grep -oE '\bBạn\b' "$f" | wc -l)"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ DONE"
echo "═══════════════════════════════════════════════════════════════════"
echo "  Browser test (Ctrl+Shift+R):"
echo "    https://huongdi.sol.vn/kham-pha-ban-than/"
echo "    https://huongdi.sol.vn/kiem-ke-nguon-luc/"
echo "    https://huongdi.sol.vn/la-ban-huong-di/"
