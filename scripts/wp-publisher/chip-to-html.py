#!/usr/bin/env python3
"""
Sol v4 — Pipeline: skeleton chip-XXX.md → HTML Sol v4

Đọc 22 skeleton trong wiki-skeletons/chips/ → gen HTML Sol v4 dual-purpose:
- Hook + Cần biết ngay (chip user đọc nhanh 30s)
- Phần khoa học (SEO user đọc sâu)
- 💬 Khang nói (story THẬT cho từng bài — dictionary)
- CTA Sol v4 unified
- Footer disclaimer y khoa

Usage:
  python3 chip-to-html.py                          # gen tất cả non-CRITICAL
  python3 chip-to-html.py --slug=dau-dau           # gen 1 bài
  python3 chip-to-html.py --only-critical          # gen 3 bài CRITICAL

Output: ../../wiki-skeletons/wiki-articles/CHIP-<slug>.html
"""

import os
import re
import sys
import argparse
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
CHIPS_DIR = ROOT / 'wiki-skeletons' / 'chips'
OUT_DIR = ROOT / 'wiki-skeletons' / 'wiki-articles'

# ─── Mapping skeleton → WP draft post ID ─────────────────────
POST_IDS = {
    'dau-dau-sau-cai': 785,
    'dau-nguc-du-doi-115': 786,
    'ban-moi-thuoc-tu-choi': 778,
    'buon-chan-tuan-2': 779,
    'ca-phe-sang-khong-thuoc': 780,
    'champix-varenicline-cai-thuoc': 781,
    'chong-mat-khi-cai': 782,
    'co-don-khi-cai': 783,
    'dam-tang-cuoi-khoi-thuoc': 784,
    'ho-co-dom-khi-cai': 788,
    'khac-dom-co-mau-canh-bao': 789,
    'kho-tho-khi-cai': 790,
    'khong-la-chinh-minh': 791,
    'lo-au-vo-co': 792,
    'lo-hut-dieu-roi': 793,
    'mieng-dan-nicotine-nrt': 794,
    'mieng-lo-loet': 795,
    'stress-cong-viec-cai': 798,
    'tet-le-cai-thuoc': 800,
    'tim-mach-hoi-phuc': 802,
    'vo-chong-gian-cai': 803,
    'y-nghi-tu-hai-cai-thuoc': 804,
}

CRITICAL_SLUGS = {'y-nghi-tu-hai-cai-thuoc', 'dau-nguc-du-doi-115', 'khac-dom-co-mau-canh-bao'}

