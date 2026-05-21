// backend/src/zalo/journeyEngine.ts
//
// 51-Day Journey Engine — Sol v4 (Phase 5)
//
// Trách nhiệm:
//   1. enrollUser() — khi user chọn lộ trình qua Zalo OA Welcome flow,
//      backend tạo 51 ScheduledPush records pre-computed (1/ngày).
//   2. resolveTemplateForDay() — map dayOffset → templateCode + wikiSlug
//      + params để fill ZNS template.
//   3. computeScheduledAt() — tính lúc gửi từ qDayDate + dayOffset +
//      preferredPushHour (user chọn) + timezone.
//   4. cancelJourney() — khi user pause/quit, cancel toàn bộ pending push.
//   5. recomputeCurrentDay() — chạy mỗi 7AM, update User.currentJourneyDay.
//
// Map content:
//   - Pre-Q-Day: 7 LAMQUEN (T-21 → T-15) + 14 GIAMDAN (T-14 → T-1)
//   - Q-Day: 30 chip (D1 → D30)
//   - Milestones (7/14/21/30): dùng SOL_MILESTONE_GENERIC
//   - Other days: dùng SOL_DAILY_CHIP

import { prisma } from '../db';
import { logger } from '../utils/logger';

// ─── Journey type & day mapping ────────────────────────────────────────

export type JourneyType = 'lam-quen' | 'giam-dan' | 'q-day' | 'full-51' | 'maintenance';
export type JourneyStatus = 'active' | 'paused' | 'graduated' | 'relapsed';

/** Map dayOffset → wiki slug + chip preview (200 ký tự).
 *  Negative = Pre-Q-Day, Positive = Post-Q-Day, 0 = Q-Day itself.
 *  Slugs khớp với 51 bài đã publish lên sol.vn.
 */
