// backend/src/journey/routes.ts
// Phase B — 88-day journey endpoints.
// Q-Day Day 28 confirm + onboarding baseline + cumulative money saved.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';
import {
  computeDayInJourney,
  getStageDayInfo,
  getUnlockedMilestones,
  getNextMilestone,
  computeMoneySavedCumulative,
  computeDailyMoneySaved,
  deriveQDayState,
  STAGE_LABELS,
  STAGE_COLORS,
  STAGE_EMOJI,
  STAGE_TAGLINES,
  deriveMode,
  MODE_INFO,
  generateStory,
  generateNextInsight,
  Q_DAY,
  type JourneyStage,
  // V2 cohort-aware (canonical 2026-05-18)
  readCohort,
  COHORT_DEFS,
  getChapterDayInfo,
  deriveQDayStateV2,
  shouldGenerateMemoryBook,
  type Cohort,
} from './service';

export const journeyRouter = Router();
journeyRouter.use(authMiddleware);

// ─── Helper: tính daily cigs count cho cumulative money ───────────────────
async function getDailyCigsCount(
  userId: string,
  quitDate: Date,
  currentDay: number,
): Promise<Array<{ dayInJourney: number; cigsCount: number }>> {
  if (currentDay <= 0) return [];

  // Lấy tất cả logs từ quitDate đến giờ
  const logs = await prisma.cigaretteLog.findMany({
    where: { userId, skipped: false, smokedAt: { gte: quitDate } },
    select: { smokedAt: true },
  });

  // Group by dayInJourney (1-based)
  const counts: Record<number, number> = {};
  const quitMs = new Date(quitDate).getTime();
  for (const log of logs) {
    const day = Math.floor((new Date(log.smokedAt).getTime() - quitMs) / 86400000) + 1;
    if (day >= 1 && day <= currentDay) {
      counts[day] = (counts[day] || 0) + 1;
    }
  }

  // Build full array (day 1 → currentDay), 0 cigs cho ngày không có log
  const result: Array<{ dayInJourney: number; cigsCount: number }> = [];
  for (let d = 1; d <= currentDay; d++) {
    result.push({ dayInJourney: d, cigsCount: counts[d] || 0 });
  }
  return result;
}

