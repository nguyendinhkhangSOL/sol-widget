// ═══════════════════════════════════════════════════════════════
// CaseStudiesPage — List + filter case study
// Route: /case-studies
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  caseStudiesApi,
  CaseStudy,
  CaseStudyTier,
  CASE_STUDY_TIER_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  ContentStatus,
} from '../utils/api-directions';

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<CaseStudyTier | ''>('');
  const [filterStatus, setFilterStatus] = useState<ContentStatus | ''>('');

  const loadCaseStudies = async () => {
    try {
      setLoading(true);
      const res = await caseStudiesApi.list({
        tier: filterTier || undefined,
        status: filterStatus || undefined,
      });
      setCaseStudies(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseStudies();
  }, [filterTier, filterStatus]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            📖 Case Studies
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Nhân vật thực chiến gắn với direction
          </p>
        </div>
        <Link
          to="/case-studies/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
        >
          ➕ Tạo case study mới
        </Link>
      </div>

      {/* Tier legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="font-semibold text-emerald-800 mb-1">🟢 Real Anonymized</div>
          <div className="text-xs text-emerald-700">Nhân vật thực đã ẩn danh với sự đồng ý</div>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="font-semibold text-amber-800 mb-1">🟡 Composite</div>
          <div className="text-xs text-amber-700">Tổng hợp từ nhiều trải nghiệm thực</div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-semibold text-blue-800 mb-1">🔵 Reasoning-based</div>
          <div className="text-xs text-blue-700">Mô phỏng khoa học từ nghiên cứu ngành</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tier
            </label>
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(CASE_STUDY_TIER_LABELS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-800 text-sm">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && caseStudies.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không có case study nào.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {caseStudies.map(cs => (
          <CaseStudyCard key={cs.id} caseStudy={cs} />
        ))}
      </div>
    </div>
  );
}

function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const tierColors = {
    REAL_ANON: 'bg-emerald-100 text-emerald-800',
    COMPOSITE: 'bg-amber-100 text-amber-800',
    REASONING: 'bg-blue-100 text-blue-800',
  };

  return (
    <Link
      to={`/case-studies/${caseStudy.id}/edit`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${tierColors[caseStudy.tier]}`}>
          {CASE_STUDY_TIER_LABELS[caseStudy.tier]}
        </span>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[caseStudy.status as any] || 'bg-gray-100'}`}>
          {STATUS_LABELS[caseStudy.status as any] || caseStudy.status}
        </span>
      </div>

      <div className="font-semibold text-gray-900 mb-1">
        {caseStudy.personaName}
      </div>

      {caseStudy.directionId && (
        <div className="text-xs text-emerald-700 mb-1">
          🔗 {caseStudy.directionId}
        </div>
      )}

      {caseStudy.contentSummary && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-3">
          {caseStudy.contentSummary}
        </p>
      )}

      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
        {caseStudy.personaRevenue && <span>💰 {caseStudy.personaRevenue}</span>}
        {caseStudy.wordCount && <span>📝 {caseStudy.wordCount} từ</span>}
      </div>
    </Link>
  );
}
