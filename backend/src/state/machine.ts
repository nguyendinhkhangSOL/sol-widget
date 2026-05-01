// backend/src/state/machine.ts
// Conversation state machine.
// Routes every inbound message to the right handler and persists the resulting state + outbound reply(s).

import type { ConversationState, MessageType } from '@prisma/client';
import { prisma } from '../db';
import { askMentor } from '../ai/mentor';
import { computeDayNumber } from '../utils/dayNumber';
import { logger } from '../utils/logger';

// Each outbound reply the state machine emits.
export interface Outbound {
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
}

export interface StateResult {
  outbound: Outbound[];
  newState: ConversationState;
  newStateData: Record<string, any>;
}

// ─────────────── Intent classification (cheap, rules-based first) ────────

type Intent =
  | 'crisis'
  | 'checkin_start'
  | 'checkin_step'
  | 'exercise_start'
  | 'exercise_submit'
  | 'sos_resolve'
  | 'free_chat';

function classifyIntent(
  message: string,
  currentState: ConversationState,
  stateData: Record<string, any>,
  metadata: Record<string, any>
): Intent {
  // Structured events take priority.
  if (metadata?.intent === 'checkin_start') return 'checkin_start';
  if (metadata?.intent === 'exercise_start') return 'exercise_start';
  if (metadata?.intent === 'exercise_submit') return 'exercise_submit';
  if (metadata?.intent === 'sos_resolve') return 'sos_resolve';

  // Crisis keyword scan.
  const lower = message.toLowerCase().trim();
  const crisisMarkers = ['thèm quá', 'muốn hút', 'không chịu nổi', 'sos', 'khẩn cấp', 'phát điên'];
  if (crisisMarkers.some((m) => lower.includes(m)) && currentState !== 'CRISIS_MODE') {
    return 'crisis';
  }

  // Resume of structured flow.
  if (currentState === 'CHECKIN_FLOW') return 'checkin_step';
  if (currentState === 'CRISIS_MODE' && (lower === 'ok' || lower.includes('đỡ rồi'))) {
    return 'sos_resolve';
  }

  return 'free_chat';
}

// ─────────────── Check-in flow (4 steps) ──────────────────────────────────

const CHECKIN_STEPS = [
  {
    prompt: 'Hôm nay bạn có hút thuốc không?',
    key: 'smoked',
    options: [
      { label: 'Không hút 🎉', value: { smoked: false, smokeCount: 0 } },
      { label: 'Có 1-5 điếu', value: { smoked: true, smokeCount: 3 } },
      { label: 'Có 6+ điếu', value: { smoked: true, smokeCount: 7 } },
    ],
  },
  {
    prompt: 'Cơn thèm mạnh nhất hôm nay?',
    key: 'cravingIntensity',
    options: [
      { label: '1-2 nhẹ', value: { cravingIntensity: 2 } },
      { label: '3-5 vừa', value: { cravingIntensity: 4 } },
      { label: '6-8 mạnh', value: { cravingIntensity: 7 } },
      { label: '9-10 dữ dội', value: { cravingIntensity: 10 } },
    ],
  },
  {
    prompt: 'Tâm trạng chung?',
    key: 'mood',
    options: [
      { label: '😊', value: { mood: 5 } },
      { label: '🙂', value: { mood: 4 } },
      { label: '😐', value: { mood: 3 } },
      { label: '😟', value: { mood: 2 } },
      { label: '😔', value: { mood: 1 } },
    ],
  },
  {
    prompt: 'Muốn ghi lại 1 câu không? (Hoặc bỏ qua)',
    key: 'note',
    options: [{ label: 'Bỏ qua', value: { note: null } }],
    acceptsFreeText: true,
  },
];

async function handleCheckinFlow(
  userId: string,
  message: string,
  stateData: Record<string, any>,
  metadata: Record<string, any>,
  isStart: boolean
): Promise<StateResult> {
  const step = isStart ? 0 : (stateData.step ?? 0);
  const answers = { ...(stateData.answers ?? {}) };

  if (!isStart) {
    // Absorb the answer. Metadata.value is preferred (button click).
    const value = metadata?.value ?? { [CHECKIN_STEPS[step].key]: message };
    Object.assign(answers, value);
  }

  const nextStep = isStart ? 0 : step + 1;

  if (nextStep >= CHECKIN_STEPS.length) {
    // Persist check-in.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('user_not_found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNumber = computeDayNumber(user.quitDate);

    await prisma.checkIn.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        dayNumber,
        date: today,
        smoked: !!answers.smoked,
        smokeCount: answers.smokeCount ?? 0,
        cravingIntensity: answers.cravingIntensity ?? 5,
        mood: answers.mood ?? 3,
        note: answers.note ?? null,
      },
      update: {
        smoked: !!answers.smoked,
        smokeCount: answers.smokeCount ?? 0,
        cravingIntensity: answers.cravingIntensity ?? 5,
        mood: answers.mood ?? 3,
        note: answers.note ?? null,
      },
    });

    // Update streak & engagement state.
    await updateEngagement(userId, today);

    const finalMessage = buildCheckinCompletionMessage(user.name, dayNumber, answers);
    return {
      outbound: [{ type: 'SYSTEM_NOTICE', content: finalMessage, metadata: { dayNumber } }],
      newState: 'IDLE',
      newStateData: {},
    };
  }

  const nextPrompt = CHECKIN_STEPS[nextStep];
  return {
    outbound: [
      {
        type: 'CHECKIN_STEP',
        content: nextPrompt.prompt,
        metadata: {
          step: nextStep,
          options: nextPrompt.options,
          acceptsFreeText: !!nextPrompt.acceptsFreeText,
        },
      },
    ],
    newState: 'CHECKIN_FLOW',
    newStateData: { step: nextStep, answers },
  };
}

