# Sol — Roadmap

> Roadmap từ Day 1 launch journey (15/5) đến post-launch tháng 6.
> Cập nhật: 2026-05-22 (D-Day -9).

---

## 0. Mốc lớn

| Mốc | Date | Status |
|---|---|---|
| VPS provisioning | 2026-05-20 | ✅ Done |
| Backend deploy (Express + Prisma) | 2026-05-21 | ✅ Done |
| Dashboard SPA deploy | 2026-05-21 | ✅ Done |
| Admin SPA deploy | 2026-05-21 | ✅ Done |
| SEO sprint 7 bài flagship | 2026-05-22 | ✅ Done |
| Mail auth (Brevo + DKIM/SPF/DMARC) | 2026-05-22 | ✅ Done |
| **Soft launch Wave 1 (3 beta)** | 2026-05-23 | 🟡 Pending |
| Soft launch Wave 2 (7 beta) | 2026-05-26 | 🟡 Pending |
| **D-Day launch — World No Tobacco Day** | 2026-05-31 | 🔥 Critical |
| Wave 3 (100 beta) | 2026-06-01 → 06-15 | ⏳ Future |
| Sprint 2 planning | 2026-06-16 | ⏳ Future |

---

## 1. Day 1-7 (15-21/5) — Backend deploy + content production — ✅ DONE

- VPS Ubuntu 24.04 provision (2GB / 30GB)
- Nginx + SSL Let's Encrypt
- Cloudflare DNS + Worker `sol-robots-override`
- Backend deploy `/var/www/sol-widget-old/backend` (Express + Prisma + Postgres)
- Dashboard SPA deploy `bothuocla.sol.vn`
- Admin SPA deploy `admin.sol.vn`
- 26 cron job active in-process
- Refactor Test FTND result page → marketing landing
- 143 wiki article author block bulk inject

---

## 2. Day 8 (22/5 hôm nay) — SEO + email auth + OG — ✅ DONE

### SEO
- Audit toàn site sol.vn (15 mục) — PASS Google compliance
- Disable `inject-faq-schema.js` (FAQ deprecated 7/5/2026)
- Publish 7 bài Sprint 31-5 flagship với schema HowTo/QAPage/Article
- Generate 7 OG image branded (sharp + SVG)

### Email
- Switch Zoho → Brevo (Zoho không có App Password)
- Fix SMTP_SECURE=false port 587 STARTTLS
- Fix `.env` comment trailing in values
- Fix email base64 raw → single-part text/html
- Setup DKIM + SPF + DMARC DNS Cloudflare
- Regenerate Brevo SMTP key

### Misc
- VietQR static thay MoMo SDK
- 3 cohort plan finalized: LIGHT 140k / MODERATE 225k / HEAVY 290k
- Documentation overhaul (file này + 10 file khác)

---

## 3. Day 9 (23-29/5) — Soft launch + bug bash

### Wave 1 (23-24/5) — 3 beta thân nhất
- Khang test internal
- 2 user thân — invite qua Zalo cá nhân (template trong [SOFT_LAUNCH_CHECKLIST.md](./SOFT_LAUNCH_CHECKLIST.md))
- Mục tiêu: bug critical, UX feedback

### Wave 2 (25-26/5) — thêm 4 user
- Sau khi Wave 1 chạy ≥ 24h không bug critical
- Pilot anh em đã follow Zalo OA hoặc Group

### Wave 3 (27-29/5) — đầy 10 beta
- 3 user còn lại
- Refine onboarding theo feedback Wave 1+2

### Hot fix candidates (predict)
- Edge case OAuth Zalo callback (token expired)
- VietQR QR không hiện trên 1 số phone
- Cron timer drift (TZ Asia/Ho_Chi_Minh verify)
- Email magic link sang spam folder (DKIM/SPF/DMARC fresh — chưa kịp learn reputation)

### E2E test checklist (full)
- [ ] Anon signup → FTND 6 câu → cohort assigned → Overview
- [ ] Q-Day pick + checklist gate
- [ ] Daily check-in (smoked toggle + craving + mood + note)
- [ ] CHIP click → resolved instant (no AI quota)
- [ ] AI chat 30 tin/ngày (FREE tier) — verify quota counter
- [ ] `/pricing` → VietQR generate → user CK → admin confirm PAID → tier upgrade
- [ ] Refund flow request → admin approve → bank transfer manual
- [ ] Zalo OA follow → ZNS broadcast received
- [ ] Email magic link login (verify inbox Gmail không spam)
- [ ] Recovery code generate + use (Layer 3 auth)
- [ ] 26 cron job log 24h không error

---

## 4. Day 10 (30-31/5) — D-Day push

### 30/5 — Final dry-run
- Full E2E retest sau bug fix Wave 1-3
- Backup DB pre-launch: `pg_dump > /var/backups/pre_launch_2026-05-31.sql.gz`
- Verify VAPID key web push
- Verify Sentry DSN (optional)
- Update credentials trong [01-CREDENTIALS.md](./01-CREDENTIALS.md) nếu có change
- Verify Zalo OA token còn ≥30 ngày
- GSC submit sitemap mới (sol.vn/sitemap.xml + Sprint 31-5 URLs)

### 31/5 — Launch World No Tobacco Day
- **Sáng 6:30** — Pre-launch
  - PM2 status check
  - DB backup
  - Cron log verify 24h
  
- **Sáng 7:00** — Push promo
  - Zalo OA broadcast (ZNS template approve trước)
  - FB Group + Fanpage post
  - Email funnel manual cho list email
  - Sprint 31-5 task #49-53 (Khang content schedule)

