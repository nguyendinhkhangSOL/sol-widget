#!/usr/bin/env python3
"""
Sol SEO Content — WordPress REST API Publisher
================================================
Publish 16 bài SEO lên sol.vn/huong-di/{slug} via WP REST API.

USAGE:
    pip3 install requests --break-system-packages

    # Set credentials (chỉ 1 lần trong session):
    export WP_URL="https://sol.vn"
    export WP_USER="khang"
    export WP_APP_PASS="xxxx xxxx xxxx xxxx"   # Application Password (có spaces)

    # List 16 bài:
    python3 wp-publish-rest.py --list

    # Test connection:
    python3 wp-publish-rest.py --test

    # Publish 1 bài (as draft):
    python3 wp-publish-rest.py --article 01 --draft

    # Publish 1 bài live:
    python3 wp-publish-rest.py --article 01

    # Publish TẤT CẢ 16 bài:
    python3 wp-publish-rest.py --all --draft   # tất cả draft
    python3 wp-publish-rest.py --all           # tất cả live

TẠO APPLICATION PASSWORD:
    1. WP Admin sol.vn → Users → Your Profile
    2. Cuộn xuống "Application Passwords"
    3. Name: "SEO Publisher" → Add New
    4. Copy 24 ký tự (kèm spaces) — dán vào WP_APP_PASS
"""

import os
import sys
import argparse
import re
import json
from pathlib import Path

try:
    import requests
except ImportError:
    print("❌ Chưa cài requests")
    print("   Chạy: pip3 install requests --break-system-packages")
    sys.exit(1)

WP_URL = os.getenv('WP_URL', 'https://sol.vn').rstrip('/')
WP_USER = os.getenv('WP_USER', 'admin')
WP_APP_PASS = os.getenv('WP_APP_PASS', '')

ARTICLES_DIR = Path(__file__).parent.parent / 'articles'
FEATURED_DIR = Path(__file__).parent.parent / 'featured-images'

# CPT endpoint (dùng CPT huong_di với rest_base='huong-di')
CPT_ENDPOINT = 'huong-di'
# 16 post_id cũ ở post type "post" cần delete (từ lần chạy trước)
OLD_POST_IDS_TO_DELETE = [3464, 3465, 3466, 3467, 3468, 3469, 3470, 3471,
                          3472, 3473, 3474, 3475, 3476, 3477, 3478, 3479]

