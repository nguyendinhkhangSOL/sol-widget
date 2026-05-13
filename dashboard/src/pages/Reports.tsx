// dashboard/src/pages/Reports.tsx
// Báo cáo cá nhân — Day-10 (Khởi động) + Day-30 Album (Đồng hành).
// Stub MVP: lấy data từ checkins + workbook + tier state, render report
// bố cục đơn giản. PDF export dùng window.print().

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useStore } from '../state/store';
import type { CheckIn, TierMe } from '../types';
import { formatVnd, hasFeature } from '../lib/featureGates';

export function Reports() {
  const user = useStore((s) => s.user);
  const [tier, setTier] = useState<TierMe | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTierMe(), api.getCheckins(60)])
      .then(([t, c]) => {
        setTier(t);
        setCheckins(c.checkins);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !tier) {
    return <div className="p-8 text-sol-ink-2">Đang tải…</div>;
  }

  const eff = tier.effectiveTier;
  const canDay10 = hasFeature(eff, 'report.day10');
  const canDay30 = hasFeature(eff, 'report.day30_album');

  const cleanDays = checkins.filter((c) => !c.smoked).length;
  const moodAvg =
    checkins.length === 0 ? 0 : checkins.reduce((s, c) => s + (c.mood ?? 3), 0) / checkins.length;
  const cigsPerDay = (user as any)?.settings?.cigsPerDay ?? 10;
  const pricePerCig = (user as any)?.settings?.pricePerCig ?? 1000; // Sol v4 — 20k/bao
  const moneySaved = cleanDays * cigsPerDay * pricePerCig;

  // Sol v4 — anh's FTND score nếu có (từ onboarding). Cohort suy ra từ score.
  const ftnd = (user as any)?.ftndScore as number | undefined;
  const ftndCohort: 'LIGHT' | 'MODERATE' | 'HEAVY' | null =
    ftnd == null ? null : ftnd <= 3 ? 'LIGHT' : ftnd <= 6 ? 'MODERATE' : 'HEAVY';

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-sol-ink">Báo cáo cá nhân</h1>
        <button onClick={() => window.print()} className="btn-secondary">
          🖨️ In / lưu PDF
        </button>
      </div>

      {/* Sol v4 — Mức Lệ Thuộc của anh (cohort reference) */}
      <article className="mb-6 bg-white border border-sol-line rounded-2xl p-5 print:break-inside-avoid">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
            Mức Lệ Thuộc · Lộ trình của anh
          </div>
          {ftnd != null && (
            <div className="text-meta text-sol-ink-2">
              Điểm FTND: <strong className="text-sol-ink">{ftnd}/10</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <CohortMiniCard
            color="#16A34A" bg="#F0FDF4" emoji="🟢" label="Nhẹ"
            ftnd="0-3" days={35} isMine={ftndCohort === 'LIGHT'}
          />
          <CohortMiniCard
            color="#D97706" bg="#FEF3C7" emoji="🟡" label="Vừa"
            ftnd="4-6" days={52} isMine={ftndCohort === 'MODERATE'}
          />
          <CohortMiniCard
            color="#DC2626" bg="#FEE2E2" emoji="🔴" label="Nặng"
            ftnd="7-10" days={65} isMine={ftndCohort === 'HEAVY'}
          />
        </div>

        {ftndCohort && (
          <div className="mt-3 text-meta text-sol-ink-2 leading-snug">
            Anh ở <strong className="text-sol-ink">Lộ trình {ftndCohort === 'LIGHT' ? 'Nhẹ' : ftndCohort === 'HEAVY' ? 'Nặng' : 'Vừa'}</strong>
            {' '}— Sol đang cá nhân hoá nội dung, voice và tần suất nhắc theo mức lệ thuộc của anh.
            Số liệu báo cáo bên dưới được tính theo lộ trình này.
          </div>
        )}
        {!ftndCohort && (
          <div className="mt-3 text-meta text-sol-ink-2 leading-snug">
            Anh chưa làm bài test Mức Lệ Thuộc.{' '}
            <a href="/pricing" className="text-sol-orange font-semibold underline">Làm test 6 câu (2 phút) →</a>
          </div>
        )}
      </article>

      {!canDay10 && !canDay30 && (
        <div className="bg-sol-orange-soft border border-sol-orange/30 rounded-2xl p-5">
          <div className="font-semibold">Mở khoá báo cáo</div>
          <p className="text-meta text-sol-ink-2 mt-1">
            Báo cáo Ngày 7 (kết chặng Nhận Diện) có trong mọi lộ trình có trả phí.
            Album Hành Trình đầy đủ có khi anh đi qua chặng Làm Chủ và Tốt Nghiệp.
            <br />
            <a href="/pricing" className="text-sol-orange font-semibold underline">Xem 3 lộ trình × 4 cách trả →</a>
          </p>
        </div>
      )}

      {canDay10 && (
        <article className="bg-white border border-sol-line rounded-2xl p-6 print:break-inside-avoid">
          <div className="text-meta uppercase tracking-wider text-sol-green-ink font-semibold">
            Báo cáo Ngày 10
          </div>
          <h2 className="text-xl font-bold text-sol-ink mt-1 mb-4">
            {user?.name}, bạn đã đi được 10 ngày
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <Stat label="Ngày sạch" value={`${cleanDays}/10`} />
            <Stat label="Tâm trạng TB" value={moodAvg.toFixed(1) + '/5'} />
            <Stat label="Tiền tiết kiệm" value={formatVnd(moneySaved)} />
          </div>

          <h3 className="font-semibold text-body mt-4 mb-2">Khang nói:</h3>
          <p className="text-body text-sol-ink-2 leading-relaxed">
            Sol v3 — 7 ngày Nhận Diện + 14 ngày Kiểm Soát đã đi qua, đến đây receptor nicotine
            trong não anh đã giảm khoảng 40%. Nửa đầu là quan sát + kỷ luật, nửa sau (Làm Chủ 30 ngày)
            là <span className="font-semibold text-sol-ink">bảo vệ thành quả</span>.
            {!hasFeature(eff, 'report.day30_album') && (
              <> Đừng để 30 ngày Làm Chủ tới phá hỏng 21 ngày qua — gói 🔴 Làm Chủ sẽ là tấm khiên đến Day 52.</>
            )}
          </p>
        </article>
      )}

      {canDay30 && (
        <article className="mt-6 bg-white border border-sol-line rounded-2xl p-6 print:break-inside-avoid">
          <div className="text-meta uppercase tracking-wider text-sol-orange-ink font-semibold">
            Album hành trình
          </div>
          <h2 className="text-xl font-bold text-sol-ink mt-1 mb-4">
            {checkins.length >= 30
              ? `${user?.name}, bạn đã hoàn thành 30 ngày!`
              : `${user?.name}, đây là hành trình của bạn cho đến nay`}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Stat label="Ngày sạch" value={`${cleanDays}`} />
            <Stat label="Streak dài nhất" value={`${user?.longestStreak ?? 0}`} />
            <Stat label="Tâm trạng TB" value={moodAvg.toFixed(1) + '/5'} />
            <Stat label="Tiền tiết kiệm" value={formatVnd(moneySaved)} />
          </div>
          <p className="text-body text-sol-ink-2 leading-relaxed">
            Ít hơn 10% người đạt được cột mốc này trong lần đầu thử cai. Đây
            là kỳ tích thật sự. Khang chúc mừng và mong bạn ở lại 30 ngày bảo trì
            — phần "bảo vệ" còn quan trọng hơn phần "đạt".
          </p>
        </article>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sol-paper rounded-xl p-3 text-center border border-sol-line">
      <div className="text-meta uppercase text-sol-ink-3 font-semibold">{label}</div>
      <div className="text-lg font-bold text-sol-ink mt-1 tabular-nums">{value}</div>
    </div>
  );
}

// Sol v4 — Mini card hiển thị 1 lộ trình trong bảng 3 Mức Lệ Thuộc
function CohortMiniCard({
  color, bg, emoji, label, ftnd, days, isMine,
}: {
  color: string; bg: string; emoji: string;
  label: string; ftnd: string; days: number; isMine: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 text-center transition"
      style={{
        background: isMine ? bg : '#FAFAF8',
        border: isMine ? `2px solid ${color}` : '1px solid #E8DFC8',
        boxShadow: isMine ? `0 0 0 3px ${color}22` : undefined,
      }}
    >
      <div className="text-base">{emoji}</div>
      <div className="text-meta font-bold mt-0.5" style={{ color: isMine ? color : '#5C3A1E' }}>
        {label}
      </div>
      <div className="text-[10px] text-sol-ink-3 mt-0.5">FTND {ftnd}</div>
      <div className="text-lg font-bold text-sol-ink mt-1 tabular-nums">
        {days}<span className="text-[10px] text-sol-ink-3 font-normal ml-0.5">ngày</span>
      </div>
      {isMine && (
        <div className="mt-1 text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
          ✓ Của anh
        </div>
      )}
    </div>
  );
}
