#!/bin/bash
# Diagnostic: Xem code button "Đã lưu" trong la-ban-huong-di

PUBLIC="/var/www/huongdi/public"

echo "═══ Save direction button — code hiện tại ═══"
echo ""
echo "── 1. Search cho button save trong HTML ──"
grep -n "Đã lưu\|Lưu direction\|saveDirection\|SolSaveDirection" "$PUBLIC/la-ban-huong-di/index.html" | head -15

echo ""
echo "── 2. Show context xung quanh ──"
python3 << 'PYEOF'
with open('/var/www/huongdi/public/la-ban-huong-di/index.html', 'r') as f:
    content = f.read()

# Find save patterns
import re
patterns = ['SolSaveDirection', 'onclick.*save', 'Đã lưu', 'Lưu direction']
for pat in patterns:
    for m in re.finditer(pat, content):
        start = max(0, m.start() - 100)
        end = min(len(content), m.end() + 200)
        print(f"\n── Pattern '{pat}' at pos {m.start()} ──")
        print(content[start:end])
        print("...")
        break  # Only first match
PYEOF
