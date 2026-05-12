/**
 * Backup DB qua Node.js — fallback nếu pg_dump không có trong PATH.
 *
 * Run: node backup-db.cjs
 *
 * Output: D:\BOTHUOCLA\sol-backup-{timestamp}.json
 *
 * Format: JSON với tất cả tables — dùng để restore qua Node.js script
 * (không phải SQL native, nhưng đủ để restore data nếu cần).
 *
 * Lưu ý: backup này KHÔNG bao gồm schema (CREATE TABLE), chỉ data.
 * Nếu cần full schema dump → dùng pg_dump hoặc pgAdmin.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('Starting backup...');

  const data = {
    backedUpAt: new Date().toISOString(),
    tables: {},
  };

  // List all tables to dump (theo schema.prisma)
  const tables = [
    'user',
    'checkIn',
    'exerciseEntry',
    'message',
    'userState',
    'cigaretteLog',
    'progressJournal',
    'contentItem',
    'contentItemRevision',
    'cannedReply',
    'notification',
    'pushSubscription',
    'crisisEvent',
    'otpCode',
    'emailVerificationToken',
    'appSetting',
    'paymentLog',
    'refundRequest',
    'voiceMessage',
    'voiceDelivery',
    'cohort',
  ];

  for (const t of tables) {
    try {
      // @ts-ignore — dynamic access
      const records = await prisma[t].findMany();
      data.tables[t] = records;
      console.log(`  ✅ ${t}: ${records.length} rows`);
    } catch (err) {
      console.warn(`  ⚠ ${t}: ${err.message}`);
      data.tables[t] = [];
    }
  }

  const filename = `D:\\BOTHUOCLA\\sol-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');

  const fileSize = fs.statSync(filename).size;
  console.log(`\n✅ Backup saved: ${filename}`);
  console.log(`   Size: ${(fileSize / 1024).toFixed(1)} KB`);

  await prisma.$disconnect();
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
