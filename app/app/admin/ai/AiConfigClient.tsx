'use client';

import { useState } from 'react';

interface Props {
  initial: {
    enabled: boolean;
    provider: 'openai' | 'anthropic' | 'gemini';
    apiKeyMasked: string;
    hasApiKey: boolean;
    modelPrimary: string;
    modelEscalated: string;
    dailyQuotaMsgs: number;
    maxOutputTokens: number;
    temperature: number;
    source: string;
  };
}

const MODELS: Record<string, { primary: string[]; escalated: string[] }> = {
  openai: {
    primary: ['gpt-4o-mini', 'gpt-4o'],
    escalated: ['gpt-4o', 'gpt-4-turbo']
  },
  anthropic: {
    primary: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
    escalated: ['claude-sonnet-4-6', 'claude-opus-4-6']
  },
  gemini: {
    primary: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b'],
    escalated: ['gemini-2.5-pro', 'gemini-1.5-pro']
  }
};

export function AiConfigClient({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [provider, setProvider] = useState(initial.provider);
  const [apiKey, setApiKey] = useState('');
  const [modelPrimary, setModelPrimary] = useState(initial.modelPrimary);
  const [modelEscalated, setModelEscalated] = useState(initial.modelEscalated);
  const [dailyQuota, setDailyQuota] = useState(initial.dailyQuotaMsgs);
  const [maxTokens, setMaxTokens] = useState(initial.maxOutputTokens);
  const [temperature, setTemperature] = useState(initial.temperature);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ ok: boolean; latency_ms?: number; sample?: string; error?: string } | null>(null);
  const [pinging, setPinging] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: any = {
        enabled,
        provider,
        modelPrimary,
        modelEscalated,
        dailyQuotaMsgs: dailyQuota,
        maxOutputTokens: maxTokens,
        temperature
      };
      // Only send apiKey if user typed (otherwise keep current)
      if (apiKey.trim()) body.apiKey = apiKey.trim();

      const res = await fetch('/api/admin/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      setApiKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function ping() {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/admin/ai/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim() || undefined,
          model: modelPrimary
        })
      });
      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setPingResult({ ok: false, error: err.message });
    } finally {
      setPinging(false);
    }
  }

  return (
    <>
      <div className="admin-card">
        <h3 className="admin-card-title">Provider + Authentication</h3>

        <div className="admin-fields-grid">
          <div className="admin-field">
            <label className="admin-label">Enabled</label>
            <select className="admin-select" value={enabled ? '1' : '0'} onChange={(e) => setEnabled(e.target.value === '1')}>
              <option value="1">✓ Enabled — AI Mentor active</option>
              <option value="0">✗ Disabled — chỉ dùng CHIP</option>
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label">Provider</label>
            <select className="admin-select" value={provider} onChange={(e) => {
              const p = e.target.value as any;
              setProvider(p);
              setModelPrimary(MODELS[p].primary[0]);
              setModelEscalated(MODELS[p].escalated[0]);
            }}>
              <option value="openai">OpenAI (GPT)</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-label">API Key {initial.hasApiKey && <span className="admin-badge green" style={{ marginLeft: 6 }}>HAS KEY</span>}</label>
          <input
            type="password"
            className="admin-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={initial.hasApiKey ? `Current: ${initial.apiKeyMasked} — để trống nếu giữ key cũ` : 'Paste API key'}
          />
          <div className="admin-hint">
            ⚠️ Key được lưu vào DB (encrypted at-rest by Postgres). Để trống = giữ key hiện tại.
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Models</h3>

        <div className="admin-fields-grid">
          <div className="admin-field">
            <label className="admin-label">Model Primary (default)</label>
            <select className="admin-select" value={modelPrimary} onChange={(e) => setModelPrimary(e.target.value)}>
              {MODELS[provider].primary.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="admin-hint">Dùng cho message bình thường</div>
          </div>
          <div className="admin-field">
            <label className="admin-label">Model Escalated (crisis)</label>
            <select className="admin-select" value={modelEscalated} onChange={(e) => setModelEscalated(e.target.value)}>
              {MODELS[provider].escalated.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="admin-hint">Crisis keywords / message dài / mood declining</div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Limits</h3>

        <div className="admin-fields-grid">
          <div className="admin-field">
            <label className="admin-label">Daily quota / user</label>
            <input type="number" className="admin-input" value={dailyQuota} onChange={(e) => setDailyQuota(parseInt(e.target.value, 10) || 0)} />
            <div className="admin-hint">Per-cohort override trong code: LIGHT=15, MODERATE=30, HEAVY=50, trial=100</div>
          </div>
          <div className="admin-field">
            <label className="admin-label">Max output tokens</label>
            <input type="number" className="admin-input" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 400)} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Temperature (0-1)</label>
            <input type="number" step="0.1" min="0" max="1" className="admin-input" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)} />
          </div>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-error">⚠️ {error}</div>}
      {saved && <div className="admin-alert admin-alert-success">✓ Đã lưu! Cache reset trong 30s.</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving} className="admin-btn admin-btn-primary">
          {saving ? 'Saving...' : '💾 Save Config'}
        </button>
        <button onClick={ping} disabled={pinging} className="admin-btn">
          {pinging ? 'Pinging...' : '🔌 Test API key'}
        </button>
      </div>

      {pingResult && (
        <div className={`admin-alert ${pingResult.ok ? 'admin-alert-success' : 'admin-alert-error'}`} style={{ marginTop: 12 }}>
          {pingResult.ok ? (
            <>
              ✓ <strong>OK!</strong> Latency: {pingResult.latency_ms}ms
              {pingResult.sample && <div style={{ marginTop: 6, fontStyle: 'italic' }}>Sample: "{pingResult.sample}"</div>}
            </>
          ) : (
            <>✗ <strong>FAIL:</strong> {pingResult.error}</>
          )}
        </div>
      )}
    </>
  );
}
