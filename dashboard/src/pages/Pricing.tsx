// dashboard/src/pages/Pricing.tsx
// Trang upgrade dashboard. Hiển thị 3 cột FREE / KHOI_DONG / DONG_HANH.
// User click "Chọn gói" → checkout mock → reload user.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useStore } from '../state/store';
import type { TierCatalog, TierCatalogItem, UserTier } from '../types';
import { TIER_COLOR, TIER_LABEL, formatVnd } from '../lib/featureGates';

export function Pricing() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const nav = useNavigate();
  const [catalog, setCatalog] = useState<TierCatalog | null>(null);
  const [submittingTier, setSubmittingTier] = useState<UserTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTierCatalog().then(setCatalog).catch(() => {});
  }, []);

  const eff: UserTier = (user?.effectiveTier ?? user?.tier ?? 'FREE') as UserTier;

  async function buy(tier: 'KHOI_DONG' | 'DONG_HANH') {
    setSubmittingTier(tier);
    setError(null);
    try {
      await api.checkout(tier, 'mock');
      const me = await api.getMe();
      setUser(me as any);
      nav('/');
    } catch (err: any) {
      // 412 = checklist chưa đủ → đẩy user qua trang checklist
      if (err instanceof ApiError && err.status === 412) {
        nav(`/q-day-checklist?target=${tier}`);
        return;
      }
      setError(err?.body?.error ?? 'payment_failed');
    } finally {
      setSubmittingTier(null);
    }
  }

  if (!catalog) {
    return <div className="p-8 text-sol-ink-2">Đang tải bảng giá…</div>;
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-24 lg:pb-12">
      <div className="text-center mb-8">
        <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
          Gói đồng hành
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-sol-ink mt-1">
          Khang sẽ ở bên bạn
        </h1>
        <p className="text-body text-sol-ink-2 mt-2 max-w-xl mx-auto">
          10 ngày đầu là khó nhất — cũng là lúc bạn cần đồng đội nhất.
          Hoàn tiền nếu bỏ cuộc từ Ngày 15 (gói Đồng hành).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {catalog.tiers.map((t) => (
          <TierCard
            key={t.id}
            t={t}
            isCurrent={eff === t.id}
            isLocked={t.id === 'ALUMNI'}
            onBuy={
              t.id === 'KHOI_DONG' || t.id === 'DONG_HANH'
                ? () => buy(t.id as 'KHOI_DONG' | 'DONG_HANH')
                : undefined
            }
            submitting={submittingTier === t.id}
          />
        ))}
      </div>

      {error && (
        <div className="mt-6 max-w-md mx-auto bg-sol-red-soft border border-sol-red/30 text-sol-red-ink rounded-xl p-3 text-body">
          Có lỗi: {error}
        </div>
      )}

      <div className="mt-8 text-center text-meta text-sol-ink-3 max-w-md mx-auto">
        💳 Thanh toán đang ở chế độ mock — khi triển khai MoMo/VietQR sẽ hiện QR thật.
        Mọi giao dịch lưu trong PaymentLog để admin theo dõi.
      </div>
    </div>
  );
}

function TierCard({
  t,
  isCurrent,
  isLocked,
  onBuy,
  submitting,
}: {
  t: TierCatalogItem;
  isCurrent: boolean;
  isLocked: boolean;
  onBuy?: () => void;
  submitting: boolean;
}) {
  const color = TIER_COLOR[t.id];

  return (
    <div
      className="rounded-2xl p-5 border bg-white flex flex-col print:break-inside-avoid"
      style={{
        borderColor: isCurrent ? color.bg : '#e5e7eb',
        borderWidth: isCurrent ? 2 : 1,
        boxShadow: isCurrent ? `0 0 0 4px ${color.bg}22` : undefined,
      }}
    >
      <div className="flex items-baseline justify-between">
        <div className="font-bold text-body" style={{ color: color.bg }}>
          {TIER_LABEL[t.id]}
        </div>
        {isCurrent && (
          <span
            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
            style={{ background: color.light, color: color.bg }}
          >
            Đang dùng
          </span>
        )}
      </div>

      <div className="mt-3 mb-1">
        <span className="text-3xl font-black tabular-nums" style={{ color: color.bg }}>
          {t.priceVnd === 0 ? 'Miễn phí' : formatVnd(t.priceVnd)}
        </span>
        {t.durationDays !== null && t.durationDays > 0 && (
          <span className="text-meta text-sol-ink-3 ml-1">/ {t.durationDays} ngày</span>
        )}
      </div>

      {t.callout && (
        <p className="text-meta text-sol-ink-2 italic mb-3">{t.callout}</p>
      )}

      <ul className="space-y-1.5 mt-2 mb-4 flex-1">
        {t.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-meta text-sol-ink leading-snug">
            <span style={{ color: color.bg }} className="mt-0.5">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {!isLocked && onBuy && !isCurrent && (
        <button
          onClick={onBuy}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-60"
          style={{ background: color.bg }}
        >
          {submitting ? 'Đang xử lý…' : `Chọn ${TIER_LABEL[t.id]}`}
        </button>
      )}
      {!onBuy && !isCurrent && (
        <div className="text-meta text-sol-ink-3 text-center py-2.5 border border-sol-line rounded-xl">
          {t.id === 'FREE' ? 'Tài khoản mặc định' : 'Tự động khi hoàn thành'}
        </div>
      )}
      {isCurrent && (
        <div
          className="text-meta text-center py-2.5 rounded-xl font-semibold"
          style={{ background: color.light, color: color.bg }}
        >
          Bạn đang ở gói này
        </div>
      )}
    </div>
  );
}
