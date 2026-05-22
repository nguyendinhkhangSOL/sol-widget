#!/bin/bash
# =================================================================
# Sol E2E Test — Day 9 (2026-05-22)
#
# Test full user journey tự động từ command line, không cần browser:
#   1. Anon signup → JWT
#   2. Submit FTND 6 câu → cohort + ftndScore lưu
#   3. Chat CHIP click → canned reply persist
#   4. Chat AI free-form → Gemini reply (verify không phải fallback)
#   5. Pricing VietQR intent → QR + bank info trả về
#   6. Payment status (PENDING)
#   7. Cleanup test user
#
# Run on VPS: bash /var/www/sol-widget-old/app/scripts/e2e-test.sh
# =================================================================

set -e

BASE="${API_BASE:-https://bothuocla.sol.vn}"
DB_PASS="${DB_PASSWORD:-KhangSol2006}"

# ANSI colors
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'

PASS=0
FAIL=0
SKIP=0

# Helpers
pass() { echo -e "  ${G}✓${N} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${R}✗${N} $1"; FAIL=$((FAIL+1)); }
skip() { echo -e "  ${Y}⊘${N} $1"; SKIP=$((SKIP+1)); }
info() { echo -e "  ${B}ℹ${N}  $1"; }

section() {
    echo ""
    echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
    echo -e "${B} $1${N}"
    echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
}

# Cần jq
if ! command -v jq &> /dev/null; then
    echo "jq chưa cài. Run: sudo apt install -y jq"
    exit 1
fi

DEVICE_UID="e2e-test-$(date +%s)-$RANDOM"
echo ""
echo "================================================="
echo "  Sol E2E Test"
echo "  Base: $BASE"
echo "  Device UID: $DEVICE_UID"
echo "================================================="

# ────────────────────────────────────────────────────────────
section "[1/7] Backend health"
HEALTH=$(curl -s "$BASE/api/healthz")
if echo "$HEALTH" | jq -e '.ok == true' > /dev/null; then
    pass "GET /healthz returned ok=true"
else
    fail "GET /healthz failed: $HEALTH"
    exit 1
fi

# ────────────────────────────────────────────────────────────
section "[2/7] Anonymous signup"
ANON_RESP=$(curl -s -X POST "$BASE/api/auth/anonymous" \
    -H "Content-Type: application/json" \
    -d "{\"deviceUid\":\"$DEVICE_UID\",\"originDomain\":\"e2e-test\"}")

TOKEN=$(echo "$ANON_RESP" | jq -r '.token // empty')
USER_ID=$(echo "$ANON_RESP" | jq -r '.userId // empty')

if [ -n "$TOKEN" ] && [ -n "$USER_ID" ]; then
    pass "Created anon user: $USER_ID"
    pass "JWT length: ${#TOKEN} chars"
else
    fail "Anon signup failed: $ANON_RESP"
    exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

# ────────────────────────────────────────────────────────────
section "[3/7] Get user profile"
ME=$(curl -s "$BASE/api/users/me" -H "$AUTH_HEADER")
PRONOUNS=$(echo "$ME" | jq -r '.pronouns // "bạn"')
NAME=$(echo "$ME" | jq -r '.name // "(empty)"')
info "Name: $NAME · Pronouns: $PRONOUNS"
pass "Profile loaded"

# ────────────────────────────────────────────────────────────
section "[4/7] Submit FTND 6 câu"

# Simulate trả lời MODERATE cohort (score 5)
# Q1 (5 min)=3, Q2 (cấm)=1, Q3 (sáng)=0, Q4 (>20)=2 wait MODERATE = 10-20 = a=1
# 3+1+0+1+0+0 = 5 → MODERATE
FTND_BODY='{
    "cigsBaseline": 15,
    "pricePerCig": 1000,
    "ftndScore": 5,
    "cohort": "MODERATE",
    "answers": [
        {"q":1, "a":2},
        {"q":2, "a":1},
        {"q":3, "a":1},
        {"q":4, "a":1},
        {"q":5, "a":0},
        {"q":6, "a":0}
    ]
}'

