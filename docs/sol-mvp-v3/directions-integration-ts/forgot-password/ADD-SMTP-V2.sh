#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ADD SMTP V2 — Zoho port 465 SSL (fix EAUTH 535)
# Chạy: bash ADD-SMTP-V2.sh
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
echo -e "${CYAN}   ADD SMTP V2 — Zoho port 465 SSL                    ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}TRƯỚC KHI RUN — Anh đã làm điều này chưa?${NC}"
echo ""
echo -e "${CYAN}PATH A (Regular Password):${NC}"
echo -e "  ✓ Đã login mail.zoho.com với noreply@sol.vn"
echo -e "  ✓ Settings → Mail Accounts → noreply@sol.vn"
echo -e "  ✓ Enable IMAP Access → Save"
echo -e ""
echo -e "${CYAN}HOẶC PATH B (App Password):${NC}"
echo -e "  ✓ Bật 2FA tại accounts.zoho.com"
echo -e "  ✓ Generate App Password (16 chars 'abcd-efgh-...')"
echo ""
read -p "Đã setup xong? Enter để tiếp tục (Ctrl+C để thoát): " _

echo ""
echo -e "${YELLOW}Password nào anh dùng?${NC}"
read -p "Paste password (regular hoặc app) rồi Enter: " PASS
echo ""

PASS=$(echo "$PASS" | tr -d '[:space:]')
if [ -z "$PASS" ]; then
    echo -e "${RED}❌ Không có password${NC}"
    exit 1
fi

echo -e "${CYAN}Password length: ${#PASS} chars, prefix: ${PASS:0:4}...${NC}"
echo ""

# ─── Remove old SMTP ────────────────────────────
echo -e "${YELLOW}[1/4] Clean SMTP config cũ...${NC}"
sudo sed -i '/^SMTP_HOST=/d;/^SMTP_PORT=/d;/^SMTP_SECURE=/d;/^SMTP_USER=/d;/^SMTP_PASS=/d;/^SMTP_FROM=/d;/^APP_URL=/d;/^# ─── SMTP Config/d' "$ENV_FILE"
echo -e "    ${GREEN}✅ Cleaned${NC}"

# ─── Add new SMTP config (port 465 SSL) ────────
echo -e "${YELLOW}[2/4] Add SMTP config với port 465 SSL...${NC}"

sudo tee -a "$ENV_FILE" > /dev/null << EOF

# ─── SMTP Config (Zoho Mail — port 465 SSL) ──────────────
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@sol.vn
SMTP_PASS=$PASS
SMTP_FROM=Sol La Bàn <noreply@sol.vn>
APP_URL=https://huongdi.sol.vn
EOF

echo -e "    ${GREEN}✅ Added${NC}"

# ─── Verify SMTP TRƯỚC KHI restart PM2 ──────────
echo -e "${YELLOW}[3/4] Test SMTP direct (Node.js)...${NC}"

cat > /tmp/test-smtp-v2.js << TESTEOF
const nodemailer = require('/var/www/huongdi/backend/node_modules/nodemailer');
const t = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: { user: 'noreply@sol.vn', pass: '$PASS' },
});
t.verify()
  .then(() => { console.log('SUCCESS'); process.exit(0); })
  .catch(e => { console.log('FAIL:', e.message); process.exit(1); });
TESTEOF

set +e
TEST_RES=$(node /tmp/test-smtp-v2.js 2>&1)
TEST_EXIT=$?
set -e
rm -f /tmp/test-smtp-v2.js

if [ $TEST_EXIT -eq 0 ]; then
    echo -e "    ${GREEN}✅ SMTP verify OK — credentials work${NC}"
else
    echo -e "    ${RED}❌ SMTP verify FAILED${NC}"
    echo -e "    ${RED}    Error: $TEST_RES${NC}"
    echo ""
    echo -e "${YELLOW}Diagnose:${NC}"
    echo -e "  1. IMAP Access enabled trong Zoho Mail Settings?"
    echo -e "  2. Password đúng (regular hoặc app password)?"
    echo -e "  3. 2FA có bật không? (bật → cần app password)"
    echo ""
    echo -e "${YELLOW}Rollback SMTP config để tránh block Sol...${NC}"
    sudo sed -i '/^SMTP_HOST=smtp\.zoho/,+6d' "$ENV_FILE"
    exit 1
fi

# ─── Restart PM2 ────────────────────────────────
echo -e "${YELLOW}[4/4] Restart PM2...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Restarted${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SMTP CONFIG VERIFIED + LIVE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# ─── Test send email ─────────────────────────────
read -p "Nhập email test (Enter để skip): " TEST_EMAIL
if [ -n "$TEST_EMAIL" ]; then
    RES=$(curl -s -X POST http://localhost:4001/api/auth/forgot-password \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$TEST_EMAIL\"}")
    echo -e "  ${CYAN}API: $RES${NC}"

    sleep 3
    ERROR=$(pm2 logs huongdi-api --lines 15 --nostream --err | grep -i "email\|smtp\|EAUTH" | tail -3)
    if [ -n "$ERROR" ]; then
        echo -e "${RED}⚠  Có error trong log:${NC}"
        echo "$ERROR"
    else
        echo -e "${GREEN}✅ Không có error. Check inbox $TEST_EMAIL (kể cả Spam)${NC}"
    fi
fi
