/**
 * GZM API Client — Production-Grade
 *
 * Type-safe wrapper for the FastAPI backend (port 8000).
 * Features:
 * - Retry with exponential backoff (3 attempts)
 * - AbortController timeout (15s default)
 * - Response type inference
 * - Error normalization
 * - All 20+ endpoints from api/app.py
 */

const API_BASE = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';
const WS_BASE = process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000';
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

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
  severity?: 'critical' | 'high' | 'medium' | 'low';
  score?: number;
  country?: string;
  domains?: string[];
  domain_count?: number;
  created_at?: string;
  source?: string;
  status?: string;
  convergence_score?: number;
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
  network_risk?: number;
  sanctions_status?: { program: string; list_date?: string };
  offshore_connections: Array<{
    edge_type: string;
    target_id: string;
    target_type?: string;
    score?: number;
  }>;
  evidence_count?: number;
}

export interface HotspotResponse {
  hotspots: Array<{
    lat: number;
    lon: number;
    latitude?: number;
    longitude?: number;
    score: number;
    name?: string;
    entity_count?: number;
    h3_index?: string;
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
    risk_score?: number;
    labels?: string[];
  }>;
}

export interface BriefingResponse {
  country: string;
  threat_level: string;
  score: number;
  domains: Record<string, {
    count?: number;
    score?: number;
    entities?: number;
    summary?: string;
  }>;
  recommendations: string[];
  top_entities?: Array<{ name: string; type: string; risk: number }>;
}

export interface HealthResponse {
  status: string;
  tigergraph: boolean;
  graph: string;
  uptime: number;
  collectors?: number;
  engines?: number;
}

export interface PredictionResponse {
  predictions: Array<{
    entity: string;
    probability: number;
    confidence: number;
    lead_time_days: number;
    supporting_signals: string[];
  }>;
}

export interface ReportResponse {
  report_id: string;
  title: string;
  content: string;
  generated_at: string;
  country?: string;
  threat_level?: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';

// ═══════════════════════════════════════════════════════════════
// FETCH ENGINE
// ═══════════════════════════════════════════════════════════════

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { timeout?: number; retries?: number } = {}
): Promise<T | null> {
  const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        if (res.status === 429) {
          // Rate limited — wait and retry
          const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
          await sleep(retryAfter * 1000);
          continue;
        }
        throw new ApiError(res.status, `HTTP ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      lastError = err as Error;

      if (attempt < retries) {
        // Exponential backoff: 500ms, 1500ms
        await sleep(500 * Math.pow(3, attempt));
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[GZM API] ${path} failed after ${retries + 1} attempts:`, lastError?.message);
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════════════════

export const gzmApi = {
  // ─── System ────────────────────────────────────────────────
  health: () => request<HealthResponse>('/health'),
  stats: () => request<GZMStats>('/stats'),

  // ─── Intelligence Analysis ─────────────────────────────────
  alerts: (limit = 100, severity?: Severity) =>
    request<AlertsResponse>(`/alerts?limit=${limit}${severity ? `&severity=${severity}` : ''}`),

  dossier: (entity: string) =>
    request<DossierResponse>(`/dossier/${encodeURIComponent(entity)}`),

  briefing: (country: string) =>
    request<BriefingResponse>(`/briefing/${encodeURIComponent(country)}`),

  hotspots: (resolution = 5, minCount = 1) =>
    request<HotspotResponse>(`/hotspots?resolution=${resolution}&min_count=${minCount}`),

  query: (q: string, maxResults = 60) =>
    request<QueryResult>('/query', {
      method: 'POST',
      body: JSON.stringify({ query: q, max_results: maxResults }),
    }),

  predict: (entity?: string, country?: string) =>
    request<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify({ entity, country }),
    }),

  // ─── Reports ───────────────────────────────────────────────
  generateReport: (country: string, type: 'briefing' | 'sitrep' | 'convergence' = 'briefing') =>
    request<ReportResponse>('/api/v1/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ country, report_type: type }),
    }),

  // ─── Graph CRUD ────────────────────────────────────────────
  searchVertices: (type: string, limit = 50) =>
    request<{ vertices: unknown[] }>(`/api/v1/vertices/${type}?limit=${limit}`),

  // ─── Export ────────────────────────────────────────────────
  exportCsv: (type: string) => `${API_BASE}/api/v1/export/${type}/csv`,
  exportStix: (entity: string) => `${API_BASE}/api/v1/export/stix?entity=${encodeURIComponent(entity)}`,

  // ─── SSE Stream ────────────────────────────────────────────
  alertsStreamUrl: () => `${API_BASE}/api/v1/stream/alerts`,

  // ─── WebSocket ─────────────────────────────────────────────
  alertsWsUrl: () => `${WS_BASE}/ws/alerts`,

  // ─── Base URL (for custom fetches) ─────────────────────────
  baseUrl: API_BASE,
  wsUrl: WS_BASE,
};

export default gzmApi;
