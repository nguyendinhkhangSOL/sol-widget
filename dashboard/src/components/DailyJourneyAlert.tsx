// dashboard/src/components/DailyJourneyAlert.tsx
//
// CẢNH BÁO HÀNH TRÌNH — banner pulse animation hiển thị alert ngày hôm nay.
// Đặt phía trên JourneySimulator trong Overview.tsx.
//
// 3 severity:
//   - info       — xanh dương (thông tin sinh học)
//   - warning    — cam (triệu chứng khó chịu nhưng bình thường)
//   - celebrate  — clay (mốc thành tựu)
//
// Pulse animation nhẹ (1s ease-in-out infinite) để gây chú ý không ồn.
// User có thể dismiss → localStorage lưu seen → không show lại ngày đó.

import { useState, useEffect } from 'react';
import { getAlertForDay, SEVERITY_STYLES, type DailyAlert } from '../lib/dailyJourneyAlerts';

export interface DailyJourneyAlertProps {
  /** Số ngày user đã đi trong journey (1+). */
  dayInJourney: number;
  /** Pronouns user dùng (anh/bạn) */
  pronouns?: string;
}

const DISMISS_KEY = 'sol:daily_alert_dismissed';

function isDismissed(day: number): boolean {
  try {
    const data = localStorage.getItem(DISMISS_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data) as { day: number; date: string };
    const today = new Date().toISOString().split('T')[0];
    return parsed.day === day && parsed.date === today;
  } catch {
    return false;
  }
}

function markDismissed(day: number) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(DISMISS_KEY, JSON.stringify({ day, date: today }));
}

export function DailyJourneyAlert({ dayInJourney, pronouns = 'anh' }: DailyJourneyAlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    setDismissed(isDismissed(dayInJourney));
  }, [dayInJourney]);

  const alert = getAlertForDay(dayInJourney);

  if (!alert || dismissed) return null;

  const style = SEVERITY_STYLES[alert.severity];

  function handleDismiss() {
    markDismissed(dayInJourney);
    setDismissed(true);
  }

  return (
    <div
      className="daily-alert-pulse rounded-2xl border-2 p-4 shadow-card relative"
      style={{
        backgroundColor: style.bgColor,
        borderColor: style.borderColor,
      }}
    >
      {/* Pulse glow ring — outer halo nhấp nháy nhẹ */}
      <span
        className="absolute -inset-1 rounded-2xl opacity-50 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${style.borderColor}30, transparent 70%)`,
          animation: 'sol-alert-pulse 2.5s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        {/* Icon badge */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: style.iconBg, color: '#fff' }}
        >
          <span aria-hidden="true">{style.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-meta uppercase tracking-wide font-semibold" style={{ color: style.textColor }}>
              ⚡ Cảnh báo hành trình · Ngày {dayInJourney}
            </div>
            <button
              onClick={handleDismiss}
              className="text-meta opacity-60 hover:opacity-100 ml-2"
              style={{ color: style.textColor }}
              aria-label="Đã đọc"
            >
              ✕
            </button>
          </div>

          {/* Title */}
          <h3
            className="text-h3 font-bold mt-1 leading-tight"
            style={{ color: style.textColor }}
          >
            {alert.title}
          </h3>

          {/* Detail — collapsible */}
          <p
            className={`text-body leading-relaxed mt-2 ${expanded ? '' : 'line-clamp-2'}`}
            style={{ color: style.textColor, opacity: 0.85 }}
          >
            {alert.detail}
          </p>

          {/* Source + actions */}
          <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
            {alert.source && (
              <a
                href={alert.sourceUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-meta underline hover:opacity-80"
                style={{ color: style.textColor, opacity: 0.7 }}
              >
                Nguồn: {alert.source}
              </a>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-meta underline hover:opacity-80"
                style={{ color: style.textColor }}
              >
                {expanded ? 'Thu gọn' : 'Đọc thêm'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-meta px-3 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: style.iconBg,
                  color: '#fff',
                }}
              >
                Đã hiểu, {pronouns} ổn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline keyframes (chỉ load cho component này) */}
      <style>{`
        @keyframes sol-alert-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.015); }
        }
      `}</style>
    </div>
  );
}
