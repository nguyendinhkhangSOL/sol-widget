import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { COHORT_PLANS, formatVND } from '@/lib/ftnd';

export const metadata: Metadata = {
  title: 'Chi phí — Sòng phẳng & Minh bạch',
  description: 'Chi phí 5.000đ/ngày (tri ân 500 anh em đầu). 7 ngày Nhận Diện FREE. Không auto-charge. Hoàn ngày chưa dùng.',
  alternates: { canonical: 'https://bothuocla.sol.vn/bang-gia' }
};

export default function BangGiaPage() {
  return (
    <>
      <Header />

      <main id="main" className="container-sol py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm text-sol-orange font-bold uppercase tracking-wider mb-2">CHI PHÍ SÒNG PHẲNG</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-sol-brown mb-3">
            Đi cùng Sol: 5.000đ/ngày để tìm lại tự do
          </h1>
          <p className="text-sol-ink2 max-w-2xl mx-auto">
            Sol KHÔNG bán cam kết ảo, KHÔNG có bẫy đăng ký tự động rút tiền.
            7 ngày Nhận Diện <strong>miễn phí hoàn toàn</strong> để dùng thử.
          </p>
        </div>

        {/* Lời nhắn Khang */}
        <div className="card-sol border-l-4 border-sol-orange mb-10">
          <p className="font-bold text-sol-orange text-sm mb-2">📢 LỜI NHẮN TỪ KHANG</p>
          <p className="text-sol-ink2">
            Dự án Sol hiện đang trong giai đoạn đồng hành cùng <strong>500 anh em đầu tiên</strong> để
            chạy thử nghiệm và tối ưu hóa hệ thống Trợ lý AI Mentor. Vì một mình tôi vừa gõ code vừa
            vận hành nên phần mềm chắc chắn sẽ còn những điểm chưa hoàn hảo.
          </p>
          <p className="text-sol-ink2 mt-2">
            Tôi để mức phí tri ân cố định là <strong>5.000đ/ngày</strong> (giá thực tế sau khi
            hoàn thiện là <strong>9.000đ/ngày</strong>). Rất mong anh em trong quá trình trải
            nghiệm nếu có chỗ nào chưa mượt, hãy cứ thẳng thắn nhắn tin góp ý.
          </p>
        </div>

        {/* 5k/ngày dùng vào đâu */}
        <div className="card-sol mb-10">
          <h2 className="text-xl font-bold text-sol-brown mb-3 text-center">
            Khoản đóng góp 5.000đ/ngày dùng vào việc gì?
          </h2>
          <p className="text-sm text-sol-ink2 mb-6 text-center">
            Toàn bộ ngân sách chung tay dồn thẳng vào 3 hạng mục hạ tầng thực tế:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '💻', title: 'Máy chủ & Lưu trữ', desc: 'Server Firebase bảo mật dữ liệu hành trình, lưu lịch sử check-in, đồng hồ đếm ngược cơn thèm.' },
              { icon: '💬', title: 'Tin nhắn Zalo OA', desc: 'Chi phí gửi tin nhắn tự động về điện thoại nhắc nhở, giữ kỷ luật theo khung giờ.' },
              { icon: '🤖', title: 'Cổng kết nối AI Mentor', desc: 'Phí API để Trợ lý AI 24/7 thấu hiểu và phản hồi giải mã cơn thèm lúc nửa đêm.' }
            ].map((item, i) => (
              <div key={i} className="bg-sol-cream rounded-xl p-4">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-bold text-sol-brown mb-1">{item.title}</p>
                <p className="text-sm text-sol-ink2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Cohort plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {(['LIGHT', 'MODERATE', 'HEAVY'] as const).map((key) => {
            const plan = COHORT_PLANS[key];
            const isPopular = key === 'MODERATE';
            const colorClass = key === 'LIGHT' ? 'border-sol-green' : key === 'MODERATE' ? 'border-sol-amber' : 'border-sol-red';
            const textClass = key === 'LIGHT' ? 'text-sol-green' : key === 'MODERATE' ? 'text-sol-amber' : 'text-sol-red';

            return (
              <div
                key={key}
                id={key.toLowerCase()}
                className={`card-sol border-t-4 ${colorClass} relative ${isPopular ? 'md:scale-105 shadow-lg' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sol-amber text-white text-xs font-bold px-3 py-1 rounded-full">
                    PHỔ BIẾN NHẤT
                  </div>
                )}

                <p className={`text-xs ${textClass} font-bold uppercase tracking-wider`}>{plan.name}</p>
                <h3 className="text-xl font-bold text-sol-brown mt-1 mb-2">{plan.audienceLabel}</h3>
                <p className="text-sm text-sol-ink2 mb-4">{plan.description}</p>

                <p className={`text-3xl font-bold ${textClass}`}>{formatVND(plan.totalPrice)}</p>
                <p className="text-xs text-sol-ink2 mb-5">
                  ({plan.freeDays} ngày free + {plan.paidDays} × {formatVND(plan.dailyRate)})
                </p>

                <Link
                  href={`/onboarding?cohort=${plan.id}`}
                  className={`block text-center py-3 rounded-lg font-semibold text-white transition`}
                  style={{ background: plan.color }}
                >
                  Bắt đầu dùng thử tự do →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Alternative: weekly */}
        <div className="card-sol bg-sol-cream mb-10 text-center">
          <p className="text-sm text-sol-brown font-bold uppercase tracking-wider mb-1">CÒN PHÂN VÂN?</p>
          <h2 className="text-2xl font-bold text-sol-brown mb-3">Trả góp theo tuần — 35.000đ/tuần</h2>
          <p className="text-sm text-sol-ink2 max-w-xl mx-auto mb-4">
            Sau 7 ngày Nhận Diện free, nếu anh chưa muốn xuống khoản trọn gói,
            chọn "Góp phí theo tuần" — đi tiếp tuần nào đóng tuần đó.
            Bất kỳ lúc nào dừng, hệ thống tự ngắt đồng hành.
          </p>
          <p className="text-xs text-sol-ink2 italic">
            Sòng phẳng và chủ động 100% — không có bất kỳ khoản phí oan nào.
          </p>
        </div>

        {/* Rút lui văn minh */}
        <div className="card-sol border-l-4 border-sol-orange bg-sol-paper mb-10">
          <h2 className="text-xl font-bold text-sol-brown mb-2">
            🚪 Chính sách "Rút lui văn minh"
          </h2>
          <p className="text-sm text-sol-ink2 mb-3">
            Bỏ thuốc là hành trình gian nan, cần sự nghiêm túc cả 2 phía. Nếu anh muốn dừng,
            Sol <strong>hoàn lại toàn bộ tiền của ngày chưa sử dụng</strong> (tính 5.000đ/ngày),
            chuyển khoản thẳng về tài khoản anh.
          </p>
          <p className="text-sm font-semibold text-sol-brown mb-2">
            Tuy nhiên, để chặn phá hoại + nhắc về kỷ luật, hoàn tiền cần 3 điều kiện:
          </p>
          <ol className="text-sm text-sol-ink2 space-y-2 list-decimal pl-5">
            <li>
              <strong>Đi đủ ≥ 7 ngày chặng Ngắt Cơn.</strong> Tuần đầu là lúc cơ thể vật lộn
              dữ dội nhất — bỏ trước 7 ngày là chưa đủ quyết tâm.
            </li>
            <li>
              <strong>Có lịch sử tương tác ≥ 80% số ngày.</strong> Hệ thống ghi nhận phản hồi
              Zalo / mở app trò chuyện AI Mentor.
            </li>
            <li>
              <strong>Giới hạn 1 lần/SĐT/TK ngân hàng</strong> để hạn chế tài khoản ảo quấy phá.
            </li>
          </ol>
        </div>

        {/* FAQ */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-sol-brown text-center mb-6">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Tôi chưa tin tưởng phương pháp này, có thể trả tiền theo tuần được không?',
                a: 'Hoàn toàn được. Sau 7 ngày Nhận Diện free, trong Dashboard chọn "Góp phí theo tuần" (35.000đ/tuần). Anh đi tuần nào đóng tuần đó. Sòng phẳng và chủ động 100%.'
              },
              {
                q: 'Hệ thống có tự động gia hạn hoặc âm thầm trừ tiền không?',
                a: 'Tuyệt đối không. Mọi giao dịch đều là quét QR thủ công chuyển khoản tay sang TK chính chủ Khang Sol. KHÔNG lưu thẻ tín dụng, KHÔNG auto-charge.'
              },
              {
                q: 'Tại sao mức phí hiện tại là 5.000đ/ngày thay vì giá gốc 9.000đ/ngày?',
                a: 'Sol đang trong giai đoạn đồng hành cùng 500 anh em đầu tiên để tối ưu AI Mentor. Vì hệ thống còn điểm chưa hoàn hảo, Khang để mức phí tri ân tối thiểu 5.000đ/ngày.'
              },
              {
                q: 'Dự án Sol có hợp pháp không?',
                a: 'Hoàn toàn hợp lệ. Sol định vị là ứng dụng phần mềm hỗ trợ theo dõi thói quen, KHÔNG phải cơ sở y tế, KHÔNG bán thuốc, KHÔNG kê đơn. Khoản phí là chi phí thuê hạ tầng máy chủ + AI — giao dịch CNTT thông thường.'
              },
              {
                q: 'Khang có phải bác sĩ không?',
                a: 'KHÔNG. Khang là kỹ sư IT đã sạch thuốc từ 2021, chia sẻ trải nghiệm thực chứng từ chính hành trình của mình. KHÔNG đưa ra lời khuyên/chẩn đoán y khoa. Mọi quyết định dùng Champix/Bupropion phải tham khảo bác sĩ.'
              }
            ].map((faq, i) => (
              <details key={i} className="card-sol cursor-pointer">
                <summary className="font-semibold text-sol-brown">{faq.q}</summary>
                <p className="text-sm text-sol-ink2 mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-sol-brown text-sol-paper rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-3">Quyết định nằm ở phía anh</h2>
          <p className="text-sm opacity-90 mb-5 max-w-xl mx-auto">
            7 ngày Nhận Diện hoàn toàn miễn phí. Không cần điền SĐT hay để lại cam kết.
            Cứ thử trải nghiệm — hợp thì đi tiếp.
          </p>
          <Link href="/test-ftnd" className="inline-block bg-sol-orange text-white font-bold px-8 py-3 rounded-xl hover:bg-orange-700 transition">
            🌱 Thử chặng Nhận Diện 7 ngày miễn phí →
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
