/**
 * GZM Backend Configuration
 * 
 * The Python backend runs on :8000 and provides:
 * - /aip/* (70+ tools, multi-step reasoning)
 * - /collab/* (WebSocket collaboration)
 * - /provenance/* (data lineage)
 * - /actions/* (writeback/real-world actions)
 */

export const GZM_BACKEND_URL = process.env.NEXT_PUBLIC_GZM_BACKEND_URL || 'http://localhost:8000';
export const GZM_WS_URL = process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000';
