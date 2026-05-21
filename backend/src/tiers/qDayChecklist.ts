// backend/src/tiers/qDayChecklist.ts
//
// "System requirements" cho Q-Day. Trước khi user được đặt ngày bắt đầu cai
// (quitDate) hoặc mua gói KHOI_DONG/DONG_HANH, họ phải tick xong bảng
// kiểm tra này — giống như checklist trước khi cài đặt phần mềm hay ra trận.
//
// Cấu hình lưu trong AppSetting key='q_day_checklist' (admin sửa được runtime).
// Trạng thái user check trong User.settings.qDayChecklist (JSON map):
//   { itemId: ISO timestamp khi tick, ... }

import { prisma } from '../db';

export interface QDayChecklistItem {
  id: string;
  label: string;
  description?: string;
  wikiUrl?: string;
  /** Bắt buộc tick mới được đặt Q-Day (true) hay chỉ khuyến khích (false). */
  required: boolean;
  /** Chỉ áp dụng cho user đã mua tier này (KHOI_DONG / DONG_HANH).
   *  Vd "đóng phí" chỉ hiện cho ai chuẩn bị mua, không hiện cho FREE. */
  onlyForTier?: 'KHOI_DONG' | 'DONG_HANH';
  /** Icon emoji, hiển thị trước label. */
  icon?: string;
}

export interface QDayChecklistConfig {
  items: QDayChecklistItem[];
  /** Lời giới thiệu trên đầu checklist. */
  intro?: string;
  /** Lời cảnh báo cuối, vd "Đây là lời hứa với chính mình". */
  outro?: string;
}

/**
 * Default seed — admin có thể sửa qua /admin/q-day-checklist.
 *
 * THIẾT KẾ V2 (cắt UX friction):
 *   - 3 items REQUIRED (gate cứng): medical_disclaimer + inform_family + paid_starter (paid only)
 *   - 5 items OPTIONAL (khuyến khích): user check khi sẵn sàng, không gate
 *   - Lý do: 8 mục bắt buộc làm user 45+ Việt drop-off cao. UX > completism.
 */
