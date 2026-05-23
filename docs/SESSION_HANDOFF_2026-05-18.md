# SESSION HANDOFF — 2026-05-18

> **Mục đích**: Document đầy đủ context phiên 2026-05-18 để session mới pick up nhanh.
> **Cách dùng**: Khi mở session mới với em, paste TOÀN BỘ nội dung file này làm tin nhắn đầu tiên.

---

## 0. CHO EM (Sol assistant) — Đọc trước khi reply

**Trạng thái hiện tại**: Phiên dài (100+ messages). Khang đã làm rất nhiều quyết định lớn. File canonical đã chốt. Em ĐÃ NHIỀU LẦN sai về tone/positioning — phải đọc kỹ Section 4 (Critical Reminders) trước khi tạo content mới.

**TÔN CHỈ**:
1. Đọc `SOL_BUSINESS_MODEL_CANONICAL.md` (Source of Truth)
2. Đọc `SOL_PRODUCT_ROADMAP_PHASE_4.md` (Sprint plan + 5 câu hỏi pending)
3. Tuân thủ checklist Section 12.5.4 của canonical TRƯỚC khi publish content mới

---

## 1. MAJOR DECISIONS — Khang đã chốt trong phiên này

### Business Model
1. **Freemium Honest** (không phải PAID-only after 7 days)
   - Sol miễn phí vào trải nghiệm: đọc 130+ bài SEO, 7 ngày Nhận Diện, follow Zalo
   - Sau 7 ngày: vẫn dùng được app (hạn chế tài nguyên), KHÔNG khoá tài khoản
   - Trả phí = mở rộng tài nguyên + cấu trúc lộ trình
2. **Pricing canonical V3** (`GIA-pricing-page-v3.html`):
   - 3 Lộ trình: NHẸ 149k / VỪA 249k / NẶNG 349k (theo FTND 0-3 / 4-6 / 7-10)
   - 4 cách trả: Trả Thử 49k / Trả Tuần 25-35k / Trả Một Lần ⭐ / Trả Sau Thành Công
   - Tính năng cốt lõi giống nhau 3 lộ trình
3. **Đại Sứ Sol**: TRỰC TIẾP, SINGLE-TIER, KHÔNG đa cấp, KHÔNG tuyến dưới, 25% commission
4. **Pilot 30** Q2/2026 — FREE 100% cho 30 anh em đầu tiên

### Voice & Tone (CRITICAL)
5. **"Voice của Khang"** (KHÔNG "Voice Khang" hay "Giọng Khang") — Khang rule từ Sprint 1
6. **Vai trò**: "Người đã đi qua" / "Anh em đi trước" (NAME → FUNCTION rule)
7. **Việt hoá tối đa + dân dã** (ABSOLUTE RULE Section 12.5):
   - 80+ terms English → Vietnamese đã ghi trong canonical
   - KHÔNG mix Anh-Việt: ❌ "Stress event lớn" / ❌ "Social trigger" / ❌ "Skill 1"
   - Tone: câu ≤15 từ, anh em cà phê, không hàn lâm

### Technical Choices
8. **VPS provider EZTech** — Singapore-aware option, FPT Datacenter Tier 3
   - Spec OK: 2 core Xeon Gold + 2GB RAM + 30GB NVMe + Unlimited BW + 100Mbps
   - Location: VN (FPT TPHCM/HN) — em đề xuất, anh chưa final confirm
   - OS: Ubuntu 22.04 LTS
9. **bothuocla.sol.vn** sẽ host trên VPS riêng (WordPress sol.vn giữ ở hosting cũ)

### Sprint Priority (Phase 4)
10. Trong 5 câu hỏi Phase 4, Khang **CHƯA trả lời 4 câu** (Sprint priority, Pilot launch timing, Đại Sứ code timing, Budget) — chỉ trả lời câu 5 "Re-publish ngay"

---

## 2. COMPLETED WORK — Phiên này em đã làm

