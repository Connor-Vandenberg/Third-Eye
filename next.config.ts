import type { NextConfig } from 'next';

/**
 * Next.js Configuration for GZM Third-Eye
 * 
 * API PROXY: All /api/* requests are proxied to GZM backend (port 8000).
 * This eliminates CORS issues entirely during development.
 * Frontend calls: fetch('/api/health') -> proxied to http://localhost:8000/health
 * 
 * Optimized for:
 * - CesiumJS (static assets, WASM workers)
 * - deck.gl (WebGPU/WebGL2)
 * - MapLibre GL (vector tile rendering)
 * - Large binary data streaming
 */

const GZM_BACKEND = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_GZM_API_URL: process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_GZM_MCP_URL: process.env.NEXT_PUBLIC_GZM_MCP_URL || 'http://localhost:8090',
    NEXT_PUBLIC_GZM_GEOINT_URL: process.env.NEXT_PUBLIC_GZM_GEOINT_URL || 'http://localhost:8083',
    NEXT_PUBLIC_GZM_ISR_URL: process.env.NEXT_PUBLIC_GZM_ISR_URL || 'http://localhost:8087',
    NEXT_PUBLIC_GZM_REPORTING_URL: process.env.NEXT_PUBLIC_GZM_REPORTING_URL || 'http://localhost:8086',
    NEXT_PUBLIC_GZM_WS_URL: process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000',
  },

  // API PROXY: Route all /api/* calls to GZM FastAPI backend
  // This means the frontend can just fetch('/api/health') without worrying about CORS
  async rewrites() {
    return [
      // Map endpoints
      { source: '/api/map/:path*', destination: `${GZM_BACKEND}/map/:path*` },
      // ISR/tasking endpoints
      { source: '/api/isr/:path*', destination: `${GZM_BACKEND}/isr/:path*` },
      // AIP intelligence tools
      { source: '/api/aip/:path*', destination: `${GZM_BACKEND}/aip/:path*` },
      // H3 convergence heatmap
      { source: '/api/h3/:path*', destination: `${GZM_BACKEND}/api/h3/:path*` },
      // Predictions + conformal
      { source: '/api/predictions/:path*', destination: `${GZM_BACKEND}/api/predictions/:path*` },
      // Contagion/spillover
      { source: '/api/contagion/:path*', destination: `${GZM_BACKEND}/api/contagion/:path*` },
      // Intervention simulator
      { source: '/api/simulate/:path*', destination: `${GZM_BACKEND}/api/simulate/:path*` },
      // Briefs
      { source: '/api/briefs', destination: `${GZM_BACKEND}/regen/briefs` },
      // Cases
      { source: '/api/cases', destination: `${GZM_BACKEND}/cases` },
      // Agents
      { source: '/api/agents/:path*', destination: `${GZM_BACKEND}/agents/:path*` },
      // Mesh
      { source: '/api/mesh/:path*', destination: `${GZM_BACKEND}/mesh/:path*` },
      // Demo endpoint
      { source: '/api/demo', destination: `${GZM_BACKEND}/demo` },
      // AOI dashboard
      { source: '/api/aoi/:path*', destination: `${GZM_BACKEND}/aoi/:path*` },
      // Health + stats
      { source: '/api/health', destination: `${GZM_BACKEND}/health` },
      { source: '/api/stats', destination: `${GZM_BACKEND}/stats` },
      { source: '/api/ready', destination: `${GZM_BACKEND}/ready` },
      // Innovation engines
      { source: '/api/innovation/:path*', destination: `${GZM_BACKEND}/api/innovation/:path*` },
      // Watchlist
      { source: '/api/watchlist/:path*', destination: `${GZM_BACKEND}/api/watchlist/:path*` },
      // Entity relationships (arcs layer)
      { source: '/api/entity-relationships', destination: `${GZM_BACKEND}/map/entity-relationships` },
      // Ingest + confirm
      { source: '/api/ingest', destination: `${GZM_BACKEND}/ingest` },
      { source: '/api/confirm', destination: `${GZM_BACKEND}/confirm` },
      // DARPA demo
      { source: '/api/darpa-demo', destination: `${GZM_BACKEND}/demo` },
      // Catch-all for any other backend routes
      { source: '/backend/:path*', destination: `${GZM_BACKEND}/:path*` },
    ];
  },

  // Webpack configuration for CesiumJS + Web Workers + WASM
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Web Workers support
      config.module.rules.push({
        test: /\.worker\.ts$/,
        use: {
          loader: 'worker-loader',
          options: { inline: 'fallback' },
        },
      });

      // WASM support (for h3-js)
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };
    }

    // Cesium static asset copying
    config.resolve.alias = {
      ...config.resolve.alias,
      cesium: 'cesium/Build/Cesium',
    };

    return config;
  },

  // Headers for WebGPU, SharedArrayBuffer, and COEP/COOP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/Cesium/:path*',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tiles.stadiamaps.com' },
      { protocol: 'https', hostname: 'basemaps.cartocdn.com' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
    ],
    unoptimized: true,
  },

  experimental: {},

  turbopack: {
    rules: {
      '*.worker.ts': ['worker-loader'],
    },
  },
};

export default nextConfig;
