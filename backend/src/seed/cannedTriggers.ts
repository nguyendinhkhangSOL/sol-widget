// backend/src/seed/cannedTriggers.ts
//
// Mapping slug → trigger keywords + priority + minScore cho 30 canned reply.
// Frontend chat widget dùng map này để match user message → render canned
// answer NGAY (không gọi AI) → siêu nhanh + tiết kiệm token.
//
// Quy ước:
//   - Trigger có thể có dấu hoặc không — frontend normalize trước khi match
//   - Priority 100 = thường, 200 = quan trọng, 1000 = CRITICAL y tế
//   - minScore thấp (0.3) cho CRITICAL — thà false positive còn hơn miss

export interface TriggerConfig {
  triggers: string[];
  priority: number;
  minScore?: number;
}

export const CANNED_TRIGGERS: Record<string, TriggerConfig> = {
  /* ─── Cơn thèm cấp + slip (priority 200-300) ────────── */
  'them-thuoc': {
    triggers: ['thèm thuốc', 'muốn hút', 'thèm hút', 'đang thèm', 'muốn châm', 'thèm điếu'],
    priority: 200,
  },
  'them-du-doi': {
    triggers: ['thèm dữ', 'thèm khủng', 'thèm quá', 'không kiềm chế', 'sóng thèm', 'thèm điên'],
    priority: 250,
  },
  'sap-hut-lai': {
    triggers: ['sắp hút lại', 'muốn hút quá', 'phải hút thôi', 'không chịu nổi nữa', 'cứu tôi', 'sắp tái phát'],
    priority: 300,
  },
  'lo-hut-roi': {
    triggers: ['đã hút lại', 'lỡ hút', 'vừa hút', 'hút điếu rồi', 'hút mất 1 điếu', 'lỡ vài hơi'],
    priority: 280,
  },
  'mot-dieu': {
    triggers: ['1 điếu', 'một điếu', 'thử một điếu', 'hút một điếu thôi', '1 điếu có sao', 'một điếu thôi'],
    priority: 180,
  },

  /* ─── Câu hỏi phổ biến ──────────────────────────────── */
  'bo-cuoc': {
    triggers: ['muốn bỏ cuộc', 'không chịu nổi', 'bỏ cuộc thôi', 'không cai được', 'muốn từ bỏ', 'mệt quá'],
    priority: 200,
  },
  'bao-lau-het-them': {
    triggers: ['bao lâu hết thèm', 'khi nào hết thèm', 'bao giờ thèm hết', 'thèm bao lâu', 'mấy ngày hết thèm'],
    priority: 100,
  },

  /* ─── Triệu chứng cơ thể ────────────────────────────── */
  'ho-co-dom': {
    triggers: ['ho có đờm', 'khạc đờm', 'đờm vàng', 'ho đờm', 'ho ra đờm', 'khạc nhổ', 'đờm nâu'],
    priority: 150,
  },
  'dau-dau': {
    triggers: ['đau đầu', 'nhức đầu', 'đau nửa đầu', 'đầu căng', 'đầu nặng', 'choáng đầu'],
    priority: 120,
  },
  'chong-mat': {
    triggers: ['chóng mặt', 'choáng váng', 'xây xẩm', 'đầu quay', 'mất thăng bằng'],
    priority: 130,
  },
  'kho-tho': {
    triggers: ['khó thở', 'thở khó', 'hụt hơi', 'thở không sâu', 'ngực hơi tức', 'thở mệt'],
    priority: 150,
  },
  'tao-bon': {
    triggers: ['táo bón', 'khó đi ngoài', 'không đi tiêu', 'đi cầu khó', 'không đi vệ sinh được'],
    priority: 100,
  },
  'mat-ngu': {
    triggers: ['mất ngủ', 'không ngủ được', 'khó ngủ', 'ngủ không được', 'thức trắng', 'ngủ chập chờn'],
    priority: 150,
  },
  'mieng-lo-loet': {
    triggers: ['miệng lở', 'lở loét', 'khô miệng', 'đắng miệng', 'miệng có vết', 'lưỡi đau'],
    priority: 120,
  },
  'tang-can': {
    triggers: ['tăng cân', 'lên cân', 'béo lên', 'sợ tăng cân', 'ăn nhiều', 'mập thêm'],
    priority: 110,
  },

  /* ─── Tâm lý / cảm xúc ──────────────────────────────── */
  'cau-gat': {
    triggers: ['cáu gắt', 'cáu kỉnh', 'dễ nổi nóng', 'tức giận', 'hay cáu', 'nổi cáu', 'bực bội'],
    priority: 130,
  },
  'buon-chan': {
    triggers: ['buồn vô cớ', 'chán nản', 'không hứng thú', 'đống tro tàn', 'buồn chán', 'trống rỗng', 'mất hứng thú'],
    priority: 200,
  },
  'co-don': {
    triggers: ['cô đơn', 'lạc lõng', 'một mình', 'không ai hiểu', 'cô độc', 'lẻ loi'],
    priority: 150,
  },
  'lo-au': {
    triggers: ['lo âu', 'lo lắng', 'tim đập nhanh', 'hồi hộp', 'căng thẳng', 'bồn chồn', 'panic'],
    priority: 180,
  },
  'stress-cong-viec': {
    triggers: ['stress công việc', 'áp lực công việc', 'stress quá', 'áp lực sếp', 'deadline', 'overwork'],
    priority: 150,
  },
  'khong-la-minh': {
    triggers: ['không là chính mình', 'không phải tôi', 'lạ lắm', 'thấy lạ', 'khác hẳn', 'không như xưa'],
    priority: 130,
  },

  /* ─── Tình huống xã hội Việt ────────────────────────── */
  'di-nhau': {
    triggers: ['đi nhậu', 'đi tiếp khách', 'nhậu', 'đi quán bia', 'uống bia', 'đi uống', 'tăng ca nhậu'],
    priority: 200,
  },
  'ca-phe-sang': {
    triggers: ['cà phê sáng', 'uống cà phê', 'thiếu thuốc khi cà phê', 'sáng cà phê', 'cafe sáng'],
    priority: 180,
  },
  'ban-moi-thuoc': {
    triggers: ['bạn mời thuốc', 'anh em mời', 'ép hút', 'mời điếu', 'rủ hút', 'người mời thuốc'],
    priority: 150,
  },
  'vo-chong-gian': {
    triggers: ['vợ giận', 'chồng giận', 'vợ tức', 'vợ nói', 'cãi vợ', 'cãi nhau với vợ', 'vợ bực'],
    priority: 180,
  },
  'dam-tang-cuoi': {
    triggers: ['đám tang', 'đám cưới', 'đám hỏi', 'đám giỗ', 'viếng', 'tiệc cưới', 'đi viếng'],
    priority: 200,
  },
  'tet-le': {
    triggers: ['ngày tết', 'tết đến', 'ăn tết', 'lễ tết', 'mùng 1', 'mùng 2', 'mùng 3'],
    priority: 200,
  },

  /* ─── Khoa học / kiến thức ──────────────────────────── */
  'phoi-hoi-phuc': {
    triggers: ['phổi hồi phục', 'phổi khỏe lại', 'phổi tôi', 'phổi sau cai', 'phổi có hồi'],
    priority: 100,
  },
  'tim-mach': {
    triggers: ['tim mạch', 'tim hồi phục', 'bệnh tim', 'rủi ro tim', 'huyết áp', 'cholesterol'],
    priority: 100,
  },
  'champix': {
    triggers: ['champix', 'varenicline', 'thuốc cai chuyên dụng', 'thuốc kê đơn cai'],
    priority: 100,
  },
  'mieng-dan-nicotine': {
    triggers: ['miếng dán', 'miếng dán nicotine', 'nicotin patch', 'nrt', 'kẹo nicotine', 'thuốc nicotine'],
    priority: 100,
  },
  'vape-an-toan': {
    triggers: ['vape', 'thuốc lá điện tử', 'chuyển vape', 'vape có an toàn', 'thuốc lá vape', 'pod vape'],
    priority: 130,
  },

  /* ─── Động lực / câu chuyện ─────────────────────────── */
  'khang-tung-cam-thay': {
    triggers: ['khang đã từng', 'anh khang có cảm thấy', 'khang có', 'khang trải qua', 'khang lúc cai'],
    priority: 100,
  },
  'thanh-cong-toi': {
    triggers: ['tôi sẽ thành công', 'có thành công không', 'sẽ cai được không', 'liệu tôi có làm được'],
    priority: 100,
  },
  'dang-hi-sinh': {
    triggers: ['đáng hi sinh', 'đáng đầu tư', 'có đáng không', 'đáng bỏ', 'đáng cai'],
    priority: 100,
  },

  /* ─── Hành chính / app ──────────────────────────────── */
  'cach-dung-app': {
    triggers: ['cách dùng app', 'hướng dẫn dùng', 'cách sử dụng sol', 'làm sao dùng app', 'app này dùng sao'],
    priority: 80,
  },
  'doi-q-day': {
    triggers: ['đổi q day', 'đổi qday', 'đổi ngày bắt đầu', 'đổi quitdate', 'reset ngày', 'thay đổi ngày cai'],
    priority: 80,
  },
  'hoan-tien': {
    triggers: ['hoàn tiền', 'trả lại tiền', 'refund', 'đòi lại tiền', 'lấy lại tiền', 'huỷ gói'],
    priority: 100,
  },
  'lien-he-khang': {
    triggers: ['liên hệ khang', 'gặp khang', 'nhắn khang', 'khang ơi', 'cần khang', 'gọi khang'],
    priority: 120,
  },
  'voice-khang': {
    triggers: ['voice khang', 'tin nhắn thoại', 'khi nào có voice', 'voice của khang', 'audio khang'],
    priority: 80,
  },

  /* ─── 🚨 KHẨN CẤP Y TẾ — priority cao nhất, minScore thấp ─── */
  'khac-mau': {
    triggers: [
      'khạc máu', 'đờm có máu', 'ho ra máu', 'khạc ra máu',
      'máu trong đờm', 'đờm dính máu', 'ho ra đờm có máu', 'đờm máu',
    ],
    priority: 1000,
    minScore: 0.3, // dễ match — an toàn hơn miss
  },
  'dau-nguc-du': {
    triggers: [
      'đau ngực dữ', 'đau ngực kèm', 'tức ngực dữ dội', 'ngực đau lan',
      'đau lan tay', 'đau ngực mồ hôi', 'đau ngực buồn nôn', 'đau ngực dữ dội',
    ],
    priority: 1000,
    minScore: 0.3,
  },
  'y-nghi-tu-hai': {
    triggers: [
      'tự hại', 'tự sát', 'không muốn sống', 'kết thúc đời',
      'buông xuôi', 'không thiết sống', 'muốn chết', 'chấm dứt cuộc đời',
      'đời vô nghĩa', 'không có lý do sống',
    ],
    priority: 1000,
    minScore: 0.3,
  },
};
