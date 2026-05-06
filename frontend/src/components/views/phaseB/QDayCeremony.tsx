// frontend/src/components/views/phaseB/QDayCeremony.tsx
// Phase B Q-Day Day 28 ceremony — full-screen overlay.
// User PHẢI bấm "Tôi cam kết" để bật đồng hồ tự do (countdown UP từ 0:00:00).
//
// Theo STAGE_88_DAYS_DESIGN section 6:
// - Day 26-27: pre-Q-Day banner (KHÔNG dùng component này — banner nhỏ thôi)
// - Day 28: full-screen ceremony bắt buộc xác nhận
// - Day 29-32: persistent banner nhẹ
// - Day 33+: ẩn dần (vẫn có nút trong Settings để reach)
//
// Triết lý: ritual thật. Không animation màu mè. Câu chữ Khang chỉnh kỹ.

import { useState } from 'react';
import { api, ApiError } from '../../../services/api';

export interface QDayCeremonyProps {
  pronouns?: string;
  /** Nếu Day 29+ chưa confirm, hiển thị "vẫn chưa quá muộn" thay vì "hôm nay là Q-Day". */
  isPastQDay: boolean;
  onConfirmed: (qDayConfirmedAt: string) => void;
  /** Cho phép skip — Day 28 chỉ banner, không exit; Day 29+ allow "Để mai". */
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full text-center animate-fade-in">
          {/* ─── Sun rise icon ─────────────────────────────────────────── */}
          <div className="text-7xl mb-6 animate-pulse-soft" aria-hidden="true">🌅</div>

          {/* ─── Headline ──────────────────────────────────────────────── */}
          {!isPastQDay ? (
            <>
              <h1 className="text-display font-bold mb-2 text-white">Hôm nay là Q-Day</h1>
              <p className="text-body-lg text-white opacity-90 mb-8">Ngày {pronouns} quyết tâm bỏ hẳn</p>
            </>
          ) : (
            <>
              <h1 className="text-h1 font-bold mb-2 text-white">Sol vẫn đợi {pronouns}</h1>
              <p className="text-body text-white opacity-90 mb-8">
                Q-Day không phải deadline — đây là cam kết với chính {pronouns}.
                Khi nào sẵn sàng, Sol bên cạnh.
              </p>
            </>
          )}

          {/* ─── Body text ─────────────────────────────────────────────── */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 text-left">
            <p className="text-body leading-relaxed mb-3">
              {pronouns === 'bạn' ? 'Bạn' : pronouns.charAt(0).toUpperCase() + pronouns.slice(1)} đã chuẩn bị 4 tuần.
            </p>
            <p className="text-body leading-relaxed mb-3">
              Sol đã đo nhịp của {pronouns}.
            </p>
            <p className="text-body leading-relaxed mb-3">
              Đội Sol đã sẵn sàng.
            </p>
            <p className="text-body font-semibold leading-relaxed mt-4 pt-4 border-t border-white/20">
              Bây giờ chỉ còn 1 việc:<br />
              <span className="text-body-lg">Cam kết với chính {pronouns}.</span>
            </p>
          </div>

          {/* ─── Error display ─────────────────────────────────────────── */}
          {error && (
            <div className="bg-sol-red/20 border border-sol-red/40 rounded-lg p-3 mb-4 text-meta text-white">
              {error}
            </div>
          )}

          {/* ─── Primary CTA ───────────────────────────────────────────── */}
          <button
            onClick={confirm}
            disabled={submitting}
            className="w-full min-h-tap py-4 rounded-2xl bg-white text-sol-earth-ink font-bold text-body-lg shadow-pop hover:bg-sol-orange-soft active:scale-[.98] disabled:opacity-50 transition mb-3"
          >
            {submitting ? 'Sol đang ghi nhận…' : '✓ Tôi cam kết — bật đồng hồ tự do'}
          </button>

          {/* ─── Postpone (subtle) ────────────────────────────────────── */}
          {onPostpone && (
            <button
              onClick={onPostpone}
              disabled={submitting}
              className="w-full text-meta text-white/80 underline hover:text-white py-2"
            >
              Chưa sẵn sàng? Sol đợi {pronouns} — bấm "Để mai"
            </button>
          )}

          {/* ─── Footer note ──────────────────────────────────────────── */}
          <p className="text-[12px] text-white/60 mt-6 italic leading-relaxed">
            Khi {pronouns} bấm cam kết, Sol bắt đầu đếm thời gian không hút.
            <br />
            Đội Sol sẽ được thông báo: "{pronouns === 'bạn' ? 'Một đồng đội' : 'A' + pronouns.slice(1)} vừa Q-Day."
          </p>
        </div>
      </div>
    </div>
  );
}
