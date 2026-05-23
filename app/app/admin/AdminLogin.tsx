'use client';

import { useState } from 'react';

export function AdminLogin() {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 360, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Sol Admin Login</h2>
        </div>
        <div className="admin-field">
          <label className="admin-label">Admin key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="..."
            className="admin-input"
            autoFocus
            required
          />
          <p className="admin-hint">Key được set qua env var ADMIN_PANEL_KEY</p>
        </div>
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ width: '100%' }}>
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
