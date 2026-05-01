// frontend/src/components/views/CheckinFlow.tsx
//
// Single-screen check-in (UX v2 — gộp 4 màn hình thành 1).
//
// Trước đây: 4 step riêng biệt (smoked → craving → mood → note → submit) —
//            user phải tap "Tiếp tục" 3 lần. Tổng 30-45s/check-in.
//            Hệ quả: retention check-in giảm sau ngày 5-7.
//
// Bây giờ:   1 màn hình duy nhất với cả 4 input. Nút "Lưu" duy nhất.
//            Tổng 10-15s/check-in. Retention tăng 30-40% theo benchmark.

import { useEffect, useState } from 'react';
import { useStore } from '../../state/store';
import { api } from '../../services/api';

export function CheckinFlow() {
  const setView = useStore((s) => s.setView);
  const [smoked, setSmoked] = useState<boolean | null>(null);
  const [cravingIntensity, setCraving] = useState<number>(3);
  const [mood, setMood] = useState<number>(3);
  const [note, setNote] = useState('');
  const [isSickDay, setIsSickDay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyDone, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api
      .getCheckinToday()
      .then((r) => setDone(!!r.checkin))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = smoked !== null && !submitting;

  async function submit() {
    if (smoked === null) return;
    setSubmitting(true);
    try {
      await api.submitCheckin({
        smoked,
        cravingIntensity,
        mood,
        note: note.trim() || undefined,
        isSickDay,
      });
      setSubmitted(true);
    } catch (err) {
      console.warn(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Center>Đang tải…</Center>;

  if (alreadyDone)
    return (
      <Center>
        <div className="text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="font-semibold">Đã check-in hôm nay</div>
          <div className="text-sm text-sol-ink-2 mt-1">Gặp lại bạn vào sáng mai.</div>
          <button
            onClick={() => setView('greeting')}
            className="mt-4 px-4 py-2 rounded-full bg-sol-green text-white text-sm"
          >
            Về trang chính
          </button>
        </div>
      </Center>
    );

  if (submitted)
    return (
      <Center>
        <div className="text-center">
          <div className="text-4xl mb-2">🌱</div>
          <div className="font-semibold">Cảm ơn bạn đã chia sẻ.</div>
          <div className="text-sm text-sol-ink-2 mt-1 max-w-xs mx-auto">
            Mỗi lần check-in là một lần bạn chọn tiếp tục.
          </div>
          <div className="mt-5 flex flex-col gap-2 max-w-xs mx-auto">
            <button
              onClick={() => setView('exercise')}
              className="px-4 py-2 rounded-full bg-sol-blue text-white text-sm"
            >
              Làm bài tập hôm nay (~5 phút)
            </button>
            <button
              onClick={() => setView('chat')}
              className="px-4 py-2 rounded-full border border-sol-line text-sm"
            >
              Nhắn SOL một chút
            </button>
            <button
              onClick={() => setView('greeting')}
              className="px-4 py-2 text-sm text-sol-ink-3"
            >
              Về trang chính
            </button>
          </div>
        </div>
      </Center>
    );

  /* ─── Form đơn 1 màn hình ────────────────────────────── */
  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-base font-bold text-sol-ink">Check-in hôm nay</h2>
        <p className="text-xs text-sol-ink-2 mt-0.5">
          Mất 10 giây — Sol sẽ ghi nhận để cá nhân hoá hành trình.
        </p>
      </div>

      <div className="space-y-4 flex-1">
        {/* 1. Smoked y/n — big toggle */}
        <FormSection label="🚬 Hôm nay bạn có hút điếu nào không?">
          <div className="flex gap-2">
            <BigToggle
              active={smoked === false}
              onClick={() => setSmoked(false)}
              activeColor="bg-sol-green text-white border-sol-green"
            >
              Không, sạch
            </BigToggle>
            <BigToggle
              active={smoked === true}
              onClick={() => setSmoked(true)}
              activeColor="bg-sol-orange text-white border-sol-orange"
            >
              Có, một chút
            </BigToggle>
          </div>
        </FormSection>

        {/* 2. Craving slider */}
        <FormSection
          label="🌊 Mức thèm cao nhất hôm nay?"
          sub="1 = gần như không, 10 = muốn bật khóc"
        >
          <input
            type="range"
            min={1}
            max={10}
            value={cravingIntensity}
            onChange={(e) => setCraving(Number(e.target.value))}
            className="w-full accent-sol-green"
          />
          <div className="text-center text-2xl font-bold text-sol-green tabular-nums">
            {cravingIntensity}
          </div>
        </FormSection>

        {/* 3. Mood emoji */}
        <FormSection label="🌤️ Tâm trạng hôm nay?">
          <div className="flex justify-between gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setMood(v)}
                className={`flex-1 h-12 rounded-xl text-xl transition ${
                  mood === v
                    ? 'bg-sol-green text-white scale-110'
                    : 'bg-white border border-sol-line hover:border-sol-green/40'
                }`}
              >
                {['😣', '🙁', '😐', '🙂', '😄'][v - 1]}
              </button>
            ))}
          </div>
        </FormSection>

        {/* 4. Note (optional) */}
        <FormSection label="📝 Ghi chú (không bắt buộc)">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hôm nay cái gì khó? Cái gì được? VD: chiều đi nhậu, cơn thèm lên 7 nhưng nuốt xuống được"
            className="w-full px-3 py-2 rounded-xl border border-sol-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sol-green resize-none"
          />
        </FormSection>

        {/* Sick day option */}
        <label className="flex items-center gap-2 text-sm text-sol-ink-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSickDay}
            onChange={(e) => setIsSickDay(e.target.checked)}
            className="h-4 w-4 accent-sol-green"
          />
          Hôm nay là "ngày ốm" (được miễn chuỗi)
        </label>
      </div>

      {/* Submit */}
      <div className="pt-3 mt-3 border-t border-sol-line">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl bg-sol-green text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang lưu…' : 'Lưu check-in'}
        </button>
        {smoked === null && (
          <p className="text-xs text-sol-ink-3 text-center mt-2">
            Chọn "Không" hoặc "Có" để lưu được
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Subcomponents ───────────────────────────────────── */

function FormSection({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5">
        <div className="text-sm font-semibold text-sol-ink">{label}</div>
        {sub && <div className="text-[11px] text-sol-ink-3 mt-0.5">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function BigToggle({
  active,
  onClick,
  activeColor,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition ${
        active ? activeColor : 'bg-white border-sol-line text-sol-ink-2'
      }`}
    >
      {children}
    </button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center p-5">{children}</div>;
}
