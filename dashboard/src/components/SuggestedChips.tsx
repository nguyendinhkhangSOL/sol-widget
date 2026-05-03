// dashboard/src/components/SuggestedChips.tsx
//
// Render 8-12 chip gợi ý câu hỏi cho user click thay vì gõ. Chip click →
// instant render Q&A trong chat (KHÔNG gọi AI → KHÔNG tốn quota → trả lời
// chính xác do biên tập tay).
//
// Cuối list có 1 chip đặc biệt "Câu của tôi không có ở đây — hỏi Sol" để
// user hiểu rõ: click chip = nhanh-miễn-phí, gõ tự do = AI có giới hạn.
//
// Design tokens: dùng Tailwind sol-* (sol-paper, sol-line, sol-green,
// sol-ink, sol-ink-3) — match với Chat.tsx và rest of dashboard.

import type { QuickReply } from '../lib/quickReplies';
import type { RankedChip } from '../lib/chipRanking';

interface Props {
  chips: RankedChip[];
  /** User click 1 chip — parent xử lý render Q&A */
  onChipClick: (chip: QuickReply) => void;
  /** User bấm chip "Câu của tôi không có ở đây" — focus composer + có thể hiện hint */
  onFallbackClick: () => void;
  /** Tiêu đề trên đầu list. Default: "Bạn muốn hỏi Sol về…" */
  title?: string;
  /** Compact mode — dùng cho sticky bar dưới chat sau khi đã có tin nhắn */
  compact?: boolean;
}

export function SuggestedChips({
  chips,
  onChipClick,
  onFallbackClick,
  title = 'Bạn muốn hỏi Sol về…',
  compact = false,
}: Props) {
  if (chips.length === 0 && !compact) {
    // Đang load chip — không render gì cho đỡ flicker
    return null;
  }

  if (compact) {
    // Sticky bar mode: 1 hàng pill ngang scroll-x
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {chips.map((chip) => (
          <CompactChip key={chip.id} chip={chip} onClick={() => onChipClick(chip)} />
        ))}
        <CompactFallbackChip onClick={onFallbackClick} />
      </div>
    );
  }

  // Empty/idle state mode: grid 2 cols mobile, 3 cols desktop
  return (
    <div className="space-y-3">
      <p className="text-meta text-sol-ink-3 px-1">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {chips.map((chip) => (
          <ChipCard key={chip.id} chip={chip} onClick={() => onChipClick(chip)} />
        ))}
        <FallbackChipCard onClick={onFallbackClick} />
      </div>
    </div>
  );
}

/* ─── Card mode (empty state grid) ──────────────────────────── */

function ChipCard({ chip, onClick }: { chip: QuickReply; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        text-left bg-white hover:bg-sol-paper border border-sol-line
        rounded-xl px-3 py-2.5 transition
        active:scale-[0.98]
        flex items-start gap-2
        min-h-[64px]
      "
    >
      <span className="text-lg leading-none flex-shrink-0 mt-0.5" aria-hidden>
        {chip.icon || '💬'}
      </span>
      <span className="text-body text-sol-ink leading-snug">{chip.label}</span>
    </button>
  );
}

function FallbackChipCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        text-left bg-sol-paper hover:bg-white border border-dashed border-sol-line
        rounded-xl px-3 py-2.5 transition
        active:scale-[0.98]
        flex items-start gap-2
        min-h-[64px]
      "
    >
      <span className="text-lg leading-none flex-shrink-0 mt-0.5" aria-hidden>❓</span>
      <span className="text-body text-sol-ink-3 leading-snug italic">
        Câu của tôi không có ở đây — hỏi Sol
      </span>
    </button>
  );
}

/* ─── Pill mode (sticky compact) ────────────────────────────── */

function CompactChip({ chip, onClick }: { chip: QuickReply; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex-shrink-0 inline-flex items-center gap-1.5
        bg-white hover:bg-sol-paper border border-sol-line
        rounded-full px-3 py-1.5 text-meta text-sol-ink
        transition active:scale-[0.97]
      "
    >
      <span className="leading-none" aria-hidden>{chip.icon || '💬'}</span>
      <span className="whitespace-nowrap">{chip.label}</span>
    </button>
  );
}

function CompactFallbackChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex-shrink-0 inline-flex items-center gap-1.5
        bg-sol-paper hover:bg-white border border-dashed border-sol-line
        rounded-full px-3 py-1.5 text-meta text-sol-ink-3 italic
        transition active:scale-[0.97]
      "
    >
      <span aria-hidden>❓</span>
      <span className="whitespace-nowrap">Câu khác</span>
    </button>
  );
}
