<?php
/**
 * SOL — Master Footer v3 (Thân · Tâm · Trí)
 * ============================================================================
 * 4 zone: Brand · 5-col Nav · Safety+Disclaimer merged · Copyright
 *
 * Cài đặt:
 *   1. Copy file này vào theme: /wp-content/themes/sol-theme/footer.php
 *   2. Đảm bảo template có gọi <?php wp_footer(); ?> trước </body>
 *   3. Đảm bảo có các page: /khang-sol/, /ve-sol/, /chinh-sach-bao-mat/, ...
 *   4. Optional: tạo nav menu "footer-than", "footer-tam", "footer-tri" trong
 *      Appearance → Menus để override hard-coded links (xem hàm sol_footer_links).
 *
 * Last updated: 2026-06-16
 * ============================================================================
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Bảo mật

/**
 * Helper: render nav links cho 1 trụ.
 * Ưu tiên WP menu nếu có (cho phép edit qua admin), fallback hard-coded.
 */
function sol_footer_links( $menu_location, $fallback = array() ) {
    if ( has_nav_menu( $menu_location ) ) {
        wp_nav_menu( array(
            'theme_location' => $menu_location,
            'container'      => false,
            'menu_class'     => 'sol-footer-col-menu',
            'depth'          => 1,
        ) );
    } else {
        echo '<ul>';
        foreach ( $fallback as $item ) {
            printf(
                '<li><a href="%s"%s>%s</a></li>',
                esc_url( $item['url'] ),
                ! empty( $item['target'] ) ? ' target="_blank" rel="noopener"' : '',
                wp_kses_post( $item['label'] )
            );
        }
        echo '</ul>';
    }
}
?>
</main><!-- /#primary -->

