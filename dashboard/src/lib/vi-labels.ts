// dashboard/src/lib/vi-labels.ts — mirror frontend/src/lib/vi-labels.ts
// Xem comment ở file gốc. Đồng bộ 2 file khi update.
export const VI = {
  STAGE_OBSERVE: 'Nhận Diện',
  STAGE_CONTROL: 'Kiểm Soát',
  STAGE_MASTER: 'Làm Chủ',
  STAGE_FREE: 'Người Tự Do',

  Q_DAY: 'Ngày Quyết Định',
  Q_DAY_CEREMONY: 'Lễ Ngày Quyết Định',
  GRADUATION_DAY: 'Lễ Tốt Nghiệp',
  Q_DAY_T_MINUS_2: 'Còn 2 ngày Quyết Định',
  Q_DAY_T_MINUS_1: 'Đêm trước Quyết Định',

  CRISIS_MODE: 'Lúc Khó Nhất',
  PLAN_B: 'Kế Hoạch Dự Phòng',
  PLAN_B_SHORT: 'Kế B',
  CHECK_IN: 'Ghi Nhận Hôm Nay',
  CHECK_IN_SHORT: 'Ghi nhận',
  STREAK: 'Chuỗi Ngày Sạch',
  WITHDRAWAL: 'Lúc Rút (Sau Cai)',
  ONBOARDING: 'Đăng Ký',
  IDENTITY: 'Chính Mình',
  COMMITMENT: 'Cam Kết',
  WORKBOOK: 'Sổ Hành Trình',
  BREATHING_EXERCISE: 'Bài Thở 4-7-8',

  COHORT: 'Nhóm',
  TIER: 'Chặng',
  FTND: 'Mức Lệ Thuộc Nicotin',
  FTND_SHORT: 'Mức Lệ Thuộc',
  COHORT_LIGHT: 'Nhẹ',
  COHORT_MODERATE: 'Vừa',
  COHORT_HEAVY: 'Nặng',

  NOTIFICATION: 'Tin Nhắn Nhắc',
  VOICE_MESSAGE: 'Bản Ghi Âm Anh Khang',
  VOICE_FROM_KHANG: 'Voice từ Khang',
  DAILY_REMINDER: 'Nhắc Tối',

  TRIGGER: 'Tình Huống Gây Thèm',
  CRAVING: 'Cơn Thèm',
  CRAVING_INTENSITY: 'Mức Độ Thèm',
  MOOD: 'Tâm Trạng',
  RISKY_HOURS: 'Giờ Khó Nhất Trong Ngày',
  TOP_TRIGGERS: 'Tình Huống Gây Thèm Nhiều Nhất',

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

  COMMUNITY: 'Cộng Đồng Sol',
  ALUMNI: 'Người Tự Do',
  SPONSOR: 'Đại Sứ Sol',
  COHORT_MONTH: 'Đội Sol',

  COMORBIDITY_CHECK: '4 Câu Hỏi Sàng Lọc Tâm Lý',
  IMPLEMENTATION_INTENTION: 'Kế B Cụ Thể',
  MINDFULNESS: 'Chánh Niệm',
  CESSATION: 'Cai Thuốc',
  RELAPSE: 'Tái Phát',
  ABSTINENCE: 'Sạch (Không Hút)',
} as const;

export type ViKey = keyof typeof VI;