const CHIP_LIBRARY: Record<number, { slug: string; title: string; body: string }> = {
  // ── LÀM QUEN (T-21 → T-15) — 7 ngày ───────────────────────────────
  [-21]: { slug: 'lam-quen-ngay-1', title: 'Vì sao bạn vẫn hút?', body: 'Não đã quen nhận dopamine từ nicotine. Bài 1: hiểu cơ chế nghiện trước khi bỏ.' },
  [-20]: { slug: 'nghien-nicotine-la-gi', title: 'Nghiện nicotine là gì?', body: 'Receptor nicotine tăng 3x sau 1 năm hút. Não đói khi không có nicotine.' },
  [-19]: { slug: 'chi-phi-thuc-su-cua-thuoc-la', title: 'Chi phí thực sự của thuốc', body: '5 năm = 36.5 triệu (1 Honda Wave). Chưa tính chi phí y tế tương lai.' },
  [-18]: { slug: 'bo-thuoc-that-bai-nhieu-lan', title: 'Vì sao bỏ nhiều lần vẫn vấp?', body: 'Trung bình 30+ lần thử mới cai hẳn. Khang lần 5 mới cuối. Lý do khoa học.' },
  [-17]: { slug: '3-phuong-phap-khoa-hoc', title: '3 phương pháp khoa học', body: 'Cold turkey 3-5%. NRT 10-15%. Champix 25-30%. Combo 35-40% (Cochrane).' },
  [-16]: { slug: 'stages-of-change-quiz', title: 'Test sẵn sàng cai chưa?', body: '5 giai đoạn Prochaska. Anh đang ở giai đoạn nào? Làm quiz 3 phút.' },
  [-15]: { slug: 'cam-ket-chon-lo-trinh', title: 'Cam kết + chọn lộ trình', body: 'Bài cuối Làm Quen. Mai bắt đầu 14 ngày Giảm Dần. Anh sẵn sàng?' },

  // ── GIẢM DẦN (T-14 → T-1) — 14 ngày ───────────────────────────────
  [-14]: { slug: 'giam-dan-ngay-1', title: 'Ngày 1 Giảm Dần — Kế hoạch', body: 'Bắt đầu giảm 25% mỗi tuần. Hôm nay đánh số 20 điếu, mai còn 15.' },
  [-13]: { slug: 'ban-do-trigger', title: 'Bản đồ trigger thuốc', body: 'Vẽ ra 10 cú trigger cao nhất: cà phê, sau cơm, stress. Cảnh giác 3 nhất.' },
  [-12]: { slug: 'tri-hoan-30-phut', title: 'Trì hoãn 30 phút', body: 'Mỗi cơn thèm = chờ 30 phút trước khi hút. Não đoán không bao giờ được.' },
  [-11]: { slug: 'fagerstrom-test', title: 'Test mức nghiện FTND', body: '6 câu Fagerström. Score 7-10 = nặng, cần combo. 0-3 nhẹ, cold turkey OK.' },
  [-10]: { slug: 'cat-dieu-dau-tien', title: 'Cắt điếu đầu tiên', body: 'Điếu sáng = mạnh nhất Pavlov. Hôm nay cắt — uống nước thay.' },
  [-9]: { slug: 'tri-hoan-dieu-sang', title: 'Trì hoãn điếu sáng', body: 'Chuyển điếu 1 từ 7h → 9h. Chuyển từ "ngay sau cà phê" sang "sau khi đi bộ".' },
  [-8]: { slug: 'giam-thanh-cong-50pct', title: 'Mốc giảm 50%', body: 'Từ 20 → 10 điếu/ngày. Cơ thể bắt đầu hồi. Cilia phổi mở 1 phần.' },
  [-7]: { slug: 'giam-dan-ngay-7', title: 'Ngày 7 Giảm Dần', body: 'Mốc 1 tuần giảm. Anh đã giảm 50%. Tiếp tục 7 ngày nữa rồi cắt sạch.' },
  [-6]: { slug: 'tang-cuong-sap-cat', title: 'Chuẩn bị cắt sạch', body: 'T-7 ngày. Mua kẹo cao su nicotine (NRT) sẵn cho ngày khó.' },
  [-5]: { slug: 'tu-bo-bat-lua-cuoi', title: 'Từ bỏ bật lửa cuối', body: 'Bỏ tất cả bật lửa khỏi nhà. Ngày khó nhất là Day 3 — chuẩn bị thôi.' },
  [-4]: { slug: 'noi-voi-vo-chong', title: 'Báo với gia đình', body: 'Báo trước vợ con: 7 ngày tới sẽ cáu gắt. Đây là khoa học, không phải tính cách.' },
  [-3]: { slug: 'don-rac-nha', title: 'Dọn rác nhà', body: 'Vứt tất cả thuốc + bật lửa + gạt tàn. Tạo nhà "smoke-free" trước Q-Day 3 ngày.' },
  [-2]: { slug: 'plan-b-if-then', title: 'Plan B if-then', body: '5 tình huống if-then: nếu cà phê thì uống nước. Nếu nhậu thì ra ngoài.' },
  [-1]: { slug: 'giam-dan-ngay-14', title: 'Đêm trước Q-Day', body: 'Đêm cuối. Ngủ sớm. Mai 7h sẽ là ngày đầu không hút trong [X] năm. Khang ở đây.' },

  // ── Q-DAY series (D1 → D30) — 30 ngày ─────────────────────────────
  [0]: { slug: 'q-day-bat-dau', title: 'Q-Day — Bắt đầu', body: 'Hôm nay là ngày Q-Day. Anh chính thức không hút từ giây này.' },
  [1]: { slug: 'ngay-1-24-gio-dau-tien-bo-thuoc-la', title: 'Ngày 1 — 24h đầu', body: 'CO giảm 50% sau 8h. Oxy máu trở lại. Nicotine bắt đầu thải.' },
  [2]: { slug: 'ngay-2-dinh-con-them-nicotine', title: 'Ngày 2 — Đỉnh cơn thèm', body: 'Receptor đói nicotine. Cortisol cao. Cơn thèm 90 giây — sẽ qua.' },
  [3]: { slug: 'ngay-3-buc-tuong-trieu-chung-cai-dat-dinh-va-bat-dau-giam', title: 'Ngày 3 — Bức Tường', body: 'Withdrawal đỉnh. 70% người vấp ở đây. Hôm nay là ngày khó nhất.' },
  [4]: { slug: 'ngay-4-mat-ngu-va-roi-loan-giac-ngu-giai-thich-khoa-hoc', title: 'Ngày 4 — Mất ngủ', body: 'REM rebound. Não đang xây lại chu kỳ ngủ. 40-60% người mất ngủ 1-3 tuần.' },
  [5]: { slug: 'ngay-5-them-an-va-noi-so-tang-can-su-that-khoa-hoc', title: 'Ngày 5 — Thèm ăn', body: 'BMR ↓ 7-10%. Dopamine tìm reward khác → muốn ăn. Trung bình 2-4kg.' },
  [6]: { slug: 'ngay-6-cau-gat-voi-nguoi-than-day-khong-phai-tinh-cach-ban', title: 'Ngày 6 — Cáu gắt', body: 'Đỉnh cortisol. Báo trước vợ con. 5 kỹ thuật hạ cơn.' },
  [7]: { slug: 'ngay-7-moc-1-tuan-nhung-gi-da-thay-doi-trong-co-the-ban', title: 'Mốc 1 TUẦN!', body: 'CO bình thường. BP giảm 10/5. Cilia phổi bắt đầu hoạt động.' },
  [8]: { slug: 'ngay-8-suong-mu-nao-va-kho-tap-trung-nao-bo-dang-tai-cau-truc', title: 'Ngày 8 — Sương mù não', body: 'Acetylcholine tái cân bằng. Khó tập trung 2-3 tuần. 5 cách đẩy nhanh.' },
  [9]: { slug: 'ngay-9-ho-va-dom-phoi-dang-tu-lam-sach', title: 'Ngày 9 — Ho đờm', body: 'Cilia phổi đẩy tar 25-30 năm ra. Đờm vàng/nâu là dấu hiệu TỐT.' },
  [10]: { slug: 'ngay-10-con-them-doi-hinh-dang-tu-sinh-ly-sang-tam-ly', title: 'Ngày 10 — Cơn thèm đổi', body: 'Sinh lý giảm. Tâm lý (Pavlov) bắt đầu. Nhận diện 4 trigger.' },
  [11]: { slug: 'ngay-11-vi-giac-va-khuu-giac-tro-lai-ca-phe-ngon-hon-hoa-thom-hon', title: 'Ngày 11 — Vị giác trở lại', body: 'Taste buds tái sinh. Cà phê đắng hơn, cơm thơm hơn.' },
  [12]: { slug: 'ngay-12-dao-dong-nang-luong-luc-khoe-luc-met', title: 'Ngày 12 — Năng lượng dao động', body: 'Adenosine receptor tái nhạy. Lúc khỏe lúc mệt — bình thường.' },
  [13]: { slug: 'ngay-13-cam-xuc-that-thuong-khi-nao-can-kham-tam-ly', title: 'Ngày 13 — Cảm xúc thất thường', body: '30% có dấu hiệu trầm cảm nhẹ. Phân biệt với cần khám.' },
  [14]: { slug: 'ngay-14-moc-2-tuan-bo-thuoc', title: 'Mốc 2 TUẦN!', body: 'FEV1 ↑ 10-15%. Fibrinogen giảm. Tuần hoàn cải thiện.' },
  [15]: { slug: 'ngay-15-tinh-huong-kho-khan-can-doi-mat-ca-phe-tra-da-via-he-coc-bia-hoi-nhau-bua-an-stress', title: 'Ngày 15 — Tình huống khó', body: 'Cravings sinh học -70%. Pavlov mạnh. 70% vấp D15-D21 do tự tin quá.' },
  [16]: { slug: 'ngay-16-nhau-bia-hoi-via-he-khong-hut-thuoc-song-sot-qua-buoi-dau-tien', title: 'Ngày 16 — Đi nhậu', body: 'Combo nguy hiểm nhất. Rượu giảm ý chí 30%. Plan B 5 bước.' },
  [17]: { slug: 'ngay-17-nham-chan-ke-thu-it-duoc-nhac-den', title: 'Ngày 17 — Nhàm chán', body: 'Low dopamine → não tìm thuốc. 15% vấp do nhàm chán. Hobby mới.' },
  [18]: { slug: 'ngay-18-stress-cong-viec-dieu-thuoc-gio-nghi-khong-con', title: 'Ngày 18 — Stress công việc', body: 'Work-break smoke ritual Pavlov 60.000 lần. 5 thay thế giờ nghỉ.' },
  [19]: { slug: 'ngay-19-khi-ban-be-con-hut-giu-ban-giu-cam-ket-nen-ung-xu-the-nao', title: 'Ngày 19 — Bạn bè còn hút', body: 'Social influence 3x. Giữ ranh giới — không cần cắt bạn.' },
  [20]: { slug: 'ngay-20-giac-mo-hut-thuoc-vi-sao-va-no-co-nguy-hiem-khong', title: 'Ngày 20 — Mơ hút thuốc', body: '60% người mơ hút. REM rebound. KHÔNG predict tái phát (Hajek 2010).' },
  [21]: { slug: 'ngay-21-moc-3-tuan-bo-thuoc-vong-lap-thoi-quen-da-yeu-di', title: 'Mốc 3 TUẦN!', body: 'Habit cũ yếu 60-70%. Huyền thoại 21 ngày SAI — thực 66 ngày (Lally).' },
  [22]: { slug: 'ngay-22-con-them-sau-bua-an-tai-sao-van-dai-dang', title: 'Ngày 22 — Thèm sau cơm', body: 'Post-meal cue mạnh thứ 2 sau cà phê. 5 cách phá Pavlov.' },
  [23]: { slug: 'ngay-23-cuoi-tuan-khi-nghi-thuc-cu-khong-con', title: 'Ngày 23 — Cuối tuần', body: 'Unstructured time = relapse risk cao. 5 ritual mới.' },
  [24]: { slug: 'ngay-24-toi-la-nguoi-khong-hut-chuyen-dich-danh-tinh', title: 'Ngày 24 — Tôi là người không hút', body: 'Identity shift. Relapse rate ↓ 50% (Tombor 2015).' },
  [25]: { slug: 'ngay-25-can-tai-nghien-lapse-neu-ban-hut-1-dieu-dieu-gi-xay-ra', title: 'Ngày 25 — Lapse vs Relapse', body: '1 điếu KHÁC tái nghiện. 70% phục hồi nếu xử lý đúng (Marlatt).' },
  [26]: { slug: 'ngay-26-tien-tiet-kiem-dong-tien-ban-dang-doi-lay-suc-khoe', title: 'Ngày 26 — Tiền tiết kiệm', body: 'Tiết kiệm 520k (1 bao/ngày). 1 năm = 7.3 triệu. 5 năm = Honda Wave.' },
  [27]: { slug: 'ngay-27-gia-dinh-va-cac-moi-quan-he-dieu-ban-chua-thay', title: 'Ngày 27 — Gia đình', body: 'Vợ con thấy khác: mùi sạch, mood ổn. 5 hành động kết nối.' },
  [28]: { slug: 'ngay-28-tu-hao-va-gia-tri-ban-than-day-khong-phai-phu-phiem', title: 'Ngày 28 — Tự hào', body: 'Self-efficacy spreading. Cai thành công → tin có thể đổi thứ khác.' },
  [29]: { slug: 'ngay-29-nhin-ve-phia-truoc-thang-2-va-thang-3-se-nhu-the-nao', title: 'Ngày 29 — Nhìn về phía trước', body: 'Relapse risk drops sau D30. Tháng 3-6 vẫn warning. Maintenance plan.' },
  [30]: { slug: 'ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-ai', title: 'Mốc 1 THÁNG!', body: 'Relapse rate ↓ 50%. FEV1 ↑15%. Cilia phổi hồi 50-70%. Tốt nghiệp!' },
};

