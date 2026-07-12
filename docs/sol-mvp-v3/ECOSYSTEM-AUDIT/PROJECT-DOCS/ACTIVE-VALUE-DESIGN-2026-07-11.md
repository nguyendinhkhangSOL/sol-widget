# THIẾT KẾ GIÁ TRỊ GÓI ACTIVE — "Sau khi login & chọn hướng đi thì sao?"
## Phân tích thực trạng + Tối ưu thiết kế trải nghiệm trả phí
**Ngày:** 2026-07-11 · Vai: chuyên gia sản phẩm + CX + kinh doanh · Cho: Khang Sol

---

## 1. MÔ TẢ LUỒNG THỰC TẾ HIỆN TẠI (sự thật trần trụi)

**Kịch bản:** Chị Nga đã mua Active, login, làm quiz, ra `/ket-qua/`, bấm 1 hướng đi (vd "Chấp bút SME"), vào `/chi-tiet/`.

**Điều thực sự xảy ra:**
1. Trang chi tiết hiện đủ **11 section chữ** (thay vì 6 như Free).
2. **Hết.** Không có nút "bắt đầu", không lưu vào đâu, không công cụ, không theo dõi, không ai đồng hành.

**Nghĩa là:** với người trả tiền, "chọn hướng đi" hiện tại **gần như không làm gì cả** — chỉ mở khoá thêm chữ để đọc.

### Ba hệ thống "Sổ Hành Trình" đang rời rạc, không cái nào nối vào luồng thật:
| Hệ thống | Trạng thái | Vấn đề |
|---|---|---|
| Sổ cũ (`journey.ts` + `JourneyDay`) | Backend có: 90 ngày nhật ký, mood, wins, gate D30/60/90 | Gắn bảng `directions` cũ + `SavedDirection` mà UI mới KHÔNG tạo → chết |
| Sổ mới (`journey_*` 7 bảng partner) | Bảng tồn tại, thiết kế chuẩn (phases/actions/expenses/gates/events) | **Chưa có 1 dòng UI/API nào dùng** |
| Trang `/chi-tiet/` mới | LIVE | Không nối gì tới journey — chỉ hiện chữ |

---

## 2. ĐÁNH GIÁ: ACTIVE CÓ XỨNG 499K KHÔNG?

**Trả lời thẳng: Hiện tại CHƯA xứng.** Khác biệt Free vs Active bây giờ chỉ là:

| | Free | Active (499k/năm) |
|---|---|---|
| Thấy | 6/11 section | 11/11 section |
| Bản chất | Đọc chữ | **Đọc thêm chữ** |
| Công cụ | ❌ | ❌ |
| Đồng hành | ❌ | ❌ |
| Theo dõi tiến độ | ❌ | ❌ |
| Kết quả cam kết | ❌ | ❌ |

→ Người 40-60 **không trả 499k để đọc thêm 5 mục chữ.** Họ trả tiền để **thực sự bắt đầu được và không bỏ cuộc**. Đây là lỗ hổng giá trị lớn nhất của sản phẩm.

**Nguyên lý:** Free bán *"aha, hướng này hợp tôi"*. Active phải bán *"và đây là cách tôi thực sự đi được 90 ngày đầu mà không lạc"*. Hiện Active chưa giữ lời hứa đó.

---

## 3. TỐI ƯU THIẾT KẾ — Active = CÔNG CỤ, không phải TÀI LIỆU

### Ý tưởng lõi: "Nhân bản hướng đi → Sổ Hành Trình 90 ngày của riêng tôi"

Khi user Active bấm **"🚀 Bắt đầu hành trình này"** ở cuối trang chi tiết:
1. Hệ thống **nhân bản** mục 9 (Lộ trình 90 ngày) của hướng đi → tạo bản thể riêng trong `journey_*` (đúng thiết kế partner).
2. User có một **Sổ Hành Trình sống**, không phải trang chữ tĩnh.

