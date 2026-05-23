import { NextRequest, NextResponse } from 'next/server';

/**
 * Hostname-based routing:
 *
 * admin.sol.vn         → serve /admin/* (clean URL — /chat → /admin/chat internally)
 * bothuocla.sol.vn     → serve everything EXCEPT /admin/* (redirect /admin/* → admin.sol.vn)
 *
 * Khang's admin panel separated for security + UX.
 */

const ADMIN_HOSTS = new Set(['admin.sol.vn', 'admin.bothuocla.sol.vn']);
const APP_HOSTS = new Set(['bothuocla.sol.vn']);

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0];
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // ===== admin.sol.vn → rewrite paths to /admin/* =====
  if (ADMIN_HOSTS.has(host)) {
    // Skip Next internals + assets
    if (path.startsWith('/_next') || path.startsWith('/favicon') || path.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2?|map)$/)) {
      return NextResponse.next();
    }

    // /api/admin/* — already prefixed correctly, pass through
    if (path.startsWith('/api/admin/')) {
      return NextResponse.next();
    }

    // /api/* (non-admin) on admin host → block
    if (path.startsWith('/api/')) {
      return new NextResponse('Not found', { status: 404 });
    }

    // /admin/* prefix typed by mistake → strip + rewrite
    if (path.startsWith('/admin')) {
      url.pathname = path; // already correct, no rewrite needed
      return NextResponse.next();
    }

    // Everything else on admin.sol.vn → rewrite /X → /admin/X
    url.pathname = path === '/' ? '/admin' : `/admin${path}`;
    return NextResponse.rewrite(url);
  }

  // ===== bothuocla.sol.vn → block /admin/* (redirect to admin.sol.vn) =====
  if (APP_HOSTS.has(host)) {
    if (path.startsWith('/admin')) {
      const adminPath = path.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(`https://admin.sol.vn${adminPath}`, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|widget/embed.js|.*\\.(?:png|jpg|jpeg|svg|ico|webp|css|js|woff2?|map)).*)'
  ]
};
