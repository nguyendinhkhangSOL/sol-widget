// dashboard/src/components/CohortPicker.tsx
// Sol v4 (13-05-2026) — 3 lộ trình theo Mức Lệ Thuộc (FTND cohort)
//
// Anh em chọn 1 trong 3 lộ trình:
//   🟢 Nhẹ      — 35 ngày, FTND 0-3, hút <10 điếu/ngày
//   🟡 Vừa      — 52 ngày, FTND 4-6, hút 10-20 điếu/ngày  (Sol v3 default)
//   🔴 Nặng     — 65 ngày, FTND 7-10, hút >20 điếu/ngày + Ngày Quyết Định linh hoạt
//
// Mỗi lộ trình có 4 cách trả tiền (Sol v4 — Khang chốt):
//   • Trả Thử            — 49k đăng ký lộ trình
//   • Trả Theo Tuần      — 25k/30k/35k tuỳ cohort, huỷ bất cứ lúc nào
//   • Trả Một Lần        — discount 25-30% so với trả từng tuần
//   • Trả Sau Khi Thành Công — chỉ tính khi anh sạch 21+ ngày sau Q-Day
//
// Khang voice: rural-friendly, không từ Tây.

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { CohortKey, CohortPlan, CohortsResponse } from '../types';
import { formatVnd } from '../lib/featureGates';
import { VI } from '../lib/vi-labels';

type PayMode = 'trial' | 'weekly' | 'full' | 'payAfter';

const PAY_LABEL: Record<PayMode, string> = {
  trial: VI.PAY_TRIAL,
  weekly: VI.SUBSCRIPTION,
  full: VI.PAY_FULL,
  payAfter: VI.PAY_AFTER_SUCCESS,
};

const PAY_HINT: Record<PayMode, string> = {
  trial: '49k đăng ký, đi hết 7 ngày Nhận Diện rồi quyết',
  weekly: 'Đóng từng tuần, huỷ lúc nào cũng được',
  full: 'Rẻ nhất — đóng cả gói, tặng kèm Workbook',
  payAfter: 'Chỉ tính tiền khi anh sạch 21+ ngày sau Ngày Quyết Định',
};

const COHORT_COLOR: Record<CohortKey, { bg: string; light: string; ring: string }> = {
  LIGHT:    { bg: '#16a34a', light: '#dcfce7', ring: '#16a34a33' },
  MODERATE: { bg: '#d97706', light: '#fef3c7', ring: '#d9770633' },
  HEAVY:    { bg: '#dc2626', light: '#fee2e2', ring: '#dc262633' },
};

