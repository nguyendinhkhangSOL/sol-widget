/**
 * User Profile helpers — Sol Widget
 * Quản lý user_messaging_profiles + member lookup
 */

import { query, queryOne } from '@/lib/db';

export interface UserProfile {
  member_id: number;
  phone: string;
  full_name: string;
  cohort: 'LIGHT' | 'MODERATE' | 'HEAVY' | null;
  ftnd_score: number | null;
  pronouns: string;              // "anh" | "em" | "chú" | "bác" | custom
  assistant_name: string;         // "Sol Đồng hành" | "Sol Trợ lý" | custom
  quit_reasons: string[];         // 5 lý do user viết
  top_triggers: string[];         // ["cà phê", "nhậu", ...]
  age: number | null;
  years_smoked: number | null;
  cigarettes_per_day: number | null;
  quiet_hours_start: string;      // "22:00"
  quiet_hours_end: string;        // "07:00"
  preferred_morning_time: string; // "07:00"
  preferred_evening_time: string; // "20:00"
  timezone: string;
  current_mood: 'improving' | 'declining' | 'stable';
  mode: 'normal' | 'calm' | 'whisper' | 'busy';
  checkin_streak: number;
  trial_ends_at: string | null;
}

const DEFAULT_PROFILE: Partial<UserProfile> = {
  pronouns: 'anh',
  assistant_name: 'Sol Đồng hành',
  quit_reasons: [],
  top_triggers: [],
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  preferred_morning_time: '07:00',
  preferred_evening_time: '20:00',
  timezone: 'Asia/Ho_Chi_Minh',
  current_mood: 'stable',
  mode: 'normal',
  checkin_streak: 0
};

/**
 * Find member from session_id (via chat_threads OR direct lookup)
 */
export async function getMemberIdFromSession(sessionId: string): Promise<number | null> {
  if (!sessionId) return null;

  // 1. Try chat_threads link
  const thread = await queryOne<{ member_id: number | null }>(
    `SELECT member_id FROM chat_threads WHERE session_id = $1 AND member_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
    [sessionId]
  );
  if (thread?.member_id) return thread.member_id;

  return null;
}

/**
 * Find member by phone
 */
export async function getMemberByPhone(phone: string): Promise<number | null> {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return null;
  const member = await queryOne<{ id: number }>(
    `SELECT id FROM members WHERE phone = $1`,
    [cleaned]
  );
  return member?.id ?? null;
}

/**
 * Load profile (with auto-create if missing)
 */
export async function loadProfile(memberId: number): Promise<UserProfile | null> {
  // Ensure profile row exists
  await query(
    `INSERT INTO user_messaging_profiles (member_id)
     VALUES ($1)
     ON CONFLICT (member_id) DO NOTHING`,
    [memberId]
  );

  // Join member + profile + sync cohort
  const row = await queryOne<any>(
    `SELECT m.id AS member_id, m.phone, m.full_name, m.cohort, m.ftnd_score, m.trial_ends_at,
            ump.pronouns, ump.assistant_name, ump.quit_reasons, ump.top_triggers,
            ump.age, ump.years_smoked, ump.cigarettes_per_day,
            ump.quiet_hours_start, ump.quiet_hours_end,
            ump.preferred_morning_time, ump.preferred_evening_time, ump.timezone,
            ump.current_mood, ump.mode, ump.checkin_streak
     FROM members m
     LEFT JOIN user_messaging_profiles ump ON ump.member_id = m.id
     WHERE m.id = $1`,
    [memberId]
  );

  if (!row) return null;

  return {
    member_id: row.member_id,
    phone: row.phone,
    full_name: row.full_name || 'anh',
    cohort: row.cohort,
    ftnd_score: row.ftnd_score,
    pronouns: row.pronouns || DEFAULT_PROFILE.pronouns!,
    assistant_name: row.assistant_name || DEFAULT_PROFILE.assistant_name!,
    quit_reasons: row.quit_reasons || [],
    top_triggers: row.top_triggers || [],
    age: row.age,
    years_smoked: row.years_smoked,
    cigarettes_per_day: row.cigarettes_per_day,
    quiet_hours_start: formatTime(row.quiet_hours_start, DEFAULT_PROFILE.quiet_hours_start!),
    quiet_hours_end: formatTime(row.quiet_hours_end, DEFAULT_PROFILE.quiet_hours_end!),
    preferred_morning_time: formatTime(row.preferred_morning_time, DEFAULT_PROFILE.preferred_morning_time!),
    preferred_evening_time: formatTime(row.preferred_evening_time, DEFAULT_PROFILE.preferred_evening_time!),
    timezone: row.timezone || DEFAULT_PROFILE.timezone!,
    current_mood: row.current_mood || DEFAULT_PROFILE.current_mood!,
    mode: row.mode || DEFAULT_PROFILE.mode!,
    checkin_streak: row.checkin_streak || 0,
    trial_ends_at: row.trial_ends_at
  };
}

function formatTime(val: any, fallback: string): string {
  if (!val) return fallback;
  if (typeof val === 'string' && /^\d{2}:\d{2}/.test(val)) return val.slice(0, 5);
  if (val instanceof Date) {
    return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`;
  }
  return fallback;
}

