# Sol SEO Content — Hướng dẫn Publish 16 bài

## Cấu trúc thư mục

```
seo-content-plan/
├── 00-SEO-MASTER-PLAN.md           # Chiến lược tổng thể
├── README-PUBLISH.md               # File này
├── articles/                        # 16 bài HTML sẵn sàng WP paste
│   ├── 01-pillar-tai-khoi-nghiep-tinh-gon.html    (5000+ từ)
│   ├── 02-A1-40-tuoi-nen-kinh-doanh-gi.html       (2500 từ)
│   ├── 03-A2-45-tuoi-nen-kinh-doanh-gi.html       (2500 từ)
│   ├── 04-A3-50-tuoi-nen-kinh-doanh-gi.html       (2500 từ)
│   ├── 05-B1-doanh-nghiep-1-nguoi.html            (2000 từ)
│   ├── 06-B2-one-person-company.html              (2000 từ)
│   ├── 07-B3-kinh-doanh-tinh-gon.html             (2000 từ)
│   ├── 08-C1-5-buoc-sol-la-ban.html               (2500 từ)
│   ├── 09-C2-ai-cho-nguoi-40-60.html              (2000 từ)
│   ├── 10-C3-he-sinh-thai-sol.html                (2000 từ)
│   ├── 11-D1-cuu-cfo-chuyen-huong.html            (1800 từ)
│   ├── 12-D2-nghi-viec-45-tuoi.html               (2000 từ)
│   ├── 13-D3-fractional-cfo.html                  (2000 từ)
│   ├── 14-S1-5-dau-hieu-can-chuyen-huong.html     (1500 từ)
│   ├── 15-S2-checklist-30-ngay.html               (1500 từ)
│   └── 16-S3-10-sai-lam-khoi-nghiep-45.html       (1800 từ)
├── featured-images/
│   └── template-generator.html      # Mở file này trong browser để tạo 16 ảnh
└── wp-publish/
    └── wp-publish.py                # Python script publish qua XML-RPC
```

## Cấu trúc tuyến bài

**1 Pillar + 4 Clusters:**

| Nhóm | Slug | Focus keyword | Traffic mục tiêu |
|------|------|---------------|------------------|
| Pillar | `tai-khoi-nghiep-tinh-gon-40-60` | tái khởi nghiệp tinh gọn | 1500-3000 /mo |
| A1 | `40-tuoi-nen-kinh-doanh-gi` | 40 tuổi nên kinh doanh gì | 800-1500 /mo |
| A2 | `45-tuoi-nen-kinh-doanh-gi` | 45 tuổi nên kinh doanh gì | 500-1000 /mo |
| A3 | `50-tuoi-nen-kinh-doanh-gi` | 50 tuổi nên kinh doanh gì | 400-800 /mo |
| B1 | `doanh-nghiep-1-nguoi-la-gi` | doanh nghiệp 1 người | 300-600 /mo |
| B2 | `one-person-company-la-gi` | one person company là gì | 200-400 /mo |
| B3 | `kinh-doanh-tinh-gon-la-gi` | kinh doanh tinh gọn | 400-800 /mo |
| C1 | `5-buoc-sol-la-ban` | sol la bàn | Brand |
| C2 | `ai-cho-nguoi-40-60` | ai cho người 40-60 | 300-600 /mo |
| C3 | `he-sinh-thai-sol` | hệ sinh thái sol | Brand |
| D1 | `cuu-cfo-chuyen-huong-kinh-doanh` | cựu cfo chuyển hướng | 200-400 /mo |
| D2 | `nghi-viec-45-tuoi` | nghỉ việc tuổi 45 | 500-1000 /mo |
| D3 | `fractional-cfo-la-gi` | fractional cfo là gì | 300-600 /mo |
| S1 | `5-dau-hieu-can-chuyen-huong-tuoi-45` | dấu hiệu chuyển hướng | 200-400 /mo |
| S2 | `checklist-30-ngay-chuan-bi-khoi-nghiep` | checklist khởi nghiệp | 200-400 /mo |
| S3 | `10-sai-lam-khoi-nghiep-tuoi-45` | sai lầm khởi nghiệp 45 | 300-500 /mo |

**Tổng traffic mục tiêu tháng 3:** 6.000-13.000 organic sessions/tháng.

