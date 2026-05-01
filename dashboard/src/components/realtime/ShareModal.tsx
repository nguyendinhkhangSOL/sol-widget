import { Phase, MILESTONES, calcSavings, formatVndFull, formatLifeAdded, IDENTITY } from '../../lib/recovery';

interface Props {
  open: boolean;
  onClose: () => void;
  hours: number;
  phase: Phase;
  userName: string;
}

export function ShareModal({ open, onClose, hours, phase, userName }: Props) {
  if (!open) return null;

  const days = Math.floor(hours / 24);
  const { cigsNotSmoked, amount, lifeMinutes } = calcSavings(hours);
  const doneMs = MILESTONES.filter((m) => hours >= m.atHours).slice(-3);

  let currentIdx = 0;
  for (let i = 0; i < IDENTITY.length; i++) {
    if (hours >= IDENTITY[i].atHours) currentIdx = i;
  }
  const id = IDENTITY[currentIdx];

  const shareText = `🌟 SOL — ${userName} đang cai thuốc\n${days} ngày không hút · ${phase.label}\n— ${cigsNotSmoked} điếu không đốt\n— ${formatVndFull(amount)} tiết kiệm\n— ${formatLifeAdded(lifeMinutes)} tuổi thọ\n${id.title} 🔥\nhttps://bothuocla.sol.vn`;

  const encoded = encodeURIComponent(shareText);
  const urlOnly = encodeURIComponent('https://bothuocla.sol.vn');

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[300] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.65)' }}
    >
      <div
        className="w-full max-w-[480px] max-h-[92vh] overflow-y-auto px-5 pt-5 pb-8"
        style={{ background: '#FAF8F5', borderRadius: '20px 20px 0 0' }}
      >
        <div className="w-8 h-1 rounded-full mx-auto mb-4" style={{ background: '#E8E2D8' }} />
        <h2 className="text-base font-medium text-sol-ink mb-1">Khoe thành tích Sol</h2>
        <p className="text-[13px] text-sol-ink/60 mb-4">
          Card thành tích của anh — chia sẻ lên bất kỳ đâu
        </p>

        {/* Share card preview */}
        <div className="rounded-[13px] p-[18px] mb-4" style={{ background: '#1A1612' }}>
          <div className="text-[13px] font-medium mb-3 font-serif" style={{ color: 'rgba(245,230,200,.6)' }}>
            S<em className="not-italic" style={{ color: '#C17E2A' }}>o</em>l · Cai thuốc bằng nội lực
          </div>
          <div className="font-serif font-light leading-none" style={{ fontSize: 42, color: '#F5E6C8' }}>
            {days}
          </div>
          <div className="text-[12px] mt-1 mb-3" style={{ color: 'rgba(255,255,255,.72)' }}>
            ngày không hút thuốc
          </div>
          <div
            className="inline-block text-[10px] font-medium px-2.5 py-1 rounded-md mb-3"
            style={{ background: '#C17E2A', color: '#fff' }}
          >
            {phase.label}
          </div>
          <div className="flex gap-2 mb-2.5">
            <Stat v={cigsNotSmoked.toString()} l="điếu không đốt" />
            <Stat v={formatVndFull(amount).replace('đ', '')} l="đồng tiết kiệm" />
            <Stat v={formatLifeAdded(lifeMinutes)} l="tuổi thọ" />
          </div>
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {doneMs.map((m) => (
              <span
                key={m.key}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(255,255,255,.09)', color: 'rgba(255,255,255,.6)' }}
              >
                {m.icon} {m.name}
              </span>
            ))}
          </div>
          <div
            className="text-[10px] text-center pt-2 border-t"
            style={{ color: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.06)' }}
          >
            bothuocla.sol.vn · Tham gia miễn phí
          </div>
        </div>

        {/* Social */}
        <div className="text-[11px] font-semibold uppercase tracking-wider text-sol-ink/50 mb-2.5">
          Chia sẻ lên mạng xã hội
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Social href={`https://www.facebook.com/sharer/sharer.php?u=${urlOnly}&quote=${encoded}`} bg="#1877F2" label="Facebook" />
          <Social href={`https://zalo.me/share?u=${urlOnly}&t=${encoded}`} bg="#0068FF" label="Zalo" />
          <Social href={`https://twitter.com/intent/tweet?text=${encoded}`} bg="#000" label="X / Twitter" />
          <Social href={`https://t.me/share/url?url=${urlOnly}&text=${encoded}`} bg="#229ED9" label="Telegram" />
          <Social href="https://www.tiktok.com/upload?lang=vi" bg="#010101" label="TikTok" />
          <Social href="https://www.threads.net/" bg="#101010" label="Threads" />
        </div>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex-1 h-px bg-black/10" />
          <span className="text-[11px] text-sol-ink/50">hoặc</span>
          <div className="flex-1 h-px bg-black/10" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigator.clipboard?.writeText(shareText)}
            className="w-full px-3 py-3 rounded-xl text-[14px] font-semibold"
            style={{ background: '#F5E6C8', color: '#6B4C20' }}
          >
            📋 Sao chép text — dán vào bất kỳ đâu
          </button>
          <button
            onClick={() => alert('Để chụp màn hình:\n\n• Windows: Win + Shift + S\n• Mac: Cmd + Shift + 4\n• iPhone: Nút nguồn + Tăng âm lượng\n• Android: Nút nguồn + Giảm âm lượng')}
            className="w-full px-3 py-3 rounded-xl text-[13px] font-medium border"
            style={{ background: '#F2EEE8', borderColor: '#E8E2D8', color: '#5A4F42' }}
          >
            📸 Hướng dẫn chụp màn hình
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[13px] text-sol-ink/50"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex-1 rounded-md py-2 text-center" style={{ background: 'rgba(255,255,255,.08)' }}>
      <div className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,.92)' }}>{v}</div>
      <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,.7)' }}>{l}</div>
    </div>
  );
}

function Social({ href, bg, label }: { href: string; bg: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{ background: bg }}
    >
      <span className="text-[13px] font-semibold text-white">{label}</span>
    </a>
  );
}
