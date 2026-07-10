/**
 * Sol User Nav v2 — Responsive Widget cho tất cả devices
 * ─────────────────────────────────────────────────────────
 * Desktop >1024px: Full pill (avatar + name + tier + ▼)
 * Tablet 768-1024: Compact pill (avatar + tier + ▼)
 * Mobile <768px:  Icon only
 *
 * Anonymous: Login link/icon
 * Scroll: Auto-hide down, show up
 * Menu: Dropdown desktop, bottom sheet mobile
 *
 * Version: 2.0 — 2026-07-05
 */
(function() {
  'use strict';

  const API_BASE = window.SOL_API_BASE || 'https://huongdi.sol.vn/api';

  function getJwt() { return localStorage.getItem('sol_jwt'); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('sol_user') || 'null'); }
    catch { return null; }
  }

  // Không hiện trên admin domain
  if (location.hostname.startsWith('admin')) return;

  // Ẩn ở auth pages (tránh confuse)
  const authPaths = ['/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau', '/dang-xuat', '/dat-mat-khau'];
  if (authPaths.some(p => location.pathname.startsWith(p))) return;

  const user = getUser();
  const jwt = getJwt();
  const isLoggedIn = !!(user && jwt);

  // ─── Compute display data ────────────────────────
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
    /* Container — fixed top-right với safe area */
    #sol-nav-v2 {
      position: fixed;
      top: max(12px, env(safe-area-inset-top, 12px));
      right: max(12px, env(safe-area-inset-right, 12px));
      z-index: 9999;
      font-family: -apple-system, 'Segoe UI', Roboto, Inter, sans-serif;
      transition: transform 0.3s ease, opacity 0.2s;
    }
    #sol-nav-v2.hidden {
      transform: translateY(-80px);
      opacity: 0;
      pointer-events: none;
    }

    /* Pill — logged in state */
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
    #sol-nav-pill:active { transform: translateY(0); }

    /* Avatar circle */
    .sol-nav-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F59E0B, #B45309);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }

    /* Info section — hide progressive */
    .sol-nav-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      overflow: hidden;
    }
    .sol-nav-name {
      font-size: 13px;
      font-weight: 600;
      color: #0F172A;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sol-nav-tier {
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 999px;
      background: ${tierStyle.bg};
      color: ${tierStyle.color};
      font-weight: 800;
      letter-spacing: 0.5px;
      align-self: flex-start;
      margin-top: 2px;
    }
    .sol-nav-chevron {
      font-size: 10px;
      color: #94A3B8;
      transition: transform 0.2s;
    }
    #sol-nav-pill.open .sol-nav-chevron { transform: rotate(180deg); }

    /* Anonymous state — login link */
    #sol-nav-login {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #F59E0B;
      color: #0F172A;
      border-radius: 999px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      min-height: 44px;
    }
    #sol-nav-login:hover {
      background: #B45309;
      color: white;
    }
    .sol-nav-login-icon { font-size: 15px; }

    /* Dropdown menu — desktop */
    #sol-nav-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
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

    /* Menu header */
    .sol-nav-menu-header {
      padding: 12px 12px 10px;
      border-bottom: 1px solid #F1F5F9;
      margin-bottom: 4px;
    }
    .sol-nav-menu-header-name {
      font-weight: 600;
      font-size: 14px;
      color: #0F172A;
    }
    .sol-nav-menu-header-email {
      font-size: 12px;
      color: #64748B;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    }

    /* Menu items */
    .sol-nav-menu a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      text-decoration: none;
      color: #0F172A;
      font-size: 14px;
      border-radius: 6px;
      transition: background 0.1s;
      min-height: 40px;
    }
    .sol-nav-menu a:hover { background: #FEF3C7; }
    .sol-nav-menu a.sol-nav-logout {
      color: #DC2626;
      border-top: 1px solid #F1F5F9;
      margin-top: 4px;
      padding-top: 12px;
      border-radius: 0;
    }
    .sol-nav-menu a.sol-nav-logout:hover { background: #FEF2F2; }
    .sol-nav-menu-icon {
      font-size: 15px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    /* Backdrop cho mobile bottom sheet */
    #sol-nav-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 9998;
      display: none;
      animation: solNavFadeIn 0.2s;
    }
    #sol-nav-backdrop.open { display: block; }
    @keyframes solNavFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ─── TABLET (768-1024) ─── */
    @media (max-width: 1024px) {
      .sol-nav-name { display: none; }
      .sol-nav-info { flex-direction: row; align-items: center; }
      .sol-nav-tier { margin-top: 0; }
    }

    /* ─── MOBILE (<768) ─── */
    @media (max-width: 768px) {
      #sol-nav-pill {
        padding: 4px;
        gap: 0;
      }
      .sol-nav-info { display: none; }
      .sol-nav-chevron { display: none; }
      .sol-nav-avatar { width: 40px; height: 40px; font-size: 14px; }

      /* Bottom sheet menu */
      #sol-nav-menu {
        position: fixed;
        top: auto;
        bottom: 0;
        right: 0;
        left: 0;
        border-radius: 20px 20px 0 0;
        padding: 12px 12px 24px;
        max-height: 80vh;
        overflow-y: auto;
        animation: solNavSlideUp 0.25s ease-out;
      }
      @keyframes solNavSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      /* Drag handle */
      #sol-nav-menu.open::before {
        content: '';
        display: block;
        width: 40px;
        height: 4px;
        background: #CBD5E1;
        border-radius: 999px;
        margin: 0 auto 12px;
      }
      .sol-nav-menu-header {
        padding: 8px 12px 16px;
      }
      .sol-nav-menu a {
        padding: 14px 12px;
        font-size: 15px;
        min-height: 48px;
      }
      .sol-nav-menu-icon { font-size: 18px; }

      /* Login button smaller on mobile */
      #sol-nav-login {
        padding: 8px 12px;
        font-size: 12px;
      }
      #sol-nav-login .sol-nav-login-text { display: none; }
    }

    /* Print — hide */
    @media print {
      #sol-nav-v2, #sol-nav-backdrop { display: none !important; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ─── Build HTML ────────────────────────────────
  let widgetHtml = '';

  if (isLoggedIn) {
    widgetHtml = `
      <div id="sol-nav-v2">
        <div id="sol-nav-pill" role="button" tabindex="0" aria-label="Menu người dùng">
          <div class="sol-nav-avatar">${initials}</div>
          <div class="sol-nav-info">
            <div class="sol-nav-name">${escapeHtml(name)}</div>
            <div class="sol-nav-tier">${tierStyle.label}</div>
          </div>
          <div class="sol-nav-chevron">▼</div>
        </div>
        <div id="sol-nav-menu" class="sol-nav-menu" role="menu">
          <div class="sol-nav-menu-header">
            <div class="sol-nav-menu-header-name">${escapeHtml(name)}</div>
            <div class="sol-nav-menu-header-email">${escapeHtml(user.email || user.phone || '')}</div>
          </div>
          <a href="/toi/"><span class="sol-nav-menu-icon">🏠</span> Dashboard</a>
          <a href="/toi/ban-do/"><span class="sol-nav-menu-icon">🗺</span> Bản đồ hướng đi</a>
          <a href="/toi/so-hanh-trinh/"><span class="sol-nav-menu-icon">📓</span> Sổ Hành Trình</a>
          <a href="/prompts-studio/"><span class="sol-nav-menu-icon">🎨</span> Prompt Studio</a>
          <a href="/toi/sol-dong-hanh/"><span class="sol-nav-menu-icon">🤖</span> Sol Đồng Hành AI</a>
          <a href="/dang-xuat/" class="sol-nav-logout">
            <span class="sol-nav-menu-icon">🚪</span> Đăng xuất
          </a>
        </div>
      </div>
      <div id="sol-nav-backdrop"></div>
    `;
  } else {
    // Anonymous state
    widgetHtml = `
      <div id="sol-nav-v2">
        <a href="/dang-nhap/" id="sol-nav-login">
          <span class="sol-nav-login-icon">👤</span>
          <span class="sol-nav-login-text">Đăng nhập</span>
        </a>
      </div>
    `;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = widgetHtml;
  while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

  // ─── Interactions (chỉ khi logged in) ───────────
  if (isLoggedIn) {
    const pill = document.getElementById('sol-nav-pill');
    const menu = document.getElementById('sol-nav-menu');
    const backdrop = document.getElementById('sol-nav-backdrop');
    const nav = document.getElementById('sol-nav-v2');

    function toggleMenu() {
      const open = menu.classList.toggle('open');
      pill.classList.toggle('open');
      backdrop.classList.toggle('open', open);
      pill.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    pill.addEventListener('click', toggleMenu);
    pill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });

    // Close on backdrop click (mobile)
    backdrop.addEventListener('click', () => {
      menu.classList.remove('open');
      pill.classList.remove('open');
      backdrop.classList.remove('open');
    });

    // Close on outside click (desktop)
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !backdrop.contains(e.target)) {
        menu.classList.remove('open');
        pill.classList.remove('open');
        backdrop.classList.remove('open');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        pill.classList.remove('open');
        backdrop.classList.remove('open');
      }
    });

    // Swipe down to close (mobile)
    let touchStartY = 0;
    menu.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    menu.addEventListener('touchmove', (e) => {
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 80 && menu.scrollTop === 0) {
        menu.classList.remove('open');
        pill.classList.remove('open');
        backdrop.classList.remove('open');
      }
    }, { passive: true });
  }

  // ─── Auto-hide on scroll down (all states) ──────
  let lastScrollY = window.scrollY;
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const nav = document.getElementById('sol-nav-v2');
      if (!nav) { scrollTicking = false; return; }
      // Hide when scroll down >100px, show when scroll up
      if (currentY > lastScrollY && currentY > 100) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastScrollY = currentY;
      scrollTicking = false;
    });
  }, { passive: true });

  // ─── Helpers ───────────────────────────────
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
})();
