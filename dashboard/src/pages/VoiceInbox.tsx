// dashboard/src/pages/VoiceInbox.tsx
// Trang voice Khang trên dashboard. Tương tự widget VoiceInboxView nhưng
// nhiều breathing room hơn.

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { VoiceInboxItem } from '../types';

export function VoiceInbox() {
  const [items, setItems] = useState<VoiceInboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getVoiceInbox()
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-sol-ink mb-2">🎙️ Voice của Khang</h1>
      <p className="text-meta text-sol-ink-2 mb-6">
        Khang gửi voice vào những thời điểm quan trọng — Ngày 1, 3, 7, 14,
        21, 30 và lúc bạn cần. Đây là tài sản riêng, không AI nào tạo được.
      </p>

      {loading && <div className="text-sol-ink-2">Đang tải…</div>}
      {!loading && items.length === 0 && (
        <div className="bg-sol-paper rounded-2xl border border-sol-line p-8 text-center">
          <div className="text-3xl mb-2">📻</div>
          <div className="text-sol-ink-2">
            Chưa có voice nào. Khang sẽ gửi vào đúng ngày bạn cần.
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((v) => (
          <Card key={v.id} item={v} />
        ))}
      </ul>
    </div>
  );
}

function Card({ item }: { item: VoiceInboxItem }) {
  const [played, setPlayed] = useState(!!item.playedAt);
  return (
    <li className="bg-white rounded-2xl border border-sol-line p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🎙️</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sol-ink">{item.title}</div>
          <div className="text-meta text-sol-ink-3">
            {new Date(item.deliveredAt).toLocaleString('vi-VN')}
            {item.durationSec ? ` · ${Math.round(item.durationSec)}s` : ''}
          </div>
        </div>
        {!played && (
          <span className="text-meta uppercase tracking-wider font-semibold text-sol-orange">
            Chưa nghe
          </span>
        )}
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
        <details className="mt-3">
          <summary className="text-meta text-sol-ink-3 cursor-pointer">
            Đọc lời thoại
          </summary>
          <p className="text-body text-sol-ink-2 mt-2 leading-relaxed whitespace-pre-line">
            {item.transcript}
          </p>
        </details>
      )}
    </li>
  );
}
