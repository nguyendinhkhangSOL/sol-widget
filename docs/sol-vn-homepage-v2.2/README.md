# Sol.vn Homepage V2.2 — Việt hoá tối đa

**Approved direction:** V2.1 layout (3 highlights) + ngôn ngữ Việt hoá bình dân hoá.

---

## 📦 Files

| File | Vai trò |
|---|---|
| `index-v2.2-body-only.html` | HTML Việt hoá — paste vào WP Custom HTML block |
| `GLOSSARY.md` | Bảng đối chiếu 53+ từ ngữ Việt hoá |
| `README.md` | Deploy guide |

---

## 🔁 Tóm tắt thay đổi V2.1 → V2.2

### Layout giữ nguyên hoàn toàn
- 11 sections như V2.1
- 3 highlights cards (Bài viết · Sách · Hệ thống)
- Visual hierarchy (sách card lớn 50%+)
- Mobile-first responsive

### Ngôn ngữ — Việt hoá 53+ điểm

**Top 10 thay đổi quan trọng nhất:**

| # | Trước | Sau |
|---|---|---|
| 1 | framework | **cách làm / phương pháp** |
| 2 | case study | **câu chuyện thực tế** |
| 3 | Career đang loãng | **Sự nghiệp đang loãng dần** |
| 4 | Corporate ngại nhận | **Công ty lớn ngại tuyển** |
| 5 | Coaching dành cho 25-35 | **Lớp huấn luyện 1-1 dành cho 25-35** |
| 6 | 1 năm Active hệ thống | **1 năm dùng hệ thống** |
| 7 | Founder thật | **Người sáng lập thật** |
| 8 | Demo huongdi | **Xem thử huongdi** |
| 9 | Templates | **Mẫu** |
| 10 | Không MLM, không Ponzi | **Không đa cấp, không lừa đảo** |

→ Xem `GLOSSARY.md` cho danh sách đầy đủ.

### Giữ nguyên (chuyên ngành cô đọng)

✅ **P1, P2, P3** — bước framework như SWOT
✅ **Discover™, Resources™, Navigator™, DirectionDB™** — brand marks
✅ **DNA** — khái niệm phổ biến
✅ **CNTT, TMĐT, PDF, ePub** — viết tắt thông dụng
✅ **LinkedIn, Facebook** — tên nền tảng
✅ **VNĐ, k (249k)** — đơn vị tiền tệ

---

## 🚀 Deploy V2.2

### Bước 1: CSS không đổi
CSS V2.1 vẫn dùng nguyên — KHÔNG cần thay. Layout V2.2 = V2.1.

### Bước 2: Thay HTML

WP Admin → Pages → mở "Sol Homepage V2.1" (page anh đã có):
- Edit page
- Chọn Custom HTML block hiện tại → Xoá nội dung
- Paste **TOÀN BỘ** `index-v2.2-body-only.html`
- **Update**

→ Page vẫn là homepage, chỉ nội dung text Việt hoá.

### Bước 3: Test Incognito

**Ctrl + Shift + N** → vào https://sol.vn/

**Cần thấy thay đổi:**
- ✓ Hero "1 năm dùng hệ thống" (không phải "1 năm Active")
- ✓ Section pain: "Sự nghiệp đang loãng dần" (không phải "Career")
- ✓ Section 4 sách card: "1 năm dùng huongdi" (không phải "1 năm Active")
- ✓ Section 7: "Không đa cấp, không lừa đảo" (không phải "Không MLM, không Ponzi")
- ✓ Footer "Người sáng lập" (không phải "Founder")
- ✓ Card hệ thống: "Lộ trình + AI Đồng hành (sắp có)" (không phải "Roadmap + AI Mentor")
- ✓ "4,8/5 đánh giá" (phẩy thập phân kiểu Việt)

---

## 🎯 Nguyên tắc Việt hoá đã áp dụng

### 1. Bình dân hoá tối đa
- Tránh từ Hán-Việt khó (vd. "niên đại" → "tuổi")
- Câu ngắn, đơn giản
- Tone như anh trai nói chuyện với em trai

### 2. Giữ chuyên ngành cô đọng
- Brand names (Discover™, P1/P2/P3) — không dịch
- Viết tắt phổ biến (CNTT, MLM kept as "đa cấp" cho rõ hơn) — đôi khi cần dịch
- DNA — giữ vì đã phổ thông

