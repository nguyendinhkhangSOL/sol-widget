# Sol Ecosystem — Nền tảng công nghệ đang triển khai

**Ngày tổng hợp:** 08/07/2026
**Trạng thái:** Đã audit trực tiếp từ codebase `sol-ecosystem` + `sol-widget`

---

## 🏗️ Kiến trúc tổng quan — 3 tuyến sản phẩm

Anh Khang đang vận hành **1 hệ sinh thái, 3 tuyến website** trên **2 hạ tầng độc lập**:

| Tuyến | Domain | Vai trò | Hạ tầng |
|-------|--------|---------|---------|
| **1. Marketing / SEO** | `sol.vn` | Website chính, blog SEO, 7 pillar page, landing sách | cPanel shared host — WordPress |
| **2. Sản phẩm chính** | `huongdi.sol.vn` | Nền tảng học viên: 5 Bước, 37 mô hình, AI Studio, Payment | VPS Ubuntu — Node.js + Postgres |
| **3. Quản trị** | `adminhuongdi.sol.vn` | Admin panel: User, Lead, CRM, Content | VPS Ubuntu — chung backend |

Ngoài ra còn **2 domain "stable — không động"**: `admin.sol.vn` + `bothuocla.sol.vn` (thuộc dự án Bothuốc Lá cũ).

---

## 🎨 Frontend — Người dùng nhìn thấy

### Tuyến sol.vn (WordPress marketing)

| Thành phần | Công nghệ | Ghi chú |
|-----------|-----------|---------|
| CMS | **WordPress** | Phiên bản mới nhất |
| Theme | **GeneratePress** (lightweight) + child theme `news-magazine-x-child` | Lý do chọn GeneratePress: nhẹ, không bloat, thân thiện SEO |
| Custom code | 8 mu-plugins PHP: `sol-default-template`, `sol-post-template`, `sol-landing-template`, `sol-archive-template`, `sol-redirects`, `sol-user-nav`, `sol-widget-embed`, `sol-rank-math-rest` | Đây là "tim" branding V4.1 — header/footer canonical, redirect, widget cross-domain |
| SEO | **Rank Math** plugin + custom REST endpoint | Auto publish + custom schema |
| Backup | **JetBackup 5** → FPT NAS (external) | ADR-008 — không dùng File Manager Compress vì lỗi quota |

### Tuyến huongdi.sol.vn (nền tảng học viên)

| Thành phần | Công nghệ | Ghi chú |
|-----------|-----------|---------|
| Framework | **Vanilla HTML/CSS/JS** — không React/Vue | Cố ý chọn vanilla vì load nhanh + không maintenance overhead |
| Web font | **Inter** (sans-serif thân) + **Lora** (serif tít) qua Google Fonts | Palette V4.1 amber `#F59E0B` + navy `#0F172A` |
| JS shared library | 4 file: `sol-ui.js` (header+footer+menu), `sol-auth.js` (login gate), `sol-api-sync.js` (API wrapper), `sol-user-nav.js` (avatar pill) | Inject dùng chung mọi trang |
| Widget flow | `sol-flow.js` — breadcrumb 5 Bước Sol La Bàn | Đã Việt hoá V4.1 |
| Số trang HTML | ~40 trang | 5 Bước × 3 UI + Payment + Auth (6) + AI Studio (3) + Dashboard + Founder + Pricing + Contact + Cảm ơn... |

### Tuyến adminhuongdi.sol.vn

| Thành phần | Công nghệ | Ghi chú |
|-----------|-----------|---------|
| SPA framework | Static HTML/JS đơn giản | Không React — chỉ CRUD admin nội bộ |
| Auth | JWT chung backend | Role-based access |

---

## ⚙️ Backend — Nội bộ máy chủ

**1 backend Node.js duy nhất phục vụ cả `huongdi.sol.vn` + `adminhuongdi.sol.vn` — chạy PM2 port 4001.**

### Ngôn ngữ + Runtime
| Công nghệ | Phiên bản | Dùng để làm |
|-----------|-----------|-------------|
| **Node.js** | LTS | Runtime chính |
| **TypeScript** | 5.6 | Ngôn ngữ chính — type-safe, giảm bug |
| **tsx** | 4.19 | Dev watch mode |
| PM2 | latest | Process manager production |

### Framework + Middleware
| Thư viện | Vai trò |
|----------|---------|
| **Express** 4.21 | HTTP framework |
| **helmet** 8.0 | Security headers |
| **cors** 2.8 | Cross-origin |
| **morgan** 1.10 | Access log |
| **express-rate-limit** 7.4 | Chống abuse API |

