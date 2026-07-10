/**
 * Sol User Nav — Global user menu widget (top-right, fixed)
 * ─────────────────────────────────────────────────────────
 * Load vào TẤT CẢ pages qua script tag.
 * Auto-detect JWT → show user avatar + dropdown menu.
 * Include logout, dashboard, layer links.
 *
 * Version: 1.0 — 2026-07-05
 */
(function() {
  'use strict';

  const API_BASE = window.SOL_API_BASE || 'https://huongdi.sol.vn/api';

  function getJwt() { return localStorage.getItem('sol_jwt'); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('sol_user') || 'null'); }
    catch { return null; }
  }

  const user = getUser();
  const jwt = getJwt();

  // Chỉ hiện khi logged in
  if (!user || !jwt) return;

  // Không hiện trên trang admin panel (tránh conflict)
  if (location.hostname.startsWith('admin')) return;

  // Không hiện trên /dang-nhap/, /dang-ky/, /quen-mat-khau/, /dat-lai-mat-khau/
  const authPaths = ['/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau'];
  if (authPaths.some(p => location.pathname.startsWith(p))) return;

  // ─── Compute initials ──────────────────────────
  const name = user.displayName || 'Sol';
  const initials = name
    .split(/\s+/)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const tier = user.tier || 'FREE';
  const tierColor = {
    FREE: { bg: '#E2E8F0', color: '#475569' },
    ACTIVE: { bg: '#FEF3C7', color: '#B45309' },
    FOUNDER: { bg: '#FDE68A', color: '#78350F' },
    EXPIRED: { bg: '#FEF2F2', color: '#DC2626' },
  }[tier] || { bg: '#E2E8F0', color: '#475569' };

  // ─── Inject CSS ────────────────────────────────
  const css = `
    #sol-user-nav {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      font-family: -apple-system, 'Segoe UI', Roboto, Inter, sans-serif;
    }
    #sol-user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    #sol-user-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    }
    #sol-user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F59E0B, #B45309);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }
    #sol-user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    #sol-user-name {
      font-size: 13px;
      font-weight: 600;
      color: #0F172A;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #sol-user-tier {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 999px;
      background: ${tierColor.bg};
      color: ${tierColor.color};
      font-weight: 700;
      letter-spacing: 0.5px;
      align-self: flex-start;
    }
    #sol-user-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.12);
      min-width: 220px;
      padding: 8px;
      display: none;
      animation: solNavFadeIn 0.15s ease-out;
    }
    #sol-user-menu.open { display: block; }
    @keyframes solNavFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #sol-user-menu .sol-menu-header {
      padding: 12px 12px 8px;
      border-bottom: 1px solid #E2E8F0;
      margin-bottom: 4px;
    }
    #sol-user-menu .sol-menu-email {
      font-size: 12px;
      color: #64748B;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #sol-user-menu a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      text-decoration: none;
      color: #0F172A;
      font-size: 14px;
      border-radius: 6px;
      transition: background 0.1s;
    }
    #sol-user-menu a:hover { background: #FEF3C7; }
    #sol-user-menu a.sol-logout {
      color: #DC2626;
      border-top: 1px solid #E2E8F0;
      margin-top: 4px;
      padding-top: 12px;
      border-radius: 0;
    }
    #sol-user-menu a.sol-logout:hover { background: #FEF2F2; }
    #sol-user-menu .sol-menu-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }
    @media (max-width: 640px) {
      #sol-user-nav { top: 8px; right: 8px; }
      #sol-user-name { max-width: 80px; }
    }
    @media print {
      #sol-user-nav { display: none !important; }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ─── Inject HTML ────────────────────────────────
  const html = `
    <div id="sol-user-nav">
      <div id="sol-user-pill" onclick="window.__solToggleMenu()">
        <div id="sol-user-avatar">${initials}</div>
        <div id="sol-user-info">
          <div id="sol-user-name">${escapeHtml(name)}</div>
          <div id="sol-user-tier">${tier}</div>
        </div>
      </div>
      <div id="sol-user-menu">
        <div class="sol-menu-header">
          <div style="font-weight:600; font-size:14px;">${escapeHtml(name)}</div>
          <div class="sol-menu-email">${escapeHtml(user.email || user.phone || '')}</div>
        </div>
        <a href="/toi/"><span class="sol-menu-icon">🏠</span> Dashboard</a>
        <a href="/toi/ban-do/"><span class="sol-menu-icon">🗺</span> Bản đồ hướng đi</a>
        <a href="/toi/so-hanh-trinh/"><span class="sol-menu-icon">📓</span> Sổ Hành Trình</a>
        <a href="/prompts-studio/"><span class="sol-menu-icon">🎨</span> Prompt Studio</a>
        <a href="/toi/sol-dong-hanh/"><span class="sol-menu-icon">🤖</span> Sol Đồng Hành AI</a>
        <a href="#" class="sol-logout" onclick="window.__solLogout(); return false;">
          <span class="sol-menu-icon">🚪</span> Đăng xuất
        </a>
      </div>
    </div>
  `;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper.firstElementChild);

  // ─── Handlers ─────────────────────────────────
  window.__solToggleMenu = function() {
    document.getElementById('sol-user-menu').classList.toggle('open');
  };

  window.__solLogout = function() {
    if (confirm('Đăng xuất khỏi Sol La Bàn?')) {
      localStorage.removeItem('sol_jwt');
      localStorage.removeItem('sol_user');
      localStorage.removeItem('sol_active');
      localStorage.removeItem('sol_tier');
      // Keep sol_session_id để track cross-session analytics
      location.href = '/dang-nhap/';
    }
  };

  // Close menu when click outside
  document.addEventListener('click', (e) => {
    const nav = document.getElementById('sol-user-nav');
    if (nav && !nav.contains(e.target)) {
      document.getElementById('sol-user-menu')?.classList.remove('open');
    }
  });

  // ─── Helpers ─────────────────────────────
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
})();
