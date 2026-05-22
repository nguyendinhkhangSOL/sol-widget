// dashboard/src/pages/Pricing.tsx
//
// Day 5 (2026-05-21): Refactor toàn bộ theo business model chốt 21/5.
// Port nội dung từ Next.js app/app/bang-gia/page.tsx → dashboard SPA.
//
// 3 gói cohort:
//   LIGHT  — 35 ngày (7 free + 28 × 5k) = 140k
//   MODERATE — 52 ngày (7 free + 45 × 5k) = 225k  ⭐ POPULAR
//   HEAVY  — 65 ngày (7 free + 58 × 5k) = 290k
// Alternative: 35k/tuần (góp phí theo tuần sau 7 ngày free)
//
// Flow: click "Bắt đầu" → POST /payments/vietqr/intent → modal QR.

import { useState } from 'react';
import { api, ApiError } from '../services/api';
import { useStore } from '../state/store';
import { useToast } from '../lib/toast';
import { COHORT_PLANS, formatVND, type Cohort } from '../lib/ftnd';
import { CohortBadge, getSeverityCohort } from '../components/CohortBadge';
import { VietQRModal } from '../components/VietQRModal';

type PaymentMode = 'full' | 'weekly';

export function Pricing() {
  const user = useStore((s) => s.user);
  const toast = useToast();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<any>(null);

  const userCohort = getSeverityCohort(user);
  const pronouns = user?.pronouns ?? 'anh';

  async function handleSelect(cohort: Cohort, paymentMode: PaymentMode) {
    const key = `${cohort}-${paymentMode}`;
    setSubmitting(key);
    try {
      const resp = await api.createVietqrIntent({ cohort, paymentMode });
      setQrPayload(resp);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.body as any)?.message || `Lỗi ${err.status}`
          : 'Không kết nối được Sol';
      toast.error(msg, '⚠️');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-meta text-sol-orange-ink font-bold uppercase tracking-wider mb-1">
          CHI PHÍ SÒNG PHẲNG
        </p>
        <h1 className="text-h1 font-bold text-sol-ink mb-2">
          Đi cùng Sol: 5.000đ/ngày để tìm lại tự do
        </h1>
        <p className="text-body text-sol-ink-2 max-w-2xl mx-auto">
          Sol KHÔNG bán cam kết ảo, KHÔNG có bẫy đăng ký tự động rút tiền.
          7 ngày Nhận Diện <strong>miễn phí hoàn toàn</strong> để dùng thử.
        </p>
      </div>

      {/* Cohort highlight */}
      {userCohort && (
        <div className="mb-6 flex items-center justify-center gap-2 text-meta text-sol-ink-2 flex-wrap">
          <span>Sol gợi ý gói phù hợp với {pronouns}:</span>
          <CohortBadge cohort={userCohort} size="sm" score={user?.ftndScore} />
        </div>
      )}

      {/* Lời nhắn Khang */}
      <div className="sol-card-padded border-l-4 border-sol-orange mb-8">
        <p className="text-meta font-bold text-sol-orange-ink uppercase tracking-wide mb-2">
          📢 Lời nhắn từ Khang
        </p>
        <p className="text-body text-sol-ink-2">
          Dự án Sol hiện đang trong giai đoạn đồng hành cùng <strong>500 anh em đầu tiên</strong> để
          chạy thử nghiệm và tối ưu hóa hệ thống Trợ lý AI Mentor. Vì một mình tôi vừa gõ code vừa
          vận hành nên phần mềm chắc chắn sẽ còn những điểm chưa hoàn hảo.
        </p>
        <p className="text-body text-sol-ink-2 mt-2">
          Tôi để mức phí tri ân cố định là <strong>5.000đ/ngày</strong> (giá thực tế sau khi
          hoàn thiện là <strong>9.000đ/ngày</strong>). Rất mong {pronouns} trong quá trình trải
          nghiệm nếu có chỗ nào chưa mượt, hãy cứ thẳng thắn nhắn tin góp ý.
        </p>
      </div>

      {/* Khoản đóng góp dùng vào đâu */}
      <div className="sol-card-padded mb-8">
        <h2 className="text-h3 font-bold text-sol-ink mb-2 text-center">
          Khoản đóng góp 5.000đ/ngày dùng vào việc gì?
        </h2>
        <p className="text-meta text-sol-ink-2 mb-5 text-center">
          Toàn bộ ngân sách dồn thẳng vào 3 hạng mục hạ tầng thực tế:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '💻', title: 'Máy chủ & DB', desc: 'Lưu hành trình, check-in, cơn thèm.' },
            { icon: '💬', title: 'Zalo OA', desc: 'Tin nhắn nhắc 7h sáng theo khung giờ.' },
            { icon: '🤖', title: 'AI Mentor', desc: 'API Gemini/Claude để mentor 24/7.' },
          ].map((item) => (
            <div key={item.title} className="bg-sol-soft rounded-xl p-3">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="font-semibold text-body text-sol-ink">{item.title}</p>
              <p className="text-meta text-sol-ink-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3 gói cohort */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(['LIGHT', 'MODERATE', 'HEAVY'] as const).map((key) => {
          const plan = COHORT_PLANS[key];
          const isPopular = key === 'MODERATE';
          const isMine = userCohort === key;
          const colorClasses: Record<Cohort, { border: string; text: string; btn: string }> = {
            LIGHT: { border: 'border-sol-green', text: 'text-sol-green-ink', btn: 'bg-sol-green hover:bg-sol-green-ink' },
            MODERATE: { border: 'border-sol-orange', text: 'text-sol-orange-ink', btn: 'bg-sol-orange hover:bg-sol-orange-ink' },
            HEAVY: { border: 'border-sol-red', text: 'text-sol-red-ink', btn: 'bg-sol-red hover:bg-sol-red-ink' },
          };
          const c = colorClasses[key];
          const submitKey = `${key}-full`;
          const isSubmitting = submitting === submitKey;

          return (
            <div
              key={key}
              className={`sol-card-padded border-t-4 ${c.border} relative
                ${isPopular ? 'md:scale-105 shadow-xl' : ''}
                ${isMine ? 'ring-2 ring-sol-blue ring-offset-2' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sol-orange text-white text-meta font-bold px-3 py-1 rounded-full shadow">
                  PHỔ BIẾN NHẤT
                </div>
              )}
              {isMine && !isPopular && (
                <div className="absolute -top-3 right-3 bg-sol-blue text-white text-meta font-bold px-3 py-1 rounded-full shadow">
                  GỢI Ý
                </div>
              )}

              <p className={`text-meta ${c.text} font-bold uppercase tracking-wider`}>{plan.name}</p>
              <h3 className="text-h2 font-bold text-sol-ink mt-1 mb-2">{plan.audienceLabel}</h3>
              <p className="text-meta text-sol-ink-2 mb-4">{plan.description}</p>

              <p className={`text-h1 font-bold ${c.text}`}>{formatVND(plan.totalPrice)}</p>
              <p className="text-meta text-sol-ink-3 mb-5">
                ({plan.freeDays} ngày free + {plan.paidDays} × {formatVND(plan.dailyRate)})
              </p>

              <button
                onClick={() => handleSelect(key, 'full')}
                disabled={isSubmitting || !!submitting}
                className={`block w-full text-center py-3 rounded-xl font-semibold text-white text-body transition min-h-tap ${c.btn} disabled:opacity-60 disabled:cursor-wait`}
              >
                {isSubmitting ? 'Đang tạo QR...' : 'Bắt đầu — Quét QR →'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Alternative weekly */}
      <div className="sol-card-padded bg-sol-soft mb-8 text-center">
        <p className="text-meta text-sol-orange-ink font-bold uppercase tracking-wider mb-1">
          CÒN PHÂN VÂN?
        </p>
        <h2 className="text-h2 font-bold text-sol-ink mb-2">Trả góp theo tuần — 35.000đ/tuần</h2>
        <p className="text-body text-sol-ink-2 max-w-xl mx-auto mb-4">
          Sau 7 ngày Nhận Diện free, nếu {pronouns} chưa muốn xuống khoản trọn gói,
          chọn "Góp phí theo tuần" — đi tiếp tuần nào đóng tuần đó.
          Bất kỳ lúc nào dừng, hệ thống tự ngắt đồng hành.
        </p>
        <button
          onClick={() => handleSelect(userCohort ?? 'MODERATE', 'weekly')}
          disabled={!!submitting}
          className="sol-btn-secondary min-h-tap px-6"
        >
          {submitting?.endsWith('-weekly') ? 'Đang tạo QR...' : 'Đóng 35k tuần này →'}
        </button>
        <p className="text-meta text-sol-ink-3 italic mt-3">
          Sòng phẳng và chủ động 100% — không có bất kỳ khoản phí oan nào.
        </p>
      </div>

      {/* Rút lui văn minh */}
      <div className="sol-card-padded border-l-4 border-sol-orange bg-sol-paper mb-8">
        <h2 className="text-h2 font-bold text-sol-ink mb-2">
          🚪 Chính sách "Rút lui văn minh"
        </h2>
        <p className="text-body text-sol-ink-2 mb-3">
          Bỏ thuốc là hành trình gian nan, cần sự nghiêm túc cả 2 phía. Nếu {pronouns} muốn dừng,
          Sol <strong>hoàn lại toàn bộ tiền của ngày chưa sử dụng</strong> (tính 5.000đ/ngày),
          chuyển khoản thẳng về tài khoản {pronouns}.
        </p>
        <p className="text-body font-semibold text-sol-ink mb-2">Hoàn tiền cần 3 điều kiện:</p>
        <ol className="text-body text-sol-ink-2 space-y-2 list-decimal pl-5">
          <li>
            <strong>Đi đủ ≥ 7 ngày chặng Ngắt Cơn.</strong> Tuần đầu là lúc cơ thể vật lộn dữ dội
            nhất — bỏ trước 7 ngày là chưa đủ quyết tâm.
          </li>
          <li>
            <strong>Có lịch sử tương tác ≥ 80% số ngày.</strong> Hệ thống ghi nhận phản hồi
            Zalo / mở app trò chuyện AI Mentor.
          </li>
          <li>
            <strong>Giới hạn 1 lần / SĐT / TK ngân hàng</strong> để hạn chế tài khoản ảo quấy phá.
          </li>
        </ol>
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-h2 font-bold text-sol-ink text-center mb-5">Câu hỏi thường gặp</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Tôi chưa tin tưởng phương pháp này, có thể trả tiền theo tuần được không?',
              a: 'Hoàn toàn được. Sau 7 ngày Nhận Diện free, trong Dashboard chọn "Góp phí theo tuần" (35.000đ/tuần). Anh đi tuần nào đóng tuần đó. Sòng phẳng và chủ động 100%.',
            },
            {
              q: 'Hệ thống có tự động gia hạn hoặc âm thầm trừ tiền không?',
              a: 'Tuyệt đối không. Mọi giao dịch đều là quét QR thủ công chuyển khoản tay sang TK chính chủ Khang Sol. KHÔNG lưu thẻ tín dụng, KHÔNG auto-charge.',
            },
            {
              q: 'Tại sao mức phí hiện tại là 5.000đ/ngày thay vì giá gốc 9.000đ/ngày?',
              a: 'Sol đang trong giai đoạn đồng hành cùng 500 anh em đầu tiên để tối ưu AI Mentor. Vì hệ thống còn điểm chưa hoàn hảo, Khang để mức phí tri ân tối thiểu 5.000đ/ngày.',
            },
            {
              q: 'Dự án Sol có hợp pháp không?',
              a: 'Hoàn toàn hợp lệ. Sol định vị là ứng dụng phần mềm hỗ trợ theo dõi thói quen, KHÔNG phải cơ sở y tế, KHÔNG bán thuốc, KHÔNG kê đơn. Khoản phí là chi phí thuê hạ tầng máy chủ + AI — giao dịch CNTT thông thường.',
            },
            {
              q: 'Khang có phải bác sĩ không?',
              a: 'KHÔNG. Khang là kỹ sư IT đã sạch thuốc từ 2021, chia sẻ trải nghiệm thực chứng từ chính hành trình của mình. KHÔNG đưa ra lời khuyên/chẩn đoán y khoa. Mọi quyết định dùng Champix/Bupropion phải tham khảo bác sĩ.',
            },
          ].map((faq, i) => (
            <details key={i} className="sol-card-padded cursor-pointer">
              <summary className="font-semibold text-body text-sol-ink">{faq.q}</summary>
              <p className="text-body text-sol-ink-2 mt-3">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center bg-sol-earth text-sol-paper rounded-2xl p-6 sm:p-8">
        <h2 className="text-h2 font-bold mb-2">Quyết định nằm ở phía {pronouns}</h2>
        <p className="text-body opacity-90 mb-4 max-w-xl mx-auto">
          7 ngày Nhận Diện hoàn toàn miễn phí. Không cần điền SĐT hay để lại cam kết.
          Cứ thử trải nghiệm — hợp thì đi tiếp.
        </p>
        <button
          onClick={() => handleSelect(userCohort ?? 'MODERATE', 'full')}
          disabled={!!submitting}
          className="inline-block bg-sol-orange text-white font-bold px-6 py-3 rounded-xl hover:bg-sol-orange-ink transition min-h-tap"
        >
          🌱 Bắt đầu chặng Nhận Diện 7 ngày miễn phí →
        </button>
      </div>

      {/* VietQR Modal */}
      <VietQRModal payload={qrPayload} pronouns={pronouns} onClose={() => setQrPayload(null)} />
    </div>
  );
}
