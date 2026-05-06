// dashboard/src/components/views/phaseB/QDayCeremony.tsx
// Q-Day Day 28 ceremony — DASHBOARD desktop variant.
// Full screen overlay với layout rộng, font lớn cho desktop.

import { useState } from 'react';
import { api, ApiError } from '../../../services/api';

export interface QDayCeremonyProps {
  pronouns?: string;
  isPastQDay: boolean;
  onConfirmed: (qDayConfirmedAt: string) => void;
  onPostpone?: () => void;
}

export function QDayCeremony({
  pronouns = 'bạn',
  isPastQDay,
  onConfirmed,
  onPostpone,
}: QDayCeremonyProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      const r = await api.qdayConfirm();
      onConfirmed(r.qDayConfirmedAt);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? `Lỗi ${e.status}: ${e.body?.message || e.body?.error || 'Sol chưa lưu được cam kết.'}`
          : 'Không kết nối được Sol. Kiểm tra mạng rồi thử lại?';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-sol-earth via-sol-wine to-sol-earth-ink overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white">
        <div className="max-w-2xl w-full text-center animate-fade-in">
          {/* Sun rise icon */}
          <div className="text-8xl mb-8 animate-pulse-soft" aria-hidden="true">🌅</div>

          {/* Headline */}
          {!isPastQDay ? (
            <>
              <h1 className="text-display font-bold mb-3 text-white" style={{ fontSize: '48px' }}>Hôm nay là Q-Day</h1>
              <p className="text-body-lg text-white opacity-90 mb-10">Ngày {pronouns} quyết tâm bỏ hẳn</p>
            </>
          ) : (
            <>
              <h1 className="text-display font-bold mb-3 text-white">Sol vẫn đợi {pronouns}</h1>
              <p className="text-body-lg text-white opacity-90 mb-10">
                Q-Day không phải deadline — đây là cam kết với chính {pronouns}.
                Khi nào sẵn sàng, Sol bên cạnh.
              </p>
            </>
          )}

          {/* Body text */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-10 text-left">
            <p className="text-body-lg leading-relaxed mb-4 text-white">
              {pronouns === 'bạn' ? 'Bạn' : pronouns.charAt(0).toUpperCase() + pronouns.slice(1)} đã chuẩn bị 4 tuần.
            </p>
            <p className="text-body-lg leading-relaxed mb-4 text-white">
              Sol đã đo nhịp của {pronouns}.
            </p>
            <p className="text-body-lg leading-relaxed mb-4 text-white">
              Đội Sol đã sẵn sàng.
            </p>
            <p className="text-body-lg font-semibold leading-relaxed mt-6 pt-6 border-t border-white/20 text-white">
              Bây giờ chỉ còn 1 việc:<br />
              <span className="text-h1">Cam kết với chính {pronouns}.</span>
            </p>
          </div>

          {error && (
            <div className="bg-sol-red/20 border border-sol-red/40 rounded-xl p-4 mb-5 text-body text-white">
              {error}
            </div>
          )}

          {/* Primary CTA */}
          <button
            onClick={confirm}
            disabled={submitting}
            className="w-full min-h-tap py-5 rounded-2xl bg-white text-sol-earth-ink font-bold text-h2 shadow-pop hover:bg-sol-orange-soft active:scale-[.98] disabled:opacity-50 transition mb-4"
          >
            {submitting ? 'Sol đang ghi nhận…' : '✓ Tôi cam kết — bật đồng hồ tự do'}
          </button>

          {onPostpone && (
            <button
              onClick={onPostpone}
              disabled={submitting}
              className="w-full text-body text-white/80 underline hover:text-white py-3"
            >
              Chưa sẵn sàng? Sol đợi {pronouns} — bấm "Để mai"
            </button>
          )}

          <p className="text-meta text-white/60 mt-8 italic leading-relaxed">
            Khi {pronouns} bấm cam kết, Sol bắt đầu đếm thời gian không hút.
            <br />
            Đội Sol sẽ được thông báo: "{pronouns === 'bạn' ? 'Một đồng đội' : 'A' + pronouns.slice(1)} vừa Q-Day."
          </p>
        </div>
      </div>
    </div>
  );
}
