// backend/src/auth/email/template.ts
// Email template magic link — Sol identity binding.
//
// Voice: gần Khang Sol (founder), tiếng Việt 45+ phổ thông, không formal.
// Plain HTML inline-style (nhiều mail client strip <style> tag).
// Text fallback luôn có cho client không render HTML.

export interface MagicLinkTemplateParams {
  link: string;
  pronouns?: string; // "anh" | "chị" | "bạn"
  expiryMinutes?: number; // default 60
}

export function renderMagicLinkEmail({
  link,
  // Sol v3: default 'anh' thay 'bạn' — vì 95% user Sol là nam giới 30+ xưng anh.
  // Chỉ user explicit set pronouns khác (chị/em) mới override.
  pronouns = 'anh',
  expiryMinutes = 60,
}: MagicLinkTemplateParams): { subject: string; html: string; text: string } {
  const subject = 'Liên kết tài khoản Sol — bấm để đồng bộ';

  const text = `Chào ${pronouns},

Sol nhận yêu cầu liên kết tài khoản từ thiết bị này.
Bấm link bên dưới để đồng bộ hành trình của ${pronouns}:

${link}

Link có hiệu lực ${expiryMinutes} phút. Sau đó ${pronouns} có thể yêu cầu lại.

Nếu ${pronouns} KHÔNG yêu cầu link này, bỏ qua email — tài khoản ${pronouns} vẫn an toàn.

— Khang Sol
bothuocla.sol.vn

---
Sol — Bỏ thuốc lá 52 ngày · Đi cùng Khang
Email này được gửi tự động. Reply về khang@sol.vn nếu cần hỗ trợ.
`;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FBF7F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#2C2A27;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF7F0;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #D4C7A8;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#B25C2C;padding:28px 32px;text-align:center;">
              <div style="font-size:42px;line-height:1;margin-bottom:8px;">🌅</div>
              <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.01em;">
                Sol — Bỏ thuốc lá 52 ngày
              </h1>
              <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:6px 0 0;">
                Liên kết tài khoản
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:17px;line-height:1.6;margin:0 0 16px;color:#2C2A27;">
                Chào ${pronouns},
              </p>
              <p style="font-size:17px;line-height:1.6;margin:0 0 20px;color:#2C2A27;">
                Sol nhận yêu cầu liên kết tài khoản từ thiết bị của ${pronouns}.
                Bấm nút bên dưới để đồng bộ hành trình:
              </p>

              <!-- CTA button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${link}"
                       style="display:inline-block;background:#B25C2C;color:#FFFFFF;font-size:17px;font-weight:600;
                              padding:14px 32px;border-radius:12px;text-decoration:none;
                              box-shadow:0 1px 2px rgba(60,50,30,0.04),0 4px 12px rgba(60,50,30,0.06);">
                      ✓ Đồng bộ tài khoản Sol
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;line-height:1.5;color:#8A857C;margin:16px 0 0;text-align:center;">
                Hoặc copy link này:<br>
                <a href="${link}" style="color:#B25C2C;word-break:break-all;text-decoration:underline;">${link}</a>
              </p>

              <hr style="border:none;border-top:1px solid #D4C7A8;margin:28px 0;">

              <p style="font-size:14px;line-height:1.6;color:#5A5650;margin:0 0 12px;">
                Link có hiệu lực <strong>${expiryMinutes} phút</strong>. Sau đó ${pronouns} có thể yêu cầu lại trong widget.
              </p>
              <p style="font-size:14px;line-height:1.6;color:#5A5650;margin:0;">
                Nếu ${pronouns} <strong>không yêu cầu</strong> link này, bỏ qua email —
                tài khoản ${pronouns} vẫn an toàn.
              </p>

              <hr style="border:none;border-top:1px solid #D4C7A8;margin:28px 0;">

              <p style="font-size:14px;line-height:1.7;color:#2C2A27;margin:0;font-style:italic;">
                — Khang Sol<br>
                <span style="color:#8A857C;font-size:13px;font-style:normal;">Founder · bothuocla.sol.vn</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FBF7F0;padding:20px 32px;text-align:center;border-top:1px solid #D4C7A8;">
              <p style="font-size:12px;line-height:1.5;color:#8A857C;margin:0 0 6px;">
                Sol — Bỏ thuốc lá 52 ngày · Đi cùng Khang
              </p>
              <p style="font-size:11px;line-height:1.5;color:#8A857C;margin:0;">
                Email tự động · Reply về <a href="mailto:khang@sol.vn" style="color:#B25C2C;text-decoration:underline;">khang@sol.vn</a> nếu cần hỗ trợ
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
