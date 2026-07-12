# HUONGDI LAYOUT — Header + Footer đồng nhất

## Mục đích

Đồng nhất brand identity giữa 3 sản phẩm Sol:

```
sol.vn          ← Trang chính + WordPress hub
bothuocla.sol.vn ← Trụ Thân (sức khoẻ)
huongdi.sol.vn   ← Trụ Trí (sự nghiệp) ⭐ (làm cho thằng này)
```

## Bộ file

```
docs/huongdi-layout/
├── header.html         — Sticky header + nav 3 trụ + huongdi sub-nav
├── footer.html         — Master Footer 4 cols + EEAT + YMYL disclaimer
├── inject-layout.js    — Script Node tự inject vào 10 HTML files
└── README-LAYOUT.md    — File này
```

## Nội dung Header

- Logo Sol (link → sol.vn)
- Nav **Thân-Tâm-Trí** với "Trí" highlighted
- Nav phụ: P1 Khám phá, P2 Nguồn lực, 37 Hướng đi
- Auto-highlight current page (JS)
- CTA "Bắt đầu →" link tới P1
- Responsive mobile + dark mode

## Nội dung Footer

**4 cols:**

1. **Sol — 3 Trụ:** Link Thân (bothuocla), Tâm (sol.vn/ngam), Trí (huongdi), Sol.vn
2. **Huongdi:** P1, P2, P3, 3 category pages
3. **Về Sol:** Khang Sol, câu chuyện, liên hệ, privacy, terms
4. **Cộng đồng:** LinkedIn, Facebook, Zalo, Email

**EEAT block:** Khang's portrait + bio + link sol.vn/khang-sol/

**YMYL disclaimer:** Tuyên bố miễn trừ trách nhiệm tài chính

**Bottom:** Copyright + social links

## Quy trình Deploy

### Lệnh 1 — SCP upload (PowerShell local)

```powershell
scp -r C:\BOTHUOCLA\sol-widget\docs\huongdi-layout sol-vps:/tmp/
```

### Lệnh 2 — SSH vào VPS

```bash
ssh sol-vps
```

### Lệnh 3 — Backup hiện trạng

```bash
sudo tar -czf /tmp/huongdi-public-backup-layout-$(date +%Y%m%d).tar.gz -C /var/www/huongdi public/
```

### Lệnh 4 — Dry-run

```bash
cd /tmp/huongdi-layout
node inject-layout.js --dry-run --dir=/var/www/huongdi/public
```

→ Expect: 10 page `✅ injected` + `Result: 10 updated · 0 skipped · 0 failed`.

### Lệnh 5 — Chạy thật

```bash
node inject-layout.js --dir=/var/www/huongdi/public
```

→ Output có `💾 Backup files: *.bak-layout.TIMESTAMP`

### Lệnh 6 — Verify

```bash
echo "════ Header markers trong p1 ════"
curl -s https://huongdi.sol.vn/p1.html | grep -c "SOL-HEADER-START\|SOL-FOOTER-START"

echo ""
echo "════ Footer YMYL trong p3 ════"
curl -s https://huongdi.sol.vn/p3.html | grep -o "YMYL — Finance" | head -1

echo ""
echo "════ Cross-link tới bothuocla ════"
curl -s https://huongdi.sol.vn/p1.html | grep -c "bothuocla.sol.vn"

echo ""
echo "════ Cross-link tới sol.vn ════"
curl -s https://huongdi.sol.vn/p1.html | grep -c "sol.vn/khang-sol\|sol.vn/ngam"
```

→ Expect:
- Header markers: 2 (start + end)
- YMYL: 1 (có disclaimer)
- bothuocla: 2-3 link (header + footer)
- sol.vn khang/tam: 2-3 link

### Lệnh 7 — Mở browser test

```
https://huongdi.sol.vn/p1.html
https://huongdi.sol.vn/p3.html
https://huongdi.sol.vn/p3-chuyenmon.html
```

