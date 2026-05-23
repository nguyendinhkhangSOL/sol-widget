import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { COHORT_PLANS, type Cohort } from '@/lib/ftnd';

export const metadata: Metadata = {
  title: 'Chào mừng đến với Sol',
  robots: { index: false, follow: false }
};

interface PageProps {
  searchParams: { cohort?: string; p?: string };
}

export default function ChaoMungPage({ searchParams }: PageProps) {
  const cohort = (searchParams.cohort || 'MODERATE').toUpperCase() as Cohort;
  const phone = searchParams.p || '';
  const plan = COHORT_PLANS[cohort] || COHORT_PLANS.MODERATE;
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);

  return (
    <>
      <Header />

      <main id="main" className="container-sol py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌱</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-sol-brown mb-3">
            Chào mừng anh đến với Sol!
          </h1>
          <p className="text-lg text-sol-ink2">
            7 ngày Nhận Diện của anh đã bắt đầu
          </p>
        </div>

        {/* Trial countdown */}
        <div className="card-sol bg-sol-cream border-l-4 border-sol-green mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-sol-ink2 uppercase font-semibold">Lộ trình</p>
              <p className="font-bold text-sol-brown mt-1">{plan.name}</p>
            </div>
            <div>
              <p className="text-xs text-sol-ink2 uppercase font-semibold">Trial kết thúc</p>
              <p className="font-bold text-sol-brown mt-1">
                {trialEndDate.toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-sol-ink2 uppercase font-semibold">SĐT Zalo</p>
              <p className="font-bold text-sol-brown mt-1">{phone}</p>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="card-sol mb-6">
          <h2 className="text-xl font-bold text-sol-brown mb-4">📋 3 việc cần làm NGAY</h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-sol-orange text-white font-bold rounded-full flex items-center justify-center">1</span>
              <div>
                <p className="font-semibold text-sol-brown">Kết bạn Zalo với Khang</p>
                <p className="text-sm text-sol-ink2 mb-2">
                  Khang sẽ check Zalo của anh ({phone}) trong 24h và gửi lời mời kết bạn.
                </p>
                <p className="text-xs text-sol-ink2 italic">
                  💡 Tip: Anh có thể chủ động kết bạn trước với Zalo: <strong>{process.env.NEXT_PUBLIC_ADMIN_ZALO || '0967.xxx.xxx'}</strong> (Khang Sol)
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-sol-orange text-white font-bold rounded-full flex items-center justify-center">2</span>
              <div>
                <p className="font-semibold text-sol-brown">Đọc bài Day 1 — 24 giờ đầu bỏ thuốc</p>
                <p className="text-sm text-sol-ink2 mb-2">
                  Hiểu cơ thể anh sẽ trải qua gì trong 24h đầu — chuẩn bị tâm lý sẵn sàng.
                </p>
                <a
                  href="https://sol.vn/ngay-1-24-gio-dau-tien-bo-thuoc-la/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sol-orange font-semibold text-sm hover:underline"
                >
                  Đọc bài →
                </a>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-sol-orange text-white font-bold rounded-full flex items-center justify-center">3</span>
              <div>
                <p className="font-semibold text-sol-brown">Đặt Quit Day trong 3-7 ngày tới</p>
                <p className="text-sm text-sol-ink2">
                  Chọn 1 ngày trong tuần này làm "ngày bắt đầu Tự Do".
                  Sol khuyên: chọn ngày anh ít stress nhất (chủ nhật, hoặc đầu kỳ nghỉ).
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Coming soon — features */}
        <div className="card-sol bg-white mb-6">
          <h2 className="text-xl font-bold text-sol-brown mb-4">🚧 Tính năng đang hoàn thiện</h2>
          <p className="text-sm text-sol-ink2 mb-3">
            Sol đang trong giai đoạn alpha với 500 anh em đầu. Các tính năng dưới đang được Khang hoàn thiện và sẽ release dần trong tháng:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { icon: '🎙️', name: '9 Voice từ Khang', eta: 'Đang thu âm' },
              { icon: '⏱️', name: 'Đếm ngược 90 giây', eta: 'Tuần sau' },
              { icon: '🤖', name: 'AI Mentor 24/7 Zalo', eta: 'Đang train' },
              { icon: '🗺️', name: 'Kế hoạch B phòng thủ', eta: 'Đang dev' },
              { icon: '📊', name: 'Sổ hành trình PDF', eta: 'Day 7+ unlock' },
              { icon: '🤝', name: 'Góc Khoảng Lặng', eta: 'Đang dev' }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sol-brown font-medium flex-1">{f.name}</span>
                <span className="text-xs text-sol-ink2 italic">{f.eta}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-sol-ink2 italic mt-4">
            Trong khi chờ, Khang sẽ Zalo support trực tiếp cho anh.
          </p>
        </div>

        {/* CTA — Cài đặt cá nhân (giúp Sol AI personalize) */}
        <div className="bg-sol-cream border-l-4 border-sol-orange rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">⚙️</div>
            <div className="flex-1">
              <h3 className="font-bold text-sol-brown mb-1">
                Bước 4 (đề xuất): Cài đặt cá nhân — Sol AI sẽ thông minh hơn
              </h3>
              <p className="text-sm text-sol-ink2 mb-3">
                Anh điền lý do bỏ thuốc, danh xưng, tình huống thèm... → AI Mentor sẽ
                <strong> replay nguyên văn lý do của anh</strong> khi anh thèm.
              </p>
              <Link
                href={`/cai-dat?p=${phone}`}
                className="inline-block bg-sol-orange text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition"
              >
                Cài đặt cá nhân (3 phút) →
              </Link>
            </div>
          </div>
        </div>

        {/* CTA day 8 — payment */}
        <div className="bg-sol-brown text-sol-paper rounded-2xl p-6 sm:p-8 text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Sau 7 ngày Nhận Diện
          </h2>
          <p className="opacity-90 mb-4 text-sm">
            Nếu anh thấy Sol hợp và muốn đi tiếp, anh chuyển khoản theo lộ trình:
          </p>
          <Link
            href={`/thanh-toan?cohort=${cohort}&p=${phone}`}
            className="inline-block bg-sol-orange text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-700 transition"
          >
            Xem cách thanh toán →
          </Link>
          <p className="text-xs opacity-70 mt-3">
            Anh có thể xem trước hôm nay, thanh toán bất cứ lúc nào trong 7 ngày trial
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
