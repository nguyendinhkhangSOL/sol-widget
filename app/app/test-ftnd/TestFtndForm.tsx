'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FTND_QUESTIONS, type FtndAnswer } from '@/lib/ftnd';

export function TestFtndForm() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<FtndAnswer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = FTND_QUESTIONS.length;
  const question = FTND_QUESTIONS[currentQ];
  const progress = ((currentQ + (answers.length > currentQ ? 1 : 0)) / totalQuestions) * 100;

  function handleAnswer(value: number) {
    const newAnswers = [...answers];
    newAnswers[currentQ] = { q: question.id, a: value };
    setAnswers(newAnswers);

    // Auto-advance after 250ms (delight)
    setTimeout(() => {
      if (currentQ < totalQuestions - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        submitTest(newAnswers);
      }
    }, 250);
  }

  async function submitTest(finalAnswers: FtndAnswer[]) {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/test-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi không xác định');
      }

      // Track GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ftnd_completed', {
          ftnd_score: data.score,
          cohort: data.cohort
        });
      }

      // Redirect to result page (cohort lowercase for URL aesthetics)
      router.push(`/ket-qua/${data.cohort.toLowerCase()}?score=${data.score}&id=${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      setSubmitting(false);
    }
  }

  function goBack() {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setError(null);
    }
  }

  if (submitting) {
    return (
      <div className="card-sol text-center py-12">
        <div className="inline-block animate-spin w-12 h-12 border-4 border-sol-orange border-t-transparent rounded-full mb-4" />
        <p className="text-lg font-semibold text-sol-brown">Đang phân tích kết quả...</p>
        <p className="text-sm text-sol-ink2 mt-2">Sol đang tính toán Mức Lệ Thuộc của anh</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 text-sm text-sol-ink2">
          <span>Câu {currentQ + 1} / {totalQuestions}</span>
          <span>{Math.round(progress)}% hoàn thành</span>
        </div>
        <div className="w-full bg-sol-cream rounded-full h-2 overflow-hidden">
          <div
            className="bg-sol-orange h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="card-sol">
        <h2 className="text-xl sm:text-2xl font-bold text-sol-brown mb-6 leading-snug">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = answers[currentQ]?.a === option.value;
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option.value)}
                disabled={submitting}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all
                  ${isSelected
                    ? 'border-sol-orange bg-sol-orange/10 text-sol-brown font-semibold'
                    : 'border-sol-cream hover:border-sol-orange hover:bg-sol-cream'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-sol-orange focus:ring-offset-2`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? 'border-sol-orange bg-sol-orange text-white' : 'border-sol-ink2'}`}>
                    {isSelected && '✓'}
                  </span>
                  <span>{option.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={goBack}
            disabled={currentQ === 0 || submitting}
            className="text-sol-ink2 hover:text-sol-brown disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
          >
            ← Câu trước
          </button>
          <p className="text-xs text-sol-ink2">
            Chọn câu trả lời để tự động chuyển tiếp
          </p>
        </div>
      </div>
    </div>
  );
}
