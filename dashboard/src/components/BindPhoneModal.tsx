// dashboard/src/components/BindPhoneModal.tsx
// Modal 2-step bind SĐT cho user ẩn danh — dashboard version.
// DEV mode: OTP log ra console backend.

import { useState } from 'react';
import { api, ApiError, setToken } from '../services/api';
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
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showRecover, setShowRecover] = useState(false);
  const bootstrap = useStore((s) => s.bootstrap);

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
      setToken(result.token);
      await bootstrap();
      onSuccess?.();
      if (result.recoveryCode) {
        setRecoveryCode(result.recoveryCode);
        return; // KHÔNG đóng — sẽ render RecoveryCodeModal
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

  // Layer 3: hiện modal mã khôi phục sau bind success
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

  // User bấm "Mất tất cả?" → switch sang RecoverView
  if (showRecover) {
    return <RecoverView onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md sol-card-padded">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3 font-bold text-sol-ink">Liên kết số điện thoại</h3>
          <button
            onClick={onClose}
            className="text-sol-ink-3 hover:text-sol-ink"
            aria-label="Đóng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {step === 'phone' ? (
          <div className="space-y-3">
            <p className="text-meta text-sol-ink-2 leading-relaxed">
              Sol gửi mã 6 chữ số qua SMS. Liên kết để bảo vệ hành trình
              nếu mất máy.
            </p>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+84 9xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="sol-input"
            />
            <button
              disabled={loading || phone.length < 9}
              onClick={requestOtp}
              className="sol-btn-primary sol-btn-lg w-full"
            >
              {loading ? 'Đang gửi…' : 'Gửi mã OTP'}
            </button>
            <button
              onClick={() => setShowRecover(true)}
              className="w-full py-1 text-meta text-sol-ink-3 hover:text-sol-ink underline"
            >
              Mất Zalo + SĐT? Dùng mã khôi phục →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-meta text-sol-ink-2">
              Mã đã gửi tới <span className="font-semibold">{phone}</span>.
            </p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="sol-input tracking-[0.5em] text-center text-h2"
              placeholder="••••••"
            />
            <button
              disabled={loading || code.length !== 6}
              onClick={verifyOtp}
              className="sol-btn-primary sol-btn-lg w-full"
            >
              {loading ? 'Đang xác thực…' : 'Xác nhận'}
            </button>
            <button
              onClick={() => {
                setStep('phone');
                setCode('');
                setErr(null);
              }}
              className="sol-btn-ghost w-full"
            >
              Đổi số khác
            </button>
          </div>
        )}

        {err && <div className="sol-alert-danger mt-3 text-meta">{err}</div>}
      </div>
    </div>
  );
}
