// frontend/src/components/views/SettingsView.tsx
// User-facing controls: mode, quiet hours, push permission, log out.

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state/store';
import { api } from '../../services/api';
import { subscribeToPush, requestPushPermission } from '../../services/webpush';
import { BindPhoneModal } from '../BindPhoneModal';
import { RecoverView } from '../RecoverView';
import type { WidgetMode } from '../../types';
import { buildPreviewSamples } from '../../lib/preview';
import { NotificationPrefsPanel } from '../NotificationPrefsPanel';

// Phải khớp với AuthGate.tsx + dashboard
const PRONOUN_PRESETS = ['anh', 'chị', 'em'] as const;
const ASSISTANT_PRESETS = ['Sol Trợ lý', 'Sol Phó tướng', 'Sol Đồng hành'] as const;
const PRONOUN_MAX = 8;
const ASSISTANT_MAX = 24;

// Hồ sơ cai thuốc (group 1) — phải khớp với ProfileSetupWizard + dashboard
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

export function SettingsView() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const setMode = useStore((s) => s.setMode);
  const reset = useStore((s) => s.reset);
  const [quietStart, setQuietStart] = useState<string>(user?.settings?.quietStart ?? '22:30');
  const [quietEnd, setQuietEnd] = useState<string>(user?.settings?.quietEnd ?? '06:30');
  const [cigsPerDay, setCigsPerDay] = useState<number>(user?.settings?.cigsPerDay ?? 15);
  const [pricePerCig, setPricePerCig] = useState<number>(user?.settings?.pricePerCig ?? 1500);
  const [pushStatus, setPushStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown');
  const [saving, setSaving] = useState(false);
  const [savingCost, setSavingCost] = useState(false);
  const [showBindPhone, setShowBindPhone] = useState(false);
  const [showRecover, setShowRecover] = useState(false);

  // Cách xưng hô — Q1
  const [pronoun, setPronoun] = useState<string>(
    user?.pronouns && PRONOUN_PRESETS.includes(user.pronouns as any)
      ? user.pronouns
      : user?.pronouns
        ? '__custom'
        : 'anh',
  );
  const [pronounCustom, setPronounCustom] = useState<string>(
    user?.pronouns && !PRONOUN_PRESETS.includes(user.pronouns as any) ? user.pronouns : '',
  );
  const isPronounCustom = !PRONOUN_PRESETS.includes(pronoun as any);

  // Trợ lý — Q2
  const [assistant, setAssistant] = useState<string>(
    user?.assistantName && ASSISTANT_PRESETS.includes(user.assistantName as any)
      ? user.assistantName
      : user?.assistantName
        ? '__custom'
        : 'Sol Đồng hành',
  );
  const [assistantCustom, setAssistantCustom] = useState<string>(
    user?.assistantName && !ASSISTANT_PRESETS.includes(user.assistantName as any) ? user.assistantName : '',
  );
  const isAssistantCustom = !ASSISTANT_PRESETS.includes(assistant as any);

  const [savingNames, setSavingNames] = useState(false);
  const [namesMsg, setNamesMsg] = useState<string | null>(null);

  // ── Hồ sơ cai thuốc (group 1) ─────────────────────────────────────────
  const [age, setAge] = useState<string>(user?.age != null ? String(user.age) : '');
  const [yearsSmoked, setYearsSmoked] = useState<string>(
    user?.yearsSmoked != null ? String(user.yearsSmoked) : '',
  );
  const [quitReasons, setQuitReasons] = useState<string[]>(user?.quitReasons ?? []);
  const [reasonCustom, setReasonCustom] = useState('');
  const [topTriggers, setTopTriggers] = useState<string[]>(user?.topTriggers ?? []);
  const [triggerCustom, setTriggerCustom] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setAge(user.age != null ? String(user.age) : '');
      setYearsSmoked(user.yearsSmoked != null ? String(user.yearsSmoked) : '');
      setQuitReasons(user.quitReasons ?? []);
      setTopTriggers(user.topTriggers ?? []);
    }
  }, [user]);

  function toggleQuitReason(r: string) {
    if (quitReasons.includes(r)) {
      setQuitReasons(quitReasons.filter((x) => x !== r));
    } else if (quitReasons.length < PROFILE_SELECT_LIMIT) {
      setQuitReasons([...quitReasons, r]);
    } else {
      setProfileMsg(`Tối đa ${PROFILE_SELECT_LIMIT} lý do.`);
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
      setProfileMsg(`Tối đa ${PROFILE_SELECT_LIMIT} trigger.`);
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

  async function saveProfile() {
    setProfileMsg(null);
    const ageNum = age.trim() ? parseInt(age.trim(), 10) : null;
    const yearsNum = yearsSmoked.trim() ? parseInt(yearsSmoked.trim(), 10) : null;
    if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 18 || ageNum > 120)) {
      setProfileMsg('Tuổi nên trong khoảng 18-120.');
      return;
    }
    if (yearsNum !== null && (Number.isNaN(yearsNum) || yearsNum < 0 || yearsNum > 90)) {
      setProfileMsg('Số năm hút nên trong khoảng 0-90.');
      return;
    }
    setSavingProfile(true);
    try {
      await api.patchMe({
        age: ageNum,
        yearsSmoked: yearsNum,
        quitReasons,
        topTriggers,
      } as any);
      if (user)
        setUser({
          ...user,
          age: ageNum,
          yearsSmoked: yearsNum,
          quitReasons,
          topTriggers,
        });
      setProfileMsg('✓ Đã lưu');
    } catch (e: any) {
      setProfileMsg(e?.message ?? 'Có lỗi');
    } finally {
      setSavingProfile(false);
    }
  }

  // Live preview "AI sẽ chào ông kiểu này"
  const namePreview = useMemo(
    () =>
      buildPreviewSamples({
        name: user?.name,
        pronouns: isPronounCustom ? pronounCustom : pronoun,
        assistantName: isAssistantCustom ? assistantCustom : assistant,
      }),
    [user?.name, pronoun, pronounCustom, isPronounCustom, assistant, assistantCustom, isAssistantCustom],
  );

  useEffect(() => {
    if (typeof Notification === 'undefined') setPushStatus('unsupported');
    else if (Notification.permission === 'granted') setPushStatus('granted');
    else if (Notification.permission === 'denied') setPushStatus('denied');
    else setPushStatus('unknown');
  }, []);

  async function saveQuiet() {
    setSaving(true);
    try {
      await api.patchMe({
        settings: { ...(user?.settings ?? {}), quietStart, quietEnd },
      } as any);
    } finally {
      setSaving(false);
    }
  }

  async function saveCost() {
    setSavingCost(true);
    try {
      await api.patchMe({
        settings: { ...(user?.settings ?? {}), cigsPerDay, pricePerCig },
      } as any);
    } finally {
      setSavingCost(false);
    }
  }

  async function saveNames() {
    setNamesMsg(null);
    const finalPronoun = (isPronounCustom ? pronounCustom : pronoun).trim().slice(0, PRONOUN_MAX);
    const finalAssistant = (isAssistantCustom ? assistantCustom : assistant).trim().slice(0, ASSISTANT_MAX);
    if (isPronounCustom && !finalPronoun) {
      setNamesMsg('Hãy nhập cách xưng hô (≤ 8 ký tự).');
      return;
    }
    if (isAssistantCustom && !finalAssistant) {
      setNamesMsg('Hãy nhập tên trợ lý (≤ 24 ký tự).');
      return;
    }
    setSavingNames(true);
    try {
      await api.patchMe({
        pronouns: finalPronoun,
        assistantName: finalAssistant,
      } as any);
      if (user) setUser({ ...user, pronouns: finalPronoun, assistantName: finalAssistant });
      setNamesMsg('✓ Đã lưu');
    } catch (e: any) {
      setNamesMsg(e?.message ?? 'Có lỗi');
    } finally {
      setSavingNames(false);
    }
  }

  async function selectMode(m: WidgetMode) {
    setMode(m);
    await api.patchMe({ settings: { ...(user?.settings ?? {}), mode: m } } as any).catch(() => {});
  }

  async function enablePush() {
    const ok = await requestPushPermission();
    if (!ok) {
      setPushStatus('denied');
      return;
    }
    const subbed = await subscribeToPush();
    setPushStatus(subbed ? 'granted' : 'denied');
  }

  function logout() {
    if (!confirm('Đăng xuất khỏi SOL trên thiết bị này?')) return;
    localStorage.removeItem('sol_token');
    reset();
  }

  const currentMode: WidgetMode = (user?.settings?.mode as WidgetMode) ?? 'normal';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <Section title="Chế độ" icon="🔔" hint="Bình thường · Bận · Thì thầm · Yên">
        <div className="grid grid-cols-2 gap-2">
          {(['normal', 'busy', 'whisper', 'calm'] as WidgetMode[]).map((m) => (
            <button
              key={m}
              onClick={() => selectMode(m)}
              className={`py-2 rounded-xl border text-sm ${
                currentMode === m ? 'bg-sol-green text-white border-sol-green' : 'bg-white border-black/10'
              }`}
            >
              {labelMode(m)}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-sol-ink/60 mt-2">
          {currentMode === 'normal' && 'Nhận mọi thông báo theo lộ trình.'}
          {currentMode === 'busy' && 'Chỉ nhắc check-in sáng/tối và khi có nguy cơ cao.'}
          {currentMode === 'whisper' && 'Không âm thanh, chỉ badge.'}
          {currentMode === 'calm' && 'Tạm hoãn 24 giờ (trừ SOS).'}
        </p>
      </Section>

      <Section title="Cách xưng hô" icon="💬" defaultOpen hint="Sol gọi bạn · Tên trợ lý">
        <div className="space-y-3">
          {/* Q1 */}
          <div>
            <div className="text-[11px] text-sol-ink/60 mb-1">Bạn muốn Sol xưng hô là gì?</div>
            <div className="grid grid-cols-3 gap-2">
              {PRONOUN_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPronoun(p)}
                  className={`py-1.5 rounded-lg border text-sm font-medium transition ${
                    pronoun === p
                      ? 'bg-sol-green text-white border-sol-green'
                      : 'bg-white text-sol-ink border-black/10'
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
              className={`mt-2 w-full py-1.5 rounded-lg border text-sm font-medium transition ${
                isPronounCustom
                  ? 'bg-sol-green text-white border-sol-green'
                  : 'bg-white text-sol-ink/70 border-black/10 border-dashed'
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
                className="mt-2 w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm"
              />
            )}
          </div>

          {/* Q2 */}
          <div>
            <div className="text-[11px] text-sol-ink/60 mb-1">Bạn muốn gọi trợ lý của Sol là gì?</div>
            <div className="grid grid-cols-1 gap-2">
              {ASSISTANT_PRESETS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAssistant(a)}
                  className={`py-1.5 rounded-lg border text-sm font-medium transition ${
                    assistant === a
                      ? 'bg-sol-green text-white border-sol-green'
                      : 'bg-white text-sol-ink border-black/10'
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
              className={`mt-2 w-full py-1.5 rounded-lg border text-sm font-medium transition ${
                isAssistantCustom
                  ? 'bg-sol-green text-white border-sol-green'
                  : 'bg-white text-sol-ink/70 border-black/10 border-dashed'
              }`}
            >
              {isAssistantCustom ? 'Tuỳ chỉnh ↓' : '✏️ Tuỳ chỉnh (Sol Vợ yêu…)'}
            </button>
            {isAssistantCustom && (
              <input
                placeholder="Sol Vợ yêu / Sol Sếp…"
                value={assistantCustom}
                onChange={(e) => setAssistantCustom(e.target.value.slice(0, ASSISTANT_MAX))}
                maxLength={ASSISTANT_MAX}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm"
              />
            )}
          </div>

          {/* Preview */}
          <div className="mt-1 p-3 rounded-xl bg-sol-bg border border-black/5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-[10px] uppercase tracking-wider text-sol-ink/50">
                Sol sẽ nói chuyện kiểu này
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-sol-green/10 text-sol-green text-[10px] font-semibold">
                {namePreview.signature}
              </span>
            </div>
            <PreviewBubble label="🌅" text={namePreview.morning} />
            <PreviewBubble label="💬" text={namePreview.chatGreeting} />
            <PreviewBubble label="🆘" text={namePreview.craving} />
          </div>

          <button
            onClick={saveNames}
            disabled={savingNames}
            className="w-full py-1.5 rounded-lg bg-sol-green text-white text-sm font-semibold disabled:opacity-50"
          >
            {savingNames ? 'Đang lưu…' : 'Lưu cách xưng hô'}
          </button>
          {namesMsg && <div className="text-[11px] text-sol-green text-center">{namesMsg}</div>}
        </div>
      </Section>

      <Section title="Khung giờ yên tĩnh" icon="🌙" hint="Khi nào Sol không nhắn">
        <div className="flex items-center gap-2">
          <Field label="Bắt đầu">
            <input
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm"
            />
          </Field>
          <Field label="Kết thúc">
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm"
            />
          </Field>
        </div>
        <button
          onClick={saveQuiet}
          disabled={saving}
          className="mt-2 w-full py-1.5 rounded-lg bg-sol-green text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Đang lưu…' : 'Lưu khung giờ'}
        </button>
      </Section>

      <Section title="Hồ sơ cai thuốc" icon="🚭" hint="Tuổi · Số năm · Lý do · Tác nhân">
        <p className="text-[11px] text-sol-ink/60 -mt-1 mb-2">
          Để Sol nhắc lại đúng "câu" của bạn lúc thèm.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Field label="Tuổi">
              <input
                type="number"
                inputMode="numeric"
                min={18}
                max={120}
                placeholder="52"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm tabular-nums"
              />
            </Field>
            <Field label="Hút bao nhiêu năm">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={90}
                placeholder="25"
                value={yearsSmoked}
                onChange={(e) => setYearsSmoked(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm tabular-nums"
              />
            </Field>
          </div>

          {/* Lý do bỏ */}
          <div>
            <div className="text-[11px] text-sol-ink/60 mb-1">
              Lý do bỏ thuốc (tối đa {PROFILE_SELECT_LIMIT})
            </div>
            <div className="flex flex-wrap gap-1">
              {REASON_PRESETS.map((r) => {
                const selected = quitReasons.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleQuitReason(r)}
                    className={`text-[12px] px-2 py-1 rounded-full border transition ${
                      selected
                        ? 'bg-sol-green-soft border-sol-green ring-1 ring-sol-green/40 text-sol-green-ink font-semibold'
                        : 'bg-white border-black/10 text-sol-ink/80'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {quitReasons.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {quitReasons.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-sol-green/10 text-sol-green-ink border border-sol-green/30"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => setQuitReasons(quitReasons.filter((x) => x !== r))}
                      className="text-sol-green-ink/70"
                      aria-label={`Bỏ ${r}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {quitReasons.length < PROFILE_SELECT_LIMIT && (
              <div className="mt-2 flex gap-1">
                <input
                  placeholder='Lý do riêng (vd: "vì cu Tí")'
                  value={reasonCustom}
                  onChange={(e) => setReasonCustom(e.target.value.slice(0, REASON_MAX))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addReasonCustom();
                    }
                  }}
                  maxLength={REASON_MAX}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm"
                />
                <button
                  type="button"
                  onClick={addReasonCustom}
                  disabled={!reasonCustom.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-sol-green text-white text-sm font-medium disabled:opacity-40"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Trigger thèm */}
          <div>
            <div className="text-[11px] text-sol-ink/60 mb-1">
              Lúc nào hay thèm nhất (tối đa {PROFILE_SELECT_LIMIT})
            </div>
            <div className="flex flex-wrap gap-1">
              {TRIGGER_PRESETS.map((tr) => {
                const selected = topTriggers.includes(tr);
                return (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => toggleTrigger(tr)}
                    className={`text-[12px] px-2 py-1 rounded-full border transition ${
                      selected
                        ? 'bg-sol-orange-soft border-sol-orange ring-1 ring-sol-orange/40 text-sol-orange-ink font-semibold'
                        : 'bg-white border-black/10 text-sol-ink/80'
                    }`}
                  >
                    {tr}
                  </button>
                );
              })}
            </div>
            {topTriggers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {topTriggers.map((tr) => (
                  <span
                    key={tr}
                    className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-sol-orange/10 text-sol-orange-ink border border-sol-orange/30"
                  >
                    {tr}
                    <button
                      type="button"
                      onClick={() => setTopTriggers(topTriggers.filter((x) => x !== tr))}
                      className="text-sol-orange-ink/70"
                      aria-label={`Bỏ ${tr}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {topTriggers.length < PROFILE_SELECT_LIMIT && (
              <div className="mt-2 flex gap-1">
                <input
                  placeholder="Trigger riêng (vd: lúc đi câu)"
                  value={triggerCustom}
                  onChange={(e) => setTriggerCustom(e.target.value.slice(0, TRIGGER_MAX))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTriggerCustom();
                    }
                  }}
                  maxLength={TRIGGER_MAX}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm"
                />
                <button
                  type="button"
                  onClick={addTriggerCustom}
                  disabled={!triggerCustom.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-sol-orange text-white text-sm font-medium disabled:opacity-40"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="w-full py-1.5 rounded-lg bg-sol-green text-white text-sm font-semibold disabled:opacity-50"
          >
            {savingProfile ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </button>
          {profileMsg && (
            <div
              className={`text-[11px] text-center ${
                profileMsg.startsWith('✓') ? 'text-sol-green' : 'text-sol-red'
              }`}
            >
              {profileMsg}
            </div>
          )}
        </div>
      </Section>

      <Section title="Thói quen hút thuốc" icon="🚬" hint="Số điếu/ngày · Giá điếu">
        <div className="flex items-center gap-2">
          <Field label="Điếu / ngày">
            <input
              type="number"
              min={1}
              max={100}
              value={cigsPerDay}
              onChange={(e) => setCigsPerDay(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm tabular-nums"
            />
          </Field>
          <Field label="Giá / điếu (đ)">
            <input
              type="number"
              min={0}
              max={20000}
              step={100}
              value={pricePerCig}
              onChange={(e) => setPricePerCig(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-2 py-1.5 rounded-lg border border-black/10 bg-white text-sm tabular-nums"
            />
          </Field>
        </div>
        <div className="text-[11px] text-sol-ink/60 mt-2">
          ≈ {(cigsPerDay * pricePerCig).toLocaleString('vi-VN')}đ/ngày · {(cigsPerDay * pricePerCig * 30).toLocaleString('vi-VN')}đ/tháng
        </div>
        <button
          onClick={saveCost}
          disabled={savingCost}
          className="mt-2 w-full py-1.5 rounded-lg bg-sol-green text-white text-sm font-semibold disabled:opacity-50"
        >
          {savingCost ? 'Đang lưu…' : 'Lưu'}
        </button>
      </Section>

      <Section title="Bảng điều khiển tin nhắn" icon="🔔" hint="Cường độ · giờ nhận · thói quen ngày" defaultOpen>
        <NotificationPrefsPanel />
      </Section>

      <Section title="Thông báo đẩy (Push)" icon="📲" hint="Bật/tắt thông báo trình duyệt">
        {pushStatus === 'unsupported' && (
          <div className="text-sm text-sol-ink/60">Trình duyệt không hỗ trợ Push.</div>
        )}
        {pushStatus === 'granted' && (
          <div className="text-sm text-sol-green">✓ Đã bật Push trên thiết bị này.</div>
        )}
        {pushStatus === 'denied' && (
          <div className="text-sm text-sol-red">Bị chặn. Vào cài đặt trình duyệt để mở lại.</div>
        )}
        {pushStatus === 'unknown' && (
          <button
            onClick={enablePush}
            className="w-full py-2 rounded-lg bg-sol-blue text-white text-sm font-semibold"
          >
            Bật thông báo
          </button>
        )}
      </Section>

      <Section title="Tài khoản" icon="👤" defaultOpen hint="Tên · Liên kết Zalo · Đăng xuất">
        <div className="bg-sol-paper border border-sol-line rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-sol-green text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {(user?.name?.[0] ?? 'S').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-sol-ink truncate">
                {user?.name ?? '—'}
              </div>
              {user?.phone ? (
                <div className="text-[11px] text-sol-ink/70 font-mono mt-0.5">
                  📱 {user.phone}
                </div>
              ) : (
                <div className="text-[11px] text-sol-ink/55 mt-0.5">
                  Tài khoản chưa liên kết — hành trình chỉ ở thiết bị này
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Liên kết identity — chỉ hiện cho user ẩn danh (chưa có phone) */}
        {!user?.phone && (
          <div className="space-y-2 mb-2">
            <button
              onClick={async () => {
                try {
                  const { url } = await api.zaloInit();
                  window.location.href = url;
                } catch (err: any) {
                  alert('Liên kết Zalo chưa khả dụng. Khang đang setup. Thử SĐT.');
                }
              }}
              className="w-full py-2 rounded-lg bg-[#0068FF] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <span>💬</span>
              <span>Liên kết Zalo (khuyến nghị)</span>
            </button>
            <button
              onClick={() => setShowBindPhone(true)}
              className="w-full py-2 rounded-lg border border-sol-line bg-white text-sol-ink text-sm font-medium flex items-center justify-center gap-2 hover:border-sol-green/40 transition"
            >
              <span>📱</span>
              <span>Liên kết SĐT (nếu không có Zalo)</span>
            </button>
            <p className="text-[10px] text-sol-ink/45 leading-relaxed text-center">
              Liên kết để bảo vệ hành trình nếu mất máy. Sol không
              spam — chỉ recovery + voice Khang.
            </p>
            {/* Layer 3 entry — user mất Zalo + SĐT có thể recover ngay từ đây */}
            <button
              onClick={() => setShowRecover(true)}
              className="w-full py-1.5 text-xs text-sol-ink/55 hover:text-sol-ink underline"
            >
              🔑 Tôi đã có mã khôi phục →
            </button>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full py-1.5 rounded-lg border border-sol-red text-sol-red text-sm"
        >
          Đăng xuất
        </button>
      </Section>

      <div className="text-[10px] text-center text-sol-ink/40 pt-2">SOL Companion · bothuocla.sol.vn</div>

      {showBindPhone && (
        <BindPhoneModal onClose={() => setShowBindPhone(false)} />
      )}
      {showRecover && <RecoverView onClose={() => setShowRecover(false)} />}
    </div>
  );
}

function labelMode(m: WidgetMode) {
  return m === 'normal' ? 'Bình thường' : m === 'busy' ? 'Bận' : m === 'whisper' ? 'Thì thầm' : 'Tạm hoãn';
}
/**
 * Widget Settings v2: collapsible accordion. Mặc định chỉ Account + Cách
 * xưng hô mở (frequent edits), còn lại đóng — tránh scroll fatigue trong
 * widget bubble cao 620px.
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
      className="bg-white rounded-2xl border border-black/5 group overflow-hidden"
    >
      <summary className="cursor-pointer p-3.5 flex items-center justify-between gap-2 hover:bg-sol-bg/40 transition select-none">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-base flex-shrink-0">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-sol-ink/50">
              {title}
            </div>
            {hint && (
              <div className="text-[10px] text-sol-ink/45 mt-0.5 truncate">{hint}</div>
            )}
          </div>
        </div>
        <svg
          className="w-3.5 h-3.5 text-sol-ink/40 transition-transform group-open:rotate-180 flex-shrink-0"
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
      <div className="px-4 pb-4 pt-0 border-t border-black/5">{children}</div>
    </details>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <div className="text-[11px] text-sol-ink/60 mb-0.5">{label}</div>
      {children}
    </div>
  );
}

function PreviewBubble({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <div className="w-5 shrink-0 text-sm pt-0.5 leading-none">{label}</div>
      <div className="flex-1 px-2.5 py-1.5 rounded-xl rounded-tl-sm bg-white border border-black/5 text-[12px] text-sol-ink leading-snug">
        {text}
      </div>
    </div>
  );
}
