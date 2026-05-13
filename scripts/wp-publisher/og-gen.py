#!/usr/bin/env python3
"""
Sol v4 — Generate OG/Featured image cho Wiki article (1200x630 PNG)

Usage:
  python3 og-gen.py "Tiêu đề bài" --cluster=A --slug=cai-thuoc-la-tai-nha
  python3 og-gen.py --batch wiki-titles.txt   # batch mode

Output: ../../wiki-skeletons/wiki-articles/og-images/<slug>.png
"""

import sys
import os
import argparse
from PIL import Image, ImageDraw, ImageFont

# ─── Sol brand colors ──────────────────────────────────────
BROWN = (92, 58, 30)         # #5C3A1E
ORANGE = (178, 92, 44)        # #B25C2C
PAPER = (255, 244, 234)       # #FFF4EA
CREAM = (250, 244, 236)       # #FAF4EC
INK = (44, 42, 39)            # #2C2A27
INK2 = (90, 86, 80)           # #5A5650
WHITE = (255, 255, 255)
GREEN = (22, 163, 74)         # cluster A
AMBER = (217, 119, 6)         # cluster B
RED = (220, 38, 38)           # cluster C

CLUSTER_COLOR = {'A': GREEN, 'B': AMBER, 'C': RED}
CLUSTER_NAME = {'A': 'KHOA HỌC', 'B': 'PHƯƠNG PHÁP', 'C': 'CÂU CHUYỆN'}

# Fonts — DejaVu Sans Bold support tiếng Việt full
FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_PATH_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

W, H = 1200, 630

def wrap_text(text, font, max_width, draw):
    """Wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current = []
    for word in words:
        test = ' '.join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(' '.join(current))
            current = [word]
    if current:
        lines.append(' '.join(current))
    return lines

def gen_og_image(title, cluster='A', slug='wiki', output_dir=None):
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    # ─── Background — vertical brown sidebar on left ───
    sidebar_w = 16
    draw.rectangle([(0, 0), (sidebar_w, H)], fill=CLUSTER_COLOR.get(cluster, ORANGE))

    # ─── Top bar — Sol brand + cluster badge ───
    # Sol logo circle
    logo_x, logo_y, logo_r = 70, 55, 28
    draw.ellipse([(logo_x - logo_r, logo_y - logo_r), (logo_x + logo_r, logo_y + logo_r)],
                 fill=BROWN)
    font_logo = ImageFont.truetype(FONT_PATH, 28)
    bbox = draw.textbbox((0, 0), 'S', font=font_logo)
    tw = bbox[2] - bbox[0]
    draw.text((logo_x - tw / 2 - 2, logo_y - 19), 'S', fill=WHITE, font=font_logo)

    # Sol wordmark
    font_brand = ImageFont.truetype(FONT_PATH, 26)
    draw.text((115, 38), 'Sol Đi Cùng', fill=BROWN, font=font_brand)
    font_tag = ImageFont.truetype(FONT_PATH_REG, 14)
    draw.text((115, 70), 'sol.vn · Cai thuốc lá Việt 45+', fill=INK2, font=font_tag)

    # Cluster badge (top right)
    badge_text = CLUSTER_NAME.get(cluster, 'WIKI')
    font_badge = ImageFont.truetype(FONT_PATH, 18)
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    badge_w = bbox[2] - bbox[0] + 36
    badge_h = 40
    badge_x = W - badge_w - 60
    badge_y = 50
    draw.rounded_rectangle(
        [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
        radius=20, fill=CLUSTER_COLOR.get(cluster, ORANGE),
    )
    draw.text((badge_x + 18, badge_y + 9), badge_text, fill=WHITE, font=font_badge)

    # ─── Title (center, large) ───
    font_title_sizes = [72, 64, 56, 50, 44]
    title_y_start = 170
    max_title_width = W - 140  # 70 padding each side

    title = title.strip()
    for size in font_title_sizes:
        font_title = ImageFont.truetype(FONT_PATH, size)
        lines = wrap_text(title, font_title, max_title_width, draw)
        if len(lines) <= 4:
            line_h = size + 14
            total_h = len(lines) * line_h
            if total_h <= 330:
                break

    # Center vertically
    line_h = size + 14
    total_h = len(lines) * line_h
    y = title_y_start + (330 - total_h) / 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font_title)
        line_w = bbox[2] - bbox[0]
        x = (W - line_w) / 2
        draw.text((x, y), line, fill=BROWN, font=font_title)
        y += line_h

    # ─── Bottom — CTA + URL ───
    # CTA pill (no emoji vì DejaVu render thành ô vuông)
    cta_text = '7 NGÀY MIỄN PHÍ · bothuocla.sol.vn'
    font_cta = ImageFont.truetype(FONT_PATH, 22)
    bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
    cta_w = bbox[2] - bbox[0] + 56
    cta_h = 52
    cta_x = (W - cta_w) / 2
    cta_y = H - 110
    draw.rounded_rectangle(
        [(cta_x, cta_y), (cta_x + cta_w, cta_y + cta_h)],
        radius=26, fill=ORANGE,
    )
    draw.text((cta_x + 28, cta_y + 14), cta_text, fill=WHITE, font=font_cta)

    # Bottom credit
    font_cred = ImageFont.truetype(FONT_PATH_REG, 14)
    cred_text = 'Khang Sol · 30 năm hút Vinataba, 5 năm Tự do'
    bbox = draw.textbbox((0, 0), cred_text, font=font_cred)
    cred_w = bbox[2] - bbox[0]
    draw.text(((W - cred_w) / 2, H - 38), cred_text, fill=INK2, font=font_cred)

    # ─── Save ───
    if output_dir is None:
        output_dir = os.path.join(
            os.path.dirname(__file__),
            '..',  '..', 'wiki-skeletons', 'wiki-articles', 'og-images',
        )
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, f'{slug}.png')
    img.save(out_path, 'PNG', optimize=True)
    return out_path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('title', nargs='?', help='Tiêu đề bài Wiki')
    parser.add_argument('--cluster', default='A', choices=['A', 'B', 'C'])
    parser.add_argument('--slug', default='wiki', help='Slug (cho filename)')
    parser.add_argument('--batch', help='File txt với mỗi dòng: slug|cluster|title')
    args = parser.parse_args()

    if args.batch:
        with open(args.batch, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                parts = line.split('|')
                if len(parts) != 3:
                    print(f'⚠ Skip line (cần 3 cột): {line}')
                    continue
                slug, cluster, title = parts
                out = gen_og_image(title.strip(), cluster.strip(), slug.strip())
                print(f'✓ {slug} → {out}')
    else:
        if not args.title:
            parser.error('Cần title hoặc --batch')
        out = gen_og_image(args.title, args.cluster, args.slug)
        print(f'✓ Saved: {out}')

if __name__ == '__main__':
    main()