// ─── GET /journey/dashboard — combined live data cho 1 màn hình ───────────
// Express 4 KHÔNG tự catch async error → wrap try/catch để luôn trả response.
// Trước fix này, Prisma throw (vd unknown field) → request hang vĩnh viễn.
journeyRouter.get('/dashboard', async (req: AuthedRequest, res) => {
  try {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  const dayInJourney = computeDayInJourney(user.quitDate);
  const stageInfo = getStageDayInfo(dayInJourney);  // LEGACY 88-day
  const qDayState = deriveQDayState(dayInJourney, user.qDayConfirmedAt);  // LEGACY Q_DAY=28

  // ── V2 COHORT-AWARE (canonical 2026-05-18) ─────────────────────────────
  const cohortCode: Cohort = readCohort({
    ftndCohort: (user as any).ftndCohort,
    settings: user.settings,
  });
  const cohortDef = COHORT_DEFS[cohortCode];
  const chapterInfo = getChapterDayInfo(dayInJourney, cohortCode);
  const qDayStateV2 = deriveQDayStateV2(dayInJourney, user.qDayConfirmedAt, cohortCode);
  const completedMainJourney = dayInJourney >= cohortDef.totalDays;
  const memoryBookReady = shouldGenerateMemoryBook(dayInJourney, cohortCode);

  // Cigarette stats
  const [cigsLogged, cigsSkipped] = await Promise.all([
    prisma.cigaretteLog.count({ where: { userId: user.id, skipped: false } }),
    prisma.cigaretteLog.count({ where: { userId: user.id, skipped: true } }),
  ]);

  // Today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cigsToday = await prisma.cigaretteLog.count({
    where: { userId: user.id, smokedAt: { gte: today }, skipped: false },
  });

  // Triggers breakdown (lifetime)
  const triggerLogs = await prisma.cigaretteLog.findMany({
    where: { userId: user.id, skipped: false, trigger: { not: null } },
    select: { trigger: true },
  });
  const triggerCounts: Record<string, number> = {};
  for (const log of triggerLogs) {
    const t = log.trigger || 'OTHER';
    triggerCounts[t] = (triggerCounts[t] || 0) + 1;
  }

  // ── MONEY SAVED — CUMULATIVE PER-DAY DELTA, ALLOW NEGATIVE ──────────────
  const baseline = user.cigsBaseline || 20;
  const pricePerCig = user.pricePerCig || 1000;
  let moneySaved = 0;
  if (user.quitDate && dayInJourney > 0) {
    const dailyCigs = await getDailyCigsCount(user.id, user.quitDate, dayInJourney);
    moneySaved = computeMoneySavedCumulative(dailyCigs, baseline, pricePerCig);
  }

  // Milestones (tính từ qDayConfirmedAt, không phải quitDate)
  const unlockedMilestones = getUnlockedMilestones(user.qDayConfirmedAt);
  const nextMilestone = getNextMilestone(user.qDayConfirmedAt);

  // Streak — number of consecutive days với check-in
  const recentCheckins = await prisma.checkIn.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 30,
    select: { date: true },
  });
  let streak = 0;
  const oneDay = 86400000;
  let cursor = today.getTime();
  for (const ci of recentCheckins) {
    const d = new Date(ci.date);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === cursor || d.getTime() === cursor - oneDay) {
      streak++;
      cursor = d.getTime() - oneDay;
    } else {
      break;
    }
  }

  // Đội Sol đồng đội (anonymous)
  const cohortKey = user.cohortKey;
  let cohort: Array<{ pseudonym: string; dayInJourney: number; stageLabel: string }> = [];
  if (cohortKey) {
    const peers = await prisma.user.findMany({
      where: { cohortKey, NOT: { id: user.id }, exitedAt: null },
      select: { id: true, name: true, quitDate: true },
      take: 30,
    });
    cohort = peers.map((p, i) => {
      const day = computeDayInJourney(p.quitDate);
      const info = getStageDayInfo(day);
      return {
        pseudonym: 'Đồng đội ' + String.fromCharCode(65 + i),
        dayInJourney: day,
        stageLabel: info.stageLabel,
      };
    });
  }

  // Mode + Story + Next Insight
  const mode = deriveMode(dayInJourney);

  // 7-day average
  const since7d = new Date(Date.now() - 7 * 86400000);
  const cigs7d = await prisma.cigaretteLog.count({
    where: { userId: user.id, smokedAt: { gte: since7d }, skipped: false },
  });
  const cigsAvg7d = cigs7d / 7;

  // Today's peak hour + top trigger
  const todayLogs = await prisma.cigaretteLog.findMany({
    where: { userId: user.id, smokedAt: { gte: today }, skipped: false },
    select: { smokedAt: true, trigger: true },
  });
  const hourCounts: Record<number, number> = {};
  const todayTriggers: Record<string, number> = {};
  for (const log of todayLogs) {
    const h = new Date(log.smokedAt).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
    if (log.trigger) todayTriggers[log.trigger] = (todayTriggers[log.trigger] || 0) + 1;
  }
  const peakHourToday = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topTriggerToday = Object.entries(todayTriggers).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const cigsSkippedToday = await prisma.cigaretteLog.count({
    where: { userId: user.id, smokedAt: { gte: today }, skipped: true },
  });

  // Phase B slip detection — log gần nhất trong 24h (skipped=false). Dùng để
  // FE auto-show SlipModal khi user vừa log "đã hút" trong Phase 3-4.
  const last24h = new Date(Date.now() - 86400000);
  const lastSlipLog = qDayState.clockEnabled
    ? await prisma.cigaretteLog.findFirst({
        where: { userId: user.id, skipped: false, smokedAt: { gte: last24h } },
        orderBy: { smokedAt: 'desc' },
        select: { id: true, smokedAt: true },
      })
    : null;

  const storyCtx = {
    dayInJourney,
    stage: stageInfo.stage,
    cigsToday,
    cigsAvg7d,
    cigsSkippedToday,
    topTriggerToday,
    peakHourToday: peakHourToday ? parseInt(peakHourToday as string, 10) : null,
    pronouns: user.pronouns ?? 'bạn',
    mode,
    qDayConfirmed: !!user.qDayConfirmedAt,
    daysUntilQDay: qDayState.daysUntilQDay,
  };

  const story = generateStory(storyCtx);
  const nextInsight = generateNextInsight(storyCtx);

  // Pattern map: 24h distribution last 7 days
  const last7dLogs = await prisma.cigaretteLog.findMany({
    where: { userId: user.id, smokedAt: { gte: since7d }, skipped: false },
    select: { smokedAt: true },
  });
  const hourPattern = new Array(24).fill(0);
  for (const log of last7dLogs) {
    hourPattern[new Date(log.smokedAt).getHours()]++;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      pronouns: user.pronouns,
      assistantName: user.assistantName,
      quitDate: user.quitDate,
      exitedAt: user.exitedAt,
      // Phase B fields
      qDayConfirmedAt: user.qDayConfirmedAt,
      cigsBaseline: user.cigsBaseline,
      pricePerCig: user.pricePerCig,
      onboardingCompletedAt: user.onboardingCompletedAt,
    },
    journey: {
      // LEGACY 88-day fields (giữ tương thích với UI cũ chưa migrate)
      dayInJourney,
      qDay: Q_DAY,
      totalDays: 88,
      progressPercent: Math.min(100, Math.round((dayInJourney / 88) * 100)),
      stage: stageInfo.stage,
      stageLabel: stageInfo.stageLabel,
      stageTagline: stageInfo.stageTagline,
      stageEmoji: stageInfo.stageEmoji,
      stageColor: stageInfo.stageColor,
      dayInStage: stageInfo.dayInStage,
      totalInStage: stageInfo.totalInStage,
      progressInStage: stageInfo.progressInStage,
    },
    // V2 COHORT-AWARE (canonical 2026-05-18) — dùng cho UI mới
    journeyV2: {
      dayInJourney,
      cohort: cohortCode,                                  // 'LIGHT' | 'MODERATE' | 'HEAVY'
      cohortLabel: cohortDef.label,                        // 'NHẸ' | 'VỪA' | 'NẶNG'
      cohortEmoji: cohortDef.emoji,
      cohortTagline: cohortDef.tagline,
      totalDays: cohortDef.totalDays,                      // 35 / 52 / 65
      qDay: cohortDef.qDay,                                // 15 / 22 / 28
      progressPercent: Math.min(100, Math.round((dayInJourney / cohortDef.totalDays) * 100)),
      completedMainJourney,                                // Đã hoàn thành lộ trình chính
      memoryBookReady,                                     // Sổ Lưu Niệm sẵn sàng generate
      // Chặng hiện tại (NHAN_DIEN | KIEM_SOAT | LAM_CHU | TAI_THIET)
      chapter: chapterInfo.chapter,
      chapterLabel: chapterInfo.chapterLabel,
      chapterTagline: chapterInfo.chapterTagline,
      chapterEmoji: chapterInfo.chapterEmoji,
      chapterColor: chapterInfo.chapterColor,
      dayInChapter: chapterInfo.dayInChapter,
      totalInChapter: chapterInfo.totalInChapter === Infinity ? null : chapterInfo.totalInChapter,
      progressInChapter: chapterInfo.progressInChapter,
      // Boundaries của 3 chặng chính (cho UI render timeline grid)
      chapters: cohortDef.chapters,
      taiThietStart: cohortDef.taiThietStart,
    },
    qDayV2: {
      qDay: qDayStateV2.qDay,
      isPreQDay: qDayStateV2.isPreQDay,
      isQDay: qDayStateV2.isQDay,
      isPostQDay: qDayStateV2.isPostQDay,
      needsConfirmation: qDayStateV2.needsConfirmation,
      daysUntilQDay: qDayStateV2.daysUntilQDay,
      qDayConfirmedAt: qDayStateV2.qDayConfirmedAt,
      clockEnabled: qDayStateV2.clockEnabled,
    },
    qDay: {
      isPreQDay: qDayState.isPreQDay,
      isQDay: qDayState.isQDay,
      isPostQDay: qDayState.isPostQDay,
      needsConfirmation: qDayState.needsConfirmation,
      daysUntilQDay: qDayState.daysUntilQDay,
      qDayConfirmedAt: qDayState.qDayConfirmedAt,
      clockEnabled: qDayState.clockEnabled,
      // Phase B — slip detection. Phase 3-4 chỉ: nếu user đã confirm Q-Day VÀ
      // có log smoking trong 24h vừa qua → flag để FE auto-show SlipModal
      // compassion. Server-side state đảm bảo không miss khi user đóng tab
      // giữa logger submit và reload.
      recentSlip: qDayState.clockEnabled && lastSlipLog !== null,
      // ID của log gần nhất trong 24h — FE dùng để dedupe SlipModal (chỉ show
      // 1 lần per slip, dù user reload nhiều lần). Lưu localStorage.
      lastSlipLogId: lastSlipLog?.id ?? null,
    },
    mode: {
      key: mode,
      ...MODE_INFO[mode],
    },
    today: {
      cigsCount: cigsToday,
      cigsSkipped: cigsSkippedToday,
      peakHour: peakHourToday ? parseInt(peakHourToday as string, 10) : null,
      topTrigger: topTriggerToday,
    },
    story,
    nextInsight,
    pattern: {
      hourly: hourPattern,
      cigsAvg7d: Math.round(cigsAvg7d * 10) / 10,
    },
    stats: {
      cigsLogged,
      cigsSkipped,
      cigsToday,
      moneySaved,           // có thể âm
      moneySavedSign: moneySaved > 0 ? 'positive' : moneySaved < 0 ? 'negative' : 'zero',
      streak,
      triggerCounts,
      baseline,
      pricePerCig,
    },
    milestones: {
      unlocked: unlockedMilestones,
      next: nextMilestone,
    },
    cohort,
  });
  } catch (e: any) {
    console.error('[journey/dashboard] error:', e);
    return res.status(500).json({
      error: 'dashboard_error',
      message: e?.message ?? 'Lỗi khi tải dashboard',
      code: e?.code ?? null,        // Prisma error code (P2022 = unknown column)
      meta: e?.meta ?? null,
    });
  }
});

