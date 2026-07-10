# AI Studio Refactor — Iframe → Submenu Migration

**Version:** 1.0
**Date:** 2026-07-07
**Status:** Draft — chờ execute session sau
**Effort:** ~2.5 giờ

## Vấn đề

ADR-005 (iframe pattern) bị 2 issues mobile:
1. Nested scroll — iframe cuộn riêng ngoài body cuộn
2. Hero + tabs bar chiếm ~30% viewport → content view nhỏ

## URL structure MỚI (anh Khang locked)

| URL | Menu label | Nội dung hiện tại |
|-----|-----------|-------------------|
| `/ai-studio/` | Thư viện Prompt | Content của `/prompts/` |
| `/tao-prompts-ca-nhan/` | Biên tập cá nhân hoá | Content của `/prompts-studio/` |
| `/toi/sol-dong-hanh/` | Sol AI Đồng Hành | Giữ nguyên |

Menu chính: "🎨 AI Studio" → **dropdown submenu 3 items**

## Redirect landscape audit (đã check)

**HIỆN TẠI:**
| From | To | Type |
|------|-----|------|
| `/prompts/` | `/ai-studio/?tab=library` | JS redirect |
| `/prompts-studio/` | `/ai-studio/?tab=editor` | JS redirect |
| `/ai-studio/` | iframe container 3 tabs | Load iframes `?embed=1` |
| `/toi/sol-dong-hanh/` | standalone chat | Direct |

**SAU MIGRATION:**
| From | To | Reason |
|------|-----|--------|
| `/prompts/` | `/ai-studio/` | Legacy compat (content moved to /ai-studio/) |
| `/prompts-studio/` | `/tao-prompts-ca-nhan/` | Legacy compat (URL renamed) |
| `/ai-studio/?tab=library` | `/ai-studio/` (strip query) | Legacy compat |
| `/ai-studio/?tab=editor` | `/tao-prompts-ca-nhan/` | Legacy compat |
| `/ai-studio/?tab=chat` | `/toi/sol-dong-hanh/` | Legacy compat |

## Migration steps

### Step 1: Content migration (30 min)

**1a. Backup + Replace `/ai-studio/index.html`**
- Backup: `mv /ai-studio/index.html /ai-studio/index.html.bak-iframe`
- Copy content: `/prompts/index.html` → `/ai-studio/index.html`
- Update `<title>`: "🎨 AI Studio — Thư viện 40 Prompt AI cho người Việt 40-60"
- Update canonical: `https://huongdi.sol.vn/ai-studio/`
- Remove `embed=1` skip check trong widget scripts

**1b. Create `/tao-prompts-ca-nhan/index.html`**
- Create folder: `huongdi-public/tao-prompts-ca-nhan/`
- Copy: `/prompts-studio/index.html` → `/tao-prompts-ca-nhan/index.html`
- Update `<title>`: "✏️ Biên tập Prompt cá nhân hoá — Sol La Bàn"
- Update canonical
- Remove embed check + `.top-bar` hide (đã có sol-ui.js header)

**1c. `/toi/sol-dong-hanh/` giữ nguyên**
- Remove embed check JS (không còn iframe wrapper)
- Verify hoạt động standalone

### Step 2: Update redirects (15 min)

**2a. `/prompts/index.html`** — Replace all content với:
```html
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Redirecting...</title>
<meta http-equiv="refresh" content="0; url=/ai-studio/">
<link rel="canonical" href="https://huongdi.sol.vn/ai-studio/">
</head><body>
<script>window.location.replace("/ai-studio/");</script>
<p>Redirecting to <a href="/ai-studio/">/ai-studio/</a>...</p>
</body></html>
```

**2b. `/prompts-studio/index.html`** — Similar redirect:
```html
<script>window.location.replace("/tao-prompts-ca-nhan/");</script>
```

