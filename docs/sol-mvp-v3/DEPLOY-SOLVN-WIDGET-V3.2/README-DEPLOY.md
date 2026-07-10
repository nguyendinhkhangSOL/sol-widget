# Deploy Widget V3.2 lên sol.vn — Package hoàn chỉnh

**Ngày build:** 2026-07-05
**Version:** Sol User Nav v3.2 (cross-domain, state-aware, responsive)

---

## 📦 5 files trong package này

| File | Đích trên cPanel | Ghi chú |
|------|-----------------|---------|
| `sol-user-nav.js` | `/public_html/wp-content/uploads/sol/sol-user-nav.js` | Widget JS (đè lên file cũ) |
| `sol-user-nav.php` | `/public_html/wp-content/mu-plugins/sol-user-nav.php` | Mu-plugin loader (đè lên file cũ) |
| `sol-default-template.php` | `/public_html/wp-content/mu-plugins/sol-default-template.php` | **PATCH:** Xóa `<script src="/sol-avatar-icon.js">` + nút "Bắt đầu miễn phí" trong header |
| `sol-post-template.php` | `/public_html/wp-content/mu-plugins/sol-post-template.php` | **PATCH:** Cùng patch trên |
| `sol-archive-template.php` | `/public_html/wp-content/mu-plugins/sol-archive-template.php` | **PATCH:** Cùng patch trên |

---

## 🚀 Deploy — 3 bước

### Bước 1: Upload đè 5 files qua cPanel File Manager

Chọn **"Overwrite existing files"** khi được hỏi. Set permission `644` cho tất cả.

### Bước 2: Xóa file JS cũ (nếu còn) ở root

Trong `/public_html/`, nếu vẫn thấy file `sol-avatar-icon.js` → **Delete**

### Bước 3: Purge LiteSpeed Cache

WP Admin → **LiteSpeed Cache → Toolbox → Empty Entire Cache**

Rồi hard refresh (Ctrl+Shift+R) `https://sol.vn/`

---

## ✅ Verify sau deploy

| Test | Kết quả kỳ vọng |
|------|-----------------|
| Vào `https://sol.vn/` | Không còn icon khóa vàng góc dưới phải |
| Header menu | Không còn nút "Bắt đầu miễn phí →" (bỏ CTA cũ) |
| Góc trên phải | Xuất hiện nút vàng **"🧭 Vào Sol La Bàn →"** (widget V3) |
| Click nút | Chuyển sang `https://huongdi.sol.vn/dang-ky/` |
| Vào `https://sol.vn/khang-sol/` (blog post) | Widget V3 vẫn hiện góc phải trên |
| Vào `https://huongdi.sol.vn/` (chưa login) | Nút đen **"Đăng nhập"** góc phải trên |
| Login → `https://huongdi.sol.vn/toi/` | Avatar pill với tier + logout menu |

---

## 🔄 Rollback (nếu cần)

Files bản CŨ backup ở:
```
C:\BOTHUOCLA\sol-widget\docs\sol-mvp-v3\SESSION-BACKUP-2026-07-02-V1.2\templates\
```

Chỉ cần upload đè các file trong backup này qua cPanel → về trạng thái trước.

---

## 📋 Changelog (v3.2)

**Templates:**
- ❌ Removed: `<a href="https://huongdi.sol.vn/thau-hieu/" class="sol-cta-header">Bắt đầu miễn phí →</a>`
- ❌ Removed: `<script src="/sol-avatar-icon.js" defer></script>`
- ➕ Added: HTML comment marker "Widget V3.2 inject qua mu-plugin"

**mu-plugin `sol-user-nav.php`:**
- Version bump v3.1 → v3.2
- Deregister old `sol-avatar-icon` script trước khi inject widget V3
- Load JS từ `/wp-content/uploads/sol/sol-user-nav.js`

**Widget `sol-user-nav.js`:**
- Cross-domain aware (sol.vn brand vs huongdi.sol.vn product)
- 3 states: logged in (avatar pill) / anonymous product / anonymous brand (CTA)
- Responsive: desktop pill → tablet compact → mobile bottom sheet
- Auto-hide on scroll down, safe area env() cho iPhone notch
