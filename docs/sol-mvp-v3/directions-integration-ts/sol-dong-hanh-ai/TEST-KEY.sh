#!/bin/bash
# Test Anthropic key trực tiếp — không qua Sol code

KEY=$(sudo grep '^ANTHROPIC_API_KEY=' /var/www/huongdi/backend/.env | cut -d= -f2- | tr -d '[:space:]')

echo "═══ Anthropic Key Diagnostic ═══"
echo "Key length: ${#KEY}"
echo "First 25 chars: ${KEY:0:25}"
echo "Last 15 chars: ${KEY: -15}"
echo ""

echo "═══ Direct API test ═══"
RESPONSE=$(curl -s -w "\n[HTTP %{http_code}]" https://api.anthropic.com/v1/messages \
  -H "x-api-key: $KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-haiku-20241022","max_tokens":30,"messages":[{"role":"user","content":"Say hi in 3 words"}]}')

echo "$RESPONSE"
echo ""

echo "═══ Diagnosis ═══"
if echo "$RESPONSE" | grep -q "\"content\""; then
    echo "✅ KEY OK — Sol code có vấn đề"
elif echo "$RESPONSE" | grep -q "authentication_error"; then
    echo "❌ KEY INVALID — Recreate key trong Anthropic Console"
elif echo "$RESPONSE" | grep -q "insufficient_credit\|billing"; then
    echo "❌ NO CREDIT — Nạp credit vào Anthropic Console"
elif echo "$RESPONSE" | grep -q "rate_limit"; then
    echo "❌ RATE LIMITED — chờ vài phút"
else
    echo "⚠  Unknown error — check response above"
fi
