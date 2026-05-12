// frontend/src/components/PledgesReplayModal.tsx
//
// Pledges replay at craving — Việc 3 từ COMPETITIVE_ANALYSIS_2026-05-06.md.
//
// Trigger: User check-in xong với cravingIntensity ≥ 8.
// Hành vi: Sol replay 3-5 lý do user đã viết (User.quitReasons) — pop-up
// modal full-screen với voice Khang + 3 reasons + CTA "Đóng — tiếp tục".
//
// Triết lý: quitSTART (CDC US) làm tốt — khi craving cao, replay user's
// own reasons mạnh hơn motivation copy generic. Sol layer thêm voice Khang
// cá nhân ("Anh nhớ vì sao anh bắt đầu không?") để dùng moat differentiator.
//
// Empty state: nếu user chưa fill quitReasons → CTA mở Settings để add.

import { useStore } from '../state/store';

interface Props {
  /** Cường độ thèm vừa log (1-10). Modal chỉ ý nghĩa khi ≥ 8. */
  cravingIntensity: number;
  /** User đã hút trong check-in này không — voice Khang hơi khác */
  smoked: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function PledgesReplayModal({ cravingIntensity, smoked, onClose, onOpenSettings }: Props) {
  const user = useStore((s) => s.user);
  const reasons = user?.quitReasons ?? [];
  const pronoun = user?.pronouns || 'anh';
  const hasReasons = reasons.length > 0;

  // Voice Khang adapt theo context — slip vs cố gắng
  const khangOpening = smoked
    ? `${capitalize(pronoun)} ơi, mình thấy ${pronoun} vừa lỡ tay — không sao. Trước khi qua chuyện khác, mình muốn ${pronoun} đọc lại một lần nữa những lý do ${pronoun} đã viết:`
    : `${capitalize(pronoun)} ơi, mức thèm ${cravingIntensity}/10 là lúc não đang muốn quay đầu. Mình muốn ${pronoun} đọc lại những gì ${pronoun} đã viết — không phải để tự ép, mà để nhớ vì sao ${pronoun} bắt đầu:`;

  return (
    <div
      className="fixed inset-0 z-[2147483600] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header với gradient Đất Lửa */}
        <div
          className="px-5 pt-5 pb-4 rounded-t-2xl"
          style={{
            background: 'linear-gradient(135deg, #FFF4EA 0%, #F0E5D0 100%)',
            borderBottom: '1px solid #E8DFC8',
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">📜</span>
              <div>
                <h2 className="text-base font-bold text-sol-ink leading-tight">
                  Lý do {pronoun} đã viết
                </h2>
                <p className="text-[11px] text-sol-ink-3 mt-0.5">
                  Sol mở lại — vì lúc này {pronoun} cần
                </p>
              </div>
            </div>
            <span
              className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: '#C62828', color: 'white' }}
            >
              Thèm {cravingIntensity}/10
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Voice Khang opening */}
          <div
            className="rounded-xl p-3.5"
            style={{
              background: 'linear-gradient(135deg, #FFF4EA 0%, #FEE0C4 100%)',
              borderLeft: '4px solid #B8860B',
            }}
          >
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-base">💬</span>
              <strong className="text-sm text-sol-ink">Khang Sol</strong>
              <span className="text-[10px] text-sol-ink-3">Người Đã Đi Qua</span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-sol-ink italic">
              "{khangOpening}"
            </p>
          </div>

          {/* Reasons list — empty state hoặc danh sách */}
          {hasReasons ? (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink/60">
                {reasons.length} lý do
              </div>
              {reasons.map((r, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start rounded-xl p-3 bg-sol-bg/60 border border-sol-line"
                >
                  <div
                    className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#B25C2C' }}
                  >
                    {i + 1}
                  </div>
                  <p className="flex-1 text-[14px] leading-relaxed text-sol-ink font-medium">
                    {r}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: '#FFF4EA',
                border: '1px dashed #B8860B',
              }}
            >
              <div className="text-2xl mb-1">📝</div>
              <p className="text-sm font-semibold text-sol-ink mb-1">
                {capitalize(pronoun)} chưa viết lý do
              </p>
              <p className="text-[12px] text-sol-ink/70 leading-relaxed mb-3">
                Lúc thèm cao, lý do của chính {pronoun} mạnh hơn 10 lần lý
                thuyết. Sol khuyên {pronoun} viết 2-3 dòng — vì cu Tí, vì
                vợ, vì cơn ho buổi sáng…
              </p>
              {onOpenSettings && (
                <button
                  onClick={() => {
                    onOpenSettings();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-sol-orange text-white text-sm font-semibold"
                >
                  Mở Settings để thêm
                </button>
              )}
            </div>
          )}

          {/* Tips ngắn — 90 giây */}
          {hasReasons && (
            <div
              className="rounded-xl p-3 text-[12px] leading-relaxed"
              style={{ background: '#E3F2FD', color: '#1565C0' }}
            >
              <strong>⏱️ Cơn thèm chỉ kéo 90-180 giây.</strong>{' '}
              Đọc lại 3 lần lý do trên + uống 1 cốc nước lạnh + đi bộ 5
              phút — Sol đã thấy hàng trăm anh em vượt qua như vậy.
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 px-5 py-3 bg-white border-t border-sol-line">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-sol-green text-white font-bold text-base"
            style={{ background: '#B25C2C' }}
          >
            {hasReasons ? 'Đã đọc — Sol bên ' + pronoun : 'Đóng'}
          </button>
          <p className="text-[11px] text-sol-ink-3 text-center mt-2">
            Đóng tab nếu cần — đêm nay Sol sẽ nhắn nhẹ.
          </p>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
