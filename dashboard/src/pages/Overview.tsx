import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { RealtimeDashboard } from '../components/realtime/RealtimeDashboard';
import { DEFAULT_CIGS_PER_DAY, DEFAULT_PRICE_PER_CIG } from '../lib/recovery';

// Demo dashboard cho user chưa đặt Q-Day — fake quitDate = 7 ngày trước.
// Giữ ổn định trong 1 phiên, ngày 7 đủ ra "1 tuần sạch" + milestones nhiều
// + tiền tiết kiệm có số ấn tượng để CTA mạnh hơn.
const DEMO_DAY_NUMBER = 7;
const DEMO_QUIT_DATE_ISO = new Date(
  Date.now() - DEMO_DAY_NUMBER * 24 * 60 * 60 * 1000,
).toISOString();

export function Overview() {
  const user = useStore((s) => s.user);
  const checkins = useStore((s) => s.checkins);
  const loading = useStore((s) => s.loading);
  const navigate = useNavigate();

  const dayNumber = useMemo(() => {
    if (!user?.quitDate) return 1;
    const diff = Math.floor((Date.now() - new Date(user.quitDate).getTime()) / 86400000);
    return Math.max(1, Math.min(30, diff + 1));
  }, [user?.quitDate]);

  const todayCheckin = checkins.find((c) => c.dayNumber === dayNumber);
  const refundEligible = user?.refundEligible ?? true;
  const displayName = user?.name ?? 'bạn';
  const cigsPerDay = user?.settings?.cigsPerDay ?? DEFAULT_CIGS_PER_DAY;
  const pricePerCig = user?.settings?.pricePerCig ?? DEFAULT_PRICE_PER_CIG;
  const phaseLanguage = user?.settings?.phaseLanguage ?? 'dramatic';

  const hasQDay = !!user?.quitDate;
  // Đang bootstrap (chưa có user) → render skeleton, KHÔNG flash banner cam.
  // Tránh hiệu ứng "banner xuất hiện rồi bị đồng hồ che mất" khi user đã có quitDate.
  const isBootstrapping = loading && !user;

  return (
    <div className="w-full max-w-[1100px] mx-auto p-4 lg:p-6 pb-24 lg:pb-6 space-y-5">
      <header className="px-1">
        <div className="text-meta text-sol-ink-3">Xin chào</div>
        <h1 className="text-h1 text-sol-ink">
          {user?.pronouns ? user.pronouns + ' ' : ''}
          {displayName}
        </h1>
      </header>

      {isBootstrapping ? (
        <div className="rounded-2xl border border-sol-line bg-sol-paper p-8 text-center text-sol-ink-3 text-meta">
          Đang tải dữ liệu của bạn…
        </div>
      ) : !hasQDay ? (
        // ─── PRE-Q-DAY: banner CTA + DEMO dashboard ─────────────────────
        // Để user lần đầu thấy ngay "phần thưởng" — đồng hồ chạy thật,
        // milestones, tiền tiết kiệm với số demo. Gắn ribbon DEMO rõ ràng
        // để không nhầm là dữ liệu của họ.
        <>
          <div
            className="rounded-2xl p-6 border-2 border-dashed"
            style={{ background: '#fff7ed', borderColor: '#fdba74' }}
          >
            <div className="flex items-start gap-4 flex-wrap">
              <div className="text-4xl leading-none">🚦</div>
              <div className="flex-1 min-w-[240px]">
                <div className="text-h3 font-bold text-sol-ink">
                  Bạn chưa đặt Q-Day
                </div>
                <p className="text-body text-sol-ink-2 mt-1 leading-relaxed">
                  Cai thuốc là quyết định lớn — không phải cú nhấn nút.
                  Trước khi đồng hồ chạy thật, hãy hoàn thành{' '}
                  <strong>2 mục bắt buộc</strong> trong checklist chuẩn bị
                  (~5 phút).
                </p>
                <Link
                  to="/q-day-checklist"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-3 rounded-xl bg-sol-orange text-white font-bold shadow-sm hover:shadow-md transition"
                >
                  Bắt đầu chuẩn bị →
                </Link>
              </div>
            </div>
          </div>

          {/* DEMO ribbon + dashboard demo */}
          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-sol-orange text-white text-meta font-bold shadow-md whitespace-nowrap flex items-center gap-1.5">
              <span>🎬</span>
              <span>BẢN DEMO — đặt Q-Day để biến đồng hồ này thành của bạn</span>
            </div>
            <RealtimeDashboard
              quitDate={DEMO_QUIT_DATE_ISO}
              userName={displayName}
              cigsPerDay={cigsPerDay}
              pricePerCig={pricePerCig}
              yearsSmoked={user?.yearsSmoked}
              phaseLanguage={phaseLanguage}
              refundEligible={true}
              dayNumber={DEMO_DAY_NUMBER}
              hasTodayCheckin={true}
              todayCraving={3}
              todayMood={4}
              checkinStreak={DEMO_DAY_NUMBER}
              longestStreak={DEMO_DAY_NUMBER}
              onCheckin={() => navigate('/q-day-checklist')}
              layout="wide"
            />
          </div>

          {/* CTA cuối — nhắc lại sau khi user xem demo xong */}
          <div className="rounded-xl border border-sol-orange/40 bg-sol-orange/5 p-4 text-center">
            <div className="text-body text-sol-ink-2 mb-3">
              Thích những gì bạn thấy ở trên? Đây sẽ là dữ liệu thật của
              bạn sau khi kích hoạt Q-Day.
            </div>
            <Link
              to="/q-day-checklist"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sol-orange text-white font-bold shadow-sm hover:shadow-md transition"
            >
              🚀 Bắt đầu chuẩn bị Q-Day →
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* REALTIME HERO — đồng hồ, hồi phục cơ thể, identity, glory, SOS, alerts */}
          <RealtimeDashboard
            quitDate={user?.quitDate}
            userName={displayName}
            cigsPerDay={cigsPerDay}
            pricePerCig={pricePerCig}
            yearsSmoked={user?.yearsSmoked}
            phaseLanguage={phaseLanguage}
            refundEligible={refundEligible}
            dayNumber={dayNumber}
            hasTodayCheckin={!!todayCheckin}
            todayCraving={todayCheckin?.cravingIntensity}
            todayMood={todayCheckin?.mood}
            checkinStreak={user?.checkinStreak ?? 0}
            longestStreak={user?.longestStreak ?? 0}
            onCheckin={() => navigate('/chat')}
            layout="wide"
          />

          {/* Footnote — link sang trang nguồn lâm sàng */}
          <div className="text-meta text-sol-ink-3 text-center px-2 leading-relaxed">
            Các con số trên dựa trên WHO / NHS / CDC / Surgeon General Report —{' '}
            <Link to="/science" className="text-sol-blue underline">
              📚 xem tham khảo nghiên cứu
            </Link>
            .
          </div>
        </>
      )}
    </div>
  );
}

