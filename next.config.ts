import type { NextConfig } from 'next';

/**
 * Next.js Configuration for GZM Third-Eye
 * Optimized for:
 * - CesiumJS (static assets, WASM workers)
 * - deck.gl (WebGPU/WebGL2)
 * - MapLibre GL (vector tile rendering)
 * - Large binary data streaming
 */

const nextConfig: NextConfig = {
  output: 'standalone',

  // Enable React strict mode
  reactStrictMode: true,

  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_GZM_API_URL: process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_GZM_MCP_URL: process.env.NEXT_PUBLIC_GZM_MCP_URL || 'http://localhost:8090',
    NEXT_PUBLIC_GZM_GEOINT_URL: process.env.NEXT_PUBLIC_GZM_GEOINT_URL || 'http://localhost:8083',
    NEXT_PUBLIC_GZM_ISR_URL: process.env.NEXT_PUBLIC_GZM_ISR_URL || 'http://localhost:8087',
    NEXT_PUBLIC_GZM_REPORTING_URL: process.env.NEXT_PUBLIC_GZM_REPORTING_URL || 'http://localhost:8086',
    NEXT_PUBLIC_GZM_WS_URL: process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:9090/ws',
  },

  // Webpack configuration for CesiumJS + Web Workers + WASM
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // CesiumJS: Copy static assets (workers, images, etc.)
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
          // Required for SharedArrayBuffer (Web Workers with transfer)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          // Security headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // CesiumJS static assets (allow cross-origin for ion tiles)
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
    unoptimized: true, // Static export compatibility
  },

  // Experimental features
  experimental: {
    // Turbopack for faster dev builds
    turbo: {
      rules: {
        '*.worker.ts': ['worker-loader'],
      },
    },
  },
};

export default nextConfig;
