<?php
/**
 * Plugin Name: Sol Landing — Full HTML Template (v3 — V2.2 design)
 * Description: Template cho landing pages — render content nguyên xi (full HTML).
 *              Inject V2.2 CSS vào <head>. Page content được expected có
 *              header + sections + footer V2.2 inline (custom HTML block).
 * Version:     3.0.0
 * Author:      Khang Sol
 * Updated:     2026-06-27
 *
 * Cài đặt:
 *   1. Backup file cũ qua cPanel:
 *      sol-landing-template.php → sol-landing-template-v2-backup.php
 *   2. Upload file này thành: sol-landing-template.php
 *   3. Mu-plugins tự active
 *
 * Pages dùng template này:
 *   - Homepage / (custom HTML V2.2)
 *   - /sach/tai-khoi-nghiep-dung-huong/ (sau khi build)
 *   - Bất kỳ landing page nào cần full custom HTML
 *
 * Khác sol-default-template.php (v3):
 *   - Default template: render header + the_content + footer (cho text content)
 *   - Landing template: chỉ inject CSS + render content as-is (cho full HTML)
 */

if (!defined('ABSPATH')) exit;

class Sol_Landing_Template {
    const TEMPLATE_KEY = 'sol-landing-page.php';
    const TEMPLATE_NAME = 'Sol Landing — Full HTML (v3)';

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

        $tmp = sys_get_temp_dir() . '/sol-landing-' . get_the_ID() . '.php';
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
$page_title = $title . ' | Đi Cùng Sol';
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

<?php do_action('wp_head'); ?>

<style>
/* ═══════════════════════════════════════════════════════════════════
   Sol V2.2 Design Tokens — Landing Pages
   ═══════════════════════════════════════════════════════════════════ */
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
  --sol-amber-900: #78350f;
  --sol-navy-50:  #f8fafc;
  --sol-navy-100: #f1f5f9;
  --sol-navy-200: #e2e8f0;
  --sol-navy-300: #cbd5e1;
  --sol-navy-400: #94a3b8;
  --sol-navy-500: #64748b;
  --sol-navy-600: #475569;
  --sol-navy-700: #334155;
  --sol-navy-800: #1e293b;
  --sol-navy-900: #0f172a;
  --sol-text:      #1c1917;
  --sol-text-soft: #44403c;
  --sol-text-muted:#78716c;
  --sol-bg:        #ffffff;
  --sol-bg-soft:   #fafaf9;
  --sol-border:    rgba(0, 0, 0, 0.08);
  --sol-success:   #16a34a;
  --sol-shadow-amber: 0 8px 24px rgba(217,119,6,.18);
  --sol-shadow-lg: 0 8px 24px rgba(0,0,0,.08);
  --sol-shadow-xl: 0 16px 40px rgba(0,0,0,.12);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.65;
  color: var(--sol-text);
  background: var(--sol-bg);
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--sol-amber-600); text-decoration: none; }
a:hover { text-decoration: underline; }

.sol-container { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; }
.sol-gradient {
  background: linear-gradient(135deg, var(--sol-amber-600), var(--sol-amber-500));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: var(--sol-amber-600);
}
.sol-eyebrow {
  display: inline-block; font-size: 13px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--sol-amber-600); margin-bottom: 12px;
}

/* Buttons */
.sol-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--sol-amber-600), var(--sol-amber-500));
  color: white !important; padding: 14px 28px; border-radius: 10px;
  font-size: 15px; font-weight: 700; text-decoration: none !important;
  box-shadow: var(--sol-shadow-amber); transition: transform .25s;
}
.sol-btn-primary:hover { transform: translateY(-2px); }
.sol-btn-large { padding: 16px 32px; font-size: 16px; }
.sol-btn-xlarge { padding: 20px 40px; font-size: 18px; }
.sol-btn-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 24px; border-radius: 10px;
  font-size: 14px; font-weight: 600;
  color: var(--sol-navy-800) !important; background: white;
  border: 1px solid var(--sol-border); text-decoration: none !important;
}
.sol-btn-secondary:hover { border-color: var(--sol-amber-400); color: var(--sol-amber-700) !important; }