export function CohortPicker({
  onPick,
}: {
  onPick?: (cohort: CohortKey, pay: PayMode) => void;
}) {
  const [data, setData] = useState<CohortsResponse | null>(null);
  const [picked, setPicked] = useState<CohortKey>('MODERATE');
  const [payMode, setPayMode] = useState<PayMode>('full');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCohorts()
      .then(setData)
      .catch((e: any) => setErr(e?.message ?? 'load_failed'));
  }, []);

  if (err) {
    return (
      <div className="rounded-xl bg-sol-red-soft border border-sol-red/30 p-3 text-meta text-sol-red-ink">
        Chưa tải được lộ trình: {err}
      </div>
    );
  }
  if (!data) {
    return <div className="p-4 text-sol-ink-3">Đang tải 3 lộ trình…</div>;
  }

  const pricing = data.pricing[picked];

  return (
    <div className="rounded-2xl border border-sol-line bg-white p-5 lg:p-6">
      <div className="mb-1 text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
        Sol v4 — Chọn lộ trình theo {VI.FTND}
      </div>
      <h2 className="text-xl lg:text-2xl font-bold text-sol-ink mb-1">
        Anh đang lệ thuộc thuốc lá mức nào?
      </h2>
      <p className="text-body text-sol-ink-2 mb-4">
        Mỗi anh em một mức Lệ Thuộc khác nhau — Sol có 3 lộ trình để anh chọn cho hợp.
        Không ai bắt anh đi giống ai.
      </p>

      {/* 3 cohort cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.cohorts.map((c) => (
          <CohortCard
            key={c.key}
            plan={c}
            isPicked={picked === c.key}
            onPick={() => setPicked(c.key)}
          />
        ))}
      </div>

      {/* Payment mode picker */}
      <div className="mt-6">
        <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold mb-2">
          Cách trả tiền — anh chọn cách phù hợp
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['trial', 'weekly', 'full', 'payAfter'] as PayMode[]).map((m) => {
            const isActive = payMode === m;
            const price = pricing[m];
            const color = COHORT_COLOR[picked];
            return (
              <button
                key={m}
                onClick={() => setPayMode(m)}
                className="rounded-xl p-3 text-left border transition"
                style={{
                  borderColor: isActive ? color.bg : '#e5e7eb',
                  borderWidth: isActive ? 2 : 1,
                  background: isActive ? color.light : 'white',
                  boxShadow: isActive ? `0 0 0 3px ${color.ring}` : undefined,
                }}
              >
                <div
                  className="text-meta font-semibold"
                  style={{ color: isActive ? color.bg : '#374151' }}
                >
                  {PAY_LABEL[m]}
                </div>
                <div className="text-xl font-black tabular-nums mt-1" style={{ color: color.bg }}>
                  {formatVnd(price)}
                  {m === 'weekly' && (
                    <span className="text-meta font-medium text-sol-ink-3 ml-1">/tuần</span>
                  )}
                </div>
                <div className="text-[11px] text-sol-ink-3 mt-1 leading-snug">
                  {PAY_HINT[m]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA + summary */}
      <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex-1 text-body text-sol-ink-2">
          <strong className="text-sol-ink">
            {data.cohorts.find((c) => c.key === picked)?.emoji}{' '}
            Lộ trình {data.cohorts.find((c) => c.key === picked)?.label}
          </strong>{' '}
          — {data.cohorts.find((c) => c.key === picked)?.totalDays} ngày, {VI.Q_DAY} ngày{' '}
          {data.cohorts.find((c) => c.key === picked)?.qDayDay}
          {data.cohorts.find((c) => c.key === picked)?.qDayWindow
            ? ` (linh hoạt ${data.cohorts.find((c) => c.key === picked)!.qDayWindow![0]}-${
                data.cohorts.find((c) => c.key === picked)!.qDayWindow![1]
              })`
            : ''}
          {'. '}
          Anh trả <strong>{formatVnd(pricing[payMode])}</strong> — {PAY_LABEL[payMode]}.
        </div>
        <button
          onClick={() => onPick?.(picked, payMode)}
          className="px-5 py-2.5 rounded-xl text-white font-semibold whitespace-nowrap"
          style={{ background: COHORT_COLOR[picked].bg }}
        >
          Đi lộ trình này
        </button>
      </div>

      <div className="mt-4 text-[11px] text-sol-ink-3 leading-snug">
        💡 Chưa biết mình ở mức nào? Sol có {VI.FTND_SHORT} test 6 câu — 2 phút là xong, Sol tự
        chọn lộ trình hợp cho anh.
      </div>
    </div>
  );
}

function CohortCard({
  plan,
  isPicked,
  onPick,
}: {
  plan: CohortPlan;
  isPicked: boolean;
  onPick: () => void;
}) {
  const color = COHORT_COLOR[plan.key];
  return (
    <button
      onClick={onPick}
      className="text-left rounded-xl p-4 border transition flex flex-col h-full"
      style={{
        borderColor: isPicked ? color.bg : '#e5e7eb',
        borderWidth: isPicked ? 2 : 1,
        background: isPicked ? color.light : 'white',
        boxShadow: isPicked ? `0 0 0 4px ${color.ring}` : undefined,
      }}
    >
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-1.5 font-bold" style={{ color: color.bg }}>
          <span className="text-lg">{plan.emoji}</span>
          <span>Lộ trình {plan.label}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-sol-ink-3">
          {VI.FTND_SHORT} {plan.ftndRange}
        </span>
      </div>

      <div className="text-meta text-sol-ink-2 mt-1">{plan.ftndDescription}</div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-black tabular-nums" style={{ color: color.bg }}>
          {plan.totalDays}
        </span>
        <span className="text-meta text-sol-ink-3">ngày tổng</span>
      </div>

      <div className="mt-2 text-[12px] text-sol-ink-2 leading-snug space-y-0.5">
        <div>
          {VI.STAGE_OBSERVE}: {plan.FREE} ngày · {VI.STAGE_CONTROL}: {plan.KHOI_DONG} ngày ·{' '}
          {VI.STAGE_MASTER}: {plan.DONG_HANH} ngày
        </div>
        <div>
          {VI.Q_DAY}: ngày {plan.qDayDay}
          {plan.qDayWindow ? ` (linh hoạt ${plan.qDayWindow[0]}-${plan.qDayWindow[1]})` : ''}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-sol-ink-3 italic flex-1">
        {plan.recommendedFor}
      </div>

      {isPicked && (
        <div
          className="mt-3 text-meta text-center py-1.5 rounded-lg font-semibold"
          style={{ background: color.bg, color: 'white' }}
        >
          ✓ Đã chọn
        </div>
      )}
    </button>
  );
}
