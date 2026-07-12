# Google Search Console — Setup huongdi.sol.vn (10 phút)

> Hướng dẫn từng bước để Google bắt đầu index huongdi.sol.vn.
> Sau khi xong, mất 10-30 ngày Google index 100% page → bắt đầu có organic traffic.

---

## CHUẨN BỊ

✅ Cần có:
- Tài khoản Google (gmail Khang)
- Quyền edit DNS Cloudflare cho domain `sol.vn`
- Sitemap đã deploy: `https://huongdi.sol.vn/sitemap.xml` (ĐÃ XONG ✅)
- Robots.txt: `https://huongdi.sol.vn/robots.txt` (ĐÃ XONG ✅)

---

## BƯỚC 1 — Login GSC

```
URL: https://search.google.com/search-console
```

Sign in với gmail Khang (cùng acc Google Analytics nếu có).

---

## BƯỚC 2 — Add Property (Domain type)

Click **"Add property"** → chọn **"Domain"** (KHÔNG chọn URL prefix).

```
┌─────────────────────────────────┐
│  Select property type           │
├─────────────────────────────────┤
│  ● Domain          ← CHỌN ĐÂY   │
│    huongdi.sol.vn               │
│                                 │
│  ○ URL prefix                   │
│    https://huongdi.sol.vn/      │
└─────────────────────────────────┘
```

**Tại sao chọn Domain?**
- Domain property cover TẤT CẢ subdomain + protocol (http/https/www)
- 1 lần verify → cover huongdi.sol.vn, www.huongdi.sol.vn, etc.

