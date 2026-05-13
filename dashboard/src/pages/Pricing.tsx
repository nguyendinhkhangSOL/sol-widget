// dashboard/src/pages/Pricing.tsx
// Sol v3 (12-05-2026) — Trang upgrade dashboard hiển thị 4 chặng tiến hoá:
//   🌱 Nhận Diện   (FREE 7d)        — quan sát mình hút lúc nào
//   🟡 Kiểm Soát   (KHOI_DONG 14d)  — 99k, giảm tần suất
//   🔴 Làm Chủ     (DONG_HANH 30d)  — 199k, Q-Day Day 22, cai hẳn 30 ngày
//   🌟 Người Tự Do (ALUMNI forever) — miễn phí mãi, Day 52+
// Tổng phí: 99k + 199k = 298.000đ = đúng 1 tháng tiền thuốc (10k/ngày).
// User click "Chọn gói" → checkout mock → reload user.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useStore } from '../state/store';
import type { TierCatalog, TierCatalogItem, UserTier } from '../types';
import { TIER_COLOR, TIER_LABEL, TIER_EMOJI, formatVnd } from '../lib/featureGates';
import { CohortPicker } from '../components/CohortPicker';

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

  // Sol v3: Tính tổng phí từ catalog (99k Kiểm Soát + 199k Làm Chủ = 298k)
  const totalPaid =
    (catalog as any).schedule?.totalPaidVnd ??
    (catalog.tiers.find((t) => t.id === 'KHOI_DONG')?.priceVnd ?? 0) +
    (catalog.tiers.find((t) => t.id === 'DONG_HANH')?.priceVnd ?? 0);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-24 lg:pb-12">
      <div className="text-center mb-8">
        <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
          Sol v4 — 3 lộ trình theo Mức Lệ Thuộc · 4 cách trả tiền
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-sol-ink mt-1">
          Khang đi cùng anh 35 / 52 / 65 ngày
        </h1>
        <p className="text-body text-sol-ink-2 mt-2 max-w-2xl mx-auto">
          Mỗi anh em mỗi mức lệ thuộc — Sol có lộ trình riêng cho từng người. Anh nhẹ thì 35 ngày,
          anh nặng thì 65 ngày. Trả thử, trả tuần, trả cả gói, hay trả sau khi anh sạch — anh chọn.
          <br />
          <strong className="text-sol-ink">
            Lộ trình Vừa (đa số anh em): Tổng {formatVnd(totalPaid)} = đúng 1 tháng tiền thuốc anh đang đốt.
          </strong>
        </p>
      </div>

      {/* Sol v4 — 3 lộ trình cohort + 4 cách trả tiền */}
      <div className="mb-8">
        <CohortPicker
          onPick={(cohort, pay) => {
            // TODO Sol v4 (later): wire to /tiers/cohort + /payments/checkout (cohort + payMode)
            console.log('[CohortPicker] picked', cohort, pay);
            nav(`/q-day-checklist?target=KHOI_DONG&cohort=${cohort}&pay=${pay}`);
          }}
        />
      </div>

      {/* Sol v4: bỏ 4 TIER cards riêng lẻ để tránh Gap với cohort logic.
          Chặng (Nhận Diện/Kiểm Soát/Làm Chủ) = giai đoạn TRONG lộ trình, không bán riêng.
          Người tự do (ALUMNI) = sau khi hoàn thành lộ trình → tự động chuyển. */}

      <div className="mt-8 rounded-2xl bg-sol-paper border border-sol-line p-5">
        <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold mb-3">
          Lộ trình của anh gồm 3 chặng + sau khi tốt nghiệp
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {catalog.tiers.map((t) => (
            <StageBadge key={t.id} t={t} isCurrent={eff === t.id} />
          ))}
        </div>
        <p className="mt-4 text-meta text-sol-ink-2 leading-snug">
          💡 Đây là <strong>các chặng TRONG lộ trình</strong> anh đang đi — không phải gói riêng để mua.
          Khi anh đăng ký lộ trình ở trên, Sol sẽ tự động đưa anh qua từng chặng đúng theo thời gian.
        </p>
      </div>

      {error && (
        <div className="mt-6 max-w-md mx-auto bg-sol-red-soft border border-sol-red/30 text-sol-red-ink rounded-xl p-3 text-body">
          Có lỗi: {error}
        </div>
      )}

      <div className="mt-8 text-center text-meta text-sol-ink-3 max-w-md mx-auto">
        💳 Thanh toán Sol v4 hỗ trợ 4 cách trả linh hoạt: Trả Thử / Trả Theo Tuần / Trả Một Lần / Trả Sau Khi Thành Công.
        Anh huỷ lúc nào cũng được. Sol KHÔNG tự rút tiền tự động.
      </div>
      {/* TODO Sol v4 — submittingTier + buy() chỉ dùng nếu user upgrade thủ công.
          Flow mặc định mới: chọn cohort + payMode → /payments/checkout với payMode. */}
      <span hidden>{submittingTier}</span>
    </div>
  );
}

// Sol v4 — Stage Badge cho 4 chặng (không phải gói bán riêng)
function StageBadge({ t, isCurrent }: { t: TierCatalogItem; isCurrent: boolean }) {
  const color = TIER_COLOR[t.id];
  return (
    <div
      className="rounded-xl p-3 border bg-white text-center"
      style={{
        borderColor: isCurrent ? color.bg : '#e5e7eb',
        borderWidth: isCurrent ? 2 : 1,
        background: isCurrent ? color.light : 'white',
      }}
    >
      <div className="text-base">{TIER_EMOJI[t.id]}</div>
      <div className="text-meta font-bold mt-0.5" style={{ color: color.bg }}>
        {TIER_LABEL[t.id]}
      </div>
      {t.durationDays !== null && t.durationDays > 0 && (
        <div className="text-[11px] text-sol-ink-3 mt-1">{t.durationDays} ngày</div>
      )}
      {(t as any).forever && (
        <div className="text-[11px] text-sol-ink-3 mt-1">mãi mãi</div>
      )}
      {isCurrent && (
        <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: color.bg }}>
          ✓ Anh đang ở đây
        </div>
      )}
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
        <div className="font-bold text-body flex items-center gap-1.5" style={{ color: color.bg }}>
          <span>{TIER_EMOJI[t.id]}</span>
          <span>{TIER_LABEL[t.id]}</span>
        </div>
        {isCurrent && (
          <span
            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
            style={{ background: color.light, color: color.bg }}
          >
            Đang dùng
          </span>
        )}
        {(t as any).recommended && !isCurrent && (
          <span
            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sol-red-soft text-sol-red-ink"
          >
            Khuyến nghị
          </span>
        )}
      </div>

      {/* Sol v3: tagline mô tả ngắn dưới tên chặng */}
      {(t as any).tagline && (
        <div className="text-meta text-sol-ink-3 mt-0.5">{(t as any).tagline}</div>
      )}

      <div className="mt-3 mb-1">
        <span className="text-3xl font-black tabular-nums" style={{ color: color.bg }}>
          {t.priceVnd === 0 ? 'Miễn phí' : formatVnd(t.priceVnd)}
        </span>
        {t.durationDays !== null && t.durationDays > 0 && (
          <span className="text-meta text-sol-ink-3 ml-1">/ {t.durationDays} ngày</span>
        )}
        {(t as any).forever && (
          <span className="text-meta text-sol-ink-3 ml-1">/ mãi mãi</span>
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
