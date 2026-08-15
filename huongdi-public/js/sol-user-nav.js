/**
 * Sol User Nav v3 — Cross-domain widget (sol.vn + huongdi.sol.vn)
 * ─────────────────────────────────────────────────────────
 * Auto-detect domain:
 *   huongdi.sol.vn → Full user state (login required)
 *   sol.vn         → Brand CTA "Vào Sol La Bàn →"
 *
 * Responsive: Desktop pill → Mobile icon
 * Auto-hide on scroll
 * Version: 3.0 — 2026-07-05
 */
(function() {
  'use strict';

  const PRODUCT_URL = 'https://huongdi.sol.vn';
  const LOGIN_URL = PRODUCT_URL + '/dang-nhap/';
  const REGISTER_URL = PRODUCT_URL + '/dang-ky/';
  const LOGOUT_URL = PRODUCT_URL + '/dang-xuat/';

  // ─── Detect context ────────────────────────────
  const isProductDomain = location.hostname === 'huongdi.sol.vn' || location.hostname === 'localhost';
  const isBrandDomain = location.hostname === 'sol.vn' || location.hostname === 'www.sol.vn';
  const isAdminDomain = location.hostname.startsWith('admin');

  if (isAdminDomain) return;  // Không hiện trên admin panel

  // ⭐ Skip khi embed trong iframe (VD: AI Studio tabs)
  if (new URLSearchParams(location.search).get('embed') === '1') return;

  // Ẩn ở auth pages (chỉ product domain có)
  if (isProductDomain) {
    const authPaths = ['/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau', '/dang-xuat', '/dat-mat-khau'];
    if (authPaths.some(p => location.pathname.startsWith(p))) return;
  }

  // ─── User state (only readable on product domain) ─────
  function getJwt() { return localStorage.getItem('sol_jwt'); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('sol_user') || 'null'); }
    catch { return null; }
  }

  const user = getUser();
  const jwt = getJwt();
  const isLoggedIn = !!(user && jwt);

  // ─── Compute display data ─────────────────────
  const name = user?.displayName || 'Sol';
  const initials = name
    .split(/\s+/)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const tier = user?.tier || 'FREE';

  const tierStyle = {
    FREE:    { bg: '#E2E8F0', color: '#475569', label: 'FREE' },
    ACTIVE:  { bg: '#FEF3C7', color: '#B45309', label: 'ACTIVE' },
    FOUNDER: { bg: '#FDE68A', color: '#78350F', label: 'FOUNDER' },
    EXPIRED: { bg: '#FEF2F2', color: '#DC2626', label: 'EXPIRED' },
  }[tier] || { bg: '#E2E8F0', color: '#475569', label: tier };

  // ─── Inject CSS ────────────────────────────────
  const css = `
    #sol-nav-v3 {
      position: fixed;
      top: max(12px, env(safe-area-inset-top, 12px));
      right: max(12px, env(safe-area-inset-right, 12px));
      z-index: 999999;
      font-family: -apple-system, 'Segoe UI', Roboto, Inter, sans-serif;
      transition: transform 0.3s ease, opacity 0.2s;
    }
    #sol-nav-v3.hidden {
      transform: translateY(-80px);
      opacity: 0;
      pointer-events: none;
    }
    #sol-nav-v3 * { box-sizing: border-box; }

    /* ─── User pill (logged in) ─── */
    #sol-nav-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 4px;
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transition: transform 0.15s, box-shadow 0.15s;
      min-height: 44px;
      user-select: none;
    }
    #sol-nav-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .sol-nav-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #F59E0B, #B45309);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }
    .sol-nav-info { display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; }
    .sol-nav-name { font-size: 13px; font-weight: 600; color: #0F172A; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sol-nav-tier { font-size: 9px; padding: 1px 6px; border-radius: 999px; background: ${tierStyle.bg}; color: ${tierStyle.color}; font-weight: 800; letter-spacing: 0.5px; align-self: flex-start; margin-top: 2px; }
    .sol-nav-chevron { font-size: 10px; color: #94A3B8; transition: transform 0.2s; }
    #sol-nav-pill.open .sol-nav-chevron { transform: rotate(180deg); }

    /* ─── Login button (anonymous on product) ─── */
    #sol-nav-login {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px;
      background: #0F172A;
      color: #F59E0B;
      border-radius: 999px;
      text-decoration: none;
      font-size: 13px; font-weight: 700;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
      min-height: 44px;
    }
    #sol-nav-login:hover { background: #1E293B; color: #FEF3C7; }

    /* ─── Brand CTA button (anonymous on sol.vn) ─── */
    #sol-nav-cta {
      display: flex; align-items: center; gap: 6px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #F59E0B, #B45309);
      color: white;
      border-radius: 999px;
      text-decoration: none;
      font-size: 14px; font-weight: 700;
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
      min-height: 48px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    #sol-nav-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(245, 158, 11, 0.45);
    }
    .sol-nav-cta-arrow { font-size: 16px; transition: transform 0.2s; }
    #sol-nav-cta:hover .sol-nav-cta-arrow { transform: translateX(3px); }

    /* ─── Menu dropdown ─── */
    #sol-nav-menu {
      position: absolute;
      top: calc(100% + 8px); right: 0;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.16);
      min-width: 240px;
      padding: 8px;
      display: none;
      animation: solNavIn 0.15s ease-out;
    }
    #sol-nav-menu.open { display: block; }
    @keyframes solNavIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .sol-nav-menu-header { padding: 12px 12px 10px; border-bottom: 1px solid #F1F5F9; margin-bottom: 4px; }
    .sol-nav-menu-header-name { font-weight: 600; font-size: 14px; color: #0F172A; }
    .sol-nav-menu-header-email { font-size: 12px; color: #64748B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px; }

    #sol-nav-menu a { display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-decoration: none; color: #0F172A; font-size: 14px; border-radius: 6px; transition: background 0.1s; min-height: 40px; }
    #sol-nav-menu a:hover { background: #FEF3C7; }
    #sol-nav-menu a.sol-nav-logout { color: #DC2626; border-top: 1px solid #F1F5F9; margin-top: 4px; padding-top: 12px; border-radius: 0; }
    #sol-nav-menu a.sol-nav-logout:hover { background: #FEF2F2; }
    .sol-nav-menu-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }

    /* ─── Backdrop (mobile) ─── */
    #sol-nav-backdrop {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 999998;
      display: none;
      animation: solNavFade 0.2s;
    }
    #sol-nav-backdrop.open { display: block; }
    @keyframes solNavFade { from { opacity: 0; } to { opacity: 1; } }

    /* ─── TABLET ─── */
    @media (max-width: 1024px) {
      .sol-nav-name { display: none; }
      .sol-nav-info { flex-direction: row; align-items: center; }
      .sol-nav-tier { margin-top: 0; }
    }

    /* ─── MOBILE ─── */
    @media (max-width: 768px) {
      #sol-nav-pill { padding: 4px; gap: 0; }
      .sol-nav-info { display: none; }
      .sol-nav-chevron { display: none; }
      .sol-nav-avatar { width: 40px; height: 40px; font-size: 14px; }

      #sol-nav-menu {
        position: fixed; top: auto; bottom: 0; right: 0; left: 0;
        border-radius: 20px 20px 0 0;
        padding: 12px 12px 24px;
        max-height: 80vh; overflow-y: auto;
        animation: solNavSlideUp 0.25s ease-out;
      }
      @keyframes solNavSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      #sol-nav-menu.open::before {
        content: ''; display: block;
        width: 40px; height: 4px;
        background: #CBD5E1; border-radius: 999px;
        margin: 0 auto 12px;
      }
      #sol-nav-menu a { padding: 14px 12px; font-size: 15px; min-height: 48px; }
      .sol-nav-menu-icon { font-size: 18px; }

      /* Login button mobile — compact */
      #sol-nav-login { padding: 8px 12px; font-size: 12px; min-height: 40px; }
      #sol-nav-login .sol-nav-login-text { display: none; }

      /* CTA button mobile — vẫn text (quan trọng cho conversion) */
      #sol-nav-cta { padding: 10px 16px; font-size: 13px; }
    }

    @media print {
      #sol-nav-v3, #sol-nav-backdrop { display: none !important; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ─── Build HTML by state ────────────────────
  let widgetHtml = '';

  if (isLoggedIn && isProductDomain) {
    // Full user pill với menu
    widgetHtml = `
      <div id="sol-nav-v3">
        <div id="sol-nav-pill" role="button" tabindex="0" aria-label="Menu người dùng" aria-expanded="false">
          <div class="sol-nav-avatar">${initials}</div>
          <div class="sol-nav-info">
            <div class="sol-nav-name">${escapeHtml(name)}</div>
            <div class="sol-nav-tier">${tierStyle.label}</div>
          </div>
          <div class="sol-nav-chevron">▼</div>
        </div>
        <div id="sol-nav-menu" role="menu">
          <div class="sol-nav-menu-header">
            <div class="sol-nav-menu-header-name">${escapeHtml(name)}</div>
            <div class="sol-nav-menu-header-email">${escapeHtml(user.email || user.phone || '')}</div>
          </div>
          <a href="${PRODUCT_URL}/toi/"><span class="sol-nav-menu-icon">🏠</span> Dashboard</a>
          <a href="${PRODUCT_URL}/toi/ban-do/"><span class="sol-nav-menu-icon">🗺</span> Bản đồ hướng đi</a>
          <a href="${PRODUCT_URL}/toi/so-hanh-trinh/"><span class="sol-nav-menu-icon">📓</span> Sổ Hành Trình</a>
          <a href="${PRODUCT_URL}/prompts-studio/"><span class="sol-nav-menu-icon">🎨</span> Prompt Studio</a>
          <a href="${PRODUCT_URL}/toi/sol-dong-hanh/"><span class="sol-nav-menu-icon">🤖</span> Sol Đồng Hành AI</a>
          <a href="${LOGOUT_URL}" class="sol-nav-logout">
            <span class="sol-nav-menu-icon">🚪</span> Đăng xuất
          </a>
        </div>
      </div>
      <div id="sol-nav-backdrop"></div>
    `;
  } else if (isProductDomain) {
    // Product domain anonymous → Login link
    widgetHtml = `
      <div id="sol-nav-v3">
        <a href="${LOGIN_URL}" id="sol-nav-login" aria-label="Đăng nhập">
          <span>👤</span>
          <span class="sol-nav-login-text">Đăng nhập</span>
        </a>
      </div>
    `;
  } else if (isBrandDomain) {
    // sol.vn brand domain → CTA to product
    widgetHtml = `
      <div id="sol-nav-v3">
        <a href="${PRODUCT_URL}/kham-pha-ban-than/" id="sol-nav-cta" aria-label="Dùng thử miễn phí">
          <span>🧭</span>
          <span>Dùng thử miễn phí</span>
          <span class="sol-nav-cta-arrow">→</span>
        </a>
      </div>
    `;
  }

  if (!widgetHtml) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = widgetHtml;
  while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

  // ─── Interactions (chỉ khi có menu — logged in) ──
  if (isLoggedIn && isProductDomain) {
    const pill = document.getElementById('sol-nav-pill');
    const menu = document.getElementById('sol-nav-menu');
    const backdrop = document.getElementById('sol-nav-backdrop');
    const nav = document.getElementById('sol-nav-v3');

    function toggleMenu() {
      const open = menu.classList.toggle('open');
      pill.classList.toggle('open');
      backdrop.classList.toggle('open', open);
      pill.setAttribute('aria-expanded', String(open));
    }

    pill.addEventListener('click', toggleMenu);
    pill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });

    backdrop.addEventListener('click', () => {
      menu.classList.remove('open');
      pill.classList.remove('open');
      backdrop.classList.remove('open');
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !backdrop.contains(e.target)) {
        menu.classList.remove('open');
        pill.classList.remove('open');
        backdrop.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        pill.classList.remove('open');
        backdrop.classList.remove('open');
      }
    });

    let touchStartY = 0;
    menu.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    menu.addEventListener('touchmove', (e) => {
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 80 && menu.scrollTop === 0) {
        menu.classList.remove('open');
        pill.classList.remove('open');
        backdrop.classList.remove('open');
      }
    }, { passive: true });
  }

  // ─── Auto-hide on scroll ────────────────────
  let lastScrollY = window.scrollY;
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const nav = document.getElementById('sol-nav-v3');
      if (!nav) { scrollTicking = false; return; }
      if (currentY > lastScrollY && currentY > 100) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastScrollY = currentY;
      scrollTicking = false;
    });
  }, { passive: true });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
})();
