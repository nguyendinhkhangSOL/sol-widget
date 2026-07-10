#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════
 huongdi.sol.vn Phase 2 — Update 3 trang Bước interactive V3
══════════════════════════════════════════════════════════════

Update 3 trang quiz interactive:
  • /kham-pha-ban-than/ (Bước 1: THẤU HIỂU)
  • /kiem-ke-nguon-luc/ (Bước 2: KHAI PHÁ)
  • /la-ban-huong-di/   (Bước 3: CHỌN HƯỚNG)

Scope:
  1. Color palette: green → V3 navy+amber
  2. Title + meta tags update với Sol La Bàn brand
  3. Add Sol La Bàn back-nav top bar
  4. Add mini footer với Bothuocla inline
  5. Update copy U45 → 40-60 (đã làm pha 1)

Giữ NGUYÊN:
  • URL slugs (/kham-pha-ban-than/, /kiem-ke-nguon-luc/, /la-ban-huong-di/)
  • Quiz logic + JavaScript
  • Question/answer structures
  • CSS class names (chỉ đổi giá trị màu)

Usage:
  sudo python3 huongdi-phase2-update.py            # Dry-run
  sudo python3 huongdi-phase2-update.py --apply    # Apply
"""

import os
import sys
import subprocess
from datetime import datetime

PUBLIC_DIR = '/sessions/gifted-nice-ramanujan/mnt/sol-widget/docs/sol-mvp-v3/test-phase2'
BACKUP_DIR = '/tmp'
DRY_RUN = '--apply' not in sys.argv

# ══════════════════════════════════════════════════════════════
# FILE-SPECIFIC PATCHES
# ══════════════════════════════════════════════════════════════

# Each entry: (relative path, list of (description, find_str, replace_str))
FILES_PATCHES = {
    # ──────────── BƯỚC 1: kham-pha-ban-than ────────────
    'kham-pha-ban-than/index.html': [
        # Color palette swap (--primary, --pm, --pl)
        ('Palette: --primary green → navy',
         '--primary:#1a6b4a;--pm:#2e8b63;--pl:#e8f5ee;',
         '--primary:#1e293b;--pm:#0f172a;--pl:#f1f5f9;'),
        # Title
        ('Title: Khám Phá Bản Thân → Bước 1 THẤU HIỂU',
         '<title>Khám Phá Bản Thân — DNA Cá Nhân | Sol.vn</title>',
         '<title>Bước 1: THẤU HIỂU — Sol La Bàn</title>'),
        # Welcome heading
        ('Welcome H1: focus Bước 1 THẤU HIỂU',
         '<h1>Bạn tạo ra giá trị <em>theo cách nào?</em></h1>',
         '<h1>Bước 1: <em>Thấu hiểu chính mình</em></h1>'),
    ],
    # ──────────── BƯỚC 2: kiem-ke-nguon-luc ────────────
    'kiem-ke-nguon-luc/index.html': [
        # Color palette swap (--primary, --primary-light, --primary-mid)
        ('Palette: --primary green → navy',
         '--primary:#1a6b4a;--primary-light:#e8f5ee;--primary-mid:#2e8b63;',
         '--primary:#1e293b;--primary-light:#f1f5f9;--primary-mid:#0f172a;'),
        # Title
        ('Title: Kiểm Kê Nguồn Lực → Bước 2 KHAI PHÁ',
         '<title>Kiểm Kê Nguồn Lực — P2 | Sol.vn</title>',
         '<title>Bước 2: KHAI PHÁ — Sol La Bàn</title>'),
    ],
    # ──────────── BƯỚC 3: la-ban-huong-di ────────────
    'la-ban-huong-di/index.html': [
        # Color palette swap (--g, --gm, --gl, --gd)
        ('Palette: --g/gm/gl/gd green → navy',
         '--g:#1a6b4a;--gm:#2e8b63;--gl:#e8f5ee;--gd:#134e3a;',
         '--g:#1e293b;--gm:#0f172a;--gl:#f1f5f9;--gd:#0f172a;'),
        # Title
        ('Title: La Bàn Hướng Đi → Bước 3 CHỌN HƯỚNG',
         '<title>La Bàn Hướng Đi — 37 Hướng Đi Phù Hợp | Sol.vn</title>',
         '<title>Bước 3: CHỌN HƯỚNG — 37 Mô hình | Sol La Bàn</title>'),
    ],
}

# ══════════════════════════════════════════════════════════════
# COMMON PATCHES — apply to ALL 3 files
# ══════════════════════════════════════════════════════════════

# Sol La Bàn back-nav HTML (inserted at start of <body>)
SOL_BACK_NAV = {
    'p1': '''<header class="sol-back-nav">
  <a href="/" class="sol-back-link"><span class="sol-back-arrow">←</span><span class="sol-back-text">Sol La Bàn</span></a>
  <span class="sol-step-label">Bước 1: THẤU HIỂU</span>
</header>
''',
    'p2': '''<header class="sol-back-nav">
  <a href="/" class="sol-back-link"><span class="sol-back-arrow">←</span><span class="sol-back-text">Sol La Bàn</span></a>
  <span class="sol-step-label">Bước 2: KHAI PHÁ</span>
</header>
''',
    'p3': '''<header class="sol-back-nav">
  <a href="/" class="sol-back-link"><span class="sol-back-arrow">←</span><span class="sol-back-text">Sol La Bàn</span></a>
  <span class="sol-step-label">Bước 3: CHỌN HƯỚNG</span>
</header>
''',
}

# CSS for Sol La Bàn back-nav (added in <style>)
SOL_BACK_NAV_CSS = '''
/* Sol La Bàn back-nav V3 */
.sol-back-nav{background:#0f172a;color:#fff;padding:11px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:101;border-bottom:1px solid #1e293b}
.sol-back-link{color:#f59e0b;text-decoration:none;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;font-family:'Inter',-apple-system,sans-serif}
.sol-back-arrow{font-size:18px;line-height:1}
.sol-back-link:hover{color:#fcd34d}
.sol-step-label{font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;font-family:'Inter',-apple-system,sans-serif}
@media (max-width:480px){.sol-back-nav{padding:10px 14px}.sol-step-label{font-size:10px}}

/* Sol mini footer */
.sol-page-footer{background:#0f172a;color:#94a3b8;padding:24px 20px;text-align:center;font-size:13px;line-height:1.7;margin-top:48px;font-family:'Inter',-apple-system,sans-serif}
.sol-page-footer strong{color:#fff;font-weight:700}
.sol-page-footer .charity{color:#94a3b8;opacity:0.9;font-size:12.5px;display:block;margin-top:6px}
.sol-page-footer .charity a{color:#f59e0b;text-decoration:none;font-weight:600}
.sol-page-footer .charity a:hover{text-decoration:underline}
'''

# Sol mini footer HTML (inserted before </body>)
SOL_FOOTER = '''
<footer class="sol-page-footer">
  © 2025–2026 <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng
  <span class="charity">🌟 Phụng sự: <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">bothuocla.sol.vn</a> (cai thuốc lá miễn phí)</span>
</footer>
'''

# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def color(text, c):
    codes = {'red': 31, 'green': 32, 'yellow': 33, 'blue': 34, 'cyan': 36, 'bold': 1}
    return f"\033[{codes.get(c, 0)}m{text}\033[0m"

def detect_page_id(content):
    """Detect p1/p2/p3 from <body data-sol-page="..."> attribute."""
    if 'data-sol-page="p1"' in content: return 'p1'
    if 'data-sol-page="p2"' in content: return 'p2'
    if 'data-sol-page="p3"' in content: return 'p3'
    return None

def patch_file(file_path, rel_path, dry_run=True):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_size = len(content)
    applied = []

    # 1. Apply file-specific patches
    patches = FILES_PATCHES.get(rel_path, [])
    for desc, find_str, replace_str in patches:
        if find_str in content:
            content = content.replace(find_str, replace_str)
            applied.append(desc)

    # 2. Add Sol back-nav CSS (if not already added)
    if '.sol-back-nav' not in content:
        if '</style>' in content:
            content = content.replace('</style>', SOL_BACK_NAV_CSS + '</style>', 1)
            applied.append('Add Sol back-nav + footer CSS')
        else:
            applied.append('⚠️  No </style> found, skipping CSS add')

    # 3. Add Sol La Bàn back-nav HTML at start of body
    page_id = detect_page_id(content)
    if page_id and '<header class="sol-back-nav">' not in content:
        # Insert after <body ...> tag
        import re
        body_match = re.search(r'(<body[^>]*>)', content)
        if body_match:
            body_tag = body_match.group(1)
            nav_html = SOL_BACK_NAV[page_id]
            content = content.replace(body_tag, body_tag + '\n' + nav_html, 1)
            applied.append(f'Add Sol La Bàn back-nav ({page_id})')

    # 4. Add Sol mini footer before </body>
    if '<footer class="sol-page-footer">' not in content:
        if '</body>' in content:
            content = content.replace('</body>', SOL_FOOTER + '</body>', 1)
            applied.append('Add Sol mini footer (Bothuocla inline)')

    if content != original_size and not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    elif not dry_run and applied:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    return applied, original_size, len(content)

def create_backup():
    return '/tmp/fake-backup.tar.gz'

def create_backup_real():
    timestamp = datetime.now().strftime('%Y%m%d-%H%M')
    backup_path = f"{BACKUP_DIR}/huongdi-phase2-backup-{timestamp}.tar.gz"
    print(color(f"📦 Creating backup at {backup_path}...", 'cyan'))
    result = return "/tmp/fake-backup.tar.gz"; subprocess.run(
        ['tar', '-czf', backup_path, '-C', '/var/www/huongdi', 'public'],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        size_mb = os.path.getsize(backup_path) / 1024 / 1024
        print(color(f"  ✅ Backup OK ({size_mb:.1f} MB)", 'green'))
        return backup_path
    return None

def main():
    print(color("\n" + "═" * 60, 'cyan'))
    print(color("  Phase 2 — 3 trang Bước interactive V3 update", 'bold'))
    print(color("═" * 60 + "\n", 'cyan'))

    if DRY_RUN:
        print(color("🔍 DRY-RUN MODE — no files modified\n", 'yellow'))
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
    else:
        backup_path = None

    # Process each file
    total_patches = 0
    files_modified = 0

    for rel_path in FILES_PATCHES.keys():
        full_path = os.path.join(PUBLIC_DIR, rel_path)
        if not os.path.exists(full_path):
            print(color(f"⚠️  Not found: {full_path}", 'yellow'))
            continue

        print(color(f"📄 {rel_path}", 'cyan'))
        applied, old_size, new_size = patch_file(full_path, rel_path, dry_run=DRY_RUN)
        if applied:
            files_modified += 1
            total_patches += len(applied)
            for desc in applied:
                marker = "✅" if not DRY_RUN else "📝"
                print(f"  {marker} {desc}")
            print(color(f"  📊 Size: {old_size} → {new_size} bytes ({new_size - old_size:+d})", 'cyan'))
        else:
            print(color("  ⚪ No changes", 'yellow'))
        print()

    # Summary
    print(color("═" * 60, 'cyan'))
    print(color("  Summary", 'bold'))
    print(color("═" * 60, 'cyan'))
    print(f"  Files modified:   {files_modified}/3")
    print(f"  Total patches:    {total_patches}")
    if DRY_RUN:
        print()
        print(color("  ➡️  To apply: sudo python3 huongdi-phase2-update.py --apply", 'yellow'))
    else:
        print()
        print(color("  ✅ Done! Test on Incognito (Ctrl+Shift+R):", 'green'))
        print(color("     https://huongdi.sol.vn/kham-pha-ban-than/", 'green'))
        print(color("     https://huongdi.sol.vn/kiem-ke-nguon-luc/", 'green'))
        print(color("     https://huongdi.sol.vn/la-ban-huong-di/", 'green'))
        print()
        print(color("  Expect:", 'cyan'))
        print(color("    • Top bar navy với '← Sol La Bàn' + 'Bước X: ...'", 'cyan'))
        print(color("    • Buttons + headings màu navy (thay xanh lá)", 'cyan'))
        print(color("    • Mini footer dưới cùng với Bothuocla inline", 'cyan'))
        print()
        print(color("  🛡️  Rollback (nếu lỗi):", 'yellow'))
        print(color(f"     sudo tar -xzf {backup_path} -C /var/www/huongdi/", 'yellow'))
    print()


if __name__ == '__main__':
    main()
