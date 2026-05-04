// frontend/src/components/NotificationPrefsPanel.tsx
// Phase 5 — User control bảng điều khiển tin nhắn:
//   - dailyMax 1-5 (slider)
//   - activeStart/End (giờ bắt đầu/kết thúc nhận)
//   - quietStart/End (giờ yên tĩnh — không push)
//   - weekendReduce (cuối tuần giảm 50%)
//   - 6 moments (cà phê sáng, trà đá trưa, sau cơm, nhậu, trước ngủ)
//
// Dùng trong SettingsView (tab "Tin nhắn").

import { useEffect, useState } from 'react';
import { api, type NotificationPrefs } from '../services/api';

const MOMENT_LABELS: Record<keyof NonNullable<NotificationPrefs['moments']>, { label: string; emoji: string; defaultTime: string }> = {
  coffeeMorning: { label: 'Cà phê sáng', emoji: '☕', defaultTime: '07:30' },
  teaAfternoon: { label: 'Trà đá trưa', emoji: '🫖', defaultTime: '14:00' },
  postLunch: { label: 'Sau bữa cơm trưa', emoji: '🍚', defaultTime: '12:30' },
  postDinner: { label: 'Sau bữa cơm tối', emoji: '🍲', defaultTime: '19:00' },
  preSocialDrink: { label: 'Trước khi đi nhậu', emoji: '🍺', defaultTime: '18:30' },
  preBedtime: { label: 'Trước khi đi ngủ', emoji: '🌙', defaultTime: '22:30' },
};

export function NotificationPrefsPanel() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getNotificationPrefs().then(setPrefs).catch((e) => setError(e?.message ?? 'Lỗi tải prefs'));
  }, []);

  if (!prefs) {
    return <div className="text-meta text-sol-ink-3 p-4">{error ?? 'Đang tải...'}</div>;
  }

  async function save(patch: Partial<NotificationPrefs>) {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateNotificationPrefs(patch);
      setPrefs(updated);
      setSavedHint(true);
      setTimeout(() => setSavedHint(false), 1500);
    } catch (e: any) {
      setError(e?.message ?? 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  }

  function setMoment(key: keyof NonNullable<NotificationPrefs['moments']>, time: string | null) {
    save({ moments: { ...prefs!.moments, [key]: time } });
  }

  const dailyMax = prefs.dailyMax ?? 3;

  return (
    <div className="space-y-5 p-4 bg-sol-bg">
      {savedHint && <div className="text-meta text-sol-green-ink">✓ Đã lưu</div>}
      {error && <div className="text-meta text-sol-red-ink">{error}</div>}

      {/* CƯỜNG ĐỘ */}
      <section>
        <h3 className="text-h3 text-sol-earth-ink mb-2">Cường độ tin nhắn</h3>
        <p className="text-meta text-sol-ink-2 mb-3">
          Mỗi ngày bạn muốn nhận bao nhiêu tin từ Sol? (cuối tuần có thể giảm tự động)
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={dailyMax}
            onChange={(e) => save({ dailyMax: parseInt(e.target.value, 10) })}
            disabled={saving}
            className="flex-1"
          />
          <div className="text-h2 text-sol-green-ink w-12 text-center font-bold">{dailyMax}</div>
        </div>
        <div className="flex justify-between text-[10px] text-sol-ink-3 mt-1">
          <span>1 (ít)</span>
          <span>3 (vừa)</span>
          <span>5 (nhiều)</span>
        </div>
      </section>

      {/* KHUNG GIỜ */}
      <section>
        <h3 className="text-h3 text-sol-earth-ink mb-2">Khung giờ nhận</h3>
        <p className="text-meta text-sol-ink-2 mb-3">Sol sẽ chỉ gửi tin trong khoảng này.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-meta text-sol-ink-2">Bắt đầu</span>
            <input
              type="time"
              value={prefs.activeStart ?? '09:00'}
              onChange={(e) => save({ activeStart: e.target.value })}
              disabled={saving}
              className="border border-sol-line rounded px-3 py-2 text-body bg-sol-paper"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-meta text-sol-ink-2">Kết thúc</span>
            <input
              type="time"
              value={prefs.activeEnd ?? '21:00'}
              onChange={(e) => save({ activeEnd: e.target.value })}
              disabled={saving}
              className="border border-sol-line rounded px-3 py-2 text-body bg-sol-paper"
            />
          </label>
        </div>
      </section>

      {/* YÊN TĨNH */}
      <section>
        <h3 className="text-h3 text-sol-earth-ink mb-2">Giờ yên tĩnh</h3>
        <p className="text-meta text-sol-ink-2 mb-3">
          Trong khung này Sol KHÔNG gửi tin (trừ trường hợp khẩn cấp).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-meta text-sol-ink-2">Bắt đầu yên tĩnh</span>
            <input
              type="time"
              value={prefs.quietStart ?? '22:00'}
              onChange={(e) => save({ quietStart: e.target.value })}
              disabled={saving}
              className="border border-sol-line rounded px-3 py-2 text-body bg-sol-paper"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-meta text-sol-ink-2">Kết thúc yên tĩnh</span>
            <input
              type="time"
              value={prefs.quietEnd ?? '06:00'}
              onChange={(e) => save({ quietEnd: e.target.value })}
              disabled={saving}
              className="border border-sol-line rounded px-3 py-2 text-body bg-sol-paper"
            />
          </label>
        </div>
      </section>

      {/* WEEKEND REDUCE */}
      <section>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.weekendReduce ?? true}
            onChange={(e) => save({ weekendReduce: e.target.checked })}
            disabled={saving}
            className="mt-1 h-5 w-5"
          />
          <span>
            <span className="text-body text-sol-ink font-semibold">Cuối tuần giảm 50%</span>
            <span className="block text-meta text-sol-ink-2">
              Thứ 7 + Chủ nhật bạn nhận ít tin hơn (vd 3/ngày → 2/ngày).
            </span>
          </span>
        </label>
      </section>

      {/* MOMENTS */}
      <section>
        <h3 className="text-h3 text-sol-earth-ink mb-2">Thói quen hàng ngày</h3>
        <p className="text-meta text-sol-ink-2 mb-3">
          Sol nhắn đúng lúc bạn thường thèm. Càng khai cụ thể, tin càng đúng giờ. (Có thể bỏ qua —
          Sol vẫn gửi tin chung).
        </p>
        <div className="space-y-2">
          {(Object.keys(MOMENT_LABELS) as Array<keyof typeof MOMENT_LABELS>).map((key) => {
            const cfg = MOMENT_LABELS[key];
            const value = prefs.moments?.[key] ?? null;
            const enabled = !!value;
            return (
              <div
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${enabled ? 'border-sol-orange bg-sol-orange-soft' : 'border-sol-line bg-sol-paper'}`}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setMoment(key, e.target.checked ? cfg.defaultTime : null)}
                  disabled={saving}
                  className="h-5 w-5"
                />
                <span className="text-2xl" aria-hidden="true">{cfg.emoji}</span>
                <span className="flex-1 text-body text-sol-ink">{cfg.label}</span>
                {enabled && (
                  <input
                    type="time"
                    value={value ?? cfg.defaultTime}
                    onChange={(e) => setMoment(key, e.target.value)}
                    disabled={saving}
                    className="border border-sol-line rounded px-2 py-1 text-meta bg-sol-paper"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="text-meta text-sol-ink-3 italic">
        Bảng điều khiển này tự lưu khi bạn thay đổi. Sol sẽ áp dụng từ tin nhắn tiếp theo.
      </div>
    </div>
  );
}
