/**
 * sol-ui.js — Header & Footer CHUNG cho toàn app huongdi.sol.vn
 * Menu "Đi Cùng Sol" thống nhất (khớp sol-nav.json). MỘT nguồn duy nhất.
 * Nhúng: <script src="/sol-ui.js" defer></script>
 *   <body data-sol-ui="skip">      ← trang tự quản header (không dùng)
 *   <body data-sol-footer="false"> ← ẩn footer (trang quiz dài)
 *   window.SOL_CHROME={slim:true,back:'/',title:'…',progress:'Bước 2/4'} ← header gọn
 */
(function () {
  'use strict';
  var CFG = window.SOL_CHROME || {};
  var TOKEN = null; try { TOKEN = localStorage.getItem('sol_jwt') || localStorage.getItem('sol_token'); } catch (e) {}

  var NAV = {
    brand: { name: 'Đi Cùng Sol', logo: 'https://sol.vn/wp-content/uploads/2025/05/Icon_2.png', home: 'https://sol.vn/' },
    menu: [
      { label: 'Hồ sơ & Việc làm', icon: '💼', children: [
        { label: '📄 Tạo lập CV chuẩn ATS', url: 'https://huongdi.sol.vn/ho-so-viec-lam/tao-cv/' },
        { label: '🎯 Chấm CV × JD', url: 'https://huongdi.sol.vn/ho-so-viec-lam/cham/' },
        { label: '📊 Đánh giá CV & Kỹ năng', url: 'https://huongdi.sol.vn/ho-so-viec-lam/danh-gia/' },
        { label: '✉️ Viết thư ứng tuyển', url: 'https://huongdi.sol.vn/ho-so-viec-lam/thu/' },
        { label: '🎤 Phỏng vấn thử', url: 'https://huongdi.sol.vn/ho-so-viec-lam/phong-van/' }
      ] },
      { label: 'Hướng đi riêng', icon: '🗺️', children: [
        { label: 'Bước 1 · Hiểu chính mình', url: 'https://huongdi.sol.vn/kham-pha-ban-than/' },
        { label: 'Bước 2 · Biết mình có gì', url: 'https://huongdi.sol.vn/kiem-ke-nguon-luc/' },
        { label: 'Bước 3 · Chọn hướng đi', url: 'https://huongdi.sol.vn/la-ban-huong-di/ket-qua/' },
        { label: 'Bước 4 · Thử làm nhỏ', url: 'https://huongdi.sol.vn/la-ban-huong-di/kiem-thu/' },
        { label: 'Bước 5 · Ra làm thật', url: 'https://huongdi.sol.vn/la-ban-huong-di/lam-ho-so/' },
        { label: '📚 Thư viện hướng đi', url: 'https://huongdi.sol.vn/la-ban-huong-di/tat-ca/' }
      ] },
      { label: 'La Bàn Sol', icon: '🧭', children: [
        { label: 'La Bàn Sol là gì?', url: 'https://sol.vn/la-ban-sol/' },
        { label: '💎 La Bàn Sol Active — Giá dịch vụ', url: 'https://huongdi.sol.vn/pricing/' }
      ] },
      { label: 'Tài nguyên miễn phí', icon: '📚', children: [
        { label: '📝 Bài viết hướng đi', url: 'https://sol.vn/huong-di/' },
        { label: '🗺️ Thư viện mô hình', url: 'https://huongdi.sol.vn/la-ban-huong-di/tat-ca/' },
        { label: '📖 Sách tái khởi nghiệp', url: 'https://sol.vn/sach/tai-khoi-nghiep-dung-huong/' },
        { label: '🤖 Thư viện AI mẫu', url: 'https://huongdi.sol.vn/ai-studio/' },
        { label: '✏️ Tự tạo câu lệnh riêng', url: 'https://huongdi.sol.vn/tao-prompts-ca-nhan/' }
      ] },
      { label: 'Về Sol', icon: '✨', children: [
        { label: 'Sol là gì?', url: 'https://sol.vn/sol-la-gi/' },
        { label: 'Sol làm việc thế nào?', url: 'https://huongdi.sol.vn/sol-lam-viec-the-nao/' },
        { label: 'La Bàn Sol là gì?', url: 'https://sol.vn/la-ban-sol/' },
        { label: 'Người sáng lập', url: 'https://sol.vn/khang-sol/' },
        { label: 'Liên hệ', url: 'https://sol.vn/lien-he/' }
      ] }
    ],
    cta: { label: 'Dùng thử miễn phí', url: 'https://huongdi.sol.vn/kham-pha-ban-than/' },
    account: [
      { label: '📄 Tạo lập CV chuẩn ATS', url: 'https://huongdi.sol.vn/ho-so-viec-lam/tao-cv/' },
      { label: '📊 Đánh giá CV & Kỹ năng', url: 'https://huongdi.sol.vn/ho-so-viec-lam/danh-gia/' },
      { label: 'Sổ Hành Trình', url: 'https://huongdi.sol.vn/so-hanh-trinh/' },
      { label: 'Đăng xuất', url: 'https://huongdi.sol.vn/dang-xuat/' }
    ],
    footer: {
      tagline: 'Đúng hướng, đúng bước, đúng tương lai.',
      blurb: 'Hệ thống Sol La Bàn + Sách "Tái Khởi Nghiệp Đúng Hướng" cho người 40–60.',
      cols: [
        { title: 'Sản phẩm & Dịch vụ', links: [
          { label: '💼 Hồ sơ & Việc làm', url: 'https://huongdi.sol.vn/ho-so-viec-lam/tao-cv/' },
          { label: '🗺️ Hướng đi riêng', url: 'https://huongdi.sol.vn/kham-pha-ban-than/' },
          { label: '🧭 La Bàn Sol', url: 'https://huongdi.sol.vn/toi/sol-dong-hanh/' },
          { label: '📚 Tài nguyên miễn phí', url: 'https://sol.vn/huong-di/' },
          { label: '💎 La Bàn Sol Active — giá dịch vụ', url: 'https://huongdi.sol.vn/pricing/' }
        ] },
        { title: 'Tài nguyên miễn phí', links: [
          { label: '📝 Bài viết hướng đi', url: 'https://sol.vn/huong-di/' },
          { label: '🗺️ Thư viện mô hình', url: 'https://huongdi.sol.vn/la-ban-huong-di/tat-ca/' },
          { label: '📖 Sách tái khởi nghiệp', url: 'https://sol.vn/sach/tai-khoi-nghiep-dung-huong/' },
          { label: '🤖 Thư viện AI mẫu', url: 'https://huongdi.sol.vn/ai-studio/' },
          { label: '✏️ Tự tạo câu lệnh riêng', url: 'https://huongdi.sol.vn/tao-prompts-ca-nhan/' }
        ] },
        { title: 'Về Sol', links: [
          { label: 'Khang Sol', url: 'https://sol.vn/khang-sol/' },
          { label: 'Ngồi với Khang một buổi', url: 'https://huongdi.sol.vn/lam-viec-cung-khang/' },
          { label: 'Sol Là Gì?', url: 'https://sol.vn/sol-la-gi/' },
          { label: 'Phương pháp chấm điểm', url: 'https://sol.vn/phuong-phap-dinh-vi-huong-di-sol/' },
          { label: 'Câu hỏi thường gặp', url: 'https://sol.vn/cau-hoi/' },
          { label: 'Liên hệ', url: 'https://sol.vn/lien-he/' }
        ] },
        { title: 'Cộng đồng', links: [
          { label: '▶️ YouTube', url: 'https://www.youtube.com/@Sol.Taisinh' },
          { label: '🎵 TikTok', url: 'https://www.tiktok.com/@sol.taisinh' },
          { label: '📘 Fanpage', url: 'https://web.facebook.com/Dicungsol/' },
          { label: '👥 FB Group', url: 'https://web.facebook.com/groups/taikhoinghiepdunghuong' },
          { label: '💬 Zalo Group', url: 'https://zalo.me/g/iutty6omizdrpogdgdop' },
          { label: '📱 Nhắn riêng Khang', url: 'https://zalo.me/0912727381' }
        ] }
      ],
      legal: 'Vận hành bởi CÔNG TY CỔ PHẦN VINET · MST 0104127836 · © 2025–2026 Đi Cùng Sol'
    }
  };

  function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var CSS = ''
    + '.hd-header,.hd-footer,#sol-header,#sol-footer{display:none!important}'  /* ẩn header/footer cũ (nếu còn sót) */
    + '.solc-h{background:#0F172A;color:#fff;font-family:Inter,system-ui,sans-serif}'
    + '.solc-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:18px;padding:10px 18px}'
    + '.solc-b{display:flex;align-items:center;gap:9px;font-weight:700;font-size:17px;color:#fff;text-decoration:none;white-space:nowrap}'
    + '.solc-b img{width:28px;height:28px;border-radius:7px}.solc-b .a{color:#F59E0B}'
    + '.solc-nav{display:flex;align-items:center;gap:4px;flex:1;flex-wrap:wrap}'
    + '.solc-it{position:relative}'
    + '.solc-it>a,.solc-it>button{color:#E2E8F0;background:none;border:0;font:inherit;font-size:14.5px;font-weight:500;padding:8px 10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:5px;border-radius:8px}'
    + '.solc-it>a:hover,.solc-it>button:hover{background:#1E293B;color:#fff}'
    + '.solc-dd{display:none;position:absolute;left:0;top:100%;background:#fff;min-width:230px;border-radius:12px;box-shadow:0 12px 34px rgba(2,6,23,.28);padding:6px;z-index:60}'
    + '.solc-it.open>.solc-dd{display:block}'
    + '.solc-dd a{display:block;color:#0F172A;text-decoration:none;font-size:14px;padding:9px 11px;border-radius:8px}'
    + '.solc-dd a:hover{background:#FEF3C7;color:#B45309}'
    + '.solc-cta{background:#F59E0B;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:9px 16px;border-radius:10px;white-space:nowrap}'
    + '.solc-acc>button{display:flex;align-items:center;gap:8px;background:#1E293B;color:#fff;border:0;font:inherit;font-weight:600;font-size:14px;padding:7px 12px;border-radius:10px;cursor:pointer}'
    + '.solc-acc .dot{width:24px;height:24px;border-radius:50%;background:#F59E0B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}'
    + '.solc-ham{display:none;background:none;border:0;color:#fff;font-size:24px;cursor:pointer}'
    + '.solc-prog{flex:1;text-align:center;color:#CBD5E1;font-size:14px}.solc-prog b{color:#F59E0B}'
    + '.solc-back{color:#CBD5E1;text-decoration:none;font-size:14px}'
    + '.solc-f{background:#0F172A;color:#CBD5E1;font-family:Inter,system-ui,sans-serif;margin-top:40px}'
    + '.solc-fin{max-width:1180px;margin:0 auto;padding:30px 20px 16px}'
    + '.solc-ft{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 1fr;gap:20px}'
    + '.solc-f h4{color:#fff;font-size:13px;margin:0 0 9px;font-weight:600}'
    + '.solc-f a{display:block;color:#CBD5E1;text-decoration:none;font-size:13px;padding:3px 0}.solc-f a:hover{color:#F59E0B}'
    + '.solc-tag{font-family:Lora,serif;color:#F59E0B;font-size:14px}.solc-blb{font-size:12.5px;color:#94A3B8;margin-top:6px;max-width:250px}'
    + '.solc-fb{color:#fff;font-weight:700;font-size:15px;margin-bottom:6px;display:flex;align-items:center;gap:7px}.solc-fb img{width:24px;height:24px;border-radius:6px}'
    + '.solc-leg{border-top:1px solid #1E293B;margin-top:20px;padding-top:13px;text-align:center;font-size:11.5px;color:#64748B}'
    + '@media(max-width:900px){.solc-ham{display:block}.solc-nav{display:none;flex-direction:column;align-items:stretch;width:100%;order:3;gap:0}.solc-nav.show{display:flex}.solc-it>a,.solc-it>button{width:100%;justify-content:flex-start}.solc-dd{position:static;box-shadow:none;display:block;background:#0B1220;padding:0 0 6px 14px}.solc-dd a{color:#CBD5E1}.solc-ft{grid-template-columns:1fr 1fr}}';

  function menuHtml() {
    return NAV.menu.map(function (m, i) {
      var ic = m.icon ? esc(m.icon) + ' ' : '';
      if (m.children) {
        var sub = m.children.map(function (c) { return '<a href="' + esc(c.url) + '">' + esc(c.label) + '</a>'; }).join('');
        return '<div class="solc-it" data-i="' + i + '"><button onclick="__solcToggle(' + i + ')">' + ic + esc(m.label) + ' ▾</button><div class="solc-dd">' + sub + '</div></div>';
      }
      return '<div class="solc-it"><a href="' + esc(m.url) + '">' + ic + esc(m.label) + '</a></div>';
    }).join('');
  }
  function rightHtml() {
    if (TOKEN) {
      var acc = NAV.account.map(function (a) { return '<a href="' + esc(a.url) + '">' + esc(a.label) + '</a>'; }).join('');
      return '<div class="solc-it solc-acc" data-i="acc"><button onclick="__solcToggle(\'acc\')"><span class="dot">☺</span> Tài khoản ▾</button><div class="solc-dd" style="right:0;left:auto">' + acc + '</div></div>';
    }
    return '<a class="solc-cta" href="' + esc(NAV.cta.url) + '">' + esc(NAV.cta.label) + '</a>';
  }
  function brandHtml(small) {
    return '<a class="solc-b" href="' + esc(NAV.brand.home) + '"><img src="' + esc(NAV.brand.logo) + '" alt="Sol">' + (small ? '<span class="a">Sol</span>' : '<span>Đi Cùng <span class="a">Sol</span></span>') + '</a>';
  }

  function headerHtml() {
    if (CFG.slim) {
      var back = CFG.back ? '<a class="solc-back" href="' + esc(CFG.back) + '">← Về</a>' : '';
      var prog = CFG.progress ? '<div class="solc-prog">' + esc(CFG.title || '') + ' · <b>' + esc(CFG.progress) + '</b></div>' : '<div class="solc-prog">' + esc(CFG.title || '') + '</div>';
      return '<header class="solc-h"><div class="solc-in">' + brandHtml(true) + back + prog + (TOKEN ? rightHtml() : '') + '</div></header>';
    }
    return '<header class="solc-h"><div class="solc-in">' + brandHtml(false)
      + '<button class="solc-ham" onclick="__solcHam()">☰</button>'
      + '<nav class="solc-nav" id="solcNav">' + menuHtml() + '</nav>'
      + rightHtml() + '</div></header>';
  }
  function footerHtml() {
    var f = NAV.footer;
    var cols = f.cols.map(function (c) {
      return '<div><h4>' + esc(c.title) + '</h4>' + c.links.map(function (l) { return '<a href="' + esc(l.url) + '">' + esc(l.label) + '</a>'; }).join('') + '</div>';
    }).join('');
    return '<footer class="solc-f"><div class="solc-fin"><div class="solc-ft">'
      + '<div><div class="solc-fb"><img src="' + esc(NAV.brand.logo) + '" alt="Sol">Đi Cùng <span class="a" style="color:#F59E0B">Sol</span></div><div class="solc-tag">' + esc(f.tagline) + '</div><div class="solc-blb">' + esc(f.blurb) + '</div></div>'
      + cols + '</div><div class="solc-leg">' + esc(f.legal) + '</div></div></footer>';
  }

  window.__solcToggle = function (i) {
    var el = document.querySelector('.solc-it[data-i="' + i + '"]');
    if (!el) return;
    var wasOpen = el.classList.contains('open');
    document.querySelectorAll('.solc-it.open').forEach(function (x) { x.classList.remove('open'); });
    if (!wasOpen) el.classList.add('open');
  };
  window.__solcHam = function () { var n = document.getElementById('solcNav'); if (n) n.classList.toggle('show'); };
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.solc-it')) {
      document.querySelectorAll('.solc-it.open').forEach(function (x) { x.classList.remove('open'); });
    }
  });

  function skip() {
    var p = location.pathname;
    if (/(^|\/)(dang-nhap|dang-ky|dang-xuat|quen-mat-khau|dat-lai-mat-khau|login|dashboard)(\/|$)/.test(p)) return true;
    try { if (new URLSearchParams(location.search).get('embed') === '1') return true; } catch (e) {}
    if (document.body && document.body.dataset && document.body.dataset.solUi === 'skip') return true;
    return false;
  }

  function mount() {
    // chống nạp 2 lần: kiểm tra cả cờ LẪN DOM (chắc chắn dù nạp mấy lần, thứ tự nào)
    if (window.__solcMounted || document.querySelector('header.solc-h')) { window.__solcMounted = true; return; }
    window.__solcMounted = true;
    if (skip()) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var h = document.createElement('div'); h.innerHTML = headerHtml(); document.body.insertBefore(h.firstChild, document.body.firstChild);
    var noFoot = CFG.slim || (document.body.dataset && document.body.dataset.solFooter === 'false');
    if (!noFoot) { var f = document.createElement('div'); f.innerHTML = footerHtml(); document.body.appendChild(f.firstChild); }
    document.body.classList.add('sol-ui-loaded');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

// ═══════════════════════════════════════════════════════════════
// SOL WELCOME HANDLER — Parse ?welcome=1&tier=&ten=&expires=
// Nhận handoff từ sol.vn/kich-hoat/ sau khi activate magic link
// ═══════════════════════════════════════════════════════════════
(function () {
  var params = new URLSearchParams(window.location.search);
  if (params.get('welcome') !== '1') return;

  var tier    = params.get('tier')    || '';
  var ten     = params.get('ten')     || '';
  var expires = params.get('expires') || '';
  var token   = params.get('token')   || '';

  if (!tier || !ten) return;

  // 1. Set localStorage
  try {
    localStorage.setItem('sol_tier',         tier);
    localStorage.setItem('sol_ten',          ten);
    localStorage.setItem('sol_expires_at',   expires);
    localStorage.setItem('sol_activated_at', new Date().toISOString());
    localStorage.setItem('sol_token_prefix', token);
    // Legacy keys cho sol-auth.js (backward compat)
    localStorage.setItem('sol_active', 'true');
    if (tier.toLowerCase() === 'founder') {
      localStorage.setItem('sol_founder', 'true');
    } else {
      localStorage.removeItem('sol_founder');
    }
  } catch (e) { console.warn('[sol-welcome] localStorage fail:', e); }

  // 2. Clean URL
  try { history.replaceState({}, '', window.location.pathname); } catch (e) {}

  // 3. Format expiry date DD/MM/YYYY
  var expDate = '';
  try {
    var d = new Date(expires);
    if (!isNaN(d)) {
      var pad = function (n) { return String(n).padStart(2, '0'); };
      expDate = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    }
  } catch (e) {}

  // 4. Animation CSS
  var style = document.createElement('style');
  style.textContent =
    '@keyframes solWelcomeIn { from { transform: translateX(420px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }' +
    '@keyframes solWelcomeOut { to { transform: translateX(420px); opacity: 0; } }';
  document.head.appendChild(style);

  // 5. Build toast
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var toast = document.createElement('div');
  toast.style.cssText =
    'position:fixed; top:24px; right:24px; z-index:99999; ' +
    'background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%); ' +
    'color:#fff; padding:22px 26px; border-radius:14px; ' +
    'box-shadow:0 24px 50px rgba(15,23,42,0.4), 0 0 0 1px rgba(255,255,255,0.15) inset; ' +
    'max-width:380px; font-family:Inter,-apple-system,sans-serif; ' +
    'animation:solWelcomeIn 0.45s cubic-bezier(0.4,0,0.2,1);';

  var tierLabel = (tier.toLowerCase() === 'founder') ? 'Founder Edition' : 'Active';
  toast.innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">' +
      '<div style="flex:1;">' +
        '<div style="font-size:22px; font-weight:800; margin-bottom:6px; line-height:1.2;">🎉 Chào ' + escapeHtml(ten) + '!</div>' +
        '<div style="font-size:14.5px; opacity:0.96; line-height:1.5;">' +
          'Sol <b>' + tierLabel + '</b> đã kích hoạt' + (expDate ? ' — hết hạn <b>' + expDate + '</b>' : '') + '.' +
        '</div>' +
        '<div style="font-size:13px; margin-top:10px; opacity:0.9;">' +
          '👉 Bắt đầu tại <a href="/kham-pha-ban-than/" style="color:#FFF7ED; font-weight:700; text-decoration:underline;">Bước 1 — Khám phá bản thân</a>' +
        '</div>' +
      '</div>' +
      '<button id="sol-welcome-close" style="background:rgba(255,255,255,0.2); border:none; color:#fff; width:28px; height:28px; border-radius:8px; cursor:pointer; font-size:18px; line-height:1; font-weight:700;">×</button>' +
    '</div>';

  document.body.appendChild(toast);

  function dismiss() {
    toast.style.animation = 'solWelcomeOut 0.35s cubic-bezier(0.4,0,0.2,1) forwards';
    setTimeout(function () { toast.remove(); }, 400);
  }

  document.getElementById('sol-welcome-close').addEventListener('click', dismiss);
  setTimeout(dismiss, 12000);

  console.log('[sol-welcome] Activated: ' + ten + ' — ' + tierLabel + ' (exp: ' + expDate + ')');
})();

// Load V1.2 avatar icon
(function(){
  if (window.__solAvatarReq) return; window.__solAvatarReq = 1;
  var s = document.createElement('script');
  s.src = '/sol-avatar-icon.js';
  s.defer = true;
  document.head.appendChild(s);
})();
