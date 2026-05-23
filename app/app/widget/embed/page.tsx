import type { Metadata, Viewport } from 'next';
import { ChatWidgetEmbed } from './ChatWidgetEmbed';
import '../../globals.css';

export const metadata: Metadata = {
  title: 'Sol Chat',
  description: 'Sol Đồng hành — Chat cai thuốc lá',
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  themeColor: '#5C3A1E',
  width: 'device-width',
  initialScale: 1
};

// Standalone page cho iframe embed — không có Header/Footer
export default function EmbedPage() {
  return (
    <div className="h-screen flex flex-col bg-white">
      <ChatWidgetEmbed />
    </div>
  );
}
