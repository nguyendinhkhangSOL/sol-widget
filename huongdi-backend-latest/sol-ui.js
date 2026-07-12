/**
 * sol-ui.js — Shared Header & Footer cho huongdi.sol.vn
 * Sử dụng đúng HTML + CSS của landing page (hd-* classes từ /css/style.css)
 *
 * Cách dùng:
 *   <script src="/sol-ui.js"></script>
 *   <body data-sol-page="p1">       ← key để highlight nav
 *   <body data-sol-footer="false">  ← ẩn footer (trang quiz dài)
 *   <body data-sol-ui="skip">       ← bỏ qua (index.html tự quản)
 */
(function() {
  'use strict';

  // ── Load external CSS + fonts nếu chưa có ───────────────
  function ensureAssets() {
    // style.css
    if (!document.querySelector('link[href="/css/style.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/style.css';
      document.head.insertBefore(link, document.head.firstChild);
    }
    // Inter + Lora fonts
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      const fonts = document.createElement('link');
      fonts.rel = 'stylesheet';
      fonts.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,500;1,500&display=swap';
      document.head.appendChild(fonts);
    }
  }

  // ── Override: sticky → fixed, thêm body padding ─────────
  function injectFixedOverride() {
    const s = document.createElement('style');
    s.id = 'sol-ui-fixed';
    s.textContent = `
      #sol-header.hd-header { position: fixed !important; top: 0; left: 0; right: 0; }
      body.sol-ui-loaded > #sol-header + * { margin-top: 0; }
    `;
    document.head.appendChild(s);
  }

  // ── Nav items theo context ───────────────────────────────
  // Landing page (index.html) dùng data-sol-ui="skip" nên không cần nav ở đây.
  // Các trang còn lại dùng nav nội bộ huongdi.sol.vn.
  const NAV_ITEMS = [
    { key: 'p1',       href: '/kham-pha-ban-than/', label: 'Bước 1: Thấu hiểu' },
    { key: 'p2',       href: '/kiem-ke-nguon-luc/', label: 'Bước 2: Khai phá' },
    { key: 'p3',       href: '/la-ban-huong-di/',   label: 'Bước 3: Chọn hướng' },
    { key: 'quiz',     href: 'https://sol.vn/kham-pha-nhanh/', label: '🎯 Kiểm tra 3 phút', badge: 'MỚI' },
    { key: 'prompts',  href: '/prompts/',              label: '🤖 40 câu hỏi AI' },
    { key: 'articles', href: 'https://sol.vn/huong-di/', label: 'Bài viết' },
  ];

  function getActivePage() {
    if (document.body.dataset.solPage) return document.body.dataset.solPage;
    const p = window.location.pathname;
    if (p.includes('kham-pha-ban-than') || p.includes('p1')) return 'p1';
    if (p.includes('kiem-ke-nguon-luc')  || p.includes('p2')) return 'p2';
    if (p.includes('la-ban-huong-di')    || p.includes('p3')) return 'p3';
    if (p === '/' || p.includes('index')) return 'home';
    return '';
  }

  function isLoggedIn() {
    try { return !!localStorage.getItem('sol_token'); } catch(_) { return false; }
  }

  // ── Inject Header ────────────────────────────────────────
  function injectHeader() {
    const loggedIn = isLoggedIn();
    const ctaLabel = loggedIn ? 'Dashboard →' : 'Bắt đầu miễn phí →';
    const ctaHref  = loggedIn ? '/dashboard.html' : '/kham-pha-ban-than/';

    const activePage = getActivePage();
    const navMain = NAV_ITEMS.map(item => {
      const isCurrent = item.key === activePage;
      const style = isCurrent
        ? ` style="color:var(--color-amber-600);font-weight:700;"`
        : '';
      const ariaCurrent = isCurrent ? ` aria-current="page"` : '';
      return `<a href="${item.href}"${style}${ariaCurrent}>${item.label}</a>`;
    }).join('\n      ');

    const header = document.createElement('header');
    header.id = 'sol-header';
    header.className = 'hd-header';
    header.setAttribute('role', 'banner');
    header.innerHTML = `
  <div class="hd-header__inner">
    <a href="https://sol.vn/" class="hd-logo" aria-label="Đi Cùng Sol — Trang chính">
      <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol" width="32" height="32">
      <span>Đi Cùng <strong>Sol</strong></span>
    </a>

    <nav class="hd-nav-main" aria-label="Huongdi navigation">
      ${navMain}
    </nav>

    <a href="${ctaHref}" class="hd-cta">${ctaLabel}</a>
  </div>`;

    document.body.insertBefore(header, document.body.firstChild);

    // Đo chiều cao thực sau khi render để set padding-top
    requestAnimationFrame(function() {
      const h = header.offsetHeight || 56;
      document.body.style.paddingTop = h + 'px';
      // P1/P2 quiz header nằm dưới sol-header
      const quizHdr = document.querySelector('.hdr');
      if (quizHdr && quizHdr.style.position === 'sticky' || quizHdr && getComputedStyle(quizHdr).position === 'sticky') {
        quizHdr.style.top = h + 'px';
      }
    });
  }

  // ── Inject Footer ────────────────────────────────────────
  function injectFooter() {
    if (document.body.dataset.solFooter === 'false') return;

    const footer = document.createElement('footer');
    footer.id = 'sol-footer';
    footer.className = 'hd-footer';
    footer.setAttribute('role', 'contentinfo');
    footer.innerHTML = `
  <div class="hd-container">
    <div class="hd-footer__grid">
      <div class="hd-footer__col">
        <div class="hd-footer__brand">
          <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol" width="36" height="36">
          <strong>Đi Cùng Sol</strong>
        </div>
        <p class="hd-footer__motto">Đúng hướng,<br>đúng bước,<br>đúng tương lai.</p>
      </div>

      <div class="hd-footer__col">
        <h4>Sol La Bàn</h4>
        <ul>
          <li><a href="/prompts/">🤖 40 câu hỏi AI</a></li>
          <li><a href="/kham-pha-ban-than/">Bước 1 · Thấu hiểu</a></li>
          <li><a href="/kiem-ke-nguon-luc/">Bước 2 · Khai phá</a></li>
          <li><a href="/la-ban-huong-di/">Bước 3 · Chọn hướng</a></li>
          <li><a href="/#system">Bước 4 · Hành động <span style="opacity:.6">(sắp có)</span></a></li>
          <li><a href="/#ai-mentor">Bước 5 · An toàn bền vững <span style="opacity:.6">(sắp có)</span></a></li>
        </ul>
      </div>

      <div class="hd-footer__col">
        <h4>Tài nguyên</h4>
        <ul>
          <li><a href="https://sol.vn/huong-di/" rel="noopener">📝 Blog Hướng Đi</a></li>
          <li><a href="https://sol.vn/" rel="noopener">📘 Ebook (sắp có)</a></li>
          <li><a href="https://sol.vn/" rel="noopener">🎙 Podcast (sắp có)</a></li>
          <li><a href="https://sol.vn/sol-la-gi/" rel="noopener">Câu chuyện Sol</a></li>
        </ul>
      </div>

      <div class="hd-footer__col">
        <h4>Về Sol</h4>
        <ul>
          <li><a href="https://sol.vn/" rel="noopener">🏠 sol.vn</a></li>
          <li><a href="https://sol.vn/sol-la-gi/" rel="noopener">Sol là gì?</a></li>
          <li><a href="https://sol.vn/khang-sol/" rel="noopener">Khang Sol — Founder</a></li>
          <li><a href="https://sol.vn/sach/tai-khoi-nghiep-dung-huong/" rel="noopener">📖 Sách miễn phí</a></li>
        </ul>
      </div>

      <div class="hd-footer__col">
        <h4>Cộng đồng</h4>
        <ul>
          <li><a href="https://www.facebook.com/groups/dicungsol/" target="_blank" rel="noopener">👥 FB Group "Đi Cùng Sol"</a></li>
          <li><a href="#" target="_blank" rel="noopener">💬 Zalo Group</a></li>
          <li><a href="mailto:hello@sol.vn">📧 hello@sol.vn</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook Khang</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
          <li><a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener" style="opacity:.7">Tuyên bố miễn trừ</a></li>
        </ul>
      </div>
    </div>

    <div class="hd-footer__contact-strip" style="background:#0F172A;color:#fff;padding:16px 24px;border-top:1px solid #1E293B;"><div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-size:13.5px;"><div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;"><a href="tel:02439931800" style="color:#F59E0B;text-decoration:none;font-weight:700;">📞 024.3993.1800</a><a href="https://zalo.me/0912727381" target="_blank" style="color:#CBD5E1;text-decoration:none;">💬 Chat Zalo</a><a href="mailto:hello@sol.vn" style="color:#CBD5E1;text-decoration:none;">📧 hello@sol.vn</a></div><a href="/lien-he/" style="color:#F59E0B;text-decoration:none;font-weight:600;">Xem tất cả kênh liên hệ →</a></div></div><div class="hd-footer__bottom">
      <div>
        <span style="color:#F59E0B;font-weight:600;">Vận hành và thương mại độc quyền bởi CÔNG TY CỔ PHẦN VINET</span> · MST: 0104127836<br>© 2025–2026 <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng
        <span class="hd-footer__charity-inline">· 🌟 Phụng sự: <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">bothuocla.sol.vn</a> (cai thuốc lá miễn phí)</span>
      </div>
      <div class="hd-footer__disclaim">⚠️ Nội dung mang tính chia sẻ kinh nghiệm — không phải tư vấn tài chính/y tế/luật có giấy phép. <a href="https://sol.vn/tuyen-bo-mien-tru/" rel="noopener">Xem đầy đủ</a></div>
    </div>
  </div>`;

    document.body.appendChild(footer);
  }

  // ── Main ─────────────────────────────────────────────────
  function init() {
    const path = window.location.pathname;
    if (path.includes('dashboard') || path.includes('login')) return;
    if (document.body.dataset.solUi === 'skip') return;

    ensureAssets();
    injectFixedOverride();
    injectHeader();
    injectFooter();
    document.body.classList.add('sol-ui-loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ═══════════════════════════════════════════════════════════════
// SOL WELCOME HANDLER — Parse ?welcome=1&tier=&ten=&expires=
// Nhận handoff từ sol.vn/kich-hoat/ sau khi activate magic link
// APPEND file này vào CUỐI /var/www/huongdi/public/sol-ui.js
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
  var s = document.createElement('script');
  s.src = '/sol-avatar-icon.js';
  s.defer = true;
  document.head.appendChild(s);
})();