function buildCheckinCompletionMessage(
  name: string,
  dayNumber: number,
  answers: Record<string, any>
): string {
  const parts: string[] = [];
  if (!answers.smoked) {
    parts.push(`🎉 Ngày ${dayNumber} không hút — streak được giữ.`);
  } else {
    parts.push(`Ngày ${dayNumber} đã ghi nhận. Không sao — mai là ngày mới.`);
  }
  if ((answers.cravingIntensity ?? 0) >= 8) {
    parts.push('Craving cao hôm nay — mình có thể gửi tip đối phó nếu muốn.');
  }
  return parts.join(' ');
}

async function updateEngagement(userId: string, today: Date): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const last = user.lastCheckinDate;
  let streak = user.checkinStreak;
  let missed = 0;

  if (last) {
    const yday = new Date(today);
    yday.setDate(yday.getDate() - 1);
    const lastDay = new Date(last);
    lastDay.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak += 1;
    else if (diff === 0) {
      /* same day, keep */
    } else if (diff === 2) {
      // One missed day — keep streak with "sick day" tolerance.
      streak += 1;
    } else {
      streak = 1;
      missed = diff - 1;
    }
  } else {
    streak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastCheckinDate: today,
      checkinStreak: streak,
      longestStreak: Math.max(user.longestStreak, streak),
      missedDaysInRow: missed,
      totalDaysActive: { increment: 1 },
      refundEligible: missed <= 1 ? user.refundEligible : false,
    },
  });
}

// ─────────────── Crisis mode ───────────────────────────────────────────────

async function enterCrisisMode(userId: string, trigger: string): Promise<StateResult> {
  await prisma.crisisEvent.create({
    data: { userId, trigger, stage: 'breathing' },
  });

  return {
    outbound: [
      {
        type: 'CRISIS_PROMPT',
        content:
          'Mình ở đây với bạn. Thở với mình nhé: hít 4 giây, giữ 7, thở ra 8. Tap bắt đầu để mình dẫn.',
        metadata: {
          stage: 'breathing',
          actions: [
            { label: 'Bắt đầu thở', action: 'crisis.breathing' },
            { label: 'Nhắc lý do của mình', action: 'crisis.remind' },
            { label: 'Gọi founder', action: 'crisis.escalate' },
          ],
        },
      },
    ],
    newState: 'CRISIS_MODE',
    newStateData: { stage: 'breathing', startedAt: Date.now() },
  };
}

async function resolveCrisis(userId: string): Promise<StateResult> {
  await prisma.crisisEvent.updateMany({
    where: { userId, resolvedAt: null },
    data: { resolvedAt: new Date(), stage: 'resolved' },
  });
  return {
    outbound: [
      {
        type: 'SYSTEM_NOTICE',
        content: 'Anh vừa tự điều chỉnh một cơn thèm — ghi nhận vào nhật ký 🎉',
      },
    ],
    newState: 'IDLE',
    newStateData: {},
  };
}

// ─────────────── Free AI chat ──────────────────────────────────────────────