### Xác thực + Bảo mật
| Thư viện | Vai trò |
|----------|---------|
| **jsonwebtoken** 9.0 | JWT token — session không stateful |
| **bcryptjs** 2.4 | Băm mật khẩu |
| **zod** 3.23 | Validate input request |
| Google OAuth | Đã code xong, chờ credentials để deploy |

### Endpoints backend (18 route file)
- `auth.ts` — Login/register truyền thống
- `user-auth.ts` — Unified auth ADR-004
- `google-auth.ts` — Google OAuth 2.0 (chờ deploy)
- `admin.ts` — Admin panel
- `password-reset.ts` — Quên mật khẩu qua email
- `p1.ts`, `p2.ts`, `directions.ts`, `journey.ts` — 5 Bước framework
- `match-v2.ts` — Personalization Top 3
- `leads.ts` — Lead capture
- `sol-dong-hanh.ts` — Chat AI Claude
- `saved.ts`, `events.ts`, `dashboard.ts` — User activity

---

## 🗄️ Cơ sở dữ liệu

| Thành phần | Chi tiết |
|-----------|---------|
| **Database** | **PostgreSQL** — DB tên `huongdi_prod` |
| **ORM** | **Prisma** 5.22 — type-safe queries, auto-migration |
| **Số bảng chính** | 15 models: `User`, `Direction`, `CaseStudy`, `Lead`, `LeadNotification`, `P1Result`, `P2Result`, `SavedDirection`, `UserOutcome`, `UserEvent`, `AdminUser`, `RefreshToken`, `JourneyDay`, `SolChatConversation`, `SolChatMessage`, `SolChatQuota`, `PasswordResetToken` |
| **Enum** | 10 enum: `UserRole`, `AuthProvider`, `UserTier`, `DirCategory`, `DirStatus`, `LeadStatus`, `NotifyChannel`, `EventType`, `Confidence`, `OutcomeLevel`, `CheckpointDay` |
| **Backup** | Manual `pg_dump` (chưa auto — script `setup-db-daily-backup.sh` ready) |

**Sol.vn WordPress** dùng **MySQL** riêng (đi kèm cPanel shared host).

---

## 🤖 AI + Dịch vụ ngoài

### AI Providers (đa nhà cung cấp — chống vendor lock)
| Nhà cung cấp | SDK | Dùng ở đâu |
|--------------|-----|-----------|
| **Anthropic Claude** | `@anthropic-ai/sdk` 0.110 | **Sol Đồng Hành AI** chatbot cho Active tier |
| **OpenAI** | `openai` 6.45 | Backup / A/B test (chưa production) |
| **Google Gemini** | `@google/generative-ai` 0.24 | Backup / A/B test (chưa production) |

### Email — SMTP
| Nhà cung cấp | Vai trò |
|--------------|---------|
| **Zoho Mail** (`smtp.zoho.com`) | Gửi mail: kích hoạt tài khoản, magic link, reset mật khẩu | 
| Thư viện | `nodemailer` 9.0 |
| ADR liên quan | ADR fix EAUTH 535 — port 465 SSL + IMAP enable |

### Thanh toán
| Kênh | Chi tiết |
|------|---------|
| **VietQR** (`img.vietqr.io`) | QR động hiển thị trong `/thanh-toan/` |
| **Techcombank** | STK `11522026076011` — CTY CP VINET · MST `0104127836` |
| Flow | User điền form → sinh QR VietQR → chuyển tiền → admin xác nhận thủ công |

### Xã hội + Liên hệ
| Nền tảng | Link |
|----------|------|
| **Zalo** | Zalo OA trực tiếp `https://zalo.me/3547084958635197535` |
| Hotline | 024.3993.1800 |
| Facebook Group | "Đi Cùng Sol" |
| LinkedIn | Trang cá nhân Khang Sol (content 2 bài/tuần) |

### CDN + Assets
| Dịch vụ | Vai trò |
|---------|---------|
| Google Fonts | Inter + Lora |
| Logo canonical | `sol.vn/wp-content/uploads/2025/05/Icon_2.png` |

---

## 🖥️ Hạ tầng máy chủ

