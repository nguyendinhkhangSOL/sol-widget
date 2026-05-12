// dashboard/src/pages/admin/AdminWiki.tsx
//
// Theo kết luận đã chốt với founder:
//   "Wiki = WordPress. App = code riêng. Hai thế giới, kết nối bằng UTM
//    + analytics. Trong admin panel SOL, mục 'Quản lý wiki' thay bằng
//    2 WIDGET: (1) link tắt mở WordPress admin tab mới, (2) bảng top
//    bài + conversion (đọc từ Search Console / GA4 — hiện tại mock)."
//
// Không có CRUD bài viết ở đây. Toàn bộ quản trị nội dung wiki thực hiện
// trên sol.vn/wp-admin (WordPress + Yoast/Rank Math).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

type Stats = Awaited<ReturnType<typeof api.adminWikiStats>>;

export function AdminWiki() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminWikiStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sol-ink-2">Đang tải…</div>;
  if (!stats) return <div className="text-sol-ink-3">Không tải được wiki stats.</div>;

  return (
    <div className="space-y-4">
      <div className="bg-sol-blue-soft border border-sol-blue/30 rounded-2xl p-4 text-meta">
        <strong className="text-sol-blue-ink">📰 Wiki = WordPress.</strong>{' '}
        Mọi thao tác viết / sửa / SEO meta thực hiện trên WordPress admin.
        SOL admin chỉ có <strong>2 widget</strong> bên dưới: link tắt + bảng
        analytics.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Widget 1 — Link tắt */}
        <section className="sol-card p-5">
          <h2 className="text-h3 mb-3">🔗 Quản lý wiki</h2>
          <p className="text-meta text-sol-ink-2 mb-4">
            Mở WordPress admin trong tab mới để viết, sửa bài, cấu hình SEO
            meta (Yoast / Rank Math), ảnh, sitemap…
          </p>
          <div className="space-y-2">
            <a
              href={stats.wpAdminUrl}
              target="_blank"
              rel="noreferrer"
              className="sol-btn-primary w-full text-center block"
            >
              → Mở WordPress admin ({domainOf(stats.wpAdminUrl)})
            </a>
            <a
              href={stats.wpFrontUrl}
              target="_blank"
              rel="noreferrer"
              className="sol-btn-secondary w-full text-center block"
            >
              → Xem trang wiki công khai
            </a>
          </div>
          <div className="mt-4 text-meta text-sol-ink-3">
            <div className="font-semibold text-sol-ink-2 uppercase tracking-wider text-[11px] mb-1">
              Cấu hình
            </div>
            <code className="block text-[11px]">WP_ADMIN_URL = {stats.wpAdminUrl}</code>
            <code className="block text-[11px]">WP_FRONT_URL = {stats.wpFrontUrl}</code>
            <p className="mt-2">
              Sửa env vars ở backend để đổi đường dẫn (<code>WP_ADMIN_URL</code>,{' '}
              <code>WP_FRONT_URL</code>).
            </p>
          </div>
        </section>

        {/* Widget 2 — Top bài + Conversion */}
        <section className="sol-card p-5">
          <h2 className="text-h3 mb-3">📈 Top bài + Conversion</h2>
          {stats.integrationStatus === 'mock' && (
            <div className="bg-sol-orange-soft border border-sol-orange/30 rounded-xl p-3 text-meta mb-3">
              <strong>⚠️ Mock data.</strong> Tích hợp Google Search Console + GA4
              để có số thật. Dùng UTM params{' '}
              <code className="text-[11px]">?utm_source=wiki&utm_campaign=&lt;slug&gt;</code>{' '}
              khi link wiki → app để đo conversion.
            </div>
          )}
          <ul className="divide-y divide-sol-line">
            {stats.topPosts.map((p) => (
              <li key={p.slug} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a
                      href={`${stats.wpFrontUrl}/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-sol-ink hover:underline truncate block"
                    >
                      {p.title}
                    </a>
                    <div className="text-meta text-sol-ink-3">/{p.slug}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-meta">
                      <span className="font-bold text-sol-ink">{p.views7d}</span>{' '}
                      <span className="text-sol-ink-3">views/7d</span>
                    </div>
                    <div className="text-meta">
                      <span className="font-bold text-sol-green-ink">{p.conv}</span>{' '}
                      <span className="text-sol-ink-3">→ app</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-meta text-sol-ink-3 mt-3 italic">
            {stats.note}
          </p>
        </section>
      </div>
    </div>
  );
}

function domainOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