export const DEFAULT_CHECKLIST: QDayChecklistConfig = {
  intro:
    'Trước khi đặt Q-Day, có vài điều CẦN bạn xác nhận + vài điều KHUYẾN KHÍCH chuẩn bị. Mục có badge ⭐ "Bắt buộc" phải tick — còn lại bạn check khi sẵn sàng (sau khi đặt Q-Day cũng được).',
  outro:
    'Khi tick đủ 3 mục bắt buộc, ngày Q-Day sẽ kích hoạt và đồng hồ chạy. Các mục khuyến khích bạn có thể quay lại check sau — chúng giúp tăng tỷ lệ thành công nhưng không bắt buộc.',
  items: [
    /* ─── 3 BẮT BUỘC (gate cứng) ──────────────────────── */
    {
      id: 'read_medical_disclaimer',
      icon: '⚕️',
      label: 'Xác nhận hiểu rõ Sol không thay thế bác sĩ',
      description:
        'Sol là công cụ đồng hành — KHÔNG thay thế tư vấn của bác sĩ. Anh xác nhận 4 điểm: (1) Sol không kê thuốc. (2) Đau ngực dữ/ho ra máu/khó thở dữ → gọi 115 NGAY. (3) Sol không chẩn đoán cá nhân. (4) Anh chịu trách nhiệm cuối cùng cho sức khoẻ.',
      wikiUrl: 'https://sol.vn/chuan-bi-q-day-cai-thuoc#disclaimer',
      required: true,
    },
    {
      id: 'inform_family',
      icon: '👨‍👩‍👧',
      label: 'Đã thông báo người thân về quyết định cai',
      description:
        '5-7 ngày đầu cortisol tăng → cáu gắt. Khoa học (Lerman 2002): user không thông báo vợ/chồng có tỷ lệ tái nghiện cao hơn 2.4x. Báo trước để gia đình hỗ trợ + không vô tình mời thuốc + sẵn sàng cho ngày D+3 Bức Tường.',
      wikiUrl: 'https://sol.vn/chuan-bi-q-day-cai-thuoc',
      required: true,
    },
    {
      id: 'commit_digital',
      icon: '✍️',
      label: 'Đã viết cam kết SỐ HOÁ trong app (lý do bỏ + thư cho tương lai)',
      description:
        'Vào Hồ sơ → viết 3-5 LÝ DO bỏ thuốc CỤ THỂ (lưu User.quitReasons[]). Vào Workbook → viết THƯ CHO TƯƠNG LAI (lưu ProgressJournal.letterToSelf). Sol AI tự REPLAY các lý do này khi anh yếu lòng, sắp hút, chat "bỏ cuộc". Tương lai = Sổ Lưu Niệm Số D30/60/90/365.',
      wikiUrl: 'https://sol.vn/chuan-bi-q-day-cai-thuoc',
      required: true,
    },

    /* ─── 5 KHUYẾN KHÍCH (optional, không gate) ───────── */
    {
      id: 'read_prep_guide',
      icon: '📖',
      label: 'Đã đọc 14 bài Giảm Dần (T-14 → T-1)',
      description:
        'Bộ 14 bài Pre-Q-Day cung cấp khoa học nền tảng + kỹ thuật giảm dần 25%/tuần. User đọc đủ 14 bài có tỷ lệ thành công cao hơn 18% (Sol internal data). Mất ~ 30 phút tổng.',
      wikiUrl: 'https://sol.vn/giam-dan-ngay-1-co-hieu-qua-khong',
      required: false,
    },
    {
      id: 'remove_triggers',
      icon: '🗑️',
      label: 'Đã loại bỏ thuốc, gạt tàn, bật lửa khỏi nhà / xe / ví',
      description:
        '"Out of sight, out of mind" (Wansink 2006). 60% relapse trong 72h đầu do còn thuốc trong nhà. 8 mục dọn: thuốc + bật lửa + gạt tàn + hộp + thuốc xe + thuốc ví + quần áo có mùi + ghế ô tô khử mùi.',
      wikiUrl: 'https://sol.vn/giam-dan-ngay-12-don-cue-stimulus-control',
      required: false,
    },
    {
      id: 'prepare_kit',
      icon: '🎒',
      label: 'Đã chuẩn bị Kit Khẩn cấp (2 set: nhà + xe)',
      description:
        'Kit chuẩn 8 thứ: kẹo cao su NRT (Nicorette 2mg), nước lọc 1.5L, kẹo cứng không đường, hạt hướng dương, sách yêu thích, tai nghe + Khang voice, danh bạ Khang 02439931800. Quan trọng nhất: 3 lý do bỏ đã lưu trong app Sol — AI tự đọc lại khi anh thèm.',
      wikiUrl: 'https://sol.vn/giam-dan-ngay-9-kit-thay-the',
      required: false,
    },
    {
      id: 'consult_doctor',
      icon: '🩺',
      label: 'Đã tham khảo bác sĩ (nếu có bệnh nền)',
      description:
        'Cao huyết áp, tim mạch, đái tháo đường, mang thai, trầm cảm/lo âu → nên khám trước Q-Day. Bác sĩ có thể kê NRT (an toàn nhất), Champix (varenicline), Bupropion (tránh nếu mang thai). Không bắt buộc nếu khỏe mạnh + hút < 20 điếu/ngày + tuổi < 50.',
      wikiUrl: 'https://sol.vn/giam-dan-ngay-10-quyet-dinh-nrt-thuoc-ke',
      required: false,
    },
    {
      id: 'plan_hard_day',
      icon: '📅',
      label: 'Đặt lịch nhắc người thân gọi ngày D+3 (Bức Tường)',
      description:
        'D+3 là đỉnh withdrawal — 70% người vấp hôm đó (NIDA 2019). Đặt Google Calendar: "Ngày D+3 18:00 — Gọi user hỏi thăm 5 phút". Có người thân gọi giảm 50% risk relapse (Cohen 2000 social support).',
      wikiUrl: 'https://sol.vn/ngay-3-buc-tuong-trieu-chung-cai-dat-dinh-va-bat-dau-giam',
      required: false,
    },
  ],
};

/** Đọc config từ DB (AppSetting), fallback DEFAULT_CHECKLIST. */
export async function getChecklistConfig(): Promise<QDayChecklistConfig> {
  const row = await prisma.appSetting.findUnique({
    where: { key: 'q_day_checklist' },
  });
  if (!row || !row.value || typeof row.value !== 'object') {
    return DEFAULT_CHECKLIST;
  }
  return row.value as unknown as QDayChecklistConfig;
}

export async function saveChecklistConfig(
  cfg: QDayChecklistConfig,
  updatedBy?: string,
): Promise<QDayChecklistConfig> {
  await prisma.appSetting.upsert({
    where: { key: 'q_day_checklist' },
    create: {
      key: 'q_day_checklist',
      value: cfg as any,
      updatedBy,
    },
    update: { value: cfg as any, updatedBy },
  });
  return cfg;
}

/**
 * Tính state cho 1 user — items + đã tick chưa.
 * targetTier: gói user dự định mua (FREE = không mua); để filter onlyForTier.
 */
export async function userChecklistState(
  userId: string,
  targetTier: 'FREE' | 'KHOI_DONG' | 'DONG_HANH' = 'FREE',
) {
  const [cfg, user] = await Promise.all([
    getChecklistConfig(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true, tier: true },
    }),
  ]);
  const userChecks = (user?.settings as any)?.qDayChecklist ?? {};

  // Filter onlyForTier: chỉ giữ item áp dụng
  const items = cfg.items.filter((it) => {
    if (!it.onlyForTier) return true;
    if (it.onlyForTier === 'KHOI_DONG' && (targetTier === 'KHOI_DONG' || targetTier === 'DONG_HANH')) return true;
    if (it.onlyForTier === 'DONG_HANH' && targetTier === 'DONG_HANH') return true;
    return false;
  });

  const enriched = items.map((it) => ({
    ...it,
    checkedAt: userChecks[it.id] ?? null,
  }));

  const requiredItems = enriched.filter((it) => it.required);
  const requiredDone = requiredItems.filter((it) => it.checkedAt !== null);
  const allRequiredDone = requiredItems.length === requiredDone.length;

  return {
    intro: cfg.intro,
    outro: cfg.outro,
    items: enriched,
    requiredCount: requiredItems.length,
    requiredDoneCount: requiredDone.length,
    allRequiredDone,
  };
}

