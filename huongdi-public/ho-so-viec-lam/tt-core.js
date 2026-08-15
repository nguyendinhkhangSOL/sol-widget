/* ============================================================
 * tt-core.js — Lõi dùng chung cho các trang /ho-so-viec-lam/*
 * Nạp sau sol-chrome.js. Cung cấp: TT.api, TT.esc, TT.msg, TT.gate,
 * dữ liệu kỹ năng (SKILLS/LABEL/FLD) + CSS nội dung + autocomplete kỹ năng.
 * ============================================================ */
(function () {
  var TT = window.TT = window.TT || {};
  TT.API = (window.SOL_API_BASE || 'https://huongdi.sol.vn/api');
  try { TT.TOKEN = localStorage.getItem('sol_jwt'); } catch (e) { TT.TOKEN = null; }

  TT.esc = function (s) { return (s == null ? '' : String(s)).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
  TT.api = function (path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TT.TOKEN }, opts.headers || {});
    return fetch(TT.API + path, opts).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || j.error || ('Lỗi ' + r.status)); return j; }); });
  };
  TT.msg = function (id, type, text) { var e = document.getElementById(id); if (e) { e.className = 'msg ' + type; e.textContent = text; e.style.display = 'block'; } };

  // Gác đăng nhập: nếu chưa có token, hiện CTA vào #gate và trả false.
  TT.gate = function (nextPath) {
    if (TT.TOKEN) return true;
    var g = document.getElementById('gate');
    if (g) g.innerHTML = '<div class="card center"><h2>Đăng nhập để dùng</h2>'
      + '<p class="lead">Mục Hồ sơ &amp; Việc làm cần tài khoản để lưu hồ sơ của anh chị.</p>'
      + '<a class="btn" style="text-decoration:none;max-width:260px;margin:8px auto 0" href="/dang-nhap/?next=' + encodeURIComponent(nextPath || location.pathname) + '">Đăng nhập</a></div>';
    return false;
  };

  TT.SKILLS = [{"ma":"KN.ban.b2b","nhan":"Bán hàng doanh nghiệp (B2B)"},{"ma":"KN.ban.le","nhan":"Bán lẻ (B2C)"},{"ma":"KN.ban.kenh","nhan":"Xây & quản lý kênh phân phối"},{"ma":"KN.ban.cskh","nhan":"Chăm sóc khách hàng"},{"ma":"KN.ban.telesale","nhan":"Bán qua điện thoại (telesale)"},{"ma":"KN.ban.online","nhan":"Bán hàng online"},{"ma":"KN.ql.doingu","nhan":"Quản lý đội ngũ"},{"ma":"KN.ql.vanhanh","nhan":"Quản lý vận hành"},{"ma":"KN.ql.ngansach","nhan":"Quản lý ngân sách / doanh thu-chi phí"},{"ma":"KN.ql.duan","nhan":"Quản lý dự án"},{"ma":"KN.ql.quytrinh","nhan":"Xây dựng quy trình"},{"ma":"KN.tc.sosach","nhan":"Kế toán sổ sách"},{"ma":"KN.tc.thue","nhan":"Kê khai thuế"},{"ma":"KN.tc.baocao","nhan":"Báo cáo tài chính"},{"ma":"KN.tc.congno","nhan":"Quản lý công nợ"},{"ma":"KN.tc.luong","nhan":"Tính lương"},{"ma":"KN.tc.phanmem","nhan":"Phần mềm kế toán"},{"ma":"KN.kt.suachua","nhan":"Sửa chữa – bảo trì"},{"ma":"KN.kt.dien","nhan":"Điện – điện lạnh"},{"ma":"KN.kt.cokhi","nhan":"Cơ khí"},{"ma":"KN.kt.xaydung","nhan":"Xây dựng – hoàn thiện"},{"ma":"KN.kt.vanhanhmay","nhan":"Vận hành máy móc"},{"ma":"KN.so.excel","nhan":"Excel / bảng tính"},{"ma":"KN.so.word","nhan":"Soạn thảo văn bản"},{"ma":"KN.so.crm","nhan":"Phần mềm CRM"},{"ma":"KN.so.canva","nhan":"Thiết kế cơ bản (Canva)"},{"ma":"KN.so.ai","nhan":"Dùng công cụ AI"},{"ma":"KN.so.mxh","nhan":"Quản lý mạng xã hội"},{"ma":"KN.dt.kem","nhan":"Kèm / dạy 1-1"},{"ma":"KN.dt.tuvan","nhan":"Tư vấn chuyên môn"},{"ma":"KN.dt.giangday","nhan":"Giảng dạy / đứng lớp"},{"ma":"KN.dv.amthuc","nhan":"Ẩm thực / bếp"},{"ma":"KN.dv.chamsoc","nhan":"Chăm sóc (người/bệnh/trẻ)"},{"ma":"KN.dv.lamdep","nhan":"Làm đẹp / spa"},{"ma":"KN.dv.vanchuyen","nhan":"Vận chuyển / giao nhận"},{"ma":"KN.hc.vanthu","nhan":"Văn thư – hành chính"},{"ma":"KN.hc.lettan","nhan":"Lễ tân – tiếp đón"},{"ma":"KN.hc.dulieu","nhan":"Nhập & quản lý dữ liệu"},{"ma":"KN.hc.muahang","nhan":"Mua hàng – thu mua"},{"ma":"KN.ns.tuyendung","nhan":"Tuyển dụng"},{"ma":"KN.ns.cb","nhan":"Lương thưởng – phúc lợi (C&B)"},{"ma":"KN.ns.daotao","nhan":"Đào tạo & phát triển nhân sự"},{"ma":"KN.sx.qc","nhan":"Kiểm soát chất lượng (QC)"},{"ma":"KN.sx.kho","nhan":"Quản lý kho"},{"ma":"KN.sx.cungung","nhan":"Chuỗi cung ứng"},{"ma":"KN.sx.dieudo","nhan":"Điều độ sản xuất"},{"ma":"KN.mkt.noidung","nhan":"Sáng tạo nội dung"},{"ma":"KN.mkt.quangcao","nhan":"Chạy quảng cáo"},{"ma":"KN.mkt.thuonghieu","nhan":"Xây thương hiệu"},{"ma":"KN.mkt.sukien","nhan":"Tổ chức sự kiện"},{"ma":"KN.nn.anh","nhan":"Tiếng Anh"},{"ma":"KN.nn.trung","nhan":"Tiếng Trung"},{"ma":"KN.nn.han","nhan":"Tiếng Hàn"},{"ma":"KN.nn.nhat","nhan":"Tiếng Nhật"}];
  TT.LABEL = {}; TT.SKILLS.forEach(function (s) { TT.LABEL[s.ma] = s.nhan; });
  TT.FLD = {"K1.nganh":"Ngành đã làm","K1.chucdanh":"Chức danh gần nhất","K1.capbac":"Cấp bậc","K1.sonam":"Số năm nghề","K1.quymo":"Quy mô từng quản (người/tiền)","K1.tunglamchu":"Từng tự kinh doanh","K2.donghe":"Đồ nghề / máy móc còn giữ","K2.matbang":"Mặt bằng / xưởng / xe","K2.bangcap":"Bằng cấp / chứng chỉ","K2.tienmat":"Vốn tiền có thể dùng","K3.tinh":"Tỉnh/thành hiện tại","K3.banklinh":"Đi làm được bán kính","K4.congtycu":"Công ty cũ (danh sách)","K4.nganhcu":"Ngành cũ / mối quan hệ","K4.khachcu":"Khách / đối tác cũ còn liên lạc"};

  // Autocomplete kỹ năng: gọi TT.acSkill(query, boxId, haveSet, onPick)
  TT.acSkill = function (q, boxId, haveSet, onPick) {
    q = (q || '').toLowerCase().trim(); var box = document.getElementById(boxId); if (!box) return;
    if (!q) { box.innerHTML = ''; return; }
    var hits = TT.SKILLS.filter(function (s) { return !haveSet[s.ma] && (s.nhan.toLowerCase().indexOf(q) >= 0 || s.ma.indexOf(q) >= 0); }).slice(0, 8);
    box.innerHTML = hits.length ? '<div class="aclist">' + hits.map(function (s) { return '<div class="acitem" data-ma="' + s.ma + '">' + TT.esc(s.nhan) + '</div>'; }).join('') + '</div>' : '';
    box.querySelectorAll('.acitem').forEach(function (el) { el.onclick = function () { onPick(el.getAttribute('data-ma')); box.innerHTML = ''; }; });
  };

  var CSS = ''
    + ':root{--amber:#F59E0B;--amber-d:#B45309;--navy:#0F172A;--slate:#475569;--line:#E2E8F0;--bg:#F8FAFC;--green:#16A34A;--red:#DC2626}'
    + 'body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--navy);line-height:1.55;margin:0}'
    + '.wrap{max-width:760px;margin:0 auto;padding:18px 16px 70px}'
    + 'h1.pt{font-family:Lora,serif;font-size:24px;margin:6px 0 2px}.lead{color:var(--slate);font-size:14px;margin-bottom:12px}'
    + '.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:16px}'
    + '.blk{border:1px solid var(--line);border-radius:12px;padding:13px;margin:10px 0}.blk h3{font-size:14px;margin-bottom:8px;display:flex;gap:7px;align-items:center}'
    + '.row{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px dashed #EEF2F7;font-size:14px}.row:last-child{border:0}.row .k{color:var(--slate)}.row .v{font-weight:600;text-align:right}'
    + '.badge{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:700;display:inline-block}.b-ok{background:#DCFCE7;color:#166534}.b-empty{background:#FEE2E2;color:#991B1B}.b-src{background:#E0F2FE;color:#075985}'
    + '.chip{display:inline-block;font-size:12.5px;background:#FEF3C7;color:var(--amber-d);border:1px solid #FDE68A;border-radius:999px;padding:5px 11px;margin:3px 4px 3px 0;font-weight:600}.chip .x{margin-left:6px;cursor:pointer;opacity:.6}'
    + '.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--amber);color:#fff;border:0;border-radius:12px;padding:12px 18px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;margin-top:8px}.btn:disabled{opacity:.5}.btn.sec{background:#fff;color:var(--navy);border:1.5px solid var(--line)}.btn.mini{width:auto;padding:9px 15px;font-size:13.5px}'
    + '.in{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:11px;font-size:15px;font-family:inherit;margin:4px 0}textarea.in{min-height:120px;resize:vertical}'
    + '.score{text-align:center;padding:6px 0}.score .big{font-family:Lora,serif;font-size:50px;font-weight:700;color:var(--amber);line-height:1}.bar{height:12px;border-radius:999px;background:#F1F5F9;overflow:hidden;margin:8px 0}.bar>i{display:block;height:100%;background:var(--amber)}.cmp{display:flex;justify-content:center;gap:20px;font-size:14px;margin-top:5px}.cmp b{font-family:Lora,serif;font-size:20px}'
    + '.ck{display:flex;gap:9px;padding:8px 0;border-bottom:1px dashed #EEF2F7;font-size:14px}.ck .ic{width:20px;height:20px;border-radius:50%;flex:0 0 20px;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:700}.ck.have .ic{background:var(--green)}.ck.miss .ic{background:var(--red)}'
    + '.note{font-size:12.5px;color:var(--slate);background:#F8FAFC;border-left:3px solid var(--amber);padding:9px 12px;border-radius:0 8px 8px 0;margin:8px 0}'
    + '.pill{font-size:11.5px;font-weight:700;color:var(--amber-d);background:#FEF3C7;border-radius:999px;padding:3px 10px}'
    + '.ac{position:relative}.aclist{position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid var(--line);border-radius:12px;max-height:220px;overflow:auto;z-index:5;box-shadow:0 8px 24px rgba(15,23,42,.1)}.acitem{padding:10px 12px;font-size:14px;cursor:pointer;border-bottom:1px solid #F1F5F9}.acitem:hover{background:#FEF3C7}'
    + '.msg{font-size:13px;padding:9px 12px;border-radius:10px;margin:8px 0;display:none}.msg.err{background:#FEE2E2;color:#991B1B;display:block}.msg.ok{background:#DCFCE7;color:#166534;display:block}'
    + '.center{text-align:center;padding:40px 16px}.subnav{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0 4px}.subnav a{font-size:12.5px;padding:7px 12px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--slate);text-decoration:none;font-weight:600}.subnav a.on{background:var(--amber);border-color:var(--amber);color:#fff}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // Thanh điều hướng con giữa 5 trang
  TT.subnav = function (active) {
    var items = [['tao-cv', '📄 Tạo lập CV'], ['cham', '🎯 Chấm CV×JD'], ['danh-gia', '📊 Đánh giá'], ['thu', '✉️ Thư ứng tuyển'], ['phong-van', '🎤 Phỏng vấn']];
    return '<div class="subnav">' + items.map(function (it) { return '<a class="' + (it[0] === active ? 'on' : '') + '" href="/ho-so-viec-lam/' + it[0] + '/">' + it[1] + '</a>'; }).join('') + '</div>';
  };
})();
