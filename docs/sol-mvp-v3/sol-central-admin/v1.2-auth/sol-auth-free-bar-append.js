
// ═══════════════════════════════════════════════════════════════
// SOL V1.2 — FREE STATE STATUS BAR
// Append vào cuối /var/www/huongdi/public/sol-auth.js
// Hiện thanh "Chưa đăng nhập · Đăng nhập · Đăng ký" ở góc phải trên
// KHI user chưa Active/Founder
// ═══════════════════════════════════════════════════════════════

(function () {
  var SOL_VN = 'https://sol.vn';

  function isLoggedIn() {
    try {
      var tier = localStorage.getItem('sol_tier');
      var active = localStorage.getItem('sol_active');
      var founder = localStorage.getItem('sol_founder');
      if (tier === 'active' || tier === 'founder') return true;
      if (active === 'true' || founder === 'true') return true;
      return false;
    } catch (e) { return false; }
  }

  function injectStyle() {
    if (document.getElementById('sol-free-bar-style')) return;
    var style = document.createElement('style');
    style.id = 'sol-free-bar-style';
    style.textContent = [
      '.sol-free-bar {',
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
      '}',
      '.sol-free-bar__label { color: #94A3B8; }',
      '.sol-free-bar__sep { color: #475569; }',
      '.sol-free-bar__link {',
      '  color: #F1F5F9; text-decoration: none; font-weight: 600;',
      '  padding: 3px 10px; border-radius: 6px;',
      '  transition: background 0.15s;',
      '}',
      '.sol-free-bar__link:hover { background: rgba(255, 255, 255, 0.08); }',
      '.sol-free-bar__link--amber {',
      '  background: linear-gradient(135deg, #F59E0B, #D97706);',
      '  color: #FFFFFF !important;',
      '  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);',
      '}',
      '.sol-free-bar__link--amber:hover {',
      '  background: linear-gradient(135deg, #D97706, #B45309);',
      '}',
      '@media (max-width: 640px) {',
      '  .sol-free-bar { font-size: 11.5px; padding: 6px 12px; gap: 6px; }',
      '  .sol-free-bar__label { display: none; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function renderBar() {
    // Chỉ hiện nếu chưa login
    if (isLoggedIn()) return;
    if (document.querySelector('.sol-free-bar')) return;

    injectStyle();

    var bar = document.createElement('div');
    bar.className = 'sol-free-bar';
    bar.innerHTML =
      '<span class="sol-free-bar__label">🔓 Chưa đăng nhập</span>' +
      '<a href="' + SOL_VN + '/dang-nhap/" class="sol-free-bar__link">Đăng nhập</a>' +
      '<span class="sol-free-bar__sep">·</span>' +
      '<a href="' + SOL_VN + '/thanh-toan/" class="sol-free-bar__link sol-free-bar__link--amber">Đăng ký</a>';

    document.body.appendChild(bar);
  }

  function init() {
    // Delay để đảm bảo sol-auth.js Active status bar render trước (nếu có)
    setTimeout(renderBar, 200);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
