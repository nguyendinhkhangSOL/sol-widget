import { useWorkbook, preCheckStats } from '../../state/workbookStore';
import { PRE_QUIT_PHASES } from '../../lib/workbook';
import { SectionCard, Callout, FieldLabel } from './shared';

export function PreQuitSection() {
  const data = useWorkbook((s) => s.data);
  const toggle = useWorkbook((s) => s.togglePreCheck);
  const set = useWorkbook((s) => s.set);

  return (
    <SectionCard
      id="wbx-section-prep"
      accent="purple"
      icon="🗓"
      title="Những Điều Cần Biết TRƯỚC Ngày Bỏ Thuốc"
      subtitle="Chuẩn bị kỹ = 50% thành công. Đừng bỏ qua bước này."
    >
      <Callout accent="purple" icon="🧠">
        Bỏ thuốc không phải là ý chí thuần túy — đó là <strong>chiến lược</strong>. Não bạn đã bị thay
        đổi bởi nicotin trong nhiều năm. Chuẩn bị đúng sẽ giúp bạn đi qua những ngày đầu tiên mà không
        gục ngã.{' '}
        <a
          href="https://sol.vn/wiki/co-che-nghien"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline"
        >
          Wiki: Cơ chế nghiện nicotin
        </a>
      </Callout>

      <div className="space-y-4">
        {PRE_QUIT_PHASES.map((phase) => {
          const stats = preCheckStats(data, phase.key, phase.items.length);
          return (
            <div
              key={phase.key}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: phase.color + '33' }}
            >
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ background: phase.bg }}
              >
                <span
                  className="text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full"
                  style={{ background: phase.color }}
                >
                  {phase.badge}
                </span>
                <span className="flex-1 font-semibold text-sm" style={{ color: phase.color }}>
                  {phase.title}
                </span>
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: phase.color }}
                >
                  {stats.done}/{stats.total}
                </span>
              </div>
              <div className="bg-white px-4 py-3 space-y-2">
                {phase.items.map((item) => {
                  const checked = !!data.preCheck[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 py-1.5 cursor-pointer hover:bg-sol-bg/50 rounded px-1 -mx-1 transition"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item.key)}
                        className="sr-only peer"
                      />
                      <span
                        className="mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition"
                        style={{
                          borderColor: checked ? phase.color : 'rgba(0,0,0,.2)',
                          background: checked ? phase.color : 'transparent',
                          color: '#fff',
                          fontSize: 12,
                        }}
                      >
                        {checked && '✓'}
                      </span>
                      <span className={checked ? 'line-through opacity-60' : ''}>
                        <span className="block text-sm font-medium">{item.title}</span>
                        <span className="block text-[11px] text-sol-ink/55">{item.sub}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <FieldLabel>Ngày G của tôi (Quit Date)</FieldLabel>
        <input
          type="date"
          value={data.quitDate ? data.quitDate.slice(0, 10) : ''}
          onChange={(e) => set('quitDate', e.target.value)}
          className="w-full max-w-xs px-3 py-2 rounded-lg border border-black/10 bg-white text-sm"
        />
      </div>
    </SectionCard>
  );
}