ARTICLES = {
    '01': {'file': '01-pillar-tai-khoi-nghiep-tinh-gon.html', 'title': 'Tái khởi nghiệp tinh gọn cho người 40-60 — Guide toàn diện 2026', 'slug': 'tai-khoi-nghiep-tinh-gon-40-60', 'excerpt': 'Framework 5 Bước Sol La Bàn + 37 mô hình kinh doanh + 5 case study 40-60. Guide toàn diện cho người Việt tái khởi nghiệp tinh gọn.', 'tags': ['tái khởi nghiệp', 'tinh gọn', '40-60', 'sol la bàn', 'pillar'], 'featured_image': '01-PILLAR.png'},
    '02': {'file': '02-A1-40-tuoi-nen-kinh-doanh-gi.html', 'title': '40 tuổi nên kinh doanh gì? 10 mô hình cho người Việt 2026', 'slug': '40-tuoi-nen-kinh-doanh-gi', 'excerpt': '10 mô hình kinh doanh phù hợp cho người 40 tuổi tại Việt Nam. Từ Fractional Executive đến Digital Products.', 'tags': ['40 tuổi', 'kinh doanh', 'khởi nghiệp'], 'featured_image': '02-A1.png'},
    '03': {'file': '03-A2-45-tuoi-nen-kinh-doanh-gi.html', 'title': '45 tuổi nên kinh doanh gì? 8 mô hình + Framework 5 bước | Sol', 'slug': '45-tuoi-nen-kinh-doanh-gi', 'excerpt': '45 tuổi vẫn còn 15+ năm để build. 8 mô hình kinh doanh phù hợp + Case study Anh Tuấn 45 tuổi.', 'tags': ['45 tuổi', 'kinh doanh', 'khởi nghiệp'], 'featured_image': '03-A2.png'},
    '04': {'file': '04-A3-50-tuoi-nen-kinh-doanh-gi.html', 'title': '50 tuổi có nên kinh doanh không? 6 hướng đi phù hợp | Sol', 'slug': '50-tuoi-nen-kinh-doanh-gi', 'excerpt': '50 tuổi vẫn còn 15+ năm để build ý nghĩa. 6 mô hình kinh doanh tận dụng lợi thế của người 50+.', 'tags': ['50 tuổi', 'kinh doanh', 'khởi nghiệp'], 'featured_image': '04-A3.png'},
    '05': {'file': '05-B1-doanh-nghiep-1-nguoi.html', 'title': 'Doanh nghiệp 1 người là gì? Mô hình mới cho người 40-60 | Sol', 'slug': 'doanh-nghiep-1-nguoi-la-gi', 'excerpt': 'Doanh nghiệp 1 người (Company of One) — mô hình tinh gọn cho người 40-60 chuyển hướng.', 'tags': ['doanh nghiệp 1 người', 'company of one', 'tinh gọn'], 'featured_image': '05-B1.png'},
    '06': {'file': '06-B2-one-person-company.html', 'title': 'One Person Company là gì? Xu hướng kinh doanh 2026 | Sol', 'slug': 'one-person-company-la-gi', 'excerpt': 'One Person Company (OPC) — mô hình kinh doanh 1 người. Cách áp dụng tại Việt Nam cho người 40-60.', 'tags': ['one person company', 'opc', 'ai', 'startup'], 'featured_image': '06-B2.png'},
    '07': {'file': '07-B3-kinh-doanh-tinh-gon.html', 'title': 'Kinh doanh tinh gọn là gì? Nguyên tắc & Cách áp dụng | Sol', 'slug': 'kinh-doanh-tinh-gon-la-gi', 'excerpt': 'Kinh doanh tinh gọn (Lean Business) — vốn ít, người ít, chi phí ít, lợi nhuận cao.', 'tags': ['kinh doanh tinh gọn', 'lean business', 'khởi nghiệp'], 'featured_image': '07-B3.png'},
    '08': {'file': '08-C1-5-buoc-sol-la-ban.html', 'title': '5 Bước Sol La Bàn — Hướng dẫn tái khởi nghiệp 40-60 | Sol', 'slug': '5-buoc-sol-la-ban', 'excerpt': 'Framework 5 Bước Sol La Bàn giúp người 40-60 tìm đúng hướng đi kinh doanh.', 'tags': ['sol la bàn', 'framework', '5 bước'], 'featured_image': '08-C1.png'},
    '09': {'file': '09-C2-ai-cho-nguoi-40-60.html', 'title': 'AI cho người 40-60 — Cách dùng ChatGPT tăng thu nhập | Sol', 'slug': 'ai-cho-nguoi-40-60', 'excerpt': 'AI không phải cho giới trẻ. Cách người 40-60 tận dụng AI — 40 câu hỏi mẫu bằng tiếng Việt.', 'tags': ['ai', 'chatgpt', 'claude', '40-60'], 'featured_image': '09-C2.png'},
    '10': {'file': '10-C3-he-sinh-thai-sol.html', 'title': 'Hệ sinh thái Sol — Sách, Trí, Cộng đồng cho tuổi 40-60 | Sol', 'slug': 'he-sinh-thai-sol', 'excerpt': 'Hệ sinh thái Sol gồm 3 trụ: Sách, Trí (Sol La Bàn), Cộng đồng (Đi Cùng Sol).', 'tags': ['hệ sinh thái sol', 'sol la bàn', 'cộng đồng'], 'featured_image': '10-C3.png'},
    '11': {'file': '11-D1-cuu-cfo-chuyen-huong.html', 'title': 'Cựu CFO chuyển hướng — 5 mô hình kinh doanh hiệu quả | Sol', 'slug': 'cuu-cfo-chuyen-huong-kinh-doanh', 'excerpt': 'Cựu CFO có 3 lợi thế đặc biệt khi khởi nghiệp. 5 mô hình kinh doanh phù hợp.', 'tags': ['cfo', 'chuyển hướng', 'fractional cfo'], 'featured_image': '11-D1.png'},
    '12': {'file': '12-D2-nghi-viec-45-tuoi.html', 'title': 'Nghỉ việc tuổi 45 nên làm gì? 6 bước quyết định | Sol', 'slug': 'nghi-viec-45-tuoi', 'excerpt': 'Nghỉ việc tuổi 45 — Nên hay không? Framework 6 bước quyết định.', 'tags': ['nghỉ việc', '45 tuổi', 'chuyển hướng'], 'featured_image': '12-D2.png'},
    '13': {'file': '13-D3-fractional-cfo.html', 'title': 'Fractional CFO là gì? Mô hình kinh doanh cho cựu CFO | Sol', 'slug': 'fractional-cfo-la-gi', 'excerpt': 'Fractional CFO — CFO thời vụ cho SME. Thu nhập 80-150 triệu/tháng, 30h/tuần.', 'tags': ['fractional cfo', 'cfo', 'sme'], 'featured_image': '13-D3.png'},
    '14': {'file': '14-S1-5-dau-hieu-can-chuyen-huong.html', 'title': '5 dấu hiệu bạn cần chuyển hướng nghề nghiệp tuổi 45 | Sol', 'slug': '5-dau-hieu-can-chuyen-huong-tuoi-45', 'excerpt': '5 dấu hiệu rõ ràng bạn cần chuyển hướng nghề nghiệp ngay ở tuổi 45.', 'tags': ['dấu hiệu', '45 tuổi', 'chuyển hướng'], 'featured_image': '14-S1.png'},
    '15': {'file': '15-S2-checklist-30-ngay.html', 'title': 'Checklist 30 ngày chuẩn bị khởi nghiệp tuổi 45 | Sol', 'slug': 'checklist-30-ngay-chuan-bi-khoi-nghiep', 'excerpt': 'Checklist 30 ngày chuẩn bị tái khởi nghiệp tuổi 40-60. 30 tasks cụ thể theo ngày.', 'tags': ['checklist', '30 ngày', 'khởi nghiệp'], 'featured_image': '15-S2.png'},
    '16': {'file': '16-S3-10-sai-lam-khoi-nghiep-45.html', 'title': '10 sai lầm khởi nghiệp tuổi 45+ (và cách tránh) | Sol', 'slug': '10-sai-lam-khoi-nghiep-tuoi-45', 'excerpt': '10 sai lầm phổ biến khi khởi nghiệp tuổi 45+ khiến 70% thất bại. Cách tránh chi tiết.', 'tags': ['sai lầm', 'khởi nghiệp', '45 tuổi'], 'featured_image': '16-S3.png'}
}