// ─── POST /journey/qday-confirm — user cam kết bỏ hẳn Day 28 ──────────────
// Bắt buộc: dayInJourney >= 28 (chưa cho confirm trước).
// Khi confirm: set qDayConfirmedAt = now, đồng hồ countdown bật từ giây này.
journeyRouter.post('/qday-confirm', async (req: AuthedRequest, res) => {
  try {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  const dayInJourney = computeDayInJourney(user.quitDate);
  if (dayInJourney < Q_DAY) {
    return res.status(400).json({
      error: 'too_early',
      message: `Q-Day là ngày ${Q_DAY}. Anh đang ở ngày ${dayInJourney}. Còn ${Q_DAY - dayInJourney} ngày.`,
    });
  }

  if (user.qDayConfirmedAt) {
    return res.status(400).json({
      error: 'already_confirmed',
      qDayConfirmedAt: user.qDayConfirmedAt,
      message: 'Anh đã cam kết Q-Day rồi.',
    });
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { qDayConfirmedAt: now },
  });

  res.json({
    ok: true,
    qDayConfirmedAt: now,
    message: `Từ giây này, đồng hồ tự do của ${user.pronouns ?? 'bạn'} bắt đầu chạy. Sol bên ${user.pronouns ?? 'bạn'}.`,
  });
  } catch (e: any) {
    console.error('[journey/qday-confirm] error:', e);
    return res.status(500).json({ error: 'qday_confirm_error', message: e?.message, code: e?.code });
  }
});

