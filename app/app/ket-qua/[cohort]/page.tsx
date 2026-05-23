import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { COHORT_PLANS, type Cohort, formatVND } from '@/lib/ftnd';

interface PageProps {
  params: { cohort: string };
  searchParams: { score?: string; id?: string };
}

const VALID_COHORTS: Cohort[] = ['LIGHT', 'MODERATE', 'HEAVY'];

const WHAT_IT_MEANS: Record<Cohort, string[]> = {
  LIGHT: [
    'Anh không cần điếu đầu tiên ngay sau khi thức dậy',
    'Anh dễ nhịn ở nơi cấm hút',
    'Cơn thèm chỉ đến ở vài thời điểm cụ thể (sau ăn, lúc nhậu)',
    'Não chưa hoàn toàn "nghiện" sinh học',
    'Cai chủ yếu là vượt thói quen + tâm lý'
  ],
  MODERATE: [
    'Anh cần điếu đầu trong 30-60 phút sau khi thức',
    'Anh hút khoảng 11-20 điếu/ngày',
    'Khó nhịn ở nơi cấm hút',
    'Cơn thèm dày đặc buổi sáng',
    'Đa số anh em ở mức này — cần lộ trình bài bản'
  ],
  HEAVY: [
    'Anh hút trong 5-30 phút sau khi thức',
    'Hút trên 20 điếu/ngày (1 gói trở lên)',
    'Không thể nhịn ở nơi cấm hút',
    'Hút cả khi ốm bệnh nằm liệt giường',
    'Não đã quen liều cao — cần combo công cụ + thời gian dài'
  ]
};

const COHORT_STYLES: Record<Cohort, { borderClass: string; textClass: string; bgClass: string }> = {
  LIGHT: { borderClass: 'border-sol-green', textClass: 'text-sol-green', bgClass: 'bg-green-50' },
  MODERATE: { borderClass: 'border-sol-amber', textClass: 'text-sol-amber', bgClass: 'bg-amber-50' },
  HEAVY: { borderClass: 'border-sol-red', textClass: 'text-sol-red', bgClass: 'bg-red-50' }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cohort = params.cohort.toUpperCase() as Cohort;
  if (!VALID_COHORTS.includes(cohort)) {
    return { title: 'Không tìm thấy kết quả' };
  }
  const plan = COHORT_PLANS[cohort];
  return {
    title: `Kết quả Test FTND — ${plan.name}`,
    description: `Mức Lệ Thuộc của anh phù hợp với ${plan.name} (${plan.audienceLabel}).`,
    robots: { index: false, follow: false }
  };
}

export default function ResultPage({ params, searchParams }: PageProps) {
  const cohortKey = params.cohort.toUpperCase() as Cohort;
  if (!VALID_COHORTS.includes(cohortKey)) notFound();

  const plan = COHORT_PLANS[cohortKey];
  const style = COHORT_STYLES[cohortKey];
  const meanings = WHAT_IT_MEANS[cohortKey];
  const score = parseInt(searchParams.score || '0', 10);
  const testId = searchParams.id;

  return (
    <>
      <Header />

      <main id="main" className="container-sol py-8">
        {/* Hero score */}
        <div className={`card-sol border-t-8 ${style.borderClass} text-center mb-6`}>
          <div className="text-6xl mb-2">{plan.emoji}</div>
          <p className="text-sm text-sol-ink2 mb-1">Lộ trình phù hợp với anh:</p>
          <h1 className={`text-3xl sm:text-4xl font-bold ${style.textClass} mb-2`}>
            {plan.name}
          </h1>
          <p className="text-sm text-sol-ink2">
            FTND score: <strong>{score}/10 điểm</strong> · {plan.audienceLabel}
          </p>
        </div>

        {/* What it means */}
        <div className="card-sol mb-6">
          <h2 className="text-xl font-bold text-sol-brown mb-4">
            Điều này có nghĩa là gì?
          </h2>
          <ul className="space-y-2">
            {meanings.map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sol-ink2">
                <span className={style.textClass}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sol đề xuất */}
        <div className={`card-sol ${style.bgClass} mb-6`}>
          <h2 className="text-xl font-bold text-sol-brown mb-3">Sol đề xuất</h2>
          <p className="text-sol-ink2 mb-4">{plan.description}</p>

          <div className="bg-white rounded-xl p-5 border-2 border-sol-orange">
            <h3 className="font-bold text-sol-brown text-lg">{plan.name}</h3>
            <p className={`text-3xl font-bold ${style.textClass} mt-1`}>
              {formatVND(plan.totalPrice)}
            </p>
            <p className="text-xs text-sol-ink2 mt-1 mb-3">
              ({plan.freeDays} ngày free + {plan.paidDays} ngày × {formatVND(plan.dailyRate)})
            </p>

            <div className="text-sm text-sol-ink2 space-y-1 mb-4">
              <p>✓ 7 ngày Nhận Diện <strong>hoàn toàn miễn phí</strong></p>
              <p>✓ Trợ lý AI Mentor 24/7 qua Zalo</p>
              <p>✓ 9 đoạn Voice xương máu từ Khang</p>
              <p>✓ Đồng hồ đếm ngược 90 giây</p>
              <p>✓ Sổ hành trình điện tử PDF</p>
            </div>

            <Link
              href={`/onboarding?cohort=${cohortKey}${testId ? `&t=${testId}` : ''}`}
              className="block text-center btn-primary w-full"
            >
              🌱 Bắt đầu 7 ngày Nhận Diện FREE →
            </Link>
            <p className="text-center text-xs text-sol-ink2 mt-2">
              Không cần SĐT để bắt đầu · Không cam kết
            </p>
          </div>
        </div>

        {/* Triết lý */}
        <div className="card-sol bg-sol-cream mb-6">
          <h2 className="font-bold text-sol-brown mb-2">📢 Lời nhắn từ Khang</h2>
          <p className="text-sm text-sol-ink2 mb-2">
            Sol KHÔNG bán cam kết "cai 100%". Sol bán <strong>chi phí hạ tầng</strong> (server + Zalo OA + AI API) ở mức tối thiểu để hệ thống tự vận hành.
          </p>
          <p className="text-sm text-sol-ink2">
            5.000đ/ngày là mức tri ân cho 500 anh em đầu tiên (giá gốc 9.000đ/ngày).
            Anh muốn dừng lúc nào, dừng lúc đó — KHÔNG auto-charge.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-sol-ink2 text-center opacity-70 max-w-xl mx-auto mb-6">
          ⚠️ FTND là công cụ tham khảo, không thay thế chẩn đoán y khoa.
          Sol KHÔNG phải sản phẩm y tế · Khang KHÔNG phải bác sĩ.
        </div>

        {/* Retake test */}
        <div className="text-center">
          <Link href="/test-ftnd" className="text-sol-ink2 hover:text-sol-brown text-sm underline">
            ↻ Làm lại test
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