/** Mốc nào dùng template MILESTONE thay vì DAILY_CHIP */
const MILESTONE_DAYS = new Set([7, 14, 21, 30]);

/** Mục input cho enrollUser */
export interface EnrollParams {
  userId: string;
  journeyType: JourneyType;
  /** Q-Day milestone (Date). Nếu user chọn "Hôm nay" thì = today. */
  qDayDate: Date;
  /** Override preferredPushHour (0-23). Mặc định lấy từ User.preferredPushHour. */
  preferredHour?: number;
  /** Override timezone. Mặc định Asia/Ho_Chi_Minh. */
  timezone?: string;
}

/** Tính dayOffset range cho journey type */
function getDayRange(journeyType: JourneyType): { from: number; to: number } {
  switch (journeyType) {
    case 'lam-quen':    return { from: -21, to: -15 };  // 7 ngày
    case 'giam-dan':    return { from: -14, to: -1 };   // 14 ngày
    case 'q-day':       return { from: 1, to: 30 };     // 30 ngày
    case 'full-51':     return { from: -21, to: 30 };   // 51 ngày
    case 'maintenance': return { from: 31, to: 90 };    // 60 ngày post-grad (1 tin/tuần)
    default: throw new Error(`Unknown journeyType: ${journeyType}`);
  }
}

