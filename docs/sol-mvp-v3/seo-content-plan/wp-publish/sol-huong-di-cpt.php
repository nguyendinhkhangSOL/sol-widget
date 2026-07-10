<?php
/**
 * Plugin Name: Sol - Custom Post Type Huong Di
 * Plugin URI: https://sol.vn
 * Description: Register CPT "huong_di" cho URL structure sol.vn/huong-di/{slug}/ - Silo SEO structure cho topic cluster Sol La Ban.
 * Version: 1.0.0
 * Author: Khang Sol
 * Author URI: https://sol.vn/khang-sol/
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Custom Post Type "huong_di"
 */
function sol_register_huong_di_cpt() {
    $labels = [
        'name'                  => 'Hướng Đi',
        'singular_name'         => 'Bài Hướng Đi',
        'menu_name'             => 'Hướng Đi',
        'name_admin_bar'        => 'Bài Hướng Đi',
        'add_new'               => 'Thêm bài mới',
        'add_new_item'          => 'Thêm bài Hướng Đi mới',
        'new_item'              => 'Bài mới',
        'edit_item'             => 'Chỉnh sửa bài',
        'view_item'             => 'Xem bài',
        'all_items'             => 'Tất cả bài Hướng Đi',
        'search_items'          => 'Tìm bài Hướng Đi',
        'not_found'             => 'Không có bài.',
        'not_found_in_trash'    => 'Không có bài trong thùng rác.',
        'featured_image'        => 'Ảnh đại diện',
        'set_featured_image'    => 'Đặt ảnh đại diện',
        'remove_featured_image' => 'Xoá ảnh đại diện',
        'archives'              => 'Kho bài Hướng Đi',
        'insert_into_item'      => 'Chèn vào bài',
        'uploaded_to_this_item' => 'Upload vào bài này',
    ];

    $args = [
        'label'                 => 'Hướng Đi',
        'labels'                => $labels,
        'description'           => 'Tuyến bài Sol La Bàn — Tái khởi nghiệp tinh gọn 40-60',
        'public'                => true,
        'publicly_queryable'    => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'show_in_nav_menus'     => true,
        'show_in_admin_bar'     => true,
        'show_in_rest'          => true,   // BẮT BUỘC cho REST API + Gutenberg
        'rest_base'             => 'huong-di',
        'menu_position'         => 5,
        'menu_icon'             => 'dashicons-location-alt',
        'capability_type'       => 'post',
        'hierarchical'          => false,
        'supports'              => [
            'title',
            'editor',
            'excerpt',
            'author',
            'thumbnail',
            'custom-fields',
            'revisions',
        ],
        'taxonomies'            => ['category', 'post_tag'],
        'has_archive'           => 'huong-di',
        'rewrite'               => [
            'slug'       => 'huong-di',
            'with_front' => false,
            'feeds'      => true,
            'pages'      => true,
        ],
        'query_var'             => true,
        'can_export'            => true,
    ];

    register_post_type('huong_di', $args);
}
add_action('init', 'sol_register_huong_di_cpt', 0);


/**
 * Flush rewrite rules on plugin activation
 */
function sol_huong_di_activate() {
    sol_register_huong_di_cpt();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'sol_huong_di_activate');


/**
 * Flush rewrite rules on plugin deactivation
 */
function sol_huong_di_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'sol_huong_di_deactivate');


/**
 * Add CPT to default RSS feed
 */
function sol_huong_di_feed($qv) {
    if (isset($qv['feed']) && !isset($qv['post_type'])) {
        $qv['post_type'] = ['post', 'huong_di'];
    }
    return $qv;
}
add_filter('request', 'sol_huong_di_feed');


/**
 * Include CPT posts in category & tag archives
 */
function sol_huong_di_category_archive($query) {
    if (!is_admin() && $query->is_main_query()) {
        if ($query->is_category() || $query->is_tag()) {
            $query->set('post_type', ['post', 'huong_di']);
        }
    }
}
add_action('pre_get_posts', 'sol_huong_di_category_archive');
