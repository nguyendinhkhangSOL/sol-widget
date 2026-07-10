
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
