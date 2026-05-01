// backend/src/utils/dayNumber.ts
// Compute a user's current day number (1..30) based on quitDate.

export function computeDayNumber(quitDate: Date | null | undefined, now: Date = new Date()): number {
  if (!quitDate) return 1;
  const ms = now.getTime() - quitDate.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(30, days));
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
