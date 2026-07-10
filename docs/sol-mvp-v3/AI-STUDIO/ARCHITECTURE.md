# AI Studio — Kiến trúc gộp 3 AI features

**Version:** 1.0 — 2026-07-06
**Đích:** Gộp 3 công cụ AI rời rạc thành 1 hub thống nhất, đặt cạnh "Sol La Bàn" trong menu.

---

## 🔍 Hiện trạng — 3 features rời rạc

| Feature | URL hiện tại | Vai trò | Access |
|---------|-------------|---------|--------|
| **Prompt Library** | `huongdi.sol.vn/prompts/` | 40 prompt template mẫu | Public (12 free preview) + Active (40 full) |
| **Prompt Studio** | `huongdi.sol.vn/prompts-studio/` | Editor biên tập prompt cá nhân, save vào Sổ Hành Trình | Active only |
| **Sol Đồng Hành AI** | `huongdi.sol.vn/toi/sol-dong-hanh/` | Chatbot Claude API, context awareness | Active only |

**Vấn đề:**
- 3 URLs khác nhau → user lạc lối
- Menu header không có entry rõ ràng → user không biết dùng gì
- Cross-referencing giữa 3 tools khó (VD: xem template → muốn edit → phải đổi tab)

## 💡 Giải pháp — AI Studio là "hub" duy nhất

```
┌────────────────────────────────────────────────────────────────┐
│  🎨 AI STUDIO                                                    │
│  Hub tất cả công cụ AI cho chuyên gia 40-60                     │
├────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [ 📚 Thư viện Prompt ]  [ ✏️ Biên tập ]  [ 🤖 Sol Đồng Hành ]  │
│                                                                   │
├─ TAB 1: THƯ VIỆN PROMPT (mặc định) ─────────────────────────────┤
│                                                                   │
│  Filter: [Tất cả ▼] [5 Bước ▼] [Ngành ▼] [FREE / ACTIVE]         │
│                                                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                    │
│  │ 🎯 Prompt 1 │ │ 🎯 Prompt 2 │ │ 🎯 Prompt 3 │  ...              │
│  │ Định vị    │ │ Định vị    │ │ Momentum   │                    │
│  │ FREE       │ │ ACTIVE 🔒  │ │ ACTIVE 🔒  │                    │
│  └────────────┘ └────────────┘ └────────────┘                    │
│                                                                   │
│  Click 1 prompt → Modal detail:                                  │
│    - Full prompt text                                             │
│    - [Copy] [Chỉnh sửa với AI (→ Tab 2)] [Chat với Sol (→ Tab 3)]│
│                                                                   │
├─ TAB 2: BIÊN TẬP PROMPT ────────────────────────────────────────┤
│                                                                   │
│  Editor textarea:                                                 │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ Bạn là chuyên gia tư vấn 40-60...                      │      │
│  │ [User type prompt cá nhân hoá]                         │      │
│  │                                                          │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                   │
│  Variables suggestions (base on user DNA + Vốn):                 │
│  [+ Vốn Uy tín 9/10] [+ DNA Expert 85] [+ Mô hình đã chọn]      │
│                                                                   │
│  [💾 Save vào Sổ Hành Trình] [🤖 Test với Sol AI]                 │
│                                                                   │
├─ TAB 3: SOL ĐỒNG HÀNH AI ───────────────────────────────────────┤
│                                                                   │
│  Chat UI với Sol AI (Claude backend):                            │
│                                                                   │
│  Sol AI: Chào [tên], anh/chị muốn thảo luận về...                │
│                                                                   │
│  You: Tôi vừa lập roadmap 90 ngày. Anh giúp tôi...               │
│                                                                   │
│  Context awareness: DNA + Vốn ngầm + Mô hình + Roadmap progress │
│                                                                   │
│  [Type message...]                                        [Send] │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UX Design decisions

### Vị trí menu

**Menu header mới:**
```
📖 Sách · 🧭 Sol La Bàn · 🎨 AI Studio · 🎯 Kiểm tra 3 phút · ✍️ Bài viết · 👤 Khang Sol
```

Ở BOTH:
- `sol.vn` menu (branding hub, invite anonymous)
- `huongdi.sol.vn` menu (product, active features)

### URL structure

**Recommended:**
```
huongdi.sol.vn/ai-studio/              → Landing tab 1 (Thư viện Prompt)
huongdi.sol.vn/ai-studio/?tab=edit     → Tab 2 (Biên tập)
huongdi.sol.vn/ai-studio/?tab=chat     → Tab 3 (Chat)
huongdi.sol.vn/ai-studio/prompt/:id    → Direct link tới template detail
```

Deep-linking cho SEO + share.

### Access tiers

| Feature | FREE tier | ACTIVE tier |
|---------|-----------|-------------|
| Tab 1 view templates | ✅ Full 40 preview | ✅ Full |
| Tab 1 copy prompt | ✅ 12 templates | ✅ 40 templates |
| Tab 2 editor | ⚠️ Preview locked | ✅ Full editor + save |
| Tab 3 Sol AI chat | ⚠️ 3 messages demo | ✅ Unlimited |

Freemium — Tab 1 hook, Tab 2+3 upgrade drivers.

### Legacy URLs — 301 redirects

```
/prompts/           → /ai-studio/                 (tab 1)
/prompts-studio/    → /ai-studio/?tab=edit        (tab 2)
/toi/sol-dong-hanh/ → /ai-studio/?tab=chat       (tab 3)
```

Backward compat, không mất SEO.

---

## 🏗 Implementation Phases

### Phase 1: Design + Prototype (session này)

- ✅ Design doc này
- ⏳ Wireframe HTML mockup (single-page với 3 tabs)
- ⏳ Menu update mockup

### Phase 2: Merge frontend (session sau — 1 ngày dev)

**File mới:** `/var/www/huongdi/public/ai-studio/index.html`

**Cấu trúc:**
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <header>...Sol header với menu new item "AI Studio"...</header>
  <main>
    <div class="tab-nav">
      <button class="tab-btn active" data-tab="library">📚 Thư viện</button>
      <button class="tab-btn" data-tab="editor">✏️ Biên tập</button>
      <button class="tab-btn" data-tab="chat">🤖 Sol Đồng Hành</button>
    </div>
    <div class="tab-content" id="tab-library">
      <!-- Merge content từ /prompts/index.html -->
    </div>
    <div class="tab-content" id="tab-editor">
      <!-- Merge content từ /prompts-studio/index.html -->
    </div>
    <div class="tab-content" id="tab-chat">
      <!-- Merge content từ /toi/sol-dong-hanh/index.html -->
    </div>
  </main>
</body>
</html>
```

