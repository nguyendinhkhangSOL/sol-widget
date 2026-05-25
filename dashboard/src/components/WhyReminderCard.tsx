// dashboard/src/components/WhyReminderCard.tsx
//
// "LÝ DO ANH BẮT ĐẦU" — card cuối trang Hành Trình.
// Mục đích: scroll xuống cuối → user thấy lại lý do mình cai để giữ động lực.
//
// Đọc user.quitReasons[] (từ onboarding workbook "Why section").
// Nếu rỗng → fallback quote inspirational + CTA điền lý do.

import { useNavigate } from 'react-router-dom';

export interface WhyReminderCardProps {
  /** Lý do anh ghi lúc onboarding (từ workbook Why section). */
  quitReasons?: string[];
  /** Pronouns user (anh/bạn) — default 'anh'. */
  pronouns?: string;
  /** Tên user để personalize. */
  userName?: string;
}

const FALLBACK_QUOTES = [
  'Vì người anh yêu — họ xứng đáng được hít chung bầu không khí sạch.',
  'Vì 30 năm sau — anh muốn còn đủ phổi để leo núi cùng con cháu.',
  'Vì mỗi sáng — không phải khạc đờm để bắt đầu ngày mới.',
  'Vì tự do — không phải nô lệ điếu thuốc 20 lần/ngày.',
];

export function WhyReminderCard({
  quitReasons = [],
  pronouns = 'anh',
  userName,
}: WhyReminderCardProps) {
  const nav = useNavigate();
  const hasReasons = quitReasons.length > 0;
  const fallbackQuote = FALLBACK_QUOTES[new Date().getDay() % FALLBACK_QUOTES.length];

  return (
    <div
      className="rounded-2xl p-6 shadow-card relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2A2620 0%, #5C3A1E 50%, #6B3318 100%)',
        color: '#FBF7F0',
      }}
    >
      {/* Decorative sun in background */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #E8924A 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" aria-hidden="true">💭</span>
          <h2 className="text-h2 font-bold" style={{ color: '#FBF7F0' }}>
            Nhớ lại lý do {pronouns} bắt đầu
          </h2>
        </div>

        <p className="text-meta italic mb-5 opacity-80">
          Khoảnh khắc {pronouns} đã chọn để thay đổi — nó vẫn còn đó. Đây là nội lực thật sự của {pronouns}.
        </p>

        {/* Reasons list hoặc fallback */}
        {hasReasons ? (
          <ul className="space-y-3">
            {quitReasons.slice(0, 5).map((reason, idx) => (
              <li
                key={idx}
                className="flex gap-3 items-start"
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ backgroundColor: '#E8924A', color: '#2A2620' }}
                >
                  {idx + 1}
                </span>
                <span className="text-body leading-relaxed font-medium">
                  {reason}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <blockquote
              className="text-body-lg italic pl-4 border-l-4 leading-relaxed mb-4"
              style={{ borderColor: '#E8924A', color: '#FBF7F0' }}
            >
              {fallbackQuote}
            </blockquote>
            <button
              onClick={() => nav('/workbook?section=why')}
              className="text-meta px-4 py-2 rounded-xl font-semibold"
              style={{
                backgroundColor: '#E8924A',
                color: '#2A2620',
              }}
            >
              ✍️ Viết lý do của {pronouns} →
            </button>
          </div>
        )}

        {hasReasons && (
          <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-2">
            <span className="text-meta opacity-70">
              Cập nhật lý do — vào Sổ Lưu Niệm
            </span>
            <button
              onClick={() => nav('/workbook?section=why')}
              className="text-meta underline hover:opacity-80"
              style={{ color: '#FBF7F0' }}
            >
              Sửa →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