# Category "Hướng Đi" — script sẽ tự tìm hoặc tạo
CATEGORY_NAME = 'Hướng Đi'


def get_auth():
    """WordPress App Password auth."""
    if not WP_APP_PASS:
        print("❌ Chưa set WP_APP_PASS")
        print("   Chạy: export WP_APP_PASS='xxxx xxxx xxxx xxxx'")
        sys.exit(1)
    return (WP_USER, WP_APP_PASS)


def strip_html_comments(content):
    return re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL).strip()


def api(endpoint, method='GET', **kwargs):
    """Wrapper cho REST API calls."""
    url = f"{WP_URL}/wp-json/wp/v2/{endpoint}"
    r = requests.request(method, url, auth=get_auth(), timeout=30, **kwargs)
    return r


def test_connection():
    """Test authentication + basic access."""
    print(f"🔍 Test kết nối {WP_URL}")
    print(f"   User: {WP_USER}")
    print(f"   Pass: {'*' * len(WP_APP_PASS) if WP_APP_PASS else '(chưa set)'}")

    try:
        r = api('users/me')
        if r.status_code == 200:
            user = r.json()
            print(f"✅ Auth OK — Logged in as: {user.get('name')} ({user.get('id')})")
            return True
        elif r.status_code == 401:
            print(f"❌ Auth thất bại (401) — kiểm tra WP_USER + WP_APP_PASS")
            return False
        else:
            print(f"❌ HTTP {r.status_code}: {r.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Kết nối lỗi: {e}")
        return False


def get_or_create_category(name):
    """Tìm hoặc tạo category. Return ID."""
    r = api('categories', params={'search': name})
    if r.ok:
        for cat in r.json():
            if cat['name'] == name:
                return cat['id']

    # Không có → tạo mới
    r = api('categories', method='POST', json={'name': name})
    if r.ok:
        return r.json()['id']
    print(f"⚠️  Không tạo được category '{name}': {r.text[:200]}")
    return None


def get_or_create_tag(name):
    """Tìm hoặc tạo tag. Return ID."""
    r = api('tags', params={'search': name})
    if r.ok:
        for tag in r.json():
            if tag['name'].lower() == name.lower():
                return tag['id']

    r = api('tags', method='POST', json={'name': name})
    if r.ok:
        return r.json()['id']
    print(f"⚠️  Không tạo được tag '{name}': {r.text[:200]}")
    return None


def upload_featured_image(image_path):
    """Upload media → return media ID."""
    if not image_path.exists():
        print(f"   ⚠️  Featured image không có: {image_path.name} (skip)")
        return None

    url = f"{WP_URL}/wp-json/wp/v2/media"
    with open(image_path, 'rb') as f:
        headers = {
            'Content-Disposition': f'attachment; filename="{image_path.name}"',
            'Content-Type': 'image/png',
        }
        r = requests.post(url, headers=headers, data=f, auth=get_auth(), timeout=60)

    if r.ok:
        media_id = r.json()['id']
        print(f"   ✅ Uploaded image: ID {media_id}")
        return media_id
    print(f"   ⚠️  Upload thất bại: {r.status_code} {r.text[:200]}")
    return None


def find_existing_post(slug):
    """Kiểm tra bài đã tồn tại với slug này chưa (trong CPT huong_di)."""
    r = api(CPT_ENDPOINT, params={'slug': slug, 'status': 'any'})
    if r.ok and r.json():
        return r.json()[0]['id']
    return None


