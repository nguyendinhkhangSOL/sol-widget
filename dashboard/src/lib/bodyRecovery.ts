// dashboard/src/lib/bodyRecovery.ts
//
// Science-based body recovery data cho Journey Simulator của Sol.
// Tất cả citations từ CDC, NHS, American Heart Association, US Surgeon General
// 2020, Mayo Clinic Proceedings, và peer-reviewed papers (Brody 2006,
// Rademacher 2016, Cosgrove/Brody 2013).
//
// 28 milestones across 4 hệ thống — mỗi milestone có source URL public.
// Curve formula: exponential half-life, pct(d) = floor + (max-floor) * (1 - 2^(-d/halfLife))

export type Milestone = {
  days: number;          // 0.014 = 20 min, 0.5 = 12h, 1 = day, etc.
  title: string;         // Vietnamese, ngắn
  detail: string;        // 1-2 câu giải thích khoa học
  source: string;        // short label
  sourceUrl: string;     // public URL
};

export type RecoveryCurve = {
  formula: 'exponential' | 'logistic' | 'piecewise';
  halfLifeDay: number;   // ngày mà curve đạt 50% maxPercent
  maxPercent: number;    // asymptote (100)
  initialPercent?: number;  // floor (vd Heart có cải thiện ngay 20 phút đầu)
};

// ═════════════════════════════════════════════════════════════════════════
// 1) HEART / CARDIOVASCULAR
// Fast initial recovery (minutes-hours), 50% CHD risk drop @1y,
// near-nonsmoker by 15y.
// ═════════════════════════════════════════════════════════════════════════
export const HEART_MILESTONES: Milestone[] = [
  {
    days: 0.014, // 20 minutes
    title: 'Nhịp tim & huyết áp giảm',
    detail: 'Chỉ 20 phút sau điếu cuối, nhịp tim và huyết áp bắt đầu trở về mức bình thường khi nicotin ngừng kích thích hệ giao cảm.',
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
  },
  {
    days: 0.5, // 12 hours
    title: 'Khí độc CO trong máu về bình thường',
    detail: 'Sau 12 giờ, nồng độ khí carbon monoxide (CO) trong máu giảm về mức người không hút, oxy được vận chuyển hiệu quả trở lại.',
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
  },
  {
    days: 1,
    title: 'Tuần hoàn cải thiện rõ',
    detail: 'Trong 24 giờ, lượng oxy đến tim tăng, nguy cơ nhồi máu cơ tim cấp tính bắt đầu giảm.',
    source: 'AHA',
    sourceUrl: 'https://www.heart.org/en/healthy-living/healthy-lifestyle/quit-smoking-tobacco/benefits-of-quitting-smoking-over-time',
  },
  {
    days: 7,
    title: 'Mạch máu giãn nở tốt hơn',
    detail: 'Sau 1 tuần, chức năng nội mô mạch máu hồi phục, huyết áp ổn định, lưu thông máu cải thiện rõ rệt.',
    source: 'AHA / Tạp chí J Am Coll Cardiol 2024',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11843939/',
  },
  {
    days: 30,
    title: 'Tim đập hiệu quả hơn',
    detail: 'Sau 1 tháng, các dấu hiệu viêm và đông máu giảm, hệ tim mạch hoạt động tiết kiệm năng lượng hơn.',
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
  },
  {
    days: 365,
    title: 'Nguy cơ nhồi máu cơ tim giảm 50%',
    detail: 'Sau 1 năm, nguy cơ mắc bệnh mạch vành chỉ còn một nửa so với người vẫn hút thuốc.',
    source: 'Surgeon General 2020',
    sourceUrl: 'https://www.cdc.gov/tobacco-surgeon-general-reports/reports/2020-smoking-cessation/index.html',
  },
  {
    days: 365 * 5,
    title: 'Nguy cơ đột quỵ ngang người không hút',
    detail: 'Sau 5-10 năm cai, nguy cơ đột quỵ giảm xuống mức gần bằng người chưa từng hút.',
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/cigarettes-and-cardiovascular-disease.html',
  },
  {
    days: 365 * 15,
    title: 'Tim mạch như người chưa hút',
    detail: 'Sau 15 năm, nguy cơ bệnh mạch vành tương đương người chưa bao giờ hút thuốc.',
    source: 'Surgeon General 2020',
    sourceUrl: 'https://www.cdc.gov/tobacco-surgeon-general-reports/reports/2020-smoking-cessation/index.html',
  },
];

// Heart hồi phục nhanh tháng đầu nhưng "đầy đủ" ~5 năm.
// halfLife=90 → 50% @ Day 90, 75% @ Day 180, 90% @ Day 365.
export const HEART_CURVE: RecoveryCurve = {
  formula: 'exponential',
  halfLifeDay: 90,
  maxPercent: 100,
  initialPercent: 5, // 20-phút đầu đã có cải thiện ngay
};

