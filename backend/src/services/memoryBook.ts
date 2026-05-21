// backend/src/services/memoryBook.ts
//
// Sổ Lưu Niệm Số — Sol v4 Phase 5 final feature.
//
// Khi user đạt mốc D30/D60/D90/D365, hệ thống tự tổng hợp hành trình thành
// 1 web album HTML mobile-responsive — link shareable lên Facebook/Zalo.
//
// Nội dung album:
//   1. Hero — tên user + Q-Day + số ngày không hút
//   2. Lý do bỏ thuốc (3-5 lý do user đã viết Day 0)
//   3. Thư cho tương lai (letterToSelf) — full text
//   4. Stats — tiền tiết kiệm, cigsSkipped, mood timeline
//   5. Lapse log (nếu có) — show "Khang đã đứng lên" thay vì che giấu
//   6. Khang voice đã listen
//   7. Khang chúc mừng + invitation thành mentor
//
// API:
//   GET  /api/memory-book/:userId          — render HTML album (public, có UUID)
//   POST /api/memory-book/:userId/generate — admin/cron trigger generate
//
// Cron tự generate D30/D60/D90/D365.

import { prisma } from '../db';
import { logger } from '../utils/logger';

export type MemoryBookMilestone = 30 | 60 | 90 | 180 | 365;

export interface MemoryBookData {
  user: {
    id: string;
    name: string | null;
    pronouns: string;
    qDayDate: Date | null;
    qDayConfirmedAt: Date | null;
    yearsSmoked: number | null;
    quitReasons: string[];
    topTriggers: string[];
  };
  milestone: MemoryBookMilestone;
  daysSmokeFreee: number;
  stats: {
    cigsSkipped: number;
    moneySaved: number;
    daysActive: number;
  };
  letterToSelf: string | null;
  checkins: Array<{ date: Date; mood: number; note?: string }>;
  lapses: Array<{ date: Date; count: number; context?: string; recoveredAt?: Date }>;
  khangVoices: Array<{ title: string; listenedAt: Date }>;
  generatedAt: Date;
  shareUrl: string;
}

const CIG_PRICE_VND = 26_000 / 20; // 1 bao 20 điếu = 26k

/** Generate data structure cho memory book của 1 user */
export async function generateMemoryBookData(
  userId: string,
  milestone: MemoryBookMilestone,
): Promise<MemoryBookData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      pronouns: true,
      qDayDate: true,
      qDayConfirmedAt: true,
      yearsSmoked: true,
      quitReasons: true,
      topTriggers: true,
      cigsBaseline: true,
    },
  });
  if (!user) throw new Error('user_not_found');

  const qDay = user.qDayConfirmedAt ?? user.qDayDate;
  if (!qDay) throw new Error('no_qday_set');

  const daysSinceQDay = Math.floor((Date.now() - qDay.getTime()) / 86400000);

  // Stats
  const [cigsSkipped, checkinCount] = await Promise.all([
    prisma.cigaretteLog.count({ where: { userId, skipped: true } }),
    prisma.checkIn.count({ where: { userId } }),
  ]);

  const moneySaved = Math.floor(daysSinceQDay * (user.cigsBaseline ?? 20) * CIG_PRICE_VND);

  // Letter to self (từ ProgressJournal mới nhất có letterToSelf)
  const journal = await prisma.progressJournal.findFirst({
    where: { userId, letterToSelf: { not: null } },
    orderBy: { exitedAt: 'asc' },
    select: { letterToSelf: true },
  });

  // CheckIn timeline (full)
  const checkinRows = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
    take: 400,
    select: { date: true, mood: true, note: true },
  });

  // Lapses (nếu có)
  const lapseRows = await prisma.lapseEvent.findMany({
    where: { userId },
    orderBy: { lapsedAt: 'asc' },
    take: 50,
    select: { lapsedAt: true, cigaretteCount: true, context: true, recoveredAt: true },
  });

  // Voice của Khang đã nghe
  const listens = await prisma.khangVoiceListen.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { voiceId: true, createdAt: true },
  });
  const voiceIds = Array.from(new Set(listens.map((l) => l.voiceId)));
  const voiceTitles = voiceIds.length
    ? await prisma.khangVoice.findMany({
        where: { id: { in: voiceIds } },
        select: { id: true, title: true },
      })
    : [];
  const voiceTitleMap = new Map(voiceTitles.map((v) => [v.id, v.title]));

  const shareSlug = Buffer.from(`${userId}-${milestone}`).toString('base64url').slice(0, 16);

  return {
    user: {
      id: user.id,
      name: user.name,
      pronouns: user.pronouns ?? 'anh',
      qDayDate: qDay,
      qDayConfirmedAt: user.qDayConfirmedAt,
      yearsSmoked: user.yearsSmoked,
      quitReasons: user.quitReasons,
      topTriggers: user.topTriggers,
    },
    milestone,
    daysSmokeFreee: daysSinceQDay,
    stats: {
      cigsSkipped,
      moneySaved,
      daysActive: checkinCount,
    },
    letterToSelf: journal?.letterToSelf ?? null,
    checkins: checkinRows.map((c) => ({ date: c.date, mood: c.mood ?? 0, note: c.note ?? undefined })),
    lapses: lapseRows.map((l) => ({
      date: l.lapsedAt,
      count: l.cigaretteCount ?? 1,
      context: l.context ?? undefined,
      recoveredAt: l.recoveredAt ?? undefined,
    })),
    khangVoices: listens.map((l) => ({
      title: voiceTitleMap.get(l.voiceId) ?? 'Voice của Khang',
      listenedAt: l.createdAt,
    })),
    generatedAt: new Date(),
    shareUrl: `https://bothuocla.sol.vn/memory-book/${shareSlug}`,
  };
}

