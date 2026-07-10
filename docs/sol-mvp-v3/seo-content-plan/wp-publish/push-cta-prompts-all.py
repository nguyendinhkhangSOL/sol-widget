#!/usr/bin/env python3
"""
Sol AI Prompts CTA Pusher
==========================
Đọc TẤT CẢ bài trong CPT huong-di trên sol.vn.
Nếu bài nào CHƯA CÓ CTA box Prompts hoành tráng → chèn vào cuối content.
Bài đã có → skip.

USAGE:
    python3 push-cta-prompts-all.py
"""

import os
import sys
import re
from pathlib import Path

try:
    import requests
except ImportError:
    print("Cai: pip install requests")
    sys.exit(1)

WP_URL = os.getenv('WP_URL', 'https://sol.vn').rstrip('/')
WP_USER = os.getenv('WP_USER', 'admin')
WP_APP_PASS = os.getenv('WP_APP_PASS', '')

CPT_ENDPOINT = 'huong-di'
CTA_FILE = Path(__file__).parent / 'cta-prompts-hoanh-trang.html'

# Marker để phát hiện bài đã có CTA box mới
NEW_BOX_MARKER = 'SOL AI PROMPTS — CTA BOX HOÀNH TRÁNG'

# Nếu bài đã có link tới /prompts nhưng KHÔNG có marker box mới → cần thay
OLD_LINK_MARKER = 'huongdi.sol.vn/prompts'


def auth():
    if not WP_APP_PASS:
        print("[X] Chua set WP_APP_PASS")
        sys.exit(1)
    return (WP_USER, WP_APP_PASS)


def get_all_huong_di():
    """Lấy toàn bộ bài trong CPT huong-di (paginated)."""
    posts = []
    page = 1
    while True:
        r = requests.get(
            f"{WP_URL}/wp-json/wp/v2/{CPT_ENDPOINT}",
            params={'per_page': 50, 'page': page, 'status': 'publish',
                    '_fields': 'id,title,slug,link,content'},
            auth=auth(), timeout=30
        )
        if not r.ok:
            print(f"[X] Loi fetch page {page}: {r.status_code}")
            break
        batch = r.json()
        if not batch:
            break
        posts.extend(batch)
        # Check has more pages
        total_pages = int(r.headers.get('X-WP-TotalPages', 1))
        if page >= total_pages:
            break
        page += 1
    return posts


def strip_old_cta_box(content):
    """
    Xoá các CTA prompts CŨ (box amber đơn giản) trong content.
    Chỉ giữ nội dung khác. Không đụng vào box mới (marker HOÀNH TRÁNG).
    """
    # Pattern 1: box amber cũ chứa link prompts
    pattern_old = re.compile(
        r'<div style="background:linear-gradient\(135deg,#FFFBEB[^"]*"[^>]*>\s*'
        r'(?:<p[^>]*>[^<]*(?:🤖|Prompt|prompt|AI|c[aâ]u h[oỏ]i AI|Chưa quen)[^<]*</p>\s*)?'
        r'(?:<p[^>]*>[^<]*</p>\s*)?'
        r'<a href="https://huongdi\.sol\.vn/prompts/"[^>]*>[^<]*</a>\s*'
        r'</div>',
        re.DOTALL
    )
    content = pattern_old.sub('', content)

    # Pattern 2: fallback — bất kỳ div amber nào có link prompts
    pattern_fallback = re.compile(
        r'<div style="background:linear-gradient\(135deg,#FFFBEB.*?huongdi\.sol\.vn/prompts/.*?</div>',
        re.DOTALL
    )
    content = pattern_fallback.sub('', content)

    return content


def append_cta_to_content(content, cta_html):
    """
    Chèn CTA vào content:
    - Nếu có <footer> tag → chèn TRƯỚC footer
    - Nếu có </article> → chèn TRƯỚC </article>
    - Nếu có "Bài viết liên quan" heading → chèn TRƯỚC nó
    - Không có gì → append vào cuối
    """
    for marker in ['<h2>Bài viết liên quan</h2>', '<footer', '</article>']:
        idx = content.rfind(marker)
        if idx > 0:
            return content[:idx] + cta_html + '\n\n' + content[idx:]
    # Fallback: append
    return content + '\n\n' + cta_html


def process_post(post, cta_html):
    """Xử lý 1 bài — trả về (action, new_content) hoặc (skip, None)."""
    content = post['content']['rendered']

    if NEW_BOX_MARKER in content:
        return 'skip_has_new_box', None

    # Xoá CTA cũ (nếu có)
    cleaned = strip_old_cta_box(content)

    # Thêm CTA mới hoành tráng
    new_content = append_cta_to_content(cleaned, cta_html)

    return 'update', new_content


def update_post(post_id, new_content):
    r = requests.post(
        f"{WP_URL}/wp-json/wp/v2/{CPT_ENDPOINT}/{post_id}",
        json={'content': new_content},
        auth=auth(), timeout=60
    )
    return r.ok, r.status_code


def main():
    print("=" * 70)
    print("  SOL AI PROMPTS CTA PUSHER — CPT huong-di")
    print("=" * 70)

    if not CTA_FILE.exists():
        print(f"[X] Khong tim thay CTA file: {CTA_FILE}")
        sys.exit(1)

    cta_html = CTA_FILE.read_text(encoding='utf-8').strip()

    # Test auth
    r = requests.get(f"{WP_URL}/wp-json/wp/v2/users/me", auth=auth(), timeout=15)
    if not r.ok:
        print(f"[X] Auth that bai: {r.status_code}")
        sys.exit(1)
    print(f"[OK] Auth: {r.json().get('name')}")

    # Fetch all posts
    print(f"\n[+] Fetching all bai trong CPT huong-di...")
    posts = get_all_huong_di()
    print(f"[OK] Tim thay {len(posts)} bai\n")

    updated = 0
    skipped = 0
    failed = 0

    for p in posts:
        title = p['title']['rendered'][:60]
        action, new_content = process_post(p, cta_html)

        if action == 'skip_has_new_box':
            print(f"  ⊘ SKIP #{p['id']}: {title} (đã có box mới)")
            skipped += 1
        elif action == 'update':
            ok, code = update_post(p['id'], new_content)
            if ok:
                print(f"  ✅ UPDATED #{p['id']}: {title}")
                print(f"     🔗 {p['link']}")
                updated += 1
            else:
                print(f"  ❌ FAIL #{p['id']}: HTTP {code}")
                failed += 1

    print("\n" + "=" * 70)
    print(f"  KET QUA: {updated} updated · {skipped} skipped · {failed} failed")
    print(f"  Total: {len(posts)} bai")
    print("=" * 70)


if __name__ == '__main__':
    main()
