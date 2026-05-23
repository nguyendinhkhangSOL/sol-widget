import type { Metadata } from 'next';
import Link from 'next/link';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Sol Admin', template: '%s | Sol Admin' },
  robots: { index: false, follow: false }
};

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-logo">S</span>
          <div>
            <div className="admin-brand-name">Sol Admin</div>
            <div className="admin-brand-meta">v0.2 · prod</div>
          </div>
        </div>

        <nav className="admin-nav">
          <Link href="/">📊 Dashboard</Link>
          <Link href="/chat">💬 Chat Inbox</Link>
          <Link href="/canned-replies">🧩 CHIP / Canned</Link>
          <Link href="/ai">🤖 AI Config</Link>
          <Link href="/members">👥 Members</Link>
          <Link href="/payments">💰 Payments</Link>
        </nav>

        <div className="admin-sidebar-footer">
          <a href="https://bothuocla.sol.vn" target="_blank" rel="noopener noreferrer">↗ Sol Widget App</a>
          <a href="https://sol.vn" target="_blank" rel="noopener noreferrer">↗ sol.vn Wiki</a>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
