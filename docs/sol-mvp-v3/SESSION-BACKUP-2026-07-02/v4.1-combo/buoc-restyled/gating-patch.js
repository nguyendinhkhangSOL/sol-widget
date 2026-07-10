// ═══ FREE TIER GATING PATCH ═══
// Override renderCards to lock cards 5+ for Free tier
// Load this SAU sol-auth.js và after render script chính

(function(){
  const FREE_LIMIT = 5;

  function isSolPaid(){
    return window.SolAuth ? SolAuth.isActive() : false;
  }

  window.showLaBanPaywall = function(directionTitle){
    if(window.SolAuth){
      SolAuth.showPaywall({
        feature: 'Xem chi tiết "' + (directionTitle || 'hướng đi') + '"',
        benefits: [
          '<strong>Tất cả 37 mô hình hướng đi</strong> — full database, sắp xếp theo % phù hợp',
          '<strong>40 câu hỏi AI</strong> — đủ 5 Bước Sol La Bàn',
          'Chi tiết lộ trình 90 ngày cho mỗi hướng',
          'Case study thực tế từ người 40-60 đã thành công',
          'Sổ Hành Trình lưu tiến độ',
          'Cộng đồng Zalo Active'
        ]
      });
    } else if(confirm('Mở khoá 32 hướng đi còn lại với Sol Active (499k/năm)? Xem bảng giá?')){
      window.location.href = '/pricing/';
    }
  };

  // Override renderCards sau khi DOMContentLoaded
  window.addEventListener('DOMContentLoaded', function(){
    if(typeof renderCards !== 'function') return;

    const origRender = renderCards;
    window.renderCards = function(list, from, to){
      // Gọi hàm gốc
      origRender(list, from, to);

      const wrap = document.getElementById('cards');
      if(!wrap) return;

      const paid = isSolPaid();
      if(paid) return; // Active/Founder: no gating

      // Apply lock cho cards 5+
      const cards = wrap.querySelectorAll('.card');
      cards.forEach((card, idx) => {
        if(idx >= FREE_LIMIT && !card.classList.contains('sol-locked')){
          card.classList.add('sol-locked');
          card.addEventListener('click', function(e){
            e.stopPropagation();
            e.preventDefault();
            const title = card.querySelector('.card-title, h3')?.textContent || '';
            showLaBanPaywall(title.trim());
          }, true);
        }
      });

      // Chèn callout ngay sau card thứ 5
      const existingCallout = wrap.querySelector('.free-limit-callout');
      if(existingCallout) existingCallout.remove();

      if(list.length > FREE_LIMIT && to > FREE_LIMIT){
        const remain = list.length - FREE_LIMIT;
        const callout = document.createElement('div');
        callout.className = 'free-limit-callout';
        callout.style.cssText = 'grid-column:1/-1;';
        callout.innerHTML =
          '<div style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7); border:2px solid #FDE68A; border-radius:16px; padding:24px 28px; margin:16px 0; text-align:center;">' +
            '<div style="font-size:11px; letter-spacing:2px; font-weight:800; color:#B45309; margin-bottom:8px;">🎁 5 HƯỚNG PHÙ HỢP NHẤT — MIỄN PHÍ</div>' +
            '<h3 style="font-family:\'Lora\',serif; font-size:20px; font-weight:700; color:#0F172A; margin:0 0 10px;">Còn ' + remain + ' hướng đi khác — mở khoá với Sol Active</h3>' +
            '<p style="font-size:14.5px; color:#334155; margin:0 0 16px; max-width:520px; margin-left:auto; margin-right:auto;">' +
              'Sol đã match anh chị với 5 hướng phù hợp nhất. ' + remain + ' hướng còn lại — bao gồm chi tiết lộ trình, case study, và AI đồng hành — cần Sol Active <strong>499k/năm</strong>.' +
            '</p>' +
            '<button onclick="showLaBanPaywall()" style="background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; border:none; padding:14px 28px; border-radius:10px; font-size:14.5px; font-weight:800; cursor:pointer; font-family:inherit;">' +
              '💎 Mở khoá 37 hướng đi →' +
            '</button>' +
          '</div>';

        const cards = wrap.querySelectorAll('.card:not(.sol-locked)');
        const insertAfter = cards[FREE_LIMIT - 1] || wrap.lastChild;
        if(insertAfter && insertAfter.parentNode){
          insertAfter.after(callout);
        }
      }
    };
  });
})();
