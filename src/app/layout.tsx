/**
 * GZM Root Layout — Accessibility-First Architecture.
 *
 * WCAG Requirements satisfied here:
 * - SC 3.1.1: lang="en" on <html>
 * - SC 2.4.1: Skip navigation (SkipNavigation component)
 * - SC 4.1.3: Live regions (LiveRegionProvider)
 * - SC 2.4.2: Unique page titles (Metadata API)
 * - SC 2.4.3: Focus management on route change (RouteAnnouncer)
 *
 * Also provides:
 * - Cookie consent (GDPR/CCPA/GPC)
 * - Viewport meta for mobile
 * - Global accessibility styles
 * - Reduced motion respect
 */

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SkipNavigation } from '@/components/accessibility/SkipNavigation';
import { LiveRegionProvider } from '@/components/accessibility/LiveRegion';
import { RouteAnnouncer } from '@/components/accessibility/RouteAnnouncer';
import { CookieConsent } from '@/components/consent/CookieConsent';
import '@/styles/accessibility.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Gray Zone Monitor | OSINT Intelligence Platform',
    template: '%s | Gray Zone Monitor',
  },
  description:
    'Open-source intelligence platform for geopolitical threat analysis, entity relationship mapping, and predictive escalation detection.',
  metadataBase: new URL('https://grayzonemonitor.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Gray Zone Monitor',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Do NOT set maximum-scale=1 — violates SC 1.4.4 (users must be able to zoom)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* Skip navigation — first focusable element (SC 2.4.1) */}
        <SkipNavigation />

        {/* Live region provider for screen reader announcements (SC 4.1.3) */}
        <LiveRegionProvider>
          {/* Route change focus management */}
          <RouteAnnouncer />

          {/* Application content */}
          {children}
        </LiveRegionProvider>

        {/* Cookie consent — renders at bottom, focus-trapped when visible */}
        <CookieConsent />
      </body>
    </html>
  );
}
