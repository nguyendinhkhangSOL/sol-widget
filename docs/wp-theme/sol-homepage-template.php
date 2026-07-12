<?php
/**
 * Plugin Name: Sol Homepage Template (v3 — Thân · Tâm · Trí)
 * Description: Đăng ký page template "Sol Homepage v3 — Thân Tâm Trí" cho trang
 *              chủ sol.vn. Template render full HTML homepage với hero 3 CTA,
 *              narrative, 3 trụ cột, discovery, founder, community + Master
 *              Footer v3. Schema Organization + WebSite + Person built-in.
 * Version:     3.0.0
 * Author:      Khang Sol
 * Created:     2026-06-16
 *
 * Cài đặt:
 *   1. Upload file này vào: /var/www/sol.vn/wp-content/mu-plugins/sol-homepage-template.php
 *      (Mu-plugin tự active, KHÔNG cần Activate trong WP Admin)
 *   2. WP Admin → Pages → Edit trang chủ (page hiện tại đang là front page)
 *   3. Sidebar phải → Page Attributes → Template:
 *      Chọn "Sol Homepage v3 — Thân Tâm Trí"
 *   4. Save / Update
 *   5. Verify: mở sol.vn → hero "Đi Cùng Sol — Tái thiết U45 theo Thân · Tâm · Trí" hiện ra
 *
 * Rollback nếu lỗi:
 *   Edit page → Template: chọn lại template cũ (vd "Sol Landing — Full HTML")
 *   → trang chủ về layout cũ ngay lập tức (không cần xoá file)
 *
 * Khác Sol Default / Sol Landing:
 *   - Sol Default: page tĩnh text-heavy (Chính sách, Điều khoản) — max 760px
 *   - Sol Landing: landing pages (hero, sections) — max 1080px, Article schema
 *   - Sol Homepage: TRANG CHỦ duy nhất — Organization schema + 7 block hardcoded
 */

if (!defined('ABSPATH')) exit;

class Sol_Homepage_TanTamTri_Template {
    const TEMPLATE_KEY = 'sol-homepage-tantamtri.php';
    const TEMPLATE_NAME = 'Sol Homepage v3 — Thân Tâm Trí';

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

