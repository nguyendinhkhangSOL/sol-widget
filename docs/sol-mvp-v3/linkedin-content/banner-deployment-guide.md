# 🎨 LinkedIn Banner — Deployment Guide

## 📐 Specs bắt buộc

- **Kích thước:** 1584 × 396 px (ratio 4:1)
- **Format:** PNG hoặc JPG (không upload SVG được)
- **Max file size:** 8 MB
- **Mobile safe area:** 1350 × 220 px trung tâm (tránh nội dung quan trọng bị cắt)

## 🎯 3 Options anh chọn 1

| Option | Đặc điểm | Phù hợp khi... |
|---|---|---|
| **A. Executive** | Bold "Đúng hướng. Đúng bước. Đúng tương lai." + Sol S mark | Muốn nhấn TAGLINE + brand personality |
| **B. Framework** | 5 Bước visualization horizontal | Muốn user thấy NGAY hệ thống 5 Bước |
| **C. Numbers** | 37 · 90 · 5 impact | Muốn ấn tượng NUMERIC + data-driven |

**Mình recommend:** Option A cho khởi đầu (build brand recognition). Sau 3 tháng có thể swap sang B hoặc C.

---

## 🔧 Convert SVG → PNG

### Cách 1 — Online converter (dễ nhất)

1. Vào **https://cloudconvert.com/svg-to-png**
2. Upload file SVG anh chọn (vd `banner-option-A-executive.svg`)
3. Click **Options** → set width **1584** height **396**
4. Convert → Download PNG

### Cách 2 — Trên Windows (Chrome)

1. Mở file SVG bằng Chrome
2. Right-click → **Save as PNG** (extension "Save Image as PNG" hoặc dùng DevTools)
3. Hoặc: F12 → Elements → chuột phải vào `<svg>` → Capture node screenshot

### Cách 3 — Figma (nếu anh có tài khoản)

1. Figma → New file
2. Frame 1584×396
3. Import SVG → Export as PNG 1x
4. Download

### Cách 4 — Nếu có tài khoản Canva

1. Canva → Custom size 1584×396
2. Upload SVG
3. Export PNG

---

## 📤 Upload lên LinkedIn

1. LinkedIn → Profile của anh Khang Sol
2. Click vào **banner hiện tại** (khu vực dài phía sau ảnh đại diện)
3. Chọn **Change photo**
4. Upload file PNG vừa convert
5. Preview: check cả **desktop và mobile view**
6. Chú ý: ảnh đại diện có thể che phần **bottom-left** — đây là lý do các banner mình design đều để text ở center + right
7. Click **Apply**

---

## 📱 Preview mobile safe area

Bố cục an toàn khi LinkedIn mobile crop:

```
┌────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐  │← Crop
│  │                                              │  │
│  │        ⬅ SAFE ZONE 1350 × 220 ⬇             │  │← Mobile visible
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │← Crop
└────────────────────────────────────────────────────┘
```

Text quan trọng phải nằm trong khung này. Nếu không mobile users sẽ mất một phần nội dung.

Cả 3 options mình đã design đều respect vùng này.

---

## 🎨 Custom color tweak (nếu muốn)

Nếu anh muốn tweak màu, mở SVG file bằng notepad/vscode và tìm:

```
Navy background: #0F172A → có thể đổi #1E293B (nhẹ hơn) 
Amber accent: #F59E0B → có thể đổi #D97706 (đậm hơn) hoặc #FBBF24 (nhạt hơn)
Text white: #FFFFFF → có thể đổi #F1F5F9 (mềm hơn)
```

Sau đó re-convert PNG.

---

## 🔄 A/B test suggestion

Nếu muốn test hiệu quả:
1. **Tháng 1-2:** Option A (Executive tagline)
2. **Tháng 3:** Đổi sang Option B (Framework 5 Bước)
3. **So sánh:** profile views, connection requests, follow rate
4. Chọn option nào performance tốt hơn

---

## ✅ Checklist trước upload

- [ ] File PNG đúng 1584×396 px
- [ ] File size < 8 MB
- [ ] Preview trên desktop OK
- [ ] Preview trên mobile OK (dùng LinkedIn app)
- [ ] Ảnh đại diện Khang Sol update chuyên nghiệp match banner
- [ ] Bio update có "sol.vn" (link tự động clickable)
- [ ] Headline update: "Người sáng lập Sol.vn | Đồng hành người Việt 40-60 tái khởi nghiệp đúng hướng"

---

## 🎯 Bonus — Ảnh đại diện Khang Sol

Banner mới nên có profile picture match:
- Business casual (áo sơ mi, không cà vạt)
- Background đơn giản (tường trắng/xám)
- Ảnh nhìn thẳng camera, mỉm cười nhẹ
- Ánh sáng tự nhiên (window light)
- Cắt vuông 800×800 px, sẽ crop tròn

Tips:
- Nếu chưa có ảnh chuẩn → chụp bằng điện thoại + đứng bên cửa sổ
- Hoặc dùng ảnh từ trang khang-sol/ trên sol.vn (đã có sẵn)

---

*Đúng hướng. Đúng bước. Đúng tương lai.*
