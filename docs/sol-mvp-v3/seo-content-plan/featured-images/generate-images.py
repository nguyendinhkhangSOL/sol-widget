#!/usr/bin/env python3
"""
Sol Featured Image Generator — Auto tạo 16 file PNG 1200x630
Chạy 1 lệnh: python generate-images.py
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("[+] Cai Pillow...")
    os.system(f"{sys.executable} -m pip install Pillow --quiet")
    from PIL import Image, ImageDraw, ImageFont

OUT_DIR = Path(__file__).parent

ARTICLES = [
    ('01-PILLAR', 'PILLAR', 'Tái khởi nghiệp tinh gọn 40-60', 'Guide toàn diện 2026'),
    ('02-A1', 'A1', '40 tuổi nên kinh doanh gì?', '10 mô hình phù hợp'),
    ('03-A2', 'A2', '45 tuổi nên kinh doanh gì?', '8 mô hình + Case study'),
    ('04-A3', 'A3', '50 tuổi có nên kinh doanh?', '6 hướng đi phù hợp'),
    ('05-B1', 'B1', 'Doanh nghiệp 1 người', 'Mô hình mới cho 40-60'),
    ('06-B2', 'B2', 'One Person Company', 'Xu hướng 2026'),
    ('07-B3', 'B3', 'Kinh doanh tinh gọn', 'Nguyên tắc & áp dụng'),
    ('08-C1', 'C1', '5 Bước Sol La Bàn', 'Hướng dẫn chi tiết'),
    ('09-C2', 'C2', 'AI cho người 40-60', 'Tăng thu nhập với AI'),
    ('10-C3', 'C3', 'Hệ sinh thái Sol', 'Sách · Trí · Cộng đồng'),
    ('11-D1', 'D1', 'Cựu CFO chuyển hướng', '5 mô hình hiệu quả'),
    ('12-D2', 'D2', 'Nghỉ việc tuổi 45', '6 bước quyết định'),
    ('13-D3', 'D3', 'Fractional CFO là gì?', 'Mô hình cho cựu CFO'),
    ('14-S1', 'S1', '5 dấu hiệu cần chuyển hướng', 'Tuổi 45+'),
    ('15-S2', 'S2', 'Checklist 30 ngày', 'Chuẩn bị khởi nghiệp'),
    ('16-S3', 'S3', '10 sai lầm khởi nghiệp 45+', 'Và cách tránh'),
]

W, H = 1200, 630
NAVY = (15, 23, 42)          # #0F172A
NAVY_LIGHT = (30, 41, 59)    # #1E293B
AMBER = (245, 158, 11)       # #F59E0B
AMBER_DARK = (217, 119, 6)   # #D97706
WHITE = (255, 255, 255)
GRAY = (203, 213, 225)       # #CBD5E1
GRAY_DARK = (148, 163, 184)  # #94A3B8


def find_font(candidates, size):
    """Tìm font đầu tiên khả dụng."""
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def make_gradient(w, h, color1, color2):
    """Gradient dọc từ color1 xuống color2."""
    img = Image.new('RGB', (w, h), color1)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        r = int(color1[0] + (color2[0] - color1[0]) * y / h)
        g = int(color1[1] + (color2[1] - color1[1]) * y / h)
        b = int(color1[2] + (color2[2] - color1[2]) * y / h)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return img


def create_featured_image(file_id, code, title, subtitle):
    """Tạo 1 ảnh featured 1200x630."""
    img = make_gradient(W, H, NAVY, NAVY_LIGHT)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Vòng tròn decoration
    draw.ellipse([870, -60, 1230, 300], fill=(245, 158, 11, 25))
    draw.ellipse([-70, 280, 370, 720], fill=(245, 158, 11, 15))

    # Fonts (Windows/Mac có sẵn)
    font_label = find_font(['arialbd.ttf', 'Arial Bold.ttf', 'DejaVuSans-Bold.ttf', 'arial.ttf'], 20)
    font_title = find_font(['georgiab.ttf', 'Georgia Bold.ttf', 'DejaVuSerif-Bold.ttf', 'georgia.ttf'], 60)
    font_sub = find_font(['arial.ttf', 'Arial.ttf', 'DejaVuSans.ttf'], 28)
    font_url = find_font(['arialbd.ttf', 'Arial Bold.ttf', 'DejaVuSans-Bold.ttf', 'arial.ttf'], 22)
    font_footer = find_font(['arial.ttf', 'Arial.ttf', 'DejaVuSans.ttf'], 16)
    font_s = find_font(['arialbd.ttf', 'Arial Bold.ttf', 'DejaVuSans-Bold.ttf', 'arial.ttf'], 90)

    # Label top: "SOL LA BAN · CODE"
    draw.text((80, 100), f'SOL LA BAN  ·  {code}', font=font_label, fill=AMBER)

    # Title (wrap nếu quá dài)
    max_width = 900
    words = title.split(' ')
    lines = []
    current = ''
    for w in words:
        test = f'{current} {w}'.strip()
        bbox = draw.textbbox((0, 0), test, font=font_title)
        if bbox[2] - bbox[0] < max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)

    y = 210
    for line in lines[:2]:  # Max 2 dòng
        draw.text((80, y), line, font=font_title, fill=WHITE)
        y += 72

    # Subtitle
    draw.text((80, y + 10), subtitle, font=font_sub, fill=GRAY)

    # Divider amber
    draw.rectangle([80, 430, 240, 434], fill=AMBER)

    # URL
    draw.text((80, 465), 'sol.vn/huong-di', font=font_url, fill=AMBER)

    # Footer text
    draw.text((80, 510), 'Tai khoi nghiep tinh gon cho nguoi 40-60', font=font_footer, fill=GRAY_DARK)

    # Sol logo (S trong circle amber)
    logo_x, logo_y, logo_r = 1060, 500, 60
    draw.ellipse([logo_x - logo_r, logo_y - logo_r, logo_x + logo_r, logo_y + logo_r], fill=AMBER)

    # Chữ S ở giữa
    bbox = draw.textbbox((0, 0), 'S', font=font_s)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((logo_x - tw // 2 - bbox[0], logo_y - th // 2 - bbox[1] - 5), 'S', font=font_s, fill=NAVY)

    # Save
    out_path = OUT_DIR / f'{file_id}.png'
    img.save(out_path, 'PNG', optimize=True)
    return out_path


def main():
    print(f'[+] Tao {len(ARTICLES)} anh featured (1200x630)...')
    print(f'    Output: {OUT_DIR}\n')

    for i, (fid, code, title, sub) in enumerate(ARTICLES, 1):
        path = create_featured_image(fid, code, title, sub)
        size_kb = path.stat().st_size / 1024
        print(f'  [{i:2}/16] {path.name}  ({size_kb:.0f} KB)')

    print(f'\n[OK] Xong! 16 file PNG da tao tai:')
    print(f'  {OUT_DIR}')


if __name__ == '__main__':
    main()
