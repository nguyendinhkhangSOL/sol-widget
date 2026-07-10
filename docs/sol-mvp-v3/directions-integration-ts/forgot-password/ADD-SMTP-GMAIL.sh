#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ADD SMTP — Gmail SMTP (Alternative when Zoho fails)
# Chạy: bash ADD-SMTP-GMAIL.sh
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

ENV_FILE="/var/www/huongdi/backend/.env"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   ADD SMTP — Gmail (Free 500 email/day)             ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}TRƯỚC KHI RUN:${NC}"
echo -e "  1. Bật 2FA: https://myaccount.google.com/security"
echo -e "  2. Tạo App Password: https://myaccount.google.com/apppasswords"
echo -e "     App name: Sol Backend SMTP"
echo -e "     Copy 16-char password (dạng: 'abcd efgh ijkl mnop')"
echo ""

read -p "Gmail address (VD: nguyendinhkhang@gmail.com): " GMAIL_USER
read -p "App Password (16 chars, có thể có space): " GMAIL_PASS
echo ""

# Clean password: remove spaces
GMAIL_PASS=$(echo "$GMAIL_PASS" | tr -d '[:space:]')

if [ -z "$GMAIL_USER" ] || [ -z "$GMAIL_PASS" ]; then
    echo -e "${RED}❌ Missing input${NC}"
    exit 1
fi

if [ ${#GMAIL_PASS} -ne 16 ]; then
    echo -e "${YELLOW}⚠  Password không phải 16 chars (${#GMAIL_PASS}). Vẫn thử...${NC}"
fi

echo -e "${CYAN}Gmail: $GMAIL_USER${NC}"
echo -e "${CYAN}Password: ${GMAIL_PASS:0:4}...${GMAIL_PASS: -4} (${#GMAIL_PASS} chars)${NC}"
echo ""

# ─── Test SMTP trước ────────────────────────────
echo -e "${YELLOW}[1/3] Test SMTP Gmail...${NC}"

cat > /tmp/test-gmail.js << TESTEOF
const nodemailer = require('/var/www/huongdi/backend/node_modules/nodemailer');
const t = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: '$GMAIL_USER', pass: '$GMAIL_PASS' },
});
t.verify()
  .then(() => { console.log('SUCCESS'); process.exit(0); })
  .catch(e => { console.log('FAIL:', e.message); process.exit(1); });
TESTEOF

set +e
TEST_RES=$(node /tmp/test-gmail.js 2>&1)
TEST_EXIT=$?
set -e
rm -f /tmp/test-gmail.js

if [ $TEST_EXIT -ne 0 ]; then
    echo -e "${RED}❌ SMTP verify FAILED${NC}"
    echo -e "${RED}   Error: $TEST_RES${NC}"
    echo ""
    echo -e "${YELLOW}Kiểm tra:${NC}"
    echo -e "  1. 2FA đã bật chưa? myaccount.google.com/security"
    echo -e "  2. App Password đúng? myaccount.google.com/apppasswords"
    echo -e "  3. Copy chính xác 16 chars (có/không space đều OK)"
    exit 1
fi

echo -e "    ${GREEN}✅ SMTP Gmail OK${NC}"

# ─── Clean + Add config ────────────────────────
echo -e "${YELLOW}[2/3] Update .env...${NC}"

sudo sed -i '/^SMTP_HOST=/d;/^SMTP_PORT=/d;/^SMTP_SECURE=/d;/^SMTP_USER=/d;/^SMTP_PASS=/d;/^SMTP_FROM=/d;/^APP_URL=/d;/^# ─── SMTP Config/d' "$ENV_FILE"

sudo tee -a "$ENV_FILE" > /dev/null << EOF

# ─── SMTP Config (Gmail — port 465 SSL) ──────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=$GMAIL_USER
SMTP_PASS=$GMAIL_PASS
SMTP_FROM=Sol La Bàn <$GMAIL_USER>
APP_URL=https://huongdi.sol.vn
EOF

echo -e "    ${GREEN}✅ Config saved${NC}"

# ─── Restart PM2 ───────────────────────────────
echo -e "${YELLOW}[3/3] Restart PM2...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Restarted${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Gmail SMTP LIVE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# ─── Send test email ───────────────────────────
read -p "Nhập email test (Enter để skip): " TEST_EMAIL
if [ -n "$TEST_EMAIL" ]; then
    RES=$(curl -s -X POST http://localhost:4001/api/auth/forgot-password \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$TEST_EMAIL\"}")
    echo -e "  ${CYAN}API: $RES${NC}"

    sleep 3
    ERROR=$(pm2 logs huongdi-api --lines 15 --nostream --err | grep -i "email\|smtp\|EAUTH" | tail -3)
    if [ -n "$ERROR" ]; then
        echo -e "${RED}⚠  Error:${NC}"
        echo "$ERROR"
    else
        echo -e "${GREEN}✅ Check inbox $TEST_EMAIL (kể cả Spam)${NC}"
    fi
fi
