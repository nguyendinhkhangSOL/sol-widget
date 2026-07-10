/**
 * File mới: /var/www/huongdi/admin/src/pages/LeadsPage.tsx
 *
 * Sol Leads Admin — quản lý payment leads từ /thanh-toan/
 */
import { useEffect, useState, useCallback } from 'react';
import {
  getLeads, approveLead, rejectLead, resendMagic, getZaloHelper,
  type Lead, type LeadSummary, type LeadsResponse,
} from '../utils/api';

type StatusFilter = 'all' | 'pending' | 'paid' | 'activated' | 'cancelled';

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Chờ CK',
  PAID:      'Đã approve',
  ACTIVATED: 'Đang dùng',
  CANCELLED: 'Đã huỷ',
  EXPIRED:   'Hết hạn',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'badge-pending',
  PAID:      'badge-paid',
  ACTIVATED: 'badge-activated',
  CANCELLED: 'badge-cancelled',
  EXPIRED:   'badge-expired',
};

export default function LeadsPage() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [summary, setSummary]     = useState<LeadSummary[]>([]);
  const [status, setStatus]       = useState<StatusFilter>('pending');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [zaloModal, setZaloModal] = useState<{
    lead: Lead; deep_link: string; message: string; magic_link: string;
  } | null>(null);
  const [approveModal, setApproveModal] = useState<Lead | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectModal, setRejectModal] = useState<Lead | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: LeadsResponse = await getLeads({ status, search, limit: 100 });
      setLeads(data.leads);
      setSummary(data.summary);
    } catch (e: any) {
      alert('Lỗi load: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 30000); // auto refresh 30s
    return () => clearInterval(t);
  }, [load]);

  const handleApprove = async () => {
    if (!approveModal) return;
    try {
      const r = await approveLead(approveModal.id, approveNotes);
      setApproveModal(null);
      setApproveNotes('');
      // Auto open Zalo modal ngay sau approve
      const helper = await getZaloHelper(approveModal.id);
      setZaloModal({ lead: approveModal, ...helper });
      load();
    } catch (e: any) {
      alert('Lỗi approve: ' + e.message);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      await rejectLead(rejectModal.id, rejectReason.trim());
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (e: any) {
      alert('Lỗi reject: ' + e.message);
    }
  };

  const openZaloForLead = async (lead: Lead) => {
    try {
      const helper = await getZaloHelper(lead.id);
      setZaloModal({ lead, ...helper });
    } catch (e: any) {
      alert('Không lấy được Zalo helper: ' + e.message);
    }
  };

  return (
    <div className="leads-page">
      <style>{styles}</style>
      <h1>💰 Sol Leads Admin</h1>

      {/* Summary cards */}
      <div className="summary-grid">
        {summary.map(s => (
          <div key={s.payment_status} className="stat-card">
            <div className="stat-label">{STATUS_LABEL[s.payment_status] || s.payment_status}</div>
            <div className="stat-value">{s.count}</div>
            <div className="stat-money">{s.total.toLocaleString('vi-VN')}đ</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <select value={status} onChange={e => setStatus(e.target.value as StatusFilter)}>
          <option value="all">Tất cả</option>
          <option value="pending">Chờ CK</option>
          <option value="paid">Đã approve</option>
          <option value="activated">Đang dùng</option>
          <option value="cancelled">Đã huỷ</option>
        </select>
        <input
          type="text"
          placeholder="Tìm SĐT / tên / email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={load}>🔄 Reload</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty">Đang tải...</div>
      ) : leads.length === 0 ? (
        <div className="empty">Không có lead nào</div>
      ) : (
        <table className="leads-table">
          <thead>
            <tr>
              <th>#</th><th>Tên</th><th>SĐT</th><th>Gói</th><th>Số tiền</th>
              <th>Status</th><th>Ngày</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => {
              const zaloUrl = `https://zalo.me/${(l.zalo || l.sdt).replace(/\D/g, '')}`;
              return (
                <tr key={l.id}>
                  <td>#{l.id}</td>
                  <td><b>{l.ten}</b>{l.email && <div className="sub">{l.email}</div>}</td>
                  <td><a href={`tel:${l.sdt}`}>{l.sdt}</a></td>
                  <td>
                    <span className={`badge ${l.goi === 'FOUNDER' ? 'badge-founder' : 'badge-active'}`}>
                      {l.goi}
                    </span>
                  </td>
                  <td><b>{l.amount.toLocaleString('vi-VN')}đ</b></td>
                  <td>
                    <span className={`badge ${STATUS_COLOR[l.paymentStatus]}`}>
                      {STATUS_LABEL[l.paymentStatus]}
                    </span>
                  </td>
                  <td className="sub">
                    {new Date(l.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <div className="actions">
                      {l.paymentStatus === 'PENDING' && (
                        <>
                          <button className="btn-approve" onClick={() => setApproveModal(l)}>✅ Approve</button>
                          <a className="btn-zalo" href={zaloUrl} target="_blank" rel="noreferrer">💬</a>
                          <button className="btn-reject" onClick={() => setRejectModal(l)}>❌</button>
                        </>
                      )}
                      {l.paymentStatus === 'PAID' && (
                        <>
                          <button className="btn-message" onClick={() => openZaloForLead(l)}>📱 Gửi Zalo</button>
                          <button className="btn-view" onClick={() => resendMagic(l.id).then(() => alert('Đã gửi lại email'))}>
                            📤 Email
                          </button>
                        </>
                      )}
                      {l.paymentStatus === 'ACTIVATED' && <span className="ok-tag">✅ Đang dùng</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="modal-backdrop" onClick={() => setApproveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>✅ Approve Lead</h2>
            <p>Approve <b>{approveModal.ten}</b> — {approveModal.amount.toLocaleString('vi-VN')}đ?</p>
            <textarea
              value={approveNotes}
              onChange={e => setApproveNotes(e.target.value)}
              placeholder="Ghi chú (VD: Đã nhận CK lúc 14:32)"
              rows={2}
            />
            <div className="modal-actions">
              <button onClick={() => setApproveModal(null)}>Huỷ</button>
              <button className="btn-approve" onClick={handleApprove}>✅ Approve + Gửi Zalo</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>❌ Reject Lead</h2>
            <p>Reject <b>{rejectModal.ten}</b>?</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Lý do (bắt buộc)"
              rows={2}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setRejectModal(null)}>Huỷ</button>
              <button className="btn-reject" onClick={handleReject}>❌ Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Zalo Helper Modal */}
      {zaloModal && (
        <div className="modal-backdrop" onClick={() => setZaloModal(null)}>
          <div className="modal zalo-modal" onClick={e => e.stopPropagation()}>
            <h2>📱 Gửi Zalo cho {zaloModal.lead.ten}</h2>
            <p className="steps">
              <b>1.</b> Copy tin nhắn → <b>2.</b> Mở Zalo chat → <b>3.</b> Paste → gửi
            </p>
            <textarea readOnly value={zaloModal.message} rows={10} />
            <div className="modal-actions space-between">
              <button onClick={() => setZaloModal(null)}>Đóng</button>
              <div>
                <button
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(zaloModal.message);
                    alert('✅ Đã copy tin nhắn');
                  }}
                >
                  📋 Copy tin nhắn
                </button>{' '}
                <a
                  className="btn-zalo-open"
                  href={zaloModal.deep_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  💬 Mở Zalo chat
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════ STYLES (inline để không phá cấu trúc CSS admin cũ) ═════════════════
const styles = `
.leads-page { padding: 24px; }
.leads-page h1 { color: #0F172A; margin-bottom: 20px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; padding: 16px; border-radius: 12px; border-left: 4px solid #F59E0B; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.stat-label { font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; }
.stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; color: #0F172A; }
.stat-money { color: #16A34A; font-size: 13px; margin-top: 2px; }
.toolbar { background: #fff; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.toolbar input, .toolbar select { padding: 8px 12px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 14px; }
.toolbar input { flex: 1; min-width: 200px; }
.toolbar button { padding: 8px 16px; border: 1px solid #E2E8F0; background: #F8FAFC; border-radius: 8px; cursor: pointer; font-weight: 600; }
.leads-table { width: 100%; background: #fff; border-radius: 12px; overflow: hidden; border-collapse: collapse; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.leads-table th { background: #0F172A; color: #F59E0B; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
.leads-table td { padding: 12px; border-bottom: 1px solid #F1F5F9; font-size: 14px; vertical-align: middle; }
.leads-table tr:hover { background: #FFFBEB; }
.leads-table .sub { color: #94A3B8; font-size: 12px; margin-top: 2px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
.badge-pending { background: #FEF3C7; color: #B45309; }
.badge-paid { background: #DBEAFE; color: #1E40AF; }
.badge-activated { background: #D1FAE5; color: #065F46; }
.badge-cancelled { background: #FEE2E2; color: #991B1B; }
.badge-expired { background: #F1F5F9; color: #64748B; }
.badge-active { background: #F59E0B; color: #fff; }
.badge-founder { background: #7C3AED; color: #fff; }
.actions { display: flex; flex-wrap: wrap; gap: 4px; }
.actions button, .actions a { padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; font-size: 12px; text-decoration: none; display: inline-block; }
.btn-approve { background: #16A34A; color: #fff; }
.btn-reject { background: #DC2626; color: #fff; }
.btn-view { background: #64748B; color: #fff; }
.btn-copy { background: #F59E0B; color: #fff; }
.btn-zalo { background: #0068FF; color: #fff; }
.btn-message { background: #7C3AED; color: #fff; }
.btn-zalo-open { background: #0068FF; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; }
.ok-tag { color: #16A34A; font-weight: 600; }
.empty { text-align: center; padding: 60px; color: #94A3B8; background: #fff; border-radius: 12px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal { background: #fff; max-width: 500px; width: 90%; padding: 24px; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.zalo-modal { max-width: 640px; }
.modal h2 { margin-top: 0; margin-bottom: 12px; }
.modal .steps { color: #64748B; margin: 12px 0; font-size: 14px; }
.modal textarea { width: 100%; padding: 10px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13px; font-family: 'Inter', sans-serif; margin: 12px 0; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.modal-actions.space-between { justify-content: space-between; }
.modal-actions button, .modal-actions a { padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; border: 1px solid #E2E8F0; background: #F8FAFC; }
`;
