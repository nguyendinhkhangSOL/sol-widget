// dashboard/src/components/PersonalizationModal.tsx
//
// Day 9 (2026-05-22): Modal mini hỏi xưng hô + tên Sol ngay sau FTND.
// Trước đây user mới có pronouns mặc định "bạn" + name "Khách XXXX" → Sol
// gọi rất impersonal. Modal này cá nhân hoá NGAY trước khi vào Result page.
//
// Logic:
//   - Skippable: nút "Để sau" → user vào Result với default
//   - Submit: PATCH /users/me { pronouns, assistantName, name? } → bootstrap()
//     refresh user store → caller mở Result với user đã set
//   - Skip option: link sang /settings để fill chi tiết hơn

import { useState } from 'react';
import { api, ApiError } from '../services/api';
import { useStore } from '../state/store';
import { useToast } from '../lib/toast';

const PRONOUN_PRESETS = ['anh', 'em', 'bạn', 'chị'] as const;
const ASSISTANT_PRESETS = ['Sol Đồng hành', 'Sol Phó tướng', 'Sol Trợ lý'] as const;

interface Props {
  open: boolean;
  onDone: () => void;
  onSkip: () => void;
}

export function PersonalizationModal({ open, onDone, onSkip }: Props) {
  const user = useStore((s) => s.user);
  const bootstrap = useStore((s) => s.bootstrap);
  const toast = useToast();

  // Default state — pre-fill từ user hiện tại hoặc preset đầu
  const [pronoun, setPronoun] = useState<string>(
    user?.pronouns && PRONOUN_PRESETS.includes(user.pronouns as any) ? user.pronouns : 'anh'
  );
  const [pronounCustom, setPronounCustom] = useState('');
  const [assistant, setAssistant] = useState<string>(
    user?.assistantName && ASSISTANT_PRESETS.includes(user.assistantName as any)
      ? user.assistantName
      : 'Sol Đồng hành'
  );
  const [assistantCustom, setAssistantCustom] = useState('');
  const [name, setName] = useState(user?.name && !user.name.startsWith('Khách') ? user.name : '');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const pronounFinal = pronoun === '__custom' ? pronounCustom.trim() : pronoun;
  const assistantFinal = assistant === '__custom' ? assistantCustom.trim() : assistant;

  function valid(): boolean {
    if (!pronounFinal || pronounFinal.length > 8) return false;
    if (!assistantFinal || assistantFinal.length > 24) return false;
    return true;
  }

  async function save() {
    if (!valid() || saving) return;
    setSaving(true);
    try {
      const patch: any = {
        pronouns: pronounFinal,
        assistantName: assistantFinal,
      };
      if (name.trim() && name.trim() !== user?.name) {
        patch.name = name.trim().slice(0, 80);
      }
      await api.patchMe(patch);
      await bootstrap();
      toast.success(`Sol sẽ gọi ${pronounFinal} từ giờ`, '✓');
      onDone();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `Lỗi ${err.status}`
          : 'Không lưu được — kiểm tra mạng?';
      toast.error(msg, '⚠️');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-title"
    >
      <div className="bg-sol-paper rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl animate-[toastIn_220ms_ease-out]">
        {/* Header */}
        <div className="p-5 border-b border-sol-line">
          <h2 id="persona-title" className="text-h2 font-bold text-sol-ink">
            👋 Sol cần biết cách xưng hô với {pronounFinal || 'bạn'}
          </h2>
          <p className="text-meta text-sol-ink-3 mt-1">
            2 câu nhanh để Sol cá nhân hoá đúng. Có thể đổi sau ở Cài đặt.
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* ─── Q1: Pronouns ─── */}
          <div>
            <label className="block text-body font-semibold text-sol-ink mb-2">
              Sol nên gọi {pronounFinal || 'bạn'} là gì?
            </label>
            <div className="flex flex-wrap gap-2">
              {PRONOUN_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPronoun(p)}
                  className={`min-h-tap px-4 py-2 rounded-xl border-2 text-body font-medium transition ${
                    pronoun === p
                      ? 'border-sol-green bg-sol-green-soft text-sol-green-ink'
                      : 'border-sol-line bg-sol-paper text-sol-ink-2 hover:border-sol-green/50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPronoun('__custom')}
                className={`min-h-tap px-4 py-2 rounded-xl border-2 text-body font-medium transition ${
                  pronoun === '__custom'
                    ? 'border-sol-green bg-sol-green-soft text-sol-green-ink'
                    : 'border-sol-line bg-sol-paper text-sol-ink-2 hover:border-sol-green/50'
                }`}
              >
                Khác…
              </button>
            </div>
            {pronoun === '__custom' && (
              <input
                type="text"
                value={pronounCustom}
                onChange={(e) => setPronounCustom(e.target.value)}
                placeholder="Vd: Ngài / Đại ca / Sếp / Anh hai…"
                maxLength={8}
                className="mt-2 w-full min-h-tap px-3 py-2 border border-sol-line rounded-xl text-body focus:border-sol-green focus:outline-none"
                autoFocus
              />
            )}
            <p className="text-meta text-sol-ink-3 mt-1">≤ 8 ký tự</p>
          </div>

          {/* ─── Q2: Assistant name ─── */}
          <div>
            <label className="block text-body font-semibold text-sol-ink mb-2">
              {pronounFinal && pronounFinal.charAt(0).toUpperCase() + pronounFinal.slice(1)} muốn Sol có tên gì?
            </label>
            <div className="flex flex-wrap gap-2">
              {ASSISTANT_PRESETS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAssistant(a)}
                  className={`min-h-tap px-3 py-2 rounded-xl border-2 text-meta font-medium transition ${
                    assistant === a
                      ? 'border-sol-green bg-sol-green-soft text-sol-green-ink'
                      : 'border-sol-line bg-sol-paper text-sol-ink-2 hover:border-sol-green/50'
                  }`}
                >
                  {a}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAssistant('__custom')}
                className={`min-h-tap px-3 py-2 rounded-xl border-2 text-meta font-medium transition ${
                  assistant === '__custom'
                    ? 'border-sol-green bg-sol-green-soft text-sol-green-ink'
                    : 'border-sol-line bg-sol-paper text-sol-ink-2 hover:border-sol-green/50'
                }`}
              >
                Khác…
              </button>
            </div>
            {assistant === '__custom' && (
              <input
                type="text"
                value={assistantCustom}
                onChange={(e) => setAssistantCustom(e.target.value)}
                placeholder="Vd: Sol Vợ Yêu / Sol Hai / Em Sol…"
                maxLength={24}
                className="mt-2 w-full min-h-tap px-3 py-2 border border-sol-line rounded-xl text-body focus:border-sol-green focus:outline-none"
                autoFocus
              />
            )}
            <p className="text-meta text-sol-ink-3 mt-1">≤ 24 ký tự</p>
          </div>

          {/* ─── Q3 (optional): Real name ─── */}
          <div>
            <label className="block text-body font-semibold text-sol-ink mb-2">
              Tên / biệt danh của {pronounFinal || 'bạn'}?{' '}
              <span className="text-meta text-sol-ink-3 font-normal">(không bắt buộc)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vd: Khang, Tuấn, Anh Hai…"
              maxLength={80}
              className="w-full min-h-tap px-3 py-2 border border-sol-line rounded-xl text-body focus:border-sol-green focus:outline-none"
            />
            <p className="text-meta text-sol-ink-3 mt-1">
              Để trống nếu muốn ẩn danh — Sol vẫn gọi {pronounFinal || 'bạn'} bình thường.
            </p>
          </div>

          {/* ─── Preview ─── */}
          <div className="bg-sol-green-soft/40 border-l-4 border-sol-green rounded-r-lg p-3">
            <p className="text-meta text-sol-green-ink font-semibold uppercase tracking-wide mb-1">
              Sol sẽ nói thế này:
            </p>
            <p className="text-body text-sol-ink italic">
              "Chào {pronounFinal || 'bạn'}{name.trim() ? ` ${name.trim()}` : ''},{' '}
              {assistantFinal || 'Sol Đồng hành'} đây. {pronounFinal && pronounFinal.charAt(0).toUpperCase() + pronounFinal.slice(1)} ổn không?"
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-sol-paper border-t border-sol-line p-4 space-y-2">
          <button
            onClick={save}
            disabled={!valid() || saving}
            className="sol-btn-primary w-full min-h-tap text-body font-bold disabled:opacity-60"
          >
            {saving ? 'Đang lưu…' : '✓ Lưu và xem kết quả →'}
          </button>
          <button
            onClick={onSkip}
            disabled={saving}
            className="w-full min-h-tap text-meta text-sol-ink-3 hover:text-sol-ink"
          >
            Để sau, vào Cài đặt chỉnh chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
