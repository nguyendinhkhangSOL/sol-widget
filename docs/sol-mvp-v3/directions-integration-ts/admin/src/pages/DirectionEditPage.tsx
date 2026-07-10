// ═══════════════════════════════════════════════════════════════
// DirectionEditPage — 60-field editor với 6 accordion sections
// Route: /directions/:id/edit
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  directionsApi,
  Direction,
  CATEGORY_LABELS,
  CLUSTER_LABELS,
} from '../utils/api-directions';

type FormData = Partial<Direction>;

export default function DirectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [changeNote, setChangeNote] = useState('');

  // Expand state per section
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true,
    legacy: true,
    filter: false,
    matching: false,
    business: false,
    time: false,
    vnreality: false,
    roadmap: false,
    ai: false,
    audit: false,
  });

  useEffect(() => {
    if (!id) return;
    loadDirection();
  }, [id]);

  const loadDirection = async () => {
    try {
      setLoading(true);
      const res = await directionsApi.get(id!);
      setFormData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof Direction, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateNested = (parent: keyof Direction, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...((prev[parent] as any) || {}), [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      const { id: _, createdAt, updatedAt, version, revisions, ...updateData } = formData;
      await directionsApi.update(id, { ...updateData, changeNote });
      alert('✅ Đã lưu thành công! (Version bump + auto-revision)');
      setChangeNote('');
      loadDirection();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <div className="mt-2 text-sm">Loading direction...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/directions" className="text-emerald-600 hover:underline text-sm">
            ← Danh sách
          </Link>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{formData.emoji}</span>
            <h1 className="text-xl font-bold text-gray-900">
              {formData.title || id}
            </h1>
            <span className="text-xs text-gray-500">v{formData.version}</span>
          </div>
        </div>
        <Link
          to={`/directions/${id}/revisions`}
          className="text-sm text-gray-600 hover:text-emerald-600"
        >
          📜 Lịch sử ({(formData.revisions?.length || 0)})
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-800 text-sm">
          ❌ {error}
        </div>
      )}

      {/* SECTION 1: BASIC */}
      <Section
        title="🏷️ Thông tin cơ bản"
        expanded={expanded.basic}
        onToggle={() => toggleSection('basic')}
      >
        <TextInput label="ID (slug)" value={formData.id || ''} onChange={v => update('id', v)} disabled />
        <TextInput label="Tiêu đề" value={formData.title || ''} onChange={v => update('title', v)} />
        <TextInput label="Emoji" value={formData.emoji || ''} onChange={v => update('emoji', v)} />
        <SelectInput
          label="Nhóm ngành (category)"
          value={formData.category || ''}
          onChange={v => update('category', v)}
          options={Object.entries(CATEGORY_LABELS).map(([k, l]) => ({ value: k, label: l }))}
        />
        <TextInput
          label="Nhãn hiển thị (categoryLabel)"
          value={formData.categoryLabel || ''}
          onChange={v => update('categoryLabel', v)}
        />
        <SelectInput
          label="Cluster archetype"
          value={formData.cluster || ''}
          onChange={v => update('cluster', v)}
          options={Object.entries(CLUSTER_LABELS).map(([k, l]) => ({ value: k, label: l }))}
        />
        <CheckboxInput label="Hướng mới (isNew)" value={formData.isNew || false} onChange={v => update('isNew', v)} />
        <TextArea label="Mô tả (desc)" value={formData.desc || ''} onChange={v => update('desc', v)} rows={3} />
      </Section>

      {/* SECTION 2: LEGACY 14 FIELDS */}
      <Section
        title="📊 Legacy fields (buoc3.html — BẢO TOÀN)"
        expanded={expanded.legacy}
        onToggle={() => toggleSection('legacy')}
        subtitle="14 fields kế thừa từ frontend cũ. Không nên đổi cấu trúc — chỉ tinh chỉnh giá trị."
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="P — Con người (people)" value={formData.pFit?.people ?? 0} onChange={v => updateNested('pFit', 'people', v)} />
          <NumberInput label="P — Chuyên môn (expert)" value={formData.pFit?.expert ?? 0} onChange={v => updateNested('pFit', 'expert', v)} />
          <NumberInput label="P — Builder" value={formData.pFit?.builder ?? 0} onChange={v => updateNested('pFit', 'builder', v)} />
          <NumberInput label="P — Independent" value={formData.pFit?.independent ?? 0} onChange={v => updateNested('pFit', 'independent', v)} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <NumberInput label="R — Vốn (capital)" value={formData.rReq?.capital ?? 0} onChange={v => updateNested('rReq', 'capital', v)} />
          <NumberInput label="R — Thời gian" value={formData.rReq?.time ?? 0} onChange={v => updateNested('rReq', 'time', v)} />
          <NumberInput label="R — Công nghệ" value={formData.rReq?.tech ?? 0} onChange={v => updateNested('rReq', 'tech', v)} />
          <NumberInput label="R — Mạng lưới" value={formData.rReq?.network ?? 0} onChange={v => updateNested('rReq', 'network', v)} />
          <NumberInput label="R — Rủi ro" value={formData.rReq?.risk ?? 0} onChange={v => updateNested('rReq', 'risk', v)} />
          <NumberInput label="R — Năng lượng" value={formData.rReq?.energy ?? 0} onChange={v => updateNested('rReq', 'energy', v)} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <NumberInput label="Bonus — Tốc độ thu nhập" value={formData.bonus?.income_speed ?? 0} onChange={v => updateNested('bonus', 'income_speed', v)} />
          <NumberInput label="Thu nhập MIN (triệu/tháng)" value={formData.income?.min ?? 0} onChange={v => updateNested('income', 'min', v)} />
          <NumberInput label="Thu nhập MAX (triệu/tháng)" value={formData.income?.max ?? 0} onChange={v => updateNested('income', 'max', v)} />
        </div>
        <TextInput label="Timeline (VD: 2-4 tháng)" value={formData.timeline || ''} onChange={v => update('timeline', v)} />
        <JsonInput label="Lý do (reasons: string[])" value={formData.reasons} onChange={v => update('reasons', v)} />
        <JsonInput label="Roadmap 4 tuần (legacy)" value={formData.roadmap4Tuan} onChange={v => update('roadmap4Tuan', v)} rows={10} />
      </Section>

      {/* SECTION 3: TAGS + FILTER */}
      <Section
        title="🏷️ Tags & Filter dimensions"
        expanded={expanded.filter}
        onToggle={() => toggleSection('filter')}
      >
        <JsonInput
          label="Tags (VD: AI-friendly, quiet-work)"
          value={formData.tags}
          onChange={v => update('tags', v)}
        />
        <JsonInput
          label="Keywords (SEO)"
          value={formData.keywords}
          onChange={v => update('keywords', v)}
        />
        <JsonInput
          label={'Industry Verticals (VD: {"F&B":90, "Giáo dục":85})'}
          value={formData.industryVerticals}
          onChange={v => update('industryVerticals', v)}
        />
        <JsonInput
          label={'Region Suitability (VD: {"HN":90, "HCM":95})'}
          value={formData.regionSuitability}
          onChange={v => update('regionSuitability', v)}
        />
        <SelectInput
          label="Gender Tilt"
          value={formData.genderTilt || 'neutral'}
          onChange={v => update('genderTilt', v)}
          options={[
            { value: 'neutral', label: 'Neutral (trung tính)' },
            { value: 'male-friendly', label: 'Male-friendly' },
            { value: 'female-friendly', label: 'Female-friendly' },
          ]}
        />
      </Section>

      {/* SECTION 4: USER MATCHING */}
      <Section
        title="🎯 User Matching (nâng cao)"
        expanded={expanded.matching}
        onToggle={() => toggleSection('matching')}
      >
        <JsonInput
          label={'Năng khiếu ưu tiên (VD: {"writing":90,"speaking":70})'}
          value={formData.nangKhieuUuTien}
          onChange={v => update('nangKhieuUuTien', v)}
        />
        <JsonInput
          label={'Tính cách phù hợp (VD: {"introvert_score":70,"planner_score":80})'}
          value={formData.tinhCachPhaHop}
          onChange={v => update('tinhCachPhaHop', v)}
        />
        <SelectInput
          label="Mức độ học hỏi cần thiết"
          value={formData.mucDoHocHoi || 'medium'}
          onChange={v => update('mucDoHocHoi', v)}
          options={[
            { value: 'easy', label: 'Easy (dễ)' },
            { value: 'medium', label: 'Medium (trung bình)' },
            { value: 'hard', label: 'Hard (khó)' },
          ]}
        />
        <SelectInput
          label="Mức độ rủi ro đầu tư"
          value={formData.mucDoRuiRoDauTu || 'moderate'}
          onChange={v => update('mucDoRuiRoDauTu', v)}
          options={[
            { value: 'conservative', label: 'Conservative' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'aggressive', label: 'Aggressive' },
          ]}
        />
      </Section>

      {/* SECTION 5: BUSINESS MODEL */}
      <Section
        title="💼 Business Model"
        expanded={expanded.business}
        onToggle={() => toggleSection('business')}
      >
        <SelectInput
          label="Loại business"
          value={formData.businessType || 'B2C'}
          onChange={v => update('businessType', v)}
          options={[
            { value: 'B2B', label: 'B2B' },
            { value: 'B2C', label: 'B2C' },
            { value: 'B2B2C', label: 'B2B2C' },
            { value: 'peer-to-peer', label: 'Peer-to-peer' },
          ]}
        />
        <JsonInput
          label={'Revenue Model (VD: ["one-time", "subscription"])'}
          value={formData.revenueModel}
          onChange={v => update('revenueModel', v)}
        />
        <SelectInput
          label="Scale Type"
          value={formData.scaleType || 'solo'}
          onChange={v => update('scaleType', v)}
          options={[
            { value: 'solo', label: 'Solo (1 người)' },
            { value: 'small-team-2-5', label: 'Small team (2-5 người)' },
            { value: 'team-required', label: 'Team required (>5)' },
          ]}
        />
        <NumberInput
          label="Remote Possibility (0-100%)"
          value={formData.remotePossibility ?? 50}
          onChange={v => update('remotePossibility', v)}
          max={100}
        />
        <NumberInput
          label="Travel Required (0-100%)"
          value={formData.travelRequired ?? 20}
          onChange={v => update('travelRequired', v)}
          max={100}
        />
      </Section>

      {/* SECTION 6: TIME / SUCCESS */}
      <Section
        title="⏱️ Time & Success Indicators"
        expanded={expanded.time}
        onToggle={() => toggleSection('time')}
      >
        <JsonInput
          label={'Hours per week (VD: {"min":20, "max":40, "typical":30})'}
          value={formData.hoursPerWeek}
          onChange={v => update('hoursPerWeek', v)}
        />
        <TextInput
          label="Time to First Revenue"
          value={formData.timeToFirstRevenue || ''}
          onChange={v => update('timeToFirstRevenue', v)}
        />
        <TextInput
          label="Time to Stable Income"
          value={formData.timeToStableIncome || ''}
          onChange={v => update('timeToStableIncome', v)}
        />
        <JsonInput
          label={'Chỉ số Thành Công (VD: [{"name":"Khách #1","target":1,"timeframe":"90d"}])'}
          value={formData.chiSoThanhCong}
          onChange={v => update('chiSoThanhCong', v)}
          rows={4}
        />
        <JsonInput
          label="Chỉ số Thất Bại (5 dấu hiệu để bỏ sớm)"
          value={formData.chiSoThatBai}
          onChange={v => update('chiSoThatBai', v)}
          rows={4}
        />
        <JsonInput
          label={'Thiết bị + Phần mềm (VD: {"devices":["camera"],"software":["Excel"]})'}
          value={formData.thietBiPhanMem}
          onChange={v => update('thietBiPhanMem', v)}
        />
      </Section>

      {/* SECTION 7: VN REALITY */}
      <Section
        title="🇻🇳 VN Reality (Pháp lý + Chi phí + Ràng buộc)"
        expanded={expanded.vnreality}
        onToggle={() => toggleSection('vnreality')}
        subtitle="Bám sát thực tế Việt Nam 2026 — không chính sách phòng lạnh"
      >
        <NumberInput
          label="Số năm nghề tối thiểu"
          value={formData.soNamNgheToiThieu ?? 0}
          onChange={v => update('soNamNgheToiThieu', v)}
        />
        <NumberInput
          label="Buffer tài chính (tháng)"
          value={formData.bufferThang ?? 0}
          onChange={v => update('bufferThang', v)}
        />
        <JsonInput
          label={'Kết quả cụ thể yêu cầu (VD: ["Đã dạy 500+ học viên"])'}
          value={formData.ketQuaCuTheYeuCau}
          onChange={v => update('ketQuaCuTheYeuCau', v)}
        />
        <TextInput
          label="Mã ngành HKD (VD: 6920 cho kế toán)"
          value={formData.phapLyMaNganh || ''}
          onChange={v => update('phapLyMaNganh', v)}
        />
        <NumberInput
          label="Thuế khoán (%)"
          value={formData.thueKhoanPercent ?? 0}
          onChange={v => update('thueKhoanPercent', v)}
          step={0.1}
        />
        <TextInput
          label="Chứng chỉ bắt buộc (VD: VACPA / ICF ACC)"
          value={formData.chungChiBatBuoc || ''}
          onChange={v => update('chungChiBatBuoc', v)}
        />
        <JsonInput
          label={'Chi phí VN cụ thể (VD: [{"ten":"Thuê phòng","gia":"1.2tr","dia_chi":"Highlands Hồ Tây"}])'}
          value={formData.chiPhiVnDiaChi}
          onChange={v => update('chiPhiVnDiaChi', v)}
          rows={4}
        />
        <JsonInput
          label={'Ràng buộc gia đình (VD: {"vo_chong":"cần đồng ý","con":"học phí 6-15tr/tháng"})'}
          value={formData.rangBuocGiaDinh}
          onChange={v => update('rangBuocGiaDinh', v)}
        />
        <JsonInput
          label="Văn hoá bán hàng VN (payment/refund/networking)"
          value={formData.vanHoaBanHangVn}
          onChange={v => update('vanHoaBanHangVn', v)}
        />
        <JsonInput
          label="Rủi ro tuổi 40-60 (burnout, sức khoẻ)"
          value={formData.ruiRoTuoi40_60}
          onChange={v => update('ruiRoTuoi40_60', v)}
        />
      </Section>

      {/* SECTION 8: ROADMAP 12 TUẦN */}
      <Section
        title="📅 Roadmap 12 tuần + Framework Sol Active"
        expanded={expanded.roadmap}
        onToggle={() => toggleSection('roadmap')}
      >
        <JsonInput
          label={'3 giai đoạn tiêu đề (VD: ["Định vị","Momentum","Khách #1"])'}
          value={formData.giaiDoan3TieuDe}
          onChange={v => update('giaiDoan3TieuDe', v)}
        />
        <JsonInput
          label="Roadmap 12 tuần (12 objects: title + việc + KPI)"
          value={formData.roadmap12Tuan}
          onChange={v => update('roadmap12Tuan', v)}
          rows={12}
        />
        <JsonInput
          label="5 Sai lầm phổ biến"
          value={formData.saiLam5}
          onChange={v => update('saiLam5', v)}
          rows={6}
        />
        <JsonInput
          label="6 Framework Sol Active (không template copy-paste)"
          value={formData.solActiveFramework}
          onChange={v => update('solActiveFramework', v)}
          rows={6}
        />
        <JsonInput
          label={'10 Công cụ VN + giá (VD: [{"ten":"LinkedIn Premium","gia":"750k/tháng"}])'}
          value={formData.congCu10}
          onChange={v => update('congCu10', v)}
          rows={6}
        />
      </Section>

      {/* SECTION 9: AI 2026 */}
      <Section
        title="🤖 AI 2026 Awareness"
        expanded={expanded.ai}
        onToggle={() => toggleSection('ai')}
      >
        <JsonInput
          label={'AI đã nuốt (VD: ["Ebook AI generic", "Newsletter"])'}
          value={formData.aiDaNuot}
          onChange={v => update('aiDaNuot', v)}
        />
        <JsonInput
          label={'AI chưa nuốt (VD: ["Workshop offline", "Coaching sâu"])'}
          value={formData.aiChuaNuot}
          onChange={v => update('aiChuaNuot', v)}
        />
        <NumberInput
          label="AI Moat Score (1-10)"
          value={formData.aiMoatScore ?? 0}
          onChange={v => update('aiMoatScore', v)}
          max={10}
        />
      </Section>

      {/* SECTION 10: AUDIT TRAIL */}
      <Section
        title="🔬 Scientific Data Audit Trail"
        expanded={expanded.audit}
        onToggle={() => toggleSection('audit')}
        subtitle="Nguồn data + discount factor + chuyên gia confirm"
      >
        <TextArea
          label="Nguồn 1: Founder note (Khang trải qua)"
          value={formData.nguonDataFounder || ''}
          onChange={v => update('nguonDataFounder', v)}
          rows={3}
        />
        <TextArea
          label="Nguồn 2: Public report link"
          value={formData.nguonDataPublic || ''}
          onChange={v => update('nguonDataPublic', v)}
          rows={2}
        />
        <TextInput
          label="Discount Factor Formula (VD: PPP 32% × market maturity 60%)"
          value={formData.discountFactorFormula || ''}
          onChange={v => update('discountFactorFormula', v)}
        />
        <TextInput
          label="Chuyên gia confirm (network)"
          value={formData.networkConfirmedBy || ''}
          onChange={v => update('networkConfirmedBy', v)}
        />
      </Section>

      {/* SECTION 11: CROSS-LINK + MARKET */}
      <Section
        title="🔗 Cross-link + Market Intelligence"
        expanded={expanded.audit}
        onToggle={() => toggleSection('audit')}
      >
        <JsonInput
          label={'Case Study IDs (VD: ["01", "02"])'}
          value={formData.caseStudyIds}
          onChange={v => update('caseStudyIds', v)}
        />
        <JsonInput
          label="Article IDs"
          value={formData.articleIds}
          onChange={v => update('articleIds', v)}
        />
        <JsonInput
          label="Prompt IDs"
          value={formData.promptIds}
          onChange={v => update('promptIds', v)}
        />
        <SelectInput
          label="Mức độ cạnh tranh"
          value={formData.mucDoCanhTranh || 'medium'}
          onChange={v => update('mucDoCanhTranh', v)}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'saturated', label: 'Saturated' },
          ]}
        />
        <SelectInput
          label="Xu hướng thị trường"
          value={formData.xuHuongThiTruong || 'stable'}
          onChange={v => update('xuHuongThiTruong', v)}
          options={[
            { value: 'growing', label: 'Growing (đang tăng)' },
            { value: 'stable', label: 'Stable (ổn định)' },
            { value: 'declining', label: 'Declining (giảm)' },
          ]}
        />
      </Section>

      {/* SAVE BAR (sticky bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={changeNote}
            onChange={e => setChangeNote(e.target.value)}
            placeholder="Ghi chú thay đổi (VD: 'Update giá VN theo Q3 2026')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <SelectInput
            label=""
            value={formData.status || 'DRAFT'}
            onChange={v => update('status', v)}
            options={[
              { value: 'DRAFT', label: '📝 Nháp' },
              { value: 'REVIEW', label: '👀 Chờ duyệt' },
              { value: 'PUBLISHED', label: '✅ Đăng' },
              { value: 'ARCHIVED', label: '🗄️ Ẩn' },
            ]}
            inline
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-semibold disabled:opacity-50"
          >
            {saving ? '⏳ Đang lưu...' : '💾 Lưu (v' + ((formData.version || 0) + 1) + ')'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Section({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div className="p-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  max = 100,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        max={max}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  inline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  inline?: boolean;
}) {
  return (
    <div className={inline ? '' : ''}>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function JsonInput({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  rows?: number;
}) {
  const [text, setText] = useState(
    value ? JSON.stringify(value, null, 2) : ''
  );
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setText(value ? JSON.stringify(value, null, 2) : '');
  }, [value]);

  const handleBlur = () => {
    if (!text.trim()) {
      onChange(null);
      setErr(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setErr(null);
    } catch (e: any) {
      setErr('JSON invalid: ' + e.message);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-md text-xs font-mono ${
          err ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
      {err && <div className="text-xs text-red-600 mt-1">❌ {err}</div>}
    </div>
  );
}
