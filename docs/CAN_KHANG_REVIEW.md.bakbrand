# Việc cần Khang xem lại sau Sprint 1

> File này tổng hợp tất cả thay đổi em đã làm + những điểm Khang phải tự quyết / xác nhận trước khi public.
> Cập nhật cuối: Sprint 1 hoàn tất — 09/05/2026

---

## A. VIỆC CẦN KHANG LÀM NGAY (em không thay được)

### 🔧 A−1. CÀI 2 MU-PLUGIN VÀO WORDPRESS — TRƯỚC KHI PUBLISH 3 TRANG PHÁP LÝ

**Vì sao**: Em đã tạo 2 WP page template để mọi trang Sol đồng nhất với trang chủ.

**File 1**: `wiki-skeletons/upload-script/wp-mu-plugin/sol-landing-template.php`
- Template **"Sol Landing — Full HTML"** dùng cho trang chủ 05 (đã cài rồi)
- Em đã sửa footer mới: tổng đài Sol 024 3993 1800, 3 link pháp lý, disclaimer Khang KHÔNG bác sĩ, khẩn cấp 115
- **Khang upload lại file này** đè lên file cũ trong WordPress

**File 2 (MỚI)**: `wiki-skeletons/upload-script/wp-mu-plugin/sol-default-template.php`
- Template **"Sol Default — Page Standard"** dùng cho 3 trang pháp lý + bài Khang's Story + mọi page mới sau này
- Có header sticky đồng nhất + content area 760px + footer chuẩn
- **Khang upload file này lần đầu**

**File 3 (TUỲ CHỌN — em đã viết xong nhưng có Cách 4 tốt hơn)**: `wiki-skeletons/upload-script/wp-mu-plugin/sol-global-footer.php`
- Override footer toàn site qua CSS hide + JS inject
- ⚠ Có CLS nhẹ + duplicate footer trong DOM — KHÔNG khuyến nghị nếu Cách 4 dưới khả thi

### 🌟 Cách 4 (RECOMMEND) — WordPress Customizer (an toàn nhất cho theme + SEO)

**File HTML**: `wiki-skeletons/landing-html/SOL_FOOTER_FOR_WORDPRESS_WIDGET.html`

**Khang làm 6 bước (10 phút)**:

1. WP Admin → **Appearance** → **Widgets** (hoặc **Customize → Widgets**)
2. Tìm Footer widget area của News Magazine X (Footer 1, Footer Bottom, etc.)
3. Xoá widget cũ ("Sol: Sống lại", "Group Facebook", "Copyright")
4. Add **"Custom HTML"** widget
5. Mở file `SOL_FOOTER_FOR_WORDPRESS_WIDGET.html` → copy TOÀN BỘ → paste vào Custom HTML widget
6. Save → test trên Wiki post + Category (incognito browser để tránh cache)

**Lợi của Cách 4 vs Cách 3 (mu-plugin)**:
- ✓ CLS = 0 (footer render 1 lần, không hide)
- ✓ Theme-safe (dùng WP Widget API chính thức)
- ✓ Theme update không reset (settings lưu DB)
- ✓ SEO clean (1 footer trong DOM, không duplicate schema)
- ✓ Không cần mu-plugin
- ⚠ Yêu cầu: theme News Magazine X phải support Custom HTML widget trong Footer area

**Nếu Cách 4 không khả thi** (theme cũ không cho remove "Powered by News Magazine X"):
→ Quay sang Cách 3 với `sol-global-footer.php` mu-plugin (cài file 3 ở trên).

**Cách cài 2 mu-plugin**:

1. Truy cập WordPress hosting qua FTP / cPanel File Manager / SSH
2. Vào folder `wp-content/`
3. Nếu chưa có folder `mu-plugins/` → tạo mới
4. Upload 2 file `sol-landing-template.php` + `sol-default-template.php` vào `wp-content/mu-plugins/`
5. **TỰ KÍCH HOẠT** — không cần Activate trong admin (mu = must-use)

**Verify cài đúng**:
- Vào WordPress Admin → Pages → Add New
- Sidebar phải → Page Attributes → Template dropdown
- Phải thấy 2 lựa chọn mới:
  - "Sol Landing — Full HTML"
  - "Sol Default — Page Standard"

**Dùng cho 3 trang pháp lý** (06/07/08): chọn template **"Sol Default — Page Standard"** khi tạo page → page tự có header + footer đồng nhất, không cần khai báo riêng.

