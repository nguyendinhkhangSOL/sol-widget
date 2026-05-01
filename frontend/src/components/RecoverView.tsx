// frontend/src/components/RecoverView.tsx
//
// View để user nhập mã khôi phục khi mất Zalo + SĐT. Sau khi recover thành
// công, backend cấp JWT mới + sinh recovery code mới (force user save lại).
//
// Trigger: từ BindPhoneModal (link "Mất tất cả?") hoặc từ Settings → "Khôi phục".

import { useState } from 'react';
import { api, ApiError } from '../services/api';
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
  const init = useStore((s) => s.init);
  const setUser = useStore((s) => s.setUser);

  async function recover() {
    setLoading(true);
    setErr(null);
    try {
      const { token, recoveryCode } = await api.recover(code.trim());
      localStorage.setItem('sol_token', token);
      init(token);
      const me = await api.getMe();
      setUser(me);
      // Hiện modal mã mới — user phải save lại
      setNewCode(recoveryCode);
    } catch (e: any) {
      const reason = e instanceof ApiError ? e.body?.error : null;
      setErr(
        reason === 'invalid_recovery_code'
          ? 'Mã không đúng. Kiểm tra lại từng ký tự (chú ý chữ vs số).'
          : 'Có lỗi. Thử lại sau.',
      );
    } finally {
      setLoading(false);
    }
  }

  // Sau khi recover xong, hiện modal mã mới rồi đóng RecoverView
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
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-4 py-3 bg-sol-ink text-white flex items-center justify-between">
          <div className="text-sm font-semibold">🔑 Khôi phục bằng mã</div>
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
          <p className="text-sm text-sol-ink/75 leading-relaxed">
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
            className="w-full px-3 py-3 rounded-xl border border-sol-line bg-white font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-sol-orange"
          />
          <button
            disabled={loading || code.length < 8}
            onClick={recover}
            className="w-full py-2.5 rounded-xl bg-sol-orange text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Đang khôi phục…' : 'Khôi phục hành trình →'}
          </button>
          {err && (
            <div className="p-2 rounded-lg bg-sol-red/10 text-sol-red text-sm">
              {err}
            </div>
          )}
          <div className="text-[11px] text-sol-ink/50 leading-relaxed pt-2 border-t border-sol-line">
            Không có mã? Liên hệ Khang qua Zalo OA "Sol Official" — admin
            verify identity manual và cấp lại quyền truy cập (mất 24h).
          </div>
        </div>
      </div>
    </div>
  );
}
