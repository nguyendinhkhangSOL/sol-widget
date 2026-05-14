// frontend/src/components/views/MessageBubble.tsx
// Renders a single message. Content type decides layout (chat, exercise card, checkin step, etc.).

import clsx from 'clsx';
import type { Message } from '../../types';
import { useStore } from '../../state/store';
import { api } from '../../services/api';

export function MessageBubble({ message }: { message: Message }) {
  const { role, type, content, metadata } = message;
  const isUser = role === 'USER';
  const isSystem = role === 'SYSTEM';

  // Structured cards render specially
  if (type === 'EXERCISE_CARD') return <ExerciseCardMessage content={content} metadata={metadata} />;
  if (type === 'CHECKIN_STEP') return <CheckinStepMessage content={content} metadata={metadata} />;
  if (type === 'CRISIS_PROMPT') return <CrisisPromptMessage content={content} metadata={metadata} />;
  if (type === 'PHENOMENA_ALERT' || type === 'SCIENCE_TIP' || type === 'MORNING_GOAL' || type === 'NIGHT_STORY')
    return <RichCardMessage content={content} metadata={metadata} type={type} />;

  // Default chat bubble — bot reply có thể kèm wikiUrl (canned-reply / AI reply trỏ wiki)
  const wikiUrl = metadata?.wikiUrl as string | undefined;
  const wikiLabel = (metadata?.wikiLabel as string | undefined) || 'Đọc bài đầy đủ';

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words',
          isSystem
            ? 'bg-sol-ink/10 text-sol-ink/70 text-xs'
            : isUser
            ? 'bg-sol-green text-white rounded-br-sm'
            : 'bg-white border border-black/5 text-sol-ink rounded-bl-sm'
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {!isUser && wikiUrl && (
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-sol-blue underline hover:text-sol-green"
          >
            📖 {wikiLabel} →
          </a>
        )}
      </div>
    </div>
  );
}

function RichCardMessage({
  content,
  metadata,
  type,
}: {
  content: string;
  metadata?: Record<string, any>;
  type: string;
}) {
  const icon = type === 'MORNING_GOAL' ? '☀️' : type === 'PHENOMENA_ALERT' ? '⚠️' : type === 'SCIENCE_TIP' ? '💡' : '🌙';
  const label =
    type === 'MORNING_GOAL'
      ? 'Mục tiêu sáng'
      : type === 'PHENOMENA_ALERT'
      ? 'Có thể xảy ra hôm nay'
      : type === 'SCIENCE_TIP'
      ? 'Góc khoa học'
      : 'Khép ngày';
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] bg-white border border-black/5 rounded-2xl p-3 text-sm text-sol-ink">
        <div className="text-[11px] uppercase tracking-wider text-sol-ink/50 mb-1">
          {icon} {label}
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
        {metadata?.wikiUrl && (
          <a
            href={metadata.wikiUrl}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-block text-xs text-sol-blue underline"
          >
            Đọc sâu trên SOL Wiki →
          </a>
        )}
      </div>
    </div>
  );
}

function CheckinStepMessage({ content, metadata }: { content: string; metadata?: Record<string, any> }) {
  const options: { value: any; label: string }[] = metadata?.options ?? [];
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] w-full bg-white border border-black/5 rounded-2xl p-3">
        <div className="text-sm text-sol-ink">{content}</div>
        {options.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {options.map((o, i) => (
              <button
                key={i}
                onClick={() =>
                  api.sendMessage(String(o.label), { checkinAnswer: o.value, step: metadata?.step })
                }
                className="px-3 py-1.5 rounded-full bg-sol-green/10 text-sol-green text-xs font-medium hover:bg-sol-green/20"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseCardMessage({ content, metadata }: { content: string; metadata?: Record<string, any> }) {
  const setView = useStore((s) => s.setView);
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] w-full bg-sol-blue/10 border border-sol-blue/20 rounded-2xl p-3">
        <div className="text-[11px] uppercase tracking-wider text-sol-blue mb-1">Bài tập</div>
        <div className="text-sm text-sol-ink whitespace-pre-wrap">{content}</div>
        <button
          onClick={() => setView('exercise')}
          className="mt-2 px-3 py-1.5 rounded-full bg-sol-blue text-white text-xs font-medium"
        >
          Mở bài tập
          {metadata?.estMinutes ? ` • ~${metadata.estMinutes} phút` : ''}
        </button>
      </div>
    </div>
  );
}

function CrisisPromptMessage({ content, metadata }: { content: string; metadata?: Record<string, any> }) {
  const setView = useStore((s) => s.setView);
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] w-full bg-sol-red/10 border border-sol-red/30 rounded-2xl p-3">
        <div className="text-[11px] uppercase tracking-wider text-sol-red mb-1">SOS</div>
        <div className="text-sm text-sol-ink whitespace-pre-wrap">{content}</div>
        <button
          onClick={() => setView('crisis')}
          className="mt-2 px-3 py-1.5 rounded-full bg-sol-red text-white text-xs font-medium"
        >
          Mở vòng lặp 90 giây
        </button>
        {metadata?.hotline && <div className="mt-1 text-[11px] text-sol-ink/60">Hotline: {metadata.hotline}</div>}
      </div>
    </div>
  );
}
