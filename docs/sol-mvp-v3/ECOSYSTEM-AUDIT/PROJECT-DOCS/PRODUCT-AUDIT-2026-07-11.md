# PRODUCT AUDIT TOÀN DIỆN — Sol La Bàn (huongdi.sol.vn)
## 3 lăng kính: Sản phẩm · Trải nghiệm khách hàng · Kinh doanh
**Ngày:** 2026-07-11 · **Người audit:** AI (vai chuyên gia SP/CX/KD) cộng tác Khang Sol
**Mục đích:** Soi toàn bộ business + luồng người dùng + luồng quản trị → liệt kê điểm bất cập → backlog vá cho các phiên sau.

---

## 0. ẢNH CHỤP TRẠNG THÁI HIỆN TẠI (điều đã chạy thật)

**Sản phẩm lõi:** 5 Bước Sol La Bàn cho người Việt 40-60 tái khởi nghiệp. Persona neo: chị Nga 52 tuổi, xài Zalo, sợ bị lừa online, không rành công nghệ.

| Lớp | Trạng thái |
|---|---|
| **DB** | 64 mô hình published (38 rich 11-section + 26 Sol thin 3-section), 11 archived. Schema partner V2 (19 bảng). |
| **API** | match-v3 (21 vector), sections (gate Free/Active), catalog-v2, admin content/users/leads — LIVE |
| **Luồng user** | Bước 1 (14 câu) → Bước 2 (7 câu) → /ket-qua/ (Top match) → /chi-tiet/ (11 section, gate) → /pricing/ → /thanh-toan/ |
| **Thanh toán** | VietQR Techcombank thủ công → form /api/leads → admin duyệt → magic link gửi Zalo tay |
| **CMS** | adminhuongdi.sol.vn: sửa nội dung + đổi tier + duyệt lead — LIVE |
| **Tier** | Free · Active 499k/năm · Founder 1.999k trọn đời (100 slot) |

**Đánh giá tổng:** Nền tảng kỹ thuật đã vững và chạy đầu-cuối. Nhưng còn **nhiều sạn** ở mức trải nghiệm, tin cậy, chuyển đổi và vận hành. Đây là giai đoạn "có sản phẩm, chưa có sản phẩm tốt".

---

## 1. 🧭 LĂNG KÍNH SẢN PHẨM (Product)

### 1.1. Điểm mạnh
- Kiến trúc nội dung tốt: 11 section chuẩn, phân tầng Free/Active per-section (rất chuyên nghiệp).
- 38 bộ nội dung sâu, thật, đúng giọng persona — moat nội dung lớn nhất VN cho nhóm 40-60.
- CMS đã có → biên tập không cần dev.

### 1.2. Bất cập (severity: 🔴 cao · 🟡 vừa · 🟢 thấp)

| # | Vấn đề | Ảnh hưởng | Sev |
|---|--------|-----------|:--:|
| P1 | **Hai hệ thống matching song song.** Hub cũ `/la-ban-huong-di/` dùng DB hardcode 37 direction (slug KHÁC backend); trang mới `/ket-qua/` dùng match-v3 (64 model). Hub redirect sang ket-qua nếu đã quiz, nhưng DB hardcode vẫn là code chết, gây lệch & khó bảo trì. | Nợ kỹ thuật, nguy cơ hiển thị sai | 🔴 |
| P2 | **26 bộ Sol thin (3 section).** User match trúng 1 trong 26 bộ này thấy trang chi tiết sơ sài so với 38 bộ rich → trải nghiệm không đồng đều. | Chất lượng cảm nhận không đều | 🟡 |
| P3 | **Thuật toán match-v3 phân biệt yếu.** Điểm cụm cao (user yếu vẫn ~85%, mạnh 100%). Cosine đo hướng không đo độ mạnh; "reasons" chung chung ("Anh chị mạnh về kết nối con người"). | Gợi ý kém thuyết phục, mất niềm tin | 🔴 |
| P4 | **"Sổ Hành Trình" (journey) chưa nối.** 7 bảng journey_* tồn tại nhưng không có UI/luồng "nhân bản lộ trình 90 ngày về sổ". Section 9 chỉ là nội dung tĩnh bị khoá. | Thiếu giá trị giữ chân cốt lõi của gói Active | 🔴 |
| P5 | **Case study toàn placeholder.** 38 bộ đều ghi "(khung tham chiếu — sẽ thay bằng câu chuyện thật)". | Persona sợ lừa cần bằng chứng thật | 🟡 |
| P6 | **Bảng `directions` cũ (37) vẫn song song `models` (64).** SavedDirection/UserOutcome/JourneyDay/dashboard trỏ bảng cũ. Hai nguồn sự thật. | Data phân mảnh, dashboard lệch | 🟡 |

---

## 2. 👩 LĂNG KÍNH TRẢI NGHIỆM KHÁCH HÀNG (CX) — theo hành trình chị Nga