/* HEADER */
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
.sol-nav__featured { color: var(--sol-amber-700) !important; font-weight: 700 !important; }
.sol-cta-header {
  background: linear-gradient(135deg, var(--sol-amber-600), var(--sol-amber-500));
  color: white !important; padding: 10px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 700; text-decoration: none !important;
  box-shadow: var(--sol-shadow-amber); transition: transform .2s;
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

/* HERO */
.sol-hero {
  position: relative; padding: 80px 0 100px; text-align: center;
  background: radial-gradient(ellipse at top, rgba(254,243,199,.6), transparent 60%),
              linear-gradient(180deg, #fffdf7, var(--sol-bg-soft));
  overflow: hidden;
}
.sol-hero__bg-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(217,119,6,.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(217,119,6,.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center top, black, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center top, black, transparent 70%);
}
.sol-hero__badge {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 16px; background: white;
  border: 1px solid var(--sol-amber-200); border-radius: 999px;
  font-size: 13px; font-weight: 600; color: var(--sol-amber-800);
  margin-bottom: 32px; position: relative; z-index: 2;
}
.sol-pulse {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: var(--sol-success); animation: sol-pulse 2s infinite;
}
@keyframes sol-pulse {
  0% { box-shadow: 0 0 0 0 rgba(22,163,74,.4); }
  70% { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
}
.sol-hero__title {
  font-size: clamp(2rem, 5vw, 4rem); font-weight: 800;
  line-height: 1.15; letter-spacing: -0.02em;
  color: var(--sol-navy-900); margin: 0 auto 24px;
  max-width: 900px; position: relative; z-index: 2;
}
.sol-hero__sub {
  font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.6;
  color: var(--sol-text-soft); max-width: 680px; margin: 0 auto 40px;
  position: relative; z-index: 2;
}
.sol-hero__sub strong { color: var(--sol-text); font-weight: 700; }
.sol-hero__cta-row {
  display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
  margin-bottom: 32px; position: relative; z-index: 2;
}
.sol-hero__trust {
  display: inline-flex; align-items: center; gap: 12px;
  font-size: 14px; color: var(--sol-text-muted);
  position: relative; z-index: 2;
}
.sol-stars { letter-spacing: 2px; }
.sol-hero__trust strong { color: var(--sol-amber-700); }

/* TRUST BAR */
.sol-trust {
  padding: 48px 0; background: var(--sol-bg-soft);
  border-top: 1px solid var(--sol-border);
  border-bottom: 1px solid var(--sol-border);
}
.sol-trust__items {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 32px; text-align: center;
}
.sol-trust__num {
  font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800;
  color: var(--sol-amber-600); line-height: 1; margin-bottom: 8px;
}
.sol-trust__label { font-size: 14px; color: var(--sol-text-soft); line-height: 1.4; }
@media (max-width: 640px) { .sol-trust__items { grid-template-columns: repeat(2, 1fr); } }

/* SECTION */
.sol-section { padding: 100px 0; }
.sol-section__head { text-align: center; max-width: 760px; margin: 0 auto 64px; }
.sol-section__head h2 {
  font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 800;
  line-height: 1.2; letter-spacing: -0.02em;
  color: var(--sol-navy-900); margin: 0 0 16px;
}
.sol-section__sub { font-size: 1.1rem; line-height: 1.65; color: var(--sol-text-soft); }

/* PAIN */
.sol-pain { background: var(--sol-bg-soft); }
.sol-pain__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
}
.sol-pain__card {
  background: white; padding: 32px; border-radius: 20px;
  border: 1px solid var(--sol-border); transition: all .25s;
}
.sol-pain__card:hover { transform: translateY(-4px); box-shadow: var(--sol-shadow-lg); }
.sol-pain__icon { font-size: 36px; margin-bottom: 16px; }
.sol-pain__card h3 { font-size: 1.3rem; font-weight: 700; margin: 0 0 12px; }
.sol-pain__card p { color: var(--sol-text-soft); margin: 0; }
@media (max-width: 768px) { .sol-pain__grid { grid-template-columns: 1fr; } }

/* HIGHLIGHTS */
.sol-highlights { background: linear-gradient(180deg, var(--sol-bg-soft), white); }
.sol-highlights__grid {
  display: grid; grid-template-columns: 1fr 1.6fr 1fr; gap: 20px;
  max-width: 1200px; margin: 0 auto; align-items: stretch;
}
.sol-highlight {
  position: relative; background: white; border-radius: 24px;
  border: 1px solid var(--sol-border); padding: 36px 28px;
  display: flex; flex-direction: column; transition: all 0.3s;
}
.sol-highlight:hover { transform: translateY(-4px); box-shadow: var(--sol-shadow-lg); }
.sol-highlight__step {
  display: inline-block; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px;
  color: var(--sol-text-muted); padding: 4px 10px;
  background: rgba(0,0,0,.04); border-radius: 999px;
  margin-bottom: 16px; align-self: flex-start;
}
.sol-highlight__icon { font-size: 48px; margin-bottom: 12px; }
.sol-highlight h3 { font-size: 1.4rem; font-weight: 800; margin: 0 0 6px; line-height: 1.2; }
.sol-highlight__lead { font-size: 14px; font-weight: 600; color: var(--sol-amber-700); margin-bottom: 18px; }
.sol-highlight__features { list-style: none; padding: 0; margin: 0 0 20px; flex-grow: 1; }
.sol-highlight__features li {
  padding: 6px 0 6px 18px; position: relative; font-size: 14px;
  line-height: 1.5; color: var(--sol-text-soft);
}
.sol-highlight__features li::before {
  content: "✓"; position: absolute; left: 0; color: var(--sol-amber-600); font-weight: 800;
}
.sol-highlight__features li strong { color: var(--sol-text); font-weight: 700; }
.sol-highlight__price { margin-bottom: 20px; text-align: center; }
.sol-highlight__price-tag {
  display: inline-block; background: var(--sol-success); color: white;
  padding: 8px 16px; border-radius: 999px;
  font-size: 13px; font-weight: 800; letter-spacing: 0.5px;
}
.sol-highlight__price-tag--included { background: var(--sol-navy-700); }
.sol-highlight__price-old { font-size: 14px; color: var(--sol-text-muted); }
.sol-highlight__price-old s { text-decoration: line-through; }
.sol-highlight__price-new {
  font-size: 36px; font-weight: 800; color: var(--sol-amber-600);
  line-height: 1; margin: 4px 0;
}
.sol-highlight__price-note { font-size: 12px; font-weight: 600; color: var(--sol-amber-700); }
.sol-highlight__cta {
  display: block; text-align: center; padding: 12px 20px;
  border: 1.5px solid var(--sol-amber-600); color: var(--sol-amber-700);
  border-radius: 10px; font-size: 14px; font-weight: 700;
  text-decoration: none !important; transition: all 0.2s;
}
.sol-highlight__cta:hover { background: var(--sol-amber-50); }
.sol-highlight__cta--primary {
  background: linear-gradient(135deg, var(--sol-amber-600), var(--sol-amber-500));
  color: white !important; border: none; box-shadow: var(--sol-shadow-amber);
}
.sol-highlight__cta-secondary {
  display: block; text-align: center; margin-top: 8px; padding: 8px;
  color: var(--sol-text-muted); font-size: 13px; font-weight: 600;
  text-decoration: underline dotted; text-underline-offset: 4px;
}
.sol-highlight--blog { background: linear-gradient(180deg, #f0fdf4 0%, white 70%); border-color: #86efac; }
.sol-highlight--blog .sol-highlight__step { background: rgba(34, 197, 94, 0.1); color: #15803d; }
.sol-highlight--blog .sol-highlight__lead { color: #15803d; }
.sol-highlight--blog .sol-highlight__features li::before { color: #16a34a; }
.sol-highlight--blog .sol-highlight__cta { border-color: #16a34a; color: #15803d !important; }
.sol-highlight--featured {
  background: linear-gradient(180deg, var(--sol-amber-50), white 80%);
  border: 2px solid var(--sol-amber-400); box-shadow: var(--sol-shadow-xl);
  transform: scale(1.03); z-index: 2;
}
.sol-highlight__badge {
  position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(135deg, var(--sol-amber-600), var(--sol-amber-500));
  color: white; padding: 6px 18px; border-radius: 999px;
  font-size: 12px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.5px; white-space: nowrap;
}
.sol-highlight--featured .sol-highlight__step { background: var(--sol-amber-100); color: var(--sol-amber-800); }
.sol-highlight--featured h3 { font-size: 1.6rem; color: var(--sol-navy-900); }
.sol-highlight--featured .sol-highlight__icon { font-size: 56px; }
.sol-highlight--system { background: linear-gradient(180deg, #faf5ff 0%, white 70%); border-color: #c4b5fd; }
.sol-highlight--system .sol-highlight__step { background: rgba(139, 92, 246, 0.1); color: #6d28d9; }
.sol-highlight--system .sol-highlight__lead { color: #6d28d9; }
.sol-highlight--system .sol-highlight__features li::before { color: #7c3aed; }
.sol-highlight--system .sol-highlight__cta { border-color: #7c3aed; color: #6d28d9 !important; }
@media (max-width: 1024px) { .sol-highlights__grid { grid-template-columns: 1fr 1.4fr 1fr; gap: 16px; } }
@media (max-width: 880px) {
  .sol-highlights__grid { grid-template-columns: 1fr; gap: 20px; }
  .sol-highlight--featured { transform: none; order: -1; }
}

/* BOOK */
.sol-book { background: linear-gradient(180deg, var(--sol-bg-soft), white); }
.sol-book__layout {
  display: grid; grid-template-columns: 360px 1fr; gap: 64px;
  align-items: center; max-width: 1000px; margin: 0 auto;
}
.sol-book__cover-wrap { position: relative; display: flex; justify-content: center; align-items: center; }
.sol-book__cover {
  position: relative; width: 300px; height: 420px;
  filter: drop-shadow(0 24px 48px rgba(0,0,0,.25));
}
.sol-book__cover-front {
  background: linear-gradient(135deg, #b45309, #d97706 50%, #f59e0b);
  width: 100%; height: 100%; border-radius: 6px 14px 14px 6px;
  padding: 40px 30px; color: white;
  display: flex; flex-direction: column; justify-content: space-between;
  text-align: center; transform: rotateY(-8deg);
  box-shadow: inset 4px 0 12px rgba(0,0,0,.2);
}
.sol-book__cover-eyebrow { font-size: 12px; letter-spacing: 4px; font-weight: 700; opacity: 0.9; }
.sol-book__cover-title {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 28px; font-weight: 500; line-height: 1.2; margin: auto 0;
}
.sol-book__cover-sub { font-size: 13px; opacity: 0.85; font-weight: 500; margin-bottom: 8px; }
.sol-book__cover-author { font-size: 14px; font-weight: 700; letter-spacing: 1px; }
.sol-book__badge {
  position: absolute; bottom: 0; background: white;
  padding: 8px 16px; border-radius: 999px;
  font-size: 12px; font-weight: 600; color: var(--sol-text-soft);
  box-shadow: var(--sol-shadow-lg);
}
.sol-book__content h3 { font-size: 1.4rem; font-weight: 700; margin: 0 0 20px; }
.sol-book__list { list-style: none; padding: 0; margin: 0 0 28px; }
.sol-book__list li {
  display: flex; gap: 14px; padding: 12px 0;
  font-size: 15px; line-height: 1.55;
}
.sol-book__icon { font-size: 22px; flex-shrink: 0; }
.sol-book__cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
@media (max-width: 880px) { .sol-book__layout { grid-template-columns: 1fr; gap: 40px; } }

/* SYSTEM 3 STEPS */
.sol-system { background: white; }
.sol-steps { display: grid; gap: 24px; max-width: 880px; margin: 0 auto; }
.sol-step {
  display: grid; grid-template-columns: 220px 1fr; gap: 40px;
  padding: 32px 28px; background: white; border-radius: 20px;
  border: 1px solid var(--sol-border); transition: all 0.25s;
  align-items: center;
}
.sol-step:hover { border-color: var(--sol-amber-300); box-shadow: var(--sol-shadow-lg); transform: translateY(-2px); }
.sol-step__badge { display: flex; flex-direction: column; gap: 6px; }
.sol-step__num {
  font-family: "SF Mono", Monaco, Consolas, monospace;
  font-size: 32px; font-weight: 800; color: var(--sol-amber-600); line-height: 1;
}
.sol-step__brand { font-size: 13px; font-weight: 700; color: var(--sol-navy-700); }
.sol-step__content h3 { font-size: 1.4rem; font-weight: 700; margin: 0 0 10px; }
.sol-step__content p { color: var(--sol-text-soft); line-height: 1.65; margin: 0; }
.sol-system__cta { text-align: center; margin-top: 40px; }
@media (max-width: 768px) { .sol-step { grid-template-columns: 1fr; gap: 16px; padding: 24px 20px; } }

/* WHY */
.sol-why { background: white; }
.sol-why__grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
}
.sol-why__card {
  background: var(--sol-bg-soft); padding: 28px 24px;
  border-radius: 18px; border: 1px solid var(--sol-border);
}
.sol-why__icon { font-size: 28px; margin-bottom: 14px; }
.sol-why__card h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 10px; }
.sol-why__card p { color: var(--sol-text-soft); font-size: 14px; line-height: 1.6; margin: 0; }
@media (max-width: 880px) { .sol-why__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .sol-why__grid { grid-template-columns: 1fr; } }

/* FOUNDER */
.sol-founder { background: linear-gradient(180deg, var(--sol-bg-soft), white); }
.sol-founder__wrap {
  display: grid; grid-template-columns: 280px 1fr; gap: 48px;
  align-items: center; max-width: 960px; margin: 0 auto;
}
.sol-founder__photo img {
  width: 280px; height: 280px; border-radius: 28px;
  object-fit: cover; box-shadow: var(--sol-shadow-xl);
}
.sol-founder__content h2 { font-size: 1.75rem; font-weight: 800; margin: 8px 0 20px; }
.sol-founder blockquote {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 1.15rem; line-height: 1.7; color: var(--sol-text-soft);
  border-left: 4px solid var(--sol-amber-400); padding: 4px 0 4px 20px;
  margin: 0 0 24px;
}
.sol-founder__creds { list-style: none; padding: 0; margin: 0 0 24px; }
.sol-founder__creds li {
  padding: 6px 0 6px 20px; position: relative; font-size: 15px;
}
.sol-founder__creds li::before {
  content: "→"; position: absolute; left: 0; color: var(--sol-amber-600); font-weight: 800;
}
@media (max-width: 768px) {
  .sol-founder__wrap { grid-template-columns: 1fr; text-align: center; }
  .sol-founder__photo img { width: 220px; height: 220px; margin: 0 auto; }
}

/* NEWSLETTER */
.sol-newsletter { background: var(--sol-bg-soft); }
.sol-newsletter__box {
  background: white; padding: 60px 40px; border-radius: 28px;
  text-align: center; max-width: 640px; margin: 0 auto;
  border: 1px solid var(--sol-border); box-shadow: var(--sol-shadow-lg);
}
.sol-newsletter__icon { font-size: 48px; margin-bottom: 16px; }
.sol-newsletter__box h2 { font-size: 1.75rem; font-weight: 800; margin: 0 0 12px; }
.sol-newsletter__sub { color: var(--sol-text-soft); margin: 0 0 28px; line-height: 1.6; }
.sol-newsletter__form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.sol-newsletter__form input {
  padding: 14px 18px; border: 1.5px solid var(--sol-border);
  border-radius: 10px; font-family: inherit; font-size: 15px;
}
.sol-newsletter__form input:focus { outline: none; border-color: var(--sol-amber-400); }
.sol-newsletter__form button { width: 100%; justify-content: center; }
.sol-newsletter__guarantee {
  display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;
  font-size: 12px; color: var(--sol-text-muted);
}

/* FINAL CTA */
.sol-final {
  background: radial-gradient(ellipse at center, rgba(254,243,199,.3), transparent 70%),
              linear-gradient(180deg, var(--sol-navy-900), var(--sol-navy-800));
  color: white; text-align: center;
}
.sol-final__inner { max-width: 720px; margin: 0 auto; }
.sol-final__motto {
  font-family: 'Lora', serif; font-style: italic;
  color: var(--sol-amber-300); font-size: 1.15rem; margin: 0 0 24px;
}
.sol-final h2 {
  color: white; font-size: clamp(2rem, 5vw, 3rem); font-weight: 800;
  margin: 0 0 40px; line-height: 1.2;
}
.sol-final__alt { margin: 32px 0 20px; color: var(--sol-navy-300); font-size: 14px; }
.sol-final__secondary {
  display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;
}
.sol-final__secondary a {
  font-size: 14px; color: var(--sol-amber-300);
  text-decoration: none; border-bottom: 1px solid transparent;
}
.sol-final__secondary a:hover { border-bottom-color: var(--sol-amber-300); }

/* FOOTER */
.sol-footer {
  background: var(--sol-navy-900); color: var(--sol-navy-300);
  padding: 80px 0 32px;
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
  color: var(--sol-amber-300); font-size: 14px; line-height: 1.5; margin: 0;
}
.sol-footer__col h4 {
  color: white; font-size: 13px; text-transform: uppercase;
  letter-spacing: 1.5px; margin: 0 0 16px; font-weight: 700;
}
.sol-footer__col ul { list-style: none; padding: 0; margin: 0; }
.sol-footer__col li { margin-bottom: 8px; font-size: 14px; }
.sol-footer__col a { color: var(--sol-navy-300); font-size: 14px; }
.sol-footer__col a:hover { color: var(--sol-amber-400); }
.sol-footer__col small {
  font-size: 11px; color: var(--sol-navy-400); line-height: 1.4;
  display: block; margin-top: 2px;
}
.sol-footer__bottom {
  padding-top: 24px; border-top: 1px solid var(--sol-navy-700);
  display: flex; justify-content: space-between; gap: 16px;
  flex-wrap: wrap; font-size: 13px;
}
.sol-footer__bottom strong { color: white; }
.sol-footer__disclaim { max-width: 480px; color: var(--sol-navy-400); }
.sol-footer__disclaim a { color: var(--sol-amber-400); text-decoration: underline; }
@media (max-width: 1024px) {
  .sol-footer__grid { grid-template-columns: repeat(3, 1fr); }
  .sol-footer__brand-col { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .sol-footer__grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
</head>
<body <?php body_class('sol-landing-body'); ?>>

<?php
// Output page content as-is (FULL HTML expected from page editor)
echo apply_filters('the_content', $content);
?>

<?php do_action('wp_footer'); ?>

<!-- JWT transfer cross-domain -->
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

new Sol_Landing_Template();
