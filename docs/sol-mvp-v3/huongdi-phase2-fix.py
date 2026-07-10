#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════
 huongdi.sol.vn Phase 2 FIX — Cleanup + Update sol-ui.js V3
══════════════════════════════════════════════════════════════

Fix conflict giữa Phase 2 static header/footer và sol-ui.js inject.

Actions:
  1. Remove sol-back-nav CSS + HTML từ 3 quiz files (conflict với hd-header)
  2. Remove sol-page-footer CSS + HTML từ 3 quiz files (conflict với hd-footer)
  3. Update sol-ui.js với V3 branding:
     - NAV_ITEMS labels → Bước 1/2/3 Việt hóa
     - CTA "Bắt đầu →" → "Bắt đầu miễn phí →"
     - Remove Thân/Tâm/Trí pills
     - Update footer: motto, cols, Bothuocla inline, copyright V3

Giữ NGUYÊN từ Phase 2:
  • Color palette green → navy (in file-specific CSS)
  • Title update: "Bước X: ..."
  • Welcome H1 (buoc1)

Usage:
  sudo python3 huongdi-phase2-fix.py            # Dry-run
  sudo python3 huongdi-phase2-fix.py --apply    # Apply
"""

import os
import sys
import subprocess
from datetime import datetime

PUBLIC_DIR = '/var/www/huongdi/public'
BACKUP_DIR = '/root'
DRY_RUN = '--apply' not in sys.argv

# ══════════════════════════════════════════════════════════════
# STEP 1 — REMOVE STATIC HEADER/FOOTER FROM 3 QUIZ FILES
# ══════════════════════════════════════════════════════════════

# CSS block to REMOVE (added in Phase 2)
CSS_BLOCK_TO_REMOVE = """
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
"""

# HTML back-nav variants to REMOVE (per page)
BACK_NAV_VARIANTS = [
    '''<header class="sol-back-nav">
  <a href="/" class="sol-back-link"><span class="sol-back-arrow">←</span><span class="sol-back-text">Sol La Bàn</span></a>
  <span class="sol-step-label">Bước 1: THẤU HIỂU</span>
</header>
''',
    '''<header class="sol-back-nav">
  <a href="/" class="sol-back-link"><span class="sol-back-arrow">←</span><span class="sol-back-text">Sol La Bàn</span></a>
  <span class="sol-step-label">Bước 2: KHAI PHÁ</span>
</header>
''',
    '''<header class="sol-back-nav">
  <a href="/" class="sol-back-link"><span class="sol-back-arrow">←</span><span class="sol-back-text">Sol La Bàn</span></a>
  <span class="sol-step-label">Bước 3: CHỌN HƯỚNG</span>
</header>
''',
]

# Mini footer HTML to REMOVE
FOOTER_TO_REMOVE = '''
<footer class="sol-page-footer">
  © 2025–2026 <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng
  <span class="charity">🌟 Phụng sự: <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">bothuocla.sol.vn</a> (cai thuốc lá miễn phí)</span>
</footer>
'''

QUIZ_FILES = [
    'kham-pha-ban-than/index.html',
    'kiem-ke-nguon-luc/index.html',
    'la-ban-huong-di/index.html',
]

# ══════════════════════════════════════════════════════════════
# STEP 2 — UPDATE sol-ui.js
# ══════════════════════════════════════════════════════════════

# NAV_ITEMS: old → new (Việt hóa Bước 1/2/3)
OLD_NAV_ITEMS = """  const NAV_ITEMS = [
    { key: 'p1',       href: '/kham-pha-ban-than/', label: 'Khám phá bản thân' },
    { key: 'p2',       href: '/kiem-ke-nguon-luc/', label: 'Kiểm kê nguồn lực' },
    { key: 'p3',       href: '/la-ban-huong-di/',   label: 'La bàn hướng đi'  },
    { key: 'articles', href: 'https://sol.vn/huong-di/', label: 'Bài viết'    },
  ];"""

NEW_NAV_ITEMS = """  const NAV_ITEMS = [
    { key: 'p1',       href: '/kham-pha-ban-than/', label: 'Bước 1: Thấu hiểu' },
    { key: 'p2',       href: '/kiem-ke-nguon-luc/', label: 'Bước 2: Khai phá' },
    { key: 'p3',       href: '/la-ban-huong-di/',   label: 'Bước 3: Chọn hướng' },
    { key: 'articles', href: 'https://sol.vn/huong-di/', label: 'Bài viết' },
  ];"""

# CTA label update
OLD_CTA_LABEL = "const ctaLabel = loggedIn ? 'Dashboard →' : 'Bắt đầu →';"
NEW_CTA_LABEL = "const ctaLabel = loggedIn ? 'Dashboard →' : 'Bắt đầu miễn phí →';"

# Remove Thân/Tâm/Trí pills from header
OLD_PILLS = """    <nav class="hd-nav-pillars" aria-label="3 trụ Sol">
      <a href="https://bothuocla.sol.vn/">Thân</a>
      <a href="https://sol.vn/ngam/">Tâm</a>
      <a href="https://huongdi.sol.vn/" class="active" aria-current="page">Trí</a>
    </nav>
    """

NEW_PILLS = ""  # Remove entirely

# Footer motto
OLD_MOTTO = '<p class="hd-footer__motto">Đi cùng nhau, đường dài đỡ mỏi.</p>'
NEW_MOTTO = '<p class="hd-footer__motto">Đúng hướng,<br>đúng bước,<br>đúng tương lai.</p>'

# Footer Hệ thống col
OLD_HETHONG_COL = """<h4>Hệ thống</h4>
        <ul>
          <li><a href="/kham-pha-ban-than/">Khám phá bản thân (P1)</a></li>
          <li><a href="/kiem-ke-nguon-luc/">Kiểm kê nguồn lực (P2)</a></li>
          <li><a href="/la-ban-huong-di/">La bàn hướng đi (P3)</a></li>
          <li><a href="/#system">Roadmap™ (sắp có)</a></li>
          <li><a href="/#ai-mentor">AI Mentor™ (sắp có)</a></li>
        </ul>"""

NEW_HETHONG_COL = """<h4>Sol La Bàn</h4>
        <ul>
          <li><a href="/kham-pha-ban-than/">Bước 1 · Thấu hiểu</a></li>
          <li><a href="/kiem-ke-nguon-luc/">Bước 2 · Khai phá</a></li>
          <li><a href="/la-ban-huong-di/">Bước 3 · Chọn hướng</a></li>
          <li><a href="/#system">Bước 4 · Hành động <span style="opacity:.6">(sắp có)</span></a></li>
          <li><a href="/#ai-mentor">Bước 5 · An toàn bền vững <span style="opacity:.6">(sắp có)</span></a></li>
        </ul>"""

# Footer Sol Ecosystem col → Về Sol
OLD_SOL_ECO_COL = """<h4>Sol Ecosystem</h4>
        <ul>
          <li><a href="https://bothuocla.sol.vn/">🌿 Thân — Sức khoẻ</a></li>
          <li><a href="https://sol.vn/ngam/">🧘 Tâm — Tinh thần</a></li>
          <li><a href="https://huongdi.sol.vn/">🎯 Trí — Sự nghiệp</a></li>
          <li><a href="https://sol.vn/khang-sol/">Khang Sol — Founder</a></li>
        </ul>"""

NEW_VE_SOL_COL = """<h4>Về Sol</h4>
        <ul>
          <li><a href="https://sol.vn/" rel="noopener">🏠 sol.vn</a></li>
          <li><a href="https://sol.vn/sol-la-gi/" rel="noopener">Sol là gì?</a></li>
          <li><a href="https://sol.vn/khang-sol/" rel="noopener">Khang Sol — Founder</a></li>
          <li><a href="https://sol.vn/sach/tai-khoi-nghiep-dung-huong/" rel="noopener">📖 Sách miễn phí</a></li>
        </ul>"""

# Footer Liên hệ → Cộng đồng
OLD_LIENHE_COL = """<h4>Liên hệ</h4>
        <ul>
          <li><a href="mailto:contact@sol.vn">contact@sol.vn</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook</a></li>
          <li><a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener">Tuyên bố miễn trừ</a></li>
          <li><a href="https://sol.vn/chinh-sach-rieng-tu/" rel="noopener">Chính sách bảo mật</a></li>
        </ul>"""

NEW_CONGDONG_COL = """<h4>Cộng đồng</h4>
        <ul>
          <li><a href="https://www.facebook.com/groups/dicungsol/" target="_blank" rel="noopener">👥 FB Group "Đi Cùng Sol"</a></li>
          <li><a href="#" target="_blank" rel="noopener">💬 Zalo Group</a></li>
          <li><a href="mailto:hello@sol.vn">📧 hello@sol.vn</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook Khang</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
          <li><a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener" style="opacity:.7">Tuyên bố miễn trừ</a></li>
        </ul>"""

# Footer bottom with copyright + Bothuocla inline
OLD_FOOTER_BOTTOM = """<div class="hd-footer__bottom">
      <div>© 2025–2026 <strong>Đi Cùng Sol</strong> · Made with care at Việt Nam</div>
      <div class="hd-footer__disclaim">⚠️ Nội dung mang tính chia sẻ kinh nghiệm — không phải tư vấn tài chính/y tế/luật có giấy phép. <a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener">Xem đầy đủ</a></div>
    </div>"""

NEW_FOOTER_BOTTOM = """<div class="hd-footer__bottom">
      <div>
        © 2025–2026 <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng
        <span class="hd-footer__charity-inline">· 🌟 Phụng sự: <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">bothuocla.sol.vn</a> (cai thuốc lá miễn phí)</span>
      </div>
      <div class="hd-footer__disclaim">⚠️ Nội dung mang tính chia sẻ kinh nghiệm — không phải tư vấn tài chính/y tế/luật có giấy phép. <a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener">Xem đầy đủ</a></div>
    </div>"""

# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def color(text, c):
    codes = {'red': 31, 'green': 32, 'yellow': 33, 'blue': 34, 'cyan': 36, 'bold': 1}
    return f"\033[{codes.get(c, 0)}m{text}\033[0m"

def cleanup_quiz_file(file_path, dry_run=True):
    """Remove Phase 2 static header/footer additions."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    original_size = len(content)
    removed = []

    # 1. Remove CSS block
    if CSS_BLOCK_TO_REMOVE in content:
        content = content.replace(CSS_BLOCK_TO_REMOVE, '')
        removed.append('Removed sol-back-nav + sol-page-footer CSS')

    # 2. Remove HTML back-nav variants
    for variant in BACK_NAV_VARIANTS:
        if variant in content:
            content = content.replace('\n' + variant, '')
            content = content.replace(variant, '')
            removed.append('Removed sol-back-nav HTML')
            break

    # 3. Remove mini footer HTML
    if FOOTER_TO_REMOVE in content:
        content = content.replace(FOOTER_TO_REMOVE, '')
        removed.append('Removed sol-page-footer HTML')

    if removed and not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    return removed, original_size, len(content)

