// backend/src/seed.ts
// Seeds demo user + 3-5 days of content skeleton for testing.
// Run: pnpm seed

import { prisma } from './db';
import { CHIP_WIKI_URLS } from './seed/chipWikiUrls';

async function main() {
  // Demo user.
  const demo = await prisma.user.upsert({
    where: { phone: '+84900000001' },
    create: {
      phone: '+84900000001',
      name: 'Khang',
      pronouns: 'anh',
      ftndScore: 6,
      quitDate: new Date(),
      riskyHours: [17, 21],
      topTriggers: ['nhậu', 'sau cơm'],
      settings: {
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        quietStart: '22:00',
        quietEnd: '07:00',
        mode: 'normal',
        pushPrefs: { checkin: true, crisisPrep: true, milestone: true },
        // Thói quen hút thuốc — dùng để tính tiền tiết kiệm & tuổi thọ
        cigsPerDay: 20,      // 1 bao/ngày
        pricePerCig: 1000,   // Sol v4 — 20k/bao phổ thông VN
      },
      state: { create: { state: 'IDLE', stateData: {} } },
    },
    update: {},
  });

  // Sample content items. Founder will edit these via admin later.
  const items: Array<{
    dayNumber: number;
    module: 'MORNING_GOAL' | 'SCIENCE_TIP' | 'PHENOMENA_ALERT' | 'EXERCISE' | 'NIGHT_STORY';
    title: string;
    body: string;
    wikiUrl?: string;
    exerciseKey?: string;
    exerciseSchema?: any;
  }> = [
    {
      dayNumber: 1,
      module: 'MORNING_GOAL',
      title: 'Mục tiêu 24h đầu',
      body: 'Chỉ 24h. Nhai kẹo khi thèm. Chưa cần nghĩ đến ngày 2.',
    },
    {
      dayNumber: 1,
      module: 'SCIENCE_TIP',
      title: 'Nicotine chạm não trong 7 giây',
      body: 'Biết không? Nicotine từ phổi → máu → não trong chỉ 7 giây. Nhanh hơn cả heroin tiêm tĩnh mạch. Đó là lý do cai khó.',
      wikiUrl: 'https://sol.vn/wiki/nicotine-vao-nao-nhanh-the-nao',
    },
    {
      dayNumber: 1,
      module: 'EXERCISE',
      title: 'Viết 3 lý do bỏ thuốc',
      body: 'Viết 3 lý do quan trọng nhất cho việc bỏ thuốc. Lý do càng cá nhân càng mạnh. Bạn sẽ quay lại đọc trong những ngày khó.',
      exerciseKey: 'day_1_three_reasons',
      exerciseSchema: {
        type: 'free_text',
        prompts: ['Lý do 1:', 'Lý do 2:', 'Lý do 3:'],
        minChars: 10,
      },
    },
    {
      dayNumber: 2,
      module: 'PHENOMENA_ALERT',
      title: 'Cáu kỉnh + khó ngủ có thể bắt đầu',
      body: 'Đây là nicotine rút khỏi receptor. Bình thường. Đỉnh sẽ là ngày 3-5.',
      wikiUrl: 'https://sol.vn/wiki/cai-thuoc-ngay-2-trieu-chung',
    },
    {
      dayNumber: 3,
      module: 'PHENOMENA_ALERT',
      title: '🌋 ĐỈNH cơn thèm hôm nay và ngày mai',
      body: "Nếu thấy 'chịu không nổi' — đó là đỉnh, không phải thất bại. 48h nữa dịu 70%.",
      wikiUrl: 'https://sol.vn/wiki/dinh-con-them-ngay-3-5',
    },
    {
      dayNumber: 7,
      module: 'EXERCISE',
      title: 'Letter to Future Self',
      body: 'Viết thư cho bạn-của-3-tháng-sau — người đã bỏ thuốc thành công. Họ muốn nói gì với bạn-hôm-nay?',
      exerciseKey: 'day_7_letter_future_self',
      exerciseSchema: {
        type: 'free_text',
        prompts: ['Viết thư (3-10 dòng):'],
        minChars: 100,
      },
    },
    {
      dayNumber: 14,
      module: 'SCIENCE_TIP',
      title: 'Receptors nicotine đã giảm 40%',
      body: 'Mốc 2 tuần: số receptor nicotine (nAChR) trong não đã giảm khoảng 40%. Lần đầu có ngày không nghĩ đến thuốc — bình thường.',
      wikiUrl: 'https://sol.vn/wiki/moc-2-tuan-khoa-hoc',
    },
  ];

  for (const it of items) {
    await prisma.contentItem.upsert({
      where: {
        dayNumber_module_exerciseKey_voice: {
          dayNumber: it.dayNumber,
          module: it.module as any,
          exerciseKey: it.exerciseKey ?? '',
          voice: 'SOL_DONG_HANH' as any,
        },
      },
      create: {
        dayNumber: it.dayNumber,
        module: it.module as any,
        title: it.title,
        body: it.body,
        wikiUrl: it.wikiUrl,
        exerciseKey: it.exerciseKey,
        exerciseSchema: it.exerciseSchema,
        published: true,
      },
      update: {
        title: it.title,
        body: it.body,
        wikiUrl: it.wikiUrl,
        exerciseSchema: it.exerciseSchema,
      },
    });
  }

  // Canned quick-reply chips — biên tập sẵn cho widget chat (render ngay,
  // không qua AI). Founder/admin sẽ chỉnh sửa qua trang /admin/canned-replies.
  const cannedReplies: Array<{
    slug: string;
    label: string;
    icon: string;
    answer: string;
    wikiUrl?: string;
    wikiLabel?: string;
    reusable?: boolean;
    sortOrder: number;
  }> = [
    {
      slug: 'them-thuoc',
      label: 'Tôi đang thèm thuốc',
      icon: '🤔',
      reusable: true,
      sortOrder: 10,
      answer:
        'Cơn thèm chỉ kéo dài 3–5 phút rồi tự dịu. Bạn thử ngay 1 trong 3 cách: hít thở 4-7-8 ba lần · uống ngụm nước lạnh · đi 200 bước. Sau 5 phút quay lại đây — phần lớn cơn đã qua. Bạn không phải đấu một mình.',
      wikiUrl: 'https://sol.vn/wiki/lang-tranh-con-them',
      wikiLabel: 'Xem giải thích chi tiết',
    },
    {
      slug: 'bo-cuoc',
      label: 'Tôi muốn bỏ cuộc',
      icon: '😢',
      sortOrder: 20,
      answer:
        'Mệt là dấu hiệu cơ thể đang sửa, không phải dấu hiệu thất bại. Bạn không cần "cai cả đời" — chỉ cần không hút trong 1 giờ tới. Một giờ thôi. Nếu vẫn khó, mở mục SOS 90 giây ở góc dưới — Sol sẽ ở cạnh bạn từng nhịp thở.',
    },
    {
      slug: 'mot-dieu',
      label: 'Hút lén 1 điếu có sao?',
      icon: '🚬',
      sortOrder: 30,
      answer:
        'Có. Chỉ 1 điếu là nicotin về nồng độ cao trong 10 phút, thiết lập lại "đồng hồ thèm" 72 giờ. Nghiên cứu thấy 95% người "chỉ hút 1 điếu" sẽ hút trở lại trong 1 tuần. Đã đi được tới đây thì giữ nguyên — đừng cho não cơ hội học lại.',
      wikiUrl: 'https://sol.vn/wiki/hieu-ung-1-dieu',
      wikiLabel: 'Xem nghiên cứu về hiệu ứng 1 điếu',
    },
    {
      slug: 'bao-lau-het-them',
      label: 'Bao lâu thì hết thèm?',
      icon: '⏳',
      sortOrder: 40,
      answer:
        'Cơn thèm cấp tính (thể chất): 3–7 ngày, đỉnh ở ngày 2-3. Cơn thèm tâm lý (theo thói quen, mùi): 4–12 tuần. Sau 3 tháng, hầu như không còn nhớ. Bạn đang ở giai đoạn khó nhất — vượt qua là phần thưởng cả đời.',
      wikiUrl: 'https://sol.vn/wiki/timeline-cai-thuoc',
      wikiLabel: 'Xem timeline đầy đủ',
    },
    {
      slug: 'mat-ngu',
      label: 'Mất ngủ phải làm sao?',
      icon: '🌙',
      sortOrder: 50,
      answer:
        'Bình thường — não đang dựng lại receptor dopamine, giấc ngủ sẽ nông trong 1–2 tuần đầu. Tránh cà phê sau 14h, tắt điện thoại 30 phút trước ngủ, ngâm chân nước ấm 10 phút. Nếu sau 2 tuần vẫn mất ngủ nặng, nói với bác sĩ — không tự uống thuốc ngủ.',
    },
    {
      slug: 'cau-gat',
      label: 'Tôi hay cáu gắt — bình thường?',
      icon: '😤',
      sortOrder: 60,
      answer:
        'Rất bình thường. Não thiếu dopamine từ nicotin nên dễ nổi nóng. Đỉnh điểm là ngày 3–5, sau 2 tuần dịu nhiều, hết hẳn sau ~1 tháng. Báo trước với người thân để họ thông cảm. Đi bộ 15 phút khi tức giận thay vì cãi nhau.',
    },
    {
      slug: 'tang-can',
      label: 'Tôi sợ tăng cân',
      icon: '⚖️',
      sortOrder: 70,
      answer:
        'Trung bình tăng 2–4 kg trong 3 tháng đầu — vẫn an toàn hơn hút thuốc rất nhiều. Cách giữ cân: uống đủ 2 lít nước/ngày, nhai kẹo cao su không đường khi thèm, đi bộ 30 phút mỗi tối. Ưu tiên bỏ thuốc trước — giảm cân tính sau.',
    },
    {
      slug: 'vape-an-toan',
      label: 'Chuyển vape có an toàn?',
      icon: '💨',
      sortOrder: 80,
      answer:
        'Không. Vape vẫn chứa nicotin + hoá chất khác (formaldehyde, kim loại nặng). Nghiên cứu thấy >60% người dùng vape để "cai" sẽ quay lại thuốc lá truyền thống trong 6 tháng. Bỏ nguyên (cold turkey) hoặc dùng miếng dán nicotin theo bác sĩ — đó là 2 cách đã chứng minh hiệu quả.',
      wikiUrl: 'https://sol.vn/wiki/vape-co-an-toan-khong',
      wikiLabel: 'Xem nghiên cứu so sánh vape vs thuốc lá',
    },

    /* ─── Cơn thèm cấp + slip (reusable, ưu tiên cao) ───────── */
    {
      slug: 'them-du-doi',
      label: 'Cơn thèm dữ dội quá',
      icon: '🌊',
      reusable: true,
      sortOrder: 11,
      answer:
        'Sóng thèm mạnh nhất chỉ kéo 90 giây. Đứng dậy, đi ra cửa sổ, hít vào 4 giây — giữ 7 giây — thở ra 8 giây. Lặp 3 lần. Trong lúc thở, đếm to "tôi đã không hút bao nhiêu giờ". Đây là cuộc đấu của 90 giây — không phải cả đời.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'sap-hut-lai',
      label: 'Tôi sắp hút lại — cứu',
      icon: '🆘',
      reusable: true,
      sortOrder: 12,
      answer:
        'Bạn còn 30 giây — đủ để cứu 30 ngày qua. Đặt điện thoại xuống. Đi ra ngoài. Gọi 1 người trong danh sách hỗ trợ. Nếu không gọi được ai, viết ra đây 3 lý do bạn đã chọn cai. Sau 5 phút sóng sẽ hạ — bạn KHÔNG yếu, bạn đang chiến đấu.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'lo-hut-roi',
      label: 'Tôi lỡ hút điếu rồi',
      icon: '🌱',
      reusable: true,
      sortOrder: 13,
      answer:
        '1 điếu không xoá những ngày sạch trước đó. Đây là vấp — không phải thất bại. Đứng dậy ngay từ lúc này, không phải "ngày mai bắt đầu lại". Quan trọng: viết ra điều gì đã trigger để học cho lần sau. Khang đã vấp 6 lần trước khi cai được lần thứ 7.',
      wikiUrl: '',
      wikiLabel: '',
    },

    /* ─── Triệu chứng cơ thể ───────────────────────────────── */
    {
      slug: 'ho-co-dom',
      label: 'Tôi ho có đờm nhiều',
      icon: '🫁',
      sortOrder: 110,
      answer:
        'Tin tốt — đó là cilia (lông phổi) đang hồi phục và đẩy nhựa tích lâu năm ra. Đờm vàng/nâu là bình thường trong 2-4 tuần đầu. Uống nhiều nước ấm (2-3 lít/ngày), tránh chỗ khói bụi. Nếu ho ra MÁU hoặc đau ngực — đi khám ngay.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'dau-dau',
      label: 'Đau đầu sau khi cai',
      icon: '🤕',
      sortOrder: 120,
      answer:
        'Mạch máu não đang giãn lại sau nhiều năm bị nicotine co. Đau đầu tập trung 3-7 ngày đầu, dịu dần. Cách giảm: uống đủ nước, ngủ thêm 1 giờ, tránh cà phê đậm. Có thể uống paracetamol bình thường. Sau 1 tuần vẫn đau → đi khám.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'chong-mat',
      label: 'Chóng mặt khi đứng dậy',
      icon: '💫',
      sortOrder: 130,
      answer:
        'Bình thường — não đang điều chỉnh oxy cao hơn (do CO trong máu giảm). Đỉnh ở ngày 2-5. Cách giảm: đứng lên chậm, uống nước nhiều, ăn nhẹ thường xuyên. Nếu chóng mặt kèm nôn hoặc kéo dài >30 phút → đi khám ngay.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'kho-tho',
      label: 'Tôi thấy hơi khó thở',
      icon: '😮‍💨',
      sortOrder: 140,
      answer:
        'Một số người thấy "khó thở" trong tuần đầu vì phổi đang dọn dẹp + nhịp thở chưa quen "thở sâu" sau nhiều năm thở nông do thuốc. Tập thở 4-7-8 và đi bộ chậm 15 phút/ngày. Nếu KHÓ THỞ DỮ DỘI hoặc đau ngực → gọi 115 ngay.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'tao-bon',
      label: 'Tôi bị táo bón',
      icon: '🌾',
      sortOrder: 150,
      answer:
        'Hệ tiêu hoá đang chậm lại vì không còn nicotine kích thích nhu động ruột. Bình thường, tự ổn sau 2-3 tuần. Cách giải: 2 lít nước/ngày, ăn rau xanh + chuối + đu đủ, đi bộ 30 phút sau bữa cơm. Tránh thuốc xổ — để cơ thể tự điều chỉnh.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'mieng-lo-loet',
      label: 'Miệng lở loét, khô đắng',
      icon: '👄',
      sortOrder: 160,
      answer:
        'Vi khuẩn miệng đang điều chỉnh sau khi không có khói. Lở loét + đắng miệng kéo 1-2 tuần. Cách giảm: súc miệng nước muối ấm 3 lần/ngày, đánh răng nhẹ với bàn chải mềm, uống nhiều nước. Tránh đồ chua/cay tuần đầu.',
      wikiUrl: '',
      wikiLabel: '',
    },

    /* ─── Tâm lý / cảm xúc ─────────────────────────────────── */
    {
      slug: 'buon-chan',
      label: 'Tôi thấy buồn vô cớ',
      icon: '🌧️',
      sortOrder: 210,
      answer:
        'Đây là "Đống Tro Tàn" — dopamine tự nhiên chưa hồi phục đủ sau khi mất nguồn nicotine. Cảm giác trống rỗng, mất hứng thú là khoa học, không phải bạn yếu lòng. Tự sửa sau 2-4 tuần. Tập thể dục nhẹ + gặp người thân + ngủ đủ 7 tiếng. Nếu kéo dài >1 tháng → bác sĩ tâm lý.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'co-don',
      label: 'Tôi cảm thấy cô đơn',
      icon: '🌫️',
      sortOrder: 220,
      answer:
        'Cai thuốc đôi khi mất cả "bạn nhậu" cũ — họ vẫn hút, mình thấy lạc lõng. Đây là tín hiệu bạn đang đổi sang con người mới, không phải dấu hiệu sai. Hãy gọi 1 người trong gia đình hoặc 1 người bạn không hút — nói rằng bạn đang cai. Trao đổi vài câu, đủ để qua sóng.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'lo-au',
      label: 'Lo âu vô cớ, ngực tức',
      icon: '😰',
      sortOrder: 230,
      answer:
        'Cảm giác "ngực tức + lo" rất phổ biến tuần 1-2. Là hệ thần kinh giao cảm đang tự điều chỉnh — tim/phổi đang hồi phục. KHÔNG phải bệnh tim. Cách giảm: hít thở 4-7-8 trước khi ngủ, đi bộ ngoài trời 20 phút mỗi sáng, hạn chế cà phê. Nếu kèm đau ngực dữ → khám tim.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'stress-cong-viec',
      label: 'Stress công việc — muốn hút',
      icon: '💼',
      sortOrder: 240,
      answer:
        'Lúc còn hút, bạn nghĩ "thuốc giải stress" — thực ra nó CHỈ giải cơn thèm nicotine do chính nó tạo. Sau cai 2-3 tuần, mức stress trung bình GIẢM xuống. Bây giờ thay điếu thuốc bằng: 1 ly trà ấm, 5 phút đi ra ngoài, 1 cuộc gọi ngắn cho người thân. 5 phút thôi.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'khong-la-minh',
      label: 'Tôi không thấy là chính mình',
      icon: '🪞',
      sortOrder: 250,
      answer:
        'Đúng — bạn không phải người cũ nữa. Não bạn đang xây lại mạch thần kinh thói quen mới. 30 năm hút tạo ra một "phiên bản" của bạn, bây giờ phiên bản đó đang chuyển đổi. Khó chịu là tự nhiên. Sau 6-12 tuần bạn sẽ thấy "phiên bản mới" — nhẹ hơn, sáng hơn, tự do hơn.',
      wikiUrl: '',
      wikiLabel: '',
    },

    /* ─── Tình huống xã hội Việt ───────────────────────────── */
    {
      slug: 'di-nhau',
      label: 'Chiều nay đi nhậu — sao đây?',
      icon: '🍻',
      sortOrder: 310,
      answer:
        'Trong 60 ngày đầu: tránh nhậu nếu được. Nếu phải đi: ngồi xa người hút, uống nước/bia thay rượu, ăn no trước, có "lý do về sớm" chuẩn bị sẵn (vợ gọi, con sốt, sáng sớm họp). Đừng giấu chuyện cai — nói thẳng "tôi bỏ thuốc rồi". Bạn thật sẽ tôn trọng.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'ca-phe-sang',
      label: 'Cà phê sáng không có thuốc',
      icon: '☕',
      sortOrder: 320,
      answer:
        'Đây là điếu thuốc nguy hiểm nhất với người Việt 45+. Não đã link "cà phê = nicotine" trong nhiều thập kỷ. Cách phá: tuần 1-2 đổi sang trà ấm, ngồi chỗ KHÁC (không ngồi bàn cũ), không xem điện thoại — đọc báo giấy. Sau 2-3 tuần não cắt link, có thể quay về cà phê.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'ban-moi-thuoc',
      label: 'Bạn mời thuốc lúc nhậu',
      icon: '🚭',
      sortOrder: 330,
      answer:
        '"Cảm ơn, tôi không hút." — không xin lỗi, không "đang cố nhịn", không giải thích dài. Càng đơn giản càng vững. Người tôn trọng sẽ dừng. Người ép thêm 2 lần — đứng dậy đi vệ sinh, quay lại đổi chủ đề. Nếu họ ép lần 3 — đó không phải bạn thật.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'vo-chong-gian',
      label: 'Vợ/chồng giận chuyện cai',
      icon: '💔',
      sortOrder: 340,
      answer:
        'Bạn đang cáu kỉnh vì cai — họ chịu phần lớn. Bình thường tuần 1-3. Nói thẳng: "Anh đang khó tính vì cai, em chịu giúp anh 2 tuần — anh hứa sẽ tốt hơn." Cụ thể: không hét, đi ra ngoài hít thở khi muốn nổi nóng. Sau cai, gia đình nói: lần đầu thấy bạn "thật sự ở đây".',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'dam-tang-cuoi',
      label: 'Sắp đi đám (cưới/tang)',
      icon: '🌸',
      sortOrder: 350,
      answer:
        'Đám cưới/tang ở VN có khói thuốc khắp nơi. Plan trước: ngồi bàn ngoài hoặc gần cửa, ăn nhanh, đi sớm 30 phút. Không cần giải thích — "có việc gấp" là đủ. Cảm xúc mạnh ở đám tang dễ trigger — kèm 1 chai nước, 1 viên kẹo cao su trong túi. Vượt qua ngày này, mình ổn.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'tet-le',
      label: 'Tết / lễ — ai cũng hút',
      icon: '🎊',
      sortOrder: 360,
      answer:
        'Tết là thử thách lớn nhất với người cai năm đầu. Chiến lược: thông báo cả họ trước Tết "tôi đã bỏ thuốc — đừng mời". Mang quà cho người thân (không phải thuốc). Đi thăm sáng sớm khi ít người. Nếu áp lực quá — về sớm. Sau Tết, bạn có 1 thắng lợi lớn.',
      wikiUrl: '',
      wikiLabel: '',
    },

    /* ─── Khoa học / kiến thức ─────────────────────────────── */
    {
      slug: 'phoi-hoi-phuc',
      label: 'Phổi tôi có hồi phục không?',
      icon: '🫁',
      sortOrder: 410,
      answer:
        'Có — phần lớn. Cilia (lông phổi) tái sinh trong 1-9 tháng, dung tích phổi tăng 10-30% sau 3 tháng. Nguy cơ ung thư phổi giảm 50% sau 10 năm cai. Phần đã tổn thương vĩnh viễn (vd phế nang giãn) không hồi nhưng tiến triển CHẬM lại. Cai càng sớm, cứu càng nhiều.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'tim-mach',
      label: 'Tim mạch — bao lâu hồi phục?',
      icon: '❤️',
      sortOrder: 420,
      answer:
        'Nhanh hơn bạn nghĩ. 24h: nguy cơ nhồi máu cơ tim bắt đầu giảm. 1 năm: rủi ro CHD giảm 50%. 5 năm: nguy cơ đột quỵ ≈ người chưa hút. 15 năm: rủi ro CHD ≈ người chưa hút. Cai thuốc là can thiệp tim mạch hiệu quả nhất — vượt cả statin và aspirin.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'champix',
      label: 'Champix có nên dùng?',
      icon: '💊',
      sortOrder: 430,
      answer:
        'Champix (Varenicline) là 1 trong 3 thuốc FDA approve cho cai. Hiệu quả gấp 2 so với cai chỉ bằng ý chí (USPHS Guidelines). Nhưng có tác dụng phụ — phải kê đơn + theo dõi bác sĩ. Nếu FTND ≥ 6 (nghiện nặng) hoặc đã thất bại 2-3 lần — hỏi bác sĩ về Champix hoặc Bupropion.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'mieng-dan-nicotine',
      label: 'Miếng dán nicotine có hiệu quả?',
      icon: '🩹',
      sortOrder: 440,
      answer:
        'Có. NRT (Nicotine Replacement Therapy) gồm miếng dán/kẹo/xịt tăng tỷ lệ cai thành công 50-70% (Cochrane Review). Nguyên tắc: dán liều cao 4-6 tuần đầu, giảm dần. Mua ở pharmacy không cần đơn nhưng nên hỏi bác sĩ chọn liều. KHÔNG dùng miếng dán + hút thuốc cùng lúc.',
      wikiUrl: '',
      wikiLabel: '',
    },

    /* ─── Động lực / câu chuyện ────────────────────────────── */
    {
      slug: 'khang-tung-cam-thay',
      label: 'Khang đã từng thế này chưa?',
      icon: '👴',
      sortOrder: 510,
      answer:
        '"Có. Tôi đã thèm dữ dội, đã cáu kỉnh đến mức vợ giận, đã muốn bỏ cuộc 6 lần đầu. Lần thứ 7 thành công không phải vì tôi mạnh hơn — mà vì tôi đã học. Hôm nay bạn đang ở trong một ngày của tôi 5 năm trước. Bạn không một mình — Khang."',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'thanh-cong-toi',
      label: 'Tôi sẽ thành công chứ?',
      icon: '🌟',
      sortOrder: 520,
      answer:
        'Khoa học: trung bình người Việt cần 6-11 lần thử mới cai được hẳn. Lần này hay lần thứ 5 — không quan trọng. Quan trọng là bạn đang ở đây HÔM NAY, đọc tin nhắn này, không hút thuốc. Mỗi ngày cai là 1 lá phiếu cho phiên bản mới của mình. Cứ tiếp tục.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'dang-hi-sinh',
      label: 'Tôi đáng hi sinh nhiều thế không?',
      icon: '🎯',
      sortOrder: 530,
      answer:
        'Bạn không hi sinh — bạn đổi. Đổi 30 ngày khó để có 10-20 năm sống thêm. Đổi 1 thói quen cũ để có ông bà khoẻ cho cháu nội. Đổi 16 triệu/năm tiền thuốc để đầu tư cho con. Đây không phải mất mát — là phép tính tốt nhất đời bạn.',
      wikiUrl: '',
      wikiLabel: '',
    },

    /* ─── Hành chính / app ─────────────────────────────────── */
    {
      slug: 'cach-dung-app',
      label: 'Cách dùng SOL hiệu quả',
      icon: '📱',
      sortOrder: 610,
      answer:
        '4 việc mỗi ngày: (1) Check-in 1 phút sáng — báo mood + cơn thèm. (2) Đọc bài tập ngày — workbook trong dashboard. (3) Khi thèm — bấm "Tôi đang thèm" hoặc chat. (4) Tối — ghi 1 câu vào sổ tay. 5 phút mỗi ngày là đủ. Không cần hoàn hảo — cần đều.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'doi-q-day',
      label: 'Tôi muốn đổi Q-Day',
      icon: '📅',
      sortOrder: 620,
      answer:
        'Vào Cài đặt → Hồ sơ cai thuốc → đổi ngày bắt đầu. Lưu ý: đổi Q-Day reset đồng hồ + tier về Free (nếu có). Chỉ đổi nếu bạn muốn KHỞI ĐỘNG LẠI hoàn toàn. Nếu chỉ "mệt 1 ngày" — đừng đổi, hãy nhắn Khang trước.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'hoan-tien',
      label: 'Hoàn tiền thế nào?',
      icon: '💰',
      sortOrder: 630,
      answer:
        'Sol v3 — Gói Làm Chủ 199k được hoàn tiền theo tỷ lệ ngày còn lại từ Ngày 14 trở đi (pro-rated). Gói Kiểm Soát 99k được hoàn 100% nếu sau 14 ngày anh đi đủ lộ trình mà không giảm được tần suất hút. Vào Cài đặt → Hoàn tiền → ghi lý do (không bắt buộc) → gửi yêu cầu. Khang đọc trong 24h và chuyển tiền về MoMo/TK.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'lien-he-khang',
      label: 'Liên hệ Khang trực tiếp',
      icon: '✉️',
      sortOrder: 640,
      answer:
        'Khang đọc tin nhắn của user trả phí mỗi ngày. Nhắn câu chuyện của anh ở đây — Khang sẽ reply trong 24h. Nếu khẩn cấp y tế (đau ngực, khạc máu, ý nghĩ tự hại) — gọi 115 hoặc đến khoa Tâm thần BV gần nhất trước.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'voice-khang',
      label: 'Khi nào có voice Khang?',
      icon: '🎙️',
      sortOrder: 650,
      answer:
        'Voice Khang gửi vào những ngày khó nhất: Ngày 1 (chào mừng), Ngày 3 (đỉnh withdrawal), Ngày 7 (kết Nhận Diện). Gói Làm Chủ có thêm Ngày 14, 22 (Q-Day), 30, 51 + thư cuối Day 52. Vào mục "Voice Khang" trong dashboard để nghe lại bất cứ lúc nào.',
      wikiUrl: '',
      wikiLabel: '',
    },

    /* ─── Khẩn cấp y tế (HIGH PRIORITY) ────────────────────── */
    {
      slug: 'khac-mau',
      label: 'Tôi khạc đờm có máu',
      icon: '🚨',
      reusable: true,
      sortOrder: 710,
      answer:
        '⚠️ ĐI KHÁM NGAY HÔM NAY. Khạc máu (dù ít) cần CT phổi để loại trừ ung thư hoặc nhiễm trùng nặng. Đừng đợi. Trong khi đợi khám: không hút lại (sẽ làm tệ hơn), uống nhiều nước, không tập thể dục mạnh. Báo bác sĩ bạn đã hút bao lâu, cai từ khi nào.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'dau-nguc-du',
      label: 'Đau ngực dữ dội + khó thở',
      icon: '🚑',
      reusable: true,
      sortOrder: 720,
      answer:
        '🚨 GỌI 115 NGAY. Đau ngực dữ dội + khó thở + đổ mồ hôi = dấu hiệu nhồi máu cơ tim. Không lái xe đi cấp cứu — gọi xe. Trong khi chờ: ngồi nghỉ, nhai 1 viên aspirin (nếu không dị ứng). Cai thuốc lá KHÔNG gây MI — nhưng MI tiềm ẩn lâu năm có thể bộc phát. Đừng chần chừ.',
      wikiUrl: '',
      wikiLabel: '',
    },
    {
      slug: 'y-nghi-tu-hai',
      label: 'Tôi có ý nghĩ tự hại',
      icon: '💚',
      reusable: true,
      sortOrder: 730,
      answer:
        'Khang ở đây với bạn ngay bây giờ. Cai thuốc đôi khi làm tệ hơn trầm cảm tiềm ẩn — không phải lỗi của bạn. GỌI 1 người thân ngay bây giờ — không cần giải thích, chỉ cần "tôi đang khó". Nếu không an toàn ở nhà — đến cấp cứu (115) hoặc khoa Tâm thần BV gần nhất. Bạn không một mình. Bạn quan trọng.',
      wikiUrl: '',
      wikiLabel: '',
    },
  ];

  for (const cr of cannedReplies) {
    // Mapping wikiUrl tập trung trong chipWikiUrls.ts — ưu tiên hơn giá trị
    // inline trong cannedReplies (nhiều URL inline đã outdated do permalink
    // /wiki/<slug> đã được đổi sang /<slug> trên sol.vn).
    const wikiMapping = CHIP_WIKI_URLS[cr.slug];
    const finalWikiUrl = wikiMapping?.wikiUrl ?? cr.wikiUrl ?? null;
    const finalWikiLabel = wikiMapping?.wikiLabel ?? cr.wikiLabel ?? null;

    await prisma.cannedReply.upsert({
      where: { slug: cr.slug },
      create: {
        slug: cr.slug,
        label: cr.label,
        icon: cr.icon,
        answer: cr.answer,
        wikiUrl: finalWikiUrl,
        wikiLabel: finalWikiLabel,
        reusable: cr.reusable ?? false,
        sortOrder: cr.sortOrder,
      },
      // Khi seed lại — ưu tiên giữ chỉnh sửa của founder qua /admin.
      // Chỉ update khi bản DB chưa từng có (tức create), nên ở đây bỏ trống.
      // Để update wikiUrl trên DB cũ → dùng `npm run wire:wiki`.
      update: {},
    });
  }

  console.log(`Seed done. Demo user id: ${demo.id}, phone: ${demo.phone}`);
  console.log(`Seeded ${cannedReplies.length} canned replies.`);
  console.log('Use OTP flow to login (dev mode logs OTP to console).');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
