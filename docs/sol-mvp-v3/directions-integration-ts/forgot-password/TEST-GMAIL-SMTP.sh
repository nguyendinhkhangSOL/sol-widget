#!/bin/bash
# Test Gmail SMTP với password trong .env

KEY=$(sudo grep '^SMTP_PASS=' /var/www/huongdi/backend/.env | cut -d= -f2- | tr -d '[:space:]')
USER=$(sudo grep '^SMTP_USER=' /var/www/huongdi/backend/.env | cut -d= -f2-)

echo "═══ Gmail SMTP Test ═══"
echo "User: $USER"
echo "Pass length: ${#KEY} chars"
echo "Pass preview: ${KEY:0:4}...${KEY: -4}"
echo ""

cat > /tmp/gmail-test.js << 'JSEOF'
const nodemailer = require('/var/www/huongdi/backend/node_modules/nodemailer');

const t = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.TEST_USER,
    pass: process.env.TEST_PASS,
  },
});

t.verify()
  .then(() => console.log('✅ SMTP OK — password đúng, Gmail chấp nhận'))
  .catch(e => console.log('❌ FAIL:', e.message, e.code || ''));
JSEOF

TEST_USER="$USER" TEST_PASS="$KEY" node /tmp/gmail-test.js
rm -f /tmp/gmail-test.js