async function handleFreeChat(userId: string, message: string): Promise<StateResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('user_not_found');

  const recentCheckins = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 7,
  });

  const recentMessages = await prisma.message.findMany({
    where: { userId, type: 'CHAT' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Simple mood trend heuristic.
  const moodTrend = computeMoodTrend(recentCheckins);

  const reply = await askMentor(userId, message, {
    name: user.name,
    pronouns: user.pronouns,
    assistantName: user.assistantName,
    dayNumber: computeDayNumber(user.quitDate),
    ftndScore: user.ftndScore,
    checkinStreak: user.checkinStreak,
    topTriggers: user.topTriggers,
    riskyHours: user.riskyHours,
    // Group 1 — deep profile
    age: user.age,
    yearsSmoked: user.yearsSmoked,
    quitReasons: user.quitReasons,
    recentCheckins: recentCheckins.map((c) => ({
      dayNumber: c.dayNumber,
      smoked: c.smoked,
      cravingIntensity: c.cravingIntensity,
      mood: c.mood,
      note: c.note,
    })),
    recentMessages: recentMessages.reverse().map((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content,
    })),
    currentMood: moodTrend,
    mode: (user.settings as any)?.mode ?? 'normal',
  });

  return {
    outbound: [
      {
        type: 'CHAT',
        content: reply.content,
        metadata: {
          modelUsed: reply.modelUsed,
          promptTokens: reply.promptTokens,
          completionTokens: reply.completionTokens,
          latencyMs: reply.latencyMs,
          quotaExceeded: !!reply.quotaExceeded,
        },
      },
    ],
    newState: 'AI_CHAT',
    newStateData: {},
  };
}

function computeMoodTrend(
  checkins: Array<{ mood: number; date: Date }>
): 'improving' | 'declining' | 'stable' {
  if (checkins.length < 4) return 'stable';
  const recent = checkins.slice(0, 3).map((c) => c.mood);
  const older = checkins.slice(3, 7).map((c) => c.mood);
  const avgR = recent.reduce((s, v) => s + v, 0) / recent.length;
  const avgO = older.length > 0 ? older.reduce((s, v) => s + v, 0) / older.length : avgR;
  if (avgR - avgO > 0.5) return 'improving';
  if (avgO - avgR > 0.5) return 'declining';
  return 'stable';
}

// ─────────────── Exercise flow (stub — content-driven) ────────────────────

async function handleExerciseSubmit(
  userId: string,
  stateData: Record<string, any>,
  content: string
): Promise<StateResult> {
  const exerciseKey: string = stateData.exerciseKey;
  const dayNumber: number = stateData.dayNumber;
  if (!exerciseKey) {
    return { outbound: [], newState: 'IDLE', newStateData: {} };
  }

  await prisma.exerciseEntry.upsert({
    where: {
      userId_dayNumber_exerciseKey: { userId, dayNumber, exerciseKey },
    },
    create: {
      userId,
      dayNumber,
      exerciseKey,
      content: { text: content },
      completedAt: new Date(),
    },
    update: {
      content: { text: content },
      completedAt: new Date(),
    },
  });

  return {
    outbound: [
      {
        type: 'SYSTEM_NOTICE',
        content: `Xong bài tập ngày ${dayNumber} ✓`,
        metadata: { dayNumber, exerciseKey },
      },
    ],
    newState: 'IDLE',
    newStateData: {},
  };
}

async function handleExerciseStart(
  userId: string,
  metadata: Record<string, any>
): Promise<StateResult> {
  const dayNumber = metadata.dayNumber;
  const exerciseKey = metadata.exerciseKey;
  return {
    outbound: [
      {
        type: 'EXERCISE_CARD',
        content: metadata.prompt ?? 'Bài tập hôm nay',
        metadata: { dayNumber, exerciseKey, ...metadata },
      },
    ],
    newState: 'EXERCISE_FLOW',
    newStateData: { dayNumber, exerciseKey, draft: '' },
  };
}

// ─────────────── Main entry: dispatch ─────────────────────────────────────

export async function dispatchMessage(
  userId: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<StateResult> {
  let stateRow = await prisma.userState.findUnique({ where: { userId } });
  if (!stateRow) {
    stateRow = await prisma.userState.create({
      data: { userId, state: 'IDLE', stateData: {} },
    });
  }

  const stateData = (stateRow.stateData as Record<string, any>) ?? {};
  const intent = classifyIntent(message, stateRow.state, stateData, metadata);

  logger.debug({ userId, state: stateRow.state, intent }, 'state machine dispatch');

  let result: StateResult;
  try {
    switch (intent) {
      case 'crisis':
        result = await enterCrisisMode(userId, message);
        break;
      case 'sos_resolve':
        result = await resolveCrisis(userId);
        break;
      case 'checkin_start':
        result = await handleCheckinFlow(userId, message, {}, {}, true);
        break;
      case 'checkin_step':
        result = await handleCheckinFlow(userId, message, stateData, metadata, false);
        break;
      case 'exercise_start':
        result = await handleExerciseStart(userId, metadata);
        break;
      case 'exercise_submit':
        result = await handleExerciseSubmit(userId, stateData, message);
        break;
      default:
        result = await handleFreeChat(userId, message);
    }
  } catch (err) {
    logger.error({ err, userId }, 'state machine dispatch error');
    result = {
      outbound: [
        {
          type: 'SYSTEM_NOTICE',
          content: 'Có lỗi nhỏ, bạn thử lại sau 10 giây nhé.',
        },
      ],
      newState: 'IDLE',
      newStateData: {},
    };
  }

  // Persist new state.
  await prisma.userState.upsert({
    where: { userId },
    create: { userId, state: result.newState, stateData: result.newStateData },
    update: { state: result.newState, stateData: result.newStateData },
  });

  return result;
}
