// frontend/src/components/BindPhoneModal.tsx
//
// Modal 2-step để user ẩn danh bind SĐT — fallback khi Zalo bị sập hoặc
// user không dùng Zalo. Trong DEV mode (OTP_DEV_MODE=true backend), OTP
// được log ra console backend thay vì gửi SMS — Khang xem terminal copy.

import { useState } from 'react';
import { api, ApiError } from '../services/api';
import { useStore } from '../state/store';
import { RecoveryCodeModal } from './RecoveryCodeModal';
import { RecoverView } from './RecoverView';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function BindPhoneModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Layer 3: nếu bind lần đầu → backend trả recoveryCode → hiện modal force save
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showRecover, setShowRecover] = useState(false);
  const init = useStore((s) => s.init);
  const setUser = useStore((s) => s.setUser);

  async function requestOtp() {
    setLoading(true);
    setErr(null);
    try {
      await api.bindPhoneRequest(phone.trim());
      setStep('otp');
    } catch (e: any) {
      const msg =
        e instanceof ApiError && e.body?.error === 'invalid_phone'
          ? 'SĐT không hợp lệ — kiểm tra lại.'
          : 'Không gửi được mã. Thử lại sau.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setErr(null);
    try {
      const result = await api.bindPhoneVerify(phone.trim(), code.trim());
      // Replace JWT cũ bằng token mới (sau khi merge)
      localStorage.setItem('sol_token', result.token);
      init(result.token);
      // Reload user info — phone giờ đã set, isAnonymous=false
      const me = await api.getMe();
      setUser(me);
      onSuccess?.();
      // Nếu vừa sinh mã khôi phục → chuyển sang hiện modal mã (giữ modal mở)
      if (result.recoveryCode) {
        setRecoveryCode(result.recoveryCode);
        return; // KHÔNG đóng modal — sẽ render RecoveryCodeModal
      }
      onClose();
    } catch (e: any) {
      const reason = e instanceof ApiError ? e.body?.error : null;
      const msg =
        reason === 'otp_mismatch'
          ? 'Mã không đúng. Kiểm tra lại.'
          : reason === 'otp_expired_or_missing'
            ? 'Mã đã hết hạn. Bấm "Đổi số" để gửi lại.'
            : 'Có lỗi. Thử lại.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  // Sau khi bind success + có recoveryCode → hiện RecoveryCodeModal
  if (recoveryCode) {
    return (
      <RecoveryCodeModal
        code={recoveryCode}
        onClose={() => {
          setRecoveryCode(null);
          onClose();
        }}
      />
    );
  }

  // User bấm "Mất tất cả?" — chuyển sang RecoverView
  if (showRecover) {
    return <RecoverView onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-4 py-3 bg-sol-green text-white flex items-center justify-between">
          <div className="text-sm font-semibold">Liên kết số điện thoại</div>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded-full hover:bg-white/15 flex items-center justify-center"
            aria-label="Đóng"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'phone' ? (
            <>
              <div>
                <h3 className="text-base font-semibold text-sol-ink">
                  Nhập số điện thoại
                </h3>
                <p className="text-sm text-sol-ink/70 mt-1">
                  Sol gửi mã 6 chữ số qua SMS. Liên kết để bảo vệ hành trình
                  nếu mất máy.
                </p>
              </div>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+84 9xx xxx xxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-sol-line bg-white focus:outline-none focus:ring-2 focus:ring-sol-green text-base"
              />
              <button
                disabled={loading || phone.length < 9}
                onClick={requestOtp}
                className="w-full py-2.5 rounded-xl bg-sol-green text-white font-semibold disabled:opacity-50"
              >
                {loading ? 'Đang gửi…' : 'Gửi mã OTP'}
              </button>
              {/* Layer 3: link recover */}
              <button
                onClick={() => setShowRecover(true)}
                className="w-full py-1 text-xs text-sol-ink/55 hover:text-sol-ink underline"
              >
                Mất Zalo + SĐT? Dùng mã khôi phục →
              </button>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-base font-semibold text-sol-ink">
                  Nhập mã 6 chữ số
                </h3>
                <p className="text-sm text-sol-ink/70 mt-1">
                  Đã gửi tới <span className="font-semibold">{phone}</span>.
                </p>
              </div>
              <input
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2.5 rounded-xl border border-sol-line bg-white tracking-[0.5em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-sol-green"
              />
              <button
                disabled={loading || code.length !== 6}
                onClick={verifyOtp}
                className="w-full py-2.5 rounded-xl bg-sol-green text-white font-semibold disabled:opacity-50"
              >
                {loading ? 'Đang xác thực…' : 'Xác nhận'}
              </button>
              <button
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setErr(null);
                }}
                className="w-full py-1 text-sm text-sol-ink/60 hover:text-sol-ink"
              >
                Đổi số khác
              </button>
            </>
          )}
          {err && (
            <div className="p-2 rounded-lg bg-sol-red/10 text-sol-red text-sm">
              {err}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