# ─── Khang stories — viết riêng cho từng bài ────────────────
# Voice: ngôi 1 "mình", call reader "anh", 2-3 paragraph
KHANG_STORIES = {
    'dau-dau-sau-cai': """
<p>Ngày 3 cai lần 5 (22-12-2020 ÂL), mình đau đầu dữ dội — như có vòng kim hoa siết. Mình nằm trên giường, không dám nhìn ánh sáng đèn. Vợ pha 1 cốc nước chanh ấm. Mình uống 2 cốc, ngủ thêm 1 giờ.</p>
<p>Tỉnh dậy đỡ 70%. Đau đầu là cái giá <strong>rẻ nhất</strong> mình phải trả cho 30 năm hút thuốc. Đến tuần 2 hết hoàn toàn. Đến nay 5 năm Tự do, không còn đau đầu kiểu đó nữa.</p>
""",
    'ho-co-dom-khi-cai': """
<p>Tuần 1 cai mình ho khan nhiều, đặc biệt sáng dậy. Tuần 2-3 ho có đờm — màu vàng, có khi nâu đen. Mình lo, hỏi vợ. Vợ bảo: <em>"Tốt mà — tar 30 năm ra hết."</em></p>
<p>Đến tháng 3 mình hết ho hoàn toàn. Đến nay 5 năm sau, sáng dậy không cần tằng hắng như trước nữa. Phổi mình đã sạch.</p>
""",
    'kho-tho-khi-cai': """
<p>Tuần đầu cai mình hay cảm giác hụt hơi — không đủ không khí. Đặc biệt khi leo 4 tầng nhà mình. Mình lo có vấn đề tim. Đi khám — bác sĩ nói: <em>"Bình thường. Phổi đang sửa, mạch máu giãn lại — cơ thể đang adapt."</em></p>
<p>Tháng 2 hết hoàn toàn. Đến nay leo cầu thang dễ hơn lúc 30 tuổi. Khó thở khi cai = dấu hiệu phục hồi, không phải bệnh nặng hơn.</p>
""",
    'chong-mat-khi-cai': """
<p>Day 4 cai, mình đứng dậy nhanh ở phòng họp — chóng mặt, suýt ngã. Mình ngồi xuống 1 phút, uống nước. 30 giây hết. Đồng nghiệp lo, mình bảo: <em>"Đang cai thuốc, máu giãn lại."</em></p>
<p>Tuần 2 hết hoàn toàn. Bài học: dậy chậm + uống nước nhiều + ăn đủ. Chóng mặt cai thuốc khác chóng mặt do bệnh — cái này thoáng qua, không nguy hiểm.</p>
""",
    'lo-au-vo-co': """
<p>Tuần 2 mình hay tự nhiên lo âu — tim đập nhanh, ngực tức không lý do. Lần đầu mình hoảng — nghĩ đau tim. Đi khám — bác sĩ bảo: <em>"Anxiety do cai. Cortisol đang ổn định."</em></p>
<p>Bài thở 4-7-8 cứu mình 80% lần lo âu. Đến tuần 4 gần hết. Đến nay không còn — thậm chí ít lo âu hơn lúc còn hút. Hoá ra thuốc lá làm anxiety tệ hơn, không giảm.</p>
""",
    'mieng-lo-loet': """
<p>Tuần 2 cai mình bị miệng lở, khô đắng. Lưỡi có cảm giác lạ. Mình lo ung thư. Vợ bảo: <em>"Nicotine làm miệng quen co, giờ giãn ra — kích ứng tạm."</em></p>
<p>Uống 2.5L nước/ngày + súc miệng nước muối ấm + ngậm nha đam. Đến tuần 3 hết. Vị giác về 80% — ăn ngon hơn 2 lần lúc còn hút.</p>
""",
    'buon-chan-tuan-2': """
<p>Tuần 2-3 cai mình thấy "trống vắng" — mọi thứ nhạt nhẽo. Đi làm thấy chán. Bữa ăn không ngon. Nhìn vợ con không vui. Mình lo trầm cảm.</p>
<p>Bác sĩ nói: <em>"Anhedonia tạm — dopamine đang reset baseline. Tuần 6-8 sẽ hết."</em> Đúng vậy — đến tuần 6 mình bắt đầu thấy "đẹp" lại. Đến tháng 3, vui hơn lúc còn hút. Dopamine tự nhiên không cần nicotine.</p>
""",
    'co-don-khi-cai': """
<p>Tuần 4 cai mình cô đơn lạ thường — dù vợ con vẫn ở bên. Hoá ra mình mất "bạn" — điếu thuốc 30 năm bên mình mỗi sáng cà phê, mỗi đêm trên ban công.</p>
<p>Mình kể vợ. Vợ ngồi cạnh không nói gì, chỉ ôm. Hôm sau mình tải app Sol — đọc Khoảng Lặng anh em khác. Đọc xong khóc 1 chút. Hoá ra mình KHÔNG một mình — bao anh em VN 45+ cũng đang đi qua.</p>
""",
    'stress-cong-viec-cai': """
<p>Tháng 2 cai mình có 1 deadline lớn — stress cực mạnh. Mình suýt hút lại — đã cầm bao trong tay. Lúc đó mình nhớ: <em>"Hút sẽ giúp 5 phút. Nhưng 5 năm Tự do là gì?"</em></p>
<p>Mình đặt bao xuống, đi ra ban công 5 phút thở 4-7-8. Quay vào — bắt đầu việc. Deadline xong. Mình không hút.</p>
<p>Bài học: stress đến và đi. Hút không giải quyết stress — hút chỉ trì hoãn. Mai stress cũ vẫn còn + thèm nicotine mới.</p>
""",
    'khong-la-chinh-minh': """
<p>Tuần 4 mình cảm giác "không là chính mình" — không biết mình là ai khi không hút. 30 năm mỗi quyết định (uống cà phê, đi WC, đợi tàu) đều kèm điếu thuốc. Cai = mất identity.</p>
<p>Đây là <strong>identity shift</strong> — không phải "mất" mà "đổi". Mình không phải "người đang cai thuốc" — mình là "người không hút". Câu này nói nhiều = não tin nhiều. Đến tháng 3, mình thật sự thấy: tôi không hút. Identity mới hoàn chỉnh.</p>
""",
    'ca-phe-sang-khong-thuoc': """
<p>30 năm mỗi sáng mình uống cà phê + 2 điếu trên ban công. 30 năm Pavlov — cà phê = thuốc. Cai thuốc tuần đầu, uống cà phê là thèm dữ dội.</p>
<p>Mình đổi: tuần 1-2 thay cà phê bằng trà xanh. Đến tuần 3 quay lại cà phê — nhưng ngồi trong nhà, không ra ban công. Đến tháng 2 mình uống cà phê bình thường, không thèm. Phá Pavlov 30 năm trong 1 tháng.</p>
""",
    'ban-moi-thuoc-tu-choi': """
<p>Day 25 mình đi đám cưới bạn cùng đại học. Bạn rút bao Vinataba quen của mình ngày xưa, mời: <em>"Khang ơi hút 1 điếu cho vui!"</em></p>
<p>Mình suýt nhận — tay đã giơ ra. Đột nhiên mình nói: <em>"Tao đang cai. Vợ doạ, sợ vợ hơn sợ ung thư."</em> Bạn cười, không ép. Mình qua được moment.</p>
<p>Bài học: chuẩn bị câu trả lời TRƯỚC. Lúc thèm + cồn vào + áp lực — não anh không nghĩ ra. Câu nói SẴN = vũ khí.</p>
""",
    'vo-chong-gian-cai': """
<p>Tuần 2 cai mình cáu vợ vô cớ — chỉ vì cô ấy hỏi <em>"Anh ăn cơm chưa?"</em>. Mình quát. Vợ giận, không nói chuyện 2 ngày.</p>
<p>Mình tự hỏi: tại sao mình hỗn? Hoá ra cai thuốc = cortisol cao + dopamine thấp = dễ cáu. Mình xin lỗi vợ, giải thích. Vợ hiểu — vì cô ấy đã chờ ngày này 30 năm.</p>
<p>Tip cho anh: BÁO TRƯỚC vợ về tuần đầu cai. <em>"Em ơi, tuần này anh cáu lắm — không phải vì em, là vì hút. Em cho anh time."</em> Đa số vợ sẽ thông cảm.</p>
""",
    'dam-tang-cuoi-khoi-thuoc': """
<p>Day 30 mình đi đám tang anh họ — quê. Anh em trong họ đều hút. Có bác mời mình: <em>"Cháu hút 1 điếu cho ấm — đám tang mà."</em></p>
<p>Mình nói nhỏ với bác: <em>"Cháu đang cai. Bác giúp cháu không?"</em> Bác im, rồi gật. Đám tang xong, bác dúi vào tay 100k: <em>"Tiền thuốc cháu tiết kiệm, cứ giữ."</em></p>
<p>Đám tang/cưới quê Việt — văn hoá ép thuốc nặng. Tip: báo TRƯỚC 1 người thân (chú, bác, anh trai) — nhờ họ bảo vệ. Anh em họ sẽ tự ngưng.</p>
""",
    'tet-le-cai-thuoc': """
<p>Tết 2021 mình mới cai 1 tháng. Cả nhà sum vầy 5 ngày. Mọi anh em đều hút — sảnh nhà ông cụ khói mịt. Mình suýt fail nhiều lần.</p>
<p>Mình áp dụng: ngồi sát vợ + cháu, đi WC mỗi giờ thở 4-7-8, uống nước nhiều, đi bộ quanh xóm với cháu. 5 ngày Tết — mình không hút điếu nào. Đó là moment thử thách lớn nhất 5 năm cai của mình.</p>
<p>Tết / lễ là moment nguy hiểm bậc nhất — chuẩn bị kế hoạch TRƯỚC 1 tuần.</p>
""",
    'tim-mach-hoi-phuc': """
<p>Trước cai mình huyết áp 145/95, tim đập 78 lúc nghỉ. 6 tháng cai — huyết áp 125/82, tim 65. Bác sĩ ngạc nhiên: <em>"Anh không cần thuốc huyết áp nữa."</em></p>
<p>1 năm sau cai, leo cầu thang 4 tầng không thở. Đi bộ 5km thoải mái. 3 năm sau, đi khám sức khoẻ — chỉ số tim mạch như tuổi 35 dù mình 48 tuổi.</p>
<p>Tim mạch là cơ quan phục hồi NHANH NHẤT sau cai. Cứ mỗi năm cai = thêm 10 năm tim khoẻ.</p>
""",
    'champix-varenicline-cai-thuoc': """
<p>Mình KHÔNG dùng Champix — vì hồi đó (2015-2020) chưa phổ biến ở VN + sợ side effects + chi phí cao. Mình thành công bằng Cold Turkey + công cụ tâm lý.</p>
<p>NHƯNG anh em pilot Sol đã có người dùng Champix combo Sol — tỷ lệ thành công 50-60% (cao hơn Sol đơn thuần 35%). Nếu anh đã fail 3+ lần Cold Turkey, hút >20 điếu/ngày, hút >15 năm — TÌM BS hô hấp/tâm thần kê đơn Champix + dùng Sol song song.</p>
<p>Champix không phải "ma thuật" — vẫn cần kế hoạch tâm lý. Nhưng nó giảm withdrawal Day 1-7 đáng kể.</p>
""",
    'mieng-dan-nicotine-nrt': """
<p>Mình thử miếng dán Nicorette 1 lần (lần thứ 4 cai, năm 2018) — work tạm tuần đầu, nhưng mình bỏ vì kích ứng da. Lần 5 mình Cold Turkey không NRT — thành công.</p>
<p>NRT (miếng dán, kẹo nicotine) phù hợp anh em hút >20 điếu/ngày, withdrawal cực mạnh — giảm shock Day 1-7. Combo NRT + Sol = best. Giá ~250-350k/tháng, mua nhà thuốc không cần đơn.</p>
<p>Lưu ý: NRT là "phao tạm" — không phải "thay thế thuốc lá vĩnh viễn". Dùng 8-12 tuần rồi giảm liều dần. KHÔNG dùng >6 tháng.</p>
""",
    'lo-hut-dieu-roi': """
<p>Mình đã lỡ 2 điếu trong tuần đầu cai lần 5 — Day 4 và Day 5, đều ở văn phòng khi stress deadline. Mình ghi vào sổ, không tự trách.</p>
<p>Sáng hôm sau Day 6, mình mở app Sol — đếm ngày sạch vẫn là 6 (KHÔNG reset). Mình tiếp tục như chưa có gì. Đến Day 30 mình đã quên hẳn 2 điếu đó.</p>
<p>Lapse ≠ relapse. Hughes 2004: người cai thành công lỡ trung bình 3-5 lần. Lỡ là sự cố, không phải thất bại. "Bỏ cuộc sau 1 điếu" mới là thất bại.</p>
""",
}

