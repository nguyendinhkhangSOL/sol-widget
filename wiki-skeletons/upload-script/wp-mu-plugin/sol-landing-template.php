<?php
/**
 * Plugin Name: Sol Landing Template
 * Description: Đăng ký page template "Sol Landing — Full HTML" cho các trang landing
 *              của Đi Cùng Sol. Template này KHÔNG render theme header/footer
 *              → Khang full control HTML từ <html> tới </html>.
 * Version:     1.0.0
 * Author:      Khang Sol
 *
 * Cài: Upload file này vào /wp-content/mu-plugins/sol-landing-template.php
 *      (mu-plugins = must-use plugins, tự kích hoạt, không cần Activate trong admin).
 *
 * Dùng:
 *   1. WordPress Admin → Pages → Add New / Edit page existing
 *   2. Sidebar phải → tab Page → Page Attributes
 *   3. Template dropdown → chọn "Sol Landing — Full HTML"
 *   4. Page sẽ render full screen, không có theme nav/footer
 *   5. CSS + JS Khang tự inject vào page content qua Custom HTML block
 *
 * Page template KHÔNG ảnh hưởng SEO plugin (Yoast/Rank Math) — meta tag vẫn tự inject.
 */

if (!defined('ABSPATH')) exit;

class Sol_Landing_Template {
    const TEMPLATE_KEY = 'sol-landing-full.php';
    const TEMPLATE_NAME = 'Sol Landing — Full HTML';

    public function __construct() {
        // Đăng ký template vào dropdown của Page editor
        add_filter('theme_page_templates', [$this, 'add_template']);

        // Override page render khi user chọn template này
        add_filter('template_include', [$this, 'load_template'], 99);
    }

    public function add_template($templates) {
        $templates[self::TEMPLATE_KEY] = self::TEMPLATE_NAME;
        return $templates;
    }

    public function load_template($template) {
        if (!is_singular('page')) return $template;

        $page_template = get_post_meta(get_the_ID(), '_wp_page_template', true);
        if ($page_template !== self::TEMPLATE_KEY) return $template;

        // Render landing template inline — không cần file riêng
        return $this->render_landing();
    }

    private function render_landing() {
        // Tạo file template tạm thời trong system temp dir, return path
        $tmp = sys_get_temp_dir() . '/sol-landing-' . get_the_ID() . '.php';
        $content = $this->landing_html();
        file_put_contents($tmp, $content);
        return $tmp;
    }