- **Sáng 8:00-12:00** — Soft monitor
  - Tail `pm2 logs sol-api`
  - Refresh admin `/home` mỗi 30 phút
  - Reply chat user trong vòng < 30 phút
  - Watch GA4 realtime

- **Chiều 14:00** — Mid-day review
  - User count tăng?
  - Bug critical nào?
  - AI quota còn?
  - VietQR confirm tay (refresh `/admin/payments`)

- **Tối 20:00** — Day 1 report
  - Tạo `docs/SETUP_LOG_2026-05-31.md`
  - Update CHANGELOG
  - Plan tuần đầu tháng 6

---

## 5. Post-launch (1-15/6) — Wave 3 + data tracking

### Wave 3 (1-15/6) — 100 beta
- Open beta qua Sol Fanpage + Group + Zalo OA broadcast
- Cohort tracking theo FTND distribution
- A/B test pricing copy (LIGHT vs popular MODERATE highlight)
- Monitor 90-day retention (Phase B journey day 60-90)

### Data tracking
- GSC indexing: bao nhiêu bài Sprint 31-5 indexed sau 14 ngày?
- GA4 funnel: landing → FTND → onboard → paid
- Cloudflare AI bot traffic — Sprint 31-5 schemas có tăng AI Overviews?
- VietQR conversion rate per cohort
- Refund request rate

### Sprint 2 planning (16/6+)
- Trigger: 30 anh em chạy đủ 35-65 ngày → có data thực
- Review burned features:
  - Personalization modal (đã bỏ — re-introduce nhẹ nhàng?)
  - Workbook 30-ngày modular (engagement đo bằng cách nào?)
  - Voice library (Khang record bao nhiêu voice mới?)

---

## 6. Backlog (chưa schedule)

### High priority (post-launch tuần 1-2)
- [ ] **Zalo OA webhook full wire** (#67) — message reply + SOS auto-route admin
- [ ] **Zalo OA token auto-refresh** — implement `oaClient.ts` refresh logic (token hết hạn ~25/8/2026)
- [ ] **DB auto-backup cron** — daily 3h sáng, retention 14 ngày
- [ ] **MB Bank webhook** wire — payment confirm auto thay manual

### Medium priority (tháng 6)
- [ ] **`.env` strip-comment helper** (#97) — clean trailing comments khi load
- [ ] **AppSetting encrypt-at-rest** — AI API key encrypt DB column (đang plaintext)
- [ ] **Sentry production** wire — DSN + source map upload
- [ ] **Sprint 31-5 SEO #49-53** — 5 bài content còn lại (Khang viết tay)
- [ ] **GSC re-index trigger** — bump dateModified bài cũ để Google re-crawl
- [ ] **PWA manifest** cho bothuocla.sol.vn — installable on mobile home screen

### Low priority (Q3 2026)
- [ ] **Phase 1/2/4 content (38 bài)** — Khang viết tay (Day 1-7, 8-28, 59-88)
- [ ] **Admin chat 2-chiều inbox** — port `AdminChatClient.tsx` từ Next.js bỏ vào admin SPA
- [ ] **UptimeRobot monitoring** — alert SMS/email nếu site down
- [ ] **Voice features (TTS tiếng Việt)** — alternative cho Khang record voice
- [ ] **Đại Sứ Sol commission tracking** — sau khi có 5+ user tốt nghiệp 90 ngày
- [ ] **Multi-vertical roadmap** (cairuou.sol.vn / giacngu.sol.vn / sunghiep.sol.vn) — chỉ start sau khi bothuocla product-market fit

---

## 7. Yearly milestones

| Date | Milestone |
|---|---|
| 2026-05-31 | Launch World No Tobacco Day |
| 2026-08-18 | SSL cert renewal due (auto qua certbot) |
| 2026-08-25 | Zalo OA token renewal (~90 days, NHỚ refresh) |
| 2026-08-31 | Sprint 1 retro — 90 day data |
| 2026-11-30 | Sprint 2 (Stage 1 — Nhận Thức content cycle) |
| 2027-05-20 | VPS renewal eztech.vn 799k |
| 2027-05-31 | Anniversary D-Day — 1 năm Sol |

---

## 8. Risk register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Brevo free quota 300/ngày hit | High | Medium | Upgrade $25/mo khi vượt 200/ngày stable |
| Zalo OA token expire | Medium | High | Lịch nhắc 25/8/2026, implement auto-refresh |
| AI Anthropic quota run out | Medium | High | Multi-provider (Claude + Gemini fallback) |
| VPS RAM 2GB exhaust | Low | High | Monitor `free -h`, bump VPS lên 4GB nếu cần |
| MoMo / VietQR fraud (fake CK) | Medium | Medium | Admin verify từng PaymentLog → bank statement match |
| GSC indexing chậm post-launch | High | Low | Submit sitemap + bump dateModified weekly |
| Cron job double-execute (2 instance) | Low | High | PM2 instances: 1 + ENABLE_SCHEDULER chỉ 1 process |
| DB corruption | Low | Critical | Daily backup `/var/backups/sol-db-*.sql.gz` |

---

## 9. Tham khảo

- [SOFT_LAUNCH_CHECKLIST.md](./SOFT_LAUNCH_CHECKLIST.md) — pre-launch beta checklist
- [DEPLOYMENT_PLAN_OLD_CODEBASE.md](./DEPLOYMENT_PLAN_OLD_CODEBASE.md) — kế hoạch deploy gốc 21/5
- [09-DECISIONS.md](./09-DECISIONS.md) — quyết định kỹ thuật
- [CHANGELOG_2026-05.md](./CHANGELOG_2026-05.md) — log detail từng task

---

**Last updated**: 2026-05-22
**Maintainer**: Khang Sol
