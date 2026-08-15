<?php
/**
 * Plugin Name: Sol Chrome — Header/Footer chung
 * Description: Nạp sol-ui.js của app (huongdi.sol.vn) để header/footer/menu "Đi Cùng Sol" trên sol.vn khớp Y HỆT app. Tự ẩn header/footer cũ của theme. Sửa 1 file sol-ui.js là cả 2 site đổi theo — MỘT nguồn duy nhất.
 * Version: 1.0
 * Author: Sol
 *
 * CÁCH CÀI: upload file này vào  wp-content/mu-plugins/  (tạo thư mục nếu chưa có).
 * mu-plugins tự bật, không cần Activate. Xong purge cache là thấy.
 */

if (!defined('ABSPATH')) exit;

// 1) Ẩn NGAY header/footer cũ của theme (đặt ở <head> để không nháy khi tải)
add_action('wp_head', function () {
  echo "\n<style id=\"sol-chrome-hide\">.sol-header,.sol-footer,#sol-header,#sol-footer{display:none!important}</style>\n";
}, 1);

// 2) Nạp header/footer chung của app.
//    sol-ui.js tự dựng header + footer "Đi Cùng Sol", tự nạp chip tài khoản
//    (sol-user-nav.js) đúng theo gốc app, và tự ẩn phần cũ còn sót.
add_action('wp_footer', function () {
  echo "\n<script src=\"https://huongdi.sol.vn/sol-ui.js\" defer></script>\n";
}, 99);
