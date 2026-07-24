/**
 * GZM API Client
 * 
 * Type-safe wrapper for the FastAPI backend running on port 8000.
 * All endpoints match api/app.py routes.
 */

const API_BASE = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';
const WS_BASE = process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GZMStats {
  node_count: number;
  relationship_count: number;
  uptime_seconds: number;
  graph: string;
  vertices?: number;
}

export interface GZMAlert {
  vertex_id?: string;
  name?: string;
  entity_name?: string;
  vertex_type?: string;
  severity?: string;
  score?: number;
  country?: string;
  domains?: string[];
  created_at?: string;
  source?: string;
  status?: string;
}

export interface AlertsResponse {
  alerts: GZMAlert[];
  active_alerts: number;
  critical?: number;
  high?: number;
}

export interface DossierResponse {
  entity_name: string;
  labels: string[];
  risk_score: number;
  connections: number;
  sources: string[];
  confidence_grade: string;
  domains_present: string[];
  sanctions_status?: { program: string };
  offshore_connections: Array<{
    edge_type: string;
    target_id: string;
    target_type?: string;
  }>;
}

export interface HotspotResponse {
  hotspots: Array<{
    lat: number;
    lon: number;
    score: number;
    name?: string;
    entity_count?: number;
  }>;
}

export interface QueryResult {
  results: Array<{
    vertex_id?: string;
    name?: string;
    vertex_type?: string;
    country?: string;
    connections?: number;
    source_id?: string;
    target_id?: string;
    edge_type?: string;
  }>;
}

export interface BriefingResponse {
  country: string;
  threat_level: string;
  score: number;
  domains: Record<string, unknown>;
  recommendations: string[];
}

export interface HealthResponse {
  status: string;
  tigergraph: boolean;
  graph: string;
  uptime: number;
}

// ─── Fetch Helpers ───────────────────────────────────────────────────────────

async function get<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const gzmApi = {
  // System
  health: () => get<HealthResponse>('/health'),
  stats: () => get<GZMStats>('/stats'),

  // Analysis
  alerts: (limit = 50) => get<AlertsResponse>(`/alerts?limit=${limit}`),
  dossier: (entity: string) => get<DossierResponse>(`/dossier/${encodeURIComponent(entity)}`),
  briefing: (country: string) => get<BriefingResponse>(`/briefing/${encodeURIComponent(country)}`),
  hotspots: (resolution = 5, minCount = 1) =>
    get<HotspotResponse>(`/hotspots?resolution=${resolution}&min_count=${minCount}`),
  query: (q: string, maxResults = 60) =>
    post<QueryResult>('/query', { query: q, max_results: maxResults }),
  predict: (entity: string) =>
    post<unknown>('/predict', { entity }),

  // WebSocket
  alertsWsUrl: () => `${WS_BASE}/ws/alerts`,
};

export default gzmApi;
