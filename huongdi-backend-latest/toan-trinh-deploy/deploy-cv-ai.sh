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

echo "▶ 3) Migration an toàn: cột muc_do + bảng ho_so_hoan_thien (IF NOT EXISTS)"
cd "$BE"
cat > /tmp/sol_hoanthien.sql <<'SQL'
ALTER TABLE profile_skills ADD COLUMN IF NOT EXISTS muc_do text;
ALTER TABLE cv_documents  ADD COLUMN IF NOT EXISTS target_id text;
CREATE TABLE IF NOT EXISTS ho_so_hoan_thien (
  id text PRIMARY KEY,
  profile_id text NOT NULL,
  target_id text,
  skill_code text NOT NULL,
  kind text NOT NULL,
  goi_y text,
  status text NOT NULL DEFAULT 'CHUA_LAM',
  created_at timestamp(3) NOT NULL DEFAULT now(),
  updated_at timestamp(3) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ho_so_hoan_thien_profile_skill_uq ON ho_so_hoan_thien(profile_id, skill_code);
SQL
npx prisma db execute --file /tmp/sol_hoanthien.sql --schema prisma/schema.prisma && echo "   ✓ migration OK"

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

echo "▶ 4b) Thêm model HoSoHoanThien vào schema.prisma (nếu chưa có)"
python3 - "$BE/prisma/schema.prisma" <<'PY'
import sys
p=sys.argv[1]; t=open(p,encoding='utf-8').read()
if 'HoSoHoanThien' in t:
    print('   đã có model HoSoHoanThien'); sys.exit(0)
block='''
model HoSoHoanThien {
  id         String   @id @default(uuid())
  profileId  String   @map("profile_id")
  targetId   String?  @map("target_id")
  skillCode  String   @map("skill_code")
  kind       String
  goiY       String?  @map("goi_y")
  status     String   @default("CHUA_LAM")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  @@unique([profileId, skillCode])
  @@map("ho_so_hoan_thien")
}
'''
open(p,'a',encoding='utf-8').write(block)
print('   ✓ đã thêm model HoSoHoanThien')
PY

echo "▶ 4c) Thêm field targetId vào model CvDocument (nếu chưa có)"
python3 - "$BE/prisma/schema.prisma" <<'PY'
import sys,re
p=sys.argv[1]; t=open(p,encoding='utf-8').read()
m=re.search(r'model CvDocument \{[\s\S]*?\n\}', t)
if not m:
    print('   ⚠ không thấy model CvDocument — bỏ qua'); sys.exit(0)
if 'targetId' in m.group(0):
    print('   đã có targetId (CvDocument)'); sys.exit(0)
anchor='  parsedText  String?    @map("parsed_text")'
if anchor in m.group(0):
    blk=m.group(0).replace(anchor, anchor+'\n  targetId    String?    @map("target_id")',1)
    t=t[:m.start()]+blk+t[m.end():]
    open(p,'w',encoding='utf-8').write(t); print('   ✓ đã thêm targetId (CvDocument)')
else:
    print('   ⚠ không thấy neo parsed_text — kiểm tra thủ công')
PY

echo "▶ 5) prisma generate + Build backend + khởi động lại"
npx prisma generate
npm run build
pm2 restart huongdi-api

echo "▶ 6) Cập nhật trang FE (Toàn Trình)"
sudo cp "$ROOT/huongdi-public/toan-trinh/index.html" /var/www/huongdi/public/toan-trinh/index.html

echo "✅ XONG — mở lại https://huongdi.sol.vn/toan-trinh/ (F5). Nếu ▶3 build đỏ: web vẫn chạy bản cũ, chụp cho em."
