<?php
/**
 * Plugin Name: Sol User Nav Widget
 * Description: Inject sol-user-nav widget vào tất cả WordPress pages sol.vn
 * Version: 3.2
 * Author: Sol La Bàn
 *
 * ─── Deploy qua cPanel File Manager ───
 * Upload đè vào: /public_html/wp-content/mu-plugins/sol-user-nav.php
 *
 * File JS (đã upload hôm nay):
 *   /public_html/wp-content/uploads/sol/sol-user-nav.js
 *
 * ─── Cleanup ───
 * File cũ `/public_html/sol-avatar-icon.js` có thể XÓA sau khi verify widget mới hoạt động
 */

if (!defined('ABSPATH')) exit;

// ─── Ngăn không cho load script cũ (nếu còn plugin/theme nào inject) ───
add_action('wp_enqueue_scripts', function() {
    // Deregister old avatar icon if exists
    wp_deregister_script('sol-avatar-icon');
}, 100);

// ─── Inject widget mới vào footer ───
add_action('wp_footer', function() {
    if (is_admin() || is_login()) return;

    // Load từ /wp-content/uploads/sol/ (path anh đã upload)
    $script_url = content_url('/uploads/sol/sol-user-nav.js');
    $version = '3.2.' . date('Ymd');

    echo "\n<!-- Sol User Nav Widget v3.2 -->\n";
    echo '<script src="' . esc_url($script_url) . '?v=' . esc_attr($version) . '" async></script>' . "\n";
}, 999);
