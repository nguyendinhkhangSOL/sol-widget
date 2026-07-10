<?php
/**
 * Plugin Name: Sol Post Template (v1.1 — V2.2 design cho TẤT CẢ post types)
 * Description: Override theme rendering cho TẤT CẢ single posts + CPTs.
 *              Áp dụng Sol V2.2 header + footer đồng nhất với homepage.
 *              Affect: /huong-di/{slug} (CPT), /ngam/{slug}, /category/{any}/{slug}
 *              KHÔNG affect: pages (/khang-sol/, /sol-la-gi/) — dùng sol-default-template.php
 * Version:     1.1.0
 * Author:      Khang Sol
 * Updated:     2026-06-30 (V3.1 — Sol La Bàn rename + 5 Bước Sol La Bàn)
 *
 * Cài đặt:
 *   1. Upload file này lên: /var/www/sol.vn/wp-content/mu-plugins/sol-post-template.php
 *   2. Mu-plugins tự active — KHÔNG cần activate trong WP Admin
 *   3. Verify: mở 1 blog post (vd /huong-di/freelancer-chuyen-mon-tuoi-45/) → V2.2 design hiện
 *
 * Rollback:
 *   mv sol-post-template.php sol-post-template.php.disabled
 *
 * Lưu ý:
 *   - File này override TẤT CẢ single content types: regular posts + CPTs (huong-di, ngam, etc.)
 *   - PAGES (vd /khang-sol/) vẫn dùng sol-default-template.php
 *   - HOMEPAGE (vd /) vẫn dùng custom HTML trong WP page editor
 *   - ARCHIVE pages (category, tag listing) vẫn dùng theme
 */

if (!defined('ABSPATH')) exit;

class Sol_Post_Template {

    public function __construct() {
        add_filter('template_include', [$this, 'load_template'], 99);
    }

    public function load_template($template) {
        // is_single() = true for any SINGLE post (post type ANY) — INCLUDING CPTs like huong-di
        // is_single() = false for pages → pages dùng sol-default-template.php
        if (!is_single()) return $template;

        // Double-check: skip if somehow is a page
        if (get_post_type() === 'page') return $template;

        $tmp = sys_get_temp_dir() . '/sol-post-' . get_the_ID() . '.php';
        $content = $this->post_html();
        file_put_contents($tmp, $content);
        return $tmp;
    }