→ Expect: thấy header sticky trên đầu + footer 4 cols dưới cùng + responsive trên mobile.

## Tính chất kỹ thuật

✅ **Idempotent:** Chạy lại nhiều lần KHÔNG bị duplicate header/footer
✅ **Marker comments:** `<!-- SOL-HEADER-START -->...<!-- SOL-HEADER-END -->` để dễ replace
✅ **CSS namespace:** Mọi CSS đều scope vào `#sol-header *`, `#sol-footer *` → không phá CSS gốc của page
✅ **Self-contained:** CSS inline trong style tag, không cần external CSS
✅ **Dark mode:** Tự detect `prefers-color-scheme`
✅ **Responsive:** Mobile-first, breakpoint 768/480px
✅ **EEAT:** Author block với portrait + bio + link rel=author
✅ **YMYL:** Disclaimer finance prominent
✅ **Cross-link SEO:** Mỗi page huongdi có 5+ link tới sol.vn + bothuocla → đẩy authority đa chiều

## Update header/footer sau này

Khi cần đổi nội dung (vd: thêm 1 link mới trong footer):

```bash
# 1. Edit local file
notepad C:\BOTHUOCLA\sol-widget\docs\huongdi-layout\footer.html

# 2. Re-upload
scp C:\BOTHUOCLA\sol-widget\docs\huongdi-layout\footer.html sol-vps:/tmp/huongdi-layout/

# 3. Re-inject (idempotent — thay thế markers cũ)
ssh sol-vps "cd /tmp/huongdi-layout && node inject-layout.js --dir=/var/www/huongdi/public"
```

→ 10 page tự update theo. Không cần edit từng file.

## Rollback

Restore từng file:

```bash
cd /var/www/huongdi/public
for f in *.bak-layout.*; do
    original="${f%.bak-layout.*}"
    sudo mv "$f" "$original"
done
```

Hoặc restore từ tar:

```bash
sudo tar -xzf /tmp/huongdi-public-backup-layout-YYYYMMDD.tar.gz -C /var/www/huongdi/
```

## Lưu ý

⚠️ **Inject layout trước hay sau SEO inject?**
→ KHÔNG quan trọng (2 script độc lập, dùng markers khác nhau).
→ Nhưng em recommend: **SEO inject trước → Layout inject sau** vì:
   - SEO inject vào `<head>` (metadata)
   - Layout inject vào `<body>` (visible content)
   - 2 vùng KHÔNG đè nhau

⚠️ **Style conflict với page gốc?**
→ Tất cả CSS scope vào `#sol-header *` + `#sol-footer *` → 99% không conflict
→ Nếu có conflict, em cần xem code page gốc để tinh chỉnh

## So sánh trước/sau

**TRƯỚC inject:**
```
Page p1.html
└── <body>
    ├── (raw content P1 quiz)
    └── (không có nav, không có cross-link)
```

**SAU inject:**
```
Page p1.html
└── <body>
    ├── <header id="sol-header"> ← Sticky top
    │   ├── Logo Sol
    │   ├── Nav 3 trụ (Thân-Tâm-Trí)
    │   ├── Nav huongdi (P1-P2-P3)
    │   └── CTA "Bắt đầu →"
    ├── (raw content P1 quiz)
    └── <footer id="sol-footer">
        ├── 4 cols cross-link
        ├── EEAT author block
        ├── YMYL disclaimer
        └── Copyright + social
```

## Tác động SEO

✅ **Internal links:** Mỗi page có 15+ internal link tới sol.vn ecosystem → đẩy authority
✅ **EEAT:** Author block + portrait → Google trust signal
✅ **YMYL:** Disclaimer cho finance content → tránh penalty
✅ **Sitewide nav:** Google hiểu site structure tốt hơn
✅ **Cross-domain authority:** sol.vn DA cao → đẩy juice qua huongdi qua header/footer link

---

**Author:** Sol AI · **Version:** 1.0 · **Date:** 2026-06-22
