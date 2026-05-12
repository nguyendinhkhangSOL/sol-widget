# Sol.vn SEO Audit

Script Node.js audit toàn site sol.vn — fetch sitemap → check 9 SEO signals → output report CSV + Markdown.

## Cách chạy

```bash
cd D:\BOTHUOCLA\sol-widget\scripts\seo-audit
node audit.js
```

Không cần `npm install` — script chỉ dùng Node built-in (https, fs, path).

## Output

- `report.csv` — full data 41+ URL (mở Excel để filter/sort).
- `report.md` — tóm tắt: tổng quan + top 10 trang cần fix + action items.

## Test single URL

```bash
node audit.js https://sol.vn/wiki-bo-thuoc-la/cach-bo-thuoc-la/
```

## 9 SEO signals checked

1. `<title>` 30-60 ký tự
2. `<meta description>` 120-160 ký tự
3. `<h1>` exists, single, non-empty
4. JSON-LD Article/BlogPosting schema
5. `<link rel="canonical">`
6. OG tags (og:title, og:description, og:image)
7. Internal link tới `/bo-thuoc-la` HOẶC `bothuocla.sol.vn`
8. Word count ≥ 300
9. Tất cả `<img>` có alt text

## Tuỳ chỉnh

Sửa trong `audit.js`:

- `ROOT` — domain audit (mặc định `https://sol.vn`).
- `HUB_TARGETS` — danh sách hub URL cần check internal link.
- `CONCURRENCY` — số request đồng thời (mặc định 4).
- `TIMEOUT_MS` — timeout per request (mặc định 15s).

## Issue codes (xem report.md)

| Code | Ý nghĩa |
|---|---|
| `NO_TITLE` | Trang không có thẻ title |
| `TITLE_SHORT` / `TITLE_LONG` | Title ngoài range 30-60 |
| `NO_DESC` | Không có meta description |
| `DESC_SHORT` / `DESC_LONG` | Meta desc ngoài range 120-160 |
| `NO_H1` / `MULTIPLE_H1` | Sai cấu trúc heading |
| `NO_CANONICAL` | Không có canonical URL |
| `NO_ARTICLE_SCHEMA` | Thiếu JSON-LD Article/BlogPosting |
| `NO_OG_TITLE` / `NO_OG_DESC` / `NO_OG_IMAGE` | Thiếu OG tag |
| `NO_HUB_LINK` | Không link đến hub `/bo-thuoc-la` hoặc `bothuocla.sol.vn` |
| `THIN_CONTENT` | < 300 từ |
| `IMG_NO_ALT(N)` | N ảnh thiếu alt |
| `FETCH_FAIL` | Network/HTTP error |
