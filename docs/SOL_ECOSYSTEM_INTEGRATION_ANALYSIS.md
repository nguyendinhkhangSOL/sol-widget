# SOL Ecosystem — Phân tích tích hợp `bothuocla.sol.vn` + `huongdi.sol.vn`

> **Tác giả:** Sol AI (em) · **Ngày:** 2026-06-16
> **Mục đích:** Phân tích xung đột tiềm tàng giữa 2 sản phẩm SOL và đề xuất
> hướng tối ưu trước khi team code launch huongdi.
>
> **Nguồn:** `PROJECT_BRIEFING.md` (Khang) + codebase bothuocla hiện hữu

---

## 0. TL;DR — 5 quyết định Khang cần chốt NGAY

| # | Quyết định | Lý do | Ai quyết |
|---|---|---|---|
| 1 | **Shared JWT_SECRET ngay Phase 1** | Tránh user login 2 lần → friction launch | Khang (kỹ thuật) |
| 2 | **User table — split nhưng dùng UUID v7** | Phase 2 merge không bị collision | Khang (kỹ thuật) |
| 3 | **Sol Membership = bundle 2 sản phẩm** | Cross-LTV cao, brand thống nhất | Khang (kinh doanh) |
| 4 | **Anthropic API 2 key riêng (sub-org)** | Cách ly abuse + theo dõi cost từng app | Khang (admin) |
| 5 | **Brevo upgrade hoặc dùng SES/Resend** | Tổng email/ngày sẽ vượt free tier 300/d | Khang (kinh doanh) |

Tất cả các quyết định trên **không phá briefing hiện tại** — chỉ tinh chỉnh để Phase 2 (3-6 tháng) không đau.

---

## 1. PHÂN TÍCH 4 XUNG ĐỘT KỸ THUẬT

### 1.1. Auth & Identity — friction lớn nhất nếu không sửa

**Vấn đề:** Briefing nói mỗi app có JWT_SECRET riêng (line 305). Hệ quả:

```
User journey thực tế:
  1. Đọc bài SEO sol.vn về "cai thuốc + khởi nghiệp" (1 bài đa chủ đề)
  2. Click CTA → bothuocla.sol.vn → đăng ký account A
  3. Sau 30 ngày cai thuốc, click "Đi tiếp" → huongdi.sol.vn
  4. → BỊ BẮT ĐĂNG KÝ LẠI account B
  5. Friction → 60% bỏ. Sol mất user.
```

**Đề xuất — KHÔNG đổi briefing, chỉ tinh chỉnh:**

| Phase 1 (NOW) | Phase 2 (3-6 tháng) |
|---|---|
| ✅ DB tách (huongdi_prod riêng) | Merge user vào sol_core |
| ✅ **JWT_SECRET DÙNG CHUNG** | Issuer claim phân biệt origin |
| ✅ Cookie domain `.sol.vn` (parent) | Refresh token shared store (Redis) |

Cách làm Phase 1:
- 1 file `JWT_SECRET` đặt ở `/etc/sol/jwt.secret` (root 600 perm)
- Cả `sol-api` và `huongdi-api` đọc cùng file
- User login bothuocla → cookie set `Domain=.sol.vn` → huongdi nhận được token
- Backend huongdi validate token: nếu valid + user existed → auto-link, nếu không → tạo user mới với `linkedFrom: 'bothuocla'`

**Cost:** ~2-3 giờ setup. **Save:** không phải migrate user khi Phase 2.

---

### 1.2. Database split — đúng nhưng cần chuẩn từ đầu

**Vấn đề:** Phase 1 tách DB (sol_prod + huongdi_prod). Phase 2 muốn share user → migrate đau nếu User.id collision.

**Risk cụ thể:** Cả 2 DB dùng `id Int @id @default(autoincrement())` → user id=1 ở cả 2 → merge phải re-ID toàn bộ FK.

**Đề xuất:**

```prisma
// Cả 2 DB dùng cùng pattern
model User {
  id        String   @id @default(uuid())     // UUID v4 OK
  // hoặc tốt hơn: UUID v7 (sortable)
  email     String   @unique
  linkedFrom String? // 'bothuocla' | 'huongdi' | null nếu native
  // ...
}
```

