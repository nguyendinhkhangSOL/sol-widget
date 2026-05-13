// dashboard/src/pages/Refund.tsx
// Trang user yêu cầu hoàn tiền. Logic giống RefundView ở widget nhưng
// nhiều breathing room hơn (full-page).

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { TierMe, RefundRequestRecord } from '../types';
import { formatVnd } from '../lib/featureGates';

export function Refund() {
  const nav = useNavigate();
  const [tier, setTier] = useState<TierMe | null>(null);
  const [refunds, setRefunds] = useState<RefundRequestRecord[]>([]);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTierMe().then(setTier).catch(() => {});
    api.getMyRefunds().then((r) => setRefunds(r.items)).catch(() => {});
  }, []);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const r = await api.requestRefund(reason || undefined);
      setRefunds((arr) => [r.refund, ...arr]);
      setStep(2);
    } catch (err: any) {
      setError(err?.body?.error ?? 'request_failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!tier) return <div className="p-8 text-sol-ink-2">Đang tải…</div>;

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-sol-ink mb-2">Hoàn tiền</h1>
      <p className="text-meta text-sol-ink-2 mb-6">
        Khang giữ lời. Mất khách hơn là mất uy tín. Đây là quy trình:
      </p>

      {!tier.canRequestRefund && step !== 2 && (
        <div className="bg-sol-orange-soft border border-sol-orange/40 rounded-2xl p-4 mb-6">
          <div className="font-semibold text-sol-orange-ink">
            Hiện chưa thể yêu cầu hoàn tiền
          </div>
          <div className="text-meta text-sol-ink-2 mt-1">
            {tier.tier === 'FREE' || tier.tier === 'ALUMNI'
              ? 'Hoàn tiền áp dụng khi anh đang trong lộ trình có trả phí. Anh hiện đang ở chặng miễn phí.'
              : tier.tier === 'KHOI_DONG'
                ? 'Anh đang ở chặng Kiểm Soát — hoàn tiền sẽ mở sau khi anh đi đủ chặng này (≥80% metric, không giảm số điếu). Vào Cài đặt → Hoàn tiền.'
                : tier.daysIntoTier !== null && tier.daysIntoTier < 14
                  ? `14 ngày đầu chặng Làm Chủ chưa được hoàn (anh đang Ngày ${tier.daysIntoTier} của chặng). Cùng cố thêm chút.`
                  : 'Lộ trình đã hết hạn — anh đã là Người Tự Do miễn phí mãi.'}
          </div>
        </div>
      )}

      {tier.canRequestRefund && step === 0 && (
        <div className="bg-white rounded-2xl p-5 border border-sol-line">
          <h2 className="font-bold text-body">Bạn ổn không? Khang muốn nghe trước.</h2>
          <p className="text-meta text-sol-ink-2 mt-1">
            Lý do của bạn giúp Khang làm SOL tốt hơn. Không bắt buộc.
          </p>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: tôi chưa sẵn sàng, áp lực công việc, tài chính…"
            className="mt-3 w-full px-3 py-2 rounded-xl border border-sol-line text-body focus:outline-none focus:ring-2 focus:ring-sol-green min-h-[140px]"
          />
          <div className="flex gap-2 mt-4">
            <button onClick={() => nav('/')} className="flex-1 py-2.5 rounded-xl border border-sol-line">
              Bỏ qua, tiếp tục
            </button>
            <button onClick={() => setStep(1)} className="flex-[2] py-2.5 rounded-xl bg-sol-orange text-white font-semibold">
              Tiếp tục →
            </button>
          </div>
        </div>
      )}

      {tier.canRequestRefund && step === 1 && (
        <div className="bg-white rounded-2xl p-5 border border-sol-line">
          <h2 className="font-bold text-body">Đây là số tiền hoàn về</h2>
          <p className="text-meta text-sol-ink-2 mt-1">
            Pro-rated theo số ngày anh đã đi của chặng Làm Chủ trong lộ trình của anh — Sol đã tính tự động bên dưới.
          </p>
          <div className="my-6 text-center">
            <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
              Hoàn về MoMo / TK ngân hàng
            </div>
            <div className="text-4xl font-black mt-1 tabular-nums text-sol-orange">
              {formatVnd(tier.refundAmountVnd)}
            </div>
            <div className="text-meta text-sol-ink-2 mt-2">
              Đã dùng {tier.daysIntoTier} ngày · Còn lại {tier.daysRemaining}
            </div>
          </div>
          {error && (
            <div className="mb-3 text-body text-sol-red bg-sol-red-soft border border-sol-red/30 rounded-xl p-3">
              {error}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl border border-sol-line" disabled={submitting}>
              ← Quay lại
            </button>
            <button onClick={submit} disabled={submitting} className="flex-[2] py-2.5 rounded-xl bg-sol-orange text-white font-semibold disabled:opacity-60">
              {submitting ? 'Đang gửi…' : 'Gửi yêu cầu hoàn tiền'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-sol-line text-center">
          <div className="text-4xl mb-2">📨</div>
          <div className="font-bold text-body">Khang đã nhận được yêu cầu của bạn</div>
          <div className="text-meta text-sol-ink-2 mt-2 max-w-md mx-auto">
            Hoàn tiền sẽ về tài khoản trong 24h. Tài khoản đã chuyển sang
            Miễn phí — bạn vẫn dùng được khi nào quay lại.
          </div>
          <button onClick={() => nav('/')} className="btn-primary mt-5">
            Về trang chính
          </button>
        </div>
      )}

      {refunds.length > 0 && (
        <div className="mt-8">
          <h3 className="text-body font-semibold text-sol-ink mb-2">Lịch sử yêu cầu</h3>
          <ul className="space-y-2">
            {refunds.map((r) => (
              <li key={r.id} className="bg-white border border-sol-line rounded-xl p-3 text-meta">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sol-ink">
                    {formatVnd(r.amountVnd)}
                  </span>
                  <span className="text-sol-ink-3">{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className="mt-1">
                  Trạng thái: <span className="font-semibold">{statusLabel(r.status)}</span>
                </div>
                {r.reason && <div className="mt-1 text-sol-ink-2">"{r.reason}"</div>}
                {r.adminNote && <div className="mt-1 text-sol-ink-2">Khang note: {r.adminNote}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  return ({
    REQUESTED: 'Đang chờ Khang xét duyệt',
    APPROVED: 'Đã chấp nhận — đang xử lý',
    DENIED: 'Bị từ chối',
    PROCESSED: 'Đã hoàn tiền',
  } as any)[s] ?? s;
}
