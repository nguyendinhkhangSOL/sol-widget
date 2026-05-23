import { query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { AdminLogin } from './AdminLogin';

interface Stats {
  members_total: number;
  members_trial: number;
  members_paid: number;
  payments_pending: number;
  test_results_today: number;
  chat_threads_open: number;
  chat_messages_today: number;
  ai_messages_today: number;
  cohort_stats: Array<{ cohort: string; count: number }>;
}

async function getStats(): Promise<Stats> {
  const [members, todayTests, chats, todayMsgs, aiToday, cohortRaw] = await Promise.all([
    queryOne<any>(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE stage = 'recognition') AS trial,
        COUNT(*) FILTER (WHERE stage IN ('cutting', 'recovery')) AS paid
      FROM members
    `),
    queryOne<any>(`SELECT COUNT(*) AS n FROM test_results WHERE created_at >= CURRENT_DATE`),
    queryOne<any>(`SELECT COUNT(*) AS n FROM chat_threads WHERE status = 'open'`),
    queryOne<any>(`SELECT COUNT(*) AS n FROM chat_messages WHERE created_at >= CURRENT_DATE`),
    queryOne<any>(`SELECT COUNT(*) AS n FROM messages WHERE role = 'ASSISTANT' AND created_at >= CURRENT_DATE`),
    query<any>(`SELECT cohort, COUNT(*) AS count FROM members WHERE cohort IS NOT NULL GROUP BY cohort ORDER BY cohort`)
  ]);

  return {
    members_total: parseInt(members?.total || '0', 10),
    members_trial: parseInt(members?.trial || '0', 10),
    members_paid: parseInt(members?.paid || '0', 10),
    payments_pending: 0,
    test_results_today: parseInt(todayTests?.n || '0', 10),
    chat_threads_open: parseInt(chats?.n || '0', 10),
    chat_messages_today: parseInt(todayMsgs?.n || '0', 10),
    ai_messages_today: parseInt(aiToday?.n || '0', 10),
    cohort_stats: cohortRaw.map(r => ({ cohort: r.cohort, count: parseInt(r.count, 10) }))
  };
}

export default async function AdminDashboardPage() {
  if (!isAdminAuthorized()) {
    return <AdminLogin />;
  }

  const stats = await getStats();

  return (
    <>
      <h1 className="admin-page-title">📊 Dashboard</h1>
      <p className="admin-page-subtitle">Tổng quan Sol Widget · {new Date().toLocaleDateString('vi-VN')}</p>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">Members tổng</div>
          <div className="admin-stat-value">{stats.members_total}</div>
          <div className="admin-stat-change">{stats.members_trial} trial · {stats.members_paid} paying</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">FTND tests hôm nay</div>
          <div className="admin-stat-value">{stats.test_results_today}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Chat threads (open)</div>
          <div className="admin-stat-value">{stats.chat_threads_open}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Messages hôm nay</div>
          <div className="admin-stat-value">{stats.chat_messages_today}</div>
          <div className="admin-stat-change">{stats.ai_messages_today} AI replies</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Cohort distribution</h3>
        {stats.cohort_stats.length === 0 ? (
          <p style={{ color: '#6B7280', fontSize: 13 }}>Chưa có member nào.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Cohort</th><th>Số members</th></tr>
            </thead>
            <tbody>
              {stats.cohort_stats.map(s => (
                <tr key={s.cohort}>
                  <td>
                    <span className={`admin-badge ${s.cohort === 'LIGHT' ? 'green' : s.cohort === 'MODERATE' ? 'amber' : 'red'}`}>
                      {s.cohort}
                    </span>
                  </td>
                  <td><strong>{s.count}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Quick links</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/chat" className="admin-btn admin-btn-primary">💬 Reply chat</a>
          <a href="/canned-replies" className="admin-btn">🧩 Edit CHIP</a>
          <a href="/ai" className="admin-btn">🤖 AI Config</a>
          <a href="/members" className="admin-btn">👥 Members list</a>
        </div>
      </div>
    </>
  );
}