// ─── POST /journey/onboarding/baseline — Day 1 wizard ─────────────────────
const baselineSchema = z.object({
  cigsBaseline: z.number().int().min(1).max(60),    // 1-60 điếu/ngày
  pricePerCig: z.number().int().min(100).max(50000), // 100đ - 50k/điếu
});

journeyRouter.post('/onboarding/baseline', async (req: AuthedRequest, res) => {
  try {
  const parsed = baselineSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', detail: parsed.error.flatten() });
  }

  const { cigsBaseline, pricePerCig } = parsed.data;

  // Nếu user chưa có quitDate, set luôn = today để bắt đầu Day 1
  const existing = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { quitDate: true },
  });

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      cigsBaseline,
      pricePerCig,
      onboardingCompletedAt: new Date(),
      ...(existing?.quitDate ? {} : { quitDate: new Date() }),
    },
    select: {
      id: true,
      cigsBaseline: true,
      pricePerCig: true,
      onboardingCompletedAt: true,
      quitDate: true,
      pronouns: true,
    },
  });

  res.json({
    ok: true,
    user,
    message: `Cảm ơn ${user.pronouns ?? 'bạn'}. Sol đã ghi nhận: ${cigsBaseline} điếu/ngày × ${pricePerCig.toLocaleString('vi-VN')}đ. Bắt đầu hành trình.`,
  });
  } catch (e: any) {
    console.error('[journey/onboarding/baseline] error:', e);
    return res.status(500).json({ error: 'baseline_error', message: e?.message, code: e?.code });
  }
});

