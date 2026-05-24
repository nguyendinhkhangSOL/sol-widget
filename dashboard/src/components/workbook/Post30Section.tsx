// Sau 30 Ngày — những điều cần biết + planning cá nhân hóa.
// Phần cuối cuốn sổ — đánh dấu kỳ tích + dẫn lối về sau.

import { useWorkbook } from '../../state/workbookStore';
import { SectionCard, Callout, FieldLabel, TextArea } from './shared';

const BODY_CHANGES = [
  { icon: '🫁', title: 'Phổi — +30% cơ năng', text: 'Lớp nhung mao phổi đã mọc lại. Phổi tự làm sạch hiệu quả. Bạn thở sâu hơn mà không hay biết.' },
  { icon: '❤️', title: 'Tim — Nguy cơ đau tim giảm 50%', text: 'So với ngày bắt đầu bỏ thuốc, nguy cơ nhồi máu cơ tim đã giảm một nửa. Huyết áp ổn định hơn.' },
  { icon: '🧠', title: 'Não — Dopamine đang ổn định', text: 'Hệ thống thưởng của não đang tái cân bằng. Cảm giác vui tự nhiên không cần nicotin đang phục hồi.' },
  { icon: '💰', title: 'Ví — Đủ tiền cho 1 chuyến du lịch', text: '30 ngày tiết kiệm = ít nhất 750.000đ–2 triệu đồng, tuỳ mức hút. Tiền thật, không phải con số.' },
];

const TIMELINE = [
  { emoji: '😤', color: '#C62828', title: 'Tháng 2–3: "Nicotin Anhedonia" — Mất cảm giác vui',
    desc: 'Não thiếu nicotin có thể làm mọi thứ cảm thấy nhạt. Đây là giai đoạn nguy hiểm vì bạn sẽ tự hỏi "tại sao mình phải bỏ?". Đó là sinh học — không phải ý chí yếu.',
    wiki: 'https://sol.vn/wiki/nicotine-anhedonia', wikiLabel: 'Nicotine Anhedonia' },
  { emoji: '⚡', color: '#E65100', title: 'Tháng 4–6: Tái kích hoạt bởi sự kiện',
    desc: 'Đám cưới, tiệc, stress công việc, chia tay — những sự kiện cảm xúc mạnh sẽ kích hoạt lại ký ức hút thuốc. Cơn thèm có thể quay lại bất ngờ dù bạn đã ổn nhiều tháng.',
    wiki: 'https://sol.vn/wiki/trigger-cam-xuc', wikiLabel: 'Tình huống cảm xúc gây thèm' },
  { emoji: '🌱', color: '#7CB342', title: 'Năm đầu tiên: Xây dựng bản sắc người không hút thuốc',
    desc: 'Sau 6–12 tháng, não sẽ dần ngừng tự nhận là "người hút thuốc đang bỏ" và bắt đầu thực sự là "người không hút thuốc". Đây là mục tiêu thật sự.',
    wiki: 'https://sol.vn/wiki/ban-sac-moi', wikiLabel: 'Xây dựng bản sắc mới' },
  { emoji: '🏆', color: '#2E7D32', title: 'Năm 5+: Nguy hiểm ngầm — "Chỉ 1 điếu thôi"',
    desc: 'Ngay cả sau 5 năm, 1 điếu thuốc có thể kéo 50% người tái phát hoàn toàn trong vòng 1 tuần. Não vẫn nhớ. Không bao giờ có "chỉ 1 điếu" an toàn.',
    wiki: 'https://sol.vn/wiki/tai-phat-mot-dieu', wikiLabel: 'Tại sao "1 điếu" không an toàn' },
];

