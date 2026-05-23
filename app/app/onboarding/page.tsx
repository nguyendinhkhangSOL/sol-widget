import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { COHORT_PLANS, type Cohort } from '@/lib/ftnd';
import { OnboardingForm } from './OnboardingForm';

export const metadata: Metadata = {
  title: 'Bắt đầu 7 ngày Nhận Diện miễn phí',
  description: '7 ngày Nhận Diện hoàn toàn miễn phí. Chỉ cần SĐT Zalo. Không cam kết.',
  robots: { index: false, follow: false }
};

interface PageProps {
  searchParams: { cohort?: string; t?: string };
}

const VALID_COHORTS: Cohort[] = ['LIGHT', 'MODERATE', 'HEAVY'];

export default function OnboardingPage({ searchParams }: PageProps) {
  const cohortParam = (searchParams.cohort || '').toUpperCase() as Cohort;
  if (!VALID_COHORTS.includes(cohortParam)) {
    // No cohort → redirect to test
    redirect('/test-ftnd');
  }

  const plan = COHORT_PLANS[cohortParam];
  const testId = searchParams.t;

  return (
    <>
      <Header />

      <main id="main" className="container-sol py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{plan.emoji}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-sol-brown mb-2">
            Bắt đầu chặng <span className="text-sol-orange">Nhận Diện</span>
          </h1>
          <p className="text-lg text-sol-brown font-semibold">{plan.name}</p>
          <p className="text-sm text-sol-ink2 mt-1">{plan.audienceLabel}</p>
        </div>

        {/* Free trial highlight */}
        <div className="card-sol bg-sol-cream border-l-4 border-sol-green text-center mb-6">
          <p className="text-2xl font-bold text-sol-green mb-1">
            🎁 7 ngày MIỄN PHÍ
          </p>
          <p className="text-sm text-sol-ink2">
            Không tính phí · Không cần nhập thẻ · Tự động dừng nếu không tiếp tục
          </p>
        </div>

        {/* Form */}
        <OnboardingForm cohort={cohortParam} testResultId={testId ? parseInt(testId, 10) : undefined} />

        {/* What happens next */}
        <div className="max-w-xl mx-auto mt-8">
          <h2 className="font-bold text-sol-brown text-center mb-4">Sau khi đăng ký, anh sẽ:</h2>
          <ol className="space-y-3">
            {[
              { day: 'NGAY', text: 'Vào Dashboard Sol — bắt đầu Day 1 ngay' },
              { day: 'DAY 1-3', text: 'Voice "24 giờ đầu" + Đồng hồ 90 giây + AI Mentor sẵn sàng' },
              { day: 'DAY 3-7', text: 'Tự setup "Kế hoạch B" cho 5 tình huống nguy cơ cá nhân' },
              { day: 'DAY 7', text: 'Quyết định: đi tiếp với 5k/ngày hoặc dừng — không charge tự động' }
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-20 bg-sol-orange text-white font-bold text-xs px-2 py-1 rounded text-center self-start">
                  {step.day}
                </span>
                <span className="text-sm text-sol-ink2 pt-0.5">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Privacy */}
        <div className="max-w-xl mx-auto mt-8 card-sol bg-white">
          <h3 className="font-bold text-sol-brown mb-2 text-sm">🔒 Bảo mật & Quyền tự quyết</h3>
          <ul className="text-xs text-sol-ink2 space-y-1.5">
            <li>• SĐT chỉ dùng để: tạo account + nhắc qua Zalo OA + Khang nhắn tin support</li>
            <li>• KHÔNG bán, KHÔNG share cho bên thứ 3</li>
            <li>• Anh có thể yêu cầu xoá data bất cứ lúc nào</li>
            <li>• KHÔNG auto-charge — anh chủ động chuyển khoản mỗi kỳ</li>
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
}
