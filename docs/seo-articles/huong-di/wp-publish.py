#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════
WordPress Auto-Publish Script — sol.vn/huong-di/{slug}
Author: Sol La Bàn ecosystem
Usage:
    python wp-publish.py 01-pillar-ai-2026-nghe-nao-bi-thay-the.html

Requirements:
    pip install requests python-dotenv

Setup .env:
    WP_URL=https://sol.vn
    WP_USER=admin (WP username)
    WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx  (WP Application Password)
    CPT_SLUG=huong-di  (Custom Post Type slug — created via CPT UI plugin)

Post Type: Custom Post Type "huong-di" (created via CPT UI plugin)
    Endpoint: /wp-json/wp/v2/huong-di
    URL rewrite: sol.vn/huong-di/{slug}/

    ⚠️  QUAN TRỌNG: Trong CPT UI settings phải bật:
      • Show in REST API: TRUE
      • REST API base slug: huong-di
      • Public: TRUE
      • Has Archive: TRUE (để /huong-di/ hoạt động như silo hub)
═══════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import base64
import re
from pathlib import Path
import requests
from dotenv import load_dotenv

# ─── Load config ────────────────────────────────────────────────────
load_dotenv()

WP_URL = os.getenv('WP_URL', 'https://sol.vn').rstrip('/')
WP_USER = os.getenv('WP_USER')
WP_APP_PASSWORD = os.getenv('WP_APP_PASSWORD')
CPT_SLUG = os.getenv('CPT_SLUG', 'huong-di')  # Custom Post Type slug (từ CPT UI)

if not WP_USER or not WP_APP_PASSWORD:
    print("❌ Missing WP_USER or WP_APP_PASSWORD in .env")
    print("   Run: cp .env.example .env && edit .env")
    sys.exit(1)

# Build Basic Auth header
auth_str = f"{WP_USER}:{WP_APP_PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    'Authorization': f'Basic {auth_b64}',
    'Content-Type': 'application/json',
}


# ─── Pre-flight checks ──────────────────────────────────────────────

def preflight_check():
    """Verify WP config trước khi publish — CPT UI setup + REST endpoint."""
    print("🔍 Pre-flight check — verify CPT + REST config...")

    # 1. Ping REST API root
    r = requests.get(f"{WP_URL}/wp-json/wp/v2", headers=HEADERS)
    if not r.ok:
        print(f"   ❌ WP REST API unreachable: {r.status_code}")
        return False
    print("   ✅ REST API reachable")

    # 2. Verify auth
    r = requests.get(f"{WP_URL}/wp-json/wp/v2/users/me", headers=HEADERS)
    if not r.ok:
        print(f"   ❌ Auth failed — check WP_USER + WP_APP_PASSWORD")
        print(f"       Response: {r.text[:200]}")
        return False
    user = r.json()
    print(f"   ✅ Auth OK — logged in as: {user.get('name')} (id={user.get('id')})")

    # 3. CRITICAL: Verify CPT endpoint exists (created by CPT UI plugin)
    cpt_endpoint = f"{WP_URL}/wp-json/wp/v2/{CPT_SLUG}"
    r = requests.get(cpt_endpoint, headers=HEADERS)
    if r.status_code == 404:
        print(f"   ❌ CPT '{CPT_SLUG}' KHÔNG tìm thấy tại {cpt_endpoint}")
        print(f"       Kiểm tra CPT UI plugin:")
        print(f"       1. WP Admin → CPT UI → Post Types → '{CPT_SLUG}'")
        print(f"       2. Settings: 'Show in REST API' = TRUE")
        print(f"       3. REST API base slug: {CPT_SLUG}")
        return False
    if not r.ok:
        print(f"   ⚠  CPT endpoint returned HTTP {r.status_code}: {r.text[:200]}")
    else:
        posts = r.json() if isinstance(r.json(), list) else []
        print(f"   ✅ CPT endpoint OK: /wp-json/wp/v2/{CPT_SLUG}")
        print(f"      Current posts trong CPT: {len(posts)}")

    # 4. Verify types endpoint để confirm CPT config
    r = requests.get(f"{WP_URL}/wp-json/wp/v2/types/{CPT_SLUG}", headers=HEADERS)
    if r.ok:
        cpt = r.json()
        rest_base = cpt.get('rest_base', CPT_SLUG)
        has_archive = cpt.get('has_archive', False)
        print(f"      CPT name: '{cpt.get('name', '?')}'")
        print(f"      REST base: {rest_base}")
        print(f"      Has archive (silo hub): {has_archive}")
        if rest_base != CPT_SLUG:
            print(f"   ⚠  REST base ({rest_base}) khác CPT_SLUG ({CPT_SLUG})")
            print(f"       Set CPT_SLUG={rest_base} trong .env")

    print()
    return True


