// backend/src/scripts/seedTestUsers.ts
//
// SEED 9 test users để screenshot/test UI ở mọi giai đoạn hành trình.
// Matrix: 3 cohort (LIGHT/MODERATE/HEAVY) × 3 milestones (Day 1, Q-Day, hoàn thành)
// + 1 user Tái Thiết (Day 100+) để test extension miễn phí.
//
// Mỗi user có:
//   - quitDate = today - N ngày (time-travel)
//   - qDayConfirmedAt (nếu dayInJourney > cohort.qDay)
//   - ftndCohort + ftndScore
//   - 5-30 CheckIns realistic (mood/cravingIntensity trending down)
//   - 5-50 CigaretteLog (giảm dần qua thời gian)
//
// Usage:
//   tsx src/scripts/seedTestUsers.ts                  # tạo + seed 10 users
//   tsx src/scripts/seedTestUsers.ts --clean          # xóa users cũ trước
//   tsx src/scripts/seedTestUsers.ts --only=heavy-d65 # chỉ 1 user
//
// Login từng user:
//   - Mỗi user có deviceUid riêng (in ra console)
//   - Frontend: localStorage.setItem('sol_device_uid', '<deviceUid>'); reload
//   - Hoặc dùng API: POST /auth/anonymous với { deviceUid }

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLEAN = process.argv.includes('--clean');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice(7) : null;

interface TestUserSpec {
  key: string;                          // ID unique để filter --only
  cohort: 'LIGHT' | 'MODERATE' | 'HEAVY';
  ftndScore: number;
  dayInJourney: number;                 // số ngày user đã đi (1+ ; 0 = chưa start)
  qDay: number;                         // theo cohort
  totalDays: number;                    // theo cohort
  name: string;
  pronouns: string;
  baselineCigsPerDay: number;
  pricePerCig: number;
}

