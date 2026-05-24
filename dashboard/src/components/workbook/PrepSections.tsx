// Các section chuẩn bị: Lý do · Cam kết · Mạng lưới · Tiết kiệm · Cơn thèm · Tái phát · Tài nguyên.
// Gom vào 1 file để tránh bùng nổ số file — mỗi section nhỏ, đơn giản, không cần tái sử dụng.

import { useMemo } from 'react';
import { useWorkbook } from '../../state/workbookStore';
import type { WorkbookIdentity } from '../../state/workbookStore';
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

// ─── 6 · Bản Thân — Identity reframe (Allen Carr-inspired) ─────────────
// 7 prompts để user tự hỏi mình "Tôi là ai khi không hút" — không phải
// "Tôi cố gắng bỏ thuốc". Identity shift = chuyển từ deprivation feeling
// (cảm thấy thiếu) sang freedom feeling (cảm thấy thoát).
//
// Voice opening: Khang Sol cá nhân ("Mình tự hỏi mình câu này tối trước
// Q-Day…") — không phải bác sĩ giảng. Đây là moat differentiator vs Allen
// Carr (Allen mất 2006, voice generic) và Smoke Free (AI chỉ text English).
//
// Data flow: save vào WorkbookData.identity, sync lên User.settings.workbook
// qua autosave có sẵn. Phase 3-4 craving replay sẽ pull từ đây + 3 lý do
// (Việc 3 sắp tới).

const IDENTITY_PROMPTS: Array<{
  key: keyof WorkbookIdentity;
  num: number;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  {
    key: 'q1',
    num: 1,
    label: 'Tôi là ai khi không có thuốc lá trong tay?',
    hint: 'Không phải "tôi đang cai" — mà "tôi vốn là". Hãy mô tả như một người không bao giờ hút.',
    placeholder: 'Ví dụ: Tôi là người uống cà phê sáng đọc báo, người dắt cu Tí đi học buổi sáng không vội vàng tìm chỗ hút trộm…',
  },
  {
    key: 'q2',
    num: 2,
    label: 'Người không hút làm gì khi stress?',
    hint: 'Stress là 100% sẽ có. Người không hút vẫn xử lý được — họ làm gì?',
    placeholder: 'Ví dụ: Đi bộ 10 phút, gọi vợ, viết ra giấy, hít sâu 4 nhịp, làm tách trà…',
  },
  {
    key: 'q3',
    num: 3,
    label: '5 năm tới tôi muốn được biết là người gì?',
    hint: 'Không nói về thuốc. Nói về phẩm chất bạn muốn người khác nhớ về mình.',
    placeholder: 'Ví dụ: Người ông khoẻ chơi với cháu, người chồng còn ở bên vợ năm 60, người bạn được tin tưởng…',
  },
  {
    key: 'q4',
    num: 4,
    label: 'Vợ/con tôi muốn tôi trở thành người gì?',
    hint: 'Hỏi thẳng họ nếu được. Hoặc tưởng tượng họ ngồi cạnh bây giờ.',
    placeholder: 'Ví dụ: Vợ muốn tôi không còn ho mỗi sáng, con muốn tôi ôm không có mùi khói, mẹ muốn tôi sống lâu hơn bố…',
  },
  {
    key: 'q5',
    num: 5,
    label: 'Câu nào tôi muốn người khác nói về tôi?',
    hint: 'Không phải lời đẹp xã giao. Là câu một người thân thiết nói thật về bạn.',
    placeholder: 'Ví dụ: "Anh ấy nói được làm được", "Chú ấy thay đổi vì gia đình", "Bố tôi đã bỏ thuốc khi tôi 12 tuổi"…',
  },
  {
    key: 'q6',
    num: 6,
    label: 'Một người không hút bữa nhậu thế nào?',
    hint: 'Đây là tình huống khó nhất. Hình dung kỹ — không né.',
    placeholder: 'Ví dụ: Vẫn ngồi cùng anh em, gọi nước trước, ra ngoài hít thở khi mọi người ra hút, về sớm không tiếc…',
  },
  {
    key: 'q7',
    num: 7,
    label: 'Đến cuối đời, di sản tôi để lại là gì?',
    hint: 'Câu nặng nhất. Để cuối cùng. Không cần trả lời ngay — viết rồi quay lại sau vài ngày.',
    placeholder: 'Ví dụ: Một gia đình không có ai hút thuốc, một người con kể "bố tôi đã chọn lại", một bài học cho cu Tí về quyết định…',
  },
];