# ─── Helpers ────────────────────────────────────────────────────────

def get_or_create_category(name, slug):
    """Get category ID by slug, create if not exists."""
    r = requests.get(f"{WP_URL}/wp-json/wp/v2/categories",
                     params={'slug': slug}, headers=HEADERS)
    if r.ok and r.json():
        return r.json()[0]['id']

    # Create
    r = requests.post(f"{WP_URL}/wp-json/wp/v2/categories",
                      json={'name': name, 'slug': slug}, headers=HEADERS)
    if r.ok:
        return r.json()['id']
    print(f"⚠️  Failed to create category '{name}': {r.status_code} {r.text[:200]}")
    return None


def get_or_create_tag(name):
    """Get tag ID by name, create if not exists."""
    slug = re.sub(r'[^\w\s-]', '', name.lower()).strip().replace(' ', '-')
    r = requests.get(f"{WP_URL}/wp-json/wp/v2/tags",
                     params={'slug': slug}, headers=HEADERS)
    if r.ok and r.json():
        return r.json()[0]['id']

    r = requests.post(f"{WP_URL}/wp-json/wp/v2/tags",
                      json={'name': name, 'slug': slug}, headers=HEADERS)
    if r.ok:
        return r.json()['id']
    return None


def extract_meta_from_html(html_content):
    """Extract metadata from HTML file — fallback nếu không có .meta.json."""
    meta = {}
    # Try to find h1 or first h2 as title
    m = re.search(r'<h[12][^>]*>(.+?)</h[12]>', html_content)
    if m:
        meta['title_hint'] = re.sub(r'<[^>]+>', '', m.group(1))

    # Excerpt = first <p><strong>Tóm tắt</strong>
    m = re.search(r'<p[^>]*>.*?Tóm tắt[^<]*</strong>[:\s]*(.+?)</p>',
                  html_content, re.DOTALL | re.IGNORECASE)
    if m:
        excerpt = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        meta['excerpt'] = excerpt[:200]

    return meta


def upload_featured_image(image_path):
    """Upload featured image (PNG/JPG) → WP Media Library, return media_id."""
    img_path = Path(image_path)
    if not img_path.exists():
        return None

    # Check existing (by slug/filename)
    filename = img_path.name
    slug = img_path.stem
    r = requests.get(f"{WP_URL}/wp-json/wp/v2/media",
                     params={'slug': slug}, headers=HEADERS)
    if r.ok and r.json():
        media_id = r.json()[0]['id']
        print(f"   ✅ Featured image đã có sẵn (id={media_id}): {r.json()[0].get('source_url')}")
        return media_id

    # Upload new
    mime_map = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}
    ext = img_path.suffix.lower()
    mime = mime_map.get(ext, 'image/png')

    upload_headers = {
        'Authorization': HEADERS['Authorization'],
        'Content-Type': mime,
        'Content-Disposition': f'attachment; filename="{filename}"',
    }

    with open(img_path, 'rb') as f:
        r = requests.post(f"{WP_URL}/wp-json/wp/v2/media",
                          data=f.read(), headers=upload_headers)

    if r.ok:
        data = r.json()
        print(f"   ✅ Uploaded featured image (id={data['id']}): {data.get('source_url')}")
        return data['id']
    print(f"   ⚠  Featured image upload failed: HTTP {r.status_code} — {r.text[:200]}")
    return None


