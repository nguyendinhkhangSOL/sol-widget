// Các section chuẩn bị: Lý do · Cam kết · Mạng lưới · Tiết kiệm · Cơn thèm · Tái phát · Tài nguyên.
// Gom vào 1 file để tránh bùng nổ số file — mỗi section nhỏ, đơn giản, không cần tái sử dụng.

import { useMemo } from 'react';
import { useWorkbook } from '../../state/workbookStore';
import { calcMoneySavings, fmtVndFull, CRAVING_SITUATIONS, CRAVING_RESULTS } from '../../lib/workbook';
import { SectionCard, Callout, FieldLabel, TextInput, TextArea } from './shared';

// ─── 1 · Lý Do ─────────────────────────────────────────────────────────

export function WhySection() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);
  return (
    <SectionCard id="wbx-section-why" accent="orange" num="1" title="Lý Do Của Tôi" subtitle="Lý do đủ mạnh sẽ kéo bạn qua những ngày tối nhất">
      <Callout accent="orange" icon="💡">
        Nghiên cứu từ Yale: Người có <strong>nhiều lý do cụ thể</strong> (không phải chung chung) bỏ thuốc thành công cao hơn 3x.
      </Callout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { key: 'why1', label: 'Lý do số 1 — Quan trọng nhất', ph: 'Ví dụ: Tôi muốn còn khoẻ để nhìn con tốt nghiệp đại học…', val: data.why1 },
          { key: 'why2', label: 'Lý do số 2', ph: 'Ví dụ: Tôi muốn dành tiền mua xe/nhà/cho con học…', val: data.why2 },
          { key: 'why3', label: 'Lý do số 3', ph: 'Ví dụ: Tôi muốn không còn ngại khi hôn vợ/con…', val: data.why3 },
          { key: 'why4', label: 'Lý do số 4', ph: 'Ví dụ: Tôi muốn chứng minh mình làm được…', val: data.why4 },
        ].map((f) => (
          <div key={f.key} className="rounded-xl p-3 bg-sol-bg/60 border border-black/5">
            <FieldLabel color="#B8860B">{f.label}</FieldLabel>
            <TextArea
              value={f.val}
              placeholder={f.ph}
              onChange={(e) => set(f.key as any, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <FieldLabel>Người tôi muốn làm gương / chứng minh điều gì đó</FieldLabel>
        <TextInput
          value={data.roleModel}
          onChange={(e) => set('roleModel', e.target.value)}
          placeholder="Tên người đó và điều bạn muốn chứng minh…"
        />
      </div>
    </SectionCard>
  );
}

// ─── 2 · Cam Kết ───────────────────────────────────────────────────────

export function PledgeSection() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);
  return (
    <SectionCard id="wbx-section-pledge" accent="orange" num="2" title="Lời Cam Kết Của Tôi" subtitle="Viết ra và ký — não bạn sẽ nghiêm túc hơn">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #FFF4EA 0%, #FEE0C4 100%)',
          border: '2px dashed #B8860B',
        }}
      >
        <p className="text-[15px] md:text-base leading-[1.9] font-medium text-sol-ink">
          Tôi,{' '}
          <span className="font-bold text-sol-orange">
            {data.userName || '_________________'}
          </span>
          , cam kết
          <br />
          bắt đầu từ ngày ký này, tôi sẽ <strong>KHÔNG HÚT THUỐC LÁ</strong>.
          <br />
          Tôi hiểu đây là hành trình — không phải hoàn hảo ngay từ đầu,
          <br />
          nhưng tôi sẽ <strong>KHÔNG BỎ CUỘC</strong>.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
          <div>
            <TextInput
              placeholder="Chữ ký / Tên"
              value={data.pledgeSig}
              onChange={(e) => set('pledgeSig', e.target.value)}
              style={{ textAlign: 'center', fontSize: 16 }}
            />
            <div className="text-[11px] text-sol-ink/55 mt-1">Chữ ký</div>
          </div>
          <div>
            <TextInput
              type="date"
              value={data.pledgeDate}
              onChange={(e) => set('pledgeDate', e.target.value)}
              style={{ textAlign: 'center' }}
            />
            <div className="text-[11px] text-sol-ink/55 mt-1">Ngày ký cam kết</div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── 3 · Mạng Lưới Hỗ Trợ ──────────────────────────────────────────────

