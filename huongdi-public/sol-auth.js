/**
 * Sol Auth v2 — Paywall + Tier Detection từ JWT
 * ─────────────────────────────────────────────────────────────
 * Version: 2.0 — 2026-07-05
 * Fix: Đọc tier từ JWT + sol_user localStorage
 *      → FOUNDER/ACTIVE unlock full 37 direction
 *      → FREE lock 32/37 (chỉ 5 featured hiển thị)
 *      → ANONYMOUS lock same as FREE
 */
(function() {
  'use strict';

  const DEBUG = new URLSearchParams(location.search).has('sol-debug');
  function log(...args) {
    if (DEBUG) console.log('[Sol Auth v2]', ...args);
  }

  // ─── JWT + User info ────────────────────────────────────────
  function getJwt() {
    return localStorage.getItem('sol_jwt') || null;
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('sol_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function getTier() {
    const user = getCurrentUser();
    if (!user || !user.tier) return 'ANONYMOUS';
    return user.tier;  // FREE | ACTIVE | FOUNDER | EXPIRED
  }

  function isLoggedIn() {
    return !!getJwt() && !!getCurrentUser();
  }

  function isPaidTier() {
    const tier = getTier();
    return tier === 'ACTIVE' || tier === 'FOUNDER';
  }

  // Parse JWT payload without verification (client-side check only)
  function decodeJwt(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      // Check exp
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        log('JWT expired');
        localStorage.removeItem('sol_jwt');
        return null;
      }
      return payload;
    } catch (_) { return null; }
  }

  // Verify JWT still valid; if expired → force re-login
  function verifyJwtOrLogout() {
    const jwt = getJwt();
    if (!jwt) return false;
    const payload = decodeJwt(jwt);
    if (!payload) {
      // Expired or invalid
      localStorage.removeItem('sol_jwt');
      localStorage.removeItem('sol_user');
      return false;
    }
    return true;
  }

  // ─── Direction Paywall Logic ────────────────────────────────
  /**
   * Determine if a direction should be locked for current user.
   * @param {object} direction — { id, slug, isFeatured, requiresTier }
   * @returns {boolean} — true if locked
   */
  function shouldLockDirection(direction) {
    if (!direction) return true;

    // Paid tier → unlock everything
    if (isPaidTier()) return false;

    // Free/anonymous → unlock only 5 featured directions
    const isFeatured = direction.isFeatured === true
      || direction.featured === true
      || direction.requiresTier === 'FREE';
    return !isFeatured;
  }

  /**
   * Render lock overlay on direction card if needed.
   * @param {HTMLElement} cardEl
   * @param {object} direction
   */
  function applyLockToCard(cardEl, direction) {
    if (!cardEl || !direction) return;
    if (shouldLockDirection(direction)) {
      cardEl.classList.add('sol-locked');
      cardEl.setAttribute('data-locked', 'true');
      // Add lock badge if not exists
      if (!cardEl.querySelector('.sol-lock-badge')) {
        const badge = document.createElement('div');
        badge.className = 'sol-lock-badge';
        badge.innerHTML = '🔒 Cần nâng cấp';
        cardEl.appendChild(badge);
      }
    } else {
      cardEl.classList.remove('sol-locked');
      cardEl.removeAttribute('data-locked');
    }
  }

  /**
   * Handle click on locked card — redirect to /thanh-toan/ or show paywall modal
   */
  function handleLockedClick(e) {
    const card = e.currentTarget;
    if (card.getAttribute('data-locked') === 'true') {
      e.preventDefault();
      e.stopPropagation();
      showPaywallModal();
      return false;
    }
  }

  function showPaywallModal() {
    // Simple modal — có thể replace bằng custom modal đẹp hơn
    const msg = 'Hướng đi này chỉ có ở gói Active hoặc Founder.\n\nNâng cấp 499k/năm để mở khoá toàn bộ 37 hướng đi + roadmap 90 ngày + prompt studio.';
    if (confirm(msg + '\n\nMở trang thanh toán?')) {
      location.href = '/thanh-toan/';
    }
  }

  // ─── Update Header UI (login state) ─────────────────────────
  function updateHeaderUI() {
    const user = getCurrentUser();
    const tier = getTier();

    // Find login/register links to hide when logged in
    document.querySelectorAll('[data-auth-hide-when-logged-in]').forEach(el => {
      el.style.display = user ? 'none' : '';
    });

    // Find elements to show when logged in
    document.querySelectorAll('[data-auth-show-when-logged-in]').forEach(el => {
      el.style.display = user ? '' : 'none';
    });

    // Populate user info elements
    if (user) {
      document.querySelectorAll('[data-user-name]').forEach(el => {
        el.textContent = user.displayName || 'Sol Member';
      });
      document.querySelectorAll('[data-user-tier]').forEach(el => {
        el.textContent = tier;
        el.className = (el.className || '') + ' tier-' + tier;
      });
    }
  }

  // ─── Apply paywall to all direction cards on page ───────────
  function applyPaywallToAllCards() {
    // Common selectors — adjust based on actual la-ban-huong-di HTML
    const selectors = [
      '.direction-card',
      '[data-direction-id]',
      '.card-huong-di',
      '.direction-item',
    ];

    let count = 0;
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(card => {
        const directionData = extractDirectionData(card);
        if (directionData) {
          applyLockToCard(card, directionData);
          card.addEventListener('click', handleLockedClick, { capture: true });
          count++;
        }
      });
      if (count > 0) break;  // Use first matching selector
    }
    log('Applied paywall to', count, 'cards. Tier:', getTier());
  }

  function extractDirectionData(cardEl) {
    return {
      id: cardEl.getAttribute('data-direction-id') || cardEl.getAttribute('data-id'),
      slug: cardEl.getAttribute('data-slug'),
      isFeatured: cardEl.getAttribute('data-featured') === 'true'
        || cardEl.classList.contains('is-featured')
        || cardEl.classList.contains('featured'),
      requiresTier: cardEl.getAttribute('data-tier') || 'FREE',
    };
  }

  // ─── Inject lock styles ─────────────────────────────────────
  function injectLockStyles() {
    if (document.getElementById('sol-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'sol-auth-styles';
    style.textContent = `
      .sol-locked {
        position: relative;
        opacity: 0.7;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .sol-locked:hover { opacity: 0.9; }
      .sol-locked::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.35);
        border-radius: inherit;
        z-index: 1;
        pointer-events: none;
      }
      .sol-lock-badge {
        position: absolute; top: 12px; right: 12px;
        background: #0F172A; color: #FCD34D;
        padding: 4px 12px; border-radius: 999px;
        font-size: 12px; font-weight: 600;
        z-index: 2; pointer-events: none;
      }
      .sol-locked > *:not(.sol-lock-badge) { pointer-events: none; }
      .tier-FOUNDER { background: #FEF3C7; color: #78350F; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
      .tier-ACTIVE  { background: #FEF3C7; color: #B45309; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
      .tier-FREE    { background: #E2E8F0; color: #475569; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
    `;
    document.head.appendChild(style);
  }

  // ─── Initialize ─────────────────────────────────────────────
  function init() {
    verifyJwtOrLogout();  // Auto logout if expired
    injectLockStyles();
    updateHeaderUI();
    applyPaywallToAllCards();

    // Re-apply on dynamic content load (SolLoadDirections finishes)
    document.addEventListener('sol-directions-loaded', applyPaywallToAllCards);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Expose globally ─────────────────────────────────────────
  window.SolAuth = window.SolAuth || {};
  Object.assign(window.SolAuth, {
    getJwt,
    getCurrentUser,
    getTier,
    isLoggedIn,
    isPaidTier,
    // ─── Backward-compat aliases (legacy paywall code) ─────────
    isActive: isPaidTier,        // paywall v1 gọi isActive()
    isFounder: () => getTier() === 'FOUNDER',
    isFree: () => !isPaidTier(),
    isAnonymous: () => !isLoggedIn(),
    // ─── Paywall UI ─────────────────────────────────────────
    shouldLockDirection,
    applyLockToCard,
    applyPaywallToAllCards,
    showPaywallModal,
    showPaywall: showPaywallModal,  // legacy alias
    updateHeaderUI,
    logout: () => {
      localStorage.removeItem('sol_jwt');
      localStorage.removeItem('sol_user');
      localStorage.removeItem('sol_active');  // legacy flag
      localStorage.removeItem('sol_tier');    // legacy flag
      location.href = '/dang-nhap/';
    },
  });

  // ─── Legacy compat: sync tier → localStorage flags ─────────
  // Paywall v1 có thể check localStorage.sol_active / sol_tier
  (function syncLegacyFlags() {
    if (isPaidTier()) {
      localStorage.setItem('sol_active', 'true');
      localStorage.setItem('sol_tier', getTier());
    } else {
      localStorage.removeItem('sol_active');
    }
  })();

  log('Sol Auth v2 initialized. Tier:', getTier());
})();
