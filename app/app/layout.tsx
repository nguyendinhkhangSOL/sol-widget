import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ChatWidget } from '@/components/ChatWidget';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://bothuocla.sol.vn'),
  title: {
    default: 'Đi Cùng Sol — Cai thuốc lá cho nam giới Việt 45+',
    template: '%s | Đi Cùng Sol'
  },
  description:
    'App đồng hành cai thuốc lá có cấu trúc theo Mức Lệ Thuộc Nicotin (FTND). ' +
    'Khang Sol — 30 năm hút Vinataba, 5 năm Tự do. Hứa giúp anh có năng lực tự cai.',
  keywords: [
    'cai thuốc lá', 'cai thuốc', 'bỏ thuốc lá', 'đi cùng sol',
    'FTND', 'mức lệ thuộc nicotin', 'cai thuốc cho nam', 'cai thuốc 45 tuổi'
  ],
  authors: [{ name: 'Khang Sol', url: 'https://sol.vn/khang-sol' }],
  creator: 'Khang Sol (Nguyễn Đình Khang)',
  publisher: 'Đi Cùng Sol',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://bothuocla.sol.vn',
    siteName: 'Đi Cùng Sol',
    title: 'Đi Cùng Sol — Cai thuốc lá cho nam giới Việt 45+',
    description: 'App đồng hành cai thuốc bám FTND + Cochrane. 30 năm hút Vinataba, 5 năm Tự do — Khang Sol đi cùng anh.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Đi Cùng Sol — App cai thuốc lá Việt 45+'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đi Cùng Sol — Cai thuốc lá Việt 45+',
    description: 'App đồng hành cai thuốc bám FTND. Khang Sol — 30 năm hút, 5 năm Tự do.',
    images: ['/og-default.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://bothuocla.sol.vn'
  },
  // GSC verification (đã verify)
  verification: {
    google: 'ifuIrZvF4YgGEj2B0J1TIG9wfY2VH7ZD5HgaLdORChE'
  }
};

export const viewport: Viewport = {
  themeColor: '#5C3A1E',
  width: 'device-width',
  initialScale: 1
};

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || 'G-S5ELGXBLWK';
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || 'wu12r2qt0o';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Đi Cùng Sol',
              alternateName: 'Sol — Cai thuốc lá',
              url: 'https://sol.vn',
              logo: 'https://bothuocla.sol.vn/logo.png',
              founder: {
                '@type': 'Person',
                name: 'Khang Sol',
                alternateName: 'Nguyễn Đình Khang',
                url: 'https://sol.vn/khang-sol',
                sameAs: [
                  'https://web.facebook.com/nguyendinhkhang',
                  'https://www.linkedin.com/in/vietnaminternet/'
                ]
              },
              sameAs: [
                'https://fb.com/sol.bothuocla',
                'https://fb.com/groups/dicungsol'
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'nguyendinhkhang@gmail.com',
                contactType: 'customer support',
                availableLanguage: 'Vietnamese'
              }
            })
          }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">Đến nội dung chính</a>
        {children}

        {/* Floating chat widget (boxchat in-app) */}
        <ChatWidget />

        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}');
          `}
        </Script>

        {/* Microsoft Clarity */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      </body>
    </html>
  );
}