### Giai đoạn 1 — Nhận biết & tin tưởng (Landing)
- 🔴 **Trust signals mỏng.** Persona "sợ bị lừa online" nhưng landing ít bằng chứng: không có testimonial thật, con số người dùng, logo báo chí, khuôn mặt thật. Cam kết hoàn tiền/bảo mật nhắc thoáng qua.
- 🟡 Chưa có "vì sao tin Sol" rõ ràng ngay màn đầu (Khang Sol là ai, đã giúp ai).

### Giai đoạn 2 — Làm quiz (Bước 1 + 2)
- 🟡 **21 câu qua 2 trang** — với người 40-60 ngại công nghệ, có thể rơi rụng. Chưa rõ tỷ lệ hoàn thành (chưa đo funnel).
- 🟡 Không bắt buộc đăng ký để xem kết quả (lưu localStorage) — tốt cho rào cản thấp, nhưng **mất lead** nếu đổi máy/xoá cache; không thu được liên hệ để nuôi dưỡng.
- 🟢 Chưa có thanh tiến độ "còn mấy câu" rõ ràng để giảm bỏ cuộc.

### Giai đoạn 3 — Xem kết quả (/ket-qua/)
- 🔴 **Điểm match cụm cao + lý do chung chung** (xem P3) → chị Nga khó tin "94% này là thật cho tôi".
- 🟡 Gauge % đẹp nhưng thiếu "vì sao KHÔNG hợp" / cảnh báo rủi ro cá nhân hoá.
- 🟢 Chưa có nút lưu/gửi kết quả qua Zalo (kênh quen của persona).

### Giai đoạn 4 — Xem chi tiết & chạm paywall (/chi-tiet/)
- 🟢 Gate Free/Active hoạt động tốt (6 public / 5 locked), có preview + CTA nâng cấp — **điểm sáng**.
- 🟡 Locked section chỉ preview 180 ký tự cắt cứng, đôi khi cụt ngang câu → cảm giác thô.
- 🟡 CTA nâng cấp dẫn `/pricing/` rồi mới `/thanh-toan/` — thêm 1 bước. Với persona ngại, mỗi bước là 1 điểm rơi.

### Giai đoạn 5 — Chuyển đổi (Pricing → Thanh toán)
- 🔴 **Thanh toán thủ công VietQR + duyệt tay + magic link Zalo.** Khách chuyển khoản xong phải CHỜ admin duyệt thủ công mới được kích hoạt → độ trễ, dễ nản, không chạy 24/7. Không scale.
- 🟡 Founder "100 slot trọn đời" nhưng **chưa có live counter** thể hiện khan hiếm → mất đòn bẩy tâm lý.
- 🟡 Chưa thấy cơ chế **hoàn tiền 7 ngày** hiển thị rõ ở trang thanh toán (giảm rủi ro cảm nhận).

### Giai đoạn 6 — Sau mua (Retention)
- 🔴 **Không có Sổ Hành Trình** để "làm gì tiếp" sau khi mua Active → giá trị nhận được mờ, nguy cơ không tái tục.
- 🟡 Sol Đồng Hành AI có tồn tại nhưng mức tích hợp vào luồng chưa rõ.

### Xuyên suốt
- 🔴 **Mobile chưa kiểm thử kỹ.** Persona xài điện thoại/Zalo là chính; các trang mới (ket-qua/chi-tiet/tat-ca) cần QA mobile thật (chữ ≥16px, chạm dễ, bảng không tràn).

---

## 3. ⚙️ LĂNG KÍNH VẬN HÀNH & QUẢN TRỊ (Ops/Admin)

| # | Vấn đề | Ảnh hưởng | Sev |
|---|--------|-----------|:--:|
| O1 | **Duyệt thanh toán thủ công.** Mỗi đơn admin phải bấm duyệt + copy magic link gửi Zalo tay. | Không scale, trễ, phụ thuộc người | 🔴 |
| O2 | **CMS chưa có: tạo mô hình mới, sắp xếp lại section, upload ảnh, xem trước (preview), lịch sử sửa (versioning).** Sửa đè trực tiếp current version → mất tính bất biến (ADR immutable). | Thiếu an toàn biên tập | 🟡 |
| O3 | **1 tài khoản admin duy nhất**, chưa phân vai (biên tập viên vs super admin) trong thực tế dùng. | Rủi ro vận hành nhóm | 🟢 |
| O4 | **Không có QA nội dung tự động.** 5/14 file subagent Đợt 3 sai số liệu — bắt được nhờ so seed thủ công. Cần validation khi lưu (vd vốn min≤max). | Sạn dữ liệu lọt lưới | 🟡 |
| O5 | **Không có bảng điều khiển funnel/analytics** dù UserEvent có log. Không biết chỗ nào user rơi. | Quyết định thiếu dữ liệu | 🟡 |

