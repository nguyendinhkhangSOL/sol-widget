// dashboard/src/lib/dailyJourneyAlerts.ts
//
// CẢNH BÁO HÀNH TRÌNH — alert hiện tượng có thể xảy ra THEO NGÀY cụ thể.
// Mục đích: User mở dashboard mỗi ngày thấy "Hôm nay anh có thể trải nghiệm X
// — đây là dấu hiệu Y" → giảm hoảng + tăng compliance.
//
// Cũng dùng cho push notif Zalo OA / web push (Phase 5 cron).
//
// Mỗi alert có:
//   - day: ngày trong journey (1..730)
//   - severity: 'info' | 'warning' | 'celebrate'
//     • info     = thông tin sinh học bình thường (xanh)
//     • warning  = triệu chứng có thể khó chịu (cam) — KHÔNG đáng lo
//     • celebrate = mốc thành tựu (vàng-tím, có confetti)
//   - title: 1 dòng ngắn (≤50 ký tự)
//   - detail: 2-3 câu giải thích science + tip ứng phó
//   - source: nguồn (CDC/NHS/...)
//   - sourceUrl: link verify
//
// Mảng SẮP XẾP theo day tăng dần. UI lookup bằng `getAlertForDay(dayInJourney)`.

export type AlertSeverity = 'info' | 'warning' | 'celebrate';

export interface DailyAlert {
  day: number;              // dayInJourney (1+, hoặc range "1-3" → tách thành multiple entries)
  severity: AlertSeverity;
  title: string;            // emoji + 1 line
  detail: string;
  source?: string;
  sourceUrl?: string;
}

// ═════════════════════════════════════════════════════════════════════════
// CURATED 30+ ALERTS — Day 1 → Day 365+
// ═════════════════════════════════════════════════════════════════════════

