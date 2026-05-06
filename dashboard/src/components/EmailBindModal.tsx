// dashboard/src/components/EmailBindModal.tsx
// Mirror frontend/src/components/EmailBindModal.tsx — đồng bộ khi đổi.

import { useState } from 'react';
import { api, ApiError } from '../services/api';

export function EmailBindModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  async function submit() {
    if (!isValid() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await api.requestEmailLink(email.trim());
      if (r.ok) {
        setSent(true);
      }
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.body?.message ?? `Lỗi ${e.status}`
          : 'Không gửi được. Kiểm tra mạng rồi thử lại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-sol-bg rounded-2xl w-full max-w-md p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="text-5xl mb-3" aria-hidden="true">📧</div>
          <h3 className="text-h1 text-sol-ink font-semibold">Liên kết tài khoản qua email</h3>
        </div>

        {sent ? (
          <>
            <div className="bg-sol-green-soft/50 border border-sol-green/30 rounded-xl p-5 mb-5">
              <p className="text-body-lg text-sol-ink leading-relaxed">
                ✓ Sol đã gửi link đăng nhập tới <strong>{email}</strong>.
              </p>
              <p className="text-body text-sol-ink-2 mt-3 leading-relaxed">
                Kiểm tra hộp thư trong vòng 5 phút. Nếu không thấy, xem cả thư mục <strong>Spam/Quảng cáo</strong>.
              </p>
              <p className="text-meta text-sol-ink-3 mt-4 italic">
                Link có hiệu lực 1 giờ. Bấm vào link là tài khoản tự đồng bộ.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full min-h-tap py-3.5 rounded-xl bg-sol-green text-white font-semibold text-body-lg"
            >
              Đã hiểu
            </button>
          </>
        ) : (
          <>
            <p className="text-body text-sol-ink-2 leading-relaxed mb-5">
              Sol sẽ gửi link đăng nhập tới email của bạn. Bấm link 1 lần là đồng bộ tài khoản — không cần tạo mật khẩu.
            </p>

            <label className="text-body font-semibold text-sol-ink block mb-2">Email của bạn</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValid()) submit();
              }}
              placeholder="vd: tencua-ban@gmail.com"
              autoComplete="email"
              autoFocus
              className="w-full border border-sol-line rounded-xl px-4 py-3 text-body bg-sol-paper mb-4 focus:outline-none focus:ring-2 focus:ring-sol-green"
            />

            {error && (
              <div className="bg-sol-red-soft/60 border border-sol-red/30 rounded-lg p-3 mb-4 text-meta text-sol-red-ink">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 min-h-tap py-3 rounded-xl bg-sol-paper border border-sol-line text-sol-ink-2"
              >
                Huỷ
              </button>
              <button
                onClick={submit}
                disabled={!isValid() || submitting}
                className="flex-1 min-h-tap py-3 rounded-xl bg-sol-green text-white font-semibold disabled:opacity-50"
              >
                {submitting ? 'Đang gửi…' : 'Gửi link'}
              </button>
            </div>

            <p className="text-meta text-sol-ink-3 text-center mt-4 italic">
              Sol không gửi spam. Email chỉ dùng để đồng bộ + recovery khi mất máy.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
