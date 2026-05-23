# ☁️ Sol — Cloudflare Configuration (Full Reference)

> Toàn bộ setting Cloudflare cho sol.vn. Dùng để config lại khi migrate account hoặc khôi phục sau sự cố.

---

## Account

```
Email:        nguyendinhkhang@gmail.com
Account ID:   b33a57e2c969d6f3a5649bb988f0844e
Plan:         Free
Login:        https://dash.cloudflare.com
```

---

## Zone: sol.vn

### 1. DNS Records

Truy cập: **dash.cloudflare.com → sol.vn → DNS → Records**

| Type | Name | Content | Proxy | TTL | Mục đích |
|---|---|---|---|---|---|
| A | sol.vn | 103.221.221.79 | 🟠 Proxied | Auto | WordPress hosting |
| A | bothuocla | 103.72.57.11 | 🟠 Proxied | Auto | VPS app |
| CNAME | www | sol.vn | 🟠 Proxied | Auto | WWW redirect |
| CNAME | mail | sol.vn | ⚪ DNS only | Auto | Email (Zoho) |
| MX | sol.vn | mx.zoho.com (priority 10) | ⚪ DNS only | Auto | Email |
| MX | sol.vn | mx2.zoho.com (priority 20) | ⚪ DNS only | Auto | Email |
| MX | sol.vn | mx3.zoho.com (priority 50) | ⚪ DNS only | Auto | Email |

**⚠️ Lưu ý**:
- KHÔNG đổi proxy MX/mail sang Proxied → email sẽ broken
- Bothuocla bắt buộc Proxied để dùng SSL via Cloudflare

---

### 2. SSL/TLS

Truy cập: **dash.cloudflare.com → sol.vn → SSL/TLS**

#### Overview
```
Encryption mode: Full (strict)   ← BẮT BUỘC
```

(KHÔNG dùng Flexible — sẽ gây redirect loop)

#### Edge Certificates
```
☑ Always Use HTTPS:           ON
☑ Automatic HTTPS Rewrites:   ON
☑ Opportunistic Encryption:   ON
☑ TLS 1.3:                    ON
Minimum TLS Version:           TLS 1.2
☑ HSTS (HTTP Strict Transport Security): ON (optional, advanced)
```

---

### 3. AI Crawl Control ⭐ KEY SETTINGS

Truy cập: **dash.cloudflare.com → sol.vn → AI Crawl Control → Directives**

#### Managed robots.txt
```
❌ Toggle: DISABLED (TẮT)
```

**⚠️ ĐÂY LÀ SETTING QUAN TRỌNG NHẤT** — nếu BẬT, Cloudflare sẽ tự inject rules cấm AI bots vào robots.txt, override hết policy của Sol.

#### Crawlers (Free plan — read-only)
Plan Free chỉ XEM được, không thể bật/tắt từng bot. Để kiểm soát từng bot cần Pro plan ($25/tháng).

Hiện thấy có bots đang Allow:
- ✅ BingBot, Googlebot (Search Engines)
- ✅ ChatGPT-User, PerplexityBot, Applebot (AI Search)

Block:
- ❌ PetalBot, Amazonbot (default Cloudflare block)

→ **Em quản lý qua Cloudflare Worker** override robots.txt thay vì per-bot toggle.

---

### 4. Workers Routes

Truy cập: **dash.cloudflare.com → sol.vn → Workers Routes**

```
Route:     sol.vn/*    →    sol-robots-override
```

(Wildcard route cover tất cả URL trên sol.vn)

---

### 5. Page Rules

Truy cập: **dash.cloudflare.com → sol.vn → Rules → Page Rules**

```
Free plan có 3 slots.
Hiện chưa dùng (Worker đã cover use case).
```

---

### 6. Caching

Truy cập: **dash.cloudflare.com → sol.vn → Caching → Configuration**

```
Caching Level:           Standard
Browser Cache TTL:       Respect Existing Headers (mặc định)
Always Online:           ON (nếu origin down, serve cached version)
Development Mode:        OFF (chỉ bật khi đang test)
```

#### Purge cache khi nào?

- Sau khi update Cloudflare Worker code
- Sau khi update file vật lý trên hosting (robots.txt, sitemap, images)
- Sau khi đổi nginx config nhiều

#### Cách purge

```
Caching → Configuration → Purge Cache:
  - Custom Purge: nhập URL cụ thể (vd: https://sol.vn/robots.txt)
  - Purge Everything: clear tất cả cache (chậm hơn, nhưng chắc chắn)
```

---

### 7. Speed → Optimization

Truy cập: **dash.cloudflare.com → sol.vn → Speed → Optimization**

```
☑ Auto Minify (JS, CSS, HTML):  ON
☑ Brotli compression:           ON
☑ Rocket Loader:                OFF  (gây lỗi với 1 số JS)
Image Optimization:             N/A (Free plan)
Mirage:                         N/A (Pro+)
Polish:                         N/A (Pro+)
```

---

### 8. Security

Truy cập: **dash.cloudflare.com → sol.vn → Security**

