# Wiki sol.vn — 14 bài skeleton về timeline cơ thể sau cai thuốc

Bộ skeleton này phục vụ trục SEO chính của `sol.vn/wiki`. Mỗi bài tương ứng với một mốc trên đồng hồ thể lý SOL (xem `bodyClock.ts`). Khi bài lên WordPress, link `wiki:` trong code sẽ live.

## Cách dùng các skeleton này

1. **Mỗi file là 1 bài** — Khang đọc, viết bằng giọng kể của mình, giữ nguyên outline + citations.
2. **Target dài** — 600-1200 từ mỗi bài. Đủ để Google đánh giá là "in-depth", không quá để user 45+ ngại đọc.
3. **Thêm ảnh / infographic** sau khi đã có nội dung — placeholder ghi `[ẢNH: ...]`.
4. **Link wiki khác** — luôn link 2-3 bài liên quan ở cuối ("Đọc tiếp"). Internal linking giúp SEO.
5. **CTA cuối bài** — luôn có khối: *"Bắt đầu hành trình cai cùng SOL — bothuocla.sol.vn"* + UTM `?utm_source=wiki&utm_campaign=<slug>` để tracking conversion.
6. **Citations** — đặt ở cuối, đánh số. Ưu tiên link gốc (CDC.gov, NHS.uk, PubMed) hơn báo lá cải.

## Quy ước SEO

- **Title tag** ≤ 60 ký tự, có keyword chính.
- **Meta description** ≤ 155 ký tự, có keyword + lợi ích cụ thể.
- **H1** = title, có keyword.
- **URL slug** dùng dấu gạch ngang, không dấu tiếng Việt.
- **Schema.org** markup `Article` + `MedicalCondition` (Yoast/Rank Math tự sinh nếu cấu hình đúng).

## 14 bài (theo thứ tự thời gian)

| # | Slug | Title rút gọn | Mốc |
|---|---|---|---|
| 01 | `20-phut-dau` | 20 phút đầu sau điếu cuối | 20 phút |
| 02 | `8-gio-co-giam` | 8 giờ — CO trong máu giảm 50% | 8 giờ |
| 03 | `12-gio` | 12 giờ — máu sạch CO gần như hoàn toàn | 12 giờ |
| 04 | `24-gio-tim` | 24 giờ — nguy cơ đau tim bắt đầu giảm | 24 giờ |
| 05 | `2-ngay-vi-giac` | 2 ngày — vị giác và khứu giác phục hồi | 48 giờ |
| 06 | `3-ngay-dinh-cai` | 3 ngày — đỉnh withdrawal, ngày khó nhất | 72 giờ |
| 07 | `1-tuan` | 1 tuần không thuốc — kỳ tích đầu tiên | 7 ngày |
| 08 | `2-tuan-receptor` | 2 tuần — receptor nicotine giảm 40% | 14 ngày |
| 09 | `3-tuan-thoi-quen` | 3 tuần — não đang xây thói quen mới | 21 ngày |
| 10 | `30-ngay-ky-tich` | 30 ngày — < 10% người làm được | 30 ngày |
| 11 | `3-thang-phoi` | 3 tháng — phổi tự làm sạch | 90 ngày |
| 12 | `1-nam-tim-mach` | 1 năm — nguy cơ tim mạch giảm 50% | 365 ngày |
| 13 | `5-nam-dot-quy` | 5 năm — đột quỵ = người chưa hút | 5 năm |
| 14 | `10-nam-ung-thu` | 10 năm — ung thư phổi giảm 50% | 10 năm |

## Phụ lục — 7 bài cho Q-Day Checklist

Khang viết trong batch sau (xem `qDayChecklist.ts`):
- `chuan-bi-ngay-d` · `dieu-khoan-mien-tru-y-te` · `noi-voi-nguoi-than` · `loai-bo-trigger` · `kit-khan-cap` · `tham-khao-bac-si` · `ngay-d-plus-3`

## Nguồn lâm sàng dùng chung

- **WHO Tobacco Free Initiative** — who.int/health-topics/tobacco
- **NHS Smokefree (Anh)** — nhs.uk/better-health/quit-smoking
- **CDC Smoking & Tobacco Use** — cdc.gov/tobacco/quit_smoking/how_to_quit/benefits
- **Smokefree.gov (US NCI)** — smokefree.gov
- **2020 Surgeon General's Report — Smoking Cessation** (US Dept. of Health and Human Services)
- **IARC Monograph on Tobacco Smoke** (Volume 100E, 2012)
- **Hughes JR (2007)** — *Effects of abstinence from tobacco*. Nicotine Tob Res. 9(3):315–327
- **Mamede M et al. (2007)** — *Temporal change in human nicotinic acetylcholine receptor*. J Nucl Med 48(11):1829–35
- **Lally P et al. (2010)** — *How are habits formed*. Eur J Soc Psychol 40(6):998–1009
