import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { api } from '../services/api';
import { BindPhoneModal } from '../components/BindPhoneModal';
import { RecoverView } from '../components/RecoverView';
import { EmailBindModal } from '../components/EmailBindModal';
import type { WidgetMode } from '../types';
import { DEFAULT_CIGS_PER_DAY, DEFAULT_PRICE_PER_CIG, formatVndFull } from '../lib/recovery';
import { buildPreviewSamples } from '../lib/preview';
import { QuitlineButton } from '../components/QuitlineButton';

// Presets giá hay gặp ở VN — tap để chọn nhanh
const PRICE_PRESETS: Array<{ label: string; price: number }> = [
  { label: 'Nội rẻ', price: 1000 },
  { label: 'Nội TB', price: 1500 },
  { label: 'Nội cao', price: 2500 },
  { label: 'Ngoại', price: 4000 },
];

// Onboarding presets — phải khớp với Login.tsx + AuthGate.tsx
const PRONOUN_PRESETS = ['anh', 'chị', 'em'] as const;
const ASSISTANT_PRESETS = ['Sol Trợ lý', 'Sol Phó tướng', 'Sol Đồng hành'] as const;
const PRONOUN_MAX = 8;
const ASSISTANT_MAX = 24;

// Hồ sơ cai thuốc (group 1) — phải khớp với ProfileSetupWizard
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
const PROFILE_SELECT_LIMIT = 3;

