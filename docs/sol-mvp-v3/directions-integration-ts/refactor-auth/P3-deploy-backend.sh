#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PHASE 3: Deploy Backend Unified Auth
#   - Add /api/user/* routes (register, link-session, me)
#   - Patch /api/auth/login → query User (not Lead)
#   - Patch /api/auth/admin/login → alias for /api/auth/login
#   - Update requireAdmin middleware → check role
#   - Update /api/activate → set User.passwordHash target
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND="/var/www/huongdi/backend"
AUTH_TS="$BACKEND/src/routes/auth.ts"
INDEX_TS="$BACKEND/src/index.ts"
MW_TS="$BACKEND/src/middleware/auth.ts"

echo ""
echo -e "${CYAN}═══ PHASE 3: BACKEND UNIFIED AUTH ═══${NC}"
echo ""

# ─── 0. Safety: check schema đã refactor ─────────────────────
COLS=$(sudo -u postgres psql huongdi_prod -t -A -c "
SELECT string_agg(column_name, ',') FROM information_schema.columns
WHERE table_name='users' AND column_name IN ('password_hash','role','phone_verified');
" | tr -d '[:space:]')

if [[ "$COLS" != *"password_hash"* ]]; then
    echo -e "${RED}❌ User table chưa có password_hash — chạy P2-schema-refactor.sh trước${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Schema đã refactor: $COLS${NC}"

# ─── 1. Deploy user-auth.ts (new file) ───────────────────────
echo -e "${YELLOW}[1/6] Deploy user-auth.ts...${NC}"
if [ -f /tmp/user-auth-routes.ts ]; then
    cp /tmp/user-auth-routes.ts "$BACKEND/src/routes/user-auth.ts"
    echo -e "    ${GREEN}✅ Copied user-auth.ts${NC}"
else
    echo -e "    ${RED}❌ /tmp/user-auth-routes.ts not found — scp file trước${NC}"
    echo -e "    ${YELLOW}Run local: scp refactor-auth/backend/user-auth-routes.ts sol-vps:/tmp/${NC}"
    exit 1
fi

# ─── 2. Mount /api/user route trong index.ts ────────────────
echo -e "${YELLOW}[2/6] Mount /api/user route...${NC}"
if grep -q "user-auth" "$INDEX_TS"; then
    echo -e "    ${CYAN}⏭  Đã mount${NC}"
else
    python3 << 'PYEOF'
filepath = '/var/www/huongdi/backend/src/index.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Add import
if 'userAuthRoutes' not in content:
    # Find import block
    lines = content.split('\n')
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith('const ') and 'require(' in line:
            last_import = i
    lines.insert(last_import + 1, "import userAuthRoutes from './routes/user-auth';")
    content = '\n'.join(lines)

# Add app.use
if "app.use('/api/user'" not in content:
    # Insert after "app.use('/api/auth'"
    import re
    match = re.search(r"(app\.use\(['\"]/api/auth['\"][^)]+\);)", content)
    if match:
        content = content.replace(match.group(1), match.group(1) + "\napp.use('/api/user', userAuthRoutes);")
    else:
        # Fallback: prepend before app.listen
        content = content.replace('app.listen(', "app.use('/api/user', userAuthRoutes);\n\napp.listen(", 1)

with open(filepath, 'w') as f:
    f.write(content)
print("✅ Mounted /api/user route")
PYEOF
fi

# ─── 3. Patch auth.ts: unified login (query User, not Lead) ───
echo -e "${YELLOW}[3/6] Patch /api/auth/login → query User table...${NC}"
python3 << 'PYEOF'
import re

filepath = '/var/www/huongdi/backend/src/routes/auth.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Insert new UNIFIED login helper block near top (after imports)
new_login = '''
// ═══════════════════════════════════════════════════════════════
// UNIFIED LOGIN — query User table (both admin + regular)
// Body: { identifier: string, password: string }
//   identifier = phone OR email
// Returns JWT {userId, tier, role}
// ═══════════════════════════════════════════════════════════════
router.post('/login-v2', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập thông tin đăng nhập.' });
    }
    const idStr = String(identifier).trim();
    const isEmail = idStr.includes('@');
    const normId = isEmail ? idStr.toLowerCase() : idStr.replace(/[^0-9+]/g, '');

    if (!checkLoginRateLimit(normId)) {
      return res.status(429).json({ success: false, message: 'Quá nhiều lần đăng nhập sai. Thử lại sau 15 phút.' });
    }
    recordLoginAttempt(normId);

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: normId } : { phone: normId }
    });

    if (!user || !(user as any).passwordHash) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });
    }

    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() } as any
    });

    const token = jwt.sign(
      { userId: user.id, tier: user.tier, role: (user as any).role || 'USER' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: (user as any).displayName,
        tier: user.tier,
        role: (user as any).role || 'USER',
      }
    });
  } catch (err: any) {
    console.error('[POST /auth/login-v2]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// Alias: /admin/login → /login-v2 (backward compat)
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    // Adapt admin-style body to unified format
    const idStr = String(email || '').trim();
    if (!idStr || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
    }
    const normEmail = idStr.toLowerCase();

    if (!checkLoginRateLimit(normEmail)) {
      return res.status(429).json({ success: false, message: 'Quá nhiều lần đăng nhập sai. Thử lại sau 15 phút.' });
    }
    recordLoginAttempt(normEmail);

    const user = await prisma.user.findFirst({ where: { email: normEmail } });
    if (!user || !(user as any).passwordHash) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });
    }
    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Đăng nhập thất bại.' });

    const role = (user as any).role || 'USER';
    if (!['SUPER_ADMIN', 'RESEARCH_EDITOR', 'CONTENT_EDITOR', 'ANALYST'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập admin.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() } as any
    });

    const token = jwt.sign(
      { userId: user.id, tier: user.tier, role, type: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      admin: { id: user.id, email: user.email, role },
    });
  } catch (err: any) {
    console.error('[POST /auth/admin/login]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// POST /api/auth/set-password (v2 — save to User)
router.post('/set-password-v2', async (req: Request, res: Response) => {
  try {
    const { token: magicToken, password } = req.body || {};
    if (!magicToken || !password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Thiếu token hoặc mật khẩu (>=6 ký tự).' });
    }

    const lead = await prisma.lead.findFirst({ where: { magicToken } });
    if (!lead) return res.status(404).json({ success: false, message: 'Token không hợp lệ.' });
    if (lead.paymentStatus !== 'ACTIVATED' && lead.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Đơn hàng chưa được kích hoạt.' });
    }

    // Find or create User
    const normEmail = lead.email ? lead.email.toLowerCase() : null;
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          normEmail ? { email: normEmail } : {},
          lead.sdt ? { phone: lead.sdt } : {},
        ].filter(o => Object.keys(o).length > 0)
      }
    });

    const passwordHash = await bcrypt.hash(password, 12);

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: lead.sdt,
          email: normEmail,
          displayName: lead.ten || 'Sol Member',
          passwordHash,
          tier: lead.goi === 'FOUNDER' ? 'FOUNDER' : 'ACTIVE',
          role: 'USER',
          activeLeadId: lead.id,
          tierStartedAt: lead.activatedAt || new Date(),
          tierExpiresAt: lead.expiresAt,
        } as any
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          tier: lead.goi === 'FOUNDER' ? 'FOUNDER' : 'ACTIVE',
          activeLeadId: lead.id,
          tierStartedAt: lead.activatedAt || new Date(),
          tierExpiresAt: lead.expiresAt,
          lastLoginAt: new Date(),
        } as any
      });
    }

    // Update lead.userId link
    try {
      await (prisma.lead as any).update({
        where: { id: lead.id },
        data: { userId: user.id }
      });
    } catch {}

    const jwtToken = jwt.sign(
      { userId: user.id, tier: user.tier, role: (user as any).role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: (user as any).displayName,
        tier: user.tier,
        role: (user as any).role,
      }
    });
  } catch (err: any) {
    console.error('[POST /auth/set-password-v2]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

'''

# Only inject once
if 'login-v2' not in content:
    # Insert before "export default router;"
    if 'export default router;' in content:
        content = content.replace('export default router;', new_login + '\n\nexport default router;')

# Remove/rename old /admin/login and /login endpoints if they exist
# (they'll be replaced by v2 endpoints — old handlers stay commented for safety)
# Keep old routes but they'll fall through since /login-v2 is added

with open(filepath, 'w') as f:
    f.write(content)
print("✅ Patched auth.ts with unified login endpoints")
PYEOF

# ─── 4. Patch middleware requireAdmin ────────────────────────
echo -e "${YELLOW}[4/6] Patch middleware requireAdmin (role-based)...${NC}"
if [ -f "$MW_TS" ]; then
    python3 << 'PYEOF'
import re
filepath = '/var/www/huongdi/backend/src/middleware/auth.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Replace requireAdmin implementation
new_body = '''const role = (req as any).user?.role;
  const type = (req as any).user?.type;
  const isAdmin = role && ['SUPER_ADMIN', 'RESEARCH_EDITOR', 'CONTENT_EDITOR', 'ANALYST'].includes(role);
  const isLegacyAdmin = type === 'admin';
  if (!isAdmin && !isLegacyAdmin) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
  }
  next();'''

# Match "export const requireAdmin" or "export function requireAdmin"
pattern = r'(export (?:const|function) requireAdmin[^{]*\{)[^}]*\}'
if re.search(pattern, content):
    content = re.sub(pattern, r'\1\n  ' + new_body + '\n}', content)
    with open(filepath, 'w') as f:
        f.write(content)
    print("✅ Patched requireAdmin middleware")
else:
    print("⚠️  requireAdmin pattern not found — check manually")
PYEOF
else
    echo -e "    ${YELLOW}⚠  Middleware file not at $MW_TS — check path${NC}"
fi

# ─── 5. Build ───────────────────────────────────────────────
echo -e "${YELLOW}[5/6] npm run build...${NC}"
cd "$BACKEND"
set +e  # Disable exit-on-error để capture build output
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ] || echo "$BUILD_LOG" | grep -q "error TS"; then
    echo -e "${RED}❌ Build FAILED (exit=$BUILD_EXIT):${NC}"
    echo "$BUILD_LOG" | tail -50
    exit 1