<footer class="sol-footer" role="contentinfo">
  <div class="sol-footer-inner">

    <!-- ───────────────────────────────────────────────────────────── -->
    <!-- ZONE 1: BRAND BLOCK                                            -->
    <!-- ───────────────────────────────────────────────────────────── -->
    <div class="sol-footer-brand">
      <div class="sol-footer-brand-left">
        <div class="sol-footer-logo" aria-hidden="true">🌅</div>
        <div class="sol-footer-brand-text">
          <strong><?php echo esc_html( get_bloginfo( 'name' ) ); ?></strong>
          <span><?php esc_html_e( 'sol.vn · 3 trụ Thân · Tâm · Trí', 'sol' ); ?></span>
        </div>
      </div>
      <p class="sol-footer-brand-pitch">
        <?php esc_html_e( 'Sol đồng hành đàn ông Việt 45+ trên 3 trụ cột:', 'sol' ); ?>
        <strong><?php esc_html_e( 'Thân', 'sol' ); ?></strong>
        (<?php esc_html_e( 'sức khoẻ thể chất', 'sol' ); ?>) ·
        <strong><?php esc_html_e( 'Tâm', 'sol' ); ?></strong>
        (<?php esc_html_e( 'sức khoẻ tinh thần', 'sol' ); ?>) ·
        <strong><?php esc_html_e( 'Trí', 'sol' ); ?></strong>
        (<?php esc_html_e( 'hướng đi sự nghiệp', 'sol' ); ?>).
        <?php esc_html_e( 'Đi qua từng giai đoạn của 1 con người — không hô hào, không giáo điều.', 'sol' ); ?>
      </p>
    </div>

    <!-- ───────────────────────────────────────────────────────────── -->
    <!-- ZONE 2: 5-COLUMN NAV                                           -->
    <!-- ───────────────────────────────────────────────────────────── -->
    <nav class="sol-footer-nav" aria-label="<?php esc_attr_e( 'Sol footer navigation', 'sol' ); ?>">

      <!-- Col 1: Trụ Thân -->
      <div class="sol-footer-col sol-footer-col--than">
        <h4>🌱 <?php esc_html_e( 'Trụ Thân', 'sol' ); ?></h4>
        <?php sol_footer_links( 'footer-than', array(
          array( 'url' => 'https://bothuocla.sol.vn/test-ftnd', 'label' => '<strong>Đo FTND</strong>' ),
          array( 'url' => home_url( '/lo-trinh-cai-thuoc-la-khoa-hoc-7-ngay/' ), 'label' => 'Lộ trình 7 ngày' ),
          array( 'url' => home_url( '/tai-sao-cai-thuoc-la-lai-bi-ho-co-dom/' ), 'label' => 'Ho có đờm khi cai' ),
          array( 'url' => home_url( '/tac-hai-thuoc-la-thu-dong-doi-voi-tre-nho/' ), 'label' => 'Hút thụ động' ),
          array( 'url' => home_url( '/category/wiki-bo-thuoc-la/' ), 'label' => 'Wiki Bỏ thuốc' ),
          array( 'url' => 'https://bothuocla.sol.vn/', 'label' => '→ App bothuocla', 'target' => true ),
        ) ); ?>
      </div>

      <!-- Col 2: Trụ Tâm -->
      <div class="sol-footer-col sol-footer-col--tam">
        <h4>💭 <?php esc_html_e( 'Trụ Tâm', 'sol' ); ?></h4>
        <?php sol_footer_links( 'footer-tam', array(
          array( 'url' => home_url( '/category/ngam/' ), 'label' => '<strong>Đọc Tâm</strong>' ),
          array( 'url' => home_url( '/stress-tuoi-trung-nien-va-cai-bay-khoi-thuoc/' ), 'label' => 'Stress &amp; khói thuốc' ),
          array( 'url' => home_url( '/khoi-nghiep-tuoi-40-khang-dinh-ban-than/' ), 'label' => 'Khẳng định 40+' ),
          array( 'url' => home_url( '/khang-sol/#chuong-4' ), 'label' => '5 năm Tự do' ),
          array( 'url' => home_url( '/category/ngam/' ), 'label' => 'Wiki Tâm an U45' ),
        ) ); ?>
      </div>

      <!-- Col 3: Trụ Trí -->
      <div class="sol-footer-col sol-footer-col--tri">
        <h4>🚀 <?php esc_html_e( 'Trụ Trí', 'sol' ); ?></h4>
        <?php sol_footer_links( 'footer-tri', array(
          array( 'url' => 'https://huongdi.sol.vn/p1', 'label' => '<strong>Khám phá DNA</strong>' ),
          array( 'url' => home_url( '/tuong-kinh-doanh-it-von-nguoi-trung-nien/' ), 'label' => 'Kinh doanh ít vốn' ),
          array( 'url' => home_url( '/khoi-nghiep-tinh-gon-tuoi-trung-nien-it-von/' ), 'label' => 'Khởi nghiệp tinh gọn' ),
          array( 'url' => home_url( '/khoi-nghiep-trung-nien/von-100-trieu/' ), 'label' => 'Khám phá vốn 100M' ),
          array( 'url' => home_url( '/category/khoi-nghiep/' ), 'label' => 'Wiki Khởi nghiệp' ),
          array( 'url' => 'https://huongdi.sol.vn/', 'label' => '→ App huongdi', 'target' => true ),
        ) ); ?>
      </div>

      <!-- Col 4: Về Sol -->
      <div class="sol-footer-col sol-footer-col--about">
        <h4>📖 <?php esc_html_e( 'Về Sol', 'sol' ); ?></h4>
        <?php sol_footer_links( 'footer-about', array(
          array( 'url' => home_url( '/khang-sol/' ), 'label' => '<strong>Câu chuyện Khang Sol</strong>' ),
          array( 'url' => home_url( '/ve-sol/' ), 'label' => 'Về dự án Sol' ),
          array( 'url' => home_url( '/sol-la-gi/' ), 'label' => 'Sol làm gì cho anh' ),
          array( 'url' => home_url( '/cau-hoi/' ), 'label' => '21 câu hỏi thường gặp' ),
          array( 'url' => home_url( '/gia/' ), 'label' => 'Bảng giá Sol Premium' ),
          array( 'url' => home_url( '/cong-dong/' ), 'label' => 'Cộng đồng Sol' ),
        ) ); ?>
      </div>

      <!-- Col 5: Liên hệ -->
      <div class="sol-footer-col sol-footer-col--contact">
        <h4>📞 <?php esc_html_e( 'Liên hệ', 'sol' ); ?></h4>
        <span class="sol-footer-contact-line">
          <strong><?php esc_html_e( 'Điện thoại', 'sol' ); ?></strong>
          <a href="tel:02439931800">024 3993 1800</a>
        </span>
        <span class="sol-footer-contact-line">
          <strong><?php esc_html_e( 'Email', 'sol' ); ?></strong>
          <a href="mailto:contact@sol.vn">contact@sol.vn</a>
        </span>
        <span class="sol-footer-contact-line">
          <strong><?php esc_html_e( 'Cộng đồng Zalo', 'sol' ); ?></strong>
          <a href="<?php echo esc_url( get_option( 'sol_zalo_group_url', 'https://zalo.me/g/sol' ) ); ?>" target="_blank" rel="noopener">
            <?php esc_html_e( 'Zalo group Sol', 'sol' ); ?>
          </a>
        </span>
        <span class="sol-footer-contact-line">
          <strong><?php esc_html_e( 'Mạng xã hội', 'sol' ); ?></strong>
          <a href="https://linkedin.com/in/vietnaminternet" target="_blank" rel="noopener">LinkedIn</a> ·
          <a href="https://web.facebook.com/nguyendinhkhang" target="_blank" rel="noopener">Facebook</a>
        </span>
      </div>

    </nav>

    <!-- ───────────────────────────────────────────────────────────── -->
    <!-- ZONE 3 (MERGED): SAFETY + TRIPLE YMYL DISCLAIMER               -->
    <!-- ───────────────────────────────────────────────────────────── -->
    <div class="sol-footer-disclaimer">

      <div class="sol-footer-safety">
        <strong class="sol-footer-safety-title">🚨 <?php esc_html_e( 'Thông tin khẩn cấp', 'sol' ); ?></strong>
        <div class="sol-footer-safety-lines">
          <span>
            <span class="sol-footer-tag-than">🌱 Thân</span>
            <?php esc_html_e( 'Cấp cứu y tế →', 'sol' ); ?>
            <a href="tel:115">115</a>
          </span>
          <span>
            <span class="sol-footer-tag-than">🌱 Thân</span>
            <?php esc_html_e( 'Cai thuốc BV Bạch Mai →', 'sol' ); ?>
            <a href="tel:0888008866">0888-008-866</a>
          </span>
          <span>
            <span class="sol-footer-tag-tam">💭 Tâm</span>
            <?php esc_html_e( 'Khủng hoảng tâm lý → Ngày Mai', 'sol' ); ?>
            <a href="tel:1900599958">1900 599958</a>
          </span>
          <span>
            <span class="sol-footer-tag-tri">🚀 Trí</span>
            <?php esc_html_e( 'Hỗ trợ DN →', 'sol' ); ?>
            <a href="https://startup.gov.vn" target="_blank" rel="noopener">startup.gov.vn</a>
            · MPI 024 3845 5298
          </span>
        </div>
      </div>

      <hr class="sol-footer-divider">

      <p>
        <strong><?php esc_html_e( 'Sol là dự án cá nhân của Khang Sol (Nguyễn Đình Khang).', 'sol' ); ?></strong>
        <?php esc_html_e( 'Sol KHÔNG kê đơn y khoa, KHÔNG điều trị tâm lý, KHÔNG cam kết thu nhập kinh doanh.', 'sol' ); ?>
      </p>
      <p>
        <span class="sol-footer-disclaimer-warn-than">⚠️ <?php esc_html_e( 'Thân (Y khoa):', 'sol' ); ?></span>
        <?php esc_html_e( 'Khang Sol KHÔNG phải bác sĩ. Triệu chứng nặng → gọi 115 hoặc khám BS chuyên khoa hô hấp.', 'sol' ); ?>
      </p>
      <p>
        <span class="sol-footer-disclaimer-warn-tam">⚠️ <?php esc_html_e( 'Tâm (Tinh thần):', 'sol' ); ?></span>
        <?php esc_html_e( 'Sol KHÔNG phải nhà trị liệu tâm lý có giấy phép. Trầm cảm, lo âu nặng, ý nghĩ tự hại → gọi Ngày Mai 1900 599958 hoặc đến BV chuyên khoa tâm thần kinh.', 'sol' ); ?>
      </p>
      <p>
        <span class="sol-footer-disclaimer-warn-tri">⚠️ <?php esc_html_e( 'Trí (Tài chính):', 'sol' ); ?></span>
        <?php esc_html_e( 'Khang Sol KHÔNG phải nhà tư vấn tài chính có giấy phép, không kê khai trước Uỷ ban Chứng khoán Nhà nước. Sol KHÔNG cam kết thu nhập. Tham vấn chuyên gia tài chính, luật sư DN, kế toán viên trước khi đầu tư.', 'sol' ); ?>
      </p>
    </div>

    <!-- ───────────────────────────────────────────────────────────── -->
    <!-- ZONE 4: TRUST PAGES + COPYRIGHT                                -->
    <!-- ───────────────────────────────────────────────────────────── -->
    <div class="sol-footer-bottom">
      <div class="sol-footer-trustlinks">
        <a href="<?php echo esc_url( home_url( '/chinh-sach-bao-mat/' ) ); ?>"><?php esc_html_e( 'Chính sách bảo mật', 'sol' ); ?></a>
        <span>·</span>
        <a href="<?php echo esc_url( home_url( '/dieu-khoan-su-dung/' ) ); ?>"><?php esc_html_e( 'Điều khoản sử dụng', 'sol' ); ?></a>
        <span>·</span>
        <a href="<?php echo esc_url( home_url( '/tuyen-bo-mien-tru/' ) ); ?>"><?php esc_html_e( 'Tuyên bố miễn trừ', 'sol' ); ?></a>
        <span>·</span>
        <a href="<?php echo esc_url( home_url( '/chinh-sach-cookie/' ) ); ?>"><?php esc_html_e( 'Chính sách Cookie', 'sol' ); ?></a>
        <span>·</span>
        <a href="<?php echo esc_url( home_url( '/lien-he/' ) ); ?>"><?php esc_html_e( 'Liên hệ', 'sol' ); ?></a>
        <span>·</span>
        <a href="<?php echo esc_url( home_url( '/khang-sol/' ) ); ?>"><?php esc_html_e( 'Khang Sol', 'sol' ); ?></a>
      </div>

      <p class="sol-footer-copyright">
        © <?php echo esc_html( date( 'Y' ) ); ?> Sol — Khang Sol (Nguyễn Đình Khang) · sol.vn
      </p>
      <p class="sol-footer-copyright">
        <?php esc_html_e( 'Sol đăng ký tại Việt Nam. Tuân thủ Luật An ninh mạng 2018, Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.', 'sol' ); ?>
      </p>

      <div class="sol-footer-sources">
        <strong><?php esc_html_e( 'Nguồn tham khảo &amp; uy tín:', 'sol' ); ?></strong>
        CDC · NHS UK · U.S. Surgeon General · WHO Mental Health · Bộ Y tế Việt Nam ·
        BV Tâm thần TW · APA · Eric Ries · Harvard Business Review · MPI Việt Nam
      </div>
    </div>

  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
