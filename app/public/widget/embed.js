/**
 * Sol Widget — embed loader script
 *
 * Usage trên sol.vn (hoặc bất kỳ site nào):
 *   <script src="https://bothuocla.sol.vn/widget/embed.js" defer></script>
 *
 * Script tự:
 *   - Tạo floating button góc phải
 *   - Click → mở iframe https://bothuocla.sol.vn/widget/embed.html
 *   - Iframe = full Sol chat (CHIP + AI)
 *
 * Cookie session shared qua domain .sol.vn → user vào sol.vn chat
 * thì khi sang bothuocla.sol.vn vẫn cùng thread.
 */

(function () {
  'use strict';

  if (window.__solWidgetLoaded) return;
  window.__solWidgetLoaded = true;

  var ORIGIN = 'https://bothuocla.sol.vn';
  var IFRAME_URL = ORIGIN + '/widget/embed';

  // ---- Inject CSS ----
  var css = `
    .sol-widget-bubble {
      position: fixed; bottom: 20px; right: 20px;
      width: 60px; height: 60px;
      background: #B25C2C; color: white;
      border-radius: 50%;
      box-shadow: 0 6px 24px rgba(178,92,44,0.3);
      cursor: pointer; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
      border: none; padding: 0;
    }
    .sol-widget-bubble:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(178,92,44,0.4); }
    .sol-widget-bubble svg { width: 26px; height: 26px; }
    .sol-widget-badge {
      position: absolute; top: -2px; right: -2px;
      width: 14px; height: 14px;
      background: #DC2626; border: 2px solid white;
      border-radius: 50%;
      animation: solPulse 2s infinite;
    }
    @keyframes solPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    .sol-widget-iframe {
      position: fixed; bottom: 0; right: 0;
      width: 100%; height: 80vh;
      max-width: 400px; max-height: 640px;
      border: none; z-index: 9998;
      box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
      border-radius: 16px 16px 0 0;
      background: white;
      display: none;
    }
    @media (min-width: 640px) {
      .sol-widget-iframe { bottom: 20px; right: 20px; border-radius: 16px; }
    }
    .sol-widget-iframe.is-open { display: block; }
    .sol-widget-bubble.is-hidden { display: none; }
  `;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Create elements ----
  var bubble = document.createElement('button');
  bubble.className = 'sol-widget-bubble';
  bubble.setAttribute('aria-label', 'Chat với Sol — cai thuốc lá');
  bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

  var iframe = document.createElement('iframe');
  iframe.className = 'sol-widget-iframe';
  iframe.setAttribute('title', 'Sol Chat');
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.src = ''; // lazy load on first open

  document.body.appendChild(bubble);
  document.body.appendChild(iframe);

  // ---- Open/close logic ----
  var isOpen = false;
  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      if (!iframe.src) iframe.src = IFRAME_URL;
      iframe.classList.add('is-open');
      bubble.classList.add('is-hidden');
      // Track open
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'sol_widget_open', { source: window.location.hostname });
      }
    } else {
      iframe.classList.remove('is-open');
      bubble.classList.remove('is-hidden');
    }
  }
  bubble.addEventListener('click', toggle);

  // ---- Listen for close message from iframe ----
  window.addEventListener('message', function (event) {
    if (event.origin !== ORIGIN) return;
    if (event.data && event.data.type === 'sol-widget-close') toggle();
    if (event.data && event.data.type === 'sol-widget-redirect' && event.data.url) {
      window.open(event.data.url, '_blank');
    }
  });

  // ---- Expose public API ----
  window.SolWidget = {
    open: function () { if (!isOpen) toggle(); },
    close: function () { if (isOpen) toggle(); },
    toggle: toggle
  };
})();