    private function landing_html() {
        return <<<'PHP'
<?php
// Sol Landing template — full HTML control, không gọi get_header() / get_footer()
the_post();
$content = get_the_content();
$title = get_the_title();
$meta_desc = get_post_meta(get_the_ID(), '_yoast_wpseo_metadesc', true);
if (empty($meta_desc)) {
    $meta_desc = get_post_meta(get_the_ID(), 'rank_math_description', true);
}
$og_image = get_the_post_thumbnail_url(get_the_ID(), 'large');
?>
<!DOCTYPE html>
<html lang="vi" <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#B25C2C">

<!-- Be Vietnam Pro — Google Fonts (Vietnamese subset, weights 400/500/600/700) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">

<?php
// Title: homepage có format đặc biệt (không em-dash thừa "X — Đi Cùng Sol — Đi Cùng Sol")
if (is_front_page() || is_home()) {
    $page_title = 'SOL — Sống Lại · Làm Lại Tốt Hơn · Đi Cùng Sol';
} else {
    $page_title = $title . ' — Đi Cùng Sol';
}
?>
<title><?php echo esc_html($page_title); ?></title>
<?php if ($meta_desc): ?>
<meta name="description" content="<?php echo esc_attr($meta_desc); ?>">
<?php endif; ?>

<meta property="og:type" content="website">
<meta property="og:title" content="<?php echo esc_attr($title); ?>">
<?php if ($meta_desc): ?>
<meta property="og:description" content="<?php echo esc_attr($meta_desc); ?>">
<?php endif; ?>
<meta property="og:url" content="<?php echo esc_url(get_permalink()); ?>">
<?php if ($og_image): ?>
<meta property="og:image" content="<?php echo esc_url($og_image); ?>">
<?php endif; ?>
<meta name="twitter:card" content="summary_large_image">

<link rel="canonical" href="<?php echo esc_url(get_permalink()); ?>">

<?php
// ─── JSON-LD Article schema (auto-inject) ───────────────────────────────
$published = get_the_date('c');
$modified = get_the_modified_date('c');
$site_name = get_bloginfo('name');
$site_url = home_url();
$logo_url = $site_url . '/logo.png'; // fallback nếu chưa có favicon

$article_schema = [
    '@context' => 'https://schema.org',
    '@type' => 'Article',
    'headline' => $title,
    'description' => $meta_desc ?: '',
    'datePublished' => $published,
    'dateModified' => $modified,
    'author' => [
        '@type' => 'Person',
        'name' => 'Khang Sol',
        'url' => $site_url . '/khang-sol',
    ],
    'publisher' => [
        '@type' => 'Organization',
        'name' => 'SOL — Đi Cùng Sol',
        'logo' => [
            '@type' => 'ImageObject',
            'url' => $logo_url,
        ],
    ],
    'mainEntityOfPage' => [
        '@type' => 'WebPage',
        '@id' => get_permalink(),
    ],
];
if ($og_image) {
    $article_schema['image'] = $og_image;
}

// ─── JSON-LD BreadcrumbList (auto-inject từ WordPress page hierarchy) ───
$post = get_post();
$crumbs = [];
$position = 1;

// Crumb 1: Home
$crumbs[] = [
    '@type' => 'ListItem',
    'position' => $position++,
    'name' => 'Trang chủ',
    'item' => $site_url,
];

// Crumb 2-N: ancestors theo page hierarchy (vd /bo-thuoc-la → /bo-thuoc-la/7-ngay)
$ancestors = array_reverse(get_post_ancestors($post));
foreach ($ancestors as $ancestor_id) {
    $ancestor = get_post($ancestor_id);
    $crumbs[] = [
        '@type' => 'ListItem',
        'position' => $position++,
        'name' => get_the_title($ancestor_id),
        'item' => get_permalink($ancestor_id),
    ];
}

// Crumb cuối: current page (không có 'item' vì là trang hiện tại)
$crumbs[] = [
    '@type' => 'ListItem',
    'position' => $position,
    'name' => $title,
];

$breadcrumb_schema = [
    '@context' => 'https://schema.org',
    '@type' => 'BreadcrumbList',
    'itemListElement' => $crumbs,
];
?>

<script type="application/ld+json"><?php echo wp_json_encode($article_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>
<script type="application/ld+json"><?php echo wp_json_encode($breadcrumb_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>

<?php
// Cho phép Yoast/Rank Math/Analytics inject head tag
// Yoast Premium tự inject Article + Breadcrumb schema khác — duplicate OK,
// Google parse 2 schema cùng type và pick 1 (thường lấy schema mới hơn).
do_action('wp_head');
?>

<style>
:root {
  --sol-clay: #B25C2C;
  --sol-gold: #B8860B;
  --sol-earth: #5C3A1E;
  --sol-bg: #FBF7F0;
  --sol-soft: #F0E5D0;
  --sol-line: #E8DFC8;
  --sol-ink: #2C2A27;
  --sol-ink-2: #5C5650;
  --sol-ink-3: #8B8580;
  --sol-red: #C62828;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-size: 17px;
  line-height: 1.7;
  color: var(--sol-ink);
  background: var(--sol-bg);
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--sol-clay); text-decoration: none; }
a:hover { text-decoration: underline; }
.sol-landing-content {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  box-sizing: border-box;
}
/* Section in-flow — fill main 1080px width. Section break-out tự stretch 100vw.
 * KHÔNG cap 720px ở đây vì inline style="margin: 48px 0" override auto margin → lệch.
 * Inner content (h2, p, table, grid) tự center bằng text-align + margin auto. */
.sol-landing-content > section,
.sol-landing-content > div,
.sol-landing-content > p {
  width: 100%;
  box-sizing: border-box;
}
/* Section break-out (100vw) — bỏ width: 100% override */
.sol-landing-content > section[style*="100vw"] {
  width: auto;
}
/* Force center inline blocks inside main */
.sol-landing-content > section > h2,
.sol-landing-content > section > h3,
.sol-landing-content > section > p {
  max-width: 720px;
  margin-left: auto !important;
  margin-right: auto !important;
}
/* Bảng + grid + container con tự center */
.sol-landing-content > section > .sol-table-wrap,
.sol-landing-content > section > div[class*="sol-grid"],
.sol-landing-content > section > div[class*="sol-card"] {
  margin-left: auto !important;
  margin-right: auto !important;
}
.sol-landing-content h1 {
  font-size: 32px;
  line-height: 1.2;
  font-weight: 700;
  margin: 24px 0 16px;
  color: var(--sol-earth);
}
.sol-landing-content h2 {
  font-size: 24px;
  line-height: 1.3;
  font-weight: 700;
  margin: 32px 0 12px;
  color: var(--sol-earth);
}
.sol-landing-content h3 {
  font-size: 19px;
  font-weight: 600;
  margin: 24px 0 8px;
}
.sol-landing-content p { margin: 12px 0; }
.sol-landing-content ul, .sol-landing-content ol { margin: 12px 0 12px 24px; }
.sol-landing-content li { margin: 6px 0; }
.sol-landing-content blockquote {
  margin: 24px 0;
  padding: 16px 20px;
  border-left: 4px solid var(--sol-gold);
  background: var(--sol-soft);
  font-style: italic;
  border-radius: 0 8px 8px 0;
}
.sol-landing-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 15px;
}
.sol-landing-content th, .sol-landing-content td {
  padding: 10px 12px;
  border: 1px solid var(--sol-line);
  text-align: left;
}
.sol-landing-content th {
  background: var(--sol-soft);
  font-weight: 600;
}
.sol-landing-content a.wp-block-button__link,
.sol-landing-content .wp-block-button__link {
  display: inline-block;
  background: var(--sol-clay);
  color: white !important;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  margin: 12px 0;
}
.sol-landing-footer {
  border-top: 1px solid var(--sol-line);
  padding: 32px 20px;
  font-size: 13px;
  color: var(--sol-ink-3);
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sol-landing-footer a { color: var(--sol-clay); }
.sol-landing-footer-inner {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}
.sol-landing-footer-emergency {
  background: #FCEEEE;
  border: 1px solid #C62828;
  border-radius: 8px;
  padding: 16px 20px;
  text-align: center;
}
.sol-landing-footer-emergency strong { color: #8B0000; }
.sol-landing-footer-emergency a { color: #8B0000; font-weight: 700; }
.sol-landing-footer-disclaimer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--sol-line);
  line-height: 1.7;
}
.sol-landing-footer-disclaimer p { margin: 0 0 8px; }
.sol-landing-footer-disclaimer p:last-child { margin: 0; opacity: 0.7; }
/* Top navigation — sticky, brand-consistent */
.sol-top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(251, 247, 240, 0.96);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--sol-line);
}
.sol-top-nav-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.sol-top-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--sol-earth);
  font-weight: 700;
  font-size: 17px;
}
.sol-top-nav-brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--sol-clay) 0%, var(--sol-gold) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.sol-top-nav-brand-text small {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--sol-ink-3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-top: -2px;
}
.sol-top-nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  flex-wrap: wrap;
}
.sol-top-nav-links a {
  padding: 8px 12px;
  color: var(--sol-ink-2);
  text-decoration: none;
  font-weight: 500;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.sol-top-nav-links a:hover {
  background: var(--sol-soft);
  color: var(--sol-earth);
}
.sol-top-nav-cta {
  background: var(--sol-clay) !important;
  color: white !important;
  font-weight: 600 !important;
  padding: 8px 16px !important;
}
.sol-top-nav-cta:hover {
  background: var(--sol-earth) !important;
  color: white !important;
}
/* ─── Responsive 5 breakpoint cho mọi thiết bị đầu cuối ───────── */

/* Desktop wide ≥1280px — full 1080 max-width */
@media (min-width: 1280px) {
  .sol-landing-content { padding: 40px 24px 100px; }
}

/* Desktop standard 1024-1279 — main 1080, padding bình thường */
@media (max-width: 1279px) {
  .sol-landing-content { max-width: 980px; }
}

/* Tablet 768-1023 — main 760, ẩn 1 link nav */
@media (max-width: 1023px) {
  .sol-landing-content { max-width: 860px; padding: 32px 20px 80px; }
  .sol-top-nav-inner { padding: 10px 18px; }
}

/* Mobile large 640-767 — main full, ẩn brand text + 2 link nav */
@media (max-width: 767px) {
  .sol-landing-content { max-width: 100%; padding: 24px 16px 64px; }
  .sol-landing-content h1 { font-size: 26px; }
  .sol-landing-content h2 { font-size: 21px; }
  .sol-landing-content h3 { font-size: 17px; }
  .sol-top-nav-inner { padding: 10px 16px; gap: 8px; }
  .sol-top-nav-brand-text { display: none; }
  .sol-top-nav-links { font-size: 13px; gap: 0; }
  .sol-top-nav-links a { padding: 6px 8px; }
  .sol-top-nav-links .sol-nav-mobile-hide { display: none; }
  /* Bảng → cuộn ngang nếu tràn */
  .sol-landing-content table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
}

/* Mobile small ≤480 — iPhone SE / điện thoại nhỏ */
@media (max-width: 480px) {
  .sol-landing-content { padding: 20px 14px 56px; }
  .sol-landing-content h1 { font-size: 24px; line-height: 1.25; }
  .sol-landing-content h2 { font-size: 19px; }
}

/* Iphone SE / 380 — extreme narrow */
@media (max-width: 380px) {
  .sol-landing-content { padding: 16px 12px 48px; }
  .sol-landing-content h1 { font-size: 22px; }
}
</style>
</head>
<body <?php body_class('sol-landing-body'); ?>>

<header class="sol-top-nav">
  <div class="sol-top-nav-inner">
    <a href="https://sol.vn" class="sol-top-nav-brand">
      <span class="sol-top-nav-brand-mark">S</span>
      <span class="sol-top-nav-brand-text">
        Đi Cùng Sol
        <small>Sống Lại · Làm Lại Tốt Hơn</small>
      </span>
    </a>
    <nav class="sol-top-nav-links" aria-label="Menu chính">
      <a href="/bo-thuoc-la">Cai thuốc</a>
      <a href="https://sol.vn/category/wiki-bo-thuoc-la/" class="sol-nav-mobile-hide">Wiki</a>
      <a href="https://sol.vn/category/ngam/" class="sol-nav-mobile-hide">Ngẫm</a>
      <a href="https://bothuocla.sol.vn" class="sol-top-nav-cta">Bắt đầu</a>
    </nav>
  </div>
</header>

<main class="sol-landing-content">
  <?php echo apply_filters('the_content', $content); ?>
</main>

<footer class="sol-landing-footer">
  <div class="sol-landing-footer-inner">

    <!-- Khẩn cấp y tế box — đỏ, nổi bật, căn giữa -->
    <div class="sol-landing-footer-emergency">
      <div><strong>🚨 Khẩn cấp y tế</strong> (đau ngực, khó thở, ngất, ho ra máu)</div>
      <div style="margin-top: 6px; font-size: 14px;">gọi <a href="tel:115" style="font-size: 17px;">115</a> NGAY</div>
      <em style="color: var(--sol-ink-3); font-size: 12px; display: block; margin-top: 8px;">KHÔNG gọi tổng đài Sol cho cấp cứu — Sol chỉ hỗ trợ app + tài khoản</em>
    </div>

    <!-- Liên hệ Sol -->
    <div style="text-align: center;">
      <div style="margin-bottom: 6px;">
        <strong style="color: var(--sol-earth); font-size: 16px;">Đi Cùng Sol</strong>
        <span style="color: var(--sol-ink-3);"> — Bỏ thuốc lá khi nào anh quyết</span>
      </div>
      <div style="font-size: 13.5px; line-height: 1.85;">
        📞 <a href="tel:02439931800" style="font-weight: 600;">024 3993 1800</a> <span style="color: var(--sol-ink-3); font-size: 12px;">(giờ hành chính)</span><br>
        ✉️ <a href="mailto:contact@sol.vn" style="font-weight: 600;">contact@sol.vn</a>
      </div>
    </div>

    <!-- 5 link nội bộ -->
    <div style="text-align: center; font-size: 13px; line-height: 2.1;">
      <a href="/chinh-sach-bao-mat">Chính Sách Bảo Mật</a> ·
      <a href="/dieu-khoan-su-dung">Điều Khoản Sử Dụng</a> ·
      <a href="/tuyen-bo-mien-tru">Tuyên Bố Miễn Trừ</a><br>
      <a href="https://sol.vn/category/wiki-bo-thuoc-la/">Wiki bỏ thuốc</a> ·
      <a href="https://bothuocla.sol.vn">bothuocla.sol.vn</a>
    </div>

    <!-- Disclaimer Khang -->
    <div class="sol-landing-footer-disclaimer" style="font-size: 12px;">
      <p><strong>Sol là dự án cá nhân của Khang Sol</strong> — không phải sản phẩm y tế. <strong>Khang KHÔNG phải bác sĩ</strong>, không có bằng cấp y khoa.</p>
      <p>Sol KHÔNG kê đơn, KHÔNG chẩn đoán. Số liệu khoa học là tham khảo, không thay tham vấn bác sĩ.</p>
      <p>Tổng đài cai thuốc miễn phí BV Bạch Mai: <a href="tel:0888008866" style="font-weight: 600;">0888-008-866</a> <span style="opacity: 0.7;">(Sol KHÔNG có hợp tác chính thức — chỉ giới thiệu)</span></p>
      <p>© 2026 Sol — Khang Sol (Nguyễn Đình Khang)</p>
    </div>

  </div>
</footer>

<?php
// Cho phép plugin inject footer (Analytics, Pixel)
do_action('wp_footer');
?>

<!-- ─── Sol Widget loaded via separate mu-plugin sol-widget-embed.php ─
     Để widget hiện trên TOÀN site sol.vn (kể cả wiki posts không
     dùng template này), em tách script sang mu-plugin riêng
     hook wp_footer global. Template này KHÔNG load widget. -->

<!-- ─── JWT transfer cross-domain — sol.vn → bothuocla.sol.vn ───────
     User chat với Sol Widget trên sol.vn → có anon JWT lưu
     localStorage origin sol.vn. Khi click CTA sang bothuocla.sol.vn,
     forward JWT qua URL params để bothuocla ingest → giữ chat history. -->
<script>
(function() {
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href*="bothuocla.sol.vn"]');
    if (!link) return;
    try {
      var token = localStorage.getItem('sol_token');
      var deviceUid = localStorage.getItem('sol_device_uid');
      if (!token) return;
      var url = new URL(link.href);
      if (url.searchParams.has('sol_token')) return;
      url.searchParams.set('sol_token', token);
      if (deviceUid) url.searchParams.set('sol_device_uid', deviceUid);
      link.href = url.toString();
    } catch (err) {
      console.warn('Sol JWT forward failed', err);
    }
  }, true);
})();
</script>

</body>
</html>
PHP;
    }
}

new Sol_Landing_Template();
