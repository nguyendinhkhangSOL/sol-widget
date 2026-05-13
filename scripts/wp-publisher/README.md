# Sol v4 — WordPress Publisher Toolkit

Tool tự động đẩy/update content lên sol.vn qua REST API + Application Password.

## Setup (1 lần)

1. Copy `.env.example` → `.env`
2. Điền 3 giá trị:
   ```
   WP_URL=https://sol.vn
   WP_USERNAME=<username WP của Khang>
   WP_APP_PASSWORD=<app password 24 ký tự, có thể có space>
   ```
3. Test auth:
   ```bash
   node test-auth.js
   ```
   → Phải in "✓ AUTH OK" + thông tin user.

## Scripts

| Script | Tác dụng |
|---|---|
| `test-auth.js` | Verify Application Password hoạt động |
| `list-pages.js` | List tất cả Page + ID + slug + status (sẽ build) |
| `update-page.js` | Update 1 Page từ file HTML local (sẽ build) |
| `bulk-fix-seo.js` | Fix Title + Description cho 126 bài TITLE_LONG (sẽ build) |
| `import-wiki.js` | Bulk import bài Wiki từ folder `.md` (sẽ build) |

## Security

- `.env` đã có trong `.gitignore` — KHÔNG commit
- Application Password KHÔNG phải password chính của WP — anh có thể revoke trong WP Admin → Profile → Application Passwords
- Tool chỉ dùng REST API endpoint `/wp-json/wp/v2/*` — không can thiệp database trực tiếp
