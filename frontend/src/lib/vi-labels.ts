// frontend/src/lib/vi-labels.ts
//
// Sol v4 — Việt hoá 100% (12-05-2026, Khang yêu cầu):
// Tất cả label hiển thị user dùng từ bảng này. Code identifier (qDayConfirmedAt,
// streakCount...) GIỮ NGUYÊN — chỉ display string đổi.
//
// Mục đích: người Việt 30-50+ và anh em nông thôn đọc dễ hiểu, không phải tra
// Google nghĩa từ Tây.

export const VI = {
  // ─── Chặng tiến hoá ──────────────────────────────────
  STAGE_OBSERVE: 'Nhận Diện',           // Day 1-7 (FREE)
  STAGE_CONTROL: 'Kiểm Soát',           // Day 8-21 (KIỂM SOÁT)
  STAGE_MASTER: 'Làm Chủ',              // Day 22-51 (LÀM CHỦ)
  STAGE_FREE: 'Người Tự Do',            // Day 52+ (ALUMNI)

  // ─── Ngày quan trọng ─────────────────────────────────
  Q_DAY: 'Ngày Quyết Định',             // Q-Day Ceremony
  Q_DAY_CEREMONY: 'Lễ Ngày Quyết Định',
  GRADUATION_DAY: 'Lễ Tốt Nghiệp',
  Q_DAY_T_MINUS_2: 'Còn 2 ngày Quyết Định',
  Q_DAY_T_MINUS_1: 'Đêm trước Quyết Định',

  // ─── Tính năng / hành động ───────────────────────────
  CRISIS_MODE: 'Lúc Khó Nhất',           // Crisis Mode
  PLAN_B: 'Kế Hoạch Dự Phòng',           // Plan B
  PLAN_B_SHORT: 'Kế B',
  CHECK_IN: 'Ghi Nhận Hôm Nay',          // Check-in
  CHECK_IN_SHORT: 'Ghi nhận',
  STREAK: 'Chuỗi Ngày Sạch',             // Streak
  WITHDRAWAL: 'Lúc Rút (Sau Cai)',       // Withdrawal symptoms
  ONBOARDING: 'Đăng Ký',
  IDENTITY: 'Chính Mình',                // Identity shift
  COMMITMENT: 'Cam Kết',
  WORKBOOK: 'Sổ Lưu Niệm',
  BREATHING_EXERCISE: 'Bài Thở 4-7-8',

  // ─── Cấp độ / Nhóm ───────────────────────────────────
  COHORT: 'Nhóm',                        // Cohort
  TIER: 'Chặng',                         // Tier
  FTND: 'Mức Lệ Thuộc Nicotin',          // FTND Score
  FTND_SHORT: 'Mức Lệ Thuộc',
  COHORT_LIGHT: 'Nhẹ',                   // FTND 0-3
  COHORT_MODERATE: 'Vừa',                // FTND 4-6
  COHORT_HEAVY: 'Nặng',                  // FTND 7-10

  // ─── Tin nhắn / thông báo ────────────────────────────
  NOTIFICATION: 'Tin Nhắn Nhắc',
  VOICE_MESSAGE: 'Bản Ghi Âm Anh Khang',
  VOICE_FROM_KHANG: 'Voice từ Khang',
  DAILY_REMINDER: 'Nhắc Tối',

  // ─── Trigger và cảm xúc ──────────────────────────────
  TRIGGER: 'Tình Huống Gây Thèm',
  CRAVING: 'Cơn Thèm',
  CRAVING_INTENSITY: 'Mức Độ Thèm',
  MOOD: 'Tâm Trạng',
  RISKY_HOURS: 'Giờ Khó Nhất Trong Ngày',
  TOP_TRIGGERS: 'Tình Huống Gây Thèm Nhiều Nhất',

  // ─── Tài chính ───────────────────────────────────────
  PRICING: 'Mức Phí',
  PRICE: 'Giá',
  REFUND: 'Hoàn Tiền',
  SUBSCRIPTION: 'Trả Theo Tuần',
  PAY_AFTER_SUCCESS: 'Trả Sau Khi Thành Công',
  PAY_FULL: 'Trả Một Lần',
  PAY_TRIAL: 'Trả Thử',
  MONEY_SAVED: 'Tiền Tiết Kiệm',
  CIGS_PER_DAY: 'Số Điếu Mỗi Ngày',
  PRICE_PER_CIG: 'Giá Mỗi Điếu',

  // ─── Cộng đồng ───────────────────────────────────────
  COMMUNITY: 'Cộng Đồng Sol',
  ALUMNI: 'Người Tự Do',
  SPONSOR: 'Đại Sứ Sol',
  COHORT_MONTH: 'Đội Sol',

  // ─── Khác ────────────────────────────────────────────
  COMORBIDITY_CHECK: '4 Câu Hỏi Sàng Lọc Tâm Lý',
  IMPLEMENTATION_INTENTION: 'Kế B Cụ Thể',
  MINDFULNESS: 'Chánh Niệm',
  CESSATION: 'Cai Thuốc',
  RELAPSE: 'Tái Phát',
  ABSTINENCE: 'Sạch (Không Hút)',
} as const;

// Hỗ trợ rút gọn cho các mục có 2 phiên bản
export type ViKey = keyof typeof VI;