---

## 4. 🔧 KỸ THUẬT & TOÀN VẸN DỮ LIỆU

| # | Vấn đề | Sev |
|---|--------|:--:|
| T1 | **schema.prisma ≠ DB thật** ở vài chỗ (đã vá cột google_id hôm nay). Prod dùng db push, dễ lệch. ⚠️ Vẫn cấm chạy `prisma db push`. | 🔴 |
| T2 | **19 bảng mới không trong schema.prisma** (dùng raw SQL). Prisma Client không type được → dễ lỗi runtime (đã gặp uuid cast). | 🟡 |
| T3 | **SEO:** trang /chi-tiet, /tat-ca, /ket-qua chưa vào sitemap; chi-tiet không có meta riêng theo slug (client-render) → Google khó index 64 mô hình. | 🟡 |
| T4 | **Hub cũ + DB hardcode 37** = code chết cần dọn. | 🟡 |
| T5 | **Không có backup tự động định kỳ** (chỉ backup thủ công trước mỗi migration). | 🟡 |

---

## 5. 📋 BACKLOG ƯU TIÊN (kế hoạch vá cho các phiên sau)

### 🔴 P0 — Chặn tăng trưởng / chặn niềm tin (làm trước)
1. **Tự động hoá thanh toán** — tích hợp cổng (PayOS/SePay/Casso) webhook: khách CK → tự kích hoạt Active, bỏ duyệt tay. *(gỡ O1, giai đoạn 5)*
2. **Nối Sổ Hành Trình** — UI "nhân bản lộ trình 90 ngày về sổ" cho gói Active (dùng journey_* đã có). *(P4, giai đoạn 6 — giá trị giữ chân)*
3. **Nâng chất matching + reasons** — thêm hard-constraint (vốn/thời gian), reasons cá nhân hoá thật, thêm "vì sao chưa hợp". *(P3)*
4. **Trust layer** — testimonial thật + 3-5 case study thật (thay placeholder) + trang "Khang Sol là ai" + con số minh bạch. *(giai đoạn 1, P5)*

### 🟡 P1 — Hoàn thiện trải nghiệm & chất lượng
5. Refine 26 bộ Sol thin → 11 section (subagent hoặc CMS). *(P2)*
6. QA mobile toàn luồng (ket-qua/chi-tiet/tat-ca/pricing) cho persona 40-60.
7. SEO: thêm 3 trang vào sitemap + meta động cho chi-tiet + submit GSC/Bing. *(T3)*
8. Founder live counter (khan hiếm) + hiển thị hoàn tiền 7 ngày ở /thanh-toan/.
9. Dọn hub cũ + DB hardcode 37; hợp nhất về 1 nguồn (models). *(P1, T4)*
10. Validation nội dung trong CMS (vốn min≤max, cảnh báo thiếu section/score). *(O4)*

### 🟢 P2 — Nền tảng & mở rộng
11. Đưa 19 bảng vào schema.prisma đúng cách (hoặc chuẩn hoá quy trình raw SQL). *(T2)*
12. Bảng điều khiển funnel/analytics từ UserEvent. *(O5)*
13. CMS: tạo mô hình mới, preview, versioning bất biến, upload ảnh, phân vai. *(O2, O3)*
14. Backup DB tự động định kỳ (cron pg_dump). *(T5)*
15. Hợp nhất bảng `directions` cũ → `models` (migrate FK SavedDirection/UserOutcome/JourneyDay). *(P6)*

---

## 6. ⚡ QUICK WINS (làm nhanh, giá trị cao — gợi ý phiên kế)
- SEO sitemap + meta (nửa buổi) → mở kênh organic.
- Founder live counter + badge hoàn tiền (nhanh, tăng chuyển đổi).
- Preview locked section cắt theo câu thay vì 180 ký tự cứng (nhỏ, mượt hơn).
- Nút "Gửi kết quả qua Zalo" ở /ket-qua/.

---

## 7. KẾT LUẬN CỦA CHUYÊN GIA

Sol đang ở ngưỡng **"MVP kỹ thuật hoàn chỉnh → sản phẩm đáng tin"**. Ba nút thắt lớn nhất, xếp theo tác động kinh doanh:

1. **Niềm tin** (trust layer + case study thật) — persona sẽ không trả tiền nếu chưa tin.
2. **Ma sát thanh toán** (tự động hoá) — đang bịt phễu ở đúng bước ra tiền.
3. **Giá trị sau mua** (Sổ Hành Trình) — quyết định tái tục và truyền miệng.

Nền đã vững; 3 việc trên biến "có sản phẩm" thành "bán được và giữ được". Các sạn còn lại (P1/P2) là hoàn thiện, không chặn.

_Tài liệu lưu trữ · Sol Ecosystem · Khang Sol · 2026-07-11 · dùng làm backlog cho các phiên sau._
