#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PHASE 5: E2E Test All Auth Flows
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

API="http://localhost:4001/api"
TIMESTAMP=$(date +%s)
TEST_PHONE="09$(shuf -i 10000000-99999999 -n 1)"
TEST_EMAIL="test-$TIMESTAMP@sol.vn"
TEST_PASSWORD="TestSol2026!"
ADMIN_EMAIL="admin@sol.vn"
ADMIN_PASSWORD="${1:-huongdi2026!}"

PASS=0
FAIL=0
JWT_USER=""
JWT_ADMIN=""

pass() { echo -e "  ${GREEN}✅ $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}❌ $1${NC}"; FAIL=$((FAIL+1)); }

echo ""
echo -e "${CYAN}═══ PHASE 5: E2E AUTH TESTS ═══${NC}"
echo ""

# ─── TEST 1: FREE Register ───────────────────────────────────
echo -e "${YELLOW}[TEST 1/8] POST /api/user/register (FREE)${NC}"
RES=$(curl -s -X POST "$API/user/register" \
  -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$TEST_PHONE\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"E2E Test\"}")
if echo "$RES" | grep -q '"success":true'; then
    JWT_USER=$(echo "$RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
    pass "Register success — JWT length: ${#JWT_USER}"
else
    fail "Register failed: $RES"
fi

# ─── TEST 2: Unified Login (FREE user) ───────────────────────
echo -e "${YELLOW}[TEST 2/8] POST /api/auth/login-v2 (by phone)${NC}"
RES=$(curl -s -X POST "$API/auth/login-v2" \
  -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$TEST_PHONE\",\"password\":\"$TEST_PASSWORD\"}")
if echo "$RES" | grep -q '"success":true'; then
    ROLE=$(echo "$RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['role'])")
    TIER=$(echo "$RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['tier'])")
    pass "Login OK — role=$ROLE tier=$TIER"
else
    fail "Login failed: $RES"
fi

# ─── TEST 3: Login by email ──────────────────────────────────
echo -e "${YELLOW}[TEST 3/8] POST /api/auth/login-v2 (by email)${NC}"
RES=$(curl -s -X POST "$API/auth/login-v2" \
  -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
echo "$RES" | grep -q '"success":true' && pass "Login by email OK" || fail "Login by email failed"

# ─── TEST 4: Wrong password ──────────────────────────────────
echo -e "${YELLOW}[TEST 4/8] Login sai password (should 401)${NC}"
RES=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login-v2" \
  -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$TEST_PHONE\",\"password\":\"WRONG\"}")
CODE=$(echo "$RES" | tail -1)
[ "$CODE" = "401" ] && pass "Wrong password rejected (401)" || fail "Expected 401, got $CODE"

# ─── TEST 5: Duplicate register ──────────────────────────────
echo -e "${YELLOW}[TEST 5/8] Duplicate register (should 409)${NC}"
RES=$(curl -s -w "\n%{http_code}" -X POST "$API/user/register" \
  -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$TEST_PHONE\",\"password\":\"$TEST_PASSWORD\"}")
CODE=$(echo "$RES" | tail -1)
[ "$CODE" = "409" ] && pass "Duplicate rejected (409)" || fail "Expected 409, got $CODE"

# ─── TEST 6: Admin login (alias endpoint) ────────────────────
echo -e "${YELLOW}[TEST 6/8] POST /api/auth/admin/login${NC}"
RES=$(curl -s -X POST "$API/auth/admin/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
if echo "$RES" | grep -q '"success":true'; then
    JWT_ADMIN=$(echo "$RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
    ROLE=$(echo "$RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['admin']['role'])")
    pass "Admin login OK — role=$ROLE"
else
    fail "Admin login failed: $RES"
fi

# ─── TEST 7: Admin also works via unified login ──────────────
echo -e "${YELLOW}[TEST 7/8] Admin login via /login-v2 (unified)${NC}"
RES=$(curl -s -X POST "$API/auth/login-v2" \
  -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
if echo "$RES" | grep -q '"success":true'; then
    ROLE=$(echo "$RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['role'])")
    pass "Unified login OK for admin — role=$ROLE"
else
    fail "Unified login failed for admin: $RES"
fi

# ─── TEST 8: /me endpoint ────────────────────────────────────
echo -e "${YELLOW}[TEST 8/8] GET /api/user/me (auth)${NC}"
if [ -n "$JWT_USER" ]; then
    RES=$(curl -s -X GET "$API/user/me" \
      -H "Authorization: Bearer $JWT_USER")
    if echo "$RES" | grep -q '"success":true'; then
        pass "/me endpoint OK"
    else
        fail "/me failed: $RES"
    fi
else
    fail "No JWT to test /me"
fi

# ─── Cleanup: xoá test user ──────────────────────────────────
echo ""
echo -e "${YELLOW}Cleanup — xoá test user...${NC}"
sudo -u postgres psql huongdi_prod -c "DELETE FROM users WHERE phone='$TEST_PHONE' OR email='$TEST_EMAIL';" > /dev/null

# ─── Summary ─────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED ($PASS/$((PASS+FAIL)))${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}🎉 Auth refactor COMPLETE — ready for production${NC}"
    exit 0
else
    echo -e "${RED}❌ FAILED: $FAIL, PASSED: $PASS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    exit 1
fi
