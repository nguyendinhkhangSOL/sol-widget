
// ═══════════════════════════════════════════════════════════════
// SOL V1.2 — Avatar icon (Bottom-right corner)
// Deploy: append vào /var/www/huongdi/public/sol-auth.js
//         + Include <script src="/sol-avatar-icon.js"> trong templates sol.vn
// UI: Icon tròn 44px ở góc phải DƯỚI, click mở dropdown UPWARD
// Không đè menu, không conflict với paywall lock
// ═══════════════════════════════════════════════════════════════

(function () {
  function getState() {
    try {
      var tier = localStorage.getItem('sol_tier');
      var active = localStorage.getItem('sol_active');
      var founder = localStorage.getItem('sol_founder');
      if (tier === 'founder' || founder === 'true') return 'founder';
      if (tier === 'active' || active === 'true') return 'active';
    } catch (e) {}
    return 'free';
  }

  function getName() {
    try { return localStorage.getItem('sol_ten') || ''; } catch (e) { return ''; }
  }

  function doLogout() {
    if (!confirm('Đăng xuất khỏi Sol?')) return;
    try {
      ['sol_tier','sol_ten','sol_expires_at','sol_activated_at','sol_token_prefix',
       'sol_active','sol_founder','sol_session_token','sol_pending_payment',
       'sol_activation_code','sol_user_email'].forEach(function(k){
        localStorage.removeItem(k);
      });
    } catch (e) {}
    alert('👋 Đã đăng xuất.');
    window.location.href = '/';
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function injectStyles() {
    if (document.getElementById('sol-avatar-style')) return;
    var s = document.createElement('style');
    s.id = 'sol-avatar-style';
    s.textContent =
      '.sol-avatar-wrapper { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: Inter, -apple-system, sans-serif; }' +
      '.sol-avatar-btn { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff; border: 3px solid #fff; box-shadow: 0 6px 20px rgba(15,23,42,0.3), 0 0 0 1px rgba(15,23,42,0.05); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; font-weight: 800; font-family: inherit; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; padding: 0; }' +
      '.sol-avatar-btn:hover { transform: scale(1.08); box-shadow: 0 8px 26px rgba(245, 158, 11, 0.45); }' +
      '.sol-avatar-btn.free { background: linear-gradient(135deg, #475569, #334155); font-size: 20px; }' +
      '.sol-avatar-btn.free:hover { box-shadow: 0 8px 26px rgba(71, 85, 105, 0.4); }' +
      '.sol-avatar-btn.founder { background: linear-gradient(135deg, #8B5CF6, #7C3AED); }' +
      '.sol-avatar-btn.founder:hover { box-shadow: 0 8px 26px rgba(139, 92, 246, 0.45); }' +
      '.sol-avatar-dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: #16A34A; border: 2px solid #fff; box-shadow: 0 0 6px rgba(22, 163, 74, 0.5); }' +
      '.sol-avatar-menu { display: none; position: absolute; bottom: 60px; right: 0; background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 24px 48px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.05); min-width: 240px; padding: 8px; }' +
      '.sol-avatar-menu.open { display: block; animation: solAvatarIn 0.25s cubic-bezier(0.4, 0, 0.2, 1); }' +
      '@keyframes solAvatarIn { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }' +
      '.sol-avatar-menu__header { padding: 14px 14px 12px; border-bottom: 1px solid #F1F5F9; margin-bottom: 6px; }' +
      '.sol-avatar-menu__hello { font-size: 12px; color: #64748B; font-weight: 500; }' +
      '.sol-avatar-menu__name { font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 3px; }' +
      '.sol-avatar-menu__tier { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 1px; padding: 3px 9px; border-radius: 8px; background: #FEF3C7; color: #B45309; margin-top: 8px; }' +
      '.sol-avatar-menu__tier.founder { background: #F5F3FF; color: #7C3AED; }' +
      '.sol-avatar-menu__item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 10px; color: #334155; text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; background: none; border: none; width: 100%; text-align: left; font-family: inherit; transition: background 0.12s; }' +
      '.sol-avatar-menu__item:hover { background: #F8FAFC; color: #F59E0B; }' +
      '.sol-avatar-menu__item--logout { color: #DC2626; margin-top: 4px; border-top: 1px solid #F1F5F9; border-radius: 0; padding-top: 12px; }' +
      '.sol-avatar-menu__item--logout:hover { background: #FEF2F2; color: #B91C1C; }' +
      '.sol-avatar-menu__item--primary { background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff !important; font-weight: 700; margin-top: 4px; }' +
      '.sol-avatar-menu__item--primary:hover { color: #fff !important; opacity: 0.95; background: linear-gradient(135deg, #D97706, #B45309); }' +
      '.sol-avatar-tooltip { position: absolute; bottom: 60px; right: 60px; background: #0F172A; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; box-shadow: 0 8px 20px rgba(0,0,0,0.2); }' +
      '.sol-avatar-tooltip::after { content: ""; position: absolute; top: 50%; right: -6px; transform: translateY(-50%); border: 6px solid transparent; border-left-color: #0F172A; }' +
      '.sol-avatar-wrapper:hover .sol-avatar-tooltip { opacity: 1; }' +
      '.sol-avatar-menu.open ~ .sol-avatar-tooltip, .sol-avatar-menu.open + .sol-avatar-tooltip { opacity: 0 !important; }' +
      '@media (max-width: 640px) { .sol-avatar-wrapper { bottom: 16px; right: 16px; } .sol-avatar-btn { width: 44px; height: 44px; font-size: 16px; } .sol-avatar-tooltip { display: none; } }';
    document.head.appendChild(s);
  }

  function render() {
    // Remove existing wrappers/bars
    ['.sol-avatar-wrapper', '.sol-status-bar-v2', '.sol-free-bar', '.sol-status-bar'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.remove();
    });

    injectStyles();

    var state = getState();
    var name = getName();

    var wrap = document.createElement('div');
    wrap.className = 'sol-avatar-wrapper';

    var iconChar, btnClass, tooltipText;
    if (state === 'free') {
      iconChar = '🔓';
      btnClass = 'sol-avatar-btn free';
      tooltipText = 'Đăng nhập / Đăng ký';
    } else if (state === 'founder') {
      iconChar = name ? name.charAt(0).toUpperCase() : '★';
      btnClass = 'sol-avatar-btn founder';
      tooltipText = 'Tài khoản Founder';
    } else {
      iconChar = name ? name.charAt(0).toUpperCase() : '✓';
      btnClass = 'sol-avatar-btn';
      tooltipText = name ? 'Xin chào, ' + name : 'Tài khoản Active';
    }

    var btn = document.createElement('button');
    btn.className = btnClass;
    btn.textContent = iconChar;
    btn.title = tooltipText;
    btn.setAttribute('aria-label', tooltipText);
    if (state !== 'free') {
      var dot = document.createElement('span');
      dot.className = 'sol-avatar-dot';
      btn.appendChild(dot);
    }

    var menu = document.createElement('div');
    menu.className = 'sol-avatar-menu';

    if (state === 'free') {
      menu.innerHTML =
        '<div class="sol-avatar-menu__header">' +
          '<div class="sol-avatar-menu__hello">Chưa đăng nhập</div>' +
          '<div class="sol-avatar-menu__name" style="color:#64748B; font-size:13px; font-weight:500;">Anh/chị chưa có tài khoản Sol?</div>' +
        '</div>' +
        '<a href="https://sol.vn/dang-nhap/" class="sol-avatar-menu__item">' +
          '<span>🔓</span> Đăng nhập' +
        '</a>' +
        '<a href="https://sol.vn/thanh-toan/" class="sol-avatar-menu__item sol-avatar-menu__item--primary">' +
          '💎 Đăng ký Sol Active' +
        '</a>';
    } else {
      var isFounder = (state === 'founder');
      var tierLabel = isFounder ? '🌟 FOUNDER · TRỌN ĐỜI' : '✓ ACTIVE · ĐANG DÙNG';
      var tierClass = isFounder ? 'sol-avatar-menu__tier founder' : 'sol-avatar-menu__tier';

      menu.innerHTML =
        '<div class="sol-avatar-menu__header">' +
          '<div class="sol-avatar-menu__hello">Xin chào,</div>' +
          '<div class="sol-avatar-menu__name">' + escHtml(name || 'Sol user') + '</div>' +
          '<div class="' + tierClass + '">' + tierLabel + '</div>' +
        '</div>' +
        '<a href="https://huongdi.sol.vn/tai-khoan/" class="sol-avatar-menu__