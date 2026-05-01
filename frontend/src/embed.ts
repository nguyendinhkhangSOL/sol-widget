// frontend/src/embed.ts
// Embeddable IIFE entry. Exposes window.SOLWidget.{init, open, close, setToken}.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { SolWidget } from './SolWidget';
import { useStore } from './state/store';
import './styles.css';

interface SOLWidgetAPI {
  init: (opts?: { apiBase?: string; socketBase?: string; token?: string; autoOpen?: boolean }) => void;
  open: () => void;
  close: () => void;
  setToken: (token: string) => void;
  logout: () => void;
}

let mounted = false;

function ensureHost(): HTMLElement {
  let host = document.getElementById('sol-widget-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'sol-widget-host';
    document.body.appendChild(host);
  }
  return host;
}

const api: SOLWidgetAPI = {
  init(opts = {}) {
    if (mounted) return;
    mounted = true;
    if (opts.token) {
      localStorage.setItem('sol_token', opts.token);
    }
    const host = ensureHost();
    ReactDOM.createRoot(host).render(
      React.createElement(SolWidget, {
        apiBase: opts.apiBase,
        socketBase: opts.socketBase,
        initialOpen: opts.autoOpen ?? false,
      })
    );
  },
  open() {
    useStore.getState().setExpanded(true);
  },
  close() {
    useStore.getState().setExpanded(false);
  },
  setToken(token: string) {
    localStorage.setItem('sol_token', token);
    useStore.getState().init(token);
  },
  logout() {
    localStorage.removeItem('sol_token');
    useStore.getState().reset();
  },
};

// Expose to global scope
declare global {
  interface Window {
    SOLWidget?: SOLWidgetAPI;
  }
}
(window as any).SOLWidget = api;

// Auto-init if data-auto attribute is present on the script tag
const script = document.currentScript as HTMLScriptElement | null;
if (script?.dataset.auto === 'true') {
  api.init({
    apiBase: script.dataset.apiBase,
    socketBase: script.dataset.socketBase,
    token: script.dataset.token,
    autoOpen: script.dataset.autoOpen === 'true',
  });
}

export default api;
