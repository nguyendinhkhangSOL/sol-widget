<?php
/**
 * Plugin Name: Sol User Nav Widget v4
 * Version: 4.0
 * Description: Cache-bust bang filename moi (sol-nav-v4.js) - browser buoc phai load lai
 */
if (!defined('ABSPATH')) exit;

add_action('wp_footer', function() {
    if (is_admin()) return;
    $script_url = content_url('/uploads/sol/sol-nav-v4.js');
    echo "\n<!-- Sol User Nav Widget v4 -->\n";
    echo '<script src="' . esc_url($script_url) . '" async></script>' . "\n";
}, 999);