// ─── POST /journey/onboarding/ftnd — Day 4 (2026-05-21) ───────────────────
// Test FTND replaces OnboardingWizard. Frontend đã tính cohort + score local,
// backend recompute để defense-in-depth (KHÔNG trust client).
//
// Side effects: set ftndScore, cigsBaseline, pricePerCig, cohortKey severity
// (lưu vào settings JSON vì User schema chưa có dedicated field),
// onboardingCompletedAt, quitDate (nếu chưa có).
const ftndOnboardingSchema = z.object({
  cigsBaseline: z.number().int().min(1).max(60),
  pricePerCig: z.number().int().min(100).max(50000),
  ftndScore: z.number().int().min(0).max(10),
  cohort: z.enum(['LIGHT', 'MODERATE', 'HEAVY']),
  answers: z.array(z.object({
    q: z.number().int().min(1).max(6),
    a: z.number().int().min(0).max(3),
  })).length(6),
});

/** Server-side recompute cohort từ answers — defense in depth */
function recomputeCohortFromAnswers(answers: Array<{ q: number; a: number }>): { score: number; cohort: 'LIGHT' | 'MODERATE' | 'HEAVY' } {
  const score = answers.reduce((sum, a) => sum + (typeof a.a === 'number' ? a.a : 0), 0);
  const cohort = score <= 3 ? 'LIGHT' : score <= 6 ? 'MODERATE' : 'HEAVY';
  return { score, cohort };
}