### Phase 3 — Audit + Fix Messaging (DONE)
- ✅ Created `SOL_BUSINESS_MODEL_CANONICAL.md` (Source of Truth, 530+ lines, 18 sections)
- ✅ Audit 128 mentions "miễn phí" sai trong 30 docs
- ✅ Audit "Voice Khang" / "giọng Khang" trong 50+ files
- ✅ Build `messaging-fix.js` script → fixed 72 files, 109 replacements
- ✅ Fix manual: tiers/routes.ts, seed.ts canned reply, PRICING_TIERS_DEPLOY.md, admin-messaging-mockup.html
- ✅ Fix build errors: adminAlert.ts (wrong import), memoryBook.ts (6 Prisma schema mismatches), journeyAdminRoutes.ts (duplicate block)

### Phase 4 — Roadmap (DONE)
- ✅ Created `SOL_PRODUCT_ROADMAP_PHASE_4.md` (600+ lines)
- ✅ State of Union: đã build vs chưa build
- ✅ 10 GAP analysis (3 P0 blockers: Voice của Khang record, 4 Cách trả flow, Đại Sứ system)
- ✅ Đại Sứ 4-stage roadmap (Pre-launch → Soft launch → Scale → Mature)
- ✅ Sprint 5-10 plan (12 tuần, 6 sprints)
- ✅ KPIs + Risks + Mitigations

### Việt hoá tối đa (DONE — 2 passes)
- ✅ Add Section 12.5 vào canonical doc: rule TUYỆT ĐỐI + 80+ terms glossary + tone guidelines + checklist trước publish
- ✅ Build `batch-vietnamese-v2.js` (loosen PROTECT, multi-word ưu tiên)
- ✅ Pass 1: **95 files, 693 replacements**
- ✅ Build `cleanup-vietnamese-pass2.js` cho duplicates + leftover terms
- ✅ Pass 2: **24 files, 117 replacements**
- ✅ **TOTAL: 95 files (74% wiki), 810 replacements**
- ✅ Verify bài flagship `cai-thuoc-la-vinh-vien` clean: "Kỹ năng 1-5", "Phục hồi sau lỡ điếu (AVE)", "Củng cố bản thân mới"

### Other (DONE)
- ✅ Bài "Gửi thư cho Sol" — embed Google Form (Khang đã tạo Form ID `1FAIpQLSdlG9NdRVcbHOjLSUEGhP9AdqHQ6vM_tPtf5mPnVak2mN3jQQ`)
- ✅ Build OK — backend tsc pass clean
- ✅ Sơ đồ chức năng tổng quan (trong session — chưa export file)

---

## 3. CURRENT STATE — Trạng thái cuối phiên

### File system
- ✅ Canonical doc + Phase 4 roadmap đầy đủ
- ✅ Wiki articles đã fix wording (Việt hoá + Voice của Khang) trên local
- ⏳ Wiki articles **CHƯA re-publish** lên sol.vn — Khang sẽ chạy publish script
- ✅ Backend code clean, build pass

### sol.vn (production WP)
- ⏳ Vẫn còn version CŨ với English terms (Skill, Social trigger, Stress event lớn…)
- ⏳ Bài "Gửi thư cho Sol" CHƯA publish (file ready, Khang chạy `node publish-gui-thu.js`)
- ⏳ 95 bài wiki Việt hoá + Voice của Khang fix CHƯA publish

### Pending
- Anh chưa trả lời 4/5 câu hỏi Phase 4 (Sprint priority, Pilot launch, Đại Sứ code timing, Budget)

---

## 4. CRITICAL REMINDERS — Em phải nhớ

### Wording RULE (Section 12.5 canonical)

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Voice Khang / Giọng Khang | Voice của Khang / Khang chia sẻ qua Voice |
| Sol miễn phí 100% | Sol miễn phí vào trải nghiệm + có gói mở rộng |
| Không bán gì cả | Không bán thuốc, không bán khoá học, không quảng cáo |
| Skill 1, 2, 3 | Kỹ năng 1, 2, 3 |
| Social trigger | Tình huống xã hội gây thèm |
| Stress event lớn | Sự kiện căng thẳng lớn |
| Plan B | Kế hoạch B |
| Identity Reinforcement | Củng cố bản thân mới |
| AVE Recovery | Phục hồi sau lỡ điếu (AVE) |
| trigger / cue | tình huống thèm / tín hiệu thèm |
| withdrawal | triệu chứng cai |
| relapse / lapse | tái nghiện / lỡ điếu |
| cold turkey | bỏ đột ngột |
| willpower | ý chí |
| Đại lý / Affiliate | Đại Sứ Sol |
| Sổ lưu niệm | Sổ Hành Trình |

