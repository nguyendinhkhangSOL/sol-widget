import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TestFtndForm } from './TestFtndForm';

export const metadata: Metadata = {
  title: 'Test FTND — Đánh giá Mức Lệ Thuộc Nicotin',
  description:
    'Bài test 6 câu chuẩn Fagerström (Heatherton 1991) — biết Mức Lệ Thuộc của anh: Nhẹ / Vừa / Nặng. ' +
    'Miễn phí. 2 phút. Không cần đăng ký để làm.',
  alternates: {
    canonical: 'https://bothuocla.sol.vn/test-ftnd'
  },
  openGraph: {
    title: 'Test FTND — Đánh giá Mức Lệ Thuộc Nicotin | Đi Cùng Sol',
    description: 'Bài test 6 câu chuẩn Fagerström biết Mức Lệ Thuộc của anh: Nhẹ / Vừa / Nặng.',
    url: 'https://bothuocla.sol.vn/test-ftnd'
  }
};

export default function TestFtndPage() {
  return (
    <>
      <Header />

      <main id="main" className="container-sol py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-sol-brown mb-3">
            Test FTND — 6 câu hỏi
          </h1>
          <p className="text-sol-ink2 max-w-xl mx-auto">
            Bài test chuẩn <strong>Fagerström</strong> (Heatherton 1991) — đo Mức Lệ Thuộc Nicotin của anh.
            Trả lời thật để Sol đề xuất lộ trình phù hợp.
          </p>
          <p className="text-sm text-sol-ink2 mt-2">
            ⏱️ 2 phút · Miễn phí · Bảo mật thông tin
          </p>
        </div>

        <TestFtndForm />

        <div className="mt-12 card-sol bg-sol-cream">
          <h2 className="font-bold text-sol-brown mb-2">Về bài test FTND</h2>
          <p className="text-sm text-sol-ink2 mb-2">
            <strong>FTND</strong> (Fagerström Test for Nicotine Dependence) là bài test chuẩn quốc tế
            được dùng trong y tế từ năm 1991, được dịch ra hơn 40 ngôn ngữ.
          </p>
          <p className="text-sm text-sol-ink2 mb-2">
            Sol dịch sang tiếng Việt + adapt cho ngữ cảnh nam giới Việt 45+ (hỏi về Vinataba, nhậu, Tết).
          </p>
          <p className="text-xs text-sol-ink2 opacity-80">
            Reference: Heatherton TF, Kozlowski LT, Frecker RC, Fagerström KO (1991).
            "The Fagerström Test for Nicotine Dependence: a revision of the Fagerström Tolerance Questionnaire."
            Br J Addict. 86(9):1119–27.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
