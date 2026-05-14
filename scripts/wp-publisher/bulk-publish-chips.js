#!/usr/bin/env node
/**
 * Sol v4 — Bulk publish 22 bài CHIP-*.html
 *
 * Cho mỗi bài:
 * 1. Update post content (replace draft → Sol v4 HTML)
 * 2. Upload + set Featured Image
 * 3. Set SEO meta (Rank Math)
 * 4. Publish post
 *
 * Usage:
 *   node bulk-publish-chips.js --dry-run     → preview, không push
 *   node bulk-publish-chips.js               → push tất cả 22 bài
 *   node bulk-publish-chips.js --only=dau-dau-sau-cai,ho-co-dom-khi-cai
 *
 * Yêu cầu: HTML + OG image đã gen trước (chip-to-html.py + og-gen.py)
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

// ─── 22 bài + metadata SEO ──────────────────────────────────
const CHIPS = [
  // slug, post_id, seo_title (≤60), seo_desc (120-160), focus_keyword
  ['dau-dau-sau-cai', 785,
    'Đau Đầu Sau Khi Cai Thuốc — Vì Sao + Cách Giảm 2026',
    'Đau đầu cai thuốc do mạch máu não giãn lại sau nhiều năm bị nicotine co. Đỉnh Day 2-5, dịu sau 7-14 ngày. Khang đã đi qua — chia sẻ cách giảm.',
    'đau đầu cai thuốc lá'],
  ['ho-co-dom-khi-cai', 788,
    'Ho Có Đờm Khi Cai Thuốc — Dấu Hiệu Tốt Hay Xấu?',
    'Tuần 1-4 cai thuốc ho có đờm vàng nâu là DẤU HIỆU TỐT — cilia phế quản phục hồi đẩy tar 30 năm ra. Khang đã ho 3 tháng, sau đó hết hẳn.',
    'ho có đờm khi cai thuốc'],
  ['kho-tho-khi-cai', 790,
    'Khó Thở Khi Cai Thuốc — Bình Thường Hay Khám?',
    'Khó thở tuần đầu cai thuốc là phổi đang sửa, mạch máu giãn — bình thường. Khang đã thử Day 7 đi khám, BS bảo OK. Khi nào CẦN khám: chi tiết.',
    'khó thở khi cai thuốc'],
  ['chong-mat-khi-cai', 782,
    'Chóng Mặt Khi Đứng Dậy Sau Cai Thuốc — Có Nguy?',
    'Chóng mặt cai thuốc do mạch máu giãn lại sau nicotine co. Bình thường tuần 1-2, hết sau Day 14. Tip: dậy chậm + uống nước + ăn đủ.',
    'chóng mặt khi cai thuốc'],
  ['mieng-lo-loet', 795,
    'Miệng Lở Loét Khi Cai Thuốc — Vì Sao + Cách Giảm',
    'Tuần 2 cai miệng lở khô đắng do nicotine quen co mạch giờ giãn — kích ứng tạm. Uống 2.5L nước, súc muối ấm. Hết sau Day 21.',
    'miệng lở loét cai thuốc'],
  ['lo-au-vo-co', 792,
    'Lo Âu Vô Cớ + Ngực Tức Khi Cai Thuốc — Bình Thường?',
    'Tuần 2 cai lo âu vô cớ + tim đập nhanh — cortisol đang ổn định. KHÔNG phải đau tim. Bài thở 4-7-8 cứu 80%. Hết sau tuần 4.',
    'lo âu khi cai thuốc'],
  ['ban-moi-thuoc-tu-choi', 778,
    'Bạn Mời Thuốc Lúc Nhậu — Cách Từ Chối Tự Nhiên',
    'Day 25 đám cưới bạn rút thuốc mời. Mình đã trả lời "tao đang cai, sợ vợ hơn sợ ung thư" — bạn cười, không ép. Câu nói sẵn cho 5 tình huống.',
    'từ chối thuốc lá lịch sự'],
  ['buon-chan-tuan-2', 779,
    '"Đống Tro Tàn" — Buồn Vô Cớ Tuần 2 Cai Thuốc',
    'Anhedonia tuần 2-3: mọi thứ nhạt nhẽo, vô nghĩa. Dopamine baseline reset. Tuần 6 hết. Tháng 3 vui hơn lúc còn hút. Khang đã trải qua.',
    'buồn chán cai thuốc'],
  ['ca-phe-sang-khong-thuoc', 780,
    'Cà Phê Sáng Không Có Thuốc — Phá Pavlov 30 Năm',
    '30 năm cà phê + 2 điếu = Pavlov cứng. Cai thuốc cà phê sáng = thèm dữ dội. Cách phá: tuần 1-2 đổi trà xanh, tuần 3+ quay lại — không thèm.',
    'cà phê không thuốc'],
  ['champix-varenicline-cai-thuoc', 781,
    'Champix (Varenicline) — Thuốc Cai Thuốc Hiệu Quả Nhất?',
    'Champix kê đơn — tăng tỷ lệ thành công 25%. Side effects: buồn nôn, mất ngủ. Giá ~400-500k/tháng VN. Phù hợp anh đã fail 2+ lần Cold Turkey.',
    'champix giá bao nhiêu'],
  ['co-don-khi-cai', 783,
    'Cô Đơn Khi Cai Thuốc — Đặc Biệt Với Người Việt 45+',
    'Tuần 4 cảm giác cô đơn — mất "bạn" điếu thuốc 30 năm. Khoảng Lặng anh em VN: anh KHÔNG một mình. Khang đã khóc lần đầu sau 30 năm.',
    'cô đơn khi cai thuốc'],
  ['dam-tang-cuoi-khoi-thuoc', 784,
    'Đám Tang / Cưới Khi Đang Cai — Chiến Lược An Toàn',
    'Đám tang/cưới quê Việt ép thuốc nặng. Tip: báo TRƯỚC chú/bác 1 người thân. Day 30 mình đi đám tang anh họ — không hút điếu nào.',
    'đám tang cai thuốc'],
  ['khong-la-chinh-minh', 791,
    '"Tôi Không Là Chính Mình" — Identity Shift Cai Thuốc',
    'Tuần 4 cảm giác "không là mình" — 30 năm mỗi quyết định kèm điếu thuốc. Identity shift — không mất, mà đổi. Tháng 3 hoàn chỉnh.',
    'identity shift cai thuốc'],
  ['lo-hut-dieu-roi', 793,
    'Tôi Đã Lỡ Hút 1 Điếu — Phá Hết Hay Không?',
    'Lapse ≠ relapse. Hughes 2004: người cai thành công lỡ trung bình 3-5 lần. Mình đã lỡ 2 điếu Day 4-5, KHÔNG reset đếm ngày. Cách xử lý.',
    'lỡ hút 1 điếu'],
  ['mieng-dan-nicotine-nrt', 794,
    'Miếng Dán Nicotine (NRT) — Có Hiệu Quả Không?',
    'NRT (miếng dán, kẹo) giảm withdrawal Day 1-7 đáng kể. Tăng tỷ lệ thành công 50-70% (Cochrane). Giá 250-350k/tháng, không cần đơn.',
    'miếng dán nicotine'],
  ['stress-cong-viec-cai', 798,
    'Stress Công Việc Khi Đang Cai — Sao Thay Điếu Thuốc?',
    'Tháng 2 mình suýt hút lại vì deadline lớn. "Hút giúp 5 phút. Nhưng 5 năm Tự do là gì?" Bài thở 4-7-8 + đi bộ. Stress đến và đi — hút không giải quyết.',
    'stress công việc cai thuốc'],
  ['tet-le-cai-thuoc', 800,
    'Tết / Lễ — Ai Cũng Hút Thuốc, Làm Sao Giữ Thành Quả?',
    'Tết 2021 cai 1 tháng, cả nhà hút mịt — mình không hút điếu nào. Kế hoạch B 5 ngày Tết. Đặc biệt cho anh em VN nông thôn.',
    'cai thuốc dịp tết'],
  ['tim-mach-hoi-phuc', 802,
    'Tim Mạch Sau Cai Thuốc — Bao Lâu Hồi Phục?',
    'Cai 6 tháng: huyết áp 145/95 → 125/82, tim 78 → 65. 1 năm tim như tuổi 30. 5 năm như chưa hút. Doll & Hill 2004. Tim phục hồi nhanh nhất.',
    'tim mạch sau cai thuốc'],
  ['vo-chong-gian-cai', 803,
    'Vợ/Chồng Giận Chuyện Cai Thuốc — Phải Làm Sao?',
    'Tuần 2 cai mình cáu vợ vô cớ. Cortisol cao + dopamine thấp. Báo TRƯỚC vợ về tuần đầu cai: "anh cáu lắm, không phải vì em". Vợ sẽ thông cảm.',
    'vợ chồng giận cai thuốc'],
  // 3 bài CRITICAL
  ['dau-nguc-du-doi-115', 786,
    'Đau Ngực Dữ Dội Khi Cai Thuốc — GỌI 115 NGAY',
    'Đau ngực dữ dội + khó thở khi cai thuốc CÓ THỂ là đau tim. KHÔNG đợi — gọi 115 NGAY. Hướng dẫn nhận diện cấp cứu tim mạch.',
    'đau ngực khi cai thuốc'],
  ['khac-dom-co-mau-canh-bao', 789,
    'Khạc Đờm Có Máu Khi Cai Thuốc — Cảnh Báo Cần Khám',
    'Đờm vàng nâu khi cai = bình thường. Nhưng đờm có MÁU tươi = dấu hiệu cảnh báo. Có thể lao, viêm phổi, ung thư phổi. Đi khám TRONG TUẦN.',
    'khạc đờm máu cai thuốc'],
  ['y-nghi-tu-hai-cai-thuoc', 804,
    'Có Ý Nghĩ Tự Hại Khi Cai Thuốc — Bạn Không Một Mình',
    'Trầm cảm tạm thời do cai thuốc có thể trigger ý nghĩ tự hại. Tuần 4-8 hết. Gọi 1800 1567 NGAY (miễn phí 24/7). Khang đã đi qua — bạn không một mình.',
    'trầm cảm cai thuốc tự hại'],
];

async function processOne(slug, postId, seoTitle, seoDesc, focus, dryRun) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', `CHIP-${slug}.html`);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${slug}.png`);

  if (!fs.existsSync(htmlPath)) return { slug, status: 'NO_HTML' };
  if (!fs.existsSync(ogPath)) return { slug, status: 'NO_OG' };

  if (dryRun) {
    return { slug, status: 'WOULD_PUBLISH', postId };
  }

  // 1. Upload OG image
  let mediaId;
  try {
    const media = await uploadFile(ogPath);
    mediaId = media.id;
  } catch (e) {
    return { slug, status: 'UPLOAD_FAIL', error: e.message };
  }

  // 2. Update post: content + featured + status + SEO meta
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
    rank_math_focus_keyword: focus,
  };

  try {
    const updated = await api.post(`/wp-json/wp/v2/posts/${postId}`, {
      content,
      featured_media: mediaId,
      status: 'publish',
      meta,
    });
    return { slug, status: 'PUBLISHED', postId, mediaId, link: updated.link };
  } catch (e) {
    return { slug, status: 'UPDATE_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? CHIPS.filter((c) => onlyList.includes(c[0])) : CHIPS;

  console.log(`▶ Bulk publish ${tasks.length} chip articles${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  const results = [];
  for (const [slug, postId, seoTitle, seoDesc, focus] of tasks) {
    process.stdout.write(`▶ ${slug.padEnd(38)} (#${postId})... `);
    const r = await processOne(slug, postId, seoTitle, seoDesc, focus, dryRun);
    results.push(r);
    if (r.status === 'PUBLISHED') {
      console.log(`✓ ${r.link}`);
    } else if (r.status === 'WOULD_PUBLISH') {
      console.log(`(dry-run OK)`);
    } else {
      console.log(`✗ ${r.status}`);
      if (r.error) console.log(`   ${r.error}`);
      if (r.body) console.log(`   ${JSON.stringify(r.body).slice(0, 200)}`);
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  console.log('Tổng kết:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