/** Resolve template + params cho 1 dayOffset */
export function resolveTemplateForDay(
  dayOffset: number,
  journeyType: JourneyType,
  userName: string = 'anh',
): { templateCode: string; wikiSlug: string | null; params: Record<string, string> } {
  // Maintenance: 1 tin/tuần (mỗi 7 ngày)
  if (journeyType === 'maintenance') {
    return {
      templateCode: 'SOL_LAPSE_RECOVERY',
      wikiSlug: null,
      params: { name: userName },
    };
  }

  // Milestone (7, 14, 21, 30)
  if (MILESTONE_DAYS.has(dayOffset)) {
    const chip = CHIP_LIBRARY[dayOffset];
    return {
      templateCode: 'SOL_MILESTONE_GENERIC',
      wikiSlug: chip?.slug ?? null,
      params: {
        name: userName,
        milestone_day: String(dayOffset),
        days_saved_money_vnd: String(dayOffset * 26000),   // 1 bao/ngày = 26k
        co_recovery_pct: String(Math.min(100, dayOffset * 3)),
        custom_msg: chip?.body ?? 'Tuyệt vời! Tiếp tục anh nhé.',
      },
    };
  }

  // Generic daily chip
  const chip = CHIP_LIBRARY[dayOffset];
  if (!chip) {
    logger.warn({ dayOffset, journeyType }, 'No chip in library for dayOffset');
    return {
      templateCode: 'SOL_DAILY_CHIP',
      wikiSlug: null,
      params: {
        day_label: dayOffset > 0 ? `${dayOffset}` : `T${dayOffset}`,
        chip_title: 'Hôm nay',
        chip_body: 'Sol đồng hành cùng anh.',
        cta_text: 'Mở Sol',
        cta_url: 'https://bothuocla.sol.vn',
      },
    };
  }

  return {
    templateCode: 'SOL_DAILY_CHIP',
    wikiSlug: chip.slug,
    params: {
      day_label: dayOffset > 0 ? `${dayOffset}` : `T${dayOffset}`,
      chip_title: chip.title,
      chip_body: chip.body,
      cta_text: 'Đọc đầy đủ',
      cta_url: `https://sol.vn/${chip.slug}/?utm_source=zalo&utm_campaign=daily_chip&utm_content=day_${dayOffset}`,
    },
  };
}

