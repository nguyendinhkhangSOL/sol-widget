import { IDENTITY, Phase, type PhaseLanguage } from '../../lib/recovery';

const QUOTES_DRAMATIC: Record<string, string> = {
  newcomer: '"Bước đầu tiên luôn dũng cảm nhất. Bạn đã dám chọn."',
  survivor72: '"72h đầu là trận lớn nhất — và bạn đã vượt qua."',
  week1: '"Tuần đầu tiên hoàn chỉnh. Não đang xây lại hệ thống dopamine tự nhiên."',
  rebuilder: '"28 ngày tái thiết. Phổi và mạch máu đang hoạt động như một cơ thể khác."',
  reborn: '"3 tháng — ho mãn tính biến mất. Cilia đã tái tạo."',
  light: '"1 năm ánh sáng. Tim mạch nguy cơ đã giảm 50%."',
  companion: '"Bạn đã trở thành ngọn đèn — soi đường cho người khác."',
};

const QUOTES_CLINICAL: Record<string, string> = {
  newcomer: '"Day 0 — first hour after last cigarette. Most cessation attempts fail in the first week."',
  survivor72: '"Past peak withdrawal at 72h. Symptoms decrease ~50% every 1–2 days from here."',
  week1: '"Week 1 cleared. Dopamine baseline beginning to recover."',
  rebuilder: '"Day 28 — post-acute consolidation. Lung cilia regenerating, vessels stabilizing."',
  reborn: '"Month 3 — chronic cough resolved. Pulmonary cilia regrown."',
  light: '"Year 1 stable — coronary heart disease risk reduced ~50%."',
  companion: '"Year 2+ — suitable for mentor role."',
};

const TROPHIES = ['🥉', '🥈', '🥇', '🏆', '💎', '👑', '⭐'];

interface Props {
  hours: number;
  phase: Phase;
  phaseLanguage?: PhaseLanguage;
  onShare: () => void;
  onCopy: () => void;
}

export function GloryCard({ hours, phase, phaseLanguage = 'dramatic', onShare, onCopy }: Props) {
  let currentIdx = 0;
  for (let i = 0; i < IDENTITY.length; i++) {
    if (hours >= IDENTITY[i].atHours) currentIdx = i;
  }
  const id = IDENTITY[currentIdx];
  const days = Math.floor(hours / 24);
  const QUOTES = phaseLanguage === 'clinical' ? QUOTES_CLINICAL : QUOTES_DRAMATIC;
  const title = phaseLanguage === 'clinical' && id.clinicalTitle ? id.clinicalTitle : id.title;
  const headerLabel = phaseLanguage === 'clinical' ? 'Hall of progress' : 'Không gian vinh danh';
  const dayLabel = phaseLanguage === 'clinical' ? `Day ${days} · ${phase.label}` : `🔥 Ngày ${days} · Giai đoạn ${phase.label}`;

  return (
    <>
      <div className="text-[11px] uppercase tracking-wider mb-2.5" style={{ color: 'rgba(255,255,255,.55)' }}>
        {headerLabel}
      </div>
      <div
        className="relative overflow-hidden rounded-[15px] p-4 mb-4"
        style={{ background: 'rgba(193,126,42,.1)', border: '1px solid rgba(193,126,42,.22)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 35%, rgba(193,126,42,.08) 50%, transparent 65%)',
            animation: 'sol-shimmer 4s infinite linear',
          }}
        />
        <style>{`@keyframes sol-shimmer { 0%{transform:translateX(-30%)} 100%{transform:translateX(30%)} }`}</style>

        <div className="flex items-center gap-3 mb-3 relative">
          <div
            className="w-11 h-11 rounded-full border flex items-center justify-center text-[18px] flex-shrink-0"
            style={{ background: 'rgba(193,126,42,.14)', borderColor: 'rgba(193,126,42,.4)' }}
          >
            {id.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium" style={{ color: '#FAD99A' }}>
              {title}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,.72)' }}>
              {dayLabel}
            </div>
          </div>
          <div className="text-[22px] ml-auto">{TROPHIES[Math.min(currentIdx, TROPHIES.length - 1)]}</div>
        </div>

        <div
          className="text-[13px] italic leading-[1.7] border-l-2 pl-2.5 mb-3 relative"
          style={{ color: 'rgba(255,255,255,.85)', borderColor: '#C17E2A' }}
        >
          {QUOTES[id.key]}
        </div>

        <div className="flex gap-1.5 relative">
          <button
            onClick={onShare}
            className="flex-1 px-2 py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5"
            style={{ background: '#C17E2A', color: '#fff' }}
          >
            📸 Chia sẻ thành tích
          </button>
          <button
            onClick={onCopy}
            className="flex-1 px-2 py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.75)' }}
          >
            📋 Sao chép
          </button>
        </div>
      </div>
    </>
  );
}
