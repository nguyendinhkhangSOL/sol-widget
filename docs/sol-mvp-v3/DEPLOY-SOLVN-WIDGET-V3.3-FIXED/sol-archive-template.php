<?php
/**
 * Plugin Name: Sol Archive Template V3 — CPT + Category + Tag archives
 * Description: Template chuẩn cho CPT archives (/huong-di/, /ngam/), category listings,
 *              tag pages. Áp dụng V3 design (amber+navy) đồng nhất với
 *              sol-default-template.php + sol-post-template.php.
 *              KHÔNG can thiệp singular pages/posts.
 * Version:     1.0.0
 * Author:      Khang Sol
 * Updated:     2026-07-01
 *
 * Cài đặt:
 *   Upload file vào /public_html/wp-content/mu-plugins/
 *   Mu-plugins tự active — KHÔNG cần Activate trong WP Admin
 *
 * Test:
 *   /huong-di/ → phải có V3 header + hero + grid + footer
 *   /category/ngam/ → tương tự
 *   Nếu lỗi: rename thành sol-archive-template.php.disabled
 */

if (!defined('ABSPATH')) exit;

class Sol_Archive_Template {

    public function __construct() {
        add_filter('template_include', [$this, 'load_template'], 99);
    }

    public function load_template($template) {
        // Only handle archive contexts, NOT singular
        if (is_singular()) return $template;

        // Handle: CPT archive, category, tag, author, date, blog home
        $should_handle =
            is_post_type_archive() ||
            is_category() ||
            is_tag() ||
            is_tax() ||
            is_author() ||
            is_date() ||
            (is_home() && !is_front_page());

        if (!$should_handle) return $template;

        // Generate temp file with full HTML
        $tmp = sys_get_temp_dir() . '/sol-archive-' . md5($_SERVER['REQUEST_URI']) . '.php';
        $content = $this->archive_html();
        file_put_contents($tmp, $content);
        return $tmp;
    }

