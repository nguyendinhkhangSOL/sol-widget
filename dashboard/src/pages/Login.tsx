import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../services/api';
import { useStore } from '../state/store';

//
// Login — màn hình OTP đầu tiên user gặp.
// Sau khi nhập OTP, lần đầu sẽ hỏi:
//   1. Cách Sol gọi user (anh/chị/em + tuỳ chỉnh ≤ 8 ký tự)
//   2. Tên user dùng để gọi trợ lý AI (Sol Trợ lý/Phó tướng/Đồng hành + tuỳ chỉnh ≤ 24 ký tự)
//

const PRONOUN_PRESETS = ['anh', 'chị', 'em'] as const;
const ASSISTANT_PRESETS = ['Sol Trợ lý', 'Sol Phó tướng', 'Sol Đồng hành'] as const;
const PRONOUN_MAX = 8;
const ASSISTANT_MAX = 24;

export function Login() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  // Câu 1
  const [pronoun, setPronoun] = useState<string>('anh');
  const [pronounCustom, setPronounCustom] = useState('');
  const isPronounCustom = !PRONOUN_PRESETS.includes(pronoun as any);

  // Câu 2
  const [assistant, setAssistant] = useState<string>('Sol Đồng hành');
  const [assistantCustom, setAssistantCustom] = useState('');
  const isAssistantCustom = !ASSISTANT_PRESETS.includes(assistant as any);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const bootstrap = useStore((s) => s.bootstrap);

  async function requestOtp() {
    setLoading(true);
    setErr(null);
    try {
      await api.requestOtp(phone.trim());
      setStep('otp');
    } catch (e: any) {
      setErr(e?.message ?? 'Có lỗi');
    } finally {
      setLoading(false);
    }
  }

  function resolvePronoun(): string {
    return (isPronounCustom ? pronounCustom : pronoun).trim().slice(0, PRONOUN_MAX);
  }

  function resolveAssistant(): string {
    return (isAssistantCustom ? assistantCustom : assistant).trim().slice(0, ASSISTANT_MAX);
  }

  async function verifyOtp() {
    setLoading(true);
    setErr(null);
    try {
      const finalPronoun = resolvePronoun();
      const finalAssistant = resolveAssistant();
      if (isPronounCustom && !finalPronoun) {
        setErr('Hãy nhập cách bạn muốn Sol xưng hô (≤ 8 ký tự).');
        setLoading(false);
        return;
      }
      if (isAssistantCustom && !finalAssistant) {
        setErr('Hãy nhập tên cho trợ lý Sol (≤ 24 ký tự).');
        setLoading(false);
        return;
      }

      const { token } = await api.verifyOtp(phone.trim(), code.trim(), {
        name: name.trim() || undefined,
        pronouns: finalPronoun || undefined,
        assistantName: finalAssistant || undefined,
      });
      setToken(token);
      await bootstrap();
      nav('/', { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? 'Mã chưa đúng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-sol-bg">
      <div className="sol-card-padded w-full max-w-md">
        {/* Brand header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-sol-green text-white flex items-center justify-center font-bold text-body">
            SOL
          </div>
          <div className="min-w-0">
            <div className="text-h3 text-sol-ink">Sol — Đi cùng anh bỏ thuốc lá</div>
            <div className="text-meta text-sol-ink-2 truncate">
              Khang đi cùng anh 35 / 52 / 65 ngày — tuỳ Mức Lệ Thuộc
            </div>
          </div>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="sol-field-label">Số điện thoại</label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+84 9xx xxx xxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="sol-input"
              />
            </div>
            <button
              disabled={loading || phone.length < 9}
              onClick={requestOtp}
              className="sol-btn-primary sol-btn-lg w-full"
            >
              {loading ? 'Đang gửi…' : 'Gửi mã OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-body text-sol-ink-2">
              Nhập mã 6 chữ số đã gửi tới{' '}
              <span className="font-semibold text-sol-ink">{phone}</span>.
            </p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="sol-input tracking-[0.5em] text-center text-h2"
              placeholder="••••••"
            />

            <div className="pt-3 border-t border-sol-line space-y-5">
              <div className="text-meta text-sol-ink-2 -mb-1">
                Lần đầu? Sol cần thêm vài thông tin nhỏ:
              </div>

              {/* Tên — không bắt buộc, fallback "Soler XXXX" */}
              <div>
                <label className="sol-field-label">Tên gọi của bạn (không bắt buộc)</label>
                <input
                  placeholder={`Để trống → Sol đặt "Soler ${phone.slice(-4) || 'XXXX'}"`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="sol-input"
                />
                <p className="text-meta text-sol-ink-3 mt-1">
                  Đổi trong Cài đặt sau nếu muốn.
                </p>
              </div>

              {/* Câu 1 — pronouns */}
              <div>
                <label className="sol-field-label">
                  Bạn muốn Sol xưng hô là gì?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRONOUN_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPronoun(p)}
                      className={`min-h-tap rounded-lg border-2 text-body font-medium transition px-2 ${
                        pronoun === p
                          ? 'bg-sol-green text-white border-sol-green'
                          : 'bg-sol-paper text-sol-ink border-sol-line-strong hover:border-sol-green/40'
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
                  className={`mt-2 w-full min-h-tap rounded-lg border-2 text-body font-medium transition px-2 ${
                    isPronounCustom
                      ? 'bg-sol-green text-white border-sol-green'
                      : 'bg-sol-paper text-sol-ink-2 border-sol-line border-dashed hover:border-sol-green/40'
                  }`}
                >
                  {isPronounCustom ? 'Tuỳ chỉnh ↓' : '✏️ Tuỳ chỉnh (Ngài, Đại ca…)'}
                </button>
                {isPronounCustom && (
                  <input
                    autoFocus
                    placeholder="Ngài / Đại ca / Sếp…"
                    value={pronounCustom}
                    onChange={(e) => setPronounCustom(e.target.value.slice(0, PRONOUN_MAX))}
                    maxLength={PRONOUN_MAX}
                    className="sol-input mt-2"
                  />
                )}
              </div>

              {/* Câu 2 — assistantName */}
              <div>
                <label className="sol-field-label">
                  Bạn muốn gọi trợ lý của Sol là gì?
                </label>
                <p className="text-meta text-sol-ink-3 -mt-1 mb-2">
                  Tên này sẽ hiện trong tin nhắn hàng ngày của trợ lý.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ASSISTANT_PRESETS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAssistant(a)}
                      className={`min-h-tap rounded-lg border-2 text-body font-medium transition px-2 ${
                        assistant === a
                          ? 'bg-sol-green text-white border-sol-green'
                          : 'bg-sol-paper text-sol-ink border-sol-line-strong hover:border-sol-green/40'
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
                  className={`mt-2 w-full min-h-tap rounded-lg border-2 text-body font-medium transition px-2 ${
                    isAssistantCustom
                      ? 'bg-sol-green text-white border-sol-green'
                      : 'bg-sol-paper text-sol-ink-2 border-sol-line border-dashed hover:border-sol-green/40'
                  }`}
                >
                  {isAssistantCustom
                    ? 'Tuỳ chỉnh ↓'
                    : '✏️ Tuỳ chỉnh (Sol Vợ yêu, Sol Sếp…)'}
                </button>
                {isAssistantCustom && (
                  <input
                    autoFocus
                    placeholder="Sol Vợ yêu / Sol Sếp / Sol Đồng đội…"
                    value={assistantCustom}
                    onChange={(e) =>
                      setAssistantCustom(e.target.value.slice(0, ASSISTANT_MAX))
                    }
                    maxLength={ASSISTANT_MAX}
                    className="sol-input mt-2"
                  />
                )}
              </div>
            </div>

            <button
              disabled={loading || code.length !== 6}
              onClick={verifyOtp}
              className="sol-btn-primary sol-btn-lg w-full"
            >
              {loading ? 'Đang xác thực…' : 'Tiếp tục'}
            </button>
            <button onClick={() => setStep('phone')} className="sol-btn-ghost w-full">
              Đổi số khác
            </button>
          </div>
        )}
        {err && <div className="sol-alert-danger mt-4 text-meta">{err}</div>}
      </div>
    </div>
  );
}