# Section names → CSS class mapping
SECTION_CLASS = {
    '## Hook': 'lead-quote',
    '## Cần biết ngay': 'check-box',
    '## 💚 Cần gọi NGAY': 'alarm',
    '## 💬 Khang nói': 'khang-says',
    '## Tham khảo': 'footer-refs',
    '## Bắt đầu cùng SOL': 'cta-end',
    '## Ghi chú cho Khang': '_skip_',  # internal note, không render
}

def parse_frontmatter(text):
    """Parse YAML frontmatter giữa --- ... ---"""
    m = re.match(r'^---\n(.*?)\n---\n', text, re.DOTALL)
    if not m:
        return {}, text
    fm_text = m.group(1)
    rest = text[m.end():]
    fm = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            fm[key.strip()] = val.strip().strip('"\'')
    return fm, rest

def md_to_html_section(content):
    """Convert markdown content (1 section) → HTML."""
    lines = content.strip().split('\n')
    html = []
    in_ul = False
    in_ol = False
    for line in lines:
        line = line.rstrip()
        if not line:
            if in_ul: html.append('</ul>'); in_ul = False
            if in_ol: html.append('</ol>'); in_ol = False
            continue

        # H3
        if line.startswith('### '):
            if in_ul: html.append('</ul>'); in_ul = False
            if in_ol: html.append('</ol>'); in_ol = False
            html.append(f'<h3>{line[4:]}</h3>')
        # Blockquote
        elif line.startswith('> '):
            html.append(f'<blockquote>{inline_md(line[2:])}</blockquote>')
        # Bullet list
        elif re.match(r'^[*-]\s+', line):
            if not in_ul: html.append('<ul>'); in_ul = True
            item = re.sub(r'^[*-]\s+', '', line)
            html.append(f'<li>{inline_md(item)}</li>')
        # Numbered list
        elif re.match(r'^\d+\.\s+', line):
            if not in_ol: html.append('<ol>'); in_ol = True
            item = re.sub(r'^\d+\.\s+', '', line)
            html.append(f'<li>{inline_md(item)}</li>')
        # Paragraph
        else:
            if in_ul: html.append('</ul>'); in_ul = False
            if in_ol: html.append('</ol>'); in_ol = False
            html.append(f'<p>{inline_md(line)}</p>')
    if in_ul: html.append('</ul>')
    if in_ol: html.append('</ol>')
    return '\n'.join(html)

