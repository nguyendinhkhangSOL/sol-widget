#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PHASE 4: Deploy Frontend (Public + Admin)
#   - /dang-ky/ (new Free register)
#   - /dang-nhap/ (updated unified login)
#   - Admin SPA: rebuild với JWT unified logic
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

PUBLIC="/var/www/huongdi/public"

echo ""
echo -e "${CYAN}═══ PHASE 4: FRONTEND DEPLOY ═══${NC}"
echo ""

# ─── 1. Backup old pages ─────────────────────────────────────
echo -e "${YELLOW}[1/5] Backup pages hiện tại...${NC}"
BACKUP_DIR="/var/backups/huongdi/frontend-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"
sudo chown $(whoami):$(whoami) "$BACKUP_DIR"
[ -f "$PUBLIC/dang-nhap.html" ] && sudo cp "$PUBLIC/dang-nhap.html" "$BACKUP_DIR/" || true
[ -f "$PUBLIC/dang-ky.html" ] && sudo cp "$PUBLIC/dang-ky.html" "$BACKUP_DIR/" || true
[ -d "$PUBLIC/dang-nhap" ] && sudo cp -r "$PUBLIC/dang-nhap" "$BACKUP_DIR/" || true
[ -d "$PUBLIC/dang-ky" ] && sudo cp -r "$PUBLIC/dang-ky" "$BACKUP_DIR/" || true
sudo chown -R $(whoami):$(whoami) "$BACKUP_DIR"
echo -e "    ${GREEN}✅ Backup at $BACKUP_DIR${NC}"

# ─── 2. Deploy /dang-ky/ ─────────────────────────────────────
echo -e "${YELLOW}[2/5] Deploy /dang-ky/index.html...${NC}"
sudo mkdir -p "$PUBLIC/dang-ky"
if [ -f /tmp/dang-ky.html ]; then
    sudo cp /tmp/dang-ky.html "$PUBLIC/dang-ky/index.html"
    echo -e "    ${GREEN}✅ dang-ky deployed${NC}"
else
    echo -e "    ${RED}❌ /tmp/dang-ky.html not found — scp trước${NC}"
    exit 1
fi

# ─── 3. Deploy /dang-nhap/ (updated) ─────────────────────────
echo -e "${YELLOW}[3/5] Deploy /dang-nhap/index.html...${NC}"
sudo mkdir -p "$PUBLIC/dang-nhap"
if [ -f /tmp/dang-nhap.html ]; then
    sudo cp /tmp/dang-nhap.html "$PUBLIC/dang-nhap/index.html"
    echo -e "    ${GREEN}✅ dang-nhap updated${NC}"
else
    echo -e "    ${RED}❌ /tmp/dang-nhap.html not found${NC}"
    exit 1
fi

# ─── 4. Test HTTP access ─────────────────────────────────────
echo -e "${YELLOW}[4/5] Verify HTTP access...${NC}"
for path in "dang-ky" "dang-nhap"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://huongdi.sol.vn/$path/")
    if [ "$CODE" = "200" ]; then
        echo -e "    ${GREEN}✅ /$path/ → HTTP $CODE${NC}"
    else
        echo -e "    ${YELLOW}⚠  /$path/ → HTTP $CODE${NC}"
    fi
done

# ─── 5. Reload nginx (nếu cần cache purge) ───────────────────
echo -e "${YELLOW}[5/5] Reload nginx...${NC}"
sudo nginx -s reload 2>/dev/null || sudo systemctl reload nginx
echo -e "    ${GREEN}✅ Nginx reloaded${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PHASE 4 COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test manually:${NC}"
echo -e "  • https://huongdi.sol.vn/dang-ky/    → Free register form"
echo -e "  • https://huongdi.sol.vn/dang-nhap/  → Login (unified)"
echo -e "  • https://adminhuongdi.sol.vn/login  → Admin (dùng chung endpoint)"