export const DAILY_ALERTS: DailyAlert[] = [
  // ─── PHASE 1: Detox cấp (Day 1-7) ────────────────────────────────────
  {
    day: 1,
    severity: 'warning',
    title: '⚠️ Hôm nay anh có thể cáu gắt + thèm thuốc dữ dội',
    detail: 'Trong 24 giờ đầu, nicotin đào thải khỏi máu — đỉnh cao của cơn thèm. Cảm giác lo lắng, mất tập trung là BÌNH THƯỜNG. Mẹo: uống nhiều nước, nhai kẹo cao su không đường, đi bộ 10 phút khi thèm.',
    source: 'Mayo Clinic — Triệu chứng cai theo thời gian',
    sourceUrl: 'https://www.mayoclinic.org/healthy-lifestyle/quit-smoking/in-depth/nicotine-craving/art-20045454',
  },
  {
    day: 2,
    severity: 'warning',
    title: '😡 Đỉnh điểm cáu gắt — không phải tính anh',
    detail: 'Ngày 2-3 là đỉnh cao của triệu chứng cai: cáu gắt, mất ngủ, nhức đầu. Báo trước với vợ/đồng nghiệp để mọi người hiểu. Nicotin còn ~50% trong máu, sẽ sạch hết vào Ngày 3.',
    source: 'NHS — Khi bỏ thuốc',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    day: 3,
    severity: 'info',
    title: '🌬️ Nicotin sạch máu — bắt đầu thở dễ',
    detail: 'Sau 72 giờ, nicotin và cotinin đào thải hoàn toàn. Ống phế quản giãn — anh có thể thấy thở sâu hơn. Cơn thèm vẫn còn nhưng tần suất giảm.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    day: 4,
    severity: 'warning',
    title: '😴 Có thể khó ngủ + mơ về thuốc',
    detail: 'Não đang điều chỉnh — giấc ngủ sâu (mơ) tăng, dễ mơ về thuốc lá. Đây là sinh học bình thường, KHÔNG phải tâm lý yếu. Tránh cà phê sau 2 giờ chiều.',
    source: 'Sleep Foundation',
    sourceUrl: 'https://www.sleepfoundation.org/physical-health/nicotine-and-sleep',
  },
  {
    day: 5,
    severity: 'warning',
    title: '🍔 Cơn đói tăng — KHÔNG phải chỉ thèm thuốc',
    detail: 'Ngày 4-7 vị giác và khứu giác trỗi dậy, đồng thời cơ thể đốt năng lượng chậm hơn ~100 kcal/ngày. Anh có thể tăng 0.5-1kg trong tháng đầu — bù lại bằng đi bộ 30 phút/ngày.',
    source: 'CDC — Tăng cân sau khi bỏ thuốc',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/quitting-and-weight-control.html',
  },
  {
    day: 6,
    severity: 'info',
    title: '👃 Khứu giác phục hồi — cà phê thơm rõ hơn',
    detail: 'Lông mao đầu mũi sạch hắc ín, mùi thức ăn quen thuộc bỗng "lạ". Anh có thể ngửi rõ mùi thuốc trên áo người khác — và thấy khó chịu (dấu hiệu tốt — não đã đổi gốc so sánh).',
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
  },
  {
    day: 7,
    severity: 'celebrate',
    title: '🏆 1 TUẦN TỰ DO — mốc đầu tiên!',
    detail: 'Anh đã qua giai đoạn khó nhất về sinh học. CO (khí độc) trong máu về 0, oxy lên cao, mạch máu giãn. Nguy cơ tái hút vẫn ~75% — đừng chủ quan. Tự thưởng nhỏ (món ăn ngon, đôi giày mới).',
    source: 'AHA',
    sourceUrl: 'https://www.heart.org/en/healthy-living/healthy-lifestyle/quit-smoking-tobacco/benefits-of-quitting-smoking-over-time',
  },

  // ─── PHASE 2: Tái cấu trúc não (Day 8-21) ─────────────────────────────
  {
    day: 10,
    severity: 'warning',
    title: '🌊 Cơn thèm có thể quay lại bất ngờ',
    detail: 'Ngày 10-14, cơn thèm đến từng "đợt" — đột ngột mạnh khi gặp tình huống cũ (cà phê, bia, sau cơm). Vẫn xuất hiện nhưng yếu hơn Ngày 1. Mỗi đợt kéo dài 3-5 phút rồi qua. Thở 4-7-8 thay điếu thuốc.',
    source: 'Brody 2006, Tạp chí Arch Gen Psychiatry',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16894066/',
  },
  {
    day: 14,
    severity: 'info',
    title: '🧠 Thụ thể Nicotin giảm 40%',
    detail: 'Brody 2006: Não đã "tháo" gần một nửa số thụ thể Nicotin tăng do hút. Anh không cần nicotin để thấy "bình thường" nữa — chỉ là não chưa quen.',
    source: 'Brody 2006',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16894066/',
  },
  {
    day: 14,
    severity: 'warning',
    title: '🤧 Ho có đờm tăng — DẤU HIỆU TỐT',
    detail: 'Lông mao phổi bắt đầu mọc lại, đẩy chất nhầy + độc tố tích tụ ra ngoài. Anh có thể ho có đờm nhiều hơn trong 1-2 tuần. Đây là phổi đang TỰ LÀM SẠCH, không phải bệnh.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    day: 21,
    severity: 'celebrate',
    title: '🎉 3 tuần — thói quen mới hình thành',
    detail: 'Lally 2010: Não bắt đầu coi "không hút" là trạng thái mặc định. Cảm giác "bất thường" khi không có thuốc giảm rõ. Nguy cơ tái hút giảm còn ~50%.',
    source: 'Lally 2010, Tạp chí Eur J Soc Psychol',
    sourceUrl: 'https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674',
  },

  // ─── PHASE 3: Stabilize (Day 22-60) ────────────────────────────────────
  {
    day: 30,
    severity: 'celebrate',
    title: '🌸 1 THÁNG SẠCH — phổi hồi 10%',
    detail: 'Theo NHS, chức năng phổi tăng tới 30% sau 1-3 tháng. Da sáng hơn, hơi thở bớt hôi, ngón tay không ố vàng nữa. Chỉ Số Làm Chủ của anh đáng tự hào.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    day: 30,
    severity: 'warning',
    title: '💭 Có thể "nhớ" thuốc kiểu tâm lý',
    detail: 'Sau Ngày 30, sinh học gần xong nhưng "ký ức cảm xúc" vẫn còn. Khi căng thẳng hay vui, não tự nhắc "ngày xưa lúc này mình hút". Cảm giác này qua nhanh — bấm Lúc Khó Nhất hoặc gọi Khang.',
    source: 'Volkow 2012, Tạp chí Neuropsychopharmacology',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22510724/',
  },
  {
    day: 35,
    severity: 'celebrate',
    title: '🟢 NHẸ — anh đã hoàn thành lộ trình chính',
    detail: 'Lộ trình NHẸ (35 ngày) chính thức hoàn thành. Sổ Lưu Niệm sẵn sàng. Chặng Tái Thiết tặng miễn phí bắt đầu — anh có thể ở Sol thêm bao lâu tuỳ ý.',
    source: 'Sol',
  },
  {
    day: 45,
    severity: 'info',
    title: '🧠 Dopamine (chất hạnh phúc) đang phục hồi hoàn toàn',
    detail: 'Rademacher 2016: Ngày 45-90 là giai đoạn não tự tạo "phần thưởng" tự nhiên — không cần nicotin. Anh có thể thấy niềm vui từ những thứ nhỏ rõ hơn.',
    source: 'Rademacher 2016',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/26803340/',
  },
  {
    day: 52,
    severity: 'celebrate',
    title: '🟡 VỪA — anh đã hoàn thành lộ trình chính',
    detail: 'Lộ trình VỪA (52 ngày) chính thức hoàn thành. Sổ Lưu Niệm sẵn sàng — chia sẻ với gia đình/bạn bè. Anh là người không hút từ hôm nay về sau.',
    source: 'Sol',
  },
  {
    day: 60,
    severity: 'celebrate',
    title: '💎 2 tháng — giảm 90% nguy cơ ung thư phổi',
    detail: 'Doll & Hill BMJ 2004: Nếu anh cai trước 50 tuổi, nguy cơ ung thư phổi giảm 90% so với người vẫn hút. Đây là kết quả vĩnh viễn.',
    source: 'Doll & Hill 2004, Tạp chí BMJ',
    sourceUrl: 'https://www.bmj.com/content/328/7455/1519',
  },
  {
    day: 65,
    severity: 'celebrate',
    title: '🔴 NẶNG — anh đã hoàn thành lộ trình chính',
    detail: 'Lộ trình NẶNG (65 ngày) hoàn thành — đây là thành tựu lớn. Não đã tái cấu trúc hoàn toàn. Chặng Tái Thiết miễn phí bắt đầu Ngày 66+ — Sol vẫn đồng hành.',
    source: 'Sol',
  },

  // ─── PHASE 4: Tái Thiết (Day 66-365) ──────────────────────────────────
  {
    day: 75,
    severity: 'info',
    title: '😮‍💨 Ho mãn tính giảm 70%',
    detail: 'Theo NHS, lông mao phổi đã mọc lại đầy đủ, đẩy chất nhầy hiệu quả. Sáng dậy không khạc đờm. Hô hấp tĩnh lặng.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    day: 88,
    severity: 'celebrate',
    title: '🏆 88 NGÀY — Người Tự Do',
    detail: 'Anh đã không cảm thấy cần thuốc khi căng thẳng. Tự nhận diện đã chuyển — "tôi không hút" thay "tôi đang cai". Đây là người Khang mong muốn anh trở thành.',
    source: 'Sol',
  },
  {
    day: 90,
    severity: 'info',
    title: '🧠 Nhận thức + trí nhớ làm việc cải thiện',
    detail: 'McClernon 2016: Sau 3 tháng, tưới máu não tăng, nhận thức cải thiện. Anh có thể tập trung làm việc lâu hơn, ít "sương mù não".',
    source: 'McClernon 2016',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5330670/',
  },
  {
    day: 120,
    severity: 'info',
    title: '💪 4 tháng — Tim mạch phục hồi',
    detail: 'Theo Mayo Clinic, tim mạch hồi phục gần như người chưa hút. Đi bộ 30 phút không thở dốc. Leo cầu thang dễ hơn.',
    source: 'Mayo Clinic',
    sourceUrl: 'https://www.mayoclinic.org/healthy-lifestyle/quit-smoking',
  },
  {
    day: 180,
    severity: 'celebrate',
    title: '🌟 6 tháng — Da và tóc đẹp lại',
    detail: 'Theo nghiên cứu da liễu: tuần hoàn vi mạch phục hồi, da sáng, vết nhăn giảm, tóc dày hơn. Mắt sáng vì oxy lên cao.',
    source: 'Nghiên cứu da liễu',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/29893403/',
  },
  {
    day: 270,
    severity: 'info',
    title: '🫁 9 tháng — Phổi gần như người không hút',
    detail: 'NHS: Lông mao phổi đã phục hồi đầy đủ. Khả năng chống nhiễm trùng hô hấp ngang người không hút. Mùa đông cảm cúm ít hơn.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    day: 365,
    severity: 'celebrate',
    title: '🎂 1 NĂM — Nguy cơ tim mạch giảm 50%',
    detail: 'AHA: Nguy cơ nhồi máu cơ tim chỉ còn 1/2 so với khi còn hút. Anh đã tự thưởng bằng số tiền tiết kiệm trong năm — đáng giá triệu lần điếu thuốc.',
    source: 'AHA',
    sourceUrl: 'https://www.heart.org/en/healthy-living/healthy-lifestyle/quit-smoking-tobacco/benefits-of-quitting-smoking-over-time',
  },
  {
    day: 730,
    severity: 'celebrate',
    title: '🦁 2 NĂM — Đại Sứ Sol đẳng cấp',
    detail: 'Anh đã trở thành người dẫn dắt cho lộ trình mới. Cơ thể gần như người chưa hút. Tuổi thọ thêm: trung bình 9-11 năm nếu cai trước 40 tuổi (NEJM 2013).',
    source: 'NEJM 2013',
    sourceUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMsa1211127',
  },
];

