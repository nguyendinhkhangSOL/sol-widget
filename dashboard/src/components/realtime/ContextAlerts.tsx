// Dynamic alerts that appear based on the user's current hour mark.
// Each alert has a window [from, to] in hours to show; the one with the highest priority wins.

interface Alert {
  icon: string;
  title: string;
  body: string;
  from: number;
  to: number;
  priority: number;
}

const ALERTS: Alert[] = [
  {
    icon: '🫁',
    title: 'Giờ đầu tiên — CO đang thoát ra',
    body: 'Trong 20 phút, nhịp tim và huyết áp của bạn sẽ trở về bình thường. Uống nhiều nước để giúp cơ thể đào thải nhanh.',
    from: 0, to: 8, priority: 1,
  },
  {
    icon: '⚠️',
    title: 'Bạn đang trong đỉnh 72h Tử chiến',
    body: 'Đây là giai đoạn khó nhất. Nếu lên cơn thèm — nhắc bản thân: "Chỉ 3–5 phút nữa là qua."',
    from: 8, to: 72, priority: 3,
  },
  {
    icon: '💪',
    title: 'Vượt qua 72h — trận lớn nhất đã qua',
    body: 'Từ đây cơn thèm giảm dần về tần suất. Mỗi lần vượt qua là một viên gạch của nội lực.',
    from: 72, to: 120, priority: 2,
  },
  {
    icon: '🌟',
    title: '48h Cầm cự — giữ vững',
    body: 'Cơ thể đang tái điều chỉnh. Ngủ đủ giấc, vận động nhẹ, tránh café và rượu.',
    from: 120, to: 168, priority: 2,
  },
  {
    icon: '🏆',
    title: 'Tuần đầu tiên hoàn chỉnh!',
    body: '7 ngày không hút. Dopamine tự nhiên đang bắt đầu sản xuất trở lại. Chia sẻ thành tích này lên cộng đồng Sol!',
    from: 168, to: 336, priority: 3,
  },
  {
    icon: '💭',
    title: 'Nhớ lại lý do bạn bắt đầu',
    body: 'Khoảnh khắc bạn đã chọn để thay đổi — nó vẫn còn đó. Đây là nội lực thật sự của bạn.',
    from: 168, to: 720, priority: 1,
  },
  {
    icon: '🩸',
    title: 'Tuần hoàn máu đang hoạt động tốt hơn',
    body: 'Sau 2 tuần, oxy trong máu đã tăng rõ rệt. Bạn có thể cảm thấy đi bộ ít mệt hơn.',
    from: 336, to: 504, priority: 2,
  },
  {
    icon: '🌿',
    title: 'Gần về đích 30 ngày',
    body: 'Chỉ còn vài ngày nữa. Ho mãn tính sẽ bắt đầu giảm rõ rệt sau mốc 1 tháng.',
    from: 504, to: 720, priority: 3,
  },
  {
    icon: '🎯',
    title: '30 ngày hoàn thành — mục tiêu đạt được',
    body: 'Bạn đã cán đích. Từ đây tiếp tục hay không là quyết định của riêng bạn — nhưng cơ thể đã quen với "không thuốc".',
    from: 720, to: 2160, priority: 3,
  },
  {
    icon: '☀️',
    title: '3 tháng — phổi đã tái tạo phần lớn',
    body: 'Cilia đã hoạt động trở lại. Từ đây nguy cơ nhiễm trùng đường hô hấp giảm rõ.',
    from: 2160, to: 8760, priority: 2,
  },
];

export function ContextAlerts({ hours }: { hours: number }) {
  const visible = ALERTS
    .filter((a) => hours >= a.from && hours < a.to)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);

  if (visible.length === 0) return null;

  return (
    <>
      <div className="text-[11px] uppercase tracking-wider mb-2.5 mt-4" style={{ color: 'rgba(255,255,255,.55)' }}>
        Cảnh báo hành trình
      </div>
      <div className="flex flex-col gap-2">
        {visible.map((a, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(193,126,42,.08)', border: '1px solid rgba(193,126,42,.2)' }}
          >
            <div className="text-[20px] flex-shrink-0">{a.icon}</div>
            <div className="min-w-0">
              <strong className="block text-[13px] font-medium mb-0.5" style={{ color: '#FAD99A' }}>
                {a.title}
              </strong>
              <p className="text-[12px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.78)' }}>
                {a.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