Nhập: `huongdi.sol.vn` (KHÔNG có https://) → Continue.

---

## BƯỚC 3 — Verify Ownership via DNS

Google sẽ show 1 record TXT cần add vào DNS:

```
Type: TXT
Name: @
Value: google-site-verification=AbCdEf123456_XyZxxxxxxxxxxxxxxxxx
```

**COPY VALUE** này.

### 3.1 — Vào Cloudflare DNS

```
URL: https://dash.cloudflare.com
→ Login
→ Chọn domain "sol.vn"
→ Tab "DNS" → "Records"
→ Click "Add record"
```

### 3.2 — Add TXT record

```
Type:    TXT
Name:    huongdi
Content: google-site-verification=AbCdEf123456...  ← Paste value Google cho
Proxy:   DNS only (cloud màu xám, KHÔNG bật Cloudflare proxy)
TTL:     Auto
```

⚠️ **Lưu ý quan trọng:** Name là **`huongdi`** (KHÔNG phải `@`) vì property là **subdomain** huongdi.sol.vn, không phải root sol.vn.

Click **"Save"**.

### 3.3 — Verify trên GSC

Quay lại GSC tab → Click **"Verify"**.

```
✅ Ownership verified
```

(Nếu fail: chờ 2-5 phút cho DNS propagate, rồi verify lại.)

---

## BƯỚC 4 — Submit Sitemap

Sau khi verified, vào dashboard property:

```
Left sidebar → "Sitemaps"
→ "Add a new sitemap"
→ Nhập: sitemap.xml
→ Submit
```

Expected response:
```
✅ Success
Status: Success
Submitted URLs: 11
Discovered URLs: 11 (sau vài giờ)
```

---

## BƯỚC 5 — Request Indexing 11 URL (quan trọng nhất)

GSC tự crawl chậm (vài tuần). Để Google index NHANH, manually request từng URL:

### URL List cần submit

```
1.  https://huongdi.sol.vn/
2.  https://huongdi.sol.vn/p1.html
3.  https://huongdi.sol.vn/p2.html
4.  https://huongdi.sol.vn/p3.html
5.  https://huongdi.sol.vn/p3-chuyenmon.html
6.  https://huongdi.sol.vn/p3-daotao.html
7.  https://huongdi.sol.vn/p3-noidungso.html
8.  https://huongdi.sol.vn/p3-kinhdoanh.html
9.  https://huongdi.sol.vn/p3-daily.html
10. https://huongdi.sol.vn/p3-dichvu.html
11. https://huongdi.sol.vn/p3-dauthu.html
```

### Cách submit 1 URL

```
GSC → "URL Inspection" (top search bar)
→ Paste URL → Enter
→ Đợi vài giây Google check
→ Hiển thị:
   - "URL is not on Google" (nếu chưa index)
   - "URL is on Google" (nếu đã index)
→ Click "Request indexing"
→ Hiển thị: "Indexing requested"
```

Lặp lại cho 11 URL. Mỗi URL ~30 giây.

⚠️ Google giới hạn ~10-20 request/ngày. Nếu vượt, chia 2 ngày làm.

---

## BƯỚC 6 — Setup Google Analytics 4 (Optional, recommended)

GA4 KHÔNG bắt buộc cho SEO, nhưng giúp track user behavior.

### 6.1 — Tạo property GA4

```
https://analytics.google.com → Admin
→ Create property → "huongdi.sol.vn"
→ Industry: Internet & Software
→ Time zone: Asia/Ho_Chi_Minh
→ Currency: VND
→ Click Create
```

### 6.2 — Lấy Measurement ID

GA4 cho 1 ID dạng `G-XXXXXXXXXX`. Copy.

### 6.3 — Inject GA4 vào huongdi (em làm)

Sau khi anh share Measurement ID, em sẽ:
- Tạo file `ga4-inject.js`
- Update `inject-seo.js` thêm GA4 tag vào `<head>`
- Re-deploy

### 6.4 — Link GA4 với GSC

```
GSC → Settings → Associations
→ Google Analytics → Link
→ Chọn GA4 property "huongdi.sol.vn"
```

→ GSC dashboard sẽ show data GA4 (CTR, organic clicks, etc.).

---

## BƯỚC 7 — Monitoring sau khi setup

### 7.1 — Check status hàng tuần (10 phút/tuần)

```
GSC Dashboard
├── Coverage: Bao nhiêu page indexed?
│   → Mục tiêu: 11/11 trong 30 ngày
├── Performance: Impressions + Clicks + CTR
│   → Mục tiêu tháng 1: 50+ clicks
│   → Mục tiêu tháng 3: 300+ clicks
├── Sitemaps: Status "Success" + count = 11
└── URL Inspection: spot check page mới
```

### 7.2 — Báo cáo Tuần 1

Sau 7 ngày kể từ submit, vào **Coverage** → expect:
```
Indexed pages:     5-8/11  ← Google đang crawl
Excluded pages:    3-6/11  ← Còn lại sẽ index sau
Errors:            0 hoặc thấp
```

### 7.3 — Báo cáo Tháng 1

```
Indexed:           11/11 (toàn bộ index)
Impressions:       500-2000 (page xuất hiện trên Google search)
Clicks:            20-100 (user click vào)
Average CTR:       2-5%
Average position:  20-40 (vẫn còn xa top 10)
```

---

## TROUBLESHOOTING

### Vấn đề 1: Verify DNS thất bại

**Triệu chứng:** GSC báo "Verification failed"

**Nguyên nhân thường gặp:**
- TXT record chưa propagate (chờ 5-15 phút)
- Name field sai (phải là `huongdi`, không phải `@`)
- Cloudflare proxy bật → DNS bị obfuscated

**Fix:**
```bash
# Check TXT record propagation
dig TXT huongdi.sol.vn +short

# Expect: thấy "google-site-verification=..."
```

Nếu KHÔNG thấy → đợi thêm hoặc check Cloudflare config.

### Vấn đề 2: Sitemap status = "Couldn't fetch"

**Triệu chứng:** GSC báo sitemap không fetch được

**Nguyên nhân:**
- Sitemap URL sai (phải là `https://huongdi.sol.vn/sitemap.xml`)
- Robots.txt block crawler (em đã set Allow nên không vấn đề)
- Server timeout

**Fix:**
```bash
# Test sitemap accessible
curl -I https://huongdi.sol.vn/sitemap.xml
# Expect: HTTP/2 200

# Test robots.txt allow
curl -s https://huongdi.sol.vn/robots.txt | grep -i "Disallow: /$"
# Expect: KHÔNG thấy (vì allow root)
```

### Vấn đề 3: "URL is not on Google" sau 2 tuần

**Triệu chứng:** Đã request indexing nhưng vẫn không index

**Nguyên nhân:**
- Content quality thấp (Google penalty)
- Duplicate content với sol.vn/bothuocla
- Crawl budget chưa đến

**Fix:**
- Check Google PageSpeed: `https://pagespeed.web.dev/`
- Test Mobile-Friendly: `https://search.google.com/test/mobile-friendly`
- Test Rich Results: `https://search.google.com/test/rich-results`
- Thêm content unique hơn (pillar pages — em đang plan)

---

## OPTIONAL — Bing Webmaster Tools (5 phút)

Bing có ~3% market share VN nhưng đang nhanh chóng tăng:
- Copilot dùng Bing index
- ChatGPT Search powered by Bing
- DuckDuckGo dùng Bing

**Import 1-click từ GSC:**

```
https://www.bing.com/webmasters
→ Sign in (cùng Microsoft account)
→ "Import from Google Search Console"
→ Connect → Authorize
→ Bing tự import sitemap + setting
```

Done 30 giây.

---

## CHECKLIST CUỐI

```
□ GSC property "huongdi.sol.vn" verified
□ TXT record trong Cloudflare đã set + propagate
□ Sitemap submit thành công (status "Success")
□ 11 URL requested indexing (hết quota ngày 1 nếu cần)
□ GA4 property tạo (Optional)
□ Bing Webmaster import (Optional, 30s)
□ Check status sau 7 ngày
```

---

## DỰ KIẾN TIMELINE

```
Day 0:       Setup GSC (10 phút) + Request indexing 11 URL
Day 1-3:     Google crawl initial — 30-50% page index
Day 7:       60-80% page index, vài impression đầu
Day 14:      100% page index, 50-200 impressions
Day 30:      500-2000 impressions, 20-100 clicks
Day 60:      Pillar #1 publish → traffic tăng 3x
Day 90:      Pillar #1-3 publish → 1000+ impressions, 100+ clicks
Day 180:     Tất cả 7 pillar publish → 5000+ impressions, 500-1000 clicks
```

→ **Tháng 6 kỳ vọng: 1000 organic clicks/tháng (zero ad budget).**

---

**Author:** Sol AI · **Version:** 1.0 · **Date:** 2026-06-22
