// ═══════════════════════════════════════════════════════════════
// CaseStudyEditPage — Editor case study với HTML editor + preview
// Route: /case-studies/:id/edit  or  /case-studies/new
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  caseStudiesApi,
  directionsApi,
  CaseStudy,
  CaseStudyTier,
  ContentStatus,
  DirectionListItem,
  CASE_STUDY_TIER_LABELS,
} from '../utils/api-directions';

export default function CaseStudyEditPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = paramId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [directions, setDirections] = useState<DirectionListItem[]>([]);

  const [formData, setFormData] = useState<Partial<CaseStudy>>({
    id: '',
    directionId: null,
    personaName: '',
    personaAge: null,
    personaBg: '',
    tier: 'COMPOSITE',
    contentHtml: '',
    contentSummary: '',
    personaRevenue: '',
    personaTimeToWin: '',
    wordCount: 0,
    status: 'DRAFT',
  });

  useEffect(() => {
    // Load all directions for dropdown
    directionsApi.list().then(res => {
      setDirections(res.data);
    }).catch(console.error);

    // Load case study if editing
    if (!isNew && paramId) {
      loadCaseStudy(paramId);
    } else {
      setLoading(false);
    }
  }, [paramId]);

  const loadCaseStudy = async (id: string) => {
    try {
      setLoading(true);
      const res = await caseStudiesApi.get(id);
      setFormData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof CaseStudy, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));

    // Auto-calc word count
    if (key === 'contentHtml') {
      const wc = (value as string).replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
      setFormData(prev => ({ ...prev, contentHtml: value, wordCount: wc }));
    }
  };

  const handleSave = async () => {
    if (!formData.id || !formData.personaName) {
      alert('❌ Cần điền ID + Tên nhân vật');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isNew) {
        await caseStudiesApi.create(formData);
        alert('✅ Đã tạo case study');
        navigate(`/case-studies/${formData.id}/edit`);
      } else {
        const { id: _, createdAt, updatedAt, ...updateData } = formData;
        await caseStudiesApi.update(paramId!, updateData);
        alert('✅ Đã lưu');
        loadCaseStudy(paramId!);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto pb-32">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/case-studies" className="text-emerald-600 hover:underline text-sm">
          ← Danh sách
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          {isNew ? '➕ Tạo case study' : `✏️ ${formData.personaName}`}
        </h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-800 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Metadata */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">🏷️ Metadata</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ID</label>
                <input
                  type="text"
                  value={formData.id || ''}
                  onChange={e => update('id', e.target.value)}
                  disabled={!isNew}
                  placeholder="01, 02, ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Direction gắn</label>
                <select
                  value={formData.directionId || ''}
                  onChange={e => update('directionId', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">-- Không gắn --</option>
                  {directions.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.emoji} {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tên nhân vật</label>
                <input
                  type="text"
                  value={formData.personaName || ''}
                  onChange={e => update('personaName', e.target.value)}
                  placeholder="Anh Đức 48 tuổi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tuổi</label>
                <input
                  type="number"
                  value={formData.personaAge || ''}
                  onChange={e => update('personaAge', parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Background</label>
                <textarea
                  value={formData.personaBg || ''}
                  onChange={e => update('personaBg', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tier</label>
                <select
                  value={formData.tier || 'COMPOSITE'}
                  onChange={e => update('tier', e.target.value as CaseStudyTier)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {Object.entries(CASE_STUDY_TIER_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Revenue (VD: 75 triệu/tháng)</label>
                <input
                  type="text"
                  value={formData.personaRevenue || ''}
                  onChange={e => update('personaRevenue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Time to Win</label>
                <input
                  type="text"
                  value={formData.personaTimeToWin || ''}
                  onChange={e => update('personaTimeToWin', e.target.value)}
                  placeholder="12 tháng"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Summary (short)</label>
                <textarea
                  value={formData.contentSummary || ''}
                  onChange={e => update('contentSummary', e.target.value)}
                  rows={4}
                  placeholder="Tóm tắt 200 từ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl || ''}
                  onChange={e => update('imageUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column — HTML editor */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 bg-gray-50">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">📝 Content HTML</h3>
                <span className="text-xs text-gray-500">
                  {formData.wordCount || 0} từ
                </span>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-xs font-semibold"
              >
                {showPreview ? '📝 Editor' : '👁️ Preview'}
              </button>
            </div>

            {showPreview ? (
              <div
                className="p-6 prose prose-sm max-w-none min-h-[500px]"
                dangerouslySetInnerHTML={{ __html: formData.contentHtml || '<em>Empty</em>' }}
              />
            ) : (
              <textarea
                value={formData.contentHtml || ''}
                onChange={e => update('contentHtml', e.target.value)}
                rows={30}
                placeholder="<div>Full HTML case study 2500-3000 từ...</div>"
                className="w-full px-4 py-3 text-sm font-mono focus:outline-none min-h-[500px]"
              />
            )}
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <select
            value={formData.status || 'DRAFT'}
            onChange={e => update('status', e.target.value as ContentStatus)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="DRAFT">📝 Nháp</option>
            <option value="REVIEW">👀 Chờ duyệt</option>
            <option value="PUBLISHED">✅ Đăng</option>
            <option value="ARCHIVED">🗄️ Ẩn</option>
          </select>
          <div className="flex-1"></div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-semibold disabled:opacity-50"
          >
            {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
