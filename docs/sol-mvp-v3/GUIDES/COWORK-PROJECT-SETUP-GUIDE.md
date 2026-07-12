# Hướng dẫn setup Cowork Project cho Sol Ecosystem
## Dành cho anh Khang · Không cần đọc code

**Ngày:** 08/07/2026
**Mục tiêu:** Setup 1 lần → dùng cho 6-10 tuần tới không phải paste lại instructions

---

## 🎯 3 việc anh làm 1 lần duy nhất

1. **Tạo Project** "Sol Ecosystem" trong Cowork
2. **Connect 2 folder** local
3. **Bookmark 3 prompt** template

Sau đó mỗi tuần chỉ mở Chat mới trong Project → dán prompt → làm việc.

---

## 📸 UI MOCKUP — Từng bước cụ thể

### Bước 1 — Mở Cowork app

```
┌─────────────────────────────────────────────────────┐
│  Cowork · Claude                              [_ □ ×]│
├─────────────────────────────────────────────────────┤
│                                                       │
│  📂 Projects              ➕ [+ New Project]  ← BẤM  │
│                                                       │
│  Recent chats:                                        │
│  • Session 2026-07-08 (Sol)                          │
│  • Session 2026-07-07 (Sol)                          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

Bấm **[+ New Project]** ở góc trên.

### Bước 2 — Điền thông tin Project

```
┌─────────────────────────────────────────────────────┐
│  Create New Project                          [× Đóng]│
├─────────────────────────────────────────────────────┤
│                                                       │
│  Project name * ─────────────────────────────────    │
│  │ Sol Ecosystem — Sol La Bàn V2              │    │  ← Copy
│  ────────────────────────────────────────────────    │
│                                                       │
│  Description ────────────────────────────────────    │
│  │ Sol La Bàn — Hệ thống định hướng nghề      │    │
│  │ nghiệp khoa học cho người Việt 40-60 tái   │    │  ← Copy
│  │ khởi nghiệp. 3 domain: sol.vn (WP) +       │    │
│  │ huongdi.sol.vn (Node.js) + admin.          │    │
│  ────────────────────────────────────────────────    │
│                                                       │
│  Custom instructions (tuỳ chọn) ─────────────────    │
│  │ [Xem Phần B ở dưới để copy full]           │    │
│  ────────────────────────────────────────────────    │
│                                                       │
│  📁 Connect folders:                                  │
│  ┌────────────────────────────────────────────┐     │
│  │ [+ Add folder]  ← BẤM 2 LẦN                │     │
│  └────────────────────────────────────────────┘     │
│                                                       │
│         [ Cancel ]  [ Create Project ] ← BẤM SAU     │
└─────────────────────────────────────────────────────┘
```

### Bước 3 — Add 2 folder (bấm "+ Add folder" 2 lần)

**Folder 1 — Docs:**
```
┌─────────────────────────────────────────────────────┐
│  Select folder                              [× Đóng]│
├─────────────────────────────────────────────────────┤
│                                                       │
│  📁 Local Disk (C:)                                   │
│   └── 📁 BOTHUOCLA                                    │
│         ├── 📁 sol-widget       ← CHỌN + [Select]    │
│         └── 📁 sol-ecosystem                          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Folder 2 — Code:**
Bấm "+ Add folder" lần nữa → chọn `sol-ecosystem`.

**Kết quả:**
```
Connected folders:
✅ C:\BOTHUOCLA\sol-widget
✅ C:\BOTHUOCLA\sol-ecosystem
```

### Bước 4 — Bấm [Create Project]

Project được tạo. Anh sẽ thấy:
```
┌─────────────────────────────────────────────────────┐
│  📂 Sol Ecosystem — Sol La Bàn V2                    │
├─────────────────────────────────────────────────────┤
│  📁 2 folders connected                              │
│  💬 0 chats                                          │
│                                                       │
│  [ + New Chat ]  ← BẤM để bắt đầu Chat đầu tiên      │
└─────────────────────────────────────────────────────┘
```

---

## 📋 PHẦN A — Copy "Description" (150 ký tự)

```
Sol La Bàn — Hệ thống định hướng nghề nghiệp cho người Việt 40-60 tái khởi nghiệp. 3 domain: sol.vn (WP marketing) + huongdi.sol.vn (Node.js product) + admin.
```

## 📋 PHẦN B — Copy "Custom instructions" (~1500 ký tự)

