// dashboard/src/lib/vi-labels.ts — mirror frontend/src/lib/vi-labels.ts
// Xem comment ở file gốc. Đồng bộ 2 file khi update.
//
// Dictionary chuẩn cho Sol — app cai thuốc lá hướng tới đàn ông Việt 45+.
// Quy tắc:
//   • Tuyệt đối tránh tiếng Anh trong UI user-facing.
//   • Thuật ngữ khoa học giữ tên chuẩn (FTND, dopamine) NHƯNG luôn kèm chú
//     thích tiếng Việt lần đầu xuất hiện.
//   • Gọi user "anh" hoặc "bạn" tuỳ user.pronouns (default "anh").
//   • Tone: founder-to-founder, ấm áp, gần gũi, KHÔNG sách vở.
//
// Cập nhật 2026-05-24 (Vietnamization audit): mở rộng dictionary cho audit.
export const VI = {
  // ─── 4 chặng hành trình (canonical 2026-05-18) ──────────────────────
  STAGE_OBSERVE: 'Nhận Diện',
  STAGE_CONTROL: 'Kiểm Soát',
  STAGE_MASTER: 'Làm Chủ',
  STAGE_REBUILD: 'Tái Thiết',
  STAGE_FREE: 'Người Tự Do',
  STAGE_AMBASSADOR: 'Đại Sứ Sol',

  // ─── Q-Day (Ngày Quyết Định) ─────────────────────────────────────────
  Q_DAY: 'Ngày Quyết Định',
  Q_DAY_ALT: 'Ngày Cai',
  Q_DAY_CEREMONY: 'Lễ Ngày Quyết Định',
  GRADUATION_DAY: 'Lễ Tốt Nghiệp',
  Q_DAY_T_MINUS_2: 'Còn 2 ngày Quyết Định',
  Q_DAY_T_MINUS_1: 'Đêm trước Quyết Định',
  Q_DAY_COUNTDOWN: 'Đếm ngược Ngày Quyết Định',

  // ─── Khái niệm chính ────────────────────────────────────────────────
  CRISIS_MODE: 'Lúc Khó Nhất',
  PLAN_B: 'Kế Hoạch Dự Phòng',
  PLAN_B_SHORT: 'Kế B',
  CHECK_IN: 'Ghi Nhận Hôm Nay',
  CHECK_IN_SHORT: 'Ghi nhận',
  STREAK: 'Chuỗi Ngày Sạch',
  STREAK_SHORT: 'Chuỗi sạch',
  WITHDRAWAL: 'Triệu Chứng Cai',
  WITHDRAWAL_ALT: 'Cơn Cai',
  ONBOARDING: 'Bắt Đầu',
  IDENTITY: 'Chính Mình',
  COMMITMENT: 'Cam Kết',
  WORKBOOK: 'Sổ Lưu Niệm',
  BREATHING_EXERCISE: 'Bài Thở 4-7-8',
  DASHBOARD: 'Hành Trình',
  JOURNAL: 'Nhật Ký & Check-in',
  SOL_AI: 'Trò Chuyện Sol',
  PROFILE: 'Hồ Sơ Cá Nhân',
  SETTINGS: 'Cài đặt',

  // ─── Cohort (Lộ Trình) ─────────────────────────────────────────────
  COHORT: 'Lộ Trình',
  COHORT_GROUP: 'Nhóm Đồng Đội',
  TIER: 'Chặng',
  FTND: 'FTND',
  FTND_FULL: 'Mức Lệ Thuộc Nicotin (FTND)',
  FTND_SHORT: 'Mức Lệ Thuộc',
  FTND_LABEL: 'Test Mức Lệ Thuộc Nicotin',
  COHORT_LIGHT: 'Nhẹ',
  COHORT_MODERATE: 'Trung bình',
  COHORT_HEAVY: 'Nặng',

  // ─── Khoa học (Y khoa giữ tên + chú thích Việt) ─────────────────────
  NICOTINE: 'Nicotin',
  DOPAMINE: 'Dopamine (chất hạnh phúc trong não)',
  DOPAMINE_SHORT: 'Dopamine',
  RECEPTOR: 'Thụ thể',
  NICOTINIC_RECEPTOR: 'Thụ thể Nicotin',
  CILIA: 'Lông mao phổi',
  CO_BLOOD: 'CO (khí độc) trong máu',
  CRAVING_WAVE: 'Cơn thèm theo đợt',

  // ─── Notifications ──────────────────────────────────────────────────
  NOTIFICATION: 'Tin Nhắn Nhắc',
  VOICE_MESSAGE: 'Bản Ghi Âm Anh Khang',
  VOICE_FROM_KHANG: 'Voice từ Khang',
  DAILY_REMINDER: 'Nhắc Tối',

  // ─── Triggers / Cravings ────────────────────────────────────────────
  TRIGGER: 'Tình Huống Gây Thèm',
  TRIGGER_SHORT: 'Tình huống',
  TRIGGER_STRESS: 'Căng thẳng',
  TRIGGER_EATING: 'Sau cơm',
  TRIGGER_IDLE: 'Lúc rảnh',
  TRIGGER_SOCIAL: 'Tụ tập / Nhậu',
  TRIGGER_OTHER: 'Khác',
  CRAVING: 'Cơn Thèm',
  CRAVING_INTENSITY: 'Mức Độ Thèm',
  MOOD: 'Tâm Trạng',
  RISKY_HOURS: 'Giờ Khó Nhất Trong Ngày',
  TOP_TRIGGERS: 'Tình Huống Gây Thèm Nhiều Nhất',
  PEAK_HOUR: 'Giờ thèm nhất',
  BASELINE: 'Mức nền',
  BASELINE_FULL: 'Mức nền (số điếu trước khi cai)',

  // ─── Patterns / Quy Luật ────────────────────────────────────────────
  PATTERN: 'Quy Luật',
  PATTERN_MAP: 'Bản đồ quy luật',
  HOURLY_PATTERN: 'Khung giờ hay hút',
  BEHAVIOR_PATTERN: 'Quy luật hành vi',
  PATTERN_OBSERVATION: 'Quan sát quy luật',
  DISTRIBUTION_24H: 'Phân bố 24 giờ',

  // ─── Pricing ────────────────────────────────────────────────────────
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
  FREE_DAYS: 'Ngày miễn phí',

  // ─── Community ──────────────────────────────────────────────────────
  COMMUNITY: 'Cộng Đồng Sol',
  ALUMNI: 'Người Tự Do',
  SPONSOR: 'Đại Sứ Sol',
  COHORT_MONTH: 'Đội Sol',

  // ─── Workbook sections ──────────────────────────────────────────────
  COMORBIDITY_CHECK: '4 Câu Hỏi Sàng Lọc Tâm Lý',
  IMPLEMENTATION_INTENTION: 'Kế B Cụ Thể',
  MINDFULNESS: 'Chánh Niệm',
  CESSATION: 'Cai Thuốc',
  RELAPSE: 'Tái Hút',
  ABSTINENCE: 'Sạch (Không Hút)',
  LAPSE: 'Trượt Nhẹ',

  // ─── UI actions (thay tiếng Anh phổ biến) ──────────────────────────
  LOADING: 'Đang tải…',
  LOADING_JOURNEY: 'Sol đang khởi động hành trình…',
  SAVE: 'Lưu',
  SAVE_CHANGES: 'Lưu thay đổi',
  CANCEL: 'Bỏ qua',
  CLOSE: 'Đóng',
  CONFIRM: 'Đồng ý',
  CONTINUE: 'Tiếp tục',
  BACK: 'Quay lại',
  NEXT: 'Tiếp →',
  PREVIOUS: '← Trước',
  SKIP: 'Bỏ qua',
  DONE: 'Xong',
  SUBMIT: 'Gửi',
  TRY_AGAIN: 'Thử lại',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  SIGN_UP: 'Đăng ký',
  MAGIC_LINK: 'Liên kết đăng nhập một lần',
  ERROR_GENERIC: 'Có lỗi xảy ra',
  ERROR_NETWORK: 'Lỗi kết nối',
  SUCCESS: 'Thành công',
  WARNING: 'Cảnh báo',
  INFO: 'Thông tin',
  TAP_TO: 'Bấm để',
  CLICK_TO: 'Bấm để',
  OK: 'Đồng ý',
  YES: 'Có',
  NO: 'Không',

  // ─── Mastery + Analytics ────────────────────────────────────────────
  MASTERY_SCORE: 'Chỉ Số Làm Chủ',
  ANALYTICS: 'Phân Tích',
  REPORT: 'Báo Cáo',
  CIGS_AVOIDED: 'Điếu KHÔNG đốt',
  LIFE_ADDED: 'Tuổi thọ thêm',

  // ─── Action buttons phổ biến ────────────────────────────────────────
  UPGRADE: 'Nâng cấp',
  PAUSE: 'Tạm dừng',
  RESUME: 'Tiếp tục hành trình',
  EXIT: 'Rút lui',
  SHARE: 'Chia sẻ',
  COPY: 'Sao chép',
} as const;

export type ViKey = keyof typeof VI;