**Dùng cho mọi page mới sau này** (Wiki, About, FAQ, Khang's Story...): cũng chọn **"Sol Default — Page Standard"**. Footer + header tự kế thừa — không phải sửa lặp lại.

---

### 📺 A0. VIDEO YOUTUBE — Khang đã ghi nợ

Khang đã chốt: làm video sau khi xong mô hình bài toán Sol. 12 kịch bản đầy đủ trong `docs/YOUTUBE_CONTENT_PLAN.md`.

**3 video priority cho landing**:
- Video 1: "Tôi nghiện thuốc lá lúc nào?" (90-120s)
- Video 5: "Lần thứ 5 — tôi không có phương pháp gì" (120-150s)
- Video 8: "Sol là gì? Tại sao tôi làm Sol?" (60-90s)

**Tech setup cần mua** (~2-2.5 triệu, mua 1 lần):
- Tripod 200-500k
- Mic Lavalier RODE SmartLav+ 1.2 triệu (hoặc Boya BY-M1 350k)
- Đèn LED ring 18" 400k (hoặc cửa sổ 9-11h sáng)
- App FilmicPro 270k (iOS) — tốt hơn camera mặc định

**Khi Khang sẵn sàng**: gọi em → em hỗ trợ chỉnh kịch bản + edit + upload + SEO.

### 🔗 A0.1 LANDING ĐANG DÙNG AUDIO PLAYER TẠM

Hero landing có audio player Voice Khang Day 0 (chỗ chờ video). Khi có Video 1 thật, em thay audio player bằng video embed.



### A1. ⚡ Chạy `prisma generate` trong Docker — 5 PHÚT

**Lý do**: emailFunnelAdaptive.ts dùng `prisma.lapseEvent` nhưng client cũ chưa generate model LapseEvent → backend build sẽ fail.

**Lệnh chạy** (PowerShell):
```powershell
docker exec sol-widget-backend-1 npx prisma generate
docker compose restart backend
```

**Verify**:
```powershell
docker logs sol-widget-backend-1 --tail 20
```
Phải thấy `SOL backend listening port 4000` + `Scheduler started — 17 cron jobs active` (16 cũ + 1 cron emailFunnelAdaptive mới em vừa bật).

### A2. ⚡ Xoá 6 file backup `.bak` em không có quyền xoá

**Lý do**: bash sandbox không có quyền xoá. Khang xoá tay (PowerShell):

```powershell
cd C:\BOTHUOCLA\sol-widget\dashboard\src
Remove-Item components\views\phaseB\*.bak
Remove-Item pages\Analytics.tsx.bak
Remove-Item pages\Journey.tsx.bak
```

### A3. 📝 Phỏng vấn luật sư đánh giá pháp lý — TUẦN NÀY

**Ngân sách**: 5-10 triệu (1 lần)

**Luật sư review**:
- Trang Landing đã sửa: không vi phạm Luật Quảng Cáo / Luật Y Tế?
- 2 file mới: `06-chinh-sach-bao-mat.html` + `07-dieu-khoan-su-dung.html`
- Wording Bệnh viện Bạch Mai: "Sol giới thiệu — không phải đối tác" — có an toàn?
- Mô hình thu tiền manual chuyển khoản — có cần đăng ký kinh doanh?
- Mô hình Đại Sứ với hoa hồng 25% — có vi phạm Luật Đa Cấp?

**Khang gọi**: Tìm 1-2 luật sư tư vấn doanh nghiệp uy tín. Đặt 1 buổi 1-2 giờ.

### A4. 🎤 Thu 5 file giọng MVP — TUẦN NÀY

**Thời gian**: 1 buổi 4 giờ phòng thu yên tĩnh.

**5 voice cần thu** (kịch bản em viết draft, Khang chỉnh giọng):

1. **Day 0 chào mừng** (60-90s): *"Anh không yếu. Não anh đã quen với điếu thuốc 30 năm. Đây là cơ chế, không phải nhân cách. Tôi cũng đã đi qua. 5 lần. Sol sẽ giúp anh hiểu mình. Tôi đợi anh."*

2. **Sau khi hút lại — Lapse-friendly** (60-90s): *"Một điếu không phải fail. Anh ổn. Tôi vẫn ở đây. Não anh không reset, anh không phải bắt đầu lại từ ngày 0. Mai sáng mở Sol lại nhé. Tôi đợi anh."*

3. **Đợi 90 giây — lúc thèm dữ dội** (90-120s): *"Anh đợi tôi 90 giây. Cùng nhau. Cơn thèm chỉ kéo dài 90-180 giây trong não anh — đây là khoa học. Mỗi lần anh đợi qua mà không hút, mạng dopamine yếu đi 1 chút. Anh không cần ý chí — anh cần biết là não anh đang lừa mình. 90 giây. Tôi ở đây."*

4. **Day 7 chúc mừng** (90s): *"Anh đã 7 ngày với Sol. Anh đã thấy mình rõ hơn 30 năm qua. Báo cáo trong app cho anh thấy cụ thể. Anh muốn đi tiếp Sol Bứt Phá hay tự đi từ đây — anh quyết. Tôi đợi anh."*

5. **Day 14 — kết thúc Sol Bứt Phá** (90s): *"Anh đã 14 ngày. Cái anh có sau 14 ngày này — không ai lấy đi được. Kể cả 1 năm sau anh có lỡ hút trong đám giỗ ông, anh sẽ biết quay lại. Sol cho anh năng lực tự cai forever — đó là điều phương pháp khác không cho. Tôi mời anh đi tiếp Sol Đi Cùng. Hoặc anh đi một mình từ đây. Anh quyết. Tôi đợi."*

**Lưu ý kỹ thuật**:
- Microphone Yeti / Rode NT-USB là đủ
- Phòng yên + treo mền hấp thụ âm
- Format: MP3 192kbps, mono, 44.1kHz
- Ghi 2-3 lần mỗi voice → chọn bản tốt nhất
- Lưu vào `dashboard/public/audio/` (đè 5 file silent placeholder hiện tại)

### A5. 👥 Recruit 30 anh em pilot — TUẦN 2

**Pilot terms**: Free Sol Bứt Phá + 1 tháng Sol Đi Cùng đổi 30 phút phỏng vấn cuối kỳ.

**Mục tiêu**: 30 anh em đăng ký + ≥20 hoàn thành 7 ngày đầu

---

## B. WORDING EM ĐÃ SỬA — KHANG XÁC NHẬN

### B1. Landing page (05-sol-homepage.html) — 7 phẫu thuật

| # | Sửa gì | Trước | Sau |
|---|---|---|---|
| 1 | Bệnh viện Bạch Mai số + wording | 1800-6606 + "khi cần BS" | 0888-008-866 + "Sol giới thiệu — không phải đối tác" |
| 2 | Section "4 chặng — pricing" | 70k/140k/210k Promo (conflict với 99k) | "4 giai đoạn hành trình" — KHÔNG pricing |
| 3 | Pricing tier 1 | "Sol 7" | "Sol Khám Phá" |
| 4 | Pricing tier 2 | "Sol Start 99k" | "Sol Bứt Phá 99k" + bỏ claim "20-40% giảm" + bỏ "14 audio mỗi ngày" |
| 5 | Pricing tier 3 | "Sol Control 99k/tháng" + "60-80% giảm" + "voice tuần" | "Sol Đi Cùng 99k/tháng" + nhấn "KHÔNG tự rút" + "voice hàng tháng" |
| 6 | Common guarantees | (5 dòng cũ) | Thêm 2 dòng: "Sol KHÔNG tự rút lần 2" + "Sol là dự án cá nhân của Khang" |
| 7 | "Day 21 không đỡ" legacy | "money-back Day 21 không đỡ" | "Hoàn tiền không hỏi lý do" |

**KHANG XÁC NHẬN**:
- Số 0888-008-866 đúng không? Verify trên website Bệnh viện Bạch Mai
- Tên "Sol Khám Phá / Sol Bứt Phá / Sol Đi Cùng" Khang đồng ý?
- Voice mới hàng tháng (1/tháng) Khang cam kết được, hay 4/năm thực tế hơn?

### B2. UI Việt hoá (15 instances)

- "Q-Day" → **"Ngày bỏ"** trong 6 file user-facing (PhaseAction, PhaseLiberation, QDayCeremony, _shared, Analytics, Journey)
- "Streak" → **"Chuỗi ngày sạch"** trong UI labels (_shared.tsx + Analytics.tsx)
- Admin pages giữ "Q-Day" + "Streak" tiếng Anh (chỉ Khang dùng)

### B3. 2 trang pháp lý mới

- `wiki-skeletons/landing-html/06-chinh-sach-bao-mat.html` — 14 sections
- `wiki-skeletons/landing-html/07-dieu-khoan-su-dung.html` — 14 sections (có cam kết Khang chết / đóng cửa: hoàn tiền tỷ lệ ngày chưa dùng)

**KHANG XÁC NHẬN**: Đưa luật sư review trước khi public. Đặc biệt section refund + Đại Sứ KHÔNG là đa cấp + Bệnh viện Bạch Mai disclaimer.

---

## C. CODE CHANGES — KHANG VERIFY SAU KHI BUILD

### C1. emailFunnelAdaptive.ts (backend/src/scheduler/)
- Fix bug `text` missing trong sendEmail call → thêm strip HTML → plain text
- Re-include trong tsconfig.json
- Bật cron `*/15 * * * *` trong worker.ts
- **CẦN**: chạy `prisma generate` trong Docker (xem A1)

### C2. tsconfig.json
- Bỏ exclude `src/scheduler/emailFunnelAdaptive.ts`

### C3. SilentCompanionshipWidgets.tsx + CrisisTimerModal.tsx
- Sửa comments header — Việt hoá, làm rõ "chỉ số nội bộ Sol — không claim khoa học"

---

## D. NỘI DUNG 247 ContentItem — KHÔNG SỬA

Quét 1135 dòng `backend/src/seed/contentItems.ts`. Các claim về phần trăm (giảm 40% receptor, 50% CO máu, 90% nguy cơ ung thư) đều có **nguồn khoa học** (Brody 2006, Doll & Hill BMJ 2004, Stanford) → content giáo dục có chân.

**KHANG NOTE**: Day 30 PHENOMENA "Phổi sửa được ~30%, tim đập chậm, vị giác về 80%" — verify với BS y khoa khi có hội đồng cố vấn.

---

## E. VIỆC HOÃN — Sprint 2 (sau khi Khang chốt 4 quyết định Đại Sứ)

- [ ] Code infrastructure Đại Sứ Sol đơn giản (5-10 người)
- [ ] Đại Sảnh Sol — không gian Khang + user + Đại Sứ
- [ ] Schema database: User.assignedAmbassadorId + AmbassadorCode + Commission
- [ ] Trang `/tro-thanh-dai-su` — chi tiết Đại Sứ
- [ ] Voice broadcast Khang hàng tháng

---

## F. VIỆC HOÃN — Giai đoạn 2 (sau pilot pass tiêu chí)

- [ ] Đăng ký Cửa Hàng Ứng Dụng (Google Play wrapper APK)
- [ ] Tự động trừ tiền VNPay/Momo (TUỲ CHỌN — không default)
- [ ] Pháp nhân Công ty Sol tách Khang
- [ ] Hợp tác Đại học Y nghiên cứu sơ bộ
- [ ] Tuyển 1-2 cộng sự
- [ ] Tiếp thị có ngân sách

---

## G. FILE EM ĐÃ TẠO/SỬA — DANH SÁCH ĐẦY ĐỦ

### Đã sửa
1. `wiki-skeletons/landing-html/05-sol-homepage.html` — 7 phẫu thuật wording
2. `dashboard/src/components/SilentCompanionshipWidgets.tsx` — comment header
3. `dashboard/src/components/CrisisTimerModal.tsx` — comment header
4. `dashboard/src/components/views/phaseB/PhaseAction.tsx` — Q-Day → Ngày bỏ
5. `dashboard/src/components/views/phaseB/PhaseLiberation.tsx` — Q-Day → Ngày bỏ
6. `dashboard/src/components/views/phaseB/QDayCeremony.tsx` — Q-Day → Ngày bỏ
7. `dashboard/src/components/views/phaseB/_shared.tsx` — Q-Day → Ngày bỏ + Streak → Chuỗi ngày sạch
8. `dashboard/src/pages/Analytics.tsx` — Q-Day → Ngày bỏ + Streak label
9. `dashboard/src/pages/Journey.tsx` — Q-Day → Ngày bỏ
10. `backend/src/scheduler/emailFunnelAdaptive.ts` — fix text + reconstructed
11. `backend/src/scheduler/worker.ts` — bật cron emailFunnelAdaptive
12. `backend/tsconfig.json` — bỏ exclude

### Đã tạo mới
13. `wiki-skeletons/landing-html/06-chinh-sach-bao-mat.html` — Chính Sách Bảo Mật template
14. `wiki-skeletons/landing-html/07-dieu-khoan-su-dung.html` — Điều Khoản Sử Dụng template
15. `docs/CAN_KHANG_REVIEW.md` — file này

### Backup files Khang xoá thủ công (em không có quyền)
- `dashboard/src/components/views/phaseB/PhaseAction.tsx.bak`
- `dashboard/src/components/views/phaseB/PhaseLiberation.tsx.bak`
- `dashboard/src/components/views/phaseB/QDayCeremony.tsx.bak`
- `dashboard/src/components/views/phaseB/_shared.tsx.bak`
- `dashboard/src/pages/Analytics.tsx.bak`
- `dashboard/src/pages/Journey.tsx.bak`

---

*Sprint 1 hoàn tất. Tổng: 12 file sửa + 3 file mới + 7 việc Khang phải làm tay.*
