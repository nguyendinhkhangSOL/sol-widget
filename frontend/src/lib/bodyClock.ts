// frontend/src/lib/bodyClock.ts
// "Đồng hồ cơ thể" — mốc khoa học chuẩn NHS/CDC về những gì diễn ra
// trong cơ thể sau khi bỏ thuốc, tính theo giờ đã không hút.
//
// Dùng cho hero strip trên đỉnh widget: "Bạn đã vượt qua 12 giờ khó nhất —
// CO trong máu giảm một nửa, oxy đang trở lại bình thường."

export interface BodyMilestone {
  /** Số giờ kể từ điếu cuối */
  hours: number;
  /** Icon hiển thị (emoji) */
  icon: string;
  /** Nhãn ngắn cho badge: "20 phút", "8 giờ", "24 giờ"... */
  label: string;
  /** Dòng chữ "Gương soi thành công" — ngắn, ở hiện tại, động lực */
  headline: string;
  /** Câu mô tả khoa học ngắn (1 câu) */
  science: string;
  /** Link wiki Sol để đọc thêm (nếu có) */
  wiki?: string;
  /** Màu chủ đạo cho badge (hex) */
  color: string;
}

/**
 * Chuẩn hoá theo WHO / NHS / CDC cessation timeline.
 * Thứ tự TĂNG DẦN theo giờ — findCurrentMilestone() sẽ trả về mốc cao nhất
 * mà người dùng đã vượt qua.
 */
export const BODY_TIMELINE: BodyMilestone[] = [
  {
    hours: 0,
    icon: '🌱',
    label: 'Bây giờ',
    headline: 'Bạn vừa bắt đầu hành trình',
    science: 'Từ giây phút này, cơ thể bắt đầu quá trình tự làm lành. Từng tế bào đang cảm ơn bạn.',
    color: '#8BC34A',
  },
  {
    hours: 0.33, // 20 phút
    icon: '💓',
    label: '20 phút',
    headline: 'Mạch và huyết áp đã trở về bình thường',
    science: 'Nhịp tim và huyết áp cao do nicotin đã hạ xuống mức bình thường. Bàn tay và chân ấm hơn.',
    wiki: 'https://sol.vn/wiki/20-phut-dau',
    color: '#E57373',
  },
  {
    hours: 8,
    icon: '🫁',
    label: '8 giờ',
    headline: 'CO trong máu đã giảm một nửa',
    science: 'Lượng carbon monoxide từ khói thuốc giảm 50%. Oxy trong máu đang trở lại mức bình thường.',
    wiki: 'https://sol.vn/wiki/8-gio-co-giam',
    color: '#5C6BC0',
  },
  {
    hours: 12,
    icon: '🩸',
    label: '12 giờ',
    headline: 'Máu bạn đã sạch gần như hoàn toàn',
    science: 'CO đã rời khỏi cơ thể. Máu giờ vận chuyển oxy hiệu quả như người chưa bao giờ hút.',
    wiki: 'https://sol.vn/wiki/12-gio',
    color: '#5C6BC0',
  },
  {
    hours: 24,
    icon: '❤️',
    label: '24 giờ',
    headline: 'Nguy cơ đau tim bắt đầu giảm',
    science: 'Chỉ sau 1 ngày, nguy cơ nhồi máu cơ tim đã bắt đầu giảm. Tim bạn đang được nghỉ ngơi thật sự.',
    wiki: 'https://sol.vn/wiki/24-gio-tim',
    color: '#E53935',
  },
  {
    hours: 48,
    icon: '👃',
    label: '2 ngày',
    headline: 'Vị giác và khứu giác đang phục hồi',
    science: 'Đầu dây thần kinh bị tổn thương bắt đầu mọc lại. Thức ăn sẽ ngon hơn, mùi hương rõ hơn.',
    wiki: 'https://sol.vn/wiki/2-ngay-vi-giac',
    color: '#FB8C00',
  },
  {
    hours: 72,
    icon: '💨',
    label: '3 ngày',
    headline: 'Nicotin đã rời khỏi cơ thể — phổi đang giãn ra',
    science: 'Ống phế quản giãn, hô hấp dễ hơn. Đây là đỉnh của cai nghiện thể lý — vượt qua là bạn đã đi qua phần khó nhất.',
    wiki: 'https://sol.vn/wiki/3-ngay-dinh-cai',
    color: '#00897B',
  },
  {
    hours: 24 * 7,
    icon: '🏆',
    label: '1 tuần',
    headline: '1 tuần không thuốc — đây là kỳ tích',
    science: '9 trong 10 người tái phát trong tuần đầu. Bạn đã không. Phổi đang tự làm sạch, sinh lực trở lại.',
    wiki: 'https://sol.vn/wiki/1-tuan',
    color: '#43A047',
  },
  {
    hours: 24 * 14,
    icon: '🧬',
    label: '2 tuần',
    headline: 'Receptor nicotine trong não giảm 40%',
    science: 'Não đang "tháo" thụ thể nicotin. Cơn thèm sẽ nhẹ dần. Bạn đang lấy lại quyền điều khiển.',
    wiki: 'https://sol.vn/wiki/2-tuan-receptor',
    color: '#3949AB',
  },
  {
    hours: 24 * 21,
    icon: '🔁',
    label: '3 tuần',
    headline: 'Não đang xây thói quen mới',
    science: 'Mạch thần kinh hút thuốc đang nhạt đi, mạch thần kinh mới đang hình thành. Bạn đang "viết lại" chính mình.',
    wiki: 'https://sol.vn/wiki/3-tuan-thoi-quen',
    color: '#7CB342',
  },
  {
    hours: 24 * 30,
    icon: '🌿',
    label: '30 ngày',
    headline: '30 ngày — ít hơn 10% người làm được',
    science: 'Tuần hoàn máu tăng 30%, phổi khoẻ rõ rệt. Đây không phải may mắn, là kết quả của 30 ngày bạn đã chiến đấu.',
    wiki: 'https://sol.vn/wiki/30-ngay-ky-tich',
    color: '#2E7D32',
  },
  {
    hours: 24 * 90,
    icon: '🦋',
    label: '3 tháng',
    headline: 'Phổi tự làm sạch — dung tích +10%',
    science: 'Lớp nhung mao phổi (cilia) mọc lại, đẩy chất nhầy và độc tố ra ngoài. Ho đờm sẽ giảm nhanh.',
    wiki: 'https://sol.vn/wiki/3-thang-phoi',
    color: '#26A69A',
  },
  {
    hours: 24 * 365,
    icon: '💖',
    label: '1 năm',
    headline: 'Nguy cơ bệnh tim mạch vành giảm một nửa',
    science: 'So với người còn hút, nguy cơ nhồi máu cơ tim của bạn đã giảm 50%. Bạn đã tặng mình thêm nhiều năm sống.',
    wiki: 'https://sol.vn/wiki/1-nam-tim-mach',
    color: '#C2185B',
  },
  {
    hours: 24 * 365 * 5,
    icon: '🧠',
    label: '5 năm',
    headline: 'Nguy cơ đột quỵ bằng người chưa hút',
    science: 'Nguy cơ đột quỵ của bạn đã trở về mức người chưa từng hút thuốc. Não được bảo vệ trọn vẹn.',
    wiki: 'https://sol.vn/wiki/5-nam-dot-quy',
    color: '#6A1B9A',
  },
  {
    hours: 24 * 365 * 10,
    icon: '🕊️',
    label: '10 năm',
    headline: 'Nguy cơ ung thư phổi chỉ còn một nửa',
    science: 'So với người còn hút, nguy cơ ung thư phổi của bạn đã giảm 50%. Các nguy cơ ung thư khác cũng giảm rõ rệt.',
    wiki: 'https://sol.vn/wiki/10-nam-ung-thu',
    color: '#1565C0',
  },
];

