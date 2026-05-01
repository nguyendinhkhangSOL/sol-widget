// frontend/src/components/ProfileSetupWizard.tsx
//
// 3-step wizard hỏi user về hồ sơ cai thuốc sau khi onboarding xong:
//   Bước 1: Tuổi + số năm đã hút
//   Bước 2: 1-3 lý do bỏ thuốc (preset + custom)
//   Bước 3: 1-3 trigger điển hình (preset + custom)
//
// Tất cả đều "bỏ qua được" — user 45+ không bị ép. Sau khi user dismiss,
// ghi localStorage để 7 ngày không hỏi lại; khi user "Hoàn tất" thì lưu
// luôn vào DB qua patchMe.
//
// Mount trong WidgetPanel: show overlay khi user đã đăng nhập + profile
// còn rỗng + user chưa dismiss gần đây.
//
// Tone tiếng Việt: warm, trực tiếp, không "thuật ngữ tâm lý". Câu mở
// đầu mỗi bước cá nhân hoá theo pronouns + name.

import { useState } from 'react';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { api } from '../services/api';

const REASON_PRESETS = [
  'Vì sức khoẻ của tôi',
  'Vì vợ / chồng',
  'Vì cháu con',
  'Vì cha mẹ',
  'Tiết kiệm tiền',
  'Đã ho nhiều / khó thở',
  'Bác sĩ khuyến cáo',
  'Muốn sống lâu hơn',
] as const;

const TRIGGER_PRESETS = [
  'Cà phê sáng',
  'Sau bữa cơm',
  'Lúc nhậu',
  'Khi căng thẳng',
  'Lái xe đường dài',
  'Lúc rảnh / buồn',
  'Khi uống bia',
  'Lúc đi vệ sinh',
] as const;

const REASON_MAX = 80;
const TRIGGER_MAX = 40;
const SELECT_LIMIT = 3;

interface Props {
  onClose: () => void;
}

