<?php
/**
 * Plugin Name: Sol Widget Embed
 * Description: Inject sol-widget.js (chat bubble Sol AI) vào footer
 *              của TOÀN BỘ sol.vn — kể cả wiki posts, blog, landing.
 *              Widget bubble tự render góc dưới phải với z-index cao,
 *              user chat trực tiếp với Sol AI từ bất kỳ trang nào.
 * Version:     1.0.0
 * Author:      Khang Sol
 *
 * Cài: Upload file này vào /wp-content/mu-plugins/sol-widget-embed.php
 *      (mu-plugins = must-use plugins, tự kích hoạt, không cần Activate).
 *
 * Cross-domain notes:
 *   - Widget script load từ https://bothuocla.sol.vn/sol-widget.js
 *   - localStorage scoped theo origin → sol.vn ≠ bothuocla.sol.vn
 *   - Khi user click CTA sang bothuocla.sol.vn, page template
 *     sol-landing-template.php có script forward JWT qua URL params
 *     để giữ chat history cross-domain.
 *
 * Uninstall: chỉ cần xoá file khỏi mu-plugins/, widget biến mất ngay.
 */

if (!defined('ABSPATH')) exit;

add_action('wp_footer', function() {
    // Skip nếu trang admin (wp-admin) — chỉ inject ở public site
    if (is_admin()) return;

    // Skip trong AMP nếu có (script tag không hoạt động trong AMP)
    if (function_exists('is_amp_endpoint') && is_amp_endpoint()) return;
    ?>
    <!-- Sol Widget — chat bubble từ bothuocla.sol.vn -->
    <script src="https://bothuocla.sol.vn/sol-widget.js" defer></script>
    <?php
}, 999);