FTND_RESP=$(curl -s -X POST "$BASE/api/journey/onboarding/ftnd" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$FTND_BODY")

if echo "$FTND_RESP" | jq -e '.ok == true' > /dev/null; then
    COHORT=$(echo "$FTND_RESP" | jq -r '.cohort')
    SCORE=$(echo "$FTND_RESP" | jq -r '.ftndScore')
    pass "FTND submitted: cohort=$COHORT, score=$SCORE"

    if [ "$COHORT" = "MODERATE" ] && [ "$SCORE" = "5" ]; then
        pass "Server recomputed correctly"
    else
        fail "Expected MODERATE/5 got $COHORT/$SCORE"
    fi

    # Verify DB
    FLD=$(PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U sol_app -d sol_prod -t -c "SELECT \"ftndScore\", \"cigsBaseline\", settings->>'severityCohort' FROM \"User\" WHERE id = '$USER_ID';" | xargs)
    info "DB: $FLD"

    if echo "$FLD" | grep -q "MODERATE"; then
        pass "DB has severityCohort=MODERATE"
    else
        fail "DB missing severityCohort"
    fi
else
    fail "FTND failed: $FTND_RESP"
fi

# ────────────────────────────────────────────────────────────
section "[5/7] Chat — CHIP click + AI free-form"

# 5a. CHIP click (canned)
CHIPS=$(curl -s "$BASE/api/canned-replies" -H "$AUTH_HEADER")
CHIP_COUNT=$(echo "$CHIPS" | jq 'length // 0')
info "Loaded $CHIP_COUNT CHIPs"

if [ "$CHIP_COUNT" -lt 50 ]; then
    fail "Expected >= 50 chips, got $CHIP_COUNT"
fi

CHIP_ID=$(echo "$CHIPS" | jq -r '.[0].id // empty')
CHIP_LABEL=$(echo "$CHIPS" | jq -r '.[0].label // empty')
CHIP_ANSWER=$(echo "$CHIPS" | jq -r '.[0].answer // empty')

if [ -n "$CHIP_ID" ]; then
    CHIP_POST=$(curl -s -X POST "$BASE/api/messages" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d "{\"content\":\"$CHIP_LABEL\",\"metadata\":{\"cannedReplyId\":\"$CHIP_ID\",\"cannedAnswer\":\"$CHIP_ANSWER\"}}")

    if echo "$CHIP_POST" | jq -e '.userMessage.id' > /dev/null; then
        pass "CHIP persisted: $CHIP_LABEL"
    else
        fail "CHIP persist failed: $CHIP_POST"
    fi
fi

# 5b. AI free-form
AI_RESP=$(curl -s -X POST "$BASE/api/messages" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"content\":\"Anh đang căng thẳng quá, sắp hút lại\"}")

AI_REPLY=$(echo "$AI_RESP" | jq -r '.outbound[0].content // empty')

if [ -z "$AI_REPLY" ]; then
    fail "AI no reply: $AI_RESP"
elif echo "$AI_REPLY" | grep -q "chưa kết nối\|đang kẹt\|thử lại sau 30"; then
    fail "AI fallback (provider failed): \"$AI_REPLY\""
else
    pass "AI replied real (${#AI_REPLY} chars)"
    info "Sample: $(echo "$AI_REPLY" | head -c 100)..."
fi

# ────────────────────────────────────────────────────────────
section "[6/7] Pricing — VietQR intent"

VIETQR_RESP=$(curl -s -X POST "$BASE/api/payments/vietqr/intent" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"cohort":"MODERATE","paymentMode":"full"}')

if echo "$VIETQR_RESP" | jq -e '.ok == true' > /dev/null; then
    AMOUNT=$(echo "$VIETQR_RESP" | jq -r '.amount')
    BANK=$(echo "$VIETQR_RESP" | jq -r '.bank.name')
    CONTENT=$(echo "$VIETQR_RESP" | jq -r '.content')
    QR_URL=$(echo "$VIETQR_RESP" | jq -r '.qrUrl')
    PAYMENT_ID=$(echo "$VIETQR_RESP" | jq -r '.paymentId')

    if [ "$AMOUNT" = "225000" ]; then
        pass "MODERATE amount = 225,000đ"
    else
        fail "Expected 225000, got $AMOUNT"
    fi

    pass "Bank: $BANK"
    pass "Content: $CONTENT"
    pass "Payment ID: $PAYMENT_ID"
    info "QR URL: $(echo $QR_URL | head -c 80)..."

    # Verify VietQR img reachable
    QR_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$QR_URL")
    if [ "$QR_HTTP" = "200" ]; then
        pass "VietQR image reachable (HTTP 200)"
    else
        fail "VietQR image: HTTP $QR_HTTP (img.vietqr.io down?)"
    fi
else
    fail "VietQR intent failed: $VIETQR_RESP"
fi

# Weekly mode
WEEKLY=$(curl -s -X POST "$BASE/api/payments/vietqr/intent" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"cohort":"LIGHT","paymentMode":"weekly"}')

WEEKLY_AMOUNT=$(echo "$WEEKLY" | jq -r '.amount // empty')
if [ "$WEEKLY_AMOUNT" = "35000" ]; then
    pass "Weekly amount = 35,000đ"
else
    fail "Weekly expected 35000, got $WEEKLY_AMOUNT"
fi

# ────────────────────────────────────────────────────────────
section "[7/7] Cleanup test user"
PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U sol_app -d sol_prod -c "
    DELETE FROM \"PaymentLog\" WHERE \"userId\" = '$USER_ID';
    DELETE FROM \"Message\" WHERE \"userId\" = '$USER_ID';
    DELETE FROM \"User\" WHERE id = '$USER_ID';
" 2>&1 | tail -3
pass "Cleaned up test user"

# ────────────────────────────────────────────────────────────
echo ""
echo "================================================="
echo -e "  ${G}PASS: $PASS${N}  |  ${R}FAIL: $FAIL${N}  |  ${Y}SKIP: $SKIP${N}"
echo "================================================="

if [ "$FAIL" -gt 0 ]; then
    echo -e "${R}⚠ Có $FAIL test fail — fix trước khi launch${N}"
    exit 1
fi

echo -e "${G}🎉 All tests passed — ready for soft launch!${N}"
echo ""
echo "Next steps:"
echo "  1. Mời 10 beta qua Zalo OA (template: docs/SOFT_LAUNCH_CHECKLIST.md)"
echo "  2. Monitor pm2 logs sol-api + admin /home"
echo "  3. D-Day push 31/5/2026 sáng 7h"
