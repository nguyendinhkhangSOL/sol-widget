#!/usr/bin/env python3
"""
Sol SEO Content — WordPress Publish Script
============================================
Publish 16 bài SEO lên sol.vn/huong-di/{slug} via XML-RPC.

USAGE:
    pip3 install python-wordpress-xmlrpc --break-system-packages

    # Đăng 1 bài:
    python3 wp-publish.py --article 01

    # Đăng tất cả:
    python3 wp-publish.py --all

    # Đăng draft (không publish):
    python3 wp-publish.py --article 01 --draft

    # Update bài đã đăng:
    python3 wp-publish.py --article 01 --post-id 12345

CONFIG:
    Sửa 3 biến ENV trước khi chạy:
    export WP_URL="https://sol.vn/xmlrpc.php"
    export WP_USER="khang"
    export WP_PASS="app-password-16-ký-tự"

TẠO APPLICATION PASSWORD:
    1. Đăng nhập WP Admin sol.vn
    2. Users → Profile → Application Passwords
    3. Tạo password "SEO Publisher" → copy 16 chars
"""

import os
import sys
import argparse
import re
from pathlib import Path

try:
    from wordpress_xmlrpc import Client, WordPressPost
    from wordpress_xmlrpc.methods.posts import NewPost, EditPost, GetPost
    from wordpress_xmlrpc.methods import taxonomies
    from wordpress_xmlrpc.methods.media import UploadFile
except ImportError:
    print("❌ Chưa cài python-wordpress-xmlrpc")
    print("   Chạy: pip3 install python-wordpress-xmlrpc --break-system-packages")
    sys.exit(1)

# ============================================================
# CONFIG — sửa 3 biến này qua ENV
# ============================================================
WP_URL = os.getenv('WP_URL', 'https://sol.vn/xmlrpc.php')
WP_USER = os.getenv('WP_USER', 'admin')
WP_PASS = os.getenv('WP_PASS', '')

ARTICLES_DIR = Path(__file__).parent.parent / 'articles'
FEATURED_DIR = Path(__file__).parent.parent / 'featured-images'