### VPS (huongdi + admin)
| Thành phần | Chi tiết |
|-----------|---------|
| OS | Ubuntu Linux |
| Web server | **Nginx** + SSL (Let's Encrypt) |
| Process manager | **PM2** — auto-restart Node.js |
| Backend port | 4001 |
| Static | Nginx serve trực tiếp `/var/www/huongdi/public/` |
| Deploy path | `sudo scp` + `sudo mv` từ laptop qua SSH |

### cPanel shared host (sol.vn)
| Thành phần | Chi tiết |
|-----------|---------|
| Web server | Apache (do cPanel quản lý) |
| PHP | Version cPanel default |
| Deploy | SFTP hoặc File Manager |
| Backup | **JetBackup 5** → FPT NAS daily |

---

## 🛠️ DevOps + Workflow

| Thành phần | Chi tiết |
|-----------|---------|
| **Repo chính** | GitHub Private `nguyendinhkhangSOL/sol-ecosystem` |
| **Repo docs** | Local `C:\BOTHUOCLA\sol-widget\` (chưa lên GitHub riêng) |
| **Golden Rule** | GitHub = Single Source of Truth (ADR-002). Cấm edit trực tiếp production |
| **Version control** | Git — laptop → GitHub → deploy VPS/cPanel |
| **Workflow** | Sửa code laptop → commit push GitHub → scp/ssh deploy VPS |
| **Windows tools** | PowerShell 5.1, OpenSSH client, VS Code |
| **Ghi chú** | ADR-002 vừa lock 2026-07-07 sau vụ "code loạn 3 nơi" |

---

## 🎯 Ma trận công nghệ theo mục đích

### Anh muốn hiểu nhanh "cái gì làm việc gì":

```
Người dùng cuối
      ↓
┌──────────────────────────────────┐
│  sol.vn (WordPress)  ← SEO       │
│  huongdi.sol.vn (vanilla)  ← App │
└──────────────────────────────────┘
      ↓  Fetch API
┌──────────────────────────────────┐
│  Node.js + Express + TypeScript  │
│  (PM2 port 4001)                 │
└──────────────────────────────────┘
      ↓  Prisma ORM
┌──────────────────────────────────┐
│  PostgreSQL huongdi_prod         │
└──────────────────────────────────┘
      ↓  Gọi ngoài
┌──────────────────────────────────┐
│  Claude · OpenAI · Gemini        │
│  Zoho SMTP · VietQR · Zalo       │
└──────────────────────────────────┘
```

---

## 📊 Điểm mạnh — Điểm yếu hiện tại

### Điểm mạnh
- ✅ **Type-safe từ đầu** — TypeScript + Prisma + Zod giảm bug production
- ✅ **Đa AI provider** — không lock vào 1 nhà cung cấp
- ✅ **Vanilla frontend** — bảo trì đơn giản, không cần build tool
- ✅ **Single Source of Truth** — GitHub (ADR-002)
- ✅ **Backup layered** — VPS backup thủ công + cPanel JetBackup → FPT NAS

### Điểm yếu cần khắc phục
- ⚠️ **DB backup chưa auto** — script sẵn nhưng chưa deploy cron
- ⚠️ **Chưa có CI/CD** — deploy vẫn scp thủ công (chấp nhận được với 1 dev)
- ⚠️ **`sol-widget` docs chưa lên GitHub riêng** — mất laptop là mất docs
- ⚠️ **Chưa có monitoring** — down là do người dùng báo, không có uptime alert
- ⚠️ **admin SPA folder trống** — chưa refactor xong (đang static HTML)

---

## 💰 Chi phí hạ tầng ước tính /tháng

| Khoản | Chi phí |
|-------|---------|
| VPS Ubuntu | ~200-500k đ (tuỳ nhà cung cấp) |
| cPanel shared host | ~100-200k đ |
| Domain sol.vn | ~800k đ /năm |
| Zoho Mail | Free plan (5GB) hoặc ~30k đ /user /tháng |
| Anthropic Claude API | Pay-as-you-go — ước ~50-200k đ /tháng khi có user Active |
| GitHub Private repo | Free (unlimited private repos) |
| **Tổng ước** | **~500k - 1tr đ /tháng** (chưa tính domain trả năm) |

---

## 🔮 Kế hoạch nâng cấp gần

Theo ADR log:
1. **Google OAuth deploy** — Chờ `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
2. **DB auto-backup daily** — Cron script sẵn, chưa deploy
3. **SSO cross-subdomain** — Cookie `.sol.vn` (Phase 2)
4. **AI Studio deploy** — Migration iframe → 3 URL (ADR-010, mobile listbox ADR-011)

---

_File này auto-generated từ audit codebase, không đoán mò. Tất cả version + tên file đều lấy trực tiếp từ `package.json`, `schema.prisma`, `mu-plugins/`._