def delete_old_posts():
    """Xoá 16 bài cũ ở post type 'post' (từ lần chạy trước)."""
    print("\n[!] Xoá 16 bài cũ ở post type 'post' (trước khi migrate sang CPT huong_di)...")
    ok = 0
    for pid in OLD_POST_IDS_TO_DELETE:
        r = api(f'posts/{pid}', method='DELETE', params={'force': True})
        if r.ok:
            print(f"   ✅ Deleted post_id {pid}")
            ok += 1
        else:
            print(f"   ⚠️  post_id {pid}: {r.status_code} — có thể đã xoá rồi")
    print(f"\n[OK] Đã xoá {ok}/{len(OLD_POST_IDS_TO_DELETE)} bài cũ.")


def publish_article(article_id, draft=False, force=False):
    if article_id not in ARTICLES:
        print(f"❌ Article {article_id} không tồn tại")
        return None

    meta = ARTICLES[article_id]
    path = ARTICLES_DIR / meta['file']
    if not path.exists():
        print(f"❌ File không có: {path}")
        return None

    print(f"\n{'='*60}")
    print(f"📝 #{article_id} — {meta['title'][:60]}")
    print(f"   Slug: {meta['slug']}")

    # Đọc HTML
    with open(path, 'r', encoding='utf-8') as f:
        content = strip_html_comments(f.read())

    # Kiểm tra đã đăng chưa
    existing_id = find_existing_post(meta['slug'])
    if existing_id and not force:
        print(f"   ⚠️  Bài đã tồn tại (post_id={existing_id}). Dùng --force để update.")
        return existing_id

    # Category + Tags
    cat_id = get_or_create_category(CATEGORY_NAME)
    tag_ids = [tid for t in meta['tags'] if (tid := get_or_create_tag(t))]

    # Featured image
    featured_id = None
    if meta.get('featured_image'):
        featured_id = upload_featured_image(FEATURED_DIR / meta['featured_image'])

    # Build post payload
    payload = {
        'title': meta['title'],
        'content': content,
        'excerpt': meta['excerpt'],
        'slug': meta['slug'],
        'status': 'draft' if draft else 'publish',
    }
    if cat_id:
        payload['categories'] = [cat_id]
    if tag_ids:
        payload['tags'] = tag_ids
    if featured_id:
        payload['featured_media'] = featured_id

    # Create or update trong CPT huong_di
    if existing_id:
        r = api(f'{CPT_ENDPOINT}/{existing_id}', method='POST', json=payload)
    else:
        r = api(CPT_ENDPOINT, method='POST', json=payload)

    if r.ok:
        post_id = r.json()['id']
        status = 'DRAFT' if draft else 'PUBLISHED'
        print(f"   ✅ {status} — Post ID: {post_id}")
        print(f"   🔗 {WP_URL}/huong-di/{meta['slug']}/")
        return post_id

    print(f"   ❌ Fail: {r.status_code} {r.text[:300]}")
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--test', action='store_true', help='Test kết nối auth')
    p.add_argument('--list', action='store_true', help='List 16 articles')
    p.add_argument('--article', help='ID bài (01-16)')
    p.add_argument('--all', action='store_true', help='Publish tất cả 16 bài')
    p.add_argument('--draft', action='store_true', help='Publish as draft')
    p.add_argument('--force', action='store_true', help='Update nếu bài đã tồn tại')
    p.add_argument('--delete-old', action='store_true', help='Xoá 16 bài cũ ở post type "post"')
    args = p.parse_args()

    if args.delete_old:
        if not test_connection():
            return
        delete_old_posts()
        return

    if args.test:
        test_connection()
        return

    if args.list:
        print("\n📚 16 bài SEO Sol La Bàn\n")
        for aid, m in ARTICLES.items():
            print(f"   {aid} — {m['title'][:70]}")
            print(f"        slug: {m['slug']}\n")
        return

    # Verify connection trước khi publish
    if not test_connection():
        print("\n❌ Sửa auth trước khi publish. Dừng lại.")
        return

    if args.all:
        print(f"\n🚀 Publish TẤT CẢ 16 bài — draft={args.draft}\n")
        results = []
        for aid in ARTICLES.keys():
            pid = publish_article(aid, draft=args.draft, force=args.force)
            results.append((aid, pid))

        print(f"\n{'='*60}\n📊 KẾT QUẢ\n{'='*60}")
        ok = sum(1 for _, pid in results if pid)
        print(f"✅ Thành công: {ok}/16")
        for aid, pid in results:
            status = f"✅ {pid}" if pid else "❌ FAILED"
            print(f"   {aid}: {status}")
    elif args.article:
        publish_article(args.article, draft=args.draft, force=args.force)
    else:
        p.print_help()


if __name__ == '__main__':
    main()