### Đại Sứ Sol — Rule bất di bất dịch
- Phải tốt nghiệp 90 ngày Tự do mới được làm Đại Sứ
- TRỰC TIẾP, SINGLE-TIER, KHÔNG đa cấp
- Mã giới thiệu duy nhất, commission 25% mỗi đơn về thẳng tay Đại Sứ
- Không tuyển team, không tuyến dưới

### Voice Style (Sol Voice Style Guide)
- Câu ≤15 từ
- 1 dữ kiện / 1 câu
- Dùng "anh" (target nam) hoặc "chị" (cluster Vợ)
- Không Hán-Việt nặng (thực chất → thật ra, khả thi → làm được)
- Ví dụ cụ thể, tránh abstract

### Checklist BẮT BUỘC trước khi publish content mới
- [ ] Đọc bằng giọng bố/anh trai 50 tuổi cấp 3 — hiểu không?
- [ ] Câu nào > 20 từ? Tách ra
- [ ] Có English trong heading? Việt hoá hoặc thêm Việt vào ngoặc
- [ ] Có cụm Anh-Việt mix? Việt hoá hoàn toàn
- [ ] Có abstract concept không có ví dụ cụ thể? Thêm ví dụ
- [ ] Có Hán-Việt nặng? Thay từ phổ thông
- [ ] Disclose "Khang không phải bác sĩ" nếu cần
- [ ] Disclose "Sol không hứa cai 100%" nếu nói về kết quả

---

## 5. NEXT ACTIONS — Session mới làm gì

### Đầu session mới — Em hỏi Khang status

1. "Anh đã chạy 5 lệnh `node publish-*.js` chưa?"
2. "Bao nhiêu bài success / fail?"
3. "Đã force sitemap regenerate chưa?"
4. "Đã Request Indexing top 10 chưa?"

### Nếu Khang đã làm xong publish + GSC:
- Verify random 3 bài flagship trên sol.vn
- Update task #84 → completed
- Tiếp tục Phase 4 — hỏi 4 câu Sprint priority còn pending

### Nếu Khang chưa làm xong:
- Nhắc 5 lệnh + GSC steps (đã viết Section 6 dưới)

### Phase 4 — 4 câu Khang chưa trả lời

1. **Sprint priority**: Voice trước (Sprint 5) hay Payment trước (Sprint 6)? *(em recommend Voice trước)*
2. **Pilot 30 launch**: Sau Sprint 5 hay sau Sprint 7? *(em recommend sau Sprint 5)*
3. **Đại Sứ code**: Sprint 8 (sau khi có Đại Sứ thật) hay sớm hơn? *(em recommend Sprint 8)*
4. **Budget**: ~2-3tr cho 6 tháng đầu OK không?

### Pending lâu hơn
- Task #88 — Phân tích chính sách Zalo OA mới 2026 (chờ traffic tăng)
- Task #63 — User test admin UI + tạo SOS giả
- Sprint 5 — Khang chuẩn bị mic lavalier + setup phòng record

---

## 6. LỆNH ANH CẦN CHẠY — Đầy đủ

### Phần A — Re-publish 95 wiki articles (~30 phút)

```bash
cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher

node publish-qday-series.js
node publish-chip-batch.js
node publish-cluster-ab.js
node publish-vo-cluster.js
node publish-longtail-batch.js
```

### Phần A.5 — Publish bài "Gửi thư cho Sol" (3 phút) — RIÊNG, script khác

Bài này có Google Form embed mới (Form ID `1FAIpQLSdlG9NdRVcbHOjLSUEGhP9AdqHQ6vM_tPtf5mPnVak2mN3jQQ`).