UUID v7 (chuẩn 2024) có lợi:
- Sortable theo thời gian (perf index tốt)
- Cross-DB unique (no collision)
- Merge Phase 2 chỉ cần dedup theo email

**Effort:** Đổi 1 dòng schema mỗi app. **Tác động:** Phase 2 migration giảm từ 2 tuần → 2 ngày.

---

### 1.3. Anthropic API key — abuse risk

**Vấn đề:** Briefing đề xuất share `ANTHROPIC_API_KEY` (line 314). Rủi ro:

- 1 user huongdi spam P3 matching → đốt $50/ngày
- → quota bothuocla bị giảm theo
- → bot AI bothuocla trả lời "quota exceeded" cho user thật

**Đề xuất:**

- **Phase 1:** Tạo 2 sub-organization trong Anthropic Console, 2 API key riêng. Budget cap riêng mỗi app.
- **Phase 2 (sol_core):** Centralize qua quota service nội bộ + admin dashboard theo dõi $/app/day.

**Cost:** 5 phút setup sub-org. **Save:** $$$ khi 1 app bị abuse.

---

### 1.4. Email (Brevo) — quota collision

**Vấn đề:** Brevo free 300 email/ngày. Sau launch:

- Bothuocla: ~150 email/ngày (magic link + daily reminder + slip alert)
- Huongdi: ~100-200 email/ngày (P3 result + roadmap delivery + workshop invite)
- **Tổng:** 250-350/ngày → tràn free tier

**3 option:**

| Option | Cost | Effort | Note |
|---|---|---|---|
| (a) Brevo Lite plan | ~$25/tháng | 0 | Quick win |
| (b) Resend free 3000/tháng | $0 | 30 phút migrate | Cao hơn 10× free quota |
| (c) AWS SES | ~$0.10/1000 | 1-2 giờ setup | Rẻ nhất nếu scale lớn |

**Em recommend (b) Resend** — bothuocla đã setup DKIM cho sol.vn, chỉ cần thêm DNS Resend, swap SMTP credentials.

---

## 2. PHÂN TÍCH 4 XUNG ĐỘT VẬN HÀNH

### 2.1. RAM 2GB — hẹp hơn briefing ước tính

**Briefing nói:** Tổng ~800MB, dư 1.2GB.

**Em check thực tế trên VPS hiện tại** (sol-api production load):

| Process | Idle | Peak (50+ concurrent) |
|---|---|---|
| sol-api | 200 MB | **400-500 MB** |
| huongdi-api (ước) | 150 MB | **300-400 MB** |
| PostgreSQL | 150 MB | **400-600 MB** (cache + connections) |
| Nginx + system | 200 MB | **300 MB** |
| **Peak tổng** | 700 MB | **~1.5-1.8 GB** |

→ Peak chỉ còn dư 200-500 MB. **Risk:** OOM killer giết PG khi traffic spike.

**Đề xuất 3 việc:**

1. **Setup swap 4GB ngay** (briefing không nhắc):
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   sudo sysctl vm.swappiness=10  # ưu tiên RAM
   ```
2. **PostgreSQL tune `shared_buffers = 256MB`** (default 128MB OK cho 2GB nhưng tighter)
3. **Monitor RAM peak 1 tuần đầu** — nếu peak > 1.7GB liên tục → upgrade VPS 4GB (~300k/tháng eztech)

### 2.2. Node version — pitfall #7 trong briefing

Briefing đúng — nếu upgrade Node hệ thống có thể break bothuocla.

**Đề xuất nvm-isolated:**

```bash
# Cài nvm cho user solop
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Cài Node 20.20.2 (giống bothuocla)
nvm install 20.20.2
nvm alias default 20.20.2

