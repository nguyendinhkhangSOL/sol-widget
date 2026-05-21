/**
 * Restore DB từ backup JSON (do backup-db.cjs tạo ra).
 *
 * Run:
 *   node restore-db.cjs ../backups/sol-backup-2026-05-15T08-28-25-832Z.json
 *
 * Cách hoạt động:
 *   - Đọc file JSON
 *   - Với mỗi bảng, insert lại records qua $executeRawUnsafe
 *   - Bỏ qua bảng đã có data (KHÔNG ghi đè)
 *   - Bỏ qua records vi phạm FK constraint
 *
 * Lưu ý:
 *   - Schema phải tồn tại trước (chạy migration hoặc prisma db push trước)
 *   - Chỉ restore data, KHÔNG restore schema
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node restore-db.cjs <path/to/backup.json>');
  process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
  console.error(`File không tồn tại: ${absPath}`);
  process.exit(1);
}

const prisma = new PrismaClient();

// Thứ tự bảng restore — FK dependency order (cha trước, con sau)
const RESTORE_ORDER = [
  'User',
  'Cohort',
  'AppSetting',
  'ContentItem',
  'ContentItemRevision',
  'CannedReply',
  'ZaloTemplate',
  'CheckIn',
  'ExerciseEntry',
  'Message',
  'UserState',
  'CigaretteLog',
  'ProgressJournal',
  'Notification',
  'PushSubscription',
  'CrisisEvent',
  'OtpCode',
  'EmailVerificationToken',
  'PaymentLog',
  'RefundRequest',
  'VoiceMessage',
  'VoiceDelivery',
  'Confession',
  'ConfessionReaction',
  'ConfessionRead',
  'KhangQuestion',
  'KhangQuestionUpvote',
  'KhangVoice',
  'KhangVoiceListen',
  'KhangVoiceReaction',
  'CrisisTimerLog',
  'AnonymousStatsCache',
  'LapseEvent',
  'ZaloOAUser',
  'ZNSLog',
  'MessagingPolicy',
  'UserMessagingProfile',
];

function escapeValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') {
    // JSON column
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  if (Array.isArray(v)) {
    return `ARRAY[${v.map(escapeValue).join(',')}]`;
  }
  // String — escape single quotes
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function restoreTable(tableName, records) {
  if (!records || records.length === 0) {
    return { success: 0, skipped: 0, failed: 0 };
  }

  // Check existing count
  let existingCount;
  try {
    const r = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
    existingCount = parseInt(r[0].cnt);
  } catch (e) {
    return { success: 0, skipped: 0, failed: records.length, error: e.message };
  }

  if (existingCount > 0) {
    return { success: 0, skipped: records.length, failed: 0, note: `Table có ${existingCount} rows — bỏ qua` };
  }

  // Insert from records
  let success = 0;
  let failed = 0;
  for (const rec of records) {
    const cols = Object.keys(rec).map((c) => `"${c}"`).join(', ');
    const vals = Object.values(rec).map((v) => {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
        // ISO datetime string
        return `'${v}'::timestamp`;
      }
      return escapeValue(v);
    }).join(', ');
    const sql = `INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING`;
    try {
      await prisma.$executeRawUnsafe(sql);
      success++;
    } catch (e) {
      failed++;
    }
  }

  return { success, skipped: 0, failed };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  console.log(`\n▶ Restore từ ${path.basename(filePath)}`);
  console.log(`  Backed up at: ${data.backedUpAt}`);
  console.log(`  Tables: ${Object.keys(data.tables).length}\n`);

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const tableName of RESTORE_ORDER) {
    const records = data.tables[tableName] ?? [];
    process.stdout.write(`  ${tableName.padEnd(30)} (${records.length} rows) ... `);
    const r = await restoreTable(tableName, records);
    totalSuccess += r.success;
    totalSkipped += r.skipped;
    totalFailed += r.failed;
    console.log(`✓ ${r.success} | ⊘ ${r.skipped} | ✗ ${r.failed}${r.note ? ' — ' + r.note : ''}`);
  }

  console.log('\n━'.repeat(35));
  console.log(`  Success: ${totalSuccess}  |  Skipped: ${totalSkipped}  |  Failed: ${totalFailed}`);
  console.log('━'.repeat(35));

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Restore failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
