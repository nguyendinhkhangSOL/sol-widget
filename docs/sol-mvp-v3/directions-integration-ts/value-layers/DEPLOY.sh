#!/bin/bash
# Deploy Layer 1 + Layer 3
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"
NEW_VER=$(date +%s)

echo -e "${CYAN}═══ DEPLOY: Bản đồ hướng đi + Prompt Studio MVP ═══${NC}"

# ─── Layer 1: Bản đồ hướng đi ───────────────────────────
echo -e "${YELLOW}[1/4] Deploy /toi/ban-do/...${NC}"
sudo mkdir -p "$PUBLIC/toi/ban-do"
if [ -f /tmp/ban-do-index.html ]; then
    sudo cp /tmp/ban-do-index.html "$PUBLIC/toi/ban-do/index.html"
    echo -e "    ${GREEN}✅ /toi/ban-do/ deployed${NC}"
fi

# ─── Layer 3: Prompt Studio MVP ─────────────────────────
echo -e "${YELLOW}[2/4] Deploy /prompts-studio/...${NC}"
sudo mkdir -p "$PUBLIC/prompts-studio"
if [ -f /tmp/prompts-studio-index.html ]; then
    sudo cp /tmp/prompts-studio-index.html "$PUBLIC/prompts-studio/index.html"
    echo -e "    ${GREEN}✅ /prompts-studio/ deployed${NC}"
fi

# ─── Verify HTTP ────────────────────────────────────────
echo -e "${YELLOW}[3/4] Verify HTTP access...${NC}"
for path in "toi/ban-do" "prompts-studio"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://huongdi.sol.vn/$path/")
    [ "$CODE" = "200" ] && echo -e "    ${GREEN}✅ /$path/ → HTTP $CODE${NC}" || echo -e "    ⚠ /$path/ → HTTP $CODE"
done

# ─── Add CTA vào /toi/ dashboard ────────────────────────
echo -e "${YELLOW}[4/4] Inject CTA vào dashboard /toi/...${NC}"
if [ -f "$PUBLIC/toi/index.html" ]; then
    # Add CTA cards vào cuối summary-grid (nếu chưa có)
    if ! grep -q "ban-do\|prompts-studio" "$PUBLIC/toi/index.html"; then
        sudo cp "$PUBLIC/toi/index.html" /tmp/toi-work.html
        sudo chown $(whoami) /tmp/toi-work.html

        python3 << 'PYEOF'
import re
fpath = '/tmp/toi-work.html'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

cta_html = '''
  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px; margin-bottom:24px;">
    <a href="/toi/ban-do/" style="text-decoration:none; padding:20px; background:linear-gradient(135deg, #FEF3C7, #FDE68A); border-radius:12px; border-left:4px solid #F59E0B; color:#0F172A; display:block;">
      <div style="font-size:32px; margin-bottom:8px;">🗺</div>
      <div style="font-size:16px; font-weight:700;">Bản đồ hướng đi</div>
      <div style="font-size:13px; color:#78350F; margin-top:4px;">In PDF · Chia sẻ · Treo tường</div>
    </a>
    <a href="/prompts-studio/" style="text-decoration:none; padding:20px; background:linear-gradient(135deg, #E9D5FF, #C4B5FD); border-radius:12px; border-left:4px solid #8B5CF6; color:#0F172A; display:block;">
      <div style="font-size:32px; margin-bottom:8px;">🎨</div>
      <div style="font-size:16px; font-weight:700;">Prompt Studio</div>
      <div style="font-size:13px; color:#5B21B6; margin-top:4px;">Tự tạo 40 prompt AI cá nhân hoá</div>
    </a>
    <a href="/prompts/" style="text-decoration:none; padding:20px; background:linear-gradient(135deg, #DBEAFE, #BFDBFE); border-radius:12px; border-left:4px solid #3B82F6; color:#0F172A; display:block;">
      <div style="font-size:32px; margin-bottom:8px;">📚</div>
      <div style="font-size:16px; font-weight:700;">Prompt Library</div>
      <div style="font-size:13px; color:#1E40AF; margin-top:4px;">40 template có sẵn</div>
    </a>
  </div>
'''

# Insert AFTER <div class="summary-grid"...</div>
new_content = re.sub(
    r'(<div class="summary-grid"[^>]*id="summaryGrid"[^>]*></div>)',
    r'\1\n' + cta_html,
    content
)

if new_content != content:
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("  ✅ Injected CTA cards vào dashboard")
else:
    print("  ⏭ CTA insertion pattern not found")
PYEOF
        sudo cp /tmp/toi-work.html "$PUBLIC/toi/index.html"
        sudo chown www-data:www-data "$PUBLIC/toi/index.html" 2>/dev/null || true
        rm -f /tmp/toi-work.html
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Layer 1 + 3 DEPLOYED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test:${NC}"
echo -e "  📍 https://huongdi.sol.vn/toi/         — Dashboard với 3 CTA mới"
echo -e "  🗺 https://huongdi.sol.vn/toi/ban-do/   — Bản đồ in PDF"
echo -e "  🎨 https://huongdi.sol.vn/prompts-studio/ — Prompt Studio MVP (10 template)"
