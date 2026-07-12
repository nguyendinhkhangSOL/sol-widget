#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Rename HTML files trên VPS — P1/P2/P3 → Vietnamese URLs
# ═══════════════════════════════════════════════════════════════════════
#
# Strategy: COPY (không delete file cũ) — Nginx 301 redirect xử lý URL cũ
# Update heading H1 + meta tags trong file mới
#
# Usage:
#   sudo bash /tmp/rename-p1-p2-p3.sh
# ═══════════════════════════════════════════════════════════════════════

set -e

WWW_ROOT="/var/www/huongdi/public"
BACKUP_DIR="/var/backups/huongdi-$(date +%Y%m%d_%H%M%S)"

echo "═══════════════════════════════════════════════════════════════════"
echo "  HUONGDI — Rename P1/P2/P3 to Vietnamese URLs"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "WWW Root: $WWW_ROOT"
echo "Backup:   $BACKUP_DIR"
echo ""

# ── Step 0: Pre-flight checks ──────────────────────────────────────────
[ "$EUID" -ne 0 ] && { echo "❌ Run with sudo: sudo bash $0"; exit 1; }

for f in p1.html p2.html p3.html; do
  if [ ! -f "$WWW_ROOT/$f" ]; then
    echo "❌ File not found: $WWW_ROOT/$f"
    exit 1
  fi
done
echo "✅ Pre-flight checks OK"
echo ""

# ── Step 1: Backup ─────────────────────────────────────────────────────
echo "── Step 1: Backup current files ──"
mkdir -p "$BACKUP_DIR"
cp "$WWW_ROOT/p1.html" "$BACKUP_DIR/p1.html"
cp "$WWW_ROOT/p2.html" "$BACKUP_DIR/p2.html"
cp "$WWW_ROOT/p3.html" "$BACKUP_DIR/p3.html"
echo "✅ Backed up to $BACKUP_DIR"
echo ""

# ── Step 2: Create new directories ─────────────────────────────────────
echo "── Step 2: Create new URL directories ──"
mkdir -p "$WWW_ROOT/kham-pha-ban-than"
mkdir -p "$WWW_ROOT/kiem-ke-nguon-luc"
mkdir -p "$WWW_ROOT/la-ban-huong-di"
echo "✅ Created 3 new directories"
echo ""

# ── Step 3: Copy files to new locations ────────────────────────────────
echo "── Step 3: Copy files ──"
cp "$WWW_ROOT/p1.html" "$WWW_ROOT/kham-pha-ban-than/index.html"
cp "$WWW_ROOT/p2.html" "$WWW_ROOT/kiem-ke-nguon-luc/index.html"
cp "$WWW_ROOT/p3.html" "$WWW_ROOT/la-ban-huong-di/index.html"
echo "✅ Copied 3 files"
echo ""

# ── Step 4: Update meta tags + headings ────────────────────────────────
echo "── Step 4: Update meta tags + H1 ──"

# P1
sed -i 's|<title>.*</title>|<title>Khám phá bản thân (P1) — DNA Nghề Nghiệp Tuổi 45+ | Đi Cùng Sol</title>|' "$WWW_ROOT/kham-pha-ban-than/index.html"
sed -i 's|<meta name="description" content="[^"]*"|<meta name="description" content="Bài DNA Test 20 câu hỏi giúp đàn ông Việt 40-65 khám phá năng lực + xu hướng nghề nghiệp. Bước 1 trong Hệ thống Đi Cùng Sol."|' "$WWW_ROOT/kham-pha-ban-than/index.html"

# P2
sed -i 's|<title>.*</title>|<title>Kiểm kê nguồn lực (P2) — Bản đồ Vốn-Network-Sức | Đi Cùng Sol</title>|' "$WWW_ROOT/kiem-ke-nguon-luc/index.html"
sed -i 's|<meta name="description" content="[^"]*"|<meta name="description" content="Kiểm kê 4 nguồn lực: vốn tài chính, thời gian, network 20 năm, năng lượng cá nhân. Bước 2 Đi Cùng Sol."|' "$WWW_ROOT/kiem-ke-nguon-luc/index.html"

# P3
sed -i 's|<title>.*</title>|<title>La bàn hướng đi (P3) — Match Top 5/37 Hướng Tái Khởi Nghiệp 45+ | Đi Cùng Sol</title>|' "$WWW_ROOT/la-ban-huong-di/index.html"
sed -i 's|<meta name="description" content="[^"]*"|<meta name="description" content="Kết quả matching top 5 hướng đi phù hợp nhất từ 37 hướng tái khởi nghiệp tuổi 45+. Bước 3 Đi Cùng Sol."|' "$WWW_ROOT/la-ban-huong-di/index.html"

# Add canonical URLs (chèn vào <head> nếu chưa có)
if ! grep -q 'rel="canonical"' "$WWW_ROOT/kham-pha-ban-than/index.html"; then
  sed -i 's|</head>|<link rel="canonical" href="https://huongdi.sol.vn/kham-pha-ban-than/" />\n</head>|' "$WWW_ROOT/kham-pha-ban-than/index.html"
  sed -i 's|</head>|<link rel="canonical" href="https://huongdi.sol.vn/kiem-ke-nguon-luc/" />\n</head>|' "$WWW_ROOT/kiem-ke-nguon-luc/index.html"
  sed -i 's|</head>|<link rel="canonical" href="https://huongdi.sol.vn/la-ban-huong-di/" />\n</head>|' "$WWW_ROOT/la-ban-huong-di/index.html"
  echo "✅ Added canonical URLs"
fi

echo "✅ Meta tags updated"
echo ""

# ── Step 5: Update fetch URLs in HTML files (if any) ───────────────────
echo "── Step 5: Replace internal /p1.html /p2.html /p3.html references ──"

# Note: Cần manual review file index.html (homepage) nếu có hardcoded link
for f in "$WWW_ROOT/kham-pha-ban-than/index.html" \
         "$WWW_ROOT/kiem-ke-nguon-luc/index.html" \
         "$WWW_ROOT/la-ban-huong-di/index.html"; do
  # Update fetch + href ref
  sed -i 's|href="/p1.html"|href="/kham-pha-ban-than/"|g' "$f"
  sed -i 's|href="/p2.html"|href="/kiem-ke-nguon-luc/"|g' "$f"
  sed -i 's|href="/p3.html"|href="/la-ban-huong-di/"|g' "$f"
done

echo "✅ Internal references updated"
echo ""

# ── Step 6: Update file ownership ──────────────────────────────────────
echo "── Step 6: Set ownership ──"
chown -R www-data:www-data "$WWW_ROOT/kham-pha-ban-than"
chown -R www-data:www-data "$WWW_ROOT/kiem-ke-nguon-luc"
chown -R www-data:www-data "$WWW_ROOT/la-ban-huong-di"
echo "✅ Ownership set"
echo ""

# ── Verify ─────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ HOÀN TẤT"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Backup: $BACKUP_DIR"
echo ""
echo "New URLs (sau khi reload nginx):"
echo "  https://huongdi.sol.vn/kham-pha-ban-than/"
echo "  https://huongdi.sol.vn/kiem-ke-nguon-luc/"
echo "  https://huongdi.sol.vn/la-ban-huong-di/"
echo ""
echo "Next step: thêm Nginx 301 redirects + reload"
echo "  sudo nano /etc/nginx/sites-available/huongdi.sol.vn"
echo "  (chèn content từ 01-nginx-301-redirects.conf)"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo ""