    private function post_html() {
        return <<<'PHP'
<?php
the_post();
$title = get_the_title();
$content = get_the_content();
$author_id = get_the_author_meta('ID');
$author_name = get_the_author();
$post_date = get_the_date('j \t\h\á\n\g n, Y');
$reading_time = max(1, round(str_word_count(strip_tags($content)) / 200));
$meta_desc = get_post_meta(get_the_ID(), '_yoast_wpseo_metadesc', true);
if (empty($meta_desc)) {
    $meta_desc = get_post_meta(get_the_ID(), 'rank_math_description', true);
}
if (empty($meta_desc)) {
    $meta_desc = wp_trim_words(strip_tags($content), 30, '...');
}
$og_image = get_the_post_thumbnail_url(get_the_ID(), 'large');
$page_title = $title . ' | Đi Cùng Sol';
$categories = get_the_category();
$category_name = !empty($categories) ? $categories[0]->name : '';
?>
<!DOCTYPE html>
<html lang="vi" <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#d97706">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,500;1,500&display=swap" rel="stylesheet">

<title><?php echo esc_html($page_title); ?></title>
<meta name="description" content="<?php echo esc_attr($meta_desc); ?>">

<meta property="og:type" content="article">
<meta property="og:title" content="<?php echo esc_attr($title); ?>">
<meta property="og:description" content="<?php echo esc_attr($meta_desc); ?>">
<meta property="og:url" content="<?php echo esc_url(get_permalink()); ?>">
<?php if ($og_image): ?>
<meta property="og:image" content="<?php echo esc_url($og_image); ?>">
<?php endif; ?>

<?php
$site_url = home_url();
$article_schema = [
    '@context' => 'https://schema.org',
    '@type' => 'Article',
    'headline' => $title,
    'description' => $meta_desc,
    'datePublished' => get_the_date('c'),
    'dateModified' => get_the_modified_date('c'),
    'author' => [
        '@type' => 'Person',
        'name' => $author_name,
        'url' => get_author_posts_url($author_id),
    ],
    'publisher' => [
        '@type' => 'Organization',
        'name' => 'Đi Cùng Sol',
        'url' => $site_url,
        'logo' => [
            '@type' => 'ImageObject',
            'url' => 'https://sol.vn/wp-content/uploads/2025/05/Icon_2.png',
        ],
    ],
    'mainEntityOfPage' => get_permalink(),
];
if ($og_image) $article_schema['image'] = $og_image;
?>
<script type="application/ld+json"><?php echo wp_json_encode($article_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>

<?php do_action('wp_head'); ?>

<style>
:root {
  --sol-amber-50:  #fffbeb;
  --sol-amber-100: #fef3c7;
  --sol-amber-200: #fde68a;
  --sol-amber-300: #fcd34d;
  --sol-amber-400: #fbbf24;
  --sol-amber-500: #f59e0b;
  --sol-amber-600: #d97706;
  --sol-amber-700: #b45309;
  --sol-amber-800: #92400e;
  --sol-navy-200: #e2e8f0;
  --sol-navy-300: #cbd5e1;
  --sol-navy-400: #94a3b8;
  --sol-navy-500: #64748b;
  --sol-navy-700: #334155;
  --sol-navy-800: #1e293b;
  --sol-navy-900: #0f172a;
  --sol-text:      #1c1917;
  --sol-text-soft: #44403c;
  --sol-text-muted:#78716c;
  --sol-bg:        #ffffff;
  --sol-bg-soft:   #fafaf9;
  --sol-border:    rgba(0, 0, 0, 0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-size: 17px;
  line-height: 1.7;
  color: var(--sol-text);
  background: var(--sol-bg);
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--sol-amber-600); text-decoration: none; }
a:hover { text-decoration: underline; }

/* HEADER V2.2 */
.sol-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  border-bottom: 1px solid var(--sol-border);
}
.sol-header__inner {
  max-width: 1200px; margin: 0 auto; padding: 12px 1.25rem;
  display: flex; align-items: center; gap: 24px;
}
.sol-logo {
  display: flex; align-items: center; gap: 10px;
  font-weight: 700; font-size: 16px; color: var(--sol-text); text-decoration: none;
}
.sol-logo strong { color: var(--sol-amber-600); font-weight: 800; }
.sol-logo img { width: 36px; height: 36px; border-radius: 8px; }
.sol-nav-main {
  display: flex; gap: 20px; margin-left: auto; align-items: center;
}
.sol-nav-main a {
  font-size: 14px; font-weight: 500;
  color: var(--sol-text-soft); text-decoration: none;
}
.sol-nav-main a:hover { color: var(--sol-amber-600); }
.sol-nav__featured {
  color: var(--sol-amber-700) !important; font-weight: 700 !important;
}
.sol-cta-header {
  background: linear-gradient(135deg, var(--sol-amber-600), var(--sol-amber-500));
  color: white !important;
  padding: 10px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 700; text-decoration: none !important;
  box-shadow: 0 8px 24px rgba(217, 119, 6, .18);
  transition: transform .2s;
}
.sol-cta-header:hover { transform: translateY(-1px); }
@media (max-width: 1024px) {
  .sol-nav-main { gap: 14px; }
  .sol-nav-main a { font-size: 13px; }
}
@media (max-width: 768px) {
  .sol-header__inner { gap: 12px; padding: 10px 12px; }
  .sol-logo span { display: none; }
  .sol-nav-main { display: none; }
  .sol-cta-header { padding: 8px 14px; font-size: 13px; }
}

/* POST CONTENT */
.sol-post {
  max-width: 760px; margin: 60px auto 80px; padding: 0 1.25rem;
}
.sol-post__breadcrumb {
  font-size: 13px; color: var(--sol-text-muted); margin-bottom: 24px;
}
.sol-post__breadcrumb a { color: var(--sol-amber-700); }
.sol-post__category {
  display: inline-block;
  font-size: 12px; font-weight: 700;
  color: var(--sol-amber-700); background: var(--sol-amber-100);
  padding: 4px 10px; border-radius: 999px;
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 16px;
}
.sol-post__title {
  font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800;
  line-height: 1.2; letter-spacing: -0.02em;
  color: var(--sol-navy-900); margin-bottom: 16px;
}
.sol-post__meta {
  display: flex; gap: 16px; flex-wrap: wrap;
  font-size: 14px; color: var(--sol-text-muted);
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sol-border);
}
.sol-post__meta a { color: var(--sol-amber-700); font-weight: 600; }
.sol-post__featured {
  margin: 0 0 40px;
}
.sol-post__featured img {
  width: 100%; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.08);
}
.sol-post__content h1, .sol-post__content h2,
.sol-post__content h3, .sol-post__content h4 {
  font-weight: 800; letter-spacing: -0.01em;
  color: var(--sol-navy-900);
  margin-top: 40px; margin-bottom: 16px;
}
.sol-post__content h2 { font-size: 1.75rem; }
.sol-post__content h3 { font-size: 1.4rem; }
.sol-post__content p {
  margin-bottom: 20px; color: var(--sol-text-soft);
}
.sol-post__content ul, .sol-post__content ol {
  margin: 0 0 20px 24px;
}
.sol-post__content li { margin-bottom: 8px; color: var(--sol-text-soft); }
.sol-post__content blockquote {
  border-left: 4px solid var(--sol-amber-400);
  padding: 12px 0 12px 24px;
  margin: 28px 0;
  font-family: 'Lora', serif;
  font-style: italic;
  color: var(--sol-text-soft);
  font-size: 1.1rem;
}
.sol-post__content img {
  border-radius: 12px; margin: 24px auto;
}

