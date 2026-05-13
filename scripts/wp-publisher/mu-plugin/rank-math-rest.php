<?php
/**
 * Plugin Name: Sol — Rank Math REST API Meta
 * Description: Expose Rank Math meta (title, description, focus keyword) qua WP REST API
 *              để claude-publisher có thể đặt SEO programmatic.
 * Version:     1.0
 * Author:      Sol Team
 *
 * Cài đặt: upload file này vào /wp-content/mu-plugins/ (Must-Use Plugin)
 * — KHÔNG cần activate, WP tự load.
 * — Nếu folder mu-plugins chưa có, tạo folder mới.
 */

if (!defined('ABSPATH')) exit;

add_action('init', function () {
    $meta_keys = [
        'rank_math_title',
        'rank_math_description',
        'rank_math_focus_keyword',
        'rank_math_canonical_url',
        'rank_math_robots',
        'rank_math_facebook_title',
        'rank_math_facebook_description',
        'rank_math_facebook_image',
        'rank_math_twitter_title',
        'rank_math_twitter_description',
        'rank_math_twitter_image',
    ];

    foreach (['post', 'page'] as $post_type) {
        foreach ($meta_keys as $key) {
            register_post_meta($post_type, $key, [
                'show_in_rest' => true,
                'single'       => true,
                'type'         => 'string',
                'auth_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ]);
        }
    }
}, 11);
