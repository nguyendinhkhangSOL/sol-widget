#!/bin/bash
# Fix login redirect — không auto jump sang adminhuongdi
set -e

PUBLIC="/var/www/huongdi/public"

echo "═══ Fix login redirect logic ═══"

# Đổi logic trong dang-nhap/index.html:
# - Admin role → redirect /toi/ (dashboard user, không cross-domain)
# - User có thể tự click link tới admin panel nếu cần

python3 << 'PYEOF'
import re

fpath = '/var/www/huongdi/public/dang-nhap/index.html'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Replace admin-role auto redirect với /toi/
# Pattern: if (ADMIN_ROLES.includes(role)) { dest = 'https://adminhuongdi.sol.vn/'; }
patterns = [
    (r"if\s*\(\s*ADMIN_ROLES\.includes\(role\)\s*\)\s*\{\s*dest\s*=\s*'https://adminhuongdi\.sol\.vn/'\s*;\s*\}",
     "// Admin role → vẫn giữ ở huongdi.sol.vn, user tự navigate\n      // (removed cross-domain auto-redirect)"),
    (r"dest\s*=\s*'https://adminhuongdi\.sol\.vn/'",
     "dest = '/toi/'"),
]

for pat, repl in patterns:
    new_content, n = re.subn(pat, repl, content)
    if n > 0:
        content = new_content
        print(f"  ✅ Removed {n} admin redirect(s)")

# Đảm bảo default redirect vào /toi/
default_replace = re.sub(
    r"let dest = '/la-ban-huong-di/';",
    "let dest = '/toi/';",
    content
)
if default_replace != content:
    content = default_replace
    print("  ✅ Default redirect đổi thành /toi/")

if content != original:
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ dang-nhap/index.html patched")
else:
    print("  ⏭  No changes needed")

# Show final redirect logic
import re
m = re.search(r"let dest.*?;.*?setTimeout", content, re.DOTALL)
if m:
    print("\n  Redirect logic:")
    print("  " + m.group(0)[:400].replace("\n", "\n  "))
PYEOF

echo ""
echo "✅ Login redirect fixed → luôn về /toi/"
