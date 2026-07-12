# Update trang Khang Sol — Author Profile EEAT

## Mục đích

Trang `sol.vn/khang-sol/` là **EEAT signal quan trọng nhất** cho cả Sol ecosystem. Google check để verify Khang là tác giả thật, có chuyên môn thật về 3 trụ Thân-Tâm-Trí.

Trang hiện tại chỉ focus bỏ thuốc lá → cần update toàn diện cover 3 trụ.

## Bộ file

```
docs/khang-sol-page/
├── khang-sol-author-profile.md      — Content MD chuẩn EEAT
├── schema-person-khang-sol.json     — Schema Person JSON-LD
├── update-khang-sol-page.js          — Script tự update WP
└── README-UPDATE-KHANG-SOL.md        — File này
```

## Quy trình update — 3 lệnh

### Lệnh 1: Search + update trang khang-sol (auto)

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\khang-sol-page\
node update-khang-sol-page.js --search-slug khang-sol
```

→ Script sẽ:
- Tìm page/post có slug `khang-sol`
- Nếu tìm thấy → update content + schema
- Nếu không tìm thấy → tạo page mới (status: draft)

### Lệnh 2: Review trên wp-admin

Mở Edit URL (script trả về). Verify:

- ✅ Title: "Khang Sol — Người Đi Cùng Đàn Ông Việt 40-65 Trên Hành Trình Tái Thiết"
- ✅ Content render đúng (Gutenberg blocks)
- ✅ Schema Person JSON-LD ở cuối page
- ✅ 3 trụ link đúng (bothuocla, /tam, huongdi)
- ✅ Social links (LinkedIn, Facebook, Zalo)
- ✅ Featured image — Khang's portrait

### Lệnh 3: Set Featured Image

```powershell
# Anh dùng portrait Khang Sol hiện có
node ..\pillar-to-wp\set-featured-image.js <KHANG_PAGE_ID> "C:\BOTHUOCLA\sol-widget\assets\khang-portrait-yulong-mountain.jpg" "Khang Sol - Founder Di Cung Sol"
```

(Nếu không có file portrait local, dùng URL hiện tại trên WP Media Library.)

## Sau khi update

### Click "Publish" thay vì draft (nếu chưa)

Trang Khang Sol nên **ALWAYS published** (không bao giờ draft) vì:
- Là EEAT anchor cho cả site
- Mọi pillar đều link tới
- Schema Person depend on này

### Submit GSC URL Inspection

```
https://search.google.com/search-console
→ URL Inspection
→ https://sol.vn/khang-sol/
→ Request Indexing
```

→ Force Google re-crawl page sau update.

## Nội dung mới gồm gì?

### 1. Hero — "Người Đi Cùng Đàn Ông Việt 40-65"

Brand mission clear, không chỉ là bỏ thuốc.

### 2. 3 Trụ Sol — Thân · Tâm · Trí

**Trụ Thân (bothuocla.sol.vn)**
- Bỏ thuốc lá + vận động + ngủ
- Hành trình Khang bỏ thuốc tuổi 42
- Link tới hệ thống FTND + 3 cohort

**Trụ Tâm (sol.vn/ngam/)**
- Khủng hoảng tuổi trung niên
- Thiền + journaling + community
- Sắp ra mắt Q3/2026

**Trụ Trí (huongdi.sol.vn)**
- 37 hướng tái khởi nghiệp
- P1/P2/P3 tools
- 7 pillar + 37 spoke pages

### 3. Câu chuyện cá nhân

Câu chuyện rời FPT 2024 → build Sol vì quan sát 50+ anh em U45.

### 4. Kinh nghiệm + Học vấn

20+ năm CNTT, Founder Sol, Coach 50+ founder, Investor angel.

### 5. KnowsAbout 9 lĩnh vực chuyên môn

Mid-life career, Lean Startup, IT PM, SME, Smoking cessation, Mid-life mental health, B2B sales, Coaching VN founder, Personal brand.

### 6. Disclaimer YMYL rõ ràng

KHÔNG phải tư vấn tài chính/y tế/tâm lý có license. Chỉ chia sẻ kinh nghiệm.

### 7. Cách làm việc + Pricing

Coaching 1-3tr/giờ, Consulting 50-200tr/dự án, Cohort 5tr/member.
Public content MIỄN PHÍ.

### 8. Community channels

Newsletter, Zalo OA, Facebook Group.

### 9. Schema Person JSON-LD

Full schema với:
- jobTitle, worksFor
- knowsAbout (9 chuyên môn)
- sameAs (LinkedIn, FB, Zalo)
- alumniOf, nationality
- subjectOf (3 sản phẩm Sol)

## Tác động SEO sau update

✅ **EEAT score tăng mạnh** — author profile có depth + structured data
✅ **Cross-link cluster** — link tới 3 sản phẩm + 7 pillar
✅ **Topic authority** — Google hiểu Khang chuyên về 9 lĩnh vực
✅ **Personal brand** — social signals đầy đủ
✅ **Trust signal** — disclaimer YMYL rõ ràng

→ Tất cả pillar trên sol.vn/huong-di/ + bothuocla.sol.vn + sol.vn/ngam/ sẽ được Google đánh giá cao hơn vì có **author EEAT mạnh**.

## Nếu cần khôi phục bản cũ

Trước khi run script, em recommend Khang:

```
wp-admin → Edit trang Khang Sol hiện tại
→ Copy nội dung HTML sang notepad (backup)
→ Sau đó run script update
```

→ Nếu không hài lòng version mới, paste lại HTML cũ.

---

**Author:** Sol AI · **Date:** 2026-06-23