def inline_md(text):
    """Inline markdown: **bold**, *italic*, [text](url), `code`, [^1] footnote refs."""
    # Bold
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    # Italic
    text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
    # Code
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    # Links
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" style="color:#B25C2C;font-weight:600;">\1</a>', text)
    # Footnote refs [^1]
    text = re.sub(r'\[\^(\d+)\]', r'<sup>[\1]</sup>', text)
    return text

def parse_skeleton(text):
    """Split skeleton into sections by ## headers."""
    sections = {}
    current = None
    current_lines = []
    for line in text.split('\n'):
        if line.startswith('## '):
            if current:
                sections[current] = '\n'.join(current_lines)
            current = line.strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current:
        sections[current] = '\n'.join(current_lines)
    return sections

# ─── Master HTML template ────────────────────────────────────
STYLE_BLOCK = """<style>
.sol-wiki { font-family: 'Be Vietnam Pro', -apple-system, sans-serif; color: #2C2A27; line-height: 1.7; }
.sol-wiki h2 { color: #5C3A1E; font-size: 22px; margin: 32px 0 14px; font-weight: 700; }
.sol-wiki h3 { color: #B25C2C; font-size: 17px; margin: 22px 0 10px; font-weight: 700; }
.sol-wiki .lead { font-size: 17px; line-height: 1.65; margin: 0 0 24px; }
.sol-wiki blockquote { background: #FFF4EA; border-left: 4px solid #B25C2C; padding: 16px 20px; margin: 16px 0; font-style: italic; color: #5C3A1E; }
.sol-wiki .check-box { background: #FFF4EA; border-left: 4px solid #B25C2C; padding: 16px 20px; margin: 16px 0; border-radius: 8px; }
.sol-wiki .check-box ul { margin: 8px 0 0; }
.sol-wiki .alarm { background: linear-gradient(135deg, #FEE2E2 0%, #FFF4EA 100%); border: 2px solid #DC2626; border-radius: 14px; padding: 22px 26px; margin: 24px 0; }
.sol-wiki .alarm h3 { color: #DC2626; margin-top: 0; }
.sol-wiki .alarm strong { color: #DC2626; }
.sol-wiki .khang-says { background: linear-gradient(135deg, #FFF4EA 0%, #FAFAF8 100%); border: 1px solid #B25C2C; border-radius: 14px; padding: 22px 26px; margin: 24px 0; }
.sol-wiki .khang-says-label { font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #B25C2C; margin-bottom: 8px; }
.sol-wiki .khang-says p { margin: 0 0 12px; font-style: italic; color: #2C2A27; font-size: 15.5px; }
.sol-wiki .khang-says p:last-child { margin-bottom: 0; }
.sol-wiki .cta-box { background: linear-gradient(135deg, #5C3A1E 0%, #B25C2C 100%); color: white; padding: 28px 24px; border-radius: 14px; margin: 32px 0; text-align: center; }
.sol-wiki .cta-box a { display: inline-block; background: white; color: #B25C2C; padding: 14px 28px; border-radius: 999px; font-weight: 700; text-decoration: none; margin-top: 12px; font-size: 15px; }
.sol-wiki .footer-meta { font-size: 13px; color: #8A857C; font-style: italic; margin: 16px 0; }
.sol-wiki .footer-emergency { font-size: 12px; color: #8A857C; font-style: italic; background: #FFF4EA; padding: 12px 14px; border-radius: 8px; }
.sol-wiki strong { color: #5C3A1E; }
.sol-wiki ul, .sol-wiki ol { padding-left: 24px; margin: 12px 0; }
.sol-wiki ul li, .sol-wiki ol li { margin-bottom: 6px; }
.sol-wiki code { background: #FFF4EA; padding: 1px 6px; border-radius: 4px; font-size: 13px; }
</style>"""

