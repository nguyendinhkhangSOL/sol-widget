// frontend/src/components/TierBadge.tsx
// Chip nhỏ hiển thị tier hiện tại + ngày X/N (gói chính) hoặc "X/30 bảo trì"
// Click → mở paywall (FREE/KHOI_DONG) hoặc trang chi tiết tier (DONG_HANH).

import { useStore } from '../state/store';
import type { UserTier } from '../types';
import { TIER_COLOR, TIER_LABEL } from '../lib/featureGates';

export function TierBadge() {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);

  const eff: UserTier = user?.effectiveTier ?? user?.tier ?? 'FREE';
  const state = user?.tierState;
  const color = TIER_COLOR[eff];
  const label = TIER_LABEL[eff];

  let suffix = '';
  if (eff === 'FREE') {
    suffix = '— quan sát';
  } else if (state?.inMaintenance && state.maintenanceDaysRemaining !== null) {
    suffix = `bảo trì ${state.maintenanceDaysRemaining} ngày`;
  } else if (state?.daysIntoTier && state?.daysRemaining !== null) {
    const total =
      eff === 'KHOI_DONG' ? 10 : eff === 'DONG_HANH' ? 30 : 0;
    suffix = total > 0 ? `Ngày ${state.daysIntoTier}/${total}` : '';
  }

  const onClick =
    eff === 'FREE' || eff === 'KHOI_DONG'
      ? () => setView('paywall')
      : () => setView('settings');

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
      title={`Gói ${label}${suffix ? ' · ' + suffix : ''}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color.bg }}
      />
      <span className="font-bold">{label}</span>
      {suffix && <span className="opacity-85">· {suffix}</span>}
    </button>
  );
}

/** Variant with light background (for use on white surfaces). */
export function TierBadgeLight() {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);
  const eff: UserTier = user?.effectiveTier ?? user?.tier ?? 'FREE';
  const color = TIER_COLOR[eff];
  return (
    <button
      onClick={() => (eff === 'DONG_HANH' || eff === 'ALUMNI' ? setView('settings') : setView('paywall'))}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: color.light, color: color.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color.bg }} />
      {TIER_LABEL[eff]}
    </button>
  );
}
