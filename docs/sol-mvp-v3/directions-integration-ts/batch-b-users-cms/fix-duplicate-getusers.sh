#!/bin/bash
# Fix duplicate getUsers function trong api.ts
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

API_TS="/var/www/huongdi/admin/src/utils/api.ts"
ADMIN="/var/www/huongdi/admin"

echo -e "${YELLOW}[1/4] Show duplicate lines...${NC}"
grep -n "^export async function getUsers\|^export function getUsers\|^async function getUsers" "$API_TS"
echo ""

echo -e "${YELLOW}[2/4] Backup api.ts...${NC}"
cp "$API_TS" "$API_TS.bak-dedupe-$(date +%s)"

echo -e "${YELLOW}[3/4] Remove old getUsers (line 57), keep new one (line 127)...${NC}"

python3 << 'PYEOF'
import re

with open('/var/www/huongdi/admin/src/utils/api.ts', 'r') as f:
    content = f.read()

# Find all getUsers function definitions
# Old: export async function getUsers(page: number = 1) { ... }
# New: export async function getUsers(page: number = 1, opts?: { tier?: string; search?: string; limit?: number }) { ... }

# Match function block: from "export async function getUsers" to matching closing brace
pattern = r'export async function getUsers\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}'

matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))
print(f"Found {len(matches)} getUsers definitions")

if len(matches) >= 2:
    # Keep last one (new signature with opts), remove earlier ones
    # Remove earliest match first
    first = matches[0]
    # Also try to remove any leading comment/blank lines
    start = first.start()
    # Look back to find function comment (// ...)
    line_start = content.rfind('\n', 0, start) + 1
    # Remove from beginning of line
    new_content = content[:line_start] + content[first.end() + 1:]  # +1 to skip trailing newline
    with open('/var/www/huongdi/admin/src/utils/api.ts', 'w') as f:
        f.write(new_content)
    print("✅ Removed old getUsers (first occurrence)")
else:
    print("⚠️  Only 1 getUsers found, nothing to dedupe")
PYEOF

echo ""
echo -e "${YELLOW}[4/4] Verify + Build...${NC}"
grep -n "^export async function getUsers" "$API_TS"

cd "$ADMIN"
if npm run build 2>&1 | tail -8 | grep -qi "error TS"; then
    echo -e "${YELLOW}⚠  Still has errors:${NC}"
    npm run build 2>&1 | tail -15
    exit 1
fi
echo -e "${GREEN}✅ Admin built successfully${NC}"
