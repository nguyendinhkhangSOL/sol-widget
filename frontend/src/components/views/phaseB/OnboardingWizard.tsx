// frontend/src/components/views/phaseB/OnboardingWizard.tsx
// Phase B Day 1 — 1 step wizard hỏi cigsBaseline + pricePerCig.
// Hiện overlay khi user chưa có onboardingCompletedAt.
//
// Triết lý: HỎI MỘT CÂU. Không lecture. Không hỏi tuổi, năm hút, ftnd, lý do.
// Đó là deep profile — push vào Settings sau, không cần để bắt đầu.

import { useState } from 'react';
import { api, ApiError } from '../../../services/api';

export interface OnboardingWizardProps {
  pronouns?: string;
  onCompleted: (payload: {
    cigsBaseline: number;
    pricePerCig: number;
    quitDate: string;
  }) => void;
}

// Preset: 25k/pack 20 = 1.250đ/điếu (rẻ — VN phổ thông)
//         40k/pack 20 = 2.000đ/điếu (Vinataba/Marlboro local)
//         60k/pack 20 = 3.000đ/điếu (premium)
const PRICE_PRESETS = [
  { label: 'Rẻ ~25k/bao', value: 1250 },
  { label: 'Phổ thông ~40k', value: 2000 },
  { label: 'Premium ~60k+', value: 3000 },
];

const CIG_PRESETS = [
  { label: '½ bao', value: 10 },
  { label: '1 bao', value: 20 },
  { label: '1½ bao', value: 30 },
  { label: '2 bao+', value: 40 },
];

