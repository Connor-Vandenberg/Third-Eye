/**
 * GZM Backend Configuration
 * 
 * Controls which backend the frontend talks to.
 * In development: localhost:8000
 * In production: grayzonemonitor.com API
 */

export const GZM_CONFIG = {
  /** Base URL of the GZM FastAPI backend */
  API_URL: process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000',
  
  /** WebSocket URL for real-time updates */
  WS_URL: process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000',
  
  /** Request timeout in ms */
  TIMEOUT: 120_000,
  
  /** Auto-refresh interval for signals (ms) */
  SIGNAL_REFRESH_INTERVAL: 30_000,
  
  /** Auto-refresh interval for presence (ms) */
  PRESENCE_REFRESH_INTERVAL: 10_000,
} as const;
