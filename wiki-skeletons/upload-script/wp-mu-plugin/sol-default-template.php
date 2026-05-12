<?php
/**
 * Plugin Name: Sol Default — Page Standard Template
 * Description: Template chuẩn cho mọi page mới (Chính Sách, Điều Khoản, Tuyên Bố,
 *              Wiki, About, FAQ, etc.). Có header sticky + content area max 760px
 *              + footer chuẩn (3 link pháp lý + tổng đài Sol + tổng đài cấp cứu +
 *              disclaimer Khang KHÔNG bác sĩ).
 * Version:     1.0.0
 * Author:      Khang Sol
 *
 * Cài: Upload file này vào /wp-content/mu-plugins/sol-default-template.php
 *      (mu-plugins tự kích hoạt, không cần Activate trong admin)
 *
 * Dùng:
 *   1. WordPress Admin → Pages → Add New / Edit page
 *   2. Sidebar phải → Page Attributes → Template
 *   3. Chọn "Sol Default — Page Standard"
 *   4. Page tự render với header + footer Sol đồng nhất với landing 05
 *
 * Khác với "Sol Landing — Full HTML":
 *   - Landing Full HTML: full control HTML từ <html> tới </html> (cho trang chủ
 *     với hero gradient, sections màu khác nhau)
 *   - Sol Default: header + content default + footer — đơn giản, dùng cho
 *     trang text-heavy như Chính Sách, Điều Khoản, Wiki article, About...
 */

if (!defined('ABSPATH')) exit;

class Sol_Default_Template {
    const TEMPLATE_KEY = 'sol-default-page.php';
    const TEMPLATE_NAME = 'Sol Default — Page Standard';

    public function __construct() {
        add_filter('theme_page_templates', [$this, 'add_template']);
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

        $tmp = sys_get_temp_dir() . '/sol-default-' . get_the_ID() . '.php';
        $content = $this->page_html();
        file_put_contents($tmp, $content);
        return $tmp;
    }

