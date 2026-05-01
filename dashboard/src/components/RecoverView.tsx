// dashboard/src/components/RecoverView.tsx
// Form nhập mã khôi phục (Layer 3) khi user mất Zalo + SĐT.

import { useState } from 'react';
import { api, ApiError, setToken } from '../services/api';
import { useStore } from '../state/store';
import { RecoveryCodeModal } from './RecoveryCodeModal';

interface Props {
  onClose: () => void;
}

export function RecoverView({ onClose }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const bootstrap = useStore((s) => s.bootstrap);

  async function recover() {
    setLoading(true);
    setErr(null);
    try {
      const { token, recoveryCode } = await api.recover(code.trim());
      setToken(token);
      await bootstrap();
      setNewCode(recoveryCode);
    } catch (e: any) {
      const reason = e instanceof ApiError ? e.body?.error : null;
      setErr(
        reason === 'invalid_recovery_code'
          ? 'Mã không đúng. Kiểm tra lại từng ký tự.'
          : 'Có lỗi. Thử lại sau.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (newCode) {
    return (
      <RecoveryCodeModal
        code={newCode}
        onClose={() => {
          setNewCode(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md sol-card-padded">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3 font-bold text-sol-ink flex items-center gap-2">
            <span>🔑</span>
            <span>Khôi phục bằng mã</span>
          </h3>
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

        <p className="text-meta text-sol-ink-2 leading-relaxed mb-3">
          Nhập mã khôi phục bạn đã lưu khi liên kết Zalo/SĐT lần đầu.
          Mã có dạng <span className="font-mono">SOL-XXXX-XXXX-XXXX</span>.
        </p>

        <input
          type="text"
          inputMode="text"
          placeholder="SOL-7K2H-9P4M-X3Z8"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoComplete="off"
          spellCheck={false}
          className="sol-input font-mono tracking-wider text-center mb-3"
        />

        <button
          disabled={loading || code.length < 8}
          onClick={recover}
          className="sol-btn-primary sol-btn-lg w-full"
        >
          {loading ? 'Đang khôi phục…' : 'Khôi phục hành trình →'}
        </button>

        {err && <div className="sol-alert-danger mt-3 text-meta">{err}</div>}

        <div className="text-meta text-sol-ink-3 leading-relaxed pt-3 mt-4 border-t border-sol-line">
          Không có mã? Liên hệ Khang qua Zalo OA "Sol Official" — admin
          verify identity manual và cấp lại quyền truy cập (mất 24h).
        </div>
      </div>
    </div>
  );
}
