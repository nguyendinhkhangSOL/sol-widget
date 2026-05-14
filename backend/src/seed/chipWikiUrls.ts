// backend/src/seed/chipWikiUrls.ts
//
// Mapping chip slug → URL bài Wiki trên sol.vn (LIVE từ 2026-05-13).
//
// Khi user bấm chip trong widget chat → answer hiện ngay + nút "Đọc thêm"
// link sang bài wiki tương ứng. Bài wiki được biên tập dual-purpose:
//   - 30 giây đầu = phần "Cần biết ngay" (chip user đọc bổ sung)
//   - Phần dưới = SEO long-tail content (organic traffic từ Google)
//
// 27/42 chip có wikiUrl. Số còn lại để rỗng — sẽ wire khi viết wiki sau.
//
// Cập nhật: sửa file này khi có wiki mới LIVE → chạy:
//   npm run wire:wiki         # update DB
//   npm run wire:wiki -- --dry # preview only

export interface ChipWikiMapping {
  wikiUrl: string;
  wikiLabel?: string;
}

const WIKI_BASE = 'https://sol.vn';

// Helper: tạo entry chuẩn với label mặc định "Đọc bài đầy đủ"
const w = (slug: string, label = 'Đọc bài đầy đủ trên sol.vn'): ChipWikiMapping => ({
  wikiUrl: `${WIKI_BASE}/${slug}/`,
  wikiLabel: label,
});

export const CHIP_WIKI_URLS: Record<string, ChipWikiMapping> = {
  /* ─── Cơn thèm cấp + slip (chia sẻ wiki sóng thèm 90 giây) ─── */
  'them-thuoc': w('them-thuoc-dem-khuya-90-giay', 'Kỹ thuật 90 giây — xem chi tiết'),
  'them-du-doi': w('them-thuoc-dem-khuya-90-giay', 'Sóng thèm 90 giây — xem cách vượt'),
  'sap-hut-lai': w('sap-hut-lai-cuu', 'Đọc bài chi tiết — Sắp hút lại'),
  'lo-hut-roi': w('lo-hut-dieu-roi', 'Lỡ hút điếu rồi — đọc bài chi tiết'),
  'bao-lau-het-them': w('trieu-chung-cai-thuoc-la-theo-ngay', 'Xem timeline đầy đủ theo ngày'),

  /* ─── Triệu chứng cơ thể (5/6 — chưa có wiki cho táo bón) ─── */
  'ho-co-dom': w('ho-co-dom-khi-cai', 'Đọc bài chi tiết — Ho có đờm'),
  'dau-dau': w('dau-dau-sau-cai', 'Đau đầu cai thuốc — bài chi tiết'),
  'chong-mat': w('chong-mat-khi-cai', 'Chóng mặt khi cai — bài chi tiết'),
  'kho-tho': w('kho-tho-khi-cai', 'Khó thở khi cai — bài chi tiết'),
  'mieng-lo-loet': w('mieng-lo-loet', 'Miệng lở loét — bài chi tiết'),
  'tang-can': w('tang-can-khi-cai-thuoc', 'Tăng cân khi cai — bài đầy đủ'),

  /* ─── Tâm lý / cảm xúc (5/5 đầy đủ) ──────────────────────── */
  'buon-chan': w('buon-chan-tuan-2', 'Đống tro tàn tuần 2 — bài chi tiết'),
  'co-don': w('co-don-khi-cai', 'Cô đơn khi cai — bài chi tiết'),
  'lo-au': w('lo-au-vo-co', 'Lo âu vô cớ khi cai — bài chi tiết'),
  'stress-cong-viec': w('stress-cong-viec-cai', 'Stress công việc + cai — bài chi tiết'),
  'khong-la-minh': w('khong-la-chinh-minh', 'Không là chính mình — bài chi tiết'),

  /* ─── Tình huống xã hội Việt (6/6 đầy đủ) ────────────────── */
  'di-nhau': w('cai-thuoc-khi-di-nhau', 'Đi nhậu khi cai — bài chi tiết'),
  'ca-phe-sang': w('ca-phe-sang-khong-thuoc', 'Cà phê sáng không thuốc — bài chi tiết'),
  'ban-moi-thuoc': w('ban-moi-thuoc-tu-choi', 'Bạn mời thuốc — cách từ chối'),
  'vo-chong-gian': w('vo-chong-gian-cai', 'Vợ chồng giận khi cai — bài chi tiết'),
  'dam-tang-cuoi': w('dam-tang-cuoi-khoi-thuoc', 'Đám tang/cưới khói thuốc — bài chi tiết'),
  'tet-le': w('tet-le-cai-thuoc', 'Tết lễ cai thuốc — bài chi tiết'),

  /* ─── Khoa học / kiến thức (4/4 + phổi map sang Cluster A4) ─── */
  'phoi-hoi-phuc': w('cai-thuoc-bao-lau-phoi-sach', 'Phổi sạch sau bao lâu — bài chi tiết'),
  'tim-mach': w('tim-mach-hoi-phuc', 'Tim mạch hồi phục — bài chi tiết'),
  'champix': w('champix-varenicline-cai-thuoc', 'Champix/Varenicline — bài chi tiết'),
  'mieng-dan-nicotine': w('mieng-dan-nicotine-nrt', 'NRT miếng dán nicotine — bài chi tiết'),

  /* ─── 🚨 KHẨN CẤP Y TẾ (3/3 CRITICAL) ────────────────────── */
  'khac-mau': w('khac-dom-co-mau-canh-bao', 'Khạc đờm có máu — đọc cảnh báo y tế'),
  'dau-nguc-du': w('dau-nguc-du-doi-115', 'Đau ngực dữ dội — đọc cảnh báo y tế'),
  'y-nghi-tu-hai': w('y-nghi-tu-hai-cai-thuoc', 'Ý nghĩ tự hại — đọc bài hỗ trợ'),

  /* ─── Wave 2 (13-05-2026): 6 wiki bổ sung cho chip thiếu ─── */
  'bo-cuoc': w('muon-bo-cuoc-cai-thuoc', 'Muốn bỏ cuộc — cách vượt 60 phút tới'),
  'mat-ngu': w('mat-ngu-khi-cai-thuoc', 'Mất ngủ khi cai — cách ngủ lại'),
  'cau-gat': w('cau-gat-khi-cai-thuoc', 'Cáu gắt khi cai — cách kiểm soát'),
  'tao-bon': w('tao-bon-khi-cai', 'Táo bón khi cai — cách giải tự nhiên'),
  'vape-an-toan': w('vape-co-an-toan-de-cai-thuoc', 'Vape có an toàn? — sự thật 2026'),
  // tang-can đã map sang A5 cluster — link thêm bài thực đơn deep dive:
  // (chip dùng `tang-can` lấy A5; nếu cần thực đơn deep dive — admin update wikiUrl tay)
};

// Slugs vẫn chưa có wiki — wireChipWikiUrls.ts sẽ KHÔNG đụng đến.
// Liệt kê đây để Khang biết bài nào cần viết tiếp:
//   mot-dieu, khang-tung-cam-thay, thanh-cong-toi, dang-hi-sinh,
//   cach-dung-app, doi-q-day, hoan-tien, lien-he-khang, voice-khang