def update_sol_ui_js(dry_run=True):
    """Update sol-ui.js with V3 branding."""
    js_path = os.path.join(PUBLIC_DIR, 'sol-ui.js')
    if not os.path.exists(js_path):
        return None
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    original_size = len(content)
    applied = []

    patches = [
        ('NAV_ITEMS → Bước 1/2/3 Việt hóa', OLD_NAV_ITEMS, NEW_NAV_ITEMS),
        ('CTA "Bắt đầu →" → "Bắt đầu miễn phí →"', OLD_CTA_LABEL, NEW_CTA_LABEL),
        ('Remove Thân/Tâm/Trí pills', OLD_PILLS, NEW_PILLS),
        ('Footer motto V3', OLD_MOTTO, NEW_MOTTO),
        ('Footer Hệ thống → Sol La Bàn (Bước 1-5)', OLD_HETHONG_COL, NEW_HETHONG_COL),
        ('Footer Sol Ecosystem → Về Sol (bỏ Thân/Tâm/Trí)', OLD_SOL_ECO_COL, NEW_VE_SOL_COL),
        ('Footer Liên hệ → Cộng đồng', OLD_LIENHE_COL, NEW_CONGDONG_COL),
        ('Footer bottom + Bothuocla inline', OLD_FOOTER_BOTTOM, NEW_FOOTER_BOTTOM),
    ]

    for desc, old, new in patches:
        if old in content:
            content = content.replace(old, new)
            applied.append(desc)

    if applied and not dry_run:
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(content)

    return applied, original_size, len(content)

