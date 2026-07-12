# HUONGDI SEO — Hướng dẫn Deploy

## Bộ file

```
docs/huongdi-seo/
├── seo-data.json       — Config 11 pages (title, desc, keywords, schemas)
├── schemas.json        — Schema.org templates (Organization, Quiz, ItemList, Breadcrumb...)
├── inject-seo.js       — Script Node tự động inject meta tags vào HTML
├── sitemap.xml         — Sitemap XML cho Google
├── robots.txt          — Robots policy + AI bots allow list
└── README-DEPLOY.md    — File này
```

---

## Quy trình 6 bước (khoảng 15 phút)

### Bước 1 — SCP upload bộ file lên VPS

Từ máy local (Windows PowerShell):

```powershell
scp -r C:\BOTHUOCLA\sol-widget\docs\huongdi-seo sol-vps:/tmp/
```

### Bước 2 — SSH vào VPS

```bash
ssh sol-vps
```

### Bước 3 — Backup hiện trạng (an toàn)

```bash
sudo tar -czf /tmp/huongdi-public-backup-$(date +%Y%m%d).tar.gz -C /var/www/huongdi public/
ls -la /tmp/huongdi-public-backup-*.tar.gz
```

→ Có backup, an tâm rollback nếu cần.

### Bước 4 — Dry-run trước (KHÔNG sửa file)

```bash
cd /tmp/huongdi-seo
node inject-seo.js --dry-run --dir=/var/www/huongdi/public
```

→ Expected output:
```
═══════════════════════════════════════════════════════════════════
  HUONGDI.SOL.VN — SEO Injector
═══════════════════════════════════════════════════════════════════
Target dir: /var/www/huongdi/public
Dry run:    YES (no files written)

  ⏭️  index.html — file not found, skip  ← nếu có index.html thì OK
  ✅ p1.html — injected (4 schemas) [DRY-RUN]
  ✅ p2.html — injected (4 schemas) [DRY-RUN]
  ✅ p3.html — injected (4 schemas) [DRY-RUN]
  ✅ p3-chuyenmon.html — injected (4 schemas) [DRY-RUN]
  ✅ p3-daotao.html — injected (4 schemas) [DRY-RUN]
  ...

═══════════════════════════════════════════════════════════════════
  Result: 10 updated · 1 skipped · 0 failed
═══════════════════════════════════════════════════════════════════
```

### Bước 5 — Chạy thật (sửa file)

Nếu dry-run ok, chạy thật:

```bash
cd /tmp/huongdi-seo
node inject-seo.js --dir=/var/www/huongdi/public
```

→ Backup `.bak.YYYYMMDD-HHMMSS` được tạo tự động cho mỗi file.

### Bước 6 — Copy sitemap.xml + robots.txt

```bash
sudo cp /tmp/huongdi-seo/sitemap.xml /var/www/huongdi/public/sitemap.xml
sudo cp /tmp/huongdi-seo/robots.txt /var/www/huongdi/public/robots.txt
sudo chmod 644 /var/www/huongdi/public/sitemap.xml /var/www/huongdi/public/robots.txt
```

---

## Verify (5 phút)

### 1. Test sitemap accessible

```bash
curl -sI https://huongdi.sol.vn/sitemap.xml | head -5
curl -s https://huongdi.sol.vn/sitemap.xml | head -10
```

→ Expect: `HTTP/2 200` + XML content.

### 2. Test robots.txt accessible

```bash
curl -s https://huongdi.sol.vn/robots.txt | head -20
```

→ Expect: nội dung robots.

### 3. Test meta tags injected vào HTML

```bash
curl -s https://huongdi.sol.vn/p1.html | grep -E '<title>|og:title|twitter:card' | head -5
```

→ Expect:
```
<title>DNA Hướng Đi U45 — Trắc Nghiệm 20 Câu Khám Phá Bản Thân</title>
  <meta property="og:title" content="DNA Hướng Đi U45 — Trắc Nghiệm 20 Câu Khám Phá Bản Thân">
  <meta name="twitter:card" content="summary_large_image">
```

### 4. Test JSON-LD Schema injected

```bash
curl -s https://huongdi.sol.vn/p3.html | grep -A1 'application/ld+json' | head -5
```

→ Expect: thấy `<script type="application/ld+json">`.

### 5. Test Schema.org validator

Mở browser:
- https://validator.schema.org/ → paste URL `https://huongdi.sol.vn/p1.html` → Validate
- https://search.google.com/test/rich-results → paste URL → Test

→ Expect: 0 error, recognized: Organization + WebSite + Quiz + BreadcrumbList.

### 6. Test Open Graph preview

- https://www.opengraph.xyz/ → paste URL → preview Facebook/LinkedIn/Twitter card.

---

## Google Search Console

### 1. Add property

```
https://search.google.com/search-console
→ Add property → Domain → huongdi.sol.vn
→ Verify via DNS TXT (Cloudflare)
```

### 2. Submit sitemap

```
GSC dashboard → Sitemaps → Add new sitemap
→ Type: sitemap.xml
→ Submit
```

### 3. Request indexing từng page

```
URL Inspection → Paste URL → Request Indexing
```

Làm cho 11 URL (1 home + 10 page).

---

## Bing Webmaster Tools (BONUS)

Bing chia thị phần ~3% nhưng đang nhanh chóng tăng (Copilot, ChatGPT search dùng Bing API).

```
https://www.bing.com/webmasters
→ Import from Google Search Console (1-click)
```

---

## Rollback nếu có vấn đề

### Restore từ backup tar

```bash
sudo rm -rf /var/www/huongdi/public.broken
sudo mv /var/www/huongdi/public /var/www/huongdi/public.broken
sudo tar -xzf /tmp/huongdi-public-backup-YYYYMMDD.tar.gz -C /var/www/huongdi/
```

### Hoặc restore từng file .bak

```bash
cd /var/www/huongdi/public
for f in *.bak.*; do
    original="${f%.bak.*}"
    sudo mv "$f" "$original"
done
```

---

## Lưu ý

✅ Script `inject-seo.js` an toàn:
- Tự động backup `.bak.timestamp` mỗi file trước khi sửa
- Strip existing duplicate tags để tránh duplicate
- Dry-run mode để preview
- Idempotent — chạy lại nhiều lần KHÔNG bị duplicate

⚠️ Sau khi inject:
- 10 file HTML sẽ có thêm ~3-5KB meta tags + Schema → mất không đáng kể
- Browser render KHÔNG thay đổi gì (chỉ thêm metadata)
- Server response giữ nguyên

---

## Bước tiếp theo (sau khi A+B xong)

Em sẽ tạo:
- **D**: Outline 7 pillar pages (mỗi pillar ~2500 từ)
- **C**: Delegate subagent viết draft pillar #1 "Freelancer Chuyên Môn U45+"

Anh chạy xong A+B → paste output các bước verify → em làm D+C.
