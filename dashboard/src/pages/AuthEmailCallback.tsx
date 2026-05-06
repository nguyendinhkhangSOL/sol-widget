// dashboard/src/pages/AuthEmailCallback.tsx
// Page xử lý magic link callback. URL: /auth/email?token=XXX
//
// Flow:
//   1. Component mount → đọc token query param
//   2. Call api.verifyEmailToken(token) → backend verify + cấp JWT mới
//   3. Save JWT vào localStorage (overwrite anon JWT cũ)
//   4. Redirect about / với toast "Đã đồng bộ"
//   5. Hiển thị error rõ nếu token expire/invalid

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../services/api';

type Status = 'verifying' | 'success' | 'error';

export function AuthEmailCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [errorDetail, setErrorDetail] = useState('');

  // PHASE B fix: React StrictMode dev mode mount useEffect 2 lần → verify
  // 2 lần → lần 2 fail "token_used" (token 1-shot). Dùng useRef flag để
  // skip lần 2. Production sẽ build single mount, không gặp issue này.
  const verifyAttemptedRef = useRef(false);

  useEffect(() => {
    if (verifyAttemptedRef.current) return;

    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Link không hợp lệ');
      setErrorDetail('Token thiếu trong URL.');
      return;
    }

    verifyAttemptedRef.current = true;

    // BỎ cancelled flag — useRef đã đảm bảo verify chỉ chạy 1 lần. Cancelled
    // làm setStatus bị skip nếu StrictMode unmount giữa fetch + response →
    // page stuck "Đang đồng bộ" forever.
    api.verifyEmailToken(token)
      .then((r) => {
        localStorage.setItem('sol_token', r.token);
        setStatus('success');
        setMessage(r.message ?? 'Đã đồng bộ tài khoản thành công.');
        setTimeout(() => nav('/', { replace: true }), 2000);
      })
      .catch((e) => {
        setStatus('error');
        if (e instanceof ApiError) {
          const errCode = e.body?.error;
          const errMsg = e.body?.message;
          if (errCode === 'token_expired') {
            setMessage('Link đã hết hạn');
            setErrorDetail('Link có hiệu lực 1 giờ. Hãy yêu cầu link mới trong widget Settings.');
          } else if (errCode === 'token_used') {
            setMessage('Link đã được sử dụng');
            setErrorDetail('Mỗi link chỉ dùng 1 lần. Yêu cầu link mới nếu cần.');
          } else if (errCode === 'token_not_found') {
            setMessage('Link không hợp lệ');
            setErrorDetail('Link có thể bị copy thiếu hoặc đã bị xoá.');
          } else {
            setMessage(errMsg ?? `Lỗi ${e.status}`);
            setErrorDetail('Hãy thử yêu cầu link mới.');
          }
        } else {
          setMessage('Không kết nối được Sol');
          setErrorDetail('Kiểm tra mạng rồi thử lại.');
        }
      });
  }, [params, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sol-bg p-6">
      <div className="max-w-lg w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="text-6xl mb-4 animate-pulse">📧</div>
            <h1 className="text-h1 text-sol-ink font-semibold mb-2">Đang đồng bộ tài khoản…</h1>
            <p className="text-body text-sol-ink-2">Sol đang verify link của bạn. Chờ một chút.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-h1 text-sol-green-ink font-semibold mb-2">Đã đồng bộ!</h1>
            <p className="text-body-lg text-sol-ink mb-2">{message}</p>
            <p className="text-meta text-sol-ink-3 italic">Đang chuyển về trang chính trong 2 giây…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-h1 text-sol-red font-semibold mb-2">{message}</h1>
            <p className="text-body text-sol-ink-2 mb-6 leading-relaxed">{errorDetail}</p>
            <button
              onClick={() => nav('/', { replace: true })}
              className="min-h-tap px-6 py-3 rounded-xl bg-sol-green text-white font-semibold text-body shadow-card"
            >
              Về trang chính
            </button>
          </>
        )}
      </div>
    </div>
  );
}