// ═════════════════════════════════════════════════════════════════════════
// 2) LUNGS / RESPIRATORY
// Chậm hơn heart: cilia tái tạo ~1-9 tháng, lung function +30% sau 3 tháng,
// nguy cơ ung thư phổi giảm 50% sau 10 năm.
// ═════════════════════════════════════════════════════════════════════════
export const LUNG_MILESTONES: Milestone[] = [
  {
    days: 3, // 72 giờ
    title: 'Phế quản giãn, thở dễ hơn',
    detail: 'Sau 72 giờ, ống phế quản giãn, dung tích phổi tăng, cảm thấy thở sâu hơn rõ rệt.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    days: 14,
    title: 'Lông mao bắt đầu tái tạo',
    detail: 'Hệ thống lông mao (lông nhỏ quét sạch phổi) trong đường thở bắt đầu mọc lại, đẩy chất nhầy và độc tố ra ngoài hiệu quả hơn.',
    source: 'Surgeon General 2020',
    sourceUrl: 'https://www.hhs.gov/sites/default/files/2020-cessation-sgr-full-report.pdf',
  },
  {
    days: 30,
    title: 'Chức năng phổi tăng tới 30%',
    detail: 'Trong 1-3 tháng, lưu thông không khí và chức năng phổi tăng đáng kể, ho và khò khè giảm.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    days: 270, // 9 tháng
    title: 'Lông mao phục hồi gần hoàn toàn',
    detail: 'Sau 9 tháng, lông mao phổi phục hồi đầy đủ, phổi tự làm sạch tốt, giảm nhiễm trùng và ho mãn tính.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    days: 365,
    title: 'Ho và khó thở giảm rõ',
    detail: 'Sau 1 năm, triệu chứng ho buổi sáng, khò khè và khó thở giảm mạnh; viêm đường thở bắt đầu thoái lui.',
    source: 'Surgeon General 2020',
    sourceUrl: 'https://www.hhs.gov/sites/default/files/2020-cessation-sgr-full-report.pdf',
  },
  {
    days: 365 * 5,
    title: 'Nguy cơ ung thư miệng-họng giảm 50%',
    detail: 'Sau 5 năm, nguy cơ ung thư miệng, họng, thực quản và bàng quang giảm còn một nửa.',
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
  },
  {
    days: 365 * 10,
    title: 'Nguy cơ ung thư phổi giảm 50%',
    detail: 'Sau 10 năm cai, nguy cơ tử vong vì ung thư phổi chỉ còn một nửa so với người vẫn hút.',
    source: 'Surgeon General 2020',
    sourceUrl: 'https://www.cdc.gov/tobacco-surgeon-general-reports/reports/2020-smoking-cessation/index.html',
  },
];

// Lung chậm hơn. halfLife=180 → 50% @ Day 180, 75% @ Day 360.
export const LUNG_CURVE: RecoveryCurve = {
  formula: 'exponential',
  halfLifeDay: 180,
  maxPercent: 100,
  initialPercent: 2,
};

// ═════════════════════════════════════════════════════════════════════════
// 3) BRAIN — nicotinic receptors + dopamine reward pathway
// nAChR upregulation hồi quy ~6-12 tuần (Brody 2006)
// Dopamine synthesis capacity về bình thường ~3 tháng (Rademacher 2016)
// ═════════════════════════════════════════════════════════════════════════
export const BRAIN_MILESTONES: Milestone[] = [
  {
    days: 2.5, // 2-3 ngày
    title: 'Nicotin sạch khỏi cơ thể',
    detail: 'Sau 48-72 giờ, nicotin và cotinin được đào thải hoàn toàn; triệu chứng cai (cáu gắt, thèm) đỉnh điểm rồi giảm.',
    source: 'Surgeon General 2020',
    sourceUrl: 'https://www.hhs.gov/sites/default/files/2020-cessation-sgr-full-report.pdf',
  },
  {
    days: 10, // 1-2 tuần
    title: 'Cơn thèm thưa dần',
    detail: 'Tần suất và cường độ cơn thèm thuốc giảm rõ; chu kỳ kích hoạt thụ thể nicotin ngừng, não bắt đầu tái cân bằng.',
    source: 'Brody 2006, Tạp chí Arch Gen Psychiatry',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16894066/',
  },
  {
    days: 30,
    title: 'Thụ thể Nicotin giảm về gần bình thường',
    detail: 'Sau khoảng 4 tuần, mật độ thụ thể nicotin trong não (vốn bị tăng do hút thuốc) giảm rõ rệt về mức người không hút.',
    source: 'Cosgrove 2009 / Brody 2013',
    sourceUrl: 'https://www.nature.com/articles/npp201353',
  },
  {
    days: 90, // 3 tháng
    title: 'Dopamine (chất hạnh phúc) về mức bình thường',
    detail: 'Sau 3 tháng, khả năng tự tạo dopamine ở não phục hồi hoàn toàn — não tự tạo "phần thưởng" mà không cần nicotin.',
    source: 'Rademacher 2016, Tạp chí Biol Psychiatry',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/26803340/',
  },
  {
    days: 180, // 6 tháng
    title: 'Mạch máu não & nhận thức cải thiện',
    detail: 'Sau 6 tháng, tưới máu não, trí nhớ làm việc và tập trung cải thiện; nguy cơ tái hút giảm mạnh.',
    source: 'McClernon 2016',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5330670/',
  },
];