# ============================================================
# METADATA — 16 bài
# ============================================================
ARTICLES = {
    '01': {
        'file': '01-pillar-tai-khoi-nghiep-tinh-gon.html',
        'title': 'Tái khởi nghiệp tinh gọn cho người 40-60 — Guide toàn diện 2026',
        'slug': 'tai-khoi-nghiep-tinh-gon-40-60',
        'excerpt': 'Framework 5 Bước Sol La Bàn + 37 mô hình kinh doanh + 5 case study 40-60. Guide toàn diện cho người Việt tái khởi nghiệp tinh gọn.',
        'category': 'Hướng Đi',
        'tags': ['tái khởi nghiệp', 'tinh gọn', '40-60', 'sol la bàn', 'pillar'],
        'featured_image': '01-PILLAR.png'
    },
    '02': {
        'file': '02-A1-40-tuoi-nen-kinh-doanh-gi.html',
        'title': '40 tuổi nên kinh doanh gì? 10 mô hình cho người Việt 2026',
        'slug': '40-tuoi-nen-kinh-doanh-gi',
        'excerpt': '10 mô hình kinh doanh phù hợp cho người 40 tuổi tại Việt Nam. Từ Fractional Executive đến Digital Products. Case study thực tế.',
        'category': 'Hướng Đi',
        'tags': ['40 tuổi', 'kinh doanh', 'khởi nghiệp'],
        'featured_image': '02-A1.png'
    },
    '03': {
        'file': '03-A2-45-tuoi-nen-kinh-doanh-gi.html',
        'title': '45 tuổi nên kinh doanh gì? 8 mô hình + Framework 5 bước | Sol',
        'slug': '45-tuoi-nen-kinh-doanh-gi',
        'excerpt': '45 tuổi vẫn còn 15+ năm để build. 8 mô hình kinh doanh phù hợp + Case study Anh Tuấn 45 tuổi cựu CFO chuyển hướng.',
        'category': 'Hướng Đi',
        'tags': ['45 tuổi', 'kinh doanh', 'khởi nghiệp'],
        'featured_image': '03-A2.png'
    },
    '04': {
        'file': '04-A3-50-tuoi-nen-kinh-doanh-gi.html',
        'title': '50 tuổi có nên kinh doanh không? 6 hướng đi phù hợp | Sol',
        'slug': '50-tuoi-nen-kinh-doanh-gi',
        'excerpt': '50 tuổi vẫn còn 15+ năm để build ý nghĩa. 6 mô hình kinh doanh tận dụng lợi thế của người 50+. Framework Sol La Bàn.',
        'category': 'Hướng Đi',
        'tags': ['50 tuổi', 'kinh doanh', 'khởi nghiệp'],
        'featured_image': '04-A3.png'
    },
    '05': {
        'file': '05-B1-doanh-nghiep-1-nguoi.html',
        'title': 'Doanh nghiệp 1 người là gì? Mô hình mới cho người 40-60 | Sol',
        'slug': 'doanh-nghiep-1-nguoi-la-gi',
        'excerpt': 'Doanh nghiệp 1 người (Company of One) — mô hình tinh gọn cho người 40-60 chuyển hướng. 6 đặc điểm + 5 bước triển khai.',
        'category': 'Hướng Đi',
        'tags': ['doanh nghiệp 1 người', 'company of one', 'tinh gọn'],
        'featured_image': '05-B1.png'
    },
    '06': {
        'file': '06-B2-one-person-company.html',
        'title': 'One Person Company là gì? Xu hướng kinh doanh 2026 | Sol',
        'slug': 'one-person-company-la-gi',
        'excerpt': 'One Person Company (OPC) — mô hình kinh doanh 1 người tạo doanh thu 1 triệu USD. Cách áp dụng tại Việt Nam cho người 40-60.',
        'category': 'Hướng Đi',
        'tags': ['one person company', 'opc', 'ai', 'startup'],
        'featured_image': '06-B2.png'
    },
    '07': {
        'file': '07-B3-kinh-doanh-tinh-gon.html',
        'title': 'Kinh doanh tinh gọn là gì? Nguyên tắc & Cách áp dụng | Sol',
        'slug': 'kinh-doanh-tinh-gon-la-gi',
        'excerpt': 'Kinh doanh tinh gọn (Lean Business) — vốn ít, người ít, chi phí ít, lợi nhuận cao. 5 nguyên tắc + 10 bước áp dụng cho người 40-60.',
        'category': 'Hướng Đi',
        'tags': ['kinh doanh tinh gọn', 'lean business', 'khởi nghiệp'],
        'featured_image': '07-B3.png'
    },
    '08': {
        'file': '08-C1-5-buoc-sol-la-ban.html',
        'title': '5 Bước Sol La Bàn — Hướng dẫn tái khởi nghiệp 40-60 | Sol',
        'slug': '5-buoc-sol-la-ban',
        'excerpt': 'Framework 5 Bước Sol La Bàn giúp người 40-60 tìm đúng hướng đi kinh doanh. Chi tiết từng bước + ví dụ thực tế.',
        'category': 'Hướng Đi',
        'tags': ['sol la bàn', 'framework', '5 bước'],
        'featured_image': '08-C1.png'
    },
    '09': {
        'file': '09-C2-ai-cho-nguoi-40-60.html',
        'title': 'AI cho người 40-60 — Cách dùng ChatGPT tăng thu nhập | Sol',
        'slug': 'ai-cho-nguoi-40-60',
        'excerpt': 'AI không phải cho giới trẻ. Cách người 40-60 tận dụng AI để consulting, viết, phân tích — 40 câu hỏi mẫu bằng tiếng Việt.',
        'category': 'Hướng Đi',
        'tags': ['ai', 'chatgpt', 'claude', '40-60'],
        'featured_image': '09-C2.png'
    },
    '10': {
        'file': '10-C3-he-sinh-thai-sol.html',
        'title': 'Hệ sinh thái Sol — Sách, Trí, Cộng đồng cho tuổi 40-60 | Sol',
        'slug': 'he-sinh-thai-sol',
        'excerpt': 'Hệ sinh thái Sol gồm 3 trụ: Sách (kiến thức), Trí (Sol La Bàn), Cộng đồng (Đi Cùng Sol). Giúp người 40-60 tái khởi nghiệp.',
        'category': 'Hướng Đi',
        'tags': ['hệ sinh thái sol', 'sol la bàn', 'cộng đồng'],
        'featured_image': '10-C3.png'
    },
    '11': {
        'file': '11-D1-cuu-cfo-chuyen-huong.html',
        'title': 'Cựu CFO chuyển hướng — 5 mô hình kinh doanh hiệu quả | Sol',
        'slug': 'cuu-cfo-chuyen-huong-kinh-doanh',
        'excerpt': 'Cựu CFO có 3 lợi thế đặc biệt khi khởi nghiệp. 5 mô hình kinh doanh phù hợp + Case study Anh Tuấn 52 tuổi.',
        'category': 'Hướng Đi',
        'tags': ['cfo', 'chuyển hướng', 'fractional cfo'],
        'featured_image': '11-D1.png'
    },
    '12': {
        'file': '12-D2-nghi-viec-45-tuoi.html',
        'title': 'Nghỉ việc tuổi 45 nên làm gì? 6 bước quyết định | Sol',
        'slug': 'nghi-viec-45-tuoi',
        'excerpt': 'Nghỉ việc tuổi 45 — Nên hay không? Framework 6 bước quyết định + Case study + Kế hoạch tài chính an toàn.',
        'category': 'Hướng Đi',
        'tags': ['nghỉ việc', '45 tuổi', 'chuyển hướng'],
        'featured_image': '12-D2.png'
    },
    '13': {
        'file': '13-D3-fractional-cfo.html',
        'title': 'Fractional CFO là gì? Mô hình kinh doanh cho cựu CFO | Sol',
        'slug': 'fractional-cfo-la-gi',
        'excerpt': 'Fractional CFO — CFO thời vụ cho SME. Thu nhập 80-150 triệu/tháng, 30h/tuần. Cách bắt đầu + giá cả + Case study.',
        'category': 'Hướng Đi',
        'tags': ['fractional cfo', 'cfo', 'sme'],
        'featured_image': '13-D3.png'
    },
    '14': {
        'file': '14-S1-5-dau-hieu-can-chuyen-huong.html',
        'title': '5 dấu hiệu bạn cần chuyển hướng nghề nghiệp tuổi 45 | Sol',
        'slug': '5-dau-hieu-can-chuyen-huong-tuoi-45',
        'excerpt': '5 dấu hiệu rõ ràng bạn cần chuyển hướng nghề nghiệp ngay ở tuổi 45. Nếu có 3/5 dấu hiệu, đừng chờ.',
        'category': 'Hướng Đi',
        'tags': ['dấu hiệu', '45 tuổi', 'chuyển hướng'],
        'featured_image': '14-S1.png'
    },
    '15': {
        'file': '15-S2-checklist-30-ngay.html',
        'title': 'Checklist 30 ngày chuẩn bị khởi nghiệp tuổi 45 | Sol',
        'slug': 'checklist-30-ngay-chuan-bi-khoi-nghiep',
        'excerpt': 'Checklist 30 ngày chuẩn bị tái khởi nghiệp tuổi 40-60. 30 tasks cụ thể theo ngày.',
        'category': 'Hướng Đi',
        'tags': ['checklist', '30 ngày', 'khởi nghiệp'],
        'featured_image': '15-S2.png'
    },
    '16': {
        'file': '16-S3-10-sai-lam-khoi-nghiep-45.html',
        'title': '10 sai lầm khởi nghiệp tuổi 45+ (và cách tránh) | Sol',
        'slug': '10-sai-lam-khoi-nghiep-tuoi-45',
        'excerpt': '10 sai lầm phổ biến khi khởi nghiệp tuổi 45+ khiến 70% thất bại. Cách tránh chi tiết + Case study.',
        'category': 'Hướng Đi',
        'tags': ['sai lầm', 'khởi nghiệp', '45 tuổi'],
        'featured_image': '16-S3.png'
    }
}