    private function archive_html() {
        return <<<'PHP'
<?php
// Detect archive context
$archive_title = '';
$archive_description = '';
$archive_type = '';

if (is_post_type_archive()) {
    $post_type = get_query_var('post_type');
    if (is_array($post_type)) $post_type = reset($post_type);
    $post_type_obj = get_post_type_object($post_type);
    $archive_title = $post_type_obj ? $post_type_obj->labels->name : 'Bài viết';
    $archive_description = $post_type_obj->description ?? '';
    $archive_type = 'post_type_archive';
} elseif (is_category()) {
    $archive_title = 'Chuyên mục: ' . single_cat_title('', false);
    $archive_description = category_description();
    $archive_type = 'category';
} elseif (is_tag()) {
    $archive_title = 'Thẻ: ' . single_tag_title('', false);
    $archive_description = tag_description();
    $archive_type = 'tag';
} elseif (is_tax()) {
    $archive_title = single_term_title('', false);
    $archive_description = term_description();
    $archive_type = 'taxonomy';
} elseif (is_author()) {
    $archive_title = 'Tác giả: ' . get_the_author();
    $archive_type = 'author';
} elseif (is_date()) {
    $archive_title = 'Bài viết theo ngày';
    $archive_type = 'date';
} elseif (is_home()) {
    $archive_title = 'Bài viết';
    $archive_type = 'blog';
}

// Custom labels
$custom_labels = [
    'huong-di' => ['title' => 'Bài viết Hướng Đi', 'desc' => 'Tất cả bài viết về tái khởi nghiệp đúng hướng cho người Việt 40-60. Case studies, phân tích, insight từ 20+ năm kinh nghiệm sáng lập SME.'],
    'ngam' => ['title' => 'Bài viết Ngẫm', 'desc' => 'Ngẫm về sự nghiệp, tinh thần, và hành trình tuổi 40-60.'],
];
if (is_post_type_archive()) {
    $pt = get_query_var('post_type');
    if (is_array($pt)) $pt = reset($pt);
    if (isset($custom_labels[$pt])) {
        $archive_title = $custom_labels[$pt]['title'];
        $archive_description = $custom_labels[$pt]['desc'];
    }
}

$page_title = $archive_title . ' | Đi Cùng Sol';
$post_count = $GLOBALS['wp_query']->found_posts;
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
<meta name="description" content="<?php echo esc_attr($archive_description ?: 'Bài viết từ Sol - Đồng hành cùng người Việt 40-60 tái khởi nghiệp đúng hướng.'); ?>">
<meta property="og:type" content="website">
<meta property="og:title" content="<?php echo esc_attr($archive_title); ?>">
<meta property="og:description" content="<?php echo esc_attr($archive_description); ?>">
<meta property="og:url" content="<?php echo esc_url(home_url($_SERVER['REQUEST_URI'])); ?>">

<?php do_action('wp_head'); ?>

<style>
:root {
  --sol-amber-50:#fffbeb;--sol-amber-100:#fef3c7;--sol-amber-500:#f59e0b;
  --sol-amber-600:#d97706;--sol-amber-700:#b45309;
  --sol-navy-100:#f1f5f9;--sol-navy-200:#e2e8f0;--sol-navy-300:#cbd5e1;
  --sol-navy-400:#94a3b8;--sol-navy-500:#64748b;--sol-navy-700:#334155;
  --sol-navy-800:#1e293b;--sol-navy-900:#0f172a;
  --sol-text:#1c1917;--sol-text-soft:#44403c;--sol-text-muted:#78716c;
  --sol-bg:#ffffff;--sol-bg-soft:#fafaf9;--sol-border:rgba(0,0,0,0.08);
}

* { box-sizing:border-box; margin:0; padding:0; }
html,body {
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  font-size:16px; line-height:1.65; color:var(--sol-text); background:var(--sol-bg);
  -webkit-font-smoothing:antialiased;
}
img { max-width:100%; height:auto; display:block; }
a { color:var(--sol-amber-600); text-decoration:none; }
a:hover { text-decoration:underline; }

/* ═══════════ HEADER V3 ═══════════ */
.sol-header {
  position:sticky; top:0; z-index:100;
  background:rgba(255,255,255,0.92);
  backdrop-filter:saturate(180%) blur(16px);
  border-bottom:1px solid var(--sol-border);
}
.sol-header__inner {
  max-width:1200px; margin:0 auto;
  padding:12px 1.25rem;
  display:flex; align-items:center; gap:24px;
}
.sol-logo {
  display:flex; align-items:center; gap:10px;
  font-weight:700; font-size:16px; color:var(--sol-text); text-decoration:none;
}
.sol-logo strong { color:var(--sol-amber-600); font-weight:800; }
.sol-logo img { width:36px; height:36px; border-radius:8px; }
.sol-nav-main {
  display:flex; gap:20px; margin-left:auto; align-items:center;
}
.sol-nav-main a {
  font-size:14px; font-weight:500; color:var(--sol-text-soft);
  text-decoration:none; transition:color .2s;
}
.sol-nav-main a:hover { color:var(--sol-amber-600); text-decoration:none; }
.sol-nav__featured { color:var(--sol-amber-700) !important; font-weight:700 !important; }
.sol-cta-header {
  background:linear-gradient(135deg,var(--sol-amber-600),var(--sol-amber-500));
  color:white !important; padding:10px 20px; border-radius:10px;
  font-size:14px; font-weight:700; text-decoration:none !important;
  box-shadow:0 8px 24px rgba(217,119,6,.18); transition:transform .2s;
}
.sol-cta-header:hover { transform:translateY(-1px); }
@media (max-width:768px) {
  .sol-nav-main { display:none; }
  .sol-logo span { display:none; }
}

/* ═══════════ HERO ═══════════ */
.sol-archive-hero {
  background:linear-gradient(135deg,var(--sol-navy-900) 0%,var(--sol-navy-800) 100%);
  color:#fff; padding:80px 0 60px; position:relative; overflow:hidden;
}
.sol-archive-hero::before {
  content:''; position:absolute; top:-30%; right:-10%;
  width:500px; height:500px;
  background:radial-gradient(circle,rgba(245,158,11,0.15) 0%,transparent 60%);
  border-radius:50%;
}
.sol-archive-hero__inner {
  max-width:900px; margin:0 auto; padding:0 1.25rem;
  position:relative; z-index:1; text-align:center;
}
.sol-archive-hero__eyebrow {
  font-size:13px; letter-spacing:3px; text-transform:uppercase;
  font-weight:700; color:var(--sol-amber-500); margin-bottom:16px;
}
.sol-archive-hero__title {
  font-family:'Lora',Georgia,serif;
  font-size:48px; font-weight:800; line-height:1.2; margin-bottom:20px;
}
.sol-archive-hero__desc {
  font-size:18px; color:#CBD5E1; max-width:640px; margin:0 auto 24px;
  line-height:1.6;
}
.sol-archive-hero__count {
  display:inline-block; background:rgba(245,158,11,0.15);
  color:var(--sol-amber-500); padding:6px 18px; border-radius:20px;
  font-size:14px; font-weight:700; letter-spacing:1px;
}
@media (max-width:768px) {
  .sol-archive-hero__title { font-size:32px; }
  .sol-archive-hero__desc { font-size:16px; }
}

/* ═══════════ POSTS GRID ═══════════ */
.sol-archive-main {
  max-width:1200px; margin:0 auto; padding:64px 1.25rem;
}
.sol-posts-grid {
  display:grid; grid-template-columns:repeat(3,1fr); gap:32px;
}
@media (max-width:900px) { .sol-posts-grid { grid-template-columns:repeat(2,1fr); gap:24px; } }
@media (max-width:600px) { .sol-posts-grid { grid-template-columns:1fr; gap:20px; } }

.sol-post-card {
  background:#fff; border:1px solid var(--sol-border); border-radius:16px;
  overflow:hidden; transition:transform .2s,box-shadow .2s;
  display:flex; flex-direction:column;
}
.sol-post-card:hover {
  transform:translateY(-4px);
  box-shadow:0 20px 40px rgba(15,23,42,0.12);
  text-decoration:none;
}
.sol-post-card__img-wrap {
  aspect-ratio:16/9; overflow:hidden; background:var(--sol-navy-100);
}
.sol-post-card__img {
  width:100%; height:100%; object-fit:cover;
  transition:transform .4s;
}
.sol-post-card:hover .sol-post-card__img { transform:scale(1.05); }
.sol-post-card__img-placeholder {
  width:100%; height:100%; display:flex; align-items:center; justify-content:center;
  background:linear-gradient(135deg,var(--sol-amber-500),var(--sol-amber-600));
  color:#fff; font-family:'Lora',serif; font-size:48px; font-weight:800;
}
.sol-post-card__content {
  padding:24px; display:flex; flex-direction:column; flex:1;
}
.sol-post-card__meta {
  display:flex; align-items:center; gap:12px;
  font-size:12px; color:var(--sol-text-muted); margin-bottom:12px;
}
.sol-post-card__category {
  color:var(--sol-amber-600); font-weight:700; text-transform:uppercase;
  letter-spacing:1px;
}
.sol-post-card__date::before { content:'·'; margin-right:8px; }
.sol-post-card__title {
  font-family:'Lora',serif; font-size:20px; font-weight:700;
  line-height:1.35; color:var(--sol-text); margin-bottom:12px;
}
.sol-post-card__title a { color:inherit; text-decoration:none; }
.sol-post-card__title a:hover { color:var(--sol-amber-600); }
.sol-post-card__excerpt {
  font-size:14.5px; color:var(--sol-text-soft); line-height:1.6;
  margin-bottom:20px; flex:1;
}
.sol-post-card__link {
  font-size:14px; font-weight:700; color:var(--sol-amber-600);
  display:inline-flex; align-items:center; gap:6px;
  align-self:flex-start;
}
.sol-post-card__link:hover { text-decoration:none; gap:10px; }

/* Empty state */
.sol-empty {
  text-align:center; padding:60px 20px; color:var(--sol-text-muted);
}
.sol-empty h3 { font-size:24px; color:var(--sol-text); margin-bottom:12px; font-family:'Lora',serif; }

/* ═══════════ PAGINATION ═══════════ */
.sol-pagination {
  margin-top:64px; display:flex; justify-content:center; gap:8px;
  flex-wrap:wrap;
}
.sol-pagination a, .sol-pagination span {
  display:inline-block; padding:10px 16px; border-radius:8px;
  font-size:14px; font-weight:600; text-decoration:none;
  border:1px solid var(--sol-border); background:#fff;
  color:var(--sol-text);
}
.sol-pagination a:hover {
  background:var(--sol-amber-50); border-color:var(--sol-amber-500);
  color:var(--sol-amber-700); text-decoration:none;
}
.sol-pagination .current {
  background:var(--sol-amber-500); color:#fff; border-color:var(--sol-amber-500);
}
.sol-pagination .dots { border:none; background:transparent; }

/* ═══════════ FOOTER V3 ═══════════ */
.sol-footer {
  background:var(--sol-navy-900); color:var(--sol-navy-300);
  padding:80px 0 32px; font-family:'Inter',sans-serif;
}
.sol-footer .sol-container {
  max-width:1200px; margin:0 auto; padding:0 1.25rem;
}
.sol-footer__grid {
  display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr 1fr;
  gap:40px; margin-bottom:56px;
}
@media (max-width:900px) { .sol-footer__grid { grid-template-columns:1fr 1fr; } }
@media (max-width:600px) { .sol-footer__grid { grid-template-columns:1fr; gap:32px; } }

.sol-footer__brand { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.sol-footer__brand img { width:40px; height:40px; border-radius:8px; }
.sol-footer__brand strong { color:#fff; font-size:18px; font-weight:800; }
.sol-footer__motto {
  font-family:'Lora',serif; font-style:italic; font-size:18px;
  color:var(--sol-amber-500); line-height:1.5; margin-bottom:20px;
}
.sol-footer__brand-pitch {
  font-size:13.5px; color:var(--sol-navy-400); line-height:1.7;
}
.sol-footer__col h4 {
  font-size:12px; color:var(--sol-amber-500); font-weight:800;
  text-transform:uppercase; letter-spacing:2px; margin-bottom:18px;
}
.sol-footer__col ul { list-style:none; padding:0; }
.sol-footer__col li { margin-bottom:10px; }
.sol-footer__col a {
  color:var(--sol-navy-300); text-decoration:none; font-size:13.5px;
  transition:color .2s;
}
.sol-footer__col a:hover { color:var(--sol-amber-500); text-decoration:none; }

/* Charity inline */
.sol-footer__charity-inline {
  color:var(--sol-navy-400); font-size:13px; opacity:0.9;
}
.sol-footer__charity-inline a {
  color:var(--sol-amber-500); text-decoration:none; font-weight:600;
}
.sol-footer__charity-inline a:hover { text-decoration:underline; }

.sol-footer__bottom {
  border-top:1px solid var(--sol-navy-700);
  padding-top:24px; display:flex; justify-content:space-between;
  flex-wrap:wrap; gap:16px; align-items:center;
  font-size:13px; color:var(--sol-navy-400);
}
.sol-footer__bottom strong { color:#fff; }
.sol-footer__disclaim {
  font-size:12.5px; color:var(--sol-navy-400); max-width:600px;
}
</style>
</head>
<body <?php body_class('sol-archive-body'); ?>>

<!-- ═══ HEADER V3 ═══ -->
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
    <!-- V3.2: Sol User Nav widget được inject qua mu-plugin sol-user-nav.php (top-right) -->
    <!-- Header CTA "Bắt đầu miễn phí" đã bỏ — widget V3 làm CTA chính -->
  </div>
</header>

<!-- ═══ HERO ═══ -->
<section class="sol-archive-hero">
  <div class="sol-archive-hero__inner">
    <div class="sol-archive-hero__eyebrow">Đi Cùng Sol</div>
    <h1 class="sol-archive-hero__title"><?php echo esc_html($archive_title); ?></h1>
    <?php if ($archive_description): ?>
    <p class="sol-archive-hero__desc"><?php echo wp_kses_post($archive_description); ?></p>
    <?php endif; ?>
    <?php if ($post_count > 0): ?>
    <div class="sol-archive-hero__count"><?php echo $post_count; ?> BÀI VIẾT</div>
    <?php endif; ?>
  </div>
</section>

<!-- ═══ POSTS GRID ═══ -->
<main class="sol-archive-main">
  <?php if (have_posts()): ?>
  <div class="sol-posts-grid">
    <?php while (have_posts()): the_post(); ?>
    <article class="sol-post-card">
      <a href="<?php the_permalink(); ?>" class="sol-post-card__img-wrap" style="display:block;">
        <?php if (has_post_thumbnail()): ?>
          <?php the_post_thumbnail('medium_large', ['class' => 'sol-post-card__img', 'loading' => 'lazy']); ?>
        <?php else:
          $first_letter = mb_substr(get_the_title(), 0, 1, 'UTF-8');
        ?>
          <div class="sol-post-card__img-placeholder"><?php echo esc_html($first_letter); ?></div>
        <?php endif; ?>
      </a>
      <div class="sol-post-card__content">
        <div class="sol-post-card__meta">
          <?php
          $post_type = get_post_type();
          $cat_label = 'Bài viết';
          if ($post_type === 'huong-di') $cat_label = 'Hướng Đi';
          elseif ($post_type === 'ngam') $cat_label = 'Ngẫm';
          elseif ($post_type === 'post') {
            $cats = get_the_category();
            if ($cats) $cat_label = $cats[0]->name;
          }
          ?>
          <span class="sol-post-card__category"><?php echo esc_html($cat_label); ?></span>
          <span class="sol-post-card__date"><?php echo get_the_date('d/m/Y'); ?></span>
        </div>
        <h3 class="sol-post-card__title">
          <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
        </h3>
        <p class="sol-post-card__excerpt"><?php echo wp_trim_words(get_the_excerpt(), 20, '...'); ?></p>
        <a href="<?php the_permalink(); ?>" class="sol-post-card__link">
          Đọc chi tiết <span>→</span>
        </a>
      </div>
    </article>
    <?php endwhile; ?>
  </div>

  <!-- Pagination -->
  <div class="sol-pagination">
    <?php
    echo paginate_links([
      'prev_text' => '← Trước',
      'next_text' => 'Sau →',
      'end_size' => 1,
      'mid_size' => 2,
    ]);
    ?>
  </div>

  <?php else: ?>
  <div class="sol-empty">
    <h3>Chưa có bài viết nào</h3>
    <p>Chúng tôi đang chuẩn bị nội dung. Quay lại sau nhé!</p>
    <p style="margin-top:20px;"><a href="/" style="color:var(--sol-amber-600); font-weight:700;">← Về trang chủ</a></p>
  </div>
  <?php endif; ?>
</main>

<!-- ═══ FOOTER V3 ═══ -->
<footer class="sol-footer" role="contentinfo">
  <div class="sol-container">
    <div class="sol-footer__grid">
      <div class="sol-footer__brand-col">
        <div class="sol-footer__brand">
          <img src="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png" alt="Sol">
          <strong>Đi Cùng Sol</strong>
        </div>
        <p class="sol-footer__motto">Đúng hướng,<br>đúng bước,<br>đúng tương lai.</p>
        <p class="sol-footer__brand-pitch">
          Hệ thống <strong style="color:#fff;">Sol La Bàn</strong> + Sách <strong style="color:#fff;">"Tái Khởi Nghiệp Đúng Hướng"</strong> — 5 Bước Sol La Bàn cho người 40-60 tái khởi nghiệp đúng hướng.
        </p>
      </div>

      <div class="sol-footer__col">
        <h4>Sản phẩm</h4>
        <ul>
          <li><a href="https://huongdi.sol.vn/">🧭 Sol La Bàn</a></li>
          <li><a href="https://huongdi.sol.vn/thau-hieu/">Bước 1 · Thấu hiểu</a></li>
          <li><a href="https://huongdi.sol.vn/khai-pha/">Bước 2 · Khai phá</a></li>
          <li><a href="https://huongdi.sol.vn/chon-huong/">Bước 3 · Chọn hướng</a></li>
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
      <div class="sol-footer__disclaim">⚠️ Nội dung là chia sẻ kinh nghiệm cá nhân — không phải tư vấn tài chính / y tế / pháp luật có giấy phép. <a href="/tuyen-bo-mien-tru/">Xem đầy đủ</a></div>
    </div>

  </div>
</footer>

<?php do_action('wp_footer'); ?>

</body>
</html>
PHP;
    }
}

new Sol_Archive_Template();