/** Tick 1 item cho user. Idempotent — không ghi đè timestamp cũ. */
export async function checkItem(userId: string, itemId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });
  const settings = (user?.settings ?? {}) as any;
  const checks = { ...(settings.qDayChecklist ?? {}) };
  if (!checks[itemId]) {
    checks[itemId] = new Date().toISOString();
  }
  await prisma.user.update({
    where: { id: userId },
    data: { settings: { ...settings, qDayChecklist: checks } },
  });
}

/** Bỏ tick 1 item (nếu user đổi ý — ít dùng). */
export async function uncheckItem(userId: string, itemId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });
  const settings = (user?.settings ?? {}) as any;
  const checks = { ...(settings.qDayChecklist ?? {}) };
  delete checks[itemId];
  await prisma.user.update({
    where: { id: userId },
    data: { settings: { ...settings, qDayChecklist: checks } },
  });
}

/** Guard: chặn đặt Q-Day nếu chưa tick xong required. Throw nếu fail. */
export async function assertChecklistComplete(
  userId: string,
  targetTier: 'FREE' | 'KHOI_DONG' | 'DONG_HANH' = 'FREE',
): Promise<void> {
  const state = await userChecklistState(userId, targetTier);
  if (!state.allRequiredDone) {
    const err: any = new Error('q_day_checklist_incomplete');
    err.statusCode = 412;
    err.payload = {
      error: 'q_day_checklist_incomplete',
      requiredCount: state.requiredCount,
      requiredDoneCount: state.requiredDoneCount,
      missing: state.items.filter((it) => it.required && !it.checkedAt).map((it) => it.id),
    };
    throw err;
  }
}

/**
 * Sprint 4 — Wire QDayChecklist với Phase 5 Journey Scheduler.
 *
 * Khi user tick xong 3 mục REQUIRED:
 *   1. Set User.qDayConfirmedAt = now (legacy compatibility)
 *   2. Set User.qDayDate = qDayDate (Phase 5)
 *   3. Set User.journeyType = full-51 (default)
 *   4. Call enrollUser() → tạo 52 ScheduledPush
 *   5. Trả về kết quả + countdown
 *
 * Idempotent: nếu user đã có journeyStatus='active', không enroll lại.
 *
 * @param userId User.id
 * @param qDayDate Ngày Q-Day user chọn (default = today + 7 days nếu không truyền)
 * @param journeyType Default 'full-51'
 */
export async function confirmChecklistAndEnroll(params: {
  userId: string;
  qDayDate?: Date;
  journeyType?: 'lam-quen' | 'giam-dan' | 'q-day' | 'full-51' | 'maintenance';
}): Promise<{
  ok: boolean;
  enrolled: boolean;
  qDayConfirmedAt: Date;
  qDayDate: Date;
  journeyType: string;
  scheduledPushCount: number;
}> {
  const { userId } = params;
  const journeyType = params.journeyType ?? 'full-51';
  // Default Q-Day = 7 ngày tới nếu không truyền
  const qDayDate = params.qDayDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // 1. Guard — phải tick xong required
  await assertChecklistComplete(userId);

  // 2. Check user state
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, qDayConfirmedAt: true, journeyStatus: true, preferredPushHour: true },
  });
  if (!user) throw new Error('user_not_found');

  // Đã enrolled → idempotent
  if (user.journeyStatus === 'active' && user.qDayConfirmedAt) {
    const count = await prisma.scheduledPush.count({
      where: { userId, status: { in: ['pending', 'sent'] } },
    });
    return {
      ok: true,
      enrolled: false,
      qDayConfirmedAt: user.qDayConfirmedAt,
      qDayDate,
      journeyType,
      scheduledPushCount: count,
    };
  }

  // 3. Lazy import journeyEngine (avoid circular dep)
  const { enrollUser } = await import('../zalo/journeyEngine');

  // 4. Enroll Phase 5
  const result = await enrollUser({
    userId,
    journeyType,
    qDayDate,
    preferredHour: user.preferredPushHour ?? 7,
  });

  // 5. Set qDayConfirmedAt (legacy field) — đồng bộ 2 systems
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: { qDayConfirmedAt: now },
  });

  return {
    ok: true,
    enrolled: true,
    qDayConfirmedAt: now,
    qDayDate,
    journeyType,
    scheduledPushCount: result.created,
  };
}
