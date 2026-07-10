// ═══════════════════════════════════════════════════════════════
// DirectionRevisionsPage — History + revert
// Route: /directions/:id/revisions
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { directionsApi, DirectionRevision } from '../utils/api-directions';

export default function DirectionRevisionsPage() {
  const { id } = useParams<{ id: string }>();
  const [revisions, setRevisions] = useState<DirectionRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<DirectionRevision | null>(null);

  const loadRevisions = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await directionsApi.revisions(id);
      setRevisions(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, [id]);

  const handleRevert = async (versionNum: number) => {
    if (!id) return;
    if (!confirm(`Bạn chắc chắn revert về v${versionNum}?\nData hiện tại sẽ được backup vào revision mới trước khi ghi đè.`)) return;

    try {
      await directionsApi.revert(id, versionNum);
      alert(`✅ Đã revert về v${versionNum}`);
      loadRevisions();
    } catch (err: any) {
      alert('❌ Revert failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={`/directions/${id}/edit`} className="text-emerald-600 hover:underline text-sm">
            ← Về editor
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            📜 Lịch sử chỉnh sửa
          </h1>
          <p className="text-sm text-gray-600">Direction: {id}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-800 text-sm">
          ❌ {error}
        </div>
      )}

      {loading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {!loading && revisions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Chưa có revision nào.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Revision list */}
        <div className="lg:col-span-1 space-y-2">
          {revisions.map(rev => (
            <button
              key={rev.id}
              onClick={() => setSelectedRevision(rev)}
              className={`w-full text-left p-3 bg-white border rounded-lg hover:border-emerald-400 transition-all ${
                selectedRevision?.id === rev.id ? 'border-emerald-500 shadow-md' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-emerald-700">v{rev.versionNum}</span>
                <span className="text-xs text-gray-500">
                  {new Date(rev.editedAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-1">
                👤 {rev.editedBy}
              </div>
              {rev.changeNote && (
                <div className="text-xs text-gray-600 italic">
                  "{rev.changeNote}"
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right: Snapshot preview */}
        <div className="lg:col-span-2">
          {selectedRevision ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">
                    Snapshot v{selectedRevision.versionNum}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedRevision.editedAt).toLocaleString('vi-VN')} bởi {selectedRevision.editedBy}
                  </p>
                </div>
                <button
                  onClick={() => handleRevert(selectedRevision.versionNum)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-semibold"
                >
                  ⏪ Revert về v{selectedRevision.versionNum}
                </button>
              </div>
              <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-auto max-h-[600px] font-mono">
                {JSON.stringify(selectedRevision.snapshot, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              Chọn 1 revision bên trái để xem snapshot
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