export function Settings() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? '');
  const [quitDate, setQuitDate] = useState(user?.quitDate ?? '');
  const [showBindPhone, setShowBindPhone] = useState(false);
  const [showBindEmail, setShowBindEmail] = useState(false);
  const [showRecover, setShowRecover] = useState(false);

  // Cách xưng hô (Q1)
  const initialPronoun = user?.pronouns && PRONOUN_PRESETS.includes(user.pronouns as any)
    ? user.pronouns
    : user?.pronouns
      ? '__custom'
      : 'anh';
  const [pronoun, setPronoun] = useState<string>(initialPronoun);
  const [pronounCustom, setPronounCustom] = useState<string>(
    user?.pronouns && !PRONOUN_PRESETS.includes(user.pronouns as any) ? user.pronouns : '',
  );
  const isPronounCustom = !PRONOUN_PRESETS.includes(pronoun as any);

  // Tên trợ lý (Q2)
  const initialAssistant = user?.assistantName && ASSISTANT_PRESETS.includes(user.assistantName as any)
    ? user.assistantName
    : user?.assistantName
      ? '__custom'
      : 'Sol Đồng hành';
  const [assistant, setAssistant] = useState<string>(initialAssistant);
  const [assistantCustom, setAssistantCustom] = useState<string>(
    user?.assistantName && !ASSISTANT_PRESETS.includes(user.assistantName as any) ? user.assistantName : '',
  );
  const isAssistantCustom = !ASSISTANT_PRESETS.includes(assistant as any);

  // ── Hồ sơ cai thuốc (group 1) ─────────────────────────────────────────
  const [age, setAge] = useState<string>(user?.age != null ? String(user.age) : '');
  const [yearsSmoked, setYearsSmoked] = useState<string>(
    user?.yearsSmoked != null ? String(user.yearsSmoked) : '',
  );
  const [quitReasons, setQuitReasons] = useState<string[]>(user?.quitReasons ?? []);
  const [reasonCustom, setReasonCustom] = useState('');
  const [topTriggers, setTopTriggers] = useState<string[]>(user?.topTriggers ?? []);
  const [triggerCustom, setTriggerCustom] = useState('');

  const [quietStart, setQuietStart] = useState<string>(user?.settings?.quietStart ?? '22:30');
  const [quietEnd, setQuietEnd] = useState<string>(user?.settings?.quietEnd ?? '06:30');
  const [mode, setMode] = useState<WidgetMode>((user?.settings?.mode as WidgetMode) ?? 'normal');
  const [cigsPerDay, setCigsPerDay] = useState<number>(user?.settings?.cigsPerDay ?? DEFAULT_CIGS_PER_DAY);
  const [pricePerCig, setPricePerCig] = useState<number>(user?.settings?.pricePerCig ?? DEFAULT_PRICE_PER_CIG);
  const [phaseLanguage, setPhaseLanguage] = useState<'dramatic' | 'clinical'>(
    (user?.settings?.phaseLanguage as 'dramatic' | 'clinical') ?? 'dramatic'
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setQuitDate(user.quitDate ?? '');
      setQuietStart(user.settings?.quietStart ?? '22:30');
      setQuietEnd(user.settings?.quietEnd ?? '06:30');
      setMode((user.settings?.mode as WidgetMode) ?? 'normal');
      setCigsPerDay(user.settings?.cigsPerDay ?? DEFAULT_CIGS_PER_DAY);
      setPricePerCig(user.settings?.pricePerCig ?? DEFAULT_PRICE_PER_CIG);
      setPhaseLanguage((user.settings?.phaseLanguage as 'dramatic' | 'clinical') ?? 'dramatic');

      // Pronoun
      if (user.pronouns && PRONOUN_PRESETS.includes(user.pronouns as any)) {
        setPronoun(user.pronouns);
        setPronounCustom('');
      } else if (user.pronouns) {
        setPronoun('__custom');
        setPronounCustom(user.pronouns);
      }

      // Assistant
      if (user.assistantName && ASSISTANT_PRESETS.includes(user.assistantName as any)) {
        setAssistant(user.assistantName);
        setAssistantCustom('');
      } else if (user.assistantName) {
        setAssistant('__custom');
        setAssistantCustom(user.assistantName);
      }

      // Hồ sơ cai thuốc
      setAge(user.age != null ? String(user.age) : '');
      setYearsSmoked(user.yearsSmoked != null ? String(user.yearsSmoked) : '');
      setQuitReasons(user.quitReasons ?? []);
      setTopTriggers(user.topTriggers ?? []);
    }
  }, [user]);

  function resolvePronoun(): string {
    return (isPronounCustom ? pronounCustom : pronoun).trim().slice(0, PRONOUN_MAX);
  }

  function resolveAssistant(): string {
    return (isAssistantCustom ? assistantCustom : assistant).trim().slice(0, ASSISTANT_MAX);
  }

  // Hồ sơ cai thuốc — chip toggle helpers
  function toggleQuitReason(r: string) {
    if (quitReasons.includes(r)) {
      setQuitReasons(quitReasons.filter((x) => x !== r));
    } else if (quitReasons.length < PROFILE_SELECT_LIMIT) {
      setQuitReasons([...quitReasons, r]);
    } else {
      setMsg(`Tối đa ${PROFILE_SELECT_LIMIT} lý do — bỏ chọn 1 cái rồi thêm.`);
    }
  }
  function addReasonCustom() {
    const t = reasonCustom.trim().slice(0, REASON_MAX);
    if (!t || quitReasons.length >= PROFILE_SELECT_LIMIT || quitReasons.includes(t)) {
      setReasonCustom('');
      return;
    }
    setQuitReasons([...quitReasons, t]);
    setReasonCustom('');
  }
  function toggleTrigger(tr: string) {
    if (topTriggers.includes(tr)) {
      setTopTriggers(topTriggers.filter((x) => x !== tr));
    } else if (topTriggers.length < PROFILE_SELECT_LIMIT) {
      setTopTriggers([...topTriggers, tr]);
    } else {
      setMsg(`Tối đa ${PROFILE_SELECT_LIMIT} trigger — bỏ chọn 1 cái rồi thêm.`);
    }
  }
  function addTriggerCustom() {
    const t = triggerCustom.trim().slice(0, TRIGGER_MAX);
    if (!t || topTriggers.length >= PROFILE_SELECT_LIMIT || topTriggers.includes(t)) {
      setTriggerCustom('');
      return;
    }
    setTopTriggers([...topTriggers, t]);
    setTriggerCustom('');
  }

  const preview = useMemo(() => {
    const daily = Math.max(0, cigsPerDay) * Math.max(0, pricePerCig);
    return { daily, weekly: daily * 7, monthly: daily * 30, yearly: daily * 365 };
  }, [cigsPerDay, pricePerCig]);

  // Live preview "AI sẽ chào ông kiểu này" — cập nhật ngay khi bấm preset.
  const namePreview = useMemo(
    () =>
      buildPreviewSamples({
        name,
        pronouns: isPronounCustom ? pronounCustom : pronoun,
        assistantName: isAssistantCustom ? assistantCustom : assistant,
      }),
    [name, pronoun, pronounCustom, isPronounCustom, assistant, assistantCustom, isAssistantCustom],
  );

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const finalPronoun = resolvePronoun();
      const finalAssistant = resolveAssistant();
      if (isPronounCustom && !finalPronoun) {
        setMsg('Hãy nhập cách xưng hô (≤ 8 ký tự).');
        setSaving(false);
        return;
      }
      if (isAssistantCustom && !finalAssistant) {
        setMsg('Hãy nhập tên trợ lý (≤ 24 ký tự).');
        setSaving(false);
        return;
      }
      const nextSettings = {
        ...(user?.settings ?? {}),
        quietStart,
        quietEnd,
        mode,
        cigsPerDay,
        pricePerCig,
        phaseLanguage,
      };

      // Hồ sơ cai thuốc — validate + chuẩn hoá
      const ageNum = age.trim() ? parseInt(age.trim(), 10) : null;
      const yearsNum = yearsSmoked.trim() ? parseInt(yearsSmoked.trim(), 10) : null;
      if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 18 || ageNum > 120)) {
        setMsg('Tuổi nên trong khoảng 18-120.');
        setSaving(false);
        return;
      }
      if (yearsNum !== null && (Number.isNaN(yearsNum) || yearsNum < 0 || yearsNum > 90)) {
        setMsg('Số năm hút nên trong khoảng 0-90.');
        setSaving(false);
        return;
      }

      // Convert quitDate format: input type="date" → "YYYY-MM-DD"
      // Backend cần ISO datetime đầy đủ. Empty → null.
      let quitDateIso: string | null = null;
      if (quitDate && quitDate.trim()) {
        const d = new Date(quitDate);
        if (!isNaN(d.getTime())) quitDateIso = d.toISOString();
      }

      await api.patchMe({
        name,
        quitDate: quitDateIso,
        pronouns: finalPronoun,
        assistantName: finalAssistant,
        settings: nextSettings,
        age: ageNum,
        yearsSmoked: yearsNum,
        quitReasons,
        topTriggers,
      } as any);
      if (user)
        setUser({
          ...user,
          name,
          quitDate,
          pronouns: finalPronoun,
          assistantName: finalAssistant,
          settings: nextSettings,
          age: ageNum,
          yearsSmoked: yearsNum,
          quitReasons,
          topTriggers,
        });
      setMsg('✓ Đã lưu');
    } catch (e: any) {
      setMsg(e?.message ?? 'Có lỗi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto pb-24 lg:pb-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
      </header>

      <Section title="Tài khoản" icon="👤" defaultOpen hint="Tên · Liên kết · Đăng xuất">
        {/* Account info badge — phone rõ ràng để user nhớ đang dùng số nào */}
        <div className="bg-sol-paper border border-sol-line rounded-xl p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-sol-green text-white flex items-center justify-center font-bold flex-shrink-0">
              {(user?.name?.[0] ?? 'S').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sol-ink truncate">{user?.name ?? '—'}</div>
              {user?.email && (
                <div className="text-meta text-sol-ink-2 truncate">📧 {user.email}</div>
              )}
              {user?.phone && (
                <div className="text-meta text-sol-ink-2 font-mono">📱 {user.phone}</div>
              )}
              {!user?.email && !user?.phone && (
                <div className="text-meta text-sol-ink-3 italic">
                  Chưa liên kết — chỉ dùng được trên thiết bị này
                </div>
              )}
            </div>
          </div>
          {user?.phone && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(user.phone!).catch(() => {});
              }}
              className="text-meta text-sol-ink-3 hover:text-sol-ink underline"
              aria-label="Copy số điện thoại"
            >
              Copy SĐT
            </button>
          )}
        </div>

        {/* Liên kết identity — chỉ hiện cho user ẩn danh (chưa có phone/email) */}
        {!user?.phone && !user?.email && (
          <div className="space-y-2 mb-4">
            {/* Email — primary path (2026-05-06 pivot — Zalo/SĐT defer) */}
            <button
              type="button"
              onClick={() => setShowBindEmail(true)}
              className="w-full py-2.5 rounded-xl bg-sol-green text-white font-semibold text-body flex items-center justify-center gap-2 hover:brightness-110 transition"
            >
              <span>📧</span>
              <span>Liên kết qua Email (khuyến nghị)</span>
            </button>

            {/* Zalo + SĐT DEFERRED — UI ẩn, code giữ nguyên cho future unhide */}

            <p className="text-meta text-sol-ink-3 leading-relaxed text-center px-2">
              Liên kết để bảo vệ hành trình nếu mất máy. Bấm link 1 lần là đồng bộ — không cần mật khẩu.
            </p>
            {/* Layer 3 entry — user đã có mã khôi phục có thể recover ngay */}
            <button
              type="button"
              onClick={() => setShowRecover(true)}
              className="w-full py-1.5 text-meta text-sol-ink-3 hover:text-sol-ink underline"
            >
              🔑 Tôi đã có mã khôi phục →
            </button>
          </div>
        )}

        <div className="space-y-3">
          <Field label="Tên gọi (đổi được)">
            <input
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Soler ${user?.phone?.slice(-4) ?? ''}`}
            />
          </Field>
          <Field label="Số điện thoại (không đổi được)">
            <input
              className="w-full px-3 py-2 rounded-lg border border-sol-line bg-sol-paper text-sol-ink-2 font-mono cursor-not-allowed"
              value={user?.phone ?? ''}
              disabled
            />
            <p className="text-meta text-sol-ink-3 mt-1">
              Đây là SĐT bạn đang đăng nhập. Đổi SĐT cần liên hệ Khang.
            </p>
          </Field>
          <Field label="Ngày bắt đầu cai (Q-Day)">
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white"
              value={quitDate ? quitDate.slice(0, 10) : ''}
              onChange={(e) => setQuitDate(e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Cách xưng hô" icon="💬" defaultOpen hint="Sol gọi bạn · Tên trợ lý">
        <div className="space-y-4">
          {/* Q1 */}
          <Field label="Bạn muốn Sol xưng hô là gì?">
            <div className="grid grid-cols-3 gap-2">
              {PRONOUN_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPronoun(p)}
                  className={`py-2 rounded-lg border-2 text-sm font-medium transition ${
                    pronoun === p
                      ? 'bg-sol-green text-white border-sol-green'
                      : 'bg-white text-sol-ink border-black/10 hover:border-sol-green/40'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isPronounCustom) setPronoun('__custom');
              }}
              className={`mt-2 w-full py-2 rounded-lg border-2 text-sm font-medium transition ${
                isPronounCustom
                  ? 'bg-sol-green text-white border-sol-green'
                  : 'bg-white text-sol-ink/70 border-black/10 border-dashed hover:border-sol-green/40'
              }`}
            >
              {isPronounCustom ? 'Tuỳ chỉnh ↓' : '✏️ Tuỳ chỉnh (Ngài, Đại ca…)'}
            </button>
            {isPronounCustom && (
              <input
                placeholder="Ngài / Đại ca / Sếp…"
                value={pronounCustom}
                onChange={(e) => setPronounCustom(e.target.value.slice(0, PRONOUN_MAX))}
                maxLength={PRONOUN_MAX}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-black/10 bg-white"
              />
            )}
          </Field>

          {/* Q2 */}
          <Field label="Bạn muốn gọi trợ lý của Sol là gì?">
            <p className="text-[11px] text-sol-ink/50 -mt-1 mb-2">
              Tên này hiện trong tin nhắn hàng ngày của trợ lý.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ASSISTANT_PRESETS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAssistant(a)}
                  className={`py-2 rounded-lg border-2 text-sm font-medium transition ${
                    assistant === a
                      ? 'bg-sol-green text-white border-sol-green'
                      : 'bg-white text-sol-ink border-black/10 hover:border-sol-green/40'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isAssistantCustom) setAssistant('__custom');
              }}
              className={`mt-2 w-full py-2 rounded-lg border-2 text-sm font-medium transition ${
                isAssistantCustom
                  ? 'bg-sol-green text-white border-sol-green'
                  : 'bg-white text-sol-ink/70 border-black/10 border-dashed hover:border-sol-green/40'
              }`}
            >
              {isAssistantCustom ? 'Tuỳ chỉnh ↓' : '✏️ Tuỳ chỉnh (Sol Vợ yêu, Sol Sếp…)'}
            </button>
            {isAssistantCustom && (
              <input
                placeholder="Sol Vợ yêu / Sol Sếp / Sol Đồng đội…"
                value={assistantCustom}
                onChange={(e) => setAssistantCustom(e.target.value.slice(0, ASSISTANT_MAX))}
                maxLength={ASSISTANT_MAX}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-black/10 bg-white"
              />
            )}
          </Field>

          {/* Preview */}
          <div className="mt-3 p-4 rounded-xl bg-sol-bg border border-black/5 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="text-[10px] uppercase tracking-wider text-sol-ink/50">
                AI sẽ chào ông kiểu này
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sol-green/10 text-sol-green text-[11px] font-semibold">
                {namePreview.signature}
              </span>
            </div>
            <PreviewBubble label="🌅 Sáng" text={namePreview.morning} />
            <PreviewBubble label="💬 Chào trong chat" text={namePreview.chatGreeting} />
            <PreviewBubble label="🆘 Khi thèm" text={namePreview.craving} />
            <PreviewBubble label="🌙 Tối" text={namePreview.evening} />
            <p className="text-[11px] text-sol-ink/50">
              Đây chỉ là bản xem trước — AI thật sẽ điều chỉnh theo ngữ cảnh thực tế.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Hồ sơ cai thuốc" icon="🚭" hint="Tuổi · Số năm hút · Lý do · Tác nhân">
        <p className="text-xs text-sol-ink/60 -mt-1 mb-3">
          Mấy thông tin này giúp Sol viết tin nhắn đúng "chất" của bạn — nhắc lại lý do của bạn,
          biết khi nào cơ thể bạn cần thêm thời gian phục hồi.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tuổi (chỉ Sol biết)">
              <input
                type="number"
                inputMode="numeric"
                min={18}
                max={120}
                placeholder="Vd: 52"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white tabular-nums"
              />
            </Field>
            <Field label="Đã hút thuốc bao nhiêu năm?">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={90}
                placeholder="Vd: 25"
                value={yearsSmoked}
                onChange={(e) => setYearsSmoked(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white tabular-nums"
              />
            </Field>
          </div>

          {/* Lý do bỏ thuốc */}
          <Field label={`Lý do bạn muốn bỏ thuốc (chọn tối đa ${PROFILE_SELECT_LIMIT})`}>
            <p className="text-[11px] text-sol-ink/50 -mt-1 mb-2">
              Sol sẽ nhắc lại nguyên văn câu này lúc bạn thèm — đừng chọn câu sáo, hãy chọn câu thật.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REASON_PRESETS.map((r) => {
                const selected = quitReasons.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleQuitReason(r)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition ${
                      selected
                        ? 'bg-sol-green-soft border-sol-green ring-2 ring-sol-green/30 text-sol-green-ink font-semibold'
                        : 'bg-white border-black/10 text-sol-ink/80 hover:border-sol-green/40'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {quitReasons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {quitReasons.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full bg-sol-green/10 text-sol-green-ink border border-sol-green/30"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => setQuitReasons(quitReasons.filter((x) => x !== r))}
                      aria-label={`Bỏ ${r}`}
                      className="text-sol-green-ink/70 hover:text-sol-green-ink"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {quitReasons.length < PROFILE_SELECT_LIMIT && (
              <div className="mt-2 flex gap-2">
                <input
                  placeholder='Lý do của riêng bạn (vd: "vì cu Tí")'
                  value={reasonCustom}
                  onChange={(e) => setReasonCustom(e.target.value.slice(0, REASON_MAX))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addReasonCustom();
                    }
                  }}
                  maxLength={REASON_MAX}
                  className="flex-1 px-3 py-2 rounded-lg border border-black/10 bg-white"
                />
                <button
                  type="button"
                  onClick={addReasonCustom}
                  disabled={!reasonCustom.trim()}
                  className="px-3 py-2 rounded-lg bg-sol-green text-white font-medium disabled:opacity-40"
                >
                  Thêm
                </button>
              </div>
            )}
          </Field>

          {/* Trigger thèm thuốc */}
          <Field label={`Khi nào bạn hay thèm thuốc nhất? (chọn tối đa ${PROFILE_SELECT_LIMIT})`}>
            <p className="text-[11px] text-sol-ink/50 -mt-1 mb-2">
              Sol sẽ nhận diện khoảnh khắc này và gợi cách thay thế — vd cà phê + 4-7-8 thay vì cà phê + thuốc.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TRIGGER_PRESETS.map((tr) => {
                const selected = topTriggers.includes(tr);
                return (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => toggleTrigger(tr)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition ${
                      selected
                        ? 'bg-sol-orange-soft border-sol-orange ring-2 ring-sol-orange/30 text-sol-orange-ink font-semibold'
                        : 'bg-white border-black/10 text-sol-ink/80 hover:border-sol-orange/40'
                    }`}
                  >
                    {tr}
                  </button>
                );
              })}
            </div>
            {topTriggers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topTriggers.map((tr) => (
                  <span
                    key={tr}
                    className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full bg-sol-orange/10 text-sol-orange-ink border border-sol-orange/30"
                  >
                    {tr}
                    <button
                      type="button"
                      onClick={() => setTopTriggers(topTriggers.filter((x) => x !== tr))}
                      aria-label={`Bỏ ${tr}`}
                      className="text-sol-orange-ink/70 hover:text-sol-orange-ink"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {topTriggers.length < PROFILE_SELECT_LIMIT && (
              <div className="mt-2 flex gap-2">
                <input
                  placeholder="Trigger riêng của bạn (vd: lúc đi câu)"
                  value={triggerCustom}
                  onChange={(e) => setTriggerCustom(e.target.value.slice(0, TRIGGER_MAX))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTriggerCustom();
                    }
                  }}
                  maxLength={TRIGGER_MAX}
                  className="flex-1 px-3 py-2 rounded-lg border border-black/10 bg-white"
                />
                <button
                  type="button"
                  onClick={addTriggerCustom}
                  disabled={!triggerCustom.trim()}
                  className="px-3 py-2 rounded-lg bg-sol-orange text-white font-medium disabled:opacity-40"
                >
                  Thêm
                </button>
              </div>
            )}
          </Field>
        </div>
      </Section>

      {/* "Ngôn ngữ giai đoạn" toggle (Dramatic/Clinical) đã được ẩn —
          choice paralysis cho user 45+ Việt. Mặc định Dramatic (Việt hoá).
          Field backend `phaseLanguage` vẫn còn — admin có thể bật lại sau
          nếu user yêu cầu, hoặc expose qua Cài đặt nâng cao tương lai. */}
      <details className="bg-sol-paper border border-sol-line rounded-2xl">
        <summary className="cursor-pointer p-4 flex items-center justify-between text-meta text-sol-ink-2 hover:bg-sol-soft transition rounded-2xl select-none">
          <span className="flex items-center gap-2">
            <span>⚙️</span>
            <span>Tuỳ chọn nâng cao</span>
            <span className="text-[10px] uppercase tracking-wide text-sol-ink-3">
              Chỉ khi cần
            </span>
          </span>
          <span className="text-sol-ink-3">▾</span>
        </summary>
        <div className="px-4 pb-4 pt-2 border-t border-sol-line">
          <div className="text-meta text-sol-ink-2 mb-3 leading-relaxed">
            <strong>Ngôn ngữ giai đoạn:</strong> Tên các giai đoạn trên đồng
            hồ + hành trình. Mặc định <em>"Hình ảnh"</em> (Chiến Trường, Ánh
            Bình Minh…) — phù hợp đa số. Chọn <em>"Khoa học"</em> nếu bạn
            quen thuật ngữ y khoa.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPhaseLanguage('dramatic')}
              className={
                'text-left p-3 rounded-xl border-2 transition ' +
                (phaseLanguage === 'dramatic'
                  ? 'border-sol-green bg-sol-green-soft'
                  : 'border-sol-line bg-white hover:border-sol-green/40')
              }
            >
              <div className="font-bold text-meta text-sol-ink">
                🌅 Hình ảnh (mặc định)
              </div>
              <div className="text-[11px] text-sol-ink-2 mt-1 leading-relaxed">
                Chiến Trường · Đống Tro Tàn · Ánh Bình Minh · Tự Do
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPhaseLanguage('clinical')}
              className={
                'text-left p-3 rounded-xl border-2 transition ' +
                (phaseLanguage === 'clinical'
                  ? 'border-sol-blue bg-sol-blue-soft'
                  : 'border-sol-line bg-white hover:border-sol-blue/40')
              }
            >
              <div className="font-bold text-meta text-sol-ink">⚕️ Khoa học</div>
              <div className="text-[11px] text-sol-ink-2 mt-1 leading-relaxed">
                Withdrawal · Slump · Habit Reset · Consolidation
              </div>
            </button>
          </div>
        </div>
      </details>

      <Section title="Thói quen hút thuốc" icon="🚬" hint="Số điếu/ngày · Giá điếu (tính tiền tiết kiệm)">
        <div className="space-y-3">
          <Field label="Số điếu hút mỗi ngày (trước khi cai)">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={cigsPerDay}
                onChange={(e) => setCigsPerDay(Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: '#B25C2C' }}
              />
              <div className="w-20 text-right">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={cigsPerDay}
                  onChange={(e) => setCigsPerDay(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 rounded-lg border border-black/10 bg-white text-right tabular-nums"
                />
              </div>
              <span className="text-xs text-sol-ink/50 w-10">điếu</span>
            </div>
            <div className="text-[11px] text-sol-ink/50 mt-1">
              Gói 20 điếu ≈ 1 ngày · gói 10 điếu ≈ nửa ngày
            </div>
          </Field>

          <Field label="Giá trung bình mỗi điếu">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={20000}
                step={100}
                value={pricePerCig}
                onChange={(e) => setPricePerCig(Math.max(0, Number(e.target.value) || 0))}
                className="flex-1 px-3 py-2 rounded-lg border border-black/10 bg-white tabular-nums"
              />
              <span className="text-xs text-sol-ink/50">đ / điếu</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPricePerCig(p.price)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    pricePerCig === p.price
                      ? 'bg-sol-green text-white border-sol-green'
                      : 'bg-white border-black/10 text-sol-ink/70 hover:bg-sol-bg'
                  }`}
                >
                  {p.label} · {p.price.toLocaleString('vi-VN')}đ
                </button>
              ))}
            </div>
            <div className="text-[11px] text-sol-ink/50 mt-2">
              Ví dụ: gói Thăng Long 20 điếu ~ 25.000đ → ~1.250đ/điếu · Marlboro 20 điếu ~ 32.000đ → ~1.600đ/điếu
            </div>
          </Field>

          {/* Preview */}
          <div className="mt-2 p-3.5 rounded-xl bg-sol-bg border border-black/5">
            <div className="text-[10px] uppercase tracking-wider text-sol-ink/50 mb-2">
              Ước tính bạn sẽ tiết kiệm được
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <PreviewBox label="Mỗi ngày" value={formatVndFull(preview.daily)} />
              <PreviewBox label="Mỗi tuần" value={formatVndFull(preview.weekly)} />
              <PreviewBox label="Mỗi tháng" value={formatVndFull(preview.monthly)} accent />
              <PreviewBox label="Mỗi năm" value={formatVndFull(preview.yearly)} />
            </div>
            <div className="text-[11px] text-sol-ink/60 mt-2">
              Con số này hiện lên đồng hồ Tổng quan và card chia sẻ thành tích.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Chế độ thông báo" icon="🔔" hint="Bình thường · Bận · Thì thầm · Yên">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['normal', 'busy', 'whisper', 'calm'] as WidgetMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 rounded-lg border text-sm ${
                mode === m ? 'bg-sol-green text-white border-sol-green' : 'bg-white border-black/10'
              }`}
            >
              {labelMode(m)}
            </button>
          ))}
        </div>
        <p className="text-xs text-sol-ink/60 mt-2">
          {mode === 'normal' && 'Nhận mọi nhắc nhở theo lộ trình.'}
          {mode === 'busy' && 'Chỉ nhắc sáng/tối và khi có nguy cơ cao.'}
          {mode === 'whisper' && 'Không âm thanh, chỉ badge trong widget.'}
          {mode === 'calm' && 'Tạm hoãn 24 giờ (trừ SOS).'}
        </p>
      </Section>

      <Section title="Khung giờ yên tĩnh" icon="🌙" hint="Khi nào Sol không nhắn">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bắt đầu">
            <input
              type="time"
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
            />
          </Field>
          <Field label="Kết thúc">
            <input
              type="time"
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Cần giúp đỡ" icon="🆘" hint="Tổng đài chuyên gia · Hotline cấp cứu">
        <div className="space-y-4 max-w-md">
          <p className="text-body text-sol-ink-2 leading-relaxed">
            Sol là AI — không thay thế chuyên gia. Khi cần nói chuyện với người
            thật về cai thuốc, sức khoẻ, hoặc tâm lý:
          </p>
          <QuitlineButton size="large" tone="calm" />
          <div className="text-meta text-sol-ink-3 italic">
            Hotline cấp cứu y tế: <strong className="text-sol-red">115</strong> ·
            Hotline tâm lý Ngày Mai: <strong className="text-sol-blue">1900 599 958</strong>
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-sol-green text-white font-semibold disabled:opacity-50"
        >
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
        {msg && <span className="text-sm text-sol-green">{msg}</span>}
      </div>

      {showBindPhone && (
        <BindPhoneModal onClose={() => setShowBindPhone(false)} />
      )}
      {showBindEmail && (
        <EmailBindModal onClose={() => setShowBindEmail(false)} />
      )}
      {showRecover && <RecoverView onClose={() => setShowRecover(false)} />}
    </div>
  );
}

