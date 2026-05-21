// dashboard/src/pages/TestFtnd.tsx
//
// Test FTND 6 câu — overlay full-screen cho user mới (chưa onboarding).
// THAY THẾ OnboardingWizard cũ (cigsBaseline + pricePerCig form).
//
// Flow:
//   1. User mới (no onboardingCompletedAt) → bootstrap redirect /test-ftnd
//   2. 6 câu auto-advance, progress bar
//   3. Submit → backend tính cohort + lưu User.ftndScore + cohortKey severity
//   4. Hiện kết quả + CTA "Vào dashboard" → navigate /
//
// Port từ app/app/test-ftnd/TestFtndForm.tsx (Next.js) → Vite React.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FTND_QUESTIONS,
  COHORT_PLANS,
  getFtndResult,
  estimateCigsBaseline,
  formatVND,
  type FtndAnswer,
  type FtndResult,
} from '../lib/ftnd';
import { api, ApiError } from '../services/api';
import { useStore } from '../state/store';

type Phase = 'questions' | 'submitting' | 'result' | 'redirecting';

export function TestFtnd() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const bootstrap = useStore((s) => s.bootstrap);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<FtndAnswer[]>([]);
  const [phase, setPhase] = useState<Phase>('questions');
  const [result, setResult] = useState<FtndResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = FTND_QUESTIONS.length;
  const question = FTND_QUESTIONS[currentQ];
  const progress = ((currentQ + (answers.length > currentQ ? 1 : 0)) / totalQuestions) * 100;

  // Nếu user đã có onboardingCompletedAt → không nên ở đây, redirect /
  useEffect(() => {
    if (user?.onboardingCompletedAt) {
      navigate('/', { replace: true });
    }
  }, [user?.onboardingCompletedAt, navigate]);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const pronouns = user?.pronouns ?? 'anh';

  function handleAnswer(value: number) {
    const newAnswers = [...answers];
    newAnswers[currentQ] = { q: question.id, a: value };
    setAnswers(newAnswers);

    // Auto-advance 250ms (delight)
    setTimeout(() => {
      if (currentQ < totalQuestions - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        submitTest(newAnswers);
      }
    }, 250);
  }

  async function submitTest(finalAnswers: FtndAnswer[]) {
    setPhase('submitting');
    setError(null);

    try {
      // Compute locally first — backend cũng sẽ recompute (defense in depth)
      const local = getFtndResult(finalAnswers);
      const cigsBaseline = estimateCigsBaseline(finalAnswers[3]?.a ?? 1);
      const pricePerCig = 1000; // Default phổ thông 20k/bao; user có thể chỉnh sau ở /settings

      await api.submitFtndOnboarding({
        cigsBaseline,
        pricePerCig,
        ftndScore: local.score,
        cohort: local.cohort,
        answers: finalAnswers,
      });

      setResult(local);
      setPhase('result');

      // Refresh user store với dữ liệu mới
      bootstrap().catch(() => {});
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `Lỗi ${err.status}: ${(err.body as any)?.message || (err.body as any)?.error || 'Sol chưa lưu được.'}`
          : 'Không kết nối được Sol. Kiểm tra mạng rồi thử lại?';
      setError(msg);
      setPhase('questions');
      setCurrentQ(totalQuestions - 1); // back về câu cuối
    }
  }

  function goBack() {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setError(null);
    }
  }

  function enterDashboard() {
    setPhase('redirecting');
    navigate('/', { replace: true });
  }

  // ─── PHASE: submitting ──────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="fixed inset-0 z-40 bg-sol-bg flex items-center justify-center p-6">
        <div className="sol-card-padded text-center max-w-md">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-sol-green border-t-transparent rounded-full mb-4" />
          <p className="text-h3 font-semibold text-sol-ink">Đang phân tích kết quả…</p>
          <p className="text-body text-sol-ink-2 mt-2">
            Sol đang tính toán Mức Lệ Thuộc của {pronouns}
          </p>
        </div>
      </div>
    );
  }

  // ─── PHASE: result ──────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return <ResultView pronouns={pronouns} result={result} onEnter={enterDashboard} />;
  }

  // ─── PHASE: questions ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-40 bg-sol-bg overflow-y-auto">
      <div className="max-w-xl mx-auto p-6 pb-16">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <div className="text-5xl mb-2" aria-hidden="true">🌅</div>
          <h1 className="text-h2 font-bold text-sol-ink">Test FTND — 6 câu</h1>
          <p className="text-body text-sol-ink-2 mt-1">
            Sol cần hiểu mức lệ thuộc của {pronouns} để chọn lộ trình phù hợp.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 text-meta text-sol-ink-2">
            <span>Câu {currentQ + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}% hoàn thành</span>
          </div>
          <div className="w-full bg-sol-soft rounded-full h-2 overflow-hidden">
            <div
              className="bg-sol-green h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="sol-card-padded">
          <h2 className="text-h3 font-bold text-sol-ink mb-5 leading-snug">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = answers[currentQ]?.a === option.value;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option.value)}
                  className={`min-h-tap w-full text-left px-5 py-4 rounded-2xl border-2 transition-all
                    ${isSelected
                      ? 'border-sol-green bg-sol-green-soft text-sol-ink font-semibold'
                      : 'border-sol-line hover:border-sol-green hover:bg-sol-green-soft/40'
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-sol-green focus-visible:ring-offset-2`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'border-sol-green bg-sol-green text-white' : 'border-sol-ink-3'}`}>
                      {isSelected && '✓'}
                    </span>
                    <span className="text-body">{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-sol-red-soft border border-sol-red text-sol-red-ink rounded-xl text-body">
              ⚠️ {error}
            </div>
          )}

          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={goBack}
              disabled={currentQ === 0}
              className="text-sol-ink-2 hover:text-sol-ink disabled:opacity-30 disabled:cursor-not-allowed text-meta font-medium"
            >
              ← Câu trước
            </button>
            <p className="text-meta text-sol-ink-3">
              Chọn để tự chuyển tiếp
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-meta text-sol-ink-3 text-center mt-6">
          Test FTND (Fagerström) — chuẩn quốc tế từ 1991. Không lưu thông tin cá nhân.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Result view — show cohort + plan + CTA enter dashboard
// ─────────────────────────────────────────────────────────────────────────
interface ResultViewProps {
  pronouns: string;
  result: FtndResult;
  onEnter: () => void;
}

function ResultView({ pronouns, result, onEnter }: ResultViewProps) {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const cohortColors = useMemo(() => {
    return {
      LIGHT: { border: 'border-sol-green', bg: 'bg-sol-green-soft', text: 'text-sol-green-ink' },
      MODERATE: { border: 'border-sol-orange', bg: 'bg-sol-orange-soft', text: 'text-sol-orange-ink' },
      HEAVY: { border: 'border-sol-red', bg: 'bg-sol-red-soft', text: 'text-sol-red-ink' },
    } as const;
  }, []);
  const c = cohortColors[result.cohort];

  return (
    <div className="fixed inset-0 z-40 bg-sol-bg overflow-y-auto">
      <div className="max-w-xl mx-auto p-6 pb-16">
        {/* Hero */}
        <div className="text-center pt-8 mb-6">
          <div className="text-6xl mb-3" aria-hidden="true">{result.plan.emoji}</div>
          <p className="text-meta text-sol-ink-2 uppercase tracking-wider mb-1">Kết quả Test FTND</p>
          <h1 className="text-h1 font-bold text-sol-ink">
            {result.score}/10 — {result.cohort}
          </h1>
          <p className="text-body text-sol-ink-2 mt-1">{result.scoreRange}</p>
        </div>

        {/* Cohort plan card */}
        <div className={`sol-card-padded border-t-4 ${c.border} mb-5`}>
          <p className={`text-meta ${c.text} font-bold uppercase tracking-wider mb-1`}>
            {result.plan.audienceLabel}
          </p>
          <h2 className="text-h2 font-bold text-sol-ink mb-2">{result.plan.name}</h2>
          <p className="text-body text-sol-ink-2 mb-4">{result.plan.description}</p>

          <div className="bg-sol-soft rounded-xl p-4 mb-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-meta text-sol-ink-2">Trọn gói lộ trình</span>
              <span className={`text-h2 font-bold ${c.text}`}>{formatVND(result.plan.totalPrice)}</span>
            </div>
            <p className="text-meta text-sol-ink-3">
              7 ngày Nhận Diện FREE + {result.plan.paidDays} ngày × {formatVND(result.plan.dailyRate)}
            </p>
            <p className="text-meta text-sol-ink-3 mt-1">
              Hoặc trả góp {formatVND(result.plan.weeklyRate)}/tuần
            </p>
          </div>
        </div>

        {/* What it means */}
        <div className="sol-card-padded mb-5">
          <h3 className="text-h3 font-semibold text-sol-ink mb-3">Điều này có nghĩa là gì?</h3>
          <ul className="space-y-2">
            {result.whatItMeans.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-body text-sol-ink-2">
                <span className={c.text}>✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reassurance */}
        <div className="sol-card-padded bg-sol-green-soft/40 border-l-4 border-sol-green mb-5">
          <p className="text-body text-sol-ink">
            <strong>{cap(pronouns)} không một mình.</strong> Khang đã trải qua chính lộ trình này
            và sạch thuốc từ 2021. Sol sẽ đi cùng {pronouns} suốt {result.plan.totalDays} ngày.
          </p>
          <p className="text-meta text-sol-ink-2 mt-2">
            7 ngày đầu hoàn toàn miễn phí. Không cần đặt cọc. Quyết định tiếp sau.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onEnter}
          className="sol-btn-primary w-full min-h-tap text-body font-semibold"
        >
          Vào hành trình ngày 1 →
        </button>

        <p className="text-meta text-sol-ink-3 text-center mt-4">
          Anh sẽ thấy chi tiết 3 gói + cách thanh toán trong app.
        </p>
      </div>
    </div>
  );
}