// ─── Helper: lookup alert cho 1 ngày ────────────────────────────────────

/**
 * Lấy alert phù hợp nhất cho `dayInJourney`. Logic:
 *   1. Tìm exact match (alert.day === dayInJourney)
 *   2. Nếu không có exact → tìm gần nhất TRƯỚC dayInJourney (trong vòng 3 ngày)
 *   3. Nếu vẫn không → null
 */
export function getAlertForDay(dayInJourney: number): DailyAlert | null {
  if (dayInJourney < 1) return null;

  // 1. Exact match
  const exact = DAILY_ALERTS.find((a) => a.day === dayInJourney);
  if (exact) return exact;

  // 2. Recent match (within last 3 days)
  for (let lookback = 1; lookback <= 3; lookback++) {
    const recent = DAILY_ALERTS.find((a) => a.day === dayInJourney - lookback);
    if (recent) return recent;
  }

  return null;
}

/** Get top 3 upcoming alerts for "Sắp tới" preview */
export function getUpcomingAlerts(dayInJourney: number, count = 3): DailyAlert[] {
  return DAILY_ALERTS.filter((a) => a.day > dayInJourney).slice(0, count);
}

// ─── Severity → CSS color/style ─────────────────────────────────────────

export const SEVERITY_STYLES: Record<AlertSeverity, {
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
  icon: string;
  pulseClass: string;
}> = {
  info: {
    bgColor: '#E2EDF4',          // sol blue soft
    borderColor: '#3A7CA5',
    textColor: '#225573',
    iconBg: '#378ADD',
    icon: 'ℹ️',
    pulseClass: 'animate-pulse-info',
  },
  warning: {
    bgColor: '#F5E6D3',          // sol amber soft
    borderColor: '#B8860B',
    textColor: '#6B5008',
    iconBg: '#D97706',
    icon: '⚠️',
    pulseClass: 'animate-pulse-warning',
  },
  celebrate: {
    bgColor: '#F5DDD9',          // sol clay soft
    borderColor: '#B25C2C',
    textColor: '#6B3318',
    iconBg: '#D85A30',
    icon: '🎉',
    pulseClass: 'animate-pulse-celebrate',
  },
};
