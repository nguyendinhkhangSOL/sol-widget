import { useEffect, useState } from 'react';
import { useWorkbook, daysComplete } from '../../state/workbookStore';

const PILLS: Array<{ id: string; label: string; kind?: 'prep' | 'post' | 'identity' }> = [
  { id: 'wbx-section-prep',     label: '🗓 Chuẩn Bị', kind: 'prep' },
  { id: 'wbx-section-why',      label: '1 · Lý Do' },
  { id: 'wbx-section-pledge',   label: '2 · Cam Kết' },
  { id: 'wbx-section-network',  label: '3 · Hỗ Trợ' },
  { id: 'wbx-section-money',    label: '4 · Tiết Kiệm' },
  { id: 'wbx-section-craving',  label: '5 · Cơn Thèm' },
  { id: 'wbx-section-identity', label: '🪞 Bản Thân', kind: 'identity' },
  { id: 'wbx-week-1',           label: 'T1' },
  { id: 'wbx-week-2',           label: 'T2' },
  { id: 'wbx-week-3',           label: 'T3' },
  { id: 'wbx-week-4',           label: 'T4' },
  { id: 'wbx-section-post30',   label: '🏆 Sau 30N', kind: 'post' },
];

export function WorkbookNav() {
  const data = useWorkbook((s) => s.data);
  const status = useWorkbook((s) => s.saveStatus);
  const done = daysComplete(data);
  const pct = Math.round((done / 30) * 100);
  const [active, setActive] = useState<string>('wbx-section-prep');

  useEffect(() => {
    // Track which section is in view — light-weight observer
    const ids = PILLS.map((p) => p.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0))[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="sticky top-0 z-20 bg-sol-bg/95 backdrop-blur border-b border-black/5 print:hidden"
      style={{ paddingTop: 6, paddingBottom: 8 }}
    >
      {/* Progress */}
      <div className="max-w-5xl mx-auto px-4 pt-2 flex items-center gap-3">
        <span className="text-xs font-semibold text-sol-ink/70 shrink-0">🎯 Tiến độ</span>
        <div className="flex-1 h-2 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #B8860B, #B25C2C)',
            }}
          />
        </div>
        <span className="text-xs tabular-nums text-sol-ink/70 shrink-0">{done}/30 ngày</span>
        <SaveIndicator status={status} />
      </div>

      {/* Pills */}
      <div className="max-w-5xl mx-auto px-4 mt-2 flex gap-1.5 overflow-x-auto scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
        {PILLS.map((p) => {
          const isActive = active === p.id;
          const base = 'shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition whitespace-nowrap';
          let cls: string;
          if (isActive) {
            cls =
              p.kind === 'prep'
                ? 'bg-purple-600 text-white border-purple-600'
                : p.kind === 'identity'
                ? 'bg-purple-700 text-white border-purple-700'
                : p.kind === 'post'
                ? 'bg-sol-green text-white border-sol-green'
                : 'bg-sol-orange text-white border-sol-orange';
          } else {
            cls =
              p.kind === 'prep'
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                : p.kind === 'identity'
                ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                : p.kind === 'post'
                ? 'bg-sol-green/10 text-sol-green border-sol-green/30 hover:bg-sol-green/20'
                : 'bg-white text-sol-ink/70 border-black/10 hover:bg-sol-bg';
          }
          return (
            <a
              key={p.id}
              href={`#${p.id}`}
              className={`${base} ${cls}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(p.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {p.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null;
  const saving = status === 'saving';
  return (
    <div className="hidden md:flex items-center gap-1 text-[10px] text-sol-ink/50 shrink-0">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: saving ? '#F57C00' : '#B25C2C' }}
      />
      {saving ? 'Đang lưu…' : 'Đã lưu'}
    </div>
  );
}
