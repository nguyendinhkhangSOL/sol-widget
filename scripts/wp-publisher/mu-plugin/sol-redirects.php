<?php
/**
 * Plugin Name: Sol — Legacy URL Redirects
 * Description: 301 redirect các URL cũ đã trash → URL mới phù hợp.
 *              Giữ SEO juice + tránh 404 cho user click backlink/Google cache.
 * Version:     1.0
 * Author:      Sol Team
 *
 * Cài đặt: upload file này vào /wp-content/mu-plugins/sol-redirects.php
 * — Không cần activate, WordPress tự load.
 *
 * Cập nhật: thêm entry vào $SOL_REDIRECTS khi trash thêm bài.
 */

if (!defined('ABSPATH')) exit;

// ─── Map cũ → mới ──────────────────────────────────────────────────
// Path KHÔNG có domain, có leading /, có trailing /.
// Match cả 2 trường hợp: có và không trailing slash.
$SOL_REDIRECTS = [
    // Pages Sol v1/v2 đã trash (task #97 cleanup-legacy)
    '/sol-home/'                          => '/',
    '/88-ngay/'                           => '/bo-thuoc-la/',
    '/q-day/'                             => '/bo-thuoc-la/',
    '/14-ngay/'                           => '/bo-thuoc-la/',
    '/7-ngay/'                            => '/bo-thuoc-la/',
    '/sol-song-lai-lam-lai-tot-hon/'      => '/',
    '/chuyen-cua-nguoi-sang-lap/'         => '/khang-nguyen-tai-sinh-tuoi-50/',
    '/privacy-policy/'                    => '/chinh-sach-bao-mat/',

    // Bài #598 trash (task #108) — "Tầm nhìn Sol & Miễn trừ trách nhiệm"
    '/tam-nhin-sol-mien-tru-trach-nhiem/' => '/sol-gioi-thieu-thuong-hieu-va-su-menh/',

    // 2 bài slug emoji URL-encoded → slug sạch (task #110)
    '/%f0%9f%8c%b1-ngay-4-7-sau-khi-bo-thuoc-giai-doan-hoi-phuc-ban-dau-va-bay-chu-quan/' => '/ngay-4-7-bo-thuoc-hoi-phuc-ban-dau/',
    '/%f0%9f%a7%a0-tuan-2-sau-khi-bo-thuoc-nao-bat-dau-tai-can-bang-va-cam-giac-trong-rong/' => '/tuan-2-bo-thuoc-nao-tai-can-bang/',

    // 6 Q-Day duplicates → bài Day 1-30 series (task #118)
    '/24h-dau-bo-thuoc/'                       => '/ngay-1-24-gio-dau-tien-bo-thuoc-la/',
    '/ngay-2-3-bo-thuoc/'                      => '/ngay-2-dinh-con-them-nicotine/',
    '/ngay-4-7-bo-thuoc-hoi-phuc-ban-dau/'     => '/ngay-4-mat-ngu-va-roi-loan-giac-ngu-giai-thich-khoa-hoc/',
    '/tuan-2-bo-thuoc-nao-tai-can-bang/'       => '/ngay-14-moc-2-tuan-bo-thuoc/',
    '/tuan-3-4-sau-khi-bo-thuoc/'              => '/ngay-21-moc-3-tuan-bo-thuoc-vong-lap-thoi-quen-da-yeu-di/',
    '/sau-30-ngay-bo-thuoc/'                   => '/ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-ai/',

    // D14 slug được rename (task — consistent pattern ngay-N-...)
    '/moc-2-tuan-tuan-hoan-cai-thien-phoi-manh-hon/' => '/ngay-14-moc-2-tuan-bo-thuoc/',

    // Wiki cũ với prefix /wiki/ (nếu Google đã từng index)
    // KHÔNG redirect tất cả /wiki/* — chỉ những slug đã chắc chắn live
    // Format: '/wiki/<slug>/' => '/<slug>/'
    // (uncomment khi cần)
    // '/wiki/cai-thuoc-la-tai-nha/' => '/cai-thuoc-la-tai-nha/',
];

// ─── Redirect handler ─────────────────────────────────────────────
add_action('template_redirect', function () use ($SOL_REDIRECTS) {
    // Chỉ chạy cho 404 hoặc khi WP sắp render — tránh loop
    if (is_admin()) return;

    $request = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (!$request) return;

    // Normalize: đảm bảo có trailing slash
    $normalized = rtrim($request, '/') . '/';

    if (isset($SOL_REDIRECTS[$normalized])) {
        $target = $SOL_REDIRECTS[$normalized];
        wp_safe_redirect(home_url($target), 301);
        exit;
    }

    // Bonus: /?p=598 → tam-nhin → /sol-gioi-thieu.../
    // (WP đã handle ?p=ID nếu post tồn tại — chỉ catch khi post đã trash)
    if (isset($_GET['p']) && $_GET['p'] === '598') {
        wp_safe_redirect(home_url('/sol-gioi-thieu-thuong-hieu-va-su-menh/'), 301);
        exit;
    }
}, 1);

// ─── Helper: log redirects (chỉ dev, tắt khi production) ─────────
// add_action('template_redirect', function () {
//     if (is_admin()) return;
//     error_log('[sol-redirect] ' . $_SERVER['REQUEST_URI']);
// }, 0);