export function IdentitySection() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);
  const identity = data.identity;
  const filled = (Object.keys(identity) as Array<keyof typeof identity>).filter((k) => identity[k]?.trim().length).length;

  function setField(key: keyof typeof identity, value: string) {
    set('identity', { ...identity, [key]: value });
  }

  return (
    <SectionCard
      id="wbx-section-identity"
      accent="purple"
      icon="🪞"
      title="Bản Thân — Tôi Là Ai Khi Không Hút"
      subtitle="7 câu hỏi sâu để bạn nhận lại chính mình — không phải cai thuốc, mà là sống lại"
    >
      {/* Voice Khang opening — quote founder cá nhân */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{
          background: 'linear-gradient(135deg, #F3E5F5 0%, #FFF4EA 100%)',
          borderLeft: '4px solid #7B1FA2',
        }}
      >
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-base">💬</span>
          <strong className="text-sol-ink text-sm">Khang Sol</strong>
          <span className="text-[11px] text-sol-ink/60">— Người Đã Đi Qua</span>
        </div>
        <p className="text-[13.5px] leading-relaxed text-sol-ink italic">
          “Mình hút 30 năm trước khi cai. Lần thứ 5 mình nhảy thẳng — không kế
          hoạch. Mình đã may có moment đó. Nhưng mình biết không phải ai cũng
          giống mình. Và không phải ai cũng giống nhau.<br /><br />
          7 câu này không phải để có câu trả lời đúng — là để anh biết bản thân
          không phải <em>đang cố bỏ thuốc</em>. Bản thân anh <em>vốn không phải
          người hút</em>. Khi anh viết xong, anh sẽ hiểu mình khác trước.”
        </p>
      </div>

      <Callout accent="purple" icon="🧠">
        <strong>Allen Carr (1985)</strong> dạy: identity shift quan trọng hơn
        will power. Não không bỏ thói quen được — não chỉ thay danh tính. Khi
        bạn nói “tôi <strong>không phải</strong> người hút”, khác hẳn “tôi
        <strong> đang cố </strong> không hút”.
      </Callout>

      <div className="text-[11px] text-sol-ink/60 mb-3 flex items-center gap-2">
        <span className="font-semibold uppercase tracking-wider">Tiến độ</span>
        <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${(filled / 7) * 100}%`,
              background: 'linear-gradient(90deg, #7B1FA2, #B8860B)',
            }}
          />
        </div>
        <span className="tabular-nums">{filled}/7</span>
      </div>

      <div className="space-y-3">
        {IDENTITY_PROMPTS.map((p) => (
          <div
            key={p.key}
            className="rounded-xl p-3 bg-sol-bg/60 border border-black/5"
          >
            <div className="flex items-start gap-2.5">
              <div
                className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                style={{ background: '#7B1FA2' }}
              >
                {p.num}
              </div>
              <div className="flex-1 min-w-0">
                <FieldLabel color="#7B1FA2">{p.label}</FieldLabel>
                <p className="text-[11.5px] text-sol-ink/55 mb-1.5 leading-relaxed">
                  {p.hint}
                </p>
                <TextArea
                  value={identity[p.key]}
                  placeholder={p.placeholder}
                  onChange={(e) => setField(p.key, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filled === 7 && (
        <div
          className="mt-4 rounded-xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
            border: '1px dashed #7B1FA2',
          }}
        >
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-sm font-bold text-sol-ink">
            Đủ 7 câu — anh đã có bản đồ chính mình
          </div>
          <p className="text-[12px] text-sol-ink/70 mt-1 leading-relaxed">
            Phase 3-4 sau Q-Day, khi cơn thèm mạnh, Sol sẽ đưa lại đây cho
            anh đọc. Đây là kim chỉ nam khi não muốn quay đầu.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

// ─── NRTAdvisorySection REMOVED 2026-05-06 ────────────────────────────
// Khang quyết định bỏ chi tiết Champix/Nicorette/Nicotinell:
//   1. Không hợp brand "Người Đã Đi Qua" peer mentor — quá giống BS
//   2. Giá thay đổi theo thị trường = maintenance burden
//   3. Quitline 1800 6606 đã wire 5 chỗ khác (Crisis, SlipModal,
//      Settings widget+dashboard, _shared) — user vẫn có entry point.
// Nếu cần lại: dùng wiki sol.vn (link từ Settings) thay vì in-app section
// — content centrally managed, dễ update giá khi thị trường đổi.

// ─── 7 · Kế Hoạch Tái Phát ─────────────────────────────────────────────

export function RelapsePlanSection() {
  const data = useWorkbook((s) => s.data);
  const set = useWorkbook((s) => s.set);
  const triggers: Array<{ tKey: keyof typeof data; pKey: keyof typeof data; num: number }> = [
    { tKey: 'trig1T', pKey: 'trig1P', num: 1 },
    { tKey: 'trig2T', pKey: 'trig2P', num: 2 },
    { tKey: 'trig3T', pKey: 'trig3P', num: 3 },
  ];
  return (
    <SectionCard accent="red" icon="⚠️" title="Kế Hoạch Khi Tái Hút" subtitle="Lập kế hoạch trước — không phải sau khi nó xảy ra">
      <Callout accent="orange" icon="💡">
        Tái hút KHÔNG có nghĩa là thất bại. Trung bình một người cần nhiều lần thử trước khi bỏ được hẳn.
      </Callout>
      <FieldLabel>3 tình huống nguy hiểm nhất của tôi và cách xử lý:</FieldLabel>
      <div className="space-y-3 mt-2">
        {triggers.map((t) => (
          <div key={t.num} className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-full bg-sol-red text-white text-sm font-bold flex items-center justify-center">
              {t.num}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <FieldLabel color="#C62828">TÌNH HUỐNG</FieldLabel>
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
                  placeholder={t.num === 1 ? 'Ví dụ: Uống trà xanh, ra ngoài đi bộ 5 phút, nhắn tin Sol' : ''}
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