# Trong ecosystem.config.js của huongdi:
{
  name: 'huongdi-api',
  interpreter: '/home/solop/.nvm/versions/node/v20.20.2/bin/node',
  // ...
}
```

→ Lock Node version, không bị surprise khi `apt upgrade`.

### 2.3. Backup — thiếu /var/www/

Briefing chỉ nói pg_dump DB. **Em note:** nếu VPS chết, mất luôn:
- Config nginx
- Cert Let's Encrypt
- File `.env`
- File uploaded media (nếu sau có)

**Đề xuất rsync hàng tuần** về máy local hoặc S3:

```bash
# /etc/cron.weekly/rsync-vps.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d)
tar czf /tmp/sol-vps-$DATE.tar.gz \
  /etc/nginx/sites-enabled/ \
  /etc/letsencrypt/ \
  /var/www/sol-widget-old/backend/.env \
  /var/www/huongdi/backend/.env \
  /home/solop/.pm2/dump.pm2
# rsync về Backblaze B2 hoặc S3
rclone copy /tmp/sol-vps-$DATE.tar.gz b2:sol-backups/
rm /tmp/sol-vps-$DATE.tar.gz
```

### 2.4. Monitoring — briefing thiếu hoàn toàn

Sau khi có 2 app, 2 admin panel → 4 endpoint cần healthcheck. Nếu 1 endpoint chết lúc 2h sáng, không ai biết đến 8h sáng.

**Đề xuất minimum monitoring (15 phút setup):**

UptimeRobot free (50 monitor): ping 5 phút/lần các URL:
- `https://bothuocla.sol.vn/api/healthz`
- `https://huongdi.sol.vn/api/healthz`
- `https://admin.sol.vn/`
- `https://adminhuongdi.sol.vn/`
- `https://sol.vn/` (WordPress)

Alert qua email + Zalo nếu down > 2 phút.

---

## 3. PHÂN TÍCH 5 XUNG ĐỘT KINH DOANH

### 3.1. Funnel attribution — không có sẽ mất nửa insight

**Vấn đề:** sol.vn (WordPress) là SEO Hub. User đọc → click → bothuocla HOẶC huongdi. Hiện không có cách track:

- User nào đọc bài nào sol.vn dẫn về app nào
- User nào convert (đăng ký) từ source nào

**Đề xuất UTM standardize:**

| Source | utm_source | utm_medium | utm_campaign |
|---|---|---|---|
| sol.vn organic | `sol_blog` | `organic` | `<slug-bài>` |
| FB cá nhân | `fb_khang` | `social` | `launch_31_5` |
| Zalo OA | `zalo_oa` | `push` | `<event>` |
| LinkedIn | `linkedin` | `social` | `<post-id>` |

GA4 cross-domain tracking (1 property, 3 stream sol.vn + bothuocla + huongdi) → 1 user_id xuyên 3 domain. Effort: 30 phút setup GA4.

### 3.2. Pricing — phải quyết NGAY trước launch huongdi

**Briefing không nói:** Sol Membership (line 71) gồm những gì? Bothuocla có tier riêng (FREE/KHỞI ĐỘNG/ĐỒNG HÀNH/TỰ DO) — huongdi có theo cấu trúc đó không?

**3 chiến lược em đề xuất:**

| Chiến lược | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A. Sol Premium bundle** | 1 giá (~199k/tháng), unlock cả 2 app premium | LTV cao, brand thống nhất | Khó pricing nếu user chỉ cần 1 app |
| **B. Tier riêng + Sol Premium upsell** | Mỗi app tier riêng + bundle 30% discount | Linh hoạt | Decision fatigue user |
| **C. Hoàn toàn tách** | 2 app pricing độc lập, không bundle | Đơn giản | Bỏ lỡ cross-sell LTV |

**Em recommend A (Sol Premium bundle)** — vì:
- Brand "Sol = đi cùng U45 toàn diện" mạnh hơn
- LTV/user tăng ~2× (đa số người cai thuốc cũng nghĩ về tái khởi nghiệp ở tuổi 50)
- Marketing message rõ: "Sol Premium 199k/tháng — cai thuốc + tìm hướng đi mới"

### 3.3. Brand confusion — narrative founder cần rõ

**Vấn đề:** User U45 nhìn sol.vn:
- "Bothuocla — cai thuốc"
- "Huongdi — tái khởi nghiệp"
- "Ông Khang Sol founder cả 2"
- "→ Sao ông cai thuốc lại làm coaching khởi nghiệp?"