CTA_BLOCK = """<div class="cta-box">
<p style="font-size: 14px; opacity: 0.9; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">🌱 SOL ĐI CÙNG</p>
<p style="font-size: 22px; font-weight: 700; margin: 0 0 14px;">7 ngày Nhận Diện MIỄN PHÍ — không cần SĐT</p>
<p style="font-size: 15px; opacity: 0.95; line-height: 1.6; margin: 0 0 8px;">
Cá nhân hoá theo Mức Lệ Thuộc của anh. 3 lộ trình 35/52/65 ngày. 4 cách trả tiền linh hoạt. Khang đi cùng anh từng ngày bằng voice + AI + Khoảng Lặng anh em VN.
</p>
<a href="https://bothuocla.sol.vn/?utm_source=wiki&utm_medium=chip&utm_campaign={slug}">Bắt đầu 7 ngày — mình đợi anh →</a>
</div>"""

FOOTER_BLOCK = """<hr style="border: 0; border-top: 1px dashed #E8DFC8; margin: 32px 0;">
<p class="footer-meta">
<strong>Tác giả:</strong> Khang Sol (Nguyễn Đình Khang) — đã hút Vinataba 30 năm, Tự do hơn 5 năm. Founder <a href="https://sol.vn" style="color: #B25C2C;">Sol Đi Cùng</a>. {refs}
</p>
<p class="footer-emergency">
<strong>🚨 Khẩn cấp y tế</strong>: đau ngực dữ dội, khó thở nặng, ngất, ho ra máu, ý nghĩ tự hại — gọi <a href="tel:115" style="color: #B25C2C; font-weight: 700;">115</a> hoặc tổng đài cai thuốc miễn phí BV Bạch Mai <a href="tel:0888008866" style="color: #B25C2C; font-weight: 700;">0888-008-866</a> (24/7).
</p>"""

