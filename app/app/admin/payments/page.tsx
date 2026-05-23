import { query } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { AdminLogin } from '../AdminLogin';

interface PaymentRow {
  id: number;
  member_id: number;
  phone: string;
  full_name: string;
  cohort: string;
  pay_type: string;
  amount_vnd: number;
  qr_content: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

export default async function PaymentsPage() {
  if (!isAdminAuthorized()) return <AdminLogin />;

  const payments = await query<PaymentRow>(
    `SELECT p.id, p.member_id, m.phone, m.full_name, p.cohort, p.pay_type, p.amount_vnd,
            p.qr_content, p.status, p.created_at, p.confirmed_at
     FROM payments p JOIN members m ON m.id = p.member_id
     ORDER BY p.created_at DESC LIMIT 100`
  );

  return (
    <>
      <h1 className="admin-page-title">💰 Payments</h1>
      <p className="admin-page-subtitle">
        100 giao dịch gần nhất. Pending = user đã quét QR chờ Khang confirm.
      </p>

      <div className="admin-alert admin-alert-warning">
        💡 Workflow: Check banking app → match nội dung `SOL-COHORT-SĐT-FULL/WEEK` →
        Update status = confirmed via SQL: <span className="admin-mono">UPDATE payments SET status = 'confirmed', confirmed_at = NOW() WHERE id = X;</span>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Member</th>
            <th>Cohort</th>
            <th>Loại</th>
            <th>Tiền</th>
            <th>QR content</th>
            <th>Status</th>
            <th>Tạo</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>Chưa có giao dịch</td></tr>
          ) : payments.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>
                <div>{p.full_name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{p.phone}</div>
              </td>
              <td>
                <span className={`admin-badge ${p.cohort === 'LIGHT' ? 'green' : p.cohort === 'MODERATE' ? 'amber' : 'red'}`}>{p.cohort}</span>
              </td>
              <td>{p.pay_type === 'full' ? 'Trọn gói' : 'Tuần'}</td>
              <td style={{ fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN').format(p.amount_vnd)}đ</td>
              <td><span className="admin-mono" style={{ fontSize: 11 }}>{p.qr_content}</span></td>
              <td>
                <span className={`admin-badge ${
                  p.status === 'confirmed' ? 'green' :
                  p.status === 'pending' ? 'amber' :
                  p.status === 'expired' ? 'red' : ''
                }`}>{p.status}</span>
              </td>
              <td style={{ fontSize: 12 }}>{new Date(p.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
