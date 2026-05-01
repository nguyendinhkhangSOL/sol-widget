// frontend/src/components/views/RefundView.tsx
// 3-step refund flow:
//   1. "Bạn ổn không?" — text area, không bắt buộc
//   2. Tiền hoàn về (tự tính)
//   3. "Khang đã đọc lý do của bạn" — submit
//
// Triết lý: mất khách nhưng giữ uy tín. Không có "are you sure" 5 lần.

import { useEffect, useState } from 'react';
import { useStore } from '../../state/store';
import { api } from '../../services/api';
import { formatVnd } from '../../lib/featureGates';
import type { TierMe } from '../../types';

export function RefundView() {
  const setView = useStore((s) => s.setView);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [reason, setReason] = useState('');
  const [tier, setTier] = useState<TierMe | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTierMe().then(setTier).catch(() => {});
  }, []);

  if (!tier) {
    return (
      <div className="h-full flex items-center justify-center text-sol-ink-2">Đang tải…</div>
    );
  }

  if (!tier.canRequestRefund) {
    const why =
      tier.tier !== 'DONG_HANH'
        ? 'Hoàn tiền chỉ áp dụng cho gói Đồng hành 199k.'
        : tier.daysIntoTier !== null && tier.daysIntoTier < 15
          ? `15 ngày đầu chưa được hoàn tiền (bạn đang ở Ngày ${tier.daysIntoTier}). Cùng cố thêm chút nữa nhé.`
          : tier.inMaintenance
            ? 'Đã sang giai đoạn bảo trì — không hoàn tiền.'
            : 'Gói đã hết hạn — không hoàn tiền.';
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-3xl mb-2">🌿</div>
          <div className="font-semibold text-sol-ink">{why}</div>
          <button
            onClick={() => setView('greeting')}
            className="btn-primary mt-4"
          >
            Quay về trang chính
          </button>
        </div>
      </div>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.requestRefund(reason || undefined);
      setStep(3);
    } catch (err: any) {
      setError(err?.body?.error ?? 'request_failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto">
      {step === 0 && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-base font-bold text-sol-ink">
            Bạn ổn không? Khang muốn nghe trước.
          </h2>
          <p className="text-xs text-sol-ink-2 mt-1">
            Lý do của bạn giúp Khang làm SOL tốt hơn cho người sau. Không bắt buộc.
          </p>
          <textarea
            rows={6}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: tôi chưa sẵn sàng, áp lực công việc, tài chính khó khăn…"
            className="mt-3 w-full px-3 py-2 rounded-xl border border-sol-line text-sm focus:outline-none focus:ring-2 focus:ring-sol-green min-h-[140px]"
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('greeting')}
              className="flex-1 py-2 rounded-xl border border-sol-line text-sm"
            >
              Bỏ qua, tiếp tục
            </button>
            <button
              onClick={() => setStep(1)}
              className="flex-[2] py-2.5 rounded-xl bg-sol-orange text-white font-semibold"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-base font-bold text-sol-ink">Đây là số tiền hoàn về</h2>
          <p className="text-xs text-sol-ink-2 mt-1">
            Tính theo: (30 - {tier.daysIntoTier}) / 20 × 100.000đ
          </p>
          <div className="my-6 text-center">
            <div className="text-xs uppercase tracking-wider text-sol-ink-3 font-semibold">
              Hoàn về MoMo / TK ngân hàng
            </div>
            <div className="text-4xl font-black mt-1 tabular-nums text-sol-orange">
              {formatVnd(tier.refundAmountVnd)}
            </div>
            <div className="text-xs text-sol-ink-2 mt-2">
              Đã dùng {tier.daysIntoTier} ngày · còn lại {tier.daysRemaining}
            </div>
          </div>
          <div className="bg-sol-paper rounded-xl p-3 text-xs text-sol-ink-2 leading-relaxed">
            Khi gửi yêu cầu, Khang sẽ đọc lý do của bạn trước khi xác nhận
            hoàn tiền (≤ 24h). Tài khoản của bạn sẽ trở về Miễn phí.
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-2 rounded-xl border border-sol-line text-sm"
            >
              ← Quay lại
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-[2] py-2.5 rounded-xl bg-sol-orange text-white font-semibold disabled:opacity-60"
            >
              {submitting ? 'Đang gửi…' : 'Gửi yêu cầu hoàn tiền'}
            </button>
          </div>
          {error && (
            <div className="mt-3 text-sm text-sol-red bg-sol-red-soft border border-sol-red/30 rounded-xl p-3">
              {error}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-4xl mb-2">📨</div>
            <div className="font-semibold text-sol-ink">
              Khang đã nhận được lý do của bạn.
            </div>
            <div className="text-sm text-sol-ink-2 mt-2 leading-relaxed max-w-xs">
              Hoàn tiền sẽ về tài khoản trong 24h. Tài khoản đã chuyển sang
              Miễn phí — bạn vẫn dùng được khi nào bạn muốn quay lại.
            </div>
            <button
              onClick={() => setView('greeting')}
              className="btn-primary mt-5"
            >
              Cảm ơn Khang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