        $tmp = sys_get_temp_dir() . '/sol-homepage-' . get_the_ID() . '.php';
        $content = $this->homepage_html();
        file_put_contents($tmp, $content);
        return $tmp;
    }

    private function homepage_html() {
        return <<<'PHP'
<?php
the_post();
$title = 'Đi Cùng Sol — Tái thiết U45 theo Thân · Tâm · Trí';
$meta_desc = 'Sol đồng hành đàn ông Việt 45+ trên 3 trụ cột Thân–Tâm–Trí: bỏ thuốc lá (bothuocla), sức khoẻ tinh thần (Tâm), tìm hướng tái khởi nghiệp (huongdi). Founder Khang Sol: 30 năm hút Vinataba, 5 năm tự do, 20 năm CNTT.';
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

<title><?php echo esc_html($title); ?></title>
<meta name="description" content="<?php echo esc_attr($meta_desc); ?>">

<meta property="og:type" content="website">
<meta property="og:title" content="<?php echo esc_attr($title); ?>">
<meta property="og:description" content="<?php echo esc_attr($meta_desc); ?>">
<meta property="og:url" content="<?php echo esc_url(home_url('/')); ?>">
<meta property="og:image" content="https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="<?php echo esc_url(home_url('/')); ?>">

<?php
// ─── SCHEMA — Organization + WebSite + Person (EEAT site-wide) ───
$site_url = home_url('/');
$logo_url = 'https://sol.vn/wp-content/uploads/2025/05/Icon_2.png';

$organization_schema = [
    '@context' => 'https://schema.org',
    '@type' => 'Organization',
    'name' => 'Đi Cùng Sol',
    'alternateName' => 'Sol',
    'url' => $site_url,
    'logo' => $logo_url,
    'description' => 'Hệ sinh thái đồng hành đàn ông Việt 45+ trên 3 trụ cột Thân–Tâm–Trí: sức khoẻ thể chất (bỏ thuốc lá), sức khoẻ tinh thần (chuyên mục Tâm), và trí tuệ sự nghiệp (tìm hướng tái khởi nghiệp).',
    'founder' => [
        '@type' => 'Person',
        'name' => 'Khang Sol',
        'alternateName' => 'Nguyễn Đình Khang',
        'url' => $site_url . 'khang-sol/',
        'image' => 'https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg',
        'jobTitle' => 'Founder, Đi Cùng Sol',
        'email' => 'contact@sol.vn',
        'telephone' => '+84-24-3993-1800',
        'sameAs' => [
            'https://www.linkedin.com/in/vietnaminternet/',
            'https://web.facebook.com/nguyendinhkhang',
        ],
        'knowsAbout' => [
            'Smoking cessation',
            'Nicotine dependence (FTND)',
            'Mid-life mental wellness',
            'Vietnamese mid-life philosophy',
            'Lean startup',
            'IT project management',
            'Vietnamese SME',
        ],
    ],
    'sameAs' => [
        'https://www.linkedin.com/in/vietnaminternet/',
        'https://web.facebook.com/nguyendinhkhang',
    ],
    'contactPoint' => [
        '@type' => 'ContactPoint',
        'telephone' => '+84-24-3993-1800',
        'email' => 'contact@sol.vn',
        'contactType' => 'customer service',
        'availableLanguage' => 'Vietnamese',
    ],
];

$website_schema = [
    '@context' => 'https://schema.org',
    '@type' => 'WebSite',
    'name' => 'Đi Cùng Sol',
    'url' => $site_url,
    'inLanguage' => 'vi-VN',
    'publisher' => [
        '@type' => 'Organization',
        'name' => 'Đi Cùng Sol',
        'url' => $site_url,
    ],
    'potentialAction' => [
        '@type' => 'SearchAction',
        'target' => $site_url . '?s={search_term_string}',
        'query-input' => 'required name=search_term_string',
    ],
];
?>

<script type="application/ld+json"><?php echo wp_json_encode($organization_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>
<script type="application/ld+json"><?php echo wp_json_encode($website_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>

<?php do_action('wp_head'); ?>

<style>
:root {
  --sol-cream: #FBF7F0;
  --sol-peach: #F5DDD9;
  --sol-sand: #F5E6DE;
  --sol-sun: #E8924A;
  --sol-clay: #B25C2C;
  --sol-clay-dark: #6B3318;
  --sol-earth: #5C3A1E;
  --sol-ink: #2A2620;
  --sol-ink-2: #5A5650;
  --sol-ink-3: #8A857C;
  --sol-line: #E8DCCA;
  --sol-than-green: #388e3c;
  --sol-than-soft: #E8F5E9;
  --sol-tam-sun: #E8924A;
  --sol-tam-soft: #FFF3E0;
  --sol-tri-clay: #B25C2C;
  --sol-tri-soft: #FBE8DA;
  --sol-red: #8B0000;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-size: 17px;
  line-height: 1.7;
  color: var(--sol-ink);
  background: var(--sol-cream);
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--sol-clay); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ─── HEADER STICKY 3 trụ ─────────────────────────────────────── */
.sol-top-nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(251, 247, 240, 0.96);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--sol-line);
}
.sol-top-nav-inner { max-width: 1200px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.sol-top-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--sol-earth); font-weight: 700; font-size: 17px; }
.sol-top-nav-brand-mark { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--sol-sun) 0%, var(--sol-clay) 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.sol-top-nav-brand-text small { display: block; font-size: 11px; font-weight: 500; color: var(--sol-ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-top: -2px; }
.sol-top-nav-links { display: flex; align-items: center; gap: 4px; font-size: 14px; flex-wrap: wrap; }
.sol-top-nav-links a { padding: 8px 12px; color: var(--sol-ink-2); text-decoration: none; font-weight: 500; border-radius: 6px; transition: background 0.15s, color 0.15s; }
.sol-top-nav-links a:hover { background: var(--sol-sand); color: var(--sol-earth); }
.sol-top-nav-pillar-than { color: var(--sol-than-green) !important; }
.sol-top-nav-pillar-than:hover { background: var(--sol-than-soft) !important; }
.sol-top-nav-pillar-tam { color: var(--sol-tam-sun) !important; }
.sol-top-nav-pillar-tam:hover { background: var(--sol-tam-soft) !important; }
.sol-top-nav-pillar-tri { color: var(--sol-tri-clay) !important; }
.sol-top-nav-pillar-tri:hover { background: var(--sol-tri-soft) !important; }
.sol-top-nav-cta { background: var(--sol-clay) !important; color: white !important; font-weight: 600 !important; padding: 8px 16px !important; }
.sol-top-nav-cta:hover { background: var(--sol-earth) !important; color: white !important; }

/* ─── HOMEPAGE CONTENT ────────────────────────────────────────── */
.sol-homepage-container { max-width: 1200px; margin: 0 auto; padding: 20px; }

/* HERO */
.sol-hero {
  background: linear-gradient(135deg, #FBF7F0 0%, #F5DDD9 60%, #E8924A 100%);
  color: var(--sol-ink); padding: 60px 40px; border-radius: 16px;
  text-align: center; margin-bottom: 50px;
  box-shadow: 0 4px 20px rgba(178, 92, 44, 0.10);
  position: relative; overflow: hidden;
}
.sol-hero::before { content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(232,146,74,0.3) 0%, transparent 70%); border-radius: 50%; }
.sol-hero-sun { font-size: 56px; margin-bottom: 12px; }
.sol-hero h1 { font-size: 2.6rem; font-weight: 800; margin: 0 0 14px 0; letter-spacing: -0.025em; line-height: 1.15; color: var(--sol-clay-dark); }
.sol-hero-tagline { font-size: 1.15rem; max-width: 720px; margin: 0 auto 36px auto; color: var(--sol-ink-2); }
.sol-hero-tagline strong { color: var(--sol-clay-dark); }
.sol-hero-ctas { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; max-width: 980px; margin: 0 auto 24px auto; position: relative; z-index: 1; }
.sol-hero-cta { display: block; text-decoration: none; padding: 22px 24px; border-radius: 12px; text-align: left; transition: transform 0.2s, box-shadow 0.2s; background: #ffffff; border-top: 4px solid; }
.sol-hero-cta:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); text-decoration: none; }
.sol-hero-cta-emoji { font-size: 32px; display: block; margin-bottom: 8px; }
.sol-hero-cta-pillar { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 6px; display: block; }
.sol-hero-cta-title { font-size: 1.15rem; font-weight: 800; color: var(--sol-ink); margin-bottom: 4px; }
.sol-hero-cta-desc { font-size: 0.88rem; color: var(--sol-ink-2); line-height: 1.5; }
.sol-hero-cta-arrow { font-size: 0.92rem; font-weight: 700; margin-top: 12px; }
.sol-hero-cta--than { border-top-color: var(--sol-than-green); }
.sol-hero-cta--than .sol-hero-cta-pillar, .sol-hero-cta--than .sol-hero-cta-arrow { color: var(--sol-than-green); }
.sol-hero-cta--tam { border-top-color: var(--sol-tam-sun); }
.sol-hero-cta--tam .sol-hero-cta-pillar, .sol-hero-cta--tam .sol-hero-cta-arrow { color: var(--sol-tam-sun); }
.sol-hero-cta--tri { border-top-color: var(--sol-tri-clay); }
.sol-hero-cta--tri .sol-hero-cta-pillar, .sol-hero-cta--tri .sol-hero-cta-arrow { color: var(--sol-tri-clay); }
.sol-hero-secondary { font-size: 0.9rem; color: var(--sol-ink-2); margin-top: 18px; }
.sol-hero-secondary a { color: var(--sol-clay); font-weight: 600; text-decoration: none; border-bottom: 1px dotted var(--sol-clay); }