export function NetworkSection() {
  const data = useWorkbook((s) => s.data);
  const setCell = useWorkbook((s) => s.setNetworkCell);
  const addRow = useWorkbook((s) => s.addNetworkRow);
  return (
    <SectionCard id="wbx-section-network" accent="blue" num="3" title="Mạng Lưới Hỗ Trợ" subtitle="Người biết = người có thể giúp bạn khi cơn thèm đến lúc 2am">
      <Callout accent="blue" icon="📞">
        Người có ít nhất <strong>3 người ủng hộ</strong> trong mạng lưới thành công cao hơn 67%.{' '}
        <a href="https://bothuocla.sol.vn/community" target="_blank" rel="noreferrer" className="font-bold underline">Cộng đồng Sol</a>{' '}·{' '}
        <a href="https://bothuocla.sol.vn/ai-mentor" target="_blank" rel="noreferrer" className="font-bold underline">AI Mentor 24/7</a>
      </Callout>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-sol-ink/55 text-left">
              <th className="pb-2 pr-2 font-semibold">Họ tên</th>
              <th className="pb-2 pr-2 font-semibold">Quan hệ</th>
              <th className="pb-2 pr-2 font-semibold">Liên hệ</th>
              <th className="pb-2 font-semibold">Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {data.network.map((row, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-1.5 pr-2">
                  <TextInput
                    value={row.name}
                    onChange={(e) => setCell(i, 'name', e.target.value)}
                    placeholder={i === 0 ? 'Tên…' : ''}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <TextInput
                    value={row.relation}
                    onChange={(e) => setCell(i, 'relation', e.target.value)}
                    placeholder={i === 0 ? 'Vợ/chồng…' : ''}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <TextInput
                    value={row.contact}
                    onChange={(e) => setCell(i, 'contact', e.target.value)}
                    placeholder={i === 0 ? 'SĐT…' : ''}
                  />
                </td>
                <td className="py-1.5">
                  <TextInput
                    value={row.role}
                    onChange={(e) => setCell(i, 'role', e.target.value)}
                    placeholder={i === 0 ? 'Gọi khi khó khăn nhất…' : ''}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-sol-blue/40 text-sol-blue bg-white hover:bg-sol-blue/5 print:hidden"
      >
        + Thêm người
      </button>
    </SectionCard>
  );
}

// ─── 4 · Tiết Kiệm ─────────────────────────────────────────────────────

export function MoneySection() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);
  const preview = useMemo(
    () => calcMoneySavings({ cigsPerDay: data.cigsDay, packPrice: data.packPrice }),
    [data.cigsDay, data.packPrice],
  );
  return (
    <SectionCard id="wbx-section-money" accent="green" num="4" title="Tính Tiền Tiết Kiệm Được" subtitle="Nhìn thấy con số = động lực thật sự">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <FieldLabel>Số điếu hút mỗi ngày</FieldLabel>
          <TextInput
            type="number"
            min={0}
            max={100}
            value={data.cigsDay || ''}
            onChange={(e) => set('cigsDay', Math.max(0, Number(e.target.value) || 0))}
            placeholder="15"
          />
        </div>
        <div>
          <FieldLabel>Giá 1 bao (nghìn đồng)</FieldLabel>
          <TextInput
            type="number"
            min={0}
            max={500}
            value={data.packPrice || ''}
            onChange={(e) => set('packPrice', Math.max(0, Number(e.target.value) || 0))}
            placeholder="25"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: '1 Tuần',  val: preview.week },
          { label: '1 Tháng', val: preview.month },
          { label: '1 Năm',   val: preview.year },
          { label: '5 Năm',   val: preview.fiveYear },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', border: '1px solid #A5D6A7' }}
          >
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#2E7D32' }}>
              {m.label}
            </div>
            <div className="text-sm md:text-base font-bold tabular-nums" style={{ color: '#1B5E20' }}>
              {fmtVndFull(m.val)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <FieldLabel>Tôi sẽ dùng tiền này để:</FieldLabel>
        <TextArea
          value={data.moneyGoal}
          onChange={(e) => set('moneyGoal', e.target.value)}
          placeholder="Ví dụ: Du lịch cùng gia đình, mua xe, học thêm, đầu tư…"
        />
      </div>
    </SectionCard>
  );
}

// ─── 5 · Nhật Ký Cơn Thèm ──────────────────────────────────────────────

export function CravingLogSection() {
  const data = useWorkbook((s) => s.data);
  const setCell = useWorkbook((s) => s.setCravingLogCell);
  const addRow = useWorkbook((s) => s.addCravingLogRow);
  return (
    <SectionCard id="wbx-section-craving" accent="orange" num="5" title="Nhật Ký Cơn Thèm" subtitle="Hiểu cơn thèm = vũ khí mạnh nhất để đánh bại nó">
      <Callout accent="orange" icon="⏱">
        Mỗi cơn thèm chỉ kéo dài <strong>3–5 phút</strong>. Nếu bạn không làm gì, nó sẽ tự qua.
      </Callout>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-sol-ink/55 text-left">
              <th className="pb-2 pr-2 font-semibold">Ngày</th>
              <th className="pb-2 pr-2 font-semibold">Giờ</th>
              <th className="pb-2 pr-2 font-semibold">Tình huống</th>
              <th className="pb-2 pr-2 font-semibold">Cảm xúc</th>
              <th className="pb-2 pr-2 font-semibold">Đã làm gì</th>
              <th className="pb-2 font-semibold">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {data.cravingLog.map((row, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-1.5 pr-2 min-w-[80px]">
                  <TextInput value={row.date} onChange={(e) => setCell(i, 'date', e.target.value)} placeholder="05/01" />
                </td>
                <td className="py-1.5 pr-2 min-w-[80px]">
                  <TextInput value={row.time} onChange={(e) => setCell(i, 'time', e.target.value)} placeholder="21:30" />
                </td>
                <td className="py-1.5 pr-2 min-w-[160px]">
                  <TextInput value={row.situation} onChange={(e) => setCell(i, 'situation', e.target.value)} placeholder="Ngồi cà phê với bạn…" />
                </td>
                <td className="py-1.5 pr-2">
                  <select
                    value={row.emotion}
                    onChange={(e) => setCell(i, 'emotion', e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-black/10 bg-white text-sm"
                  >
                    {CRAVING_SITUATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="py-1.5 pr-2 min-w-[160px]">
                  <TextInput value={row.action} onChange={(e) => setCell(i, 'action', e.target.value)} placeholder="Uống nước, đi bộ 5 phút…" />
                </td>
                <td className="py-1.5">
                  <select
                    value={row.result}
                    onChange={(e) => setCell(i, 'result', e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-black/10 bg-white text-sm"
                  >
                    {CRAVING_RESULTS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addRow}
        className="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-sol-orange/40 text-sol-orange bg-white hover:bg-sol-orange/5 print:hidden"
      >
        + Thêm dòng
      </button>
    </SectionCard>
  );
}

// ─── 6 · Kế Hoạch Tái Phát ─────────────────────────────────────────────

export function RelapsePlanSection() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);
  const triggers: Array<{ tKey: keyof typeof data; pKey: keyof typeof data; num: number }> = [
    { tKey: 'trig1T', pKey: 'trig1P', num: 1 },
    { tKey: 'trig2T', pKey: 'trig2P', num: 2 },
    { tKey: 'trig3T', pKey: 'trig3P', num: 3 },
  ];
  return (
    <SectionCard accent="red" icon="⚠️" title="Kế Hoạch Khi Tái Phát" subtitle="Lập kế hoạch trước — không phải sau khi nó xảy ra">
      <Callout accent="orange" icon="💡">
        Tái phát KHÔNG có nghĩa là thất bại. Trung bình một người cần nhiều lần thử trước khi bỏ được hẳn.
      </Callout>
      <FieldLabel>3 trigger nguy hiểm nhất của tôi và cách xử lý:</FieldLabel>
      <div className="space-y-3 mt-2">
        {triggers.map((t) => (
          <div key={t.num} className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-full bg-sol-red text-white text-sm font-bold flex items-center justify-center">
              {t.num}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <FieldLabel color="#C62828">TRIGGER</FieldLabel>
                <TextInput
                  value={data[t.tKey] as string}
                  onChange={(e) => set(t.tKey as any, e.target.value)}
                  placeholder={t.num === 1 ? 'Ví dụ: Sau bữa ăn với bạn bè hay nhậu nhẹt' : ''}
                />
              </div>
              <div>
                <FieldLabel color="#B25C2C">KẾ HOẠCH ĐỐI PHÓ</FieldLabel>
                <TextInput
                  value={data[t.pKey] as string}
                  onChange={(e) => set(t.pKey as any, e.target.value)}
                  placeholder={t.num === 1 ? 'Ví dụ: Uống trà xanh, ra ngoài đi bộ 5 phút, nhắn tin Sol Mentor' : ''}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <FieldLabel>Nếu tôi lỡ hút 1 điếu, câu tôi sẽ nói với bản thân:</FieldLabel>
        <TextArea
          value={data.relapseMantra}
          onChange={(e) => set('relapseMantra', e.target.value)}
          placeholder='"1 điếu không phải là thất bại. Tôi dừng ngay ở đây và tiếp tục."'
        />
      </div>
    </SectionCard>
  );
}

// ─── 7 · Tài Nguyên Sol ────────────────────────────────────────────────

export function ResourcesSection() {
  const cards = [
    { tag: '📚 Sol Wiki', title: 'Thư viện kiến thức cai thuốc', desc: 'Giải thích khoa học, cơ chế nghiện, tác hại, phương pháp — tất cả có nguồn tham khảo', href: 'https://sol.vn/wiki', color: '#3A7CA5' },
    { tag: '📖 Ebook Sol', title: 'Bỏ Thuốc, Thở Lại', desc: '19 chương hướng dẫn đầy đủ — miễn phí 6 chương đầu', href: 'https://bothuocla.sol.vn/ebook', color: '#C17E2A' },
    { tag: '📊 Dashboard', title: 'Theo dõi tiến độ real-time', desc: 'Từ Giờ G: tiền tiết kiệm, phổi phục hồi, ngày không thuốc, tim mạch', href: 'https://bothuocla.sol.vn/dashboard', color: '#B25C2C' },
    { tag: '🤖 AI Mentor 1-1', title: 'Đồng hành cá nhân hóa 24/7', desc: 'Tổng hợp từ kinh nghiệm thực chiến — sẵn sàng lúc 2 giờ sáng', href: 'https://bothuocla.sol.vn/ai-mentor', color: '#7B1FA2' },
    { tag: '👥 Cộng đồng Sol', title: 'Bạn không đi một mình', desc: 'Kết nối với những người cùng hành trình — chia sẻ, hỗ trợ, ăn mừng cùng nhau', href: 'https://bothuocla.sol.vn/community', color: '#00838F' },
    { tag: '🌐 bothuocla.sol.vn', title: 'Đi Cùng Sol — bỏ thuốc lá', desc: 'Trang chủ Đi Cùng Sol — vào miễn phí, không cần đăng ký', href: 'https://bothuocla.sol.vn', color: '#B8860B' },
  ];
  return (
    <SectionCard accent="blue" icon="🔗" title="Hệ Sinh Thái Sol — Tài Nguyên Của Bạn" subtitle="Workbook này là 1 phần của hệ thống — kết hợp đầy đủ để tối đa hiệu quả">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c) => (
          <a
            key={c.tag}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl p-4 bg-white border border-black/5 shadow-card hover:shadow-lg transition"
            style={{ borderTop: `3px solid ${c.color}` }}
          >
            <div className="text-xs font-bold mb-1" style={{ color: c.color }}>{c.tag}</div>
            <div className="font-semibold text-sm">{c.title}</div>
            <div className="text-xs text-sol-ink/60 mt-1 leading-relaxed">{c.desc}</div>
          </a>
        ))}
      </div>
    </SectionCard>
  );
}
