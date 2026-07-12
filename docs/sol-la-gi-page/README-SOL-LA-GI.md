# Update trang sol.vn/sol-la-gi/ — About Sol

## Mục đích

Trang `sol.vn/sol-la-gi/` giải thích **Sol là gì** theo mô hình **3 trụ Thân-Tâm-Trí** mới.

Trang cũ chỉ focus bỏ thuốc lá → cần update toàn diện.

## Nội dung mới

### Cấu trúc 11 sections

1. **Hero** — "Sol là gì?" giới thiệu ngắn
2. **Sứ mệnh** — Đồng hành đàn ông Việt 40-65
3. **3 Trụ** — Thân (bothuocla) · Tâm (sol.vn/ngam) · Trí (huongdi)
4. **Sol khác startup khác** — Bảng so sánh 8 yếu tố
5. **6 Giá trị cốt lõi** — Chậm sâu, Authentic, 3 trụ, Niche, First-hand, Đông-Tây
6. **Founder Khang Sol** — Bio ngắn + link `/khang-sol/`
7. **Roadmap 2024-2030** — 4 giai đoạn timeline
8. **Cộng đồng** — Newsletter, Zalo, Facebook Group
9. **Bắt đầu từ đâu?** — Quyết định cây theo vấn đề
10. **Disclaimer** — YMYL miễn trừ
11. **Closing** — "Đi cùng nhau, đường dài đỡ mỏi"

### Schema Organization JSON-LD

- jobTitle, foundingDate, founder (Khang Sol)
- knowsAbout 6 lĩnh vực
- subOrganization (3 trụ — bothuocla / ngam / huongdi)
- sameAs (LinkedIn, FB, Zalo)
- audience: "Đàn ông Việt 40-65 tái thiết"
- slogan: "Đi cùng nhau, đường dài đỡ mỏi"

## Deploy

### Lệnh 1: Update trang

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\sol-la-gi-page\
node update-sol-la-gi-page.js --search-slug sol-la-gi
```

Script sẽ:
- Tìm page slug `sol-la-gi`
- Nếu thấy → update content + schema
- Nếu không → tạo PAGE mới với status draft

### Lệnh 2: Review trên wp-admin

Mở Edit URL → verify:
- ✅ Title + Slug đúng
- ✅ 11 sections render đẹp
- ✅ Bảng so sánh Sol vs Startup khác hiển thị OK
- ✅ Link 3 trụ (bothuocla, /ngam, huongdi) đúng
- ✅ Schema Organization JSON-LD ở cuối page
- ✅ Rank Math meta đầy đủ

### Lệnh 3: Publish + Submit GSC

- Click "Publish" trên wp-admin
- GSC → URL Inspection → `https://sol.vn/sol-la-gi/` → Request Indexing

## Tác động SEO

✅ **Brand authority** — page "Sol là gì" định nghĩa rõ brand cho Google
✅ **Schema Organization** — appear trong Google Knowledge Panel
✅ **Cross-link 3 trụ** — đẩy authority đến 3 sản phẩm
✅ **Founder EEAT** — link tới `/khang-sol/`
✅ **Mission + Values** — Google hiểu mission của Sol
✅ **Topic coverage** — 11 sections cover toàn diện brand identity

## Pre-requisites

Script dùng deps từ `pillar-to-wp/`:
- dotenv (load .env.wp)
- node-fetch (REST API call)
- marked (markdown parser)

Đảm bảo đã install ở `pillar-to-wp/`:

```powershell
cd ..\pillar-to-wp\
npm install dotenv node-fetch@2 marked
```

Hoặc install local nếu cần:

```powershell
cd C:\BOTHUOCLA\sol-widget\docs\sol-la-gi-page\
npm install dotenv node-fetch@2
```

(Marked vẫn share với pillar-to-wp)

---

**Author:** Sol AI · **Date:** 2026-06-23