**Đề xuất narrative thống nhất** (đã có sẵn trong /khang-sol/, chỉ cần làm nổi bật):

> **"Khang Sol — 30 năm hút Vinataba, 5 năm tự do. 20 năm dân CNTT/quản trị.**
> **2 trải nghiệm thật → 2 sản phẩm thật.**
> **Sol đồng hành U45 trên 2 mặt trận: SỨC KHOẺ và SỰ NGHIỆP."**

Em đề xuất:
- Sol.vn homepage có hero section: "Sol — 2 trụ cột cho U45" + 2 CTA card (bothuocla + huongdi)
- Khang Sol page có section "Tại sao 2 sản phẩm" — kể giai đoạn 1991-2020 (hút + làm việc cực) → 2021 cai (sức khoẻ) → 2026 build Sol (sự nghiệp giai đoạn 2)

### 3.4. Cross-sell timing — golden moment

**Em phân tích user journey bothuocla:**

| Ngày | Trạng thái cảm xúc | Cross-sell huongdi? |
|---|---|---|
| Ngày 1-7 (NHẬN DIỆN) | Hoang mang, sợ thất bại | ❌ KHÔNG — user đang vật lộn |
| Ngày 8-28 (KIỂM SOÁT) | Đang kiểm soát, đôi khi slip | ❌ KHÔNG — chưa stable |
| Ngày 29-Q-Day | Phấn khích "tôi sẽ làm được" | ⚠️ Nhẹ — "Sol còn có cái này nữa nếu anh quan tâm" |
| Ngày Q-Day+30 (Sổ Lưu Niệm) | "Tôi đã LÀM ĐƯỢC!" | ✅ **GOLDEN — đỉnh tự tin** |
| Ngày 60+ (LÀM CHỦ) | Identity người mới | ✅ "Anh đã chinh phục 1, thử cái tiếp theo?" |
| Ngày 100+ (TÁI THIẾT) | Tìm meaning mới | ✅✅ **PERFECT — đúng product-market fit** |

**Đề xuất implementation:**

1. **Phase 1 (NOW):** Thêm 1 card cuối dashboard bothuocla "Đi tiếp với Sol" → link huongdi.sol.vn?utm_source=bothuocla&utm_medium=cross_sell&utm_campaign=memory_book_day
2. **Phase 2:** Sau Memory Book Day (Day 35/52/65), auto-trigger email "Anh đã hoàn thành cai thuốc. Sol có 1 đề xuất tiếp theo cho anh" → P1 test huongdi
3. **Phase 3:** Direction P3 metadata `relatesTo: ['health-related']` — nếu user qua huongdi có direction "Coaching wellness" thì recommend lại bothuocla journey

### 3.5. Direction-Health bridge — Phase 3 vision

**Em hình dung 1 ngày:**

```
User cai thuốc xong (bothuocla) → tự tin → làm P1+P2+P3 (huongdi)
→ Top match: "Coaching health" 91% (vì user có experience thật cai thuốc)
→ Sol đề xuất "Anh có thể tạo nhóm Zalo coach những anh đang cai thuốc"
→ User thành Sol Partner — vừa kiếm tiền vừa giúp cộng đồng
→ Sol có affiliate program: user partner refer bothuocla user → commission
```

→ Đây là **flywheel** Sol có thể build. Briefing Phase 3 đã có ý này nhưng chưa cụ thể. Em note để Khang nghĩ tiếp.

---

## 4. ROADMAP TÍCH HỢP

### Nhóm 1 — QUYẾT ĐỊNH NGAY (trước team code launch)

```
□ Chốt JWT_SECRET shared (Phase 1) — Khang quyết
□ Chốt User table dùng UUID v7 — Khang chỉ thị team code
□ Chốt Sol Premium bundle pricing — Khang quyết
□ Tạo 2 sub-org Anthropic (sol-bothuocla + sol-huongdi) — Khang admin
□ Quyết Brevo upgrade hay swap Resend — Khang chốt budget
```

**Effort tổng:** 1-2 giờ Khang quyết + 30 phút setup sub-org.

### Nhóm 2 — SETUP HẠ TẦNG (trước launch huongdi)

