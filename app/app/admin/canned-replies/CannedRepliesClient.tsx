'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CannedReplyRow } from './page';

interface Props {
  initialChips: CannedReplyRow[];
}

const CATEGORIES = ['sos', 'qday', 'pre_qday', 'pillar', 'craving', 'trigger', 'science', 'community', 'other'];

const EMPTY: Partial<CannedReplyRow> = {
  slug: '',
  label: '',
  icon: '💬',
  answer: '',
  wiki_url: '',
  wiki_label: '',
  reusable: false,
  sort_order: 100,
  enabled: true,
  triggers: [],
  priority: 100,
  min_score: 0.5,
  category: 'other'
};

export function CannedRepliesClient({ initialChips }: Props) {
  const router = useRouter();
  const [chips, setChips] = useState(initialChips);
  const [editing, setEditing] = useState<Partial<CannedReplyRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const filtered = chips.filter(c =>
    !filter || c.slug.toLowerCase().includes(filter.toLowerCase()) ||
    c.label.toLowerCase().includes(filter.toLowerCase()) ||
    c.category?.toLowerCase().includes(filter.toLowerCase())
  );

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const method = editing.id ? 'PATCH' : 'POST';
      const res = await fetch('/api/admin/canned-replies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      setEditing(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(id: number, enabled: boolean) {
    await fetch('/api/admin/canned-replies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: !enabled })
    });
    setChips(prev => prev.map(c => c.id === id ? { ...c, enabled: !enabled } : c));
  }

  async function deleteChip(id: number, slug: string) {
    if (!confirm(`Xoá chip "${slug}"?`)) return;
    const res = await fetch(`/api/admin/canned-replies?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setChips(prev => prev.filter(c => c.id !== id));
    } else {
      alert('Delete failed');
    }
  }

  function newChip() {
    setEditing({ ...EMPTY });
  }

  function editChip(c: CannedReplyRow) {
    setEditing({ ...c });
  }

  function updateEditField<K extends keyof CannedReplyRow>(key: K, val: any) {
    setEditing(prev => prev ? { ...prev, [key]: val } : prev);
  }

  return (
    <>
      <div className="admin-action-bar">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Tìm theo slug/label/category..."
          className="admin-input"
          style={{ maxWidth: 300 }}
        />
        <div className="admin-action-bar-actions">
          <button onClick={newChip} className="admin-btn admin-btn-primary">+ New CHIP</button>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 50 }}></th>
            <th style={{ width: 140 }}>Slug</th>
            <th>Label</th>
            <th style={{ width: 100 }}>Category</th>
            <th style={{ width: 80 }}>Priority</th>
            <th style={{ width: 100 }}>Triggers</th>
            <th style={{ width: 70 }}>Enabled</th>
            <th style={{ width: 130 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>Không tìm thấy chip nào</td></tr>
          )}
          {filtered.map(c => (
            <tr key={c.id}>
              <td style={{ fontSize: 18 }}>{c.icon}</td>
              <td><span className="admin-mono">{c.slug}</span></td>
              <td>{c.label}</td>
              <td>{c.category && <span className="admin-badge">{c.category}</span>}</td>
              <td>
                <strong style={{ color: c.priority >= 1000 ? '#DC2626' : '#374151' }}>{c.priority}</strong>
                {c.priority >= 1000 && <span className="admin-badge red" style={{ marginLeft: 4, fontSize: 9 }}>CRITICAL</span>}
              </td>
              <td><span className="admin-mono">{(c.triggers ?? []).length}</span></td>
              <td>
                <button
                  onClick={() => toggleEnabled(c.id, c.enabled)}
                  className={`admin-badge ${c.enabled ? 'green' : 'red'}`}
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  {c.enabled ? '✓ ON' : '✗ OFF'}
                </button>
              </td>
              <td>
                <button onClick={() => editChip(c)} className="admin-btn admin-btn-sm">Edit</button>
                <button onClick={() => deleteChip(c.id, c.slug)} className="admin-btn admin-btn-sm admin-btn-danger" style={{ marginLeft: 4 }}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit modal */}
      {editing && (
        <div className="admin-modal-backdrop" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">
              {editing.id ? `Edit CHIP #${editing.id}` : 'New CHIP'}
            </h3>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div className="admin-fields-grid">
              <div className="admin-field">
                <label className="admin-label">Slug (URL-safe)</label>
                <input className="admin-input" value={editing.slug || ''}
                  onChange={(e) => updateEditField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Icon (emoji)</label>
                <input className="admin-input" value={editing.icon || ''}
                  onChange={(e) => updateEditField('icon', e.target.value)} maxLength={4} />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Label (button text)</label>
              <input className="admin-input" value={editing.label || ''}
                onChange={(e) => updateEditField('label', e.target.value)} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Answer (canned reply text)</label>
              <textarea className="admin-textarea" rows={5} value={editing.answer || ''}
                onChange={(e) => updateEditField('answer', e.target.value)} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Triggers (1 per line)</label>
              <textarea className="admin-textarea" rows={4}
                value={(editing.triggers ?? []).join('\n')}
                onChange={(e) => updateEditField('triggers', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} />
              <div className="admin-hint">Keywords match user message. Vd: "thèm", "muốn hút", "không chịu nổi"</div>
            </div>

            <div className="admin-fields-grid">
              <div className="admin-field">
                <label className="admin-label">Category</label>
                <select className="admin-select" value={editing.category || 'other'}
                  onChange={(e) => updateEditField('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Priority (≥1000 = CRITICAL)</label>
                <input type="number" className="admin-input" value={editing.priority ?? 100}
                  onChange={(e) => updateEditField('priority', parseInt(e.target.value, 10) || 0)} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Min Score (0-1)</label>
                <input type="number" step="0.1" min="0" max="1" className="admin-input" value={editing.min_score ?? 0.5}
                  onChange={(e) => updateEditField('min_score', parseFloat(e.target.value) || 0.5)} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Sort Order</label>
                <input type="number" className="admin-input" value={editing.sort_order ?? 100}
                  onChange={(e) => updateEditField('sort_order', parseInt(e.target.value, 10) || 100)} />
              </div>
            </div>

            <div className="admin-fields-grid">
              <div className="admin-field">
                <label className="admin-label">Wiki URL (optional)</label>
                <input className="admin-input" value={editing.wiki_url || ''}
                  onChange={(e) => updateEditField('wiki_url', e.target.value)}
                  placeholder="https://sol.vn/..." />
              </div>
              <div className="admin-field">
                <label className="admin-label">Wiki Label</label>
                <input className="admin-input" value={editing.wiki_label || ''}
                  onChange={(e) => updateEditField('wiki_label', e.target.value)}
                  placeholder="Đọc sâu →" />
              </div>
            </div>

            <div className="admin-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={editing.enabled ?? true}
                  onChange={(e) => updateEditField('enabled', e.target.checked)} />
                <span className="admin-label" style={{ margin: 0 }}>Enabled</span>
              </label>
            </div>

            <div className="admin-modal-footer">
              <button onClick={() => setEditing(null)} className="admin-btn">Cancel</button>
              <button onClick={save} disabled={saving} className="admin-btn admin-btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
