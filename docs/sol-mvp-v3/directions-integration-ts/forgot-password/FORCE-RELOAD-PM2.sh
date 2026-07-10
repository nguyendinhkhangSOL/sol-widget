#!/bin/bash
# Force reload PM2 env — delete + restart hoàn toàn
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

echo -e "${CYAN}═══ Force Reload PM2 Env ═══${NC}"
echo ""

# ─── 1. Show current .env SMTP config ─────────
echo -e "${YELLOW}[1/5] Current .env SMTP config:${NC}"
sudo grep -E '^SMTP|^APP_URL' "$BACKEND/.env" | sed 's/SMTP_PASS=.*/SMTP_PASS=<hidden>/'
echo ""

# ─── 2. Delete PM2 process ─────────────────────
echo -e "${YELLOW}[2/5] Delete PM2 huongdi-api process...${NC}"
pm2 delete huongdi-api 2>/dev/null || echo "   (process not exist)"
sleep 1
echo -e "    ${GREEN}✅ Deleted${NC}"

# ─── 3. Start fresh with env loaded ─────────────
echo -e "${YELLOW}[3/5] Start fresh PM2 process...${NC}"
cd "$BACKEND"

# Check if ecosystem.config.js exists
if [ -f "$BACKEND/ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --only huongdi-api --update-env
else
    # Direct start with env from .env
    pm2 start dist/index.js --name huongdi-api --update-env
fi

sleep 3
echo -e "    ${GREEN}✅ Started${NC}"

# ─── 4. Verify env loaded ────────────────────
echo -e "${YELLOW}[4/5] Verify env vars trong PM2 process...${NC}"
# Get PM2 pid, check env
PID=$(pm2 pid huongdi-api)
if [ -n "$PID" ] && [ "$PID" != "0" ]; then
    SMTP_HOST_LOADED=$(sudo cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep '^SMTP_HOST=' | cut -d= -f2)
    SMTP_USER_LOADED=$(sudo cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep '^SMTP_USER=' | cut -d= -f2)
    SMTP_PASS_LEN=$(sudo cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep '^SMTP_PASS=' | cut -d= -f2 | wc -c)
    echo "   Process PID: $PID"
    echo "   SMTP_HOST loaded: $SMTP_HOST_LOADED"
    echo "   SMTP_USER loaded: $SMTP_USER_LOADED"
    echo "   SMTP_PASS length: $((SMTP_PASS_LEN - 1)) chars"
fi

# ─── 5. Test forgot-password endpoint ─────────
echo ""
echo -e "${YELLOW}[5/5] Test /api/auth/forgot-password...${NC}"
sleep 2

# Use email from DB - admin
echo '{"email":"nguyendinhkhang@gmail.com"}' > /tmp/test-forgot.json
RES=$(curl -s -X POST http://localhost:4001/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  --data @/tmp/test-forgot.json)
echo "   Response: $RES"
rm -f /tmp/test-forgot.json

sleep 4

# Check for EAUTH in newest logs
NEW_ERR=$(pm2 logs huongdi-api --lines 10 --nostream --err 2>&1 | grep 'EAUTH' | tail -1)
if [ -n "$NEW_ERR" ]; then
    NEW_TIMESTAMP=$(echo "$NEW_ERR" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}' | head -1)
    CURRENT_TIME=$(date +'%Y-%m-%d %H:%M:%S')
    echo ""
    echo -e "   Latest EAUTH log: $NEW_TIMESTAMP"
    echo -e "   Current time: $CURRENT_TIME"
    # If EAUTH within last 10 seconds, likely from this test
    if [[ "$NEW_TIMESTAMP" > $(date -d '10 seconds ago' +'%Y-%m-%d %H:%M:%S') ]]; then
        echo -e "   ${YELLOW}⚠  EAUTH có timestamp mới — vẫn fail${NC}"
    else
        echo -e "   ${GREEN}✅ EAUTH log cũ, không phát sinh mới → OK!${NC}"
    fi
else
    echo -e "   ${GREEN}✅ Không có EAUTH log mới${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PM2 Reload Done${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test browser:${NC}"
echo -e "  1. https://huongdi.sol.vn/quen-mat-khau/"
echo -e "  2. Nhập email — chờ 30s"
echo -e "  3. Check inbox Gmail (kể cả Spam)"
