// backend/src/scripts/runEmailFunnel.ts
//
// Trigger email funnel on-demand cho dev/test.
//
// Usage:
//   npx tsx src/scripts/runEmailFunnel.ts
//   docker compose exec backend node dist/scripts/runEmailFunnel.js
//
// Sẽ scan tất cả user có email + quitDate, gửi mail tương ứng dayInJourney
// nếu chưa gửi (idempotent qua notificationPrefs.emailFunnel.daysSent).

import { runEmailFunnelDaily } from '../scheduler/emailFunnel';

async function main() {
  console.log('[runEmailFunnel] starting…');
  await runEmailFunnelDaily();
  console.log('[runEmailFunnel] done');
  process.exit(0);
}

main().catch((err) => {
  console.error('[runEmailFunnel] fatal:', err);
  process.exit(1);
});
