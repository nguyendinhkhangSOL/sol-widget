<?php
/**
 * Plugin Name: Sol Default — Page Standard Template (v2 — Thân · Tâm · Trí)
 * Description: Template chuẩn cho page tĩnh (Chính Sách, Điều Khoản, Wiki, About,
 *              FAQ). Header sticky với menu 3 trụ Thân-Tâm-Trí + content area
 *              max 760px + Master Footer v3 (Brand + 5-col Nav + Safety+Disclaimer
 *              merged + Copyright site-wide).
 * Version:     2.0.0
 * Author:      Khang Sol
 * Updated:     2026-06-16
 *
 * Cài đặt:
 *   1. Backup file cũ:
 *      cp /var/www/sol.vn/wp-content/mu-plugins/sol-default-template.php \
 *         /var/www/sol.vn/wp-content/mu-plugins/sol-default-template.php.bak-2026-06-16
 *   2. Upload file này thay thế:
 *      → /var/www/sol.vn/wp-content/mu-plugins/sol-default-template.php
 *   3. Mu-plugins tự active — KHÔNG cần Activate trong WP Admin
 *   4. Verify: mở 1 page tĩnh (vd /chinh-sach-bao-mat/) → footer mới hiện
 *
 * Rollback nếu lỗi:
 *   mv sol-default-template.php sol-default-template-v2.php.broken
 *   mv sol-default-template.php.bak-2026-06-16 sol-default-template.php
 *
 * Thay đổi so với v1:
 *   ✅ Header nav: 3 trụ Thân-Tâm-Trí thay vì 1 cluster Thân
 *   ✅ Footer: Master v3 (Brand + 5-col Nav + Safety+Disclaimer merged)
 *   ✅ Disclaimer YMYL triple: Y khoa + Tinh thần + Tài chính
 *   ✅ Emergency hotlines đủ 3 trụ (115/0888 · 1900 599958 · MPI/startup.gov.vn)
 *   ✅ Schema Organization extended với knowsAbout 3 lĩnh vực
 *   ✅ Cross-product links bothuocla.sol.vn + huongdi.sol.vn
 *
 *   ✓ Giữ nguyên: Plugin pattern, JWT transfer script, Schema WebPage +
 *     Breadcrumb, JWT cross-domain, Be Vietnam Pro font, mobile responsive
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
$page_title = $title . ' | Sol — Đi Cùng Sol · Thân · Tâm · Trí';
?>
<!DOCTYPE html>
<html lang="vi" <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#B25C2C">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">

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
        'name' => 'Đi Cùng Sol',
        'url' => $site_url,
        'logo' => 'https://sol.vn/wp-content/uploads/2025/05/Icon_2.png',
        'sameAs' => [
            'https://www.linkedin.com/in/vietnaminternet/',
            'https://web.facebook.com/nguyendinhkhang',
        ],
        'founder' => [
            '@type' => 'Person',
            'name' => 'Khang Sol',
            'alternateName' => 'Nguyễn Đình Khang',
            'url' => 'https://sol.vn/khang-sol/',
            'image' => 'https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg',
            'email' => 'contact@sol.vn',
            'telephone' => '+84-24-3993-1800',
            'jobTitle' => 'Founder, Đi Cùng Sol',
            'sameAs' => [
                'https://www.linkedin.com/in/vietnaminternet/',
                'https://web.facebook.com/nguyendinhkhang',
            ],
            'knowsAbout' => [
                'Smoking cessation',
                'Nicotine dependence (FTND)',
                'Mid-life mental wellness',
                'Lean startup',
                'IT project management',
            ],
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
  --sol-clay-dark: #6B3318;
  --sol-gold: #B8860B;
  --sol-sun: #E8924A;
  --sol-earth: #5C3A1E;
  --sol-bg: #FBF7F0;
  --sol-soft: #F0E5D0;
  --sol-line: #E8DFC8;
  --sol-ink: #2C2A27;
  --sol-ink-2: #5C5650;
  --sol-ink-3: #8B8580;
  --sol-red: #8B0000;
  --sol-red-soft: #FCEEEE;
  --sol-than-green: #388e3c;
  --sol-than-soft: #E8F5E9;
  --sol-tam-sun: #E8924A;
  --sol-tam-soft: #FFF3E0;
  --sol-tri-clay: #B25C2C;
  --sol-tri-soft: #FBE8DA;
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
  background: linear-gradient(135deg, var(--sol-sun) 0%, var(--sol-clay) 100%);
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
.sol-top-nav-pillar-than { color: var(--sol-than-green) !important; }
.sol-top-nav-pillar-than:hover { background: var(--sol-than-soft) !important; }
.sol-top-nav-pillar-tam { color: var(--sol-tam-sun) !important; }
.sol-top-nav-pillar-tam:hover { background: var(--sol-tam-soft) !important; }
.sol-top-nav-pillar-tri { color: var(--sol-tri-clay) !important; }
.sol-top-nav-pillar-tri:hover { background: var(--sol-tri-soft) !important; }
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

/* ─── MASTER FOOTER v3 — 4 zone ─────────────────────────────────── */
.sol-footer {
  background: white;
  border-top: 1px solid var(--sol-line);
  padding: 40px 20px 24px 20px;
  margin-top: 40px;
  font-size: 14px;
  color: var(--sol-ink);
  line-height: 1.6;
}
.sol-footer-inner { max-width: 1100px; margin: 0 auto; }

