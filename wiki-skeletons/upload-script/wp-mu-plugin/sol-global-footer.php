<?php
/**
 * Plugin Name: Sol Global Footer Override
 * Description: Inject Sol footer chuẩn vào MỌI trang WordPress (kể cả Wiki posts,
 *              Category, Archive, Author, 404...) — override footer của News Magazine X
 *              theme bằng CSS hide + JS inject. Đảm bảo footer Sol đồng nhất 100%
 *              toàn site (landing 05 + 3 trang pháp lý + bài Wiki + posts + categories).
 * Version:     1.0.0
 * Author:      Khang Sol
 *
 * Cài: Upload vào /wp-content/mu-plugins/sol-global-footer.php
 *      (mu-plugins tự kích hoạt, không cần Activate trong admin)
 *
 * Sau khi cài: footer Sol thay thế hoàn toàn footer theme. Hard refresh để verify.
 *
 * Footer Sol có:
 *   - Khẩn cấp y tế box đỏ (115)
 *   - Tổng đài Sol 024 3993 1800 + email contact@sol.vn
 *   - 3 link pháp lý + Wiki + bothuocla.sol.vn
 *   - Disclaimer Khang KHÔNG bác sĩ + BV Bạch Mai
 *   - Copyright Sol
 *
 * Skip nếu page dùng template "Sol Landing — Full HTML" hoặc "Sol Default — Page Standard"
 * (2 template này đã có footer riêng).
 */

if (!defined('ABSPATH')) exit;

class Sol_Global_Footer {

    public function __construct() {
        // Inject CSS để hide theme footer + style Sol footer
        add_action('wp_head', [$this, 'inject_css'], 100);

        // Inject Sol footer HTML cuối body (trước </body>)
        add_action('wp_footer', [$this, 'inject_footer'], 5);
    }

    /**
     * Skip injection nếu page đang dùng Sol custom templates
     * (đã có footer Sol riêng — tránh duplicate).
     */
    private function should_skip() {
        if (!is_singular('page')) return false;

        $page_template = get_post_meta(get_the_ID(), '_wp_page_template', true);

        // 2 template Sol đã có footer riêng
        $sol_templates = ['sol-landing-full.php', 'sol-default-page.php'];

        return in_array($page_template, $sol_templates, true);
    }

    public function inject_css() {
        if ($this->should_skip()) return;
        ?>
<style id="sol-global-footer-css">
/* Hide footer mặc định của theme News Magazine X */
body > footer,
body .site-footer,
body .footer-wrapper,
body #colophon,
body .copyright-bar,
body .footer-bottom,
body .site-info {
  display: none !important;
}

/* Sol footer styling */
.sol-global-footer {
  background: #FFFFFF;
  border-top: 1px solid #E8DFC8;
  padding: 32px 20px;
  margin-top: 40px;
  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sol-global-footer-inner {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  font-size: 13px;
  color: #8B8580;
}
.sol-global-footer a { color: #B25C2C; text-decoration: none; }
.sol-global-footer a:hover { text-decoration: underline; }
.sol-global-footer-emergency {
  background: #FCEEEE;
  border: 1px solid #C62828;
  border-radius: 8px;
  padding: 16px 20px;
  text-align: center;
  color: #2C2A27;
}
.sol-global-footer-emergency strong { color: #8B0000; }
.sol-global-footer-emergency a { color: #8B0000; font-weight: 700; }
.sol-global-footer-emergency em {
  display: block; margin-top: 8px; font-size: 12px; color: #8B8580; font-style: italic;
}
.sol-global-footer-section { color: #2C2A27; text-align: center; }
.sol-global-footer-brand { font-size: 16px; font-weight: 700; color: #5C3A1E; }
.sol-global-footer-brand-tag { color: #8B8580; font-weight: 400; }
.sol-global-footer-contact { margin-top: 8px; font-size: 13.5px; line-height: 1.85; }
.sol-global-footer-links { font-size: 13px; line-height: 2.1; text-align: center; }
.sol-global-footer-disclaimer {
  font-size: 12px; line-height: 1.7; padding-top: 16px;
  border-top: 1px solid #E8DFC8; text-align: center;
}
.sol-global-footer-disclaimer p { margin: 0 0 8px; }
.sol-global-footer-disclaimer p:last-child { margin: 0; opacity: 0.7; }
.sol-global-footer-disclaimer strong { color: #2C2A27; }
.sol-global-footer-disclaimer a { color: #B25C2C; font-weight: 600; }
</style>
        <?php
    }

    public function inject_footer() {
        if ($this->should_skip()) return;
        ?>
<footer class="sol-global-footer" role="contentinfo" aria-label="Sol Footer">
  <div class="sol-global-footer-inner">

    <!-- Khẩn cấp y tế -->
    <div class="sol-global-footer-emergency">
      <div><strong>🚨 Khẩn cấp y tế</strong> (đau ngực, khó thở, ngất, ho ra máu)</div>
      <div style="margin-top: 6px; font-size: 14px;">gọi <a href="tel:115" style="font-size: 17px;">115</a> NGAY</div>
      <em>KHÔNG gọi tổng đài Sol cho cấp cứu — Sol chỉ hỗ trợ app + tài khoản</em>
    </div>

    <!-- Liên hệ Sol -->
    <div class="sol-global-footer-section">
      <div style="margin-bottom: 6px;">
        <span class="sol-global-footer-brand">Đi Cùng Sol</span>
        <span class="sol-global-footer-brand-tag"> — Bỏ thuốc lá khi nào anh quyết</span>
      </div>
      <div class="sol-global-footer-contact">
        📞 <a href="tel:02439931800" style="font-weight: 600;">024 3993 1800</a> <span style="color: #8B8580; font-size: 12px;">(giờ hành chính)</span><br>
        ✉️ <a href="mailto:contact@sol.vn" style="font-weight: 600;">contact@sol.vn</a>
      </div>
    </div>

    <!-- 5 link nội bộ -->
    <div class="sol-global-footer-links">
      <a href="/chinh-sach-bao-mat">Chính Sách Bảo Mật</a> ·
      <a href="/dieu-khoan-su-dung">Điều Khoản Sử Dụng</a> ·
      <a href="/tuyen-bo-mien-tru">Tuyên Bố Miễn Trừ</a><br>
      <a href="https://sol.vn/category/wiki-bo-thuoc-la/">Wiki bỏ thuốc</a> ·
      <a href="https://bothuocla.sol.vn">bothuocla.sol.vn</a>
    </div>

    <!-- Disclaimer Khang -->
    <div class="sol-global-footer-disclaimer">
      <p><strong>Sol là dự án cá nhân của Khang Sol</strong> — không phải sản phẩm y tế. <strong>Khang KHÔNG phải bác sĩ</strong>, không có bằng cấp y khoa.</p>
      <p>Sol KHÔNG kê đơn, KHÔNG chẩn đoán. Số liệu khoa học là tham khảo, không thay tham vấn bác sĩ.</p>
      <p>Tổng đài cai thuốc miễn phí BV Bạch Mai: <a href="tel:0888008866" style="font-weight: 600;">0888-008-866</a> <span style="opacity: 0.7;">(Sol KHÔNG có hợp tác chính thức — chỉ giới thiệu).</span></p>
      <p>© 2026 Sol — Khang Sol (Nguyễn Đình Khang) · <a href="https://sol.vn">sol.vn</a></p>
    </div>

  </div>
</footer>
        <?php
    }
}

new Sol_Global_Footer();
