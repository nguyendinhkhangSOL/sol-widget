// frontend/src/components/views/GreetingView.tsx
// Landing screen shown when the panel opens — quick actions.

import { useStore } from '../../state/store';

export function GreetingView() {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);
  const name = user?.name ?? 'bạn';
  const pronoun = user?.pronouns ?? 'bạn';
  const streak = user?.checkinStreak ?? 0;

  const hour = new Date().getHours();
  const salute = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="h-full flex flex-col p-5 gap-4 overflow-y-auto">
      <div>
        <div className="text-xs text-sol-ink/60">{salute}</div>
        <h2 className="text-xl font-semibold text-sol-ink">
          {pronoun} {name} ơi
        </h2>
        {streak > 0 && (
          <div className="mt-1 text-sm text-sol-green">Chuỗi {streak} ngày — tiếp tục nhé.</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickCard
          label="Check-in hôm nay"
          sub="30 giây"
          color="bg-sol-green"
          onClick={() => setView('checkin')}
        />
        <QuickCard
          label="Bài tập hôm nay"
          sub="5 phút"
          color="bg-sol-blue"
          onClick={() => setView('exercise')}
        />
        <QuickCard
          label="Nhắn SOL"
          sub="hỏi, tâm sự"
          color="bg-sol-orange"
          onClick={() => setView('chat')}
        />
        <QuickCard
          label="Tôi đang thèm"
          sub="SOS 90 giây"
          color="bg-sol-red"
          onClick={() => setView('crisis')}
        />
      </div>

      <div className="mt-auto text-[11px] text-sol-ink/50 text-center">
        SOL không thay thế bác sĩ. Nếu khẩn cấp, gọi 115.
      </div>
    </div>
  );
}

function QuickCard({
  label,
  sub,
  color,
  onClick,
}: {
  label: string;
  sub: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl p-3 text-left shadow-sm hover:opacity-95 active:scale-[0.98] transition`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[11px] opacity-90">{sub}</div>
    </button>
  );
}
