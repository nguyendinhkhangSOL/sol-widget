// admin/fix-encoding.cjs
//
// Re-copy admin pages từ dashboard với encoding UTF-8 đúng + adjust paths.
// Lý do: setup-admin.ps1 đọc file bằng PowerShell ANSI default → mojibake
// tiếng Việt. Node fs.readFileSync(path, 'utf8') chuẩn UTF-8 — không sai.
//
// Usage:
//   1. STOP Vite admin (Ctrl+C terminal admin npm run dev)
//   2. ĐÓNG editor đang mở admin pages
//   3. cd D:\BOTHUOCLA\sol-widget
//   4. node admin/fix-encoding.cjs

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'dashboard', 'src', 'pages', 'admin');
const dstDir = path.join(root, 'admin', 'src', 'pages');

console.log('=== Fix Encoding Admin Pages ===');
console.log('Source:', srcDir);
console.log('Dest:  ', dstDir);
console.log('');

if (!fs.existsSync(srcDir)) {
  console.error('❌ Source folder không tồn tại:', srcDir);
  process.exit(1);
}
if (!fs.existsSync(dstDir)) {
  console.error('❌ Dest folder không tồn tại:', dstDir);
  process.exit(1);
}

const files = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.tsx') && f !== 'AdminLayout.tsx');

let ok = 0;
let failed = 0;

for (const file of files) {
  const srcPath = path.join(srcDir, file);
  const dstPath = path.join(dstDir, file);
  try {
    let content = fs.readFileSync(srcPath, 'utf8');

    // Adjust import paths: ../../  ->  ../
    content = content.replace(/from '\.\.\/\.\.\//g, "from '../");
    content = content.replace(/from "\.\.\/\.\.\//g, 'from "../');

    // Rewrite route paths: /admin/users -> /users, /admin -> /
    content = content.replace(/to="\/admin\//g, 'to="/');
    content = content.replace(/to='\/admin\//g, "to='/");
    content = content.replace(/to=\{"\/admin\//g, 'to={"/');
    content = content.replace(/navigate\('\/admin\//g, "navigate('/");
    content = content.replace(/navigate\("\/admin\//g, 'navigate("/');
    content = content.replace(/to="\/admin"/g, 'to="/"');
    content = content.replace(/to='\/admin'/g, "to='/'");

    fs.writeFileSync(dstPath, content, 'utf8');
    console.log('  ✓ ' + file);
    ok++;
  } catch (err) {
    console.error('  ✗ ' + file + ' — ' + err.message);
    failed++;
  }
}

console.log('');
console.log('=== Done ===');
console.log('  Fixed: ' + ok + ' files');
if (failed > 0) {
  console.log('  Failed: ' + failed + ' files');
}
console.log('');
console.log('Next:');
console.log('  cd admin');
console.log('  npm run dev');
console.log('  Hard reload browser (Ctrl+Shift+R)');
