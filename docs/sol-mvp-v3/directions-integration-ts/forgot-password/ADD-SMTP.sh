#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ADD SMTP CONFIG — Interactive script, không cần sudo nano
# Chạy: bash ADD-SMTP.sh
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
echo -e "${CYAN}   ADD SMTP CONFIG — Zoho Mail cho Sol La Bàn         ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

# ─── Prompt user cho App Password ────────────────────
echo -e "${YELLOW}Đăng nhập vào Zoho Mail bằng noreply@sol.vn tại:${NC}"
echo -e "  https://mail.zoho.com/"
echo ""
echo -e "${YELLOW}Vào Avatar → My Account → Security → App Passwords${NC}"
echo -e "${YELLOW}Generate password mới cho 'Sol Backend SMTP'${NC}"
echo -e "${YELLOW}Copy password 16 ký tự (dạng: abcd-efgh-ijkl-mnop)${NC}"
echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────${NC}"
read -p "Paste Zoho App Password vào đây rồi Enter: " APP_PASS
echo ""

# Validate
APP_PASS=$(echo "$APP_PASS" | tr -d '[:space:]')
if [ -z "$APP_PASS" ]; then
    echo -e "${RED}❌ Không có password. Thoát.${NC}"
    exit 1
fi
if [ ${#APP_PASS} -lt 10 ]; then
    echo -e "${RED}❌ Password quá ngắn (${#APP_PASS} chars). Thử lại.${NC}"
    exit 1
fi

echo -e "${CYAN}Password nhận được: ${APP_PASS:0:4}...${APP_PASS: -4} (${#APP_PASS} chars)${NC}"
echo ""

# ─── Remove existing SMTP config (nếu có) ────────────
echo -e "${YELLOW}[1/3] Xoá SMTP config cũ (nếu có)...${NC}"
sudo sed -i '/^SMTP_HOST=/d' "$ENV_FILE"
sudo sed -i '/^SMTP_PORT=/d' "$ENV_FILE"
sudo sed -i '/^SMTP_USER=/d' "$ENV_FILE"
sudo sed -i '/^SMTP_PASS=/d' "$ENV_FILE"
sudo sed -i '/^SMTP_FROM=/d' "$ENV_FILE"
sudo sed -i '/^APP_URL=/d' "$ENV_FILE"
echo -e "    ${GREEN}✅ Cleaned${NC}"

# ─── Add SMTP config ─────────────────────────────────
echo -e "${YELLOW}[2/3] Add SMTP config mới...${NC}"

sudo tee -a "$ENV_FILE" > /dev/null << EOF

# ─── SMTP Config (Zoho Mail) ──────────────
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=noreply@sol.vn
SMTP_PASS=$APP_PASS
SMTP_FROM=Sol La Bàn <noreply@sol.vn>
APP_URL=https://huongdi.sol.vn
EOF

echo -e "    ${GREEN}✅ SMTP config added${NC}"

# ─── Restart PM2 + Verify ────────────────────────────
echo -e "${YELLOW}[3/3] Restart PM2 + Verify...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2

# Verify không leak password
sudo grep -E '^SMTP_(HOST|PORT|USER|FROM)|^APP_URL' "$ENV_FILE" | head -5
echo -e "  SMTP_PASS=${APP_PASS:0:4}...${APP_PASS: -4} (hidden)"

echo ""

# ─── Test send email ──────────────────────────────
echo -e "${CYAN}Test gửi email...${NC}"
read -p "Nhập email nhận test (Enter để skip): " TEST_EMAIL

if [ -n "$TEST_EMAIL" ]; then
    RES=$(curl -s -X POST http://localhost:4001/api/auth/forgot-password \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$TEST_EMAIL\"}")

    echo -e "  API Response: $RES"

    # Wait for send
    sleep 3

    # Check PM2 logs cho email error
    ERROR=$(pm2 logs huongdi-api --lines 20 --nostream --err | grep -i "email\|smtp" | tail -3)
    if [ -n "$ERROR" ]; then
        echo -e "${RED}⚠  Có error trong log:${NC}"
        echo "$ERROR"
    else
        echo -e "${GREEN}✅ Không có error. Check inbox $TEST_EMAIL (kể cả Spam).${NC}"
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SMTP CONFIG ADDED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test browser:${NC}"
echo -e "  https://huongdi.sol.vn/quen-mat-khau/"
echo -e "  Nhập email → nhận link đặt lại"
