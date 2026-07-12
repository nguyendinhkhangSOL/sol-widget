<?php
/**
 * Template Name: Sol Homepage v3 — Thân · Tâm · Trí
 * Template Post Type: page
 * ============================================================================
 * Page template for sol.vn front-page.
 *
 * Cách dùng:
 *   1. Upload file vào theme: /wp-content/themes/sol-theme/template-homepage-than-tam-tri.php
 *   2. Admin → Pages → Add New
 *      Title: "Đi Cùng Sol Homepage"
 *      Page Attributes → Template: "Sol Homepage v3 — Thân · Tâm · Trí"
 *      Publish
 *   3. Admin → Settings → Reading → Front page displays:
 *      "A static page" → Front page: chọn page vừa tạo
 *
 * Last updated: 2026-06-16
 * ============================================================================
 */

if ( ! defined( 'ABSPATH' ) ) exit;

get_header();

// Schema.org JSON-LD injection
add_action( 'wp_footer', 'sol_homepage_schema', 5 );
function sol_homepage_schema() {
    if ( ! is_page_template( 'template-homepage-than-tam-tri.php' ) ) return;

    $org = array(
        '@context' => 'https://schema.org',
        '@type' => 'Organization',
        'name' => 'Đi Cùng Sol',
        'alternateName' => 'Sol',
        'url' => home_url( '/' ),
        'logo' => 'https://sol.vn/wp-content/uploads/2025/05/Icon_2.png',
        'description' => 'Hệ sinh thái đồng hành đàn ông Việt 45+ trên 3 trụ Thân–Tâm–Trí.',
        'founder' => array(
            '@type' => 'Person',
            'name' => 'Khang Sol',
            'alternateName' => 'Nguyễn Đình Khang',
            'url' => home_url( '/khang-sol/' ),
            'image' => 'https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg',
            'jobTitle' => 'Founder, Đi Cùng Sol',
            'sameAs' => array(
                'https://www.linkedin.com/in/vietnaminternet/',
                'https://web.facebook.com/nguyendinhkhang',
            ),
            'knowsAbout' => array(
                'Smoking cessation',
                'Nicotine dependence (FTND)',
                'Mid-life mental wellness',
                'Lean startup',
                'IT project management',
            ),
        ),
        'sameAs' => array(
            'https://www.linkedin.com/in/vietnaminternet/',
            'https://web.facebook.com/nguyendinhkhang',
        ),
        'contactPoint' => array(
            '@type' => 'ContactPoint',
            'telephone' => '+84-24-3993-1800',
            'email' => 'contact@sol.vn',
            'contactType' => 'customer service',
            'availableLanguage' => 'Vietnamese',
        ),
    );

    $website = array(
        '@context' => 'https://schema.org',
        '@type' => 'WebSite',
        'name' => 'Đi Cùng Sol',
        'url' => home_url( '/' ),
        'inLanguage' => 'vi-VN',
        'publisher' => array(
            '@type' => 'Organization',
            'name' => 'Đi Cùng Sol',
            'url' => home_url( '/' ),
        ),
    );

    echo "\n<script type=\"application/ld+json\">\n";
    echo wp_json_encode( $org, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
    echo "\n</script>\n";
    echo "<script type=\"application/ld+json\">\n";
    echo wp_json_encode( $website, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
    echo "\n</script>\n";
}
?>

<main id="primary" class="sol-homepage-container">

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- BLOCK 1: HERO — 3 TRỤ CỘT THÂN-TÂM-TRÍ                                 -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
<section class="sol-hero">
  <div class="sol-hero-sun" aria-hidden="true">🌅</div>
  <h1><?php esc_html_e( 'Đi Cùng Sol — Tái thiết U45 theo Thân · Tâm · Trí', 'sol' ); ?></h1>
  <p class="sol-hero-tagline">
    <?php esc_html_e( 'Đồng hành đàn ông Việt 45+ trên', 'sol' ); ?>
    <strong><?php esc_html_e( '3 trụ cột', 'sol' ); ?></strong>:
    <?php esc_html_e( 'Thân (sức khoẻ thể chất), Tâm (sức khoẻ tinh thần), Trí (hướng đi sự nghiệp). Không hô hào — chọn 1 trụ để bắt đầu hôm nay.', 'sol' ); ?>
  </p>

  <div class="sol-hero-ctas">
    <a href="https://bothuocla.sol.vn/test-ftnd?utm_source=sol_homepage&utm_medium=hero&utm_campaign=than"
       class="sol-hero-cta sol-hero-cta--than">
      <span class="sol-hero-cta-emoji" aria-hidden="true">🌱</span>
      <span class="sol-hero-cta-pillar">Trụ THÂN</span>
      <div class="sol-hero-cta-title"><?php esc_html_e( 'Bỏ thuốc lá', 'sol' ); ?></div>
      <div class="sol-hero-cta-desc"><?php esc_html_e( 'Đo Mức Lệ Thuộc Nicotin · 90 giây · 6 câu', 'sol' ); ?></div>
      <div class="sol-hero-cta-arrow"><?php esc_html_e( 'Bắt đầu →', 'sol' ); ?></div>
    </a>

    <a href="<?php echo esc_url( home_url( '/category/ngam/?utm_source=sol_homepage&utm_medium=hero&utm_campaign=tam' ) ); ?>"
       class="sol-hero-cta sol-hero-cta--tam">
      <span class="sol-hero-cta-emoji" aria-hidden="true">💭</span>
      <span class="sol-hero-cta-pillar">Trụ TÂM</span>
      <div class="sol-hero-cta-title"><?php esc_html_e( 'Bình tâm U45', 'sol' ); ?></div>
      <div class="sol-hero-cta-desc"><?php esc_html_e( 'Đọc Tâm · Sức khoẻ tinh thần · Định nghĩa lại bản thân', 'sol' ); ?></div>
      <div class="sol-hero-cta-arrow"><?php esc_html_e( 'Khám phá →', 'sol' ); ?></div>
    </a>

    <a href="https://huongdi.sol.vn/p1?utm_source=sol_homepage&utm_medium=hero&utm_campaign=tri"
       class="sol-hero-cta sol-hero-cta--tri">
      <span class="sol-hero-cta-emoji" aria-hidden="true">🚀</span>
      <span class="sol-hero-cta-pillar">Trụ TRÍ</span>
      <div class="sol-hero-cta-title"><?php esc_html_e( 'Tìm hướng đi', 'sol' ); ?></div>
      <div class="sol-hero-cta-desc"><?php esc_html_e( 'DNA hướng đi · 20 câu · 5 phút · 37 hướng', 'sol' ); ?></div>
      <div class="sol-hero-cta-arrow"><?php esc_html_e( 'Bắt đầu →', 'sol' ); ?></div>
    </a>
  </div>

  <p class="sol-hero-secondary">
    <?php esc_html_e( 'Mới biết Sol?', 'sol' ); ?>
    <a href="<?php echo esc_url( home_url( '/ve-sol/' ) ); ?>"><?php esc_html_e( 'Đọc Sol làm gì cho anh →', 'sol' ); ?></a>
  </p>
</section>

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- BLOCK 2: NARRATIVE                                                     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
<section class="sol-narrative">
  <h2 class="sol-narrative-title"><?php esc_html_e( 'Vì sao Thân · Tâm · Trí — 1 người đi trước', 'sol' ); ?></h2>
  <p class="sol-narrative-body">
    <?php esc_html_e( 'Ở tuổi U45, mình nhận ra: không thể chỉ chữa', 'sol' ); ?>
    <strong>Thân</strong> <?php esc_html_e( 'mà bỏ qua', 'sol' ); ?>
    <strong>Tâm</strong>, <?php esc_html_e( 'cũng không thể chỉ làm', 'sol' ); ?>
    <strong>Trí</strong> <?php esc_html_e( 'mà thân tâm kiệt quệ. Ba thứ ràng với nhau như kiềng 3 chân.', 'sol' ); ?>
    <br><br>
    <?php esc_html_e( 'Mình đi qua cả ba:', 'sol' ); ?>
    <strong>Thân</strong> — 30 năm hút Vinataba, 5 năm Tự do.
    <strong>Tâm</strong> — <?php esc_html_e( '5 năm đó, mình hiểu thêm về định nghĩa lại bản thân.', 'sol' ); ?>
    <strong>Trí</strong> — 20+ năm CNTT, <?php esc_html_e( 'giờ tái khởi nghiệp lại.', 'sol' ); ?>
    <br><br>
    <?php esc_html_e( 'Sol không chia 3 sản phẩm rời rạc — Sol đi cùng anh em qua từng giai đoạn của 1 con người.', 'sol' ); ?>
    <em>— Khang Sol, người sáng lập</em>
  </p>
</section>

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- BLOCK 3: 3 TRỤ CỘT chi tiết                                            -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
<h2 class="sol-pillars-title"><?php esc_html_e( '3 trụ cột — Cho 3 hành trình', 'sol' ); ?></h2>
<p class="sol-pillars-sub"><?php esc_html_e( 'Chọn trụ cột phù hợp với giai đoạn hiện tại của anh.', 'sol' ); ?></p>

<div class="sol-pillars-grid">

  <article class="sol-pillar-card sol-pillar--than">
    <div class="sol-pillar-emoji">🌱</div>
    <div class="sol-pillar-eyebrow"><?php esc_html_e( 'Trụ Thân — Sức khoẻ thể chất', 'sol' ); ?></div>
    <h3 class="sol-pillar-title">Bothuocla.sol.vn</h3>
    <p class="sol-pillar-subtitle"><?php esc_html_e( 'Bỏ thuốc lá khoa học cho U45', 'sol' ); ?></p>
    <p class="sol-pillar-desc">
      <?php esc_html_e( 'Lộ trình cai thuốc cá nhân hoá theo Mức Lệ Thuộc Nicotin (FTND). 3 cohort 35/52/65 ngày tuỳ độ nặng.', 'sol' ); ?>
    </p>
    <ul class="sol-pillar-bullets">
      <li><?php esc_html_e( 'Voice Khang Sol đọc thật — không bot', 'sol' ); ?></li>
      <li><?php esc_html_e( 'Nhật ký + check-in qua Zalo OA', 'sol' ); ?></li>
      <li><?php esc_html_e( 'Sổ Lưu Niệm khi hoàn thành', 'sol' ); ?></li>
      <li><?php esc_html_e( 'Cộng đồng cùng cai', 'sol' ); ?></li>
    </ul>
    <a href="https://bothuocla.sol.vn/test-ftnd?utm_source=sol_homepage&utm_medium=pillar_than" class="sol-pillar-cta">
      <?php esc_html_e( 'Đo FTND miễn phí →', 'sol' ); ?>
    </a>
    <p class="sol-pillar-status"><?php esc_html_e( 'App đang chạy · 35-65 ngày cohort', 'sol' ); ?></p>
  </article>

  <article class="sol-pillar-card sol-pillar--tam">
    <div class="sol-pillar-emoji">💭</div>
    <div class="sol-pillar-eyebrow"><?php esc_html_e( 'Trụ Tâm — Sức khoẻ tinh thần', 'sol' ); ?></div>
    <h3 class="sol-pillar-title">Tâm.sol.vn</h3>
    <p class="sol-pillar-subtitle"><?php esc_html_e( 'Bình tâm và định nghĩa lại bản thân', 'sol' ); ?></p>
    <p class="sol-pillar-desc">
      <?php esc_html_e( 'Bài viết về sức khoẻ tinh thần, stress trung niên, mindfulness, triết lý đời thường. Kế thừa kinh nghiệm thật của Khang.', 'sol' ); ?>
    </p>
    <ul class="sol-pillar-bullets">
      <li><?php esc_html_e( 'Stress & cái bẫy khói thuốc', 'sol' ); ?></li>
      <li><?php esc_html_e( 'Khẳng định bản thân tuổi 40+', 'sol' ); ?></li>
      <li><?php esc_html_e( '5 năm Tự do — học được gì', 'sol' ); ?></li>
      <li><?php esc_html_e( 'Đối thoại với chính mình (sắp ra)', 'sol' ); ?></li>
    </ul>
    <a href="<?php echo esc_url( home_url( '/category/ngam/?utm_source=sol_homepage&utm_medium=pillar_tam' ) ); ?>" class="sol-pillar-cta">
      <?php esc_html_e( 'Đọc chuyên mục Tâm →', 'sol' ); ?>
    </a>
    <p class="sol-pillar-status"><?php esc_html_e( 'Content cluster · App riêng sẽ phát triển sau', 'sol' ); ?></p>
  </article>

  <article class="sol-pillar-card sol-pillar--tri">
    <div class="sol-pillar-emoji">🚀</div>
    <div class="sol-pillar-eyebrow"><?php esc_html_e( 'Trụ Trí — Hướng đi sự nghiệp', 'sol' ); ?></div>
    <h3 class="sol-pillar-title">Huongdi.sol.vn</h3>
    <p class="sol-pillar-subtitle"><?php esc_html_e( 'Tìm hướng tái khởi nghiệp U45', 'sol' ); ?></p>
    <p class="sol-pillar-desc">
      <?php esc_html_e( 'Direction Discovery Engine. Trắc nghiệm DNA cá nhân + nguồn lực → 37 hướng đi xếp hạng theo % phù hợp.', 'sol' ); ?>
    </p>
    <ul class="sol-pillar-bullets">
      <li>P1: <?php esc_html_e( '20 câu DNA cá nhân (4 trục)', 'sol' ); ?></li>
      <li>P2: <?php esc_html_e( 'Nguồn lực hiện tại (8 trục)', 'sol' ); ?></li>
      <li>P3: <?php esc_html_e( '37 hướng đi xếp hạng', 'sol' ); ?></li>
      <li><?php esc_html_e( 'Roadmap 30/90/180 ngày', 'sol' ); ?></li>
    </ul>
    <a href="https://huongdi.sol.vn/p1?utm_source=sol_homepage&utm_medium=pillar_tri" class="sol-pillar-cta">
      <?php esc_html_e( 'Khám phá DNA — 5 phút →', 'sol' ); ?>
    </a>
    <p class="sol-pillar-status"><?php esc_html_e( 'App sắp ra mắt · 37 hướng đi', 'sol' ); ?></p>
  </article>

</div>

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- BLOCK 4: KHÁM PHÁ THEO VỐN                                             -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
<section class="sol-discovery">
  <div class="sol-discovery-head">
    <h2>🚀 <?php esc_html_e( 'Trụ Trí: Khám phá hướng đi phù hợp với vốn', 'sol' ); ?></h2>
    <p class="sol-discovery-sub">
      <?php esc_html_e( 'Chọn mốc vốn — Sol gợi ý hướng đi phù hợp (không cam kết thu nhập):', 'sol' ); ?>
    </p>
  </div>

  <div class="sol-discovery-grid">
    <?php
    $capital_chips = array(
      array( '100 triệu', 'von-100-trieu' ),
      array( '300 triệu', 'von-300-trieu' ),
      array( '500 triệu', 'von-500-trieu' ),
      array( '1 tỷ+', 'von-1-ty' ),
    );
    foreach ( $capital_chips as $chip ) :
      list( $label, $slug ) = $chip;
    ?>
      <a href="<?php echo esc_url( home_url( '/khoi-nghiep-trung-nien/' . $slug . '/' ) ); ?>" class="sol-discovery-chip">
        <span class="sol-discovery-chip-vnd">💰 Vốn <?php echo esc_html( $label ); ?></span>
        <span class="sol-discovery-chip-action"><?php esc_html_e( 'Khám phá hướng →', 'sol' ); ?></span>
      </a>
    <?php endforeach; ?>
  </div>

  <p class="sol-discovery-note">
    ⚠️ <?php esc_html_e( 'Sol không phải nhà tư vấn tài chính có giấy phép. Bài phục vụ giáo dục.', 'sol' ); ?>
  </p>
</section>

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- BLOCK 5: FOUNDER                                                       -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
<section class="sol-founder">
  <div class="sol-founder-photo">
    <img src="https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg"
         alt="<?php esc_attr_e( 'Khang Sol — đứng trước đỉnh Ngọc Long Tuyết Sơn', 'sol' ); ?>" />
  </div>

  <div class="sol-founder-content">
    <div class="sol-founder-eyebrow"><?php esc_html_e( 'Người sáng lập · 3 trụ cùng 1 con người', 'sol' ); ?></div>
    <h2>Khang Sol</h2>
    <p class="sol-founder-role">Founder, Đi Cùng Sol — Nguyễn Đình Khang</p>

    <div class="sol-founder-body">
      <p>
        <?php esc_html_e( 'Mình không phải bác sĩ. Cũng không phải nhà tư vấn tài chính. Mình là', 'sol' ); ?>
        <strong><?php esc_html_e( 'người đi trước', 'sol' ); ?></strong>
        — <?php esc_html_e( 'đã sống qua cả 3 trụ.', 'sol' ); ?>
      </p>
    </div>

    <div class="sol-founder-pillars">
      <div class="sol-founder-pillar">
        <div class="sol-founder-pillar-icon">🌱</div>
        <div class="sol-founder-pillar-name">THÂN</div>
        <div class="sol-founder-pillar-cred">30 năm hút Vinataba<br>5 năm Tự do từ 22/12/2020</div>
      </div>
      <div class="sol-founder-pillar">
        <div class="sol-founder-pillar-icon">💭</div>
        <div class="sol-founder-pillar-name">TÂM</div>
        <div class="sol-founder-pillar-cred">5 năm học định nghĩa<br>lại bản thân hậu thuốc lá</div>
      </div>
      <div class="sol-founder-pillar">
        <div class="sol-founder-pillar-icon">🚀</div>
        <div class="sol-founder-pillar-name">TRÍ</div>
        <div class="sol-founder-pillar-cred">20+ năm CNTT/SME<br>Khởi nghiệp Sol 2026</div>
      </div>
    </div>

    <a href="<?php echo esc_url( home_url( '/khang-sol/' ) ); ?>" class="sol-founder-link">
      <?php esc_html_e( 'Đọc câu chuyện đầy đủ về Khang →', 'sol' ); ?>
    </a>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- BLOCK 6: COMMUNITY                                                     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
<section class="sol-community">
  <h3>💬 <?php esc_html_e( 'Cộng đồng Sol — Sòng phẳng & Tử tế', 'sol' ); ?></h3>
  <p class="sol-community-sub">
    <?php esc_html_e( 'Zalo group cho anh em U45 đang đi trên 1 trong 3 trụ cột.', 'sol' ); ?><br>
    <?php esc_html_e( 'Không spam, không nhậu khuya, không khoe khoang. Chỉ chia sẻ thật.', 'sol' ); ?>
  </p>
  <a href="<?php echo esc_url( get_option( 'sol_zalo_group_url', 'https://zalo.me/g/sol' ) ); ?>" class="sol-community-btn" target="_blank" rel="noopener">
    🔗 <?php esc_html_e( 'Tham gia Cộng đồng Sol', 'sol' ); ?>
  </a>
</section>

</main>

<?php
// Master footer.php sẽ render tự động qua get_footer()
get_footer();