def strip_html_comments(content):
    """Bỏ HTML comments (metadata block) trước khi post."""
    return re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL).strip()


def upload_featured_image(client, image_path):
    """Upload featured image → return attachment_id."""
    if not image_path.exists():
        print(f"   ⚠️  Featured image không tồn tại: {image_path}")
        return None

    with open(image_path, 'rb') as f:
        data = {
            'name': image_path.name,
            'type': 'image/png',
            'bits': f.read(),
        }

    response = client.call(UploadFile(data))
    print(f"   ✅ Uploaded featured image: {response['url']}")
    return response['id']


def publish_article(article_id, draft=False, post_id=None):
    """Publish 1 bài lên WP."""
    if article_id not in ARTICLES:
        print(f"❌ Article {article_id} không tồn tại")
        return None

    meta = ARTICLES[article_id]
    article_path = ARTICLES_DIR / meta['file']

    if not article_path.exists():
        print(f"❌ File không tồn tại: {article_path}")
        return None

    print(f"\n{'='*60}")
    print(f"📝 Bài #{article_id} — {meta['title'][:60]}")
    print(f"{'='*60}")
    print(f"   Slug: {meta['slug']}")
    print(f"   URL: https://sol.vn/huong-di/{meta['slug']}/")

    with open(article_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = strip_html_comments(content)

    if not WP_PASS:
        print("❌ Chưa set WP_PASS environment variable")
        print("   Chạy: export WP_PASS='app-password-16-ký-tự'")
        return None

    print(f"   Kết nối WP: {WP_URL}")
    try:
        client = Client(WP_URL, WP_USER, WP_PASS)
    except Exception as e:
        print(f"❌ Kết nối thất bại: {e}")
        return None

    # Upload featured image
    featured_id = None
    if meta.get('featured_image'):
        img_path = FEATURED_DIR / meta['featured_image']
        featured_id = upload_featured_image(client, img_path)

    post = WordPressPost()
    post.title = meta['title']
    post.content = content
    post.slug = meta['slug']
    post.excerpt = meta['excerpt']
    post.post_status = 'draft' if draft else 'publish'
    post.terms_names = {
        'category': [meta['category']],
        'post_tag': meta['tags']
    }
    if featured_id:
        post.thumbnail = featured_id

    try:
        if post_id:
            client.call(EditPost(post_id, post))
            print(f"   ✅ Updated post ID: {post_id}")
            return post_id
        else:
            new_id = client.call(NewPost(post))
            status = 'DRAFT' if draft else 'PUBLISHED'
            print(f"   ✅ {status} — Post ID: {new_id}")
            print(f"   🔗 https://sol.vn/huong-di/{meta['slug']}/")
            return new_id
    except Exception as e:
        print(f"❌ Publish thất bại: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description='Sol SEO Content — WP Publish')
    parser.add_argument('--article', help='ID bài (01-16)')
    parser.add_argument('--all', action='store_true', help='Publish tất cả 16 bài')
    parser.add_argument('--draft', action='store_true', help='Publish as draft')
    parser.add_argument('--post-id', type=int, help='Update existing post ID')
    parser.add_argument('--list', action='store_true', help='List tất cả articles')

    args = parser.parse_args()

    if args.list:
        print("\n📚 16 bài SEO Sol La Bàn\n")
        for aid, meta in ARTICLES.items():
            print(f"   {aid} — {meta['title'][:70]}")
            print(f"        slug: {meta['slug']}\n")
        return

    if args.all:
        print(f"\n🚀 Publish TẤT CẢ 16 bài — draft={args.draft}\n")
        results = []
        for aid in ARTICLES.keys():
            pid = publish_article(aid, draft=args.draft)
            results.append((aid, pid))

        print(f"\n{'='*60}")
        print("📊 KẾT QUẢ")
        print(f"{'='*60}")
        for aid, pid in results:
            status = f"✅ {pid}" if pid else "❌ FAILED"
            print(f"   {aid}: {status}")
    elif args.article:
        publish_article(args.article, draft=args.draft, post_id=args.post_id)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
