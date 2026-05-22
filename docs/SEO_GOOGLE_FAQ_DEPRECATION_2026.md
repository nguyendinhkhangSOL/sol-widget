# SEO Strategy Update — Google FAQ Deprecation 2026

**Date**: 22/5/2026 · **Trigger**: Google notification + đối tác consult

---

## 📅 Timeline

| Mốc | Sự kiện |
|---|---|
| **7/5/2026** | Google ngừng hiển thị FAQ rich result trên Search |
| **6/2026** | Google ngừng Search Console rich result report cho FAQ + Rich Result Test tool support |
| **8/2026** | Google ngừng Search Console API support cho FAQ |

---

## 🎯 Quyết định Sol

### Bài cũ (143 bài đã có FAQPage schema) — GIỮ NGUYÊN

**Lý do:**
1. **Không bị penalty** — Google chỉ ignore, không phạt
2. **AI crawlers vẫn parse** — Bing Copilot, ChatGPT, Perplexity, Claude, Gemini đều dùng FAQ markup để tạo answer
3. **UX value** — visible `<details>/<summary>` FAQ section vẫn giúp user
4. **Effort = 0** — không cần migrate gấp

### Bài MỚI (Sprint 31-5 và sau) — KHÔNG inject FAQ

**Schema strategy mới:**

| Loại bài | Schema | Lý do |
|---|---|---|
| **Tutorial** ("Cách bỏ thuốc 7 ngày") | `HowTo` | Google vẫn support rich result 2026 |
| **Q&A đơn** ("Bao lâu phổi sạch sau bỏ thuốc?") | `QAPage` | Khác FAQPage — single Q&A vẫn support |
| **Comparison** ("App cai thuốc tốt nhất 2026") | `Article` + comparison table | Featured Snippet candidate |
| **Story/Narrative** ("Khang đã sạch thuốc từ 2021") | `Article` | Default best |
| **Brand/Author bio** | `Person` + `Article` | E-E-A-T |

---

## 🤖 Strategy chính: AI-First Content

Google đang chuyển sang **AI Overviews** (kết quả AI generative ở top, thay 10 link xanh). Để Sol "sống" được trong AI search:

### Cả Featured Snippet + AI Overviews yêu cầu cùng 1 thứ:
1. **Câu trả lời ngắn gọn 30-50 từ** ở đầu bài → "TL;DR"
2. **H2 dạng câu hỏi** ("Cách bỏ thuốc bao lâu thì phổi sạch?")
3. **Số liệu cụ thể + source** (WHO 2024, CDC 2023, Bộ Y tế VN)
4. **Author block** ("Khang Sol · Sạch thuốc từ 2021 · Cập nhật 22/5/2026") — E-E-A-T
5. **Schema sạch** (HowTo > FAQ > nothing)
6. **Internal links** dày → topical authority

### AI crawler verification (đã setup, vẫn LIVE):
- ✅ `llms.txt` (chuẩn 2025 cho AI crawlers)
- ✅ Cloudflare Worker `well-known endpoints` (7 endpoints)
- ✅ Markdown for Agents enabled
- ✅ Article Schema bulk added 125 bài
- ✅ Author Schema (/khang-sol + FB + LinkedIn)
- ✅ Person Schema (facts thực của Khang)

---

## 🛠️ Action items đã thực hiện

| # | Item | Status |
|---|---|---|
| 1 | Add DEPRECATED warning vào `auto-faq-from-content.js` | ✅ |
| 2 | Add DEPRECATED warning vào `inject-faq-schema.js` | ✅ |
| 3 | Block execution unless `--force-faq-deprecated` | ✅ |
| 4 | Tạo doc này | ✅ |
| 5 | Tạo `bulk-set-seo-v2.js` cho schema mới | 🚧 Plan B |
| 6 | Update template content `SEO_CONTENT_TEMPLATE_v2.md` | 🚧 Plan B |
| 7 | Viết outline + draft 7 bài Sprint 31-5 | 🚧 Plan C |

---

## 📚 Tham khảo

- [Google blog: FAQ rich result deprecation (2026-04)](https://developers.google.com/search/blog)
- [Schema.org HowTo](https://schema.org/HowTo)
- [Schema.org QAPage](https://schema.org/QAPage)
- [Google: AI Overviews + structured data](https://developers.google.com/search/docs/appearance/ai-overviews)
- [`llms.txt` standard](https://llmstxt.org/)