```bash
cd C:\BOTHUOCLA\sol-widget\scripts\wp-publisher
node publish-gui-thu.js --dry-run    # check trước
node publish-gui-thu.js                # publish thật
```

Script UPDATE `sol.vn/gui-thu-cho-sol` (giữ slug + SEO).

**Sau publish — test ngay**:
1. Mở `https://sol.vn/gui-thu-cho-sol`
2. Form Google nhúng hiện đầy đủ
3. Submit thử 1 thư test → check Google Sheet "Sol Letters"
4. Check Gmail notification

### Phần B — Force Sitemap (1 phút, qua WP Admin)

1. `https://sol.vn/wp-admin` → Rank Math → Sitemap Settings → Regenerate
2. Verify: `https://sol.vn/sitemap_index.xml`

### Phần C — Request Indexing top 10 (15-30 phút, qua GSC)

`https://search.google.com/search-console` → property sol.vn → URL Inspection → Request Indexing cho 10 URL DƯỚI ĐÂY (đã verify slug thật từ publish scripts):

```
https://sol.vn/cai-thuoc-la-vinh-vien
https://sol.vn/cach-bo-thuoc-vinh-vien-khong-tai-nghien
https://sol.vn/chuan-bi-q-day-cai-thuoc
https://sol.vn/vo-giup-chong-bo-thuoc-la
https://sol.vn/ngay-1-24-gio-dau-tien-bo-thuoc-la
https://sol.vn/ngay-3-buc-tuong-trieu-chung-cai-dat-dinh-va-bat-dau-giam
https://sol.vn/ngay-7-moc-1-tuan-nhung-gi-da-thay-doi-trong-co-the-ban
https://sol.vn/ngay-22-con-them-sau-bua-an-tai-sao-van-dai-dang
https://sol.vn/ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-ai
https://sol.vn/giam-dan-ngay-13-plan-b
```

**Nguồn slug**:
- Pillar slugs từ `scripts/wp-publisher/pillar-articles.json`
- Q-Day slugs từ `scripts/wp-publisher/publish-qday-series.js` (array QDAY)
- Q-Day Prep slug từ `scripts/wp-publisher/publish-pillar-qday-prep.js` (const SLUG)
- Vợ cluster slug từ `scripts/wp-publisher/vo-cluster-articles.json`
- Pre-Q-Day slug từ `scripts/wp-publisher/pre-qday-articles.json`

### Phần D — (Optional) Restart Backend

Nếu muốn deploy tier descriptions + canned reply mới:

```bash
cd C:\BOTHUOCLA\sol-widget\backend
pm2 restart sol-backend
```

### Phần E — VPS EZTech + DNS bothuocla.sol.vn (1-2 giờ, làm sau khi mua VPS)

**Bước E.1 — Mua VPS EZTech** (15 phút, qua eztech.vn):
- Spec: 2 core Xeon Gold + 2GB RAM + 30GB NVMe + Unlimited BW
- Location: **VN (FPT TPHCM hoặc HN)** — KHÔNG chọn US/EU
- OS: **Ubuntu 22.04 LTS 64-bit**
- Sau khi thanh toán → nhận email IP + root password

**Bước E.2 — Add DNS A record qua Cloudflare** (2 phút):
1. Login `dash.cloudflare.com`
2. Chọn domain `sol.vn`
3. Sidebar trái → **DNS** → **Records**
4. Click **Add record**:
   - Type: `A`
   - Name: `bothuocla`
   - IPv4 address: (IP VPS từ EZTech)
   - Proxy status: 🟠 **Proxied** (orange cloud)
   - TTL: Auto
5. Click **Save**

**Bước E.3 — SSL/TLS Cloudflare**:
1. Sidebar → **SSL/TLS** → **Overview**
2. Mode: **Full (strict)**
3. Sidebar → **SSL/TLS** → **Edge Certificates**
4. Always Use HTTPS: **ON**
5. Automatic HTTPS Rewrites: **ON**

**Bước E.4 — Gửi em IP + thông tin để em viết script provision**:
- IP VPS
- OS đã chọn
- Tên provider (xác nhận EZTech)
- Giá tháng (để em log)