/* Zone 1: Brand */
.sol-footer-brand {
  display: flex; flex-wrap: wrap; gap: 24px; align-items: center;
  padding-bottom: 24px; border-bottom: 1px solid var(--sol-line);
  margin-bottom: 28px;
}
.sol-footer-brand-left {
  display: flex; align-items: center; gap: 14px; flex: 0 0 auto;
}
.sol-footer-brand-logo {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, var(--sol-sun) 0%, var(--sol-clay) 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
}
.sol-footer-brand-text-block { line-height: 1.3; }
.sol-footer-brand-text-block strong {
  font-size: 18px; font-weight: 800; color: var(--sol-ink);
  display: block;
}
.sol-footer-brand-text-block span {
  font-size: 13px; color: var(--sol-clay); font-style: italic;
}
.sol-footer-brand-pitch {
  flex: 1 1 320px; min-width: 280px;
  font-size: 14px; color: var(--sol-ink-2); line-height: 1.6;
}
.sol-footer-brand-pitch strong { color: var(--sol-clay); }

/* Zone 2: 5-col Nav */
.sol-footer-nav {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 24px; margin-bottom: 28px;
}
.sol-footer-col h4 {
  font-size: 12px; font-weight: 800; letter-spacing: 1.5px;
  text-transform: uppercase; padding-bottom: 8px;
  margin-bottom: 10px;
}
.sol-footer-col--than h4 { color: var(--sol-than-green); border-bottom: 1px solid #C8E6C9; }
.sol-footer-col--tam h4 { color: var(--sol-tam-sun); border-bottom: 1px solid #FFE0B2; }
.sol-footer-col--tri h4 { color: var(--sol-tri-clay); border-bottom: 1px solid #EBC2A5; }
.sol-footer-col--about h4 { color: var(--sol-earth); border-bottom: 1px solid var(--sol-line); }
.sol-footer-col--contact h4 { color: var(--sol-earth); border-bottom: 1px solid var(--sol-line); }
.sol-footer-col-list {
  display: flex; flex-direction: column; gap: 7px; font-size: 13.5px;
}
.sol-footer-col-list a { color: var(--sol-ink-2); text-decoration: none; }
.sol-footer-col-list a:hover { color: var(--sol-clay); }
.sol-footer-col-list a strong { color: inherit; font-weight: 600; }
.sol-footer-col--than .sol-footer-col-list a strong { color: var(--sol-than-green); }
.sol-footer-col--tam .sol-footer-col-list a strong { color: var(--sol-tam-sun); }
.sol-footer-col--tri .sol-footer-col-list a strong { color: var(--sol-tri-clay); }
.sol-footer-col--about .sol-footer-col-list a strong { color: var(--sol-earth); }
.sol-footer-col-list em {
  color: var(--sol-ink-3); font-size: 12px; font-style: italic;
}
.sol-footer-contact-line { display: block; margin-bottom: 10px; }
.sol-footer-contact-line-label {
  display: block; font-size: 11px; letter-spacing: 0.5px;
  color: var(--sol-ink-3); font-weight: 600; margin-bottom: 2px;
}
.sol-footer-contact-line a { color: var(--sol-clay); font-weight: 600; }

/* Zone 3: Safety + Disclaimer merged */
.sol-footer-disclaimer {
  background: #FAF6EE; border-left: 4px solid var(--sol-sun);
  border-radius: 6px; padding: 20px 24px; margin-bottom: 24px;
  font-size: 13px; line-height: 1.7; color: var(--sol-ink-2);
}
.sol-footer-safety { margin-bottom: 14px; }
.sol-footer-safety-title {
  display: block; color: var(--sol-red); font-size: 14px;
  font-weight: 800; letter-spacing: 0.5px; margin-bottom: 10px;
}
.sol-footer-safety-lines {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 6px 18px; font-size: 13px;
}
.sol-footer-safety-lines a { font-weight: 700; }
.sol-footer-safety-tel { color: var(--sol-red); }
.sol-footer-safety-link { color: var(--sol-clay); }
.sol-footer-tag {
  display: inline-block; font-size: 11px; font-weight: 700;
  letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px;
  margin-right: 6px;
}
.sol-footer-tag-than { background: var(--sol-than-soft); color: var(--sol-than-green); }
.sol-footer-tag-tam { background: var(--sol-tam-soft); color: var(--sol-tam-sun); }
.sol-footer-tag-tri { background: var(--sol-tri-soft); color: var(--sol-tri-clay); }
.sol-footer-divider {
  border: none; border-top: 1px solid var(--sol-line);
  margin: 14px 0;
}
.sol-footer-disclaimer p { margin: 0 0 10px; }
.sol-footer-disclaimer p:last-child { margin-bottom: 0; }
.sol-footer-disclaimer strong { color: var(--sol-ink); }
.sol-footer-warn-than { color: var(--sol-than-green); font-weight: 700; }
.sol-footer-warn-tam { color: var(--sol-tam-sun); font-weight: 700; }
.sol-footer-warn-tri { color: var(--sol-tri-clay); font-weight: 700; }

/* Zone 4: Trust pages + Copyright */
.sol-footer-bottom {
  border-top: 1px solid var(--sol-line);
  padding-top: 18px; text-align: center;
  font-size: 13px; color: var(--sol-ink-3);
}
.sol-footer-trustlinks { margin-bottom: 12px; line-height: 2; }
.sol-footer-trustlinks a { color: var(--sol-clay); text-decoration: none; }
.sol-footer-trustlinks a:hover { text-decoration: underline; }
.sol-footer-copyright { margin: 0 0 6px; color: var(--sol-ink-2); }
.sol-footer-regulatory { font-size: 12px; color: var(--sol-ink-3); margin: 0 0 6px; }
.sol-footer-sources { margin-top: 10px; font-size: 11.5px; color: var(--sol-ink-3); line-height: 1.5; }
.sol-footer-sources strong { color: var(--sol-clay); }

/* ─── Responsive ───────────────────────────────────────────────── */
@media (max-width: 720px) {
  .sol-top-nav-inner { padding: 10px 16px; gap: 8px; }
  .sol-top-nav-brand-text { display: none; }
  .sol-top-nav-links { font-size: 13px; gap: 0; }
  .sol-top-nav-links a { padding: 6px 8px; }
  .sol-top-nav-links .sol-nav-mobile-hide { display: none; }
  .sol-page-content { padding: 24px 16px 40px; }
  .sol-page-content h1 { font-size: 26px; }
  .sol-page-content h2 { font-size: 21px; }
  .sol-footer { padding: 32px 16px 20px 16px; }
  .sol-footer-brand { flex-direction: column; align-items: flex-start; }
}
</style>
</head>
<body <?php body_class('sol-page-body'); ?>>

<!-- ─── HEADER STICKY — 3 trụ Thân-Tâm-Trí ─────────────────────── -->
<header class="sol-top-nav">
  <div class="sol-top-nav-inner">
    <a href="https://sol.vn" class="sol-top-nav-brand">
      <span class="sol-top-nav-brand-mark">🌅</span>
      <span class="sol-top-nav-brand-text">
        Đi Cùng Sol
        <small>Thân · Tâm · Trí cho U45 Việt</small>
      </span>
    </a>
    <nav class="sol-top-nav-links" aria-label="Menu chính">
      <a href="https://bothuocla.sol.vn/test-ftnd" class="sol-top-nav-pillar-than">🌱 Thân</a>
      <a href="https://sol.vn/category/ngam/" class="sol-top-nav-pillar-tam">💭 Tâm</a>
      <a href="https://huongdi.sol.vn/p1" class="sol-top-nav-pillar-tri">🚀 Trí</a>
      <a href="https://sol.vn/khang-sol/" class="sol-nav-mobile-hide">Khang Sol</a>
      <a href="https://bothuocla.sol.vn" class="sol-top-nav-cta">Bắt đầu</a>
    </nav>
  </div>
</header>

<!-- ─── PAGE CONTENT ─────────────────────────────────────────────── -->
<main class="sol-page-content">
  <?php echo apply_filters('the_content', $content); ?>
</main>

<!-- ─── MASTER FOOTER v3 — 4 ZONE ────────────────────────────────── -->
<footer class="sol-footer">
  <div class="sol-footer-inner">

    <!-- Zone 1: Brand block -->
    <div class="sol-footer-brand">
      <div class="sol-footer-brand-left">
        <div class="sol-footer-brand-logo">🌅</div>
        <div class="sol-footer-brand-text-block">
          <strong>Đi Cùng Sol</strong>
          <span>sol.vn · 3 trụ Thân · Tâm · Trí</span>
        </div>
      </div>
      <p class="sol-footer-brand-pitch">
        Sol đồng hành đàn ông Việt 45+ trên 3 trụ cột:
        <strong>Thân</strong> (sức khoẻ thể chất) ·
        <strong>Tâm</strong> (sức khoẻ tinh thần) ·
        <strong>Trí</strong> (hướng đi sự nghiệp).
        Không hô hào, không giáo điều — đi cùng anh em qua từng giai đoạn thật.
      </p>
    </div>

    <!-- Zone 2: 5-col Nav -->
    <nav class="sol-footer-nav" aria-label="Sol footer navigation">

      <div class="sol-footer-col sol-footer-col--than">
        <h4>🌱 Trụ Thân</h4>
        <div class="sol-footer-col-list">
          <a href="https://bothuocla.sol.vn/test-ftnd"><strong>Đo FTND</strong></a>
          <a href="https://sol.vn/lo-trinh-cai-thuoc-la-khoa-hoc-7-ngay/">Lộ trình 7 ngày</a>
          <a href="https://sol.vn/tai-sao-cai-thuoc-la-lai-bi-ho-co-dom/">Ho có đờm khi cai</a>
          <a href="https://sol.vn/tac-hai-thuoc-la-thu-dong-doi-voi-tre-nho/">Hút thụ động</a>
          <a href="https://sol.vn/category/wiki-bo-thuoc-la/">Wiki Bỏ thuốc</a>
          <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">→ App bothuocla</a>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--tam">
        <h4>💭 Trụ Tâm</h4>
        <div class="sol-footer-col-list">
          <a href="https://sol.vn/category/ngam/"><strong>Đọc Tâm</strong></a>
          <a href="https://sol.vn/stress-tuoi-trung-nien-va-cai-bay-khoi-thuoc/">Stress &amp; khói thuốc</a>
          <a href="https://sol.vn/khoi-nghiep-tuoi-40-khang-dinh-ban-than/">Khẳng định 40+</a>
          <a href="https://sol.vn/khang-sol/#chuong-4">5 năm Tự do</a>
          <a href="https://sol.vn/category/ngam/">Wiki Tâm an U45</a>
          <em>(App riêng phát triển sau)</em>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--tri">
        <h4>🚀 Trụ Trí</h4>
        <div class="sol-footer-col-list">
          <a href="https://huongdi.sol.vn/p1"><strong>Khám phá DNA</strong></a>
          <a href="https://sol.vn/tuong-kinh-doanh-it-von-nguoi-trung-nien/">Kinh doanh ít vốn</a>
          <a href="https://sol.vn/khoi-nghiep-tinh-gon-tuoi-trung-nien-it-von/">Khởi nghiệp tinh gọn</a>
          <a href="https://sol.vn/khoi-nghiep-trung-nien/von-100-trieu/">Khám phá vốn 100M</a>
          <a href="https://sol.vn/category/khoi-nghiep/">Wiki Khởi nghiệp</a>
          <a href="https://huongdi.sol.vn/" target="_blank" rel="noopener">→ App huongdi</a>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--about">
        <h4>📖 Về Sol</h4>
        <div class="sol-footer-col-list">
          <a href="https://sol.vn/khang-sol/"><strong>Khang Sol</strong></a>
          <a href="https://sol.vn/ve-sol/">Về dự án Sol</a>
          <a href="https://sol.vn/sol-la-gi/">Sol làm gì cho anh</a>
          <a href="https://sol.vn/cau-hoi/">21 câu hỏi FAQ</a>
          <a href="https://sol.vn/gia/">Bảng giá Sol</a>
          <a href="https://sol.vn/cong-dong/">Cộng đồng Sol</a>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--contact">
        <h4>📞 Liên hệ</h4>
        <span class="sol-footer-contact-line">
          <span class="sol-footer-contact-line-label">ĐIỆN THOẠI</span>
          <a href="tel:02439931800">024 3993 1800</a>
        </span>
        <span class="sol-footer-contact-line">
          <span class="sol-footer-contact-line-label">EMAIL</span>
          <a href="mailto:contact@sol.vn">contact@sol.vn</a>
        </span>
        <span class="sol-footer-contact-line">
          <span class="sol-footer-contact-line-label">CỘNG ĐỒNG ZALO</span>
          <a href="https://zalo.me/g/your_group_id" target="_blank" rel="noopener">Zalo group Sol</a>
        </span>
        <span class="sol-footer-contact-line">
          <span class="sol-footer-contact-line-label">MẠNG XÃ HỘI</span>
          <a href="https://linkedin.com/in/vietnaminternet" target="_blank" rel="noopener">LinkedIn</a> ·
          <a href="https://web.facebook.com/nguyendinhkhang" target="_blank" rel="noopener">Facebook</a>
        </span>
      </div>

    </nav>

    <!-- Zone 3: Safety + Disclaimer merged -->
    <div class="sol-footer-disclaimer">

      <div class="sol-footer-safety">
        <span class="sol-footer-safety-title">🚨 Thông tin khẩn cấp</span>
        <div class="sol-footer-safety-lines">
          <span><span class="sol-footer-tag sol-footer-tag-than">🌱 Thân</span>Cấp cứu y tế → <a href="tel:115" class="sol-footer-safety-tel">115</a></span>
          <span><span class="sol-footer-tag sol-footer-tag-than">🌱 Thân</span>Cai thuốc BV Bạch Mai → <a href="tel:0888008866" class="sol-footer-safety-link">0888-008-866</a></span>
          <span><span class="sol-footer-tag sol-footer-tag-tam">💭 Tâm</span>Khủng hoảng tâm lý → Ngày Mai <a href="tel:1900599958" class="sol-footer-safety-tel">1900 599958</a></span>
          <span><span class="sol-footer-tag sol-footer-tag-tri">🚀 Trí</span>Hỗ trợ DN → <a href="https://startup.gov.vn" target="_blank" rel="noopener" class="sol-footer-safety-link">startup.gov.vn</a> · MPI 024 3845 5298</span>
        </div>
      </div>

      <hr class="sol-footer-divider">

      <p><strong>Sol là dự án cá nhân của Khang Sol (Nguyễn Đình Khang).</strong> Sol KHÔNG kê đơn y khoa, KHÔNG điều trị tâm lý, KHÔNG cam kết thu nhập kinh doanh.</p>
      <p><span class="sol-footer-warn-than">⚠️ Thân (Y khoa):</span> Khang Sol KHÔNG phải bác sĩ. Triệu chứng nặng → gọi 115 hoặc khám BS chuyên khoa hô hấp.</p>
      <p><span class="sol-footer-warn-tam">⚠️ Tâm (Tinh thần):</span> Sol KHÔNG phải nhà trị liệu tâm lý có giấy phép. Trầm cảm, lo âu nặng, ý nghĩ tự hại → gọi Ngày Mai 1900 599958 hoặc đến BV chuyên khoa tâm thần kinh.</p>
      <p><span class="sol-footer-warn-tri">⚠️ Trí (Tài chính):</span> Khang Sol KHÔNG phải nhà tư vấn tài chính có giấy phép, không kê khai trước Uỷ ban Chứng khoán Nhà nước. Sol KHÔNG cam kết thu nhập. Tham vấn chuyên gia tài chính, luật sư DN, kế toán viên trước khi đầu tư.</p>

    </div>

    <!-- Zone 4: Trust pages + Copyright -->
    <div class="sol-footer-bottom">
      <div class="sol-footer-trustlinks">
        <a href="https://sol.vn/chinh-sach-bao-mat">Chính sách bảo mật</a> ·
        <a href="https://sol.vn/dieu-khoan-su-dung">Điều khoản sử dụng</a> ·
        <a href="https://sol.vn/tuyen-bo-mien-tru">Tuyên bố miễn trừ</a> ·
        <a href="https://sol.vn/chinh-sach-cookie">Cookie</a> ·
        <a href="https://sol.vn/lien-he">Liên hệ</a> ·
        <a href="https://sol.vn/khang-sol/">Khang Sol</a>
      </div>
      <p class="sol-footer-copyright">© <?php echo date('Y'); ?> Sol — Khang Sol (Nguyễn Đình Khang) · <a href="https://sol.vn" style="color: var(--sol-clay); font-weight: 600;">sol.vn</a></p>
      <p class="sol-footer-regulatory">Sol đăng ký tại Việt Nam. Tuân thủ Luật An ninh mạng 2018, Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.</p>
      <p class="sol-footer-sources"><strong>Nguồn tham khảo:</strong> CDC · NHS UK · U.S. Surgeon General · WHO Mental Health · Bộ Y tế Việt Nam · BV Tâm thần TW · APA · Eric Ries · Harvard Business Review · MPI Việt Nam</p>
    </div>

  </div>
</footer>

<?php do_action('wp_footer'); ?>

<!-- JWT transfer cross-domain (giữ từ v1) -->
<script>
(function() {
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href*="bothuocla.sol.vn"], a[href*="huongdi.sol.vn"]');
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