**Cross-tab actions:**
- Click prompt trong Tab 1 → "Chỉnh sửa" → activate Tab 2 với prompt loaded
- Click prompt trong Tab 1 → "Chat với Sol" → activate Tab 3 với prompt as first message

### Phase 3: 301 Redirects (30 phút)

Nginx config or static redirect files ở 3 URLs cũ.

### Phase 4: Update menu ecosystem (1 giờ)

- sol.vn: `sol-default-template.php`, `sol-post-template.php`, `sol-archive-template.php`, `sol-landing-template-v3.php`
- huongdi.sol.vn: `header snippet`, `sol-ui.js` (nav menu)

### Phase 5: SEO cleanup (30 phút)

- Update sitemap
- Update internal links trong bài viết SEO
- Update Google Search Console (submit new URL, deprecate old)

---

## 📊 Kỳ vọng sau launch

**UX metrics:**
- User time-on-page AI features tăng 40%+ (tất cả ở 1 chỗ)
- Cross-feature adoption tăng 60%+ (dễ chuyển tabs)
- FREE → ACTIVE conversion tăng 20%+ (Tab 2, 3 làm hook rõ)

**Technical:**
- 3 URLs cũ → 1 URL mới (SEO consolidation)
- Menu items: 6 (giảm noise so với 7 cũ)
- Code maintenance: 1 file thay 3 (dễ update)

---

## ❓ Câu hỏi cần anh quyết trước khi build

1. **AI Studio placement:**
   - Chỉ huongdi.sol.vn (product-only) — Recommended
   - Both sol.vn + huongdi.sol.vn (marketing + product)

2. **Menu name:**
   - "🎨 AI Studio" (short, catchy)
   - "🎨 Sol AI Studio" (branded)
   - "🤖 Công cụ AI" (Vietnamese)

3. **Tab default landing:**
   - Tab 1: Thư viện (Recommended — free preview → hook)
   - Tab 2: Editor
   - Tab 3: Chat

4. **Free tier access:**
   - Tab 1 xem hết 40 templates preview, copy được 12 (Recommended)
   - Tab 1 chỉ xem 12 templates, khoá 28
