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

// Day 9 (2026-05-22): Add 'intro' phase ở đầu — giải thích khoa học + mục đích
// + privacy trước khi user click "Bắt đầu". Tận dụng không gian quảng cáo.
type Phase = 'intro' | 'questions' | 'submitting' | 'result' | 'redirecting';

/** Detect embed mode (?embed=1) — Khang đặt iframe vào sol.vn làm SEO funnel */
function isEmbedMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('embed') === '1';
}

interface ResultPayload {
  result: FtndResult;
  cigsBaseline: number;
  pricePerCig: number;
}

export function TestFtnd() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const bootstrap = useStore((s) => s.bootstrap);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<FtndAnswer[]>([]);
  // Day 9: default 'intro' để user đọc giải thích trước khi click "Bắt đầu"
  const [phase, setPhase] = useState<Phase>('intro');
  const embedMode = useMemo(() => isEmbedMode(), []);
  const [submitStep, setSubmitStep] = useState(0); // 0-3 cho animation submitting
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = FTND_QUESTIONS.length;
  const question = FTND_QUESTIONS[currentQ];
  const progress = ((currentQ + (answers.length > currentQ ? 1 : 0)) / totalQuestions) * 100;

  // Day 9 FIX: chỉ redirect / khi user đã onboarding TỪ TRƯỚC + đang ở
  // intro/questions. KHÔNG redirect khi đang submitting/result (bootstrap()
  // sau submit sẽ set onboardingCompletedAt → tránh cướp Result page).
  // Embed mode: KHÔNG redirect (iframe sol.vn cần đứng yên).
  useEffect(() => {
    if (embedMode) return;
    if (phase !== 'intro' && phase !== 'questions') return;
    if (user?.onboardingCompletedAt) {
      navigate('/', { replace: true });
    }
  }, [user?.onboardingCompletedAt, navigate, phase, embedMode]);

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
    setSubmitStep(0);
    setError(null);

    try {
      // Compute locally first — backend cũng sẽ recompute (defense in depth)
      const local = getFtndResult(finalAnswers);
      const cigsBaseline = estimateCigsBaseline(finalAnswers[3]?.a ?? 1);
      const pricePerCig = 1000; // Default phổ thông 20k/bao; user có thể chỉnh sau ở /settings

      // Day 9 (2026-05-22): Dramatic delay — Sol "đang nghĩ" 3 step ~2.8s
      // tạo anticipation trước khi reveal Result page.
      // Network thật ~200ms; multi-step delay tạo cảm giác Sol phân tích kỹ.
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      // Submit API + animate steps song song để không block
      const submitPromise = api.submitFtndOnboarding({
        cigsBaseline,
        pricePerCig,
        ftndScore: local.score,
        cohort: local.cohort,
        answers: finalAnswers,
      });

      await sleep(800);
      setSubmitStep(1); // "Phân tích cohort..."
      await sleep(900);
      setSubmitStep(2); // "Chọn lộ trình..."
      await sleep(900);
      setSubmitStep(3); // "Sẵn sàng..."
      await sleep(400);

      // Đợi API xong (thường đã xong rồi sau 2.6s sleep)
      await submitPromise;

      setResult({ result: local, cigsBaseline, pricePerCig });
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
    // Day 9 (2026-05-22): Nếu embed mode (iframe trên sol.vn), thoát iframe
    // + redirect parent window về bothuocla.sol.vn root (không phải nested
    // navigate trong iframe).
    if (embedMode && typeof window !== 'undefined') {
      try {
        window.top!.location.href = 'https://bothuocla.sol.vn/';
        return;
      } catch {
        // Fallback nếu cross-origin block (đáng lẽ không xảy ra vì cùng sol.vn)
        window.location.href = 'https://bothuocla.sol.vn/';
        return;
      }
    }
    navigate('/', { replace: true });
  }

  // ─── PHASE: intro — giải thích khoa học + mục đích trước khi bắt đầu ──
  // Day 9 (2026-05-22): tận dụng moment user vừa landing → bán giá trị
  // "Sol cần test trước vì lộ trình mỗi mức nghiện khác nhau"
  // + Privacy commitment + Nguồn khoa học (Fagerström 1991, WHO/CDC)
  if (phase === 'intro') {
    return (
      <div className={embedMode ? 'min-h-screen bg-sol-bg' : 'fixed inset-0 z-40 bg-sol-bg overflow-y-auto'}>
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-16">
          {/* Hero */}
          <div className="text-center pt-8 mb-6">
            <div className="text-6xl mb-3" aria-hidden="true">🌅</div>
            <p className="text-meta text-sol-orange-ink uppercase tracking-wider mb-1 font-bold">
              Test Mức Lệ Thuộc Nicotine
            </p>
            <h1 className="text-h1 font-bold text-sol-ink mb-2">
              Sol cần hiểu {pronouns} trước
            </h1>
            <p className="text-body text-sol-ink-2">
              6 câu hỏi · ~90 giây · Hoàn toàn miễn phí · KHÔNG cần SĐT
            </p>
          </div>

          {/* Section 1: What is FTND? */}
          <div className="sol-card-padded mb-5">
            <h2 className="text-h3 font-semibold text-sol-ink mb-2">
              🧪 Test này là gì?
            </h2>
            <p className="text-body text-sol-ink-2 mb-2">
              <strong>FTND — Fagerström Test for Nicotine Dependence</strong> là
              bộ test chuẩn quốc tế từ <strong>1991</strong>, được bác sĩ + nghiên cứu cai
              thuốc dùng toàn cầu để đo mức "đói nicotine" sinh học.
            </p>
            <p className="text-body text-sol-ink-2">
              Chia 3 mức: <span className="font-semibold text-sol-green-ink">NHẸ (0-3)</span>{' · '}
              <span className="font-semibold text-sol-orange-ink">TRUNG BÌNH (4-6)</span>{' · '}
              <span className="font-semibold text-sol-red-ink">NẶNG (7-10)</span>.
            </p>
          </div>

          {/* Section 2: Why Sol needs test first */}
          <div className="sol-card-padded mb-5 bg-sol-green-soft/40 border-l-4 border-sol-green">
            <h2 className="text-h3 font-semibold text-sol-ink mb-2">
              🎯 Tại sao Sol cần biết trước?
            </h2>
            <p className="text-body text-sol-ink-2 mb-3">
              App cai thuốc khác thường áp dụng <strong>1 lộ trình cho tất cả</strong> — thất bại vì mỗi mức nghiện
              cần thời gian + công cụ rất khác nhau.
            </p>
            <ul className="space-y-1.5 text-body text-sol-ink-2">
              <li>🟢 <strong>NHẸ</strong>: 35 ngày — phá thói quen tâm lý là chính</li>
              <li>🟡 <strong>TRUNG BÌNH</strong>: 52 ngày — cần combo công cụ + thời gian</li>
              <li>🔴 <strong>NẶNG</strong>: 65 ngày — Q-Day muộn hơn + voice nhiều hơn</li>
            </ul>
            <p className="text-meta text-sol-ink-3 mt-3 italic">
              Sol cá nhân hoá lộ trình cho {pronouns} ngay sau test.
            </p>
          </div>

          {/* Section 3: Privacy commitment */}
          <div className="sol-card-padded mb-5">
            <h2 className="text-h3 font-semibold text-sol-ink mb-2">
              🛡️ Quyền riêng tư của {pronouns}
            </h2>
            <ul className="space-y-1.5 text-body text-sol-ink-2">
              <li>✓ KHÔNG cần điền SĐT / email để làm test</li>
              <li>✓ Kết quả CHỈ lưu để Sol chọn lộ trình — KHÔNG share với ai</li>
              <li>✓ KHÔNG bán dữ liệu cá nhân — chính sách rõ trên sol.vn</li>
              <li>✓ Anh có thể xoá account bất kỳ lúc nào trong Cài đặt</li>
            </ul>
          </div>

          {/* Section 4: Scientific source */}
          <div className="sol-card-padded mb-6 bg-sol-soft">
            <h2 className="text-h3 font-semibold text-sol-ink mb-2">
              📚 Nguồn khoa học
            </h2>
            <p className="text-body text-sol-ink-2 mb-2">
              Heatherton TF, Kozlowski LT, Frecker RC, Fagerström KO (1991).
              "The Fagerström Test for Nicotine Dependence: a revision of the Fagerström Tolerance Questionnaire."
              <em> Br J Addict.</em> 86(9): 1119–1127.
            </p>
            <p className="text-meta text-sol-ink-3">
              Khuyến nghị bởi WHO, CDC, Bộ Y tế Việt Nam — dùng trong tất cả phòng khám cai thuốc.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => setPhase('questions')}
            className="sol-btn-primary w-full min-h-tap text-body font-bold py-3 text-lg"
          >
            🚀 Bắt đầu test 6 câu (90 giây) →
          </button>

          <p className="text-meta text-sol-ink-3 text-center mt-3">
            Test xong, Sol sẽ trả kết quả ngay + đề xuất lộ trình cá nhân hoá.
          </p>

          {/* Embed mode: link sol.vn */}
          {embedMode && (
            <p className="text-meta text-center mt-6 pt-4 border-t border-sol-line">
              <a
                href="https://sol.vn/khang-sol"
                target="_top"
                rel="noopener noreferrer"
                className="text-sol-orange-ink hover:underline"
              >
                📖 Đọc thêm về Khang Sol trên sol.vn →
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── PHASE: submitting — multi-step animation 2.8s ──────────────────────
  // Day 9 (2026-05-22): Dramatic pause cho user cảm "Sol đang nghĩ kỹ"
  // trước khi reveal Result page (vốn rất ấn tượng + dài).
  if (phase === 'submitting') {
    const steps = [
      { emoji: '📊', label: 'Tính FTND score…', detail: '6 câu trả lời của ' + pronouns },
      { emoji: '🧠', label: 'Phân tích mức lệ thuộc…', detail: 'So sánh với 500 anh em khác' },
      { emoji: '🗺️', label: 'Chọn lộ trình phù hợp…', detail: '35 / 52 / 65 ngày' },
      { emoji: '✨', label: 'Sẵn sàng!', detail: 'Sol đã hiểu ' + pronouns },
    ];
    return (
      <div className="fixed inset-0 z-40 bg-sol-bg flex items-center justify-center p-6">
        <div className="sol-card-padded text-center max-w-md w-full">
          <div className="text-6xl mb-4 animate-pulse" aria-hidden="true">
            {steps[submitStep].emoji}
          </div>
          <p className="text-h3 font-semibold text-sol-ink mb-1">
            {steps[submitStep].label}
          </p>
          <p className="text-body text-sol-ink-2 mb-5">
            {steps[submitStep].detail}
          </p>

          {/* Step progress dots */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i < submitStep
                    ? 'w-8 bg-sol-green'
                    : i === submitStep
                    ? 'w-12 bg-sol-green animate-pulse'
                    : 'w-2 bg-sol-line'
                }`}
              />
            ))}
          </div>
          <p className="text-meta text-sol-ink-3">
            Step {submitStep + 1}/{steps.length}
          </p>
        </div>
      </div>
    );
  }

  // ─── PHASE: result ──────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <ResultView
        pronouns={pronouns}
        result={result.result}
        cigsBaseline={result.cigsBaseline}
        pricePerCig={result.pricePerCig}
        answers={answers}
        onEnter={enterDashboard}
      />
    );
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
// Result view — Marketing landing 8 section (Day 9 — 2026-05-22)
// "Moment of truth" sau khi user khám phá mức nghiện → bán giá trị trước
// CTA. KHÔNG auto-redirect — user chủ động scroll + click.
// ─────────────────────────────────────────────────────────────────────────
interface ResultViewProps {
  pronouns: string;
  result: FtndResult;
  cigsBaseline: number;
  pricePerCig: number;
  answers: FtndAnswer[];
  onEnter: () => void;
}

function ResultView({ pronouns, result, cigsBaseline, pricePerCig, answers, onEnter }: ResultViewProps) {
  const cohortColors = useMemo(() => ({
    LIGHT:    { border: 'border-sol-green',  bg: 'bg-sol-green-soft',  text: 'text-sol-green-ink' },
    MODERATE: { border: 'border-sol-orange', bg: 'bg-sol-orange-soft', text: 'text-sol-orange-ink' },
    HEAVY:    { border: 'border-sol-red',    bg: 'bg-sol-red-soft',    text: 'text-sol-red-ink' },
  } as const), []);
  const c = cohortColors[result.cohort];

  // ─── Personalized shock numbers ──────────────────────────────────────
  const ASSUMED_YEARS = 10;
  const dailyCost = cigsBaseline * pricePerCig;
  const yearlyCost = dailyCost * 365;
  const lifetimeCost = yearlyCost * ASSUMED_YEARS;
  const minutesLostPerCig = 11; // WHO/CDC — Doll 2004
  const lifetimeCigs = cigsBaseline * 365 * ASSUMED_YEARS;
  const lifeDaysLost = Math.round((lifetimeCigs * minutesLostPerCig) / (60 * 24));
  const trialSavings = dailyCost * 7;
  const cohortLabel = result.cohort === 'LIGHT' ? 'NHẸ' : result.cohort === 'MODERATE' ? 'TRUNG BÌNH' : 'NẶNG';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const Pn = cap(pronouns);
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div className="fixed inset-0 z-40 bg-sol-bg overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">

        {/* ═══════ 1. Hero — Cohort revealed ═══════ */}
        <div className="text-center pt-8 mb-4">
          {/* Test completed banner */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sol-green-soft border border-sol-green rounded-full text-meta text-sol-green-ink font-semibold mb-4">
            <span aria-hidden>✓</span>
            <span>Test FTND xong — 6/6 câu</span>
          </div>

          <div className="text-7xl mb-3" aria-hidden="true">{result.plan.emoji}</div>
          <p className="text-meta text-sol-ink-2 uppercase tracking-wider mb-1">
            Kết quả Test FTND của {pronouns}
          </p>
          <h1 className="text-[40px] leading-tight font-bold text-sol-ink">
            {result.score}/10
          </h1>
          <p className={`text-h2 font-bold ${c.text} mt-1`}>Mức lệ thuộc {cohortLabel}</p>
          <p className="text-body text-sol-ink-2 mt-2">
            {result.plan.audienceLabel} · {result.scoreRange}
          </p>
        </div>

        {/* ═══════ Reading hint + collapsible xem lại 6 câu ═══════ */}
        <div className="text-center mb-6">
          <p className="text-meta text-sol-ink-2 mb-3 animate-pulse">
            👇 Cuộn xuống đọc — Sol đã chuẩn bị 7 thông tin cá nhân hoá cho {pronouns}
          </p>
          <details className="inline-block">
            <summary className="text-meta text-sol-ink-3 hover:text-sol-ink cursor-pointer">
              📝 Xem lại 6 câu trả lời của {pronouns}
            </summary>
            <div className="text-left mt-3 p-4 bg-sol-soft rounded-xl max-w-md mx-auto">
              {FTND_QUESTIONS.map((q, i) => {
                const ans = answers[i];
                const opt = ans ? q.options.find((o) => o.value === ans.a) : null;
                return (
                  <div key={q.id} className="mb-2 text-meta">
                    <strong className="text-sol-ink">Câu {q.id}.</strong>{' '}
                    <span className="text-sol-ink-2">{q.question}</span>
                    <div className="ml-4 text-sol-green-ink mt-0.5">
                      → {opt?.label || '(chưa trả lời)'}{' '}
                      <span className="text-sol-ink-3">({ans?.a ?? '?'} điểm)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </div>

        {/* ═══════ 2. Personalized shock — Money + life lost ═══════ */}
        <div className={`sol-card-padded ${c.bg} border-l-4 ${c.border} mb-6`}>
          <p className={`text-meta ${c.text} font-bold uppercase tracking-wide mb-3`}>
            💸 Cái giá của thói quen
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-meta text-sol-ink-3">Mỗi ngày</div>
              <div className={`text-h3 font-bold ${c.text}`}>{fmt(dailyCost)}đ</div>
              <div className="text-meta text-sol-ink-3 mt-1">{cigsBaseline} điếu</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-meta text-sol-ink-3">Mỗi năm</div>
              <div className={`text-h3 font-bold ${c.text}`}>{fmt(Math.round(yearlyCost / 1000))}k</div>
              <div className="text-meta text-sol-ink-3 mt-1">12 tháng</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-meta text-sol-ink-3">10 năm qua</div>
              <div className={`text-h3 font-bold ${c.text}`}>{fmt(Math.round(lifetimeCost / 1000000))}tr</div>
              <div className="text-meta text-sol-ink-3 mt-1">tiền đã đốt</div>
            </div>
          </div>
          <p className="text-body text-sol-ink mb-1">
            Và <strong className="text-sol-red-ink">~{lifeDaysLost} ngày sống</strong> đã mất theo
            ({fmt(lifetimeCigs)} điếu × 11 phút/điếu — WHO 2004).
          </p>
          <p className="text-meta text-sol-ink-3 italic">
            * Ước tính theo {cigsBaseline} điếu/ngày × 10 năm. {Pn} chỉnh chi tiết được trong Cài đặt.
          </p>
        </div>

        {/* ═══════ 3. Điều này có nghĩa là gì ═══════ */}
        <div className="sol-card-padded mb-6">
          <h3 className="text-h3 font-semibold text-sol-ink mb-3">
            🧠 Điều này có nghĩa gì với {pronouns}?
          </h3>
          <ul className="space-y-2">
            {result.whatItMeans.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-body text-sol-ink-2">
                <span className={c.text + ' font-bold mt-0.5'}>✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ═══════ 4. Lộ trình 88 ngày timeline ═══════ */}
        <div className="sol-card-padded mb-6">
          <h3 className="text-h3 font-semibold text-sol-ink mb-1">
            🗺️ Lộ trình Sol cho {pronouns}
          </h3>
          <p className="text-meta text-sol-ink-3 mb-4">
            {result.plan.totalDays} ngày · {result.plan.freeDays} ngày FREE + {result.plan.paidDays} ngày × {formatVND(result.plan.dailyRate)}
          </p>

          <div className="space-y-3">
            {[
              { phase: 1, day: '1-7',  emoji: '🌱', name: 'Nhận Thức', desc: `Sol quan sát — ${pronouns} chưa cần bỏ thuốc. Chỉ ghi hút lúc nào, vì sao.`, highlight: true },
              { phase: 2, day: '8-28', emoji: '⚡', name: 'Hành Động', desc: 'Giảm dần. Chuẩn bị Q-Day. Khang gửi Voice cho từng phase.' },
              { phase: 3, day: '29-58', emoji: '🔥', name: 'Giải Phóng', desc: 'Q-Day! 30 ngày khúc cua. AI Mentor 24/7. Khang nhắn Zalo 7h sáng.' },
              { phase: 4, day: '59-88', emoji: '🌅', name: 'Tái Thiết', desc: `${Pn} KHÔNG còn là người hút thuốc. Sol đi cùng tới khi vững.` },
            ].map((p) => (
              <div
                key={p.phase}
                className={`flex gap-3 p-3 rounded-xl ${p.highlight ? 'bg-sol-green-soft border-2 border-sol-green' : 'bg-sol-soft'}`}
              >
                <div className="text-3xl flex-shrink-0">{p.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <strong className="text-body text-sol-ink">Phase {p.phase} — {p.name}</strong>
                    <span className="text-meta text-sol-ink-3">Day {p.day}</span>
                    {p.highlight && (
                      <span className="text-[10px] uppercase tracking-wide font-bold bg-sol-green text-white px-2 py-0.5 rounded-full">
                        Bắt đầu 7 ngày FREE
                      </span>
                    )}
                  </div>
                  <p className="text-meta text-sol-ink-2">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ 5. Sol có 6 điểm khác ═══════ */}
        <div className="sol-card-padded mb-6">
          <h3 className="text-h3 font-semibold text-sol-ink mb-3">
            ⭐ Sol khác app cai thuốc khác thế nào?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '🤖', title: 'AI Mentor 24/7', desc: 'Gemini 2.5 trả lời cá nhân hoá giọng anh em — không phải bot dịch máy.' },
              { icon: '🎧', title: 'Voice Khang Sol', desc: 'Khang đã sạch thuốc từ 2021. Voice riêng cho từng phase, không AI.' },
              { icon: '💬', title: '101 câu trả lời sẵn', desc: 'CHIP intent matcher — thèm gì cũng có sẵn 1-click, không cần gõ.' },
              { icon: '🛡️', title: '"Khoảng Lặng" ẩn danh', desc: 'Tâm sự ẩn danh với cộng đồng — không lộ Zalo cá nhân.' },
              { icon: '🚪', title: 'Rút lui văn minh', desc: 'Hoàn tiền ngày chưa dùng. Không ràng buộc bằng tiền cọc.' },
              { icon: '📊', title: 'Tracking thực tế', desc: 'Tiết kiệm tiền, ngày sống thêm, streak — số liệu của riêng anh.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-2 p-3 bg-sol-soft rounded-lg">
                <div className="text-2xl flex-shrink-0">{item.icon}</div>
                <div>
                  <div className="text-body font-semibold text-sol-ink">{item.title}</div>
                  <div className="text-meta text-sol-ink-2">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ 6. Khang là ai ═══════ */}
        <div className="sol-card-padded bg-sol-earth-soft border-l-4 border-sol-earth mb-6">
          <div className="flex items-start gap-3">
            <div className="text-5xl flex-shrink-0">🌅</div>
            <div>
              <p className="text-meta text-sol-earth-ink font-bold uppercase tracking-wide mb-1">
                Khang là ai?
              </p>
              <p className="text-body text-sol-ink mb-2">
                Tôi là <strong>Khang Sol</strong> — kỹ sư IT, đã sạch thuốc từ 2021 sau 12 năm hút.
                Sol là app tôi tự code, tự vận hành 1 mình + AI Gemini.
              </p>
              <p className="text-body text-sol-ink-2 mb-3">
                Không phải bác sĩ. Không bán thuốc. Chỉ chia sẻ trải nghiệm thực + công cụ
                để {pronouns} không phải đi một mình như tôi đã đi.
              </p>
              <a
                href="https://sol.vn/khang-sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-meta text-sol-earth-ink font-semibold hover:underline"
              >
                📖 Đọc câu chuyện Khang trên sol.vn →
              </a>
            </div>
          </div>
        </div>

        {/* ═══════ 7. FAQ ngắn 3 câu ═══════ */}
        <div className="sol-card-padded mb-6">
          <h3 className="text-h3 font-semibold text-sol-ink mb-3">
            ❓ {Pn} đang phân vân?
          </h3>
          <div className="space-y-3">
            {[
              {
                q: 'Tôi đã thử bỏ nhiều lần thất bại — Sol có khác không?',
                a: 'Khác. Sol không bắt anh "không hút". 7 ngày đầu chỉ quan sát. Phase 2 giảm dần. Q-Day Day 28 mới bỏ thật. Lapse được phép — không reset, chỉ học từ đó.',
              },
              {
                q: '5.000đ/ngày — sao rẻ vậy? Có gì gài không?',
                a: `7 ngày Nhận Diện FREE thật. Sau đó ${fmt(dailyCost)}đ/ngày anh đã đốt thuốc nay đầu tư cho app. Không lưu thẻ, không auto-charge. Khang đang tri ân 500 anh em đầu — giá thật sẽ là 9k/ngày.`,
              },
              {
                q: 'Tôi không muốn vợ con biết tôi tải app cai thuốc',
                a: 'Sol hoàn toàn ẩn danh. Không cần SĐT thật ngay. Không thông báo Zalo. App hiện như app đọc tin tức bình thường.',
              },
            ].map((faq, i) => (
              <details key={i} className="cursor-pointer">
                <summary className="text-body font-semibold text-sol-ink py-2">
                  {faq.q}
                </summary>
                <p className="text-meta text-sol-ink-2 mt-1 pl-4 border-l-2 border-sol-line">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
          <p className="text-meta text-sol-ink-3 mt-4">
            Xem đầy đủ FAQ + bảng giá khi vào hành trình → /pricing
          </p>
        </div>

        {/* ═══════ 8. Final CTA — block ở cuối (KHÔNG sticky) ═══════ */}
        {/* Day 9: bỏ sticky CTA — force user scroll qua hết 7 section content
            trên rồi mới thấy nút "Vào hành trình". Tránh user click sớm bỏ qua
            marketing content. */}
        <div className={`sol-card-padded border-t-4 ${c.border} shadow-xl bg-sol-paper mt-8`}>
          <p className={`text-meta ${c.text} font-bold uppercase tracking-wide text-center mb-2`}>
            Đã đọc hết · Sẵn sàng đi?
          </p>
          <h3 className="text-h2 font-bold text-sol-ink text-center mb-3">
            7 ngày đầu hoàn toàn FREE
          </h3>
          <p className="text-meta text-sol-ink-2 text-center mb-4">
            Tiết kiệm ngay <strong className={c.text}>{fmt(trialSavings)}đ</strong> tuần này.
            Không đặt cọc. Bất kỳ lúc nào dừng = ngắt đồng hành.
          </p>

          <button
            onClick={onEnter}
            className="sol-btn-primary w-full min-h-tap text-body font-bold py-3 text-lg"
          >
            🌱 Tiếp tục hành trình ngày 1 →
          </button>

          <a
            href="https://sol.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-meta text-sol-ink-3 mt-3 hover:text-sol-ink"
          >
            Hoặc đọc Wiki Bỏ Thuốc 150+ bài (sol.vn) trước khi quyết →
          </a>
        </div>

        {/* Footer */}
        <p className="text-meta text-sol-ink-3 text-center mt-6">
          Sol không phải cơ sở y tế · không bán thuốc · không kê đơn<br />
          Liên hệ Khang: <a href="https://zalo.me/3049397094672064963" className="text-sol-blue">Zalo OA</a>
          {' · '}
          <a href="mailto:nguyendinhkhang@gmail.com" className="text-sol-blue">khang@sol.vn</a>
        </p>
      </div>
    </div>
  );
}
