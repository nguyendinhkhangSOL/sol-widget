/**
 * Backup DB qua Node.js — fallback nếu pg_dump không có trong PATH.
 *
 * Run: node backup-db.cjs
 *
 * Output: C:\BOTHUOCLA\sol-widget\backups\sol-backup-{timestamp}.json
 *
 * Dùng $queryRawUnsafe để bypass Prisma type system → KHÔNG fail khi
 * schema.prisma có column mới chưa migrate vào DB.
 *
 * Lưu ý: backup này KHÔNG bao gồm schema (CREATE TABLE), chỉ data.
 * Nếu cần full schema dump → dùng pg_dump:
 *   pg_dump $DATABASE_URL > backup.sql
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

async function backup() {
  console.log('Starting backup...');

  // Tạo thư mục backup nếu chưa có
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`  Tạo thư mục: ${BACKUP_DIR}`);
  }

  const data = {
    backedUpAt: new Date().toISOString(),
    tables: {},
  };

  // List tables thực tế từ information_schema — tự động phát hiện
  const tablesResult = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '_prisma%'
    ORDER BY table_name
  `);
  const tables = tablesResult.map((r) => r.table_name);
  console.log(`  Found ${tables.length} tables in public schema`);

  for (const tableName of tables) {
    try {
      // Quote table name vì Prisma table name có thể có chữ hoa (vd "User")
      const records = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
      data.tables[tableName] = records;
      console.log(`  ✅ ${tableName}: ${records.length} rows`);
    } catch (err) {
      console.warn(`  ⚠ ${tableName}: ${err.message.slice(0, 100)}`);
      data.tables[tableName] = [];
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(BACKUP_DIR, `sol-backup-${timestamp}.json`);

  // Serialize với BigInt support
  const json = JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
  fs.writeFileSync(filename, json, 'utf8');

  const fileSize = fs.statSync(filename).size;
  console.log(`\n✅ Backup saved: ${filename}`);
  console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Tables: ${Object.keys(data.tables).length}`);
  console.log(`   Total rows: ${Object.values(data.tables).reduce((sum, t) => sum + t.length, 0)}`);

  await prisma.$disconnect();
}

backup().catch(async (err) => {
  console.error('Backup failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
