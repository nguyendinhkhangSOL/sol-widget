import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';
import { loadEnabledChips } from '@/lib/chips/loader';
import { matchUserMessage } from '@/lib/chips/intent';
import { rankChips } from '@/lib/chips/ranking';
import { askMentor } from '@/lib/ai/mentor';
import type { MentorContext } from '@/lib/ai/prompts';

const MAX_MESSAGE_LEN = 4000;
const RECENT_MESSAGES_LIMIT = 50;

// ============================================================
// GET — fetch messages + suggested chips
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const sessionId = getOrCreateSessionId(request);

    const thread = await queryOne<{ id: number; member_id: number | null }>(
      `SELECT id, member_id FROM chat_threads WHERE session_id = $1 ORDER BY id DESC LIMIT 1`,
      [sessionId]
    );

    let messages: any[] = [];
    if (thread) {
      messages = await query(
        `SELECT id, sender_type, sender_name, content, content_type, created_at
         FROM chat_messages
         WHERE thread_id = $1 AND is_deleted = FALSE
         ORDER BY created_at ASC
         LIMIT $2`,
        [thread.id, RECENT_MESSAGES_LIMIT]
      );
    }

    // Load top chips for suggestions (use ranking)
    const chips = await loadEnabledChips();
    const memberProfile = thread?.member_id ? await getMemberProfile(thread.member_id) : null;
    const daysSober = memberProfile?.days_sober ?? 0;
    const currentHour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).getHours();

    const suggestedChips = rankChips(chips, { daysSober, currentHour, mode: 'cap1_per_category' }, 6);

    const res = NextResponse.json({
      thread_id: thread?.id ?? null,
      messages,
      suggested_chips: suggestedChips.map((c) => ({
        id: c.id,
        icon: c.icon,
        label: c.label,
        category: c.category
      }))
    });
    ensureSessionCookie(res, request, sessionId);
    return res;
  } catch (err: any) {
    console.error('[/api/chat GET] Error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// ============================================================
// POST — send message: try CHIP match first, fallback AI
// ============================================================
const PostSchema = z.object({
  content: z.string().min(1).max(MAX_MESSAGE_LEN),
  chip_id: z.string().optional(),         // Nếu user click CHIP, gửi luôn chip id
  visitor_name: z.string().min(1).max(100).optional(),
  visitor_phone: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Tin nhắn không hợp lệ' }, { status: 400 });
    }

    const { content, chip_id, visitor_name, visitor_phone } = parsed.data;
    const sessionId = getOrCreateSessionId(request);
    const userAgent = request.headers.get('user-agent') || null;
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      null;

    // Find or create thread
    let thread = await queryOne<{ id: number; member_id: number | null; message_count: number }>(
      `SELECT id, member_id, message_count FROM chat_threads WHERE session_id = $1 ORDER BY id DESC LIMIT 1`,
      [sessionId]
    );

    let isNewThread = false;
    if (!thread) {
      let memberId: number | null = null;
      let memberCohort: string | null = null;
      let memberName: string | null = null;
      if (visitor_phone) {
        const m = await queryOne<{ id: number; cohort: string; full_name: string }>(
          `SELECT id, cohort, full_name FROM members WHERE phone = $1`,
          [visitor_phone.replace(/\D/g, '')]
        );
        if (m) {
          memberId = m.id;
          memberCohort = m.cohort;
          memberName = m.full_name;
        }
      }

      const created = await queryOne<{ id: number; member_id: number | null; message_count: number }>(
        `INSERT INTO chat_threads (session_id, member_id, visitor_name, visitor_phone, cohort, channel, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5, 'web', $6, $7)
         RETURNING id, member_id, message_count`,
        [sessionId, memberId, memberName || visitor_name || null, visitor_phone || null, memberCohort, userAgent, ip]
      );
      thread = created!;
      isNewThread = true;
    } else if (visitor_name) {
      await query(`UPDATE chat_threads SET visitor_name = COALESCE(visitor_name, $2) WHERE id = $1`, [thread.id, visitor_name]);
    }

    // Insert user message
    const userMsg = await queryOne<{ id: number; created_at: string }>(
      `INSERT INTO chat_messages (thread_id, sender_type, sender_name, content, content_type)
       VALUES ($1, 'user', $2, $3, 'text')
       RETURNING id, created_at`,
      [thread.id, visitor_name || null, content]
    );

    // ===== Match CHIP first (if no explicit chip_id) =====
    let replyContent: string | null = null;
    let replySource: 'chip' | 'ai' | 'system' = 'system';
    let metadata: any = {};

    const chips = await loadEnabledChips();

    if (chip_id) {
      // User clicked a chip explicitly — use that
      const chip = chips.find((c) => c.id === chip_id);
      if (chip) {
        replyContent = chip.answer + (chip.wikiUrl ? `\n\n📖 Đọc sâu: ${chip.wikiUrl}` : '');
        replySource = 'chip';
        metadata = { chip_id: chip.id, chip_label: chip.label };
      }
    } else {
      // Try intent match
      const match = matchUserMessage(content, chips);
      if (match) {
        replyContent = match.chip.answer + (match.chip.wikiUrl ? `\n\n📖 Đọc sâu: ${match.chip.wikiUrl}` : '');
        replySource = 'chip';
        metadata = { chip_id: match.chip.id, chip_label: match.chip.label, match_score: match.score };
      }
    }

    // ===== No CHIP match → fallback AI =====
    if (!replyContent) {
      // Build context for AI
      const memberProfile = thread.member_id ? await getMemberProfile(thread.member_id) : null;

      const recentMessages = await query<{ sender_type: string; content: string }>(
        `SELECT sender_type, content FROM chat_messages
         WHERE thread_id = $1 AND is_deleted = FALSE
         ORDER BY created_at DESC LIMIT 10`,
        [thread.id]
      );

      const ctx: MentorContext = {
        name: memberProfile?.full_name || visitor_name || 'anh',
        pronouns: memberProfile?.pronouns || 'anh',
        assistantName: memberProfile?.assistant_name || 'Sol Đồng hành',
        dayNumber: memberProfile?.days_sober ?? 1,
        ftndScore: memberProfile?.ftnd_score ?? null,
        cohort: (memberProfile?.cohort as any) ?? null,
        isTrialActive: memberProfile?.is_trial_active ?? true,
        trialDaysRemaining: memberProfile?.trial_days_remaining ?? 7,
        checkinStreak: memberProfile?.checkin_streak ?? 0,
        topTriggers: memberProfile?.top_triggers ?? [],
        riskyHours: [],
        age: memberProfile?.age ?? null,
        yearsSmoked: memberProfile?.years_smoked ?? null,
        quitReasons: memberProfile?.quit_reasons ?? [],
        recentMessages: recentMessages.reverse().map((m) => ({
          role: m.sender_type === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        currentMood: memberProfile?.current_mood ?? 'stable',
        mode: memberProfile?.mode ?? 'normal'
      };

      const aiReply = await askMentor({
        memberId: thread.member_id,
        threadId: thread.id,
        userMessage: content,
        ctx
      });

      replyContent = aiReply.content;
      replySource = 'ai';
      metadata = {
        model_used: aiReply.modelUsed,
        provider: aiReply.provider,
        latency_ms: aiReply.latencyMs,
        quota_exceeded: aiReply.quotaExceeded
      };
    }

    // Insert assistant reply
    const assistantMsg = await queryOne<{ id: number; created_at: string }>(
      `INSERT INTO chat_messages (thread_id, sender_type, sender_name, content, content_type, metadata)
       VALUES ($1, $2, $3, $4, 'text', $5)
       RETURNING id, created_at`,
      [
        thread.id,
        replySource === 'ai' ? 'ai' : 'admin', // 'ai' for AI Mentor, 'admin' for canned
        replySource === 'ai' ? 'Sol AI' : 'Sol',
        replyContent,
        JSON.stringify(metadata)
      ]
    );

    const res = NextResponse.json({
      ok: true,
      thread_id: thread.id,
      user_message_id: userMsg!.id,
      reply: {
        id: assistantMsg!.id,
        sender_type: replySource === 'ai' ? 'ai' : 'admin',
        sender_name: replySource === 'ai' ? 'Sol AI' : 'Sol',
        content: replyContent,
        source: replySource,
        created_at: assistantMsg!.created_at
      }
    });
    ensureSessionCookie(res, request, sessionId);
    return res;
  } catch (err: any) {
    console.error('[/api/chat POST] Error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// ============================================================
// PATCH — mark messages as read
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const sessionId = getOrCreateSessionId(request);
    const thread = await queryOne<{ id: number }>(
      `SELECT id FROM chat_threads WHERE session_id = $1 ORDER BY id DESC LIMIT 1`,
      [sessionId]
    );
    if (!thread) return NextResponse.json({ ok: true });

    await query(
      `UPDATE chat_messages SET is_read = TRUE, read_at = NOW()
       WHERE thread_id = $1 AND sender_type IN ('admin', 'ai') AND is_read = FALSE`,
      [thread.id]
    );
    await query(`UPDATE chat_threads SET unread_user = 0 WHERE id = $1`, [thread.id]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[/api/chat PATCH] Error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// ============================================================
// Helpers
// ============================================================

interface MemberProfile {
  full_name: string;
  pronouns?: string;
  assistant_name?: string;
  cohort?: string;
  ftnd_score?: number;
  days_sober?: number;
  is_trial_active?: boolean;
  trial_days_remaining?: number;
  checkin_streak?: number;
  top_triggers?: string[];
  age?: number;
  years_smoked?: number;
  quit_reasons?: string[];
  current_mood?: 'improving' | 'declining' | 'stable';
  mode?: 'normal' | 'calm' | 'whisper' | 'busy';
}

async function getMemberProfile(memberId: number): Promise<MemberProfile | null> {
  const row = await queryOne<any>(
    `SELECT m.full_name, m.cohort, m.ftnd_score,
            m.trial_started_at, m.trial_ends_at, m.subscription_started_at,
            ump.pronouns, ump.assistant_name, ump.top_triggers, ump.age, ump.years_smoked,
            ump.quit_reasons, ump.current_mood, ump.mode, ump.checkin_streak
     FROM members m
     LEFT JOIN user_messaging_profiles ump ON ump.member_id = m.id
     WHERE m.id = $1`,
    [memberId]
  );
  if (!row) return null;

  const trialEnds = row.trial_ends_at ? new Date(row.trial_ends_at) : null;
  const now = new Date();
  const isTrialActive = trialEnds ? trialEnds > now : false;
  const trialDaysRemaining = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  // days_sober = ngày từ subscription_started_at (hoặc trial_started_at nếu chưa pay)
  const startDate = row.subscription_started_at || row.trial_started_at;
  const daysSober = startDate ? Math.max(1, Math.floor((now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;

  return {
    full_name: row.full_name || 'anh',
    pronouns: row.pronouns || 'anh',
    assistant_name: row.assistant_name || 'Sol Đồng hành',
    cohort: row.cohort,
    ftnd_score: row.ftnd_score,
    days_sober: daysSober,
    is_trial_active: isTrialActive,
    trial_days_remaining: trialDaysRemaining,
    checkin_streak: row.checkin_streak || 0,
    top_triggers: row.top_triggers || [],
    age: row.age,
    years_smoked: row.years_smoked,
    quit_reasons: row.quit_reasons || [],
    current_mood: row.current_mood || 'stable',
    mode: row.mode || 'normal'
  };
}

function getOrCreateSessionId(request: NextRequest): string {
  return request.cookies.get('sol_session')?.value || randomUUID();
}

function ensureSessionCookie(response: NextResponse, request: NextRequest, sessionId: string) {
  if (!request.cookies.get('sol_session')) {
    response.cookies.set('sol_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });
  }
}

export const dynamic = 'force-dynamic';
