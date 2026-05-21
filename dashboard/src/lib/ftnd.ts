/**
 * Fagerström Test for Nicotine Dependence (FTND) — Sol Dashboard
 *
 * Port từ app/lib/ftnd.ts (Next.js Sol Widget v0.2 → Dashboard SPA Day 4)
 * Logic không đổi. Pure TypeScript (no React, no Next.js).
 *
 * Map FTND score → Cohort LIGHT/MODERATE/HEAVY (theo /bang-gia/ page)
 *
 * Pricing model:
 *   - 7 ngày Nhận Diện FREE
 *   - 5,000đ/ngày sau đó (giá tri ân 500 anh em đầu, gốc 9k)
 *   - Hoặc 35,000đ/tuần (góp phí theo tuần)
 *
 * Cohort durations:
 *   - LIGHT (< 10 điếu/ngày):  7 free + 28 paid = 35 ngày = 140k
 *   - MODERATE (10-20 điếu):    7 free + 45 paid = 52 ngày = 225k
 *   - HEAVY (> 1 bao/ngày):     7 free + 58 paid = 65 ngày = 290k
 *
 * Reference:
 *   Heatherton TF, Kozlowski LT, Frecker RC, Fagerström KO (1991).
 *   "The Fagerström Test for Nicotine Dependence: a revision of the
 *   Fagerström Tolerance Questionnaire." Br J Addict. 86(9): 1119–27.
 */

export type Cohort = 'LIGHT' | 'MODERATE' | 'HEAVY';

export interface FtndQuestion {
  id: number;
  question: string;
  options: Array<{
    label: string;
    value: number;
  }>;
}

export interface FtndAnswer {
  q: number;
  a: number;
}

export interface CohortPlan {
  id: Cohort;
  name: string;
  audienceLabel: string;
  freeDays: number;
  paidDays: number;
  totalDays: number;
  dailyRate: number;
  totalPrice: number;
  weeklyRate: number;
  color: string;
  emoji: string;
  description: string;
}

export interface FtndResult {
  score: number;
  cohort: Cohort;
  plan: CohortPlan;
  scoreRange: string;
  whatItMeans: string[];
}

export const FTND_QUESTIONS: FtndQuestion[] = [
  {
    id: 1,
    question: 'Sau khi thức dậy, anh hút điếu thuốc đầu tiên trong bao lâu?',
    options: [
      { label: 'Trong vòng 5 phút', value: 3 },
      { label: '6 - 30 phút', value: 2 },
      { label: '31 - 60 phút', value: 1 },
      { label: 'Sau 60 phút', value: 0 }
    ]
  },
  {
    id: 2,
    question: 'Anh có thấy khó khăn khi phải nhịn hút ở nơi cấm hút không? (bệnh viện, rạp phim, máy bay)',
    options: [
      { label: 'Có, rất khó', value: 1 },
      { label: 'Không khó lắm', value: 0 }
    ]
  },
  {
    id: 3,
    question: 'Điếu thuốc nào anh không muốn bỏ NHẤT trong ngày?',
    options: [
      { label: 'Điếu đầu tiên buổi sáng', value: 1 },
      { label: 'Một điếu nào đó trong ngày (sau ăn, lúc nhậu)', value: 0 }
    ]
  },
  {
    id: 4,
    question: 'Mỗi ngày anh hút bao nhiêu điếu thuốc?',
    options: [
      { label: '10 điếu hoặc ít hơn', value: 0 },
      { label: '11 - 20 điếu', value: 1 },
      { label: '21 - 30 điếu', value: 2 },
      { label: '31 điếu trở lên', value: 3 }
    ]
  },
  {
    id: 5,
    question: 'Anh có hút thuốc dày đặc hơn vào buổi sáng so với phần còn lại của ngày không?',
    options: [
      { label: 'Có', value: 1 },
      { label: 'Không', value: 0 }
    ]
  },
  {
    id: 6,
    question: 'Anh có hút thuốc kể cả khi bị bệnh nặng phải nằm liệt giường không?',
    options: [
      { label: 'Có', value: 1 },
      { label: 'Không', value: 0 }
    ]
  }
];

