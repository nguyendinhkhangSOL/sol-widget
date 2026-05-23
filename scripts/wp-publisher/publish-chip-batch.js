#!/usr/bin/env node
/**
 * Sol v4 — Publish/Update 34 bài CHIP wiki (đã có FAQ schema inject sẵn)
 *
 * 5 bài đã tồn tại từ Week 1 (UPDATE):
 *   cai-thuoc-bao-nhieu-lan-moi-thanh-cong
 *   khong-the-cai-thuoc-da-thu-moi-cach
 *   mat-y-chi-cai-thuoc-phai-lam-sao
 *   phoi-den-co-sach-lai-duoc-khong
 *   kha-nang-tinh-duc-sau-cai-thuoc
 *
 * 29 bài còn lại sẽ tạo mới (CREATE)
 *
 * Usage:
 *   node publish-chip-batch.js --dry-run
 *   node publish-chip-batch.js                       # tất cả 34
 *   node publish-chip-batch.js --only=dau-nguc-du-doi-115
 *   node publish-chip-batch.js --skip-existing       # bỏ qua 5 bài Week 1
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

async function findCategoryId(slug) {
  const cats = await api.get(`/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}&_fields=id`);
  return Array.isArray(cats) && cats[0] ? cats[0].id : null;
}

async function findPostBySlug(slug) {
  const items = await api.get(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private&context=edit&_fields=id,slug,link`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

// ─── 34 bài CHIP ─────────────────────────────────────────────────
// [slug, title, seoTitle (≤60c), seoDesc (120-160c), focus]
const CHIPS = [
  // ── SOS / Emergency (3 bài cao ưu tiên) ──
  ['dau-nguc-du-doi-115',
    'Đau Ngực Dữ Dội Khi Cai Thuốc — Gọi 115 Khi Nào?',
    'Đau Ngực Khi Cai Thuốc — Khi Nào Gọi 115?',
    'Đau ngực dữ dội khi cai thuốc có thể là tim mạch. Gọi 115 ngay nếu: đau lan tay trái, khó thở, vã mồ hôi. Phân biệt với stress cai.',
    'đau ngực khi cai thuốc'],

  ['khac-dom-co-mau-canh-bao',
    'Khạc Đờm Có Máu Khi Cai Thuốc — Khi Nào Cần Khám?',
    'Khạc Đờm Có Máu Cai Thuốc — Đi Khám Ngay',
    'Khạc đờm có máu cai thuốc có thể là dấu hiệu nguy hiểm: viêm phổi, ung thư phổi, lao. Phân biệt máu tươi/đông, khi nào cần X-quang ngay.',
    'khạc đờm có máu cai thuốc'],

  ['sap-hut-lai-cuu',
    'Sắp Hút Lại — Cứu Khẩn Cấp 90 Giây Vượt Cơn Thèm',
    'Sắp Hút Lại Cai Thuốc — Cứu Khẩn Cấp 2026',
    'Sắp hút lại? Đây là 90 giây cứu khẩn cấp: HÍT-CHẶN-CHỜ. Cơn thèm là sóng, không phải lệnh. Khang chia sẻ kỹ thuật vượt cơn cuối.',
    'sắp hút lại cai thuốc'],

  // ── Triệu chứng cơ thể (10 bài) ──
  ['mat-ngu-khi-cai-thuoc',
    'Mất Ngủ Khi Cai Thuốc — Vì Sao + 5 Cách Ngủ Lại 2026',
    'Mất Ngủ Khi Cai Thuốc — Khoa Học + Giải Pháp',
    'Mất ngủ cai thuốc 40-60% người vấp, REM rebound. Kéo dài 1-3 tuần. 5 cách ngủ lại không cần thuốc. Khang chia sẻ Day 4.',
    'mất ngủ khi cai thuốc'],

  ['dau-dau-sau-cai',
    'Đau Đầu Sau Cai Thuốc — Vì Sao + Cách Giảm 2026',
    'Đau Đầu Sau Cai Thuốc — Khoa Học 2026',
    'Đau đầu sau cai thuốc là vasodilation — máu lên não nhiều hơn. Kéo dài 3-7 ngày. 5 cách giảm không cần thuốc giảm đau.',
    'đau đầu khi cai thuốc'],

  ['chong-mat-khi-cai',
    'Chóng Mặt Khi Cai Thuốc — Bao Lâu Hết? 2026',
    'Chóng Mặt Khi Cai Thuốc — Nguyên Nhân',
    'Chóng mặt khi cai thuốc do oxy máu tăng đột ngột sau khi CO giảm. Hết sau 2-3 ngày. Khi nào cần khám bác sĩ.',
    'chóng mặt khi cai thuốc'],

  ['ho-co-dom-khi-cai',
    'Ho Có Đờm Khi Cai Thuốc — Dấu Hiệu Tốt 2026',
    'Ho Có Đờm Cai Thuốc — Phổi Đang Sạch',
    'Ho có đờm vàng/nâu khi cai thuốc là dấu hiệu TỐT — cilia phổi đang đẩy tar ra. Hết sau 4-12 tuần. Khi nào cần khám.',
    'ho có đờm cai thuốc'],

  ['kho-tho-khi-cai',
    'Khó Thở Khi Cai Thuốc — Bình Thường Hay Nguy Hiểm?',
    'Khó Thở Cai Thuốc — Phân Biệt Bình Thường',
    'Khó thở cai thuốc nhẹ là phổi tái cấu trúc — bình thường. Phân biệt với asthma, COPD exacerbation cần khám gấp.',
    'khó thở khi cai thuốc'],

  ['tao-bon-khi-cai',
    'Táo Bón Khi Cai Thuốc — Vì Sao + Cách Xử Lý 2026',
    'Táo Bón Khi Cai Thuốc — Giải Pháp 2026',
    'Táo bón cai thuốc do nhu động ruột giảm khi mất nicotine kích thích. 5 cách xử lý: nước, chất xơ, vận động, không cần thuốc nhuận tràng.',
    'táo bón khi cai thuốc'],

  ['mieng-lo-loet',
    'Miệng Lở Loét Khi Cai Thuốc — Bình Thường?',
    'Miệng Lở Loét Cai Thuốc — Vì Sao 2026',
    'Miệng lở loét sau cai thuốc do hệ miễn dịch hoạt động lại + niêm mạc hồi phục. Hết sau 2-4 tuần. Khi nào cần khám nha sĩ.',
    'miệng lở loét cai thuốc'],

  ['tim-mach-hoi-phuc',
    'Tim Mạch Hồi Phục Sau Cai Thuốc — Timeline 2026',
    'Tim Mạch Hồi Phục Cai Thuốc — Timeline',
    'Tim mạch hồi phục: 20 phút HR ↓, 24h CO sạch, 1 năm risk heart attack ↓ 50%, 15 năm = non-smoker. Timeline khoa học đầy đủ.',
    'tim mạch hồi phục cai thuốc'],

  ['kha-nang-tinh-duc-sau-cai-thuoc',
    'Khả Năng Sinh Lý Sau Cai Thuốc — Phục Hồi 12 Tháng',
    'Khả Năng Sinh Lý Sau Cai Thuốc 2026',
    'Cai thuốc 2-4 tuần cương cứng cải thiện. 3 tháng ED giảm 50%. 6 tháng tinh trùng tốt hơn. Khang chia sẻ 50 tuổi.',
    'sinh lý sau cai thuốc'],

  ['phoi-den-co-sach-lai-duoc-khong',
    'Phổi Đen Có Sạch Lại Được Không Sau Khi Cai? 2026',
    'Phổi Đen Có Sạch Lại — Timeline 20 Năm',
    'Phổi tự sạch tar 80-90% sau cai 1-3 năm. Cilia phục hồi 3 tháng, FEV1 ↑ 30%, ung thư phổi ↓ 50% sau 10 năm.',
    'phổi đen có sạch không'],

  // ── Cảm xúc / Tâm lý (7 bài) ──
  ['cau-gat-khi-cai-thuoc',
    'Cáu Gắt Khi Cai Thuốc — 5 Kỹ Thuật Kiểm Soát 2026',
    'Cáu Gắt Khi Cai Thuốc — Đỉnh + Cách Hạ',
    'Cáu gắt cai thuốc đạt đỉnh Day 5-7 do cortisol cao + prefrontal yếu. 5 kỹ thuật hạ cơn + cách báo trước vợ con.',
    'cáu gắt khi cai thuốc'],

  ['lo-au-vo-co',
    'Lo Âu Vô Cớ Khi Cai Thuốc — Bình Thường? 2026',
    'Lo Âu Vô Cớ Cai Thuốc — Khoa Học',
    'Lo âu vô cớ cai thuốc do dopamine + GABA mất cân bằng tạm thời. Hết sau 2-4 tuần. Phân biệt với rối loạn lo âu cần khám.',
    'lo âu khi cai thuốc'],

  ['co-don-khi-cai',
    'Cô Đơn Khi Cai Thuốc — Vì Sao + 5 Cách Vượt 2026',
    'Cô Đơn Khi Cai Thuốc — Giải Pháp 2026',
    'Cô đơn cai thuốc do mất "bạn cũ" (điếu thuốc) + mất nhóm bạn hút. 5 cách xây kết nối mới không cần thuốc.',
    'cô đơn khi cai thuốc'],

  ['buon-chan-tuan-2',
    'Buồn Chán Tuần 2 Cai Thuốc — Đống Tro Tàn 2026',
    'Buồn Chán Tuần 2 Cai Thuốc — Vì Sao',
    'Buồn chán tuần 2 = Đống Tro Tàn (anhedonia tạm). Dopamine baseline thấp 2-4 tuần. Tự qua, không phải trầm cảm.',
    'buồn chán cai thuốc'],

  ['khong-la-chinh-minh',
    'Không Là Chính Mình Sau Cai Thuốc — Bình Thường?',
    'Không Là Chính Mình Cai Thuốc 2026',
    '"Không là chính mình" sau cai = identity reset. Não đang xây identity mới (người không hút). Hết sau 4-8 tuần.',
    'không là chính mình cai thuốc'],

  ['y-nghi-tu-hai-cai-thuoc',
    'Ý Nghĩ Tự Hại Khi Cai Thuốc — Khi Nào Cần Khám?',
    'Ý Nghĩ Tự Hại Cai Thuốc — Khám Ngay',
    'Ý nghĩ tự hại khi cai thuốc — KHÁM NGAY. 5-7% gặp ideation. Hotline 1800-599-920. Khang khuyên: KHÔNG tự xử lý một mình.',
    'ý nghĩ tự hại cai thuốc'],

  ['muon-bo-cuoc-cai-thuoc',
    'Muốn Bỏ Cuộc Cai Thuốc — 5 Cách Vượt Qua 2026',
    'Muốn Bỏ Cuộc Cai Thuốc — Giải Pháp',
    'Muốn bỏ cuộc cai thuốc Day 3-7 là 70% người vấp. 5 cách vượt qua mà không hút lại. Khang chia sẻ Day 5 lần 5.',
    'muốn bỏ cuộc cai thuốc'],

  // ── Tình huống xã hội (5 bài) ──
  ['ban-moi-thuoc-tu-choi',
    'Bạn Mời Thuốc — 5 Câu Từ Chối Không Mất Lòng 2026',
    'Bạn Mời Thuốc — Cách Từ Chối Lịch Sự',
    'Bạn mời thuốc khi đang cai? 5 câu từ chối không mất lòng + giữ tình bạn. Khang chia sẻ ranh giới năm thứ 5.',
    'từ chối bạn mời thuốc'],

  ['ca-phe-sang-khong-thuoc',
    'Cà Phê Sáng Không Thuốc — Phá Pavlov 90 Ngày',
    'Cà Phê Sáng Không Thuốc — Cách Phá Pavlov',
    'Cà phê sáng = trigger số 1 Việt Nam. Pavlov 60.000 lần. Phá bằng 5 thay thế + đổi context. 90 ngày là đủ.',
    'cà phê sáng không thuốc'],

  ['lo-hut-dieu-roi',
    'Lỡ Hút Điếu Rồi Có Phải Tái Nghiện? Lapse vs Relapse',
    'Lỡ Hút 1 Điếu — Lapse Không Phải Relapse',
    'Lỡ hút 1 điếu (lapse) KHÔNG = tái nghiện (relapse). 70% phục hồi nếu xử lý đúng. Protocol 5 bước Marlatt 1985.',
    'lỡ hút 1 điếu cai thuốc'],

  ['stress-cong-viec-cai',
    'Stress Công Việc Khi Cai Thuốc — Smoke Break Thay Thế',
    'Stress Công Việc Cai Thuốc 2026',
    'Stress công việc + cai thuốc = combo dễ vấp. Work-break smoke ritual Pavlov 60.000 lần. 5 thay thế giờ nghỉ hiệu quả.',
    'stress công việc cai thuốc'],

  ['vo-chong-gian-cai',
    'Vợ Chồng Giận Khi Cai Thuốc — 5 Cách Hoà Giải',
    'Vợ Chồng Giận Cai Thuốc — Hoà Giải',
    'Vợ giận khi chồng cai thuốc cáu gắt? Báo trước Day 5-7 cortisol cao. 5 câu xin lỗi + 3 hành động hoà giải.',
    'vợ chồng giận cai thuốc'],

  // ── Tình huống đặc biệt (4 bài) ──
  ['dam-tang-cuoi-khoi-thuoc',
    'Đám Tang Cưới Có Thuốc — Cách Vượt Sự Kiện 2026',
    'Đám Tang Cưới Cai Thuốc — Plan B',
    'Đám tang/cưới có thuốc lá nhiều = trigger cao. Plan B: arrive late, đứng cạnh người không hút, có bài thoát.',
    'đám tang cưới cai thuốc'],

  ['tet-le-cai-thuoc',
    'Tết Lễ Cai Thuốc — Sống Sót Văn Hoá Bia Rượu 2026',
    'Tết Lễ Cai Thuốc — Plan B Sống Sót',
    'Tết là combo: gia đình + rượu + bài + thuốc lá free. 5 chiến lược sống sót 7 ngày Tết không tái nghiện.',
    'tết cai thuốc'],

  ['thuc-don-cai-thuoc-khong-tang-can',
    'Thực Đơn Cai Thuốc Không Tăng Cân — 7 Ngày Mẫu',
    'Thực Đơn Cai Thuốc Không Tăng Cân',
    'Thực đơn cai thuốc 7 ngày không tăng cân: 1.800 kcal, protein cao, low GI. Tránh đường + carb trắng để kiểm soát BMR ↓.',
    'thực đơn cai thuốc không tăng cân'],

  // ── Last-resort / Method (5 bài) ──
  ['mat-y-chi-cai-thuoc-phai-lam-sao',
    'Mất Ý Chí Cai Thuốc — Lỗi Hệ Thống Không Phải Anh',
    'Mất Ý Chí Cai Thuốc 2026 — Hệ Thống',
    'Mất ý chí cai thuốc KHÔNG phải lỗi cá nhân — là dopamine tụt + ý chí cạn. 6 bước xây hệ thống không cần ý chí.',
    'mất ý chí cai thuốc'],

  ['khong-the-cai-thuoc-da-thu-moi-cach',
    'Không Thể Cai Thuốc — Đã Thử Mọi Cách Vẫn Vấp 2026',
    'Không Cai Được Thuốc — Vẫn Vấp 2026',
    'Đã thử cold turkey, NRT, Champix, vape — vẫn không cai. Vấn đề KHÔNG phải bạn — là dùng đơn lẻ. Combo 4 lớp 50%.',
    'không cai được thuốc lá'],

  ['cai-thuoc-bao-nhieu-lan-moi-thanh-cong',
    'Cai Thuốc Bao Nhiêu Lần Mới Thành Công? Trung Bình 30+',
    'Cai Thuốc Bao Nhiêu Lần Mới Thành Công',
    'Khoa học 2026: trung bình 30+ lần thử mới cai hẳn. Khang đã cai 5 lần — lần 5 là cuối. Tỷ lệ thành công + chiến lược.',
    'cai thuốc bao nhiêu lần thành công'],

  ['mieng-dan-nicotine-nrt',
    'Miếng Dán Nicotine NRT — Hướng Dẫn Sử Dụng 2026',
    'Miếng Dán Nicotine NRT — Cách Dùng',
    'NRT miếng dán nicotine: dose 21/14/7mg theo Fagerström. Tỷ lệ thành công +50% vs placebo (Cochrane 2018). Cách dùng đúng.',
    'miếng dán nicotine'],

  ['champix-varenicline-cai-thuoc',
    'Champix Varenicline Cai Thuốc — Hiệu Quả + Tác Dụng Phụ',
    'Champix Varenicline — Khoa Học 2026',
    'Champix (varenicline): tỷ lệ thành công 25-30% (Cochrane). Tác dụng phụ: buồn nôn 30%, mơ sống động 15%. Khang đã dùng.',
    'champix varenicline cai thuốc'],

  ['vape-co-an-toan-de-cai-thuoc',
    'Vape Có An Toàn Để Cai Thuốc Không? Khoa Học 2026',
    'Vape Cai Thuốc — Có An Toàn 2026',
    'Vape cai thuốc: hiệu quả +50% vs NRT (Cochrane 2024) nhưng có rủi ro EVALI + nicotine. VN cấm 01/2025. Khang khuyên cách an toàn.',
    'vape cai thuốc'],
];

// Loại bỏ duplicate slug
const uniqMap = new Map();
for (const row of CHIPS) {
  if (!uniqMap.has(row[0])) uniqMap.set(row[0], row);
}
const UNIQ_CHIPS = Array.from(uniqMap.values());

async function processOne(slug, title, seoTitle, seoDesc, focus, dryRun, categoryId, skipExisting) {
  const htmlPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', `CHIP-${slug}.html`);
  const ogPath = path.resolve(__dirname, '..', '..', 'wiki-skeletons', 'wiki-articles', 'og-images', `${slug}.png`);

  if (!fs.existsSync(htmlPath)) return { slug, status: 'NO_HTML' };
  if (!fs.existsSync(ogPath)) return { slug, status: 'NO_OG' };

  const existing = await findPostBySlug(slug);

  if (skipExisting && existing) return { slug, status: 'SKIPPED', postId: existing.id };

  if (dryRun) return { slug, status: 'WOULD_PUBLISH', existing: existing?.id };

  let mediaId;
  try {
    const media = await uploadFile(ogPath);
    mediaId = media.id;
  } catch (e) {
    return { slug, status: 'UPLOAD_FAIL', error: e.message };
  }

  const content = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {
    rank_math_title: seoTitle,
    rank_math_description: seoDesc,
    rank_math_focus_keyword: focus,
  };

  const payload = {
    slug, title, content, excerpt: seoDesc, status: 'publish',
    featured_media: mediaId, meta,
    ...(categoryId ? { categories: [categoryId] } : {}),
  };

  try {
    const result = existing
      ? await api.post(`/wp-json/wp/v2/posts/${existing.id}`, payload)
      : await api.post(`/wp-json/wp/v2/posts`, payload);
    return {
      slug, status: existing ? 'UPDATED' : 'CREATED',
      postId: result.id, mediaId, link: result.link,
    };
  } catch (e) {
    return { slug, status: 'POST_FAIL', error: e.message, body: e.body };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipExisting = process.argv.includes('--skip-existing');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyList = onlyArg ? onlyArg.slice(7).split(',') : null;

  const tasks = onlyList ? UNIQ_CHIPS.filter((c) => onlyList.includes(c[0])) : UNIQ_CHIPS;

  console.log(`▶ Publish ${tasks.length} bài CHIP${dryRun ? ' (DRY RUN)' : ''}${skipExisting ? ' (SKIP EXISTING)' : ''}`);

  const categoryId = await findCategoryId('wiki-bo-thuoc-la');
  if (categoryId) console.log(`  Category: wiki-bo-thuoc-la → #${categoryId}`);
  console.log('');

  const results = [];
  for (const [slug, title, seoTitle, seoDesc, focus] of tasks) {
    process.stdout.write(`▶ ${slug.padEnd(45)}... `);
    const r = await processOne(slug, title, seoTitle, seoDesc, focus, dryRun, categoryId, skipExisting);
    results.push(r);
    if (r.status === 'CREATED' || r.status === 'UPDATED') console.log(`✓ ${r.status} ${r.link}`);
    else if (r.status === 'WOULD_PUBLISH') console.log(`(dry-run — ${r.existing ? `update #${r.existing}` : 'tạo mới'})`);
    else if (r.status === 'SKIPPED') console.log(`⊘ skipped (#${r.postId})`);
    else {
      console.log(`✗ ${r.status}`);
      if (r.error) console.log(`   ${r.error}`);
      if (r.body) console.log(`   ${JSON.stringify(r.body).slice(0, 200)}`);
    }
  }

  console.log('');
  console.log('━'.repeat(70));
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  console.log('Tổng kết:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('━'.repeat(70));
}

main().catch((e) => { console.error(e); process.exit(1); });