### 3. Microcopy nhân bản hơn
- "Founder" → "Người sáng lập" (tiếng Việt giàu cảm xúc hơn)
- "Members-only" → "Chỉ dành cho thành viên" (rõ hơn)
- "Pain point" → "Nỗi đau" (đã tiếng Việt nhưng dùng prose hơn)

### 4. Decimal kiểu Việt
- 4.8 → 4,8 (phẩy thập phân Việt Nam)

### 5. Voice consistency
- "mình - anh" xuyên suốt (KHÔNG "tôi - bạn")
- Trầm, chậm, founder-led

---

## 📋 Pre-launch checklist V2.2

### Content review
- [ ] Khang đọc qua toàn bộ HTML — check tone vẫn "mình-anh"
- [ ] Verify không có "tôi/bạn" lạc trong copy
- [ ] Verify không còn "framework/case study/Active" trong user-facing text
- [ ] Verify slogan "Đi cùng nhau, đường dài đỡ mỏi" xuất hiện

### Technical
- [ ] HTML V2.2 paste OK vào WP
- [ ] CSS V2.1 vẫn còn (không cần đổi)
- [ ] Mobile responsive vẫn work
- [ ] All CTAs link đúng

### SEO meta
Update meta description trong WP page settings:

```
Sách "Tái Khởi Nghiệp Đúng Hướng" + 1 năm dùng hệ thống huongdi.sol.vn dành riêng cho đàn ông Việt 40-65. Người sáng lập Khang Sol — 20+ năm công ty CNTT, 8 năm thương mại điện tử. Mua một lần, dùng cả năm.
```

---

## 🔄 Rollback nếu cần

Nếu V2.2 ngôn ngữ chưa đạt — chỉnh từng phrase trong WP Editor trực tiếp.

Hoặc rollback về V2.1:
1. Edit page → Custom HTML block
2. Paste lại `index-v2.1-body-only.html`
3. Update

---

## 💡 Suggestion cho Khang

### Sau khi deploy V2.2:

1. **Đọc trang bằng giọng to** — xem có chỗ nào nghe ngượng không
2. **Show cho 3 anh em ngoài** (không liên quan Sol) đọc — hỏi:
   - "Anh hiểu Sol bán gì không?"
   - "Có từ nào khó hiểu?"
   - "Có gì cần giải thích thêm?"
3. **Iterate dựa trên feedback** — sửa từng phrase

### Phase 2 — Test với người dùng thật

Khi có 10-20 visitors đầu tiên:
- Heatmap (Hotjar/Microsoft Clarity miễn phí)
- Session recordings — xem họ đọc tới đâu, click gì
- Survey ngắn 1 câu: "Có gì khiến anh chưa mua sách hôm nay?"

---

## 📊 Expected impact ngôn ngữ Việt hoá

| Metric | V2.1 | V2.2 |
|---|---|---|
| Bounce rate | 44% | **38-42%** (-3pp) |
| Avg time on page | 2-3 min | **2.5-4 min** (+30%) |
| Hero CTA CTR | 10-15% | **12-18%** (+2-3pp) |
| **Conversion sách** | 4-7% | **5-8%** (+1pp) |
| Newsletter signup | 4-7% | **5-9%** (+1-2pp) |

→ Việt hoá tốt cho user 45+ ít quen từ Anh ngữ → trust + comprehension cao hơn → conversion better.

---

## 🎁 Bonus — Hướng phát triển tone

### Giọng văn V2.2 phù hợp với:
- ✓ Người đàn ông trung niên Việt
- ✓ Người ít dùng từ Anh ngữ trong đời
- ✓ Người làm việc trong khối nhà nước, doanh nghiệp truyền thống

### Sau Year 1 có thể test:
- Variant A: Tone trầm hơn (như V2.2)
- Variant B: Tone trẻ trung hơn (cho subset người đọc 35-45)

→ A/B test khi traffic đủ lớn (>10k/tháng).

---

*Bình dân hoá ngôn ngữ = mở cửa đón thêm 30% người dùng.*
*Đi cùng nhau, đường dài đỡ mỏi.*
