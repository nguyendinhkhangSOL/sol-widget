<?php
/**
 * Plugin Name: Sol User Nav Widget
 * Description: Inject sol-user-nav widget vao WordPress pages sol.vn
 * Version: 3.4
 * Author: Sol La Ban
 *
 * v3.4: Aggressive cache-bust using file mtime + fallback timestamp
 */

if (!defined('ABSPATH')) exit;

add_action('wp_footer', function() {
    if (is_admin()) return;

    $js_path = ABSPATH . 'wp-content/uploads/sol/sol-user-nav.js';
    // Use file modification time as version - bumps automatically when file changes
    $version = file_exists($js_path) ? filemtime($js_path) : time();

    $script_url = content_url('/uploads/sol/sol-user-nav.js');

    echo "\n<!-- Sol User Nav Widget v3.4 -->\n";
    echo '<script src="' . esc_url($script_url) . '?v=' . esc_attr($version) . '" async></script>' . "\n";
}, 999);
