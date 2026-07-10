/**
 * Public API: POST /api/leads
 * Nhận form từ sol.vn/thanh-toan/ → save DB + notify
 */

const express = require('express');
const router = express.Router();
const notification = require('../services/notification');

// Rate limit: max 5 submissions per SDT per 24h (chống spam)
const submissions = new Map(); // { sdt: [timestamp, ...] }

function isRateLimited(sdt) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const arr = submissions.get(sdt) || [];
  const recent = arr.filter(t => now - t < day);
  submissions.set(sdt, recent);
  return recent.length >= 5;
}

function recordSubmission(sdt) {
  const arr = submissions.get(sdt) || [];
  arr.push(Date.now());
  submissions.set(sdt, arr);
}

// Validate Vietnamese phone (10 digits, starts with 0)
function isValidPhone(sdt) {
  return /^0\d{9}$/.test(sdt.replace(/[.\s-]/g, ''));
}

function normalizePhone(sdt) {
  return sdt.replace(/[.\s-]/g, '');
}

// Package amounts (VNĐ)
const PACKAGE_AMOUNTS = {
  active:  499000,
  founder: 1999000,
  renewal: 499000,
};

module.exports = (db) => {

  /**
   * POST /api/leads
   * Body: { ten, sdt, email, zalo, goi }
   * Return: { success, lead_id, message }
   */
  router.post('/', async (req, res) => {
    try {
      const { ten, sdt, email, zalo, goi } = req.body;

      // Validation
      if (!ten || !sdt || !goi) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đủ Tên, SĐT, và Gói.'
        });
      }

      if (!isValidPhone(sdt)) {
        return res.status(400).json({
          success: false,
          message: 'SĐT không hợp lệ. Định dạng: 09xxxxxxxx (10 số)'
        });
      }

      if (!PACKAGE_AMOUNTS[goi]) {
        return res.status(400).json({
          success: false,
          message: 'Gói không hợp lệ. Chọn: active hoặc founder.'
        });
      }

      const cleanSdt = normalizePhone(sdt);

      if (isRateLimited(cleanSdt)) {
        return res.status(429).json({
          success: false,
          message: 'Quá nhiều lần submit. Vui lòng thử lại sau 24h.'
        });
      }

      const amount = PACKAGE_AMOUNTS[goi];
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const ua = req.headers['user-agent'] || '';
      const ref = req.headers['referer'] || '';

      // Insert vào DB
      const stmt = db.prepare(`
        INSERT INTO leads (ten, sdt, email, zalo, goi, amount, ip_address, user_agent, referer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        ten.trim(),
        cleanSdt,
        email ? email.trim().toLowerCase() : null,
        zalo ? normalizePhone(zalo) : null,
        goi,
        amount,
        ip,
        ua,
        ref
      );

      const leadId = result.lastInsertRowid;
      recordSubmission(cleanSdt);

      // Fetch full record để notify
      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);

      // Async notify Khang (không block response)
      setImmediate(() => {
        notification.notifyKhang(lead, db).catch(err => {
          console.error('[leads] Notification failed:', err);
        });
      });

      res.json({
        success: true,
        lead_id: leadId,
        message: `Đã ghi nhận đơn của anh/chị ${ten}. Sau khi chuyển khoản, chúng tôi sẽ kích hoạt trong 2-4 giờ và gửi Zalo/SMS link kích hoạt.`,
        payment_info: {
          bank: 'Techcombank',
          account: '11522026076011',
          account_name: 'CONG TY CO PHAN VINET',
          amount: amount,
          transfer_note: `SOL ${cleanSdt}` // Nội dung chuyển khoản chuẩn
        }
      });

    } catch (err) {
      console.error('[POST /leads] Error:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống. Vui lòng thử lại hoặc liên hệ Zalo 0912727381.'
      });
    }
  });

  return router;
};