**2c. `/ai-studio/index.html`** — Insert Handle legacy `?tab=` param at top:
```html
<script>
(function(){
  const tab = new URLSearchParams(location.search).get('tab');
  if (tab === 'editor') { location.replace('/tao-prompts-ca-nhan/'); return; }
  if (tab === 'chat')   { location.replace('/toi/sol-dong-hanh/'); return; }
  if (tab === 'library'){ history.replaceState(null,'','/ai-studio/'); }
})();
</script>
```

### Step 3: Update sol-ui.js NAV_ITEMS với submenu (45 min)

**3a. NAV_ITEMS structure:**
```javascript
const NAV_ITEMS = [
  { key: 'p1',   href: '/kham-pha-ban-than/', label: 'Bước 1: Thấu hiểu' },
  { key: 'p2',   href: '/kiem-ke-nguon-luc/', label: 'Bước 2: Khai phá' },
  { key: 'p3',   href: '/la-ban-huong-di/',   label: 'Bước 3: Chọn hướng' },
  {
    key: 'aistudio',
    href: '/ai-studio/',
    label: '🎨 AI Studio',
    children: [
      { href: '/ai-studio/',            label: '📚 Thư viện Prompt' },
      { href: '/tao-prompts-ca-nhan/',  label: '✏️ Biên tập cá nhân hoá' },
      { href: '/toi/sol-dong-hanh/',    label: '🤖 Sol AI Đồng Hành' },
    ],
  },
  { key: 'articles', href: 'https://sol.vn/huong-di/', label: 'Bài viết' },
];
```

**3b. Render logic — Desktop hover dropdown:**
```javascript
const navMainHTML = NAV_ITEMS.map(item => {
  if (item.children) {
    const submenu = item.children.map(c =>
      `<a href="${c.href}" class="hd-nav-submenu-link">${c.label}</a>`
    ).join('');
    return `<div class="hd-nav-item hd-nav-item--has-children">
      <a href="${item.href}" class="hd-nav-parent-link">${item.label} <span aria-hidden="true">▾</span></a>
      <div class="hd-nav-submenu">${submenu}</div>
    </div>`;
  }
  return `<a href="${item.href}" class="hd-nav-link">${item.label}</a>`;
}).join('');
```

**3c. Add CSS submenu (inline trong injectFixedOverride):**
```css
.hd-nav-item--has-children { position: relative; }
.hd-nav-parent-link { display: flex; align-items: center; gap: 4px; }
.hd-nav-submenu {
  display: none; position: absolute; top: 100%; left: 0;
  background: white; border: 1px solid #E2E8F0;
  border-radius: 8px; box-shadow: 0 4px 16px rgba(15,23,42,0.08);
  min-width: 240px; padding: 8px 0; margin-top: 4px;
  z-index: 1001;
}
.hd-nav-item--has-children:hover .hd-nav-submenu,
.hd-nav-item--has-children:focus-within .hd-nav-submenu { display: block; }
.hd-nav-submenu-link {
  display: block; padding: 10px 16px; font-size: 14px;
  color: #334155; border-bottom: 1px solid #F1F5F9;
  text-decoration: none;
}
.hd-nav-submenu-link:last-child { border-bottom: none; }
.hd-nav-submenu-link:hover { background: #F8FAFC; color: #F59E0B; }

/* Mobile: nested accordion (always expanded) */
@media (max-width: 900px) {
  .hd-nav-submenu {
    display: block !important; position: static;
    box-shadow: none; border: none;
    padding: 0 0 0 20px; background: transparent;
    margin: 0; min-width: 0;
  }
  .hd-nav-submenu-link {
    padding: 10px 8px; font-size: 14px;
    color: #64748B; border-bottom: 1px solid #F1F5F9;
  }
  .hd-nav-parent-link { padding: 12px 8px; font-weight: 700; }
}
```

### Step 4: SEO update (15 min)

- Sitemap.xml: add new URLs, remove `/prompts/` `/prompts-studio/`
- Update internal links: search grep `/prompts/`, `/prompts-studio/`, `/ai-studio/?tab=` → update to new URLs
- Google Search Console: submit new URLs