/* NARRATIVE */
.sol-narrative { max-width: 820px; margin: 0 auto 50px auto; text-align: center; padding: 0 20px; }
.sol-narrative-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 18px; color: var(--sol-clay-dark); }
.sol-narrative-body { font-size: 1.05rem; color: var(--sol-ink); line-height: 1.75; }
.sol-narrative-body strong { color: var(--sol-clay-dark); }
.sol-narrative-body em { display: block; margin-top: 14px; font-size: 0.95rem; color: var(--sol-ink-2); font-style: italic; }

/* 3 PILLARS */
.sol-pillars-title { font-size: 1.9rem; font-weight: 700; text-align: center; margin-bottom: 8px; color: var(--sol-ink); letter-spacing: -0.02em; }
.sol-pillars-sub { text-align: center; color: var(--sol-ink-2); margin-bottom: 32px; font-size: 1.02rem; }
.sol-pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 50px; }
.sol-pillar-card { border: 1px solid var(--sol-line); padding: 30px; border-radius: 14px; background: #ffffff; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s; border-top-width: 4px; }
.sol-pillar-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,0.08); }
.sol-pillar-emoji { font-size: 44px; margin-bottom: 14px; }
.sol-pillar-eyebrow { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 6px; }
.sol-pillar-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.01em; }
.sol-pillar-subtitle { font-size: 0.95rem; color: var(--sol-ink-2); font-style: italic; margin: 0 0 16px 0; }
.sol-pillar-desc { font-size: 0.98rem; color: var(--sol-ink-2); line-height: 1.65; margin: 0 0 18px 0; }
.sol-pillar-bullets { list-style: none; padding: 0; margin: 0 0 22px 0; flex-grow: 1; }
.sol-pillar-bullets li { padding: 6px 0 6px 24px; position: relative; font-size: 0.93rem; color: var(--sol-ink); }
.sol-pillar-bullets li::before { content: '✓'; position: absolute; left: 0; font-weight: 700; }
.sol-pillar-cta { display: block; text-align: center; padding: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 0.98rem; transition: opacity 0.2s; }
.sol-pillar-cta:hover { opacity: 0.9; text-decoration: none; }
.sol-pillar-status { font-size: 0.75rem; color: var(--sol-ink-3); text-align: center; margin-top: 10px; font-style: italic; }
.sol-pillar--than { border-top-color: var(--sol-than-green); }
.sol-pillar--than .sol-pillar-eyebrow, .sol-pillar--than .sol-pillar-title { color: var(--sol-than-green); }
.sol-pillar--than .sol-pillar-bullets li::before { color: var(--sol-than-green); }
.sol-pillar--than .sol-pillar-cta { background: var(--sol-than-green); color: white; }
.sol-pillar--tam { border-top-color: var(--sol-tam-sun); }
.sol-pillar--tam .sol-pillar-eyebrow, .sol-pillar--tam .sol-pillar-title { color: var(--sol-tam-sun); }
.sol-pillar--tam .sol-pillar-bullets li::before { color: var(--sol-tam-sun); }
.sol-pillar--tam .sol-pillar-cta { background: var(--sol-tam-sun); color: white; }
.sol-pillar--tri { border-top-color: var(--sol-tri-clay); }
.sol-pillar--tri .sol-pillar-eyebrow, .sol-pillar--tri .sol-pillar-title { color: var(--sol-tri-clay); }
.sol-pillar--tri .sol-pillar-bullets li::before { color: var(--sol-tri-clay); }
.sol-pillar--tri .sol-pillar-cta { background: var(--sol-tri-clay); color: white; }

/* DISCOVERY */
.sol-discovery { background: var(--sol-sand); border: 1px solid var(--sol-line); padding: 36px; border-radius: 14px; margin-bottom: 50px; }
.sol-discovery-head { text-align: center; margin-bottom: 24px; }
.sol-discovery h2 { font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0; color: var(--sol-clay-dark); }
.sol-discovery-sub { margin: 0; color: var(--sol-ink-2); font-size: 0.98rem; }
.sol-discovery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; max-width: 900px; margin: 0 auto; }
.sol-discovery-chip { display: block; text-align: center; background: white; border: 2px solid var(--sol-line); color: var(--sol-ink); padding: 16px 12px; font-weight: 700; text-decoration: none; border-radius: 10px; transition: all 0.2s; }
.sol-discovery-chip:hover { border-color: var(--sol-clay); color: var(--sol-clay); transform: translateY(-2px); text-decoration: none; }
.sol-discovery-chip-vnd { display: block; font-size: 1.1rem; margin-bottom: 4px; }
.sol-discovery-chip-action { display: block; font-size: 0.82rem; font-weight: 500; color: var(--sol-ink-3); }
.sol-discovery-note { text-align: center; margin-top: 16px; font-size: 0.82rem; color: var(--sol-ink-3); font-style: italic; }

