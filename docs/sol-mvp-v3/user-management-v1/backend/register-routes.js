/**
 * ═══════════════════════════════════════════════════════════════
 * INSTRUCTION: Gắn 3 route mới vào server.js hiện có của backend huongdi
 * ═══════════════════════════════════════════════════════════════
 *
 * Đọc file này KHÔNG phải để chạy — chỉ để COPY snippet vào server.js
 *
 * File cần sửa:  /var/www/huongdi/backend/server.js
 */

// ── 1. Ở ĐẦU file server.js, thêm require: ───────────────────
const Database = require('better-sqlite3');
const path = require('path');

// Init DB
const db = new Database(path.join(process.env.DB_DIR || '/var/www/huongdi/db', 'leads.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── 2. Import 3 route modules (giả sử copy vào /var/www/huongdi/backend/routes/) ──
const leadsRouter       = require('./routes/leads')(db);
const adminLeadsRouter  = require('./routes/admin-leads')(db);
const activateRouter    = require('./routes/activate')(db);

// ── 3. Sau các middleware như app.use(express.json()), thêm 3 dòng: ──
app.use('/api/leads',           leadsRouter);       // Public — nhận form
app.use('/api/admin/leads',     adminLeadsRouter);  // Auth-required — admin panel
app.use('/api/activate',        activateRouter);    // Public — magic link verify

// ── 4. CORS config — cho phép sol.vn POST tới huongdi.sol.vn ──
// (kiểm tra CORS hiện tại có allow origin 'https://sol.vn' không)
// Nếu chưa, thêm vào cors config:
// { origin: ['https://sol.vn', 'https://huongdi.sol.vn', 'https://adminhuongdi.sol.vn'], credentials: true }

// ── 5. Nếu backend đang có JWT/session auth cho admin: ──
// - Import auth middleware của anh
// - Trong admin-leads.js: uncomment requireAdmin() → dùng middleware thật
//   Ví dụ:
//   const { requireAdminAuth } = require('../middleware/auth');
//   router.get('/', requireAdminAuth, ...);

// ═══════════════════════════════════════════════════════════════
// TỔNG KẾT — 4 endpoints mới:
//   POST /api/leads                        (public, rate-limited)
//   GET  /api/admin/leads?status=&search=  (auth)
//   POST /api/admin/leads/:id/approve      (auth)
//   POST /api/admin/leads/:id/reject       (auth)
//   POST /api/admin/leads/:id/resend-magic (auth)
//   GET  /api/activate?token=xxx           (public)
// ═══════════════════════════════════════════════════════════════