journeyRouter.post('/onboarding/ftnd', async (req: AuthedRequest, res) => {
  try {
    const parsed = ftndOnboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_payload', detail: parsed.error.flatten() });
    }

    const { cigsBaseline, pricePerCig, answers } = parsed.data;
    const clientCohort = parsed.data.cohort;
    const clientScore = parsed.data.ftndScore;

    // Server recompute để defense — nếu client tamper, dùng server result
    const server = recomputeCohortFromAnswers(answers);
    const finalScore = server.score;
    const finalCohort = server.cohort;
    const mismatch = server.score !== clientScore || server.cohort !== clientCohort;
    if (mismatch) {
      console.warn('[ftnd] client/server mismatch:', { client: { clientScore, clientCohort }, server });
    }

    const existing = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { quitDate: true, settings: true },
    });

    // Merge severity cohort vào settings JSON (User chưa có dedicated field)
    const existingSettings = (existing?.settings as any) ?? {};
    const newSettings = {
      ...existingSettings,
      severityCohort: finalCohort,
      ftndAnswers: answers,
      ftndCompletedAt: new Date().toISOString(),
    };

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        cigsBaseline,
        pricePerCig,
        ftndScore: finalScore,
        ftndCohort: finalCohort,  // V2 dedicated field (canonical 2026-05-18)
        settings: newSettings,    // Keep settings.severityCohort cho legacy fallback
        onboardingCompletedAt: new Date(),
        ...(existing?.quitDate ? {} : { quitDate: new Date() }),
      },
      select: {
        id: true,
        cigsBaseline: true,
        pricePerCig: true,
        ftndScore: true,
        ftndCohort: true,
        onboardingCompletedAt: true,
        quitDate: true,
        pronouns: true,
        settings: true,
      },
    });

    res.json({
      ok: true,
      user,
      cohort: finalCohort,
      ftndScore: finalScore,
      message: `Sol đã hiểu mức lệ thuộc của ${user.pronouns ?? 'bạn'}: ${finalCohort} (${finalScore}/10). Bắt đầu hành trình ${finalCohort === 'LIGHT' ? '35' : finalCohort === 'MODERATE' ? '52' : '65'} ngày.`,
    });
  } catch (e: any) {
    console.error('[journey/onboarding/ftnd] error:', e);
    return res.status(500).json({ error: 'ftnd_onboarding_error', message: e?.message, code: e?.code });
  }
});

// ─── POST /journey/cigarette — log 1 điếu ─────────────────────────────────
const logSchema = z.object({
  trigger: z.enum(['STRESS', 'EATING', 'IDLE', 'SOCIAL', 'OTHER']).optional(),
  context: z.string().max(500).optional(),
  delayedMin: z.number().int().min(0).max(120).optional(),
  skipped: z.boolean().optional(),
});

journeyRouter.post('/cigarette', async (req: AuthedRequest, res) => {
  const parsed = logSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', detail: parsed.error.flatten() });

  const created = await prisma.cigaretteLog.create({
    data: {
      userId: req.userId!,
      trigger: parsed.data.trigger,
      context: parsed.data.context,
      delayedMin: parsed.data.delayedMin,
      skipped: parsed.data.skipped ?? false,
    },
  });
  res.json(created);
});