export function ProfileSetupWizard({ onClose }: Props) {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '');
  const [yearsSmoked, setYearsSmoked] = useState<string>(
    user?.yearsSmoked != null ? String(user.yearsSmoked) : '',
  );

  // Step 2
  const [reasons, setReasons] = useState<string[]>(user?.quitReasons ?? []);
  const [reasonCustom, setReasonCustom] = useState('');

  // Step 3
  const [triggers, setTriggers] = useState<string[]>(user?.topTriggers ?? []);
  const [triggerCustom, setTriggerCustom] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pronouns = (user?.pronouns || 'bạn').trim();
  const name = (user?.name || '').trim();
  const greet = name ? `${pronouns} ${name}` : pronouns;

  // ── Helpers ────────────────────────────────────────────────────────────
  function toggleReason(r: string) {
    setError(null);
    if (reasons.includes(r)) {
      setReasons(reasons.filter((x) => x !== r));
    } else {
      if (reasons.length >= SELECT_LIMIT) {
        setError(`Chọn tối đa ${SELECT_LIMIT} lý do — quan trọng nhất với ${pronouns}.`);
        return;
      }
      setReasons([...reasons, r]);
    }
  }
  function addCustomReason() {
    const t = reasonCustom.trim().slice(0, REASON_MAX);
    if (!t) return;
    if (reasons.length >= SELECT_LIMIT) {
      setError(`Đã đủ ${SELECT_LIMIT} — bỏ chọn 1 cái rồi thêm.`);
      return;
    }
    if (reasons.includes(t)) {
      setReasonCustom('');
      return;
    }
    setReasons([...reasons, t]);
    setReasonCustom('');
  }

  function toggleTrigger(t: string) {
    setError(null);
    if (triggers.includes(t)) {
      setTriggers(triggers.filter((x) => x !== t));
    } else {
      if (triggers.length >= SELECT_LIMIT) {
        setError(`Chọn tối đa ${SELECT_LIMIT} lúc dễ thèm thôi nhé.`);
        return;
      }
      setTriggers([...triggers, t]);
    }
  }
  function addCustomTrigger() {
    const t = triggerCustom.trim().slice(0, TRIGGER_MAX);
    if (!t) return;
    if (triggers.length >= SELECT_LIMIT) return;
    if (triggers.includes(t)) {
      setTriggerCustom('');
      return;
    }
    setTriggers([...triggers, t]);
    setTriggerCustom('');
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const ageNum = age.trim() ? parseInt(age.trim(), 10) : null;
      const yearsNum = yearsSmoked.trim() ? parseInt(yearsSmoked.trim(), 10) : null;

      // Light client-side validation — không quá khắt khe để user 45+ không bực
      if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 18 || ageNum > 120)) {
        setStep(1);
        setError('Tuổi nên trong khoảng 18-120.');
        setSaving(false);
        return;
      }
      if (yearsNum !== null && (Number.isNaN(yearsNum) || yearsNum < 0 || yearsNum > 90)) {
        setStep(1);
        setError('Số năm hút nên trong khoảng 0-90.');
        setSaving(false);
        return;
      }

      const body: Record<string, unknown> = {
        quitReasons: reasons,
        topTriggers: triggers,
      };
      if (ageNum !== null) body.age = ageNum;
      if (yearsNum !== null) body.yearsSmoked = yearsNum;

      await api.patchMe(body);

      if (user) {
        setUser({
          ...user,
          age: ageNum ?? user.age,
          yearsSmoked: yearsNum ?? user.yearsSmoked,
          quitReasons: reasons,
          topTriggers: triggers,
        });
      }

      try {
        localStorage.setItem('sol_profile_setup_done', '1');
      } catch {
        /* localStorage có thể bị disable */
      }

      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không lưu được';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function dismiss() {
    try {
      localStorage.setItem('sol_profile_setup_dismissed_at', String(Date.now()));
    } catch {
      /* no-op */
    }
    onClose();
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-label="Hồ sơ cai thuốc"
      className="absolute inset-0 z-30 bg-sol-bg flex flex-col animate-slide-up"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-sol-line flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-meta text-sol-ink-3 leading-tight">
            Bước {step}/3
          </div>
          <div className="text-h3 text-sol-ink truncate">Hồ sơ cai thuốc</div>
        </div>
        <button
          aria-label="Đóng và để sau"
          onClick={dismiss}
          className="text-sol-ink-3 hover:text-sol-ink text-h2 leading-none w-9 h-9 flex items-center justify-center"
        >
          ×
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {step === 1 && (
          <Step1
            greet={greet}
            pronouns={pronouns}
            age={age}
            setAge={setAge}
            yearsSmoked={yearsSmoked}
            setYearsSmoked={setYearsSmoked}
          />
        )}
        {step === 2 && (
          <Step2
            greet={greet}
            pronouns={pronouns}
            reasons={reasons}
            toggleReason={toggleReason}
            reasonCustom={reasonCustom}
            setReasonCustom={setReasonCustom}
            addCustomReason={addCustomReason}
          />
        )}
        {step === 3 && (
          <Step3
            greet={greet}
            pronouns={pronouns}
            triggers={triggers}
            toggleTrigger={toggleTrigger}
            triggerCustom={triggerCustom}
            setTriggerCustom={setTriggerCustom}
            addCustomTrigger={addCustomTrigger}
          />
        )}

        {error && (
          <div className="sol-alert-danger text-meta">{error}</div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sol-line bg-sol-paper/60 flex items-center justify-between gap-2">
        <button
          onClick={dismiss}
          className="sol-btn sol-btn-secondary sol-btn-sm"
          disabled={saving}
        >
          Để sau
        </button>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={() => {
                setError(null);
                setStep((s) => (s === 3 ? 2 : 1));
              }}
              className="sol-btn sol-btn-secondary sol-btn-sm"
              disabled={saving}
            >
              ← Lùi
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                setError(null);
                setStep((s) => (s === 1 ? 2 : 3));
              }}
              className="sol-btn sol-btn-primary sol-btn-sm"
              disabled={saving}
            >
              Tiếp →
            </button>
          ) : (
            <button
              onClick={finish}
              className="sol-btn sol-btn-primary sol-btn-sm"
              disabled={saving}
            >
              {saving ? 'Đang lưu…' : 'Hoàn tất'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Step components
// ──────────────────────────────────────────────────────────────────────────

function Step1({
  greet,
  pronouns,
  age,
  setAge,
  yearsSmoked,
  setYearsSmoked,
}: {
  greet: string;
  pronouns: string;
  age: string;
  setAge: (v: string) => void;
  yearsSmoked: string;
  setYearsSmoked: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-h3 text-sol-ink mb-1">
          {greet.charAt(0).toUpperCase() + greet.slice(1)} ơi, mình hỏi 2 câu nhỏ
        </div>
        <p className="text-meta text-sol-ink-2">
          Để Sol biết kỳ vọng phục hồi cho{' '}
          <span className="font-semibold">{pronouns}</span> sát thực tế. Bỏ qua
          cũng được, hỏi sau cũng được.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="sol-field-label">Tuổi {pronouns}</label>
          <input
            type="number"
            inputMode="numeric"
            min={18}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="vd 52"
            className="sol-input tabular-nums text-h3 text-center"
          />
        </div>
        <div>
          <label className="sol-field-label">Đã hút bao năm?</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={90}
            value={yearsSmoked}
            onChange={(e) => setYearsSmoked(e.target.value)}
            placeholder="vd 30"
            className="sol-input tabular-nums text-h3 text-center"
          />
        </div>
      </div>

      <div className="rounded-lg bg-sol-green-soft/60 border border-sol-green/20 p-3">
        <p className="text-meta text-sol-ink-2 leading-relaxed">
          💡 Hút lâu năm thì cơ thể cần thời gian dài hơn để phục hồi — Sol sẽ
          điều chỉnh kỳ vọng, không bắt {pronouns} "phải khoẻ ngay tuần 1".
        </p>
      </div>
    </div>
  );
}

function Step2({
  greet,
  pronouns,
  reasons,
  toggleReason,
  reasonCustom,
  setReasonCustom,
  addCustomReason,
}: {
  greet: string;
  pronouns: string;
  reasons: string[];
  toggleReason: (r: string) => void;
  reasonCustom: string;
  setReasonCustom: (v: string) => void;
  addCustomReason: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-h3 text-sol-ink mb-1">
          {greet.charAt(0).toUpperCase() + greet.slice(1)} bỏ thuốc{' '}
          <span className="text-sol-green-ink">vì điều gì?</span>
        </div>
        <p className="text-meta text-sol-ink-2">
          Chọn tối đa <span className="font-semibold">3 cái quan trọng nhất</span>.
          Lúc {pronouns} thèm thuốc, mình sẽ nhắc lại đúng câu này.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {REASON_PRESETS.map((r) => {
          const selected = reasons.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggleReason(r)}
              aria-pressed={selected}
              className={clsx(
                'sol-chip min-h-tap px-3 text-meta',
                selected
                  ? 'bg-sol-green-soft text-sol-green-ink ring-2 ring-sol-green'
                  : 'bg-white border border-sol-line hover:border-sol-line-strong text-sol-ink',
              )}
            >
              {selected ? '✓ ' : ''}
              {r}
            </button>
          );
        })}
      </div>

      <div>
        <label className="sol-field-label">
          Hoặc viết lý do của riêng {pronouns}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={reasonCustom}
            onChange={(e) => setReasonCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomReason();
              }
            }}
            maxLength={REASON_MAX}
            placeholder='vd "vì cu Tí cháu nội"'
            className="sol-input flex-1"
          />
          <button
            type="button"
            onClick={addCustomReason}
            className="sol-btn sol-btn-secondary sol-btn-sm"
            disabled={!reasonCustom.trim() || reasons.length >= SELECT_LIMIT}
          >
            Thêm
          </button>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="rounded-lg bg-sol-paper border border-sol-line p-3 space-y-1.5">
          <div className="text-meta text-sol-ink-3">
            Đã chọn ({reasons.length}/{SELECT_LIMIT}):
          </div>
          {reasons.map((r) => (
            <div
              key={r}
              className="flex items-center justify-between text-body text-sol-ink"
            >
              <span className="truncate">• {r}</span>
              <button
                onClick={() => toggleReason(r)}
                className="text-meta text-sol-ink-3 hover:text-sol-red ml-2 px-2"
                aria-label={`Bỏ ${r}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Step3({
  greet,
  pronouns,
  triggers,
  toggleTrigger,
  triggerCustom,
  setTriggerCustom,
  addCustomTrigger,
}: {
  greet: string;
  pronouns: string;
  triggers: string[];
  toggleTrigger: (t: string) => void;
  triggerCustom: string;
  setTriggerCustom: (v: string) => void;
  addCustomTrigger: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-h3 text-sol-ink mb-1">
          Lúc nào {pronouns} <span className="text-sol-orange-ink">dễ thèm nhất?</span>
        </div>
        <p className="text-meta text-sol-ink-2">
          Sol sẽ chuẩn bị "phương án thay thế" trước khi {pronouns} bước vào
          tình huống đó. Chọn tối đa 3.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TRIGGER_PRESETS.map((t) => {
          const selected = triggers.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleTrigger(t)}
              aria-pressed={selected}
              className={clsx(
                'sol-chip min-h-tap px-3 text-meta',
                selected
                  ? 'bg-sol-orange-soft text-sol-orange-ink ring-2 ring-sol-orange'
                  : 'bg-white border border-sol-line hover:border-sol-line-strong text-sol-ink',
              )}
            >
              {selected ? '✓ ' : ''}
              {t}
            </button>
          );
        })}
      </div>

      <div>
        <label className="sol-field-label">
          Hoặc viết lúc khác {pronouns} hay thèm
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={triggerCustom}
            onChange={(e) => setTriggerCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTrigger();
              }
            }}
            maxLength={TRIGGER_MAX}
            placeholder='vd "đi đám cưới"'
            className="sol-input flex-1"
          />
          <button
            type="button"
            onClick={addCustomTrigger}
            className="sol-btn sol-btn-secondary sol-btn-sm"
            disabled={!triggerCustom.trim() || triggers.length >= SELECT_LIMIT}
          >
            Thêm
          </button>
        </div>
      </div>

      {triggers.length > 0 && (
        <div className="rounded-lg bg-sol-paper border border-sol-line p-3 space-y-1.5">
          <div className="text-meta text-sol-ink-3">
            Đã chọn ({triggers.length}/{SELECT_LIMIT}):
          </div>
          {triggers.map((t) => (
            <div
              key={t}
              className="flex items-center justify-between text-body text-sol-ink"
            >
              <span className="truncate">• {t}</span>
              <button
                onClick={() => toggleTrigger(t)}
                className="text-meta text-sol-ink-3 hover:text-sol-red ml-2 px-2"
                aria-label={`Bỏ ${t}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-sol-paper border border-sol-line p-3">
        <p className="text-meta text-sol-ink-2 leading-relaxed">
          ✨ Bấm <span className="font-semibold">Hoàn tất</span> để Sol nhớ. Sau
          này {pronouns} có thể đổi trong <span className="font-semibold">Cài đặt</span>.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Helper — gắn ngoài WidgetPanel để quyết định có show wizard không
// ──────────────────────────────────────────────────────────────────────────

export function shouldShowProfileSetup(
  user: { age?: number | null; yearsSmoked?: number | null; quitReasons?: string[]; topTriggers?: string[] } | null,
): boolean {
  if (!user) return false;

  // Nếu user đã hoàn tất hoặc dismiss gần đây → không show
  try {
    if (localStorage.getItem('sol_profile_setup_done') === '1') return false;
    const dismissedAt = localStorage.getItem('sol_profile_setup_dismissed_at');
    if (dismissedAt) {
      const t = parseInt(dismissedAt, 10);
      // Nhắc lại sau 7 ngày
      if (!Number.isNaN(t) && Date.now() - t < 7 * 24 * 60 * 60 * 1000) {
        return false;
      }
    }
  } catch {
    /* localStorage disabled — vẫn show */
  }

  // Show nếu profile rỗng (user chưa điền gì)
  const hasAge = user.age != null;
  const hasYears = user.yearsSmoked != null;
  const hasReasons = (user.quitReasons?.length ?? 0) > 0;
  const hasTriggers = (user.topTriggers?.length ?? 0) > 0;

  // Show khi có ít nhất 2/4 trường còn rỗng
  const empty = [!hasAge, !hasYears, !hasReasons, !hasTriggers].filter(Boolean).length;
  return empty >= 2;
}