/* FOOTER (same as v3 default) */
.sol-footer {
  background: var(--sol-navy-900); color: var(--sol-navy-300);
  padding: 80px 0 32px;
}
.sol-footer .sol-container {
  max-width: 1200px; margin: 0 auto; padding: 0 1.25rem;
}
.sol-footer__grid {
  display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
  gap: 40px; margin-bottom: 48px;
}
.sol-footer__brand {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px; text-decoration: none;
}
.sol-footer__brand img { width: 40px; height: 40px; border-radius: 8px; }
.sol-footer__brand strong { font-size: 18px; color: white; font-weight: 800; }
.sol-footer__motto {
  font-family: 'Lora', serif; font-style: italic;
  color: var(--sol-amber-300); font-size: 14px; line-height: 1.5; margin: 0 0 12px;
}
.sol-footer__brand-pitch {
  font-size: 13px; line-height: 1.55; color: var(--sol-navy-400); margin: 0;
}
.sol-footer__col h4 {
  color: white; font-size: 13px;
  text-transform: uppercase; letter-spacing: 1.5px;
  margin: 0 0 16px; font-weight: 700;
}
.sol-footer__col ul { list-style: none; padding: 0; margin: 0; }
.sol-footer__col li { margin-bottom: 8px; font-size: 14px; }
.sol-footer__col a { color: var(--sol-navy-300); font-size: 14px; }
.sol-footer__col a:hover { color: var(--sol-amber-400); }
.sol-footer__col small {
  font-size: 11px; color: var(--sol-navy-400); line-height: 1.4; display: block; margin-top: 2px;
}

/* Charity inline — đơn giản, không cạnh tranh attention với CTA */
.sol-footer__charity-inline {
  color: var(--sol-navy-400);
  font-size: 13px;
  opacity: 0.9;
}
.sol-footer__charity-inline a {
  color: var(--sol-amber-500);
  text-decoration: none;
  font-weight: 600;
}
.sol-footer__charity-inline a:hover { text-decoration: underline; }

