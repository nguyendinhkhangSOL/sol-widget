#!/usr/bin/env python3
"""
============================================================
 huongdi.sol.vn — Update header + footer V3 (Sol La Bàn)
============================================================

Brand alignment với sol.vn V3:
  1. Bỏ Thân/Tâm/Trí pills khỏi header
  2. Đổi nav main → 5 Bước + 37 Mô hình + Sol Đồng Hành
  3. Đổi CTA "Bắt đầu →" → "Bắt đầu miễn phí →"
  4. Đổi motto footer → "Đúng hướng, đúng bước, đúng tương lai"
  5. Đổi cột "Hệ thống" → "Sol La Bàn" + Bước 1/2/3 Việt hóa
  6. Đổi cột "Sol Ecosystem" → "Về Sol" (bỏ Thân/Tâm/Trí)
  7. Đổi cột "Liên hệ" → "Cộng đồng" (FB Group + Zalo)
  8. Đổi copyright → "Tái khởi nghiệp đúng hướng"
  9. Thêm strip "🌟 Dự án Phụng sự Cộng đồng" (Bothuocla)
 10. Update meta: "40-65" → "40-60", "đàn ông Việt" → "người Việt"

URL slug giữ NGUYÊN: /kham-pha-ban-than/, /kiem-ke-nguon-luc/, /la-ban-huong-di/
(Chỉ đổi display name, không đổi URL — bảo toàn SEO)

Usage:
  sudo python3 huongdi-update-v3.py            # Dry-run (xem trước, KHÔNG thay đổi)
  sudo python3 huongdi-update-v3.py --apply    # Apply patches (có backup tự động)

Backup được lưu tại: /root/huongdi-backup-YYYYMMDD-HHMM.tar.gz
"""

import os
import re
import sys
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════
PUBLIC_DIR = '/var/www/huongdi/public'
CSS_FILE = '/var/www/huongdi/public/css/style.css'
BACKUP_DIR = '/root'

DRY_RUN = '--apply' not in sys.argv

# ═══════════════════════════════════════════════════════════════
# PATCHES — (description, find_pattern, replace_pattern)
# ═══════════════════════════════════════════════════════════════

