import type { Metadata } from 'next';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { COHORT_PLANS, type Cohort, formatVND } from '@/lib/ftnd';
import { generatePaymentQR, validateVietnamesePhone } from '@/lib/vietqr';
import { PaymentToggle } from './PaymentToggle';

export const metadata: Metadata = {
  title: 'Thanh toán — VietQR cá nhân hoá',
  robots: { index: false, follow: false }
};

interface PageProps {
  searchParams: { cohort?: string; p?: string; type?: string };
}

export default function ThanhToanPage({ searchParams }: PageProps) {
  const cohort = (searchParams.cohort || 'MODERATE').toUpperCase() as Cohort;
  const phoneRaw = searchParams.p || '';
  const payType: 'full' | 'weekly' = searchParams.type === 'weekly' ? 'weekly' : 'full';

  const phoneCheck = validateVietnamesePhone(phoneRaw);
  if (!phoneCheck.valid || !phoneCheck.cleaned) {
    return (
      <>
        <Header />
        <main className="container-sol py-12 text-center">
          <h1 className="text-2xl font-bold text-sol-brown mb-3">SĐT không hợp lệ</h1>
          <p className="text-sol-ink2 mb-6">Vui lòng quay lại làm test FTND để bắt đầu.</p>
          <a href="/test-ftnd" className="btn-primary">Làm Test FTND</a>
        </main>
        <Footer />
      </>
    );
  }

  const phone = phoneCheck.cleaned;
  const plan = COHORT_PLANS[cohort];

  const amount = payType === 'full' ? plan.totalPrice : plan.weeklyRate;
  const payment = generatePaymentQR(amount, phone, cohort, payType);

  return (
    <>
      <Header />

      <main id="main" className="container-sol py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-sol-brown mb-2">
            Thanh toán {plan.name}
          </h1>
          <p className="text-sol-ink2 text-sm">
            SĐT Zalo: <strong>{phone}</strong> · {plan.audienceLabel}
          </p>
        </div>

        {/* Payment type toggle */}
        <PaymentToggle
          cohort={cohort}
          phone={phone}
          currentType={payType}
          plan={plan}
        />

        {/* VietQR display */}
        <div className="card-sol text-center mb-6">
          <p className="text-sm text-sol-ink2 mb-1">Quét QR trong app MoMo/ngân hàng:</p>
          <p className="text-3xl font-bold text-sol-orange mb-4">{formatVND(amount)}</p>

          <div className="inline-block bg-white p-3 rounded-2xl shadow-md mb-4 border-2 border-sol-cream">
            <img
              src={payment.qrUrl}
              alt={`VietQR ${formatVND(amount)} cho ${phone}`}
              width={320}
              height={320}
              className="w-72 h-72 sm:w-80 sm:h-80"
            />
          </div>

          <div className="text-left max-w-sm mx-auto space-y-2 text-sm bg-sol-cream rounded-xl p-4">
            <div className="flex justify-between gap-2">
              <span className="text-sol-ink2">Ngân hàng:</span>
              <strong className="text-sol-brown">{payment.bank}</strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-sol-ink2">Số TK:</span>
              <strong className="text-sol-brown font-mono">{payment.account}</strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-sol-ink2">Chủ TK:</span>
              <strong className="text-sol-brown">{payment.accountName}</strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-sol-ink2">Số tiền:</span>
              <strong className="text-sol-brown">{formatVND(amount)}</strong>
            </div>
            <div className="pt-2 border-t border-white">
              <p className="text-sol-ink2 text-xs mb-1">Nội dung CHUYỂN KHOẢN (bắt buộc):</p>
              <code className="block bg-white px-3 py-2 rounded font-mono text-sm break-all text-sol-brown font-semibold">
                {payment.content}
              </code>
              <p className="text-xs text-sol-ink2 italic mt-1">
                ⚠️ Quét QR sẽ tự điền nội dung. KHÔNG sửa.
              </p>
            </div>
          </div>
        </div>

        {/* Hướng dẫn */}
        <div className="card-sol mb-6">
          <h2 className="font-bold text-sol-brown mb-3">3 bước thanh toán</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sol-orange text-white font-bold rounded-full flex items-center justify-center text-sm">1</span>
              <div>
                <p className="font-semibold text-sol-brown">Quét QR bằng app MoMo / ngân hàng</p>
                <p className="text-sol-ink2 text-xs">Số tiền + nội dung sẽ tự điền chính xác</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sol-orange text-white font-bold rounded-full flex items-center justify-center text-sm">2</span>
              <div>
                <p className="font-semibold text-sol-brown">Xác nhận chuyển khoản</p>
                <p className="text-sol-ink2 text-xs">KHÔNG sửa nội dung — hệ thống match theo SĐT Zalo của anh</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sol-orange text-white font-bold rounded-full flex items-center justify-center text-sm">3</span>
              <div>
                <p className="font-semibold text-sol-brown">Khang confirm trong 24h</p>
                <p className="text-sol-ink2 text-xs">
                  Khang check banking, match SĐT, Zalo confirm với anh, active account
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Trust signals */}
        <div className="card-sol bg-sol-cream mb-6 text-sm text-sol-ink2">
          <p className="font-semibold text-sol-brown mb-2">🔒 Sòng phẳng & An toàn</p>
          <ul className="space-y-1.5">
            <li>✓ Chuyển khoản trực tiếp đến TK chính chủ Khang Sol</li>
            <li>✓ KHÔNG lưu thẻ, KHÔNG auto-charge, KHÔNG phí ẩn</li>
            <li>✓ Hệ thống tự động ngắt khi hết hạn — không trừ thêm</li>
            <li>✓ Hoàn ngày chưa dùng (Rút lui văn minh — xem <a href="/bang-gia" className="text-sol-orange underline">điều kiện</a>)</li>
          </ul>
        </div>

        {/* Help */}
        <div className="text-center text-sm text-sol-ink2">
          <p className="mb-2">Cần hỗ trợ? Nhắn Zalo Khang Sol:</p>
          <p className="font-mono font-bold text-sol-brown">{process.env.NEXT_PUBLIC_ADMIN_ZALO || '0967.xxx.xxx'}</p>
          <p className="text-xs mt-2 italic">(SĐT Zalo nhận tin nhắn 24h từ Khang)</p>
        </div>
      </main>

      <Footer />
    </>
  );
}
