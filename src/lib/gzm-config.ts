/**
 * GZM Backend Configuration.
 *
 * Controls which backend the frontend talks to.
 * In development: localhost:8000 (uvicorn api.app:app)
 * In production: api.grayzonemonitor.com
 *
 * Environment variables (set in .env.local):
 *   NEXT_PUBLIC_GZM_API_URL=http://localhost:8000
 *   NEXT_PUBLIC_GZM_WS_URL=ws://localhost:8000
 *
 * Connected to:
 *   - src/lib/gzm-api.ts (AIP/provenance/writeback/collab client)
 *   - src/lib/gzm-map-client.ts (map/H3/ISR/WebSocket client)
 *   - src/hooks/use-convergence-map.ts
 *   - src/hooks/use-gzm-websocket.ts
 *
 * Backend entry: api/app.py (FastAPI, port 8000)
 */

export const GZM_CONFIG = {
  /** Base URL of the GZM FastAPI backend */
  API_URL: process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000',

  /** WebSocket URL for real-time updates */
  WS_URL: process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000',

  /** Request timeout in ms */
  TIMEOUT: 120_000,

  /** Auto-refresh interval for convergence signals (ms) */
  SIGNAL_REFRESH_INTERVAL: 30_000,

  /** Auto-refresh interval for presence/collab (ms) */
  PRESENCE_REFRESH_INTERVAL: 10_000,

  /** H3 convergence default resolution */
  H3_DEFAULT_RESOLUTION: 4,

  /** H3 convergence default lookback hours */
  H3_DEFAULT_HOURS: 24,

  /** ISR tasking endpoint prefix */
  ISR_PREFIX: '/isr',

  /** Map endpoint prefix */
  MAP_PREFIX: '/map',

  /** AIP endpoint prefix */
  AIP_PREFIX: '/aip',
} as const;

/** Legacy export for backward compat with gzm-api.ts */
export const GZM_API_URL = GZM_CONFIG.API_URL;
