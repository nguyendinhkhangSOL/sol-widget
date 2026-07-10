# Footer sol-ui.js Patch — Thêm Hotline + Contact Info

## 🎯 Mục tiêu

Thêm thông tin liên hệ (Hotline + Zalo + Email) vào footer của **mọi trang** trong sol-ui.js.

## 📋 Cách 1 — Patch trên VPS bằng Python (khuyến nghị)

SSH vào VPS, chạy 1 khối:

```bash
# Backup sol-ui.js
sudo cp /var/www/huongdi/public/sol-ui.js /var/www/huongdi/public/sol-ui.js.bak-$(date +%Y%m%d-%H%M)

# Patch bằng Python (an toàn hơn sed cho JS)
sudo python3 <<'PYEOF'
path = '/var/www/huongdi/public/sol-ui.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Đoạn HTML footer contact cần chèn
CONTACT_HTML = '''
<div class="sol-footer__contact-strip" style="background:#0F172A;color:#fff;padding:16px 24px;border-top:1px solid #1E293B;">
  <div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-size:13.5px;">
    <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
      <a href="tel:02439931800" style="color:#F59E0B;text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        📞 024.3993.1800
      </a>
      <a href="https://zalo.me/0912727381" target="_blank" style="color:#CBD5E1;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
        💬 Zalo 0912.727.381
      </a>
      <a href="mailto:hello@sol.vn" style="color:#CBD5E1;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
        📧 hello@sol.vn
      </a>
    </div>
    <a href="/lien-he/" style="color:#F59E0B;text-decoration:none;font-weight:600;">Xem tất cả kênh liên hệ →</a>
  </div>
</div>
'''

# Marker: chèn vào TRƯỚC dòng '<div class="sol-footer__bottom">'
# hoặc TRƯỚC '</footer>' đóng
marker = '<div class="sol-footer__bottom"'
if marker in content:
    content = content.replace(marker, CONTACT_HTML.strip() + '\n<div class="sol-footer__bottom"')
    print("✅ Injected contact strip trước sol-footer__bottom")
else:
    # Fallback: chèn trước </footer>
    if '</footer>' in content:
        content = content.replace('</footer>', CONTACT_HTML.strip() + '\n</footer>')
        print("✅ Injected contact strip trước </footer>")
    else:
        print("❌ Không tìm thấy marker phù hợp")
        exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ Đã lưu sol-ui.js")
PYEOF

# Verify
sudo grep -c "024.3993.1800" /var/www/huongdi/public/sol-ui.js
echo "✅ FOOTER PATCH APPLIED"
```

Verify output kỳ vọng:
```
✅ Injected contact strip trước sol-footer__bottom
✅ Đã lưu sol-ui.js
1
✅ FOOTER PATCH APPLIED
```

## 📋 Cách 2 — Manual patch (nếu Python không work)

SSH vào VPS:

```bash
sudo nano /var/www/huongdi/public/sol-ui.js
```

Tìm dòng có `sol-footer__bottom` (Ctrl+W trong nano), chèn khối HTML sau **NGAY TRƯỚC** dòng đó:

```html
<div class="sol-footer__contact-strip" style="background:#0F172A;color:#fff;padding:16px 24px;border-top:1px solid #1E293B;">
  <div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-size:13.5px;">
    <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
      <a href="tel:02439931800" style="color:#F59E0B;text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        📞 024.3993.1800
      </a>
      <a href="https://zalo.me/0912727381" target="_blank" style="color:#CBD5E1;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
        💬 Zalo 0912.727.381
      </a>
      <a href="mailto:hello@sol.vn" style="color:#CBD5E1;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
        📧 hello@sol.vn
      </a>
    </div>
    <a href="/lien-he/" style="color:#F59E0B;text-decoration:none;font-weight:600;">Xem tất cả kênh liên hệ →</a>
  </div>
</div>
```

**Nếu file bọc trong JS string** (template literal `\` `\` `\``), cần escape backticks + $ ký tự.

Lưu: `Ctrl+O` → Enter → `Ctrl+X`

## 🧪 Test sau patch

```bash
# Verify hotline có trong sol-ui.js
sudo grep "024.3993.1800" /var/www/huongdi/public/sol-ui.js | head -1
```

Mở browser Incognito → truy cập bất kỳ trang nào (VD huongdi.sol.vn/) → cuộn xuống cuối:

**Phải thấy:**
```
📞 024.3993.1800    💬 Zalo 0912.727.381    📧 hello@sol.vn    Xem tất cả kênh liên hệ →
```

Trên dải màu **navy đậm** với hotline **amber**.

## 🛡️ Rollback nếu lỗi

```bash
sudo ls /var/www/huongdi/public/sol-ui.js.bak-*
sudo cp /var/www/huongdi/public/sol-ui.js.bak-<TIMESTAMP> /var/www/huongdi/public/sol-ui.js
```
