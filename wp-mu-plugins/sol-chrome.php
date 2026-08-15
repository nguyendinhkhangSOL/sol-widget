<?php
/**
 * Plugin Name: Sol Chrome — Header/Footer chung
 * Description: Nạp sol-ui.js của app (huongdi.sol.vn) để header/footer/menu "Đi Cùng Sol" trên sol.vn khớp Y HỆT app. Tự ẩn header/footer cũ của theme + các dải footer cũ (YouTube/Zalo do mu-plugin cũ chèn). Sửa 1 file sol-ui.js là cả 2 site đổi theo — MỘT nguồn duy nhất.
 * Version: 1.1
 * Author: Sol
 *
 * CÁCH CÀI: upload file này vào  wp-content/mu-plugins/  (tạo thư mục nếu chưa có).
 * mu-plugins tự bật, không cần Activate. Xong purge cache là thấy.
 */

if (!defined('ABSPATH')) exit;

// 1) Ẩn NGAY header/footer cũ + các dải footer thừa (YouTube/Zalo) — đặt ở <head> để không nháy
add_action('wp_head', function () {
  echo "\n<style id=\"sol-chrome-hide\">"
     . ".sol-header,.sol-footer,#sol-header,#sol-footer{display:none!important}"
     // các dải footer cũ do mu-plugin trước chèn: là <div> gắn thẳng vào body, chứa link YouTube/Zalo
     . "body>div:has(a[href*=\"youtube\"]),body>div:has(a[href*=\"zalo.me\"]){display:none!important}"
     . "</style>\n";
}, 1);

// 2) Dự phòng cho trình duyệt cũ chưa hỗ trợ :has() — ẩn bằng JS
add_action('wp_footer', function () {
  echo "\n<script>document.addEventListener('DOMContentLoaded',function(){try{"
     . "[].forEach.call(document.querySelectorAll('body>div'),function(d){"
     . "if(!d.className && d.children.length<4 && d.querySelector('a[href*=\"youtube\"],a[href*=\"zalo.me\"]')) d.style.display='none';"
     . "});}catch(e){}});</script>\n";
}, 90);

// 3) Nạp header/footer chung của app (sol-ui.js tự dựng + tự nạp chip tài khoản đúng gốc app)
add_action('wp_footer', function () {
  echo "\n<script src=\"https://huongdi.sol.vn/sol-ui.js\" defer></script>\n";
}, 99);