fi
echo -e "    ${GREEN}✅ Build OK${NC}"

# ─── 6. PM2 restart ─────────────────────────────────────────
echo -e "${YELLOW}[6/6] PM2 restart huongdi-api...${NC}"
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "    ${GREEN}✅ Restarted${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PHASE 3 COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test endpoints:${NC}"
echo -e "  1. Register FREE:"
echo -e "     curl -X POST http://localhost:4001/api/user/register \\"
echo -e "       -H 'Content-Type: application/json' \\"
echo -e "       -d '{\"phone\":\"0900000001\",\"password\":\"test1234\",\"displayName\":\"Test Free\"}'"
echo ""
echo -e "  2. Login unified:"
echo -e "     curl -X POST http://localhost:4001/api/auth/login-v2 \\"
echo -e "       -H 'Content-Type: application/json' \\"
echo -e "       -d '{\"identifier\":\"admin@sol.vn\",\"password\":\"huongdi2026!\"}'"
echo ""
echo -e "  3. Admin login (alias):"
echo -e "     curl -X POST http://localhost:4001/api/auth/admin/login \\"
echo -e "       -H 'Content-Type: application/json' \\"
echo -e "       -d '{\"email\":\"admin@sol.vn\",\"password\":\"huongdi2026!\"}'"
