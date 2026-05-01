import { useRef } from 'react';
import { useWorkbook } from '../../state/workbookStore';
import { DAY_COLORS, phaseForDay } from '../../lib/workbook';

export function WorkbookHero() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);
  const exportJSON = useWorkbook((s) => s.exportJSON);
  const importJSON = useWorkbook((s) => s.importJSON);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sol-workbook-${data.userName || 'me'}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | null) {
    if (!file) return;
    const text = await file.text();
    const ok = importJSON(text);
    if (!ok) alert('File backup không hợp lệ.');
    else alert('✓ Đã khôi phục dữ liệu.');
  }

  return (
    <div
      className="rounded-3xl px-6 py-8 md:px-10 md:py-10 text-white shadow-lg relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2C2A27 0%, #4A3A28 50%, #6D0808 100%)',
      }}
    >
      <div className="text-[11px] font-bold tracking-[.18em] opacity-80 mb-1">
        SOL · SỐNG LẠI · LÀM LẠI TỐT HƠN
      </div>
      <h1 className="text-3xl md:text-5xl font-black leading-tight">
        Sổ Tay <span style={{ color: '#F8C871' }}>30 Ngày</span>
        <br />
        Bỏ Thuốc
      </h1>
      <p className="opacity-80 text-sm md:text-base mt-1">
        Từ chiến trường đến tự do — từng ngày một
      </p>

      {/* Name input */}
      <div className="mt-5 max-w-md">
        <label className="text-[11px] opacity-70 uppercase tracking-wider">Tên của tôi</label>
        <input
          type="text"
          value={data.userName}
          onChange={(e) => set('userName', e.target.value)}
          placeholder="Nhập tên của bạn…"
          className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/25 placeholder-white/40 text-white focus:outline-none focus:bg-white/15"
        />
      </div>

      {/* Color band 30 days */}
      <div className="mt-6">
        <div className="flex rounded-lg overflow-hidden h-3 shadow-sm">
          {DAY_COLORS.map((c, i) => (
            <div
              key={i}
              title={`Ngày ${i + 1} · ${phaseForDay(i + 1).label}`}
              style={{ background: c, flex: 1 }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] opacity-65 mt-1.5 px-0.5">
          <span>Ngày 1</span>
          <span>Ngày 10</span>
          <span>Ngày 20</span>
          <span>Ngày 30</span>
        </div>
      </div>

      {/* Backup toolbar */}
      <div className="mt-6 flex flex-wrap gap-2 items-center print:hidden">
        <button
          onClick={handleExport}
          className="px-3.5 py-1.5 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5"
        >
          ⬇️ Tải backup
        </button>
        <label className="px-3.5 py-1.5 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
          ⬆️ Khôi phục
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5"
        >
          🖨️ In cuốn sổ
        </button>
      </div>
    </div>
  );
}
