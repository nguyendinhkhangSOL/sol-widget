/* sol-chrome.js — ĐÃ GỘP vào sol-ui.js (2026-08).
 * Giữ file này làm cầu chuyển tiếp: trang nào còn gọi /sol-chrome.js
 * sẽ tự nạp /sol-ui.js (nguồn header/footer duy nhất). */
(function () {
  if (window.__solcMounted || window.__solUiReq) return;
  window.__solUiReq = 1;
  var s = document.createElement('script');
  s.src = '/sol-ui.js';
  s.defer = true;
  document.head.appendChild(s);
})();