/** Tính scheduledAt từ qDayDate + dayOffset + preferredHour + timezone.
 *
 *  qDayDate = ngày Q-Day. dayOffset = -21..30. preferredHour = 0-23 giờ VN.
 *  Backend lưu UTC, FE/cron convert. Đơn giản: store UTC equivalent của giờ VN.
 */
export function computeScheduledAt(
  qDayDate: Date,
  dayOffset: number,
  preferredHour: number = 7,
  _timezone: string = 'Asia/Ho_Chi_Minh',
): Date {
  // Asia/Ho_Chi_Minh = UTC+7, không có DST
  const TZ_OFFSET_HOURS = 7;
  const target = new Date(qDayDate);
  target.setUTCDate(target.getUTCDate() + dayOffset);
  // Set giờ VN preferredHour → UTC = preferredHour - 7
  target.setUTCHours(preferredHour - TZ_OFFSET_HOURS, 0, 0, 0);
  return target;
}

/** Enroll user vào journey — tạo N ScheduledPush pre-computed.
 *  Idempotent: dùng upsert qua @@unique([userId, dayOffset, journeyType]).
 */
export async function enrollUser(p: EnrollParams): Promise<{ created: number; userId: string }> {
  const { userId, journeyType, qDayDate } = p;
  const { from, to } = getDayRange(journeyType);

  // Lấy User để có preferredPushHour + name
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, preferredPushHour: true, pushTimezone: true },
  });
  if (!user) throw new Error(`User not found: ${userId}`);

  const preferredHour = p.preferredHour ?? user.preferredPushHour ?? 7;
  const timezone = p.timezone ?? user.pushTimezone ?? 'Asia/Ho_Chi_Minh';
  const userName = user.name ?? 'anh';

  // Tạo records
  let created = 0;
  for (let d = from; d <= to; d++) {
    // Maintenance: chỉ tạo mỗi 7 ngày
    if (journeyType === 'maintenance' && (d - 31) % 7 !== 0) continue;

    const { templateCode, wikiSlug, params } = resolveTemplateForDay(d, journeyType, userName);
    const scheduledAt = computeScheduledAt(qDayDate, d, preferredHour, timezone);

    try {
      await prisma.scheduledPush.upsert({
        where: {
          userId_dayOffset_journeyType: { userId, dayOffset: d, journeyType },
        },
        update: {
          templateCode,
          wikiSlug,
          templateParams: params as any,
          scheduledAt,
          status: 'pending',
        },
        create: {
          userId, dayOffset: d, journeyType,
          templateCode, wikiSlug,
          templateParams: params as any,
          scheduledAt,
          status: 'pending',
        },
      });
      created++;
    } catch (e: any) {
      logger.error({ err: e, userId, dayOffset: d }, 'Failed to upsert ScheduledPush');
    }
  }

  // Update User
  await prisma.user.update({
    where: { id: userId },
    data: {
      journeyType,
      qDayDate,
      journeyStatus: 'active',
      journeyEnrolledAt: new Date(),
      preferredPushHour: preferredHour,
      pushTimezone: timezone,
    },
  });

  logger.info({ userId, journeyType, qDayDate, created }, 'User enrolled in journey');
  return { created, userId };
}

