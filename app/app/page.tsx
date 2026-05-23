import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { COHORT_PLANS, formatVND } from '@/lib/ftnd';

export default function HomePage() {
  // Days until 31-5
  const launchDate = new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE || '2026-05-31');
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((launchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <>
      <Header />

      <main id="main">
        {/* Hero */}
        <section className="container-sol pt-10 pb-12 text-center">
          {daysLeft > 0 && daysLeft <= 14 && (
            <div className="inline-block bg-sol-orange text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              🌍 Còn {daysLeft} ngày tới 31/5 — Ngày Thế Giới Không Thuốc Lá
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-sol-brown mb-4 leading-tight">
            Anh đã thử bỏ thuốc<br />
            <span className="text-sol-orange">bao lần rồi?</span>
          </h1>

          <p className="text-lg sm:text-xl text-sol-ink2 max-w-2xl mx-auto mb-2">
            3 lần? 5 lần? Lần nào cũng <em>"ngày mai bỏ luôn"</em> rồi đến chiều quay lại.
          </p>
          <p className="text-base text-sol-ink2 max-w-2xl mx-auto mb-8">
            Đêm vẫn ho. Vợ vẫn nhăn. Con gái vẫn nói <em>"bố hôi lắm"</em>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link href="/test-ftnd" className="btn-primary text-lg">
              Làm Test 6 câu → Biết Mức Lệ Thuộc
            </Link>
            <Link href="/khang-sol" className="btn-secondary text-lg">
              Về Khang Sol
            </Link>
          </div>

          <p className="text-sm text-sol-ink2 mt-3">
            ⏱️ 2 phút · Miễn phí · Không cần SĐT để làm test
          </p>
        </section>

        {/* Triết lý sòng phẳng */}
        <section className="container-sol mb-12">
          <div className="card-sol border-l-4 border-sol-orange">
            <p className="text-sm text-sol-orange font-bold uppercase tracking-wider mb-2">CHI PHÍ SÒNG PHẲNG</p>
            <h2 className="text-2xl font-bold text-sol-brown mb-3">
              Đi cùng Sol: 5.000đ/ngày để tìm lại sự tự do
            </h2>
            <p className="text-sol-ink2 mb-3">
              Sol KHÔNG bán cam kết ảo, KHÔNG có bẫy đăng ký tự động rút tiền.
              Tôi là Khang, dân IT tự gõ code sau khi chính mình sạch thuốc 2021.
            </p>
            <p className="text-sol-ink2 mb-4">
              <strong className="text-sol-brown">7 ngày Nhận Diện miễn phí hoàn toàn</strong> để dùng thử.
              Sau đó, chung tay góp phí hạ tầng <strong>5.000đ/ngày</strong> hoặc <strong>35.000đ/tuần</strong>.
            </p>
            <p className="text-sm text-sol-ink2 italic">
              *Mức tri ân áp dụng cho 500 anh em đầu tiên (giá gốc 9.000đ/ngày)
            </p>
          </div>
        </section>

        {/* 3 Cohort */}
        <section className="container-sol mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-sol-brown text-center mb-2">
            3 Lộ trình theo Mức Lệ Thuộc
          </h2>
          <p className="text-center text-sol-ink2 mb-8">
            Làm Test FTND để biết anh thuộc lộ trình nào
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['LIGHT', 'MODERATE', 'HEAVY'] as const).map((key) => {
              const plan = COHORT_PLANS[key];
              const isPopular = key === 'MODERATE';
              const colorClass = key === 'LIGHT' ? 'border-sol-green' : key === 'MODERATE' ? 'border-sol-amber' : 'border-sol-red';
              const textClass = key === 'LIGHT' ? 'text-sol-green' : key === 'MODERATE' ? 'text-sol-amber' : 'text-sol-red';

              return (
                <div
                  key={key}
                  className={`card-sol border-t-4 ${colorClass} relative ${isPopular ? 'md:scale-105 shadow-lg' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 right-4 bg-sol-amber text-white text-xs font-bold px-2 py-1 rounded">
                      PHỔ BIẾN NHẤT
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{plan.emoji}</span>
                    <h3 className="font-bold text-lg text-sol-brown">{plan.name}</h3>
                  </div>

                  <p className="text-xs text-sol-ink2 mb-3 font-semibold uppercase">{plan.audienceLabel}</p>

                  <p className={`text-3xl font-bold text-sol-brown mb-1`}>
                    {formatVND(plan.totalPrice)}
                  </p>
                  <p className="text-xs text-sol-ink2 mb-4">
                    ({plan.freeDays} ngày free + {plan.paidDays} ngày × {formatVND(plan.dailyRate)}/ngày)
                  </p>

                  <p className="text-sm text-sol-ink2 mb-4">{plan.description}</p>

                  <Link
                    href={`/onboarding?cohort=${plan.id}`}
                    className={`block text-center bg-white border-2 ${colorClass} ${textClass} font-semibold py-2 rounded-lg hover:bg-sol-cream transition`}
                  >
                    Bắt đầu dùng thử tự do →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6">
            <Link href="/bang-gia" className="text-sol-orange font-semibold hover:underline">
              Xem chi tiết bảng giá + chính sách →
            </Link>
          </div>
        </section>

        {/* 6 vũ khí thực chiến */}
        <section className="container-sol mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-sol-brown text-center mb-2">
            Hệ thống "Vũ khí thực chiến" anh sẽ sở hữu
          </h2>
          <p className="text-center text-sol-ink2 mb-8 max-w-2xl mx-auto">
            5.000đ/ngày không phải để anh nhận vài dòng tin nhắn copy.
            Anh sở hữu toàn bộ bộ công cụ phần mềm thiết kế riêng cho người hút thuốc Việt Nam:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🎙️', title: 'Chuỗi Voice độc thoại từ Khang', desc: '9 đoạn hội thoại xương máu bằng giọng Khang — gửi lúc nửa đêm, lúc lỡ điếu, lúc khẩn cấp, ngày quyết định...' },
              { icon: '⏱️', title: 'Đồng hồ đếm ngược "Đợi 90 giây"', desc: 'Đỉnh cơn thèm chỉ kéo dài 90 giây. Bấm nút, kích hoạt menu 9 công cụ hành động kéo tâm trí qua khỏi 90s khủng hoảng.' },
              { icon: '🤖', title: 'Trợ lý AI Mentor 24/7', desc: 'Nạp toàn bộ dữ liệu kinh nghiệm + phương pháp tâm lý. Bứt rứt là nhắn Zalo, AI gỡ rối ngay tức khắc.' },
              { icon: '🗺️', title: 'Sơ đồ "Kế hoạch B" phòng thủ', desc: '90% tái nghiện trên bàn nhậu / lúc stress. Tự setup trước 5 tình huống nguy cơ + kế hoạch phòng thủ cho riêng anh.' },
              { icon: '📊', title: 'Sổ hành trình điện tử PDF', desc: 'Hệ thống tự chấm điểm, đo hồi phục phổi + tâm trí qua Day 3, 7, 14, 30. Hoàn thành xuất Sổ Hành Trình PDF cá nhân hoá.' },
              { icon: '🤝', title: 'Góc "Khoảng Lặng" ẩn danh', desc: 'Nơi anh em viết ra suy nghĩ trần trụi, lúc yếu lòng hoàn toàn ẩn danh. Không phán xét, chỉ có anh em cùng chí hướng tiếp sức.' }
            ].map((feature, i) => (
              <div key={i} className="card-sol">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{feature.icon}</div>
                  <div>
                    <h3 className="font-bold text-sol-brown mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-sol-ink2">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cam kết */}
        <section className="container-sol mb-12">
          <div className="bg-sol-brown text-sol-paper rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
              Sol cam kết với anh
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-1">✓ KHÔNG auto-charge</p>
                <p className="opacity-80">Toàn bộ giao dịch là quét QR thủ công. KHÔNG lưu thẻ. KHÔNG gia hạn ngầm.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">✓ Hoàn ngày chưa dùng</p>
                <p className="opacity-80">"Rút lui văn minh" — hoàn 5k × số ngày còn lại (đủ điều kiện ≥ 7d + 80% tương tác).</p>
              </div>
              <div>
                <p className="font-semibold mb-1">✓ 7 ngày Nhận Diện FREE</p>
                <p className="opacity-80">Không cần SĐT, không cam kết. Dùng thử, hợp thì đi tiếp.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">✓ Hứa giúp năng lực tự cai</p>
                <p className="opacity-80">KHÔNG hứa cai 100% — hứa anh có sức tự đứng dậy kể cả lỡ 5-10 năm sau.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container-sol mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-sol-brown mb-3">
            Quyết định nằm ở phía anh
          </h2>
          <p className="text-sol-ink2 mb-6 max-w-xl mx-auto">
            7 ngày Nhận Diện hoàn toàn miễn phí. Không cần SĐT, không cam kết.
            Cứ thử, hợp thì đi tiếp.
          </p>
          <Link href="/test-ftnd" className="btn-primary text-lg">
            🌱 Bắt đầu chặng Nhận Diện 7 ngày →
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