Sau đó em viết:
- `provision-vps.sh` (cài Ubuntu + Nginx + Node 20 + Postgres + PM2 + fail2ban + UFW + Let's Encrypt)
- `deploy-sol-widget.sh` (clone repo + migrate Prisma + build Next.js + start PM2)

→ 2-3h sau `bothuocla.sol.vn` LIVE.

---

## 7. FILES CHANGED — Trong phiên này

### Created
- `docs/SOL_BUSINESS_MODEL_CANONICAL.md` (Source of Truth, 530+ lines)
- `docs/SOL_PRODUCT_ROADMAP_PHASE_4.md` (Phase 4 deliverable, 600+ lines)
- `docs/SOL_FUNCTIONAL_OVERVIEW_FOR_PARTNERS.md` (sơ đồ chức năng cho đại lý/khách)
- `docs/SESSION_HANDOFF_2026-05-18.md` (file này)
- `docs/VIETNAMESE_FIX_V2_AUDIT.md` (audit report)
- `scripts/wp-publisher/messaging-fix.js` (messaging fix script)
- `scripts/wp-publisher/batch-vietnamese-v2.js` (Việt hoá v2)
- `scripts/wp-publisher/cleanup-vietnamese-pass2.js` (cleanup pass 2)

### Modified
- `wiki-skeletons/wiki-articles/PILLAR-gui-thu-cho-sol.html` (Google Form embed)
- 95 wiki articles (Việt hoá pass 1 + pass 2)
- `backend/src/services/memoryBook.ts` (fix Prisma schema mismatch)
- `backend/src/services/adminAlert.ts` (fix import path)
- `backend/src/zalo/journeyAdminRoutes.ts` (fix duplicate block)
- `backend/src/tiers/routes.ts` (tier descriptions: "Voice của Khang")
- `backend/src/seed.ts` (canned reply: "Voice của Khang")
- `frontend/src/components/WidgetPanel.tsx` (UI label)
- `frontend/src/components/views/VoiceInboxView.tsx` (UI heading)
- `dashboard/src/pages/VoiceInbox.tsx` (UI heading)
- `dashboard/src/pages/HoiKhang.tsx` (UI labels)
- `admin/src/pages/AdminLayout.tsx` + `dashboard/src/pages/admin/AdminLayout.tsx` (nav label)
- `admin/src/pages/AdminMessaging.tsx` (admin description)
- `docs/marketing/FANPAGE_LAUNCH_KIT.md` + nhiều file marketing khác
- `PRICING_TIERS_DEPLOY.md`

### Backups created
- `*.bak3` (messaging fix pass)
- `*.bak4` (vietnamese pass 1)
- `*.bak5` (vietnamese pass 2 cleanup)

---

## 8. CANONICAL LINKS

- Pricing canonical: https://sol.vn/gia
- Onboarding: https://bothuocla.sol.vn/onboarding
- FB Fanpage: https://fb.com/sol.bothuocla
- UGC Gửi thư (chưa publish): https://sol.vn/gui-thu-cho-sol

---

## 9. END-OF-SESSION TODO LIST

- [x] Task #105 — Canonical doc
- [x] Task #106 — Audit messaging
- [x] Task #107 — Audit FB/Group/Video docs
- [x] Task #108 — Execute fix list
- [x] Task #109 — Phase 4 roadmap
- [x] Task #110 — Remove "Giọng Khang"
- [x] Task #111 — Việt hoá tối đa 130+ bài
- [x] Task #81 — Việt hoá 7 priority + còn lại
- [ ] Task #84 — Re-publish 104 bài Việt hoá lên sol.vn (Khang chạy)
- [ ] Task #88 — Phân tích Zalo OA policy (chờ traffic tăng)
- [ ] Task #63 — User test admin UI + SOS giả

---

**Cuối phiên 2026-05-18. Phiên có productive nhưng dài (100+ messages).**
**Khuyến nghị Khang: chạy publish + GSC ngoài session, sau đó mở session mới với handoff doc này.**
