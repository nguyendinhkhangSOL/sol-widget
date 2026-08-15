#!/bin/bash
# ============================================================
# TOÀN TRÌNH — AI bóc tách CV: thêm route backend + cập nhật FE
# Chạy TRÊN SERVER sau khi clone repo mới. CHỈ THÊM, không đè.
# ============================================================
set -e
BE=/var/www/huongdi/backend
HERE="$(cd "$(dirname "$0")" && pwd)"       # .../huongdi-backend-latest/toan-trinh-deploy
SRC="$(cd "$HERE/.." && pwd)"                # .../huongdi-backend-latest (clone)
ROOT="$(cd "$SRC/.." && pwd)"                # .../sol-widget (clone)

echo "▶ 1) Copy route AI bóc tách CV + AI đọc JD"
cp "$SRC/src/routes/profile-cv.ts"     "$BE/src/routes/profile-cv.ts"
cp "$SRC/src/routes/profile-target.ts" "$BE/src/routes/profile-target.ts"

echo "▶ 2) Đăng ký route vào index.ts (nếu chưa)"
python3 - "$BE/src/index.ts" <<'PY'
import sys,re
p=sys.argv[1]; t=open(p,encoding='utf-8').read()
if 'profile-cv' in t:
    print('   đã đăng ký rồi'); sys.exit(0)
assert "profile-laban'" in t, 'KHÔNG thấy neo import profile-laban'
t=t.replace("import { labanRouter } from './routes/profile-laban';",
            "import { labanRouter } from './routes/profile-laban';\nimport { cvParseRouter } from './routes/profile-cv';",1)
m=re.search(r"app\.use\(['\"]/api/profile/laban['\"],\s*labanRouter\);", t)
assert m, 'KHÔNG thấy neo app.use laban'
t=t[:m.end()]+"\napp.use('/api/profile', cvParseRouter);"+t[m.end():]
open(p,'w',encoding='utf-8').write(t)
print('   ✓ đã thêm cvParseRouter')
PY

echo "▶ 3) Thêm cột muc_do vào profile_skills (an toàn, IF NOT EXISTS)"
cd "$BE"
cat > /tmp/sol_muc_do.sql <<'SQL'
ALTER TABLE profile_skills ADD COLUMN IF NOT EXISTS muc_do text;
SQL
npx prisma db execute --file /tmp/sol_muc_do.sql --schema prisma/schema.prisma && echo "   ✓ cột muc_do OK"

echo "▶ 4) Vá schema.prisma (thêm field mucDo nếu chưa có)"
python3 - "$BE/prisma/schema.prisma" <<'PY'
import sys
p=sys.argv[1]; t=open(p,encoding='utf-8').read()
if 'muc_do' in t:
    print('   đã có mucDo rồi'); sys.exit(0)
anchor='  skillCode  String              @map("skill_code")'
if anchor in t:
    t=t.replace(anchor, anchor+'\n  mucDo      String?             @map("muc_do")',1)
    open(p,'w',encoding='utf-8').write(t); print('   ✓ đã thêm mucDo')
else:
    # dự phòng: neo lỏng hơn
    import re
    m=re.search(r'(skillCode\s+String\s+@map\("skill_code"\))', t)
    if m:
        t=t[:m.end()]+'\n  mucDo      String?             @map("muc_do")'+t[m.end():]
        open(p,'w',encoding='utf-8').write(t); print('   ✓ đã thêm mucDo (neo lỏng)')
    else:
        print('   ⚠ KHÔNG thấy neo skill_code — kiểm tra thủ công'); sys.exit(1)
PY

echo "▶ 5) prisma generate + Build backend + khởi động lại"
npx prisma generate
npm run build
pm2 restart huongdi-api

echo "▶ 6) Cập nhật trang FE (Toàn Trình)"
sudo cp "$ROOT/huongdi-public/toan-trinh/index.html" /var/www/huongdi/public/toan-trinh/index.html

echo "✅ XONG — mở lại https://huongdi.sol.vn/toan-trinh/ (F5). Nếu ▶3 build đỏ: web vẫn chạy bản cũ, chụp cho em."