function labelMode(m: WidgetMode) {
  return m === 'normal' ? 'Bình thường' : m === 'busy' ? 'Bận' : m === 'whisper' ? 'Thì thầm' : 'Tạm hoãn';
}

/**
 * Settings v2: Section thành accordion để giảm scroll fatigue cho user 45+.
 * `defaultOpen` cho 2 section đầu (Tài khoản, Xưng hô) — phần lớn user vào
 * Settings để chỉnh tên/cách xưng hô. Các section khác đóng mặc định, click
 * mới expand.
 */
function Section({
  title,
  children,
  defaultOpen = false,
  icon,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  hint?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className="bg-white rounded-2xl border border-black/5 shadow-card group overflow-hidden"
    >
      <summary
        className="cursor-pointer p-5 flex items-center justify-between gap-3 hover:bg-sol-soft/40 transition select-none"
        // Giữ semantic: summary mở/đóng <details>
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-sol-ink/50">
              {title}
            </div>
            {hint && (
              <div className="text-[11px] text-sol-ink-3 mt-0.5 truncate">{hint}</div>
            )}
          </div>
        </div>
        <svg
          className="w-4 h-4 text-sol-ink-3 transition-transform group-open:rotate-180 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="px-5 pb-5 pt-0 border-t border-sol-line">{children}</div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-sol-ink/60 mb-1">{label}</div>
      {children}
    </label>
  );
}

function PreviewBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg px-2.5 py-2 text-center border ${
        accent ? 'bg-sol-green/10 border-sol-green/30' : 'bg-white border-black/5'
      }`}
    >
      <div className="text-[10px] text-sol-ink/50 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${accent ? 'text-sol-green' : 'text-sol-ink'}`}>
        {value}
      </div>
    </div>
  );
}

function PreviewBubble({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-24 shrink-0 text-[11px] text-sol-ink/50 pt-1.5">{label}</div>
      <div className="flex-1 px-3 py-2 rounded-2xl rounded-tl-sm bg-white border border-black/5 text-sm text-sol-ink leading-relaxed">
        {text}
      </div>
    </div>
  );
}
