// admin/src/pages/AdminLogin.tsx
//
// Admin login — email magic link only.
// Khác dashboard Login: KHÔNG có phone OTP, KHÔNG có pronoun/assistant
// questions. Đơn giản 1 ô email → click link trong inbox.
//
// Backend endpoint: POST /auth/email/request { email, kind: 'admin' }
// AuthEmailCallback xử lý token verify.

import { useState } from 'react';
import { api } from '../services/api';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      // redirectTo = origin admin.sol.vn (prod) hoặc localhost:5176 (dev)
      // Backend whitelist + render link verify trỏ về đúng admin (không phải dashboard).
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      await api.requestEmailLink(email.trim().toLowerCase(), redirectTo);
      setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? 'Gửi mail thất bại. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-sol-bg">
      <div className="w-full max-w-md sol-card-padded">
        <header className="text-center mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-sol-earth text-white text-meta uppercase tracking-wider font-bold mb-3">
            Admin Console
          </div>
          <h1 className="text-h1 text-sol-ink">Quản trị SOL</h1>
          <p className="text-meta text-sol-ink-2 mt-2">
            Truy cập riêng cho admin · không phải user dashboard
          </p>
        </header>

        {sent ? (
          <div className="sol-alert-success text-center">
            <div className="text-2xl mb-2">📧</div>
            <div className="font-semibold mb-1">Đã gửi link xác thực</div>
            <p className="text-meta">
              Sol đã gửi email tới <strong>{email}</strong>. Mở hộp thư + click link
              để vào admin console.
            </p>
            <p className="text-meta mt-3 text-sol-ink-3">
              Link có hiệu lực 30 phút. Không thấy mail? Check spam hoặc{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="underline text-sol-green"
              >
                gửi lại
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="sol-field-label" htmlFor="email">
                Email admin
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="khang@sol.vn"
                className="sol-input"
              />
              <p className="sol-field-help">
                Email phải có quyền admin (cấp qua DB). User thường không vào được.
              </p>
            </div>

            {err && <div className="sol-alert-danger text-meta">{err}</div>}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="sol-btn-primary w-full"
            >
              {loading ? 'Đang gửi…' : 'Gửi link xác thực'}
            </button>
          </form>
        )}

        <footer className="mt-8 pt-6 border-t border-sol-line text-center">
          <p className="text-meta text-sol-ink-3">
            Đây là khu vực dành riêng cho admin SOL.
            <br />
            User dashboard:{' '}
            <a
              href="https://bothuocla.sol.vn"
              className="text-sol-green underline"
            >
              bothuocla.sol.vn
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