// Brain hồi phục cảm giác "thưởng" nhanh trong 30-90 ngày.
// halfLife=45 → 50% @ Day 45, 90% @ Day 150.
export const BRAIN_CURVE: RecoveryCurve = {
  formula: 'exponential',
  halfLifeDay: 45,
  maxPercent: 100,
  initialPercent: 10,
};

// ═════════════════════════════════════════════════════════════════════════
// 4) IMMUNE SYSTEM
// WBC, neutrophil bình thường hoá nhanh trong tuần - tháng đầu.
// T-cell (CD8/CD3), B-cell, monocyte → 1 năm.
// ═════════════════════════════════════════════════════════════════════════
export const IMMUNE_MILESTONES: Milestone[] = [
  {
    days: 1,
    title: 'Viêm cấp bắt đầu hạ',
    detail: 'Trong 24 giờ, các dấu hiệu viêm trong máu ngừng tăng; bạch cầu bắt đầu giảm về bình thường.',
    source: 'Tạp chí Mayo Clinic Proc 2005',
    sourceUrl: 'https://www.mayoclinicproceedings.org/article/S0025-6196(11)61584-X/abstract',
  },
  {
    days: 7,
    title: 'Số lượng bạch cầu giảm rõ',
    detail: 'Sau 1 tuần, lượng bạch cầu — vốn tăng cao do viêm mạn tính ở người hút — giảm đáng kể.',
    source: 'Tạp chí Br J Haematol',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/1538385/',
  },
  {
    days: 30,
    title: 'Niêm mạc miệng & họng lành',
    detail: 'Sau 1 tháng, niêm mạc đường hô hấp trên hồi phục, kháng thể tăng, ít nhiễm trùng hô hấp hơn.',
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/quit-smoking/what-happens-when-you-quit-smoking/',
  },
  {
    days: 90,
    title: 'Tế bào miễn dịch tự nhiên hồi phục',
    detail: 'Sau 3 tháng, hoạt tính tế bào miễn dịch tự nhiên và đại thực bào phế nang trở về gần bình thường.',
    source: 'Nghiên cứu NCBI về hút thuốc và viêm',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1160597/',
  },
  {
    days: 365,
    title: 'Hệ miễn dịch hồi phục gần như đầy đủ',
    detail: 'Sau 1 năm, tỉ lệ tế bào miễn dịch (T, B, monocyte) phục hồi hoàn toàn về mức người không hút.',
    source: 'Tạp chí Nature Comm 2024',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/38355790/',
  },
];

// halfLife=60 → 50% @ Day 60, 90% @ Day 200.
export const IMMUNE_CURVE: RecoveryCurve = {
  formula: 'exponential',
  halfLifeDay: 60,
  maxPercent: 100,
  initialPercent: 5,
};

// ═════════════════════════════════════════════════════════════════════════
// Helper: compute % recovery for a given system at day d.
// Pure function — safe to call inside React render or animation frame.
// ═════════════════════════════════════════════════════════════════════════
export function pct(curve: RecoveryCurve, day: number): number {
  if (day <= 0) return curve.initialPercent ?? 0;
  const floor = curve.initialPercent ?? 0;
  const span = curve.maxPercent - floor;
  const value = floor + span * (1 - Math.pow(2, -day / curve.halfLifeDay));
  return Math.max(0, Math.min(curve.maxPercent, value));
}

// ═════════════════════════════════════════════════════════════════════════
// Master export for the Journey Simulator UI
// ═════════════════════════════════════════════════════════════════════════
export type BodySystem = {
  id: 'heart' | 'lungs' | 'brain' | 'immune';
  label: string;
  emoji: string;
  color: string;
  milestones: Milestone[];
  curve: RecoveryCurve;
};

export const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'heart',
    label: 'Tim mạch',
    emoji: '❤️',
    color: '#E24B4A',
    milestones: HEART_MILESTONES,
    curve: HEART_CURVE,
  },
  {
    id: 'lungs',
    label: 'Phổi',
    emoji: '🫁',
    color: '#378ADD',
    milestones: LUNG_MILESTONES,
    curve: LUNG_CURVE,
  },
  {
    id: 'brain',
    label: 'Não bộ',
    emoji: '🧠',
    color: '#7F77DD',
    milestones: BRAIN_MILESTONES,
    curve: BRAIN_CURVE,
  },
  {
    id: 'immune',
    label: 'Miễn dịch',
    emoji: '🛡️',
    color: '#1D9E75',
    milestones: IMMUNE_MILESTONES,
    curve: IMMUNE_CURVE,
  },
];

/** Aggregate milestones across all systems, sorted by day */
export function getAllMilestones(): Array<Milestone & { systemId: string; systemLabel: string; systemColor: string; systemEmoji: string }> {
  const all: any[] = [];
  for (const sys of BODY_SYSTEMS) {
    for (const m of sys.milestones) {
      all.push({
        ...m,
        systemId: sys.id,
        systemLabel: sys.label,
        systemColor: sys.color,
        systemEmoji: sys.emoji,
      });
    }
  }
  return all.sort((a, b) => a.days - b.days);
}
