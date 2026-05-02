<?php
/**
 * Plugin Name: SOL — Rank Math REST API
 * Description: Đăng ký các meta keys của Rank Math vào WordPress REST API để bulk upload script set được focus keyword + meta description từ ngoài.
 * Author: SOL — bothuocla.sol.vn
 * Version: 1.0.0
 *
 * INSTALL:
 *   1. Tạo folder wp-content/mu-plugins/ nếu chưa có
 *      (mu = "must-use" plugin, tự active không cần activate)
 *   2. Copy file này vào wp-content/mu-plugins/
 *   3. Verify: GET https://sol.vn/wp-json/wp/v2/posts?per_page=1
 *      response.0.meta phải có "rank_math_focus_keyword"
 *
 * SECURITY:
 *   - Chỉ user có cap "edit_posts" mới set/update meta được (auth_callback)
 *   - Application Password vẫn cần để authenticate request
 *   - Không expose meta nội bộ ra public (chỉ qua context=edit hoặc khi đã auth)
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'init', function () {
    $rank_math_keys = [
        'rank_math_focus_keyword',
        'rank_math_description',
        'rank_math_title',
        'rank_math_canonical_url',
        'rank_math_robots',
    ];

    foreach ( $rank_math_keys as $key ) {
        register_post_meta(
            'post',
            $key,
            [
                'show_in_rest' => true,
                'single'       => true,
                'type'         => 'string',
                'auth_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
            ]
        );
    }
}, 11 ); // priority 11 — sau Rank Math (priority 10)
