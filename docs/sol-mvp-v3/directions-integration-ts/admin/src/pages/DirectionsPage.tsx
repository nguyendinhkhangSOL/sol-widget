// ═══════════════════════════════════════════════════════════════
// DirectionsPage — List 36 direction với filter + search
// Route: /directions
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  directionsApi,
  DirectionListItem,
  DirectionStatus,
  CATEGORY_LABELS,
  CLUSTER_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../utils/api-directions';

export default function DirectionsPage() {
  const [directions, setDirections] = useState<DirectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterCluster, setFilterCluster] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<DirectionStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary
  const [summary, setSummary] = useState<Array<{ status: DirectionStatus; _count: number }>>([]);

  const loadDirections = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await directionsApi.list({
        category: filterCategory || undefined,
        cluster: filterCluster || undefined,
        status: filterStatus || undefined,
        q: searchQuery || undefined,
      });
      setDirections(res.data);
      setSummary(res.summary || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load directions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirections();
  }, [filterCategory, filterCluster, filterStatus]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadDirections, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Group by category
  const grouped = useMemo(() => {
    const g: Record<string, DirectionListItem[]> = {};
    directions.forEach(d => {
      if (!g[d.category]) g[d.category] = [];
      g[d.category].push(d);
    });
    return g;
  }, [directions]);

  const totalByStatus = (s: DirectionStatus) =>
    summary.find(x => x.status === s)?._count || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            🗺️ Directions Manager
          </h1>
          <Link
            to="/directions/new"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
          >
            ➕ Tạo hướng đi mới
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          Quản trị 36 hướng đi khởi nghiệp cho người 40-60 tại Việt Nam
        </p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
            Tổng
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {directions.length}
          </div>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="text-xs text-emerald-700 uppercase font-semibold mb-1">
            Đã đăng
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {totalByStatus('PUBLISHED')}
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-xs text-amber-700 uppercase font-semibold mb-1">
            Chờ duyệt
          </div>
          <div className="text-2xl font-bold text-amber-800">
            {totalByStatus('REVIEW')}
          </div>
        </div>
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600 uppercase font-semibold mb-1">
            Nháp
          </div>
          <div className="text-2xl font-bold text-gray-700">
            {totalByStatus('DRAFT')}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tên, ID, mô tả..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nhóm ngành
            </label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Cluster archetype
            </label>
            <select
              value={filterCluster}
              onChange={e => setFilterCluster(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(CLUSTER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
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
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-800 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="mt-2 text-sm">Loading...</div>
        </div>
      )}

      {/* Grouped list */}
      {!loading && directions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không có hướng đi nào khớp filter.
        </div>
      )}

      {!loading && Object.keys(grouped).map(cat => (
        <div key={cat} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <span className="text-sm text-gray-500">
              ({grouped[cat].length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[cat].map(d => (
              <DirectionCard key={d.id} direction={d} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DirectionCard
// ─────────────────────────────────────────────────────────────

function DirectionCard({ direction }: { direction: DirectionListItem }) {
  return (
    <Link
      to={`/directions/${direction.id}/edit`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{direction.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[direction.status]}`}>
              {STATUS_LABELS[direction.status]}
            </span>
            {direction.isNew && (
              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                MỚI
              </span>
            )}
            <span className="text-xs text-gray-500">v{direction.version}</span>
          </div>
          <div className="font-semibold text-gray-900 mb-1 truncate">
            {direction.title}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {direction.id}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
            <span>💰 {direction.income.min}-{direction.income.max}tr</span>
            <span>⏱ {direction.timeline}</span>
            <span className="text-emerald-600 font-semibold">
              Cluster {direction.cluster}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
        Sửa cuối: {direction.lastEditedBy || 'system'} · {new Date(direction.updatedAt).toLocaleDateString('vi-VN')}
      </div>
    </Link>
  );
}