### Sổ Hành Trình Active gồm (dùng đúng 7 bảng đã có):
| Thành phần | Bảng | Giá trị cho chị Nga |
|---|---|---|
| **3 chặng × việc cần làm (tick được)** | journey_phases + journey_actions | "Hôm nay tôi làm gì" — rõ ràng, tick xong thấy tiến |
| **Nhật ký + cảm xúc mỗi tuần** | notebooks / journey_events | Không bỏ cuộc vì thấy mình đang đi |
| **Sổ chi tiêu thực tế** | journey_expenses | Kiểm soát vốn — nỗi sợ lớn nhất của persona |
| **3 cổng quyết định (30/60/90 ngày)** | journey_gates | "Tiếp / Chỉnh / Dừng" — quyết định có dữ liệu, không cảm tính |
| **Sol Đồng Hành AI kèm theo ngữ cảnh** | sol_chat + journey | Hỏi đáp riêng cho hướng đi + chặng đang đi (đã có API AI) |
| **Ân hạn không cắt ngang** | (ADR) | Đang đi 90 ngày mà hết gói vẫn được ghi tick tới hết chặng |

### Ma trận Free vs Active MỚI (rõ ràng, đáng tiền):
| | Free | Active |
|---|---|---|
| Làm quiz + Top hướng đi | ✅ | ✅ |
| Xem 6 section "có phải cho tôi" | ✅ | ✅ |
| 5 section chuyên sâu (con số, pháp lý, case, lộ trình) | 🔒 | ✅ |
| **Nhân bản lộ trình 90 ngày → Sổ riêng** | ❌ | ✅ **(giá trị lõi)** |
| **Checklist việc tick được + tiến độ** | ❌ | ✅ |
| **Nhật ký + sổ chi tiêu** | ❌ | ✅ |
| **3 cổng quyết định có dữ liệu** | ❌ | ✅ |
| **Sol Đồng Hành AI kèm ngữ cảnh** | ❌ | ✅ |
| **Nhắc & giữ nhịp 90 ngày** | ❌ | ✅ |

→ Lúc này Active không bán "chữ", mà bán **"người đồng hành + công cụ để thực sự đi"**. Đó là thứ đáng 499k với người sợ bắt đầu một mình.

---

## 4. VÌ SAO ĐÂY LÀ ĐÒN BẨY KINH DOANH
- **Chuyển đổi:** paywall mạnh hơn — "mở khoá để BẮT ĐẦU", không phải "mở khoá để ĐỌC".
- **Giữ chân / tái tục:** user quay lại mỗi ngày tick việc → thói quen → gia hạn. Sổ chữ tĩnh thì đọc 1 lần là quên.
- **Truyền miệng:** người đi được 90 ngày có kết quả → case study thật (gỡ luôn P5 "case study placeholder").
- **Dữ liệu:** journey_events cho biết ai đang đi, ai đứng lại → cứu vãn (email nhắc), đo hiệu quả từng hướng đi.

---

## 5. KẾ HOẠCH TRIỂN KHAI (đề xuất)

**Phase A — Nối Sổ Hành Trình (P0):**
1. API `POST /api/journeys/from-template` — nhân bản mục 9 của model → journey_phases + journey_actions.
2. Nút "🚀 Bắt đầu hành trình này" ở `/chi-tiet/` (chỉ Active).
3. Trang `/so-hanh-trinh/` — hiện 3 chặng, tick action, thanh tiến độ.

**Phase B — Làm sống Sổ:**
4. Nhật ký + sổ chi tiêu (journey_expenses) + journey_events (audit).
5. 3 cổng quyết định 30/60/90 (journey_gates) — "Tiếp/Chỉnh/Dừng".

**Phase C — AI + giữ nhịp:**
6. Nhúng Sol Đồng Hành AI vào Sổ (ngữ cảnh hướng đi + chặng).
7. Nhắc nhở (email/Zalo) giữ nhịp; ân hạn rule.

---

## 6. KẾT LUẬN

Câu hỏi "Active có xứng tiền không?" hiện tại trả lời trung thực là **chưa** — vì mua xong chỉ được đọc thêm chữ. Nhưng **hạ tầng để làm nó xứng đã có sẵn 90%**: 7 bảng journey_* chuẩn, API AI, nội dung mục 9 (lộ trình 90 ngày) trong 64 hướng đi. **Chỉ còn thiếu lớp nối + UI Sổ Hành Trình.**

Đây phải là **ưu tiên P0 số 1** — quan trọng hơn cả tự động thanh toán, vì nó quyết định sản phẩm có đáng mua và đáng giữ hay không. Làm xong việc này, Sol chuyển từ *"web đọc định hướng nghề"* thành *"người đồng hành 90 ngày đầu khởi nghiệp"* — đúng lời hứa thương hiệu "Đi Cùng Sol".

_Tài liệu thiết kế · Sol Ecosystem · 2026-07-11 · nền tảng cho Phase tiếp theo._