PATCHES_HTML = [
    # ───────── HEADER ─────────
    ('Remove Thân/Tâm/Trí pills',
     '''<nav class="hd-nav-pillars" aria-label="3 trụ Sol">
      <a href="https://bothuocla.sol.vn/">Thân</a>
      <a href="https://sol.vn/ngam/">Tâm</a>
      <a href="https://huongdi.sol.vn/" class="active" aria-current="page">Trí</a>
    </nav>''',
     ''),

    ('Update nav main → Sol La Bàn',
     '''<nav class="hd-nav-main" aria-label="Huongdi navigation">
      <a href="#system">Hệ thống</a>
      <a href="#direction-db">DirectionDB</a>
      <a href="#roadmap">Roadmap</a>
      <a href="#ai-mentor">AI Mentor</a>
      <a href="https://sol.vn/huong-di/" rel="noopener">Bài viết</a>
    </nav>''',
     '''<nav class="hd-nav-main" aria-label="Sol La Bàn navigation">
      <a href="#system">🧭 5 Bước</a>
      <a href="#direction-db">📚 37 Mô hình</a>
      <a href="#roadmap">🗺️ Roadmap 90 ngày</a>
      <a href="#ai-mentor">🤖 Sol Đồng Hành</a>
      <a href="https://sol.vn/huong-di/" rel="noopener">✍️ Bài viết</a>
    </nav>'''),

    ('Update header CTA',
     '<a href="/kham-pha-ban-than/" class="hd-cta">Bắt đầu →</a>',
     '<a href="/kham-pha-ban-than/" class="hd-cta">Bắt đầu miễn phí →</a>'),

    # ───────── FOOTER MOTTO ─────────
    ('Update footer motto',
     '<p class="hd-footer__motto">Đi cùng nhau, đường dài đỡ mỏi.</p>',
     '<p class="hd-footer__motto">Đúng hướng,<br>đúng bước,<br>đúng tương lai.</p>'),

    # ───────── FOOTER COL: Hệ thống → Sol La Bàn ─────────
    ('Update Hệ thống col → Sol La Bàn (5 Bước Việt hóa)',
     '''<h4>Hệ thống</h4>
        <ul>
          <li><a href="/kham-pha-ban-than/">Khám phá bản thân (P1)</a></li>
          <li><a href="/kiem-ke-nguon-luc/">Kiểm kê nguồn lực (P2)</a></li>
          <li><a href="/la-ban-huong-di/">La bàn hướng đi (P3)</a></li>
          <li><a href="#system">Roadmap™ (sắp có)</a></li>
          <li><a href="#system">AI Mentor™ (sắp có)</a></li>
        </ul>''',
     '''<h4>Sol La Bàn</h4>
        <ul>
          <li><a href="/kham-pha-ban-than/">Bước 1 · Thấu hiểu</a></li>
          <li><a href="/kiem-ke-nguon-luc/">Bước 2 · Khai phá</a></li>
          <li><a href="/la-ban-huong-di/">Bước 3 · Chọn hướng</a></li>
          <li><a href="#system">Bước 4 · Hành động <span style="opacity:.6">(sắp có)</span></a></li>
          <li><a href="#system">Bước 5 · An toàn bền vững <span style="opacity:.6">(sắp có)</span></a></li>
        </ul>'''),

    # ───────── FOOTER COL: Sol Ecosystem → Về Sol ─────────
    ('Replace Sol Ecosystem (bỏ Thân/Tâm/Trí) → Về Sol',
     '''<h4>Sol Ecosystem</h4>
        <ul>
          <li><a href="https://bothuocla.sol.vn/">🌿 Thân — Sức khoẻ</a></li>
          <li><a href="https://sol.vn/ngam/">🧘 Tâm — Tinh thần</a></li>
          <li><a href="https://huongdi.sol.vn/">🎯 Trí — Sự nghiệp</a></li>
          <li><a href="https://sol.vn/khang-sol/">Khang Sol — Founder</a></li>
        </ul>''',
     '''<h4>Về Sol</h4>
        <ul>
          <li><a href="https://sol.vn/" rel="noopener">🏠 sol.vn</a></li>
          <li><a href="https://sol.vn/sol-la-gi/" rel="noopener">Sol là gì?</a></li>
          <li><a href="https://sol.vn/khang-sol/" rel="noopener">Khang Sol — Founder</a></li>
          <li><a href="https://sol.vn/sach/tai-khoi-nghiep-dung-huong/" rel="noopener">📖 Sách miễn phí</a></li>
        </ul>'''),

    # ───────── FOOTER COL: Liên hệ → Cộng đồng ─────────
    ('Rename Liên hệ → Cộng đồng (đẩy FB Group lên đầu)',
     '''<h4>Liên hệ</h4>
        <ul>
          <li><a href="mailto:contact@sol.vn">contact@sol.vn</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook</a></li>
          <li><a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener">Tuyên bố miễn trừ</a></li>
          <li><a href="https://sol.vn/chinh-sach-rieng-tu/" rel="noopener">Chính sách bảo mật</a></li>
        </ul>''',
     '''<h4>Cộng đồng</h4>
        <ul>
          <li><a href="https://www.facebook.com/groups/dicungsol/" target="_blank" rel="noopener">👥 FB Group "Đi Cùng Sol"</a></li>
          <li><a href="#" target="_blank" rel="noopener">💬 Zalo Group</a></li>
          <li><a href="mailto:hello@sol.vn">📧 hello@sol.vn</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook Khang</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
          <li><a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener" style="opacity:.7">Tuyên bố miễn trừ</a></li>
        </ul>'''),

    # ───────── FOOTER BOTTOM: Add Bothuocla charity strip ─────────
    ('Add Bothuocla charity strip BEFORE footer bottom',
     '<div class="hd-footer__bottom">',
     '''<!-- Dự án phụng sự cộng đồng -->
    <div class="hd-footer__charity">
      <span class="hd-footer__charity-label">🌟 Dự án Phụng sự Cộng đồng</span>
      <span class="hd-footer__charity-text">
        <strong>🚭 Bothuocla.sol.vn</strong> — Hỗ trợ cai thuốc lá miễn phí cho cộng đồng. Phi lợi nhuận, đồng hành 100%.
      </span>
      <a href="https://bothuocla.sol.vn/" class="hd-footer__charity-link" target="_blank" rel="noopener">Truy cập dự án →</a>
    </div>
    <div class="hd-footer__bottom">'''),

    # ───────── FOOTER BOTTOM: Copyright ─────────
    ('Update copyright',
     '<div>© 2025–2026 <strong>Đi Cùng Sol</strong> · Made with care at Việt Nam</div>',
     '<div>© 2025–2026 <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng</div>'),

    # ───────── META + CONTENT (target audience) ─────────
    ('Meta: 40-65 → 40-60', '40-65', '40-60'),
    ('Meta: tuổi 45+ → tuổi 40-60', 'tuổi 45+', 'tuổi 40-60'),
    ('Meta: đàn ông Việt → người Việt', 'đàn ông Việt', 'người Việt'),
    ('Meta: U45 → 40-60', 'U45', '40-60'),
]

