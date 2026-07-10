#!/bin/bash
# Debug email flow — gửi direct + check Sol logs
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"

read -p "Email nhận test (VD: nguyendinhkhang@gmail.com): " TEST_EMAIL

if [ -z "$TEST_EMAIL" ]; then
    echo "❌ Cần email"
    exit 1
fi

# ─── Test 1: Send direct email (bypass Sol code) ────────
echo -e "${CYAN}═══ TEST 1: Direct Gmail SMTP → $TEST_EMAIL ═══${NC}"

USER=$(sudo grep '^SMTP_USER=' "$BACKEND/.env" | cut -d= -f2-)
PASS=$(sudo grep '^SMTP_PASS=' "$BACKEND/.env" | cut -d= -f2- | tr -d '[:space:]')

cat > /tmp/direct-email.js << 'JSEOF'
const nodemailer = require('/var/www/huongdi/backend/node_modules/nodemailer');

const t = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

t.sendMail({
  from: `Sol La Bàn Test <${process.env.EMAIL_USER}>`,
  to: process.env.TEST_TO,
  subject: '🧭 Test Email Sol — ' + new Date().toISOString(),
  text: 'Đây là email test từ Sol Backend. Nếu anh nhận được → SMTP hoạt động.',
  html: '<h2>🎉 Sol Test Email</h2><p>SMTP hoạt động OK. Timestamp: ' + new Date().toISOString() + '</p>',
})
  .then(info => {
    console.log('✅ Sent OK');
    console.log('   MessageId:', info.messageId);
    console.log('   Accepted:', JSON.stringify(info.accepted));
    console.log('   Response:', info.response);
  })
  .catch(e => {
    console.log('❌ FAILED:', e.message);
    console.log('   Code:', e.code);
  });
JSEOF

EMAIL_USER="$USER" EMAIL_PASS="$PASS" TEST_TO="$TEST_EMAIL" node /tmp/direct-email.js
rm -f /tmp/direct-email.js
echo ""

# ─── Test 2: Call Sol API endpoint ─────────────────
echo -e "${CYAN}═══ TEST 2: Sol API /forgot-password ═══${NC}"

echo "{\"email\":\"$TEST_EMAIL\"}" > /tmp/forgot-body.json
RES=$(curl -s -X POST http://localhost:4001/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  --data @/tmp/forgot-body.json)
echo "  API Response: $RES"
rm -f /tmp/forgot-body.json

echo ""
echo -e "${YELLOW}Chờ 5 giây cho email async...${NC}"
sleep 5

# ─── Test 3: Check PM2 logs mới nhất ──────────────
echo -e "${CYAN}═══ TEST 3: PM2 logs (last 20) ═══${NC}"
pm2 logs huongdi-api --lines 20 --nostream --err 2>&1 | tail -25
echo ""
echo -e "${CYAN}--- STDOUT ---${NC}"
pm2 logs huongdi-api --lines 10 --nostream --out 2>&1 | tail -15

# ─── Test 4: DB reset tokens ─────────────────────
echo ""
echo -e "${CYAN}═══ TEST 4: DB password_reset_tokens ═══${NC}"
sudo -u postgres psql huongdi_prod << 'SQLEOF'
SELECT
  LEFT(token, 20) as token_prefix,
  u.email,
  created_at,
  expires_at,
  used_at
FROM password_reset_tokens t
JOIN users u ON u.id = t.user_id
ORDER BY created_at DESC
LIMIT 3;
SQLEOF

echo ""
echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Kiểm tra:${NC}"
echo -e "  1. TEST 1 → check inbox $TEST_EMAIL — email 'Test Email Sol'"
echo -e "  2. TEST 2 → check inbox $TEST_EMAIL — email 'Đặt lại mật khẩu'"
echo -e "  3. Nếu TEST 1 đến, TEST 2 không → Sol code bug"
echo -e "  4. Nếu cả 2 đều không đến → check Gmail Sent folder"
