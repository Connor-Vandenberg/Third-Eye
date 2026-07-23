import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

const SITE_URL = "https://grayzonemonitor.com";
const SITE_NAME = "Gray Zone Monitor";
const SITE_TITLE = "Gray Zone Monitor — AI-Powered Geopolitical Intelligence Platform";
const SITE_DESCRIPTION = "Real-time gray zone threat monitoring platform. Temporal knowledge graph with 78 vertex types, 55 edge types, 137 collectors, convergence scoring, and zero-shot prediction. Detects hybrid warfare, sanctions evasion, and covert military operations 3-14 days before conventional analysis.";

export const viewport: Viewport = {
  themeColor: "#D4AF37",
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
    // Core domain
    "gray zone", "grey zone", "hybrid warfare", "irregular warfare",
    "geopolitical intelligence", "geopolitical risk", "conflict prediction",
    "OSINT", "open source intelligence", "threat intelligence",
    "situational awareness", "convergence analysis",
    
    // Technical capabilities
    "knowledge graph", "temporal graph", "TigerGraph",
    "machine learning", "zero-shot prediction", "TabFM",
    "AIS tracking", "maritime intelligence", "dark fleet detection",
    "sanctions evasion", "entity resolution", "network analysis",
    
    // Data domains
    "conflict monitoring", "ACLED", "arms transfers",
    "cyber threat intelligence", "supply chain risk",
    "maritime chokepoints", "country instability index",
    "cascade modeling", "scenario analysis",
    
    // Competitors/positioning
    "palantir alternative", "recorded future alternative",
    "open source intelligence platform", "defense intelligence",
    
    // Brand
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
    title: "Gray Zone Monitor — AI-Powered Geopolitical Intelligence Platform",
    description: "Temporal knowledge graph platform detecting hybrid warfare and gray zone escalation 3-14 days before conventional analysis. 137 collectors, 94 engines, 10 graph algorithms.",
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Gray Zone Monitor — Geopolitical Intelligence Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gray Zone Monitor — Predicts Geopolitical Escalation Before It Happens",
    description: "Temporal knowledge graph + 137 OSINT collectors + zero-shot prediction. Detects gray zone threats 3-14 days early.",
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
  browserRequirements: "Requires a modern web browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Country Instability Index (CII) for 195 countries with z-score normalization",
    "Multi-domain convergence detection (maritime + cyber + financial + diplomatic + military)",
    "Temporal knowledge graph (78 vertex types, 55 edge types, Weibull decay)",
    "Zero-shot prediction via TabICL foundation model",
    "137 automated OSINT collectors across 30+ domains",
    "SIR epidemic cascade modeling with Monte Carlo simulation",
    "Maritime chokepoint risk assessment with live AIS integration",
    "Dark web intelligence via VoidAccess + STIX 2.1",
    "3-tier alerting (FLASH/PRIORITY/ROUTINE) with semantic deduplication",
    "LLM-powered intelligence briefings (Claude, GPT, Ollama)",
    "10 installed TigerGraph algorithms (PageRank, Betweenness, Louvain, etc.)",
    "MCP server with 41 tools (stdio + Streamable HTTP)",
    "Interactive 3D globe with MapLibre GL (60fps WebGL)",
    "Entity relationship graph visualization",
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
        <ErrorBoundary name="Gray Zone Monitor">
          {children}
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
