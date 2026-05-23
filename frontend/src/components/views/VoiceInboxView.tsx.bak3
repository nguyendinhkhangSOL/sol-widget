// frontend/src/components/views/VoiceInboxView.tsx
// Voice inbox của user — danh sách audio Khang đã gửi tới user (theo gói).
// User bấm play → đánh dấu playedAt.

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { VoiceInboxItem } from '../../types';
import { useStore } from '../../state/store';

export function VoiceInboxView() {
  const setView = useStore((s) => s.setView);
  const [items, setItems] = useState<VoiceInboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVoiceInbox()
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-sol-ink">🎙️ Voice Khang</h2>
        <button
          className="text-meta text-sol-ink-3 underline"
          onClick={() => setView('greeting')}
        >
          Đóng
        </button>
      </div>
      {loading && <div className="text-sm text-sol-ink-2">Đang tải…</div>}
      {!loading && items.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-3xl mb-2">📻</div>
            <div className="text-sm text-sol-ink-2">
              Chưa có voice nào. Khang sẽ gửi vào đúng ngày bạn cần.
            </div>
          </div>
        </div>
      )}
      <ul className="space-y-3">
        {items.map((v) => (
          <VoiceItem key={v.id} item={v} />
        ))}
      </ul>
    </div>
  );
}

function VoiceItem({ item }: { item: VoiceInboxItem }) {
  const [played, setPlayed] = useState(!!item.playedAt);
  return (
    <li className="bg-white rounded-2xl border border-sol-line p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🎙️</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-sol-ink truncate">{item.title}</div>
          <div className="text-meta text-sol-ink-3">
            {new Date(item.deliveredAt).toLocaleDateString('vi-VN')}
            {item.durationSec ? ` · ${Math.round(item.durationSec)}s` : ''}
            {!played && <span className="ml-1 text-sol-orange">• Chưa nghe</span>}
          </div>
        </div>
      </div>
      <audio
        controls
        preload="none"
        src={item.audioUrl}
        onPlay={() => {
          if (!played) {
            setPlayed(true);
            api.markVoicePlayed(item.id).catch(() => {});
          }
        }}
        className="w-full"
      />
      {item.transcript && (
        <details className="mt-2">
          <summary className="text-meta text-sol-ink-3 cursor-pointer">Đọc lời thoại</summary>
          <p className="text-sm text-sol-ink-2 mt-1 leading-relaxed whitespace-pre-line">
            {item.transcript}
          </p>
        </details>
      )}
    </li>
  );
}
