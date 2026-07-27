import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Third Eye | Gray Zone Monitor',
  description: 'Temporal Knowledge Graph Intelligence Platform - Novel Signal Detection, Autonomous Tasking, Multi-INT Fusion',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/icons/gzm-192.png' },
    { rel: 'apple-touch-icon', url: '/icons/gzm-192.png' },
  ],
};

export const viewport: Viewport = {
  themeColor: '#06b6d4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
