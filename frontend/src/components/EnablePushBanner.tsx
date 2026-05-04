// frontend/src/components/EnablePushBanner.tsx
// Banner nhắc user bật web push notification.
//
// Logic hiển thị (chỉ hiện khi TẤT CẢ true):
//   1. Browser hỗ trợ Notification API + ServiceWorker
//   2. Notification.permission === 'default' (chưa allow/deny)
//   3. User đã qua D+1 (quitDate cách hôm nay >= 1 ngày)
//      → tránh nhồi quá sớm, để user trải nghiệm app trước
//   4. User chưa dismiss trong 7 ngày gần đây (localStorage)
//
// CTA "Bật thông báo" → subscribeToPush() (request permission + register SW + push subscribe)
// CTA "Để sau" → set localStorage 'sol-push-snooze' = now + 7 ngày
//
// Đây là acquisition-critical component: không có push → user chỉ nhận thông báo
// khi mở widget. Push notification gấp đôi retention theo benchmark Smoke Free
// (Tobacco Use Insights 2024).

import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { subscribeToPush } from '../services/webpush';

const SNOOZE_KEY = 'sol-push-snooze';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function isSnoozed(): boolean {
  try {
    const v = localStorage.getItem(SNOOZE_KEY);
    if (!v) return false;
    return parseInt(v, 10) > Date.now();
  } catch {
    return false;
  }
}

function browserSupportsPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

function isPastD1(quitDate: string | null | undefined): boolean {
  if (!quitDate) return false;
  const start = new Date(quitDate).getTime();
  if (isNaN(start)) return false;
  return Date.now() - start >= 24 * 60 * 60 * 1000;
}

export function EnablePushBanner() {
  const user = useStore((s) => s.user);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!browserSupportsPush()) return;
    if (Notification.permission !== 'default') return;
    if (!isPastD1(user?.quitDate)) return;
    if (isSnoozed()) return;
    setVisible(true);
  }, [user?.quitDate]);

  if (!visible) return null;

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        setVisible(false);
      } else {
        setError('Trình duyệt từ chối bật thông báo. Mở Settings → Notifications cho sol.vn.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Lỗi khi đăng ký push');
    } finally {
      setBusy(false);
    }
  }

  function handleSnooze() {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* ignore quota / private mode */
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Bật thông báo"
      className="mx-3 my-2 rounded-2xl bg-sol-orange-soft border border-sol-orange/30 p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sol-orange/15 text-2xl"
        >
          🔔
        </div>
        <div className="flex-1">
          <h3 className="text-h3 text-sol-earth-ink">Để mình kịp nhắc {user?.pronouns ?? 'bạn'}</h3>
          <p className="mt-1 text-body text-sol-ink-2">
            Bật thông báo để nhận lời chào sáng, nhắc giờ khó, và check-in tối — kể cả khi {user?.pronouns ?? 'bạn'} chưa mở widget.
          </p>
          {error && (
            <p className="mt-2 text-meta text-sol-red-ink" role="alert">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy}
              className="min-h-tap inline-flex items-center justify-center rounded-lg bg-sol-green px-4 py-2 text-body font-semibold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
            >
              {busy ? 'Đang bật…' : 'Bật thông báo'}
            </button>
            <button
              type="button"
              onClick={handleSnooze}
              disabled={busy}
              className="min-h-tap inline-flex items-center justify-center rounded-lg bg-transparent px-3 py-2 text-body text-sol-ink-2 hover:bg-sol-soft"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