export const COHORT_PLANS: Record<Cohort, CohortPlan> = {
  LIGHT: {
    id: 'LIGHT',
    name: 'Lộ trình 35 ngày',
    audienceLabel: 'Hút dưới 10 điếu/ngày',
    freeDays: 7,
    paidDays: 28,
    totalDays: 35,
    dailyRate: 5000,
    totalPrice: 140000,
    weeklyRate: 35000,
    color: '#16A34A',
    emoji: '🟢',
    description: 'Dành cho anh em mới hút hoặc hút ít, thói quen tâm lý chưa bị nicotine bám rễ quá sâu vào các hành vi vô thức.'
  },
  MODERATE: {
    id: 'MODERATE',
    name: 'Lộ trình 52 ngày',
    audienceLabel: 'Hút 10 - 20 điếu/ngày',
    freeDays: 7,
    paidDays: 45,
    totalDays: 52,
    dailyRate: 5000,
    totalPrice: 225000,
    weeklyRate: 35000,
    color: '#D97706',
    emoji: '🟡',
    description: 'Đa số anh em ở đây. Khói thuốc đã gắn chặt với thói quen làm việc, những lúc căng thẳng, uống cà phê hay tiếp khách.'
  },
  HEAVY: {
    id: 'HEAVY',
    name: 'Lộ trình 65 ngày',
    audienceLabel: 'Hút trên 1 bao/ngày',
    freeDays: 7,
    paidDays: 58,
    totalDays: 65,
    dailyRate: 5000,
    totalPrice: 290000,
    weeklyRate: 35000,
    color: '#DC2626',
    emoji: '🔴',
    description: 'Dành cho thâm niên hút trên 15 năm, xách bao thuốc ra ngay khi mở mắt. Tâm trí và cơ thể phụ thuộc sâu vào nicotine.'
  }
};

export function calculateFtndScore(answers: FtndAnswer[]): number {
  if (!answers || answers.length === 0) return 0;
  return answers.reduce((sum, ans) => {
    if (typeof ans.a !== 'number' || ans.a < 0 || ans.a > 3) return sum;
    return sum + ans.a;
  }, 0);
}

/**
 * Map FTND score → Cohort
 *   FTND 0-3:  LIGHT (< 10 điếu/ngày tương đương)
 *   FTND 4-6:  MODERATE (10-20 điếu)
 *   FTND 7-10: HEAVY (> 1 bao/ngày)
 */
export function getCohort(score: number): Cohort {
  if (score <= 3) return 'LIGHT';
  if (score <= 6) return 'MODERATE';
  return 'HEAVY';
}

export function getFtndResult(answers: FtndAnswer[]): FtndResult {
  const score = calculateFtndScore(answers);
  const cohort = getCohort(score);
  const plan = COHORT_PLANS[cohort];

  const scoreRanges: Record<Cohort, string> = {
    LIGHT: '0 - 3 điểm',
    MODERATE: '4 - 6 điểm',
    HEAVY: '7 - 10 điểm'
  };

  const whatItMeans: Record<Cohort, string[]> = {
    LIGHT: [
      'Anh không cần điếu đầu tiên ngay sau khi thức dậy',
      'Anh dễ nhịn ở nơi cấm hút',
      'Cơn thèm chỉ đến ở vài thời điểm cụ thể',
      'Não anh chưa hoàn toàn "nghiện" sinh học',
      'Cai chủ yếu là vượt qua thói quen + tâm lý'
    ],
    MODERATE: [
      'Anh cần điếu đầu tiên trong 30-60 phút sau khi thức',
      'Anh hút khoảng 11-20 điếu/ngày',
      'Khó nhịn ở nơi cấm hút',
      'Cơn thèm dày đặc buổi sáng',
      'Đa số anh em ở mức này — cần lộ trình bài bản'
    ],
    HEAVY: [
      'Anh hút trong vòng 5-30 phút sau khi thức',
      'Hút trên 20 điếu/ngày (1 gói trở lên)',
      'Không thể nhịn ở nơi cấm hút',
      'Hút cả khi ốm bệnh nằm liệt giường',
      'Não đã quen liều cao — cần combo công cụ + thời gian dài'
    ]
  };

  return { score, cohort, plan, scoreRange: scoreRanges[cohort], whatItMeans: whatItMeans[cohort] };
}

export function validateAnswers(answers: FtndAnswer[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(answers)) {
    errors.push('Answers phải là array');
    return { valid: false, errors };
  }
  if (answers.length !== 6) {
    errors.push(`Cần đủ 6 câu trả lời, hiện có ${answers.length}`);
  }
  answers.forEach((ans, idx) => {
    if (typeof ans.q !== 'number' || ans.q < 1 || ans.q > 6) {
      errors.push(`Câu ${idx + 1}: question id không hợp lệ`);
    }
    if (typeof ans.a !== 'number' || ans.a < 0 || ans.a > 3) {
      errors.push(`Câu ${idx + 1}: answer value phải từ 0-3`);
    }
  });
  return { valid: errors.length === 0, errors };
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function calculatePrice(days: number, dailyRate: number = 5000): number {
  return days * dailyRate;
}

/**
 * Trích cigsBaseline từ FTND Q4 answer (Sol Day 4 logic)
 * Q4 options: 0=<10/day, 1=11-20/day, 2=21-30/day, 3=31+/day
 * → midpoint estimate: 5, 15, 25, 35
 */
export function estimateCigsBaseline(q4Answer: number): number {
  switch (q4Answer) {
    case 0: return 5;
    case 1: return 15;
    case 2: return 25;
    case 3: return 35;
    default: return 20;
  }
}
