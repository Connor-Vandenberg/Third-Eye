import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/providers';

const SITE_URL = "https://grayzonemonitor.com";
const SITE_NAME = "Gray Zone Monitor";
const SITE_TITLE = "Gray Zone Monitor \u2014 Multi-Domain Intelligence Fusion Platform";
const SITE_DESCRIPTION = "UCI-compliant multi-domain intelligence fusion and autonomous collection management system. Temporal knowledge graph with 212 vertex types, 146+ collectors, 1,340+ convergence signals, and autonomous ISR tasking across drones, satellites, ground robots, and maritime platforms.";

export const viewport: Viewport = {
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Gray Zone Monitor",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "gray zone", "grey zone", "hybrid warfare", "irregular warfare",
    "geopolitical intelligence", "geopolitical risk", "conflict prediction",
    "OSINT", "open source intelligence", "threat intelligence",
    "situational awareness", "convergence analysis",
    "knowledge graph", "temporal graph", "TigerGraph",
    "machine learning", "zero-shot prediction", "TabICL",
    "AIS tracking", "maritime intelligence", "dark fleet detection",
    "sanctions evasion", "entity resolution", "network analysis",
    "drone swarm", "ISR tasking", "autonomous collection",
    "UCI", "JADC2", "sensor fusion", "multi-domain",
    "DARPA", "SBIR", "defense intelligence",
    "palantir alternative", "anduril lattice",
    "gray zone monitor", "GZM", "grayzonemonitor",
  ],
  authors: [{ name: "Connor Vandenberg", url: SITE_URL }],
  creator: "Connor Vandenberg",
  publisher: "Gray Zone Monitor",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Gray Zone Monitor \u2014 Multi-Domain Intelligence Fusion Platform",
    description: "UCI-compliant intelligence fusion platform. 146+ collectors, 212 vertex types, autonomous ISR tasking, multi-platform integration across drones, satellites, ground robots, and maritime assets.",
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Gray Zone Monitor \u2014 Multi-Domain Intelligence Fusion Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gray Zone Monitor \u2014 Predicts Geopolitical Escalation Before It Happens",
    description: "Temporal knowledge graph + 146+ OSINT collectors + autonomous ISR tasking + zero-shot prediction. Multi-domain intelligence fusion for defense.",
    images: [`${SITE_URL}/og-image.png`],
  },
  category: "technology",
  classification: "Intelligence & Security",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "GZM",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#06060C",
    "msapplication-config": "none",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Gray Zone Monitor",
  alternateName: ["GZM", "Gray Zone Monitor", "Grey Zone Monitor"],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires a modern web browser with WebGL support",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "UCI v2.5 compliant multi-domain intelligence fusion",
    "Autonomous ISR tasking via CBBA swarm coordination",
    "146+ OSINT collectors across 30+ domains",
    "212 vertex types, 419 edge types in temporal knowledge graph",
    "1,340+ convergence signals with Weibull temporal decay",
    "Multi-platform integration: drones (MAVLink), satellites (Planet/ICEYE), UGVs (ROS2), USVs",
    "Zero-shot prediction via TabICL foundation model",
    "Through-wall radar and WiFi CSI biometric sensing",
    "Zarf air-gap deployment (IL5-ready, DoD Zero Trust)",
    "10 installed TigerGraph algorithms (PageRank, Louvain, Betweenness, Decay, Convergence)",
    "Dempster-Shafer evidence fusion across 7 INT disciplines",
    "Real-time WebSocket intelligence feed with priority alerting",
    "MapLibre GL 3D globe with entity markers, convergence zones, platform tracking",
    "STIX 2.1 / TAXII 2.1 export and interoperability",
  ],
  screenshot: `${SITE_URL}/og-image.png`,
  author: {
    "@type": "Person",
    name: "Connor Vandenberg",
    url: SITE_URL,
  },
};

import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="canonical" href={SITE_URL} />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <ErrorBoundary name="Gray Zone Monitor">
            {children}
          </ErrorBoundary>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