    private function page_html() {
        return <<<'PHP'
<?php
the_post();
$content = get_the_content();
$title = get_the_title();
$meta_desc = get_post_meta(get_the_ID(), '_yoast_wpseo_metadesc', true);
if (empty($meta_desc)) {
    $meta_desc = get_post_meta(get_the_ID(), 'rank_math_description', true);
}
$og_image = get_the_post_thumbnail_url(get_the_ID(), 'large');
$page_title = $title . ' | Sol — Đi Cùng Sol bỏ thuốc lá';
?>
<!DOCTYPE html>
<html lang="vi" <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#B25C2C">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">

<title><?php echo esc_html($page_title); ?></title>
<?php if ($meta_desc): ?>
<meta name="description" content="<?php echo esc_attr($meta_desc); ?>">
<?php endif; ?>

<meta property="og:type" content="article">
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
// JSON-LD WebPage
$site_url = home_url();
$page_schema = [
    '@context' => 'https://schema.org',
    '@type' => 'WebPage',
    'name' => $title,
    'url' => get_permalink(),
    'description' => $meta_desc ?: '',
    'inLanguage' => 'vi-VN',
    'datePublished' => get_the_date('c'),
    'dateModified' => get_the_modified_date('c'),
    'isPartOf' => [
        '@type' => 'WebSite',
        'name' => 'SOL — Đi Cùng Sol',
        'url' => $site_url,
    ],
    'publisher' => [
        '@type' => 'Organization',
        'name' => 'SOL — Đi Cùng Sol',
        'url' => $site_url,
        'founder' => [
            '@type' => 'Person',
            'name' => 'Khang Sol',
            'email' => 'contact@sol.vn',
            'telephone' => '+84-24-3993-1800',
        ],
    ],
];

// Breadcrumb từ page hierarchy
$post = get_post();
$crumbs = [['@type' => 'ListItem', 'position' => 1, 'name' => 'Trang chủ', 'item' => $site_url]];
$position = 2;
$ancestors = array_reverse(get_post_ancestors($post));
foreach ($ancestors as $aid) {
    $crumbs[] = ['@type' => 'ListItem', 'position' => $position++, 'name' => get_the_title($aid), 'item' => get_permalink($aid)];
}
$crumbs[] = ['@type' => 'ListItem', 'position' => $position, 'name' => $title];
$breadcrumb_schema = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $crumbs];
?>
<script type="application/ld+json"><?php echo wp_json_encode($page_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>
<script type="application/ld+json"><?php echo wp_json_encode($breadcrumb_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>

<?php do_action('wp_head'); ?>

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
  --sol-wine: #8B2D2D;
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

/* ─── Header sticky ───────────────────────────────────────────── */
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
  max-width: 1080px; margin: 0 auto; padding: 12px 24px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.sol-top-nav-brand {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; color: var(--sol-earth); font-weight: 700; font-size: 17px;
}
.sol-top-nav-brand-mark {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--sol-clay) 0%, var(--sol-gold) 100%);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.sol-top-nav-brand-text small {
  display: block; font-size: 11px; font-weight: 500; color: var(--sol-ink-3);
  letter-spacing: 1.5px; text-transform: uppercase; margin-top: -2px;
}
.sol-top-nav-links {
  display: flex; align-items: center; gap: 4px; font-size: 14px; flex-wrap: wrap;
}
.sol-top-nav-links a {
  padding: 8px 12px; color: var(--sol-ink-2); text-decoration: none;
  font-weight: 500; border-radius: 6px; transition: background 0.15s, color 0.15s;
}
.sol-top-nav-links a:hover { background: var(--sol-soft); color: var(--sol-earth); }
.sol-top-nav-cta {
  background: var(--sol-clay) !important; color: white !important;
  font-weight: 600 !important; padding: 8px 16px !important;
}
.sol-top-nav-cta:hover { background: var(--sol-earth) !important; color: white !important; }

/* ─── Page content ───────────────────────────────────────────── */
.sol-page-content {
  max-width: 760px; margin: 0 auto; padding: 40px 24px 60px;
}
.sol-page-content h1 { font-size: 32px; line-height: 1.2; font-weight: 700; margin: 24px 0 16px; color: var(--sol-earth); }
.sol-page-content h2 { font-size: 24px; line-height: 1.3; font-weight: 700; margin: 32px 0 12px; color: var(--sol-earth); padding-top: 16px; border-top: 1px solid var(--sol-line); }
.sol-page-content h3 { font-size: 19px; font-weight: 600; margin: 24px 0 8px; color: var(--sol-clay); }
.sol-page-content p { margin: 12px 0; }
.sol-page-content ul, .sol-page-content ol { margin: 12px 0 12px 24px; }
.sol-page-content li { margin: 6px 0; }
.sol-page-content blockquote {
  margin: 24px 0; padding: 16px 20px; border-left: 4px solid var(--sol-gold);
  background: var(--sol-soft); font-style: italic; border-radius: 0 8px 8px 0;
}

/* ─── Footer chuẩn — center desktop + mobile, đồng nhất landing 05 ─── */
.sol-footer {
  background: white;
  border-top: 1px solid var(--sol-line);
  padding: 32px 20px;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sol-footer-inner {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  font-size: 13px;
  color: var(--sol-ink-3);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}
.sol-footer-emergency {
  background: #FCEEEE;
  border: 1px solid #C62828;
  border-radius: 8px;
  padding: 16px 20px;
  color: var(--sol-ink);
  text-align: center;
}
.sol-footer-emergency strong { color: #8B0000; }
.sol-footer-emergency a { color: #8B0000; font-weight: 700; }
.sol-footer-emergency em {
  display: block; margin-top: 8px; font-size: 12px;
  color: var(--sol-ink-3); font-style: italic;
}
.sol-footer-section { color: var(--sol-ink); text-align: center; }
.sol-footer-brand {
  font-size: 16px; font-weight: 700; color: var(--sol-earth);
}
.sol-footer-brand-tag { color: var(--sol-ink-3); font-weight: 400; }
.sol-footer-contact { margin-top: 8px; font-size: 13.5px; line-height: 1.85; }
.sol-footer-links { font-size: 13px; line-height: 2.1; text-align: center; }
.sol-footer-links a { color: var(--sol-clay); }
.sol-footer-disclaimer {
  font-size: 12px; line-height: 1.7; padding-top: 16px;
  border-top: 1px solid var(--sol-line); text-align: center;
}
.sol-footer-disclaimer p { margin: 0 0 8px; }
.sol-footer-disclaimer p:last-child { margin: 0; opacity: 0.7; }
.sol-footer-disclaimer strong { color: var(--sol-ink); }
.sol-footer-disclaimer a { color: var(--sol-clay); font-weight: 600; }
.sol-footer-copy { opacity: 0.7; }

@media (max-width: 720px) {
  .sol-top-nav-inner { padding: 10px 16px; gap: 8px; }
  .sol-top-nav-brand-text { display: none; }
  .sol-top-nav-links { font-size: 13px; gap: 0; }
  .sol-top-nav-links a { padding: 6px 8px; }
  .sol-top-nav-links .sol-nav-mobile-hide { display: none; }
  .sol-page-content { padding: 24px 16px 40px; }
  .sol-page-content h1 { font-size: 26px; }
  .sol-page-content h2 { font-size: 21px; }
}
</style>
</head>
<body <?php body_class('sol-page-body'); ?>>

<!-- ─── HEADER STICKY (giống landing 05) ─────────────────────────── -->
<header class="sol-top-nav">
  <div class="sol-top-nav-inner">
    <a href="https://sol.vn" class="sol-top-nav-brand">
      <span class="sol-top-nav-brand-mark">S</span>
      <span class="sol-top-nav-brand-text">
        Đi Cùng Sol
        <small>Bỏ thuốc lá khi nào anh quyết</small>
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

<!-- ─── PAGE CONTENT ─────────────────────────────────────────────── -->
<main class="sol-page-content">
  <?php echo apply_filters('the_content', $content); ?>
</main>

<!-- ─── FOOTER CHUẨN — center desktop + mobile, đồng nhất landing 05 ── -->
<footer class="sol-footer">
  <div class="sol-footer-inner">

    <!-- Khẩn cấp y tế box — đỏ, nổi bật, căn giữa -->
    <div class="sol-footer-emergency">
      <div><strong>🚨 Khẩn cấp y tế</strong> (đau ngực, khó thở, ngất, ho ra máu)</div>
      <div style="margin-top: 6px; font-size: 14px;">gọi <a href="tel:115" style="font-size: 17px;">115</a> NGAY</div>
      <em>KHÔNG gọi tổng đài Sol cho cấp cứu — Sol chỉ hỗ trợ app + tài khoản</em>
    </div>

    <!-- Liên hệ Sol -->
    <div class="sol-footer-section">
      <div style="margin-bottom: 6px;">
        <span class="sol-footer-brand">Đi Cùng Sol</span>
        <span class="sol-footer-brand-tag"> — Bỏ thuốc lá khi nào anh quyết</span>
      </div>
      <div class="sol-footer-contact">
        📞 <a href="tel:02439931800" style="font-weight: 600;">024 3993 1800</a> <span style="color: var(--sol-ink-3); font-size: 12px;">(giờ hành chính)</span><br>
        ✉️ <a href="mailto:contact@sol.vn" style="font-weight: 600;">contact@sol.vn</a>
      </div>
    </div>

    <!-- 5 link nội bộ -->
    <div class="sol-footer-links">
      <a href="/chinh-sach-bao-mat">Chính Sách Bảo Mật</a> ·
      <a href="/dieu-khoan-su-dung">Điều Khoản Sử Dụng</a> ·
      <a href="/tuyen-bo-mien-tru">Tuyên Bố Miễn Trừ</a><br>
      <a href="https://sol.vn/category/wiki-bo-thuoc-la/">Wiki bỏ thuốc</a> ·
      <a href="https://bothuocla.sol.vn">bothuocla.sol.vn</a>
    </div>

    <!-- Disclaimer Khang -->
    <div class="sol-footer-disclaimer">
      <p><strong>Sol là dự án cá nhân của Khang Sol</strong> — không phải sản phẩm y tế. <strong>Khang KHÔNG phải bác sĩ</strong>, không có bằng cấp y khoa.</p>
      <p>Sol KHÔNG kê đơn, KHÔNG chẩn đoán. Số liệu khoa học là tham khảo, không thay tham vấn bác sĩ.</p>
      <p>Tổng đài cai thuốc miễn phí BV Bạch Mai: <a href="tel:0888008866" style="font-weight: 600;">0888-008-866</a> <span style="opacity: 0.7;">(Sol KHÔNG có hợp tác chính thức — chỉ giới thiệu)</span></p>
      <p>© 2026 Sol — Khang Sol (Nguyễn Đình Khang) · <a href="https://sol.vn">sol.vn</a></p>
    </div>

  </div>
</footer>

<?php do_action('wp_footer'); ?>

<!-- JWT transfer cross-domain (giống landing 05) -->
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
    } catch (err) {}
  }, true);
})();
</script>

</body>
</html>
PHP;
    }
}

new Sol_Default_Template();
