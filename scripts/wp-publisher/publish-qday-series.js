#!/usr/bin/env node
/**
 * Sol v4 — Publish Q-Day series (30 bài) lên WordPress
 *
 * Map: QDAY-NN-*.html (local) → WP post existing slug
 * Mỗi bài: upload OG image, update content + featured + SEO meta + status=publish
 *
 * Usage:
 *   node publish-qday-series.js --dry-run     # preview
 *   node publish-qday-series.js               # push tất cả (chỉ những bài có HTML)
 *   node publish-qday-series.js --only=1,7,14 # chỉ day 1, 7, 14
 *
 * NOTE: slug FULL đã verify từ WP API (dump-qday-slugs.js)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { api, WP_URL, WP_USERNAME } = require('./_lib');

function loadPwd() {
  const envPath = path.join(__dirname, '.env');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^WP_APP_PASSWORD=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  }
  throw new Error('Không tìm thấy WP_APP_PASSWORD');
}
const AUTH = 'Basic ' + Buffer.from(`${WP_USERNAME}:${loadPwd()}`).toString('base64');

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const url = new URL('/wp-json/wp/v2/media', WP_URL);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: {
        'Authorization': AUTH, 'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileData.length, 'Accept': 'application/json',
      }, timeout: 60000,
    }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else { const err = new Error(`HTTP ${res.statusCode}`); err.body = parsed; reject(err); }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

// ─── 30 bài Q-Day với slug FULL từ WP ─────────────────────────────
// [day, postId, htmlFile, fullSlug, seoTitle (≤60c), seoDesc (120-160c), focusKeyword]
const QDAY = [
  [1, 560, 'QDAY-01-ngay-1-24-gio-dau-tien.html', 'ngay-1-24-gio-dau-tien-bo-thuoc-la',
    'Ngày 1 Cai Thuốc — 24 Giờ Đầu Cơ Thể Làm Gì? 2026',
    '24 giờ đầu cai thuốc: CO giảm 50% sau 8h, oxy máu trở lại, nicotine bắt đầu thải. 5 hành động cụ thể + Khang chia sẻ Day 1.',
    'ngày 1 cai thuốc'],
  [2, 562, 'QDAY-02-ngay-2-dinh-con-them.html', 'ngay-2-dinh-con-them-nicotine',
    'Ngày 2 Cai Thuốc — Đỉnh Cơn Thèm Nicotine 2026',
    'Ngày 2 cai thuốc cơn thèm đạt đỉnh do receptor đói nicotine. Cortisol cao. 5 cách vượt sóng thèm 90 giây. Khang chia sẻ.',
    'ngày 2 cai thuốc đỉnh cơn thèm'],
  [3, 570, 'QDAY-03-ngay-3-buc-tuong.html', 'ngay-3-buc-tuong-trieu-chung-cai-dat-dinh-va-bat-dau-giam',
    'Ngày 3 Cai Thuốc Khó Nhất — Bức Tường Withdrawal 2026',
    'Ngày 3 cai thuốc là Bức Tường — withdrawal đỉnh, 70% người vấp ở đây. Khoa học giải thích vì sao + 5 chiến thuật vượt qua.',
    'ngày 3 cai thuốc khó nhất'],
  [4, 572, 'QDAY-04-ngay-4-mat-ngu.html', 'ngay-4-mat-ngu-va-roi-loan-giac-ngu-giai-thich-khoa-hoc',
    'Ngày 4 Cai Thuốc Mất Ngủ — Vì Sao + Cách Giải 2026',
    'Ngày 4 cai thuốc 40-60% mất ngủ + giấc mơ sống động. REM rebound — não đang xây lại chu kỳ. Hướng dẫn ngủ lại 7 ngày.',
    'ngày 4 cai thuốc mất ngủ'],
  [5, 574, 'QDAY-05-ngay-5-them-an-so-tang-can.html', 'ngay-5-them-an-va-noi-so-tang-can-su-that-khoa-hoc',
    'Ngày 5 Cai Thuốc Thèm Ăn — Cách Giữ Cân 2026',
    'Ngày 5 cai thuốc thèm ăn tăng vì BMR ↓ 7-10% + dopamine tìm reward khác. Trung bình tăng 2-4kg/3 tháng. 5 cách giữ cân.',
    'ngày 5 cai thuốc thèm ăn'],
  [6, 581, 'QDAY-06-ngay-6-cau-gat.html', 'ngay-6-cau-gat-voi-nguoi-than-day-khong-phai-tinh-cach-ban',
    'Ngày 6 Cai Thuốc Cáu Gắt — Đỉnh + Kiểm Soát 2026',
    'Ngày 6 cai thuốc cáu gắt đạt đỉnh — cortisol cao + prefrontal yếu. Cách báo trước vợ con + 5 kỹ thuật hạ cơn.',
    'ngày 6 cai thuốc cáu gắt'],
  [7, 583, 'QDAY-07-ngay-7-moc-1-tuan.html', 'ngay-7-moc-1-tuan-nhung-gi-da-thay-doi-trong-co-the-ban',
    'Ngày 7 Cai Thuốc — Mốc 1 Tuần 5 Thay Đổi Đo Được',
    'Mốc 1 tuần cai thuốc: CO bình thường 6 ngày, BP giảm 10/5 mmHg, cilia bắt đầu hoạt động, cơn thèm còn 90 giây. 5 thay đổi.',
    'ngày 7 cai thuốc mốc 1 tuần'],
  [8, 585, 'QDAY-08-ngay-8-suong-mu-nao.html', 'ngay-8-suong-mu-nao-va-kho-tap-trung-nao-bo-dang-tai-cau-truc',
    'Ngày 8 Cai Thuốc — Sương Mù Não Vì Sao? 2026',
    'Ngày 8 cai thuốc khó tập trung là receptor acetylcholine tái cân bằng. Hết sau 2-3 tuần. 5 cách "đẩy nhanh" minh mẫn.',
    'ngày 8 cai thuốc sương mù não'],
  [9, 587, 'QDAY-09-ngay-9-ho-co-dom.html', 'ngay-9-ho-va-dom-phoi-dang-tu-lam-sach',
    'Ngày 9 Cai Thuốc — Ho Đờm Là Dấu Hiệu Tốt 2026',
    'Ngày 9 cai thuốc ho có đờm vàng/nâu là cilia đang đẩy tar 25-30 năm ra — dấu hiệu TỐT. Hết sau 4-12 tuần. Khang chia sẻ.',
    'ngày 9 cai thuốc ho đờm'],
  [10, 589, 'QDAY-10-ngay-10-con-them-doi-loai.html', 'ngay-10-con-them-doi-hinh-dang-tu-sinh-ly-sang-tam-ly',
    'Ngày 10 Cai Thuốc — Cơn Thèm Đổi Loại 2026',
    'Ngày 10 cơn thèm sinh lý giảm rõ — nhưng thèm tâm lý (Pavlov) bắt đầu nổi lên. Nhận diện 4 trigger + 5 chiến lược.',
    'ngày 10 cai thuốc cơn thèm'],
  [11, 592, 'QDAY-11-ngay-11-vi-giac.html', 'ngay-11-vi-giac-va-khuu-giac-tro-lai-ca-phe-ngon-hon-hoa-thom-hon',
    'Ngày 11 Cai Thuốc — Vị Giác Khứu Giác Trở Lại',
    'Ngày 11 cai thuốc taste buds tái sinh sau 10 ngày, khứu giác sạch tar. Cà phê đắng hơn, cơm thơm hơn. Khang chia sẻ.',
    'ngày 11 cai thuốc vị giác'],
  [12, 594, 'QDAY-12-ngay-12-dao-dong-nang-luong.html', 'ngay-12-dao-dong-nang-luong-luc-khoe-luc-met',
    'Ngày 12 Cai Thuốc — Năng Lượng Dao Động Lúc Khỏe Lúc Mệt',
    'Ngày 12 cai thuốc adenosine receptor tái nhạy cảm — cơ thể "tự đo lại". Lúc khỏe lúc mệt là bình thường. 5 cách giữ năng lượng.',
    'ngày 12 cai thuốc mệt'],
  [13, 596, 'QDAY-13-ngay-13-cam-xuc-that-thuong.html', 'ngay-13-cam-xuc-that-thuong-khi-nao-can-kham-tam-ly',
    'Ngày 13 Cai Thuốc — Cảm Xúc Thất Thường, Khi Nào Khám?',
    'Ngày 13 cai thuốc 30% có dấu hiệu trầm cảm nhẹ. Phân biệt Đống tro tàn tự qua vs trầm cảm cần khám. Khang chia sẻ lần 4.',
    'ngày 13 cai thuốc trầm cảm'],
  [14, 605, 'QDAY-14-ngay-14-moc-2-tuan.html', 'ngay-14-moc-2-tuan-bo-thuoc',
    'Mốc 2 Tuần Cai Thuốc — FEV1 Tăng 30% + Phổi 2026',
    'Mốc 2 tuần cai thuốc: FEV1 ↑ 10-15%, fibrinogen giảm, tuần hoàn cải thiện. 5 thay đổi đo được + cảnh báo Đống tro tàn.',
    'ngày 14 cai thuốc 2 tuần'],
  [15, 607, 'QDAY-15-ngay-15-tinh-huong-kho.html', 'ngay-15-tinh-huong-kho-khan-can-doi-mat-ca-phe-tra-da-via-he-coc-bia-hoi-nhau-bua-an-stress',
    'Ngày 15 Cai Thuốc — Tình Huống Khó Café Đồng Nghiệp',
    'Ngày 15 cravings sinh học giảm 70% — nhưng Pavlov cực mạnh. 70% người vấp D15-D21 do tự tin quá. 5 cách phá Pavlov.',
    'ngày 15 cai thuốc tình huống khó'],
  [16, 610, 'QDAY-16-ngay-16-nhau-bia-hoi.html', 'ngay-16-nhau-bia-hoi-via-he-khong-hut-thuoc-song-sot-qua-buoi-dau-tien',
    'Ngày 16 Cai Thuốc — Đi Nhậu Không Hút Sống Sao?',
    'Ngày 16 cai thuốc + nhậu = combo nguy hiểm nhất văn hoá Việt. Rượu giảm ý chí 30%. Plan B 5 bước sống sót cuộc nhậu.',
    'ngày 16 cai thuốc đi nhậu'],
  [17, 614, 'QDAY-17-ngay-17-nham-chan.html', 'ngay-17-nham-chan-ke-thu-it-duoc-nhac-den',
    'Ngày 17 Cai Thuốc — Nhàm Chán Trigger Ngầm Nguy Hiểm',
    'Ngày 17 cai thuốc nhàm chán = low dopamine → não tìm thuốc. 15% người vấp do nhàm chán. Tạo hobby mới + 5 cách thay thế.',
    'ngày 17 cai thuốc nhàm chán'],
  [18, 616, 'QDAY-18-ngay-18-stress-cong-viec.html', 'ngay-18-stress-cong-viec-dieu-thuoc-gio-nghi-khong-con',
    'Ngày 18 Cai Thuốc — Stress Công Việc Smoke Break',
    'Ngày 18 cai thuốc + stress công việc = combo dễ vấp. Work-break smoke ritual Pavlov 60.000 lần. 5 thay thế giờ nghỉ.',
    'ngày 18 cai thuốc stress công việc'],
  [19, 609, 'QDAY-19-ngay-19-ban-be-con-hut.html', 'ngay-19-khi-ban-be-con-hut-giu-ban-giu-cam-ket-nen-ung-xu-the-nao',
    'Ngày 19 Cai Thuốc — Bạn Bè Còn Hút Phải Sao?',
    'Ngày 19 cai thuốc + bạn bè còn hút = social influence 3x. Không cần cắt bạn — chỉ giữ ranh giới. Phân biệt bạn tôn trọng vs ép.',
    'ngày 19 cai thuốc bạn bè còn hút'],
  [20, 629, 'QDAY-20-ngay-20-giac-mo-hut-thuoc.html', 'ngay-20-giac-mo-hut-thuoc-vi-sao-va-no-co-nguy-hiem-khong',
    'Ngày 20 Cai Thuốc — Mơ Hút Thuốc Có Sao Không?',
    'Ngày 20 cai thuốc 60% người mơ hút thuốc. REM rebound — não xử lý ký ức cuối. KHÔNG predict tái phát (Hajek 2010).',
    'ngày 20 cai thuốc giấc mơ hút thuốc'],
  [21, 686, 'QDAY-21-ngay-21-moc-3-tuan.html', 'ngay-21-moc-3-tuan-bo-thuoc-vong-lap-thoi-quen-da-yeu-di',
    'Ngày 21 Cai Thuốc — Mốc 3 Tuần Habit Đã Vững? 2026',
    'Mốc 3 tuần cai thuốc — habit cũ yếu 60-70%. Huyền thoại 21 ngày SAI — thực 66 ngày (Lally 2010). 5 myth + Khang chia sẻ.',
    'ngày 21 cai thuốc 3 tuần'],
  [22, 688, 'QDAY-22-ngay-22-con-them-sau-bua-an.html', 'ngay-22-con-them-sau-bua-an-tai-sao-van-dai-dang',
    'Ngày 22 Cai Thuốc — Cơn Thèm Sau Cơm Dai Dẳng?',
    'Ngày 22 cai thuốc cơn thèm sau bữa ăn dai dẳng — post-meal cue mạnh thứ 2 sau cà phê. 5 cách phá Pavlov "ăn xong = hút".',
    'ngày 22 cai thuốc thèm sau ăn'],
  [23, 691, 'QDAY-23-ngay-23-cuoi-tuan.html', 'ngay-23-cuoi-tuan-khi-nghi-thuc-cu-khong-con',
    'Ngày 23 Cai Thuốc — Cuối Tuần Không Thuốc Sao?',
    'Ngày 23 cai thuốc cuối tuần đầu = unstructured time = relapse risk cao nhất. 5 ritual mới thay nhậu + café + thuốc.',
    'ngày 23 cai thuốc cuối tuần'],
  [24, 693, 'QDAY-24-ngay-24-toi-la-nguoi-khong-hut.html', 'ngay-24-toi-la-nguoi-khong-hut-chuyen-dich-danh-tinh',
    'Ngày 24 Cai Thuốc — Tôi Là Người Không Hút',
    'Ngày 24 cai thuốc identity shift rõ — từ "đang cai" sang "không hút". Relapse rate giảm 50% (Tombor 2015). 5 cách củng cố.',
    'ngày 24 cai thuốc danh tính'],
  [25, 695, 'QDAY-25-ngay-25-can-tai-nghien.html', 'ngay-25-can-tai-nghien-lapse-neu-ban-hut-1-dieu-dieu-gi-xay-ra',
    'Ngày 25 Cai Thuốc — Lapse vs Relapse Khang Hướng Dẫn',
    'Ngày 25 cai thuốc — Lapse (1 điếu) KHÁC Relapse (tái nghiện). 70% phục hồi nếu xử lý đúng (Marlatt 1985). Protocol 5 bước.',
    'ngày 25 cai thuốc tái nghiện'],
  [26, 699, 'QDAY-26-ngay-26-tien-tiet-kiem.html', 'ngay-26-tien-tiet-kiem-dong-tien-ban-dang-doi-lay-suc-khoe',
    'Ngày 26 Cai Thuốc — Bạn Đã Tiết Kiệm Bao Nhiêu?',
    'Ngày 26 cai thuốc tiết kiệm 520k (1 bao/ngày). 1 năm = 7.3 triệu. 5 năm = 36.5 triệu = 1 Honda Wave. 5 cách dùng tiền.',
    'ngày 26 cai thuốc tiết kiệm tiền'],
  [27, 701, 'QDAY-27-ngay-27-gia-dinh.html', 'ngay-27-gia-dinh-va-cac-moi-quan-he-dieu-ban-chua-thay',
    'Ngày 27 Cai Thuốc — Gia Đình Thấy Khác Rõ Rệt',
    'Ngày 27 cai thuốc — gia đình thấy thay đổi: mùi cơ thể sạch, mood ổn, kết nối lại. 5 hành động kết nối gia đình.',
    'ngày 27 cai thuốc gia đình'],
  [28, 703, 'QDAY-28-ngay-28-tu-hao.html', 'ngay-28-tu-hao-va-gia-tri-ban-than-day-khong-phai-phu-phiem',
    'Ngày 28 Cai Thuốc — Tự Hào Không Phù Phiếm',
    'Ngày 28 cai thuốc tự hào là self-efficacy spreading — cai thành công → tin có thể đổi thứ khác. 5 cách giữ tự hào lành mạnh.',
    'ngày 28 cai thuốc tự hào'],
  [29, 705, 'QDAY-29-ngay-29-nhin-ve-thang-2-3.html', 'ngay-29-nhin-ve-phia-truoc-thang-2-va-thang-3-se-nhu-the-nao',
    'Ngày 29 Cai Thuốc — Tháng 2 và 3 Sẽ Thế Nào? 2026',
    'Ngày 29 cai thuốc — relapse risk drops sau D30. Tháng 3-6 vẫn warning zone. Maintenance Plan tháng 2-12 + tháng 3 chụp X-quang.',
    'ngày 29 cai thuốc tương lai'],
  [30, 707, 'QDAY-30-ngay-30-moc-1-thang.html', 'ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-ai',
    'Mốc 1 Tháng Cai Thuốc — Bạn Đã Khác Người Cũ 2026',
    'Mốc 1 tháng cai thuốc — relapse rate giảm 50%. FEV1 ↑15%, cilia phổi hồi 50-70%. Khang chúc mừng + maintenance protocol.',
    'ngày 30 cai thuốc 1 tháng'],
];

async function processOne(day, postId, htmlFile, slug, seoTitle, seoDesc, focus, dryRun) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', htmlFile);
  // OG image filename = qday-NN.png (độc lập với slug WP để tránh mismatch)
  const ogFilename = `qday-${String(day).padStart(2, '0')}.png`;
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', ogFilename);

  if (!fs.existsSync(htmlPath)) return { day, status: 'NO_HTML', htmlFile };
  if (!fs.existsSync(ogPath)) return { day, status: 'NO_OG', ogFilename };

  if (dryRun) return { day, status: 'WOULD_PUBLISH', postId };

  let mediaId;
  try {
    const media = await uploadFile(ogPath);
    mediaId = media.id;
  } catch (e) {
    return { day, status: 'UPLOAD_FAIL', error: e.message };
  }

  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
    rank_math_focus_keyword: focus,
  };

  try {
    const result = await api.post(`/wp-json/wp/v2/posts/${postId}`, {
      content, status: 'publish', featured_media: mediaId, meta,
      excerpt: seoDesc,
    });
    return { day, status: 'PUBLISHED', postId, mediaId, link: result.link };
  } catch (e) {
    return { day, status: 'POST_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyDays = onlyArg ? onlyArg.slice(7).split(',').map((s) => parseInt(s, 10)) : null;

  const tasks = onlyDays ? QDAY.filter((q) => onlyDays.includes(q[0])) : QDAY;

  console.log(`▶ Publish ${tasks.length} bài Q-Day${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  const results = [];
  for (const [day, postId, htmlFile, slug, seoTitle, seoDesc, focus] of tasks) {
    process.stdout.write(`▶ Day ${String(day).padStart(2)} (#${postId})... `);
    const r = await processOne(day, postId, htmlFile, slug, seoTitle, seoDesc, focus, dryRun);
    results.push(r);
    if (r.status === 'PUBLISHED') console.log(`✓ ${r.link}`);
    else if (r.status === 'WOULD_PUBLISH') console.log(`(dry-run OK)`);
    else {
      console.log(`✗ ${r.status}`);
      if (r.error) console.log(`   ${r.error}`);
      if (r.body) console.log(`   ${JSON.stringify(r.body).slice(0, 200)}`);
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
