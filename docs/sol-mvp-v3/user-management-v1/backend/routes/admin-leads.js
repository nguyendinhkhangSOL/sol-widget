/**
 * Admin API: /api/admin/leads/*
 * Cần auth token (JWT hoặc cookie session — dùng middleware hiện có của huongdi backend)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const notification = require('../services/notification');

// Middleware auth — replace bằng auth middleware hiện có của huongdi backend
function requireAdmin(req, res, next) {
  // TODO: replace bằng auth middleware thật của backend hiện có
  // Ví dụ: verify JWT từ req.headers.authorization
  // Hoặc verify session cookie
  if (!req.user || !req.user.isAdmin) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

module.exports = (db) => {

  /**
   * GET /api/admin/leads
   * Query: ?status=pending&page=1&limit=50&search=xxx
   */
  router.get('/', requireAdmin, (req, res) => {
    try {
      const status = req.query.status || 'all';
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const offset = (page - 1) * limit;
      const search = (req.query.search || '').trim();

      let where = '1=1';
      const params = [];

      if (status !== 'all') {
        where += ' AND payment_status = ?';
        params.push(status);
      }

      if (search) {
        where += ' AND (ten LIKE ? OR sdt LIKE ? OR email LIKE ? OR zalo LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      const countRow = db.prepare(`SELECT COUNT(*) as total FROM leads WHERE ${where}`).get(...params);
      const rows = db.prepare(`
        SELECT id, ten, sdt, email, zalo, goi, amount, payment_status,
               magic_token, activated_at, expires_at, notes, cancel_reason,
               approved_by, created_at, updated_at
        FROM leads
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      // Summary stats
      const summary = db.prepare(`
        SELECT payment_status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM leads GROUP BY payment_status
      `).all();

      res.json({
        success: true,
        leads: rows,
        total: countRow.total,
        page,
        limit,
        summary
      });
    } catch (err) {
      console.error('[GET /admin/leads] Error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  /**
   * GET /api/admin/leads/:id
   */
  router.get('/:id', requireAdmin, (req, res) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Not found' });

    const notifs = db.prepare('SELECT * FROM notifications WHERE lead_id = ? ORDER BY sent_at DESC').all(req.params.id);
    res.json({ success: true, lead, notifications: notifs });
  });

  /**
   * POST /api/admin/leads/:id/approve
   * → Generate magic_token, set status=paid, expires_at=+365d
   * → Send magic link cho user qua Zalo/SMS (manual by Khang) hoặc auto if configured
   */
  router.post('/:id/approve', requireAdmin, async (req, res) => {
    try {
      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
      if (!lead) return res.status(404).json({ success: false, message: 'Not found' });

      if (lead.payment_status === 'activated') {
        return res.status(400).json({ success: false, message: 'Lead đã activated rồi.' });
      }

      // Generate unique magic token
      const token = crypto.randomBytes(24).toString('hex');
      const now = new Date();
      const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      db.prepare(`
        UPDATE leads
        SET payment_status = 'paid',
            magic_token = ?,
            magic_sent_at = ?,
            expires_at = ?,
            approved_by = ?,
            notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(
        token,
        now.toISOString(),
        expires.toISOString(),
        req.user.username || 'admin',
        req.body.notes || null,
        req.params.id
      );

      const magicLink = `https://sol.vn/kich-hoat/?token=${token}`;

      // Send magic link to user (Zalo/SMS/Email)
      // Fallback: return link để Khang gửi thủ công qua Zalo
      const notifyResult = await notification.sendMagicLinkToUser(lead, magicLink, db);

      res.json({
        success: true,
        magic_link: magicLink,
        expires_at: expires.toISOString(),
        notification: notifyResult
      });
    } catch (err) {
      console.error('[POST /admin/leads/:id/approve] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * POST /api/admin/leads/:id/reject
   * Body: { reason }
   */
  router.post('/:id/reject', requireAdmin, (req, res) => {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do' });
    }

    const result = db.prepare(`
      UPDATE leads
      SET payment_status = 'cancelled',
          cancel_reason = ?,
          approved_by = ?
      WHERE id = ?
    `).run(reason, req.user.username || 'admin', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true });
  });

  /**
   * POST /api/admin/leads/:id/resend-magic
   * Gửi lại magic link (nếu user báo không nhận được)
   */
  router.post('/:id/resend-magic', requireAdmin, async (req, res) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
    if (!lead.magic_token) {
      return res.status(400).json({ success: false, message: 'Lead chưa được approve. Approve trước đã.' });
    }

    const magicLink = `https://sol.vn/kich-hoat/?token=${lead.magic_token}`;
    const notifyResult = await notification.sendMagicLinkToUser(lead, magicLink, db);
    res.json({ success: true, magic_link: magicLink, notification: notifyResult });
  });

  return router;
};