export function Post30Section() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);

  return (
    <SectionCard
      id="wbx-section-post30"
      accent="green"
      icon="🏆"
      title="Sau 30 Ngày — Những Điều Cần Biết"
      subtitle="Bạn đã qua chiến trường. Nhưng hành trình vẫn tiếp tục."
    >
      <Callout accent="green" icon="🎉">
        Ít hơn <strong>10% người hút thuốc</strong> đạt được cột mốc này trong lần đầu thử. Đây là kỳ tích
        thật sự — không phải may mắn, mà là kết quả của 30 ngày kiên trì chiến đấu.
      </Callout>

      {/* Body changes */}
      <h3 className="text-[15px] font-bold text-sol-green mt-2 mb-3">
        🫁 Cơ Thể Bạn Đang Thay Đổi Như Thế Nào?
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {BODY_CHANGES.map((b) => (
          <div key={b.title} className="rounded-xl p-4 bg-sol-green/5 border border-sol-green/20">
            <div className="text-xl mb-1">{b.icon}</div>
            <div className="font-bold text-sm text-sol-green">{b.title}</div>
            <p className="text-xs text-sol-ink/70 mt-1 leading-relaxed">{b.text}</p>
          </div>
        ))}
      </div>

      {/* Challenges timeline */}
      <h3 className="text-[15px] font-bold mb-3" style={{ color: '#B71C1C' }}>
        ⚠️ Những Thách Thức Phía Trước
      </h3>
      <Callout accent="red" icon="🎯">
        Đây là phần quan trọng nhất. Hầu hết người tái phát <strong>sau ngày 30</strong> — khi họ nghĩ
        "mình đã xong". Biết trước để không bị bất ngờ.
      </Callout>
      <div className="space-y-3 mb-5">
        {TIMELINE.map((t) => (
          <div
            key={t.title}
            className="rounded-xl border border-black/5 bg-white p-4 flex gap-3"
          >
            <div
              className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-white text-base"
              style={{ background: t.color }}
            >
              {t.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm leading-tight">{t.title}</h4>
              <p className="text-xs text-sol-ink/70 mt-1 leading-relaxed">{t.desc}</p>
              <a
                href={t.wiki}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold inline-block mt-1.5 underline"
                style={{ color: t.color }}
              >
                📚 Wiki: {t.wikiLabel}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Personal plan */}
      <div className="rounded-2xl p-5 bg-sol-green/5 border border-sol-green/30">
        <h4 className="text-sm font-bold text-sol-green mb-3">✍️ Kế Hoạch Của Tôi Sau 30 Ngày</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Mục tiêu tiếp theo (ngày 60, 90, năm 1)</FieldLabel>
            <TextArea
              value={data.postGoal}
              onChange={(e) => set('postGoal', e.target.value)}
              placeholder="Tôi sẽ kỷ niệm ngày 60 bằng cách…"
              style={{ minHeight: 80 }}
            />
          </div>
          <div>
            <FieldLabel>Người tôi sẽ kể câu chuyện của mình</FieldLabel>
            <TextArea
              value={data.postShare}
              onChange={(e) => set('postShare', e.target.value)}
              placeholder="Tên người đó và lý do bạn muốn chia sẻ…"
              style={{ minHeight: 80 }}
            />
          </div>
        </div>
        <div className="mt-3">
          <FieldLabel>Điều tôi muốn nói với chính mình 1 năm nữa:</FieldLabel>
          <TextArea
            value={data.postLetter}
            onChange={(e) => set('postLetter', e.target.value)}
            placeholder='Ví dụ: "Mình đã làm được điều mà mình tưởng không thể…"'
            style={{ minHeight: 100 }}
          />
        </div>
      </div>

      {/* CTA strip */}
      <div
        className="mt-4 rounded-2xl p-5 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
      >
        <div className="text-2xl mb-1">🌿</div>
        <div className="font-bold text-base">Tiếp tục hành trình của bạn</div>
        <div className="text-xs opacity-80 mt-0.5 mb-3">
          Sol đồng hành với bạn — không chỉ 30 ngày
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {[
            { href: 'https://sol.vn/wiki', label: '📚 Sol Wiki' },
            { href: 'https://bothuocla.sol.vn/community', label: '👥 Cộng đồng' },
            { href: 'https://bothuocla.sol.vn/ai-mentor', label: '🤖 AI Mentor' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/30 bg-white/15 hover:bg-white/25 transition"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
