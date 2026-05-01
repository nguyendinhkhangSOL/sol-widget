// frontend/src/components/AuthGate.tsx
//
// Phone + OTP login. Onboarding tối giản — KHÔNG hỏi pronoun custom +
// assistantName custom lúc lần đầu. Chỉ:
//   1. Phone → OTP
//   2. OTP + Tên + Pronoun (3 button anh/chị/em — không custom)
//
// Lý do (UX v2): user 45+ Việt drop-off cao khi onboarding > 3 fields.
// AssistantName + custom pronoun chuyển vào Settings — user nào quan tâm
// thì tự đổi sau. Default: pronoun = 'bạn' (nếu không chọn), assistantName = 'Sol'.

import { useState } from 'react';
import { useStore } from '../state/store';
import { api } from '../services/api';

const PRONOUN_OPTIONS = [
  { value: 'anh', label: 'Anh' },
  { value: 'chị', label: 'Chị' },
  { value: 'em', label: 'Em' },
] as const;

export function AuthGate() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pronoun, setPronoun] = useState<string>('anh');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const init = useStore((s) => s.init);
  const setExpanded = useStore((s) => s.setExpanded);

  async function requestOtp() {
    setLoading(true);
    setErr(null);
    try {
      await api.requestOtp(phone.trim());
      setStep('otp');
    } catch (e: any) {
      setErr(e?.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setErr(null);
    try {
      const { token } = await api.verifyOtp(phone.trim(), code.trim(), {
        name: name.trim() || undefined,
        pronouns: pronoun,
        // assistantName: KHÔNG gửi — backend dùng default 'Sol Đồng hành'
      });
      localStorage.setItem('sol_token', token);
      init(token);
    } catch (e: any) {
      setErr(e?.message ?? 'Mã chưa đúng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Đăng nhập SOL"
      className="w-[380px] h-[520px] max-w-[96vw] bg-sol-bg rounded-2xl shadow-widget overflow-hidden flex flex-col animate-slide-up border border-black/5"
    >
      <div className="px-4 py-3 bg-sol-green text-white flex items-center justify-between">
        <div className="text-sm font-semibold">Bắt đầu cùng SOL</div>
        <button
          aria-label="Đóng"
          onClick={() => setExpanded(false)}
          className="h-7 w-7 rounded-full hover:bg-white/10 flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-sol-ink">
                Nhập số điện thoại
              </h3>
              <p className="text-sm text-sol-ink/70 mt-1">
                Chúng tôi sẽ gửi mã 6 chữ số qua SMS.
              </p>
            </div>
            <input
              type="tel"
              placeholder="+84 9xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-sol-line bg-white text-base focus:outline-none focus:ring-2 focus:ring-sol-green"
            />
            <button
              disabled={loading || phone.length < 9}
              onClick={requestOtp}
              className="w-full py-2.5 rounded-xl bg-sol-green text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Đang gửi…' : 'Gửi mã OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-sol-ink">
                Nhập mã OTP + tên
              </h3>
              <p className="text-sm text-sol-ink/70 mt-1">
                Mã 6 chữ số đã gửi tới {phone}.
              </p>
            </div>

            {/* Mã OTP */}
            <input
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-xl border border-sol-line bg-white tracking-[0.5em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-sol-green"
            />

            {/* Tên — không bắt buộc, để trống Sol tự đặt "Soler XXXX" */}
            <div>
              <label className="block text-xs text-sol-ink/70 mb-1">
                Tên gọi của bạn (không bắt buộc)
              </label>
              <input
                placeholder={`Để trống → Sol đặt "Soler ${phone.slice(-4) || 'XXXX'}"`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-sol-line bg-white focus:outline-none focus:ring-2 focus:ring-sol-green"
              />
              <p className="text-[11px] text-sol-ink/50 mt-1">
                Đổi trong Cài đặt sau nếu muốn.
              </p>
            </div>

            {/* Pronoun — 3 button đơn giản, không custom */}
            <div>
              <label className="block text-xs text-sol-ink/70 mb-1.5">
                Sol xưng hô là:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRONOUN_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPronoun(p.value)}
                    className={`py-2 rounded-lg border text-sm font-medium transition ${
                      pronoun === p.value
                        ? 'bg-sol-green text-white border-sol-green'
                        : 'bg-white text-sol-ink border-sol-line hover:border-sol-green/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-sol-ink/50 mt-1.5">
                Đổi trong Cài đặt sau nếu muốn.
              </p>
            </div>

            <button
              disabled={loading || code.length !== 6}
              onClick={verifyOtp}
              className="w-full py-2.5 rounded-xl bg-sol-green text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Đang xác thực…' : 'Vào SOL'}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="w-full py-1 text-sm text-sol-ink/60 hover:text-sol-ink"
            >
              Đổi số khác
            </button>
          </div>
        )}
        {err && <div className="mt-3 p-2 rounded bg-sol-red/10 text-sol-red text-sm">{err}</div>}
      </div>
    </div>
  );
}