def create_backup():
    timestamp = datetime.now().strftime('%Y%m%d-%H%M')
    backup_path = f"{BACKUP_DIR}/huongdi-phase2-fix-backup-{timestamp}.tar.gz"
    print(color(f"📦 Creating backup at {backup_path}...", 'cyan'))
    result = subprocess.run(
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
    print(color("  Phase 2 FIX — Cleanup + sol-ui.js V3 update", 'bold'))
    print(color("═" * 60 + "\n", 'cyan'))

    if DRY_RUN:
        print(color("🔍 DRY-RUN MODE — no files modified\n", 'yellow'))
    else:
        print(color("⚠️  APPLY MODE — files will be modified!\n", 'red'))

    if not os.path.exists(PUBLIC_DIR):
        print(color(f"❌ Directory not found: {PUBLIC_DIR}", 'red'))
        sys.exit(1)

    if not DRY_RUN:
        backup_path = create_backup()
        if not backup_path:
            sys.exit(1)
        print()
    else:
        backup_path = None

    # STEP 1: Cleanup 3 quiz files
    print(color("═══ STEP 1: Cleanup 3 quiz files ═══", 'cyan'))
    print()
    total_removed = 0
    for rel in QUIZ_FILES:
        full = os.path.join(PUBLIC_DIR, rel)
        if not os.path.exists(full):
            print(color(f"⚠️  Not found: {rel}", 'yellow'))
            continue
        print(color(f"📄 {rel}", 'cyan'))
        removed, old, new = cleanup_quiz_file(full, dry_run=DRY_RUN)
        if removed:
            total_removed += len(removed)
            for r in removed:
                marker = "✅" if not DRY_RUN else "📝"
                print(f"  {marker} {r}")
            print(color(f"  📊 Size: {old} → {new} ({new - old:+d})", 'cyan'))
        else:
            print(color("  ⚪ No cleanup needed", 'yellow'))
        print()

    # STEP 2: Update sol-ui.js
    print(color("═══ STEP 2: Update sol-ui.js V3 ═══", 'cyan'))
    print()
    print(color("📄 sol-ui.js", 'cyan'))
    result = update_sol_ui_js(dry_run=DRY_RUN)
    if result is None:
        print(color("  ❌ sol-ui.js not found!", 'red'))
    else:
        applied, old, new = result
        if applied:
            for desc in applied:
                marker = "✅" if not DRY_RUN else "📝"
                print(f"  {marker} {desc}")
            print(color(f"  📊 Size: {old} → {new} ({new - old:+d})", 'cyan'))
        else:
            print(color("  ⚪ No patches matched (maybe already updated)", 'yellow'))
    print()

    # Summary
    print(color("═" * 60, 'cyan'))
    print(color("  Summary", 'bold'))
    print(color("═" * 60, 'cyan'))
    if DRY_RUN:
        print()
        print(color("  ➡️  To apply: sudo python3 huongdi-phase2-fix.py --apply", 'yellow'))
    else:
        print()
        print(color("  ✅ Done! Hard refresh 3 URL trên Incognito:", 'green'))
        print(color("     https://huongdi.sol.vn/kham-pha-ban-than/?v=4", 'green'))
        print(color("     https://huongdi.sol.vn/kiem-ke-nguon-luc/?v=4", 'green'))
        print(color("     https://huongdi.sol.vn/la-ban-huong-di/?v=4", 'green'))
        print()
        print(color("  Expect:", 'cyan'))
        print(color("    • Header Sol La Bàn (giống landing page V3)", 'cyan'))
        print(color("    • Nav: Bước 1: Thấu hiểu / Bước 2: Khai phá / Bước 3: Chọn hướng", 'cyan'))
        print(color("    • CTA 'Bắt đầu miễn phí →'", 'cyan'))
        print(color("    • KHÔNG còn Thân/Tâm/Trí pills", 'cyan'))
        print(color("    • Footer V3 với Sol La Bàn brand + Bothuocla inline", 'cyan'))
        print(color("    • Body: buttons + headings màu navy", 'cyan'))
        print()
        print(color("  🛡️  Rollback (nếu lỗi):", 'yellow'))
        print(color(f"     sudo tar -xzf {backup_path} -C /var/www/huongdi/", 'yellow'))
    print()

if __name__ == '__main__':
    main()