# ═══════════════════════════════════════════════════════════════
# CSS ADDITIONS — Charity strip styles
# ═══════════════════════════════════════════════════════════════

CSS_CHARITY = '''
/* ═══════════════════════════════════════════════════════════════════
   V3 — Dự án Phụng sự Cộng đồng (Bothuocla charity strip)
   ═══════════════════════════════════════════════════════════════════ */
.hd-footer__charity {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 14px;
  padding: 20px 24px;
  margin: 32px 0 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.hd-footer__charity-label {
  font-family: 'Lora', Georgia, serif;
  color: #f59e0b;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 700;
  flex-shrink: 0;
}
.hd-footer__charity-text {
  flex: 1;
  min-width: 240px;
  font-size: 13.5px;
  color: #cbd5e1;
  line-height: 1.6;
}
.hd-footer__charity-text strong { color: white; font-weight: 700; }
.hd-footer__charity-link {
  color: #f59e0b;
  text-decoration: none;
  font-weight: 700;
  white-space: nowrap;
  font-size: 13.5px;
}
.hd-footer__charity-link:hover { text-decoration: underline; }
@media (max-width: 768px) {
  .hd-footer__charity { flex-direction: column; align-items: flex-start; gap: 12px; padding: 18px 20px; }
}
'''

# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def color(text, c):
    codes = {'red': 31, 'green': 32, 'yellow': 33, 'blue': 34, 'cyan': 36, 'bold': 1}
    return f"\033[{codes.get(c, 0)}m{text}\033[0m"

def find_html_files(directory):
    """Find all .html files recursively."""
    html_files = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'admin']]
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))
    return sorted(html_files)