## Cách 1: Publish thủ công (khuyến khích cho lần đầu)

**Ưu điểm:** Kiểm soát 100%, review từng bài trước publish.

**Bước 1:** Tạo featured images
```
Mở file: featured-images/template-generator.html
Trong browser (Chrome/Firefox)
Click "⬇ PNG 1200×630" ở từng bài
Lưu 16 PNG vào thư mục featured-images/
```

**Bước 2:** WP Admin → Posts → Add New
```
1. Copy nội dung từ file .html vào Gutenberg (Add block → Custom HTML)
2. Title: Copy từ file (dòng có TITLE trong comment)
3. Slug: Copy từ file (dòng SLUG)
4. Excerpt: Copy từ file (dòng DESC)
5. Category: "Hướng Đi"
6. Featured Image: Upload từ featured-images/
7. Yoast SEO:
   - Meta description: Copy DESC
   - Focus keyword: Copy FOCUS
   - Cornerstone content: ON (chỉ cho Pillar #01)
8. Publish
```

**Thời gian:** 15-20 phút/bài × 16 bài = 4-5h tổng.

## Cách 2: Publish tự động qua XML-RPC

**Ưu điểm:** Nhanh hơn 10x. Bulk publish tất cả 1 lệnh.

**Chuẩn bị:**

```bash
# 1. Cài dependency
pip3 install python-wordpress-xmlrpc --break-system-packages

# 2. Tạo Application Password trong WP Admin
# Users → Profile → Application Passwords
# Name: "SEO Publisher"
# Copy 16 chars password

# 3. Set ENV variables
export WP_URL="https://sol.vn/xmlrpc.php"
export WP_USER="khang"
export WP_PASS="app-pwd-16-ký-tự-copy-từ-wp"
```

**Publish:**

```bash
cd wp-publish/

# List tất cả articles có sẵn
python3 wp-publish.py --list

# Publish 1 bài (as draft để review)
python3 wp-publish.py --article 01 --draft

# Publish 1 bài live
python3 wp-publish.py --article 01

# Publish TẤT CẢ 16 bài
python3 wp-publish.py --all

# Update bài đã publish
python3 wp-publish.py --article 01 --post-id 12345
```

## Lịch publish đề xuất

**Tuần 1** — Foundation:
- Ngày 1: Pillar #01 (bài quan trọng nhất)
- Ngày 3: A1 (40 tuổi)
- Ngày 5: A2 (45 tuổi)
- Ngày 7: A3 (50 tuổi)

**Tuần 2** — Concept:
- Ngày 8: B1 (doanh nghiệp 1 người)
- Ngày 10: B2 (one person company)
- Ngày 12: B3 (kinh doanh tinh gọn)

**Tuần 3** — Solution:
- Ngày 15: C1 (5 Bước)
- Ngày 17: C2 (AI)
- Ngày 19: C3 (hệ sinh thái)

**Tuần 4** — Deep-dive:
- Ngày 22: D1 (cựu CFO)
- Ngày 24: D2 (nghỉ việc 45)
- Ngày 26: D3 (Fractional CFO)

**Tuần 5** — Seed:
- Ngày 29: S1, S2, S3 publish cùng ngày

## Checklist sau publish

Mỗi bài publish xong:
- [ ] Google Search Console: Submit URL for indexing
- [ ] Chia sẻ LinkedIn (giờ 9-10 sáng T2/T4)
- [ ] Chia sẻ Facebook Đi Cùng Sol
- [ ] Add internal link từ 2-3 bài liên quan (đã có sẵn trong content)
- [ ] Screenshot Google Search Console → Sổ tay tracking

## Tracking & KPI

Track weekly trong Google Search Console:
- Impressions cho mỗi focus keyword
- Position trung bình
- CTR
- Click-through to huongdi.sol.vn (bằng UTM parameters)

**KPI 90 ngày sau launch:**
- Tổng impressions: 50.000+/tháng
- Tổng clicks: 3.000+/tháng
- Position trung bình pillar: top 20
- Conversion to huongdi: 3-5% (150-250 users/tháng làm Bước 1)

---

**Author:** Khang Sol — Founder Sol.vn
**Last updated:** 2026-07-02
