/**
 * Public API: GET /api/activate?token=xxx
 * User click magic link → verify token → return tier info
 * Frontend (sol.vn/kich-hoat/) sẽ đọc response + set localStorage
 */

const express = require('express');
const router = express.Router();

module.exports = (db) => {

  /**
   * GET /api/activate?token=xxx
   * Return: { success, tier, expires_at, ten }
   */
  router.get('/', (req, res) => {
    const { token } = req.query;
    if (!token || token.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ.'
      });
    }

    const lead = db.prepare(`
      SELECT id, ten, sdt, goi, expires_at, payment_status, activated_at
      FROM leads
      WHERE magic_token = ?
    `).get(token);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Link không tồn tại hoặc đã bị xoá.'
      });
    }

    if (lead.payment_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn này đã bị huỷ.'
      });
    }

    // Kiểm tra hạn
    if (lead.expires_at && new Date(lead.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Link đã hết hạn. Vui lòng liên hệ Zalo 0912727381.'
      });
    }

    // Nếu chưa activated → set activated_at
    if (lead.payment_status !== 'activated') {
      db.prepare(`
        UPDATE leads
        SET payment_status = 'activated',
            activated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(lead.id);
    }

    res.json({
      success: true,
      tier: lead.goi === 'founder' ? 'founder' : 'active',
      ten: lead.ten,
      expires_at: lead.expires_at,
      first_activation: lead.payment_status !== 'activated'
    });
  });

  return router;
};