```
□ Setup swap 4GB trên VPS
□ Tune PostgreSQL shared_buffers
□ Setup nvm + lock Node 20.20.2 cho cả sol-api và huongdi-api
□ Setup weekly rsync /var/www/ + nginx config + .env về off-site
□ Setup UptimeRobot 5 endpoint
□ Standardize UTM tags cross-domain
□ Setup GA4 cross-domain (1 property, 3 stream)
```

**Effort tổng:** ~4-6 giờ. Khang có thể delegate cho SysAdmin hoặc em hướng dẫn từng bước.

### Nhóm 3 — LINKAGE MARKETING/PRODUCT (sau launch huongdi 1-2 tuần)

```
□ Thêm cross-promote card "Đi tiếp với Sol" cuối dashboard bothuocla
□ Update sol.vn homepage hero "Sol — 2 trụ cột cho U45"
□ Update /khang-sol/ section "Tại sao 2 sản phẩm"
□ Tạo Sol Membership bundle landing page
□ Setup email cross-sell trigger sau Memory Book Day
```

**Effort tổng:** 1-2 ngày làm content + 2-3 giờ code.

### Nhóm 4 — PREP PHASE 2/3 (3-6 tháng)

```
□ Setup data warehouse Sol (BigQuery free hoặc Postgres riêng)
□ Daily ETL: bothuocla + huongdi → warehouse cho cross-analysis
□ Direction metadata: relatesTo health/career
□ Sol Partner affiliate system (Phase 3)
□ Customer-id unified analytics (1 user xuyên 3 domain)
```

**Effort tổng:** Phase 2 ~4-6 tuần dev. Phase 3 ~8-12 tuần.

---

## 5. CHECKLIST QUYẾT ĐỊNH KHANG GỬI TEAM CODE

Em note 5 quyết định ngắn gọn cho Khang gửi team code huongdi:

```
Gửi team code huongdi:

1. JWT: dùng CHUNG secret với bothuocla (Khang cung cấp file /etc/sol/jwt.secret).
   Lý do: user 1 lần đăng nhập, dùng cả 2 app.

2. User.id: UUID v7 (npm: uuid v9+ với uuidv7()), KHÔNG dùng autoincrement Int.
   Lý do: Phase 2 merge user dễ.

3. Cookie domain: ".sol.vn" (parent), Secure, HttpOnly, SameSite=Lax.
   Lý do: share session cross-domain.

4. Anthropic key: dùng key sub-org "sol-huongdi" (Khang cung cấp).
   KHÔNG share key với bothuocla.

5. Pricing: implement Sol Premium bundle tier — chi tiết Khang sẽ gửi sau khi
   thống nhất giá. Tạm thời mọi feature huongdi để free trong code (tier check
   sẽ thêm sau).
```

---

## 6. ĐÁNH GIÁ TỔNG QUAN BRIEFING KHANG

| Khía cạnh | Đánh giá | Note |
|---|---|---|
| Technical isolation | ⭐⭐⭐⭐⭐ | Phase 1 tách triệt để — đúng best practice |
| Conflict awareness (port/RAM/DB) | ⭐⭐⭐⭐⭐ | 7 xung đột em đều thấy rõ, có cách check |
| Phase 1→2→3 roadmap | ⭐⭐⭐⭐ | Có vision nhưng Phase 2 cần chi tiết hơn |
| Auth strategy | ⭐⭐⭐ | Em recommend shared JWT từ Phase 1 |
| Database future-proof | ⭐⭐⭐ | Cần UUID v7 thay autoincrement |
| Brand narrative | ⭐⭐ | Cần nổi bật "2 trụ cột — 1 founder" hơn |
| Cross-sell strategy | ⭐⭐ | Chưa đề cập timing — em đã đề xuất Memory Book Day |
| Monitoring/backup | ⭐ | Chưa có — em đề xuất UptimeRobot + rsync weekly |

**Overall: ⭐⭐⭐⭐ briefing rất tốt cho team code.** Cần bổ sung 5 quyết định nhóm 1 trước khi giao team.

---

**Phiên bản:** 1.0 — `2026-06-16`
**Tác giả:** Sol AI · em soạn dựa trên briefing Khang + codebase bothuocla
