// ═══════════════════════════════════════════════════════════════
// BATCH B — UserDetail.tsx (Sổ Hành Trình view)
// NEW file: /var/www/huongdi/admin/src/pages/UserDetail.tsx
// Route: /users/:id
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserDetail } from '../utils/api';

const TIER_BADGE: Record<string, { color: string; label: string }> = {
  FREE:    { color: 'badge-blue',   label: '🆓 Free' },
  ACTIVE:  { color: 'badge-green',  label: '✅ Active' },
  FOUNDER: { color: 'badge-yellow', label: '⭐ Founder' },
  EXPIRED: { color: 'badge-red',    label: '⏰ Expired' },
};

const EVENT_ICONS: Record<string, string> = {
  P1_START: '🚀',
  P1_COMPLETE: '✅',
  P2_COMPLETE: '📊',
  P3_VIEW: '🧭',
  DIRECTION_SAVE: '💾',
  DIRECTION_UNSAVE: '🗑',
  ROADMAP_VIEW: '🗺',
  ROADMAP_START: '▶️',
  EBOOK_CLICK: '📘',
  WORKSHOP_CLICK: '🎓',
  COACHING_CLICK: '🎯',
  MEMBERSHIP_CLICK: '⭐',
};

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getUserDetail(id)
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ color: 'var(--text2)' }}>Đang tải...</div>;
  if (error) return <div style={{ color: 'var(--red)' }}>❌ {error}</div>;
  if (!user) return <div>Không tìm thấy user.</div>;

  const latestP1 = user.p1Results?.[0];
  const latestP2 = user.p2Results?.[0];

  return (
    <div>
      <Link to="/users" style={{ color: 'var(--accent)', fontSize: 14, marginBottom: 12, display: 'inline-block' }}>
        ← Danh sách
      </Link>

      {/* Header */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {user.avatarUrl && (
            <img src={user.avatarUrl} style={{ width: 64, height: 64, borderRadius: '50%' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{user.displayName || 'Chưa có tên'}</h1>
              <span className={`badge ${TIER_BADGE[user.tier]?.color || 'badge-blue'}`}>
                {TIER_BADGE[user.tier]?.label || user.tier}
              </span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {user.phone && <span>📱 {user.phone}</span>}
              {user.email && <span>✉️ {user.email}</span>}
              {user.zaloId && <span>💬 Zalo linked</span>}
            </div>
            {user.tier === 'ACTIVE' && user.tierExpiresAt && (
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
                Hết hạn: {new Date(user.tierExpiresAt).toLocaleDateString('vi')}
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)' }}>
          <span>📅 Tạo: {new Date(user.createdAt).toLocaleDateString('vi')}</span>
          {user.lastSeenAt && <span>👁 Online cuối: {new Date(user.lastSeenAt).toLocaleDateString('vi')}</span>}
          {user.activeLead && (
            <span>💳 Lead #{user.activeLead.id} · {user.activeLead.goi}</span>
          )}
        </div>
      </div>

      {/* Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* P1 Result */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            🎯 Bước 1 — Khám Phá Bản Thân
          </h3>
          {latestP1 ? (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Version {latestP1.version} · {new Date(latestP1.createdAt).toLocaleString('vi')}
              </div>
              <table style={{ width: '100%', fontSize: 14 }}>
                <tbody>
                  <tr><td>👥 People</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP1.people}</td></tr>
                  <tr><td>🎓 Expert</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP1.expert}</td></tr>
                  <tr><td>🔨 Builder</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP1.builder}</td></tr>
                  <tr><td>🦅 Independent</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP1.independent}</td></tr>
                </tbody>
              </table>
              <div style={{ marginTop: 10, padding: 8, background: 'var(--surface2)', borderRadius: 6, fontSize: 12 }}>
                Ranking: {latestP1.rank1} → {latestP1.rank2} → {latestP1.rank3} → {latestP1.rank4}
              </div>
              {user.p1Results.length > 1 && (
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>
                  {user.p1Results.length} lần làm quiz
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text2)', padding: '20px 0' }}>Chưa làm Bước 1</div>
          )}
        </div>

        {/* P2 Result */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            📊 Bước 2 — Kiểm Kê Nguồn Lực
          </h3>
          {latestP2 ? (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                {new Date(latestP2.createdAt).toLocaleString('vi')}
              </div>
              <table style={{ width: '100%', fontSize: 14 }}>
                <tbody>
                  <tr><td>💼 Kinh nghiệm</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP2.experience}</td></tr>
                  <tr><td>💰 Vốn</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP2.capital}</td></tr>
                  <tr><td>⏰ Thời gian</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP2.time}</td></tr>
                  <tr><td>💻 Tech</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP2.technology}</td></tr>
                  <tr><td>🌐 Network</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP2.network}</td></tr>
                  <tr><td>⚠️ Rủi ro chấp nhận</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP2.risk}</td></tr>
                  <tr><td>⚡ Năng lượng</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{latestP2.energy}</td></tr>
                </tbody>
              </table>
              <div style={{ marginTop: 10, padding: 8, background: 'var(--surface2)', borderRadius: 6, fontSize: 12 }}>
                🎯 Mục tiêu thu nhập: <b>{latestP2.incomeGoal}</b>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text2)', padding: '20px 0' }}>Chưa làm Bước 2</div>
          )}
        </div>
      </div>

      {/* Saved Directions */}
      <div className="card" style={{ padding: 16, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          🧭 Sổ Hành Trình ({user.savedDirs?.length || 0})
        </h3>
        {user.savedDirs?.length > 0 ? (
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Hướng đi</th>
                <th>Category</th>
                <th>Match Score</th>
                <th>Notes</th>
                <th>Ngày lưu</th>
              </tr>
            </thead>
            <tbody>
              {user.savedDirs.map((sd: any) => (
                <tr key={sd.id}>
                  <td style={{ fontWeight: 600 }}>{sd.direction?.name}</td>
                  <td><span className="badge badge-blue">{sd.direction?.category}</span></td>
                  <td>{sd.matchScore || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text2)' }}>{sd.notes || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(sd.createdAt).toLocaleDateString('vi')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text2)', padding: '10px 0' }}>Chưa lưu direction nào</div>
        )}
      </div>

      {/* Outcomes */}
      <div className="card" style={{ padding: 16, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          📈 Outcomes (Post-roadmap tracking)
        </h3>
        {user.outcomes?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Direction</th>
                <th>Checkpoint</th>
                <th>Started</th>
                <th>Khách #1</th>
                <th>Revenue</th>
                <th>Satisfaction</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {user.outcomes.map((o: any) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.direction?.name}</td>
                  <td><span className="badge badge-yellow">{o.checkpoint}</span></td>
                  <td>{o.started ? '✅' : '—'}</td>
                  <td>{o.firstClient ? '✅' : '—'}</td>
                  <td><span className="badge badge-green">{o.revenueLevel}</span></td>
                  <td>{o.satisfaction ? '⭐'.repeat(o.satisfaction) : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(o.createdAt).toLocaleDateString('vi')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text2)', padding: '10px 0' }}>Chưa có outcome tracking</div>
        )}
      </div>

      {/* Events timeline */}
      <div className="card" style={{ padding: 16, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          📜 Event Timeline ({user.events?.length || 0} mới nhất)
        </h3>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {user.events?.map((ev: any) => (
            <div key={ev.id.toString()} style={{
              padding: '8px 12px',
              borderLeft: '3px solid var(--accent)',
              marginBottom: 4,
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ marginRight: 8 }}>{EVENT_ICONS[ev.eventType] || '•'}</span>
                  <b>{ev.eventType}</b>
                  {ev.directionId && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text2)' }}>
                      direction: {ev.directionId.substring(0, 8)}...
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {new Date(ev.createdAt).toLocaleString('vi')}
                </span>
              </div>
            </div>
          ))}
          {(!user.events || user.events.length === 0) && (
            <div style={{ color: 'var(--text2)', padding: '10px 0' }}>Chưa có event nào</div>
          )}
        </div>
      </div>
    </div>
  );
}