def apply_patches_to_file(filepath, dry_run=True):
    """Apply all patches to a single file. Returns (changes_count, applied_patches)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    applied = []

    for desc, find_str, replace_str in PATCHES_HTML:
        if find_str in content:
            count = content.count(find_str)
            content = content.replace(find_str, replace_str)
            applied.append((desc, count))

    if content != original and not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return len(applied), applied

def update_css(dry_run=True):
    """Add charity strip CSS to style.css if not already present."""
    if not os.path.exists(CSS_FILE):
        print(color(f"⚠️  CSS file not found: {CSS_FILE}", 'yellow'))
        return False

    with open(CSS_FILE, 'r', encoding='utf-8') as f:
        css_content = f.read()

    if 'hd-footer__charity' in css_content:
        print(color("  ✅ Charity CSS already present, skipping", 'green'))
        return True

    if not dry_run:
        with open(CSS_FILE, 'a', encoding='utf-8') as f:
            f.write('\n' + CSS_CHARITY)
        print(color(f"  ✅ Added charity CSS to {CSS_FILE}", 'green'))
    else:
        print(color(f"  📝 Would add charity CSS (+{len(CSS_CHARITY)} chars)", 'cyan'))
    return True

def create_backup():
    """Create tarball backup of public/ directory."""
    timestamp = datetime.now().strftime('%Y%m%d-%H%M')
    backup_path = f"{BACKUP_DIR}/huongdi-backup-{timestamp}.tar.gz"
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

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def main():
    print(color("\n" + "═" * 60, 'cyan'))
    print(color("  huongdi.sol.vn V3 Update — Sol La Bàn brand", 'bold'))
    print(color("═" * 60 + "\n", 'cyan'))

    if DRY_RUN:
        print(color("🔍 DRY-RUN MODE (no files modified)\n", 'yellow'))
        print(color("   Run with --apply để thực hiện thay đổi:", 'yellow'))
        print(color("   sudo python3 huongdi-update-v3.py --apply\n", 'yellow'))
    else:
        print(color("⚠️  APPLY MODE — files will be modified!\n", 'red'))

    # 1. Check directory exists
    if not os.path.exists(PUBLIC_DIR):
        print(color(f"❌ Directory not found: {PUBLIC_DIR}", 'red'))
        sys.exit(1)

    # 2. Find HTML files
    html_files = find_html_files(PUBLIC_DIR)
    print(color(f"📁 Found {len(html_files)} HTML file(s) in {PUBLIC_DIR}:", 'cyan'))
    for f in html_files:
        rel = os.path.relpath(f, PUBLIC_DIR)
        print(f"   • {rel}")
    print()

    if not html_files:
        print(color("❌ No HTML files found!", 'red'))
        sys.exit(1)

    # 3. Backup (only in apply mode)
    if not DRY_RUN:
        backup_path = create_backup()
        if not backup_path:
            print(color("❌ Aborting due to backup failure", 'red'))
            sys.exit(1)
        print()

    # 4. Apply patches to each file
    total_changes = 0
    files_modified = 0
    for filepath in html_files:
        rel = os.path.relpath(filepath, PUBLIC_DIR)
        print(color(f"📄 {rel}", 'cyan'))
        changes, applied = apply_patches_to_file(filepath, dry_run=DRY_RUN)
        if changes == 0:
            print(color("  ⚪ No changes needed", 'yellow'))
        else:
            files_modified += 1
            total_changes += changes
            for desc, count in applied:
                marker = "✅" if not DRY_RUN else "📝"
                print(f"  {marker} {desc} ({count}x)")
        print()

    # 5. Update CSS
    print(color("🎨 CSS update:", 'cyan'))
    update_css(dry_run=DRY_RUN)
    print()

    # 6. Summary
    print(color("═" * 60, 'cyan'))
    print(color("  Summary", 'bold'))
    print(color("═" * 60, 'cyan'))
    print(f"  Files scanned:    {len(html_files)}")
    print(f"  Files modified:   {files_modified}")
    print(f"  Total patches:    {total_changes}")
    if DRY_RUN:
        print()
        print(color("  ➡️  To apply: sudo python3 huongdi-update-v3.py --apply", 'yellow'))
    else:
        print()
        print(color("  ✅ Done! Test on Incognito:", 'green'))
        print(color("     https://huongdi.sol.vn/", 'green'))
        print(color("     https://huongdi.sol.vn/kham-pha-ban-than/", 'green'))
        print(color("     https://huongdi.sol.vn/kiem-ke-nguon-luc/", 'green'))
        print(color("     https://huongdi.sol.vn/la-ban-huong-di/", 'green'))
        print()
        print(color("  🛡️  Rollback (nếu lỗi):", 'yellow'))
        print(color(f"     sudo tar -xzf {backup_path} -C /var/www/huongdi/", 'yellow'))
    print()

if __name__ == '__main__':
    main()
