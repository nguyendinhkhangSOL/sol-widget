// dashboard/src/pages/QDayChecklist.tsx
//
// "System requirements" cho Q-Day. User phải tick xong các mục bắt buộc
// mới được đặt ngày bắt đầu cai (quitDate). Tương tự checklist khi cài
// phần mềm — đảm bảo bạn đã chuẩn bị đủ điều kiện cần.
//
// Sau khi đủ, user có 2 lựa chọn:
//   - Đặt Q-Day ngay (FREE flow): gọi PATCH /users/me { quitDate }
//   - Đi đến Pricing để mua Kiểm Soát 99k: nav('/pricing')

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useStore } from '../state/store';
import type { QDayChecklistState, UserTier } from '../types';

export function QDayChecklist() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const targetTier = (params.get('target') ?? 'FREE') as UserTier;
  const setUser = useStore((s) => s.setUser);

  const [state, setState] = useState<QDayChecklistState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const s = await api.getQDayChecklist(targetTier);
      setState(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [targetTier]);

  async function toggle(itemId: string, currentlyChecked: boolean) {
    setBusy(itemId);
    setError(null);
    try {
      const next = currentlyChecked
        ? await api.uncheckQDayItem(itemId)
        : await api.checkQDayItem(itemId);
      setState(next);
    } catch (e: any) {
      setError(e?.body?.error ?? 'lỗi');
    } finally {
      setBusy(null);
    }
  }

  async function activateQDay() {
    setSubmitting(true);
    setError(null);
    try {
      // Đặt quitDate = hôm nay (giờ hiện tại)
      await api.patchMe({ quitDate: new Date().toISOString() } as any);
      const me = await api.getMe();
      setUser(me as any);
      nav('/');
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 412) {
        setError('Vẫn còn mục bắt buộc chưa hoàn thành — kiểm tra lại nhé.');
        await load();
      } else {
        setError(e?.body?.error ?? 'Không kích hoạt được');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !state) {
    return <div className="p-8 text-sol-ink-2">Đang tải checklist…</div>;
  }

  const pct =
    state.requiredCount > 0
      ? Math.round((state.requiredDoneCount / state.requiredCount) * 100)
      : 100;

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto pb-24">
      <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
        Trước khi bắt đầu
      </div>
      <h1 className="text-2xl lg:text-3xl font-bold text-sol-ink mt-1">
        Bạn đã sẵn sàng chưa?
      </h1>
      {state.intro && (
        <p className="text-body text-sol-ink-2 mt-3 leading-relaxed">{state.intro}</p>
      )}

      {/* Progress */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between text-meta mb-1.5">
          <span className="font-semibold text-sol-ink">
            {state.requiredDoneCount}/{state.requiredCount} mục bắt buộc
          </span>
          <span className="text-sol-ink-3 tabular-nums">{pct}%</span>
        </div>
        <div className="h-2 bg-sol-paper border border-sol-line rounded-full overflow-hidden">
          <div
            className={state.allRequiredDone ? 'h-full bg-sol-green' : 'h-full bg-sol-orange'}
            style={{ width: `${pct}%`, transition: 'width 200ms ease' }}
          />
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-2">
        {state.items.map((it) => {
          const checked = !!it.checkedAt;
          return (
            <li
              key={it.id}
              className={
                'rounded-2xl border p-4 transition ' +
                (checked
                  ? 'bg-sol-green-soft border-sol-green/40'
                  : 'bg-white border-sol-line hover:border-sol-orange/40')
              }
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggle(it.id, checked)}
                  disabled={busy === it.id}
                  aria-label={checked ? 'Bỏ tick' : 'Tick'}
                  className={
                    'mt-0.5 h-6 w-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition ' +
                    (checked
                      ? 'bg-sol-green border-sol-green text-white'
                      : 'bg-white border-sol-line hover:border-sol-orange')
                  }
                >
                  {checked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5 9-11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {it.icon && <span className="text-base">{it.icon}</span>}
                    <span className="font-semibold text-body text-sol-ink">
                      {it.label}
                    </span>
                    {it.required ? (
                      <span className="text-[10px] uppercase font-bold text-sol-orange-ink bg-sol-orange-soft px-1.5 py-0.5 rounded">
                        Bắt buộc
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase text-sol-ink-3 px-1 py-0.5">
                        Khuyến khích
                      </span>
                    )}
                  </div>
                  {it.description && (
                    <p className="text-meta text-sol-ink-2 mt-1 leading-relaxed">
                      {it.description}
                    </p>
                  )}
                  {it.wikiUrl && (
                    <a
                      href={it.wikiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-meta text-sol-blue underline mt-1.5"
                    >
                      📖 Đọc bài đầy đủ →
                    </a>
                  )}
                  {checked && it.checkedAt && (
                    <div className="text-[11px] text-sol-ink-3 mt-1">
                      ✓ Đã tick lúc {new Date(it.checkedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {state.outro && (
        <div className="mt-6 bg-sol-paper rounded-2xl border border-sol-line p-4 text-meta text-sol-ink-2 leading-relaxed italic">
          {state.outro}
        </div>
      )}

      {error && (
        <div className="mt-4 bg-sol-red-soft border border-sol-red/30 text-sol-red-ink rounded-xl p-3 text-meta">
          {error}
        </div>
      )}

      {/* Action */}
      <div className="mt-6 sticky bottom-4">
        {targetTier === 'FREE' ? (
          <button
            onClick={activateQDay}
            disabled={!state.allRequiredDone || submitting}
            className={
              'w-full py-3 rounded-xl text-white font-bold text-body shadow-md transition ' +
              (state.allRequiredDone
                ? 'bg-sol-green hover:shadow-lg'
                : 'bg-sol-ink-3 cursor-not-allowed')
            }
          >
            {submitting
              ? 'Đang kích hoạt…'
              : state.allRequiredDone
                ? '🚀 Kích hoạt Q-Day — bắt đầu hành trình'
                : `Còn ${state.requiredCount - state.requiredDoneCount} mục bắt buộc`}
          </button>
        ) : (
          <button
            onClick={() => nav('/pricing')}
            disabled={!state.allRequiredDone}
            className={
              'w-full py-3 rounded-xl text-white font-bold text-body shadow-md transition ' +
              (state.allRequiredDone
                ? 'bg-sol-green hover:shadow-lg'
                : 'bg-sol-ink-3 cursor-not-allowed')
            }
          >
            {state.allRequiredDone
              ? `✓ Sẵn sàng — chuyển sang thanh toán →`
              : `Còn ${state.requiredCount - state.requiredDoneCount} mục bắt buộc`}
          </button>
        )}
      </div>
    </div>
  );
}
