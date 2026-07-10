
// ═══════════════════════════════════════════════════════════════
// SOL STATUS BAR — Universal (cho cả sol.vn + huongdi.sol.vn)
// Deploy: paste vào WPCode global header của sol.vn
//         hoặc append /var/www/huongdi/public/sol-auth.js
// ═══════════════════════════════════════════════════════════════

(function () {
  var SOL_VN = 'https://sol.vn';
  var HUONGDI = 'https://huongdi.sol.vn';

  function readTier() {
    try {
      var tier = localStorage.getItem('sol_tier');
      var active = localStorage.getItem('sol_active');
      var founder = localStorage.getItem('sol_founder');
      if (tier === 'founder' || founder === 'true') return 'founder';
      if (tier === 'active' || active === 'true') return 'active';
      return 'free';
    } catch (e) { return 'free'; }
  }

  function readTen() {
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
    window.location.href = SOL_VN + '/';
  }

  function injectStyle() {
    if (document.getElementById('sol-status-bar-style')) return;
    var style = document.createElement('style');
    style.id = 'sol-status-bar-style';
    style.textContent = [
      '.sol-status-bar-v2 {',
      '  position: fixed; top: 0; right: 0; z-index: 9998;',
      '  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);',
      '  color: #F1F5F9;',
      '  padding: 8px 16px 8px 18px;',
      '  border-radius: 0 0 0 12px;',
      '  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);',
      '  font-family: Inter, -apple-system, sans-serif;',
      '  font-size: 12.5px; font-weight: 500;',
      '  display: flex; align-items: center; gap: 10px;',
      '  border-left: 1px solid rgba(148, 163, 184, 0.15);',
      '  border-bottom: 1px solid rgba(148, 163, 184, 0.15);',
      '  line-height: 1.4;',
      '}',
      '.sol-status-bar-v2__dot {',
      '  width: 8px; height: 8px; border-radius: 50%;',
      '  background: #16A34A; box-shadow: 0 0 8px rgba(22, 163, 74, 0.6);',
      '  display: inline-block;',
      '}',
      '.sol-status-bar-v2__dot--free { background: #64748B; box-shadow: none; }',
      '.sol-status-bar-v2__label { color: #F1F5F9; font-weight: 600; }',
      '.sol-status-bar-v2__label--free { color: #94A3B8; font-weight: 500; }',
      '.sol-status-bar-v2__label--founder {',
      '  color: #FCD34D;',
      '  text-shadow: 0 0 12px rgba(252, 211, 77, 0.4);',
      '}',
      '.sol-status-bar-v2__sep { color: #475569; }',
      '.sol-status-bar-v2__link {',
      '  color: #F1F5F9; text-decoration: none; font-weight: 600;',
      '  padding: 3px 10px; border-radius: 6px;',
      '  transition: background 0.15s; cursor: pointer;',
      '  border: none; background: none; font-family: inherit; font-size: inherit;',
      '}',
      '.sol-status-bar-v2__link:hover { background: rgba(255, 255, 255, 0.08); }',
      '.sol-status-bar-v2__link--amber {',
      '  background: linear-gradient(135deg, #F59E0B, #D97706);',
      '  color: #FFFFFF !important;',
      '  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);',
      '}',
      '.sol-status-bar-v2__link--amber:hover {',
      '  background: linear-gradient(135deg, #D97706, #B45309);',
      '}',
      '.sol-status-bar-v2__link--logout {',
      '  color: #FCA5A5;',
      '  border-left: 1px solid rgba(148, 163, 184, 0.2);',
      '  margin-left: 4px; padding-left: 10px;',
      '}',
      '.sol-status-bar-v2__link--logout:hover {',
      '  background: rgba(220, 38, 38, 0.15); color: #FEE2E2;',
      '}',
      '@media (max-width: 640px) {',
      '  .sol-status-bar-v2 { font-size: 11.5px; padding: 6px 12px; gap: 6px; }',
      '  .sol-status-bar-v2__label--free { display: none; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function removeExistingBar() {
    // Remove existing bar (sol-free-bar, sol-status-bar from sol-auth.js v1)
    ['.sol-free-bar', '.sol-status-bar', '.sol-status-bar-v2'].forEach(function(sel){
      var el = document.querySelector(sel);
      if (el) el.remove();
    });
  }

  function renderBar() {
    removeExistingBar();
    injectStyle();

    var tier = readTier();
    var ten = readTen();

    var bar = document.createElement('div');
    bar.className = 'sol-status-bar-v2';

    if (tier === 'free') {
      bar.innerHTML =
        '<span class="sol-status-bar-v2__dot sol-status-bar-v2__dot--free"></span>' +
        '<span class="sol-status-bar-v2__label sol-status-bar-v2__label--free">Chưa đăng nhập</span>' +
        '<a href="' + SOL_VN + '/dang-nhap/" class="sol-status-bar-v2__link">Đăng nhập</a>' +
        '<span class="sol-status-bar-v2__sep">·</span>' +
        '<a href="' + SOL_VN + '/thanh-toan/" class="sol-status-bar-v2__link sol-status-bar-v2__link--amber">Đăng ký</a>';
    } else {
      // Active or Founder
      var isFounder = (tier === 'founder');
      var labelText = isFounder ? '🌟 Sol Founder' : '✓ Sol Active';
      var labelClass = isFounder ? 'sol-status-bar-v2__label--founder' : '';

      bar.innerHTML =
        '<span class="sol-status-bar-v2__dot"></span>' +
        '<span class="sol-status-bar-v2__label ' + labelClass + '">' + labelText + '</span>' +
        '<a href="' + HUONGDI + '/tai-khoan/" class="sol-status-bar-v2__link" title="' + (ten ? 'Tài khoản của ' + ten : 'Tài khoản') + '">Tài khoản</a>' +
        '<button class="sol-status-bar-v2__link sol-status-bar-v2__link--logout" id="sol-status-logout-v2">Đăng xuất</button>';

      // Attach logout after render
      setTimeout(function() {
        var btn = document.getElementById('sol-status-logout-v2');
        if (btn) btn.addEventListener('click', doLogout);
      }, 10);
    }

    document.body.appendChild(bar);
  }

  function init() {
    setTimeout(renderBar, 250);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