/** Render HTML album mobile-responsive */
export function renderMemoryBookHtml(data: MemoryBookData): string {
  const moneyStr = data.stats.moneySaved.toLocaleString('vi-VN');
  const cigsStr = data.stats.cigsSkipped.toLocaleString('vi-VN');
  const qDayStr = data.user.qDayDate?.toLocaleDateString('vi-VN') ?? '—';
  const name = data.user.name ?? 'Bạn';

  // Mood timeline data for chart
  const moodPoints = data.checkins.map((c) => `${c.mood}`).join(',');

  // Quit reasons HTML
  const reasonsHtml = data.user.quitReasons.length === 0
    ? '<p style="color:#999;font-style:italic;">Chưa ghi nhận lý do</p>'
    : data.user.quitReasons.map((r, i) =>
      `<div class="reason-card"><span class="reason-num">${i + 1}</span><span class="reason-text">${escapeHtml(r)}</span></div>`,
    ).join('');

  // Lapse HTML
  const lapseHtml = data.lapses.length === 0
    ? `<p style="color:#16a34a;font-weight:600;">${data.daysSmokeFreee} ngày — KHÔNG VẤP. Tuyệt vời.</p>`
    : `<p>${data.user.pronouns} đã vấp ${data.lapses.length} lần — mỗi lần đều đứng lên ngay.</p>` +
      data.lapses.map((l) => {
        const dateStr = l.date.toLocaleDateString('vi-VN');
        const recovered = l.recoveredAt ? '✓ Đã phục hồi' : '⏳';
        return `<div class="lapse-card">📅 ${dateStr} — ${l.count} điếu ${l.context ? `(${escapeHtml(l.context)})` : ''} <span class="lapse-status">${recovered}</span></div>`;
      }).join('');

  // Letter HTML
  const letterHtml = data.letterToSelf
    ? `<div class="letter-box">${escapeHtml(data.letterToSelf).replace(/\n/g, '<br>')}</div>`
    : '<p style="color:#999;font-style:italic;">Chưa viết thư cho tương lai</p>';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sổ Lưu Niệm Số — ${data.milestone} ngày không hút | ${name}</title>
<meta property="og:title" content="${name} — ${data.daysSmokeFreee} ngày không hút thuốc">
<meta property="og:description" content="Tiết kiệm ${moneyStr} VND. ${cigsStr} điếu thuốc không hút. Sổ lưu niệm số từ Sol.">
<meta property="og:image" content="https://sol.vn/og-images/memory-book-${data.milestone}.png">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(180deg, #fff7ed 0%, #fafaf7 100%);
    color: #2d2820; line-height: 1.6;
  }
  .container { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
  .hero {
    background: linear-gradient(135deg, #b85c1c, #d97706);
    color: white; padding: 48px 24px; border-radius: 16px;
    text-align: center; margin-bottom: 32px;
    box-shadow: 0 8px 24px rgba(184,92,28,.25);
  }
  .hero-badge { font-size: 14px; opacity: .85; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
  .hero-days { font-size: 64px; font-weight: 900; line-height: 1; margin: 12px 0; }
  .hero-text { font-size: 18px; opacity: .95; }
  .hero-name { font-size: 24px; font-weight: 700; margin-top: 16px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
  .stat-card { background: white; padding: 20px; border-radius: 12px; border: 2px solid #fde68a; }
  .stat-value { font-size: 28px; font-weight: 800; color: #b85c1c; }
  .stat-label { font-size: 13px; color: #5d4f3a; margin-top: 4px; }
  section { background: white; padding: 24px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e5dfd0; }
  h2 { color: #b85c1c; font-size: 22px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .reason-card {
    display: flex; align-items: center; gap: 16px;
    padding: 12px 16px; background: #fef3c7; border-radius: 8px; margin: 8px 0;
  }
  .reason-num {
    background: #b85c1c; color: white; border-radius: 50%;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    font-weight: 700; flex-shrink: 0;
  }
  .reason-text { font-size: 16px; }
  .letter-box {
    background: #fffbeb; border-left: 4px solid #b85c1c;
    padding: 20px; font-style: italic; font-size: 15px;
    border-radius: 0 8px 8px 0;
  }
  .lapse-card {
    padding: 10px 14px; background: #fef2f2; border-radius: 6px;
    margin: 6px 0; font-size: 14px; display: flex; justify-content: space-between;
  }
  .lapse-status { font-size: 12px; color: #16a34a; font-weight: 600; }
  .voice-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .voice-chip {
    background: #f5f0e3; padding: 6px 12px; border-radius: 16px;
    font-size: 13px; color: #5d4f3a;
  }
  .khang-message {
    background: linear-gradient(135deg, #fef3c7, #fed7aa);
    padding: 24px; border-radius: 12px; margin: 24px 0;
    border-left: 4px solid #b85c1c;
  }
  .khang-message p { margin: 8px 0; }
  .share-bar {
    display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
    margin: 32px 0; padding: 20px;
    background: white; border-radius: 12px;
  }
  .share-btn {
    padding: 12px 20px; border-radius: 8px; background: #b85c1c;
    color: white; text-decoration: none; font-weight: 600; font-size: 14px;
  }
  .share-btn.secondary { background: #5d4f3a; }
  .footer { text-align: center; padding: 32px 16px; color: #8b8580; font-size: 12px; }
  .footer a { color: #b85c1c; }
  @media (max-width: 480px) {
    .hero-days { font-size: 48px; }
    .stat-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">

  <div class="hero">
    <div class="hero-badge">🌅 SỔ LƯU NIỆM SỐ — Mốc ${data.milestone} ngày</div>
    <div class="hero-days">${data.daysSmokeFreee}</div>
    <div class="hero-text">ngày không hút thuốc</div>
    <div class="hero-name">${escapeHtml(name)}</div>
    <div style="font-size:13px;opacity:.85;margin-top:8px;">Q-Day: ${qDayStr}</div>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-value">${moneyStr}</div>
      <div class="stat-label">VND đã tiết kiệm</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${cigsStr}</div>
      <div class="stat-label">điếu thuốc KHÔNG hút</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.stats.daysActive}</div>
      <div class="stat-label">lần check-in</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.user.yearsSmoked ?? '—'}</div>
      <div class="stat-label">năm đã hút trước cai</div>
    </div>
  </div>

  <section>
    <h2>🎯 ${data.user.pronouns === 'anh' ? 'Anh' : data.user.pronouns === 'chị' ? 'Chị' : 'Bạn'} cai vì những lý do này</h2>
    ${reasonsHtml}
  </section>

  <section>
    <h2>📜 Thư cho tương lai — viết Day 0</h2>
    ${letterHtml}
  </section>

  <section>
    <h2>📈 Hành trình chăm sóc bản thân</h2>
    <p style="color:#5d4f3a;margin-bottom:12px;">
      ${data.stats.daysActive} lần check-in trong ${data.daysSmokeFreee} ngày.
      Trung bình mood: <strong>${avgMood(data.checkins).toFixed(1)}/10</strong>.
    </p>
    <p style="font-size:13px;color:#8b8580;font-style:italic;">
      Mỗi check-in là 1 lần ${data.user.pronouns} chọn mình thay vì điếu thuốc.
    </p>
  </section>

  <section>
    <h2>🌪 Lapse log — đứng lên thay vì giấu</h2>
    ${lapseHtml}
  </section>

  ${data.khangVoices.length > 0 ? `
  <section>
    <h2>🎙 Khang voice ${data.user.pronouns} đã nghe</h2>
    <div class="voice-list">
      ${data.khangVoices.map((v) => `<span class="voice-chip">🔊 ${escapeHtml(v.title)}</span>`).join('')}
    </div>
  </section>
  ` : ''}

  <div class="khang-message">
    <p style="font-size:18px;font-weight:700;color:#b85c1c;">— Khang gửi ${data.user.pronouns} —</p>
    <p>"${data.daysSmokeFreee} ngày trước, ${data.user.pronouns} là người đang hút.</p>
    <p>Hôm nay, ${data.user.pronouns} là người KHÔNG hút.</p>
    <p>Đó không phải may mắn — đó là quyết định mỗi ngày của ${data.user.pronouns}."</p>
    ${data.milestone === 30 ? `
      <p style="margin-top:16px;font-size:14px;">
        Khang muốn ${data.user.pronouns} biết: tới mốc 3 tháng (D90), Sol sẽ tổng hợp tiếp.
        Cứ tiếp tục đi.
      </p>
    ` : ''}
    ${data.milestone === 365 ? `
      <p style="margin-top:16px;font-size:14px;font-weight:600;">
        ${data.user.pronouns} đã hoàn thành 1 năm — Sol mời ${data.user.pronouns} làm <strong>mentor</strong>
        cho user mới. ${data.user.pronouns} có kinh nghiệm thật — chia sẻ giúp Sol.
      </p>
    ` : ''}
  </div>

  <div class="share-bar">
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.shareUrl)}"
       class="share-btn" target="_blank">📘 Share Facebook</a>
    <a href="https://zalo.me/share/?url=${encodeURIComponent(data.shareUrl)}"
       class="share-btn secondary" target="_blank">💬 Share Zalo</a>
    <a href="https://bothuocla.sol.vn" class="share-btn secondary">🏠 Về Sol</a>
  </div>

  <div class="footer">
    <p>Sổ Lưu Niệm Số được Sol tạo tự động lúc ${data.generatedAt.toLocaleString('vi-VN')}</p>
    <p style="margin-top:8px;">
      Powered by <a href="https://sol.vn">Đi Cùng Sol</a> · Phương pháp cai thuốc lá khoa học
    </p>
  </div>
</div>
</body>
</html>`;
}

function avgMood(checkins: Array<{ mood: number }>): number {
  if (checkins.length === 0) return 0;
  return checkins.reduce((s, c) => s + c.mood, 0) / checkins.length;
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c),
  );
}

/** Cron: generate cho tất cả user đạt mốc D30/60/90/180/365 hôm nay */
export async function generateMilestoneMemoryBooks(): Promise<{
  generated: number;
  milestone: Record<MemoryBookMilestone, number>;
}> {
  const milestones: MemoryBookMilestone[] = [30, 60, 90, 180, 365];
  const result = { generated: 0, milestone: { 30: 0, 60: 0, 90: 0, 180: 0, 365: 0 } as any };

  for (const m of milestones) {
    // Tìm user có currentJourneyDay === milestone
    const users = await prisma.user.findMany({
      where: {
        journeyStatus: 'active',
        currentJourneyDay: m,
        qDayConfirmedAt: { not: null },
      },
      select: { id: true, name: true, email: true },
    });

    for (const u of users) {
      try {
        await generateMemoryBookData(u.id, m);
        // TODO Sprint 5: send email + Zalo push với link share URL
        logger.info({ userId: u.id, milestone: m }, 'Generated memory book');
        result.generated++;
        result.milestone[m]++;
      } catch (e: any) {
        logger.warn({ err: e, userId: u.id, milestone: m }, 'Memory book generate failed');
      }
    }
  }

  return result;
}
