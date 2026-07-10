<?php
/**
 * Plugin Name: Sol Nav Loader v4
 * Description: Load sol-nav-v4.js widget - Hardcoded, cannot fail
 * Version: 4.0
 */
if (!defined('ABSPATH')) exit;

add_action('wp_footer', function() {
    if (is_admin()) return;
    echo "\n<!-- Sol Nav Loader v4 -->\n";
    echo '<script src="https://sol.vn/wp-content/uploads/sol/sol-nav-v4.js" async></script>' . "\n";
}, 999);
