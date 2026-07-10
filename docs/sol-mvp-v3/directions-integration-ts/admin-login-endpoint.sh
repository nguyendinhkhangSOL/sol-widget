#!/bin/bash
# Add /api/auth/admin-login endpoint to auth.ts
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

AUTH_TS="/var/www/huongdi/backend/src/routes/auth.ts"
BACKEND="/var/www/huongdi/backend"

echo -e "${YELLOW}[1/4] Backup auth.ts...${NC}"
cp "$AUTH_TS" "$AUTH_TS.bak-admin-login-$(date +%s)"

echo -e "${YELLOW}[2/4] Check if admin-login đã có...${NC}"
if grep -q "admin-login" "$AUTH_TS"; then
    echo -e "${CYAN}⏭  admin-login route đã có — skip${NC}"
else
    echo -e "${YELLOW}[3/4] Inject admin-login endpoint...${NC}"

    # Insert before "export default router;"
    python3 << 'PYEOF'
filepath = '/var/www/huongdi/backend/src/routes/auth.ts'
with open(filepath, 'r') as f:
    content = f.read()

new_endpoint = '''
// ═══════════════════════════════════════════════════════════════
// POST /api/auth/admin-login
// Body: { email: string, password: string }
// Returns: JWT với payload {userId, role, type:'admin'}
// ═══════════════════════════════════════════════════════════════
router.post('/admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!checkLoginRateLimit(normalizedEmail)) {
      return res.status(429).json({ success: false, message: 'Quá nhiều lần đăng nhập sai. Thử lại sau 15 phút.' });
    }
    recordLoginAttempt(normalizedEmail);

    const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại' });
    }
    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Tài khoản đã bị vô hiệu hoá.' });
    }
    if (!admin.passwordHash) {
      return res.status(401).json({ success: false, message: 'Tài khoản chưa đặt mật khẩu.' });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Đăng nhập thất bại' });
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Sign admin JWT
    const adminToken = jwt.sign(
      { userId: admin.id, role: admin.role, type: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token: adminToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error('[POST /auth/admin-login]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

'''

# Insert before "export default router;"
if 'export default router;' in content:
    content = content.replace('export default router;', new_endpoint + '\nexport default router;')
    with open(filepath, 'w') as f:
        f.write(content)
    print("✅ Injected admin-login endpoint")
else:
    print("⚠️  Không tìm 'export default router;' — manual patch needed")
PYEOF
fi

echo ""
echo -e "${YELLOW}[4/4] Build + Restart...${NC}"
cd "$BACKEND"
if npm run build 2>&1 | tail -5 | grep -q "error TS"; then
    echo -e "${YELLOW}⚠  Build errors:${NC}"
    npm run build 2>&1 | tail -10
    exit 1
fi
pm2 restart huongdi-api > /dev/null
sleep 2
echo -e "${GREEN}✅ Backend restarted${NC}"

echo ""
echo -e "${CYAN}Test:${NC}"
echo -e "  curl -X POST http://localhost:4001/api/auth/admin-login -H 'Content-Type: application/json' -d '{\"email\":\"admin@sol.vn\",\"password\":\"YOUR-PASSWORD\"}'"
