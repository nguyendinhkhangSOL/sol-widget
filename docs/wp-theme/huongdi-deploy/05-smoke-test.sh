#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# HUONGDI.SOL.VN — Smoke Test sau Deploy
# ═══════════════════════════════════════════════════════════════════════
#
# Chạy sau khi:
#   - Đã deploy huongdi-api (Bước 7)
#   - Đã setup Nginx + SSL (Bước 8-9)
#   - Đã build admin SPA (Bước 10)
#
# Sử dụng:
#   bash 05-smoke-test.sh
# ═══════════════════════════════════════════════════════════════════════

set -u

# ── Color codes ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
    local desc="$1"
    local cmd="$2"
    local expect="${3:-}"

    echo -n "  Testing: $desc ... "
    if result=$(eval "$cmd" 2>&1); then
        if [ -z "$expect" ] || echo "$result" | grep -q "$expect"; then
            echo -e "${GREEN}PASS${NC}"
            PASS=$((PASS+1))
            return 0
        fi
    fi
    echo -e "${RED}FAIL${NC}"
    echo "    └─ Output: $(echo $result | head -c 200)"
    FAIL=$((FAIL+1))
    return 1
}

# ── Header ──────────────────────────────────────────────────────────────
clear
cat << 'EOF'
═══════════════════════════════════════════════════════════════════════
   🧪  HUONGDI.SOL.VN — Smoke Test
═══════════════════════════════════════════════════════════════════════
EOF
echo ""

# ── Group 1: Local backend ──────────────────────────────────────────────
echo -e "${BLUE}── 1. Local Backend (port 4001) ─────────────────────${NC}"

check "API health (localhost:4001/health)" \
      "curl -sf http://localhost:4001/health" \
      '"status":"ok"'

check "API directions endpoint" \
      "curl -sf http://localhost:4001/api/directions" \
      '"total":'

# ── Group 2: PM2 ────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}── 2. PM2 Process ───────────────────────────────────${NC}"

check "huongdi-api process online" \
      "pm2 list | grep 'huongdi-api'" \
      "online"

check "sol-api (bothuocla) vẫn online — KHÔNG bị ảnh hưởng" \
      "pm2 list | grep 'sol-api'" \
      "online"

# ── Group 3: PostgreSQL ─────────────────────────────────────────────────
echo ""
echo -e "${BLUE}── 3. Database ──────────────────────────────────────${NC}"

check "huongdi_prod database exists" \
      "sudo -u postgres psql -l | grep huongdi_prod" \
      "huongdi_prod"

check "Directions count = 37" \
      "sudo -u postgres psql -d huongdi_prod -t -c 'SELECT COUNT(*) FROM directions;' | xargs" \
      "37"

check "Admin user admin@sol.vn exists" \
      "sudo -u postgres psql -d huongdi_prod -t -c \"SELECT email FROM admin_users WHERE email='admin@sol.vn';\" | xargs" \
      "admin@sol.vn"

# ── Group 4: DNS ────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}── 4. DNS Resolution ────────────────────────────────${NC}"

check "huongdi.sol.vn → 103.72.57.11" \
      "dig huongdi.sol.vn +short | tail -1" \
      "103.72.57.11"

check "adminhuongdi.sol.vn → 103.72.57.11" \
      "dig adminhuongdi.sol.vn +short | tail -1" \
      "103.72.57.11"

# ── Group 5: SSL + Frontend ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}── 5. HTTPS + Frontend ──────────────────────────────${NC}"

check "https://huongdi.sol.vn — SSL valid" \
      "curl -sIf https://huongdi.sol.vn/ -o /dev/null -w '%{http_code}'" \
      "200"

check "https://huongdi.sol.vn/api/health — API qua nginx proxy" \
      "curl -sf https://huongdi.sol.vn/api/health" \
      '"status":"ok"'

check "https://huongdi.sol.vn/p1.html — frontend P1 load" \
      "curl -sf https://huongdi.sol.vn/p1.html | grep -o '<title[^>]*>[^<]*' | head -1" \
      "title"

check "https://adminhuongdi.sol.vn — Admin SPA load" \
      "curl -sIf https://adminhuongdi.sol.vn/ -o /dev/null -w '%{http_code}'" \
      "200"

check "Admin có X-Robots-Tag noindex" \
      "curl -sI https://adminhuongdi.sol.vn/" \
      "X-Robots-Tag"

# ── Group 6: bothuocla unaffected ───────────────────────────────────────
echo ""
echo -e "${BLUE}── 6. Bothuocla.sol.vn — KHÔNG bị ảnh hưởng ────────${NC}"

check "bothuocla.sol.vn vẫn 200 OK" \
      "curl -sIf https://bothuocla.sol.vn/ -o /dev/null -w '%{http_code}'" \
      "200"

check "bothuocla API /healthz vẫn OK" \
      "curl -sf https://bothuocla.sol.vn/api/healthz" \
      '"ok":true'

# ── Group 7: System resources ──────────────────────────────────────────
echo ""
echo -e "${BLUE}── 7. System Resources ──────────────────────────────${NC}"

RAM_FREE=$(free -m | awk 'NR==2{print $7}')
echo "  RAM available: ${RAM_FREE}MB"
if [ "$RAM_FREE" -lt 200 ]; then
    echo -e "  ${YELLOW}⚠️  RAM thấp — monitor closely${NC}"
fi

DISK_USED=$(df / | awk 'NR==2{gsub(/%/,""); print $5}')
echo "  Disk used: ${DISK_USED}%"
if [ "$DISK_USED" -gt 80 ]; then
    echo -e "  ${YELLOW}⚠️  Disk gần đầy${NC}"
fi

# ── Summary ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo -e "  Result: ${GREEN}PASS=$PASS${NC} · ${RED}FAIL=$FAIL${NC}"
echo "═══════════════════════════════════════════════════════════════════════"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All checks passed! huongdi.sol.vn READY FOR LAUNCH${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test trong browser:"
    echo "     - https://huongdi.sol.vn/p1.html (làm P1 test)"
    echo "     - https://huongdi.sol.vn/p2.html (P2 resource)"
    echo "     - https://huongdi.sol.vn/p3.html (P3 matching → 37 directions)"
    echo "     - https://adminhuongdi.sol.vn/ (login admin@sol.vn)"
    echo ""
    echo "  2. Đổi admin password sau lần login đầu"
    echo ""
    echo "  3. (Optional) Bật IP whitelist cho admin trong:"
    echo "     /etc/nginx/sites-available/adminhuongdi.sol.vn"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Có $FAIL test thất bại — check log trên${NC}"
    echo ""
    echo "Debug commands:"
    echo "  pm2 logs huongdi-api --lines 50 --err"
    echo "  sudo tail -50 /var/log/nginx/huongdi.sol.vn.error.log"
    echo "  curl -v https://huongdi.sol.vn/api/health"
    exit 1
fi