/** Cancel pending push khi user pause/quit */
export async function cancelJourney(userId: string, reason: string = 'user_pause'): Promise<number> {
  const result = await prisma.scheduledPush.updateMany({
    where: { userId, status: 'pending' },
    data: { status: 'cancelled', errorMessage: reason },
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      journeyStatus: reason === 'graduated' ? 'graduated' : 'paused',
      journeyEndedAt: reason === 'graduated' ? new Date() : null,
    },
  });
  return result.count;
}

/** Tính lại currentJourneyDay cho 1 user.
 *  currentJourneyDay = floor((today - qDayDate) / 86400_seconds)
 */
export async function recomputeCurrentDay(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { qDayDate: true, journeyStatus: true },
  });
  if (!user?.qDayDate || user.journeyStatus !== 'active') return null;

  const today = new Date();
  const diffMs = today.getTime() - user.qDayDate.getTime();
  const day = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  await prisma.user.update({
    where: { id: userId },
    data: { currentJourneyDay: day },
  });
  return day;
}

/** Batch recompute cho tất cả user active — chạy 1 lần/ngày qua cron */
export async function recomputeAllActiveUsers(): Promise<number> {
  const activeUsers = await prisma.user.findMany({
    where: { journeyStatus: 'active' },
    select: { id: true },
  });
  let updated = 0;
  for (const u of activeUsers) {
    const day = await recomputeCurrentDay(u.id);
    if (day !== null) updated++;
  }
  logger.info({ updated }, 'Recomputed currentJourneyDay for all active users');
  return updated;
}
