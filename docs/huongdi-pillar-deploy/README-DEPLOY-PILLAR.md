# HUONGDI — Deploy Pillar Page

> Convert markdown pillar → standalone HTML + Header/Footer + Schema → publish lên VPS.

## Bộ file

```
docs/huongdi-pillar-deploy/
├── convert-pillar-to-html.js   — Node script: MD → HTML standalone
├── update-sitemap.js           — Add URL mới vào sitemap.xml
├── deploy-pillar.sh            — Bash master script (1 lệnh deploy)
└── README-DEPLOY-PILLAR.md     — File này
```

## Pre-requisites trên VPS (1 lần duy nhất)

### 1. Upload bộ deploy + content lên VPS

Từ local PowerShell:

```powershell
# Upload script
scp -r C:\BOTHUOCLA\sol-widget\docs\huongdi-pillar-deploy sol-vps:/tmp/

# Upload pillar content (markdown)
ssh sol-vps "mkdir -p /tmp/huongdi-pillar-deploy/content"
scp C:\BOTHUOCLA\sol-widget\docs\huongdi-seo-content\pillar-01-freelancer-chuyen-mon.md sol-vps:/tmp/huongdi-pillar-deploy/content/
```

### 2. Install marked package trên VPS

```bash
ssh sol-vps
cd /tmp/huongdi-pillar-deploy
npm install marked
```

→ Output: `added X packages`. Mất ~5 giây.

## Deploy Pillar #1

### 1 lệnh duy nhất

```bash
ssh sol-vps
cd /tmp/huongdi-pillar-deploy
bash deploy-pillar.sh pillar-01-freelancer-chuyen-mon.md freelancer-chuyen-mon-tuoi-45
```

Script tự động:

1. Convert markdown → HTML standalone
2. Inject SEO meta + Article schema + FAQ schema + Breadcrumb
3. Wrap với Sol Header + Footer (đồng nhất với 10 page khác)
4. Tạo folder `/var/www/huongdi/public/freelancer-chuyen-mon-tuoi-45/`
5. Set permission cho nginx
6. Update sitemap.xml (add URL mới)
7. Verify HTTP 200 + check content

### Output mẫu

```
═══════════════════════════════════════════════════════════════════
  DEPLOY PILLAR PAGE
═══════════════════════════════════════════════════════════════════
Markdown:    /tmp/huongdi-pillar-deploy/content/pillar-01-freelancer-chuyen-mon.md
Slug:        freelancer-chuyen-mon-tuoi-45
Output HTML: /var/www/huongdi/public/freelancer-chuyen-mon-tuoi-45/index.html
URL:         https://huongdi.sol.vn/freelancer-chuyen-mon-tuoi-45/

── 1. Converting Markdown → HTML ────────────────────────────────
✅ Generated: /var/www/huongdi/public/freelancer-chuyen-mon-tuoi-45/index.html

── 2. Updating sitemap.xml ──────────────────────────────────────
✅ Added to sitemap: https://huongdi.sol.vn/freelancer-chuyen-mon-tuoi-45/ (priority 0.9)

── 3. Setting permissions ───────────────────────────────────────
✅ Permission OK

── 4. Verify deployment ─────────────────────────────────────────
✅ URL accessible: https://huongdi.sol.vn/freelancer-chuyen-mon-tuoi-45/ (HTTP 200)

── 5. Content checks ────────────────────────────────────────────
  Title: <title>Freelancer Chuyên Môn Tuổi 45+ — 7 Hướng Từ 20 Năm...
  H1:    <h1>Freelancer Chuyên Môn Tuổi 45+ — Tận Dụng 20 Năm...
  JSON-LD: 3 schemas
  Header: 1 markers

═══════════════════════════════════════════════════════════════════
  ✅ PILLAR DEPLOYED
═══════════════════════════════════════════════════════════════════
```

## Verify thêm

### Test browser

```
https://huongdi.sol.vn/freelancer-chuyen-mon-tuoi-45/
```

Check:
- Header sticky đẹp
- Article content render từ markdown
- Footer 4 cols
- Mobile responsive
- Dark mode auto detect

### Test Schema.org validator

```
https://validator.schema.org/
→ Paste URL → Validate
```

→ Expect: Article + BreadcrumbList + FAQPage all recognized, 0 error.

### Test Rich Results

```
https://search.google.com/test/rich-results
→ Paste URL → Test
```

→ Expect: "Article" + "FAQ" eligible for rich results.

### Submit lên GSC

```
Google Search Console
→ URL Inspection
→ https://huongdi.sol.vn/freelancer-chuyen-mon-tuoi-45/
→ Request Indexing
```

→ Google sẽ crawl trong 24-72h.

## Deploy các pillar tiếp theo (#2-#7)

Khi đã có draft markdown trong `docs/huongdi-seo-content/pillar-XX-xxx.md`, deploy với 1 lệnh:

```bash
# Upload markdown mới
scp C:\BOTHUOCLA\sol-widget\docs\huongdi-seo-content\pillar-02-coaching.md \
    sol-vps:/tmp/huongdi-pillar-deploy/content/

# Deploy
ssh sol-vps "cd /tmp/huongdi-pillar-deploy && bash deploy-pillar.sh pillar-02-coaching.md coaching-dao-tao-tuoi-45"
```

## Rollback nếu cần

```bash
# Restore từ backup
sudo cp /var/www/huongdi/public/SLUG/index.html.bak.YYYYMMDD-* \
        /var/www/huongdi/public/SLUG/index.html

# Hoặc xóa pillar khỏi sitemap
sed -i '/freelancer-chuyen-mon-tuoi-45/,/<\/url>/d' /var/www/huongdi/public/sitemap.xml
```

## Lưu ý kỹ thuật

✅ **Idempotent:** Chạy lại nhiều lần KHÔNG bị duplicate (sitemap check trước khi add, file index.html overwrite)
✅ **Backup tự động:** File cũ được backup `.bak.timestamp` trước khi overwrite
✅ **Schema.org đầy đủ:** Article + BreadcrumbList + FAQPage (auto-extract từ section "Câu Hỏi Thường Gặp")
✅ **Brand consistency:** Reuse header.html + footer.html từ huongdi-layout/
✅ **Mobile + Dark mode:** CSS responsive + prefers-color-scheme support
✅ **SEO meta complete:** Title + description + OG + Twitter + canonical + author + robots

⚠️ **Cần marked package:** Lần đầu chạy `npm install marked` (1 lần duy nhất, ~5s)

---

**Author:** Sol AI · **Date:** 2026-06-22