export function OnboardingWizard({ pronouns = 'bạn', onCompleted }: OnboardingWizardProps) {
  const [cigsBaseline, setCigsBaseline] = useState<number>(20);
  const [pricePerCig, setPricePerCig] = useState<number>(1250);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const dailyCost = cigsBaseline * pricePerCig;
  const monthlyCost = dailyCost * 30;
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  async function submit() {
    if (cigsBaseline < 1 || cigsBaseline > 60) {
      setError('Số điếu/ngày phải trong khoảng 1-60.');
      return;
    }
    if (pricePerCig < 100 || pricePerCig > 50000) {
      setError('Giá mỗi điếu phải trong khoảng 100đ - 50.000đ.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const r = await api.submitOnboardingBaseline({ cigsBaseline, pricePerCig });
      onCompleted({
        cigsBaseline: r.user.cigsBaseline,
        pricePerCig: r.user.pricePerCig,
        quitDate: r.user.quitDate,
      });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? `Lỗi ${e.status}: ${e.body?.message || e.body?.error || 'Sol chưa lưu được.'}`
          : 'Không kết nối được Sol. Kiểm tra mạng rồi thử lại?';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-sol-bg overflow-y-auto">
      <div className="max-w-md mx-auto p-5 pb-24">
        {/* ─── Logo + tagline ─────────────────────────────────────────── */}
        <div className="pt-6 mb-6 text-center">
          <div className="text-5xl mb-3" aria-hidden="true">🌅</div>
          <h1 className="text-h1 text-sol-ink">Chào {pronouns}</h1>
          <p className="text-body text-sol-ink-2 mt-2 leading-relaxed">
            Sol cần biết 2 điều để bắt đầu đi cùng {pronouns}.
            <br />
            <span className="text-meta text-sol-ink-3">Không cần khai tên, không cần SĐT.</span>
          </p>
        </div>

        {/* ─── Cigs baseline ──────────────────────────────────────────── */}
        <div className="bg-sol-paper border border-sol-line rounded-2xl p-5 mb-4 shadow-card">
          <div className="text-meta font-semibold text-sol-ink mb-1">
            1. Hôm nay {pronouns} thường hút bao nhiêu điếu một ngày?
          </div>
          <p className="text-meta text-sol-ink-3 mb-4">
            Số trung bình cũng được — Sol không phán xét. Đây là baseline để Sol đo nhịp.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {CIG_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setCigsBaseline(p.value)}
                className={`min-h-tap py-2.5 rounded-lg border text-meta font-semibold transition ${
                  cigsBaseline === p.value
                    ? 'bg-sol-green-soft border-sol-green text-sol-green-ink'
                    : 'bg-sol-paper border-sol-line text-sol-ink-2 hover:bg-sol-soft'
                }`}
              >
                <div>{p.label}</div>
                <div className="text-[11px] opacity-70">{p.value} điếu</div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-meta text-sol-ink-2 shrink-0">Hoặc nhập số:</label>
            <input
              type="number"
              min={1}
              max={60}
              value={cigsBaseline}
              onChange={(e) => setCigsBaseline(parseInt(e.target.value, 10) || 0)}
              className="flex-1 border border-sol-line rounded-lg px-3 py-2 text-body bg-sol-paper text-center font-semibold"
              placeholder="20"
            />
            <span className="text-meta text-sol-ink-2 shrink-0">điếu/ngày</span>
          </div>
        </div>

        {/* ─── Price per cigarette ────────────────────────────────────── */}
        <div className="bg-sol-paper border border-sol-line rounded-2xl p-5 mb-4 shadow-card">
          <div className="text-meta font-semibold text-sol-ink mb-1">
            2. {cap(pronouns)} hút loại nào?
          </div>
          <p className="text-meta text-sol-ink-3 mb-4">
            Sol dùng giá này để tính tiền {pronouns} đang tiêu — và sau này tiết kiệm.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPricePerCig(p.value)}
                className={`min-h-tap py-2.5 px-2 rounded-lg border text-meta font-semibold transition ${
                  pricePerCig === p.value
                    ? 'bg-sol-orange-soft border-sol-orange text-sol-orange-ink'
                    : 'bg-sol-paper border-sol-line text-sol-ink-2 hover:bg-sol-soft'
                }`}
              >
                <div className="text-[12px] leading-tight">{p.label}</div>
                <div className="text-[11px] opacity-70 mt-1">
                  {fmt(p.value)}đ/điếu
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-meta text-sol-ink-2 shrink-0">Hoặc nhập:</label>
            <input
              type="number"
              min={100}
              max={50000}
              step={100}
              value={pricePerCig}
              onChange={(e) => setPricePerCig(parseInt(e.target.value, 10) || 0)}
              className="flex-1 border border-sol-line rounded-lg px-3 py-2 text-body bg-sol-paper text-center font-semibold"
              placeholder="1250"
            />
            <span className="text-meta text-sol-ink-2 shrink-0">đ/điếu</span>
          </div>
        </div>

        {/* ─── Reflection ─────────────────────────────────────────────── */}
        <div className="bg-sol-blue-soft/40 border border-sol-blue/20 rounded-2xl p-4 mb-5">
          <div className="text-meta font-semibold text-sol-blue-ink mb-1">📊 Sol đang ghi nhận</div>
          <p className="text-meta text-sol-ink leading-relaxed">
            {cap(pronouns)} đang chi <strong>{fmt(dailyCost)}đ/ngày</strong> = <strong>{fmt(monthlyCost)}đ/tháng</strong>.
            Sol sẽ tính tiết kiệm {pronouns} dựa trên số này.
          </p>
        </div>

        {/* ─── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-sol-red-soft border border-sol-red/30 rounded-lg p-3 mb-4 text-meta text-sol-red-ink">
            {error}
          </div>
        )}

        {/* ─── CTA ────────────────────────────────────────────────────── */}
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full min-h-tap py-3.5 rounded-xl bg-sol-green text-white font-semibold text-body shadow-card hover:brightness-110 active:scale-[.99] disabled:opacity-50 transition"
        >
          {submitting ? 'Sol đang ghi nhận…' : 'Bắt đầu đi cùng Sol →'}
        </button>

        <p className="text-[12px] text-sol-ink-3 text-center mt-3 italic">
          Sol bắt đầu Phase 1 — Nhận Thức. 7 ngày đầu chỉ quan sát, không ép.
        </p>
      </div>
    </div>
  );
}
