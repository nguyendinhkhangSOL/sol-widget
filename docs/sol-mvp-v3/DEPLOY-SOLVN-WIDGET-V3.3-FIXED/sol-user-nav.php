<?php
/**
 * Plugin Name: Sol User Nav Widget
 * Description: Inject sol-user-nav widget vao tat ca WordPress pages sol.vn
 * Version: 3.3
 * Author: Sol La Ban
 *
 * Deploy: /public_html/wp-content/mu-plugins/sol-user-nav.php
 * JS file: /public_html/wp-content/uploads/sol/sol-user-nav.js
 *
 * v3.3 FIX: Removed is_login() (undefined function - caused fatal error)
 */

if (!defined('ABSPATH')) exit;

add_action('wp_footer', function() {
    // Skip admin only. Login page does not trigger wp_footer anyway.
    if (is_admin()) return;

    $script_url = content_url('/uploads/sol/sol-user-nav.js');
    $version = '3.3.' . date('Ymd');

    echo "\n<!-- Sol User Nav Widget v3.3 -->\n";
    echo '<script src="' . esc_url($script_url) . '?v=' . esc_attr($version) . '" async></script>' . "\n";
}, 999);
