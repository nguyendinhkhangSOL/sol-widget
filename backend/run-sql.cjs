/**
 * Run SQL file qua Prisma — thay thế cho psql khi không có CLI.
 *
 * Usage:
 *   node run-sql.cjs prisma/manual_migration_phase5_journey.sql
 *   node run-sql.cjs prisma/seed_phase5_journey_templates.sql
 *
 * Cách hoạt động:
 *   - Đọc SQL file
 *   - Split theo `;` cuối dòng (bỏ qua `;` trong string)
 *   - Execute từng statement qua prisma.$executeRawUnsafe
 *   - Catch error riêng từng statement → tiếp tục với statement còn lại
 *     (vì SQL của em IDEMPOTENT — CREATE IF NOT EXISTS, ON CONFLICT)
 *
 * Khác psql:
 *   - Không hỗ trợ \\d, \\dt, \\l (psql meta commands)
 *   - Không hỗ trợ COPY FROM stdin
 *   - Đủ dùng cho migration + seed file
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node run-sql.cjs <path/to/file.sql>');
  process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
  console.error(`File không tồn tại: ${absPath}`);
  process.exit(1);
}

const prisma = new PrismaClient();

function splitStatements(sql) {
  // Split theo `;` ở cuối dòng, bỏ qua `;` trong string literal và dollar-quoted
  const stmts = [];
  let current = '';
  let inSingleQuote = false;
  let inDollarQuote = false;
  let dollarTag = '';
  let inComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const c2 = sql.substr(i, 2);

    // Block comment
    if (inBlockComment) {
      current += c;
      if (c2 === '*/') {
        current += '/';
        i++;
        inBlockComment = false;
      }
      continue;
    }
    if (c2 === '/*') {
      current += c;
      inBlockComment = true;
      continue;
    }

    // Line comment
    if (inComment) {
      current += c;
      if (c === '\n') inComment = false;
      continue;
    }
    if (c2 === '--' && !inSingleQuote && !inDollarQuote) {
      current += c;
      inComment = true;
      continue;
    }

    // Dollar-quoted string $$...$$ or $tag$...$tag$
    if (!inSingleQuote && c === '$') {
      const match = sql.substr(i).match(/^\$([a-zA-Z_]\w*)?\$/);
      if (match) {
        if (inDollarQuote && match[0] === `$${dollarTag}$`) {
          inDollarQuote = false;
          current += match[0];
          i += match[0].length - 1;
          continue;
        } else if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = match[1] ?? '';
          current += match[0];
          i += match[0].length - 1;
          continue;
        }
      }
    }

    // Single quote string
    if (!inDollarQuote && c === "'") {
      if (inSingleQuote && sql[i + 1] === "'") {
        // Escaped quote
        current += "''";
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += c;
      continue;
    }

    // Statement terminator
    if (c === ';' && !inSingleQuote && !inDollarQuote) {
      current += ';';
      const trimmed = current.trim();
      if (trimmed && trimmed !== ';') stmts.push(trimmed);
      current = '';
      continue;
    }

    current += c;
  }

  const lastTrimmed = current.trim();
  if (lastTrimmed) stmts.push(lastTrimmed);

  // Lọc statement chỉ là comment
  return stmts.filter((s) => {
    const noComments = s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return noComments.length > 0;
  });
}

async function run() {
  const sql = fs.readFileSync(absPath, 'utf-8');
  const statements = splitStatements(sql);

  console.log(`\n▶ Running ${path.basename(filePath)}`);
  console.log(`  Found ${statements.length} SQL statement(s)\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}`);
      success++;
    } catch (err) {
      console.log(`  ✗ [${i + 1}/${statements.length}] ${preview}`);
      console.log(`     ERROR: ${err.message.slice(0, 200)}`);
      failed++;
      errors.push({ index: i + 1, preview, error: err.message });
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  console.log(`  Success: ${success}  |  Failed: ${failed}`);
  console.log('━'.repeat(70));

  if (failed > 0) {
    console.log('\nLỗi chi tiết:');
    errors.forEach((e) => {
      console.log(`  #${e.index}: ${e.error.slice(0, 200)}`);
    });
  }

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error('Run failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