/* FOUNDER */
.sol-founder { background: linear-gradient(135deg, #2A2620 0%, #5C3A1E 50%, #6B3318 100%); color: #FBF7F0; padding: 50px 40px; border-radius: 16px; display: flex; flex-wrap: wrap; gap: 36px; align-items: center; margin-bottom: 50px; position: relative; overflow: hidden; }
.sol-founder::before { content: ''; position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(232,146,74,0.2) 0%, transparent 70%); border-radius: 50%; }
.sol-founder-photo { flex: 0 0 auto; width: 200px; height: 240px; position: relative; z-index: 1; }
.sol-founder-photo img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; border: 4px solid #FBF7F0; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.sol-founder-content { flex: 1; min-width: 280px; position: relative; z-index: 1; }
.sol-founder-eyebrow { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--sol-sun); margin-bottom: 8px; }
.sol-founder h2 { font-size: 1.7rem; font-weight: 800; margin: 0 0 6px 0; color: #FBF7F0; }
.sol-founder-role { font-size: 0.95rem; color: #E8DCCA; font-style: italic; margin: 0 0 18px 0; }
.sol-founder-body p { margin: 0 0 12px 0; line-height: 1.7; color: #FBF7F0; font-size: 1rem; }
.sol-founder-body strong { color: var(--sol-sun); }
.sol-founder-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 18px 0; }
.sol-founder-pillar { background: rgba(232,146,74,0.12); border: 1px solid rgba(232,146,74,0.3); padding: 12px; border-radius: 10px; text-align: center; }
.sol-founder-pillar-icon { font-size: 22px; margin-bottom: 4px; }
.sol-founder-pillar-name { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; color: var(--sol-sun); margin-bottom: 4px; }
.sol-founder-pillar-cred { font-size: 0.82rem; color: #E8DCCA; line-height: 1.4; }
.sol-founder-link { display: inline-block; color: var(--sol-sun); font-weight: 700; text-decoration: none; margin-top: 4px; font-size: 0.95rem; border-bottom: 1px dotted var(--sol-sun); }

/* COMMUNITY */
.sol-community { background: #ffffff; border: 1px solid var(--sol-line); padding: 36px; border-radius: 14px; text-align: center; margin-bottom: 50px; }
.sol-community h3 { font-size: 1.35rem; font-weight: 700; margin: 0 0 8px 0; color: var(--sol-ink); }
.sol-community-sub { font-size: 1rem; color: var(--sol-ink-2); margin: 0 0 22px 0; }
.sol-community-btn { display: inline-block; background: var(--sol-clay); color: white; padding: 14px 32px; font-size: 1rem; font-weight: 700; text-decoration: none; border-radius: 10px; }
.sol-community-btn:hover { text-decoration: none; opacity: 0.9; }

/* ─── MASTER FOOTER v3 ──────────────────────────────────────────── */
.sol-footer { background: white; border-top: 1px solid var(--sol-line); padding: 40px 20px 24px 20px; margin-top: 40px; font-size: 14px; color: var(--sol-ink); line-height: 1.6; }
.sol-footer-inner { max-width: 1100px; margin: 0 auto; }
.sol-footer-brand { display: flex; flex-wrap: wrap; gap: 24px; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--sol-line); margin-bottom: 28px; }
.sol-footer-brand-left { display: flex; align-items: center; gap: 14px; flex: 0 0 auto; }
.sol-footer-brand-logo { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, var(--sol-sun) 0%, var(--sol-clay) 100%); display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
.sol-footer-brand-text-block { line-height: 1.3; }
.sol-footer-brand-text-block strong { font-size: 18px; font-weight: 800; color: var(--sol-ink); display: block; }
.sol-footer-brand-text-block span { font-size: 13px; color: var(--sol-clay); font-style: italic; }
.sol-footer-brand-pitch { flex: 1 1 320px; min-width: 280px; font-size: 14px; color: var(--sol-ink-2); line-height: 1.6; }
.sol-footer-brand-pitch strong { color: var(--sol-clay); }
.sol-footer-nav { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 24px; margin-bottom: 28px; }
.sol-footer-col h4 { font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 8px; margin-bottom: 10px; }
.sol-footer-col--than h4 { color: var(--sol-than-green); border-bottom: 1px solid #C8E6C9; }
.sol-footer-col--tam h4 { color: var(--sol-tam-sun); border-bottom: 1px solid #FFE0B2; }
.sol-footer-col--tri h4 { color: var(--sol-tri-clay); border-bottom: 1px solid #EBC2A5; }
.sol-footer-col--about h4, .sol-footer-col--contact h4 { color: var(--sol-earth); border-bottom: 1px solid var(--sol-line); }
.sol-footer-col-list { display: flex; flex-direction: column; gap: 7px; font-size: 13.5px; }
.sol-footer-col-list a { color: var(--sol-ink-2); text-decoration: none; }
.sol-footer-col-list a:hover { color: var(--sol-clay); }
.sol-footer-col-list a strong { color: inherit; font-weight: 600; }
.sol-footer-col--than .sol-footer-col-list a strong { color: var(--sol-than-green); }
.sol-footer-col--tam .sol-footer-col-list a strong { color: var(--sol-tam-sun); }
.sol-footer-col--tri .sol-footer-col-list a strong { color: var(--sol-tri-clay); }
.sol-footer-col--about .sol-footer-col-list a strong { color: var(--sol-earth); }
.sol-footer-col-list em { color: var(--sol-ink-3); font-size: 12px; font-style: italic; }
.sol-footer-contact-line { display: block; margin-bottom: 10px; }
.sol-footer-contact-line-label { display: block; font-size: 11px; letter-spacing: 0.5px; color: var(--sol-ink-3); font-weight: 600; margin-bottom: 2px; }
.sol-footer-contact-line a { color: var(--sol-clay); font-weight: 600; }
.sol-footer-disclaimer { background: #FAF6EE; border-left: 4px solid var(--sol-sun); border-radius: 6px; padding: 20px 24px; margin-bottom: 24px; font-size: 13px; line-height: 1.7; color: var(--sol-ink-2); }
.sol-footer-safety { margin-bottom: 14px; }
.sol-footer-safety-title { display: block; color: var(--sol-red); font-size: 14px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 10px; }
.sol-footer-safety-lines { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 6px 18px; font-size: 13px; }
.sol-footer-safety-lines a { font-weight: 700; }
.sol-footer-safety-tel { color: var(--sol-red); }
.sol-footer-safety-link { color: var(--sol-clay); }
.sol-footer-tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; margin-right: 6px; }
.sol-footer-tag-than { background: var(--sol-than-soft); color: var(--sol-than-green); }
.sol-footer-tag-tam { background: var(--sol-tam-soft); color: var(--sol-tam-sun); }
.sol-footer-tag-tri { background: var(--sol-tri-soft); color: var(--sol-tri-clay); }
.sol-footer-divider { border: none; border-top: 1px solid var(--sol-line); margin: 14px 0; }
.sol-footer-disclaimer p { margin: 0 0 10px; }
.sol-footer-disclaimer p:last-child { margin-bottom: 0; }
.sol-footer-disclaimer strong { color: var(--sol-ink); }
.sol-footer-warn-than { color: var(--sol-than-green); font-weight: 700; }
.sol-footer-warn-tam { color: var(--sol-tam-sun); font-weight: 700; }
.sol-footer-warn-tri { color: var(--sol-tri-clay); font-weight: 700; }
.sol-footer-bottom { border-top: 1px solid var(--sol-line); padding-top: 18px; text-align: center; font-size: 13px; color: var(--sol-ink-3); }
.sol-footer-trustlinks { margin-bottom: 12px; line-height: 2; }
.sol-footer-trustlinks a { color: var(--sol-clay); text-decoration: none; }
.sol-footer-trustlinks a:hover { text-decoration: underline; }
.sol-footer-copyright { margin: 0 0 6px; color: var(--sol-ink-2); }
.sol-footer-regulatory { font-size: 12px; color: var(--sol-ink-3); margin: 0 0 6px; }
.sol-footer-sources { margin-top: 10px; font-size: 11.5px; color: var(--sol-ink-3); line-height: 1.5; }
.sol-footer-sources strong { color: var(--sol-clay); }

/* RESPONSIVE */
@media (max-width: 720px) {
  .sol-top-nav-inner { padding: 10px 16px; gap: 8px; }
  .sol-top-nav-brand-text { display: none; }
  .sol-top-nav-links { font-size: 13px; gap: 0; }
  .sol-top-nav-links a { padding: 6px 8px; }
  .sol-top-nav-links .sol-nav-mobile-hide { display: none; }
  .sol-hero { padding: 40px 20px; }
  .sol-hero h1 { font-size: 1.9rem; }
  .sol-pillars-grid { grid-template-columns: 1fr; }
  .sol-founder { flex-direction: column; }
  .sol-founder-pillars { grid-template-columns: 1fr; }
  .sol-footer { padding: 32px 16px 20px 16px; }
  .sol-footer-brand { flex-direction: column; align-items: flex-start; }
}
</style>
</head>
<body <?php body_class('sol-homepage-body'); ?>>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- HEADER STICKY 3 trụ                                                -->
<!-- ═══════════════════════════════════════════════════════════════ -->
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

<main class="sol-homepage-container">

  <!-- BLOCK 1: HERO ─────────────────────────────────────────────── -->
  <section class="sol-hero">
    <div class="sol-hero-sun" aria-hidden="true">🌅</div>
    <h1>Đi Cùng Sol — Tái thiết U45<br>theo Thân · Tâm · Trí</h1>
    <p class="sol-hero-tagline">
      Đồng hành đàn ông Việt 45+ trên <strong>3 trụ cột</strong>:
      Thân (sức khoẻ thể chất), Tâm (sức khoẻ tinh thần), Trí (hướng đi sự nghiệp).
      Không hô hào — chọn 1 trụ để bắt đầu hôm nay.
    </p>

    <div class="sol-hero-ctas">
      <a href="https://bothuocla.sol.vn/test-ftnd?utm_source=sol_homepage&utm_medium=hero&utm_campaign=than" class="sol-hero-cta sol-hero-cta--than">
        <span class="sol-hero-cta-emoji" aria-hidden="true">🌱</span>
        <span class="sol-hero-cta-pillar">Trụ THÂN</span>
        <div class="sol-hero-cta-title">Bỏ thuốc lá</div>
        <div class="sol-hero-cta-desc">Đo Mức Lệ Thuộc Nicotin · 90 giây · 6 câu</div>
        <div class="sol-hero-cta-arrow">Bắt đầu →</div>
      </a>

      <a href="/category/ngam/?utm_source=sol_homepage&utm_medium=hero&utm_campaign=tam" class="sol-hero-cta sol-hero-cta--tam">
        <span class="sol-hero-cta-emoji" aria-hidden="true">💭</span>
        <span class="sol-hero-cta-pillar">Trụ TÂM</span>
        <div class="sol-hero-cta-title">Bình tâm U45</div>
        <div class="sol-hero-cta-desc">Đọc Tâm · Sức khoẻ tinh thần · Định nghĩa lại bản thân</div>
        <div class="sol-hero-cta-arrow">Khám phá →</div>
      </a>

      <a href="https://huongdi.sol.vn/p1?utm_source=sol_homepage&utm_medium=hero&utm_campaign=tri" class="sol-hero-cta sol-hero-cta--tri">
        <span class="sol-hero-cta-emoji" aria-hidden="true">🚀</span>
        <span class="sol-hero-cta-pillar">Trụ TRÍ</span>
        <div class="sol-hero-cta-title">Tìm hướng đi</div>
        <div class="sol-hero-cta-desc">DNA hướng đi · 20 câu · 5 phút · 37 hướng</div>
        <div class="sol-hero-cta-arrow">Bắt đầu →</div>
      </a>
    </div>

    <p class="sol-hero-secondary">
      Mới biết Sol? <a href="/ve-sol/">Đọc Sol làm gì cho anh →</a>
    </p>
  </section>

  <!-- BLOCK 2: NARRATIVE ─────────────────────────────────────────── -->
  <section class="sol-narrative">
    <h2 class="sol-narrative-title">Vì sao Thân · Tâm · Trí — 1 người đi trước</h2>
    <p class="sol-narrative-body">
      Ở tuổi U45, mình nhận ra: không thể chỉ chữa <strong>Thân</strong> mà bỏ qua
      <strong>Tâm</strong>, cũng không thể chỉ làm <strong>Trí</strong> mà thân tâm
      kiệt quệ. Ba thứ ràng với nhau như kiềng 3 chân.<br><br>

      Mình đi qua cả ba:
      <strong>Thân</strong> — 30 năm hút Vinataba, 5 năm Tự do.
      <strong>Tâm</strong> — 5 năm đó, mình hiểu thêm về định nghĩa lại bản thân.
      <strong>Trí</strong> — 20+ năm CNTT, giờ tái khởi nghiệp lại.<br><br>

      Sol không chia 3 sản phẩm rời rạc — Sol đi cùng anh em qua từng giai đoạn của 1 con người.
      <em>— Khang Sol, người sáng lập</em>
    </p>
  </section>

  <!-- BLOCK 3: 3 PILLARS ─────────────────────────────────────────── -->
  <h2 class="sol-pillars-title">3 trụ cột — Cho 3 hành trình</h2>
  <p class="sol-pillars-sub">Chọn trụ cột phù hợp với giai đoạn hiện tại của anh.</p>

  <div class="sol-pillars-grid">

    <article class="sol-pillar-card sol-pillar--than">
      <div class="sol-pillar-emoji">🌱</div>
      <div class="sol-pillar-eyebrow">Trụ Thân — Sức khoẻ thể chất</div>
      <h3 class="sol-pillar-title">Bothuocla.sol.vn</h3>
      <p class="sol-pillar-subtitle">Bỏ thuốc lá khoa học cho U45</p>
      <p class="sol-pillar-desc">Lộ trình cai thuốc cá nhân hoá theo Mức Lệ Thuộc Nicotin (FTND). 3 cohort 35/52/65 ngày tuỳ độ nặng.</p>
      <ul class="sol-pillar-bullets">
        <li>Voice Khang Sol đọc thật — không bot</li>
        <li>Nhật ký + check-in qua Zalo OA</li>
        <li>Sổ Lưu Niệm khi hoàn thành</li>
        <li>Cộng đồng cùng cai</li>
      </ul>
      <a href="https://bothuocla.sol.vn/test-ftnd?utm_source=sol_homepage&utm_medium=pillar_than" class="sol-pillar-cta">Đo FTND miễn phí →</a>
      <p class="sol-pillar-status">App đang chạy · 35-65 ngày cohort</p>
    </article>

    <article class="sol-pillar-card sol-pillar--tam">
      <div class="sol-pillar-emoji">💭</div>
      <div class="sol-pillar-eyebrow">Trụ Tâm — Sức khoẻ tinh thần</div>
      <h3 class="sol-pillar-title">Tâm.sol.vn</h3>
      <p class="sol-pillar-subtitle">Bình tâm và định nghĩa lại bản thân</p>
      <p class="sol-pillar-desc">Bài viết về sức khoẻ tinh thần, stress trung niên, mindfulness, triết lý đời thường. Kế thừa kinh nghiệm thật của Khang.</p>
      <ul class="sol-pillar-bullets">
        <li>Stress &amp; cái bẫy khói thuốc</li>
        <li>Khẳng định bản thân tuổi 40+</li>
        <li>5 năm Tự do — học được gì</li>
        <li>Đối thoại với chính mình (sắp ra)</li>
      </ul>
      <a href="/category/ngam/?utm_source=sol_homepage&utm_medium=pillar_tam" class="sol-pillar-cta">Đọc chuyên mục Tâm →</a>
      <p class="sol-pillar-status">Content cluster · App riêng sẽ phát triển sau</p>
    </article>

    <article class="sol-pillar-card sol-pillar--tri">
      <div class="sol-pillar-emoji">🚀</div>
      <div class="sol-pillar-eyebrow">Trụ Trí — Hướng đi sự nghiệp</div>
      <h3 class="sol-pillar-title">Huongdi.sol.vn</h3>
      <p class="sol-pillar-subtitle">Tìm hướng tái khởi nghiệp U45</p>
      <p class="sol-pillar-desc">Direction Discovery Engine. Trắc nghiệm DNA cá nhân + nguồn lực → 37 hướng đi xếp hạng theo % phù hợp.</p>
      <ul class="sol-pillar-bullets">
        <li>P1: 20 câu DNA cá nhân (4 trục)</li>
        <li>P2: Nguồn lực hiện tại (8 trục)</li>
        <li>P3: 37 hướng đi xếp hạng</li>
        <li>Roadmap 30/90/180 ngày</li>
      </ul>
      <a href="https://huongdi.sol.vn/p1?utm_source=sol_homepage&utm_medium=pillar_tri" class="sol-pillar-cta">Khám phá DNA — 5 phút →</a>
      <p class="sol-pillar-status">App sắp ra mắt · 37 hướng đi</p>
    </article>

  </div>

  <!-- BLOCK 4: DISCOVERY ─────────────────────────────────────────── -->
  <section class="sol-discovery">
    <div class="sol-discovery-head">
      <h2>🚀 Trụ Trí: Khám phá hướng đi phù hợp với vốn</h2>
      <p class="sol-discovery-sub">Chọn mốc vốn — Sol gợi ý hướng đi phù hợp (không cam kết thu nhập):</p>
    </div>

    <div class="sol-discovery-grid">
      <a href="/khoi-nghiep-trung-nien/von-100-trieu/" class="sol-discovery-chip">
        <span class="sol-discovery-chip-vnd">💰 Vốn 100 triệu</span>
        <span class="sol-discovery-chip-action">Khám phá hướng →</span>
      </a>
      <a href="/khoi-nghiep-trung-nien/von-300-trieu/" class="sol-discovery-chip">
        <span class="sol-discovery-chip-vnd">💰 Vốn 300 triệu</span>
        <span class="sol-discovery-chip-action">Khám phá hướng →</span>
      </a>
      <a href="/khoi-nghiep-trung-nien/von-500-trieu/" class="sol-discovery-chip">
        <span class="sol-discovery-chip-vnd">💰 Vốn 500 triệu</span>
        <span class="sol-discovery-chip-action">Khám phá hướng →</span>
      </a>
      <a href="/khoi-nghiep-trung-nien/von-1-ty/" class="sol-discovery-chip">
        <span class="sol-discovery-chip-vnd">💰 Vốn 1 tỷ+</span>
        <span class="sol-discovery-chip-action">Khám phá hướng →</span>
      </a>
    </div>

    <p class="sol-discovery-note">⚠️ Sol không phải nhà tư vấn tài chính có giấy phép. Bài phục vụ giáo dục.</p>
  </section>

  <!-- BLOCK 5: FOUNDER ───────────────────────────────────────────── -->
  <section class="sol-founder">
    <div class="sol-founder-photo">
      <img src="https://sol.vn/wp-content/uploads/2026/05/khang-portrait-yulong-mountain.jpg" alt="Khang Sol — đứng trước đỉnh Ngọc Long Tuyết Sơn" />
    </div>

    <div class="sol-founder-content">
      <div class="sol-founder-eyebrow">Người sáng lập · 3 trụ cùng 1 con người</div>
      <h2>Khang Sol</h2>
      <p class="sol-founder-role">Founder, Đi Cùng Sol — Nguyễn Đình Khang</p>

      <div class="sol-founder-body">
        <p>Mình không phải bác sĩ. Cũng không phải nhà tư vấn tài chính. Mình là <strong>người đi trước</strong> — đã sống qua cả 3 trụ.</p>
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

      <a href="/khang-sol/" class="sol-founder-link">Đọc câu chuyện đầy đủ về Khang →</a>
    </div>
  </section>

  <!-- BLOCK 6: COMMUNITY ─────────────────────────────────────────── -->
  <section class="sol-community">
    <h3>💬 Cộng đồng Sol — Sòng phẳng &amp; Tử tế</h3>
    <p class="sol-community-sub">
      Zalo group cho anh em U45 đang đi trên 1 trong 3 trụ cột.<br>
      Không spam, không nhậu khuya, không khoe khoang. Chỉ chia sẻ thật.
    </p>
    <a href="https://zalo.me/g/your_group_id" class="sol-community-btn" target="_blank" rel="noopener">🔗 Tham gia Cộng đồng Sol</a>
  </section>

</main>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- MASTER FOOTER v3                                                   -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<footer class="sol-footer">
  <div class="sol-footer-inner">

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

    <nav class="sol-footer-nav" aria-label="Sol footer navigation">

      <div class="sol-footer-col sol-footer-col--than">
        <h4>🌱 Trụ Thân</h4>
        <div class="sol-footer-col-list">
          <a href="https://bothuocla.sol.vn/test-ftnd"><strong>Đo FTND</strong></a>
          <a href="/lo-trinh-cai-thuoc-la-khoa-hoc-7-ngay/">Lộ trình 7 ngày</a>
          <a href="/tai-sao-cai-thuoc-la-lai-bi-ho-co-dom/">Ho có đờm khi cai</a>
          <a href="/tac-hai-thuoc-la-thu-dong-doi-voi-tre-nho/">Hút thụ động</a>
          <a href="/category/wiki-bo-thuoc-la/">Wiki Bỏ thuốc</a>
          <a href="https://bothuocla.sol.vn/" target="_blank" rel="noopener">→ App bothuocla</a>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--tam">
        <h4>💭 Trụ Tâm</h4>
        <div class="sol-footer-col-list">
          <a href="/category/ngam/"><strong>Đọc Tâm</strong></a>
          <a href="/stress-tuoi-trung-nien-va-cai-bay-khoi-thuoc/">Stress &amp; khói thuốc</a>
          <a href="/khoi-nghiep-tuoi-40-khang-dinh-ban-than/">Khẳng định 40+</a>
          <a href="/khang-sol/#chuong-4">5 năm Tự do</a>
          <a href="/category/ngam/">Wiki Tâm an U45</a>
          <em>(App riêng phát triển sau)</em>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--tri">
        <h4>🚀 Trụ Trí</h4>
        <div class="sol-footer-col-list">
          <a href="https://huongdi.sol.vn/p1"><strong>Khám phá DNA</strong></a>
          <a href="/tuong-kinh-doanh-it-von-nguoi-trung-nien/">Kinh doanh ít vốn</a>
          <a href="/khoi-nghiep-tinh-gon-tuoi-trung-nien-it-von/">Khởi nghiệp tinh gọn</a>
          <a href="/khoi-nghiep-trung-nien/von-100-trieu/">Khám phá vốn 100M</a>
          <a href="/category/khoi-nghiep/">Wiki Khởi nghiệp</a>
          <a href="https://huongdi.sol.vn/" target="_blank" rel="noopener">→ App huongdi</a>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--about">
        <h4>📖 Về Sol</h4>
        <div class="sol-footer-col-list">
          <a href="/khang-sol/"><strong>Khang Sol</strong></a>
          <a href="/ve-sol/">Về dự án Sol</a>
          <a href="/sol-la-gi/">Sol làm gì cho anh</a>
          <a href="/cau-hoi/">21 câu hỏi FAQ</a>
          <a href="/gia/">Bảng giá Sol</a>
          <a href="/cong-dong/">Cộng đồng Sol</a>
        </div>
      </div>

      <div class="sol-footer-col sol-footer-col--contact">
        <h4>📞 Liên hệ</h4>
        <span class="sol-footer-contact-line"><span class="sol-footer-contact-line-label">ĐIỆN THOẠI</span><a href="tel:02439931800">024 3993 1800</a></span>
        <span class="sol-footer-contact-line"><span class="sol-footer-contact-line-label">EMAIL</span><a href="mailto:contact@sol.vn">contact@sol.vn</a></span>
        <span class="sol-footer-contact-line"><span class="sol-footer-contact-line-label">CỘNG ĐỒNG ZALO</span><a href="https://zalo.me/g/your_group_id" target="_blank" rel="noopener">Zalo group Sol</a></span>
        <span class="sol-footer-contact-line"><span class="sol-footer-contact-line-label">MẠNG XÃ HỘI</span><a href="https://linkedin.com/in/vietnaminternet" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://web.facebook.com/nguyendinhkhang" target="_blank" rel="noopener">Facebook</a></span>
      </div>

    </nav>

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

    <div class="sol-footer-bottom">
      <div class="sol-footer-trustlinks">
        <a href="/chinh-sach-bao-mat">Chính sách bảo mật</a> ·
        <a href="/dieu-khoan-su-dung">Điều khoản sử dụng</a> ·
        <a href="/tuyen-bo-mien-tru">Tuyên bố miễn trừ</a> ·
        <a href="/chinh-sach-cookie">Cookie</a> ·
        <a href="/lien-he">Liên hệ</a> ·
        <a href="/khang-sol/">Khang Sol</a>
      </div>
      <p class="sol-footer-copyright">© <?php echo date('Y'); ?> Sol — Khang Sol (Nguyễn Đình Khang) · <a href="https://sol.vn" style="color: var(--sol-clay); font-weight: 600;">sol.vn</a></p>
      <p class="sol-footer-regulatory">Sol đăng ký tại Việt Nam. Tuân thủ Luật An ninh mạng 2018, Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.</p>
      <p class="sol-footer-sources"><strong>Nguồn tham khảo:</strong> CDC · NHS UK · U.S. Surgeon General · WHO Mental Health · Bộ Y tế Việt Nam · BV Tâm thần TW · APA · Eric Ries · Harvard Business Review · MPI Việt Nam</p>
    </div>

  </div>
</footer>

<?php do_action('wp_footer'); ?>

<!-- ─── JWT cross-domain ────────────────────────────────────────── -->
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

new Sol_Homepage_TanTamTri_Template();
