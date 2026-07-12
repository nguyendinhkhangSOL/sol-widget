/**
 * Sol API Sync v2 — WITH JWT AUTH INTEGRATION
 * ─────────────────────────────────────────────────────────────
 * Version: 2.0 — 2026-07-05
 * Fix: Gửi JWT trong Authorization header nếu user đã login
 *      → Backend link P1/P2/Events với User.id thay vì anonymous
 */
(function() {
  'use strict';

  // ─── Config ─────────────────────────────────────────────────
  const API_BASE = window.SOL_API_BASE || 'https://huongdi.sol.vn/api';
  const DEBUG = new URLSearchParams(location.search).has('sol-debug');

  function log(...args) {
    if (DEBUG || location.hostname === 'localhost') {
      console.log('[Sol API Sync v2]', ...args);
    }
  }

  function warn(...args) {
    console.warn('[Sol API Sync v2]', ...args);
  }

  // ─── Auth Helpers (NEW) ─────────────────────────────────────
  function getJwt() {
    return localStorage.getItem('sol_jwt') || null;
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('sol_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  // Build headers with auth if JWT present
  function authHeaders(extra) {
    const h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    const jwt = getJwt();
    if (jwt) h['Authorization'] = 'Bearer ' + jwt;
    return h;
  }

  // ─── Session ID (anonymous tracking) ────────────────────────
  function getSessionId() {
    let sid = localStorage.getItem('sol_session_id');
    if (!sid) {
      sid = 'sol-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);
      localStorage.setItem('sol_session_id', sid);
      log('New session created:', sid);
    }
    return sid;
  }

  // ─── UTM Tracking ───────────────────────────────────────────
  function getUtm() {
    const params = new URLSearchParams(location.search);
    return {
      utmSource: params.get('utm_source') || sessionStorage.getItem('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || sessionStorage.getItem('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || sessionStorage.getItem('utm_campaign') || undefined,
    };
  }

  (function persistUtm() {
    const params = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(key => {
      const val = params.get(key);
      if (val) sessionStorage.setItem(key, val);
    });
  })();

  // ─── P1 Sync ────────────────────────────────────────────────
  async function syncP1(data) {
    try {
      const norm = data.scores_normalized || {};
      const raw = data.scores || {};

      function getScore(key) {
        const n = norm[key];
        if (typeof n === 'number' && n > 0) return Math.round(n);
        const r = raw[key];
        if (typeof r === 'number' && r > 0) {
          return Math.max(0, Math.min(100, Math.round((r - 20) / 80 * 100)));
        }
        return 0;
      }

      const total = getScore('people') + getScore('expert') + getScore('builder') + getScore('independent');
      if (total === 0) {
        log('⚠ Skip P1 sync: quiz chưa complete');
        return;
      }

      const rank = data.ranking || Object.keys(raw).sort((a, b) => (raw[b] || 0) - (raw[a] || 0));
      const dna = data.dna || {};

      const payload = {
        sessionId: getSessionId(),
        people: getScore('people'),
        expert: getScore('expert'),
        builder: getScore('builder'),
        independent: getScore('independent'),
        rank1: rank[0] || dna.primary || 'expert',
        rank2: rank[1] || dna.secondary || 'independent',
        rank3: rank[2] || dna.supporting || 'builder',
        rank4: rank[3] || dna.weak || 'people',
        rawAnswers: data.rawAnswers || data.answers || { scores_raw: raw, scores_norm: norm, migrated: true, ts: Date.now() },
        version: 1,
      };

      const user = getCurrentUser();
      log('POST /p1/result', user ? '[authenticated user=' + user.id + ']' : '[anonymous]', payload);

      const res = await fetch(API_BASE + '/p1/result', {
        method: 'POST',
        headers: authHeaders(),      // ← NEW: JWT header
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const r = await res.json();
        localStorage.setItem('sol_p1_id', r.id);
        log('✅ P1 synced:', r.id, r.userId ? '(linked user)' : '(anonymous)');
        trackEvent('P1_COMPLETE', { p1Id: r.id });
      } else {
        warn('P1 sync HTTP', res.status);
      }
    } catch (e) {
      warn('P1 sync fail:', e.message);
    }
  }

  // ─── P2 Sync ────────────────────────────────────────────────
  async function syncP2(data) {
    try {
      const s = data.scores || {};
      const S = data.S || {};

      function getP2Score(...keys) {
        for (const k of keys) {
          const v = s[k];
          if (typeof v === 'number' && v > 0) return Math.round(v);
        }
        return 0;
      }

      const experience = getP2Score('expScore', 'experience');
      const capital = getP2Score('capScore', 'capital');
      const time = getP2Score('timeScore', 'time');
      const technology = getP2Score('techScore', 'technology');
      const network = getP2Score('netScore', 'network');
      const risk = getP2Score('riskScore', 'risk');
      const energy = getP2Score('energyScore', 'energy');

      const total = experience + capital + time + technology + network + risk + energy;
      if (total === 0) {
        log('⚠ Skip P2 sync: quiz chưa complete');
        return;
      }

      const incIdeal = S.incIdeal || (s.incomeScore ? s.incomeScore / 3.33 : 15);
      let incomeGoal;
      if (incIdeal <= 5) incomeGoal = '2-5tr';
      else if (incIdeal <= 15) incomeGoal = '5-15tr';
      else if (incIdeal <= 30) incomeGoal = '15-30tr';
      else incomeGoal = '30tr+';

      const payload = {
        sessionId: getSessionId(),
        experience, capital, time, technology, network, risk, energy,
        incomeGoal,
        rawAnswers: data.rawAnswers || data.answers || { scores_raw: s, S, migrated: true, ts: Date.now() },
        version: 1,
      };

      const user = getCurrentUser();
      log('POST /p2/result', user ? '[authenticated]' : '[anonymous]', payload);

      const res = await fetch(API_BASE + '/p2/result', {
        method: 'POST',
        headers: authHeaders(),      // ← NEW: JWT header
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const r = await res.json();
        localStorage.setItem('sol_p2_id', r.id);
        log('✅ P2 synced:', r.id, r.userId ? '(linked user)' : '(anonymous)');
        trackEvent('P2_COMPLETE', { p2Id: r.id });
      } else {
        warn('P2 sync HTTP', res.status);
      }
    } catch (e) {
      warn('P2 sync fail:', e.message);
    }
  }

  // ─── Event Tracking ─────────────────────────────────────────
  async function trackEvent(eventType, meta) {
    try {
      const utm = getUtm();
      const payload = {
        sessionId: getSessionId(),
        eventType,
        directionId: meta?.directionId,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        meta: meta || {},
      };

      const res = await fetch(API_BASE + '/events', {
        method: 'POST',
        headers: authHeaders(),      // ← NEW: JWT header
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) log('✓ Event tracked:', eventType);
    } catch (e) { /* silent */ }
  }

  // ─── Load Directions from API ───────────────────────────────
  window.SolLoadDirections = async function() {
    try {
      const res = await fetch(API_BASE + '/directions/list', {
        headers: authHeaders(),      // ← NEW: send JWT để backend biết tier
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        log('✅ Loaded', data.length || 0, 'directions from API');
        return data;
      }
    } catch (e) {
      warn('Load directions fail:', e.message);
    }
    return null;
  };

  // ─── Save Direction ─────────────────────────────────────────
  window.SolSaveDirection = async function(directionId, matchScore, notes) {
    try {
      const payload = { directionId, matchScore, notes };
      const res = await fetch(API_BASE + '/saved', {
        method: 'POST',
        headers: authHeaders(),      // ← NEW: JWT required
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const r = await res.json();
        log('✅ Saved direction:', r);
        trackEvent('DIRECTION_SAVE', { directionId, matchScore });
        return r;
      }

      if (res.status === 401) {
        alert('Vui lòng đăng nhập để lưu vào Sổ Hành Trình');
        return null;
      }
    } catch (e) {
      warn('Save direction fail:', e.message);
    }
    return null;
  };

  // ─── Hook localStorage.setItem ──────────────────────────────
  const origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    origSetItem(key, value);

    if (key === 'p1_result') {
      try {
        const data = JSON.parse(value);
        if (data && (data.scores || data.scores_normalized)) syncP1(data);
      } catch (e) { /* silent */ }
    }

    if (key === 'p2_result') {
      try {
        const data = JSON.parse(value);
        if (data && data.scores) syncP2(data);
      } catch (e) { /* silent */ }
    }
  };

  // ─── Auto-sync existing localStorage data (once on load) ────
  (function syncExisting() {
    if (!localStorage.getItem('sol_p1_id')) {
      const p1Raw = localStorage.getItem('p1_result');
      if (p1Raw) {
        try {
          const data = JSON.parse(p1Raw);
          if (data && (data.scores || data.scores_normalized)) {
            log('Syncing existing p1_result...');
            syncP1(data);
          }
        } catch (e) { /* silent */ }
      }
    }

    if (!localStorage.getItem('sol_p2_id')) {
      const p2Raw = localStorage.getItem('p2_result');
      if (p2Raw) {
        try {
          const data = JSON.parse(p2Raw);
          if (data && data.scores) {
            log('Syncing existing p2_result...');
            syncP2(data);
          }
        } catch (e) { /* silent */ }
      }
    }
  })();

  // ─── Page View Tracking ─────────────────────────────────────
  const path = location.pathname;
  let pageEvent = null;
  if (path.includes('kham-pha-ban-than') || path.includes('buoc1')) pageEvent = 'P1_START';
  else if (path.includes('la-ban-huong-di') || path.includes('buoc3')) pageEvent = 'P3_VIEW';

  if (pageEvent) {
    setTimeout(() => trackEvent(pageEvent, {}), 500);
  }

  // ─── Expose helpers globally for other scripts ─────────────
  window.SolAuth = {
    getJwt,
    getCurrentUser,
    authHeaders,
    getSessionId,
    isLoggedIn: () => !!getJwt(),
    getTier: () => {
      const user = getCurrentUser();
      return user ? user.tier : 'ANONYMOUS';
    },
  };

  const user = getCurrentUser();
  log('Initialized v2. Session:', getSessionId(),
      user ? ('User: ' + user.displayName + ' (' + user.tier + ')') : 'Anonymous',
      'API:', API_BASE);
})();