.sol-footer__bottom {
  padding-top: 24px;
  border-top: 1px solid var(--sol-navy-700);
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  font-size: 13px; color: var(--sol-navy-400);
}
.sol-footer__bottom strong { color: white; }
.sol-footer__disclaim { max-width: 480px; color: var(--sol-navy-400); }
.sol-footer__disclaim a { color: var(--sol-amber-400); text-decoration: underline; }

@media (max-width: 1024px) {
  .sol-footer__grid { grid-template-columns: repeat(3, 1fr); }
  .sol-footer__brand-col { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .sol-footer { padding: 60px 0 24px; }
  .sol-footer__grid { grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .sol-footer__bottom { flex-direction: column; text-align: center; }
}
</style>
</head>
<body <?php body_class('sol-post-body'); ?>>

<!-- HEADER V2.2 -->
<header class="sol-header" role="banner">
  <div class="sol-header__inner">
    <a href="https://sol.vn/" class="sol-logo">
      <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol" width="36" height="36">
      <span>Đi Cùng <strong>Sol</strong></span>
    </a>
    <nav class="sol-nav-main" aria-label="Menu chính">
      <a href="/sach/tai-khoi-nghiep-dung-huong/" class="sol-nav__featured">📖 Sách</a>
      <a href="https://huongdi.sol.vn/">🧭 Sol La Bàn</a>
      <a href="/kham-pha-nhanh/" style="position:relative;">
        🎯 Kiểm tra 3 phút
        <span style="position:absolute; top:-6px; right:-14px; background:#16A34A; color:#fff; font-size:9px; font-weight:800; padding:2px 6px; border-radius:8px; letter-spacing:0.5px; line-height:1;">MỚI</span>
      </a>
      <a href="/huong-di/">✍️ Bài viết</a>
      <a href="/khang-sol/">👤 Khang Sol</a>
    </nav>
    <a href="https://huongdi.sol.vn/thau-hieu/" class="sol-cta-header">Bắt đầu miễn phí →</a>
    <!-- V1.2 Avatar icon: script inject góc phải trên -->
    <script src="/sol-avatar-icon.js" defer></script>
  </div>
</header>

<!-- POST CONTENT -->
<article class="sol-post">
  <nav class="sol-post__breadcrumb">
    <a href="https://sol.vn/">Trang chủ</a>
    <?php if (!empty($categories)): ?>
      › <a href="<?php echo esc_url(get_category_link($categories[0]->term_id)); ?>"><?php echo esc_html($category_name); ?></a>
    <?php endif; ?>
    › <?php echo esc_html($title); ?>
  </nav>

  <?php if (!empty($categories)): ?>
    <span class="sol-post__category"><?php echo esc_html($category_name); ?></span>
  <?php endif; ?>

  <h1 class="sol-post__title"><?php echo esc_html($title); ?></h1>

  <div class="sol-post__meta">
    <span>Bởi <a href="<?php echo esc_url(get_author_posts_url($author_id)); ?>"><?php echo esc_html($author_name); ?></a></span>
    <span>·</span>
    <span><?php echo esc_html($post_date); ?></span>
    <span>·</span>
    <span><?php echo $reading_time; ?> phút đọc</span>
  </div>

  <?php if ($og_image): ?>
    <div class="sol-post__featured">
      <img src="<?php echo esc_url($og_image); ?>" alt="<?php echo esc_attr($title); ?>">
    </div>
  <?php endif; ?>

  <div class="sol-post__content">
    <?php echo apply_filters('the_content', $content); ?>
  </div>
</article>

<!-- FOOTER V2.2 -->
<footer class="sol-footer" role="contentinfo">
  <div class="sol-container">

    <div class="sol-footer__grid">

      <div class="sol-footer__brand-col">
        <a href="/" class="sol-footer__brand">
          <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol" width="40" height="40">
          <strong>Đi Cùng Sol</strong>
        </a>
        <p class="sol-footer__motto">Đúng hướng,<br>đúng bước,<br>đúng tương lai.</p>
        <p class="sol-footer__brand-pitch">
          Hệ thống <strong>Sol La Bàn</strong> + Sách <strong>"Tái Khởi Nghiệp Đúng Hướng"</strong> — 5 Bước Sol La Bàn cho người 40-60 tái khởi nghiệp đúng hướng.
        </p>
      </div>

      <div class="sol-footer__col">
        <h4>Sản phẩm</h4>
        <ul>
          <li><a href="https://huongdi.sol.vn/">🧭 Sol La Bàn</a></li>
          <li><a href="https://huongdi.sol.vn/thau-hieu/">Bước 1 · Thấu hiểu</a></li>
          <li><a href="https://huongdi.sol.vn/khai-pha/">Bước 2 · Khai phá</a></li>
          <li><a href="https://huongdi.sol.vn/chon-huong/">Bước 3 · Chọn hướng</a></li>
          <li><a href="https://huongdi.sol.vn/active/">💎 Active 499k</a></li>
          <li><a href="/sach/tai-khoi-nghiep-dung-huong/">📖 Sách miễn phí</a></li>
        </ul>
      </div>

      <div class="sol-footer__col">
        <h4>Tài nguyên miễn phí</h4>
        <ul>
          <li><a href="/kham-pha-nhanh/">🎯 Kiểm tra 3 phút — biết mô hình phù hợp <span style="background:#16A34A;color:#fff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;letter-spacing:0.5px;margin-left:4px;">MỚI</span></a></li>
          <li><a href="https://huongdi.sol.vn/prompts/">🤖 40 câu hỏi AI (12 mẫu miễn phí)</a></li>
          <li><a href="/huong-di/">📝 Bài viết Hướng Đi</a></li>
          <li><a href="#newsletter">📧 Bản tin Sol Cuối Tuần</a></li>
          <li><a href="/podcast/">🎙 Podcast (sắp có)</a></li>
        </ul>
      </div>

      <div class="sol-footer__col">
        <h4>Về Sol</h4>
        <ul>
          <li><a href="/khang-sol/">Khang Sol — Người sáng lập</a></li>
          <li><a href="/sol-la-gi/">Sol Là Gì?</a></li>
          <li><a href="/cau-hoi/">Câu hỏi thường gặp</a></li>
          <li><a href="/lien-he/">Liên hệ</a></li>
        </ul>
      </div>

      <div class="sol-footer__col">
        <h4>Cộng đồng</h4>
        <ul>
          <li><a href="https://www.facebook.com/groups/dicungsol/" target="_blank" rel="noopener">👥 FB Group "Đi Cùng Sol"</a></li>
          <li><a href="#" target="_blank" rel="noopener">💬 Zalo Group</a></li>
          <li><a href="mailto:hello@sol.vn">📧 hello@sol.vn</a></li>
          <li><a href="https://web.facebook.com/nguyendinhkhang" rel="noopener nofollow" target="_blank">Facebook Khang</a></li>
          <li><a href="https://www.linkedin.com/in/vietnaminternet/" rel="noopener nofollow" target="_blank">LinkedIn Khang</a></li>
        </ul>
      </div>

    </div>

<div class="sol-footer__bottom">
      <div>
        © 2025–<?php echo date('Y'); ?> <strong>Đi Cùng Sol</strong> · Tái khởi nghiệp đúng hướng
        <span class="sol-footer__charity-inline">· 🌟 Phụng sự: <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">bothuocla.sol.vn</a> (cai thuốc lá miễn phí)</span>
      </div>
<a href="/tuyen-bo-mien-tru/">Xem đầy đủ</a></div>
    </div>

  </div>
</footer>

<?php do_action('wp_footer'); ?>

</body>
</html>
PHP;
    }
}

new Sol_Post_Template();
