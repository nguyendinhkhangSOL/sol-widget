#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
 huongdi.sol.vn — Downsize Bothuocla strip → inline 1 dòng
═══════════════════════════════════════════════════════════════

Đổi callout box "🌟 Dự án Phụng sự Cộng đồng" (bự, amber tint)
thành 1 dòng inline trong copyright bar.

Lý do: Giảm visual competition với CTA chính, giữ EEAT + brand
storytelling nhưng kín đáo hơn.

Visual sau update:
  © 2025–2026 Đi Cùng Sol · Tái khởi nghiệp đúng hướng
  🌟 Phụng sự: bothuocla.sol.vn (cai thuốc lá miễn phí)

Usage:
  sudo python3 huongdi-downsize-charity.py            # Dry-run
  sudo python3 huongdi-downsize-charity.py --apply    # Apply
"""

import os
import sys
import subprocess
from datetime import datetime

PUBLIC_DIR = '/var/www/huongdi/public'
CSS_FILE = '/var/www/huongdi/public/css/style.css'
BACKUP_DIR = '/root'
DRY_RUN = '--apply' not in sys.argv

# ════════════════════════════════════════════════════════════
# HTML PATCH — Remove big box + Add inline line
# ════════════════════════════════════════════════════════════

OLD_HTML = '''<!-- Dự án phụng sự cộng đồng -->
    <div class="hd-footer__charity">
      <span class="hd-footer__charity-label">🌟 Dự án Phụng sự Cộng đồng</span>
      <span class="hd-footer__charity-text">
        <strong>🚭 Bothuocla.sol.vn</strong> — Hỗ trợ cai thuốc lá miễn phí cho cộng đồng. Phi lợi nhuận, đồng hành 100%.
      </span>
      <a href="https://bothuocla.sol.vn/" class="hd-footer__charity-link" target="_blank" rel="noopener">Truy cập dự án →</a>
    </div>
    <div class="hd-footer__bottom">
      <div>© 2025–2026 <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng</div>'''

NEW_HTML = '''<div class="hd-footer__bottom">
      <div>
        © 2025–2026 <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng
        <span class="hd-footer__charity-inline">· 🌟 Phụng sự: <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">bothuocla.sol.vn</a> (cai thuốc lá miễn phí)</span>
      </div>'''

# ════════════════════════════════════════════════════════════
# CSS PATCH — Replace big box CSS with inline CSS
# ════════════════════════════════════════════════════════════

OLD_CSS_BLOCK_START = '/* ═══════════════════════════════════════════════════════════════════\n   V3 — Dự án Phụng sự Cộng đồng (Bothuocla charity strip)'

NEW_CSS = '''
/* ═══════════════════════════════════════════════════════════════════
   V3.1 — Bothuocla phụng sự (inline trong copyright)
   ═══════════════════════════════════════════════════════════════════ */
.hd-footer__charity-inline {
  color: #94a3b8;
  font-size: 13px;
  opacity: 0.9;
}
.hd-footer__charity-inline a {
  color: #f59e0b;
  text-decoration: none;
  font-weight: 600;
}
.hd-footer__charity-inline a:hover { text-decoration: underline; }
'''

def color(text, c):
    codes = {'red': 31, 'green': 32, 'yellow': 33, 'blue': 34, 'cyan': 36, 'bold': 1}
    return f"\033[{codes.get(c, 0)}m{text}\033[0m"

def find_html_files(directory):
    html_files = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'admin']]
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))
    return sorted(html_files)

def patch_html_file(filepath, dry_run=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if OLD_HTML not in content:
        return False

    if not dry_run:
        new_content = content.replace(OLD_HTML, NEW_HTML)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
    return True

def patch_css_file(dry_run=True):
    if not os.path.exists(CSS_FILE):
        print(color(f"⚠️  CSS file not found: {CSS_FILE}", 'yellow'))
        return False

    with open(CSS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    if '.hd-footer__charity-inline' in content:
        print(color("  ✅ Already has inline CSS, skipping", 'green'))
        return True

    # Find and remove old big-box CSS block
    if OLD_CSS_BLOCK_START in content:
        start = content.index(OLD_CSS_BLOCK_START)
        # Find end (next CSS block start with /* === or end of file)
        # The old CSS block ends with the @media query closing
        end_marker = '@media (max-width: 768px) {\n  .hd-footer__charity { flex-direction: column; align-items: flex-start; gap: 12px; padding: 18px 20px; }\n}'
        if end_marker in content[start:]:
            end = content.index(end_marker, start) + len(end_marker)
            old_block = content[start:end]
            print(color(f"  📍 Found old CSS block ({len(old_block)} chars)", 'cyan'))
            if not dry_run:
                content = content.replace(old_block, NEW_CSS.strip())
                with open(CSS_FILE, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(color("  ✅ Replaced with inline CSS", 'green'))
            else:
                print(color(f"  📝 Would replace ({len(old_block)} chars → {len(NEW_CSS)} chars)", 'cyan'))
            return True

    # If old block not found, just append new CSS
    if not dry_run:
        with open(CSS_FILE, 'a', encoding='utf-8') as f:
            f.write('\n' + NEW_CSS)
        print(color("  ✅ Appended inline CSS (old block not found)", 'green'))
    else:
        print(color("  📝 Would append inline CSS (old block not found)", 'cyan'))
    return True

def create_backup():
    timestamp = datetime.now().strftime('%Y%m%d-%H%M')
    backup_path = f"{BACKUP_DIR}/huongdi-downsize-backup-{timestamp}.tar.gz"
    print(color(f"📦 Creating backup at {backup_path}...", 'cyan'))
    result = subprocess.run(
        ['tar', '-czf', backup_path, '-C', '/var/www/huongdi', 'public'],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        size_mb = os.path.getsize(backup_path) / 1024 / 1024
        print(color(f"  ✅ Backup OK ({size_mb:.1f} MB)", 'green'))
        return backup_path
    else:
        print(color(f"  ❌ Backup FAILED: {result.stderr}", 'red'))
        return None

def main():
    print(color("\n" + "═" * 60, 'cyan'))
    print(color("  Downsize Bothuocla strip → inline 1 dòng", 'bold'))
    print(color("═" * 60 + "\n", 'cyan'))

    if DRY_RUN:
        print(color("🔍 DRY-RUN MODE — no files modified\n", 'yellow'))
        print(color("   Run with --apply để thực hiện:", 'yellow'))
        print(color("   sudo python3 huongdi-downsize-charity.py --apply\n", 'yellow'))
    else:
        print(color("⚠️  APPLY MODE — files will be modified!\n", 'red'))

    if not os.path.exists(PUBLIC_DIR):
        print(color(f"❌ Directory not found: {PUBLIC_DIR}", 'red'))
        sys.exit(1)

    # Backup (apply mode only)
    if not DRY_RUN:
        backup_path = create_backup()
        if not backup_path:
            sys.exit(1)
        print()

    # Patch HTML files
    html_files = find_html_files(PUBLIC_DIR)
    print(color(f"📁 Scanning {len(html_files)} HTML files...\n", 'cyan'))

    modified_count = 0
    for filepath in html_files:
        rel = os.path.relpath(filepath, PUBLIC_DIR)
        will_patch = patch_html_file(filepath, dry_run=DRY_RUN)
        if will_patch:
            modified_count += 1
            marker = "✅" if not DRY_RUN else "📝"
            print(f"  {marker} {rel}")

    if modified_count == 0:
        print(color("  ⚪ No HTML files need patching", 'yellow'))

    print()

    # Patch CSS
    print(color("🎨 CSS update:", 'cyan'))
    patch_css_file(dry_run=DRY_RUN)
    print()

    # Summary
    print(color("═" * 60, 'cyan'))
    print(color("  Summary", 'bold'))
    print(color("═" * 60, 'cyan'))
    print(f"  HTML files patched: {modified_count}")
    if DRY_RUN:
        print()
        print(color("  ➡️  To apply: sudo python3 huongdi-downsize-charity.py --apply", 'yellow'))
    else:
        print()
        print(color("  ✅ Done! Test on Incognito:", 'green'))
        print(color("     https://huongdi.sol.vn/  (Ctrl+Shift+R hard refresh)", 'green'))
        print()
        print(color("  🛡️  Rollback (nếu lỗi):", 'yellow'))
        print(color(f"     sudo tar -xzf {backup_path} -C /var/www/huongdi/", 'yellow'))
    print()

if __name__ == '__main__':
    main()
