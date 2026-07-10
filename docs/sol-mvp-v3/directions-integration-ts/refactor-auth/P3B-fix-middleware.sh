#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# P3B: Fix middleware/auth.ts — restore + proper brace-matching patch
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
MW_TS="$BACKEND/src/middleware/auth.ts"

echo -e "${CYAN}═══ P3B: Fix middleware/auth.ts ═══${NC}"

# ─── 1. Restore middleware from P1 backup ───────────────────
echo -e "${YELLOW}[1/4] Restore middleware/auth.ts from P1 backup...${NC}"
LATEST_BACKUP=$(ls -td /var/backups/huongdi/refactor-auth-* 2>/dev/null | head -1)
if [ -f "$LATEST_BACKUP/middleware.bak/auth.ts" ]; then
    sudo cp "$LATEST_BACKUP/middleware.bak/auth.ts" "$MW_TS"
    sudo chown $(stat -c '%U:%G' "$BACKEND/src/") "$MW_TS"
    echo -e "    ${GREEN}✅ Restored${NC}"
else
    echo -e "    ${RED}❌ Backup không tìm thấy: $LATEST_BACKUP/middleware.bak/auth.ts${NC}"
    exit 1
fi

# ─── 2. Show current requireAdmin ────────────────────────────
echo -e "${YELLOW}[2/4] Show current requireAdmin function:${NC}"
grep -n -B 1 -A 15 "requireAdmin" "$MW_TS" | head -30

# ─── 3. Patch using proper brace matching ────────────────────
echo -e "${YELLOW}[3/4] Patch requireAdmin (brace-matched)...${NC}"

python3 << 'PYEOF'
import re

FILEPATH = '/var/www/huongdi/backend/src/middleware/auth.ts'
with open(FILEPATH, 'r') as f:
    content = f.read()

# Find function requireAdmin — support both:
#   export const requireAdmin = (req, res, next) => { ... }
#   export function requireAdmin(req, res, next) { ... }
#   export const requireAdmin: RequestHandler = (req, res, next) => { ... }
patterns = [
    # Arrow function
    r'(export\s+const\s+requireAdmin[^=]*=\s*(?:async\s+)?\([^)]*\)[^{]*=>\s*\{)',
    # Regular function
    r'(export\s+(?:async\s+)?function\s+requireAdmin\s*\([^)]*\)[^{]*\{)',
]

new_body = '''
  const role = (req as any).user?.role;
  const type = (req as any).user?.type;
  const ADMIN_ROLES = ['SUPER_ADMIN', 'RESEARCH_EDITOR', 'CONTENT_EDITOR', 'ANALYST'];
  const isAdmin = role && ADMIN_ROLES.includes(role);
  const isLegacyAdmin = type === 'admin';
  if (!isAdmin && !isLegacyAdmin) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
  }
  next();
}'''

replaced = False
for pat in patterns:
    m = re.search(pat, content)
    if not m:
        continue

    start = m.end()  # position right after opening {
    # Now find matching closing brace via depth counting
    depth = 1
    i = start
    while i < len(content) and depth > 0:
        c = content[i]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                end = i + 1  # include closing brace
                # Replace function body (between opening { and closing })
                new_content = content[:m.start()] + m.group(1) + new_body + content[end:]
                content = new_content
                replaced = True
                print(f"✅ Replaced requireAdmin (found via pattern: {pat[:40]}...)")
                break
        i += 1

    if replaced:
        break

if not replaced:
    print("⚠️  requireAdmin function not found — showing snippet:")
    idx = content.find('requireAdmin')
    print(content[max(0, idx-50):idx+300] if idx >= 0 else "NOT FOUND AT ALL")
else:
    with open(FILEPATH, 'w') as f:
        f.write(content)
PYEOF

# ─── 4. Build test ───────────────────────────────────────────
echo -e "${YELLOW}[4/4] Test npm run build...${NC}"
cd "$BACKEND"
set +e
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ] || echo "$BUILD_LOG" | grep -q "error TS"; then
    echo -e "${RED}❌ Build FAILED:${NC}"
    echo "$BUILD_LOG" | tail -50
    exit 1
fi

echo -e "${GREEN}✅ Build OK${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "${GREEN}✅ PM2 restarted${NC}"