/**
 * Số giờ đã không hút kể từ `quitDate`.
 * Trả về 0 nếu chưa đặt quitDate hoặc quitDate ở tương lai.
 */
export function hoursSober(quitDate?: string | null): number {
  if (!quitDate) return 0;
  const start = new Date(quitDate).getTime();
  if (isNaN(start)) return 0;
  const diffMs = Date.now() - start;
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60);
}

export function daysSober(quitDate?: string | null): number {
  return Math.floor(hoursSober(quitDate) / 24);
}

/**
 * Mốc cao nhất người dùng đã vượt qua — để hiển thị ở hero.
 * Không bao giờ trả về null: nếu chưa bắt đầu, trả về mốc "Bây giờ".
 */
export function currentMilestone(quitDate?: string | null): BodyMilestone {
  const h = hoursSober(quitDate);
  let best = BODY_TIMELINE[0];
  for (const m of BODY_TIMELINE) {
    if (h >= m.hours) best = m;
    else break;
  }
  return best;
}

/**
 * Mốc tiếp theo sắp tới — để làm "thanh tiến độ" động lực.
 */
export function nextMilestone(quitDate?: string | null): BodyMilestone | null {
  const h = hoursSober(quitDate);
  for (const m of BODY_TIMELINE) {
    if (h < m.hours) return m;
  }
  return null; // đã đi hết timeline
}

/**
 * % tiến độ tới mốc tiếp theo (0–100).
 */
export function progressToNext(quitDate?: string | null): number {
  const h = hoursSober(quitDate);
  const cur = currentMilestone(quitDate);
  const nxt = nextMilestone(quitDate);
  if (!nxt) return 100;
  const span = nxt.hours - cur.hours;
  if (span <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(((h - cur.hours) / span) * 100)));
}

/**
 * Tiền tiết kiệm được (VND) dựa trên settings.
 */
export function moneySaved(opts: {
  quitDate?: string | null;
  cigsPerDay?: number;
  pricePerCig?: number;
}): number {
  const days = daysSober(opts.quitDate);
  const cigs = opts.cigsPerDay ?? 15;
  const price = opts.pricePerCig ?? 1000; // Sol v4 — 1.000đ/điếu = 20k/bao phổ thông VN
  return Math.max(0, days * cigs * price);
}

export function formatVnd(n: number): string {
  if (n <= 0) return '0đ';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} triệu đ`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k đ`;
  return `${n}đ`;
}

/**
 * Lời chào theo giờ — lấy pronoun + tên người dùng.
 */
export function greetingFor(name?: string, pronoun: string = 'bạn'): string {
  const h = new Date().getHours();
  const time = h < 5 ? 'khuya' : h < 11 ? 'sáng' : h < 14 ? 'trưa' : h < 18 ? 'chiều' : 'tối';
  const salute = time === 'khuya'
    ? 'Khuya rồi'
    : `Chào buổi ${time}`;
  if (!name) return `${salute}, ${pronoun}`;
  return `${salute}, ${pronoun} ${name}`;
}
