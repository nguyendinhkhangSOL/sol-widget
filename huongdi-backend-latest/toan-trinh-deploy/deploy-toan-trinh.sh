#!/bin/bash
# ============================================================
# TOÀN TRÌNH U40–60 — deploy an toàn (CHỈ CHÈN THÊM, không đè)
# Chạy TRÊN SERVER. Không dùng prisma db push (giữ nguyên bảng SQL thô).
# ============================================================
set -e
BE=/var/www/huongdi/backend
HERE="$(cd "$(dirname "$0")" && pwd)"      # .../huongdi-backend-latest/toan-trinh-deploy
SRC="$(cd "$HERE/.." && pwd)"               # .../huongdi-backend-latest (bản clone)
TS=$(date +%s)

echo "▶ 0) Kiểm tra môi trường"
test -f "$BE/prisma/schema.prisma" || { echo "❌ không thấy $BE/prisma/schema.prisma"; exit 1; }
test -f "$BE/src/index.ts"         || { echo "❌ không thấy $BE/src/index.ts"; exit 1; }
test -f "$HERE/schema-block.prisma"|| { echo "❌ thiếu schema-block.prisma"; exit 1; }
test -f "$HERE/migrate.sql"        || { echo "❌ thiếu migrate.sql"; exit 1; }

echo "▶ 1) Kiểm tra NEO (dừng ngay nếu thiếu, chưa sửa gì)"
grep -qE '@@map\("users"\)'                 "$BE/prisma/schema.prisma" || { echo "❌ không thấy neo @@map(\"users\")"; exit 1; }
grep -qE 'passwordReset.*from|from.*password-reset' "$BE/src/index.ts"  || { echo "❌ không thấy neo import passwordReset"; exit 1; }
grep -qE "app\.use\(.*adminRouter"          "$BE/src/index.ts"          || { echo "❌ không thấy neo app.use adminRouter"; exit 1; }
if grep -q "model JobProfile" "$BE/prisma/schema.prisma"; then echo "⚠ JobProfile đã có — có vẻ đã chạy rồi. Dừng."; exit 1; fi

echo "▶ 2) Backup file server"
cp "$BE/prisma/schema.prisma" "$BE/prisma/schema.prisma.bak-tt-$TS"
cp "$BE/src/index.ts"         "$BE/src/index.ts.bak-tt-$TS"
echo "   backup: schema.prisma.bak-tt-$TS + index.ts.bak-tt-$TS"

echo "▶ 3) Copy 6 route + 4 data (chỉ thêm file mới)"
mkdir -p "$BE/src/data"
cp "$SRC/src/routes/profile-hoso.ts" "$SRC/src/routes/profile-target.ts" \
   "$SRC/src/routes/profile-build.ts" "$SRC/src/routes/profile-interview.ts" \
   "$SRC/src/routes/profile-letter.ts" "$SRC/src/routes/profile-laban.ts" "$BE/src/routes/"
cp "$SRC/src/data/seed-chuan-sol.json" "$SRC/src/data/lat1-field-dictionary.json" \
   "$SRC/src/data/lat3-questions.json" "$SRC/src/data/lat4-question-bank.json" "$BE/src/data/"

echo "▶ 4) Tạo 14 bảng (prisma db execute — đúng chủ sở hữu, KHÔNG đụng bảng cũ)"
cd "$BE"
npx prisma db execute --file "$HERE/migrate.sql" --schema "$BE/prisma/schema.prisma"
echo "   ✓ đã chạy migrate.sql"

echo "▶ 5) Nối 14 model vào schema + 2 quan hệ vào model User"
cat "$HERE/schema-block.prisma" >> "$BE/prisma/schema.prisma"
python3 - "$BE/prisma/schema.prisma" <<'PY'
import sys,re
p=sys.argv[1]; t=open(p).read()
ins='  jobProfile   JobProfile?   @relation("UserJobProfile")\n  dataConsents DataConsent[] @relation("UserDataConsents")\n'
# chèn trước dòng @@map("users") ĐẦU TIÊN
lines=t.splitlines(True); out=[]; done=False
for ln in lines:
    if not done and re.match(r'\s*@@map\("users"\)', ln):
        out.append(ins); done=True
    out.append(ln)
assert done, "không chèn được User relations"
open(p,'w').write(''.join(out))
print("   ✓ User relations OK")
PY

echo "▶ 6) Đăng ký 6 route vào index.ts"
python3 - "$BE/src/index.ts" <<'PY'
import sys,re
p=sys.argv[1]; t=open(p).read()
imp='''
// ─── Toàn Trình U40–60 ───
import { jobProfileRouter } from './routes/profile-hoso';
import { jobTargetRouter } from './routes/profile-target';
import { buildRouter } from './routes/profile-build';
import { interviewRouter } from './routes/profile-interview';
import { letterRouter } from './routes/profile-letter';
import { labanRouter } from './routes/profile-laban';
'''
use='''
// ─── Toàn Trình U40–60 ───
app.use('/api/profile', jobProfileRouter);
app.use('/api/profile', jobTargetRouter);
app.use('/api/profile/build', buildRouter);
app.use('/api/profile/interview', interviewRouter);
app.use('/api/profile/letter', letterRouter);
app.use('/api/profile/laban', labanRouter);
'''
lines=t.splitlines(True); out=[]; di=False; du=False
for ln in lines:
    out.append(ln)
    if not di and re.search(r'password-reset', ln) and ln.lstrip().startswith('import'):
        out.append(imp); di=True
    if not du and re.search(r"app\.use\(.*adminRouter", ln):
        out.append(use); du=True
assert di, "không chèn được import route"
assert du, "không chèn được app.use route"
open(p,'w').write(''.join(out))
print("   ✓ index.ts OK")
PY

echo "▶ 7) Sinh client + build + restart"
npx prisma generate
npm run build
pm2 restart huongdi-api
echo "✅ XONG. Kiểm: curl -s -H \"Authorization: Bearer \$TOKEN\" https://huongdi.sol.vn/api/profile | head"
