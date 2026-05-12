/**
 * ANONYMOUS STATS FEED — "Tuần này trong Sol"
 * ────────────────────────────────────────────
 * Channel #4 — aggregated stats để user cảm "không phải mình".
 * KHÔNG ai lộ mặt. Chỉ số tổng.
 *
 * Endpoints:
 *   GET /stats/feed              — anonymous stats cached
 *   GET /stats/quick-win-day3/:userId — báo cáo Day 3 cá nhân
 *   GET /stats/control-score     — Control Score user hiện tại
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware, type AuthedRequest } from '../auth/middleware';

const router = Router();

// ─── Anonymous Stats Feed (this week) ──────────────────────────────────
router.get('/feed', authMiddleware, async (req: AuthedRequest, res) => {
  // Try cached first
  let cache = await prisma.anonymousStatsCache.findUnique({
    where: { period: 'this_week' },
  });

  // If cache stale (>1h) or missing — compute fresh
  const cacheAge = cache ? Date.now() - cache.computedAt.getTime() : Infinity;
  if (cacheAge > 60 * 60 * 1000) {
    cache = await computeWeeklyStats();
  }

  res.json({
    period: 'this_week',
    stats: {
      totalActiveUsers: cache?.totalActiveUsers || 0,
      lateNightOpens: cache?.lateNightOpens || 0,
      lapseLogs: cache?.lapseLogs || 0,
      recoveryWithin24h: cache?.recoveryWithin24h || 0,
      delayOver10min: cache?.delayOver10min || 0,
      voiceListens: cache?.voiceListens || 0,
      topVoiceListenCount: cache?.topVoiceListenCount || 0,
      qDaysSet: cache?.qDaysSet || 0,
      thirtyDayCleanCount: cache?.thirtyDayCleanCount || 0,
    },
    computedAt: cache?.computedAt,
  });
});

async function computeWeeklyStats() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeUsers,
    lateNightCheckIns,
    lapseLogs,
    recoveredLapses,
    longDelays,
    voiceListens,
    topVoice,
    qDaysSet,
  ] = await Promise.all([
    prisma.user.count({
      where: { updatedAt: { gte: oneWeekAgo } },
    }),
    // Late night = check-ins giờ 22-2
    prisma.checkIn.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
    prisma.lapseEvent.count({
      where: { lapsedAt: { gte: oneWeekAgo } },
    }),
    prisma.lapseEvent.count({
      where: {
        lapsedAt: { gte: oneWeekAgo },
        recoveredAt: { not: null },
      },
    }),
    prisma.crisisTimerLog.count({
      where: {
        startedAt: { gte: oneWeekAgo },
        delayDurationSec: { gte: 600 }, // >= 10 phút
      },
    }),
    prisma.khangVoiceListen.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
    prisma.khangVoiceListen.groupBy({
      by: ['voiceId'],
      where: { createdAt: { gte: oneWeekAgo } },
      _count: { voiceId: true },
      orderBy: { _count: { voiceId: 'desc' } },
      take: 1,
    }),
    prisma.user.count({
      where: {
        quitDate: {
          not: null,
          gte: oneWeekAgo,
        },
      },
    }),
  ]);

  const cache = await prisma.anonymousStatsCache.upsert({
    where: { period: 'this_week' },
    create: {
      period: 'this_week',
      totalActiveUsers: activeUsers,
      lateNightOpens: lateNightCheckIns,
      lapseLogs: lapseLogs,
      recoveryWithin24h: recoveredLapses,
      delayOver10min: longDelays,
      voiceListens: voiceListens,
      topVoiceId: topVoice[0]?.voiceId,
      topVoiceListenCount: topVoice[0]?._count.voiceId || 0,
      qDaysSet: qDaysSet,
      computedAt: new Date(),
    },
    update: {
      totalActiveUsers: activeUsers,
      lateNightOpens: lateNightCheckIns,
      lapseLogs: lapseLogs,
      recoveryWithin24h: recoveredLapses,
      delayOver10min: longDelays,
      voiceListens: voiceListens,
      topVoiceId: topVoice[0]?.voiceId,
      topVoiceListenCount: topVoice[0]?._count.voiceId || 0,
      qDaysSet: qDaysSet,
      computedAt: new Date(),
    },
  });

  return cache;
}

// ─── Quick Win Day 3 báo cáo cá nhân ────────────────────────────────────
router.get('/quick-win-day3', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userJoinedAt = user.createdAt;
  const daysSinceJoin = Math.floor((Date.now() - userJoinedAt.getTime()) / (24 * 60 * 60 * 1000));

  if (daysSinceJoin < 3) {
    return res.status(400).json({
      error: 'Báo cáo sẵn vào Day 3',
      readyAt: new Date(userJoinedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
    });
  }

  // Compute stats from CigaretteLog (3 ngày đầu)
  const threeDaysAgo = new Date(userJoinedAt.getTime());
  const threeDaysLater = new Date(userJoinedAt.getTime() + 3 * 24 * 60 * 60 * 1000);

  const cigLogs = await prisma.cigaretteLog.findMany({
    where: {
      userId,
      smokedAt: { gte: threeDaysAgo, lte: threeDaysLater },
    },
    select: { smokedAt: true, trigger: true },
  });

  // Average per day
  const totalCigs = cigLogs.length;
  const avgPerDay = Math.round(totalCigs / 3);

  // Top triggers
  const triggerCounts: Record<string, number> = {};
  cigLogs.forEach((l) => {
    const t = l.trigger || 'unknown';
    triggerCounts[t] = (triggerCounts[t] || 0) + 1;
  });
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger, count]) => ({
      trigger,
      count,
      pct: Math.round((count / totalCigs) * 100),
    }));

  // Most vulnerable hour
  const hourCounts: Record<number, number> = {};
  cigLogs.forEach((l) => {
    const hour = l.smokedAt.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const vulnerableHour = topHour ? parseInt(topHour[0]) : null;

  res.json({
    daysSinceJoin: 3,
    avgPerDay,
    totalLogged: totalCigs,
    topTriggers,
    vulnerableHour,
    vulnerableHourRange: vulnerableHour
      ? `${vulnerableHour}h-${vulnerableHour + 1}h`
      : null,
    message: `Lần đầu sau 30 năm anh nhìn rõ chính mình.`,
  });
});

// ─── Day 7 full report — Sol Khám Phá hoàn thành ────────────────────────
router.get('/day7-report', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userJoinedAt = user.createdAt;
  const daysSinceJoin = Math.floor(
    (Date.now() - userJoinedAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysSinceJoin < 7) {
    return res.status(400).json({
      error: 'Báo cáo sẵn vào Day 7',
      readyAt: new Date(userJoinedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      daysSinceJoin,
    });
  }

  const sevenDaysAgo = new Date(userJoinedAt.getTime());
  const sevenDaysLater = new Date(userJoinedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const cigLogs = await prisma.cigaretteLog.findMany({
    where: {
      userId,
      smokedAt: { gte: sevenDaysAgo, lte: sevenDaysLater },
    },
    select: { smokedAt: true, trigger: true },
  });

  const total = cigLogs.length;
  const avgPerDay = Math.round(total / 7);

  // Top 5 triggers
  const triggerCounts: Record<string, number> = {};
  cigLogs.forEach((l) => {
    const t = l.trigger || 'unknown';
    triggerCounts[t] = (triggerCounts[t] || 0) + 1;
  });
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trigger, count]) => ({
      trigger,
      count,
      pct: Math.round((count / total) * 100),
    }));

  // 3 vulnerable hours
  const hourCounts: Record<number, number> = {};
  cigLogs.forEach((l) => {
    const h = l.smokedAt.getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const topHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));

  // Wiki articles read (proxy: settings.workbookReadCount?)
  const wikiRead = 0; // TODO: track properly

  res.json({
    daysSinceJoin: 7,
    avgPerDay,
    totalLogged: total,
    topTriggers,
    topHours,
    wikiRead,
    voiceListened: 0, // TODO: query KhangVoiceListen
    message: `7 ngày anh đã thấy mình rồi. Tao thấy.`,
    nextStep: {
      title: 'Đi tiếp với Sol Start?',
      description: '14 ngày bẻ phản xạ tự động. 99k = 4 bao thuốc.',
      ctaUrl: '/pricing',
    },
  });
});

// ─── Day 14 full report — Sol Start hoàn thành ──────────────────────────
router.get('/day14-report', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Cần Sol Start tier (KHOI_DONG) hoặc cao hơn
  if (user.tier === 'FREE') {
    return res.status(403).json({
      error: 'Báo cáo Day 14 chỉ cho Sol Start trở lên',
    });
  }

  const tierStart = user.tierStartedAt ?? user.createdAt;
  const daysSinceTier = Math.floor(
    (Date.now() - tierStart.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysSinceTier < 14) {
    return res.status(400).json({
      error: 'Báo cáo Day 14 sẵn sau 14 ngày Sol Start',
      readyAt: new Date(tierStart.getTime() + 14 * 24 * 60 * 60 * 1000),
      daysSinceTier,
    });
  }

  // Compute từ 14 ngày Sol Start
  const fourteenDaysAgo = new Date(tierStart.getTime());
  const fourteenDaysLater = new Date(tierStart.getTime() + 14 * 24 * 60 * 60 * 1000);

  const cigLogs = await prisma.cigaretteLog.findMany({
    where: { userId, smokedAt: { gte: fourteenDaysAgo, lte: fourteenDaysLater } },
    select: { smokedAt: true },
  });

  // Compute baseline (3 ngày đầu từ user.createdAt)
  const baselineEnd = new Date(user.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
  const baselineLogs = await prisma.cigaretteLog.findMany({
    where: { userId, smokedAt: { gte: user.createdAt, lte: baselineEnd } },
  });
  const baselineAvg = Math.round(baselineLogs.length / 3);

  // Average past 7 days (week 2 Sol Start)
  const week2Start = new Date(tierStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const week2End = new Date(tierStart.getTime() + 14 * 24 * 60 * 60 * 1000);
  const week2Logs = await prisma.cigaretteLog.findMany({
    where: { userId, smokedAt: { gte: week2Start, lte: week2End } },
  });
  const currentAvg = Math.round(week2Logs.length / 7);

  const reductionPct =
    baselineAvg > 0 ? Math.round(((baselineAvg - currentAvg) / baselineAvg) * 100) : 0;

  // Crisis Timer stats
  const crisisLogs = await prisma.crisisTimerLog.findMany({
    where: { userId, outcome: 'delayed_no_smoke' },
    select: { delayDurationSec: true },
  });
  const avgDelaySec =
    crisisLogs.length > 0
      ? Math.round(
          crisisLogs.reduce((a, b) => a + (b.delayDurationSec ?? 0), 0) /
            crisisLogs.length,
        )
      : 0;

  // Habits broken (proxy: users that reduced trigger 50%+)
  const habitsBroken = 0; // TODO: compute properly

  // 1 ngày <50% baseline?
  const dailyBuckets: Record<string, number> = {};
  cigLogs.forEach((l) => {
    const day = l.smokedAt.toISOString().split('T')[0];
    dailyBuckets[day] = (dailyBuckets[day] || 0) + 1;
  });
  const halfBaseline = baselineAvg / 2;
  const lightDays = Object.values(dailyBuckets).filter((c) => c < halfBaseline).length;

  res.json({
    daysSinceTier: 14,
    baselineAvgPerDay: baselineAvg,
    currentAvgPerDay: currentAvg,
    reductionPct,
    avgDelaySec,
    crisisAttempts: crisisLogs.length,
    habitsBroken,
    lightDays,
    message: `14 ngày anh đã giảm ${reductionPct}%. Đáng tin.`,
    nextStep: {
      title: 'Sol Control 99k/tháng — đồng hành dài',
      description: 'Q-Day flexible + 30 ngày sạch + lapse-recovery. Hủy bất kỳ lúc nào.',
      ctaUrl: '/pricing',
    },
  });
});

// ─── Control Score (3 component v1) ─────────────────────────────────────
router.get('/control-score', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  // Component A — Hiểu mình (0-33): % ngày anh log + biết trigger top + đọc wiki
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const logDays = await prisma.cigaretteLog.findMany({
    where: { userId, smokedAt: { gte: last30Days } },
    distinct: ['smokedAt'],
    select: { smokedAt: true },
  });
  const distinctLogDays = new Set(
    logDays.map((l) => l.smokedAt.toISOString().split('T')[0])
  ).size;
  const logDaysScore = Math.min(distinctLogDays * (33 / 30), 33);

  // Component B — Trì hoãn (0-33): mỗi delay >5 phút = điểm
  const successfulTimers = await prisma.crisisTimerLog.count({
    where: {
      userId,
      outcome: 'delayed_no_smoke',
      delayDurationSec: { gte: 300 },
    },
  });
  const delayScore = Math.min(successfulTimers * 3, 33);

  // Component C — Quay lại (0-33): lapse → quay log <24h = điểm
  const lapses = await prisma.lapseEvent.findMany({
    where: { userId, recoveredAt: { not: null } },
    select: { lapsedAt: true, recoveredAt: true },
  });
  const fastRecoveries = lapses.filter((l) => {
    if (!l.recoveredAt) return false;
    const hours = (l.recoveredAt.getTime() - l.lapsedAt.getTime()) / (60 * 60 * 1000);
    return hours <= 24;
  }).length;
  const recoveryScore = Math.min(fastRecoveries * 5, 33);

  const totalScore = Math.round(logDaysScore + delayScore + recoveryScore);

  // Threshold
  let level = 'Chưa nhận ra';
  if (totalScore >= 80) level = 'Tự do';
  else if (totalScore >= 60) level = 'Làm chủ rõ';
  else if (totalScore >= 40) level = 'Đang làm chủ';
  else if (totalScore >= 20) level = 'Đang nhận ra';

  res.json({
    totalScore,
    level,
    components: {
      hieuMinh: Math.round(logDaysScore),
      triHoan: Math.round(delayScore),
      quayLai: Math.round(recoveryScore),
    },
  });
});

export default router;