// ─── DELETE /journey/cigarette/:id — undo ─────────────────────────────────
journeyRouter.delete('/cigarette/:id', async (req: AuthedRequest, res) => {
  const log = await prisma.cigaretteLog.findUnique({ where: { id: req.params.id } });
  if (!log || log.userId !== req.userId) return res.status(404).json({ error: 'not_found' });
  await prisma.cigaretteLog.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ─── POST /journey/exit — exit hành trình + nhận hồ sơ ────────────────────
const exitSchema = z.object({
  reason: z.string().max(500).optional(),
});

journeyRouter.post('/exit', async (req: AuthedRequest, res) => {
  const parsed = exitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  if (user.exitedAt) return res.status(400).json({ error: 'already_exited' });

  const dayInJourney = computeDayInJourney(user.quitDate);

  // Aggregate snapshot
  const [cigsLogged, cigsSkipped] = await Promise.all([
    prisma.cigaretteLog.count({ where: { userId: user.id, skipped: false } }),
    prisma.cigaretteLog.count({ where: { userId: user.id, skipped: true } }),
  ]);

  const triggerLogs = await prisma.cigaretteLog.findMany({
    where: { userId: user.id, skipped: false, trigger: { not: null } },
    select: { trigger: true },
  });
  const triggerCounts: Record<string, number> = {};
  for (const log of triggerLogs) {
    const t = log.trigger || 'OTHER';
    triggerCounts[t] = (triggerCounts[t] || 0) + 1;
  }

  const checkinHighlights = await prisma.checkIn.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' },
    take: 30,
    select: { date: true, mood: true, note: true },
  });

  // Cumulative money saved (cho phép âm)
  let moneySaved = 0;
  if (user.quitDate && dayInJourney > 0) {
    const dailyCigs = await getDailyCigsCount(user.id, user.quitDate, dayInJourney);
    moneySaved = computeMoneySavedCumulative(dailyCigs, user.cigsBaseline || 20, user.pricePerCig || 1000);
  }

  // Compute paid total
  const payments = await prisma.paymentLog.findMany({
    where: { userId: user.id, status: 'PAID' as any },
    select: { amountVnd: true },
  });
  const paidAmount = payments.reduce((sum, p) => sum + (p.amountVnd || 0), 0);

  const journal = await prisma.progressJournal.create({
    data: {
      userId: user.id,
      daysJourneyed: dayInJourney,
      cigsLogged,
      cigsSkipped,
      moneySaved,
      topTriggers: triggerCounts,
      emotionalArc: checkinHighlights.map(c => ({
        date: c.date.toISOString(),
        mood: c.mood,
        note: c.note,
      })),
      bodyMilestonesUnlocked: getUnlockedMilestones(user.qDayConfirmedAt).map(m => m.daysAfterQDay),
      paidAmount,
      exitReason: parsed.data.reason,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      exitedAt: new Date(),
      exitReason: parsed.data.reason,
    },
  });

  res.json({
    ok: true,
    journal,
    message: `Cảm ơn ${user.pronouns ?? 'bạn'} đã đi cùng Sol ${dayInJourney} ngày. Hồ sơ đã được lưu.`,
  });
});

// ─── POST /journey/resume — quay lại sau khi exit ─────────────────────────
journeyRouter.post('/resume', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  if (!user.exitedAt) return res.status(400).json({ error: 'not_exited' });

  await prisma.user.update({
    where: { id: user.id },
    data: { exitedAt: null, exitReason: null },
  });

  res.json({ ok: true, message: `Sol tiếp tục đồng hành với ${user.pronouns ?? 'bạn'}. Tất cả pattern, baseline, Đội Sol cũ — Sol vẫn nhớ.` });
});

// ─── GET /journey/journals — lịch sử các lần exit ─────────────────────────
journeyRouter.get('/journals', async (req: AuthedRequest, res) => {
  const journals = await prisma.progressJournal.findMany({
    where: { userId: req.userId! },
    orderBy: { exitedAt: 'desc' },
  });
  res.json({ journals });
});

// ─── GET /journey/money-breakdown — daily cigs + money cumulative chart ───
journeyRouter.get('/money-breakdown', async (req: AuthedRequest, res) => {
  try {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  const dayInJourney = computeDayInJourney(user.quitDate);
  if (!user.quitDate || dayInJourney <= 0) {
    return res.json({ days: [], baseline: user.cigsBaseline, pricePerCig: user.pricePerCig });
  }

  const dailyCigs = await getDailyCigsCount(user.id, user.quitDate, dayInJourney);
  const breakdown = computeDailyMoneySaved(dailyCigs, user.cigsBaseline || 20, user.pricePerCig || 1000);

  res.json({
    days: breakdown,
    baseline: user.cigsBaseline,
    pricePerCig: user.pricePerCig,
  });
  } catch (e: any) {
    console.error('[journey/money-breakdown] error:', e);
    return res.status(500).json({ error: 'money_breakdown_error', message: e?.message, code: e?.code });
  }
});