### Step 5: Test E2E (30 min)

**Test URLs mới:**
- [ ] `/ai-studio/` — Load Thư viện 40 Prompt (không iframe)
- [ ] `/tao-prompts-ca-nhan/` — Load Biên tập
- [ ] `/toi/sol-dong-hanh/` — Load Chat AI

**Test redirects:**
- [ ] `/prompts/` → `/ai-studio/` (browser URL bar update)
- [ ] `/prompts-studio/` → `/tao-prompts-ca-nhan/`
- [ ] `/ai-studio/?tab=library` → `/ai-studio/` (strip query)
- [ ] `/ai-studio/?tab=editor` → `/tao-prompts-ca-nhan/`
- [ ] `/ai-studio/?tab=chat` → `/toi/sol-dong-hanh/`

**Test submenu:**
- [ ] Desktop: hover "🎨 AI Studio" → dropdown 3 items
- [ ] Desktop: click "AI Studio" parent → goes to `/ai-studio/`
- [ ] Mobile: click hamburger → thấy "AI Studio" + 3 sub-items indented
- [ ] Click sub-item → navigate + close hamburger

### Step 6: Deploy order (15 min)

```powershell
# 1. Upload new files
scp huongdi-public/tao-prompts-ca-nhan/index.html sol-vps:/tmp/tao.html
scp huongdi-public/ai-studio/index.html sol-vps:/tmp/aistudio.html
scp huongdi-public/prompts/index.html sol-vps:/tmp/prompts-redir.html
scp huongdi-public/prompts-studio/index.html sol-vps:/tmp/prompts-studio-redir.html
scp huongdi-public/toi/sol-dong-hanh/index.html sol-vps:/tmp/sdh.html
scp huongdi-public/sol-ui.js sol-vps:/tmp/sol-ui.js

# 2. Deploy on VPS (1 lệnh SSH long)
$TS = Get-Date -Format "yyyyMMdd-HHmmss"
ssh sol-vps "sudo mkdir -p /var/backups/aistudio-refactor-$TS /var/www/huongdi/public/tao-prompts-ca-nhan && ... (deploy commands)"

# 3. Verify 5 URLs live
```

## Rollback plan

Nếu deploy fail:
1. Restore `/ai-studio/index.html.bak-iframe` (iframe container gốc)
2. Restore `/prompts/index.html` original (không redirect)
3. Restore `/prompts-studio/index.html` original
4. Delete `/tao-prompts-ca-nhan/` folder
5. Restore sol-ui.js version cũ (không submenu)

## Deprecate ADR-005 + Add ADR-010

Sau khi deploy OK, update `03-DESIGN-DECISIONS.md`:

**ADR-005 status update:**
```
Status: ~~Deployed~~ → Deprecated (2026-07-08)
Replaced by: ADR-010 — Submenu pattern
```

**Add ADR-010:**
```markdown
## ADR-010: AI Studio dùng submenu thay iframe container

### Context
ADR-005 iframe pattern bị nested scroll trên mobile + hero chiếm space.

### Decision
Tách 3 tính năng thành 3 URLs riêng, dùng dropdown submenu trong nav chính.
URLs:
- /ai-studio/ = Thư viện Prompt
- /tao-prompts-ca-nhan/ = Biên tập cá nhân hoá
- /toi/sol-dong-hanh/ = Sol AI Đồng Hành

### Consequences
- Mobile UX chuẩn (no nested scroll)
- SEO friendly (URL riêng cho mỗi feature)
- Natural browser back/forward
- Trade-off: mất context giữa 3 tabs (chấp nhận)
```

## Effort summary

| Step | Time |
|------|------|
| 1. Content migration | 30 min |
| 2. Update redirects | 15 min |
| 3. sol-ui.js submenu | 45 min |
| 4. SEO update | 15 min |
| 5. Test E2E | 30 min |
| 6. Deploy | 15 min |
| **Total** | **~2.5 giờ** |