/**
 * Save profile patch (PATCH operation)
 */
export interface ProfilePatch {
  pronouns?: string;
  assistant_name?: string;
  quit_reasons?: string[];
  top_triggers?: string[];
  age?: number | null;
  years_smoked?: number | null;
  cigarettes_per_day?: number | null;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  preferred_morning_time?: string;
  preferred_evening_time?: string;
  current_mood?: 'improving' | 'declining' | 'stable';
  mode?: 'normal' | 'calm' | 'whisper' | 'busy';
}

export async function saveProfile(memberId: number, patch: ProfilePatch): Promise<void> {
  // Ensure row exists first
  await query(
    `INSERT INTO user_messaging_profiles (member_id) VALUES ($1) ON CONFLICT (member_id) DO NOTHING`,
    [memberId]
  );

  // Build dynamic UPDATE
  const sets: string[] = [];
  const values: any[] = [memberId];
  let i = 2;

  function add(col: string, val: any) {
    sets.push(`${col} = $${i}`);
    values.push(val);
    i++;
  }

  if (patch.pronouns !== undefined) add('pronouns', patch.pronouns.slice(0, 20));
  if (patch.assistant_name !== undefined) add('assistant_name', patch.assistant_name.slice(0, 50));
  if (patch.quit_reasons !== undefined) add('quit_reasons', patch.quit_reasons.slice(0, 5).map(r => r.slice(0, 200)));
  if (patch.top_triggers !== undefined) add('top_triggers', patch.top_triggers.slice(0, 10).map(t => t.slice(0, 50)));
  if (patch.age !== undefined) add('age', patch.age);
  if (patch.years_smoked !== undefined) add('years_smoked', patch.years_smoked);
  if (patch.cigarettes_per_day !== undefined) add('cigarettes_per_day', patch.cigarettes_per_day);
  if (patch.quiet_hours_start !== undefined) add('quiet_hours_start', patch.quiet_hours_start);
  if (patch.quiet_hours_end !== undefined) add('quiet_hours_end', patch.quiet_hours_end);
  if (patch.preferred_morning_time !== undefined) add('preferred_morning_time', patch.preferred_morning_time);
  if (patch.preferred_evening_time !== undefined) add('preferred_evening_time', patch.preferred_evening_time);
  if (patch.current_mood !== undefined) add('current_mood', patch.current_mood);
  if (patch.mode !== undefined) add('mode', patch.mode);

  if (sets.length === 0) return;

  await query(
    `UPDATE user_messaging_profiles SET ${sets.join(', ')}, updated_at = NOW() WHERE member_id = $1`,
    values
  );
}