```
Bạn là AI assistant cho dự án Sol Ecosystem.

QUY TẮC LÀM VIỆC:

1. NGÔN NGỮ: Tiếng Việt bình dân cho user 40-60 (persona chị Nga 52 tuổi). Tránh jargon Anh trừ khi không thay được.

2. VỚI ANH KHANG (founder):
- Anh KHÔNG đọc code — chỉ text/URL/screenshot
- Luôn ship deploy commands sẵn copy-paste được
- Giải thích bằng bảng, sơ đồ, ma trận — không code line-by-line
- Ngắn gọn, ít bullet dài, có emoji có tổ chức

3. TRƯỚC KHI BẮT ĐẦU BẤT KỲ SESSION NÀO:
Đọc file: C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\SESSION-LOGS\2026-07-08-EOD-COMPREHENSIVE-WRAP.md
→ 458 dòng, 12 sections, có tất cả context Sol + roadmap + decisions.

4. KIẾN TRÚC LOCK (ADR-002, ADR-012):
- sol.vn = marketing/trust (WordPress)
- huongdi.sol.vn = product/app (Node.js + Postgres)
- Không trộn 2 tuyến
- GitHub = Single Source of Truth
- Schema DB đang migrate sang format đối tác (Phương án C)

5. ECOSYSTEM BRANDING:
- Logo: sol.vn/wp-content/uploads/2025/05/Icon_2.png
- Tagline: "Đi Cùng Sol" (Sol màu amber #F59E0B)
- Palette V4.1: amber #F59E0B + navy #0F172A
- Fonts: Inter + Lora
- Zalo hotline: zalo.me/3547084958635197535

6. TASK TRACKING: Dùng TaskCreate/TaskUpdate cho việc >3 bước.

7. KẾT THÚC MỖI PHIÊN LỚN: Ship EOD wrap trong C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\SESSION-LOGS\
```

---

## 📌 PHẦN C — 3 Prompt Bookmark (save vào Notes/Zalo)

### Prompt 1 — Vào phiên mới (mỗi tuần dùng)

```
Đọc file EOD wrap mới nhất trong C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\SESSION-LOGS\
(file có tên 2026-XX-XX-EOD-*.md)

Sau khi đọc xong, tóm tắt 3 câu:
1. Trạng thái hiện tại
2. Việc quan trọng nhất hôm nay
3. Câu hỏi/quyết định gì đang treo

Đợi anh xác nhận rồi bắt đầu.
```

### Prompt 2 — Kết thúc phiên (mỗi tuần dùng)

```
Ship EOD wrap cho phiên này. Include:
- Việc đã làm (deliverables)
- Decisions locked (ADR nếu có)
- Deploy queue (commands sẵn copy-paste)
- Pending items
- Kế hoạch tuần tới

Lưu vào C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\SESSION-LOGS\2026-XX-XX-EOD-WRAP.md
```

### Prompt 3 — Focus 1 chủ đề (khi có việc cụ thể)

```
Đọc EOD wrap phiên trước, sau đó tiếp [TÊN VIỆC].

Ví dụ:
- "tiếp Tuần 1 — Schema migration + seed 38 mô hình"
- "tiếp Tuần 3 — Đợt 1 P1 biên soạn 6 mô hình"
- "fix bug XXX trên trang YYY"
```

---

## ⚠️ TROUBLESHOOTING — 5 vấn đề thường gặp

### 1. Cowork không nhớ folder đã connect

**Hiện tượng:** Mở Chat mới, em nói "không truy cập được file".

**Fix:**
- Vào Project settings → verify "Connected folders" còn 2 entry
- Nếu mất → Add folder lại theo Bước 3
- Restart Cowork app

### 2. Em đọc file cũ (không phải file mới nhất)

**Hiện tượng:** Anh làm việc, em vẫn tham chiếu EOD wrap tuần trước.

**Fix:** Prompt rõ:
```
Đọc file EOD wrap MỚI NHẤT (theo lastmod) trong SESSION-LOGS folder, không phải file 2026-07-08.
```

### 3. Instructions không apply cho Chat mới

**Hiện tượng:** Em quên các rules "không đọc code", giọng lạc.

**Fix:**
- Vào Project settings → verify Custom instructions còn nội dung Phần B
- Nếu mất → paste lại

### 4. Chat window đầy quá — em chậm dần

**Hiện tượng:** Response chậm 2-3 phút mỗi câu.

**Fix:**
- Ship EOD wrap ngay
- Đóng Chat này, tạo Chat mới trong cùng Project
- Dán Prompt 1 để pick up

### 5. Muốn đổi Model (từ Opus sang Fable/Sonnet)

**Hiện tượng:** Anh muốn thử model khác cho tốc độ/cost.

**Fix:**
- Vào Chat settings → Model dropdown → chọn model mới
- Instructions Project vẫn apply
- EOD wrap giúp em pick up context — dù model khác

---

## 🎯 Checklist cuối — Anh làm 1 lần

- [ ] Tạo Project "Sol Ecosystem — Sol La Bàn V2"
- [ ] Điền Description (Phần A)
- [ ] Điền Custom Instructions (Phần B)
- [ ] Connect folder `C:\BOTHUOCLA\sol-widget`
- [ ] Connect folder `C:\BOTHUOCLA\sol-ecosystem`
- [ ] Save 3 Prompt bookmark vào Notes/Zalo (Phần C)
- [ ] Test Chat đầu tiên với Prompt 1
- [ ] Xác nhận em tóm tắt đúng 3 câu → workflow OK

---

## 💬 Message cho anh Khang

Anh cứ:
1. Đóng phiên hôm nay
2. Đọc guide này (10 phút)
3. Setup Project theo 4 bước
4. Test 1 Chat mới với Prompt 1 → verify em pick up OK
5. Mai bắt đầu Tuần 1 với Prompt 3

Nếu setup gặp vướng mắc — anh screenshot dialog Cowork gửi qua Zalo, em xem xét mai fix cho.

---

_Guide này lưu tại: `C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\GUIDES\COWORK-PROJECT-SETUP-GUIDE.md`_
_Phiên bản: V1.0 · 08/07/2026 · Không cần update trừ khi Cowork đổi UI._