def publish_article(html_file, dry_run=False):
    """Publish 1 article to WordPress Custom Post Type via REST API."""
    html_path = Path(html_file)
    if not html_path.exists():
        print(f"❌ File not found: {html_path}")
        return None

    # Load HTML content
    content = html_path.read_text(encoding='utf-8')

    # Load metadata (from .meta.json OR extract from HTML)
    meta_file = html_path.with_suffix('.meta.json')
    if meta_file.exists():
        meta = json.loads(meta_file.read_text(encoding='utf-8'))
    else:
        extracted = extract_meta_from_html(content)
        base_name = html_path.stem
        clean_slug = re.sub(r'^\d+-(?:pillar-)?', '', base_name)
        meta = {
            'title': extracted.get('title_hint', base_name),
            'slug': clean_slug,
            'excerpt': extracted.get('excerpt', ''),
            'status': 'publish',
            'tags': ['AI 2026', 'Nghề nghiệp', 'Chuyên gia 40+'],
        }

    # ─── CPT endpoint ───
    cpt_endpoint = f"{WP_URL}/wp-json/wp/v2/{CPT_SLUG}"

    # ─── Get tag IDs (nếu CPT có support tags) ───
    tag_ids = []
    for tag_name in meta.get('tags', []):
        tid = get_or_create_tag(tag_name)
        if tid:
            tag_ids.append(tid)

    # ─── Upload featured image (nếu có file .png/.jpg cùng tên) ───
    featured_media_id = None
    if not dry_run:
        for ext in ['.png', '.jpg', '.jpeg', '.webp']:
            # Look for: same-stem OR "01-pillar-featured.png" pattern
            candidates = [
                html_path.with_suffix(ext),
                html_path.parent / f"{html_path.stem.split('-', 1)[0]}-pillar-featured{ext}",
                html_path.parent / f"{html_path.stem}-featured{ext}",
            ]
            for candidate in candidates:
                if candidate.exists():
                    print(f"   📷 Found featured image: {candidate.name}")
                    featured_media_id = upload_featured_image(candidate)
                    break
            if featured_media_id:
                break

    # ─── Build payload ───
    # CPT không dùng 'categories' — chỉ dùng title/slug/content/excerpt/status
    payload = {
        'title': meta['title'],
        'slug': meta['slug'],
        'content': content,
        'excerpt': meta.get('excerpt', ''),
        'status': meta.get('status', 'publish'),
    }

    if tag_ids:
        payload['tags'] = tag_ids

    if featured_media_id:
        payload['featured_media'] = featured_media_id

    # Yoast SEO meta (nếu plugin cài)
    if meta.get('meta_description') or meta.get('focus_keyword'):
        payload['meta'] = {
            '_yoast_wpseo_metadesc': meta.get('meta_description', meta.get('excerpt', '')),
            '_yoast_wpseo_focuskw': meta.get('focus_keyword', ''),
        }

    print(f"\n📤 Publishing: {meta['title']}")
    print(f"   CPT endpoint: /wp-json/wp/v2/{CPT_SLUG}")
    print(f"   URL sẽ là: {WP_URL}/{CPT_SLUG}/{meta['slug']}/")
    print(f"   Tags: {len(tag_ids)} tags")

    if dry_run:
        print("   🔎 DRY RUN — không post thật")
        print(f"   Payload preview: {json.dumps({k: v for k, v in payload.items() if k != 'content'}, ensure_ascii=False, indent=2)}")
        return None

    # ─── Check if post exists trong CPT (by slug) ───
    r = requests.get(cpt_endpoint,
                     params={'slug': meta['slug'], 'status': 'publish,draft'},
                     headers=HEADERS)
    if r.ok and r.json():
        post_id = r.json()[0]['id']
        print(f"   ♻️  Post exists (id={post_id}) — UPDATE")
        r = requests.post(f"{cpt_endpoint}/{post_id}",
                          json=payload, headers=HEADERS)
    else:
        print(f"   ✨ Creating new post trong CPT")
        r = requests.post(cpt_endpoint, json=payload, headers=HEADERS)

    if r.ok:
        data = r.json()
        print(f"   ✅ Published: {data.get('link')}")
        print(f"   Post ID: {data['id']}")
        return data
    else:
        print(f"   ❌ Failed: HTTP {r.status_code}")
        print(f"   Response: {r.text[:500]}")
        # Nếu lỗi vì tag không support → retry không tags
        if 'tags' in payload and r.status_code == 400:
            print("   ↻ Retry không có tags (CPT có thể không support tags)")
            payload.pop('tags', None)
            r = requests.post(cpt_endpoint, json=payload, headers=HEADERS)
            if r.ok:
                data = r.json()
                print(f"   ✅ Published (no tags): {data.get('link')}")
                return data
        return None


# ─── Main ───────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nUsage: python wp-publish.py <html_file> [--dry-run]")
        print("       python wp-publish.py --all")
        print("       python wp-publish.py --check     (chỉ pre-flight, không publish)")
        sys.exit(1)

    dry_run = '--dry-run' in sys.argv

    # Run pre-flight always
    if not preflight_check():
        print("\n❌ Pre-flight FAILED — fix issues trước khi publish")
        sys.exit(1)

    if '--check' in sys.argv:
        print("\n✅ Pre-flight OK — ready to publish")
        return

    if '--all' in sys.argv:
        # Publish all HTML files in current dir (sorted)
        script_dir = Path(__file__).parent
        html_files = sorted(script_dir.glob('*.html'))
        for f in html_files:
            publish_article(f, dry_run=dry_run)
    else:
        file_arg = [a for a in sys.argv[1:] if not a.startswith('--')][0]
        publish_article(file_arg, dry_run=dry_run)


if __name__ == '__main__':
    main()
