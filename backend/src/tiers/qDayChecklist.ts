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
      label: 'Đã đọc Điều khoản miễn trừ y tế',
      description:
        'SOL là công cụ đồng hành — KHÔNG thay thế tư vấn của bác sĩ. Quan trọng nếu bạn có bệnh nền (tim mạch, cao huyết áp, thai kỳ, đái tháo đường…). Đây là pháp y bắt buộc.',
      wikiUrl: 'https://sol.vn/wiki/dieu-khoan-mien-tru-y-te',
      required: true,
    },
    {
      id: 'inform_family',
      icon: '👨‍👩‍👧',
      label: 'Đã thông báo cho người thân về quyết định cai',
      description:
        'Nói với vợ/chồng, con cái, bạn thân trong nhà — KHÔNG cần dài, chỉ 1 câu "Anh/Em đang cai thuốc". Người xung quanh biết để hỗ trợ + không vô tình mời thuốc.',
      wikiUrl: 'https://sol.vn/wiki/noi-voi-nguoi-than',
      required: true,
    },
    {
      id: 'paid_starter',
      icon: '💳',
      label: 'Đã thanh toán gói Khởi động 99k',
      description:
        'Gói trả phí có hiệu lực sau khi thanh toán. Chỉ áp dụng nếu bạn chọn gói Khởi động hoặc Đồng hành.',
      onlyForTier: 'KHOI_DONG',
      required: true,
    },

    /* ─── 5 KHUYẾN KHÍCH (optional, không gate) ───────── */
    {
      id: 'read_prep_guide',
      icon: '📖',
      label: 'Đã đọc bài "Chuẩn bị cho Ngày D"',
      description:
        'Bài viết hướng dẫn chuẩn bị tinh thần và vật chất 7 ngày trước khi cai. Mất ~10 phút đọc. Tăng tỷ lệ thành công ~15% theo nghiên cứu cessation.',
      wikiUrl: 'https://sol.vn/wiki/chuan-bi-ngay-d',
      required: false,
    },
    {
      id: 'remove_triggers',
      icon: '🗑️',
      label: 'Đã loại bỏ thuốc lá, gạt tàn, bật lửa khỏi nhà / xe / ví',
      description:
        '"Out of sight, out of mind." Tuần đầu tiên cám dỗ nhiều nhất khi vô tình thấy đồ cũ. Khuyến khích — nhưng không bắt buộc tick để bắt đầu.',
      wikiUrl: 'https://sol.vn/wiki/loai-bo-trigger',
      required: false,
    },
    {
      id: 'prepare_kit',
      icon: '🎒',
      label: 'Đã chuẩn bị "kit khẩn cấp"',
      description:
        'Kẹo cao su không đường, hạt dưa, chai nước, bài tập hít thở 4-7-8 in sẵn. Khi cơn thèm ập đến, bạn cần thay thế NGAY. Có thể chuẩn bị sau khi đặt Q-Day.',
      wikiUrl: 'https://sol.vn/wiki/kit-khan-cap',
      required: false,
    },
    {
      id: 'consult_doctor',
      icon: '🩺',
      label: 'Đã tham khảo bác sĩ (nếu có bệnh nền)',
      description:
        'Nếu bạn cao huyết áp, tim mạch, đang dùng thuốc tâm thần, đái tháo đường, hoặc đang mang thai — hỏi bác sĩ về thuốc hỗ trợ cai (NRT, Bupropion). Nếu không có bệnh nền, bỏ qua.',
      wikiUrl: 'https://sol.vn/wiki/tham-khao-bac-si',
      required: false,
    },
    {
      id: 'plan_hard_day',
      icon: '📅',
      label: 'Đã đặt lịch nhắc người thân cho Ngày D+3 (đỉnh khó nhất)',
      description:
        'Ngày 3 là đỉnh withdrawal. Hẹn ai đó gọi điện / qua nhà / rủ đi bộ vào tối D+3. Giảm 30% nguy cơ tái phát.',
      wikiUrl: 'https://sol.vn/wiki/ngay-d-plus-3',
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
    err.statusCode = 412; // Precondition Failed
    err.payload = {
      error: 'q_day_checklist_incomplete',
      requiredCount: state.requiredCount,
      requiredDoneCount: state.requiredDoneCount,
      missing: state.items.filter((it) => it.required && !it.checkedAt).map((it) => it.id),
    };
    throw err;
  }
}
