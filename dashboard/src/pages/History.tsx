import { useMemo, useState } from 'react';
import { useStore } from '../state/store';

export function History() {
  const checkins = useStore((s) => s.checkins);
  const [filter, setFilter] = useState<'all' | 'clean' | 'slip' | 'notes'>('all');

  const filtered = useMemo(() => {
    const sorted = [...checkins].sort((a, b) => b.dayNumber - a.dayNumber);
    if (filter === 'all') return sorted;
    if (filter === 'clean') return sorted.filter((c) => !c.smoked);
    if (filter === 'slip') return sorted.filter((c) => c.smoked);
    if (filter === 'notes') return sorted.filter((c) => !!c.note);
    return sorted;
  }, [checkins, filter]);

  const filters = [
    { k: 'all', label: 'Tất cả' },
    { k: 'clean', label: 'Ngày sạch' },
    { k: 'slip', label: 'Có hút' },
    { k: 'notes', label: 'Có ghi chú' },
  ] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24 lg:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Nhật ký check-in</h1>
        <p className="text-sm text-sol-ink/60">{checkins.length} check-in · đọc lại để thấy mình đã đi xa đến đâu.</p>
      </header>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === f.k ? 'bg-sol-green text-white border-sol-green' : 'bg-white border-black/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-sol-ink/50 py-12">Chưa có check-in nào phù hợp.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const date = new Date(c.date);
            return (
              <div
                key={c.id}
                className="bg-white rounded-xl p-4 border border-black/5 shadow-card flex gap-4"
              >
                <div className="text-center border-r border-black/5 pr-4 min-w-[60px]">
                  <div className="text-xs text-sol-ink/50">Ngày</div>
                  <div className="text-2xl font-bold text-sol-green">{c.dayNumber}</div>
                  <div className="text-[10px] text-sol-ink/40">
                    {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        c.smoked ? 'bg-sol-orange/20 text-sol-orange' : 'bg-sol-green/20 text-sol-green'
                      }`}
                    >
                      {c.smoked ? 'Có hút' : 'Sạch'}
                    </span>
                    <span className="text-sol-ink/60">
                      Thèm {c.cravingIntensity}/10 · {['😣', '🙁', '😐', '🙂', '😄'][c.mood - 1]} {c.mood}/5
                    </span>
                    {c.isSickDay && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-sol-blue/20 text-sol-blue">
                        Ngày ốm
                      </span>
                    )}
                  </div>
                  {c.note && (
                    <div className="mt-2 text-sm text-sol-ink/80 whitespace-pre-wrap">{c.note}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
