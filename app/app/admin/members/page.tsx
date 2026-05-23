import { query } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { AdminLogin } from '../AdminLogin';

interface MemberRow {
  id: number;
  phone: string;
  full_name: string | null;
  cohort: string | null;
  ftnd_score: number | null;
  stage: string;
  source: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  total_paid_vnd: number;
  active_days: number;
  created_at: string;
}

export default async function MembersPage() {
  if (!isAdminAuthorized()) return <AdminLogin />;

  const members = await query<MemberRow>(
    `SELECT id, phone, full_name, cohort, ftnd_score, stage, source,
            trial_ends_at, subscription_ends_at, total_paid_vnd, active_days, created_at
     FROM members ORDER BY created_at DESC LIMIT 200`
  );

  return (
    <>
      <h1 className="admin-page-title">👥 Members</h1>
      <p className="admin-page-subtitle">{members.length} members tải nhất (top 200)</p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Phone</th>
            <th>Tên</th>
            <th>Cohort</th>
            <th>FTND</th>
            <th>Stage</th>
            <th>Source</th>
            <th>Trial kết thúc</th>
            <th>Đã trả</th>
            <th>Tạo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr><td colSpan={11} style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>Chưa có member nào</td></tr>
          ) : members.map(m => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td><span className="admin-mono">{m.phone}</span></td>
              <td>{m.full_name || '—'}</td>
              <td>
                {m.cohort && (
                  <span className={`admin-badge ${m.cohort === 'LIGHT' ? 'green' : m.cohort === 'MODERATE' ? 'amber' : 'red'}`}>
                    {m.cohort}
                  </span>
                )}
              </td>
              <td>{m.ftnd_score ?? '—'}</td>
              <td>
                <span className={`admin-badge ${
                  m.stage === 'recognition' ? 'blue' :
                  m.stage === 'cutting' ? 'amber' :
                  m.stage === 'recovery' ? 'purple' :
                  m.stage === 'free' ? 'green' :
                  m.stage === 'churned' ? 'red' : ''
                }`}>{m.stage}</span>
              </td>
              <td><span className="admin-badge">{m.source}</span></td>
              <td>{m.trial_ends_at ? new Date(m.trial_ends_at).toLocaleDateString('vi-VN') : '—'}</td>
              <td style={{ fontWeight: 600 }}>{m.total_paid_vnd > 0 ? new Intl.NumberFormat('vi-VN').format(m.total_paid_vnd) + 'đ' : '—'}</td>
              <td>{new Date(m.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              <td>
                <a href={`https://zalo.me/${m.phone}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-sm">Zalo →</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
