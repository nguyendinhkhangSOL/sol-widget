/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Output standalone for easier PM2 deploy
  output: 'standalone',
  // Image optimization
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'sol.vn' },
      { protocol: 'https', hostname: 'bothuocla.sol.vn' }
    ]
  },
  // Security headers + CORS for widget embed
  async headers() {
    return [
      // Widget embed.js + embed page: CORS allow + allow iframe
      {
        source: '/widget/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" }
        ]
      },
      // API chat: allow CORS từ sol.vn + bothuocla.sol.vn
      {
        source: '/api/chat/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://sol.vn' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }
        ]
      },
      // Default: strict for all other pages
      {
        source: '/((?!widget|api/chat).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