def build_html(skeleton_path, slug):
    """Build HTML Sol v4 cho 1 skeleton."""
    text = skeleton_path.read_text(encoding='utf-8')
    fm, body = parse_frontmatter(text)
    sections = parse_skeleton(body)

    title = fm.get('title', slug)
    parts = [STYLE_BLOCK, '<div class="sol-wiki">']

    # Lead (Hook)
    hook = sections.get('## Hook', '').strip()
    if hook:
        # First blockquote = lead
        bq_match = re.search(r'> (.+?)(?=\n[^>]|\Z)', hook, re.DOTALL)
        if bq_match:
            lead_text = bq_match.group(1).replace('\n> ', ' ').replace('\n>', '')
            parts.append(f'<p class="lead">{inline_md(lead_text)}</p>')
        else:
            parts.append(f'<p class="lead">{inline_md(hook)}</p>')

    # "Cần biết ngay" → highlighted box
    can_biet = sections.get('## Cần biết ngay', '').strip()
    if can_biet:
        parts.append('<div class="check-box"><strong>Cần biết ngay:</strong>')
        parts.append(md_to_html_section(can_biet))
        parts.append('</div>')

    # Emergency hotline (CRITICAL bài)
    emergency = sections.get('## 💚 Cần gọi NGAY (Việt Nam)', '').strip()
    if emergency:
        parts.append('<div class="alarm"><h3>💚 Cần gọi NGAY (Việt Nam)</h3>')
        parts.append(md_to_html_section(emergency))
        parts.append('</div>')

    # Process all other sections (Phần 1, 2, 3...)
    for section_name, content in sections.items():
        if section_name in ('## Hook', '## Cần biết ngay', '## 💚 Cần gọi NGAY (Việt Nam)',
                            '## 💬 Khang nói', '## Tham khảo', '## Bắt đầu cùng SOL',
                            '## Ghi chú cho Khang', '## Câu hỏi thường gặp'):
            continue
        parts.append(f'<h2>{section_name[3:]}</h2>')
        parts.append(md_to_html_section(content))

    # Khang says — use our dictionary
    khang_story = KHANG_STORIES.get(slug)
    if khang_story:
        parts.append('<div class="khang-says">')
        parts.append('<div class="khang-says-label">💬 Khang nói</div>')
        parts.append(khang_story.strip())
        parts.append('</div>')

    # FAQ
    faq = sections.get('## Câu hỏi thường gặp', '').strip()
    if faq:
        parts.append('<h2>Câu hỏi thường gặp</h2>')
        # Convert Q/A pattern
        faq_html = re.sub(r'\*\*Q: (.+?)\*\*\s*\nA: (.+?)(?=\n\n\*\*Q:|\Z)',
                          r'<h3>\1</h3>\n<p>\2</p>', faq, flags=re.DOTALL)
        parts.append(md_to_html_section(faq_html))

    # CTA Sol v4
    parts.append(CTA_BLOCK.format(slug=slug))

    # Refs
    refs_section = sections.get('## Tham khảo', '').strip()
    refs_text = ''
    if refs_section:
        # Extract footnote refs
        ref_lines = re.findall(r'\[\^\d+\]:\s*(.+)', refs_section)
        if ref_lines:
            refs_text = 'Nguồn: ' + ' · '.join(ref_lines[:4])

    # Footer
    parts.append(FOOTER_BLOCK.format(refs=refs_text))
    parts.append('</div>')

    return '\n'.join(parts)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--slug', help='Gen 1 bài theo slug')
    parser.add_argument('--only-critical', action='store_true', help='Chỉ gen 3 bài CRITICAL')
    parser.add_argument('--skip-critical', action='store_true', help='Bỏ qua 3 bài CRITICAL')
    args = parser.parse_args()

    skeletons = sorted(CHIPS_DIR.glob('chip-*.md'))
    OUT_DIR.mkdir(exist_ok=True)

    count = 0
    for sk in skeletons:
        # Extract slug from filename: chip-XXX.md → slug from POST_IDS mapping
        chip_name = sk.stem.replace('chip-', '')

        # Parse frontmatter to get true slug
        text = sk.read_text(encoding='utf-8')
        fm, _ = parse_frontmatter(text)
        slug = fm.get('slug')
        if not slug:
            print(f'⚠ {sk.name}: không có slug trong frontmatter, skip')
            continue

        # Skip duplicates (đã LIVE Cluster A+B hoặc sap-hut)
        if slug in ('con-them-du-doi', 'di-nhau-khi-cai', 'phoi-hoi-phuc-sau-cai',
                    'tao-bon-khi-cai', 'sap-hut-lai-cuu'):
            continue

        # Filter args
        if args.slug and slug != args.slug:
            continue
        if args.only_critical and slug not in CRITICAL_SLUGS:
            continue
        if args.skip_critical and slug in CRITICAL_SLUGS:
            continue

        html = build_html(sk, slug)
        out_path = OUT_DIR / f'CHIP-{slug}.html'
        out_path.write_text(html, encoding='utf-8')
        flag = ' ⚠ CRITICAL' if slug in CRITICAL_SLUGS else ''
        print(f'OK {slug:<35} CHIP-{slug}.html')
        count += 1

    print(f'\nTotal: {count} HTML files generated')

if __name__ == '__main__':
    main()
    main()