// 10 test users — matrix
const SPECS: TestUserSpec[] = [
  // ─── LIGHT (35 ngày, Q-Day Day 15) ────────────────────────────────────
  {
    key: 'light-d1', cohort: 'LIGHT', ftndScore: 2, dayInJourney: 1,
    qDay: 15, totalDays: 35,
    name: 'Test Light Day1', pronouns: 'anh',
    baselineCigsPerDay: 8, pricePerCig: 1200,
  },
  {
    key: 'light-d15', cohort: 'LIGHT', ftndScore: 2, dayInJourney: 15,
    qDay: 15, totalDays: 35,
    name: 'Test Light QDay', pronouns: 'anh',
    baselineCigsPerDay: 8, pricePerCig: 1200,
  },
  {
    key: 'light-d35', cohort: 'LIGHT', ftndScore: 2, dayInJourney: 35,
    qDay: 15, totalDays: 35,
    name: 'Test Light Done', pronouns: 'anh',
    baselineCigsPerDay: 8, pricePerCig: 1200,
  },
  // ─── MODERATE (52 ngày, Q-Day Day 22) ─────────────────────────────────
  {
    key: 'moderate-d1', cohort: 'MODERATE', ftndScore: 5, dayInJourney: 1,
    qDay: 22, totalDays: 52,
    name: 'Test Moderate Day1', pronouns: 'anh',
    baselineCigsPerDay: 15, pricePerCig: 1500,
  },
  {
    key: 'moderate-d22', cohort: 'MODERATE', ftndScore: 5, dayInJourney: 22,
    qDay: 22, totalDays: 52,
    name: 'Test Moderate QDay', pronouns: 'anh',
    baselineCigsPerDay: 15, pricePerCig: 1500,
  },
  {
    key: 'moderate-d52', cohort: 'MODERATE', ftndScore: 5, dayInJourney: 52,
    qDay: 22, totalDays: 52,
    name: 'Test Moderate Done', pronouns: 'anh',
    baselineCigsPerDay: 15, pricePerCig: 1500,
  },
  // ─── HEAVY (65 ngày, Q-Day Day 28) ────────────────────────────────────
  {
    key: 'heavy-d1', cohort: 'HEAVY', ftndScore: 9, dayInJourney: 1,
    qDay: 28, totalDays: 65,
    name: 'Test Heavy Day1', pronouns: 'anh',
    baselineCigsPerDay: 25, pricePerCig: 1800,
  },
  {
    key: 'heavy-d28', cohort: 'HEAVY', ftndScore: 9, dayInJourney: 28,
    qDay: 28, totalDays: 65,
    name: 'Test Heavy QDay', pronouns: 'anh',
    baselineCigsPerDay: 25, pricePerCig: 1800,
  },
  {
    key: 'heavy-d65', cohort: 'HEAVY', ftndScore: 9, dayInJourney: 65,
    qDay: 28, totalDays: 65,
    name: 'Test Heavy Done', pronouns: 'anh',
    baselineCigsPerDay: 25, pricePerCig: 1800,
  },
  // ─── TÁI THIẾT (Day 100 — extension miễn phí) ─────────────────────────
  {
    key: 'heavy-d100', cohort: 'HEAVY', ftndScore: 9, dayInJourney: 100,
    qDay: 28, totalDays: 65,
    name: 'Test Heavy TaiThiet', pronouns: 'anh',
    baselineCigsPerDay: 25, pricePerCig: 1800,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TRIGGERS = ['STRESS', 'EATING', 'IDLE', 'SOCIAL', 'OTHER'];
const HARDEST_MOMENTS = ['nhậu', 'stress công việc', 'sau cơm', 'sáng cà phê', 'tụ tập bạn', 'buồn ngủ'];
const COPING_ACTIONS = ['uống nước lạnh', 'đi bộ 10 phút', 'hít thở sâu', 'gọi vợ', 'đánh răng', 'nghe Voice Khang'];
const WINS = [
  'trì hoãn được 30 phút',
  'không hút sau cơm',
  'đi qua quán cà phê không dừng',
  'từ chối điếu của bạn',
  'tự nấu ăn không hút',
  'ngủ sớm không thèm',
];
const NOTES = [
  'Hôm nay khó hơn hôm qua nhưng vẫn ổn.',
  'Bắt đầu cảm thấy thở dễ hơn.',
  'Vợ khen sáng nay không có mùi thuốc.',
  'Stress công việc — nhưng đã vượt qua.',
  'Cơn thèm tới 2 lần, đều giảm sau 5 phút.',
  null, null, null,
];

// ─── Generate check-ins for 1 user ────────────────────────────────────────

function generateCheckIns(spec: TestUserSpec, quitDate: Date) {
  const records: any[] = [];
  // Đếm cho cohort hoàn thành: user log gần đầy ngày, miss vài ngày random
  // Day 1 user: chỉ có 1 check-in hôm nay
  for (let d = 1; d <= spec.dayInJourney; d++) {
    // 85% chance check-in (miss 15% — realistic)
    if (Math.random() > 0.85) continue;

    const date = new Date(quitDate);
    date.setDate(date.getDate() + d - 1);

    // Logic mood/craving: trending DOWN qua thời gian (post Q-Day giảm mạnh)
    const isPostQDay = d > spec.qDay;
    const phase = d / spec.totalDays; // 0..1
    const cravingBase = isPostQDay ? 5 - 3 * phase : 7 - 2 * phase;
    const moodBase = isPostQDay ? 3 + 2 * phase : 3;

    records.push({
      userId: spec.key, // placeholder — sẽ replace bằng userId thực sau khi create
      dayNumber: d,
      date,
      smoked: isPostQDay ? Math.random() < 0.1 : Math.random() < 0.6, // 60% smoke pre-Q, 10% post
      smokeCount: isPostQDay ? (Math.random() < 0.1 ? 1 : null) : rand(1, spec.baselineCigsPerDay),
      cravingIntensity: Math.max(1, Math.min(10, Math.round(cravingBase + (Math.random() - 0.5) * 2))),
      mood: Math.max(1, Math.min(5, Math.round(moodBase + (Math.random() - 0.5)))),
      hardestMoment: Math.random() < 0.7 ? randChoice(HARDEST_MOMENTS) : null,
      copingAction: Math.random() < 0.6 ? randChoice(COPING_ACTIONS) : null,
      win: Math.random() < 0.5 ? randChoice(WINS) : null,
      note: randChoice(NOTES),
      isSickDay: Math.random() < 0.03, // 3% sick days
    });
  }
  return records;
}

// ─── Generate cigarette logs ──────────────────────────────────────────────

function generateCigaretteLogs(spec: TestUserSpec, quitDate: Date) {
  const logs: any[] = [];
  for (let d = 1; d <= spec.dayInJourney; d++) {
    const isPostQDay = d > spec.qDay;
    const phase = d / spec.totalDays;

    // Pre-Q: hút giảm dần từ baseline → 0
    // Post-Q: hầu như không hút (5% relapse rate)
    let cigsToday: number;
    if (isPostQDay) {
      cigsToday = Math.random() < 0.05 ? rand(1, 3) : 0; // lapse occasional
    } else {
      // Giảm tuyến tính: Day 1 = baseline, Day qDay = 0
      const reductionRatio = 1 - (d / spec.qDay);
      cigsToday = Math.max(0, Math.round(spec.baselineCigsPerDay * reductionRatio + rand(-2, 2)));
    }

    // Skipped — user defer 1-3 lần/ngày
    const skipped = isPostQDay ? rand(0, 1) : rand(0, 3);

    for (let i = 0; i < cigsToday; i++) {
      const ts = new Date(quitDate);
      ts.setDate(ts.getDate() + d - 1);
      ts.setHours(rand(7, 22), rand(0, 59), 0, 0);
      logs.push({
        smokedAt: ts,
        trigger: randChoice(TRIGGERS),
        context: null,
        delayedMin: Math.random() < 0.3 ? rand(5, 30) : null,
        skipped: false,
      });
    }
    for (let i = 0; i < skipped; i++) {
      const ts = new Date(quitDate);
      ts.setDate(ts.getDate() + d - 1);
      ts.setHours(rand(7, 22), rand(0, 59), 0, 0);
      logs.push({
        smokedAt: ts,
        trigger: randChoice(TRIGGERS),
        context: null,
        delayedMin: rand(10, 60),
        skipped: true,
      });
    }
  }
  return logs;
}

// ─── Seed 1 user ──────────────────────────────────────────────────────────

async function seedOne(spec: TestUserSpec): Promise<{ deviceUid: string; userId: string }> {
  const deviceUid = `test-${spec.key}-${Date.now()}`;
  const quitDate = daysAgo(spec.dayInJourney - 1); // dayInJourney=1 → quitDate=today

  // qDayConfirmedAt: nếu user đã qua Q-Day
  const qDayConfirmedAt = spec.dayInJourney > spec.qDay
    ? daysAgo(spec.dayInJourney - spec.qDay)
    : null;

  const user = await prisma.user.create({
    data: {
      deviceUid,
      name: spec.name,
      pronouns: spec.pronouns,
      ftndScore: spec.ftndScore,
      ftndCohort: spec.cohort,
      quitDate,
      qDayConfirmedAt,
      cigsBaseline: spec.baselineCigsPerDay,
      pricePerCig: spec.pricePerCig,
      onboardingCompletedAt: quitDate,
      settings: {
        severityCohort: spec.cohort,
        ftndAnswers: [
          { q: 1, a: spec.cohort === 'LIGHT' ? 0 : spec.cohort === 'MODERATE' ? 1 : 3 },
          { q: 2, a: spec.cohort === 'LIGHT' ? 0 : 1 },
          { q: 3, a: spec.cohort === 'LIGHT' ? 0 : 1 },
          { q: 4, a: spec.cohort === 'LIGHT' ? 1 : spec.cohort === 'MODERATE' ? 2 : 3 },
          { q: 5, a: spec.cohort === 'LIGHT' ? 0 : 1 },
          { q: 6, a: spec.cohort === 'LIGHT' ? 1 : 1 },
        ],
        ftndCompletedAt: daysAgo(spec.dayInJourney).toISOString(),
      },
      quitReasons: [
        'Vì con',
        'Vì vợ ngửi không quen mùi',
        'Vì sức khỏe — đêm khó thở',
      ],
    },
  });

  // Check-ins
  const checkins = generateCheckIns(spec, quitDate).map((c) => ({ ...c, userId: user.id }));
  if (checkins.length > 0) {
    await prisma.checkIn.createMany({ data: checkins, skipDuplicates: true });
  }

  // Cigarette logs
  const cigLogs = generateCigaretteLogs(spec, quitDate).map((l) => ({ ...l, userId: user.id }));
  if (cigLogs.length > 0) {
    await prisma.cigaretteLog.createMany({ data: cigLogs });
  }

  return { deviceUid, userId: user.id };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n▶ Seed test users — matrix ${SPECS.length} users`);
  console.log(`  Mode: ${CLEAN ? 'CLEAN + SEED' : 'SEED ONLY'}`);
  if (ONLY) console.log(`  Filter: --only=${ONLY}`);
  console.log('');

  if (CLEAN) {
    const deleted = await prisma.user.deleteMany({
      where: { deviceUid: { startsWith: 'test-' } },
    });
    console.log(`  🗑️  Deleted ${deleted.count} old test users\n`);
  }

  const filtered = ONLY ? SPECS.filter((s) => s.key === ONLY) : SPECS;
  if (filtered.length === 0) {
    console.log(`  ✗ Không tìm thấy spec --only=${ONLY}`);
    console.log(`  Available keys: ${SPECS.map((s) => s.key).join(', ')}`);
    process.exit(1);
  }

  const results: Array<{ spec: TestUserSpec; deviceUid: string; userId: string }> = [];

  for (const spec of filtered) {
    process.stdout.write(`  ▶ ${spec.key.padEnd(15)} (${spec.cohort.padEnd(8)} day ${spec.dayInJourney})... `);
    try {
      const r = await seedOne(spec);
      results.push({ spec, ...r });
      console.log(`✓ ${r.userId}`);
    } catch (e: any) {
      console.log(`✗ ${e.message}`);
    }
  }

  // ─── Output bảng login info ──────────────────────────────────────────
  console.log('\n=== TEST USERS — DEVICE UIDs ===\n');
  console.log('Để login từng user vào dashboard:');
  console.log('  1. Mở https://bothuocla.sol.vn/ (incognito)');
  console.log('  2. DevTools (F12) → Console → paste:');
  console.log('     localStorage.setItem("sol_device_uid", "<deviceUid>"); location.reload();');
  console.log('  3. Hoặc cookie API auth: POST /api/auth/anonymous với { deviceUid }');
  console.log('');
  console.log('| Key             | Cohort   | Day  | DeviceUid');
  console.log('|-----------------|----------|------|----------');
  for (const r of results) {
    console.log(`| ${r.spec.key.padEnd(15)} | ${r.spec.cohort.padEnd(8)} | ${String(r.spec.dayInJourney).padStart(4)} | ${r.deviceUid}`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('FATAL', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
