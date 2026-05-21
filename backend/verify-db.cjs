/**
 * Verify DB schema + đếm tables.
 * Run: node verify-db.cjs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log(`\n▶ Public schema có ${tables.length} tables:\n`);
  for (const t of tables) {
    console.log(`  ${t.table_name}`);
  }

  // Count records per table
  console.log(`\n▶ Record count:\n`);
  let totalRecords = 0;
  for (const t of tables) {
    try {
      const r = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM "${t.table_name}"`);
      const count = parseInt(r[0].cnt);
      totalRecords += count;
      if (count > 0) console.log(`  ${t.table_name.padEnd(35)} ${count}`);
    } catch (e) {}
  }
  console.log(`\n  TOTAL: ${tables.length} tables, ${totalRecords} records\n`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