```
Security Level:          Medium (default)
Challenge Passage:       30 minutes
Browser Integrity Check: ON
Bot Fight Mode:          OFF  (vì mình muốn AI bots vào)
Privacy Pass:            ON
```

#### Firewall Rules

Hiện chưa có custom rules. Tương lai có thể add:
- Block country (nếu spam từ vùng cụ thể)
- Rate limit (nếu DDoS)

---

## Cloudflare Worker: `sol-robots-override`

### Source code

```
Local:   C:\BOTHUOCLA\sol-widget\workers\robots-override.js
Remote:  sol-robots-override.nguyendinhkhang.workers.dev
```

### Endpoints

| Path | Type | Mục đích |
|---|---|---|
| `/robots.txt` | text/plain | Allow 22 AI bots + Content Signals |
| `/.well-known/api-catalog` | application/linkset+json | RFC 9727 API discovery |
| `/.well-known/agent-skills/index.json` | application/json | Agent Skills v0.2.0 |
| `/.well-known/openid-configuration` | application/json | OIDC discovery (planned stub) |
| `/.well-known/oauth-authorization-server` | application/json | OAuth 2.0 (planned stub) |
| `/.well-known/oauth-protected-resource` | application/json | RFC 9728 (planned stub) |
| `/.well-known/mcp/server-card.json` | application/json | MCP SEP-1649 (planned stub) |
| `/` (homepage) | text/html | Inject WebMCP script với 5 tools |
| Mọi URL với `Accept: text/markdown` | text/markdown | HTML → Markdown converter |
| Mọi URL khác | pass-through | Cloudflare fetch origin |

### Quota (Free plan)

```
Requests/day:     100,000  (đủ Sol < 30k req/ngày hiện tại)
CPU time:         10ms/request
Worker size:      1 MB (hiện ~30KB)
```

### Re-deploy steps

```
1. Edit C:\BOTHUOCLA\sol-widget\workers\robots-override.js
2. dash.cloudflare.com → Workers & Pages → sol-robots-override
3. Edit code → Ctrl+A → Delete → paste code mới → Deploy
4. Purge Cloudflare cache: Caching → Custom Purge → URL: https://sol.vn/robots.txt
5. Verify: curl.exe -I https://sol.vn/robots.txt  (expect x-served-by: sol-worker)
```

---

## Backup config (export DNS)

Cloudflare cho phép export DNS records dạng BIND zone file:

```
dash.cloudflare.com → sol.vn → DNS → 3 dots ... → Export
```

→ Lưu file `sol.vn.dns.txt` vào D:\Backup\ định kỳ.

---

## Restore từ scratch (nếu phải làm lại từ đầu)

### Bước 1: Add domain vào Cloudflare

```
dash.cloudflare.com → Home → Add a Site → sol.vn → Free plan → Continue
```

### Bước 2: Update nameservers (ở Registrar domain)

```
Tại Namecheap/Gandi/PA Vietnam (chỗ mua domain):
  - NS1: <cloudflare ns1>
  - NS2: <cloudflare ns2>
```

(Cloudflare sẽ cho biết NS cụ thể khi add domain)

### Bước 3: Import DNS records

```
DNS → 3 dots ... → Import → upload sol.vn.dns.txt
```

### Bước 4: Apply settings

- SSL/TLS: Full (strict)
- Edge Certificates: Always Use HTTPS ON
- AI Crawl Control: Managed robots.txt OFF

### Bước 5: Create Worker

```
1. Workers & Pages → Create Worker → name: sol-robots-override
2. Edit code → paste content of robots-override.js
3. Deploy
4. Settings → Domains & Routes → Add route: sol.vn/*
```

### Bước 6: Verify

```powershell
curl.exe -I https://sol.vn/robots.txt
curl.exe https://sol.vn/.well-known/api-catalog
```

---

## Monitoring

### Bot traffic

```
dash.cloudflare.com → sol.vn → AI Crawl Control → Metrics
```

Xem được:
- Tổng requests từ AI bots (theo 24h, 7d, 30d)
- Top bots (GPTBot, ChatGPT-User, PerplexityBot...)
- Bots blocked vs allowed

### Traffic analytics

```
dash.cloudflare.com → sol.vn → Analytics
```

### Cache hit rate

```
dash.cloudflare.com → sol.vn → Caching → Analytics
```

### Worker invocations

```
dash.cloudflare.com → Workers & Pages → sol-robots-override → Metrics
```

---

## Cảnh báo & Best practices

⚠️ **TUYỆT ĐỐI KHÔNG**:
- Chuyển SSL về Flexible (gây redirect loop)
- Bật lại "Managed robots.txt" (override Worker)
- Xoá Worker route `sol.vn/*` (mất hết features)
- Tắt proxy DNS bothuocla.sol.vn (mất SSL Cloudflare)

✅ **NÊN**:
- Backup DNS export mỗi tháng
- Test Worker sau mỗi deploy
- Monitor AI Crawl Control metrics weekly
- Update Worker code khi có spec mới (Content Signals, WebMCP, etc.)

---

**Last updated**: 2026-05-20
**Maintainer**: Khang Sol (Nguyễn Đình Khang)
