import { useWorkbook, weekProgressPct } from '../../state/workbookStore';
import { WEEKS, type WeekInfo } from '../../lib/workbook';
import { DayCard } from './DayCard';
import { TextArea, TextInput, FieldLabel } from './shared';

interface Props {
  week: 1 | 2 | 3 | 4;
}

export function WeekSection({ week }: Props) {
  const info = WEEKS.find((w) => w.week === week) as WeekInfo;
  const data = useWorkbook((s) => s.data);
  const setField = useWorkbook((s) => s.setWeekField);
  const pct = weekProgressPct(data, week);
  const refl = data.weeks[week] ?? {};

  return (
    <section id={`wbx-week-${week}`} className="scroll-mt-24 space-y-4 print:break-before-page">
      {/* Week header */}
      <div
        className="rounded-2xl p-5 md:px-6 md:py-5 text-white flex items-center gap-4 print:break-inside-avoid"
        style={{
          background: `linear-gradient(135deg, ${info.phase.color}, ${info.phase.color}cc)`,
        }}
      >
        <div className="shrink-0 h-14 w-14 md:h-16 md:w-16 rounded-xl bg-white/15 border border-white/20 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase tracking-wider opacity-80">Tuần</span>
          <span className="text-xl font-bold">{week}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] md:text-lg leading-tight">{info.title}</h3>
          <p className="text-xs md:text-sm opacity-85 mt-0.5 leading-relaxed">{info.blurb}</p>
          {info.ebookLink && (
            <a
              href={info.ebookLink}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] opacity-70 underline hover:opacity-100 mt-1 inline-block"
            >
              📖 Ebook Sol — chi tiết chương liên quan
            </a>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl md:text-3xl font-black tabular-nums">{pct}%</div>
          <div className="text-[10px] uppercase opacity-80">hoàn thành</div>
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-3">
        {info.days.map((d) => <DayCard key={d} day={d} />)}
      </div>

      {/* Weekly reflection */}
      <div
        className="rounded-2xl p-5 border print:break-inside-avoid"
        style={{ background: info.phase.light, borderColor: info.phase.color + '33' }}
      >
        <h4 className="font-bold text-sm md:text-base mb-3" style={{ color: info.phase.color }}>
          📋 Tổng kết Tuần {week}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <FieldLabel>🏆 Chiến thắng lớn nhất tuần này</FieldLabel>
            <TextArea value={refl.win ?? ''} onChange={(e) => setField(week, 'win', e.target.value)} />
          </div>
          <div>
            <FieldLabel>💡 Bài học rút ra</FieldLabel>
            <TextArea value={refl.lesson ?? ''} onChange={(e) => setField(week, 'lesson', e.target.value)} />
          </div>
          <div>
            <FieldLabel>⚡ Khó khăn gặp phải</FieldLabel>
            <TextArea value={refl.hard ?? ''} onChange={(e) => setField(week, 'hard', e.target.value)} />
          </div>
          <div>
            <FieldLabel>🎯 Mục tiêu tuần tới</FieldLabel>
            <TextArea value={refl.goal ?? ''} onChange={(e) => setField(week, 'goal', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Milestone reward */}
      <div
        className="rounded-2xl p-5 text-center border print:break-inside-avoid"
        style={{
          background: `linear-gradient(135deg, ${info.phase.color}10, white)`,
          borderColor: info.phase.color + '55',
        }}
      >
        <div className="text-2xl">🎉</div>
        <div className="font-bold mt-1" style={{ color: info.phase.color }}>
          {milestoneTitle(week)}
        </div>
        <p className="text-xs text-sol-ink/65 mt-1 leading-relaxed max-w-lg mx-auto">
          {milestoneDesc(week)}
        </p>
        <div className="mt-3 max-w-md mx-auto text-left">
          <FieldLabel>Phần thưởng tôi tự tặng cho mình:</FieldLabel>
          <TextInput
            value={refl.reward ?? ''}
            onChange={(e) => setField(week, 'reward', e.target.value)}
            placeholder="Ví dụ: Bữa ăn ngon, xem phim, mua đồ mình thích…"
          />
        </div>
      </div>
    </section>
  );
}

function milestoneTitle(w: number) {
  return w === 1
    ? '1 Tuần Không Thuốc!'
    : w === 2
    ? '2 Tuần — Receptor Giảm 40%'
    : w === 3
    ? '3 Tuần — Thói Quen Mới'
    : '30 Ngày — Kỳ Tích!';
}

function milestoneDesc(w: number) {
  return w === 1
    ? 'Mức CO trong máu đã bình thường. Vị giác và khứu giác bắt đầu phục hồi.'
    : w === 2
    ? 'Số receptor nicotine (nAChR) trong não đã giảm khoảng 40%.'
    : w === 3
    ? 'Não bắt đầu hình thành thói quen mới. Thèm vẫn đến nhưng bạn biết cách vượt qua.'
    : 'Ít hơn 10% người đạt được cột mốc này trong lần đầu thử. Đây là kỳ tích thật sự.';
}
